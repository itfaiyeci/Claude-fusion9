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
    // [Oturum 70 — kullanıcı bulgusu: "eşleşen 2 sayı için efekt yok"]
    F9Events.on("PlainMerge", (data) => { celebrateMerge(data.r, data.c); });
  }

  function resetCombo() { _comboCount = 0; }

  // Grup harfinden (a=3'lü...e=7'li) parçacık rengi.
  function _colorForGroup(group) {
    return { a: "#3E8FD4", b: "#4FB87A", c: "#A78BFA", d: "#FF6B35", e: "#FFD700" }[group] || "#FFFFFF";
  }

  // [Oturum 68 — kullanıcı isteği: "sürükleyici, aksiyon", ekran flaşı +
  // slow-motion] Tam bir zaman-yavaşlatma motoru YOK (bu bir oyun döngüsü/
  // deltaTime tabanlı motor değil, DOM+CSS+setTimeout tabanlı) — bunun
  // yerine dövüş oyunlarındaki "hitstop" tekniği: büyük patlamadan HEMEN
  // ÖNCE kısa bir duraklama (ekran donmuş gibi), SONRA kamera+particle+ses
  // hep birlikte patlıyor. Beyin bunu "zaman büküldü" olarak algılıyor.
  // Sadece BÜYÜK eşleşmelerde (n≥6) tetiklenir — küçük 3'lü/4'lü'lerde
  // her patlamada duraklama olursa oyun YAVAŞ hisseder, tam tersi etki.
  function _flash(intensity, durationMs) {
    const container = document.getElementById("f9-board-container");
    if (!container) return;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;inset:0;background:#FFFFFF;pointer-events:none;z-index:70;border-radius:inherit;opacity:0;";
    container.appendChild(el);
    el.animate([
      { opacity: 0 },
      { opacity: intensity, offset: 0.18 },
      { opacity: 0 },
    ], { duration: durationMs, easing: "ease-out" })
      .addEventListener("finish", () => el.remove());
  }

  function _hitstop(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Bir patlamanın TÜM görsel/işitsel/fiziksel tepkisini tetikler.
  // cells: [[r,c],...] — patlayan hücreler.
  async function celebrateBlast(cells, opts = {}) {
    if (!cells || cells.length === 0) return;
    const color = opts.color || "#FFFFFF";
    const n = cells.length;

    // [Oturum 68] Büyük patlama (n≥6): flaş + hitstop, KAMERA/PARÇACIK/
    // SESTEN ÖNCE — "an" burada başlıyor hissi.
    if (n >= 6) {
      const bigness = Math.min(1, (n - 6) / 3); // n=6 -> 0, n=9+ -> 1 (Diamond/Matrix'te tam güç)
      _flash(0.30 + bigness * 0.55, 160 + bigness * 140);
      await _hitstop(35 + bigness * 85); // ~35ms (6'lı) - ~120ms (Diamond/Matrix)
    }

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

  // [Oturum 75 — kullanıcı isteği, netleştirilmiş (5. deneme): "hücrelerin
  // renklerini koyu renkten açık renk yapacaksın, sayılar hariç. Karelerin
  // içinden ayna yansıması dalgası olacak."]
  // ÖNCEKİ HATA: filter:brightness(...) kullanıyordum — CSS filter,
  // elementin İÇİNDEKİ HER ŞEYİ (sayı dahil) birlikte etkiler, bu yüzden
  // "sayılar hariç" isteği karşılanamıyordu. DÜZELTME: artık SADECE
  // hücrenin `background` özelliği değişiyor (koyu->açık geçiş, sayıyı
  // hiç etkilemez — background her zaman sayının ARKASINDA) + ayrı bir
  // "yansıma bandı" (çapraz, parlak bir gradyan) hücrenin İLK ÇOCUĞU
  // olarak eklenip kayıyor — sayı z-index/DOM sırası gereği HEP ÜSTTE
  // kalıyor, bant sayının ARKASINDAN geçiyor (tam "ayna yansıması" hissi).
  function _cellReflectionWave(el) {
    if (!el) return;
    // [Oturum 76 — kullanıcı bulgusu: "belli olmuyor"] GERÇEK HATA:
    // `transition` özelliğini ayarlayıp AYNI JS turunda `background`
    // değerini değiştirmek, tarayıcıda genelde ÇALIŞIR ama garanti
    // DEĞİL — bazı durumlarda tarayıcı iki değişikliği TEK BOYAMADA
    // birleştirip geçiş animasyonunu HİÇ OYNATMADAN atlıyor (aynı
    // sorunu fx/juice.js'teki shimmer'da da yaşamıştık, orada
    // `void cell.offsetWidth` ile zorla reflow yapılıp düzeltilmişti —
    // burada o adım UNUTULMUŞTU). Ayrıca renk de yeterince "açık"
    // değildi (#4C5690 hâlâ oldukça koyu bir mor) — artık gerçekten
    // AÇIK bir tona (#E8E2D8, ana arayüzün "açık bej" rengi) gidiyor.
    const prevBg = el.style.background;
    const prevTransition = el.style.transition;
    el.style.transition = "none";
    el.style.background = prevBg || getComputedStyle(el).backgroundImage; // mevcut koyu hâli sabitle
    void el.offsetWidth; // ZORLA REFLOW — transition'ın gerçekten tetiklenmesini garantiler
    el.style.transition = "background 0.32s ease-out";
    el.style.background = "linear-gradient(145deg, #E8E2D8 0%, #C9C2B4 100%)"; // gerçekten AÇIK ton
    setTimeout(() => {
      el.style.background = prevBg || "";
      setTimeout(() => { el.style.transition = prevTransition || ""; }, 340);
    }, 260);

    // 2) Ayna yansıması bandı — çapraz kayan parlak gradyan, sayının
    //    ARKASINDA (ilk child olarak eklendiği için doğal DOM sırasıyla
    //    sonradan eklenen sayı her zaman üstte kalır). Arka plan
    //    geçişiyle (260ms açık + fade) SÜRESİ EŞLEŞTİRİLDİ.
    const sweep = document.createElement("div");
    sweep.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:0;border-radius:inherit;overflow:hidden;" +
      "background:linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.65) 46%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.65) 54%, transparent 75%);" +
      "transform:translateX(-140%);";
    el.insertBefore(sweep, el.firstChild);
    if (sweep.animate) {
      sweep.animate([
        { transform: "translateX(-140%)" },
        { transform: "translateX(140%)" },
      ], { duration: 520, easing: "ease-in-out" })
        .addEventListener("finish", () => sweep.remove());
    } else {
      setTimeout(() => sweep.remove(), 520);
    }
  }

  function celebrateMerge(r, c) {
    if (r == null || c == null) return;
    // [Oturum 71] 4x4 grid parçacık patlaması.
    if (typeof F9Particles !== "undefined") {
      const pos = F9Particles.cellCenter(r, c);
      if (pos) {
        F9Particles.burstGrid(pos.x, pos.y, {
          color: ["#FFFFFF", "#D8D2C8", "#A78BFA"], speed: 2.4, life: 360, spacing: 7, size: 3,
        });
      }
    }
    // [Oturum 75] Merkez hücrede ayna yansıması dalgası + arkaplan geçişi.
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    _cellReflectionWave(el);
    if (el) {
      el.animate?.([
        { transform: "scale(1)" },
        { transform: "scale(1.16)" },
        { transform: "scale(1)" },
      ], { duration: 220, easing: "ease-out" });
    }
    // [Oturum 73] Dalgalanma halkası (dekoratif, F9Anim'de zaten vardı).
    if (typeof F9Anim !== "undefined" && typeof F9Anim.shockwave === "function") {
      F9Anim.shockwave(r, c, "#FFFFFF66");
    }
    // [Oturum 74→75] Etraftaki hücreler de aynı yansıma dalgasını, merkeze
    // olan mesafeye göre kademeli gecikmeyle alıyor — ışık dışarı yayılıyor.
    _illuminateNeighbors(r, c);
  }

  // Merkez hücrenin etrafındaki hücreleri, merkeze olan mesafeye göre
  // KADEMELİ GECİKMEYLE aynı yansıma dalgasıyla aydınlatır.
  function _illuminateNeighbors(r, c, radius = 2) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue; // merkez zaten kendi dalgasını aldı
        const dist = Math.hypot(dr, dc);
        if (dist > radius + 0.1) continue; // köşeleri ele, daire şeklinde yayılsın
        const nr = r + dr, nc = c + dc;
        const el = document.querySelector(`[data-r="${nr}"][data-c="${nc}"]`);
        if (!el) continue;
        const delay = Math.round(dist * 55); // ışık dışarı doğru yayılıyor gibi kademeli gecikme
        setTimeout(() => _cellReflectionWave(el), delay);
      }
    }
  }

  return { init, resetCombo, celebrateBlast, onChainMatch, celebrateVictory, acknowledgeLoss, celebrateMerge };
})();
