const F9Hint = (() => {
  let _timer       = null;
  let _lastMove    = Date.now();
  let _glowEls     = [];
  let _active      = false;
  const IDLE_MS         = 8000;  // 8 saniye hareketsizlik (normal bölümler)
  const IDLE_MS_TUTORIAL = 4000; // [Oturum 64] öğretim bölümlerinde (1-10) daha erken göster — yeni oyuncu daha çok rehberliğe ihtiyaç duyar
  const GLOW_COLOR = "#FFD700"; // altın sarısı
  const GLOW_COLOR_FOCUS = "#4FE0A0"; // [Oturum 64] müfredat hedefi hamlesi — normal ipucundan AYIRT EDİLSİN diye farklı (yeşilimsi) renk

  // [Oturum 64 — kullanıcı isteği: "bu şekilleri oluşturması için
  // ipucu göstermekte fayda var"] Şu an hangi öğretim bölümündeyiz
  // (varsa) ve hedefi ne — core/game-engine.js'teki TUTORIAL_CURRICULUM
  // tablosundan okunuyor. Bölüm 11+ için null (normal greedy ipucu).
  function _currentTutorialFocus() {
    const lvl = window.state?.levelNumber;
    if (!lvl) return null;
    const chapter = Math.ceil(lvl / 10) || 1;
    return TUTORIAL_CURRICULUM[chapter] || null;
  }

  // [DÜZELTME] Bir hamleyi (gerçekten UYGULAMADAN) simüle edip, sonucunda
  // hangi eşleşme GRUPLARININ oluşacağını döndürür. DİKKAT: bu oyun
  // standart "iki hücrenin yerini değiştir" değil — GameCore.applyPlayerMove()
  // "normal" hamlede (r2,c2) hücresine val1/val2'nin ARİTMETİK SONUCUNU
  // (GameCore.validOps'tan seçilen op) yazıyor, (r1,c1) ise TAMAMEN YENİ
  // rastgele bir değer alıyor (bkz. core/GameCore.js applyPlayerMove,
  // "else" dalı). Birden fazla olası op (+,-,*,/) olabilir — oyuncu menüden
  // seçer; ipucu için HERHANGİ BİRİ hedef grubu üretiyorsa yeterli sayıyoruz.
  function _simulateNormalMoveGroups(gc, r1, c1, r2, c2, ops) {
    const groups = new Set();
    for (const op of ops) {
      const cellsCopy = gc.board.cells.map(row => row.slice());
      cellsCopy[r2][c2] = op.value; // (r1,c1) bilinçli olarak DOKUNULMADI — gerçek değeri rastgele olacak, tahmin edilemez, mevcut değeri en yakın yaklaşım
      const fakeBoard = { getCell: (r, c) => (r < 0 || c < 0 || r >= GRID || c >= GRID) ? null : cellsCopy[r][c] };
      const matches = findAllMatches(fakeBoard, { r: r2, c: c2 });
      matches.forEach(m => groups.add(m.group));
    }
    return [...groups];
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
          let isFocusMove = false;
          if (focus && focus.kind === "create" && opts.kind === "normal") {
            const groups = _simulateNormalMoveGroups(gc, r, c, r2, c2, opts.ops || []);
            isFocusMove = groups.includes(focus.group);
          } else if (focus && focus.kind === "promote" && opts.kind === "promotion") {
            const g1 = gc.gifts.get(cellKey(r,c)), g2 = gc.gifts.get(cellKey(r2,c2));
            const giftHere = (g1 && g1.giftType) || (g2 && g2.giftType) || null;
            isFocusMove = giftHere === focus.gift;
          }
          if (isFocusMove) {
            if (!bestIsFocus) { bestIsFocus = true; bestScore = -Infinity; } // ilk odak hamlesi bulununca normal adaylar elenir
            const score = 5000; // odak hamlesi her zaman kazanır
            if (score > bestScore) { bestScore=score; best={r1:r,c1:c,r2,c2,isFocus:true}; }
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
    const gc = window.state?.gc;
    const hint = _findBestHint(gc);
    if (!hint) return;
    _clearGlow();
    const color = hint.isFocus ? GLOW_COLOR_FOCUS : GLOW_COLOR;
    _glow(hint.r1, hint.c1, color);
    _glow(hint.r2, hint.c2, color);
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

  function activate()   { _active=true;  _schedule(); }
  function deactivate() { _active=false; _clearTimer(); _clearGlow(); }

  return { onMove, activate, deactivate };
})();


// ══════════════════════════════════════════════════════
// F9 CHURN TESPİTİ — "Oyuncu Kaçmadan Yakala"
// Aynı levelde 3 kez üst üste kaybedilirse DDA sessizce
// devreye girer. Oyuncu "bugün şanslıyım" der.
// ══════════════════════════════════════════════════════
