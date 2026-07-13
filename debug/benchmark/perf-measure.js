#!/usr/bin/env node
/**
 * Fusion 9 — Motor Performans Ölçümü
 *
 * [Oturum 26 — Motor sağlamlık denetimi] HANDOFF.md'de "Performans
 * ölçümü (gerçek FPS/süre): %0 — Hiç yapılmadı, sadece kod-okuma
 * tahminleri var" diye işaretliydi. Bu script GERÇEK wall-clock
 * zamanlaması ölçer — headless motor (DOM yok, animasyon/render yok)
 * üzerinde applyPlayerMove()'un kendisi ne kadar sürüyor.
 *
 * ÖNEMLİ: Bu, ekranda görünen animasyon süresini DEĞİL, motor
 * mantığının (match/evolution/blocker/board resolve) saf hesaplama
 * süresini ölçer — F9_CONFIG.ANIM.* değerleri (380ms blast, 420ms
 * fall vb.) zaten sabit ve kasıtlı; burada aranan CPU'nun bu
 * hesaplamaları yaparken donma/gecikmeye yol açıp açmadığı.
 *
 * KULLANIM:
 *   node debug/benchmark/perf-measure.js [levelSayısı] [oyunSayısı/level]
 *
 * ÇIKTI: Konsola özet + debug/benchmark/results/perf-<timestamp>.json
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce headless bundle'ı derleyin: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , levelsArg, gamesArg] = process.argv;
const NUM_LEVELS = parseInt(levelsArg || "100", 10);
const GAMES_PER_LEVEL = parseInt(gamesArg || "5", 10);
const MAX_MOVES_SAFETY = 500;
const PROFILE = "pro"; // en agresif bot — en çok chain/combo tetikler, en kötü senaryo

// Her hamlenin applyPlayerMove() süresini (mikrosaniye) topluyoruz,
// ayrıca hangi levelde/hangi outcome türünde en yavaş olduğunu izliyoruz.
const moveTimingsUs = [];
const slowMoves = []; // en yavaş 20 hamle, detaylarıyla
let globalMoveIdx = 0; // JIT ısınma etkisini ayırt etmek için — TÜM koşu boyunca sayaç

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
  while (gc.status === "in_progress" && movesPlayed < MAX_MOVES_SAFETY) {
    const move = engine.F9Bot.pickMove(gc, PROFILE);
    if (!move) break;

    // Zamanlama sadece GERÇEK motor çağrısını (applyPlayerMove) sarmalı —
    // F9Bot.applyMove() zaten applyPlayerMove()'u içeride çağırıyor
    // (bkz. debug/bot.js satır 290/298), o yüzden _applyBotMove'un
    // KENDİSİNİ zamanlıyoruz (bot karar verme süresi HARİÇ tutulamıyor
    // ama bot'un kendi pickMove() süresi ayrı ölçülüyor aşağıda).
    const t0 = process.hrtime.bigint();
    const result = engine.F9Bot.applyMove(gc, move);
    const t1 = process.hrtime.bigint();
    const us = Number(t1 - t0) / 1000;

    if (result === null) break;
    movesPlayed++;
    globalMoveIdx++;

    moveTimingsUs.push(us);
    if (us > 2000) { // 2ms üzeri = "yavaş hamle" olarak logla
      slowMoves.push({
        level: levelNumber, seed, moveNum: movesPlayed, globalIdx: globalMoveIdx, us: Math.round(us),
        chainLen: result?.chain?.length || 0,
        blockers: gc.blockers?.size || 0,
        kind: result?.kind || "?",
      });
    }

    if (typeof gc._updateStatus === "function") gc._updateStatus();
    else if (gc.movesLeft !== undefined && gc.movesLeft <= 0 && gc.status === "in_progress") {
      gc.status = gc.score >= cfg.targetScore ? "won" : "lost";
    }
  }
  return movesPlayed;
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

console.log(`Fusion 9 Motor Performans Ölçümü — ${NUM_LEVELS} level × ${GAMES_PER_LEVEL} oyun, profil: ${PROFILE}\n`);

const wallStart = process.hrtime.bigint();
let totalMoves = 0;
for (let lvl = 1; lvl <= NUM_LEVELS; lvl++) {
  for (let g = 0; g < GAMES_PER_LEVEL; g++) {
    const seed = lvl * 7919 + g * 104729;
    totalMoves += playOneLevel(lvl, seed);
  }
}
const wallEnd = process.hrtime.bigint();
const totalWallMs = Number(wallEnd - wallStart) / 1e6;

const avgUs = moveTimingsUs.reduce((a, b) => a + b, 0) / moveTimingsUs.length;
const p50 = percentile(moveTimingsUs, 0.50);
const p95 = percentile(moveTimingsUs, 0.95);
const p99 = percentile(moveTimingsUs, 0.99);
const max = Math.max(...moveTimingsUs);

slowMoves.sort((a, b) => b.us - a.us);

console.log("── Sonuç ──────────────────────────────────────────");
console.log(`Toplam hamle: ${totalMoves}`);
console.log(`Toplam duvar-saati süresi: ${totalWallMs.toFixed(1)}ms (${(totalMoves/(totalWallMs/1000)).toFixed(0)} hamle/sn)`);
console.log(`applyPlayerMove() süresi — ortalama: ${avgUs.toFixed(1)}µs, p50: ${p50.toFixed(1)}µs, p95: ${p95.toFixed(1)}µs, p99: ${p99.toFixed(1)}µs, max: ${max.toFixed(1)}µs`);
console.log(`\n60fps bütçesi 16.67ms/frame — en yavaş hamle bile bunun ${(max/1000/16.67*100).toFixed(2)}%'i kadar sürdü.`);
console.log(`\n2ms üzeri "yavaş" hamle sayısı: ${slowMoves.length} / ${totalMoves} (${(slowMoves.length/totalMoves*100).toFixed(3)}%)`);

// JIT ısınma etkisini ayırt et: ilk 200 hamle vs geri kalanı
const warmupUs = moveTimingsUs.slice(0, 200);
const steadyUs = moveTimingsUs.slice(200);
const warmupAvg = warmupUs.reduce((a,b)=>a+b,0) / warmupUs.length;
const steadyAvg = steadyUs.reduce((a,b)=>a+b,0) / steadyUs.length;
const steadyP99 = percentile(steadyUs, 0.99);
const steadyMax = Math.max(...steadyUs);
console.log(`\n── JIT ısınma etkisi kontrolü ──`);
console.log(`İlk 200 hamle ortalama: ${warmupAvg.toFixed(1)}µs  |  200. hamleden sonrası ortalama: ${steadyAvg.toFixed(1)}µs`);
console.log(`Kararlı-durum (200.+) p99: ${steadyP99.toFixed(1)}µs, max: ${steadyMax.toFixed(1)}µs`);
console.log(`Yavaş hamlelerin ${slowMoves.filter(m=>m.globalIdx<=200).length}/${slowMoves.length} tanesi ilk 200 hamle içinde (globalIdx<=200).`);

if (slowMoves.length > 0) {
  console.log("\nEn yavaş 10 hamle:");
  slowMoves.slice(0, 10).forEach(m => {
    console.log(`  level=${m.level} seed=${m.seed} hamle#${m.moveNum} → ${m.us}µs (kind=${m.kind}, chain=${m.chainLen}, blockers=${m.blockers})`);
  });
}

const outPath = path.join(__dirname, "results", `perf-${new Date().toISOString().replace(/[:.]/g,"-")}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({
  params: { NUM_LEVELS, GAMES_PER_LEVEL, PROFILE },
  totalMoves, totalWallMs,
  avgUs, p50, p95, p99, max,
  slowMovesTop20: slowMoves.slice(0, 20),
}, null, 2));
console.log(`\n✓ Detaylı sonuç kaydedildi: ${outPath}`);
