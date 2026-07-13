// [Oturum 22 — flow/ katmanı ayrımı] Hamle sonucu / ödül / animasyon akışı.
// core/game-engine.js'ten TAŞINDI (bkz. HANDOFF.md "Flow Katmanı Eksik").
// Diğer flow/ dosyaları gibi ortak IIFE içinde yüklendiği için `state`,
// `F9Anim`, `F9Wave`, `F9Difficulty` gibi üst-seviye tanımlara erişebiliyor.
// SORUMLULUK: flow/moveFlow.js'in çağırdığı gerçek hamle uygulaması
// (GameCore.applyPlayerMove), sonucun mesaj/ses/animasyon/enerji/hedef
// ilerlemesine dönüştürülmesi, ve reklam-ile-devam ödülü (watchAd).
// Level girişi flow/levelFlow.js'te, level sonu geçişleri
// flow/transitionFlow.js'te.

function executeMove(r1, c1, r2, c2, resultValue) {
  const gc = state.gc;
  if (!gc) { F9Debug.err("executeMove: gc null!"); return; }
  gc._pushSnapshot(); // geri al için hamleden önceki durumu kaydet

  // [Oturum 52 — Event Bus] PlayerMove — motorun/flow'un mevcut hiçbir
  // çağrısı SİLİNMEDİ, bu SADECE ek bir yayın. Dinleyen sistemler
  // (şimdilik F9GameFeel — bkz. fx/game-feel.js) bunu kullanabilir.
  if (typeof F9Events !== "undefined") F9Events.emit("PlayerMove", { r1, c1, r2, c2, resultValue });

  // [Oturum 47 — Game Feel Engine v1.0] init() idempotent (bir kereden
  // fazla çağrılması zararsız) — juice/breathing sistemini VE (Oturum
  // 52'den itibaren) event dinleyicilerini kurar. resetCombo() artık
  // BURADAN DEĞİL, "PlayerMove" event dinleyicisinden tetikleniyor
  // (bkz. fx/game-feel.js) — çift tetiklenmeyi önlemek için buradaki
  // doğrudan çağrı KALDIRILDI.
  if (typeof F9GameFeel !== "undefined") {
    F9GameFeel.init();
  }

  // Board snapshot — applyPlayerMove board'u temizlemeden önce değerleri kaydet
  const boardSnapshot = {};
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    const v = gc.board.getCell(r, c);
    if (v !== null) boardSnapshot[cellKey(r,c)] = v;
  }

  const outcome = gc.applyPlayerMove(r1, c1, r2, c2, resultValue);
  outcome.lastMovePos = [r2, c2]; // Animasyon merkezi için

  // Önce direkt hamle efektleri
  const blastFlash = new Set();
  const blockerFlash = new Set();
  if (outcome.blastCells) {
    for (const [r, c] of (outcome.blastCells||[])) blastFlash.add(cellKey(r, c));
  }
  if (outcome.areaCells) {
    for (const [r, c] of (outcome.areaCells||[])) blastFlash.add(cellKey(r, c));
  }
  if (outcome.brokenBlockers && outcome.brokenBlockers.length) {
    for (const [r, c] of (outcome.brokenBlockers||[])) blockerFlash.add(cellKey(r, c));
  }
  state.glowCells = new Map();
  state.blastFlashCells = blastFlash;
  state.brokenBlockerFlash = blockerFlash;

  // F9Anim — patlama efekti ("uçup git, yukarıdan düş")
  if (blastFlash.size > 0) {
    const _bCells = [...blastFlash].map(k => k.split(',').map(Number));
    // Merkez: eşleşme noktası veya alan merkezi
    const _ctr = outcome.lastMovePos || (state.selected ? [state.selected[0], state.selected[1]] : null);
    // [Oturum 52 — Event Bus] ExplosionStarted — mevcut F9Anim/F9GameFeel
    // çağrıları AŞAĞIDA aynen duruyor, bu SADECE ek bir yayın.
    if (typeof F9Events !== "undefined") F9Events.emit("ExplosionStarted", { cells: _bCells, center: _ctr });
    F9Anim.playBlast(_bCells, state.gc, {
      center: _ctr,
      delay: 0,
      stagger: _bCells.length > 20 ? 8 : 18,
    });
    // [Oturum 47→52] Kamera sarsıntısı + canvas parçacık + boyuta göre
    // ses — artık DOĞRUDAN ÇAĞRILMIYOR, yukarıdaki "ExplosionStarted"
    // event'ini dinleyen F9GameFeel (fx/game-feel.js init()) tetikliyor.
  }

  const chainGlowColors = (outcome.chain||[]).map(ev => {
    if (!ev.match) return null;
    const glow = new Map();
    for (const [r, c] of ev.match.cells) {
      glow.set(cellKey(r, c), '#FFFFFF');
    }
    return glow;
  });

  // Zincir eşleşmelerini sırayla göster
  const ANIM_STEP = 1560;
  // Önceki animasyonları iptal et
  (state._animTimeouts||[]).forEach(id => clearTimeout(id));
  state._animTimeouts = [];

  (outcome.chain||[]).forEach((ev, i) => {
    if (!ev.match) return;
    const _tid1 = setTimeout(() => {
      renderBoardOnly();

      // F9Anim zincir eşleşme — mor dalga + fall-in
      F9Anim.playChainMatch(ev.match.cells,
        ev.result?.group==="e" ? "#FFD700" :
        ev.result?.group==="d" ? "#FF6B35" :
        ev.result?.group==="c" ? "#4FB87A" : "#A78BFA"
      );
      // [Oturum 47→52] Kamera sarsıntısı + canvas parçacık + Combo
      // Director + boyuta göre ses — artık DOĞRUDAN ÇAĞRILMIYOR,
      // yukarıdaki "ComboDetected"/"ComboIncreased" event'lerini
      // dinleyen F9GameFeel (fx/game-feel.js init()) tetikliyor.
      // [Oturum 52 — Event Bus] ComboDetected (ilk eşleşme) / ComboIncreased
      // (sonrakiler) — F9GameFeel'in kendi iç sayacına DOKUNMUYOR, sadece
      // AYRI bir yayın. i=0 → ilk zincir halkası → "Detected", sonrası → "Increased".
      if (typeof F9Events !== "undefined") {
        F9Events.emit(i === 0 ? "ComboDetected" : "ComboIncreased", { index: i, match: ev.match, group: ev.result?.group });
      }
      // Hediye spawn animasyonu
      if (ev.result?.gift && ev.match?.spawn) {
        const [sr, sc] = ev.match.spawn;
        if (typeof F9Events !== "undefined") F9Events.emit("GiftSpawned", { type: ev.result.gift, r: sr, c: sc });
        setTimeout(() => {
          const gEl = document.querySelector(`[data-r="${sr}"][data-c="${sc}"]`);
          if (gEl) F9Anim.spawnGift(gEl);
        }, ev.match.cells.length * 30 + 420);
      }
      // Eski JS flash — hâlâ çalışsın (glow efekti için)
      ev.match.cells.forEach(([r,c]) => {
        const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (!el) return;
        const val = boardSnapshot[cellKey(r,c)];
        const color = (val && NUMBER_COLOR[val]) ? NUMBER_COLOR[val] : '#FFFFFF';
        // Anlık parla
        el.style.cssText += `;background:${color} !important;box-shadow:0 0 18px ${color};transform:scale(1.15);transition:none;z-index:10;position:relative;`;
        // 350ms sonra söndür
        setTimeout(() => {
          el.style.background = '';
          el.style.boxShadow = '';
          el.style.transform = '';
          el.style.transition = 'background 0.4s, box-shadow 0.4s, transform 0.2s';
          el.style.zIndex = '';
        }, F9_CONFIG.ANIM.NINE_GLOW);
      });

      const bFlash = new Set(ev.match.cells.map(([r,c]) => cellKey(r,c)));
      state.blastFlashCells = bFlash;
      if (chainGlowColors[i]) state.glowCells = chainGlowColors[i];
    }, i * ANIM_STEP);
    state._animTimeouts.push(_tid1);
  });
  if (outcome.brokenBlockers && outcome.brokenBlockers.length) {
    for (const [r, c] of (outcome.brokenBlockers||[])) blockerFlash.add(cellKey(r, c));
  }
  state.blastFlashCells = blastFlash;
  state.brokenBlockerFlash = blockerFlash;

  let chainPoints = 0, chainCount = 0, chainEnergy = 0;
  for (const ev of (outcome.chain||[])) {
    if (ev.match) {
      chainPoints += ev.result.points;
      chainCount++;
      if (ev.result.energy) chainEnergy += ev.result.energy;


    }
  }

  let msg = "";
  if (outcome.kind === "combo" && outcome.element) {
    msg = ELEM_LABEL[outcome.element] + " oluştu!";
    // Bakır+Bakır → Fırtına gibi element oluşumunda spawn efekti
    const _elemColors = {
      [ELEM_STORM]:"#7B5CF6", [ELEM_WATER]:"#3E8FD4",
      [ELEM_TNT]:"#E08B2B",   [ELEM_FIRE]:"#E04B4B",
      [ELEM_LIGHTNING]:"#FFD700"
    };
    const _ec = _elemColors[outcome.element] || "#FFFFFF";
    // Şok dalgası + çevre hücreler parlar
    requestAnimationFrame(() => {
      F9Anim.shockwave(r2, c2, _ec + "99");
      const _surrounds = [];
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const nr=r2+dr, nc=c2+dc;
        if (nr>=0&&nr<GRID&&nc>=0&&nc<GRID) _surrounds.push([nr,nc]);
      }
      F9Anim.playBlast(_surrounds, state.gc, {
        color: _ec, delay: 80, stagger: 25, center: [r2,c2]
      });
      // Element spawn animasyonu
      setTimeout(() => {
        const _eEl = document.querySelector('[data-r="'+r2+'"][data-c="'+c2+'"]');
        if (_eEl) F9Anim.spawnGift(_eEl);
      }, 350);
    });
  } else if (outcome.kind === "combo" && outcome.blastCells) {
    msg = "Patlama!";
    if (outcome.brokenBlockers && outcome.brokenBlockers.length) {
      msg += " · " + outcome.brokenBlockers.length + " engel kırıldı!";
    }
  } else if (outcome.kind === "combo" && outcome.areaCells) {
    // [GÜNCELLENDİ] Mekanizma 3c: hamle bonusu/enerji + alan patlaması + garanti combo
    msg = "Alan patlaması!";
    if (outcome.extraMoves) msg += " +" + outcome.extraMoves + " hamle";
    if (outcome.energy) msg += " +⚡" + outcome.energy + " enerji";
    if (outcome.comboCount) msg += " · " + outcome.comboCount + " garanti combo (+" + outcome.comboPoints + "p)";
    if (outcome.brokenBlockers && outcome.brokenBlockers.length) {
      msg += " · " + outcome.brokenBlockers.length + " engel kırıldı!";
    }
  } else if (outcome.kind === "lightning_lightning") {
    // [YENİ] Mekanizma 6: Yıldırım+Yıldırım -> +12 Enerji
    msg = "⚡⚡ Yıldırım fırtınası! +" + outcome.energy + " enerji";
  } else if (outcome.kind === "element_nine_break") {
    const typeNames = (outcome.brokenBlockerTypes || []).map(t => BLOCKER_LABEL[t]).join("+");
    msg = (outcome.brokenBlockers && outcome.brokenBlockers.length
      ? "Board genelinde " + outcome.brokenBlockers.length + " " + typeNames + " kırıldı! +" + outcome.points + " puan"
      : "Kırılacak " + typeNames + " yoktu, +" + outcome.points + " puan");
  } else if (outcome.kind === "promotion") {
    msg = "Terfi!";
    if (outcome.areaCells) {
      msg += " · Alan patlaması!";
      if (outcome.brokenBlockers && outcome.brokenBlockers.length) {
        msg += " " + outcome.brokenBlockers.length + " engel kırıldı!";
      }
    } else if (outcome.extraMoves) {
      msg = "Son terfi! +" + outcome.extraMoves + " hamle";
      if (outcome.energy) msg += " + ⚡" + outcome.energy + " enerji";
    }

  } else if (chainCount > 0) {
    msg = chainCount + " eşleşme!";
    if (chainEnergy) msg += " + ⚡" + chainEnergy + " enerji";
  }

  // Excitement seviyesi
  const excitementLevel = outcome.kind==="jackpot" ? 5
    : outcome.kind==="combo" && outcome.element===ELEM_LIGHTNING ? 4
    : outcome.kind==="promotion" && outcome.gift===GIFT_DIAMOND ? 3
    : chainCount>=3 ? 3 : chainCount>=2 ? 2 : 1;
  if (excitementLevel >= 4) {
    msg = (excitementLevel===5?"💎💎 JACKPOT! ":"⚡ İnanılmaz! ") + msg;
    if (excitementLevel===5) { setTimeout(showJackpotAnimation, 200); playSound('jackpot'); }
    else playSound('blast');
  }
  else if (excitementLevel === 3) { msg = "⭐ " + msg; playSound('gift'); }
  else if (outcome.areaCells?.length > 0) playSound('blast');
  else if (chainCount > 0) playSound('gift');
  else if (outcome.kind === "promotion") {
    playSound('promotion');
    // [Oturum 52 — Event Bus] Promotion — mevcut ses çağrısı aynen duruyor.
    if (typeof F9Events !== "undefined") F9Events.emit("Promotion", { to: outcome.gift, r: r2, c: c2 });
  }
  else playSound('match');

  // Hedef takibi güncelle
  const _goal = state.levelGoal;
  if (_goal && outcome) {
    if (_goal.type === "create9") {
      // 9 sonucu: outcome.chain içinde 9 sayısı var mı?
      const nines = (outcome.chain||[]).filter(e=>e.match?.cells).length;
      if (outcome.kind === "normal" && state.gc.board) state.goalProgress += nines > 0 ? 1 : 0;
      // Daha basit: her hamlede result 9 ise say
      if (outcome.result === 9 || (outcome.ops && outcome.ops.some?.(o=>o.value===9))) {
        state.goalProgress = (state.goalProgress||0) + 1;
      }
    } else if (_goal.type === "giftCount") {
      if (outcome.gift || outcome.kind === "promotion") state.goalProgress = (state.goalProgress||0) + 1;
    } else if (_goal.type === "breakBlockers") {
      state.goalProgress = (state.goalProgress||0) + (outcome.brokenBlockers?.length||0);
    }
  }

  state.message = msg;
  state.selected = null;
  state.neighbors = [];
  state.pendingOptions = null;
  saveGame();
  // Puan göstergesini anında güncelle
  // Puan bar anında guncelle
  const _scoreEl = document.getElementById("f9-live-score");
  if (_scoreEl) {
    _scoreEl.textContent = state.gc?.score ?? 0;
    _scoreEl.style.animation = "none";
    void _scoreEl.offsetWidth;
    _scoreEl.style.animation = "f9-score-pop 0.3s ease-out";
  }
  const _fill = document.querySelector(".f9-ps-fill");
  if (_fill) {
    // [Oturum 45] Tutarlılık için diğer ekranlarla (renderWin/renderLose)
    // AYNI kaynak sırası: state.levelGoal.value ÖNCELİKLİ.
    const _targetScore = state.levelGoal?.value ?? state.cfg?.targetScore ?? 630;
    const pct = Math.min(100, Math.round((state.gc.score/_targetScore)*100));
    _fill.style.width = pct + "%";
    // Score log: sadece önemli eşiklerde yaz
    if (pct >= 100 || pct % 25 === 0 || state.gc.movesLeft <= 3) {
      F9Debug.log("score", `Skor: ${state.gc.score} / ${_targetScore} (${pct}%)`, {moves_left: state.gc.movesLeft});
    }
  }
  // İpucu: hamle yapıldı, zamanlayıcıyı sıfırla
  F9Hint.onMove();
  // Analytics + Direktör: hamle gözlemi
  F9Debug.analyticsMove(outcome, gc);
  F9Debug.dirMove(outcome, gc);

  // Baskı dalgası: eşleşme gücü + dalga ilerletme
  if (F9Wave.isActive() && outcome) {
    // Direkt hamle grubu
    const _mvGroup = outcome.group || null;
    if (_mvGroup) F9Wave.onMatch(_mvGroup, gc);
    // Zincir eşleşmeleri
    (outcome.chain || []).forEach(ev => {
      if (ev?.match?.group) F9Wave.onMatch(ev.match.group, gc);
    });
    // Çikolata: eşleşmesiz engel yayılması
    const _allMatchCells = [...(outcome.blastCells||[]), ...(outcome.areaCells||[]),
      ...(outcome.chain||[]).flatMap(ev=>ev.match?.cells||[])];
    const _spreadCount = F9Wave.spreadBlockers(gc, _allMatchCells);
    if (_spreadCount > 0) { renderBoardOnly(); }

    // Her WAVE_INTERVAL hamlede dalga ilerle
    const _wChapter = Math.ceil((state.levelNumber||1) / 10) || 1;
    if (gc.movesUsed % waveInterval(_wChapter) === 0) {
      const wResult = F9Wave.advance(gc);
      renderBoardOnly();
      // Dalga efekti
      showFloatingText("Dalga ilerliyor!", "combo");
      if (wResult === "gameover") {
        gc.status = "lost";
        showFloatingText("GAME OVER — Dalga üste ulaştı!", "jackpot");
        checkAndTransition();
        return;
      }
    }
    // Tehlike uyarısı
    const _ws = F9Wave.status(gc);
    if (_ws.danger) {
      showFloatingText("Tehlike! Dalga yaklaşıyor!", "jackpot");
    }
  }

  // "9 oluştu" görsel sinyali — oyuncuya doğru yoldasın mesajı
  if (outcome?.kind === "normal" && gc?.lastMovePos) {
    const [_lr, _lc] = gc.lastMovePos;
    if (gc.board?.getCell(_lr, _lc) === 9) {
      // [Oturum 52 — Event Bus] NumberCreated — mevcut görsel sinyal
      // (mor parlama) AŞAĞIDA aynen duruyor, bu SADECE ek bir yayın.
      if (typeof F9Events !== "undefined") F9Events.emit("NumberCreated", { number: 9, r: _lr, c: _lc });
      // Hücreye kısa mor parlama
      requestAnimationFrame(() => {
        const _nEl = document.querySelector('[data-r="'+_lr+'"][data-c="'+_lc+'"]');
        if (_nEl) {
          _nEl.style.transition = "none";
          _nEl.style.boxShadow = "0 0 12px 4px #A78BFA, 0 0 4px #A78BFA inset";
          setTimeout(() => {
            _nEl.style.transition = "box-shadow 0.6s ease";
            _nEl.style.boxShadow = "";
          }, 350);
        }
      });
    }
  }
  // Zorluk analizi + canlı müdahale
  const _diffResult = F9Difficulty.observe(gc, outcome);
  if (_diffResult) F9Debug.renderStats();

  // Ağaç engeli: SADECE eşleşme sonucu 9 olduğunda bitişikteki ağaçları kırar
  // (önceden her normal eşleşmede kırılıyordu — bu yanlıştı)
  if (outcome && outcome.kind === "normal" && resultValue === 9) {
    const woodBroken = _breakAdjacentWood(r1, c1, r2, c2);
    if (woodBroken.length > 0) F9Debug.log("blocker", `Ağaç engeli kırıldı (9 eşleşmesi): ${woodBroken.length} adet`, woodBroken);
    if (woodBroken.length > 0) {
      if (!state.blastFlashCells) state.blastFlashCells = new Set();
      woodBroken.forEach(([wr,wc]) => state.blastFlashCells.add(cellKey(wr,wc)));
    }
  }

  // Hourglass yerleştirme değerlendirmesi
  if (state.gc?.status === "in_progress") {
    const _movePct = state.gc.movesLimit ? state.gc.movesUsed / state.gc.movesLimit : 0;
    const _chance = _movePct < 0.3 ? 0 : _movePct < 0.6 ? 0.20 : 0.35;
    if (state.gc.hourglasses.size === 0 && Math.random() < _chance) {
      setTimeout(placeHourglass, 900);
    }
  }

  // [YENİ — Oturum 11, kullanıcı raporu: terfi/kombinasyon patlamalarında
  // ("3'lü+9, 4'lü+9" vb.) görsel efekt görünmüyordu] render() hemen
  // (senkron) çağrılırsa board innerHTML'i yeniden yazılıp F9Anim.playBlast
  // animasyonu daha oynanmadan kesiliyordu — kum saatinin 1400ms bilerek
  // beklemesiyle aynı kök neden (bkz. features/hourglass/hourglass-system.js
  // yorumu: "renderBoardOnly innerHTML'i yeniden yazıyor — bu animasyonu
  // kesiyor"). Zincir eşleşmeler kendi render zamanlamasını yönettiği için
  // (yukarıdaki outcome.chain döngüsü) sadece ZİNCİRSİZ patlamalarda
  // (terfi, aynı/farklı-tür kombinasyon) render()'ı erteliyoruz — tüm
  // patlama türlerinde artık AYNI, tutarlı görsel efekt.
  const _hasChainAnim = (outcome.chain || []).some(e => e.match);
  if (blastFlash.size > 0 && !_hasChainAnim) {
    const _blastStagger = blastFlash.size > 20 ? 8 : 18;
    const _blastAnimTime = _blastStagger * blastFlash.size + F9_CONFIG.ANIM.BLAST_DURATION + F9_CONFIG.ANIM.FALL_DURATION;
    const _renderTid = setTimeout(render, Math.min(1200, _blastAnimTime));
    state._animTimeouts.push(_renderTid);
  } else {
    render();
  }

  const chainLen = (outcome.chain||[]).filter(e=>e.match).length;
  const totalAnim = Math.max(1690, chainLen * 1560 + 400);
  const _tidClean = setTimeout(() => {
    state.glowCells = new Map();
    state.blastFlashCells = new Set();
    state.brokenBlockerFlash = new Set();
    renderBoardOnly();
  }, totalAnim);
  state._animTimeouts.push(_tidClean);
}

function watchAd() {
  try {
    state.gc?.watchAdContinue();
    const reward = state.gc.lastAdContinueReward ?? AD_CONTINUE_EXTRA_MOVES;
    state.message = "Reklam izlendi: +" + reward + " hamle";
    state.screen = "game";
  } catch (e) {
    state.message = String(e.message || e);
  }
  render();
}
