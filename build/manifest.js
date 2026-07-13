// [Oturum 15 — mimari iyileştirme] TEK doğruluk kaynağı: hem üretim
// build'i (build/build.js) hem headless benchmark (debug/benchmark/
// build-headless-engine.js) bu listeyi kullanır. Önceden dosya listesi
// İKİ yerde elle tutuluyordu — bu, sık senkronizasyon hatalarına yol
// açıyordu (bkz. README.md Oturum 10, Oturum 15 notları). Artık TEK yer.
//
// Sıra ÖNEMLİ — bazı dosyalar başkalarının üst-seviye sabitlerine/
// sınıflarına ihtiyaç duyuyor (bkz. her dosyanın kendi yorumu).
module.exports = [
  "core/bootstrap.js",
  "core/event-bus.js", // [Oturum 52] Event Bus — bağımlılığı yok, en erken yüklenmeli
  "rules/waveRules.js",
  "rules/scoringRules.js",
  "rules/hourglassRules.js",
  "debug/debug.js",
  "features/wave/wave-system.js",
  "features/hint/hint-system.js",
  "features/dda/churn-system.js",
  "debug/analytics.js",
  "features/dda/opportunity-analysis.js",
  "debug/bot.js",
  "debug/director.js",
  "fx/blast-fx.js",
  "features/hourglass/hourglass-system.js",
  "core/debug-init-guard.js",
  "engine/rng.js",
  "fx/assets.js",
  "rules/blockerRules.js",
  "content/blockers/chapter-blocker-pools.js",
  "content/worlds/world-metadata.js",
  "content/levels/chapter-database.js",
  "content/rewards/milestones.js",
  "rules/evolutionRules.js",
  "engine/evolutionEngine.js",
  "rules/elementRules.js",
  "engine/elementEngine.js",
  "rules/matchRules.js",
  "engine/matchEngine.js",
  "features/dda/dda-state.js",
  "rules/rewardRules.js",
  "features/league/leaderboard-data.js",
  "core/Board.js",
  "features/blockers/level-blocker-layout.js",
  "economy/EnergyTracker.js",
  "core/GameCore.js",
  "save/save-manager.js",
  "fx/audio.js",
  // [Oturum 47 — Game Feel Engine v1.0] Yeni fx/ modülleri — state
  // tanımlı olduğu için (core/GameCore.js sonrası) burada, ui/
  // dosyalarından ÖNCE (onlar DOM'u kurar, fx modülleri sadece
  // fonksiyon tanımlar, henüz çağrılmazlar).
  "fx/camera.js",
  "fx/particles.js",
  "fx/combo.js",
  "fx/juice.js",
  "fx/game-feel.js", // diğer TÜM fx modüllerine bağımlı — en son
  "ui/screens.js",
  "ui/renderer.js",
  "economy/energy-shop.js", // GameCore.prototype mixin — GameCore.js SONRASI ama game-engine.js'in kapanış IIFE'sinden ÖNCE olmalı
  // [Oturum 22 — flow/ katmanı ayrımı] handleCellClick/executeMove/
  // checkAndTransition/newLevel core/game-engine.js'ten buraya taşındı
  // (bkz. HANDOFF.md). Ortak IIFE içinde (bootstrap.js açıyor,
  // game-engine.js kapatıyor) game-engine.js'ten ÖNCE yüklenmeleri
  // yeterli — game-engine.js'in geri kalanı bunları çağırıyor.
  "flow/levelFlow.js",
  "flow/moveFlow.js",
  "flow/rewardFlow.js",
  "flow/transitionFlow.js",
  "core/game-engine.js", // ⚠️ Devam eden bölümlendirme — bkz. README.md; headless benchmark bu dosyanın SADECE saf-motor kısmını kullanır (bkz. build-headless-engine.js PURE_ENGINE_END_LINE)
];
