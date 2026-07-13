#!/usr/bin/env node
/**
 * Fusion 9 — Benchmark Karşılaştırma Aracı
 *
 * KULLANIM:
 *   node debug/benchmark/compare-benchmark.js <once.json> <sonra.json>
 *
 * Bir refactor'den ÖNCE ve SONRA aynı parametrelerle (aynı level aralığı,
 * aynı seed sayısı, aynı profil) alınan iki benchmark sonucunu karşılaştırır.
 * Amaç: "Bu refactor oyunun davranışını değiştirdi mi?" sorusuna kanıt vermek.
 *
 * ÇIKIŞ KODU: 0 = fark yok/önemsiz, 1 = anlamlı fark var (refactor şüpheli)
 */
const fs = require("fs");

const [, , beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.error("Kullanım: node compare-benchmark.js <once.json> <sonra.json>");
  process.exit(2);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf-8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf-8"));

if (JSON.stringify(before.params) !== JSON.stringify(after.params)) {
  console.warn("⚠️  UYARI: İki koşunun parametreleri farklı — karşılaştırma güvenilir olmayabilir.");
  console.warn("  Önce:", before.params);
  console.warn("  Sonra:", after.params);
}

const beforeByLevel = Object.fromEntries(before.summary.map(s => [s.levelNumber, s]));
const afterByLevel = Object.fromEntries(after.summary.map(s => [s.levelNumber, s]));

const WIN_RATE_THRESHOLD = 0.15; // %15'ten fazla değişim = anlamlı
const SCORE_RATIO_THRESHOLD = 0.15;

let significantDiffs = 0;
console.log("\nLevel | WinRate (önce→sonra) | ScoreRatio (önce→sonra) | Durum");
console.log("------|----------------------|--------------------------|------");

const allLevels = [...new Set([...Object.keys(beforeByLevel), ...Object.keys(afterByLevel)])]
  .map(Number).sort((a, b) => a - b);

for (const lvl of allLevels) {
  const b = beforeByLevel[lvl];
  const a = afterByLevel[lvl];
  if (!b || !a) {
    console.log(`${lvl} | EKSİK VERİ (biri diğerinde yok)`);
    significantDiffs++;
    continue;
  }
  const winDiff = Math.abs(a.winRate - b.winRate);
  const scoreDiff = Math.abs(a.avgScoreRatio - b.avgScoreRatio);
  const flagged = winDiff > WIN_RATE_THRESHOLD || scoreDiff > SCORE_RATIO_THRESHOLD;
  if (flagged) significantDiffs++;

  const status = flagged ? "🔴 FARK VAR" : "✓ aynı";
  console.log(
    `${String(lvl).padEnd(5)} | ${(b.winRate*100).toFixed(0)}%→${(a.winRate*100).toFixed(0)}%`.padEnd(22) +
    ` | ${b.avgScoreRatio.toFixed(2)}→${a.avgScoreRatio.toFixed(2)}`.padEnd(26) +
    ` | ${status}`
  );
}

console.log(`\n${significantDiffs === 0 ? "✓ SONUÇ: Anlamlı fark yok — refactor güvenli görünüyor." : `🔴 SONUÇ: ${significantDiffs} seviyede anlamlı fark bulundu — refactor'ü incele!`}`);
process.exit(significantDiffs === 0 ? 0 : 1);
