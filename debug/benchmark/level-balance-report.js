#!/usr/bin/env node
/**
 * Fusion 9 — Level-Bazlı F9Bot Denge Raporu
 *
 * run-benchmark.js'ten farkı: kademe (bakır/bronz/gümüş/altın/elmas)
 * üretimini de LEVEL BAZINDA raporluyor (large-scale-simulation.js
 * sadece toplam/ortalama veriyordu, level kırılımı yoktu).
 *
 * KULLANIM:
 *   node debug/benchmark/level-balance-report.js [oyunSayısı/level] [profil]
 *
 * ÖRNEK:
 *   node debug/benchmark/level-balance-report.js 100 pro
 *   → Level 1-100, her biri için 100 oyun (toplam 10.000 oyun)
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , gamesPerLevelArg, profileArg] = process.argv;
const GAMES_PER_LEVEL = parseInt(gamesPerLevelArg || "100", 10);
const PROFILE = profileArg || "pro";
const MAX_MOVES_SAFETY = 500;
const LEVEL_COUNT = 100;

function playOneGame(levelNumber, seed) {
  const cfg = engine.generateLevel(levelNumber, seed);
  const gc = new engine.GameCore({
    seed, blockerLayout: cfg.blockerLayout, moves: cfg.moves, targetScore: cfg.targetScore,
  });
  engine.F9Bot.reseed(seed * 1000003 + levelNumber);

  let movesPlayed = 0;
  while (gc.status === "in_progress" && movesPlayed < MAX_MOVES_SAFETY) {
    const move = engine.F9Bot.pickMove(gc, PROFILE);
    if (!move) break;
    const result = engine.F9Bot.applyMove(gc, move);
    if (result === null) break;
    movesPlayed++;
  }

  const won = gc.status === "won" || gc.score >= cfg.targetScore;
  return {
    won, score: gc.score, target: cfg.targetScore, movesUsed: movesPlayed,
    giftTierCounts: gc.giftTierCounts, matrixMatchCount: gc.matrixMatchCount,
  };
}

function run() {
  console.log(`\nFusion 9 — Level-Bazlı Denge Raporu: level 1-${LEVEL_COUNT}, ${GAMES_PER_LEVEL} oyun/level, profil: ${PROFILE}`);
  console.log(`Toplam ${LEVEL_COUNT * GAMES_PER_LEVEL} oyun...\n`);
  const startTime = Date.now();

  const report = [];
  console.log("Lvl | Win% | AvgScore | Score/Target | AvgMoves | Bakır | Bronz | Gümüş | Altın | Elmas | Matrix");
  console.log("----|------|----------|--------------|----------|-------|-------|-------|-------|-------|-------");

  for (let lvl = 1; lvl <= LEVEL_COUNT; lvl++) {
    let wins = 0, totalScore = 0, totalMoves = 0, totalRatio = 0;
    const tiers = { bakir: 0, bronz: 0, gumus: 0, altin: 0, elmas: 0 };
    let matrix = 0;

    for (let g = 0; g < GAMES_PER_LEVEL; g++) {
      const seed = 1000 + g;
      const r = playOneGame(lvl, seed);
      if (r.won) wins++;
      totalScore += r.score;
      totalMoves += r.movesUsed;
      totalRatio += r.target > 0 ? r.score / r.target : 0;
      for (const t of Object.keys(tiers)) tiers[t] += r.giftTierCounts[t] || 0;
      matrix += r.matrixMatchCount;
    }

    const row = {
      level: lvl,
      winRate: wins / GAMES_PER_LEVEL,
      avgScore: totalScore / GAMES_PER_LEVEL,
      avgScoreRatio: totalRatio / GAMES_PER_LEVEL,
      avgMoves: totalMoves / GAMES_PER_LEVEL,
      bakir: tiers.bakir / GAMES_PER_LEVEL,
      bronz: tiers.bronz / GAMES_PER_LEVEL,
      gumus: tiers.gumus / GAMES_PER_LEVEL,
      altin: tiers.altin / GAMES_PER_LEVEL,
      elmas: tiers.elmas / GAMES_PER_LEVEL,
      matrix: matrix / GAMES_PER_LEVEL,
    };
    report.push(row);

    console.log(
      `${String(lvl).padEnd(3)} | ${(row.winRate*100).toFixed(0).padStart(4)}% | ` +
      `${row.avgScore.toFixed(0).padStart(8)} | ${row.avgScoreRatio.toFixed(2).padStart(12)} | ` +
      `${row.avgMoves.toFixed(1).padStart(8)} | ${row.bakir.toFixed(2).padStart(5)} | ` +
      `${row.bronz.toFixed(2).padStart(5)} | ${row.gumus.toFixed(2).padStart(5)} | ` +
      `${row.altin.toFixed(2).padStart(5)} | ${row.elmas.toFixed(2).padStart(5)} | ${row.matrix.toFixed(3).padStart(5)}`
    );
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Tamamlandı: ${LEVEL_COUNT * GAMES_PER_LEVEL} oyun, ${elapsedSec}sn\n`);

  // Genel özet
  const avg = (key) => report.reduce((s, r) => s + r[key], 0) / report.length;
  console.log("=== GENEL ÖZET (100 level ortalaması) ===");
  console.log(`Ortalama kazanma oranı: ${(avg("winRate")*100).toFixed(1)}%`);
  console.log(`Ortalama skor/hedef:    ${avg("avgScoreRatio").toFixed(2)}`);
  console.log(`Ortalama hamle:         ${avg("avgMoves").toFixed(1)}`);
  console.log(`Bakır/oyun:  ${avg("bakir").toFixed(3)}`);
  console.log(`Bronz/oyun:  ${avg("bronz").toFixed(3)}`);
  console.log(`Gümüş/oyun:  ${avg("gumus").toFixed(3)}`);
  console.log(`Altın/oyun:  ${avg("altin").toFixed(3)}`);
  console.log(`Elmas/oyun:  ${avg("elmas").toFixed(3)}`);
  console.log(`Matrix/oyun: ${avg("matrix").toFixed(3)}`);

  // Sorunlu leveller
  const impossible = report.filter(r => r.winRate === 0);
  const tooEasy = report.filter(r => r.winRate >= 0.9);
  console.log(`\nGeçilemez (%0) level sayısı: ${impossible.length} → ${impossible.map(r=>r.level).join(",")}`);
  console.log(`Çok kolay (%90+) level sayısı: ${tooEasy.length} → ${tooEasy.map(r=>r.level).join(",")}`);

  const outDir = path.join(__dirname, "results");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `level-balance-report-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ params: { GAMES_PER_LEVEL, PROFILE }, report }, null, 2));
  console.log(`\n✓ Tam rapor kaydedildi: ${outPath}`);
}

run();
