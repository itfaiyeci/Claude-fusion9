// [Oturum 15 — rules/ katmanı] Ödül/satın alma sabitleri.
// Enerji harcama mantığı economy/EnergyTracker.js + economy/energy-shop.js'de.

const MOVE_PURCHASE_OPTIONS={
  small:{cost:8, moves:1}, medium:{cost:20, moves:3},
  large:{cost:35, moves:5}, mega:{cost:60, moves:10},
};
const AREA_BOOST_EXTRA_SIZE=1;
const SUPER_BLAST_COMBO_COUNT=5;
const SUPER_BLAST_SCORE_MULTIPLIER=4;

// [Oturum 9 — Faz 2] Reklamla-devam ödül sabitleri.
// Reklam-devam ödülü level zorluğuna göre ölçekleniyor.
// Bu dosya core/game-engine.js'TEN ÖNCE yüklenmeli (sabitler orada da
// kullanılıyor — UI render fonksiyonları içinde).
const AD_CONTINUE_MOVES_RATIO=0.20;
const AD_CONTINUE_MIN_MOVES=4;
const AD_CONTINUE_MAX_MOVES=10;
const AD_CONTINUE_EXTRA_MOVES=5; // movesLimit=null (sınırsız) durumunda kullanılan eski sabit
