// [Oturum 16 — ui/ katmanı] Ekran render fonksiyonları.
// core/game-engine.js'ten taşındı — davranış BİREBİR AYNI.

function showNoTubesModal() {
  const tl = tubeTimeLeft();
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;";
  overlay.innerHTML = `
    <div style="background:#13162A;border:1px solid #534AB744;border-radius:16px;padding:24px;max-width:300px;width:90%;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">⏳</div>
      <div style="font-size:17px;font-weight:700;color:#F2EBE0;margin-bottom:6px">Güç Tüpleri Bitti!</div>
      <div style="font-size:13px;color:#A89B89;margin-bottom:16px">Sonraki tüp: <b style="color:#E0B23C">${formatTime(tl)}</b></div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div style="font-size:24px;text-align:center">
      ${"❤️".repeat(state.tubes)}${"🖤".repeat(state.maxTubes-state.tubes)}
    </div>
      </div>
      <button id="f9-tube-ad-btn" style="width:100%;padding:10px;background:#1A1E35;border:1px solid #534AB7;border-radius:10px;color:#AFA9EC;font-size:13px;cursor:pointer;margin-bottom:8px">📺 Reklam izle → +1 Tüp</button>
      <button id="f9-tube-wait-btn" style="width:100%;padding:10px;background:transparent;border:none;color:#A89B89;font-size:12px;cursor:pointer">Bekle</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("f9-tube-ad-btn")?.addEventListener("click", () => {
    overlay.remove();
    showAdForTube();
  });
  document.getElementById("f9-tube-wait-btn")?.addEventListener("click", () => {
    overlay.remove();
  });
}

function showAdForTube() {
  // Simüle reklam
  setTimeout(() => {
    state.tubes = Math.min(state.maxTubes, state.tubes + 1);
    saveGame();
    state.message = "📺 Reklam izlendi! +1 Tüp kazandın.";
    render();
  }, 1000);
}

function showJackpotAnimation() {
  const overlay = document.createElement("div");
  overlay.id = "f9-jackpot-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:8888;pointer-events:none;display:flex;align-items:center;justify-content:center;";
  overlay.innerHTML = `
    <div style="text-align:center;animation:f9-jackpot-pop 0.6s ease-out">
      <div style="font-size:60px;filter:drop-shadow(0 0 20px gold)">💎</div>
      <div style="font-size:32px;font-weight:900;color:#FFD700;text-shadow:0 0 30px gold;margin-top:8px">JACKPOT!</div>
      <div style="font-size:16px;color:#fff;margin-top:4px">+20 Hamle · +50 Enerji</div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2500);
}

function renderLoading() {
  root.innerHTML = `
    <div class="f9-wrap f9-screen-center">
      <div class="f9-logo-anim">
        <span style="color:#E2622B">F</span><span style="color:#E0B23C">U</span><span style="color:#639922">S</span><span style="color:#3E8FD4">I</span><span style="color:#B95DE0">O</span><span style="color:#D4537E">N</span><span style="color:#E0B23C;font-size:1.2em">9</span>
      </div>
      <div class="f9-loading-bar"><div class="f9-loading-fill"></div></div>
    </div>
  `;
  // 1.5 saniye sonra menüye geç
  state.screen = "menu"; render();
}

function renderMap() {
  // [DÜZELTME — Oturum 21, kullanıcı raporu: "motor bir şey üretiyor,
  // UI başka şey gösteriyor"] Burada eskiden YEREL, eski (8 bölüm, level
  // 70'e kadar) bir CHAPTERS dizisi vardı — content/levels/chapter-
  // database.js'teki asıl 20 bölümlük veriden TAMAMEN BAĞIMSIZDI. Level
  // 71+ oyuncular haritada hep "Sonsuz Kulesi" görüyordu ama motorun
  // asıl görev sistemi onları Volkan Adası/Kar Zirvesi/vb. gerçek
  // bölümlerde takip ediyordu — gerçek, oyuncuya görünür bir tutarsızlık.
  // Artık TEK yetkili kaynaktan (content/worlds/world-metadata.js) türetiliyor.
  const CHAPTERS = WORLD_DATABASE.map(w => ({
    name: w.name, icon: w.icon, color: w.color,
    min: w.levelRange[0], max: w.levelRange[1] ?? 99999,
  }));

  const curLevel = state.levelNumber;
  const curChapter = CHAPTERS.findIndex(c => curLevel >= c.min && curLevel <= c.max);

  root.innerHTML = `
    <div class="f9-wrap">
      <div class="f9-topbar" style="margin-bottom:12px">
        <button class="f9-back-btn" id="btn-map-back">← Menü</button>
        <div style="font-size:15px;font-weight:700;color:#F2EBE0">Harita</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px">
        ${CHAPTERS.map((ch, ci) => {
          const done    = curLevel > ch.max;
          const active  = ci === curChapter;
          const locked  = curLevel < ch.min;
          const progress = active
            ? Math.round(((curLevel - ch.min) / (Math.min(ch.max,999) - ch.min + 1)) * 100)
            : done ? 100 : 0;

          return `
          <div class="f9-chapter ${active?'f9-chapter-active':done?'f9-chapter-done':'f9-chapter-locked'}"
               id="ch-${ci}" style="border-color:${active?ch.color+'99':done?ch.color+'44':'#252A45'}">
            <div class="f9-ch-icon">${ch.icon}</div>
            <div class="f9-ch-body">
              <div class="f9-ch-name" style="color:${locked?'#555':done?ch.color:active?'#F2EBE0':'#F2EBE0'}">${ch.name}</div>
              <div class="f9-ch-sub">
                ${done   ? `<span style="color:#5DCAA5">✓ Tamamlandı</span>` : ''}
                ${active ? `<span style="color:${ch.color}">Level ${curLevel} · %${progress}</span>` : ''}
                ${locked ? `<span style="color:#444">🔒 Level ${ch.min}'de açılır</span>` : ''}
              </div>
              ${active ? `
              <div class="f9-ch-bar">
                <div class="f9-ch-fill" style="width:${progress}%;background:${ch.color}"></div>
              </div>` : ''}
            </div>
            <div class="f9-ch-right">
              ${done   ? `<span style="color:#5DCAA5;font-size:20px">✅</span>` : ''}
              ${active ? `<button class="f9-ch-play" id="ch-play-${ci}" style="background:${ch.color};color:#0A0C1A">▶ Oyna</button>` : ''}
              ${locked ? `<span style="color:#333;font-size:18px">🔒</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>

      <button class="f9-play-btn" id="btn-map-play" style="margin-top:16px">
        <span style="font-size:22px">▶</span>
        <span>Level ${curLevel} Devam Et</span>
      </button>
    </div>
  `;

  document.getElementById("btn-map-back")?.addEventListener("click", () => { state.screen="menu"; render(); });
  document.getElementById("btn-map-play")?.addEventListener("click", () => { state.screen="level_start"; render(); });
  // Her bölümün oyna butonu
  CHAPTERS.forEach((ch, ci) => {
    document.getElementById(`ch-play-${ci}`)?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.screen = "level_start"; render();
    });
  });
}

