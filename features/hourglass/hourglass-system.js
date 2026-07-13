// ════════════════════════════════════════════════════════
//  KUM SAATİ SİSTEMİ
// ════════════════════════════════════════════════════════

/** At yürüyüşü — kum saati rota yöneticisi
 *
 * Kum saati tahtada at hamlesiyle (L şekli) yukarıdan aşağıya ilerler.
 * state.hourglassKnight = { r, c, path[], step } olarak saklanır.
 *
 * Hamle önceliği: önce aşağı giden (dr>0), sonra yana (dr=0),
 * en son yukarı (dr<0, çıkmaz durumunda). 
 * Alt sırada ise sütun yönünde sıfırlanır (yeni tur başlar).
 */

const KNIGHT_MOVES_DOWN = [
  [2,  1], [2, -1],   // 2 aşağı + 1 yan — en güçlü ilerleme
  [1,  2], [1, -2],   // 1 aşağı + 2 yan
  [0,  0],            // placeholder — kullanılmaz, aşağıdaki filtreden geçer
];
const KNIGHT_MOVES_ALL = [
  [2,  1],[2, -1],[1,  2],[1, -2],
  [-1, 2],[-1,-2],[-2, 1],[-2,-1],
];

function _knightNextCell(fromR, fromC, gc, visited) {
    // Öncelik sırası: daha çok aşağı > az aşağı > yana > yukarı
  const candidates = [];

  for (const [dr, dc] of KNIGHT_MOVES_ALL) {
    const nr = fromR + dr, nc = fromC + dc;
    if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
    const nk = cellKey(nr, nc);

    // Engel, hediye, element, başka kum saati, null hücre olamaz
    if (gc.blockers.has(nk) || gc.gifts.has(nk) || gc.elements.has(nk) || gc.hourglasses.has(nk)) continue;
    if (gc.board.getCell(nr, nc) === null) continue;

    // Son 6 ziyaret edilen kareye dönme (döngü engeli)
    const recentKey = `${nr},${nc}`;
    if (visited && visited.has(recentKey)) continue;

    // Skor: aşağı = +10, aynı satır = +2, yukarı = -5
    // Ayrıca sütun ortasına yakın = +3 (oyuncunun baktığı yer)
    const rowScore   = dr > 0 ? 10 + dr * 3 : dr === 0 ? 2 : -5;
    const centerBonus = (GRID/2) - Math.abs(nc - (GRID-1)/2);
    // Komşu hücre sayısı bonusu (patlama için iyi konum)
    let neighborBonus = 0;
    for (const [er,ec] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const er2=nr+er, ec2=nc+ec;
      if (er2>=0&&er2<GRID&&ec2>=0&&ec2<GRID&&gc.board.getCell(er2,ec2)!==null) neighborBonus++;
    }

    candidates.push({ r:nr, c:nc, score: rowScore + centerBonus + neighborBonus });
  }

  if (!candidates.length) return null;
  // En yüksek skorlu + küçük rastgele varyasyon
  candidates.sort((a, b) => b.score - a.score);
  const topN = candidates.slice(0, Math.min(3, candidates.length));
  return topN[Math.floor(Math.random() * topN.length)];
}

