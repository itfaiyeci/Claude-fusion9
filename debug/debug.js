

// ════════════════════════════════════════════════════════════════
//  F9 DEBUG SİSTEMİ — Tüm kritik işlemleri izler
//  Açmak: localStorage.setItem("f9debug","1") → sayfayı yenile
//  Kapatmak: localStorage.removeItem("f9debug") → sayfayı yenile
//  Panel: sağ alttaki 🐛 butonuna tıkla
// ════════════════════════════════════════════════════════════════
const F9Debug = (() => {
  // [Oturum 44 — KRİTİK HATA DÜZELTMESİ] Bu satır ESKİDEN try/catch
  // İÇİNDE DEĞİLDİ — dosya YÜKLENİR YÜKLENMEZ (modül-seviyesi IIFE,
  // gecikmeli bir fonksiyon çağrısı değil) çalışıyordu. `file://`
  // protokolüyle (kullanıcı dosyayı ÇİFT TIKLAYIP doğrudan açtığında,
  // bir sunucu ÜZERİNDEN DEĞİL) bazı tarayıcılar/ortamlar localStorage
  // erişimini "opaque origin" güvenlik kısıtlamasıyla ENGELLİYOR ve
  // SecurityError fırlatıyor — bu hata YAKALANMADIĞI için TÜM script
  // burada çöküyordu, `f9-root` tamamen BOŞ kalıyordu (jsdom ile
  // `file://` testinde bulundu — bkz. README.md Oturum 44). Diğer
  // TÜM localStorage çağrıları (save/save-manager.js, core/
  // game-engine.js'teki _storageOk testi, debug/debug.js'in kendi
  // _dirLoad/_dirSave'i) zaten try/catch ile korunuyordu — SADECE bu
  // satır korunmamıştı.
  let ENABLED = false;
  try { ENABLED = localStorage.getItem("f9debug") === "1"; } catch(e) {}
  const MAX_LOGS = 200;
  const logs = [];
  let _panel = null, _list = null, _badge = null, _statsPanel = null, _dirPanel = null, _shapesPanel = null;
  let errorCount = 0, warnCount = 0;

  const COLORS = {
    game:    "#4FB87A",
    ui:      "#7B5CF6",
    save:    "#E0B23C",
    error:   "#E04B4B",
    warn:    "#E08B2B",
    move:    "#3E8FD4",
    hourglass:"#A78BFA",
    blocker: "#C17A4D",
    score:   "#E8C53C",
    info:    "#9AAABB",
  };

  function _ts() {
    const d = new Date();
    return d.getHours().toString().padStart(2,"0") + ":" +
           d.getMinutes().toString().padStart(2,"0") + ":" +
           d.getSeconds().toString().padStart(2,"0") + "." +
           d.getMilliseconds().toString().padStart(3,"0");
  }

  function _fmt(data) {
    if (data === null || data === undefined) return "";
    if (typeof data === "string") return data;
    try { return JSON.stringify(data); } catch(e) { return String(data); }
  }

  function _push(cat, msg, data) {
    // [Oturum 63 — kullanıcı isteği: "cihazları yormaması gerekir",
    // performans denetimi] KRİTİK DÜZELTME: bu fonksiyon önceden
    // ENABLED=false olsa BİLE (yani gerçek oyuncularda debug KAPALIYKEN
    // bile) her çağrıda JSON.stringify(data) + array push/pop + DOM
    // panel güncellemesi yapıyordu. Kod tabanında 36 çağrı noktası var,
    // çoğu "move"/"score"/"game" gibi SIK (her hamlede) tetiklenen
    // kategoriler — yani her oyuncunun her hareketinde gereksiz iş.
    // Artık: "error"/"warn" NADİR olduğu için (performans derdi değil)
    // HER ZAMAN tam işleniyor — rozet (🐛 ikonundaki kırmızı sayaç)
    // ENABLED=false olan gerçek kullanıcılarda bile güncel kalsın diye.
    // Ama sık tekrarlanan normal kategoriler (move/score/game/vb.)
    // ENABLED=false iken fonksiyonun EN BAŞINDA çıkıyor — hiç
    // JSON.stringify, hiç array push, hiç DOM işi yok.
    if (cat !== "error" && cat !== "warn" && !ENABLED) return;

    const entry = { ts: _ts(), cat, msg, data: data !== undefined ? data : null };
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.pop();

    const dataStr = _fmt(data);
    const line = `[F9/${cat.toUpperCase()}] ${msg}${dataStr ? " " + dataStr : ""}`;

    if (cat === "error") { errorCount++; console.error(line); }
    else if (cat === "warn") { warnCount++; console.warn(line); }
    else if (ENABLED) { console.log(line); }

    _updatePanel(entry);
  }

  function _updatePanel(entry) {
    if (!_list || !_panel || typeof _list.insertBefore !== "function") return;
    const div = document.createElement("div");
    div.style.cssText = `padding:3px 6px;border-bottom:1px solid #1A1D30;
      font-size:10px;font-family:monospace;line-height:1.4;
      background:${entry.cat==="error"?"#200A0A":entry.cat==="warn"?"#1A1008":"transparent"}`;
    const color = COLORS[entry.cat] || COLORS.info;
    const _dStr = entry.data !== null && entry.data !== undefined
      ? (typeof entry.data === "object"
          ? JSON.stringify(entry.data, null, 0).replace(/"(\w+)":/g,"$1:").slice(0,150)
          : String(entry.data).slice(0,150))
      : "";
    div.innerHTML = `<span style="color:#4A5568;font-size:9px">${entry.ts}</span>
      <span style="color:${color};font-weight:700;margin:0 3px;font-size:9px">[${entry.cat.toUpperCase()}]</span>
      <span style="color:#C8D0E0;font-size:10px">${entry.msg}</span>
      ${_dStr ? `<span style="color:#6B7A9B;margin-left:4px;font-size:9px">${_dStr}</span>` : ""}`;
    _list.insertBefore(div, _list.firstChild);
    // Max 100 satır göster
    while (_list.children.length > 100 && _list.lastChild) _list.removeChild(_list.lastChild);

    // Badge güncelle
    if (_badge) {
      const errTxt = errorCount > 0 ? `${errorCount}E ` : "";
      const wrnTxt = warnCount > 0 ? `${warnCount}W` : "";
      _badge.textContent = (errTxt + wrnTxt) || "OK";
      _badge.style.color = errorCount > 0 ? "#E04B4B" : warnCount > 0 ? "#E08B2B" : "#4FB87A";
    }
  }

  function _createPanel() {
    _dirLoad();
    if (_panel) return;

    // Tetikleyici buton
    const btn = document.createElement("div");
    btn.id = "f9-debug-btn";
    btn.innerHTML = "🐛";
    btn.style.cssText = `position:fixed;bottom:12px;right:12px;width:36px;height:36px;
      border-radius:50%;background:#0C0F25;border:1px solid #1E2448;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
      z-index:99998;font-size:16px;box-shadow:0 2px 8px #00000060;user-select:none`;

    _badge = document.createElement("div");
    _badge.style.cssText = `position:absolute;top:-4px;right:-4px;font-size:8px;
      font-weight:700;font-family:monospace;color:#4FB87A;background:#0C0F25;
      border-radius:6px;padding:1px 3px;border:1px solid #1E2448;min-width:14px;text-align:center`;
    _badge.textContent = "OK";
    btn.appendChild(_badge);

    // Panel
    _panel = document.createElement("div");
    _panel.id = "f9-debug-panel";
    _panel.style.cssText = `position:fixed;bottom:56px;right:12px;width:540px;
      max-height:480px;background:#07091A;border:1px solid #1E2448;border-radius:12px;
      z-index:99999;display:none;flex-direction:column;overflow:hidden;
      box-shadow:0 8px 32px #00000080;font-family:monospace`;

    // Panel başlık
    const hdr = document.createElement("div");
    hdr.style.cssText = `padding:8px 12px;background:#0C0F25;border-bottom:1px solid #1E2448;
      display:flex;align-items:center;gap:8px;flex-shrink:0`;
    hdr.innerHTML = `
      <button id="f9-tab-log"   onclick="F9Debug.switchTab('log')"   style="font-size:10px;font-weight:700;padding:3px 10px;background:#A78BFA22;border:1px solid #A78BFA55;color:#A78BFA;border-radius:6px;cursor:pointer;margin-right:4px">🐛 Log</button>
      <button id="f9-tab-stats" onclick="F9Debug.switchTab('stats')" style="font-size:10px;font-weight:700;padding:3px 10px;background:transparent;border:1px solid #2A2D48;color:#6B7A9B;border-radius:6px;cursor:pointer;margin-right:4px">📊 Analiz</button>
      <button id="f9-tab-dir"   onclick="F9Debug.switchTab('dir')"   style="font-size:10px;font-weight:700;padding:3px 10px;background:transparent;border:1px solid #2A2D48;color:#6B7A9B;border-radius:6px;cursor:pointer;margin-right:4px">🤖 Direktör</button>
      <button id="f9-tab-shapes" onclick="F9Debug.switchTab('shapes')" style="font-size:10px;font-weight:700;padding:3px 10px;background:transparent;border:1px solid #2A2D48;color:#6B7A9B;border-radius:6px;cursor:pointer">🔷 Şekiller</button>
      <span id="f9d-errcnt" style="font-size:10px;color:#E04B4B;margin-left:6px"></span>
      <span style="flex:1"></span>
      <button onclick="F9Debug.snapshot()" style="font-size:9px;padding:2px 6px;background:#1A1D38;border:1px solid #2A2D48;color:#9AAABB;border-radius:4px;cursor:pointer">📋 Kopyala</button>
      <button onclick="F9Debug.clear()" style="font-size:9px;padding:2px 6px;background:#1A1D38;border:1px solid #2A2D48;color:#9AAABB;border-radius:4px;cursor:pointer">🗑 Temizle</button>
      <select id="f9d-filter" onchange="F9Debug.filter(this.value)" style="font-size:9px;padding:2px 4px;background:#1A1D38;border:1px solid #2A2D48;color:#9AAABB;border-radius:4px">
        <option value="">Tümü</option>
        <option value="error">Hata</option>
        <option value="warn">Uyarı</option>
        <option value="move">Hamle</option>
        <option value="game">Oyun</option>
        <option value="save">Kayıt</option>
        <option value="hourglass">Kum saati</option>
        <option value="score">Skor</option>
      </select>
    `;

    // State özeti
    const stateBar = document.createElement("div");
    stateBar.id = "f9d-state";
    stateBar.style.cssText = `padding:4px 8px;background:#0A0C1A;border-bottom:1px solid #1E2448;
      font-size:9px;color:#6B7A9B;font-family:monospace;flex-shrink:0;white-space:nowrap;overflow:hidden`;

    _list = document.createElement("div");
    _list.style.cssText = `flex:1;overflow-y:auto;overflow-x:hidden`;

    // Analiz paneli — log paneline paralel, başlangıçta gizli
    _statsPanel = document.createElement("div");
    _statsPanel.id = "f9-stats-panel";
    _statsPanel.style.cssText = `flex:1;overflow-y:auto;overflow-x:hidden;display:none;padding:8px`;

    _panel.appendChild(hdr);
    _panel.appendChild(stateBar);
    _panel.appendChild(_list);
    _panel.appendChild(_statsPanel);

    _dirPanel = document.createElement("div");
    _dirPanel.id = "f9-dir-panel";
    _dirPanel.style.cssText = `flex:1;overflow-y:auto;overflow-x:hidden;display:none;padding:8px`;
    _panel.appendChild(_dirPanel);

    // [Oturum 93 — kullanıcı isteği: "debug panelinde canlı şekil
    // analizi aracı, sadece bizim için (dev-only), oyuncuya yönelik
    // DEĞİL"] Şekiller paneli — log paneline paralel, başlangıçta gizli.
    _shapesPanel = document.createElement("div");
    _shapesPanel.id = "f9-shapes-panel";
    _shapesPanel.style.cssText = `flex:1;overflow-y:auto;overflow-x:hidden;display:none;padding:8px`;
    _panel.appendChild(_shapesPanel);

    document.body.appendChild(btn);
    document.body.appendChild(_panel);

    btn.addEventListener("click", () => {
      const open = _panel.style.display === "flex";
      _panel.style.display = open ? "none" : "flex";
      if (!open) _refreshState();
    });

    // State'i her 2sn güncelle
    setInterval(_refreshState, 2000);
  }

  function _refreshState() {
    const el = document.getElementById("f9d-state");
    if (!el) return;
    try {
      const s = state;
      const gc = s.gc;
      el.textContent = [
        `screen:${s.screen}`,
        `lvl:${s.levelNumber}`,
        gc ? `moves:${gc.movesUsed}/${gc.movesLimit}` : "gc:null",
        gc ? `score:${gc.score}` : "",
        gc ? `blockers:${gc.blockers.size}` : "",
        gc ? `hourglasses:${gc.hourglasses.size}` : "",
        `energy:${s.energyTracker?.energy ?? "?"}`,
        `tubes:${s.tubes}`,
        `selected:${JSON.stringify(s.selected)}`,
        errorCount > 0 ? `ERRORS:${errorCount}` : "",
      ].filter(Boolean).join("  |  ");
    } catch(e) { el.textContent = "state okunamadı: " + e.message; }
  }

  // Global hata yakalayıcı
  window.addEventListener("error", (e) => {
    const stack = e.error?.stack?.split("\n").slice(0,5).join(" | ") || "";
    _push("error", `${e.message}`, {
      file: e.filename?.split("/").pop(), line: e.lineno, col: e.colno,
      stack: stack.slice(0, 300)
    });
    // F9Report'a da ilet (global scope'ta tanımlandıktan sonra)
    setTimeout(() => {
      if (typeof F9Report !== "undefined") {
        F9Report.onError(e.message, e.filename, e.lineno, e.colno, e.error);
      }
    }, 0);
  });
  window.addEventListener("unhandledrejection", (e) => {
    _push("error", `Unhandled Promise: ${e.reason}`, null);
  });


  // ── SEKMELEr ─────────────────────────────────────────
  let _currentTab = "log";

  function _switchTab(tab) {
    _currentTab = tab;
    const logBtn   = document.getElementById("f9-tab-log");
    const statsBtn = document.getElementById("f9-tab-stats");
    const dirBtn   = document.getElementById("f9-tab-dir");
    const shapesBtn = document.getElementById("f9-tab-shapes");
    const filter   = document.getElementById("f9d-filter");

    // Hepsini sıfırla
    [logBtn, statsBtn, dirBtn, shapesBtn].forEach(b => {
      if (b) { b.style.background="transparent"; b.style.color="#6B7A9B"; b.style.borderColor="#2A2D48"; }
    });
    _list.style.display = "none";
    if (_statsPanel) _statsPanel.style.display = "none";
    if (_dirPanel)   _dirPanel.style.display   = "none";
    if (_shapesPanel) _shapesPanel.style.display = "none";
    if (filter) filter.style.display = "none";

    if (tab === "log") {
      _list.style.display = "block";
      if (filter) filter.style.display = "";
      if (logBtn) { logBtn.style.background="#A78BFA22"; logBtn.style.color="#A78BFA"; logBtn.style.borderColor="#A78BFA55"; }
    } else if (tab === "stats") {
      if (_statsPanel) { _statsPanel.style.display = "block"; _renderStats(); }
      if (statsBtn) { statsBtn.style.background="#3E8FD422"; statsBtn.style.color="#3E8FD4"; statsBtn.style.borderColor="#3E8FD455"; }
    } else if (tab === "dir") {
      if (_dirPanel) { _dirPanel.style.display = "block"; _renderDirector(); }
      if (dirBtn) { dirBtn.style.background="#4FB87A22"; dirBtn.style.color="#4FB87A"; dirBtn.style.borderColor="#4FB87A55"; }
    } else if (tab === "shapes") {
      if (_shapesPanel) { _shapesPanel.style.display = "block"; _renderShapes(); }
      if (shapesBtn) { shapesBtn.style.background="#E0B23C22"; shapesBtn.style.color="#E0B23C"; shapesBtn.style.borderColor="#E0B23C55"; }
    }
  }

  // ── ANALİZ MOTORU ────────────────────────────────────
  // Oyun boyunca biriken ham veri
  const _analytics = {
    sessions: [],      // her level için özet
    currentLevel: null,
    moves: [],         // mevcut level hamleleri [{kind, val, points, ts}]
    dda: [],           // DDA değişim geçmişi
    issues: [],        // tespit edilen sorunlar
  };

  function _analyticsOnMove(outcome, gc) {
    if (!_analytics.currentLevel) return;
    const lv = _analytics.currentLevel;

    // Hamle kaydı
    const moveEntry = {
      kind: outcome.kind,
      points: outcome.points || 0,
      chain: (outcome.chain || []).length,
      gift: !!outcome.gift,
      ts: Date.now(),
    };
    _analytics.moves.push(moveEntry);
    lv.totalMoves++;
    lv.totalPoints += moveEntry.points;
    if (moveEntry.kind === "normal" || moveEntry.kind === "promotion") {
      const _lmp=gc.lastMovePos; if(_lmp&&_lmp[0]!=null&&_lmp[1]!=null) lv.nineCount += (gc.board?.getCell?.(_lmp[0],_lmp[1])===9)?1:0;
    }
    if (moveEntry.chain > 0) lv.chainCount++;
    if (moveEntry.gift)      lv.giftCount++;
    if (moveEntry.kind === "promotion") lv.promotionCount++;
    if (moveEntry.kind === "combo")     lv.comboCount++;
    lv.maxChain = Math.max(lv.maxChain, moveEntry.chain);

    // Hız ölçümü (iki hamle arası ms)
    if (_analytics.moves.length >= 2) {
      const dt = _analytics.moves.at(-1).ts - _analytics.moves.at(-2).ts;
      lv.moveSpeeds.push(dt);
    }

    // Sorun tespiti
    _detectIssues(outcome, gc, lv);
  }

  function _analyticsOnLevelStart(levelNumber, cfg, gc) {
    _analytics.moves = [];
    _analytics.currentLevel = {
      levelNumber, startTs: Date.now(), endTs: null,
      moves: cfg?.moves || 0, targetScore: cfg?.targetScore || 630,
      won: null, finalScore: 0,
      totalMoves: 0, totalPoints: 0, nineCount: 0,
      chainCount: 0, giftCount: 0, promotionCount: 0,
      comboCount: 0, maxChain: 0, blockersBroken: 0,
      moveSpeeds: [], dda: null, issues: [],
    };
  }

  function _analyticsOnLevelEnd(won, gc, dda) {
    if (!_analytics.currentLevel) return;
    const lv = _analytics.currentLevel;
    lv.endTs = Date.now();
    lv.won = won;
    lv.finalScore = gc?.score || 0;
    lv.blockersBroken = lv.totalPoints > 0
      ? Math.floor((lv.totalPoints - lv.nineCount * 90) / 30) : 0;
    if (dda) lv.dda = { losses: dda.losses, targetMult: dda.targetMult, movesMult: dda.movesMult };
    _analytics.sessions.push({ ...lv });
    if (_analytics.sessions.length > 50) _analytics.sessions.shift();
    _analytics.currentLevel = null;
    if (_currentTab === "stats" && _statsPanel) _renderStats();
  }

  function _detectIssues(outcome, gc, lv) {
    const issues = [];
    // Hamle verimsizliği: üst üste 3 sıfır puanlı hamle
    const last3 = _analytics.moves.slice(-3);
    if (last3.length === 3 && last3.every(m => m.points === 0 && m.chain === 0)) {
      issues.push({ sev: "warn", msg: "3 ardışık sıfır puanlı hamle — 9 oluşturmaya çalışın" });
    }
    // Hediye kullanılmıyor: 5+ hamleden fazla hediye varken promosyon yapılmadı
    if (gc?.gifts?.size >= 2 && lv.totalMoves > 5 && lv.promotionCount === 0) {
      issues.push({ sev: "info", msg: `${gc.gifts.size} hediye bekliyor — 9 ile birleştirin` });
    }
    // Kum saati tehlikesi: kum saati var ama son 3 hamlede 9 üretilmedi
    if (gc?.hourglasses?.size > 0 && last3.length >= 3 && lv.nineCount === 0) {
      issues.push({ sev: "danger", msg: "Kum saati aktif! 9 eşleştirin yoksa patlayacak" });
    }
    issues.forEach(issue => {
      if (!lv.issues.find(i => i.msg === issue.msg)) {
        lv.issues.push({ ...issue, ts: Date.now(), move: lv.totalMoves });
        _analytics.issues.unshift({ ...issue, level: lv.levelNumber, move: lv.totalMoves });
        if (_analytics.issues.length > 30) _analytics.issues.pop();
      }
    });
  }


  // ══════════════════════════════════════════════════════
  // 🤖 F9 DİREKTÖR — Oyun Müdürü
  // Hiçbir şeyi değiştirmez. İzler, analiz eder, önerir.
  // ══════════════════════════════════════════════════════
  const _dir = {
    history: [],        // her level için özet kaydı (localStorage'a yazılır)
    current: null,      // aktif level verisi
    issues: [],         // tüm oturum boyunca tespit edilen sorunlar
  };

  const DIR_KEY = "f9_director_v1";

  function _dirLoad() {
    try {
      const raw = localStorage.getItem(DIR_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        _dir.history = d.history || [];
        _dir.issues  = d.issues  || [];
      }
    } catch(e) {}
  }

  function _dirSave() {
    try {
      localStorage.setItem(DIR_KEY, JSON.stringify({
        history: _dir.history.slice(-100),
        issues:  _dir.issues.slice(-50),
      }));
    } catch(e) {}
  }

  // ── Level başı ─────────────────────────────────────
  function _dirLevelStart(levelNumber, cfg, gc) {
    _dir.current = {
      level: levelNumber,
      tier: cfg?.tierName || "?",
      _pattern: cfg?.blockerLayout?._patternName || null,
      moves_limit: cfg?.moves || 0,
      target: cfg?.targetScore || 630,
      start_ts: Date.now(),
      moves_made: 0,
      nine_moves: 0,
      chain_moves: 0,
      promo_moves: 0,
      combo_moves: 0,
      max_chain: 0,
      blockers_broken: 0,
      gifts_made: 0,
      total_points: 0,
      speed_samples: [],  // ms cinsinden hamle arası süreler
      last_move_ts: null,
      consec_zero: 0,     // ardışık sıfır puanlı hamle
      issues: [],
    };
  }

  // ── Hamle gözlemi ──────────────────────────────────
  function _dirObserveMove(outcome, gc) {
    if (!_dir.current) return;
    const lv = _dir.current;
    const now = Date.now();

    const kind      = outcome?.kind || "normal";
    const points    = outcome?.points || 0;
    const chainLen  = (outcome?.chain || []).length;
    const gift      = !!(outcome?.gift || (outcome?.chain||[]).some(s=>s?.result?.gift));
    const lmp       = gc?.lastMovePos;
    const wasNine   = !!(lmp && gc?.board?.getCell?.(lmp[0], lmp[1]) === 9);
    const broken    = (outcome?.brokenBlockers||[]).length;

    lv.moves_made++;
    lv.total_points += points;
    if (wasNine)           lv.nine_moves++;
    if (chainLen > 0)      { lv.chain_moves++; lv.max_chain = Math.max(lv.max_chain, chainLen); }
    if (gift)              lv.gifts_made++;
    if (kind === "promotion") lv.promo_moves++;
    if (kind === "combo")     lv.combo_moves++;
    lv.blockers_broken += broken;

    if (points === 0 && chainLen === 0) lv.consec_zero++;
    else lv.consec_zero = 0;

    if (lv.last_move_ts !== null) lv.speed_samples.push(now - lv.last_move_ts);
    lv.last_move_ts = now;

    _dirDetect(gc, outcome);

    // Direktör sekmesi açıksa canlı güncelle
    if (_currentTab === "dir" && _dirPanel) _renderDirector();
    if (_currentTab === "shapes" && _shapesPanel) _renderShapes();
  }

  // ── Level sonu ─────────────────────────────────────
  function _dirLevelEnd(won, gc) {
    if (!_dir.current) return;
    const lv = _dir.current;
    const rec = {
      level: lv.level, tier: lv.tier, won,
      score: gc?.score || 0, target: lv.target,
      _pattern: lv._pattern || null,
      moves_made: lv.moves_made, moves_limit: lv.moves_limit,
      nine_eff: lv.moves_made ? +(lv.nine_moves / lv.moves_made).toFixed(3) : 0,
      spm: lv.moves_made ? +(gc?.score / lv.moves_made).toFixed(1) : 0,
      chain_moves: lv.chain_moves, max_chain: lv.max_chain,
      promo_moves: lv.promo_moves, combo_moves: lv.combo_moves,
      gifts_made: lv.gifts_made, blockers_broken: lv.blockers_broken,
      avg_speed: lv.speed_samples.length
        ? +(lv.speed_samples.reduce((a,b)=>a+b,0)/lv.speed_samples.length/1000).toFixed(2)
        : null,
      issues_count: lv.issues.length,
      date: new Date().toISOString().slice(0,16).replace("T"," "),
    };
    _dir.history.push(rec);
    if (_dir.history.length > 100) _dir.history.shift();

    // Level sorunlarını genel listeye ekle
    lv.issues.forEach(iss => {
      _dir.issues.unshift({ ...iss, level: lv.level, date: rec.date });
    });
    if (_dir.issues.length > 50) _dir.issues.length = 50;

    _dir.current = null;
    _dirSave();
    if (_currentTab === "dir" && _dirPanel) _renderDirector();
    if (_currentTab === "shapes" && _shapesPanel) _renderShapes();
  }

  // ── Sorun tespiti ──────────────────────────────────
  function _dirDetect(gc, outcome) {
    if (!_dir.current) return;
    const lv = _dir.current;
    const has = msg => lv.issues.some(i => i.msg === msg);

    // Oyuncuya: ardışık sıfır puan
    if (lv.consec_zero >= 3 && !has("3 ardışık sıfır puanlı hamle")) {
      lv.issues.push({ sev:"warn", for:"player",
        msg:"3 ardışık sıfır puanlı hamle",
        tip:"9 oluşturmaya çalışın — toplam 9 olan çiftleri seçin", move: lv.moves_made });
    }
    // Oyuncuya: kum saati var ama 9 yok
    if (gc?.hourglasses?.size > 0 && lv.nine_moves === 0 && lv.moves_made >= 3 && !has("Kum saati aktif!")) {
      lv.issues.push({ sev:"danger", for:"player",
        msg:"Kum saati aktif!",
        tip:"Kum saati sadece 9 ile patlar — 9 oluşturan bir hamle yapın", move: lv.moves_made });
    }
    // Oyuncuya: hediye birikmiş
    if (gc?.gifts?.size >= 3 && lv.promo_moves === 0 && lv.moves_made >= 5 && !has("Hediye taşları birikmiş")) {
      lv.issues.push({ sev:"info", for:"player",
        msg:"Hediye taşları birikmiş",
        tip:`${gc.gifts.size} hediye var — yanına 9 getirerek terfiye zorlayın`, move: lv.moves_made });
    }
    // Oyuncuya: hamle bitiyor, hedef uzakta
    if (gc?.movesLimit) {
      const left = gc.movesLeft || 0;
      if (left <= Math.ceil(gc.movesLimit * 0.25)) {
        const spm = lv.moves_made ? lv.total_points / lv.moves_made : 0;
        const proj = Math.round(spm * gc.movesLimit);
        if (proj < lv.target * 0.75 && !has("Hamle bitiyor")) {
          lv.issues.push({ sev:"danger", for:"player",
            msg:"Hamle bitiyor",
            tip:`Tahmini ${proj} puan (hedef ${lv.target}) — kombo veya kum saatiyle ivme yarat`, move: lv.moves_made });
        }
      }
    }
    // Geliştirici: yavaş hamle
    if (lv.speed_samples.length >= 5) {
      const last5 = lv.speed_samples.slice(-5);
      const avg5  = last5.reduce((a,b)=>a+b,0)/5;
      if (avg5 > 8000 && !has("Yavaş hamle hızı tespit edildi")) {
        lv.issues.push({ sev:"info", for:"dev",
          msg:"Yavaş hamle hızı tespit edildi",
          tip:`Son 5 hamle ort. ${(avg5/1000).toFixed(1)}s — oyuncu sıkışmış olabilir`, move: lv.moves_made });
      }
    }
  }

  // ── Sağlık skoru ───────────────────────────────────
  function _dirHealthScore() {
    const hist = _dir.history;
    if (hist.length < 3) return 50;
    const last10 = hist.slice(-10);
    const winRate    = last10.filter(h=>h.won).length / last10.length;
    const avgNine    = last10.reduce((a,h)=>a+h.nine_eff,0) / last10.length;
    const dangerCnt  = _dir.issues.filter(i=>i.sev==="danger").length;
    const issuePen   = Math.min(1, dangerCnt / 5);
    const score = winRate*40 + Math.min(1,avgNine/0.25)*25 + (1-issuePen)*20 + 15;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ── Direktör notları (geliştirici önerileri) ───────
  function _dirNotes() {
    const notes = [];
    const hist  = _dir.history;
    if (hist.length < 3) {
      notes.push({ pri:"low",
        title:"Veri toplanıyor (" + hist.length + "/3 level)",
        detail:"Sağlık skoru ve öneriler en az 3 level oynandıktan sonra çalışmaya başlar.",
        action:"Oynamaya devam et — direktör sessizce izliyor." });
      return notes;
    }
    const last10 = hist.slice(-10);
    const winRate  = last10.filter(h=>h.won).length / last10.length;
    const avgNine  = last10.reduce((a,h)=>a+h.nine_eff,0) / last10.length;
    const avgSpeed = last10.filter(h=>h.avg_speed).map(h=>h.avg_speed);
    const avgSpeedVal = avgSpeed.length ? avgSpeed.reduce((a,b)=>a+b,0)/avgSpeed.length : null;

    // BASE_MOVES kontrol
    const _bm = (typeof BASE_MOVES !== "undefined") ? BASE_MOVES : 21;
        if (_bm !== 21) {
      notes.push({ pri:"high",
        title:`⚠ BASE_MOVES = ${BASE_MOVES} — test modu aktif!`,
        detail:"Canlıya almadan önce 21 yapılmalı.",
        action:`Mevcut BASE_MOVES=${_bm}. fusion9_clean.html → const BASE_MOVES=21 yapın` });
    }
    // Kazanma oranı düşük
    if (winRate < 0.30) {
      notes.push({ pri:"high",
        title:`Düşük kazanma oranı — %${Math.round(winRate*100)} (son ${last10.length} level)`,
        detail:"DDA devrede ama yetmiyor olabilir.",
        action:"DIFFICULTY_TIERS 'kolay' movesMult'ı 1.30→1.50 ya da breathe hedefini düşür" });
    } else if (winRate >= 0.80) {
      notes.push({ pri:"medium",
        title:`Yüksek kazanma oranı — %${Math.round(winRate*100)}`,
        detail:"Oyun çok kolay olabilir.",
        action:"DDA_TARGET_STREAK değerlerini gözden geçir, BASE_MOVES'u 21'e al" });
    }
    // 9 verimliliği
    if (avgNine < 0.10) {
      notes.push({ pri:"medium",
        title:`Düşük 9 verimliliği — %${Math.round(avgNine*100)}`,
        detail:"Oyuncu 9 oluşturmayı bilmiyor olabilir.",
        action:"Tutorial veya ipucu sistemi ekle, getMoveOptions log'larını incele" });
    }
    // Yavaş hamle
    if (avgSpeedVal && avgSpeedVal > 6) {
      notes.push({ pri:"low",
        title:`Yüksek ortalama hamle hızı — ${avgSpeedVal.toFixed(1)}s`,
        detail:"Oyuncu sıkışıyor veya UI belirsiz.",
        action:"Seçenek menüsü ve hücre seçim görselini gözden geçir" });
    }
    // Tekrarlayan sorun
    const issTypes = {};
    _dir.issues.slice(-30).forEach(i => { issTypes[i.msg] = (issTypes[i.msg]||0)+1; });
    const topIss = Object.entries(issTypes).sort((a,b)=>b[1]-a[1])[0];
    if (topIss && topIss[1] >= 4) {
      notes.push({ pri:"medium",
        title:`Tekrarlayan sorun: "${topIss[0]}" (${topIss[1]}x)`,
        detail:"Birden fazla levelda aynı sorun çıkıyor.",
        action:"İlgili mekanizmayı ya da UI akışını incele" });
    }

    notes.sort((a,b) => (a.pri==="high"?0:a.pri==="medium"?1:2) - (b.pri==="high"?0:b.pri==="medium"?1:2));
    return notes;
  }

  // ── Direktör paneli render ──────────────────────────
  // [Oturum 93 — kullanıcı isteği: "debug panelinde canlı şekil
  // analizi aracı, sadece bizim için (dev-only)"] O anki tahtadaki
  // TÜM 36 sabit şeklin (ALL_FIXED_SHAPES) her olası konumdaki
  // TAMAMLANMA ORANINI hesaplayıp, en yüksekten düşüğe sıralı listeler.
  // Oyuncuya YÖNELİK bir özellik DEĞİL — sadece debug panelinde,
  // yalnızca geliştirici/QA görür (bkz. HANDOFF.md Oturum 92 notu).
  const GROUP_LABEL = { a: "3'lü", b: "4'lü", c: "5'li", d: "6'lı", e: "7'li" };
  function _renderShapes() {
    if (!_shapesPanel) return;
    const gc = state?.gc;
    if (!gc || !gc.board) {
      _shapesPanel.innerHTML = `<div style="color:#6B7A9B;font-size:11px;padding:8px">Aktif oyun yok (gc null) — bir level başlat.</div>`;
      return;
    }
    if (typeof ALL_FIXED_SHAPES === "undefined") {
      _shapesPanel.innerHTML = `<div style="color:#E04B4B;font-size:11px;padding:8px">ALL_FIXED_SHAPES bulunamadı.</div>`;
      return;
    }
    const GRID = 8;
    // [Oturum 94 — kullanıcı bulgusu: "neden 36, 48 değil"] ALL_FIXED_SHAPES
    // sadece 36 sabit şekli içeriyor — 12 çizgi varyasyonu (line3/4/5,
    // yatay+dikey) rules/matchRules.js'te AYRI sabitler olarak duruyor,
    // ALL_FIXED_SHAPES'e dahil değiller (bkz. debug/build-shape-lab.js'in
    // "48 model = 36 sabit + 12 çizgi" yorumu). Artık ikisi birden taranıyor.
    const lineShapes = (typeof LINE_3_H !== "undefined") ? [
      { name: "line3_h", group: "a", cells: LINE_3_H },
      { name: "line3_v", group: "a", cells: LINE_3_V },
      { name: "line4_h", group: "b", cells: LINE_4_H },
      { name: "line4_v", group: "b", cells: LINE_4_V },
      { name: "line5_h", group: "c", cells: LINE_5_H },
      { name: "line5_v", group: "c", cells: LINE_5_V },
    ] : [];
    const allShapes = [...ALL_FIXED_SHAPES, ...lineShapes];
    const rows = [];
    for (const shape of allShapes) {
      const maxDr = Math.max(...shape.cells.map(([r]) => r));
      const maxDc = Math.max(...shape.cells.map(([, c]) => c));
      let best = null;
      for (let br = 0; br <= GRID - 1 - maxDr; br++) {
        for (let bc = 0; bc <= GRID - 1 - maxDc; bc++) {
          const absCells = shape.cells.map(([r, c]) => [br + r, bc + c]);
          const nineCells = absCells.filter(([r, c]) => gc.board.getCell(r, c) === 9);
          const ratio = nineCells.length / shape.cells.length;
          if (!best || ratio > best.ratio) best = { ratio, cells: absCells, nineCount: nineCells.length };
        }
      }
      if (best && best.nineCount > 0) rows.push({ name: shape.name, group: shape.group, ...best });
    }
    rows.sort((a, b) => b.ratio - a.ratio);

    const rowsHtml = rows.slice(0, 30).map(r => {
      const pct = Math.round(r.ratio * 100);
      const barColor = r.ratio >= 1 ? "#4FB87A" : r.ratio >= 0.5 ? "#E0B23C" : "#6B7A9B";
      return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #1A1D38">
        <span style="width:34px;color:#9AAABB;font-size:10px">[${GROUP_LABEL[r.group]||r.group}]</span>
        <span style="width:56px;color:#E8E2D8;font-size:10px">${r.name}</span>
        <div style="flex:1;height:8px;background:#1A1D38;border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor}"></div>
        </div>
        <span style="width:34px;text-align:right;color:${barColor};font-size:10px;font-weight:700">${pct}%</span>
        <span style="width:26px;text-align:right;color:#6B7A9B;font-size:9px">${r.nineCount}/${r.cells.length}</span>
      </div>`;
    }).join("");

    _shapesPanel.innerHTML = `
      <div style="color:#6B7A9B;font-size:10px;margin-bottom:6px">O anki tahta — 48 şeklin (36 sabit + 12 çizgi) en yüksek tamamlanma oranları (sadece dev, oyuncu görmez)</div>
      ${rowsHtml || '<div style="color:#6B7A9B;font-size:11px;padding:8px">Tahtada hiç 9 yok — hiçbir şekil ilerlemesi yok.</div>'}
    `;
  }

  function _renderDirector() {
    if (!_dirPanel) return;
    const lv   = _dir.current;
    const hist = _dir.history;
    const health = _dirHealthScore();
    const healthColor = health>=70?"#4FB87A":health>=45?"#E0B23C":"#E04B4B";

    const row = (label, val, color) =>
      `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #0F1225">
        <span style="color:#6B7A9B;font-size:10px">${label}</span>
        <span style="color:${color||"#C8D0E0"};font-size:10px;font-weight:700">${val}</span>
      </div>`;
    const sec = (title, color) =>
      `<div style="font-size:9px;font-weight:700;color:${color||"#4FB87A"};letter-spacing:1px;
        text-transform:uppercase;margin:10px 0 5px;border-bottom:1px solid #1E2448;padding-bottom:3px">${title}</div>`;
    const pill = (txt, color, bg) =>
      `<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:${bg};color:${color};margin:1px">${txt}</span>`;

    let html = `<div style="font-family:monospace;color:#C8D0E0">`;

    // ── Sağlık göstergesi ──────────────────────────────
    html += sec("🏥 Oyun Sağlığı", hist.length < 3 ? "#6B7A9B" : healthColor);
    if (hist.length < 3) {
      // Yeterli veri yok — sayı gösterme, açıklama yaz
      html += `<div style="background:#0C0F25;border:1px solid #2A2D48;border-radius:6px;padding:6px 10px;margin:4px 0">
        <div style="font-size:10px;color:#6B7A9B">Henüz veri toplanıyor</div>
        <div style="font-size:9px;color:#444;margin-top:2px">
          En az 3 level oynandıktan sonra sağlık skoru hesaplanır.
          <br>Şu an: ${hist.length}/3 level tamamlandı.
        </div>
        <div style="height:4px;width:100%;background:#1A1D30;border-radius:2px;margin-top:6px">
          <div style="height:4px;width:${Math.round(hist.length/3*100)}%;background:#3E8FD4;border-radius:2px;transition:width .4s"></div>
        </div>
      </div>`;
    } else {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
        <div style="font-size:22px;font-weight:700;color:${healthColor}">${health}</div>
        <div>
          <div style="height:6px;width:180px;background:#1A1D30;border-radius:3px">
            <div style="height:6px;width:${health}%;background:${healthColor};border-radius:3px;transition:width .4s"></div>
          </div>
          <div style="font-size:9px;color:#6B7A9B;margin-top:2px">
            ${health>=70?"Sistem sağlıklı":health>=45?"Dikkat edilmeli":"Kritik sorunlar var"}
            &nbsp;·&nbsp; ${hist.length} level geçmişi
          </div>
        </div>
      </div>`;
    }

    // ── Aktif level anlık durum ─────────────────────────
    if (lv) {
      const nineEff = lv.moves_made ? Math.round(lv.nine_moves/lv.moves_made*100) : 0;
      const spm     = lv.moves_made ? (lv.total_points/lv.moves_made).toFixed(1) : 0;
      const proj    = Math.round(spm * lv.moves_limit);
      const willWin = proj >= lv.target;
      // Churn durumu
      if (typeof F9Churn !== "undefined") {
        const _cs = F9Churn.status(lv.level);
        if (_cs.losses > 0) {
          const _cc = _cs.churn ? "#E04B4B" : "#E08B2B";
          html += `<div style="background:${_cs.churn?"#1A0808":"#1A1008"};border:1px solid ${_cc};
            border-radius:5px;padding:3px 8px;margin:3px 0;font-size:9px;color:${_cc}">
            ${_cs.churn?"⚠ Churn DDA aktif":"⏳ Dikkat"}: ${_cs.losses} kayıp
            ${_cs.churn?`(hedef x${_cs.dda_mult.toFixed(2)})` : ""}
          </div>`;
        }
      }
      html += sec("🎮 Şu An — Level " + lv.level + " (" + lv.tier + ")", "#3E8FD4");
      html += row("Hamle", `${lv.moves_made}/${lv.moves_limit}`, "#C8D0E0");
      html += row("9 verimliliği", `${nineEff}%`, nineEff>=25?"#4FB87A":nineEff>=12?"#E0B23C":"#E04B4B");
      html += row("Hamle başı puan", spm, "#3E8FD4");
      html += row("Projeksiyon", `${proj} / ${lv.target}`, willWin?"#4FB87A":"#E04B4B");

      // Baskı dalgası durumu
      const _wst = F9Wave.status(state.gc);
      if (_wst.active) {
        html += sec("🌊 Baskı Dalgası", _wst.danger ? "#E04B4B" : "#E08B2B");
        const _wc = _wst.danger ? "#E04B4B" : "#E0B23C";
        html += row("Güç", `${_wst.power} biriken`, "#A78BFA");
        html += row("Dalga satırı", _wst.waveRow >= 0 ? `${_wst.waveRow}. satır` : "yok", _wc);
        html += row("Dalga hızı", `her ${_wst.interval} hamlede`, "#6B7A9B");
        if (_wst.danger) {
          html += `<div style="background:#1A0808;border:1px solid #E04B4B;border-radius:5px;
            padding:4px 8px;font-size:10px;color:#E04B4B;font-weight:700;margin:3px 0">
            ⚠ TEHLİKE — Dalga üste yaklaşıyor!
          </div>`;
        }
        // Güç barı
        const _pct = Math.min(100, _wst.power * 10);
        html += `<div style="height:4px;background:#1A1D30;border-radius:2px;margin:4px 0">
          <div style="height:4px;width:${_pct}%;background:#A78BFA;border-radius:2px;transition:width .3s"></div>
        </div>`;
      }

      // Canlı zorluk analizi
      const _dr = F9Difficulty.report(state.gc);
      if (_dr) {
        const _dcol = _dr.difficulty==="kritik"?"#E04B4B":_dr.difficulty==="zor"?"#E08B2B":_dr.difficulty==="orta"?"#E0B23C":"#4FB87A";
        html += sec("🧩 Zorluk Analizi", _dcol);
        html += row("1. Derece fırsat", `${_dr.degree1Now} komşu çift`, _dcol);
        html += row("2. Derece fırsat", `${_dr.degree2Now} 2-adım yol`, "#6B7A9B");
        html += row("Zorluk seviyesi", _dr.difficulty.toUpperCase(), _dcol);
        if (_dr.interventionsThisLevel > 0) {
          html += row("AI müdahale", `${_dr.interventionsThisLevel} kez (hamle ${F9Difficulty.getStats().interventionMoves.join(",")})`, "#A78BFA");
        }
        const _dfBar = Math.min(100, _dr.degree1Now * 8);
        html += `<div style="margin:4px 0 2px;font-size:9px;color:#6B7A9B">Fırsat doluluk:</div>
          <div style="height:5px;background:#1A1D30;border-radius:3px">
            <div style="height:5px;width:${_dfBar}%;background:${_dcol};border-radius:3px;transition:width .4s"></div>
          </div>`;
      }

      // Oyuncuya uyarılar
      const playerIssues = lv.issues.filter(i=>i.for==="player"||!i.for);
      if (playerIssues.length > 0) {
        html += sec("⚡ Oyuncuya İpuçları", "#E08B2B");
        playerIssues.slice(-3).forEach(iss => {
          const c  = iss.sev==="danger"?"#E04B4B":iss.sev==="warn"?"#E08B2B":"#3E8FD4";
          const bg = iss.sev==="danger"?"#1A0808":iss.sev==="warn"?"#1A1008":"#080F1A";
          html += `<div style="background:${bg};border:1px solid ${c};border-radius:5px;padding:4px 7px;margin:2px 0">
            <div style="color:${c};font-size:10px;font-weight:700">${iss.msg}</div>
            <div style="color:#A89B89;font-size:9px;margin-top:1px">${iss.tip||""}</div>
          </div>`;
        });
      }
    }

    // ── Oyuncu profili (son 10 levelden) ───────────────
    if (hist.length >= 3) {
      const last10 = hist.slice(-10);
      const winRate  = last10.filter(h=>h.won).length / last10.length;
      const avgNine  = last10.reduce((a,h)=>a+h.nine_eff,0)/last10.length;
      const avgChain = last10.reduce((a,h)=>a+(h.chain_moves/(h.moves_made||1)),0)/last10.length;
      const style = avgNine>=0.35&&avgChain>=0.20?"Kombo Ustası":
                    avgNine>=0.30?"9 Odaklı":
                    avgChain>=0.25?"Zincir Ustası":
                    avgNine<0.10?"Casual":"Dengeli";

      html += sec("👤 Oyuncu Profili", "#A78BFA");
      html += row("Kazanma oranı", `${Math.round(winRate*100)}%`,
        winRate>=0.6?"#4FB87A":winRate>=0.4?"#E0B23C":"#E04B4B");
      html += row("9 verimliliği", `${Math.round(avgNine*100)}%`,
        avgNine>=0.25?"#4FB87A":avgNine>=0.12?"#E0B23C":"#E04B4B");
      html += row("Oyun tarzı", style, "#A78BFA");
      html += row("Analiz edilen level", last10.length, "#6B7A9B");

      // Desen bazlı kazanma oranları
      const patterns = ["pyramid","fibonacci","prime","symmetric","diagonal"];
      const patLabels = {pyramid:"Piramit",fibonacci:"Fibonacci",prime:"Asal",symmetric:"Simetrik",diagonal:"Çapraz"};
      const patData = patterns.map(p => {
        const ph = _dir.history.filter(h=>h._pattern===p).slice(-8);
        if (ph.length < 2) return null;
        const wr = ph.filter(h=>h.won).length / ph.length;
        return {name: patLabels[p], wr, count: ph.length};
      }).filter(Boolean);
      if (patData.length > 0) {
        html += sec("🔲 Desen Analizi", "#3E8FD4");
        patData.forEach(pd => {
          const c = pd.wr >= 0.6 ? "#4FB87A" : pd.wr >= 0.35 ? "#E0B23C" : "#E04B4B";
          html += row(pd.name, Math.round(pd.wr*100)+"% kazanma ("+pd.count+" level)", c);
        });
      }

      // Bot test paneli
      html += sec("📋 Sorun Bildir / Hata Raporu", "#E08B2B");
      const _errs = F9Report.getErrors();
      html += `<div style="font-size:10px;color:#6B7A9B;margin-bottom:6px">
        ${_errs.length > 0 ? _errs.length + " hata kaydedildi" : "Kayıtlı hata yok"} · 
        Son 30 log otomatik eklenir
      </div>`;
      if (_errs.length > 0) {
        html += `<div style="background:#1A0808;border:1px solid #E04B4B44;border-radius:5px;
          padding:4px 7px;margin-bottom:6px;font-size:9px;color:#E04B4B">
          Son: ${_errs[0].msg?.slice(0,60)} (L${_errs[0].line})
        </div>`;
      }
      html += `<button onclick="F9Report.showReportModal(${_errs.length > 0})"
        style="width:100%;padding:7px;background:#E08B2B22;border:1px solid #E08B2B;
        color:#E08B2B;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;margin-bottom:8px">
        📋 Sorun Bildir / Rapor Oluştur
      </button>`;
      html += sec("🤖 Otonom Bot Testi", "#E04B4B");
      const botRunning = F9Bot.isRunning();
      const botSum = F9Bot.summary();
      // Mevcut seed göster
      const _curSeed = F9Bot.getSeed();
      html += `<div style="font-size:9px;color:#6B7A9B;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">
        <span>Seed: <code style="color:#A78BFA;font-size:9px">${_curSeed}</code></span>
        <span style="font-size:8px;color:#444">— hata ayıklamak için not alın</span>
      </div>`;
      // Seed girişi + yenile butonu
      html += `<div style="display:flex;gap:4px;margin-bottom:5px">
        <input id="f9-bot-seed-in" type="number" placeholder="Seed (boş=rastgele)"
          style="flex:1;font-size:9px;padding:2px 5px;background:#0C0F25;
          border:1px solid #2A2D48;color:#C8D0E0;border-radius:4px">
        <button onclick="window._applySeed=function(){var v=document.getElementById('f9-bot-seed-in').value;F9Bot.reseed(v?parseInt(v):Date.now());F9Debug.renderDirector();};window._applySeed();"
          style="font-size:9px;padding:2px 8px;background:#1A1D30;border:1px solid #A78BFA;
          color:#A78BFA;border-radius:4px;cursor:pointer">Seed Uygula</button>
      </div>`;
      html += `<div style="display:flex;gap:6px;margin:4px 0">
        <button onclick="F9Bot.start('casual',200)"
          style="flex:1;font-size:9px;padding:3px;background:#1A1D30;border:1px solid #2A2D48;
          color:#9AAABB;border-radius:4px;cursor:pointer">🐢 Casual</button>
        <button onclick="F9Bot.start('normal',80)"
          style="flex:1;font-size:9px;padding:3px;background:#1A1D30;border:1px solid #2A2D48;
          color:#9AAABB;border-radius:4px;cursor:pointer">🚶 Normal</button>
        <button onclick="F9Bot.start('pro',30)"
          style="flex:1;font-size:9px;padding:3px;background:#1A1D30;border:1px solid #2A2D48;
          color:#9AAABB;border-radius:4px;cursor:pointer">⚡ Pro</button>
        <button onclick="F9Bot.stop()"
          style="flex:1;font-size:9px;padding:3px;background:#200A0A;border:1px solid #E04B4B;
          color:#E04B4B;border-radius:4px;cursor:pointer">■ Durdur</button>
      </div>`;
      if(botSum){
        const bwr=Math.round(botSum.winRate*100);
        const bc=bwr>=50?"#4FB87A":bwr>=30?"#E0B23C":"#E04B4B";
        html += row("Oynanan level", botSum.levels, "#C8D0E0");
        html += row("Kazanma oranı", bwr+"%", bc);
        html += row("Aktif seed", "0x"+(F9Bot.getSeed()>>>0).toString(16).toUpperCase(), "#6B7A9B");
        const last5=botSum.results.slice(-5).reverse();
        html += `<div style="font-size:9px;color:#6B7A9B;margin-top:3px">Son levellar:</div>`;
        last5.forEach(r=>{
          const rc=r.won?"#4FB87A":"#E04B4B";
          html += `<div style="font-size:9px;color:${rc}">L${r.level} ${r.won?"✓":"✗"} ${r.score}/${r.target}</div>`;
        });
        // Weight Matrix özeti
        const _wm = F9Bot.weightMatrix();
        if (_wm) {
          const _mid = Math.floor(_wm.length/2);
          html += row("Ağırlık matrisi", `merkez=${_wm[_mid][_mid]} | köşe=${_wm[0][0]} (Piece-Square)`, "#6B7A9B");
        }
        // Kazanma oranı → seviye zorluk sınıfı
        const _bwrN = botSum.winRate;
        const _diff = _bwrN>=0.70?"KOLAY 🟢":_bwrN>=0.40?"ORTA 🟡":_bwrN>=0.15?"ZOR 🟠":_bwrN>=0.05?"HARD 🔴":"KİLİTLİ ❌";
        const _dc   = _bwrN>=0.70?"#4FB87A":_bwrN>=0.40?"#E0B23C":_bwrN>=0.15?"#E08B2B":"#E04B4B";
        html += row("Seviye zorluğu", _diff, _dc);
        html += `<div style="font-size:8px;color:#6B7A9B;margin-top:1px">%70+:Kolay | %40-70:Orta | %20-35:Zor | %5-15:Hard | %0:Kilitli</div>`;
      } else {
        html += `<div style="font-size:10px;color:#6B7A9B;padding:4px 0">
          Bot pasif. Yukarıdan bir profil seç.
          <br>Seed: 0x${(F9Bot.getSeed()>>>0).toString(16).toUpperCase()}
          &nbsp;<button onclick="F9Bot.reseed(42);F9Debug.renderDirector()"
            style="font-size:9px;padding:1px 6px;background:#1A1D30;border:1px solid #2A2D48;
            color:#6B7A9B;border-radius:4px;cursor:pointer">Seed:42</button>
        </div>`;
      }
    }

    // ── Son 5 level özeti ──────────────────────────────
    if (hist.length > 0) {
      html += sec("📈 Son Levellar", "#E0B23C");
      hist.slice(-5).reverse().forEach(h => {
        const c = h.won?"#4FB87A":"#E04B4B";
        html += `<div style="background:#0C0F25;border:1px solid #1E2448;border-radius:5px;
          padding:4px 7px;margin:2px 0;display:flex;justify-content:space-between;align-items:center">
          <span style="color:#A78BFA;font-size:10px;font-weight:700">L${h.level}</span>
          <span style="color:${c};font-size:10px">${h.won?"✓ Kazandı":"✗ Kaybetti"}</span>
          <span style="color:#6B7A9B;font-size:9px">${Math.round(h.nine_eff*100)}% dokuz</span>
          <span style="color:#6B7A9B;font-size:9px">${h.score}p</span>
        </div>`;
      });
    }

    // ── Geliştirici notları ────────────────────────────
    const notes = _dirNotes();
    if (notes.length > 0) {
      html += sec("🛠 Geliştirici Notları", "#E04B4B");
      notes.forEach(note => {
        const priColor = note.pri==="high"?"#E04B4B":note.pri==="medium"?"#E08B2B":"#6B7A9B";
        const priBg    = note.pri==="high"?"#1A0808":note.pri==="medium"?"#1A1008":"#0A0A0A";
        html += `<div style="background:${priBg};border:1px solid ${priColor}44;
          border-left:3px solid ${priColor};border-radius:5px;padding:5px 8px;margin:3px 0">
          <div style="color:${priColor};font-size:10px;font-weight:700;margin-bottom:2px">${note.title}</div>
          ${note.detail?`<div style="color:#A89B89;font-size:9px;margin-bottom:2px">${note.detail}</div>`:""}
          ${note.action?`<div style="color:#6B7A9B;font-size:9px;font-style:italic">→ ${note.action}</div>`:""}
        </div>`;
      });
    }

    html += `</div>`;
    _dirPanel.innerHTML = html;
  }

  // ── RAPOR RENDER ─────────────────────────────────────
  function _stat(label, value, color) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;
      padding:3px 0;border-bottom:1px solid #0F1225">
      <span style="color:#6B7A9B;font-size:10px">${label}</span>
      <span style="color:${color||"#C8D0E0"};font-size:10px;font-weight:700">${value}</span>
    </div>`;
  }

  function _section(title, color) {
    return `<div style="font-size:9px;font-weight:700;color:${color||"#A78BFA"};
      letter-spacing:1px;text-transform:uppercase;margin:10px 0 4px;
      padding-bottom:3px;border-bottom:1px solid #1E2448">${title}</div>`;
  }

  function _bar(pct, color) {
    pct = Math.min(100, Math.max(0, Math.round(pct)));
    return `<div style="height:4px;background:#1A1D30;border-radius:2px;margin-top:3px">
      <div style="height:4px;width:${pct}%;background:${color};border-radius:2px;transition:width .3s"></div>
    </div>`;
  }

  function _renderStats() {
    if (!_statsPanel) return;
    const gc  = state?.gc;
    const cfg = state?.cfg;
    const lv  = _analytics.currentLevel;
    const sessions = _analytics.sessions;
    const last5 = sessions.slice(-5);
    const issues = _analytics.issues.slice(0, 8);

    let html = `<div style="font-family:monospace;color:#C8D0E0">`;

    // ── Canlı Durum ──────────────────────────────────────
    html += _section("🎮 Canlı Durum", "#4FB87A");
    if (gc && gc.status === "in_progress") {
      const movesPct = gc.movesLimit ? (gc.movesUsed / gc.movesLimit * 100) : 0;
      const scorePct = cfg?.targetScore ? (gc.score / cfg.targetScore * 100) : 0;
      const ppMove   = gc.movesUsed > 0 ? (gc.score / gc.movesUsed).toFixed(1) : "—";
      const proj     = gc.movesUsed > 0 ? Math.round(gc.score / gc.movesUsed * gc.movesLimit) : "—";
      const willWin  = proj >= (cfg?.targetScore || 630);
      html += _stat("Level", state.levelNumber, "#7B5CF6");
      html += _stat("Skor / Hedef", `${gc.score} / ${cfg?.targetScore || 630}`, scorePct >= 100 ? "#4FB87A" : "#E0B23C");
      html += _bar(scorePct, scorePct >= 100 ? "#4FB87A" : "#E0B23C");
      html += _stat("Hamle", `${gc.movesUsed} / ${gc.movesLimit}`, movesPct > 80 ? "#E04B4B" : "#C8D0E0");
      html += _bar(movesPct, movesPct > 80 ? "#E04B4B" : "#7B5CF6");
      html += _stat("Hamle başı puan", ppMove, "#3E8FD4");
      html += _stat("Projeksiyon", proj, willWin ? "#4FB87A" : "#E04B4B");
      html += _stat("Kum saati", gc.hourglasses.size > 0 ? `⏳ ${gc.hourglasses.size} aktif` : "yok", gc.hourglasses.size > 0 ? "#E08B2B" : "#6B7A9B");
      html += _stat("Hediye taşı", gc.gifts.size > 0 ? `${gc.gifts.size} adet` : "yok", gc.gifts.size > 0 ? "#A78BFA" : "#6B7A9B");
      html += _stat("Engel", gc.blockers.size > 0 ? `${gc.blockers.size} adet` : "yok", gc.blockers.size > 0 ? "#C17A4D" : "#6B7A9B");
    } else {
      html += `<div style="color:#6B7A9B;font-size:10px;padding:8px 0">Oyun aktif değil</div>`;
    }

    // ── Level Hamle Analizi ───────────────────────────────
    if (lv && lv.totalMoves > 0) {
      html += _section("📊 Bu Level — Hamle Analizi", "#3E8FD4");
      const avgSpeed = lv.moveSpeeds.length > 0
        ? Math.round(lv.moveSpeeds.reduce((a,b)=>a+b,0)/lv.moveSpeeds.length/1000*10)/10 : "—";
      const eff = lv.totalMoves > 0 ? Math.round(lv.nineCount / lv.totalMoves * 100) : 0;
      html += _stat("Toplam hamle", lv.totalMoves, "#C8D0E0");
      html += _stat("9 üreten hamle", `${lv.nineCount} (${eff}%)`, eff > 30 ? "#4FB87A" : eff > 15 ? "#E0B23C" : "#E04B4B");
      html += _bar(eff, eff > 30 ? "#4FB87A" : eff > 15 ? "#E0B23C" : "#E04B4B");
      html += _stat("Zincir tetikleyen", lv.chainCount, "#A78BFA");
      html += _stat("Max zincir uzunluğu", lv.maxChain, lv.maxChain >= 3 ? "#4FB87A" : "#6B7A9B");
      html += _stat("Hediye terfi", lv.promotionCount, "#E0B23C");
      html += _stat("Kombo", lv.comboCount, "#7B5CF6");
      html += _stat("Ort. hamle hızı", avgSpeed !== "—" ? `${avgSpeed}s` : "—", "#6B7A9B");
    }

    // ── Son 5 Level Geçmişi ───────────────────────────────
    if (last5.length > 0) {
      html += _section("📈 Son Levellar", "#E0B23C");
      last5.reverse().forEach(s => {
        const dur   = s.endTs ? Math.round((s.endTs - s.startTs)/1000) : 0;
        const eff   = s.totalMoves > 0 ? Math.round(s.nineCount/s.totalMoves*100) : 0;
        const icon  = s.won ? "✅" : "❌";
        const color = s.won ? "#4FB87A" : "#E04B4B";
        html += `<div style="background:#0C0F25;border:1px solid #1E2448;border-radius:6px;padding:5px 8px;margin:3px 0">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="color:#A78BFA;font-size:10px;font-weight:700">L${s.levelNumber} ${icon}</span>
            <span style="color:#6B7A9B;font-size:9px">${dur}s</span>
          </div>
          ${_stat("Skor / Hedef", `${s.finalScore} / ${s.targetScore}`, color)}
          ${_stat("Hamle", `${s.totalMoves}/${s.moves}`, "#C8D0E0")}
          ${_stat("9 verimliliği", `${eff}%`, eff>25?"#4FB87A":eff>12?"#E0B23C":"#E04B4B")}
          ${_stat("Zincir / Hediye / Kombo", `${s.chainCount} / ${s.giftCount} / ${s.comboCount}`, "#6B7A9B")}
        </div>`;
      });
      last5.reverse(); // eski sırayı geri al
    }

    // ── Genel İstatistikler ───────────────────────────────
    if (sessions.length >= 2) {
      html += _section("🏆 Genel", "#4FB87A");
      const wins    = sessions.filter(s => s.won).length;
      const winRate = Math.round(wins / sessions.length * 100);
      const avgEff  = sessions.reduce((a,s) => a + (s.totalMoves>0?s.nineCount/s.totalMoves:0), 0) / sessions.length;
      html += _stat("Oynanan level", sessions.length, "#C8D0E0");
      html += _stat("Kazanma oranı", `${winRate}%`, winRate>=60?"#4FB87A":winRate>=40?"#E0B23C":"#E04B4B");
      html += _bar(winRate, winRate>=60?"#4FB87A":winRate>=40?"#E0B23C":"#E04B4B");
      html += _stat("Ort. 9 verimliliği", `${Math.round(avgEff*100)}%`, avgEff>0.25?"#4FB87A":avgEff>0.12?"#E0B23C":"#E04B4B");
      // DDA durumu
      const lastDDA = sessions.filter(s=>s.dda).at(-1)?.dda;
      if (lastDDA) {
        html += _stat("DDA kayıp serisi", lastDDA.losses, lastDDA.losses>=3?"#E04B4B":lastDDA.losses>=2?"#E08B2B":"#4FB87A");
        html += _stat("DDA hedef çarpanı", lastDDA.targetMult?.toFixed(2) || "1.00", "#6B7A9B");
      }
    }

    // ── Tespitler / Öneriler ─────────────────────────────
    if (issues.length > 0) {
      html += _section("⚠️ Tespitler & Öneriler", "#E08B2B");
      issues.forEach(issue => {
        const colors = { danger: "#E04B4B", warn: "#E08B2B", info: "#3E8FD4" };
        const bgs    = { danger: "#200A0A", warn: "#1A1008", info: "#0A0F20" };
        html += `<div style="background:${bgs[issue.sev]||"#0C0F25"};border:1px solid ${colors[issue.sev]||"#2A2D48"};
          border-radius:5px;padding:4px 7px;margin:3px 0">
          <div style="color:${colors[issue.sev]};font-size:10px;font-weight:700">L${issue.level} / hamle #${issue.move}</div>
          <div style="color:#C8D0E0;font-size:10px;margin-top:1px">${issue.msg}</div>
        </div>`;
      });
    } else if (sessions.length > 0) {
      html += _section("✅ Tespitler", "#4FB87A");
      html += `<div style="color:#4FB87A;font-size:10px;padding:4px 0">Şu ana kadar sorun tespit edilmedi</div>`;
    }

    html += `</div>`;
    _statsPanel.innerHTML = html;
  }

  // Public API
  return {
    enabled: ENABLED,
    log:  (cat, msg, data) => _push(cat, msg, data),
    err:  (msg, data)      => _push("error", msg, data),
    warn: (msg, data)      => _push("warn", msg, data),
    init: () => { if (document.body) _createPanel(); else document.addEventListener("DOMContentLoaded", _createPanel); },
    clear: () => { logs.length=0; errorCount=0; warnCount=0; if(_list) _list.innerHTML=""; if(_badge){_badge.textContent="OK";_badge.style.color="#4FB87A";} },
    filter: (cat) => {
      if (!_list) return;
      const entries = (cat ? logs.filter(l=>l.cat===cat) : logs).slice(0,100);
      _list.innerHTML = "";
      // DocumentFragment: tek seferde DOM'a bas, reflow minimuma iner
      const frag = document.createDocumentFragment();
      entries.forEach(entry => {
        const div = document.createElement("div");
        div.style.cssText = `padding:3px 6px;border-bottom:1px solid #1A1D30;font-size:10px;font-family:monospace;line-height:1.4;background:${entry.cat==="error"?"#200A0A":entry.cat==="warn"?"#1A1008":"transparent"}`;
        const color = COLORS[entry.cat] || COLORS.info;
        const _dStr = entry.data !== null && entry.data !== undefined
          ? (typeof entry.data === "object"
              ? JSON.stringify(entry.data, null, 0).replace(/"(\w+)":/g,"$1:").slice(0,150)
              : String(entry.data).slice(0,150))
          : "";
        div.innerHTML = '<span style="color:#4A5568;font-size:9px">' + entry.ts + '</span>' +
          '<span style="color:' + color + ';font-weight:700;margin:0 3px;font-size:9px">[' + entry.cat.toUpperCase() + ']</span>' +
          '<span style="color:#C8D0E0;font-size:10px">' + entry.msg + '</span>' +
          (_dStr ? '<span style="color:#6B7A9B;margin-left:4px;font-size:9px">' + _dStr + '</span>' : '');
        frag.appendChild(div);
      });
      _list.appendChild(frag); // TEK DOM hamlesi
    },
    snapshot: () => {
      const txt = logs.map(l => `[${l.ts}][${l.cat}] ${l.msg} ${l.data ? JSON.stringify(l.data) : ""}`).join("\n");
      // iOS Safari uyumlu: önce senkron execCommand
      const _copied = (() => { try { const t=document.createElement("textarea"); t.value=txt; t.style.cssText="position:fixed;top:-999px;opacity:0"; document.body.appendChild(t); t.focus(); t.select(); const ok=document.execCommand("copy"); document.body.removeChild(t); return ok; } catch(e){return false;} })();
        if (_copied) { alert("Debug log kopyalandı!"); }
        else if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(txt).then(()=>alert("Kopyalandı!")).catch(()=>console.log(txt));
        } else { console.log(txt); }
    },
    getLogs: () => logs,
    getErrors: () => logs.filter(l => l.cat === "error"),
    switchTab: (tab) => _switchTab(tab),
    dirLevelStart: (lvl, cfg, gc) => _dirLevelStart(lvl, cfg, gc),
    dirMove: (outcome, gc) => _dirObserveMove(outcome, gc),
    dirLevelEnd: (won, gc) => _dirLevelEnd(won, gc),
    analyticsMove: (outcome, gc) => _analyticsOnMove(outcome, gc),
    analyticsLevelStart: (lvl, cfg, gc) => _analyticsOnLevelStart(lvl, cfg, gc),
    analyticsLevelEnd: (won, gc, dda) => _analyticsOnLevelEnd(won, gc, dda),
    renderStats: () => { if (_currentTab === "stats") _renderStats(); },
    renderDirector: () => { if (_currentTab === "dir") _renderDirector(); },
    renderShapes: () => { if (_currentTab === "shapes") _renderShapes(); },
    dirHealth:  () => _dirHealthScore(),
    dirNotes:   () => _dirNotes(),
    dirActive:  () => _dir.current ? {
      level: _dir.current.level, moves: _dir.current.moves_made,
      nineEff: _dir.current.moves_made ? (_dir.current.nine_moves/_dir.current.moves_made) : 0,
    } : null,
    dirHistory: (n=5) => _dir.history.slice(-n).reverse(),
    getAnalytics: () => _analytics,
  };
})();
// [Oturum 46] F9Bot'la AYNI sebep — bu panelin bazı butonları
// onclick="F9Debug...." HTML string attribute'u kullanıyor (GLOBAL
// kapsamda çalışır, IIFE closure'ına erişemez). Bkz. debug/bot.js'teki
// aynı düzeltmenin notu.
if (typeof window !== "undefined") window.F9Debug = F9Debug;





// ══════════════════════════════════════════════════════
// F9 BASKI DALGASI — "Tetris Hissi" Zorluk Mekaniği
//
// Her N hamlede alt satır engel doluyor, yukarı kayıyor.
// Oyuncu 9 üretince eşleşme gücüne göre engelleri kırar.
// Üst satıra ulaşırsa GAME OVER.
// ══════════════════════════════════════════════════════