function renderLevelStart() {
  const _lsCfg = generateLevel(state.levelNumber, state.seed||0);
  const _lsMilestone = _lsCfg.milestone;
  const cfg = generateLevel(state.levelNumber, 7);
  const tierColors = { kolay:"#5DCAA5", orta:"#E0B23C", zor:"#E0473C", uzman:"#B95DE0", pro:"#3E8FD4" };
  const _lvGoal3 = getLevelGoal(state.levelNumber);
  const _goal3 = _lvGoal3.goal;
  const tierColor = tierColors[cfg.tierName] || "#F2EBE0";

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center" style="gap:20px">
      <div style="font-size:14px;color:#A89B89">Hazır mısın?</div>
      <div style="font-size:52px;font-weight:900;color:#F2EBE0">Level ${state.levelNumber}</div>
      <div style="background:${tierColor}22;border:1px solid ${tierColor}66;border-radius:20px;padding:6px 20px;color:${tierColor};font-size:14px;font-weight:600">
        ${fmtTier(cfg.tierName)}
      </div>
      <div style="display:flex;gap:16px;margin:8px 0">
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:700;color:#F2EBE0">${cfg.moves}</div>
          <div style="font-size:11px;color:#A89B89">Hamle</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:700;color:#F2EBE0">${cfg.blockerCount || 0}</div>
          <div style="font-size:11px;color:#A89B89">Engel</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:700;color:#F2EBE0">❤️ ${state.tubes}/${state.maxTubes}</div>
          <div style="font-size:11px;color:#A89B89">Can</div>
        </div>
      </div>
      <div style="background:rgba(19,22,42,0.95);border:1px solid #252A45;border-radius:12px;padding:12px 16px;text-align:center;margin:8px 0">
        <div style="font-size:24px">${goalIcon(_goal3)}</div>
        <div style="font-size:14px;font-weight:700;color:#F2EBE0;margin-top:4px">${goalLabel(_goal3)}</div>
        <div style="font-size:11px;color:#A89B89;margin-top:2px">Hedef</div>
      </div>
      ${(()=>{ const s=dda.status(); return s?`<div style="background:${s.color}22;border:1px solid ${s.color}44;border-radius:8px;padding:8px;text-align:center;font-size:12px;color:${s.color}">${s.text}</div>`:''; })()}
      ${_lsCfg && _lsCfg.isBreathe ? `<div style="background:#0A1A0A;border:1px solid #1A4A2A;border-radius:10px;padding:7px 14px;margin:0 0 10px;font-size:11px;color:#4FB87A;text-align:center">😌 Nefes Alma Level — Biraz Daha Kolay</div>` : ''}
      ${_lsMilestone ? `<div style="background:#1A1038;border:1px solid #534AB7;border-radius:10px;padding:7px 14px;margin:0 0 10px;font-size:11px;color:#A78BFA;text-align:center">${_lsMilestone.icon} Milestone Level!</div>` : ''}
      <button class="f9-play-btn" id="btn-start-game">
        <span style="font-size:24px">▶</span>
        <span>OYNA</span>
      </button>
      <button class="f9-back-btn" id="btn-start-back" style="background:transparent;border:1px solid #333">
        ← Haritaya Dön
      </button>
    </div>
  `;

  document.getElementById("btn-start-game")?.addEventListener("click", () => {
    // Can kontrolü
    refillTubes();
    F9Debug.log("game", `Tubes: ${state.tubes}/${state.maxTubes}`);
  // [Oturum 50 — KRİTİK HATA DÜZELTMESİ, kullanıcı bulgusu: "oyun
  // açmıyor"] Oturum 49'da buradaki level-kurulum kodu "duplicate,
  // newLevel() zaten yapıyor" varsayımıyla SİLİNMİŞTİ — AMA BU YANLIŞ
  // BİR VARSAYIMDI: `newLevel()` gerçek oyuncu akışında (menü→harita→
  // level_start→OYNA) HİÇBİR YERDE çağrılmıyordu (grep ile doğrulandı
  // — sadece kendi tanımı, debug/bot.js, ve level-atlama butonlarında
  // geçiyor). Sonuç: `state.gc` HİÇ KURULMUYORDU, `render()`'ın
  // `if (!gc) { renderMenu(); return; }` dalına düşüp OYUN EKRANI
  // YERİNE HER ZAMAN ANA MENÜ gösteriyordu — oyun fiilen "açılmıyordu".
  // DÜZELTME: eski (yanlış seed=7 kullanan, Oturum 49'un doğru tespit
  // ettiği) kodun YERİNE, GERÇEK `newLevel()` (flow/levelFlow.js —
  // Oturum 43'ün BAKED_REFERENCE_SEED mantığını doğru kullanan)
  // çağrılıyor. Oturum 49'un TEŞHİSİ (seed=7/undefined goal.value
  // hatası) doğruydu, ama ÇÖZÜMÜ (kodu tamamen silmek) yanlıştı —
  // doğrusu, hatalı kodu DOĞRU newLevel() çağrısıyla DEĞİŞTİRMEKTİ.
  newLevel(state.levelNumber);
  // Analytics + Direktör: level başlangıcı
  F9Debug.analyticsLevelStart(state.levelNumber, state.cfg, state.gc);
  F9Debug.dirLevelStart(state.levelNumber, state.cfg, state.gc);
  F9Difficulty.levelStart();
  // İpucu sistemi aktif
  F9Hint.activate();
  // Churn DDA: aynı levelde çok kez kaybedildiyse cfg'yi sessizce güncelle
  if (typeof F9Churn !== "undefined") {
    state.cfg = F9Churn.applyChurnDDA(state.levelNumber, state.cfg);
    if (state.gc) {
      state.gc.targetScore = state.cfg.targetScore;
      state.gc.movesLimit  = state.cfg.moves;
    }
    // [Oturum 45 — KRİTİK HATA DÜZELTMESİ, kullanıcı bulgusu: skor
    // hedefin %225'iydi ama oyun "kaybettin" diyordu] ESKİDEN burada
    // SADECE state.cfg/state.gc.targetScore güncelleniyordu —
    // state.levelGoal.value (checkAndTransition()'ın GERÇEK kazanma
    // kararını verdiği kaynak, bkz. flow/transitionFlow.js) HİÇ
    // SENKRONİZE EDİLMİYORDU. Sonuç: ekranda churn ile DÜŞÜRÜLMÜŞ
    // (kolaylaştırılmış) bir hedef görünüyordu ama gerçek kazanma
    // kontrolü hâlâ ESKİ/YÜKSEK levelGoal.value'ya göre yapılıyordu —
    // oyuncu ekrandaki hedefi (hatta ondan çok daha fazlasını) geçse
    // bile KAYBEDEBİLİYORDU. Bu, projedeki "duality" hata sınıfının
    // (bkz. Oturum 18) bir başka örneği — iki state alanı (cfg.
    // targetScore ve levelGoal.value) aynı kavramı BAĞIMSIZ tutuyordu.
    if (state.levelGoal?.type === "score") state.levelGoal.value = state.cfg.targetScore;
  }
  // Baskı dalgası — bölüm 6'dan itibaren aktif
  const _waveChapter = Math.ceil((state.levelNumber||1) / 10) || 1;
  if (_waveChapter >= 6) {
    F9Wave.activate(_waveChapter);
    F9Debug.log("game", `[DALGA] Aktifleşti — bölüm ${_waveChapter}, interval=${waveInterval(_waveChapter)}`);
  } else {
    F9Wave.deactivate();
  }
  state.selected = null;
  state.neighbors = [];
  state.pendingOptions = null;
  state.message = "";
  state.glowCells = new Map();
  state.blastFlashCells = new Set();
  state.brokenBlockerFlash = new Set();
  state.screen = "game";
  saveGame();
  render();
  });
  document.getElementById("btn-start-back")?.addEventListener("click", () => { state.screen = "map"; render(); });
}

function renderWin() {
  F9Debug.log("game", "WIN!", {lvl:state.levelNumber, score:state.gc?.score, target:state.cfg?.targetScore});
  F9Hint.deactivate();
  // [Oturum 52 — Event Bus] LevelCompleted — F9GameFeel artık BUNU
  // DİNLİYOR (fx/game-feel.js init()), doğrudan çağrılmıyor.
  if (typeof F9Events !== "undefined") F9Events.emit("LevelCompleted", { levelNumber: state.levelNumber, score: state.gc?.score, target: state.levelGoal?.value });
  if (typeof F9Churn !== "undefined") F9Churn.record(state.levelNumber, true);
  F9Debug.analyticsLevelEnd(true, state.gc, dda);
  F9Debug.dirLevelEnd(true, state.gc);
  F9Difficulty.levelEnd(true, state.gc);
  dda.record(true);
  // XP kazan
  const xpGain = 10 + (state.levelNumber * 2);
  state.xp = (state.xp||0) + xpGain;
  // Seviye atla: her 100 XP'de bir seviye
  const newLevel = Math.floor(state.xp / 100) + 1;
  if (newLevel > (state.playerLevel||1)) {
    state.playerLevel = newLevel;
  }
  saveGame();
  const me = LEAGUE_BOARD.find(e => e.isMe);
  if (me) {
    me.score += (state.gc?.score || 0);
    me.name = state.playerName || "Oyuncu";
  }
  LEAGUE_BOARD.sort((a,b) => b.score-a.score);
  const myRank = LEAGUE_BOARD.filter(e=>!e.isMe&&e.score>(me?.score||0)).length+1;
  const top5 = myRank <= 5;
  playSound("gift");
  saveGame();

  // Nefes alma ve milestone verilerini al
  const _nextCfg = generateLevel(state.levelNumber + 1, state.seed);
  const _milestone = generateLevel(state.levelNumber, state.seed).milestone;
  const _isBreathe = generateLevel(state.levelNumber, state.seed).isBreathe;

  // Milestone kutlama HTML'i
  const milestoneHtml = _milestone ? `
    <div style="background:linear-gradient(135deg,#1A1038,#2A1058);border:1px solid #7B5CF6;border-radius:14px;padding:16px 20px;margin:12px 0;text-align:center;animation:f9-milestone-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)">
      <div style="font-size:36px;margin-bottom:6px">${_milestone.icon}</div>
      <div style="font-size:14px;font-weight:700;color:#A78BFA;margin-bottom:2px">🎊 MİLESTONE!</div>
      <div style="font-size:13px;color:#E8E2D8">${_milestone.msg}</div>
    </div>` : '';

  // Nefes alma bildirimi
  const breatheHtml = _nextCfg.isBreathe ? `
    <div style="background:#0A1A0A;border:1px solid #1A4A2A;border-radius:10px;padding:8px 14px;margin:8px 0;font-size:12px;color:#4FB87A;text-align:center">
      😌 Sonraki level nefes alma — biraz daha kolay!
    </div>` : '';

  // [Oturum 45 — KRİTİK HATA DÜZELTMESİ] ESKİDEN burada `state.cfg?.
  // targetScore || 630` kullanılıyordu — ama `checkAndTransition()`'ın
  // GERÇEK karar kaynağı `state.levelGoal.value` (bkz. flow/
  // transitionFlow.js). Eğer `state.cfg` herhangi bir nedenle (örn.
  // sayfa yenileme/state senkron kaybı) tanımsız kalırsa, ekranda
  // BASE_TARGET_SCORE'un (630) fallback'i görünüyordu — GERÇEK karar
  // mekanizmasından TAMAMEN FARKLI bir sayı (kullanıcı ekran
  // görüntüsüyle bulundu: skor hedefin %225'iydi ama ekranda "630
  // Hedef" ile kayıp gösteriliyordu). Artık HER ZAMAN karar
  // mekanizmasıyla AYNI kaynak kullanılıyor — ikisi asla ayrışamaz.
  const _goal = state.levelGoal?.value ?? state.cfg?.targetScore ?? 630;
  const _score = state.gc?.score || 0;
  const _movesLeft = state.gc?.movesLimit - state.gc?.movesUsed || 0;
  const stars = _score >= _goal * 1.5 && _movesLeft >= 5 ? 3
              : _score >= _goal * 1.2 ? 2 : 1;
  const starsHtml = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center">
      <div style="font-size:52px;animation:f9-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1)">${_milestone ? _milestone.icon : '🎉'}</div>
      <div style="font-size:24px;font-weight:900;color:#F2EBE0;margin:6px 0">${_milestone ? 'Harika!' : 'Level Tamam!'}</div>
      <div style="font-size:22px;margin:2px 0">${starsHtml}</div>
      <div style="font-size:14px;color:#A89B89;margin:6px 0">Level ${state.levelNumber} · <span style="color:#E0B23C;font-weight:700">${_score.toLocaleString()}</span> puan</div>
      ${milestoneHtml}
      ${breatheHtml}
      <div style="display:flex;gap:10px;margin:12px 0">
        <div class="f9-result-stat">
          <div style="font-size:18px;font-weight:800;color:#E0B23C">#${myRank}</div>
          <div style="font-size:10px;color:#A89B89">Lig Sıran</div>
        </div>
        <div class="f9-result-stat">
          <div style="font-size:18px;font-weight:800;color:#4FB87A">+${xpGain}</div>
          <div style="font-size:10px;color:#A89B89">XP</div>
        </div>
        <div class="f9-result-stat">
          <div style="font-size:18px;font-weight:800;color:#7B5CF6">${_movesLeft}</div>
          <div style="font-size:10px;color:#A89B89">Kalan Hamle</div>
        </div>
        ${top5?`<div class="f9-result-stat" style="border-color:#E0B23C44;background:rgba(224,178,60,0.1)">
          <div style="font-size:16px">💎</div>
          <div style="font-size:10px;color:#E0B23C">Ödül Zonu!</div>
        </div>`:''}
      </div>
      <button class="f9-play-btn" id="btn-win-next">
        <span>Sonraki Level →</span>
      </button>
      <button class="f9-back-btn" id="btn-win-reward" style="margin-top:8px;background:rgba(83,74,183,0.2);border-color:#534AB7">
        🎁 Ödülleri Gör
      </button>
      <button class="f9-back-btn" id="btn-win-map" style="margin-top:8px;background:transparent;border:1px solid #333">
        🗺️ Haritaya Dön
      </button>
    </div>
  `;

  document.getElementById("btn-win-next")?.addEventListener("click", () => {
    const _nextLvl = state.levelNumber + 1;
    // Milestone efekti: özel level'larda state güncelle
    const _msCfg = generateLevel(_nextLvl, 0);
    if (_msCfg.milestone) {
      // Milestone bildirimi state'e kaydet
      if (!state.unlockedMilestones) state.unlockedMilestones = [];
      state.unlockedMilestones.push({ level: _nextLvl, ...(_msCfg.milestone) });
      saveGame();
    }
    state.levelNumber = _nextLvl;
    state.seed = (Date.now() ^ Math.trunc(Math.random()*0xFFFFFF));
    state.screen = "league"; render();
  });
  document.getElementById("btn-win-reward")?.addEventListener("click", () => { state.screen = "reward"; render(); });
  document.getElementById("btn-win-map")?.addEventListener("click", () => { state.screen = "map"; render(); });
}

function renderLose() {
  F9Debug.log("game", "LOSE", {lvl:state.levelNumber, score:state.gc?.score, target:state.cfg?.targetScore});
  F9Hint.deactivate();
  // [Oturum 52 — Event Bus] LevelFailed — F9GameFeel artık BUNU
  // DİNLİYOR (fx/game-feel.js init()), doğrudan çağrılmıyor.
  if (typeof F9Events !== "undefined") F9Events.emit("LevelFailed", { levelNumber: state.levelNumber, score: state.gc?.score, target: state.levelGoal?.value });
  if (typeof F9Churn !== "undefined") F9Churn.record(state.levelNumber, false);
  F9Debug.analyticsLevelEnd(false, state.gc, dda);
  F9Debug.dirLevelEnd(false, state.gc);
  F9Difficulty.levelEnd(false, state.gc);
  dda.record(false); // Kaybetti — DDA'ya bildir
  const gc = state.gc;
  const canAd = !gc.adContinueUsed;
  let previewReward = AD_CONTINUE_EXTRA_MOVES;
  if (gc.movesLimit !== null) {
    previewReward = Math.round(gc.movesLimit * AD_CONTINUE_MOVES_RATIO);
    previewReward = Math.max(AD_CONTINUE_MIN_MOVES, Math.min(AD_CONTINUE_MAX_MOVES, previewReward));
  }

  // [Oturum 45 — KRİTİK HATA DÜZELTMESİ] ESKİDEN `state.cfg?.
  // targetScore || 630` — checkAndTransition()'ın karar kaynağından
  // (`state.levelGoal.value`) FARKLI. Kullanıcı ekran görüntüsüyle
  // bulundu: skor 1420, hedef GERÇEKTE muhtemelen çok daha düşüktü
  // (kazanmış olması gerekiyordu) ama `state.cfg` tanımsız kaldığı
  // için ekranda BASE_TARGET_SCORE fallback'i (630) gösteriliyordu —
  // "İlerleme %225" ile birlikte KAYIP ekranı gösterilmesi bu yüzden
  // tutarsız görünüyordu. Artık HER ZAMAN aynı kaynak kullanılıyor.
  const _lScore = state.gc?.score || 0;
  const _lTarget = state.levelGoal?.value ?? state.cfg?.targetScore ?? 630;
  const _lGap = _lTarget - _lScore;
  const _lPct = Math.round((_lScore / _lTarget) * 100);
  const _lBest = Math.max(_lScore, state.bestScore?.[state.levelNumber] || 0);
  if (!state.bestScore) state.bestScore = {};
  state.bestScore[state.levelNumber] = _lBest;
  saveGame();

  // Motivasyon mesajı — ne kadar yaklaştı?
  const _lMsg = _lPct >= 90 ? "Çok yaklaştın! 🔥" :
                _lPct >= 70 ? "İyi gidiyordun!" :
                _lPct >= 50 ? "Biraz daha pratik!" : "Tekrar dene!";

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center">
      <div style="font-size:56px">😔</div>
      <div style="font-size:24px;font-weight:900;color:#F2EBE0;margin:8px 0">Yeterli Puan Yok!</div>
      <div style="font-size:13px;color:#A89B89;margin-bottom:8px">Level ${state.levelNumber} · ${_lMsg}</div>

      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:10px">
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:800;color:#E0473C">${_lScore.toLocaleString()}</div>
          <div style="font-size:10px;color:#A89B89">Puanın</div>
        </div>
        <div style="font-size:22px;color:#333;align-self:center">/</div>
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:800;color:#A89B89">${_lTarget.toLocaleString()}</div>
          <div style="font-size:10px;color:#A89B89">Hedef</div>
        </div>
      </div>

      <div style="background:#0D0F1E;border:1px solid #1E2245;border-radius:10px;padding:10px 14px;margin-bottom:12px;width:100%">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:11px;color:#A89B89">İlerleme</span>
          <span style="font-size:11px;font-weight:700;color:${_lPct>=90?'#4FB87A':_lPct>=50?'#E0B23C':'#E0473C'}">${_lPct}%</span>
        </div>
        <div style="background:#1A1D38;border-radius:4px;height:6px;overflow:hidden">
          <div style="width:${_lPct}%;height:100%;background:${_lPct>=90?'#4FB87A':_lPct>=50?'#E0B23C':'#E0473C'};border-radius:4px;transition:width .5s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <span style="font-size:10px;color:#534AB7">En yüksek skor: ${_lBest.toLocaleString()}</span>
          <span style="font-size:10px;color:#E0473C">${_lGap > 0 ? _lGap.toLocaleString() + ' puan eksik' : '✓'}</span>
        </div>
      </div>
      ${canAd ? `
      <button class="f9-play-btn" id="btn-lose-ad" style="background:linear-gradient(145deg,#1A1E35,#252A50);border:1px solid #534AB7">
        <span style="font-size:20px">📺</span>
        <span>Reklam izle → +${previewReward} Hamle</span>
      </button>` : `
      <div style="font-size:12px;color:#A89B89;padding:12px;background:#0D0F1E;border-radius:8px;margin-bottom:12px">
        Bu level için reklam hakkı kullanıldı
      </div>`}
      <button class="f9-back-btn" id="btn-lose-retry" style="margin-top:8px;background:rgba(19,22,42,0.9);border-color:#252A45">
        🔄 Tekrar Dene
      </button>
      <button class="f9-back-btn" id="btn-lose-map" style="margin-top:8px;background:transparent;border:1px solid #333">
        🗺️ Haritaya Dön
      </button>
    </div>
  `;

  document.getElementById("btn-lose-ad")?.addEventListener("click", watchAd);
  document.getElementById("btn-lose-retry")?.addEventListener("click", () => {
    state.screen = "level_start"; render();
  });
  document.getElementById("btn-lose-map")?.addEventListener("click", () => {
    state.screen = "map"; render();
  });
}

function renderReward() {
  const me = LEAGUE_BOARD.find(e => e.isMe);
  const myRank = LEAGUE_BOARD.filter(e=>!e.isMe&&e.score>(me?.score||0)).length+1;
  const rewards = myRank===1 ? [{icon:"💎",val:"×20",lbl:"Kristal"}] :
                  myRank===2 ? [{icon:"💎",val:"×15",lbl:"Kristal"}] :
                  myRank===3 ? [{icon:"💎",val:"×10",lbl:"Kristal"}] :
                  myRank<=5  ? [{icon:"💎",val:"×5", lbl:"Kristal"}] :
                               [{icon:"⚡",val:"+10",lbl:"Enerji"}];

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center">
      <div style="font-size:13px;color:#A89B89;margin-bottom:4px">Haftalık Ödül</div>
      <div style="font-size:24px;font-weight:900;color:#F2EBE0;margin-bottom:20px">🏆 #${myRank}. Sıra</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
        ${rewards.map(r=>`
          <div style="background:rgba(19,22,42,0.95);border:1px solid #252A45;border-radius:14px;padding:20px 24px;text-align:center">
            <div style="font-size:36px">${r.icon}</div>
            <div style="font-size:22px;font-weight:800;color:#E0B23C;margin-top:6px">${r.val}</div>
            <div style="font-size:11px;color:#A89B89">${r.lbl}</div>
          </div>
        `).join('')}
      </div>
      <button class="f9-play-btn" id="btn-reward-claim">
        <span>Ödülü Al! ✨</span>
      </button>
      <button class="f9-back-btn" id="btn-reward-menu" style="margin-top:8px;background:transparent;border:1px solid #333">
        Ana Menü
      </button>
    </div>
  `;

  document.getElementById("btn-reward-claim")?.addEventListener("click", () => {
    // Enerji ekle
    state.energyTracker.energy += 10;
    saveGame();
    state.screen = "menu";
    render();
  });
  document.getElementById("btn-reward-menu")?.addEventListener("click", () => { state.screen = "menu"; render(); });
}