function _hourglassBestCell() {
  const gc = state.gc;
  if (!gc || gc.status !== "in_progress") return null;

  
  // İlk çağrı — at yürüyüşünü başlat
  if (!state.hourglassKnight) {
    const startRow = Math.floor(Math.random() * 2);
    const startCol = Math.floor(Math.random() * GRID);
    state.hourglassKnight = { r: startRow, c: startCol, visited: new Set(), step: 0 };
  }

  const knight = state.hourglassKnight;

  // Maksimum 20 deneme — her seferinde bir sonraki at hamlesini dene
  for (let attempt = 0; attempt < 20; attempt++) {
    const { r, c } = knight;
    const k = cellKey(r, c);

    // Bu hücre yerleştirmeye uygun mu?
    const ok = !gc.blockers.has(k) && !gc.gifts.has(k) &&
               !gc.elements.has(k) && !gc.hourglasses.has(k) &&
               gc.board.getCell(r, c) !== null;

    if (ok) {
      // Uygun! Bu pozisyonu kaydet ve bir sonraki at hamlesini hazırla
      const result = { r, c };

      // Bir sonraki at pozisyonunu önceden hesapla (ziyaret'e ekle)
      knight.visited.add(`${r},${c}`);
      const next = _knightNextCell(r, c, gc, knight.visited);

      if (next) {
        knight.r = next.r;
        knight.c = next.c;
        knight.step++;
      } else {
        // Çıkmaz veya alt satır → yeni tur, farklı başlangıç
        knight.r = Math.floor(Math.random() * 2);
        knight.c = (c + 3 + Math.floor(Math.random() * 3)) % GRID;
        knight.visited = new Set();
        knight.step = 0;
      }

      // Ziyaret geçmişini kırp
      if (knight.visited.size > 30) {
        const arr = [...knight.visited].slice(-20);
        knight.visited = new Set(arr);
      }

      return result;
    }

    // Bu hücre uygun değil — bir sonraki at hamlesine atla
    knight.visited.add(`${r},${c}`);
    const next = _knightNextCell(r, c, gc, knight.visited);
    if (next) {
      knight.r = next.r;
      knight.c = next.c;
    } else {
      // Sıfırla
      knight.r = Math.floor(Math.random() * 2);
      knight.c = Math.floor(Math.random() * GRID);
      knight.visited = new Set();
      knight.step = 0;
    }
  }

  // Hiç uygun hücre bulunamadı — fallback
  return null;
}




/** Kum saati patlama overlay efekti
 * innerHTML değişiminden bağımsız — board grid üzerine absolute div'ler ekler.
 * CSS animasyonu kesilmez çünkü bu div'ler renderBoardOnly tarafından silinmez.
 */
function _showHourglassBlastOverlay(centerR, centerC, mode, blasted) {
  const container = document.getElementById("f9-board-container");
  if (!container) return;

  // Eski overlay'leri temizle — body'deki tüm hg-overlay'ler
  document.querySelectorAll(".f9-hg-overlay").forEach(el => el.remove());

  // Container'ın ekrandaki pozisyonunu al
  // renderBoardOnly() container.innerHTML'i yeniden yazıyor — bu yüzden
  // overlay'ler container'a DEĞİL document.body'e ekleniyor (render'dan etkilenmesin)
  const rect = container.getBoundingClientRect();
  const cellW = rect.width / 8;
  const cellH = rect.height / 8;

  F9Debug.log("hourglass", `Overlay BASLADI: ${blasted.size} hucre mod=${mode} merkez=(${centerR},${centerC})`, {
    w: Math.round(rect.width), h: Math.round(rect.height),
    top: Math.round(rect.top), left: Math.round(rect.left)
  });

  if (rect.width === 0 || rect.height === 0) {
    F9Debug.err("Overlay: container w/h=0, efekt gorunmeyecek!", {w:rect.width, h:rect.height});
  }

  let _added = 0;
  const _ovRefs = [];  // temizleme için referans listesi
  // DocumentFragment: tüm overlay div'leri önce fragmana ekle, sonra body'e tek hamle bas
  const _ovFrag = document.createDocumentFragment();

  blasted.forEach(bk => {
    const [br, bc] = bk.split(",").map(Number);
    const dist = Math.abs(br - centerR) + Math.abs(bc - centerC);
    const delay = Math.min(dist * 40, 240);
    const ov = document.createElement("div");
    ov.className = "f9-hg-overlay" + (mode === "big" ? " f9-hg-overlay-big" : "");

    // document.body'e fixed pozisyonla ekle — render()'dan etkilenmez
    ov.style.position  = "fixed";
    ov.style.left      = (rect.left + bc * cellW) + "px";
    ov.style.top       = (rect.top  + br * cellH) + "px";
    ov.style.width     = cellW + "px";
    ov.style.height    = cellH + "px";
    ov.style.borderRadius    = "5px";
    ov.style.pointerEvents   = "none";
    ov.style.zIndex          = "9999";
    ov.style.background      = "#FFFFFF";
    ov.style.boxShadow       = "0 0 20px 6px #FFFFFF";
    ov.style.animationName          = mode === "big" ? "f9-hg-blast-big" : "f9-hg-blast";
    ov.style.animationDuration      = mode === "big" ? "1.3s" : "1.0s";
    ov.style.animationTimingFunction = "cubic-bezier(0.34,1.56,0.64,1)";
    ov.style.animationDelay         = delay + "ms";
    ov.style.animationFillMode      = "both";
    ov.style.animationIterationCount = "1";

    _ovFrag.appendChild(ov);   // fragmana ekle (henüz DOM'a değil)
    _ovRefs.push(ov);
    _added++;
  });
  document.body.appendChild(_ovFrag); // TEK DOM hamlesi — tüm overlay'ler bir anda

  F9Debug.log("hourglass", `Overlay EKLENDI: ${_added} div (body'e fixed)`);

  // 1500ms sonra temizle — body'de olduğu için render() silemiyor
  setTimeout(() => {
    _ovRefs.forEach(el => el.remove());
    // Artık kazara kalanlar da silinsin
    document.querySelectorAll(".f9-hg-overlay").forEach(el => el.remove());
    F9Debug.log("hourglass", `Overlay TEMIZLENDI: ${_added} div silindi`);
  }, F9_CONFIG.ANIM.HOURGLASS_TOTAL);
}

