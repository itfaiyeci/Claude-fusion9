const F9Hint = (() => {
  let _timer       = null;
  let _lastMove    = Date.now();
  let _glowEls     = [];
  let _active      = false;
  const IDLE_MS    = 8000;   // 8 saniye hareketsizlik
  const GLOW_COLOR = "#FFD700"; // altın sarısı

  // En iyi hamleyi bul — F9Bot'un greedy seçicisi gibi
  function _findBestHint(gc) {
    if (!gc || gc.status !== "in_progress") return null;
    let best = null, bestScore = -Infinity;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        for (const [dr, dc] of [[0,1],[1,0]]) {
          const r2=r+dr, c2=c+dc;
          if (r2>=GRID||c2>=GRID) continue;
          const opts = gc.getMoveOptions(r,c,r2,c2);
          if (!opts||opts.kind==="blocked"||opts.kind==="invalid") continue;
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
          if (score > bestScore) { bestScore=score; best={r1:r,c1:c,r2,c2}; }
        }
      }
    }
    return best;
  }

  // Hücreyi parıldatma efekti (çok hafif — oyuncuya hissettirmeden)
  function _glow(r, c) {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!el) return;
    _glowEls.push(el);
    el.style.transition = "box-shadow 0.6s ease-in-out";
    el.style.boxShadow  = `0 0 16px 4px ${GLOW_COLOR}88, inset 0 0 8px ${GLOW_COLOR}44`;
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
    _glow(hint.r1, hint.c1);
    _glow(hint.r2, hint.c2);
    F9Debug.log("game", `[İPUCU] (${hint.r1},${hint.c1})↔(${hint.r2},${hint.c2}) gösterildi`);
  }

  function _schedule() {
    _clearTimer();
    if (!_active) return;
    _timer = setTimeout(_showHint, IDLE_MS);
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
