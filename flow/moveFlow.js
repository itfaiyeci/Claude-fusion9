// [Oturum 22 — flow/ katmanı ayrımı] Hücre tıklama / hamle seçim akışı.
// core/game-engine.js'ten TAŞINDI (bkz. HANDOFF.md "Flow Katmanı Eksik").
// Diğer flow/ dosyaları gibi ortak IIFE içinde yüklendiği için `state`,
// `GameCore`, `cellKey`, `F9Hint` gibi üst-seviye tanımlara erişebiliyor.
// SORUMLULUK: oyuncunun hücre seçimlerini işlemek — 1./2. seçim, komşuluk
// kontrolü, getMoveOptions() sonucuna göre ya doğrudan executeMove()'a
// (flow/rewardFlow.js) devretmek ya da seçenek menüsünü açmak. Level
// girişi flow/levelFlow.js'te, level sonu geçişleri flow/transitionFlow.js'te.

function handleCellClick(r, c) {
  const gc = state.gc;
  // Screen game değilse sessizce yut (win/lose animasyonu sürerken tıklama)
  if (state.screen !== "game") return;
  // Dokunma toleransı: blocker üzerine basıldıysa en yakın boş hücreye snap
  if (gc && gc.blockers.has(cellKey(r,c))) {
    for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<GRID&&nc>=0&&nc<GRID&&!gc.blockers.has(cellKey(nr,nc))) {
        r=nr; c=nc; break;
      }
    }
  }
  // İpucu: oyuncu harekete geçti, glowu temizle
  if (typeof F9Hint !== "undefined") F9Hint.onMove();
  if (!gc || gc.status !== "in_progress") {
    // won/lost: geçiş animasyonu sürerken sessiz engelle
    if (!gc || gc.status === "won" || gc.status === "lost") return;
    // Beklenmedik durum → uyar
    F9Debug.warn(`handleCellClick: gc.status=${gc?.status} screen=${state.screen} (${r},${c})`);
    return;
  }
  F9Debug.log("move", `Hücre seçildi (${r},${c})`, {
    val:gc.board.getCell(r,c), selected:state.selected,
    gift:!!gc.gifts?.has(cellKey(r,c)), hg:!!gc.hourglasses?.has(cellKey(r,c))
  });
  if (state.pendingOptions) return;

  if (!state.selected) {
    // 1. seçim — gerçekten boş hücreler seçilemez.
    // Hediye/element/kum saati/ENGEL hücrelerinde board değeri null
    // olabilir ama bunlar geçerli, görünür simgelerdir.
    const _selVal = gc.board.getCell(r, c);
    const _selKey = cellKey(r, c);
    const _hasContent = _selVal !== null ||
      gc.hourglasses?.has(_selKey) || gc.gifts?.has(_selKey) ||
      gc.elements?.has(_selKey)   || gc.blockers?.has(_selKey);
    if (!_hasContent) {
      F9Debug.warn(`Gerçekten boş hücre seçimi engellendi (${r},${c})`);
      return;
    }
    state.selected = [r, c];
    state.neighbors = [
      [r-1,c],[r+1,c],[r,c-1],[r,c+1]
    ].filter(([nr,nc])=>nr>=0&&nr<8&&nc>=0&&nc<8);
    state.message = "";
    playSound("touch");
    renderBoardOnly();
    return;
  }

  const [r1, c1] = state.selected;
  if (r1 === r && c1 === c) {
    // Aynı hücreye tıklandı — seçimi iptal
    state.selected = null;
    state.neighbors = [];
    renderBoardOnly();
    return;
  }

  const isNeighbor = (Math.abs(r1 - r) === 1 && c1 === c) || (Math.abs(c1 - c) === 1 && r1 === r);
  if (!isNeighbor) {
    // Komşu değil — yeni 1. seçim
    state.selected = [r, c];
    state.neighbors = [
      [r-1,c],[r+1,c],[r,c-1],[r,c+1]
    ].filter(([nr,nc])=>nr>=0&&nr<8&&nc>=0&&nc<8);
    playSound("touch");
    renderBoardOnly();
    return;
  }

  const opts = gc.getMoveOptions(r1, c1, r, c);
  F9Debug.log("move", `getMoveOptions → ${opts.kind}`, {
    ops:opts.ops?.length??0, r1, c1, r2:r, c2:c,
    val1:gc.board.getCell(r1,c1), val2:gc.board.getCell(r,c),
    gift1: gc.gifts?.get(cellKey(r1,c1))?.giftType || false,
    gift2: gc.gifts?.get(cellKey(r,c))?.giftType || false,
    elem1: gc.elements?.get(cellKey(r1,c1))?.elementType || false,
    elem2: gc.elements?.get(cellKey(r,c))?.elementType || false,
    hg1:!!gc.hourglasses?.has(cellKey(r1,c1)), hg2:!!gc.hourglasses?.has(cellKey(r,c))
  });
  if (opts.kind === "blocked" || opts.kind === "invalid") {
    state.message = "Bu hücreler birleştirilemez.";
    state.selected = null;
    state.neighbors = [];
    renderBoardOnly();
    return;
  }
  if (opts.kind === "hourglass_nine" || opts.kind === "hourglass_normal") {
    const hgHas1 = gc.hourglasses?.has(cellKey(r1, c1));
    const hgR = hgHas1 ? r1 : r, hgC = hgHas1 ? c1 : c;
    const otherV = hgHas1 ? gc.board.getCell(r, c) : gc.board.getCell(r1, c1);
    handleHourglassMatch(hgR, hgC, otherV);
    state.selected = null; state.neighbors = [];
    checkAndTransition();
    return;
  }
  if (opts.kind === "combo" || opts.kind === "promotion" || opts.kind === "element_nine_break" || opts.kind === "lightning_lightning") {
    executeMove(r1, c1, r, c, null);
    return;
  }
  state.pendingOptions = { r1, c1, r2: r, c2: c, ops: opts.ops };
  renderBoardOnly();
  renderOptionsArea();
}


/** Ağaç engeli özel kuralı: normal eşleşme gerçekleşince bitişik ağaçları kır */
function _breakAdjacentWood(r1, c1, r2, c2) {
  const gc = state.gc;
  if (!gc) return [];
  const broken = [];
  const checked = new Set([`${r1},${c1}`, `${r2},${c2}`]);
  for (const [r, c] of [[r1,c1],[r2,c2]]) {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc;
      const nk = `${nr},${nc}`;
      if (nr<0||nr>=8||nc<0||nc>=8||checked.has(nk)) continue;
      checked.add(nk);
      const bl = gc.blockers.get(nk);
      if (bl && bl.blockerType === BLOCKER_WOOD) {
        gc.blockers.delete(nk);
        gc.score += 30;
        broken.push([nr, nc]);
        // Hücreye yeni sayı doldur (boş kalmasın)
        gc.board.cells[nr][nc] = gc.board.pickValueAvoidingNeighbors
          ? gc.board.pickValueAvoidingNeighbors(nr, nc)
          : (Math.floor(gc.rng() * 8) + 1);
      }
    }
  }
  // Refill sonrası ihlalleri çöz
  if (broken.length > 0 && gc.board.resolveRemainingViolations) {
    gc.board.resolveRemainingViolations();
  }
  return broken;
}