function showFloatingText(msg, type) {
  const colors = {info:"#7B5CF6",combo:"#E0B23C",jackpot:"#E04B4B",blast:"#4FB87A"};
  const c = colors[type] || colors.info;
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `position:fixed;top:28%;left:50%;transform:translateX(-50%);
    background:${c}22;border:1px solid ${c};color:${c};padding:8px 18px;
    border-radius:10px;font-size:14px;font-weight:700;z-index:9999;
    pointer-events:none;white-space:nowrap;animation:floatUp 1.8s ease forwards`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
  F9Debug.log("ui", msg, {type});
}

/** Kum saati patlaması — merkez (r,c), mod: "small"|"big" */
function triggerHourglassBlast(r, c, mode) {
  F9Debug.log("hourglass", `Kum saati patlıyor (${r},${c}) mod=${mode}`);
  const gc = state.gc;
  if (!gc) { F9Debug.err("triggerHourglassBlast: gc null"); return; }
  const k = cellKey(r, c);

  // Timer'ı temizle
  const hg = gc.hourglasses?.get(k);
  if (hg) {
    clearTimeout(hg.timerId);
    clearTimeout(hg.warnId);
  }
  gc.hourglasses?.delete(k);

  const blasted = new Set();

  if (mode === "big") {
    for (let rr = 0; rr < GRID; rr++)
      for (let cc = 0; cc < GRID; cc++)
        blasted.add(cellKey(rr, cc));
  } else {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID)
          blasted.add(cellKey(nr, nc));
      }
  }

  let pts = mode === "big" ? HOURGLASS_POINTS_BIG : HOURGLASS_POINTS_SMALL;

  // Menüyü kapat
  state.pendingOptions = null;
  state.selected       = null;
  state.neighbors      = [];

  // ── OVERLAY EFEKTİ: innerHTML'den bağımsız patlama animasyonu ──
  // renderBoardOnly innerHTML'i yeniden yazıyor — bu animasyonu keser
  // Çözüm: board grid üzerine position:absolute overlay divler ekle
  _showHourglassBlastOverlay(r, c, mode, blasted);

  const msgBase = mode === "big" ? "⏳ Kum Saati +9 — Tüm Tahta Patladı!" : "⏳ Kum Saati Patladı!";
  showFloatingText(msgBase, mode === "big" ? "jackpot" : "combo");
  playSound(mode === "big" ? "jackpot" : "blast");

  // ── 400ms sonra hücreleri sil + puan ekle + refill ──
  setTimeout(() => {
    blasted.forEach(bk => {
      const [br, bc] = bk.split(",").map(Number);
      if (gc.blockers.has(bk)) { gc.blockers.delete(bk); pts += 30; }
      gc.gifts?.delete(bk);
      gc.elements?.delete(bk);
      if (gc.board.cells[br]) gc.board.cells[br][bc] = null;
    });

    gc.score += pts;
    if (mode === "big" && gc.energyTracker) gc.energyTracker.add(HOURGLASS_ENERGY_BIG);
    F9Debug.log("score", `Kum saati patlama puanı: +${pts} (toplam: ${gc.score})`);
    showFloatingText(`+${pts}`, "score");

    // Refill
    for (let rr = 0; rr < GRID; rr++)
      for (let cc = 0; cc < GRID; cc++)
        if (gc.board.cells[rr]?.[cc] === null && !gc.blockers.has(cellKey(rr,cc)))
          gc.board.cells[rr][cc] = gc.board.pickValueAvoidingNeighbors
            ? gc.board.pickValueAvoidingNeighbors(rr, cc)
            : (Math.floor(gc.rng() * 8) + 1);

    checkAndTransition();
    render();

    // F9Anim — yeni gelen sayılar yukarıdan düşsün
    requestAnimationFrame(() => {
      const _blastedArr = [...blasted].map(bk => bk.split(',').map(Number));
      // Şok dalgası — merkez
      F9Anim.shockwave(r, c, mode === "big" ? "#FFD70099" : "#A78BFA88");
      // Fall-in: merkezden uzaklığa göre kademeli gecikme
      _blastedArr.forEach(([br, bc]) => {
        const dist = Math.abs(br - r) + Math.abs(bc - c);
        const delay = dist * 25;
        const el = document.querySelector(`[data-r="${br}"][data-c="${bc}"]`);
        if (el) F9Anim.fallIn(el, delay);
      });
    });
  }, 1400);
}

