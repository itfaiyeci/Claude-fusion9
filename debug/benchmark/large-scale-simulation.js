#!/usr/bin/env node
/**
 * Fusion 9 — Büyük Ölçekli F9Bot Simülasyonu
 *
 * run-benchmark.js'ten farkı: level-aralığı bazlı değil, TOPLAM oyun
 * sayısı bazlı çalışır ve kademe (bakır/bronz/gümüş/altın/elmas/Matrix)
 * ÜRETİM ORANLARINI da ölçer — "Evolution tablosunu kesinleştirmek"
 * için gereken temel veri.
 *
 * KULLANIM:
 *   node debug/benchmark/large-scale-simulation.js [oyunSayısı] [minLevel] [maxLevel] [profil]
 *
 * ÖRNEK:
 *   node debug/benchmark/large-scale-simulation.js 1000 1 100 pro
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , gamesArg, minLvlArg, maxLvlArg, profileArg] = process.argv;
const N_GAMES = parseInt(gamesArg || "1000", 10);
const MIN_LEVEL = parseInt(minLvlArg || "1", 10);
const MAX_LEVEL = parseInt(maxLvlArg || "100", 10);
const PROFILE = profileArg || "pro";
const MAX_MOVES_SAFETY = 500;

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
  console.log(`\nFusion 9 — Büyük Ölçekli Simülasyon: ${N_GAMES} oyun, level ${MIN_LEVEL}-${MAX_LEVEL}, profil: ${PROFILE}\n`);
  const startTime = Date.now();

  let wins = 0, totalScore = 0, totalMoves = 0, totalScoreRatio = 0;
  const tierTotals = { bakir: 0, bronz: 0, gumus: 0, altin: 0, elmas: 0 };
  let matrixTotal = 0;

  for (let i = 0; i < N_GAMES; i++) {
    const levelNumber = MIN_LEVEL + Math.floor(Math.random() * (MAX_LEVEL - MIN_LEVEL + 1));
    const seed = 1000 + i;
    const r = playOneGame(levelNumber, seed);
    if (r.won) wins++;
    totalScore += r.score;
    totalMoves += r.movesUsed;
    totalScoreRatio += r.target > 0 ? r.score / r.target : 0;
    for (const tier of Object.keys(tierTotals)) tierTotals[tier] += r.giftTierCounts[tier] || 0;
    matrixTotal += r.matrixMatchCount;

    if ((i + 1) % Math.max(1, Math.floor(N_GAMES / 10)) === 0) {
      process.stdout.write(`  ${i + 1}/${N_GAMES} oyun tamamlandı...\r`);
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n=== SONUÇLAR (${N_GAMES} oyun, ${elapsedSec}sn) ===\n`);
  console.log(`Kazanma oranı:        ${(wins / N_GAMES * 100).toFixed(1)}%`);
  console.log(`Ortalama skor:        ${(totalScore / N_GAMES).toFixed(0)}`);
  console.log(`Ortalama skor/hedef:  ${(totalScoreRatio / N_GAMES).toFixed(2)}`);
  console.log(`Ortalama hamle:       ${(totalMoves / N_GAMES).toFixed(1)}`);
  console.log(`\n=== KADEME ÜRETİM ORANLARI (oyun başına ortalama) ===\n`);
  for (const tier of ["bakir", "bronz", "gumus", "altin", "elmas"]) {
    console.log(`${tier.padEnd(8)}: ${(tierTotals[tier] / N_GAMES).toFixed(3)} adet/oyun  (toplam: ${tierTotals[tier]})`);
  }
  console.log(`${"matrix".padEnd(8)}: ${(matrixTotal / N_GAMES).toFixed(3)} adet/oyun  (toplam: ${matrixTotal})`);

  // Kademe piramidini oran olarak göster (bakır=1x referans)
  console.log(`\n=== KADEME PİRAMİDİ (bakır'a göre nadir olma oranı) ===\n`);
  const bakirRate = tierTotals.bakir / N_GAMES;
  for (const tier of ["bakir", "bronz", "gumus", "altin", "elmas"]) {
    const rate = tierTotals[tier] / N_GAMES;
    const ratio = bakirRate > 0 ? (bakirRate / Math.max(rate, 0.0001)).toFixed(1) : "N/A";
    console.log(`${tier.padEnd(8)}: bakır'dan ${ratio}x daha nadir`);
  }

  const outDir = path.join(__dirname, "results");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `large-scale-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    params: { N_GAMES, MIN_LEVEL, MAX_LEVEL, PROFILE },
    winRate: wins / N_GAMES,
    avgScore: totalScore / N_GAMES,
    avgScoreRatio: totalScoreRatio / N_GAMES,
    avgMoves: totalMoves / N_GAMES,
    tierTotals, matrixTotal,
  }, null, 2));
  console.log(`\n✓ Kaydedildi: ${outPath}`);
}

run();
