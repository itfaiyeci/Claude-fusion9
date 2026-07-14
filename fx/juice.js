// [Oturum 47 — Game Feel Engine v1.0] Taş "canlılığı" — nefes alma,
// basınca küçülme, bırakınca zıplama, hover parlama. Kullanıcının
// tarif ettiği "■■■ gibi duruyor" sorununa karşı. Kendi <style>
// etiketini enjekte eder, mevcut ui/renderer.js'e HİÇ dokunmaz —
// sadece board container'a event delegation ekler + bir
// MutationObserver ile her render sonrası nefes-alma gecikmelerini
// (stagger) uygular.
const F9Juice = (() => {
  let _observer = null;
  let _initialized = false;

  function _ensureStyle() {
    if (document.getElementById("f9-juice-style")) return;
    const style = document.createElement("style");
    style.id = "f9-juice-style";
    style.textContent = `
      /* [Oturum 53 — kullanıcı isteği] Hücre efektleri (nefes/dönme/
         parlama/hover/basınç) %50 GÜÇLENDİRİLDİ — patlama/eşleşme
         efektlerine (kamera, particle, combo, ses) DOKUNULMADI, onlar
         fx/game-feel.js'te ayrı yönetiliyor. Her değer: (eski sapma × 1.5). */
      @keyframes f9-breathe {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.0525); }
      }
      .f9-cell-breathe {
        animation: f9-breathe 2600ms ease-in-out infinite;
        animation-delay: var(--breathe-delay, 0ms);
        will-change: transform;
      }
      @keyframes f9-shimmer {
        0%, 100% { filter: brightness(1); }
        50%      { filter: brightness(1.525) saturate(1.225); }
      }
      .f9-cell-shimmer {
        animation: f9-shimmer 1400ms ease-in-out;
        animation-delay: var(--shimmer-delay, 0ms);
      }
      .f9-cell-pressed {
        animation: none !important;
        transform: scale(0.82) !important;
        transition: transform 90ms ease-out;
      }
      .f9-cell-released {
        animation: none;
        transform: scale(1.18);
        transition: transform 160ms cubic-bezier(.34,1.56,.64,1);
      }
      .f9-cell:hover:not(.f9-cell-pressed) {
        filter: brightness(1.18);
      }
      /* [Oturum 59 — kullanıcı DÜZELTMESİ: "kare dönüyor hala, pipet
         gibi düşün, dönme YOK, sadece nefes alan sayılar"] Oturum 58'in
         rotateY döndürmesi TAMAMEN KALDIRILDI (span'ın dikdörtgen
         kutusu 3D'de dönerken "dönen kare" gibi görünüyordu — sorun
         buydu). Artık HİÇBİR dönme/animasyon yok — sadece STATİK bir
         cam/pipet parlaması: sayının üstünden çapraz geçen ince, sabit
         bir ışık şeridi (::before, mix-blend-mode:overlay, konumu
         SABİT) + hafif iç/dış glow (text-shadow). Rengi/metni
         DEĞİŞTİRMİYOR, üstüne şeffaf bir "cam" his biniyor. Nefes alma
         (.f9-cell-breathe, üst .f9-cell'de, ayrı element) TEK hareket
         kaynağı — sayının kendisi artık kıpırdamıyor/dönmüyor. */
      .f9-num-holo {
        display: inline-block;
        position: relative;
        text-shadow:
          0 1px 0 rgba(255,255,255,0.45),
          0 -1px 1px rgba(0,0,0,0.22),
          0 0 6px rgba(180,225,255,0.4);
      }
      .f9-num-holo::before {
        content: "";
        position: absolute;
        inset: -15% -45%;
        background: linear-gradient(100deg,
          transparent 32%,
          rgba(255,255,255,0.55) 47%,
          rgba(255,255,255,0.85) 50%,
          rgba(255,255,255,0.55) 53%,
          transparent 68%);
        mix-blend-mode: overlay;
        pointer-events: none;
      }
      /* <img> "replaced element" olduğu için ::before render ETMEZ —
         bu yüzden ayrı, filter-tabanlı statik bir parlama (dönme YOK). */
      .f9-num-holo-img {
        filter: drop-shadow(0 0 4px rgba(180,225,255,0.4)) brightness(1.06);
      }
    `;
    document.head.appendChild(style);
  }

  // Hücrelere nefes-alma sınıfını + kademeli gecikmeyi uygula.
  // Sadece 1-8 değerindeki normal taşlara uygulanır — 9, hediye,
  // blocker gibi özel durumlar kendi animasyonlarını kullanıyor,
  // onlarla çakışmasın diye hariç tutuluyor.
  function applyBreathing() {
    const cells = document.querySelectorAll(".f9-cell");
    cells.forEach((el) => {
      const isSpecial = el.classList.contains("f9-cell-nine") ||
                         el.classList.contains("f9-cell-gift") ||
                         el.classList.contains("f9-cell-element") ||
                         el.classList.contains("f9-cell-blocker") ||
                         el.classList.contains("f9-cell-hourglass");
      if (isSpecial) { el.classList.remove("f9-cell-breathe"); return; }
      const r = parseInt(el.getAttribute("data-r") || "0", 10);
      const c = parseInt(el.getAttribute("data-c") || "0", 10);
      el.style.setProperty("--breathe-delay", ((r * 8 + c) % 16) * 130 + "ms");
      el.classList.add("f9-cell-breathe");
      // [Oturum 59 — kullanıcı düzeltmesi: "kare dönüyor hala, dönme
      // YOK, sadece nefes alan sayılar"] Dönme tamamen kaldırıldı,
      // statik cam parlaması kaldı. isSpecial kontrolü sayesinde
      // SADECE normal sayı hücrelerine (1-8) uygulanıyor.
      _applyHoloNumber(el);
    });
  }

  // [Oturum 59 — kullanıcı isteği: "sadece sayılar, nefes alan
  // sayılar, dönme YOK", küp/kutu YOK] Sayı hücresindeki mevcut <span>
  // veya <img> öğesine DOĞRUDAN bir sınıf ekler — hiçbir yeni
  // element/kutu/kenarlık YARATMAZ, ui/renderer.js'in ürettiği
  // görsel/metin AYNEN yerinde kalır. <span> için ::before ile statik
  // cam parlaması (metin pseudo-element'i olduğu için çalışır); <img>
  // "replaced element" olduğundan ::before render ETMEZ — bu yüzden
  // <img>'e ayrı, sadece filter tabanlı statik bir parlama sınıfı
  // uygulanıyor. İkisi de ANİMASYONSUZ — tek hareket kaynağı nefes
  // alma (.f9-cell-breathe, üst .f9-cell'de).
  function _applyHoloNumber(el) {
    const img = el.querySelector(":scope > img");
    if (img) { img.classList.add("f9-num-holo-img"); return; }
    const plainSpan = el.querySelector(":scope > span");
    if (!plainSpan) return; // boş hücre (null değer) — uygulanacak bir şey yok
    plainSpan.classList.add("f9-num-holo");
  }

  // [YENİ] Periyodik, hover'dan BAĞIMSIZ parlama — rastgele aralıklarla
  // rastgele bir hücre kısa süreliğine parlıyor. Taşlar "canlı"
  // hissettiriyor, sürekli aynı hücrede olmuyor.
  let _shimmerTimer = null;
  function _shimmerTick() {
    const container = document.getElementById("f9-board-container");
    if (!container || !document.body.contains(container)) { _shimmerTimer = null; return; } // ekran değişti, döngüyü durdur
    const cells = [...document.querySelectorAll(".f9-cell.f9-cell-breathe")]; // sadece normal (özel olmayan) taşlar
    if (cells.length > 0) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      cell.style.setProperty("--shimmer-delay", "0ms");
      cell.classList.remove("f9-cell-shimmer");
      void cell.offsetWidth; // reflow — animasyonu yeniden tetikle
      cell.classList.add("f9-cell-shimmer");
      setTimeout(() => cell.classList.remove("f9-cell-shimmer"), 1450);
    }
    const nextDelay = 700 + Math.random() * 1600; // 0.7-2.3sn arası rastgele
    _shimmerTimer = setTimeout(_shimmerTick, nextDelay);
  }
  function _ensureShimmerLoop() {
    if (_shimmerTimer) return; // zaten çalışıyor
    _shimmerTimer = setTimeout(_shimmerTick, 600 + Math.random() * 1000);
  }

  function _onPressStart(e) {
    const cell = e.target.closest(".f9-cell");
    if (!cell) return;
    cell.classList.remove("f9-cell-released");
    cell.classList.add("f9-cell-pressed");
  }
  function _onPressEnd(e) {
    const cell = e.target.closest(".f9-cell");
    if (!cell) return;
    cell.classList.remove("f9-cell-pressed");
    cell.classList.add("f9-cell-released");
    setTimeout(() => cell.classList.remove("f9-cell-released"), 180);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;
    _ensureStyle();
    const container = document.getElementById("f9-board-container");
    if (!container) return;
    // Basınca küçülme / bırakınca zıplama — hem dokunmatik hem fare.
    container.addEventListener("mousedown", _onPressStart);
    container.addEventListener("touchstart", _onPressStart, { passive: true });
    container.addEventListener("mouseup", _onPressEnd);
    container.addEventListener("touchend", _onPressEnd, { passive: true });
    container.addEventListener("mouseleave", () => {
      container.querySelectorAll(".f9-cell-pressed").forEach(el => el.classList.remove("f9-cell-pressed"));
    });
    // Board her yeniden çizildiğinde (innerHTML değiştiğinde) nefes
    // alma sınıflarını yeniden uygula — MutationObserver sadece
    // GERÇEK DOM değişikliğinde tetiklenir, performans dostu.
    const grid = document.getElementById("f9-board-grid") || container;
    _observer = new MutationObserver(() => applyBreathing());
    _observer.observe(grid, { childList: true, subtree: false });
    applyBreathing();
    _ensureShimmerLoop();
  }

  return { init, applyBreathing };
})();
