// [Oturum 16 — ui/ katmanı] Ana render/tahta motoru.
// core/game-engine.js'ten taşındı — davranış BİREBİR AYNI.

function cellDisplay(r, c) {
  const gc = state.gc;
  const k = cellKey(r, c);
  if (!gc) return { type: "number", value: 1 }; // gc null guard
  if (gc.blockers.has(k)) {
    const b = gc.blockers.get(k);
    // Sis: altındaki sayıyı gizler
    if (b.blockerType === BLOCKER_FOG) {
      return { type: "blocker", blockerType: BLOCKER_FOG, hidden: true };
    }
    return { type: "blocker", blockerType: b.blockerType, layers: BLOCKER_LAYERS[b.blockerType]||1 };
  }
  if (gc.hourglasses && gc.hourglasses.has(k)) {
    const hg = gc.hourglasses.get(k);
    return { type: "hourglass", warn: hg.warn || false };
  }
  if (gc.gifts.has(k)) {
    const g = gc.gifts.get(k);
    return { type: "gift", giftType: g.giftType };
  }
  if (gc.elements.has(k)) {
    const e = gc.elements.get(k);
    return { type: "element", elementType: e.elementType };
  }
  const v = gc.board.getCell(r, c);
  return { type: "number", value: v };
}

function fmtTier(t) {
  const labels = { isinma: "Isınma", kolay: "Kolay", orta: "Orta", zor: "Zor", uzman: "Uzman", pro: "Pro" };
  return labels[t] || t;
}

