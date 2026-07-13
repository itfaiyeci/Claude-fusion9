// [Oturum 22 — flow/ katmanı ayrımı] Level başlangıç akışı.
// core/game-engine.js'ten TAŞINDI (bkz. HANDOFF.md "Flow Katmanı Eksik").
// Bu dosya, GameCore.js'in oluşturduğu `state`/`GameCore`/`generateLevel`
// gibi üst-seviye tanımlara bağımlı — core/bootstrap.js'in açtığı ve
// core/game-engine.js'in kapattığı ORTAK IIFE içinde yüklendiği için
// (bkz. build/manifest.js sırası) bu tanımlara doğrudan erişebiliyor.
// SORUMLULUK: bir level'a "giriş" — generateLevel() çağrısı, DDA
// ayarlaması, hedef (goal) senkronizasyonu, tüp/enerji tüketimi,
// GameCore örneğinin kurulması. Hamle işleme (flow/moveFlow.js),
// ödül/animasyon (flow/rewardFlow.js) ve level SONU geçişleri
// (flow/transitionFlow.js) başka dosyalarda.

// [Oturum 43 — KULLANICI KARARI: level 1-100 TÜM oyuncularda BİREBİR
// AYNI olmalı (blocker yerleşimi + sayı dizilimi dahil) — "standart
// match-3 tasarımı, level dengesi/liderlik tablosu için gerekli."
// content/levels/bake-pipeline.js'in kullandığı AYNI referans seed —
// generateLevel() zaten (seed,levelNumber)'in SAF/deterministik bir
// fonksiyonu olduğu için (bkz. combinedSeed=(seed*1000003+levelNumber)
// makeRng() içinde), sabit bir seed kullanmak tek başına yeterli —
// baked JSON dosyalarını runtime'da AYRICA okumaya gerek YOK, aynı
// hesaplama otomatik olarak aynı sonucu üretiyor. Level 101+ hâlâ
// state.seed (oyuncuya özel) kullanıyor — bake pipeline SADECE 1-100'ü
// kapsıyor, kullanıcı kararı bunun ötesine geçmedi.
// NOT: DDA (dinamik zorluk) hâlâ bu sabit taban ÜZERİNE uygulanıyor —
// bu SADECE ham level üretimini (blocker/sayı) sabitliyor, kayıp
// serisine göre hedef/yoğunluk ince ayarı (dda.losses) DOKUNULMADAN
// devam ediyor. Bu ayrı bir karar gerektirirse kullanıcıya sorulmalı.
const BAKED_REFERENCE_SEED = 1;