function renderAccount() {
  const plvl    = state.playerLevel || 1;
  const pxp     = state.xp || 0;
  const pct     = xpProgress(pxp, plvl);
  const title   = getPlayerTitle(plvl);
  const av      = AVATARS[state.avatar || 0];
  const nextXP  = xpForNextLevel(plvl);
  const curXP   = pxp - (plvl-1)*XP_PER_LEVEL;
  const TIER_ICONS2 = {bronz:'🥉',gumus:'🥈',altin:'🥇',elmas:'💎',sampiyonluk:'🏆'};
  const ligIcon = TIER_ICONS2[state.league?.tier||'bronz']||'🥉';
  const ligName = {bronz:'Bronz',gumus:'Gümüş',altin:'Altın',elmas:'Elmas',sampiyonluk:'Şampiyonluk'}[state.league?.tier||'bronz']||'Bronz';

  root.innerHTML = `
    <div class="f9-wrap">
      <div class="f9-topbar" style="margin-bottom:16px">
        <button class="f9-back-btn" id="btn-acc-back">← Menü</button>
        <div style="font-size:15px;font-weight:700;color:#F2EBE0">Profil</div>
      </div>

      <!-- Avatar + İsim -->
      <div style="background:linear-gradient(145deg,rgba(83,74,183,0.2),rgba(19,22,42,0.95));border:1px solid #534AB744;border-radius:16px;padding:20px;margin-bottom:12px;text-align:center">
        <!-- Avatar seçici -->
        <div style="position:relative;display:inline-block;margin-bottom:12px">
          <div id="btn-avatar" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(145deg,#534AB7,#3D3480);display:flex;align-items:center;justify-content:center;font-size:40px;cursor:pointer;border:3px solid #E0B23C;box-shadow:0 0 16px #534AB744;margin:0 auto">
            ${av}
          </div>
          <div style="position:absolute;bottom:0;right:0;background:#E0B23C;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" id="btn-avatar">✏️</div>
        </div>

        <!-- İsim -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px">
          <span style="font-size:20px;font-weight:900;color:#F2EBE0">${state.playerName||'Oyuncu'}</span>
          <button id="btn-acc-rename" style="background:transparent;border:1px solid #252A45;border-radius:6px;padding:3px 8px;color:#A89B89;font-size:11px;cursor:pointer">✏️</button>
        </div>
        <div style="font-size:12px;color:#E0B23C;font-weight:700">${title}</div>
        <div style="font-size:11px;color:#A89B89;margin-top:2px">${ligIcon} ${ligName} Ligi · ${state.loginStreak||0} gün 🔥</div>

        <!-- XP Bar -->
        <div style="margin-top:14px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#A89B89;margin-bottom:4px">
            <span>Seviye ${plvl}</span>
            <span>${curXP} / ${XP_PER_LEVEL} XP</span>
          </div>
          <div style="height:8px;background:#1A1E35;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#534AB7,#E0B23C);border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:10px;color:#555;margin-top:4px">Sonraki seviye: ${XP_PER_LEVEL - curXP} XP</div>
        </div>
      </div>

      <!-- İstatistikler -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px">
        ${[
          {v: dda.totalPlayed,                    label:'Oyun',    color:'#F2EBE0', icon:'🎮'},
          {v: dda.totalWon,                       label:'Kazanma', color:'#5DCAA5', icon:'🏆'},
          {v: Math.round(dda.winRate()*100)+'%',  label:'Başarı',  color:'#E0B23C', icon:'⭐'},
          {v: state.loginStreak||0,               label:'Streak',  color:'#E0473C', icon:'🔥'},
        ].map(s=>`
          <div style="background:rgba(19,22,42,0.95);border:1px solid #252A45;border-radius:10px;padding:10px 6px;text-align:center">
            <div style="font-size:16px">${s.icon}</div>
            <div style="font-size:16px;font-weight:800;color:${s.color}">${s.v}</div>
            <div style="font-size:9px;color:#A89B89">${s.label}</div>
          </div>`).join('')}
      </div>

      <!-- Avatar Seçici Grid (gizli, tıklanınca açılır) -->
      <div id="avatar-picker" style="display:none;background:rgba(19,22,42,0.98);border:1px solid #252A45;border-radius:12px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;color:#A89B89;margin-bottom:8px">Avatar Seç:</div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
          ${AVATARS.map((a,i)=>`
            <div class="avatar-opt" data-i="${i}" style="width:100%;aspect-ratio:1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;background:${i===(state.avatar||0)?'#534AB733':'#1A1E35'};border:2px solid ${i===(state.avatar||0)?'#E0B23C':'transparent'}">${a}</div>
          `).join('')}
        </div>
      </div>

      <!-- Menü -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        <button class="f9-acc-item" id="btn-acc-howto"><span>❓ Nasıl Oynanır</span><span>›</span></button>
        <button class="f9-acc-item" id="btn-acc-league"><span>🏆 Lig Sayfası</span><span>›</span></button>
        <button class="f9-acc-item" id="btn-acc-sound"><span>${state._soundOn!==false?'🔊':'🔇'} Ses ${state._soundOn!==false?'Açık':'Kapalı'}</span><span>›</span></button>
      </div>

      <!-- Kayıt Sistemi -->
      <div style="background:rgba(19,22,42,0.95);border:1px solid #252A45;border-radius:12px;padding:14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:#A89B89;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">Kayıt Sistemi</div>

        <!-- Local Save durumu -->
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0B0D1A;border-radius:8px;margin-bottom:8px">
          <span style="font-size:20px">💾</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#F2EBE0">Yerel Kayıt</div>
            <div style="font-size:11px;color:#5DCAA5">✓ Aktif — Cihazda kayıtlı</div>
          </div>
          <button id="btn-export-save" style="background:#1A1E35;border:1px solid #252A45;border-radius:8px;padding:6px 12px;color:#F2EBE0;font-size:11px;cursor:pointer">⬇ Dışa Aktar</button>
        </div>

        <!-- Import -->
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0B0D1A;border-radius:8px;margin-bottom:8px">
          <span style="font-size:20px">📂</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#F2EBE0">Kayıt Yükle</div>
            <div style="font-size:11px;color:#A89B89">JSON dosyasından içe aktar</div>
          </div>
          <label style="background:#1A1E35;border:1px solid #252A45;border-radius:8px;padding:6px 12px;color:#F2EBE0;font-size:11px;cursor:pointer">
            ⬆ Yükle
            <input type="file" id="btn-import-file" accept=".json" style="display:none">
          </label>
        </div>

        <!-- Google Login — yakında -->
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0B0D1A;border-radius:8px;margin-bottom:8px;opacity:.5">
          <span style="font-size:20px">🔵</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#F2EBE0">Google ile Giriş</div>
            <div style="font-size:11px;color:#A89B89">Bulut kayıt — Yakında</div>
          </div>
          <span style="font-size:11px;color:#555;border:1px solid #252A45;border-radius:6px;padding:4px 8px">Yakında</span>
        </div>

        <!-- Apple Login — yakında -->
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0B0D1A;border-radius:8px;opacity:.5">
          <span style="font-size:20px">🍎</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#F2EBE0">Apple ile Giriş</div>
            <div style="font-size:11px;color:#A89B89">Bulut kayıt — Yakında</div>
          </div>
          <span style="font-size:11px;color:#555;border:1px solid #252A45;border-radius:6px;padding:4px 8px">Yakında</span>
        </div>
      </div>

      <button class="f9-play-btn" id="btn-acc-play">
        <span style="font-size:22px">▶</span><span>Oyna</span>
      </button>
    </div>
  `;

  // Eventler
  document.getElementById("btn-acc-back")?.addEventListener("click",  ()=>{ state.screen="menu"; render(); });
  document.getElementById("btn-acc-play")?.addEventListener("click",  ()=>{ state.screen="level_start"; render(); });
  document.getElementById("btn-acc-howto")?.addEventListener("click", ()=>{ state.screen="howto"; render(); });
  document.getElementById("btn-acc-league")?.addEventListener("click",()=>{ state.screen="league"; render(); });
  document.getElementById("btn-acc-sound")?.addEventListener("click", ()=>{ state._soundOn=!state._soundOn; saveGame(); render(); });
  document.getElementById("btn-export-save")?.addEventListener("click", exportSave);
  document.getElementById("btn-import-file")?.addEventListener("change", e=>{ if(e.target.files[0]) importSave(e.target.files[0]); });

  document.getElementById("btn-acc-rename")?.addEventListener("click", () => {
    const name = prompt("Yeni ismin:", state.playerName||"Oyuncu");
    if (name?.trim()) {
      state.playerName = name.trim();
      const me = LEAGUE_BOARD.find(e=>e.isMe);
      if (me) { me.name=state.playerName; }
      saveGame(); render();
    }
  });

  // Avatar picker toggle
  document.querySelectorAll('#btn-avatar').forEach(b => b.addEventListener("click", () => {
    const picker = document.getElementById("avatar-picker");
    if (picker) picker.style.display = picker.style.display==="none" ? "block" : "none";
  }));

  document.querySelectorAll(".avatar-opt").forEach(el => {
    el.addEventListener("click", () => {
      state.avatar = parseInt(el.dataset.i)||0;
      saveGame(); render();
    });
  });
}

