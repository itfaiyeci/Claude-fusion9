// [Oturum 47 — Game Feel Engine v1.0] Combo Director.
// Kullanıcının verdiği eşik tablosu birebir: 3=Good, 5=Great, 8=Sweet,
// 12=Tasty, 18=Delicious, 25+=Divine. Bir hamledeki TÜM zincir
// eşleşmelerinin (outcome.chain) toplam sayısına göre tetiklenir.
const F9Combo = (() => {
  const TIERS = [
    { min: 25, label: "DİVİNE!",    color: "#FF2D9E", scale: 1.6 },
    { min: 18, label: "DELICIOUS!", color: "#FF6B35", scale: 1.45 },
    { min: 12, label: "TASTY!",     color: "#FFD700", scale: 1.3 },
    { min: 8,  label: "SWEET!",     color: "#A78BFA", scale: 1.15 },
    { min: 5,  label: "GREAT!",     color: "#4FB87A", scale: 1.05 },
    { min: 3,  label: "GOOD!",      color: "#3E8FD4", scale: 1.0 },
  ];

  function tierFor(comboCount) {
    for (const t of TIERS) if (comboCount >= t.min) return t;
    return null; // 3'ten az — tetiklenmez
  }

  function _ensureStyle() {
    if (document.getElementById("f9-combo-style")) return;
    const style = document.createElement("style");
    style.id = "f9-combo-style";
    style.textContent = `
      @keyframes f9-combo-pop {
        0%   { transform: translate(-50%,-50%) scale(0.3); opacity: 0; }
        15%  { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
        30%  { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
        75%  { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
        100% { transform: translate(-50%,-58%) scale(0.9); opacity: 0; }
      }
      .f9-combo-text {
        position: absolute; left: 50%; top: 38%; z-index: 60;
        font-weight: 900; font-family: -apple-system, sans-serif;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 20px currentColor;
        pointer-events: none; white-space: nowrap;
        animation: f9-combo-pop 900ms cubic-bezier(.2,1.4,.4,1) forwards;
      }
    `;
    document.head.appendChild(style);
  }

  function celebrate(comboCount) {
    const tier = tierFor(comboCount);
    if (!tier) return null;
    _ensureStyle();
    const container = document.getElementById("f9-board-container");
    if (!container) return tier;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    const el = document.createElement("div");
    el.className = "f9-combo-text";
    el.textContent = tier.label;
    el.style.color = tier.color;
    el.style.fontSize = (28 * tier.scale) + "px";
    container.appendChild(el);
    setTimeout(() => el.remove(), 950);
    return tier;
  }

  return { tierFor, celebrate, TIERS };
})();
