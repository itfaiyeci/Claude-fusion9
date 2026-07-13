// [Oturum 15 — rules/ katmanı] Kum saati zamanlama/patlama sabitleri.

// ─── KUM SAATİ SİSTEMİ ─────────────────────────────────────────
const HOURGLASS_DURATION_MS  = F9_CONFIG.HOURGLASS.DURATION_MS;     // 10 sn normal süre
const HOURGLASS_WARN_MS      = F9_CONFIG.HOURGLASS.WARN_MS;      // son 3 sn uyarı
const HOURGLASS_BLAST_SMALL  = F9_CONFIG.HOURGLASS.BLAST_SMALL;         // süre bitince 3×3 (yarıçap 1)
const HOURGLASS_BLAST_BIG    = F9_CONFIG.HOURGLASS.BLAST_BIG;         // +9 eşleşince tüm 8×8
const HOURGLASS_ENERGY_BIG   = F9_CONFIG.HOURGLASS.ENERGY_BIG;        // +9 eşleşince enerji
const HOURGLASS_MAX_COUNT    = F9_CONFIG.HOURGLASS.MAX_COUNT;         // aynı anda max 1 kum saati
const DIFF_DURATION = {                  // zorluk bazlı süre
  kolay:15000, orta:10000, zor:7000, uzman:5000, pro:3000
};
