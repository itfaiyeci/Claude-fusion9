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

  // [Oturum 78 — kullanıcı isteği: "suya atılan taşın dalgası gibi,
  // daha yumuşak"] Önceki yaklaşım `background` özelliğini SERT bir
  // şekilde koyu<->açık arasında değiştiriyordu (anlık, tek bir sabit
  // renk). Artık: (1) sert renk DEĞİŞİMİ yerine YUMUŞAK bir "ışık"
  // katmanı — screen blend ile koyu arka planın üstüne biniyor,
  // opacity ile YAVAŞÇA belirip yavaşça sönüyor (su yüzeyindeki ışık
  // yansıması gibi), (2) merkeze YAKIN hücreler GÜÇLÜ, UZAK hücreler
  // SOLUK — gerçek bir su dalgasının enerjisinin mesafeyle azalması
  // gibi (intensity parametresi). Katman `el`'in İLK ÇOCUĞU, sayı
  // DOM'da SONRA eklendiği için hep üstte kalır — "sayılar hariç"
  // hâlâ garanti. `Element.animate()` (CSS transition değil) kullanılıyor
  // — Oturum 76'da bulunan "tarayıcı transition'ı atlayabiliyor" sorunu
  // burada YOK, çünkü animate() senkron tetiklenme belirsizliğinden etkilenmez.
  function _cellReflectionWave(el, opts = {}) {
    if (!el) return;
    const intensity = opts.intensity ?? 1;   // 1 = merkez (tam güç), 0'a yaklaştıkça soluklaşır
    const duration  = opts.duration  ?? 650; // yumuşak/uzun — su dalgası gibi ağır ağır

    // 1) Yumuşak ışık katmanı — koyu arka planı AYDINLATIYOR (screen
    //    blend), opak bir renk DEĞİŞİMİ değil, bu yüzden yoğunluk
    //    (intensity) doğal olarak "ne kadar aydınlık" ile orantılı.
    const glow = document.createElement("div");
    glow.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:0;border-radius:inherit;mix-blend-mode:screen;" +
      `background:radial-gradient(circle, rgba(232,226,216,${(0.6*intensity).toFixed(2)}) 0%, rgba(232,226,216,${(0.22*intensity).toFixed(2)}) 55%, transparent 100%);`;
    el.insertBefore(glow, el.firstChild);
    if (glow.animate) {
      glow.animate([
        { opacity: 0 },
        { opacity: 1, offset: 0.30 },
        { opacity: 0.85, offset: 0.55 },
        { opacity: 0 },
      ], { duration, easing: "ease-in-out" })
        .addEventListener("finish", () => glow.remove());
    } else {
      setTimeout(() => glow.remove(), duration);
    }

    // 2) Ayna yansıması bandı — çapraz kayan parlak gradyan, sayının
    //    ARKASINDA. Yoğunluk (intensity) ile orantılı soluklaşıyor,
    //    süre de merkeze göre biraz daha yavaş — dalga dışarı doğru
    //    yavaşlayarak yayılıyor hissi.
    const sweep = document.createElement("div");
    sweep.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:0;border-radius:inherit;overflow:hidden;" +
      `background:linear-gradient(115deg, transparent 25%, rgba(255,255,255,${(0.4*intensity).toFixed(2)}) 46%, rgba(255,255,255,${(0.62*intensity).toFixed(2)}) 50%, rgba(255,255,255,${(0.4*intensity).toFixed(2)}) 54%, transparent 75%);` +
      "transform:translateX(-140%);";
    el.insertBefore(sweep, el.firstChild);
    const sweepDuration = duration * 0.85;
    if (sweep.animate) {
      sweep.animate([
        { transform: "translateX(-140%)" },
        { transform: "translateX(140%)" },
      ], { duration: sweepDuration, easing: "ease-in-out" })
        .addEventListener("finish", () => sweep.remove());
    } else {
      setTimeout(() => sweep.remove(), sweepDuration);
    }
  }

  // [Oturum 81 — kullanıcı isteği: "sayıların kendisine de havuza
  // atılan taş efektini ver", SADECE sayının üzerinde, hücre arka
  // planına DOKUNMADAN] Sayının kendi görselinin (img veya span,
  // ui/renderer.js'in ürettiği) ÜZERİNDE genişleyen bir su halkası —
  // Oturum 78'deki hücre dalgasından TAMAMEN BAĞIMSIZ, ayrı bir
  // eleman. Sayının ARKASINA ekleniyor (insertBefore), böylece sayı
  // hep üstte okunur kalıyor.
  function _numberRippleWave(numEl) {
    if (!numEl) return;
    const parent = numEl.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    // [Oturum 82 — kullanıcı bulgusu: "tepkiyi göremedim"] Halka
    // TEKNİK OLARAK çalışıyordu (doğrulandı) ama diğer eş zamanlı
    // efektler (particle, hücre dalgası, shockwave) arasında çok
    // soluk kalıyordu. Artık: kalın kenarlı halka + İÇİ dolu bir
    // parlama (radial-gradient) birlikte, daha yüksek opaklık.
    const ring = document.createElement("div");
    ring.style.cssText =
      "position:absolute;left:50%;top:50%;width:34%;height:34%;border-radius:50%;" +
      "border:3px solid rgba(255,255,255,0.95);pointer-events:none;z-index:0;" +
      "background:radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%);" +
      "box-shadow:0 0 10px 2px rgba(255,255,255,0.6);" +
      "transform:translate(-50%,-50%) scale(0.25);mix-blend-mode:screen;";
    parent.insertBefore(ring, numEl);
    if (ring.animate) {
      ring.animate([
        { transform: "translate(-50%,-50%) scale(0.25)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(1.4)", opacity: 0.7, offset: 0.45 },
        { transform: "translate(-50%,-50%) scale(2.6)", opacity: 0 },
      ], { duration: 650, easing: "ease-out" })
        .addEventListener("finish", () => ring.remove());
    } else {
      setTimeout(() => ring.remove(), 650);
    }
  }

  // [Oturum 83 — kullanıcı isteği: referans görsel, "parlayan sayılara
  // bitişik parlayan yıldız efekti", halkaya EK olarak] Sayının
  // etrafına saçılan küçük 4 köşeli yıldız/kıvılcım şekilleri —
  // klasik "sparkle" ikonu (clip-path ile elmas/yıldız), her biri
  // farklı açıda dışarı fırlayıp döner ve söner. Halkayla (yukarısı)
  // AYNI ANDA, ona ek olarak çalışıyor.
  function _numberSparkleBurst(numEl, count = 5) {
    if (!numEl) return;
    const parent = numEl.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    const STAR_CLIP = "polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)";
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() * 30 - 15); // eşit aralıklı + hafif rastgelelik
      const dist = 55 + Math.random() * 25; // % — sayının merkezinden ne kadar uzağa fırlasın
      const dx = Math.cos(angle * Math.PI / 180) * dist;
      const dy = Math.sin(angle * Math.PI / 180) * dist;
      const size = 14 + Math.random() * 10;
      const star = document.createElement("div");
      star.style.cssText =
        `position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;` +
        "background:linear-gradient(135deg,#FFFFFF 0%,#FFE9A8 60%,#E0B23C 100%);" +
        `clip-path:${STAR_CLIP};pointer-events:none;z-index:0;` +
        "transform:translate(-50%,-50%) scale(0) rotate(0deg);" +
        "box-shadow:0 0 6px 1px rgba(255,230,160,0.8);";
      parent.insertBefore(star, numEl);
      const endX = `calc(-50% + ${dx}%)`, endY = `calc(-50% + ${dy}%)`;
      if (star.animate) {
        star.animate([
          { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", offset: 0, opacity: 1 },
          { transform: `translate(${endX},${endY}) scale(1) rotate(90deg)`, offset: 0.4, opacity: 1 },
          { transform: `translate(${endX},${endY}) scale(0.3) rotate(160deg)`, offset: 1, opacity: 0 },
        ], { duration: 620 + Math.random() * 150, easing: "cubic-bezier(0.2,0.8,0.3,1)" })
          .addEventListener("finish", () => star.remove());
      } else {
        setTimeout(() => star.remove(), 700);
      }
    }
  }

  function celebrateMerge(r, c) {
    if (r == null || c == null) return;
    // [Oturum 71] 4x4 grid parçacık patlaması. Bu, board container'ın
    // KENDİSİNE (canvas) bağlı, hücrelere değil — render() tarafından
    // silinmiyor, hemen çalıştırılabilir.
    if (typeof F9Particles !== "undefined") {
      const pos = F9Particles.cellCenter(r, c);
      if (pos) {
        F9Particles.burstGrid(pos.x, pos.y, {
          color: ["#FFFFFF", "#D8D2C8", "#A78BFA"], speed: 2.4, life: 360, spacing: 7, size: 3,
        });
      }
    }
    // [Oturum 73] Dalgalanma halkası — document.body'ye eklenen SABİT
    // bir eleman (fx/blast-fx.js _shockwave), hücrelere BAĞLI DEĞİL —
    // render() tarafından silinmiyor, hemen çalıştırılabilir.
    if (typeof F9Anim !== "undefined" && typeof F9Anim.shockwave === "function") {
      F9Anim.shockwave(r, c, "#FFFFFF66");
    }
    // [Oturum 77 — KRİTİK HATA DÜZELTMESİ, kullanıcı ekran görüntüsüyle
    // kanıtladı: "dalgalanma bu kadar" (hücre renkleri hiç görünmüyor)]
    // KÖK NEDEN: "PlainMerge" event'i yayınlandıktan HEMEN SONRA, AYNI
    // senkron JS turunda flow/rewardFlow.js executeMove() içinde
    // render()/renderBoardOnly() çağrılıyor — bu, TÜM .f9-cell DOM
    // elemanlarını YENİDEN OLUŞTURUYOR. Hücreleri BURADA (senkron
    // olarak) boyamak, tarayıcı HİÇ BOYAMADAN (paint) önce o elemanlar
    // render() tarafından silindiği için TAMAMEN GÖRÜNMEZ oluyordu —
    // parçacık/dalgalanma (hücrelere bağlı olmayan, ayrı elemanlar)
    // görünüyordu ama hücre renk değişimi hiç görünmüyordu. ÇÖZÜM: hücre
    // boyamasını requestAnimationFrame ile SONRAKİ FRAME'E ertele —
    // render() senkron olarak zaten bitmiş olacak, DOM'u O NOKTADA
    // YENİDEN sorgula (eski `el` referansını SAKLAMA, o zaten kopmuş
    // olabilir).
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (!el) return;
      _cellReflectionWave(el, { intensity: 1, duration: 650 });
      el.animate?.([
        { transform: "scale(1)" },
        { transform: "scale(1.16)" },
        { transform: "scale(1)" },
      ], { duration: 220, easing: "ease-out" });
      // [Oturum 81] Sayının kendisi üzerinde AYRI bir su halkası —
      // hücre arka planına dokunmuyor, sadece img/span'ın kendi alanında.
      const numEl = el.querySelector(":scope > img, :scope > span");
      _numberRippleWave(numEl);
      // [Oturum 83] Halkaya EK olarak — sayının etrafına saçılan yıldız/kıvılcımlar.
      _numberSparkleBurst(numEl);
      // Etraftaki hücreler de aynı yansıma dalgasını, merkeze olan
      // mesafeye göre kademeli gecikmeyle ve AZALAN GÜÇLE alıyor — su
      // dalgası gibi dışarı doğru yayılıp yumuşayarak zayıflıyor.
      _illuminateNeighbors(r, c);
    });
  }

  // Merkez hücrenin etrafındaki hücreleri, merkeze olan mesafeye göre
  // KADEMELİ GECİKMEYLE VE AZALAN YOĞUNLUKLA aynı yansıma dalgasıyla
  // aydınlatır — "suya atılan taşın dalgası gibi, daha yumuşak" (Oturum
  // 78). DİKKAT: `el` referansları HER GECİKMEDE YENİDEN sorgulanıyor
  // (setTimeout içinde, önceden değil) — render() bu sırada tekrar
  // çalışırsa (nadiren) yine güncel DOM'u bulsun diye.
  function _illuminateNeighbors(r, c, radius = 2) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue; // merkez zaten kendi dalgasını aldı
        const dist = Math.hypot(dr, dc);
        if (dist > radius + 0.1) continue; // köşeleri ele, daire şeklinde yayılsın
        const nr = r + dr, nc = c + dc;
        const delay = Math.round(dist * 85); // [Oturum 78] su dalgası hissi için yavaşlatıldı (55->85ms/birim) — dalganın yayılması artık göz gözle takip edilebilir
        const intensity = Math.max(0.25, 1 - (dist / (radius + 0.6)) * 0.75); // merkeze yakın güçlü, uzak SOLUK (ama tamamen kaybolmuyor)
        const duration = 650 + dist * 60; // dalga dışarı doğru biraz YAVAŞLAYARAK sönüyor
        setTimeout(() => {
          const nel = document.querySelector(`[data-r="${nr}"][data-c="${nc}"]`);
          if (nel) _cellReflectionWave(nel, { intensity, duration });
        }, delay);
      }
    }
  }

  return { init, resetCombo, celebrateBlast, onChainMatch, celebrateVictory, acknowledgeLoss, celebrateMerge };
})();
