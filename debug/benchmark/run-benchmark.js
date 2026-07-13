#!/usr/bin/env node
/**
 * Fusion 9 — Headless Benchmark Runner
 *
 * F9Bot'u gerçek oyun motoruna (GameCore) karşı, tarayıcı olmadan,
 * çok sayıda level/seed üzerinde hızlıca koşturup şu soruları cevaplar:
 *   - Level 27 çok mu zor? Level 53 geçilemez mi? Level 88 çok mu kolay?
 *
 * KULLANIM:
 *   node debug/benchmark/run-benchmark.js [startLevel] [endLevel] [runsPerLevel] [profile]
 *
 * ÖRNEK:
 *   node debug/benchmark/run-benchmark.js 1 100 5 normal
 *   → Level 1-100 arası, her level için 5 farklı seed, "normal" bot profiliyle
 *
 * ÇIKTI: Konsola özet tablo + debug/benchmark/results/<timestamp>.json
 *
 * ÖNEMLİ: Bu, refactor güvenlik ağıdır. Bir refactor'den ÖNCE ve SONRA
 * aynı parametrelerle çalıştırıp compare-benchmark.js ile karşılaştırın.
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce headless bundle'ı derleyin: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , startArg, endArg, runsArg, profileArg] = process.argv;
const START_LEVEL = parseInt(startArg || "1", 10);
const END_LEVEL = parseInt(endArg || "50", 10);
const RUNS_PER_LEVEL = parseInt(runsArg || "5", 10);
const PROFILE = profileArg || "normal";
const MAX_MOVES_SAFETY = 500; // sonsuz döngü koruması

function playOneLevel(levelNumber, seed) {
  const cfg = engine.generateLevel(levelNumber, seed);
  const gc = new engine.GameCore({
    seed,
    blockerLayout: cfg.blockerLayout,
    moves: cfg.moves,
    targetScore: cfg.targetScore,
  });
  engine.F9Bot.reseed(seed * 1000003 + levelNumber);

  let movesPlayed = 0;
  let stuckCount = 0;

  while (gc.status === "in_progress" && movesPlayed < MAX_MOVES_SAFETY) {
    const move = engine.F9Bot.pickMove(gc, PROFILE);
    if (!move) { stuckCount++; break; } // oynanabilir hamle kalmadı
    const result = engine.F9Bot.applyMove(gc, move);
    if (result === null) { stuckCount++; break; } // geçersiz hamle
    movesPlayed++;
    if (typeof gc._updateStatus === "function") gc._updateStatus();
    else if (gc.movesLeft !== undefined && gc.movesLeft <= 0 && gc.status === "in_progress") {
      gc.status = gc.score >= cfg.targetScore ? "won" : "lost";
    }
  }

  const won = gc.status === "won" || gc.score >= cfg.targetScore;
  return {
    levelNumber,
    seed,
    won,
    score: gc.score,
    target: cfg.targetScore,
    scoreRatio: cfg.targetScore > 0 ? gc.score / cfg.targetScore : null,
    movesUsed: movesPlayed,
    movesLimit: cfg.moves,
    tierName: cfg.tierName,
    stuck: stuckCount > 0,
    timedOut: movesPlayed >= MAX_MOVES_SAFETY,
  };
}

function runBenchmark() {
  const results = [];
  console.log(`\nFusion 9 Benchmark — Level ${START_LEVEL}-${END_LEVEL}, ${RUNS_PER_LEVEL} seed/level, profil: ${PROFILE}\n`);

  for (let lvl = START_LEVEL; lvl <= END_LEVEL; lvl++) {
    for (let run = 0; run < RUNS_PER_LEVEL; run++) {
      const seed = 1000 + run;
      try {
        results.push(playOneLevel(lvl, seed));
      } catch (e) {
        results.push({ levelNumber: lvl, seed, error: e.message });
      }
    }
  }

  // ── Level bazlı özet ──
  const byLevel = {};
  for (const r of results) {
    if (!byLevel[r.levelNumber]) byLevel[r.levelNumber] = [];
    byLevel[r.levelNumber].push(r);
  }

  const summary = [];
  console.log("Level | WinRate | AvgScore/Target | AvgMoves | Uyarı");
  console.log("------|---------|-----------------|----------|------");
  for (let lvl = START_LEVEL; lvl <= END_LEVEL; lvl++) {
    const rs = (byLevel[lvl] || []).filter(r => !r.error);
    const errors = (byLevel[lvl] || []).filter(r => r.error);
    if (rs.length === 0) { console.log(`${lvl} | HATA: ${errors[0]?.error}`); continue; }
    const wins = rs.filter(r => r.won).length;
    const winRate = wins / rs.length;
    const avgRatio = rs.reduce((s, r) => s + (r.scoreRatio || 0), 0) / rs.length;
    const avgMoves = rs.reduce((s, r) => s + r.movesUsed, 0) / rs.length;
    const stuckCount = rs.filter(r => r.stuck).length;
    const timedOutCount = rs.filter(r => r.timedOut).length;

    let warning = "";
    if (winRate === 0) warning = "⚠️  GEÇİLEMEZ Mİ?";
    else if (winRate < 0.2) warning = "⚠️  ÇOK ZOR";
    else if (winRate > 0.95) warning = "⚠️  ÇOK KOLAY";
    if (stuckCount > 0) warning += ` (${stuckCount} kilitlendi)`;
    if (timedOutCount > 0) warning += ` (${timedOutCount} sonsuz döngü riski)`;

    console.log(`${String(lvl).padEnd(5)} | ${(winRate*100).toFixed(0).padStart(6)}% | ${avgRatio.toFixed(2).padStart(15)} | ${avgMoves.toFixed(1).padStart(8)} | ${warning}`);

    summary.push({ levelNumber: lvl, winRate, avgScoreRatio: avgRatio, avgMoves, stuckCount, timedOutCount, sampleSize: rs.length });
  }

  // ── Dosyaya kaydet ──
  const resultsDir = path.join(__dirname, "results");
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(resultsDir, `benchmark-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    params: { startLevel: START_LEVEL, endLevel: END_LEVEL, runsPerLevel: RUNS_PER_LEVEL, profile: PROFILE },
    summary,
    rawResults: results,
  }, null, 2));

  console.log(`\n✓ Detaylı sonuç kaydedildi: ${outPath}`);
  console.log(`  Karşılaştırma için: node debug/benchmark/compare-benchmark.js <eski.json> ${outPath}`);
}

runBenchmark();
