// [Oturum 15 — rules/ katmanı] Baskı dalgası sabitleri.

// ── BASKI DALGASI SABİTLERİ ──────────────────────────────
// Her WAVE_INTERVAL hamlede bir alt satır yukarı kayar
// Eşleşme büyüklüğüne göre kırma gücü birikir
const WAVE_BREAK_POWER = F9_CONFIG.WAVE.BREAK_POWER; // grup → kırma gücü
const WAVE_BLOCKER_COST = F9_CONFIG.WAVE.BLOCKER_COST;        // normal engel kırmak için gereken güç
const WAVE_STRONG_COST  = F9_CONFIG.WAVE.STRONG_COST;        // güçlü engel için (önce normale iner)
const WAVE_STRONG_RATIO = F9_CONFIG.WAVE.STRONG_RATIO;     // yeni satırda güçlü engel oranı
