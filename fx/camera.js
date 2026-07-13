// [Oturum 47 — Game Feel Engine v1.0] Kamera sarsıntısı.
// Candy Crush'ın "hiç fark edilmeyen ama sürekli çalışan" tekniği —
// patlama büyüklüğüne göre ekran hafifçe sallanır. Oyuncu bunu
// GÖRMÜYOR ama HİSSEDİYOR. Kullanıcının verdiği referans değerler:
// 3'lü=0px, 4'lü=1px, 5'li=2px, 7'li=5px, Diamond/Matrix=8px.
const F9Camera = (() => {
  let _target = null;
  let _rafId = null;
  let _startTime = 0;
  let _duration = 0;
  let _magnitude = 0;
  let _baseTransform = "";

  function _getTarget() {
    if (_target && document.body.contains(_target)) return _target;
    _target = document.getElementById("f9-board-container") || document.querySelector(".f9-board-container");
    return _target;
  }

  // Hücre sayısına göre şiddet — kullanıcının verdiği tabloyla birebir.
  function magnitudeForCellCount(n) {
    if (n >= 9) return 8;      // Diamond / Matrix Eşleşme
    if (n >= 7) return 5;      // 7'li
    if (n >= 6) return 3.5;    // 6'lı (5 ile 7 arası kademeli)
    if (n >= 5) return 2;      // 5'li
    if (n >= 4) return 1;      // 4'lü
    return 0;                  // 3'lü — sarsıntı yok
  }

  function shake(magnitudePx, durationMs = 260) {
    if (!magnitudePx || magnitudePx <= 0) return;
    const el = _getTarget();
    if (!el) return;
    _magnitude = Math.max(_magnitude, magnitudePx); // üst üste binen sarsıntılarda en büyüğü kazansın
    _duration = Math.max(_duration, durationMs);
    _startTime = _startTime || performance.now();
    if (_rafId) return; // zaten sallanıyor, yeni döngü açma
    _baseTransform = el.style.transform || "";
    _startTime = performance.now();
    const tick = (now) => {
      const el2 = _getTarget();
      if (!el2) { _rafId = null; return; }
      const elapsed = now - _startTime;
      const t = Math.min(1, elapsed / _duration);
      if (t >= 1) {
        el2.style.transform = _baseTransform;
        _rafId = null; _magnitude = 0; _duration = 0;
        return;
      }
      // Sönümlü rastgele sarsıntı (ease-out, exponential decay)
      const decay = Math.pow(1 - t, 2);
      const dx = (Math.random() * 2 - 1) * _magnitude * decay;
      const dy = (Math.random() * 2 - 1) * _magnitude * decay;
      el2.style.transform = `${_baseTransform} translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      _rafId = requestAnimationFrame(tick);
    };
    _rafId = requestAnimationFrame(tick);
  }

  function shakeForMatch(cellCount) { shake(magnitudeForCellCount(cellCount)); }

  function stop() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    const el = _getTarget();
    if (el) el.style.transform = _baseTransform;
    _magnitude = 0; _duration = 0;
  }

  return { shake, shakeForMatch, magnitudeForCellCount, stop };
})();
