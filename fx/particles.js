// [Oturum 47 — Game Feel Engine v1.0] Canvas parçacık sistemi.
// Kullanıcının özellikle belirttiği gibi: DOM elementi oluşturarak
// DEĞİL, tek bir <canvas> üzerinde gerçek fizikli (hız, yerçekimi,
// solma) parçacıklarla. Her patlamada ~40 parçacık hedefleniyor,
// ama performans için toplam aktif parçacık sayısı sınırlı tutuluyor.
const F9Particles = (() => {
  let _canvas = null, _ctx = null;
  let _particles = [];
  let _rafId = null;
  const MAX_PARTICLES = 500; // performans tavanı — düşük güçlü cihazlarda da akıcı kalsın

  function _ensureCanvas() {
    if (_canvas && document.body.contains(_canvas)) return _canvas;
    const container = document.getElementById("f9-board-container");
    if (!container) return null;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    _canvas = document.createElement("canvas");
    _canvas.id = "f9-particle-canvas";
    _canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;";
    container.appendChild(_canvas);
    _ctx = _canvas.getContext("2d");
    _resize();
    if (!F9Particles._resizeBound) {
      window.addEventListener("resize", _resize);
      F9Particles._resizeBound = true;
    }
    return _canvas;
  }

  function _resize() {
    if (!_canvas) return;
    const container = _canvas.parentElement;
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    _canvas.width = rect.width * dpr;
    _canvas.height = rect.height * dpr;
    if (_ctx) _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Bir board hücresinin (r,c) canvas üzerindeki (x,y) merkezini bul.
  function cellCenter(r, c) {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    const container = document.getElementById("f9-board-container");
    if (!el || !container) return null;
    const elRect = el.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    return {
      x: elRect.left - contRect.left + elRect.width / 2,
      y: elRect.top - contRect.top + elRect.height / 2,
    };
  }

  // Bir patlamadan patlama parçacıkları fırlat.
  // color: hex string veya hex dizisi (karışık renk patlaması için)
  function burst(x, y, opts = {}) {
    const canvas = _ensureCanvas();
    if (!canvas) return;
    // [Oturum 69 — kullanıcı bulgusu: "efektler görünmüyor/çok pasif"]
    // GÜVENLİK KONTROLÜ: canvas'ın PİKSEL boyutu (canvas.width/height)
    // sadece _ensureCanvas() İLK ÇAĞRILDIĞINDA _resize() ile ayarlanıyordu
    // — eğer o an tahta henüz tam yerleşmemişse (örn. geçiş animasyonu
    // sürerken, 0 genişlik/yükseklik), canvas SONSUZA KADAR 0×0 kalıyordu
    // (sadece pencere yeniden boyutlanınca düzeliyordu). Artık HER
    // patlamada boyut kontrol ediliyor, gerçekte 0 ise yeniden ölçülüyor.
    if (canvas.width === 0 || canvas.height === 0) _resize();
    if (canvas.width === 0 || canvas.height === 0) return; // tahta gerçekten hâlâ görünür değil, çizmeye gerek yok
    const count = Math.min(opts.count || 40, MAX_PARTICLES - _particles.length);
    if (count <= 0) return;
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color || "#FFFFFF"];
    const speed = opts.speed || 3.5;
    const spread = opts.spread ?? Math.PI * 2; // varsayılan: tam daire
    const baseAngle = opts.angle || 0;
    const gravity = opts.gravity ?? 0.12;
    const life = opts.life || 550; // ms
    const sizeRange = opts.size || [2, 5];

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const v = speed * (0.4 + Math.random() * 0.9);
      _particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        gravity,
        life, maxLife: life,
        size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        shape: opts.shape || (Math.random() < 0.5 ? "circle" : "square"),
      });
    }
    _startLoop();
  }

  // [Oturum 71 — kullanıcı isteği: "matris efektinin 4x4 olarak
  // olabilir", daha şaşırtıcı] "Matrix" tarzı gridli patlama — rastgele
  // daireler yerine DÜZENLİ bir 4x4 kare matrisinin merkezden dışarı
  // fırlaması. Sayı/matematik temalı oyuna görsel olarak daha uygun,
  // dijital/piksel hissi veriyor — normal burst()'ten kasıtlı olarak
  // FARKLI (kare parçacıklar, döngüsüz, düzenli grid diziliş).
  function burstGrid(x, y, opts = {}) {
    const canvas = _ensureCanvas();
    if (!canvas) return;
    if (canvas.width === 0 || canvas.height === 0) _resize();
    if (canvas.width === 0 || canvas.height === 0) return;
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color || "#FFFFFF"];
    const spacing = opts.spacing || 7;   // grid hücreleri arası başlangıç mesafesi (px)
    const speed   = opts.speed || 2.2;
    const life    = opts.life || 380;
    const size    = opts.size || 3;
    const gridSize = 4;
    const half = (gridSize - 1) / 2;
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const ox = (gx - half) * spacing;
        const oy = (gy - half) * spacing;
        const dist = Math.hypot(ox, oy) || 1;
        const dirX = ox / dist, dirY = oy / dist;
        _particles.push({
          x: x + ox * 0.3, y: y + oy * 0.3, // hafif merkezden başlasın, grid şekli hemen belli olsun
          vx: dirX * speed, vy: dirY * speed,
          gravity: opts.gravity ?? 0.02,
          life, maxLife: life,
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: 0, rotSpeed: 0,
          shape: "square", // "matrix" hissi için hep kare — burst()'teki karışık daire/kare değil
        });
      }
    }
    _startLoop();
  }

  // Bir hücreden (r,c) doğrudan patlama parçacığı fırlat — kolaylık sarmalayıcı.
  function burstAtCell(r, c, opts = {}) {
    const pos = cellCenter(r, c);
    if (!pos) return;
    burst(pos.x, pos.y, opts);
  }

  function _startLoop() {
    if (_rafId) return;
    let lastT = performance.now();
    const tick = (now) => {
      const dt = Math.min(32, now - lastT); // frame-time cap (sekme/donma anlarında patlamasın)
      lastT = now;
      if (!_ctx || !_canvas) { _rafId = null; return; }
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      const dtScale = dt / 16.67; // 60fps'e göre normalize
      for (let i = _particles.length - 1; i >= 0; i--) {
        const p = _particles[i];
        p.life -= dt;
        if (p.life <= 0) { _particles.splice(i, 1); continue; }
        p.x += p.vx * dtScale;
        p.y += p.vy * dtScale;
        p.vy += p.gravity * dtScale;
        p.rotation += p.rotSpeed * dtScale;
        const alpha = Math.max(0, p.life / p.maxLife);
        _ctx.save();
        _ctx.globalAlpha = alpha;
        _ctx.translate(p.x, p.y);
        _ctx.rotate(p.rotation);
        _ctx.fillStyle = p.color;
        const s = p.size * (0.5 + alpha * 0.5); // sönerken hafif küçül
        if (p.shape === "circle") {
          _ctx.beginPath();
          _ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
          _ctx.fill();
        } else {
          _ctx.fillRect(-s / 2, -s / 2, s, s);
        }
        _ctx.restore();
      }
      if (_particles.length > 0) {
        _rafId = requestAnimationFrame(tick);
      } else {
        _rafId = null;
      }
    };
    _rafId = requestAnimationFrame(tick);
  }

  function clear() {
    _particles = [];
    if (_ctx && _canvas) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function activeCount() { return _particles.length; }

  return { burst, burstGrid, burstAtCell, cellCenter, clear, activeCount };
})();