function render() {
  if (state.screen !== _lastRenderedScreen) {
    F9Debug.log("ui", `render() screen değişti: ${_lastRenderedScreen} → ${state.screen}`);
    _lastRenderedScreen = state.screen;
  }
  // Ekran yönlendirme

  if (state.screen === "play_intro")    { renderPlayIntro();   return; }
  if (state.screen === "account")     { renderAccount();    return; }
  if (state.screen === "daily")       { renderDailyReward();return; }
  if (state.screen === "menu")        { renderMenu();       return; }
  if (state.screen === "map")         { renderMap();        return; }
  if (state.screen === "level_start") { renderLevelStart(); return; }
  if (state.screen === "league")      { renderLeague();     return; }
  if (state.screen === "howto")       { renderHowto();      return; }
  if (state.screen === "win")         { renderWin();        return; }
  if (state.screen === "lose")        { renderLose();       return; }
  if (state.screen === "reward")      { renderReward();     return; }

  const gc = state.gc, cfg = state.cfg;
  const movesLeft = gc ? gc.movesLeft : 0;
  if (!gc) { renderMenu(); return; }

  // Oyun bitti mi kontrol et — render döngüsünden önce
  if (checkAndTransition()) { render(); return; }

  // Lig sırası hesapla
  const TIER_ICONS = {bronz:'🥉',gumus:'🥈',altin:'🥇',elmas:'💎',sampiyonluk:'🏆'};
  const tierIcon = TIER_ICONS[state.league?.tier||'bronz'] || '🥉';
  const me = LEAGUE_BOARD.find(e => e.isMe);
  const myScore = (me?.score ?? 0) + gc.score;
  const myRank = LEAGUE_BOARD.filter(e => !e.isMe && e.score > myScore).length + 1;
  const next = LEAGUE_BOARD.filter(e => !e.isMe && e.score > myScore).slice(-1)[0];
  const scoreToNext = next ? next.score - myScore : 0;
  const top5 = myRank <= 5;

  // Hedef hesapla
  const _g     = state.levelGoal || {type:"score", value: state.cfg?.targetScore||120};
  const _prog  = _g.type==="score" ? gc.score : (state.goalProgress||0);
  const _total = _g.type==="score" ? (state.cfg?.targetScore||630) : (_g.value||1);
  const _pct   = Math.min(100, Math.round((_prog/_total)*100));
  const _gIcon = goalIcon(_g);
  const _gLabel= goalLabel(_g);

  root.innerHTML = `
    <div class="f9-wrap">

      <!-- TOPBAR: geri butonu + hamle geri al -->
      <div class="f9-topbar">
        <button class="f9-back-btn" id="btn-back-menu">← Menü</button>
        <button class="f9-undo-btn" id="btn-undo-move" ${state.gc?._history?.length ? "" : "disabled"}>↩ Geri Al</button>
      </div>

      <!-- SORUN BİLDİR floating butonu -->
      <button id="f9-report-btn" onclick="F9Report.showReportModal(false)"
        style="position:absolute;bottom:8px;right:8px;z-index:50;
        font-size:9px;padding:3px 8px;background:#1A1D30;
        border:1px solid #2A2D48;color:#6B7A9B;border-radius:6px;
        cursor:pointer;opacity:0.6"
        title="Sorun bildir">⚑ Bildir</button>

      <!-- PUAN / HEDEF BAR -->
      <div class="f9-psbar">
        <div class="f9-ps-track"><div class="f9-ps-fill" style="width:${_pct}%"></div></div>
        <div class="f9-ps-score">
          <span class="f9-ps-num" id="f9-live-score">${_prog}</span>
          <span class="f9-ps-sep"> / ${_total} ${_gIcon}</span>
        </div>
        <div style="font-size:10px;color:#A89B89;text-align:center">${_gLabel}</div>
      </div>

      <!-- STAT BAR: tek satır, kompakt -->
      <div class="f9-statbar">
        <div class="f9-stat-chip ${movesLeft<=5?'f9-stat-danger':''}">
          <span class="f9-sc-icon">🎯</span>
          <span class="f9-sc-val">${movesLeft??'∞'}</span>
          <span class="f9-sc-lbl">Hamle</span>
        </div>
        <div class="f9-stat-chip">
          <span class="f9-sc-icon">🔒</span>
          <span class="f9-sc-val">${gc.blockers.size}</span>
          <span class="f9-sc-lbl">Engel</span>
        </div>
        <div class="f9-stat-chip">
          <span class="f9-sc-icon">❤️</span>
          <span class="f9-sc-val">${state.tubes}/${state.maxTubes}</span>
          <span class="f9-sc-lbl">Can</span>
        </div>
        <div class="f9-stat-chip">
          <span class="f9-sc-icon">⚡</span>
          <span class="f9-sc-val">${state.energyTracker.energy}</span>
          <span class="f9-sc-lbl">Enerji</span>
        </div>
        <div class="f9-stat-chip f9-stat-rank" id="btn-league-mini">
          <span class="f9-sc-icon">🏆</span>
          <span class="f9-sc-val">#${myRank}</span>
          <span class="f9-sc-lbl">${top5?'🔥Top5':'Lig'}</span>
        </div>
      </div>

      <!-- BOARD -->
      <div id="f9-board-container" class="f9-board-container">
        <div id="f9-options-area"></div>
      </div>

      <div class="f9-message ${state.message ? "f9-message-visible" : ""}">${state.message || "&nbsp;"}</div>
      <div id="f9-status-area"></div>

      <!-- GÜÇLER: tahtanın hemen altında, büyük dokunmatik butonlar -->
      <div class="f9-powers-bar">
        <button class="f9-pb" id="pw-moves" ${state.energyTracker.energy<6?'disabled':''}>
          <span class="f9-pb-tooltip">+1 Hamle Hakkı<br><span style="color:#A89B89;font-size:11px">6 enerji harcayarak +1 hamle kazanırsın</span></span>
          <span class="f9-pb-icon">🎯</span>
          <span class="f9-pb-lbl">+Hamle</span>
          <span class="f9-pb-cost">6⚡</span>
        </button>
        <button class="f9-pb" id="pw-nitro" ${state.energyTracker.energy<12?'disabled':''}>
          <span class="f9-pb-tooltip">Nitro Patlama<br><span style="color:#A89B89;font-size:11px">Sonraki patlamayı 2× büyütür</span></span>
          <span class="f9-pb-icon">🚀</span>
          <span class="f9-pb-lbl">Nitro</span>
          <span class="f9-pb-cost">12⚡</span>
        </button>
        <button class="f9-pb" id="pw-mine" ${state.energyTracker.energy<10?'disabled':''}>
          <span class="f9-pb-tooltip">Mayın<br><span style="color:#A89B89;font-size:11px">Rastgele bir engeli kırar</span></span>
          <span class="f9-pb-icon">💣</span>
          <span class="f9-pb-lbl">Mayın</span>
          <span class="f9-pb-cost">10⚡</span>
        </button>
        <button class="f9-pb f9-pb-super" id="pw-super" ${state.energyTracker.energy<80?'disabled':''}>
          <span class="f9-pb-tooltip">Süper Patlama<br><span style="color:#A89B89;font-size:11px">Tüm tahtayı temizler!</span></span>
          <span class="f9-pb-icon">⭐</span>
          <span class="f9-pb-lbl">Süper</span>
          <span class="f9-pb-cost">80⚡</span>
        </button>
      </div>

      <div id="f9-energy-shop" style="display:none"></div>
    </div>
  `;

  renderBoardOnly();
  attachBoardListener(); // container'a bir kez bağla
  renderOptionsArea();
  renderStatusArea();
  renderEnergyShop();
  attachTopHandlers();
}

