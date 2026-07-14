#!/usr/bin/env node
/**
 * Fusion 9 — Şekil Bazlı Zamanlama Raporu (Oyun Sağlığı)
 *
 * [Oturum 91 — kullanıcı isteği] "48 şeklin hepsinde kaç dakika, kaç
 * hamlede oluştuğunu ölçmemiz gerekir, oyun sağlığı açısından."
 *
 * shape-coverage-report.js'ten FARKI: o araç level-bazlı, her level
 * ayrı bir oyun/hamle sayacıyla başlar. Bu araç TEK SÜREKLİ bir bot
 * oturumu (level 1'den başlayıp art arda level'lar oynanır, hamle
 * sayacı SIFIRLANMAZ) — her şeklin İLK KEZ hangi GLOBAL hamlede
 * oluştuğunu, hangi level'da olduğunu kaydeder. Bulunamayan şekiller
 * için "hiç oluşmadı" (verilen hamle bütçesi içinde) raporlanır.
 *
 * "Dakika" tahmini — bot ANINDA oynuyor, gerçek oyuncu süresi ölçemeyiz.
 * Bunun yerine hamle başına VARSAYILAN bir süre (SEC_PER_MOVE, aşağıda
 * ayarlanabilir) ile YAKLAŞIK bir oyuncu-dakikası hesaplanıyor — bu bir
 * TAHMİN, gerçek telemetri değil, raporda böyle işaretleniyor.
 *
 * KULLANIM:
 *   node debug/benchmark/shape-timing-report.js [maxHamle] [profil] [SEC_PER_MOVE]
 *   örn: node debug/benchmark/shape-timing-report.js 30000 pro 4
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce headless bundle'ı derleyin: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , maxMovesArg, profileArg, secPerMoveArg] = process.argv;
const MAX_MOVES = parseInt(maxMovesArg || "30000", 10);
const PROFILE = profileArg || "pro";
const SEC_PER_MOVE = parseFloat(secPerMoveArg || "4"); // varsayım: ortalama oyuncu hamle başına ~4sn
const MAX_MOVES_PER_LEVEL_SAFETY = 60;

const allShapeNames = engine.ALL_FIXED_SHAPES
  ? engine.ALL_FIXED_SHAPES.map(s => ({ name: s.name, group: s.group }))
  : [];
const lineShapeNames = [
  { name: "line3_h", group: "a" }, { name: "line3_v", group: "a" },
  { name: "line4_h", group: "b" }, { name: "line4_v", group: "b" },
  { name: "line5_h", group: "c" }, { name: "line5_v", group: "c" },
];
const knownShapes = [...allShapeNames, ...lineShapeNames];

// name -> { firstMove, firstLevel, group } — sadece İLK oluşum kaydedilir
const firstOccurrence = new Map();

let globalMoveCount = 0;
let level = 1;
const t0 = Date.now();

console.log(`Şekil zamanlama raporu — profil: ${PROFILE}, hamle bütçesi: ${MAX_MOVES}, varsayılan hamle süresi: ${SEC_PER_MOVE}sn\n`);
console.log("Oynanıyor (sürekli oturum, level atlaya atlaya)...\n");

outer:
while (globalMoveCount < MAX_MOVES) {
  const seed = level * 7919;
  const cfg = engine.generateLevel(level, seed);
  const gc = new engine.GameCore({
    seed, blockerLayout: cfg.blockerLayout, moves: cfg.moves, targetScore: cfg.targetScore,
  });
  engine.F9Bot.reseed(seed * 1000003 + level);

  let movesThisLevel = 0;
  while (gc.status === "in_progress" && movesThisLevel < MAX_MOVES_PER_LEVEL_SAFETY) {
    const move = engine.F9Bot.pickMove(gc, PROFILE);
    if (!move) break;
    const outcome = engine.F9Bot.applyMove(gc, move);
    if (outcome === null) break;
    movesThisLevel++;
    globalMoveCount++;

    for (const ev of (outcome.chain || [])) {
      if (ev.match && ev.match.shapeName && !firstOccurrence.has(ev.match.shapeName)) {
        firstOccurrence.set(ev.match.shapeName, {
          firstMove: globalMoveCount, firstLevel: level, group: ev.match.group,
        });
      }
    }
    if (typeof gc._updateStatus === "function") gc._updateStatus();
    if (globalMoveCount >= MAX_MOVES) break outer;
  }
  level++;
  if (level > 100) level = 1; // 100 leveli bitirdiysek baştan sar, hamle bütçesi dolana kadar devam
}

const elapsedRealSec = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`✓ ${globalMoveCount} hamle oynandı (~${level} level boyunca), gerçek işlem süresi: ${elapsedRealSec}sn\n`);

console.log("── Şekil bazında İLK OLUŞUM (hamle / tahmini oyuncu-dakikası) ──");
const rows = knownShapes.map(({ name, group }) => {
  const f = firstOccurrence.get(name);
  return { name, group, first: f || null };
});
rows.sort((a, b) => a.group.localeCompare(b.group) || (a.first?.firstMove ?? Infinity) - (b.first?.firstMove ?? Infinity));

let neverFound = [];
for (const r of rows) {
  if (r.first) {
    const estMin = (r.first.firstMove * SEC_PER_MOVE / 60).toFixed(1);
    console.log(`  [${r.group}] ${r.name.padEnd(10)} hamle #${String(r.first.firstMove).padStart(6)}  (~${estMin} dk)  level ${r.first.firstLevel}`);
  } else {
    console.log(`  [${r.group}] ${r.name.padEnd(10)} ⚠️  HİÇ OLUŞMADI (${globalMoveCount} hamle boyunca, ~${(globalMoveCount*SEC_PER_MOVE/60).toFixed(0)} dk)`);
    neverFound.push(r.name);
  }
}

console.log(`\nToplam ${knownShapes.length} şekilden ${knownShapes.length - neverFound.length} tanesi bulundu, ${neverFound.length} tanesi ${MAX_MOVES} hamle boyunca HİÇ oluşmadı.`);
if (neverFound.length) console.log(`⚠️  Hiç oluşmayanlar: ${neverFound.join(", ")}`);

const outPath = path.join(__dirname, "results", `shape-timing-${PROFILE}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({
  params: { MAX_MOVES, PROFILE, SEC_PER_MOVE },
  globalMoveCount, elapsedRealSec,
  rows: rows.map(r => ({ name: r.name, group: r.group, firstMove: r.first?.firstMove ?? null, firstLevel: r.first?.firstLevel ?? null })),
  neverFound,
}, null, 2));
console.log(`\n✓ Detaylı sonuç kaydedildi: ${outPath}`);
