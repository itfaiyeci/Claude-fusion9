const F9Churn = (() => {
  const _history = {}; // {levelNo: {attempts, losses, lastWin}}
  const CHURN_THRESHOLD = 3;  // kaç kayıptan sonra DDA devreye girer

  function record(levelNumber, won) {
    if (!_history[levelNumber]) {
      _history[levelNumber] = { attempts:0, losses:0, lastWin:null };
    }
    const h = _history[levelNumber];
    h.attempts++;
    if (won) { h.losses=0; h.lastWin=Date.now(); }
    else     { h.losses++; }
  }

  // Bu levelde yardım gerekiyor mu?
  function needsHelp(levelNumber) {
    const h = _history[levelNumber];
    return h && h.losses >= CHURN_THRESHOLD;
  }

  // Churn varsa DDA'ya uygula
  function applyChurnDDA(levelNumber, cfg) {
    if (!needsHelp(levelNumber)) return cfg;
    const h    = _history[levelNumber];
    const mult = Math.max(0.4, 1 - (h.losses - CHURN_THRESHOLD + 1) * 0.15);
    const newCfg = { ...cfg };
    newCfg.targetScore = Math.round((cfg.targetScore || 630) * mult);
    // moves sabit — churn sadece hedef skoru düşürür
    F9Debug.log("game",
      `[CHURN] L${levelNumber} ${h.losses} kayıp → hedef x${mult.toFixed(2)} hamle +${newCfg.moves-cfg.moves}`,
      { losses: h.losses, newTarget: newCfg.targetScore }
    );
    return newCfg;
  }

  // Direktör için churn durumu
  function status(levelNumber) {
    const h = _history[levelNumber] || { attempts:0, losses:0 };
    return {
      attempts: h.attempts,
      losses:   h.losses,
      churn:    h.losses >= CHURN_THRESHOLD,
      dda_mult: h.losses >= CHURN_THRESHOLD
        ? Math.max(0.4, 1-(h.losses-CHURN_THRESHOLD+1)*0.15)
        : 1.0,
    };
  }

  function all() { return _history; }

  return { record, needsHelp, applyChurnDDA, status, all };
})();

// ══════════════════════════════════════════════════════
// F9 SORUN BİLDİR & HATA RAPORLAMA SİSTEMİ
// - Otomatik: hata oluşunca log + state snapshot alır
// - Manuel: oyuncu "Sorun Bildir" butonuna basar
// - Çıktı: kopyalanabilir JSON rapor (geliştiriciye gönderilir)
// ══════════════════════════════════════════════════════