function renderBoardOnly() {
  const container = document.getElementById("f9-board-container");
  if (!container) return;
  const gc = state.gc;
  if (!gc) return; // gc henüz oluşmadıysa çizme
  let html = '<div class="f9-board" id="f9-board-grid">';
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const disp = cellDisplay(r, c);
      const k = cellKey(r, c);
      const isSelected = state.selected && state.selected[0] === r && state.selected[1] === c;
      const isNeighbor = !isSelected && state.neighbors && state.neighbors.some(([nr,nc])=>nr===r&&nc===c);
      const isGlow = state.glowCells instanceof Map && state.glowCells.has(k);
      const glowColor = isGlow ? state.glowCells.get(k) : null;
      const isBlastFlash = state.blastFlashCells instanceof Set && state.blastFlashCells.has(k);
      const isBrokenBlocker = state.brokenBlockerFlash instanceof Set && state.brokenBlockerFlash.has(k);
      // Dalga satırı vurgusu
      const _ws = F9Wave.isActive() ? F9Wave.status(gc) : null;
      const isWaveRow = _ws && r === _ws.waveRow;
      let inner = "", cls = "f9-cell", numColor = "", extraStyle = "", cellStyle = "";
      if (disp.type === "number") {
        if (disp.value === 9) {
          cls += " f9-cell-nine";
        } else if (disp.value !== null) {
          numColor = NUMBER_COLOR[disp.value] || "#F2EBE0";
        }
        if (disp.value === null) {
          inner = "";
        } else {
          const _nk = "num_" + disp.value;
          inner = GIFT_ASSETS[_nk]
            ? `<img src="${GIFT_ASSETS[_nk]}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:4px;">`
            : `<span style="color:${numColor};font-size:clamp(22px,7vw,42px);font-weight:900">${disp.value}</span>`;
        }
      } else if (disp.type === "hourglass") {
        cls += disp.warn ? " f9-cell-hourglass-warn" : " f9-cell-hourglass";
        const _hgPct = (() => {
          const _hg = state.gc?.hourglasses?.get(k);
          if (!_hg) return 0;
          return Math.max(0, Math.min(1, 1 - (Date.now() - _hg.startTime) / _hg.duration));
        })();
        const _circ = (2 * Math.PI * 20).toFixed(1);
        const _dash = (parseFloat(_circ) * _hgPct).toFixed(1);
        const _off  = (parseFloat(_circ) / 4).toFixed(1);
        const _remS = (() => {
          const _hg = state.gc?.hourglasses?.get(k);
          if (!_hg) return '?';
          return Math.ceil(Math.max(0, _hg.duration - (Date.now() - _hg.startTime)) / 1000) + 's';
        })();
        inner = `<div class="f9-hg-wrap">
          <svg class="f9-hg-ring" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="${disp.warn?'#3A1A1A':'#1A1040'}" stroke-width="3"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke="${disp.warn?'#E04B4B':'#7B5CF6'}" stroke-width="3"
              stroke-dasharray="${_dash} ${_circ}" stroke-dashoffset="${_off}" stroke-linecap="round"/>
          </svg>
          <img src="${HOURGLASS_ASSET}" class="f9-hg-img" alt="⏳">
          <div class="f9-hg-secs ${disp.warn?'warn':''}">${_remS}</div>
        </div>`;
      } else if (disp.type === "gift") {
        cls += " f9-cell-gift";
        const _gk = {[GIFT_COPPER]:"gift_bakir",[GIFT_BRONZE]:"gift_bronz",[GIFT_SILVER]:"gift_gumus",[GIFT_GOLD]:"gift_altin",[GIFT_DIAMOND]:"gift_elmas"}[disp.giftType];
        inner = GIFT_ASSETS[_gk]
          ? `<img src="${GIFT_ASSETS[_gk]}" style="width:90%;height:90%;object-fit:contain;display:block;">`
          : `<div class="f9-gift-tile" style="--gc:${GIFT_COLOR[disp.giftType]}">${GIFT_LABEL[disp.giftType][0]}</div>`;
      } else if (disp.type === "element") {
        cls += " f9-cell-element";
        const _ek = {[ELEM_STORM]:"elem_firtina",[ELEM_WATER]:"elem_su",[ELEM_TNT]:"elem_tnt",[ELEM_FIRE]:"elem_ates",[ELEM_LIGHTNING]:"elem_yildirim"}[disp.elementType];
        inner = ELEM_ASSETS[_ek]
          ? `<img src="${ELEM_ASSETS[_ek]}" style="width:90%;height:90%;object-fit:contain;display:block;">`
          : `<div class="f9-elem-tile" style="--ec:${ELEM_COLOR[disp.elementType]}">${ELEM_LABEL[disp.elementType][0]}</div>`;
      } else if (disp.type === "blocker") {
        cls += " f9-cell-blocker";
        if (isWaveRow) cls += " f9-cell-wave-blocker";
        // Katman göstergesi
        const _bTile = gc.blockers?.get(k);
        const _bType = _bTile?.blockerType || _bTile || disp.blockerType;
        const _bLayers = BLOCKER_LAYERS[_bType] || 1;
        if (_bLayers >= 3) cls += " f9-cell-blocker-layer3";
        else if (_bLayers === 2) cls += " f9-cell-blocker-layer2";
        const _bk = {
          [BLOCKER_GLASS]:"block_cam",
          [BLOCKER_ROCK]:"block_kaya",
          [BLOCKER_ICE]:"block_buz",
          [BLOCKER_IRON]:"block_demir",
          [BLOCKER_WOOD]:"block_agac",
          [BLOCKER_COPPER]:"block_bakir",
          [BLOCKER_STEEL]:"block_celik",
          [BLOCKER_LOCK]:"block_celik",
          [BLOCKER_DOUBLE_ICE]:"block_buz",
          [BLOCKER_CRATE]:"block_kaya",
        }[disp.blockerType];
        inner = BLOCK_ASSETS[_bk]
          ? `<img src="${BLOCK_ASSETS[_bk]}" style="width:90%;height:90%;object-fit:contain;display:block;">`
          : `<div class="f9-blocker-tile" style="--bc:${BLOCKER_COLOR[disp.blockerType]}">${BLOCKER_LABEL[disp.blockerType][0]}</div>`;
      }
      if (isSelected) cls += " f9-cell-selected";
      if (isNeighbor) cls += " f9-cell-neighbor";
      if (isGlow) { cls += " f9-cell-glow"; extraStyle += `--glow-color:${glowColor};`; }
      if (isBrokenBlocker) cls += " f9-cell-blocker-broken";
      else if (isBlastFlash) { cls += " f9-cell-blast"; }
      // Kum saati patlama: overlay kullanılıyor (renderBoardOnly innerHTML'den bağımsız)
      // Style birleştir: hem cellStyle hem extraStyle olabilir
      let _styleStr = "";
      if (cellStyle && extraStyle) {
        // cellStyle zaten style="..." formatında, içine extraStyle ekle
        _styleStr = cellStyle.replace(/style="/, `style="${extraStyle};`);
      } else if (cellStyle) {
        _styleStr = cellStyle;
      } else if (extraStyle) {
        _styleStr = `style="${extraStyle}"`;
      }
      html += `<div class="${cls}" data-r="${r}" data-c="${c}" ${_styleStr}>${inner}</div>`;
    }
  }
  html += "</div>";

  let optionsArea = document.getElementById("f9-options-area");
  container.innerHTML = html;
  if (optionsArea) container.appendChild(optionsArea);
  else {
    optionsArea = document.createElement("div");
    optionsArea.id = "f9-options-area";
    container.appendChild(optionsArea);
  }
  // NOT: renderOptionsArea buradan çağrılmıyor — handleCellClick yönetiyor

  // [Oturum 48 — KRİTİK HATA DÜZELTMESİ, kullanıcı bulgusu: "tahta
  // aynı gibi"] F9Juice.init() ESKİDEN SADECE executeMove() başında
  // çağrılıyordu — yani level İLK AÇILDIĞINDA (henüz hiç hamle
  // yapılmadan) nefes alma animasyonu, basınca küçülme, hover parlama
  // HİÇ AKTİF OLMUYORDU. Oyuncu levele girip "neden hiçbir şey
  // değişmedi" diye bakınca tam olarak bunu görüyordu. Burada —
  // renderBoardOnly()'nin HEM ilk açılışta HEM her hamle sonrası
  // çağrıldığı TEK noktada — çağırmak, ilk andan itibaren aktif
  // olmasını garantiliyor. init() idempotent (tekrar çağrı zararsız).
  if (typeof F9Juice !== "undefined") { F9Juice.init(); F9Juice.applyBreathing(); }
}

function attachBoardListener() {
  const container = document.getElementById("f9-board-container");
  if (!container || container === _boardListenerEl) return;

  // [Oturum 65 — kullanıcı isteği: "telefon ekranı için sürükle bırak
  // daha iyi, seç seç değil, sürükle bırak popup menü açılsın"]
  // Sürükle-bırak birincil etkileşim oldu — Pointer Events API
  // (mouse+dokunma+kalem TEK kod yolu, ayrı touch/mouse dinleyicisi
  // gerekmiyor). Eski "tıkla-tıkla" (seç-seç) davranışı KORUNDU —
  // hareket olmadan bırakılan bir dokunma otomatik olarak eski tek
  // tıklama gibi çalışıyor (geriye dönük uyumlu + erişilebilirlik).
  // flow/moveFlow.js'e HİÇ DOKUNULMADI — sürükleme sadece
  // handleCellClick()'i doğru sırada iki kez çağırıyor (1. hücre
  // pointerdown'da, 2. hücre komşuya girince), aynı test edilmiş oyun
  // mantığını (popup menü dahil, state.pendingOptions zaten var)
  // kullanıyor.
  let _dragStartCell = null;
  let _dragConsumed = false;

  function _cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest && el.closest(".f9-cell");
    if (!cell) return null;
    const r = Number(cell.dataset.r), c = Number(cell.dataset.c);
    if (isNaN(r) || isNaN(c)) return null;
    return { r, c };
  }

  container.addEventListener("pointerdown", (e) => {
    const cell = _cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    _dragStartCell = cell;
    _dragConsumed = false;
    handleCellClick(cell.r, cell.c); // 1. hücre — mevcut seçim mantığı
  });

  container.addEventListener("pointermove", (e) => {
    if (!_dragStartCell || _dragConsumed) return;
    const cell = _cellFromPoint(e.clientX, e.clientY);
    if (!cell || (cell.r === _dragStartCell.r && cell.c === _dragStartCell.c)) return;
    const isNeighbor =
      (Math.abs(cell.r - _dragStartCell.r) === 1 && cell.c === _dragStartCell.c) ||
      (Math.abs(cell.c - _dragStartCell.c) === 1 && cell.r === _dragStartCell.r);
    if (!isNeighbor) return; // komşu değil — belki oraya doğru sürüklüyordur, bekle
    _dragConsumed = true;
    handleCellClick(cell.r, cell.c); // 2. hücre — gerçek hamle denemesi (popup dahil)
  });

  function _endDrag() { _dragStartCell = null; _dragConsumed = false; }
  container.addEventListener("pointerup", _endDrag);
  container.addEventListener("pointercancel", _endDrag);
  container.addEventListener("pointerleave", _endDrag);

  _boardListenerEl = container;
}

function renderOptionsArea() {
  const area = document.getElementById("f9-options-area");
  if (!area) return;
  if (!state.pendingOptions) {
    area.innerHTML = "";
    area.classList.remove("f9-options-area-visible");
    return;
  }
  const { r1, c1, r2, c2, ops } = state.pendingOptions;
  const v1 = state.gc?.board.getCell(r1, c1);
  const v2 = state.gc?.board.getCell(r2, c2);
  if (ops.length === 0) return;

  // ── Konum hesabı ────────────────────────────────
  const CELL = 100 / GRID;        // % olarak hücre genişliği
  const col   = c2;               // hangi sütun
  const row   = r2;               // hangi satır

  // Yatay merkez — %cinsinden, transform yok, direkt left hesabı
  // Panel genişliği max 280px, tahta genişliğinin %90'ı
  // left = col*CELL + CELL/2 (hücre ortası) ama piksel clamp sonrası
  const openBelow = row < GRID / 2;

  // Sayı simgesi HTML yardımcısı
  function numImg(val) {
    if (!val) return "";
    const src = GIFT_ASSETS && GIFT_ASSETS["num_" + val];
    if (src) return `<img src="${src}" style="width:32px;height:32px;object-fit:contain;vertical-align:middle;border-radius:4px">`;
    const color = NUMBER_COLOR[val] || "#E8E2D8";
    return `<span style="font-size:28px;font-weight:900;color:${color};line-height:1">${val}</span>`;
  }

  // Başlık — iki hücrenin değerleri + simgeler
  const titleHtml = `
    <div class="f9-opts-title">
      ${numImg(v1)}
      <span class="f9-opts-title-sep">+</span>
      ${numImg(v2)}
      <span class="f9-opts-title-label">İşlem seç</span>
    </div>`;

  // İşlem butonları — simgeli sonuç
  const btnsHtml = ops.map((o, i) => {
    const color = o.value === 9 ? "#E0B23C" : (NUMBER_COLOR[o.value] || "#E8E2D8");
    const src   = GIFT_ASSETS && GIFT_ASSETS["num_" + o.value];
    const resultHtml = src
      ? `<img src="${src}" style="width:36px;height:36px;object-fit:contain;border-radius:4px" alt="${o.value}">`
      : `<span style="font-size:28px;font-weight:900;color:${color};line-height:1">${o.value}</span>`;
    return `<button class="f9-op-btn2${o.value===9?" f9-op-btn2-nine":""}" data-idx="${i}">
      <span class="f9-op-sym2">${o.op}</span>
      <span class="f9-op-arr2">→</span>
      <span class="f9-op-res2">${resultHtml}</span>
    </button>`;
  }).join("");

  area.classList.add("f9-options-area-visible");
  area.innerHTML = `<div class="f9-opts-panel2" id="f9-opts-panel">
    <div class="f9-opts-arrow2 ${openBelow?"f9-opts-arrow2-up":"f9-opts-arrow2-down"}" id="f9-opts-arrow"></div>
    ${titleHtml}
    <div class="f9-opts-row2">${btnsHtml}</div>
    <button class="f9-cancel-btn" id="f9-cancel-move">Vazgeç</button>
  </div>`;

  F9Debug.log("ui", `Menü: (${r1},${c1})+(${r2},${c2}) ${ops.length} seçenek`);

  // ── Piksel bazlı konumlandırma (RAF sonrası gerçek boyut) ──
  requestAnimationFrame(() => {
    const panel = document.getElementById("f9-opts-panel");
    const arrowEl = document.getElementById("f9-opts-arrow");
    if (!panel) return;

    // Tahta boyutunu doğrudan f9-board-grid'den al
    const boardGrid = document.getElementById("f9-board-grid");
    const areaW  = boardGrid ? boardGrid.offsetWidth  : (area.offsetWidth  || 320);
    const areaH  = boardGrid ? boardGrid.offsetHeight : (area.offsetHeight || 320);
    const pW     = panel.offsetWidth  || 220;
    const pH     = panel.offsetHeight || 140;
    const cellW  = areaW / GRID;
    const cellH  = areaH / GRID;
    const pad    = 8;

    // Yatay: hücre merkezi, ama panel tahta dışına taşmasın
    const cx      = (col + 0.5) * cellW;
    const leftRaw = cx - pW / 2;
    const left    = Math.min(areaW - pW - pad, Math.max(pad, leftRaw));

    // Ok'u seçili hücre merkezine hizala
    const arrowX = cx - left;
    if (arrowEl) {
      arrowEl.style.left      = Math.min(pW - 16, Math.max(16, arrowX)) + "px";
      arrowEl.style.transform = "none";
    }

    // Dikey: hücrenin PIKSEL merkezini hesapla (cellH kullan)
    const cy = (row + 0.5) * cellH;

    if (openBelow) {
      // Hücrenin altına aç
      const topDesired = cy + cellH * 0.55;
      const topClamped = Math.min(areaH - pH - pad, Math.max(pad, topDesired));
      panel.style.top    = topClamped + "px";
      panel.style.bottom = "";
    } else {
      // Hücrenin üstüne aç — bottom hesabı
      const bottomDesired = areaH - cy + cellH * 0.55;
      const bottomClamped = Math.min(areaH - pH - pad, Math.max(pad, bottomDesired));
      panel.style.bottom = bottomClamped + "px";
      panel.style.top    = "";
    }
    panel.style.left      = left + "px";
    panel.style.transform = "none";
  });

  // Buton event'leri
  area.querySelectorAll(".f9-op-btn2").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const idx    = Number(btn.dataset.idx);
      const chosen = state.pendingOptions?.ops[idx];
      if (!chosen) return;
      playSound("select");
      executeMove(state.pendingOptions.r1, state.pendingOptions.c1,
                  state.pendingOptions.r2, state.pendingOptions.c2, chosen.value);
    });
  });

  document.getElementById("f9-cancel-move")?.addEventListener("click", e => {
    e.stopPropagation();
    state.pendingOptions = null;
    state.selected       = null;
    state.neighbors      = [];
    renderBoardOnly();
    renderOptionsArea();
  });
}

function renderStatusArea() {
  const area = document.getElementById("f9-status-area");
  if (!area) return;
  area.innerHTML = ""; // geçişler checkAndTransition'da
}

function attachTopHandlers() {
  document.getElementById("f9-prev-level")?.addEventListener("click", () => {
    if (state.levelNumber > 1) newLevel(state.levelNumber - 1);
  });
  document.getElementById("f9-next-level")?.addEventListener("click", () => newLevel(state.levelNumber + 1));
  document.getElementById("btn-screen-game")?.addEventListener("click", () => { state.screen="menu"; render(); });
  // Güç butonları
  document.getElementById("pw-moves")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!state.gc) return; const r = state.gc.spendEnergyForMoves("small");
    if (r.ok) { state.message = "+"+r.movesAdded+" hamle! (-"+r.cost+"⚡)"; render(); }
    else { state.message = "Yetersiz enerji (6⚡ gerekli)"; renderBoardOnly(); }
  });
  document.getElementById("pw-nitro")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!state.gc) return; const r = state.gc.spendEnergyForAreaBoost();
    if (r.ok) { state.message = "🚀 Nitro aktif! Sonraki patlama güçlendi"; render(); }
    else { state.message = "Yetersiz enerji (12⚡ gerekli)"; renderBoardOnly(); }
  });
  document.getElementById("pw-mine")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!state.gc) return; const r = state.gc.spendEnergyForRandomBlockerBreak();
    if (r.ok) { state.message = "💣 Engel kırıldı! (-"+r.cost+"⚡)"; render(); }
    else { state.message = "Yetersiz enerji (10⚡ gerekli)"; renderBoardOnly(); }
  });
  document.getElementById("pw-super")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!state.gc) return; const r = state.gc.spendEnergyForSuperBlast();
    if (r.ok) { state.message = "⭐ SÜPER PATLAMA! (-"+r.cost+"⚡)"; render(); }
    else { state.message = "Yetersiz enerji (80⚡ gerekli)"; renderBoardOnly(); }
  });
  document.getElementById("pw-more")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const shop = document.getElementById("f9-energy-shop");
    if (shop) shop.style.display = shop.style.display==="none"?"block":"none";
  });
  // settings sadece menüde
  // settings sadece menüde
  document.getElementById("btn-back-menu")?.addEventListener("click", () => { state.screen="menu"; render(); });
  document.getElementById("btn-undo-move")?.addEventListener("click", () => {
    const gc = state.gc;
    if (!gc || gc.status !== "in_progress") return;
    const ok = gc.undo();
    F9Debug.log("move", `Geri al ${ok ? "başarılı" : "başarısız (geçmiş boş)"}`, {historyLen: gc._history?.length});
    if (!ok) return;
    // Açık menü/seçim varsa temizle
    state.pendingOptions = null;
    state.selected = null;
    state.neighbors = [];
    playSound("select");
    render();
  });
  document.getElementById("f9-go-level")?.addEventListener("click", () => {
    const v = Math.max(1, Number(document.getElementById("f9-level-input")?.value) || 1);
    newLevel(v);
  });
}
