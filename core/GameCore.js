class GameCore{
  constructor({seed=1,blockerLayout=null,moves=null,targetScore=null,energyTracker=null}){
    this.rng=makeRng(seed);
    this.board=new Board(this.rng);
    this.board.fillInitial();
    this.lastMovePos=null;
    this.energyTracker=energyTracker; // [YENİ] Bölüm 10j — isteğe bağlı, EnergyTracker benzeri {energy, add(n)}
    this.gifts=new Map(); this.elements=new Map(); this.blockers=new Map(); this.hourglasses=new Map();
    if(blockerLayout){
      blockerLayout.applyTo(this.blockers);
      for(const key of this.blockers.keys()){const [r,c]=key.split(",").map(Number); this.board.cells[r][c]=null;}
    }
    this.score=0; this.extraMoves=0;
    this.movesLimit=moves; this.targetScore=targetScore; this.movesUsed=0;
    this.status="in_progress"; this.adContinueUsed=false;
    // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10h] Garanti
    // hediye sistemi takibi.
    this.giftsProducedCount=0;
    // [Oturum 19 — F9Bot büyük ölçekli test] Kademe bazlı üretim takibi
    // (bakır/bronz/gümüş/altın/elmas + Matrix Eşleşme tetiklenme sayısı).
    this.giftTierCounts={bakir:0,bronz:0,gumus:0,altin:0,elmas:0};
    this.matrixMatchCount=0;
    this._guaranteedGiftTriggered=false;
    this._history=[]; // geri al (undo) için anlık görüntü yığını
  }
  get movesLeft(){if(this.movesLimit===null) return null; return Math.max(0,this.movesLimit+this.extraMoves-this.movesUsed);}
  _updateStatus(){
    if(this.status!=="in_progress") return;
    // targetScore kaldırıldı — sadece hamle bitince oyun biter
    if(this.movesLimit!==null&&this.movesLeft<=0){this.status="lost";}
  }
  static validOps(a,b){
    const results=[];
    const droot=(n)=>{if(n<=0) return null; while(n>9) n=String(n).split("").reduce((s,d)=>s+Number(d),0); return n;};
    const s=droot(a+b); if(s!==null) results.push({op:"+",value:s});
    if(a>b){const d=droot(a-b); if(d!==null&&d>0) results.push({op:"-",value:d});}
    const m=droot(a*b); if(m!==null) results.push({op:"*",value:m});
    if(b!==0&&a%b===0){const q=droot(a/b); if(q!==null&&q>0) results.push({op:"/",value:q});}
    return results;
  }
  /** Geri al için anlık görüntü al (her oyuncu hamlesinden ÖNCE çağrılır) */
  _pushSnapshot(){
    const snap={
      cells: this.board.cells.map(row=>row.slice()),
      score: this.score,
      extraMoves: this.extraMoves,
      movesUsed: this.movesUsed,
      status: this.status,
      gifts: new Map(this.gifts),
      elements: new Map(this.elements),
      blockers: new Map([...this.blockers].map(([k,v])=>[k,{...v}])),
      hourglasses: new Map([...this.hourglasses].map(([k,v])=>[k,{...v}])),
      giftsProducedCount: this.giftsProducedCount,
      lastMovePos: this.lastMovePos,
    };
    this._history.push(snap);
    if(this._history.length>20) this._history.shift(); // max 20 hamle geri al
  }
  /** Son anlık görüntüye dön. true=başarılı, false=geçmiş boş */
  undo(){
    if(this._history.length===0) return false;
    const snap=this._history.pop();
    this.board.cells=snap.cells.map(row=>row.slice());
    this.score=snap.score;
    this.extraMoves=snap.extraMoves;
    this.movesUsed=snap.movesUsed;
    this.status=snap.status;
    this.gifts=new Map(snap.gifts);
    this.elements=new Map(snap.elements);
    this.blockers=new Map([...snap.blockers].map(([k,v])=>[k,{...v}]));
    this.hourglasses=new Map([...snap.hourglasses].map(([k,v])=>[k,{...v}]));
    this.giftsProducedCount=snap.giftsProducedCount;
    this.lastMovePos=snap.lastMovePos;
    return true;
  }
  getMoveOptions(r1,c1,r2,c2){
    if(this.blockers.has(cellKey(r1,c1))||this.blockers.has(cellKey(r2,c2))) return {kind:"blocked"};
    const gift1=this.gifts.get(cellKey(r1,c1)), gift2=this.gifts.get(cellKey(r2,c2));
    const elem1=this.elements.get(cellKey(r1,c1)), elem2=this.elements.get(cellKey(r2,c2));
    const val1=this.board.getCell(r1,c1), val2=this.board.getCell(r2,c2);
    // ── KUM SAATİ EŞLEŞMELERİ ──
    // Kum saati SADECE 9 ile eşleşince patlar. 9 olmayan sayılarla
    // eşleşme geçersizdir — oyuncu kum saatini başka bir hamleye
    // boşa harcayamaz, sadece 9 getirip patlatabilir.
    const hg1=this.hourglasses?.has(cellKey(r1,c1)), hg2=this.hourglasses?.has(cellKey(r2,c2));
    if (hg1 || hg2) {
      const otherVal = hg1 ? val2 : val1;
      if (otherVal === 9) {
        return { kind: "hourglass_nine" }; // patlama (8x8 tüm tahta)
      }
      return { kind: "invalid" }; // 9 değilse eşleşme yok
    }
    // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10k]
    // MEKANİZMA 6: iki Yıldırım elementi birleşmesi.
    if(elem1&&elem1.elementType===ELEM_LIGHTNING&&elem2&&elem2.elementType===ELEM_LIGHTNING){
      return {kind:"lightning_lightning"};
    }
    if(gift1&&gift2) return {kind:"combo"};
    // MEKANİZMA 5: element + 9 -> board-geneli tür-bazlı kırma. Enerji
    // artık element olmadığı için (sayısal kaynak oldu) bu kontrol
    // gereksizleşti — board'da hiçbir zaman bir Enerji elementi olamaz.
    if((elem1&&val2===9)||(elem2&&val1===9)){
      return {kind:"element_nine_break"};
    }
    if(elem1||elem2) return {kind:"invalid"};
    // Null hücre: hediye/element/kum saati olmayan boş kare → geçersiz
    if((val1===null&&!gift1&&!elem1&&!this.hourglasses?.has(cellKey(r1,c1)))||
       (val2===null&&!gift2&&!elem2&&!this.hourglasses?.has(cellKey(r2,c2))))
      return {kind:"invalid"};
    if((gift1&&val2===9)||(gift2&&val1===9)) return {kind:"promotion"};
    if(gift1||gift2) return {kind:"invalid"};
    if(val1===null||val2===null) return {kind:"invalid"};
    return {kind:"normal",ops:GameCore.validOps(val1,val2)};
  }
  // [Oturum 29 — ARTIK KULLANILMIYOR] Eskiden Mekanizma 3b'nin (Bakır+
  // farklı-tür, tam satır+sütun süpürme) blast üretiminde kullanılıyordu
  // — o mekanizma kaldırıldı (bkz. engine/evolutionEngine.js). Metod
  // hiçbir yerden çağrılmıyor, sadece referans için tutuluyor.
  blastCells(centerR,centerC,n){
    const size=this.board.size;
    const cells=new Set();
    for(let dr=0;dr<n;dr++){
      const row=centerR+dr;
      if(row>=0&&row<size) for(let c=0;c<size;c++) cells.add(cellKey(row,c));
    }
    for(let dc=0;dc<n;dc++){
      const col=centerC+dc;
      if(col>=0&&col<size) for(let r=0;r<size;r++) cells.add(cellKey(r,col));
    }
    return [...cells].map(k=>k.split(",").map(Number));
  }
  // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10i] ALAN
  // PATLAMASI: NxM dikdörtgen, merkez = oyuncunun 2. tıkladığı hücre,
  // TÜM YÖNLERE eşit dağılır (tek sayılarda simetrik, çift sayılarda
  // fazlalık sağa/aşağı).
  // [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10j]
  // area_size (8,8) ("TÜM TAHTA", Altın+Elmas) ise merkez NEREDE
  // OLURSA OLSUN board'un TAMAMI (64 hücre) patlatılır (kullanıcı kararı).
  areaBlastCells(centerR,centerC,areaSize,isNineBlast=false,giftType=null){
    const size=this.board.size;
    // [DÜZELTME — Oturum 14] giftType===false artık özel bir sinyal:
    // "otomatik boyut-eşleştirmeyi DENEME, doğrudan haç şekli kullan"
    // (karışık-tür kombinasyonlar için — aksi halde örn. bronz+gümüş'ün
    // [3,3] boyutu YANLIŞLIKLA bakır'ın [3,3] tablosuna eşleşiyordu).
    const resolvedGiftType = giftType===false ? null : (giftType || Object.keys(AREA_BLAST_SIZES).find(k=>
      AREA_BLAST_SIZES[k][0]===areaSize[0]&&AREA_BLAST_SIZES[k][1]===areaSize[1]
    ));
    const _tbl=isNineBlast?(AREA_BLAST_OFFSETS.nine||{}):(AREA_BLAST_OFFSETS.normal||{});
    const offsets=resolvedGiftType?(_tbl[resolvedGiftType]??null):null;
    // (güvenli erişim: nine/normal yoksa {} fallback)
    if(offsets !== null && offsets !== undefined){
      const cells=[[centerR,centerC]];
      for(const [dr,dc] of offsets){
        const r=centerR+dr,c=centerC+dc;
        if(r>=0&&r<size&&c>=0&&c<size) cells.push([r,c]);
      }
      return cells;
    }
    // [DÜZELTME — Oturum 14, kullanıcı netleştirmesi] Eskiden buraya
    // "dikdörtgen" (nRows×nCols TÜM hücreler) düşüyordu — örn. [3,4]
    // için 12 hücrelik dolu blok. Kullanıcı netleştirdi: "3 hücre yatay
    // 4 hücre dikey" sadece MERKEZDEN geçen haç demek (yatayda 3, dikeyde
    // 4 hücre — 3x4=12 hücre DEĞİL). Karışık-tür kombinasyonlar (bronz+
    // altın gibi, tek bir gift'e ait olmayan) bu yüzden artık haç şekli
    // kullanıyor — terfi (promotion) patlamaları zaten kendi özel
    // AREA_BLAST_OFFSETS şablonlarını kullandığı için ETKİLENMEDİ.
    const [nRows,nCols]=areaSize;
    if(nRows>=size&&nCols>=size){const all=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++)all.push([r,c]);return all;}
    const half=e=>{const b=Math.floor((e-1)/2);return[b,e-1-b];};
    const[rb,ra]=half(nRows),[cb,ca]=half(nCols);
    const cells=[[centerR,centerC]];
    // Yatay kol (nCols hücre, merkez dahil — dc=0 hariç tekrar eklenmesin diye atlanıyor)
    for(let dc=-cb;dc<=ca;dc++){ if(dc===0) continue; const c=centerC+dc; if(c>=0&&c<size) cells.push([centerR,c]); }
    // Dikey kol (nRows hücre, merkez dahil)
    for(let dr=-rb;dr<=ra;dr++){ if(dr===0) continue; const r=centerR+dr; if(r>=0&&r<size) cells.push([r,centerC]); }
    return cells;
  }
  applyBlast(cells){
    let points=0;
    const brokenBlockers=[];    // tamamen kırılan engeller
    const hitBlockers=[];       // katman azalan engeller (görsel güncelleme için)
    for(const [r,c] of cells){
      const k=cellKey(r,c);
      if(this.blockers.has(k)){
        const tile=this.blockers.get(k);
        const bType=tile?.blockerType||tile;
        const nextLayer=BLOCKER_NEXT_LAYER[bType];
        if(nextLayer){
          // Katmanlı engel: bir katman indir
          if(tile && typeof tile==='object'){
            tile.blockerType=nextLayer;
          } else {
            this.blockers.set(k,{blockerType:nextLayer});
          }
          points+=Math.floor(BLAST_BLOCKER_POINTS/2); // yarı puan (tam kırılmadı)
          hitBlockers.push([r,c,nextLayer]);
          // Çatlak animasyonu — katman azaldı görsel sinyal
          requestAnimationFrame(() => {
            const _crEl = document.querySelector('[data-r="'+r+'"][data-c="'+c+'"]');
            if (_crEl) {
              _crEl.classList.remove('f9-blocker-crack');
              void _crEl.offsetWidth;
              _crEl.classList.add('f9-blocker-crack');
              _crEl.addEventListener('animationend',
                () => _crEl.classList.remove('f9-blocker-crack'), { once: true });
            }
          });
        } else {
          // Son katman — tamamen kır
          this.blockers.delete(k);
          brokenBlockers.push([r,c]);
          points+=BLAST_BLOCKER_POINTS;
          // Kırılan engel yerine yeni değer
          this.board.cells[r][c]=this.board.pickValueAvoidingNeighbors
            ? this.board.pickValueAvoidingNeighbors(r,c)
            : (Math.ceil((typeof this.rng==='function'?this.rng():Math.random())*8));
        }
        continue;
      }
      if(this.board.cells[r][c]!==null){
        points+=BLAST_CELL_POINTS;
        this.board.cells[r][c]=null;
      }
      this.gifts.delete(k);
      this.elements.delete(k);
    }
    return {points, brokenBlockers, hitBlockers};
  }
  applyPlayerMove(r1,c1,r2,c2,resultValue=null){
    F9Debug.log("move", `applyPlayerMove (${r1},${c1})→(${r2},${c2}) val=${resultValue}`, {score:this.score, movesUsed:this.movesUsed, movesLimit:this.movesLimit, extraMoves:this.extraMoves, movesLeft:this.movesLeft});
    if(this.status!=="in_progress") throw new Error("level bitti");
    const k1=cellKey(r1,c1), k2=cellKey(r2,c2);
    const gift1=this.gifts.get(k1), gift2=this.gifts.get(k2);
    const elem1=this.elements.get(k1), elem2=this.elements.get(k2);
    const val1=this.board.getCell(r1,c1), val2=this.board.getCell(r2,c2);
    const outcome={kind:null,points:0,extraMoves:0,gift:null,element:null,blastCells:[],areaCells:[],brokenBlockers:[],chain:[],brokenBlockerTypes:[]};

    if(elem1&&elem1.elementType===ELEM_LIGHTNING&&elem2&&elem2.elementType===ELEM_LIGHTNING){
      // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10k]
      // MEKANİZMA 6: İki Yıldırım elementi birleşmesi -> +12 Enerji.
      // İkisi de TÜKENİR, hücre/alan patlaması YOK.
      const result=mechanism6LightningLightning(BASE_POINTS.a);
      this.elements.delete(k1); this.elements.delete(k2);
      this.score+=result.points; outcome.points=result.points;
      outcome.kind="lightning_lightning";
      if(this.energyTracker && result.energy){
        this.energyTracker.add(result.energy);
        outcome.energy=result.energy;
      }
      this.board.cells[r1][c1]=null; this.board.cells[r2][c2]=null;
      this._refillInPlace();
      this.lastMovePos=null;
    } else if(gift1&&gift2){
      const result=mechanism3GiftCombo(gift1.giftType,gift2.giftType,BASE_POINTS.a);
      this.gifts.delete(k1); this.gifts.delete(k2);
      this.score+=result.points; outcome.points=result.points;
      outcome.kind="combo"; outcome.element=result.element;

      if(result.element){
        this.board.cells[r2][c2]=null; this.elements.set(k2,{elementType:result.element}); this.board.cells[r1][c1]=null;
        // [BUG DÜZELTMESİ — bu konuşmada bulundu, bkz. TASARIM.md Bölüm
        // 10e] (r1,c1) null yapılıyor ama element SADECE (r2,c2)'ye
        // yerleşiyor — gravity kaldırıldığı için (r1,c1) açıkça
        // doldurulmazsa kalıcı boşluk kalır.
        // [YENİ — Oturum 7] Aynı-tür kombinasyon artık element üretmenin
        // YANINDA satır+sütun boyunca haç şeklinde patlama da yapıyor
        // (bkz. TASARIM.md — kullanıcı onaylı ek mekanik).
        if(result.crossBlastOffsets && result.crossBlastOffsets.length){
          const crossCells=result.crossBlastOffsets
            .map(([dr,dc])=>[r2+dr,c2+dc])
            .filter(([r,c])=>r>=0&&r<GRID&&c>=0&&c<GRID);
          if(crossCells.length){
            const {points:crossPoints,brokenBlockers:crossBroken}=this.applyBlast(crossCells);
            this.score+=crossPoints; outcome.points+=crossPoints;
            outcome.blastCells=crossCells; outcome.brokenBlockers=crossBroken;
          }
        }
        this._refillInPlace();
        this.lastMovePos=null;
      } else {
        // [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm
        // 10k] MEKANİZMA 3c: Bakırsız farklı-tür kombinasyonu -> hamle
        // bonusu/enerji + ALAN PATLAMASI + GARANTİ COMBO puanı.
        this.extraMoves+=result.extraMoves||0;
        outcome.extraMoves=result.extraMoves||0;
        this.board.cells[r1][c1]=null; this.board.cells[r2][c2]=null;

        // [YENİ] Gümüş+Elmas/Altın+Elmas artık enerji de veriyor.
        if(this.energyTracker && result.energy){
          this.energyTracker.add(result.energy);
          outcome.energy=result.energy;
        }

        if(result.areaSize){
          const boostedAreaSize=this._maybeApplyAreaBoost(result.areaSize);
          // [DÜZELTME — Oturum 14] Eskiden buraya _gt1 (iki hediyeden
          // BİRİNİN türü) geçiliyordu — bu da kombinasyonun KENDİ haç
          // şekli yerine, rastgele hangi hediye r1/r2'deyse ONUN kendi
          // terfi şeklini ödünç almasına yol açıyordu (örn. bronz+gümüş,
          // bronz+altın, bronz+elmas hepsi "bronz"un şeklini kullanıyordu).
          // Artık HER ZAMAN null geçiyoruz — areaBlastCells bu durumda
          // areaSize=[rows,cols]'u doğrudan "yatayda cols, dikeyde rows
          // hücrelik haç" olarak yorumluyor (kullanıcı netleştirmesi).
          const areaCells=this.areaBlastCells(r2,c2,boostedAreaSize,false,false);
          const {points:areaPoints,brokenBlockers:areaBroken}=this.applyBlast(areaCells);
          const comboPoints=result.comboPoints||0;
          this.score+=areaPoints+comboPoints; outcome.points+=areaPoints+comboPoints;
          outcome.areaCells=areaCells; outcome.brokenBlockers=areaBroken;
          outcome.comboPoints=comboPoints; outcome.comboCount=result.comboCount||0;
        }
        this._refillInPlace();
        this.lastMovePos=null;
      }
    } else if((elem1&&val2===9)||(elem2&&val1===9)){
      // MEKANİZMA 5: element + "9" -> board-genelinde TÜR-bazlı
      // blocker kırma. Mekanizma 4'ten tamamen bağımsız, paralel çalışan
      // ikinci bir kırma yolu — komşuluk şartı YOK.
      const elem=elem1||elem2;
      const elemPos=elem1?[r1,c1]:[r2,c2];
      const result=mechanism5ElementNineBreak(elem.elementType,BASE_POINTS.a);
      if(!result.blockerTypesToBreak){
        // [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm
        // 10j] Enerji artık element olmadığı için board'da hiç
        // bulunmuyor — bu dal artık pratikte hiç tetiklenmiyor, sadece
        // güvenlik amaçlı kalıyor.
        throw new Error("Geçersiz hamle: bu element '9' ile board-geneli kırma mekanizmasına dahil değil.");
      }
      this.elements.delete(cellKey(...elemPos));
      this.score+=result.points; outcome.points=result.points;
      outcome.kind="element_nine_break";

      const brokenPositions=[];
      for(const [bk,bTile] of Array.from(this.blockers.entries())){
        if(result.blockerTypesToBreak.includes(bTile.blockerType)){
          this.blockers.delete(bk);
          brokenPositions.push(bk.split(",").map(Number));
        }
      }
      outcome.brokenBlockers=brokenPositions;
      outcome.brokenBlockerTypes=result.blockerTypesToBreak;

      this.board.cells[r1][c1]=null;
      this.board.cells[r2][c2]=null;
      this._refillInPlace();
      this.lastMovePos=null;
    } else if((gift1&&val2===9)||(gift2&&val1===9)){
      // [GÜNCELLENDİ — bu konuşmada düzeltildi, kullanıcı hatası raporu:
      // "Bakır'ı 9'un üstüne sürüklediğimde değişim olduğu yerde
      // kalıyor, 9'un olduğu hücreye gitmesi gerekir."] Terfi eden
      // hediye taşı artık HER ZAMAN oyuncunun İKİNCİ tıkladığı hücreye
      // (r2,c2) yerleşiyor.
      const gift=gift1||gift2;
      const giftPos=gift1?[r1,c1]:[r2,c2];
      const result=mechanism2Promotion(gift.giftType,BASE_POINTS.a);
      this.gifts.delete(cellKey(...giftPos));
      this.score+=result.points; this.extraMoves+=result.extraMoves;
      outcome.kind="promotion"; outcome.points=result.points; outcome.extraMoves=result.extraMoves; outcome.gift=result.gift;

      // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10j] Elmas+9
      // artık +10 hamle+puana ek olarak enerji de veriyor.
      if(this.energyTracker && result.energy){
        this.energyTracker.add(result.energy);
        outcome.energy=result.energy;
      }

      this.board.cells[r1][c1]=null;
      this.board.cells[r2][c2]=null;

      // Önce alan patlaması (terfi+patlama — GIFT_PROMO_CROSS_SIZE, ince haç)
      // [Oturum 29 — kullanıcı kararı, DÜZELTİLDİ] crossBlastOffsets
      // kullanıyor (aynı-tür kombinasyonuyla AYNI mekanizma —
      // crossOffsets()) — eskiden areaSize/[nRows,nCols] kullanılıyordu
      // ama bu YANLIŞ hücre sayısı üretiyordu VE Elmas+9 için ([8,8])
      // areaBlastCells()'in "board boyutuna eşit/büyükse tüm tahta"
      // özel durumuna yanlışlıkla denk gelip hâlâ 64 hücre (tüm tahta)
      // patlatıyordu — test sırasında bulundu, bkz. README.md Oturum 29.
      if(result.crossBlastOffsets && result.crossBlastOffsets.length){
        const areaCells=result.crossBlastOffsets
          .map(([dr,dc])=>[r2+dr,c2+dc])
          .filter(([r,c])=>r>=0&&r<GRID&&c>=0&&c<GRID);
        if(areaCells.length){
          const {points:areaPoints,brokenBlockers:areaBroken}=this.applyBlast(areaCells);
          this.score+=areaPoints; outcome.points+=areaPoints;
          outcome.areaCells=areaCells; outcome.brokenBlockers=areaBroken;
        }
      }

      // Sonra terfi eden hediye taşını yerleştir (blast sonrası — silinmez)
      if(result.gift){
        this.gifts.set(k2,{giftType:result.gift});
        if(this.giftTierCounts[result.gift]!==undefined) this.giftTierCounts[result.gift]++;
      } else if(gift.giftType===GIFT_DIAMOND){
        // Elmas+9 → "Matrix Eşleşme" (yeni hediye üretmiyor, tüm tahta patlıyor)
        this.matrixMatchCount++;
      }

      this._refillInPlace();
      this.lastMovePos=null;
    } else {
      if(gift1||gift2) throw new Error("Geçersiz hamle: hediye taşı sadece Mekanizma 2/3 ile birleştirilebilir.");
      if(elem1||elem2) throw new Error("Geçersiz hamle: element sadece Mekanizma 4/5 ile birleştirilebilir.");
      if(resultValue===null) throw new Error("resultValue zorunlu");
      this.board.setCell(r2,c2,resultValue);
      const newSourceValue=this.board.pickValueAvoidingNeighbors(r1,c1);
      this.board.setCell(r1,c1,newSourceValue);
      this.lastMovePos=[r2,c2];
      outcome.kind="normal";
    }

    outcome.chain=this.resolveBoard();
    outcome.chain.push(...this._resolveElementsVsBlockers());
    this.movesUsed+=1;

    // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10h] GARANTİ
    // HEDİYE: hamlelerin %60'ı geçtiyse ve hâlâ hiç hediye taşı
    // üretilmediyse, board'da neredeyse tamamlanmış bir şekli sessizce
    // tamamlat.
    if(this.movesLimit!==null && !this._guaranteedGiftTriggered
       && this.giftsProducedCount===0
       && this.movesUsed>=this.movesLimit*GUARANTEED_GIFT_THRESHOLD){
      const extraChain=this._triggerGuaranteedGift();
      if(extraChain && extraChain.length){
        outcome.chain.push(...extraChain);
        this._guaranteedGiftTriggered=true;
      }
    }

    this._updateStatus();
    outcome.status=this.status; outcome.movesLeft=this.movesLeft;
    return outcome;
  }
  // [YENİ] Bölüm 10h: 2/3 dolu bir 3'lü çizgiyi bulup sessizce tamamlar.
  _triggerGuaranteedGift(){
    const size=this.board.size;
    const isOpen=(r,c)=>r>=0&&r<size&&c>=0&&c<size
      &&!this.blockers.has(cellKey(r,c))&&!this.gifts.has(cellKey(r,c))&&!this.elements.has(cellKey(r,c));
    const candidates=[];
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        if(c+2<size){
          const cells=[[r,c],[r,c+1],[r,c+2]];
          if(cells.every(([rr,cc])=>isOpen(rr,cc))){
            const nines=cells.filter(([rr,cc])=>this.board.cells[rr][cc]===9);
            const missing=cells.filter(([rr,cc])=>this.board.cells[rr][cc]!==9);
            if(nines.length===2&&missing.length===1) candidates.push(missing[0]);
          }
        }
        if(r+2<size){
          const cells=[[r,c],[r+1,c],[r+2,c]];
          if(cells.every(([rr,cc])=>isOpen(rr,cc))){
            const nines=cells.filter(([rr,cc])=>this.board.cells[rr][cc]===9);
            const missing=cells.filter(([rr,cc])=>this.board.cells[rr][cc]!==9);
            if(nines.length===2&&missing.length===1) candidates.push(missing[0]);
          }
        }
      }
    }
    if(candidates.length){
      const [tr,tc]=candidates[Math.floor(this.rng()*candidates.length)];
      this.board.cells[tr][tc]=9;
      this.lastMovePos=[tr,tc];
      const chain=this.resolveBoard();
      this.lastMovePos=null;
      return chain;
    }
    const openCells=[];
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){
      if(isOpen(r,c)&&this.board.cells[r][c]!==null&&this.board.cells[r][c]!==9) openCells.push([r,c]);
    }
    if(openCells.length){
      const [tr,tc]=openCells[Math.floor(this.rng()*openCells.length)];
      this.board.cells[tr][tc]=9;
    }
    return [];
  }
  resolveBoard(maxChain=20){
    const resolved=[]; let chainDepth=0;
    while(chainDepth<maxChain){
      const matches=findAllMatches(this.board,this.lastMovePos);
      if(matches.length===0) break;
      matches.sort((a,b)=>b.length-a.length);
      const processed=new Set();
      for(const match of matches){
        if(match.cells.some(([r,c])=>processed.has(cellKey(r,c)))) continue;
        const result=mechanism1MatchResult(match.group,BASE_POINTS[match.group]??0);
        this.score+=result.points;
        // [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10j] c/d/e
        // grupları enerji de veriyor.
        if(this.energyTracker && result.energy) this.energyTracker.add(result.energy);
        for(const [r,c] of match.cells){
          this.board.cells[r][c]=null; this.gifts.delete(cellKey(r,c)); this.elements.delete(cellKey(r,c));
          processed.add(cellKey(r,c));
        }
        if(result.gift){
          const [sr,sc]=match.spawn;
          processed.delete(cellKey(sr,sc));
          this._applyGiftSpawn(result.gift, sr, sc, resolved);
        }
        resolved.push({match,result});
      }
      this._refillInPlace();
      this.lastMovePos=null;
      chainDepth++;
    }
    return resolved;
  }
  /** [YENİ — Oturum 9, resolveBoard() refactor'ü] Hediye spawn + spawn-anı
   *  patlaması. Eskiden resolveBoard() içine gömülüydü, artık ayrı bir
   *  metod — evolutionEngine'e taşınacak sonraki adımın hazırlığı.
   *  Davranış BİREBİR AYNI, sadece yer değiştirdi (bkz. README.md). */
  _applyGiftSpawn(giftType, sr, sc, resolved){
    this.board.cells[sr][sc]=null;
    this.gifts.set(cellKey(sr,sc),{giftType});
    this.giftsProducedCount++;
    if(this.giftTierCounts[giftType]!==undefined) this.giftTierCounts[giftType]++;

    const spawnBlastDef = GIFT_SPAWN_BLAST[giftType];
    if(!spawnBlastDef) return;
    let spawnCells=[];
    if(spawnBlastDef==="board"){
      for(let _r=0;_r<GRID;_r++) for(let _c=0;_c<GRID;_c++) spawnCells.push([_r,_c]);
    } else if(spawnBlastDef==="cross4"){
      // Bakır hariç Bronz: komşu 4 yön
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{
        const nr=sr+dr,nc=sc+dc;
        if(nr>=0&&nr<GRID&&nc>=0&&nc<GRID) spawnCells.push([nr,nc]);
      });
    } else if(spawnBlastDef==="rowcol"){
      // Gümüş: tüm satır + tüm sütun
      for(let _c=0;_c<GRID;_c++) if(_c!==sc) spawnCells.push([sr,_c]);
      for(let _r=0;_r<GRID;_r++) if(_r!==sr) spawnCells.push([_r,sc]);
    } else if(Array.isArray(spawnBlastDef)){
      // [Oturum 28 — kullanıcı kararı] Altın: İNCE haç (satır+sütun),
      // ESKİDEN burada giftType geçiliyordu → areaBlastCells() otomatik
      // olarak AREA_BLAST_OFFSETS.normal[GIFT_GOLD]'un "kalın artı formu"
      // tablosunu kullanıyordu (17 hücre, ortada 3 hücre kalınlaşan bir
      // şekil — bkz. README.md Oturum 28, görselleştirme). Kullanıcı net
      // olarak "5 yatay + 5 dikey" (İNCE haç, merkez ortak, 9 hücre)
      // istedi. giftType=false geçerek areaBlastCells()'in nRows/nCols
      // tabanlı İNCE haç üretme yoluna (aynı, karışık-tür kombinasyonlarda
      // zaten kullanılan mekanizma) zorluyoruz. NOT: bu SADECE spawn-anı
      // patlamasını etkiler — kombinasyon/terfi (promotion) alan
      // patlaması mekanizması (Oturum 14'te kullanıcı onaylı) DEĞİŞMEDİ.
      spawnCells=this.areaBlastCells(sr,sc,spawnBlastDef,false,false);
    }
    // Spawn noktasını koru (hediye yeni yerleşti)
    spawnCells=spawnCells.filter(([r,c])=>!(r===sr&&c===sc));
    if(spawnCells.length>0){
      const spawnBlast=this.applyBlast(spawnCells);
      this.score+=spawnBlast.points;
      if(!resolved._spawnBlastCells) resolved._spawnBlastCells=[];
      resolved._spawnBlastCells.push(...spawnCells);
    }
  }
  // [GÜNCELLENDİ] Gravity kaldırıldı (bkz. TASARIM.md Bölüm 10e) — hiçbir
  // hücre artık kaymıyor. Boşalan sayı hücreleri AYNI pozisyonda Akış
  // Algoritması ile yeniden dolduruluyor; gift/element spawn pozisyonunda
  // sabit kalıyor (zaten hiç dokunulmuyor); blocker'lar zaten sabitti.
  _refillInPlace(){
    const size=this.board.size;
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        const k=cellKey(r,c);
        if(this.blockers.has(k)) continue;
        if(this.gifts.has(k)||this.elements.has(k)) continue;
        if(this.board.cells[r][c]===null){
          this.board.cells[r][c]=this.board.pickValueAvoidingNeighbors(r,c);
        }
      }
    }
    this.board.resolveRemainingViolations();
  }
  _resolveElementsVsBlockers(maxPasses=10){
    const events=[];
    for(let pass=0;pass<maxPasses;pass++){
      if(this.elements.size===0) break;
      let appliedAny=false;
      for(const [ekey,elementTile] of Array.from(this.elements.entries())){
        const [er,ec]=ekey.split(",").map(Number);
        const neighborBlockerKeys=[];
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nk=cellKey(er+dr,ec+dc); if(this.blockers.has(nk)) neighborBlockerKeys.push(nk);
        }
        if(neighborBlockerKeys.length===0) continue;
        const blockerTypes=neighborBlockerKeys.map(k=>this.blockers.get(k).blockerType);
        const result=mechanism4BreakBlockers(elementTile.elementType,blockerTypes);
        if(result.broken){
          for(const k of neighborBlockerKeys) this.blockers.delete(k);
          this.elements.delete(ekey);
          if(result.leftoverElement) this.elements.set(ekey,{elementType:result.leftoverElement});
          events.push({type:"mechanism4",pos:[er,ec],result});
          appliedAny=true;
        }
      }
      if(!appliedAny) break;
      this._refillInPlace();
    }
    return events;
  }
}