function renderDailyReward() {
  const streak = (state.loginStreak || 0) + 1;
  const bonusEnergy = streak >= 7 ? 34 : 24;
  const streakBonus = streak >= 7;

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center" style="gap:14px;padding:28px 16px">

      <div style="font-size:52px;line-height:1">${streak>=7?'🔥':'🌅'}</div>

      <div style="text-align:center">
        <div style="font-size:22px;font-weight:900;color:#F2EBE0">Günlük Giriş Ödülü</div>
        <div style="font-size:13px;color:#A89B89;margin-top:4px">
          ${streak}. gün${streakBonus?' <span style="color:#E0B23C">🔥 Streak bonusu!</span>':''}
        </div>
      </div>

      <div style="background:rgba(19,22,42,0.95);border:1.5px solid #E0B23C44;border-radius:16px;padding:20px 40px;text-align:center;width:100%">
        <div style="font-size:38px">⚡</div>
        <div style="font-size:34px;font-weight:900;color:#E0B23C;margin:4px 0">+${bonusEnergy}</div>
        <div style="font-size:13px;color:#A89B89">Enerji</div>
      </div>

      <div style="font-size:11px;color:#555;margin-bottom:4px">
        Yarın da gir → ${streak+1}. gün${streak+1>=7?' 🔥 MAX bonus':''}
      </div>

      <!-- İki buton: direkt oyna veya menüye git -->
      <button class="f9-play-btn" id="btn-daily-play" style="width:100%;font-size:18px;padding:16px">
        <span style="font-size:22px">▶</span>
        <span>Al ve Oyna</span>
      </button>

      <button id="btn-daily-menu" style="width:100%;padding:13px;border-radius:12px;background:rgba(19,22,42,0.95);border:1px solid #252A45;color:#A89B89;font-size:15px;font-weight:600;cursor:pointer">
        ☰ Menüye Git
      </button>
    </div>
  `;

  function _claimBonus() {
    // streak: renderDailyReward ile aynı hesap (loginStreak+1)
    const newStreak = (state.loginStreak || 0) + 1;
    const _bonus = newStreak >= 7 ? 34 : 24;
    state.lastLoginDate = new Date().toISOString().slice(0,10);
    state.loginStreak   = newStreak;
    state.energyTracker.add(_bonus);
    saveGame();
  }

  // ▶ Al ve Oyna → bölüm bilgisi ekranına git
  document.getElementById("btn-daily-play")?.addEventListener("click", () => {
    _claimBonus();
    state.screen = "play_intro"; render();
  });

  // ☰ Menüye Git → normal menü
  document.getElementById("btn-daily-menu")?.addEventListener("click", () => {
    _claimBonus();
    state.screen = "menu"; render();
  });
}

function renderPlayIntro() {
  // [DÜZELTME — Oturum 21] Aynı tutarsızlık burada da vardı — tek
  // yetkili kaynağa (content/worlds/world-metadata.js) bağlandı.
  const CHAPTERS = WORLD_DATABASE.map(w => ({
    name: w.name, icon: w.icon, color: w.color,
    min: w.levelRange[0], max: w.levelRange[1] ?? 99999,
  }));

  const curLevel = state.levelNumber;
  const ch = CHAPTERS.find(c => curLevel >= c.min && curLevel <= c.max) || CHAPTERS[0];
  const progress = Math.round(((curLevel - ch.min) / (Math.min(ch.max, 999) - ch.min + 1)) * 100);

  // Saat başı ödül kontrolü
  const TUBE_INTERVAL_MS = (state.TUBE_REFILL_SEC || 1800) * 1000;
  const now = Date.now();
  const lastTube = state.lastTubeTime || 0;
  const elapsed = now - lastTube;
  const nextRewardMs = Math.max(0, TUBE_INTERVAL_MS - (elapsed % TUBE_INTERVAL_MS));
  const nextRewardMin = Math.ceil(nextRewardMs / 60000);
  const canClaimTube = state.tubes < state.maxTubes && elapsed >= TUBE_INTERVAL_MS;

  const tubeStatusHtml = canClaimTube
    ? `<div style="font-size:12px;color:#5DCAA5">✓ Can yenilendi! Al!</div>`
    : state.tubes >= state.maxTubes
      ? `<div style="font-size:12px;color:#A89B89">Canlar dolu</div>`
      : `<div style="font-size:12px;color:#A89B89">Sonraki can: ${nextRewardMin} dakika</div>`;
  const tubeClaimBtn = canClaimTube
    ? `<button id="btn-claim-tube" style="background:#5DCAA5;border:none;border-radius:8px;padding:8px 14px;color:#0A0C1A;font-size:12px;font-weight:700;cursor:pointer">Al!</button>`
    : '';

  root.innerHTML = `
    <div class="f9-wrap f9-screen-center" style="gap:14px;padding:28px 16px">

      <!-- 1a1: Hangi bölümde -->
      <div style="width:100%;background:rgba(19,22,42,0.95);border:1.5px solid ${ch.color}44;border-radius:16px;padding:18px 20px">
        <div style="font-size:11px;color:#A89B89;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Bulunduğun Bölüm</div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:36px">${ch.icon}</span>
          <div style="flex:1">
            <div style="font-size:17px;font-weight:800;color:#F2EBE0">${ch.name}</div>
            <div style="font-size:12px;color:${ch.color};margin-top:2px">Level ${curLevel} · %${progress} tamamlandı</div>
            <div style="height:5px;background:#1A1E35;border-radius:3px;margin-top:6px;overflow:hidden">
              <div style="height:100%;width:${progress}%;background:${ch.color};border-radius:3px"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1a2: Saat başı ödül (can/tüp) -->
      <div style="width:100%;background:rgba(19,22,42,0.95);border:1px solid ${canClaimTube?'#5DCAA5':'#252A45'};border-radius:16px;padding:16px 20px">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:30px">❤️</span>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:#F2EBE0">Can: ${state.tubes} / ${state.maxTubes}</div>
            ${tubeStatusHtml}
          </div>
          ${tubeClaimBtn}
        </div>
      </div>

      <!-- Oyna butonu -->
      <button class="f9-play-btn" id="btn-intro-play" style="width:100%;font-size:18px;padding:16px;margin-top:4px">
        <span style="font-size:22px">▶</span>
        <span>Level ${curLevel} Oyna</span>
      </button>

      <button id="btn-intro-menu" style="width:100%;padding:13px;border-radius:12px;background:transparent;border:1px solid #252A45;color:#A89B89;font-size:14px;cursor:pointer">
        ☰ Menüye Dön
      </button>
    </div>
  `;

  // Can al
  document.getElementById("btn-claim-tube")?.addEventListener("click", () => {
    refillTubes();
    render();
  });

  // Oyna
  document.getElementById("btn-intro-play")?.addEventListener("click", () => {
    refillTubes();
    if (state.tubes <= 0) { showNoTubesModal(); return; }
    state.screen = "level_start"; render();
  });

  // Menü
  document.getElementById("btn-intro-menu")?.addEventListener("click", () => {
    state.screen = "menu"; render();
  });
}

function renderMenu() {
  const me = LEAGUE_BOARD.find(e => e.isMe);
  const myRank = LEAGUE_BOARD.filter(e => !e.isMe && e.score > (me?.score||0)).length+1;
  const top5 = myRank <= 5;
  const hasDaily = state.lastLoginDate !== new Date().toISOString().slice(0,10);

  root.innerHTML = `
    <div class="f9-wrap f9-screen-main">

      <!-- LOGO -->
      <div class="f9-menu-logo" style="text-align:center;margin-bottom:4px">
        <span style="color:#E2622B">F</span><span style="color:#E0B23C">U</span><span style="color:#639922">S</span><span style="color:#3E8FD4">I</span><span style="color:#B95DE0">O</span><span style="color:#D4537E">N</span><span style="color:#E0B23C;font-size:1.3em"> 9</span>
      </div>
      <div style="text-align:center;font-size:12px;color:#A89B89;margin-bottom:16px">${state.playerName} · Level ${state.levelNumber}</div>

      <!-- GÜNLÜK ÖDÜL KARTI (varsa) -->
      ${hasDaily ? `
      <div class="f9-daily-card" id="btn-daily">
        <div style="font-size:22px">🌅</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#F2EBE0">Günlük Ödül Hazır!</div>
          <div style="font-size:11px;color:#A89B89">+24⚡ Enerji · ${state.loginStreak||0}. gün streak</div>
        </div>
        <div style="font-size:18px">›</div>
      </div>` : ''}

      <!-- LIG DURUMU -->
      <div class="f9-league-banner ${top5?'f9-league-top5':''}" id="btn-menu-league">
        <div>
          <div style="font-size:11px;color:#A89B89">Haftalık Lig</div>
          <div style="font-size:18px;font-weight:800;color:#F2EBE0">#${myRank} Sıra ${top5?'🔥 Ödül Zonu':''}</div>
        </div>
        <div style="font-size:24px">${top5?'💎':'🏆'}</div>
      </div>

      <!-- PLAY BUTONU -->
      <button class="f9-play-btn" id="btn-menu-play" style="margin:12px 0">
        <span style="font-size:28px">▶</span>
        <span style="font-size:20px;font-weight:900">OYNA</span>
        <span style="font-size:12px;opacity:.7">Level ${state.levelNumber}</span>
      </button>

      <!-- ALT NAV -->
      <div class="f9-menu-nav">
        <button class="f9-mnav-btn" id="btn-menu-map">
          <span>🗺️</span><span>Harita</span>
        </button>
        <button class="f9-mnav-btn" id="btn-menu-league2">
          <span>🏆</span><span>Lig</span>
        </button>
        <button class="f9-mnav-btn" id="btn-menu-account">
          <span>👤</span><span>Hesap</span>
        </button>
      </div>

    </div>
  `;

  document.getElementById("btn-daily")?.addEventListener("click", () => { state.screen="daily"; render(); });
  document.getElementById("btn-menu-league")?.addEventListener("click", () => { state.screen="league"; render(); });
  document.getElementById("btn-menu-league2")?.addEventListener("click", () => { state.screen="league"; render(); });
  document.getElementById("btn-menu-map")?.addEventListener("click", () => { state.screen="map"; render(); });
  document.getElementById("btn-menu-account")?.addEventListener("click", () => { state.screen="account"; render(); });
  document.getElementById("btn-menu-play")?.addEventListener("click", () => {
    refillTubes();
    if (state.tubes <= 0) { showNoTubesModal(); return; }
    state.screen = "map"; render();
  });
}

function renderLeague() {
  // league render
  const board = [...LEAGUE_BOARD].sort((a,b)=>b.score-a.score);
  const myRank = board.findIndex(e=>e.isMe)+1;
  root.innerHTML = `<div class="f9-wrap">
    <div class="f9-topbar">
      <div class="f9-level-pill">🥉 Bronz Lig</div>
      <div class="f9-nav-btns">
        <button class="f9-nav-btn" id="btn-screen-game">🎮</button>
        <button class="f9-nav-btn active" id="btn-screen-league">🏆 Lig</button>
        <button class="f9-nav-btn" id="btn-screen-howto">❓</button>
      </div>
    </div>
    ${board[0] ? `<div style="background:linear-gradient(145deg,#2A1E00,#1A1200);border-radius:10px;padding:10px;margin-bottom:8px;text-align:center;border:1px solid #E0B23C44">
      <div style="font-size:11px;color:#E0B23C;margin-bottom:2px">🏆 HAFTANIN ŞAMPİYONU</div>
      <div style="font-size:16px;font-weight:700;color:#fff">${board[0].name}</div>
      <div style="font-size:13px;color:#E0B23C">${board[0].score.toLocaleString("tr-TR")} puan</div>
    </div>` : ""}
    <div style="padding:4px 0 8px;font-size:12px;color:var(--f9-text-dim);text-align:center">Haftalık sıralama · 5 gün kaldı · Sıran: #${myRank}</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:12px">
      ${board.map((e,i)=>{
        const rank=i+1;
        const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":rank;
        const zone=rank<=3?"border-left:3px solid #5DCAA5":rank>17?"border-left:3px solid #E0473C":"";
        const me=e.isMe?"background:#26215C;border:1px solid #534AB7":"background:var(--f9-surface)";
        const reward = rank===1?"💎×20":rank===2?"💎×15":rank===3?"💎×10":rank<=5?"💎×5":"";
        const rewardBadge = reward ? `<span style="font-size:10px;background:#26215C;color:#AFA9EC;border-radius:10px;padding:2px 6px;margin-left:4px">${reward}</span>` : "";
        return `<div style="${me};${zone};border-radius:8px;padding:8px 10px;display:flex;align-items:center;gap:10px;">
          <div style="width:26px;text-align:center;font-size:13px">${medal}</div>
          <div style="width:26px;height:26px;border-radius:50%;background:#534AB7;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">${e.name[0]}</div>
          <div style="flex:1;font-size:13px;color:var(--f9-text)">${e.name}${e.isMe?" 👈":""}${rewardBadge}</div>
          <div style="font-size:13px;font-weight:600;color:var(--f9-accent)">${e.score.toLocaleString("tr-TR")}</div>
        </div>`;
      }).join("")}
    </div>
    <div style="display:flex;justify-content:center;gap:12px;font-size:11px;color:var(--f9-text-dim);flex-wrap:wrap;margin-top:6px">
      <span style="color:#5DCAA5">▲ İlk 3 → Yüksel</span>
      <span style="color:#E0473C">▼ Son 3 → Düş</span>
    </div>
    <div style="background:var(--f9-surface);border-radius:8px;padding:8px;margin-top:8px;font-size:11px;color:var(--f9-text-dim)">
      <div style="font-weight:600;color:var(--f9-accent);margin-bottom:4px">Hafta Sonu Ödülleri</div>
      🥇 1. → 💎×20 &nbsp; 🥈 2. → 💎×15 &nbsp; 🥉 3. → 💎×10 &nbsp; 4-5. → 💎×5
    </div>
    <button class="f9-play-btn" id="btn-league-play" style="margin-top:12px">
      <span style="font-size:20px">▶</span><span>Level ${state.levelNumber} Oyna</span>
    </button>
    <button style="width:100%;padding:10px;background:transparent;border:1px solid #252A45;border-radius:10px;color:#A89B89;font-size:13px;cursor:pointer;margin-top:6px" id="btn-league-back">← Ana Menü</button>
  </div>`;
  document.getElementById("btn-league-play")?.addEventListener("click",()=>{state.screen="level_start";render();});
  document.getElementById("btn-league-back")?.addEventListener("click",()=>{state.screen="menu";render();});
}

function renderHowto() {
  // Hediye taşı resimleri
  const GA = {
    bakir: GIFT_ASSETS.gift_bakir||'', bronz: GIFT_ASSETS.gift_bronz||'',
    gumus: GIFT_ASSETS.gift_gumus||'', altin: GIFT_ASSETS.gift_altin||'',
    elmas: GIFT_ASSETS.gift_elmas||''
  };
  const EA = {
    firtina: ELEM_ASSETS.elem_firtina||'', su: ELEM_ASSETS.elem_su||'',
    tnt: ELEM_ASSETS.elem_tnt||'', ates: ELEM_ASSETS.elem_ates||'',
    yildirim: ELEM_ASSETS.elem_yildirim||''
  };
  const BA = {
    cam: BLOCK_ASSETS.block_cam||'', kaya: BLOCK_ASSETS.block_kaya||'',
    buz: BLOCK_ASSETS.block_buz||'', demir: BLOCK_ASSETS.block_demir||''
  };

  const imgCard = (src, name, sub1, sub2, col) =>
    '<div class="hw-card">' +
    (src ? '<img src="' + src + '" class="hw-img">' : '<div class="hw-img" style="background:#1A1E35;border-radius:8px"></div>') +
    '<div class="hw-name" style="color:' + (col||'#F2EBE0') + '">' + name + '</div>' +
    '<div class="hw-sub">' + sub1 + '</div>' +
    (sub2 ? '<div class="hw-sub2">' + sub2 + '</div>' : '') +
    '</div>';

  const shapeCell = (filled) =>
    '<div style="width:12px;height:12px;border-radius:2px;background:' +
    (filled ? '#534AB7' : 'transparent') + ';border:1px solid ' +
    (filled ? '#7A6FE0' : '#333') + '"></div>';

  const shape = (rows) =>
    '<div style="display:grid;grid-template-columns:repeat(' + rows[0].length + ',14px);gap:2px">' +
    rows.map(r => r.map(c => shapeCell(c)).join('')).join('') + '</div>';

  root.innerHTML =
    '<div class="f9-wrap">' +
    '<div class="f9-topbar">' +
    '<div class="f9-level-pill">❓ Nasıl Oynanır</div>' +
    '<div class="f9-nav-btns">' +
    '<button class="f9-nav-btn" id="btn-screen-game">🎮</button>' +
    '<button class="f9-nav-btn" id="btn-screen-league">🏆</button>' +
    '<button class="f9-nav-btn f9-nav-active" id="btn-screen-howto">❓</button>' +
    '</div></div>' +

    // Temel kural
    '<div class="hw-sec"><div class="hw-title">Temel Kural</div>' +
    '<div class="hw-text">İki komşu taşı seç, işlem uygula. Sonucun <b style="color:#E0B23C">dijital kökü 9</b> olmalı.</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
    '<span class="hw-chip hw-ok">6×3=18 → 1+8=9 ✓</span>' +
    '<span class="hw-chip hw-ok">7+2=9 ✓</span>' +
    '<span class="hw-chip hw-no">8×8=64 → 1 ✗</span>' +
    '</div></div>' +

    // Hediye taşları + şekiller
    '<div class="hw-sec"><div class="hw-title">Hediye Taşları — Şekil Eşleşmesi</div>' +
    '<div class="hw-cards">' +
    imgCard(GA.bakir, 'Bakır', "3'lü / Köşe", '40 puan', '#C17A4D') +
    imgCard(GA.bronz, 'Bronz', "4'lü / L / T", '72 puan', '#B08D57') +
    imgCard(GA.gumus, 'Gümüş', "5'li / U / +", '112 puan', '#C7CDD6') +
    imgCard(GA.altin, 'Altın', "6'lı", '162 puan', '#E0B23C') +
    imgCard(GA.elmas, 'Elmas', "7'li", '220 puan', '#6FE3D8') +
    '</div>' +
    '<div class="hw-title" style="margin-top:10px;margin-bottom:6px">Örnek Şekiller</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">' +
    '<div class="hw-shape-card"><div class="hw-shape-lbl">3 → Bakır</div>' + shape([[1,1,1]]) + '</div>' +
    '<div class="hw-shape-card"><div class="hw-shape-lbl">L → Bronz</div>' + shape([[1,0],[1,0],[1,1]]) + '</div>' +
    '<div class="hw-shape-card"><div class="hw-shape-lbl">T → Gümüş</div>' + shape([[1,1,1],[0,1,0],[0,1,0]]) + '</div>' +
    '<div class="hw-shape-card"><div class="hw-shape-lbl">+ → Altın</div>' + shape([[0,1,0],[1,1,1],[0,1,0],[0,1,0]]) + '</div>' +
    '<div class="hw-shape-card"><div class="hw-shape-lbl">★ → Elmas</div>' + shape([[1,0,1],[1,1,1],[1,0,1]]) + '</div>' +
    '</div></div>' +

    // Elementler
    '<div class="hw-sec"><div class="hw-title">Elementler — Aynı Taş + Aynı Taş</div>' +
    '<div class="hw-cards">' +
    imgCard(EA.firtina, 'Fırtına', 'Cam kırar', 'Güç +6', '#9AA7B8') +
    imgCard(EA.su, 'Su', 'Kaya kırar', 'Güç +8', '#3E8FD4') +
    imgCard(EA.tnt, 'TNT', 'Buz kırar', 'Güç +10', '#E0473C') +
    imgCard(EA.ates, 'Ateş', 'Demir kırar', 'Güç +12', '#E2622B') +
    imgCard(EA.yildirim, 'Yıldırım', 'Hepsini!', 'Güç +14', '#E8C53C') +
    '</div></div>' +

    // Engel taşları
    '<div class="hw-sec"><div class="hw-title">Engel Taşları</div>' +
    '<div class="hw-cards">' +
    imgCard(BA.cam, 'Cam', 'Güç: −6', 'Fırtına ile kır', '#7FA8C9') +
    imgCard(BA.kaya, 'Kaya', 'Güç: −8', 'Su ile kır', '#8B7355') +
    imgCard(BA.buz, 'Buz', 'Güç: −10', 'TNT ile kır', '#A8D8E8') +
    imgCard(BA.demir, 'Demir', 'Güç: −12', 'Ateş ile kır', '#6B6B70') +
    '</div></div>' +

    // Özel kombinasyonlar
    '<div class="hw-sec"><div class="hw-title">Özel Kombinasyonlar</div>' +
    '<div style="display:flex;flex-direction:column;gap:5px">' +
    '<div class="hw-combo"><span class="hw-combo-key">💎+💎</span><span class="hw-combo-val">JACKPOT! +20 hamle +50 enerji ⭐</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">Bakır+💎</span><span class="hw-combo-val">Satır+Sütun + 4×(3×3) patlama</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">Bronz+💎</span><span class="hw-combo-val">+11 hamle + Satır+Sütun</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">Gümüş+💎</span><span class="hw-combo-val">+4 enerji + Satır+Sütun</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">⚡+9</span><span class="hw-combo-val">Tüm engel türleri kırılır!</span></div>' +
    '</div></div>' +

    // Güçler
    '<div class="hw-sec"><div class="hw-title">Enerji Güçleri</div>' +
    '<div style="display:flex;flex-direction:column;gap:5px">' +
    '<div class="hw-combo"><span class="hw-combo-key">🎯 6⚡</span><span class="hw-combo-val">+1 Hamle hakkı</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">🚀 12⚡</span><span class="hw-combo-val">Nitro — sonraki patlama 2× güçlü</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">💣 10⚡</span><span class="hw-combo-val">Mayın — rastgele engel kır</span></div>' +
    '<div class="hw-combo"><span class="hw-combo-key">⭐ 80⚡</span><span class="hw-combo-val">Süper Patlama — tüm board temizle</span></div>' +
    '</div></div>' +

    '<button class="hw-back-btn" id="btn-back-game">← Ana Menü</button>' +
    '</div>';

  document.getElementById("btn-screen-game")?.addEventListener("click",()=>{state.screen="menu";render();});
  document.getElementById("btn-screen-league")?.addEventListener("click",()=>{state.screen="league";render();});
  document.getElementById("btn-screen-howto")?.addEventListener("click",()=>{state.screen="howto";render();});
  document.getElementById("btn-howto-play")?.addEventListener("click",()=>{state.screen="level_start";render();});
  document.getElementById("btn-back-game2")?.addEventListener("click",()=>{state.screen="menu";render();});
}

function renderEnergyShop() {
  const area = document.getElementById("f9-energy-shop");
  if (!area) return;
  const gc = state.gc;
  if (!gc) { area.style.display = "none"; return; }
  const tracker = state.energyTracker;
  const e = tracker.energy;

  const moveBtn = (tier) => {
    const opt = MOVE_PURCHASE_OPTIONS[tier];
    const disabled = e < opt.cost ? "disabled" : "";
    return `<button class="f9-energy-btn" data-action="moves" data-tier="${tier}" ${disabled}>+${opt.moves} hamle (${opt.cost}⚡)</button>`;
  };

  const boostDisabled = (e < AREA_BOOST_COST || tracker.areaBoostPending) ? "disabled" : "";
  const boostLabel = tracker.areaBoostPending ? "Güçlendirme aktif (bekliyor)" : `Patlama Güçlendirme (${AREA_BOOST_COST}⚡)`;

  const hasBlockers = gc.blockers.size > 0;
  const randomBreakDisabled = (e < RANDOM_BLOCKER_BREAK_COST || !hasBlockers) ? "disabled" : "";

  const blockerTypesPresent = [...new Set([...gc.blockers.values()].map(t => t.blockerType))];
  const fullTypeDisabled = (e < FULL_TYPE_BLOCKER_BREAK_COST || blockerTypesPresent.length === 0) ? "disabled" : "";
  const fullTypeOptions = blockerTypesPresent.map(t =>
    `<option value="${t}">${BLOCKER_LABEL[t]}</option>`).join("");

  const superDisabled = (e < SUPER_BLAST_COST || gc.status !== "in_progress") ? "disabled" : "";

  area.innerHTML = `
    <div class="f9-energy-shop">
      <div class="f9-energy-shop-title">Enerji Mağazası</div>
      <div class="f9-energy-shop-row">
        ${moveBtn("small")}${moveBtn("medium")}${moveBtn("large")}${moveBtn("mega")}
      </div>
      <div class="f9-energy-shop-row">
        <button class="f9-energy-btn" data-action="boost" ${boostDisabled}>${boostLabel}</button>
        <button class="f9-energy-btn" data-action="random-break" ${randomBreakDisabled}>Rastgele Engel Kır (${RANDOM_BLOCKER_BREAK_COST}⚡)</button>
      </div>
      <div class="f9-energy-shop-row">
        <select id="f9-blocker-type-select" ${blockerTypesPresent.length === 0 ? "disabled" : ""}>${fullTypeOptions || "<option>Engel yok</option>"}</select>
        <button class="f9-energy-btn" data-action="full-type-break" ${fullTypeDisabled}>Türü Kır (${FULL_TYPE_BLOCKER_BREAK_COST}⚡)</button>
      </div>
      <div class="f9-energy-shop-row">
        <button class="f9-energy-btn f9-energy-btn-super" data-action="super-blast" ${superDisabled}>⚡ SÜPER PATLAMA (${SUPER_BLAST_COST}⚡)</button>
      </div>
    </div>
  `;

  area.querySelectorAll(".f9-energy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      try {
        if (action === "moves") {
          const r = gc.spendEnergyForMoves(btn.dataset.tier);
          state.message = `Enerji harcandı: +${r.moves} hamle (-${r.cost}⚡)`;
        } else if (action === "boost") {
          const r = gc.spendEnergyForAreaBoost();
          state.message = `Patlama Güçlendirme aktif — bir sonraki alan patlaması +1 büyüyecek (-${r.cost}⚡)`;
        } else if (action === "random-break") {
          const r = gc.spendEnergyForRandomBlockerBreak();
          state.message = `Rastgele 1 engel kırıldı (-${r.cost}⚡)`;
        } else if (action === "full-type-break") {
          const select = document.getElementById("f9-blocker-type-select");
          const r = gc.spendEnergyForFullTypeBlockerBreak(select.value);
          state.message = `Tüm ${BLOCKER_LABEL[select.value]} kırıldı, ${r.brokenPositions.length} adet (-${r.cost}⚡)`;
        } else if (action === "super-blast") {
          const r = gc.spendEnergyForSuperBlast();
          state.message = `⚡ SÜPER PATLAMA! +${r.points} puan (-${r.cost}⚡)`;
        }
        saveGame();
        // Sadece board + shop güncelle — tam render() yerine
        renderBoardOnly();
        renderEnergyShop();
        // Puan barını güncelle
        const scoreEl = document.getElementById("f9-live-score");
        if (scoreEl) scoreEl.textContent = gc.score;
        const enerEl = document.getElementById("f9-energy-val");
        if (enerEl) enerEl.textContent = state.energyTracker.energy + "⚡";
      } catch (err) {
        state.message = String(err.message || err);
        renderBoardOnly();
      }
    });
  });
}
