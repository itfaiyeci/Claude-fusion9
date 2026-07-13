const F9Difficulty = (() => {

  // ── FIRSAT ANALİZİ ───────────────────────────────────
  // Tahtadaki tüm komşu çift kombinasyonlarını analiz eder
  // Her çiftin "kaç hamlede 9 üretilebilir" derinliğini hesaplar

  function _canMakeNine(a, b) {
    // İki sayı direkt 9 üretebiliyor mu? (1. derece)
    if (!a || !b) return false;
    const ops = GameCore.validOps(a, b);
    return ops.some(o => o.value === 9);
  }

  function _degree1Count(gc) {
    // Tahtadaki 1. derece fırsat sayısı
    // (komşu iki sayı direkt 9 yapabiliyor)
    let count = 0;
    const size = gc.board.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = cellKey(r, c);
        if (gc.blockers.has(k) || gc.gifts.has(k) || gc.elements.has(k)) continue;
        const v1 = gc.board.getCell(r, c);
        if (!v1) continue;
        for (const [dr, dc] of [[0,1],[1,0]]) {
          const r2 = r+dr, c2 = c+dc;
          if (r2>=size || c2>=size) continue;
          const k2 = cellKey(r2, c2);
          if (gc.blockers.has(k2) || gc.gifts.has(k2) || gc.elements.has(k2)) continue;
          const v2 = gc.board.getCell(r2, c2);
          if (v2 && _canMakeNine(v1, v2)) count++;
        }
      }
    }
    return count;
  }

  function _degree2Count(gc) {
    // 2. derece fırsat: A ile komşusu birleşince ara değer üretilir
    // o ara değer + başka bir komşu = 9
    let count = 0;
    const size = gc.board.size;
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = cellKey(r, c);
        if (gc.blockers.has(k) || gc.gifts.has(k)) continue;
        const v1 = gc.board.getCell(r, c);
        if (!v1) continue;

        // v1 ile komşu v2 birleşince ops üretir
        for (const [dr, dc] of dirs) {
          const r2 = r+dr, c2 = c+dc;
          if (r2<0||r2>=size||c2<0||c2>=size) continue;
          const v2 = gc.board.getCell(r2, c2);
          if (!v2) continue;
          const ops12 = GameCore.validOps(v1, v2);
          for (const op of ops12) {
            const intermediate = op.value; // bu ara değer (r2,c2)'ye yerleşir
            // Şimdi (r2,c2) = intermediate oldu — etrafındaki komşulardan biriyle 9 yapılabilir mi?
            for (const [dr2, dc2] of dirs) {
              const r3 = r2+dr2, c3 = c2+dc2;
              if (r3<0||r3>=size||c3<0||c3>=size) continue;
              if (r3===r && c3===c) continue; // kaynak
              const k3 = cellKey(r3, c3);
              if (gc.blockers.has(k3) || gc.gifts.has(k3)) continue;
              const v3 = gc.board.getCell(r3, c3);
              if (v3 && _canMakeNine(intermediate, v3)) {
                count++;
              }
            }
          }
        }
      }
    }
    return Math.floor(count / 4); // normalize (aşırı sayım var)
  }

  // ── OYUNCU TARZ ANALİZİ ──────────────────────────────
  const _stats = {
    movesThisLevel: 0,
    ninesMade: 0,
    degree1Used: 0,
    degree2Used: 0,
    interventions: 0,
    interventionMoves: [],
    levelHistory: [], // {level, degree1Avg, degree2Avg, won, interventions}
  };

  function _resetLevel() {
    _stats.movesThisLevel = 0;
    _stats.ninesMade = 0;
    _stats.degree1Used = 0;
    _stats.degree2Used = 0;
    _stats.interventions = 0;
    _stats.interventionMoves = [];
  }

  // ── CANLI MÜDAHALE ────────────────────────────────────
  // Sıkışan oyuncuya SESSIZCE yardım et:
  //   - Tahtada 1. derece fırsat yoksa: bir hücreye "uygun" değer koy
  //   - Oyuncu fark etmez, his bozulmaz
  //   - Direktör kaydeder

  function _intervene(gc) {
    const size = gc.board.size;
    // Boş (null değil ama 9 komşusu olmayan) hücrelerden birini bul
    const candidates = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = cellKey(r, c);
        if (gc.blockers.has(k) || gc.gifts.has(k) || gc.elements.has(k)) continue;
        const v = gc.board.getCell(r, c);
        if (!v || v === 9) continue;
        // Bu hücreye komşu olan sayıları bul
        for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
          const r2 = r+dr, c2 = c+dc;
          if (r2<0||r2>=size||c2<0||c2>=size) continue;
          const k2 = cellKey(r2, c2);
          if (gc.blockers.has(k2) || gc.gifts.has(k2)) continue;
          const v2 = gc.board.getCell(r2, c2);
          if (!v2) continue;
          // v ile v2 zaten 9 yapıyor mu? Yapıyorsa bu hücreyi öner
          if (_canMakeNine(v, v2)) {
            candidates.push({r, c, v, r2, c2, v2, score: Math.random()});
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Zaten fırsat var — müdahale gerekmez
      return false;
    }

    // Fırsat yok — en uygun hücreyi bul ve 9'a tamamlayan komşu değer koy
    const freeCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = cellKey(r, c);
        if (gc.blockers.has(k) || gc.gifts.has(k) || gc.elements.has(k)) continue;
        const v = gc.board.getCell(r, c);
        if (!v) continue;
        // Bu hücreye komşu var mı?
        for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
          const r2 = r+dr, c2 = c+dc;
          if (r2<0||r2>=size||c2<0||c2>=size) continue;
          const k2 = cellKey(r2, c2);
          if (gc.blockers.has(k2) || gc.gifts.has(k2)) continue;
          const v2 = gc.board.getCell(r2, c2);
          if (!v2) continue;
          // (r,c)=v için tamamlayıcı değer: 9-v (sadece 1-8 arası)
          const complement = 9 - v;
          if (complement >= 1 && complement <= 8) {
            freeCells.push({r: r2, c: c2, newVal: complement, targetR: r, targetC: c});
          }
        }
      }
    }

    if (freeCells.length === 0) return false;

    // En uygun hücreyi seç (orta bölgeyi tercih et)
    const _gc = Math.floor((GRID - 1) / 2); // tam sayı merkez (8→3, 6→2, 10→4)
    freeCells.sort((a, b) => {
      const distA = Math.abs(a.r - _gc) + Math.abs(a.c - _gc);
      const distB = Math.abs(b.r - _gc) + Math.abs(b.c - _gc);
      return distA - distB;
    });

    const target = freeCells[0];
    gc.board.cells[target.r][target.c] = target.newVal;
    _stats.interventions++;
    _stats.interventionMoves.push(gc.movesUsed);
    F9Debug.log("game", `[ZORlUK] Müdahale: (${target.r},${target.c})=${target.newVal} → (${target.targetR},${target.targetC})=${gc.board.getCell(target.targetR, target.targetC)} ile 1.derece fırsat`, {move: gc.movesUsed});
    return true;
  }

  // ── ANA FONKSİYON — Her hamlede çağrılır ────────────
  function observe(gc, outcome) {
    if (!gc || gc.status !== "in_progress") return;
    _stats.movesThisLevel++;

    // 9 yapıldı mı?
    const lmp = gc.lastMovePos;
    if (lmp && gc.board.getCell(lmp[0], lmp[1]) === 9) {
      _stats.ninesMade++;
    }

    // Mevcut fırsat analizi
    const d1 = _degree1Count(gc);
    const d2 = _degree2Count(gc);

    // Müdahale kararı:
    // - 1. derece fırsat = 0 ve oyuncu kalan hamlelerinin %25'inden azı kaldıysa
    // - veya arka arkaya 3 hamlede hiç 9 üretilmediyse ve fırsat çok azsa
    const movesLeft = gc.movesLeft || 0;
    const movesLimit = gc.movesLimit || 1;
    const criticalPhase = movesLeft <= Math.ceil(movesLimit * 0.30);
    const stuckSignal = d1 === 0 && (criticalPhase || _stats.movesThisLevel > 4);

    if (stuckSignal) {
      _intervene(gc);
    }

    return { d1, d2, interventions: _stats.interventions };
  }

  function levelStart() { _resetLevel(); }

  function levelEnd(won, gc) {
    const d1Avg = _stats.movesThisLevel > 0 ? _degree1Count(gc) : 0;
    _stats.levelHistory.push({
      won, interventions: _stats.interventions,
      moves: _stats.movesThisLevel,
      nines: _stats.ninesMade,
    });
    if (_stats.levelHistory.length > 30) _stats.levelHistory.shift();
  }

  // ── RAPOR (Direktör için) ─────────────────────────────
  function report(gc) {
    if (!gc) return null;
    const d1 = _degree1Count(gc);
    const d2 = _degree2Count(gc);
    const hist = _stats.levelHistory;
    const recentWins = hist.filter(h => h.won).length;
    const recentIntervs = hist.reduce((s,h) => s+h.interventions, 0);
    return {
      degree1Now: d1,
      degree2Now: d2,
      movesThisLevel: _stats.movesThisLevel,
      interventionsThisLevel: _stats.interventions,
      recentWinRate: hist.length ? recentWins/hist.length : null,
      recentInterventions: recentIntervs,
      difficulty: d1 === 0 ? "kritik" : d1 <= 2 ? "zor" : d1 <= 5 ? "orta" : "kolay",
    };
  }

  function getStats() { return _stats; }

  return { observe, levelStart, levelEnd, report, getStats,
           degree1Count: _degree1Count, degree2Count: _degree2Count };
})();

// ══════════════════════════════════════════════════════
// F9 OTONOM TEST BOTU — Gerçek JS Motoru Üzerinde
// localStorage.setItem("f9bot","1") ile aktif et
// Debug panelinde 🤖 Direktör → Bot Testi butonu
// ══════════════════════════════════════════════════════
