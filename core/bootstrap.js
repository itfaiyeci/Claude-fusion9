

// ══════════════════════════════════════════════════════
// F9_CONFIG — Merkezi Oyun Sabitleri (Single Source of Truth)
// ══════════════════════════════════════════════════════
const F9_CONFIG = {
  GRID_SIZE: 8,
  BASE_MOVES: 16,  // Tüm levellar için sabit hamle sayısı
  BASE_TARGET_SCORE: 630,
  ANIM: {
    BLAST_DURATION:  380,
    FALL_DURATION:   420,
    SPAWN_DURATION:  500,
    STAGGER:          18,
    STAGGER_LARGE:     8,
    FALLBACK_TIMEOUT: 600,
    SHOCK_RING:       500,
    NINE_GLOW:        350,
    HOURGLASS_TOTAL: 1500,
  },
  HOURGLASS: {
    DURATION_MS:  10000,
    WARN_MS:       3000,
    BLAST_SMALL:      3,
    BLAST_BIG:        8,
    POINTS_SMALL:   120,   // düzeltildi: orana getirildi
    POINTS_BIG:     300,   // düzeltildi: 630 tüm hedefi veriyordu
    ENERGY_BIG:      20,
    MIN_MOVE:      0.30,
    MAX_COUNT:        1,
  },
  WAVE: {
    BLOCKER_COST:    2,
    STRONG_COST:     4,
    STRONG_RATIO:  0.35,
    BREAK_POWER: { a:2, b:4, c:6, d:8, e:12 },
  },
  DDA: {
    DENSITY_STREAK2: 0.60, DENSITY_STREAK3: 0.15,
    TARGET_STREAK2:  0.75, TARGET_STREAK3:  0.55,
    MOVES_STREAK2:   1.20, MOVES_STREAK3:   1.40,
    RECOVERY_STEP:   0.25,
  },
  // [Oturum 24 — KULLANICI KARARI: DONDURULDU] Bu puan değerleri, ölçülmüş
  // 10.000 oyunluk üretim verisiyle (bkz. HANDOFF.md "Ölçülmüş veri" +
  // README.md Oturum 24) birlikte değerlendirilip RESMİ/kalıcı ilan
  // edildi — değiştirmeden önce kullanıcıya sor.
  POINTS: {
    BLAST_CELL: 10, BLAST_BLOCKER: 30,
    BASE: { a:90, b:150, c:240, d:360, e:500 }, // düzeltildi: sabit ~1.6x artış — DONDURULDU (Oturum 24)
  },
  ENERGY: {
    AREA_BOOST: 12, RANDOM_BLOCKER_BREAK: 10,
    FULL_TYPE_BLOCKER_BREAK: 30, SUPER_BLAST: 100,
    DIAMOND_PROMOTION: 12, LIGHTNING_LIGHTNING: 12,
  },
  SAVE_KEY: "fusion9_save_v1",
  DDA_KEY:  "f9_dda",
  DIR_KEY:  "f9_director_v1",
};

// ── Erken sabitler — F9_CONFIG'den hemen sonra tanımlanmalı ──────────
// F9Wave, F9Hint, F9Bot gibi modüller bu sabitlere ihtiyaç duyar.
// JavaScript'te const hoisting olmadığı için kullanımdan ÖNCE tanımlanmalı.

// Tahta
const GRID = F9_CONFIG.GRID_SIZE;

// Oyun dengesi
const BASE_MOVES        = F9_CONFIG.BASE_MOVES;
const BASE_TARGET_SCORE = F9_CONFIG.BASE_TARGET_SCORE;

// Puan sistemi
const BASE_POINTS          = F9_CONFIG.POINTS.BASE;
const BLAST_CELL_POINTS    = F9_CONFIG.POINTS.BLAST_CELL;
const BLAST_BLOCKER_POINTS = F9_CONFIG.POINTS.BLAST_BLOCKER;

// Baskı dalgası
const WAVE_BREAK_POWER  = F9_CONFIG.WAVE.BREAK_POWER;
const WAVE_BLOCKER_COST = F9_CONFIG.WAVE.BLOCKER_COST;
const WAVE_STRONG_COST  = F9_CONFIG.WAVE.STRONG_COST;
const WAVE_STRONG_RATIO = F9_CONFIG.WAVE.STRONG_RATIO;

// DDA
const DDA_DENSITY_STREAK2 = F9_CONFIG.DDA.DENSITY_STREAK2;
const DDA_DENSITY_STREAK3 = F9_CONFIG.DDA.DENSITY_STREAK3;
const DDA_TARGET_STREAK2  = F9_CONFIG.DDA.TARGET_STREAK2;
const DDA_TARGET_STREAK3  = F9_CONFIG.DDA.TARGET_STREAK3;
const DDA_MOVES_STREAK2   = F9_CONFIG.DDA.MOVES_STREAK2;
const DDA_MOVES_STREAK3   = F9_CONFIG.DDA.MOVES_STREAK3;
const DDA_RECOVERY_STEP   = F9_CONFIG.DDA.RECOVERY_STEP;

// Enerji
const AREA_BOOST_COST             = F9_CONFIG.ENERGY.AREA_BOOST;
const RANDOM_BLOCKER_BREAK_COST   = F9_CONFIG.ENERGY.RANDOM_BLOCKER_BREAK;
const FULL_TYPE_BLOCKER_BREAK_COST= F9_CONFIG.ENERGY.FULL_TYPE_BLOCKER_BREAK;
const SUPER_BLAST_COST            = F9_CONFIG.ENERGY.SUPER_BLAST;
const DIAMOND_PROMOTION_ENERGY    = F9_CONFIG.ENERGY.DIAMOND_PROMOTION;
const LIGHTNING_LIGHTNING_ENERGY  = F9_CONFIG.ENERGY.LIGHTNING_LIGHTNING;

// Kum saati
const HOURGLASS_DURATION_MS  = F9_CONFIG.HOURGLASS.DURATION_MS;
const HOURGLASS_WARN_MS      = F9_CONFIG.HOURGLASS.WARN_MS;
const HOURGLASS_BLAST_SMALL  = F9_CONFIG.HOURGLASS.BLAST_SMALL;
const HOURGLASS_BLAST_BIG    = F9_CONFIG.HOURGLASS.BLAST_BIG;
const HOURGLASS_POINTS_SMALL = F9_CONFIG.HOURGLASS.POINTS_SMALL;
const HOURGLASS_POINTS_BIG   = F9_CONFIG.HOURGLASS.POINTS_BIG;
const HOURGLASS_ENERGY_BIG   = F9_CONFIG.HOURGLASS.ENERGY_BIG;
const HOURGLASS_MIN_MOVE     = F9_CONFIG.HOURGLASS.MIN_MOVE;
const HOURGLASS_MAX_COUNT    = F9_CONFIG.HOURGLASS.MAX_COUNT;

// Kayıt anahtarları

// CSS animasyon sürelerini config'den besle
(function(){
  const s=document.documentElement.style;
  s.setProperty("--f9-blast-dur", F9_CONFIG.ANIM.BLAST_DURATION+"ms");
  s.setProperty("--f9-fall-dur",  F9_CONFIG.ANIM.FALL_DURATION +"ms");
  s.setProperty("--f9-spawn-dur", F9_CONFIG.ANIM.SPAWN_DURATION+"ms");
})();

(function () {
