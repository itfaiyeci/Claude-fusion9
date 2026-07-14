// [Oturum 87 — kullanıcı isteği: "kutular ayrı, rakamlar ayrı, daha
// iyi olmaz mı"] Sayının KENDİSİNE uygulanan efektler (halka/ışın/
// kıvılcım) fx/game-feel.js'ten AYRILDI — o dosya artık sadece hücre/
// genel efektleri (kamera, particle patlaması, hücre dalgası, combo,
// zafer/kayıp) barındırıyor. fx/game-feel.js'in celebrateMerge()'i
// bu modüldeki fonksiyonları çağırıyor. Davranış BİREBİR AYNI —
// sadece dosya konumu değişti, mantık hiç değişmedi.
const F9NumberFx = (() => {

  // [Oturum 81 — kullanıcı isteği: "sayıların kendisine de havuza
  // atılan taş efektini ver", SADECE sayının üzerinde, hücre arka
  // planına DOKUNMADAN] Sayının kendi görselinin (img veya span,
  // ui/renderer.js'in ürettiği) ÜZERİNDE genişleyen bir su halkası —
  // fx/game-feel.js'teki hücre dalgasından TAMAMEN BAĞIMSIZ, ayrı bir
  // eleman.
  function ripple(numEl) {
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
    // [Oturum 85 — kullanıcı bulgusu: "kutulardaki efekt ok, sayılardaki
    // nerede"] KÖK NEDEN: sayı görseli (<img>, %100 boyutlu) OPAK —
    // arkasına eklenen (insertBefore) hiçbir şey görünmüyordu, görsel
    // tarafından tamamen gizleniyordu. Hücre dalgası (Oturum 78) görünür
    // çünkü document.body'ye bağlı AYRI, sabit-konumlu bir eleman
    // (görselin İÇİNDE değil). Artık bu üç efekt (halka/ışın/kıvılcım)
    // sayının ÖNÜNE (appendChild, en son çocuk) ekleniyor, screen blend
    // ile üstüne biniyor — görünür oluyor ama sayıyı boğmuyor.
    parent.appendChild(ring);
    if (ring.animate) {
      ring.animate([
        { transform: "translate(-50%,-50%) scale(0.25)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(1.4)", opacity: 0.7, offset: 0.45 },
        { transform: "translate(-50%,-50%) scale(2.6)", opacity: 0 },
      ], { duration: 1300, easing: "ease-out" }) // [Oturum 86] %50 yavaşlatıldı (650->1300ms)
        .addEventListener("finish", () => ring.remove());
    } else {
      setTimeout(() => ring.remove(), 1300);
    }
  }

  // [Oturum 84 — kullanıcı isteği: "efektler sahne ışıltısı gibi olsun,
  // daha estetik"] Referans görseldeki ışın huzmeleri (merkezden dışarı
  // yayılan ince ışık çizgileri, "yıldız patlaması/sahne ışığı" hissi).
  function lightRays(numEl, count = 8) {
    if (!numEl) return;
    const parent = numEl.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i;
      const ray = document.createElement("div");
      const length = 60 + Math.random() * 20; // %
      ray.style.cssText =
        `position:absolute;left:50%;top:50%;width:1.5px;height:${length}%;` +
        "background:linear-gradient(to bottom, rgba(255,250,225,0.95) 0%, rgba(255,230,160,0.35) 55%, transparent 100%);" +
        "pointer-events:none;z-index:0;transform-origin:top center;" +
        `transform:translate(-50%,0) rotate(${angle}deg) scaleY(0);` +
        "mix-blend-mode:screen;";
      parent.appendChild(ray); // [Oturum 85] görselin ÖNÜNE — arkası opak olduğu için görünmüyordu
      if (ray.animate) {
        ray.animate([
          { transform: `translate(-50%,0) rotate(${angle}deg) scaleY(0)`, opacity: 0 },
          { transform: `translate(-50%,0) rotate(${angle}deg) scaleY(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `translate(-50%,0) rotate(${angle}deg) scaleY(1.15)`, opacity: 0 },
        ], { duration: 1100, easing: "ease-out" }) // [Oturum 86] %50 yavaşlatıldı (550->1100ms)
          .addEventListener("finish", () => ray.remove());
      } else {
        setTimeout(() => ray.remove(), 1100);
      }
    }
  }

  // [Oturum 83 — kullanıcı isteği: referans görsel, "parlayan sayılara
  // bitişik parlayan yıldız efekti", halkaya EK olarak] Sayının
  // etrafına saçılan küçük 4 köşeli yıldız/kıvılcım şekilleri —
  // klasik "sparkle" ikonu (clip-path ile elmas/yıldız), her biri
  // farklı açıda dışarı fırlayıp döner ve söner.
  // [Oturum 84 — "daha estetik"] Sayı ve boyut aralığı KÜÇÜLTÜLDÜ —
  // az sayıda büyük kıvılcım yerine çok sayıda küçük, zarif titreşen
  // toz taneciği hissi (gerçek sahne ışıltısı gibi).
  function sparkleBurst(numEl, count = 9) {
    if (!numEl) return;
    const parent = numEl.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    const STAR_CLIP = "polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)";
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() * 30 - 15); // eşit aralıklı + hafif rastgelelik
      const dist = 45 + Math.random() * 35; // % — sayının merkezinden ne kadar uzağa fırlasın
      const dx = Math.cos(angle * Math.PI / 180) * dist;
      const dy = Math.sin(angle * Math.PI / 180) * dist;
      const size = 5 + Math.random() * 7; // [Oturum 84] küçültüldü (önceki 14-24px -> 5-12px)
      const star = document.createElement("div");
      star.style.cssText =
        `position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;` +
        "background:linear-gradient(135deg,#FFFFFF 0%,#FFE9A8 60%,#E0B23C 100%);" +
        `clip-path:${STAR_CLIP};pointer-events:none;z-index:0;` +
        "transform:translate(-50%,-50%) scale(0) rotate(0deg);" +
        "box-shadow:0 0 5px 1px rgba(255,230,160,0.85);";
      parent.appendChild(star); // [Oturum 85] görselin ÖNÜNE — arkası opak olduğu için görünmüyordu
      const endX = `calc(-50% + ${dx}%)`, endY = `calc(-50% + ${dy}%)`;
      // [Oturum 84] Titreşim (twinkle) — büyürken küçük bir "nabız"
      // atsın, tek düze büyüyüp sönmesin, gerçek ışıltı hissi versin.
      if (star.animate) {
        star.animate([
          { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", offset: 0, opacity: 1 },
          { transform: `translate(${endX},${endY}) scale(1.1) rotate(70deg)`, offset: 0.32, opacity: 1 },
          { transform: `translate(${endX},${endY}) scale(0.7) rotate(110deg)`, offset: 0.5, opacity: 0.75 },
          { transform: `translate(${endX},${endY}) scale(1) rotate(150deg)`, offset: 0.68, opacity: 0.9 },
          { transform: `translate(${endX},${endY}) scale(0.2) rotate(200deg)`, offset: 1, opacity: 0 },
        ], { duration: 1400 + Math.random() * 400, easing: "ease-in-out" }) // [Oturum 86] %50 yavaşlatıldı (700-900 -> 1400-1800ms)
          .addEventListener("finish", () => star.remove());
      } else {
        setTimeout(() => star.remove(), 1400);
      }
    }
  }

  return { ripple, lightRays, sparkleBurst };
})();