/** Kum saatini bir hücreye yerleştir */
function placeHourglass() {
  const gc = state.gc;
  if (!gc || gc.status !== "in_progress") return;
  if (gc.hourglasses.size >= HOURGLASS_MAX_COUNT) return;
  F9Debug.log("hourglass", "Kum saati yerleştiriliyor...", {knight: state.hourglassKnight});

  // Hamle yüzdesi kontrolü
  const movePct = gc.movesLimit ? gc.movesUsed / gc.movesLimit : 0;
  if (movePct < HOURGLASS_MIN_MOVE) return;

  const cell = _hourglassBestCell();
  if (!cell) return;

  const { r, c } = cell;
  const k = cellKey(r, c);

  // Zorluk bazlı süre
  const tier = state.cfg?.tier || "orta";
  const duration = DIFF_DURATION[tier] || HOURGLASS_DURATION_MS;

  // Warn timer (son 3 saniye)
  const warnId = setTimeout(() => {
    const hg = gc.hourglasses.get(k);
    if (hg) { hg.warn = true; renderBoardOnly(); }
  }, Math.max(0, duration - HOURGLASS_WARN_MS));

  // Patlama timer
  const timerId = setTimeout(() => {
    if (gc.status !== "in_progress") return;
    triggerHourglassBlast(r, c, "small");
  }, duration);

  gc.hourglasses.set(k, { r, c, startTime: Date.now(), duration, timerId, warnId, warn: false });
  state.hourglassTimers.push(timerId);
  state.hourglassWarnTimers.push(warnId);

  // Geri sayım göstergesini sürekli güncelle
  const refreshId = setInterval(() => {
    if (!gc.hourglasses.has(k)) { clearInterval(refreshId); return; }
    renderBoardOnly();
  }, 500);
  state._animTimeouts.push(refreshId);

  renderBoardOnly();
  showFloatingText("⏳ Kum Saati Belirdi!", "info");
}

/** handleCellClick içinden çağrılır — hourglass eşleşmesi */
function handleHourglassMatch(hgR, hgC, otherVal) {
  const gc = state.gc;
  const k = cellKey(hgR, hgC);
  if (!gc?.hourglasses?.has(k)) return;

  gc._pushSnapshot(); // geri al için kum saati patlamasından önceki durumu kaydet

  // Sayacı durdur
  const hg = gc.hourglasses.get(k);
  clearTimeout(hg.timerId);
  clearTimeout(hg.warnId);

  state.pendingOptions = null;
  state.selected = null;
  state.neighbors = [];

  if (otherVal === 9) {
    triggerHourglassBlast(hgR, hgC, "big");
  } else {
    triggerHourglassBlast(hgR, hgC, "small");
  }
  gc.movesUsed += 1;
}

/** Oyun başında/bitişinde tüm hourglass timer'larını temizle */
function clearAllHourglassTimers() {
  (state.hourglassTimers || []).forEach(id => clearTimeout(id));
  (state.hourglassWarnTimers || []).forEach(id => clearTimeout(id));
  state.hourglassTimers = [];
  state.hourglassWarnTimers = [];
  if (state.gc?.hourglasses) state.gc.hourglasses.clear();
  state.hourglassKnight = null; // at yürüyüşü sıfırla
}

// ════════════════════════════════════════════════════════
//  KUM SAATİ SİSTEMİ SON
// ════════════════════════════════════════════════════════
