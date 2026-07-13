const F9Anim = (() => {
  // Hücre DOM elemanını bul
  function _el(r, c) {
    return document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }

  // Patlama rengi — hediye/eleman/normal için farklı
  function _blastColor(r, c, gc) {
    if (!gc) return "#FFFFFF";
    const k = cellKey(r, c);
    if (gc.gifts?.has(k))    return "#FFD700";
    if (gc.elements?.has(k)) return "#FF6B35";
    if (gc.blockers?.has(k)) return "#FF4444";
    const v = gc.board?.getCell(r, c);
    if (v === 9) return "#A78BFA";
    return "#FFFFFF";
  }

  // Tek hücre patlama — "uçup git" efekti
  function _blastCell(el, color, delay=0) {
    if (!el) return;
    setTimeout(() => {
      el.style.transition = "none";
      el.style.background = color;
      el.style.boxShadow  = `0 0 20px ${color}, 0 0 40px ${color}88`;
      el.classList.add("f9-blast-out");
      el.addEventListener("animationend", () => {
        el.classList.remove("f9-blast-out");
        el.style.background = "";
        el.style.boxShadow  = "";
      }, { once: true });
    }, delay);
  }

  // Yeni sayı geldi — "yukarıdan düş" efekti
  function _fallIn(el, delay=0) {
    if (!el) return;
    setTimeout(() => {
      el.classList.add("f9-fall-in");
      el.addEventListener("animationend", () => {
        el.classList.remove("f9-fall-in");
      }, { once: true });
    }, delay);
  }

  // Hediye spawn — "pop" efekti
  function _spawnGift(el, delay=0) {
    if (!el) return;
    setTimeout(() => {
      el.classList.add("f9-spawn-gift");
      el.addEventListener("animationend", () => {
        el.classList.remove("f9-spawn-gift");
      }, { once: true });
    }, delay);
  }

  // Şok dalgası — patlama merkezinden yayılan halka
  function _shockwave(r, c, color="#FFFFFF88") {
    const el = _el(r, c);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ring = document.createElement("div");
    ring.style.cssText = `
      position:fixed;
      left:${rect.left + rect.width/2}px;
      top:${rect.top + rect.height/2}px;
      width:${rect.width}px; height:${rect.height}px;
      border-radius:50%;
      border:3px solid ${color};
      transform:translate(-50%,-50%) scale(0.3);
      pointer-events:none;
      z-index:9998;
    `;
    document.body.appendChild(ring);
    ring.animate([
      { transform:"translate(-50%,-50%) scale(0.3)", opacity:0.9, borderWidth:"4px" },
      { transform:"translate(-50%,-50%) scale(3.5)", opacity:0,   borderWidth:"1px" },
    ], { duration:F9_CONFIG.ANIM.SHOCK_RING, easing:"ease-out", fill:"forwards" })
      .addEventListener("finish", () => ring.remove());
  }

  // Ana fonksiyon: patlama seti için animasyon başlat
  function playBlast(cells, gc, options={}) {
    if (!cells || cells.length === 0) return;
    const {
      color    = null,     // null = hücreye göre otomatik
      delay    = 0,        // ms — başlangıç gecikmesi
      stagger  = 20,       // ms — hücreler arası gecikme
      center   = null,     // [r,c] — şok dalgası merkezi
      giftSpawn= null,     // [r,c] — hediye spawn noktası
    } = options;

    // Şok dalgası — merkez varsa
    if (center) {
      setTimeout(() => _shockwave(center[0], center[1], color || "#FFD70088"), delay);
    }

    // Hücreleri merkeze göre Manhattan mesafesiyle sırala (dalga efekti)
    const sorted = center
      ? [...cells].sort((a, b) =>
          (Math.abs(a[0]-center[0]) + Math.abs(a[1]-center[1])) -
          (Math.abs(b[0]-center[0]) + Math.abs(b[1]-center[1]))
        )
      : cells;

    // animationend sayacı — sekme arka plana alınsa bile senkronize çalışır
    let _blastDone = 0;
    const _blastTotal = sorted.length || 1;

    function _onAllBlastDone() {
      // Tüm blast animasyonları bitti → fall-in uygula
      requestAnimationFrame(() => {
        cells.forEach(([r, c]) => {
          const el = _el(r, c);
          if (el) _fallIn(el, 0);
        });
      });
      // Hediye spawn
      if (giftSpawn) {
        setTimeout(() => {
          const gEl = _el(giftSpawn[0], giftSpawn[1]);
          if (gEl) _spawnGift(gEl);
        }, 80);
      }
    }

    sorted.forEach(([r, c], i) => {
      const el = _el(r, c);
      const col = color || _blastColor(r, c, gc);
      const cellDelay = delay + i * stagger;

      if (!el) {
        // DOM elemanı yoksa sayacı güncelle
        _blastDone++;
        if (_blastDone >= _blastTotal) _onAllBlastDone();
        return;
      }

      // animationend ile sayaç tut — setTimeout'tan daha güvenilir
      const _onEnd = () => {
        el.classList.remove("f9-blast-out");
        el.style.background = "";
        el.style.boxShadow  = "";
        _blastDone++;
        if (_blastDone >= _blastTotal) _onAllBlastDone();
      };

      setTimeout(() => {
        el.style.transition = "none";
        el.style.background = col;
        el.style.boxShadow  = `0 0 20px ${col}, 0 0 40px ${col}88`;
        el.classList.add("f9-blast-out");
        el.addEventListener("animationend", _onEnd, { once: true });
        // Güvenlik: animasyonsuz sekme için fallback timeout
        setTimeout(() => {
          if (!el.classList.contains("f9-blast-out")) return;
          _onEnd();
        }, 600);
      }, cellDelay);
    });
  }

  // Zincir eşleşme animasyonu (resolveBoard)
  function playChainMatch(cells, color="#A78BFA") {
    cells.forEach(([r, c], i) => {
      const el = _el(r, c);
      _blastCell(el, color, i * 30);
    });
    const after = cells.length * 30 + 380;
    setTimeout(() => {
      requestAnimationFrame(() => {
        cells.forEach(([r, c]) => {
          const el = _el(r, c);
          if (el) _fallIn(el, 0);
        });
      });
    }, after);
  }

  return { playBlast, playChainMatch, spawnGift: _spawnGift, fallIn: _fallIn, shockwave: _shockwave };
})();
