// Bölüme göre dalga hızı (her N hamlede 1 satır)
function waveInterval(chapter) {
  if (chapter <= 5)  return 8;   // yavaş
  if (chapter <= 10) return 5;   // orta
  if (chapter <= 15) return 3;   // hızlı
  return 2;                      // efsane — çok hızlı
}

const F9Wave = (() => {
  let _active   = false;   // bu levelde dalga aktif mi?
  let _power    = 0;       // biriken kırma gücü
  let _interval = 5;       // kaç hamlede bir dalga ilerliyor
  let _chapter  = 1;

  // Dalga aktifleştir (level başında çağrılır)
  function activate(chapter) {
    _active   = true;
    _chapter  = chapter;
    _interval = waveInterval(chapter);
    _power    = 0;
  }

  function deactivate() { _active = false; _power = 0; }
  function isActive()   { return _active; }
  function getPower()   { return _power; }

  // Eşleşme grubuna göre güç biriktir, sonra engel kır
  function onMatch(group, gc) {
    if (!_active || !gc) return;
    const gained = WAVE_BREAK_POWER[group] || 0;
    _power += gained;
    F9Debug.log("game", `[DALGA] Eşleşme ${group} → +${gained} güç (toplam:${_power})`);
    _breakBlockers(gc);
  }

  // Güce göre dalga satırındaki engelleri kır
  function _breakBlockers(gc) {
    if (_power <= 0) return;
    const waveR = _getWaveRow(gc);
    if (waveR < 0) return;

    let spent = 0;
    for (let c = 0; c < GRID && _power > 0; c++) {
      const k = cellKey(waveR, c);
      if (!gc.blockers.has(k)) continue;
      const tile = gc.blockers.get(k);
      const bType = tile?.blockerType;

      // Güçlü engel → önce normale iner
      if (bType === BLOCKER_STEEL || bType === BLOCKER_COPPER) {
        if (_power >= WAVE_STRONG_COST) {
          _power -= WAVE_STRONG_COST;
          // Bir katman kır (hit)
          // Hit: güçlü engeldir, bir katman düşür
          if (tile.blockerType === BLOCKER_STEEL) tile.blockerType = BLOCKER_COPPER;
          else if (tile.blockerType === BLOCKER_COPPER) gc.blockers.delete(k);
          else gc.blockers.delete(k);
          spent++;
          F9Debug.log("game", `[DALGA] Güçlü engel zayıflatıldı (${waveR},${c})`);
        }
      } else {
        // Normal engel — direkt kır
        if (_power >= WAVE_BLOCKER_COST) {
          _power -= WAVE_BLOCKER_COST;
          gc.blockers.delete(k);
          spent++;
          F9Debug.log("game", `[DALGA] Engel kırıldı (${waveR},${c})`);
        }
      }
    }
    if (spent > 0) {
      gc._refillInPlace();
    }
  }

  // Dalga ilerletme — yeni engel satırı ekle, yukarı kaydır
  function advance(gc) {
    if (!_active || !gc) return false;

    // Tüm blockerleri bir satır yukarı kaydır
    const newBlockers = new Map();
    let reachedTop = false;

    gc.blockers.forEach((tile, k) => {
      const [r, c] = k.split(',').map(Number);
      const newR = r - 1;
      if (newR < 0) {
        reachedTop = true;
        return; // bu engel üst sınırı aştı
      }
      newBlockers.set(cellKey(newR, c), tile);
    });

    // Yeni alt satır (satır 7) — engeller
    const newRow = GRID - 1;
    const rng = gc.rng;
    for (let c = 0; c < GRID; c++) {
      const k = cellKey(newRow, c);
      // Hediye/element/kum saati olan hücreye dalga engeli koyma
      if (gc.gifts.has(k) || gc.elements.has(k) || gc.hourglasses.has(k)) continue;
      const isStrong = (typeof rng === 'function' ? rng() : Math.random()) < WAVE_STRONG_RATIO;
      const bType = isStrong ? BLOCKER_STEEL : BLOCKER_WOOD;
            // Basit dalga engeli
      newBlockers.set(k, { blockerType: bType });
      gc.board.cells[newRow][c] = null; // blocker koyulacak, değer temizlendi
    }

    gc.blockers = newBlockers;

    // null hücreleri doldur — aksi halde GameCore null erişimde patlar
    // Blocker olan hücreler null kalır (doğru), boş kalanlar yeni değer alır
    for (let c = 0; c < GRID; c++) {
      const k = cellKey(newRow, c);
      if (gc.board.cells[newRow][c] === null && !gc.blockers.has(k)) {
        // Blocker değil ama null — yeni rastgele sayı ver
        gc.board.cells[newRow][c] = gc.board.pickValueAvoidingNeighbors
          ? gc.board.pickValueAvoidingNeighbors(newRow, c)
          : (Math.ceil((typeof gc.rng==='function'?gc.rng():Math.random()) * 8));
      }
    }

    if (reachedTop) {
      F9Debug.log("game", "[DALGA] GAME OVER — engel üst satıra ulaştı!");
      return "gameover";
    }

    F9Debug.log("game", `[DALGA] Satır kaydı — yeni engel satırı eklendi`);
    return true;
  }

  // ── ÇİKOLATA MANTIĞI — engel yayılması ──────────────
  // Eğer oyuncu bir hamlede engel etrafında hiç eşleşme yapmadıysa
  // engel rastgele bir komşu hücreye yayılır (bölüm 10+)
  function spreadBlockers(gc, matchedCells) {
    if (!gc || !_active) return 0;
    if (_chapter < 10) return 0; // sadece bölüm 10'dan itibaren

    const matchSet = new Set((matchedCells||[]).map(([r,c])=>cellKey(r,c)));
    const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
    const rng = typeof gc.rng === 'function' ? gc.rng : Math.random;
    let spread = 0;

    gc.blockers.forEach((tile, k) => {
      const [r,c] = k.split(',').map(Number);
      // Bu engelin etrafında eşleşme yapılmış mı?
      const nearMatch = DIRS.some(([dr,dc]) => matchSet.has(cellKey(r+dr,c+dc)));
      if (nearMatch) return; // koruma — etrafında eşleşme var, yayılmıyor

      // Yayılma olasılığı: bölüme göre artar
      const prob = Math.min(0.30, (_chapter - 9) * 0.05);
      if ((typeof rng === 'function' ? rng() : Math.random()) > prob) return;

      // Rastgele boş komşu hücre seç
      const candidates = DIRS
        .map(([dr,dc]) => [r+dr, c+dc])
        .filter(([nr,nc]) =>
          nr>=0 && nr<GRID && nc>=0 && nc<GRID &&
          !gc.blockers.has(cellKey(nr,nc)) &&
          !gc.gifts.has(cellKey(nr,nc)) &&
          !gc.hourglasses.has(cellKey(nr,nc)) &&
          !gc.elements.has(cellKey(nr,nc))
        );

      if (!candidates.length) return;
      const [tr,tc] = candidates[Math.floor((typeof rng==='function'?rng():Math.random())*candidates.length)];
      const tk = cellKey(tr,tc);
      const bType = tile?.blockerType || tile || BLOCKER_WOOD;
      gc.blockers.set(tk, { blockerType: BLOCKER_WOOD }); // yeni engel zayıf
      gc.board.cells[tr][tc] = null;
      spread++;
      F9Debug.log("game", `[ÇIKOLATA] Engel yayıldı (${r},${c})→(${tr},${tc})`);
    });

    return spread;
  }

  return { activate, deactivate, isActive, onMatch, advance, spreadBlockers, status, getPower };

  // Dalganın şu anki en üst engel satırını bul
  function _getWaveRow(gc) {
    let minR = GRID;
    gc.blockers.forEach((_, k) => {
      const r = parseInt(k.split(',')[0]);
      if (r < minR) minR = r;
    });
    return minR < GRID ? minR : -1;
  }

  // UI için dalga durumu
  function status(gc) {
    const row = gc ? _getWaveRow(gc) : -1;
    return {
      active: _active,
      power: _power,
      waveRow: row,
      danger: row >= 0 && row <= 2, // tehlike: üstten 2. satıra geldi
      interval: _interval,
    };
  }

  return { activate, deactivate, isActive, onMatch, advance, status, getPower };
})();


// ══════════════════════════════════════════════════════
// F9 İPUCU SİSTEMİ — "Flow State" Yöneticisi
// Oyuncu 8+ saniye hamle yapmazsa en iyi hücre çifti
// hafifçe parlar. Oyuncu "kendi buldu" hisseder.
// ══════════════════════════════════════════════════════
