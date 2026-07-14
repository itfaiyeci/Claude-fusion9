const F9Hint = (() => {
  let _timer       = null;
  let _lastMove    = Date.now();
  let _glowEls     = [];
  let _active      = false;
  const IDLE_MS         = 8000;  // 8 saniye hareketsizlik (normal bölümler)
  const IDLE_MS_TUTORIAL = 4000; // [Oturum 64] öğretim bölümlerinde (1-10) daha erken göster — yeni oyuncu daha çok rehberliğe ihtiyaç duyar
  const GLOW_COLOR = "#FFD700"; // altın sarısı
  const GLOW_COLOR_FOCUS = "#4FE0A0"; // [Oturum 64] müfredat hedefi hamlesi — normal ipucundan AYIRT EDİLSİN diye farklı (yeşilimsi) renk

  // [Oturum 90 — kullanıcı isteği: "büyük şeklin daha büyük kazanç
  // olduğunu göstermeli ama zorlamamalı, küçük çalışmalar da mutlu
  // etmeli"] Pasif "fırsat" taraması — tahtada ZATEN duran 9'lardan bir
  // kısmı büyük bir şeklin (4-7'li) YARISINDAN FAZLASINI tamamlamışsa,
  // ara sıra (birkaç saniyede bir, SÜREKLİ DEĞİL) o hücreler farklı/
  // soluk bir tonda hafifçe parlıyor. Hiçbir popup, hiçbir zorunlu
  // hamle, hiçbir şey ENGELLENMİYOR — sadece dikkatli oyuncu fark eder.
  // Normal ipucu döngüsünden (idle-tetiklenmeli) TAMAMEN AYRI, kendi
  // periyodik zamanlayıcısı var — aktif oynanırken bile ara sıra görünür.
  const OPPORTUNITY_COLOR = "#7EC8E3"; // soluk mavi — altın (GLOW_COLOR) ve yeşilden (FOCUS) AYIRT edilsin
  const OPPORTUNITY_INTERVAL_MS = 7000; // her ~7 saniyede bir kontrol
  const OPPORTUNITY_SHOW_MS = 2200; // parıltının görünür kaldığı süre
  let _oppTimer = null;

  function _findBigShapeOpportunity(gc) {
    if (!gc || !gc.board) return null;
    let best = null, bestRatio = 0;
    for (const shape of ALL_FIXED_SHAPES) {
      if (shape.group === GROUP_A) continue; // 3'lü zaten kolay/sık oluşuyor, fırsat vurgusu gerekmiyor
      const maxDr = Math.max(...shape.cells.map(([r]) => r));
      const maxDc = Math.max(...shape.cells.map(([, c]) => c));
      for (let br = 0; br <= GRID - 1 - maxDr; br++) {
        for (let bc = 0; bc <= GRID - 1 - maxDc; bc++) {
          const absCells = shape.cells.map(([r, c]) => [br + r, bc + c]);
          const nineCells = absCells.filter(([r, c]) => gc.board.getCell(r, c) === 9);
          const ratio = nineCells.length / shape.cells.length;
          // Tam tamamlanmışsa zaten eşleşip temizlenmiş olurdu — bu
          // yüzden ratio===1 pratikte görünmez ama yine de dışlıyoruz.
          if (ratio >= 0.5 && ratio < 1 && nineCells.length >= 2 && ratio > bestRatio) {
            bestRatio = ratio;
            best = { cells: nineCells, group: shape.group };
          }
        }
      }
    }
    return best;
  }

  function _showOpportunity() {
    if (!_active) return;
    if (_glowEls.length) return; // normal ipucu şu an gösteriliyorsa araya girme
    const gc = state?.gc;
    const opp = _findBigShapeOpportunity(gc);
    if (!opp) return;
    const els = [];
    for (const [r, c] of opp.cells) {
      const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (!el) continue;
      els.push(el);
      el.style.transition = "box-shadow 0.8s ease-in-out";
      el.style.boxShadow = `0 0 10px 2px ${OPPORTUNITY_COLOR}55, inset 0 0 6px ${OPPORTUNITY_COLOR}33`;
    }
    setTimeout(() => {
      els.forEach(el => { el.style.boxShadow = ""; });
    }, OPPORTUNITY_SHOW_MS);
  }

  function _scheduleOpportunity() {
    _clearOpportunityTimer();
    if (!_active) return;
    _oppTimer = setTimeout(() => { _showOpportunity(); _scheduleOpportunity(); }, OPPORTUNITY_INTERVAL_MS);
  }

  function _clearOpportunityTimer() {
    if (_oppTimer) { clearTimeout(_oppTimer); _oppTimer = null; }
  }

  // [Oturum 64 — kullanıcı isteği: "bu şekilleri oluşturması için
  // ipucu göstermekte fayda var"] Şu an hangi öğretim bölümündeyiz
  // (varsa) ve hedefi ne — core/game-engine.js'teki TUTORIAL_CURRICULUM
  // tablosundan okunuyor. Bölüm 11+ için null (normal greedy ipucu).
  function _currentTutorialFocus() {
    const lvl = state?.levelNumber;
    if (!lvl) return null;
    const chapter = Math.ceil(lvl / 10) || 1;
    return TUTORIAL_CURRICULUM[chapter] || null;
  }

  // [DÜZELTME] Bir hamleyi (gerçekten UYGULAMADAN) simüle edip, sonucunda
  // hangi eşleşme GRUPLARININ ve HANGİ HÜCRELERİN oluşacağını döndürür.
  // DİKKAT: bu oyun standart "iki hücrenin yerini değiştir" değil —
  // GameCore.applyPlayerMove() "normal" hamlede (r2,c2) hücresine
  // val1/val2'nin ARİTMETİK SONUCUNU (GameCore.validOps'tan seçilen op)
  // yazıyor, (r1,c1) ise TAMAMEN YENİ rastgele bir değer alıyor (bkz.
  // core/GameCore.js applyPlayerMove, "else" dalı). Birden fazla olası
  // op (+,-,*,/) olabilir — oyuncu menüden seçer; ipucu için HERHANGİ
  // BİRİ hedef grubu üretiyorsa yeterli sayıyoruz.
  function _simulateNormalMoveGroups(gc, r1, c1, r2, c2, ops) {
    const results = []; // { group, cells }
    for (const op of ops) {
      const cellsCopy = gc.board.cells.map(row => row.slice());
      cellsCopy[r2][c2] = op.value; // (r1,c1) bilinçli olarak DOKUNULMADI — gerçek değeri rastgele olacak, tahmin edilemez, mevcut değeri en yakın yaklaşım
      const fakeBoard = { getCell: (r, c) => (r < 0 || c < 0 || r >= GRID || c >= GRID) ? null : cellsCopy[r][c] };
      const matches = findAllMatches(fakeBoard, { r: r2, c: c2 });
      matches.forEach(m => results.push({ group: m.group, cells: m.cells }));
    }
    return results;
  }

  // En iyi hamleyi bul — F9Bot'un greedy seçicisi gibi, ama bir
  // öğretim bölümündeysek o bölümün hedef mekanizmasını üreten
  // hamleyi HER ZAMAN en yükseğe koy (normal skorlamayı geçersiz kılar).
  function _findBestHint(gc) {
    if (!gc || gc.status !== "in_progress") return null;
    const focus = _currentTutorialFocus();
    let best = null, bestScore = -Infinity, bestIsFocus = false;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        for (const [dr, dc] of [[0,1],[1,0]]) {
          const r2=r+dr, c2=c+dc;
          if (r2>=GRID||c2>=GRID) continue;
          const opts = gc.getMoveOptions(r,c,r2,c2);
          if (!opts||opts.kind==="blocked"||opts.kind==="invalid") continue;

          // [Oturum 64] Müfredat hedefi kontrolü — normal skordan ÖNCE.
          // [Oturum 89 — kullanıcı isteği: "9 yapacak hamle değil, şekli
          // tamamlayan (9 DIŞI) diğer hücreler vurgulanmalı"] Artık
          // sadece swap edilecek 2 hücre değil, şeklin TAMAMI (tahtada
          // zaten duran diğer 9'lar dahil) `shapeCells` olarak saklanıyor.
          let isFocusMove = false, shapeCells = null;
          if (focus && focus.kind === "create" && opts.kind === "normal") {
            const results = _simulateNormalMoveGroups(gc, r, c, r2, c2, opts.ops || []);
            const match = results.find(m => m.group === focus.group);
            isFocusMove = !!match;
            if (match) shapeCells = match.cells;
          } else if (focus && focus.kind === "promote" && opts.kind === "promotion") {
            const g1 = gc.gifts.get(cellKey(r,c)), g2 = gc.gifts.get(cellKey(r2,c2));
            const giftHere = (g1 && g1.giftType) || (g2 && g2.giftType) || null;
            isFocusMove = giftHere === focus.gift;
          }
          if (isFocusMove) {
            if (!bestIsFocus) { bestIsFocus = true; bestScore = -Infinity; } // ilk odak hamlesi bulununca normal adaylar elenir
            const score = 5000; // odak hamlesi her zaman kazanır
            if (score > bestScore) { bestScore=score; best={r1:r,c1:c,r2,c2,isFocus:true,shapeCells}; }
            continue;
          }
          if (bestIsFocus) continue; // zaten bir odak hamlesi bulunduysa normal hamlelerle uğraşma

          let score = 0;
          if (opts.kind==="hourglass_nine") score=1000;
          else if (opts.kind==="promotion")  score=400;
          else if (opts.kind==="combo")      score=300;
          else if (opts.kind==="normal") {
            const nineOps=(opts.ops||[]).filter(o=>o.value===9);
            if (nineOps.length) {
              score=100;
              // Komşu 9 bonusu
              for (const [dr2,dc2] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr=r2+dr2, nc=c2+dc2;
                if (nr>=0&&nr<GRID&&nc>=0&&nc<GRID&&gc.board.getCell(nr,nc)===9) score+=50;
              }
            } else score=10;
          }
          if (score > bestScore) { bestScore=score; best={r1:r,c1:c,r2,c2,isFocus:false}; }
        }
      }
    }
    return best;
  }

  // Hücreyi parıldatma efekti (çok hafif — oyuncuya hissettirmeden)
  function _glow(r, c, color) {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!el) return;
    _glowEls.push(el);
    el.style.transition = "box-shadow 0.6s ease-in-out";
    el.style.boxShadow  = `0 0 16px 4px ${color}88, inset 0 0 8px ${color}44`;
    // Hafif titreme animasyonu
    el.animate([
      { transform:"scale(1)" },
      { transform:"scale(1.06)" },
      { transform:"scale(1)" },
    ], { duration:600, iterations:3, easing:"ease-in-out" });
  }

  function _clearGlow() {
    _glowEls.forEach(el => {
      el.style.boxShadow  = "";
      el.style.transition = "";
    });
    _glowEls = [];
  }

  function _showHint() {
    if (!_active) return;
    // [Oturum 65 — KRİTİK HATA DÜZELTMESİ] `window.state` HER ZAMAN
    // undefined'dı — `state` core/game-engine.js'te `const` olarak
    // tanımlı, üst-seviye `const`'lar `window`'a ASLA otomatik eklenmez
    // (sadece `var`/fonksiyon bildirimleri eklenir). Yani bu satır
    // `gc`'yi HER ZAMAN undefined yapıyordu, `_findBestHint(undefined)`
    // her seferinde sessizce null dönüyordu — İPUCU SİSTEMİ (parıldama)
    // muhtemelen HİÇ ÇALIŞMAMIŞTI (debug/bot.js'in doğru kullandığı
    // çıplak `state.gc` ile karşılaştırınca fark edildi).
    const gc = state?.gc;
    const hint = _findBestHint(gc);
    if (!hint) return;
    _clearGlow();
    const color = hint.isFocus ? GLOW_COLOR_FOCUS : GLOW_COLOR;
    // [Oturum 89 — kullanıcı isteği: "9 yapacak hamle değil, şekli
    // tamamlayan DİĞER hücreler vurgulanmalı"] shapeCells varsa (odak
    // hamlesi bir şekli tamamlıyorsa), TÜM şekli parlatıyoruz — sadece
    // swap edilecek 2 hücreyi değil, tahtada zaten duran diğer 9'ları
    // da. Oyuncu böylece "şu 2 hücreyi değiştir" değil, "işte tamamlanan
    // şekil bu" görüyor.
    if (hint.shapeCells && hint.shapeCells.length) {
      hint.shapeCells.forEach(([r, c]) => _glow(r, c, color));
    } else {
      _glow(hint.r1, hint.c1, color);
      _glow(hint.r2, hint.c2, color);
    }
    F9Debug.log("game", `[İPUCU${hint.isFocus?"/MÜFREDAT":""}] (${hint.r1},${hint.c1})↔(${hint.r2},${hint.c2}) gösterildi`);
  }

  function _schedule() {
    _clearTimer();
    if (!_active) return;
    const focus = _currentTutorialFocus();
    _timer = setTimeout(_showHint, focus ? IDLE_MS_TUTORIAL : IDLE_MS);
  }

  function _clearTimer() {
    if (_timer) { clearTimeout(_timer); _timer=null; }
  }

  // Her hamlede çağrılır — zamanlayıcıyı sıfırla
  function onMove() {
    _lastMove = Date.now();
    _clearGlow();
    _schedule();
  }

  function activate()   { _active=true;  _schedule(); _scheduleOpportunity(); }
  function deactivate() { _active=false; _clearTimer(); _clearGlow(); _clearOpportunityTimer(); }

  return { onMove, activate, deactivate };
})();


// ══════════════════════════════════════════════════════
// F9 CHURN TESPİTİ — "Oyuncu Kaçmadan Yakala"
// Aynı levelde 3 kez üst üste kaybedilirse DDA sessizce
// devreye girer. Oyuncu "bugün şanslıyım" der.
// ══════════════════════════════════════════════════════