function newLevel(levelNumber) {
  F9Debug.log("game", `newLevel(${levelNumber}) başlatıldı`);
  state.screen = "level_start";
  // Bekleyen tüm animasyon timeout'larını iptal et
  (state._animTimeouts||[]).forEach(id => clearTimeout(id));
  state._animTimeouts = [];
  // Önceki level puanını lig'e ekle
  if (state.gc && state.gc.score > 0) {
    const TIER_ICONS = {bronz:'🥉',gumus:'🥈',altin:'🥇',elmas:'💎',sampiyonluk:'🏆'};
  const tierIcon = TIER_ICONS[state.league?.tier||'bronz'] || '🥉';
  const me = LEAGUE_BOARD.find(e => e.isMe);
    if (me) {
      if (state.gc) me.score += state.gc.score;
      LEAGUE_BOARD.sort((a,b) => b.score - a.score);
    }
  }
  // [Oturum 43] 1-100 arası: SABİT referans seed (herkeste aynı level).
  // 101+: oyuncuya özel state.seed (eskisi gibi, prosedürel çeşitlilik).
  const genSeed = levelNumber <= 100 ? BAKED_REFERENCE_SEED : state.seed;
  const cfg = generateLevel(levelNumber, genSeed);
  // generateLevel'in moves ve targetScore değerlerini kullan
  // DDA: sadece targetScore ve blockerDensity'yi ayarla
  if (dda.losses >= 2) {
    cfg.targetScore = Math.max(315, Math.round(cfg.targetScore * dda.targetMult));
    if (cfg.blockerDensity !== undefined) cfg.blockerDensity = Math.max(0, cfg.blockerDensity * dda.densityMult);
  }
  F9Debug.log("game", `newLevel cfg: moves=${cfg.moves} target=${cfg.targetScore} density=${cfg.blockerDensity?.toFixed(2)}`);

  // [Oturum 26 — SIRALAMA DÜZELTMESİ, motor sağlamlık denetimi] Tüp
  // kontrolü artık state.levelGoal/state.cfg'yi güncellemeden ÖNCE
  // yapılıyor. ESKİDEN bu kontrol daha SONRAYDI: tüp yoksa
  // showNoTubesModal() çağrılıp fonksiyon erken dönüyordu ama
  // state.levelGoal/state.cfg ZATEN yeni levele göre güncellenmiş
  // oluyordu — state.gc ise (tüp yoksa hiç oluşturulmadığı için)
  // ESKİ levelin GameCore'u olarak kalıyordu. Yani tüpler tam bu anda
  // biterse state.levelGoal/cfg (yeni level) ile state.gc (eski level)
  // ANLIK olarak birbirinden AYRIŞIYORDU — nadir ama gerçek bir
  // tutarsızlık penceresi (bkz. README.md Oturum 26, test ile bulundu).
  refillTubes();
  F9Debug.log("game", `newLevel tubes: ${state.tubes}/${state.maxTubes}`);
  if (state.tubes <= 0) {
    showNoTubesModal();
    return;
  }

  const _lvGoal = getLevelGoal(levelNumber);
  // [DÜZELTME — Oturum 18, kullanıcı kararı: "generateLevel tek yetkili
  // kaynak"] ESKİDEN burada cfg.targetScore, CHAPTER_DB'nin (senkron
  // olmayan) sabit değeriyle EZİLİYORDU — bu "duality" hatasının tam
  // kök nedeniydi (örn. level 1: CHAPTER_DB 630 istiyordu, generateLevel
  // 441 üretiyordu, oyuncu 441'i oynuyordu ama UI'da 630 görüyordu).
  // Artık TERSİ: CHAPTER_DB sadece goal TİPİNİ belirler (score/create9/
  // giftCount/breakBlockers); "score" tipinde DEĞER her zaman
  // generateLevel()'ın gerçek targetScore'undan senkronize edilir.
  if (_lvGoal.goal.type === "score") _lvGoal.goal.value = cfg.targetScore;
  state.levelGoal = _lvGoal.goal;
  state.goalProgress = 0;
  state.cfg = cfg;

  state.tubes--;
  if (state.tubes < state.maxTubes && !state.lastTubeTime) state.lastTubeTime = Date.now();
  saveGame();
  clearAllHourglassTimers();
  const gc = new GameCore({ seed: genSeed * 97 + levelNumber, blockerLayout: cfg.blockerLayout, moves: cfg.moves, targetScore: cfg.targetScore, energyTracker: state.energyTracker });
  state.cfg = cfg;
  state.gc = gc;
  state.levelNumber = levelNumber;
  state.selected = null;
  saveGame(); // localStorage kaydet
  state.pendingOptions = null;
  state.message = "";
  state.glowCells = new Map();
  state.blastFlashCells = new Set();
  state.brokenBlockerFlash = new Set();
  render();
  // [Oturum 52 — Event Bus] render()'DAN SONRA çağrılıyor — ÖNCE
  // çağrılsaydı board container henüz DOM'da olmazdı, F9Juice.init()
  // "container yok" diyip ERKEN ÇIKAR ve bir daha ASLA gerçek kurulum
  // yapmazdı (idempotent guard'ı erken tüketilirdi — bkz. Oturum 48'in
  // aynı sınıftan riskiyle ilgili notu, fx/juice.js). Dinleyiciler
  // kayıtlı olduktan SONRA LevelStarted emit ediliyor ki kaybolmasın.
  if (typeof F9GameFeel !== "undefined") F9GameFeel.init();
  if (typeof F9Events !== "undefined") F9Events.emit("LevelStarted", { levelNumber, targetScore: cfg.targetScore, moves: cfg.moves });
}
