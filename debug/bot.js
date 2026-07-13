const F9Bot = (() => {
  let _running = false;
  let _speed = 120;      // ms/hamle
  let _profile = "normal";
  let _levelCount = 0;
  let _results = [];
  let _timer = null;
  let _dda_bot = {losses:0,targetMult:1,movesMult:1,densityMult:1,
    record(won){
      if(won){this.losses=0;this._mv("targetMult",1);this._mv("movesMult",1);this._mv("densityMult",1);}
      else{
        this.losses++;
        if(this.losses>=3){this.targetMult=0.55;this.movesMult=1.40;this.densityMult=0.15;}
        else if(this.losses>=2){this.targetMult=0.75;this.movesMult=1.20;this.densityMult=0.60;}
      }
    },
    _mv(k,t){const c=this[k];if(c<t)this[k]=Math.min(t,c+0.25);else if(c>t)this[k]=Math.max(t,c-0.25);}
  };

  const PROFILES = {
    casual: {ninePref:0.20, chainPref:0.05, giftPref:0.15},
    normal: {ninePref:0.65, chainPref:0.50, giftPref:0.70},
    pro:    {ninePref:0.90, chainPref:0.90, giftPref:0.95},
  };

  // ── Seeded RNG (Mulberry32) ──────────────────────────
  // Math.random() yerine — aynı seed ile aynı hamleleri üretir.
  // Hata debug'u: bot garip bir şey yapınca aynı seed ile yeniden çalıştır.
  let _botSeed = Date.now() ^ 0xDEADBEEF;
  function _rng() {
    _botSeed = (_botSeed + 0x6D2B79F5) >>> 0;
    let t = Math.imul(_botSeed ^ (_botSeed >>> 15), 1 | _botSeed) >>> 0;
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function _botReseed(seed) {
    _botSeed = (seed >>> 0) || 1;
    F9Debug.log("game", "[BOT] Seed ayarlandı: " + seed);
  }

  // ── Ağırlık Matrisi (Weight Matrix) ──────────────────
  // Satranç "Piece-Square Table" mantığı:
  // Merkeze yakın hücreler daha yüksek puan alır.
  // Bot bu matristen hücre koordinat bonusu olarak faydalanır.
  const _BOT_WEIGHT = (function() {
    const G = F9_CONFIG.GRID_SIZE;
    const center = (G - 1) / 2;
    const mat = [];
    for (let r = 0; r < G; r++) {
      mat[r] = [];
      for (let c = 0; c < G; c++) {
        // Manhattan mesafesine göre merkez bonusu (0-20 arası)
        const dist = Math.abs(r - center) + Math.abs(c - center);
        const maxDist = center * 2;
        mat[r][c] = Math.round((1 - dist / maxDist) * 20);
      }
    }
    return mat;
  })();

  function _scoreMove(r1,c1,r2,c2,gc,prof){
    const opts=gc.getMoveOptions(r1,c1,r2,c2);
    const kind=opts?.kind;
    if(!kind||kind==="blocked"||kind==="invalid") return null;

    // Temel rastgelelik + ağırlık matrisi bonusu
    let score = _rng()*3 + _BOT_WEIGHT[r2][c2] * 0.5;

    if(kind==="hourglass_nine") return {opts,score:1000};
    if(kind==="promotion")      return {opts,score:400+score};
    if(kind==="combo")          return {opts,score:300+score};
    if(kind==="element_nine_break") return {opts,score:350+score};
    if(kind==="lightning_lightning") return {opts,score:200+score};

    if(kind==="normal"){
      const ops=opts.ops||[];
      if(!ops.length) return null;
      const nineOps=ops.filter(o=>o&&o.value===9);
      if(nineOps.length && _rng()<prof.ninePref){
        // Merkez bonusu: merkezdeki 9 daha değerli
        score += 50 + _BOT_WEIGHT[r2][c2];
        // Komşu 9 kontrolü
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nr=r2+dr, nc=c2+dc;
          if(nr>=0&&nr<GRID&&nc>=0&&nc<GRID&&gc.board?.getCell(nr,nc)===9)
            score+=100;
        }
        // Zincir potansiyeli
        // [Oturum 31 — DÜZELTİLDİ, motor sağlamlık/şekil kapsama analizi
        // sırasında bulundu] Eskiden burada SADECE yatay (dc, sabit r2)
        // taranıyordu — dikey yönde hiç kontrol yoktu. Bu, bot'un sürekli
        // yatay 9 dizileri kurmaya yönelmesine yol açıyordu (line3_h/
        // line3_v oranı 2517:34, 74 kat!) ve çok-yönlü şekillerin
        // (4-7'li bloklar) neredeyse hiç oluşmamasına sebep oluyordu —
        // bot bunlara doğru İNŞA ETMİYORDU, sadece yatay komşuluğu
        // ödüllendiriyordu. Şimdi her iki yön de taranıyor (bkz.
        // README.md Oturum 31). Bu SADECE bot'un test-oynayış kalitesini
        // etkiler, gerçek oyun motorunu (core/GameCore.js) DEĞİŞTİRMEZ.
        if(_rng()<prof.chainPref){
          let adj9=0;
          for(let dc=-2;dc<=2;dc++){
            const nc=c2+dc;
            if(nc>=0&&nc<GRID&&nc!==c2&&gc.board?.getCell(r2,nc)===9) adj9++;
          }
          for(let dr=-2;dr<=2;dr++){
            const nr=r2+dr;
            if(nr>=0&&nr<GRID&&nr!==r2&&gc.board?.getCell(nr,c2)===9) adj9++;
          }
          score+=adj9*80;
        }
      } else if(!nineOps.length){
        score+=10;
      }
    }
    return {opts,score};
  }


  // ── BITBOARD: tahta kopyası Uint8Array(64) ile ─────────
  // 0=boş, 1-8=sayı, 9=dokuz, 100+=hediye/engel
  function _gcToBitboard(gc) {
    const bb = new Uint8Array(64);
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const k = cellKey(r, c);
        const idx = r * GRID + c;
        if (gc.blockers.has(k))    { bb[idx] = 200; continue; }
        if (gc.gifts.has(k))       { bb[idx] = 150; continue; }
        if (gc.hourglasses.has(k)) { bb[idx] = 120; continue; }
        if (gc.elements.has(k))    { bb[idx] = 110; continue; }
        const v = gc.board.getCell(r, c);
        bb[idx] = v || 0;
      }
    }
    return bb;
  }

  // ── BOARD EVALUATION E(s) ────────────────────────────
  // E(s) = w1*skor + w2*boşHücre - w3*izoleSayı + w4*kümelenme
  function _evalBoard(bb, score) {
    const W1=0.4, W2=8, W3=12, W4=6;
    let empty=0, isolated=0, clustering=0;
    const DIRS = [-GRID, GRID, -1, 1]; // yukarı, aşağı, sol, sağ (bitboard idx)

    for (let i = 0; i < 64; i++) {
      const v = bb[i];
      if (v === 0)  { empty++; continue; }
      if (v >= 100) continue; // engel/hediye — sayma
      const r = Math.floor(i/GRID), c = i%GRID;

      // İzole sayı: etrafında kendisiyle 9 yapabilecek komşu var mı?
      let hasPartner = false;
      for (const d of DIRS) {
        const ni = i + d;
        if (ni < 0 || ni >= 64) continue;
        // Sütun sınırı kontrolü (sol/sağ)
        if (d === -1 && c === 0) continue;
        if (d ===  1 && c === 7) continue;
        const nv = bb[ni];
        if (nv > 0 && nv < 100 && (v + nv === 9 || (v===3&&nv===3) || (v===3&&nv===6) || (v===6&&nv===3) || (v===6&&nv===6))) {
          hasPartner = true;
        }
      }
      if (!hasPartner) isolated++;

      // Kümelenme: komşu değerler birbirine yakınsa bonus
      for (const d of DIRS) {
        const ni = i + d;
        if (ni < 0 || ni >= 64) continue;
        if (d === -1 && c === 0) continue;
        if (d ===  1 && c === 7) continue;
        const nv = bb[ni];
        if (nv > 0 && nv < 100 && Math.abs(v - nv) <= 2) clustering++;
      }
    }

    return W1*score + W2*empty - W3*isolated + W4*clustering;
  }

  // ── MONTE CARLO: hamle başına N rastgele oyun simüle et ──
  // Ağır GameCore yerine bitboard üzerinde çalışır — 10-50x daha hızlı
  function _mcSimulate(gc, r1, c1, r2, c2, opts, N_SIMS, DEPTH) {
    let totalEval = 0;

    for (let sim = 0; sim < N_SIMS; sim++) {
      // Bitboard kopyasını al
      const bb = _gcToBitboard(gc);
      // [DÜZELTME — Oturum 12, kullanıcı raporu: normal/pro profil casual'dan
      // kötü oynuyordu] simScore ÖNCEDEN gc.score (o ana kadarki TÜM
      // birikmiş skor, binlerce olabilir) ile başlıyordu. Bu, _evalBoard'a
      // her aday hamle için AYNI devasa sabit terim olarak giriyordu —
      // hamleler arası gerçek farkı boğan gürültü kaynağıydı. Artık sadece
      // BU simülasyonda kazanılan artışı (0'dan başlayarak) değerlendiriyoruz.
      let simScore = 0;

      // İlk hamleyi uygula (basitleştirilmiş — 9 üretimi tahmini)
      const idx1 = r1*GRID+c1, idx2 = r2*GRID+c2;
      const kind = opts.kind;

      if (kind === 'normal' && opts.ops?.length) {
        const op = opts.ops.find(o=>o.value===9) || opts.ops[0];
        if (op) {
          bb[idx2] = op.value;
          // Kaynak hücreye rastgele yeni değer
          bb[idx1] = Math.ceil(_rng()*8);
          if (op.value === 9) simScore += F9_CONFIG.POINTS.BASE.a;
        }
      } else if (kind === 'promotion') {
        bb[idx1] = 0; bb[idx2] = 0;
        simScore += F9_CONFIG.POINTS.BASE.a;
      } else if (kind === 'combo') {
        bb[idx1] = 0; bb[idx2] = 0;
        simScore += F9_CONFIG.POINTS.BASE.b;
      }

      // DEPTH kadar rastgele hamle yap
      for (let d = 0; d < DEPTH; d++) {
        // Rastgele boş bir çift bul
        const pairs = [];
        for (let i = 0; i < 64; i++) {
          if (bb[i] === 0 || bb[i] >= 100) continue;
          const c = i % GRID;
          if (c < 7 && bb[i+1] > 0 && bb[i+1] < 100) {
            const sum = bb[i] + bb[i+1];
            if (sum === 9) { pairs.push({i1:i, i2:i+1, gain:90}); break; }
            pairs.push({i1:i, i2:i+1, gain:1});
          }
          if (i + GRID < 64 && bb[i+GRID] > 0 && bb[i+GRID] < 100) {
            const sum = bb[i] + bb[i+GRID];
            if (sum === 9) { pairs.push({i1:i, i2:i+GRID, gain:90}); break; }
          }
        }
        if (!pairs.length) break;
        // 9 yapan varsa onu seç, yoksa rastgele
        const nines = pairs.filter(p=>p.gain===90);
        const pick = nines.length ? nines[0] : pairs[Math.floor(_rng()*pairs.length)];
        bb[pick.i2] = 9;
        bb[pick.i1] = Math.ceil(_rng()*8);
        simScore += pick.gain;
      }

      totalEval += _evalBoard(bb, simScore);
    }
    return totalEval / N_SIMS;
  }

  // ── ANA HAMLE SEÇİCİ (Monte Carlo destekli) ──────────
  function _pickMove(gc, prof) {
    // Profil parametreleri
    // _profile string karşılaştırması — nesne referansı yerine güvenli
    const N_SIMS  = _profile==='pro' ? 5 : _profile==='normal' ? 3 : 1;
    const DEPTH   = _profile==='pro' ? 4 : _profile==='normal' ? 3 : 2;
    // [DÜZELTME — Oturum 12, "Level dengeleme" fazı] Deneysel olarak
    // KANITLANDI: _mcSimulate/_evalBoard etkin olduğunda bot performansı
    // ÇÖKÜYOR (örn. level 6: %0 → MC kapalıyken %88 kazanma oranı). MC
    // devre dışıyken (casual profili, hiç MC kullanmıyordu) bot tutarlı
    // biçimde MC'li normal/pro'dan daha iyi oynuyordu — profil sıralaması
    // tersine dönmüştü (casual > pro > normal). Kök neden muhtemelen
    // _evalBoard'un empty/isolated/clustering ağırlıklarının (W2=8,W3=12,W4=6)
    // gerçek skor potansiyelinden kopuk, yanıltıcı bir sinyal üretmesi.
    // Düzgün bir MC/heuristic yeniden tasarımı ayrı bir oturum gerektiriyor
    // (bkz. README.md) — şimdilik MC KAPALI, bot sadece greedy heuristiğe
    // (_scoreMove) güveniyor, bu ÖLÇÜLEBİLİR ŞEKİLDE daha iyi sonuç veriyor.
    const USE_MC  = false; // sadece bot çalışırken MC aktif

    const cands = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
          const r2=r+dr, c2=c+dc;
          if (r2<0||r2>=GRID||c2<0||c2>=GRID) continue;
          const res = _scoreMove(r,c,r2,c2,gc,prof);
          if (!res) continue;

          let score = res.score;

          // Monte Carlo değerlendirmesi — özel hamleler için atlat
          if (USE_MC && res.opts.kind === 'normal') {
            const mcScore = _mcSimulate(gc, r, c, r2, c2, res.opts, N_SIMS, DEPTH);
            score = score * 0.3 + mcScore * 0.7; // greedy %30, MC %70
          }

          cands.push({r1:r, c1:c, r2, c2, opts:res.opts, score});
        }
      }
    }

    if (!cands.length) return null;
    cands.sort((a,b) => b.score - a.score);

    // Pro: en iyiyi seç. Diğerleri: üst 3'ten rastgele (insan hatası simülasyonu)
    const topN = _profile === 'pro' ? 1 : 3;
    const top  = cands.slice(0, Math.min(topN, cands.length));
    const chosen = top[Math.floor(_rng() * top.length)];
    return chosen || null;
  }

  function _applyBotMove(gc,move){
    const {r1,c1,r2,c2,opts}=move;
    const kind=opts.kind;
    gc._pushSnapshot();
    if(kind==="promotion"||kind==="combo"||kind==="element_nine_break"
       ||kind==="hourglass_nine"||kind==="lightning_lightning"){
      return gc.applyPlayerMove(r1,c1,r2,c2,null);
    }
    if(kind==="normal"){
      const ops=opts.ops||[];
      if(!ops.length) return null;                    // ops boşsa çık
      const nineOps=ops.filter(o=>o&&o.value===9);
      const op = nineOps.length ? nineOps[0] : ops[0];
      if(!op || op.value==null) return null;          // op undefined guard
      return gc.applyPlayerMove(r1,c1,r2,c2,op.value);
    }
    return null;
  }

  function _stepLevel(){
    if(!_running) return;
    const gc=state.gc;
    if(!gc||gc.status!=="in_progress"){
      // Level bitti
      const won=gc&&gc.score>=(state.cfg?.targetScore||630);
      _dda_bot.record(won);
      const result={
        level:state.levelNumber, won,
        score:gc?.score||0, target:state.cfg?.targetScore||630,
        moves:gc?.movesUsed||0, movesLimit:gc?.movesLimit||0,
        nineEff:0, spm:0,
      };
      _results.push(result);
      _levelCount++;
      F9Debug.log("game",`[BOT] L${result.level} ${won?"✓":"✗"} ${result.score}/${result.target}`,{
        levels:_levelCount, wins:_results.filter(r=>r.won).length
      });
      // [Oturum 46 — KRİTİK HATA DÜZELTMESİ, F9Bot'un window'a açılması
      // sayesinde ORTAYA ÇIKTI] Eskiden burada `_currentTab`/`_dirPanel`
      // (F9Debug'ın debug/debug.js'teki AYRI IIFE'sinin PRIVATE closure
      // değişkenleri) DOĞRUDAN okunmaya çalışılıyordu — F9Bot kendi
      // IIFE'sinde bunlara HİÇ ERİŞEMEZ ("_currentTab is not defined").
      // F9Debug zaten TAM bu mantığı (sadece 'dir' sekmesi açıksa
      // render et) kendi PUBLIC `renderDirector()` metodunda
      // barındırıyor (bkz. debug/debug.js) — onu kullanmak yeterli.
      F9Debug.renderDirector();

      // Sonraki level
      setTimeout(()=>{
        if(!_running) return;
        if(won){
          state.levelNumber++;
        }
        // [Oturum 46 — KRİTİK HATA DÜZELTMESİ] `startNewLevel` diye bir
        // fonksiyon KODDA HİÇ YOK — F9Bot'un window'a açılmasıyla
        // ortaya çıkan üçüncü hata ("startNewLevel is not defined").
        // Gerçek fonksiyon `newLevel(levelNumber)` (flow/levelFlow.js)
        // — kendi `generateLevel()` çağrısını (Oturum 43'ün doğru seed
        // mantığıyla) zaten İÇİNDE yapıyor, bu yüzden `generateLevel(
        // state.levelNumber, 0)` (YANLIŞ seed=0 ile) elle çağırıp
        // `state.cfg`'yi ayarlamaya hiç gerek yok — newLevel() hepsini
        // kendisi hallediyor (tüp kontrolü dahil, gerçek oyun akışıyla
        // birebir tutarlı).
        try{
          newLevel(state.levelNumber);
        }catch(e){ F9Debug.err("[BOT] level başlatma hatası",{msg:e.message}); }
      }, _speed*2);
      return;
    }

    // Hamle yap
    const prof=PROFILES[_profile]||PROFILES.normal;
    const move=_pickMove(gc,prof);
    if(!move){ gc.status="lost"; return; }            // hamle yok → level bitti

    try{
      const result=_applyBotMove(gc,move);
      if(result===null){
        // Geçersiz hamle — bot donmasın, atla
        F9Debug.log("game","[BOT] geçersiz hamle atlandı",{r1:move.r1,c1:move.c1});
      }
      renderBoardOnly();
    }catch(e){ F9Debug.err("[BOT] hamle hatası",{msg:e.message}); }

    _timer=setTimeout(_stepLevel, _speed);
  }

  function start(profile="normal", speedMs=120){
    if(_running) return;
    _running=true;
    _profile=profile;
    _speed=speedMs;
    _results=[];
    _levelCount=0;
    F9Debug.log("game","[BOT] Başladı",{profile,speed:speedMs});
    _stepLevel();
  }

  function stop(){
    _running=false;
    if(_timer) clearTimeout(_timer);
    F9Debug.log("game","[BOT] Durduruldu",{
      levels:_levelCount,
      wins:_results.filter(r=>r.won).length,
      winRate:_results.length?(_results.filter(r=>r.won).length/_results.length*100).toFixed(0)+"%":"0%"
    });
  }

  function summary(){
    if(!_results.length) return null;
    const wins=_results.filter(r=>r.won).length;
    return {
      levels:_levelCount, wins, winRate:wins/_results.length,
      results:_results.slice(-20),
    };
  }

  function isRunning(){ return _running; }

  
    return {start, stop, summary, isRunning,
    reseed: _botReseed,
    getSeed: function() { return _botSeed; },
    weightMatrix: function() { return _BOT_WEIGHT; },
    // ── YENİ (Oturum 6) — Headless benchmark için saf fonksiyonlar ──
    // Canlı state/render'a dokunmaz; sadece verilen gc üzerinde çalışır.
    // Mevcut start()/stop()/_stepLevel() davranışını DEĞİŞTİRMEZ.
    pickMove: function(gc, profileName) {
      const prevRunning = _running, prevProfile = _profile;
      _profile = profileName || _profile;
      _running = true; // Monte Carlo değerlendirmesini etkinleştirir
      try {
        return _pickMove(gc, PROFILES[_profile] || PROFILES.normal);
      } finally {
        _running = prevRunning; _profile = prevProfile;
      }
    },
    applyMove: _applyBotMove,
  };
})();
// [Oturum 46 — KRİTİK HATA DÜZELTMESİ, kullanıcı konsol logundan bulundu]
// F9Bot bu dosyada bir IIFE'nin İÇİNDE tanımlı — script'in geri kalanı
// (ortak IIFE, bkz. build/manifest.js) buna closure üzerinden DOĞRUDAN
// erişebiliyor. AMA debug/debug.js'teki F9 Direktör panelinin butonları
// `onclick="F9Bot.start('casual',200)"` gibi HTML STRING attribute'ları
// olarak yazılmış — tarayıcı bunları GLOBAL (window) kapsamında
// çalıştırır, IIFE'nin İÇ KAPSAMINA (closure) ERİŞEMEZ. Sonuç: panel
// açılıp bu butonlardan birine tıklanınca "ReferenceError: F9Bot is not
// defined" — F9Bot'un TANIMI bozuk değildi, sadece onclick string'inin
// eriştiği kapsamda YOKTU. Düzeltme: F9Bot'u window'a da açıkça atıyoruz
// (IIFE-içi kullanım BOZULMUYOR, sadece EK bir global referans ekleniyor).
if (typeof window !== "undefined") window.F9Bot = F9Bot;


// ══════════════════════════════════════════════════════
// F9Director — Direktör Proxy (Single Responsibility)
// F9Debug içindeki direktör sistemine temiz erişim sağlar.
// Kullanım: F9Director.health(), F9Director.notes() vb.
// ══════════════════════════════════════════════════════
