#!/usr/bin/env node
/**
 * Fusion 9 — Bake Pipeline
 *
 * generateLevel()'ı SABİT bir referans seed ile çalıştırıp, level 1-100
 * için "dondurulmuş" (baked) statik veri üretir. content/levels/ altına
 * yazar. Amaç: motorun "Level 37 hesapla" yerine "content/levels/37
 * verisini yükle" diyebilmesi (kullanıcının orijinal hedefi).
 *
 * ⚠️ ÖNEMLİ: Bu, generateLevel()'ın YERİNE geçmiyor — onu bir kere
 * çalıştırıp çıktısını dosyaya yazan bir BUILD ARACI. generateLevel()
 * hâlâ tek yetkili kaynak (kullanıcı kararı) — bu pipeline sadece onun
 * çıktısını, level 101+ için hâlâ çalışan prosedürel üretime dokunmadan,
 * ilk 100 level için önceden hesaplayıp saklıyor (performans + test
 * edilebilirlik için — bkz. README.md).
 *
 * SABİT SEED: Level 1-100 için hep AYNI seed (REFERENCE_SEED) kullanılır
 * — bu, "test edilebilir" olmasını sağlar (F9Bot ile tekrar tekrar aynı
 * tahtayı test edebiliriz) ve gerçek oyunda oyuncuya göre farklı seed
 * kullanılmasını ENGELLEMEZ (bkz. aşağıdaki "runtime davranışı" notu).
 *
 * KULLANIM: node content/levels/bake-pipeline.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BUNDLE_PATH = path.join(ROOT, "debug/benchmark/.headless-bundle.js");
const OUT_PATH = path.join(__dirname, "baked-levels-1-100.js");

const REFERENCE_SEED = 1; // Level 1-100 için sabit referans seed
const LEVEL_COUNT = 100;

if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

function bake() {
  const baked = {};
  const perLevelDir = path.join(__dirname, "baked");
  if (!fs.existsSync(perLevelDir)) fs.mkdirSync(perLevelDir, { recursive: true });

  for (let lvl = 1; lvl <= LEVEL_COUNT; lvl++) {
    const cfg = engine.generateLevel(lvl, REFERENCE_SEED);
    const levelData = {
      level: lvl,
      moves: cfg.moves,
      targetScore: cfg.targetScore,
      pattern: cfg.pattern,
      density: Math.round(cfg.blockerDensity * 100) / 100,
      tierName: cfg.tierName,
      isBreathe: cfg.isBreathe,
      milestone: cfg.milestone,
      blockerCells: cfg.blockerLayout.placements ? cfg.blockerLayout.placements.length : 0,
    };
    baked[lvl] = levelData;

    // [YENİ — Oturum 22, kullanıcı isteği] level001.json ... level100.json
    // formatında AYRI dosyalar da yazılıyor (gerçek JSON, .js değil —
    // ileride fetch()-bazlı bir yükleme sistemine geçilirse hazır olsun).
    const paddedNum = String(lvl).padStart(3, "0");
    fs.writeFileSync(
      path.join(perLevelDir, `level${paddedNum}.json`),
      JSON.stringify(levelData, null, 2),
      "utf-8"
    );
  }
  console.log(`✓ ${LEVEL_COUNT} adet level001.json..level100.json yazıldı: ${perLevelDir}`);

const header = `// [Oturum 20 — Bake Pipeline] Level 1-100 için DONDURULMUŞ referans veri.
// content/levels/bake-pipeline.js tarafından ÜRETİLDİ — elle DÜZENLEMEYİN,
// yeniden üretmek için: node content/levels/bake-pipeline.js
//
// Referans seed: ${REFERENCE_SEED}
// Üretim tarihi: ${new Date().toISOString()}
//
// ✅ ÇÖZÜLDÜ (Oturum 43, kullanıcı kararı): Oyun artık GERÇEKTEN bu
// referans seed'i ("BAKED_REFERENCE_SEED", flow/levelFlow.js'te aynı
// değer=${REFERENCE_SEED}) level 1-100 için KULLANIYOR — her oyuncu
// birebir aynı blocker yerleşimini VE sayı dizilimini görüyor. Bu
// dosya (JSON çıktıları dahil) hâlâ SADECE referans/analiz amaçlı —
// runtime bunu OKUMUYOR, generateLevel()'ın (seed,levelNumber) saf
// fonksiyonu olması sayesinde AYNI hesaplamayı kendi kendine tekrar
// üretiyor (bkz. flow/levelFlow.js newLevel()).
const BAKED_LEVELS_1_100 = ${JSON.stringify(baked, null, 2)};
`;

  fs.writeFileSync(OUT_PATH, header, "utf-8");
  console.log(`✓ ${LEVEL_COUNT} level donduruldu: ${OUT_PATH}`);

  const targets = Object.values(baked).map(l => l.targetScore);
  const moves = Object.values(baked).map(l => l.moves);
  console.log(`  targetScore aralığı: ${Math.min(...targets)} - ${Math.max(...targets)}`);
  console.log(`  moves aralığı: ${Math.min(...moves)} - ${Math.max(...moves)}`);
}

bake();
