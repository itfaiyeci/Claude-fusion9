// [Oturum 47 — Game Feel Engine v1.0] Merkezi orkestratör.
// Kullanıcının tarif ettiği zincir: Ses → Parçacık → Ekran titreşimi
// → Flash/Glow (mevcut F9Anim zaten yapıyor) → Skor animasyonu
// (mevcut) → Combo sayacı → Yeni taş efekti (mevcut F9Anim). Bu dosya
// YENİ parçaları (kamera, canvas particle, combo director, boyuta
// göre ses) BİRLEŞTİRİR — mevcut F9Anim/playSound çağrılarını
// SİLMİYOR, yanlarına ekleniyor. Tek entegrasyon noktası:
// flow/rewardFlow.js'teki executeMove().
const F9GameFeel = (() => {
  let _comboCount = 0; // bu hamledeki (outcome.chain boyunca) toplam eşleşme sayacı
  let _listenersRegistered = false;

  function init() {
    if (typeof F9Juice !== "undefined") F9Juice.init();
    // [Oturum 52 — Event-Driven Architecture, kullanıcı önerisi] Bu
    // sistem artık DOĞRUDAN ÇAĞRILARLA DEĞİL, F9Events üzerinden
    // TETİKLENİYOR — flow/rewardFlow.js ve ui/screens.js artık
    // F9GameFeel.celebrateBlast()/onChainMatch()/celebrateVictory()/
    // acknowledgeLoss()'u DOĞRUDAN ÇAĞIRMIYOR, sadece event YAYINLIYOR
    // ("ExplosionStarted", "ComboDetected/Increased", "LevelCompleted/
    // Failed", "PlayerMove"). Motor/flow katmanı bu sistemin VARLIĞINI
    // BİLMİYOR — kanıt niteliğinde ilk göç (bkz. core/event-bus.js
    // başlık yorumu, "sadece F9GameFeel migrate edildi").
    if (_listenersRegistered || typeof F9Events === "undefined") return;
    _listenersRegistered = true;
    F9Events.on("PlayerMove", () => { resetCombo(); });
    F9Events.on("ExplosionStarted", (data) => { celebrateBlast(data.cells, { color: "#A78BFA" }); });
    F9Events.on("ComboDetected", (data) => { onChainMatch(data.match); });
    F9Events.on("ComboIncreased", (data) => { onChainMatch(data.match); });
    F9Events.on("LevelCompleted", () => { celebrateVictory(); });
    F9Events.on("LevelFailed", () => { acknowledgeLoss(); });
  }

  function resetCombo() { _comboCount = 0; }

  // Grup harfinden (a=3'lü...e=7'li) parçacık rengi.
  function _colorForGroup(group) {
    return { a: "#3E8FD4", b: "#4FB87A", c: "#A78BFA", d: "#FF6B35", e: "#FFD700" }[group] || "#FFFFFF";
  }

  // Bir patlamanın TÜM görsel/işitsel/fiziksel tepkisini tetikler.
  // cells: [[r,c],...] — patlayan hücreler.
  function celebrateBlast(cells, opts = {}) {
    if (!cells || cells.length === 0) return;
    const color = opts.color || "#FFFFFF";
    const n = cells.length;

    // 1) Kamera sarsıntısı — boyuta göre (kullanıcının tablosuyla birebir)
    F9Camera.shakeForMatch(n);

    // 2) Canvas parçacıkları — her hücreden birkaç tane, toplamda ~40'a
    //    yaklaşsın diye hücre sayısına göre bölüştürülüyor.
    if (typeof F9Particles !== "undefined") {
      const perCell = Math.max(4, Math.min(14, Math.round(40 / n)));
      for (const [r, c] of cells) {
        F9Particles.burstAtCell(r, c, {
          count: perCell,
          color: [color, "#FFFFFF"],
          speed: 2.5 + Math.min(n, 9) * 0.3,
          life: 450 + Math.min(n, 9) * 25,
          gravity: 0.15,
        });
      }
    }

    // 3) Boyuta göre ölçeklenen patlama sesi.
    if (typeof playSound === "function") playSound("blastSized", { cellCount: n });
  }

  // Zincirdeki HER eşleşme adımında çağrılır — combo sayacını
  // artırır, eşiği geçince Combo Director'ı tetikler.
  function onChainMatch(matchEv) {
    if (!matchEv || !matchEv.cells) return;
    _comboCount++;
    const color = _colorForGroup(matchEv.group);
    celebrateBlast(matchEv.cells, { color });

    const tier = (typeof F9Combo !== "undefined") ? F9Combo.tierFor(_comboCount) : null;
    if (tier) {
      F9Combo.celebrate(_comboCount);
      if (typeof playSound === "function") {
        playSound(_comboCount >= 12 ? "supercombo" : "combo", { tier: F9Combo.TIERS.indexOf(tier) });
      }
    }
  }

  // Level kazanma/kaybetme anlarında çağrılır (ui/screens.js'ten).
  function celebrateVictory() {
    if (typeof playSound === "function") playSound("victory");
    F9Camera.shake(6, 400);
    if (typeof F9Particles !== "undefined") {
      const el = document.getElementById("f9-board-container");
      if (el) {
        const rect = el.getBoundingClientRect();
        F9Particles.burst(rect.width / 2, rect.height / 2, {
          count: 60, color: ["#FFD700", "#FFFFFF", "#A78BFA"], speed: 5, life: 900, gravity: 0.08,
        });
      }
    }
  }
  function acknowledgeLoss() {
    if (typeof playSound === "function") playSound("lose");
  }

  return { init, resetCombo, celebrateBlast, onChainMatch, celebrateVictory, acknowledgeLoss };
})();
