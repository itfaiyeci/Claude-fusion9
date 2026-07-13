#!/usr/bin/env node
/**
 * Fusion 9 — Level Bazlı Şekil (Eşleşme) Kapsama Raporu
 *
 * [Oturum 31] "Oyuncunun herhangi bir levelde yapabileceği eşleştirmeleri
 * önceden bilmek istiyorum" isteğine cevap. F9Bot'u GERÇEK oyun motoruyla
 * (GameCore.applyPlayerMove → resolveBoard → findAllMatches) oynatıp her
 * hamlede hangi ŞEKLİN (shapeName) oluştuğunu kaydediyor — sentetik bir
 * board-simülasyonu DEĞİL, gerçek hamle/enerji/blocker kurallarıyla.
 *
 * Neden F9Bot'un kendisini değiştirmek yerine ayrı bir araç: shapeName
 * verisi zaten outcome.chain[i].match.shapeName üzerinden dışarı
 * sızıyor (engine/matchEngine.js findAllMatches()), hiçbir oyun koduna
 * dokunmaya gerek yok — sadece bu veriyi TOPLAYIP raporluyoruz.
 *
 * KULLANIM:
 *   node debug/benchmark/shape-coverage-report.js [levelBaşlangıç] [levelBitiş] [oyun/level] [profil]
 *   örn: node debug/benchmark/shape-coverage-report.js 1 100 20 pro
 *
 * ÇIKTI: konsola özet tablo + debug/benchmark/results/shape-coverage-*.json
 */
const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce headless bundle'ı derleyin: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);

const [, , startArg, endArg, gamesArg, profileArg] = process.argv;
const START_LEVEL = parseInt(startArg || "1", 10);
const END_LEVEL = parseInt(endArg || "100", 10);
const GAMES_PER_LEVEL = parseInt(gamesArg || "20", 10);
const PROFILE = profileArg || "pro";
const MAX_MOVES_SAFETY = 60;

// shapeName -> { grup, kaçKezOluştu (global), levelBazlı: {level: count} }
const shapeStats = new Map();
function recordShape(shapeName, group, level) {
  if (!shapeStats.has(shapeName)) {
    shapeStats.set(shapeName, { group, total: 0, byLevel: new Map() });
  }
  const s = shapeStats.get(shapeName);
  s.total++;
  s.byLevel.set(level, (s.byLevel.get(level) || 0) + 1);
}

function playOneLevel(levelNumber, seed) {
  const cfg = engine.generateLevel(levelNumber, seed);
  const gc = new engine.GameCore({
    seed, blockerLayout: cfg.blockerLayout, moves: cfg.moves, targetScore: cfg.targetScore,
  });
  engine.F9Bot.reseed(seed * 1000003 + levelNumber);

  let movesPlayed = 0;
  while (gc.status === "in_progress" && movesPlayed < MAX_MOVES_SAFETY) {
    const move = engine.F9Bot.pickMove(gc, PROFILE);
    if (!move) break;
    const outcome = engine.F9Bot.applyMove(gc, move);
    if (outcome === null) break;
    movesPlayed++;

    // Direkt hamle sonucu bir şekil mi (combo/promotion değil, normal eşleşme)?
    if (outcome.kind === "normal" && outcome.group) {
      // Tek eşleşme — matchEngine bunu chain[0] olarak da döndürüyor genelde,
      // ama garantiye almak için outcome üzerinden de bakalım.
    }
    for (const ev of (outcome.chain || [])) {
      if (ev.match && ev.match.shapeName) {
        recordShape(ev.match.shapeName, ev.match.group, levelNumber);
      }
    }
    if (typeof gc._updateStatus === "function") gc._updateStatus();
  }
}

console.log(`Şekil kapsama raporu — level ${START_LEVEL}-${END_LEVEL}, ${GAMES_PER_LEVEL} oyun/level, profil: ${PROFILE}\n`);

for (let lvl = START_LEVEL; lvl <= END_LEVEL; lvl++) {
  for (let g = 0; g < GAMES_PER_LEVEL; g++) {
    const seed = lvl * 7919 + g * 104729;
    playOneLevel(lvl, seed);
  }
}

// Kod tabanındaki TÜM şekil isimlerini al (rules/matchRules.js) — hiç
// oluşmayanları da raporda GÖRÜNÜR kılmak için (Map'te hiç yoksa 0 say).
const allShapeNames = engine.ALL_FIXED_SHAPES
  ? engine.ALL_FIXED_SHAPES.map(s => ({ name: s.name, group: s.group }))
  : [];
// Çizgi şekilleri de manuel ekleyelim (ALL_FIXED_SHAPES'te değiller)
const lineShapeNames = [
  { name: "line3_h", group: "a" }, { name: "line3_v", group: "a" },
  { name: "line4_h", group: "b" }, { name: "line4_v", group: "b" },
  { name: "line5_h", group: "c" }, { name: "line5_v", group: "c" },
];
const knownShapes = [...allShapeNames, ...lineShapeNames];

console.log("── Şekil bazında toplam kullanım (tüm levellerin toplamı) ──");
const rows = knownShapes.map(({ name, group }) => {
  const s = shapeStats.get(name);
  return { name, group, total: s ? s.total : 0 };
});
rows.sort((a, b) => a.group.localeCompare(b.group) || b.total - a.total);
let neverUsed = [];
for (const r of rows) {
  const marker = r.total === 0 ? " ⚠️  HİÇ OLUŞMADI" : "";
  console.log(`  [${r.group}] ${r.name.padEnd(10)} ${String(r.total).padStart(6)}${marker}`);
  if (r.total === 0) neverUsed.push(r.name);
}

console.log(`\nToplam benzersiz şekil: ${knownShapes.length}, hiç oluşmayan: ${neverUsed.length}`);
if (neverUsed.length > 0) {
  console.log(`⚠️  Hiç oluşmayan şekiller: ${neverUsed.join(", ")}`);
}

// Level bazlı detay — her level için hangi şekiller oluştu (özet: kaç FARKLI şekil)
console.log("\n── Level başına şekil çeşitliliği (ilk/son 5 level örnek) ──");
const levelDiversity = new Map();
for (const [name, s] of shapeStats) {
  for (const [lvl, cnt] of s.byLevel) {
    if (!levelDiversity.has(lvl)) levelDiversity.set(lvl, new Set());
    levelDiversity.get(lvl).add(name);
  }
}
const sampleLevels = [...new Set([
  ...Array.from({length:5}, (_,i)=>START_LEVEL+i),
  ...Array.from({length:5}, (_,i)=>END_LEVEL-4+i),
])].filter(l => l >= START_LEVEL && l <= END_LEVEL);
for (const lvl of sampleLevels) {
  const div = levelDiversity.get(lvl);
  console.log(`  level ${lvl}: ${div ? div.size : 0} farklı şekil türü oluştu`);
}

const outPath = path.join(__dirname, "results", `shape-coverage-${new Date().toISOString().replace(/[:.]/g,"-")}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const outData = {
  params: { START_LEVEL, END_LEVEL, GAMES_PER_LEVEL, PROFILE },
  shapesSummary: rows,
  neverUsed,
  byLevelDiversity: Object.fromEntries([...levelDiversity].map(([l,s])=>[l,[...s]])),
  rawByShape: Object.fromEntries([...shapeStats].map(([name,s])=>[name,{group:s.group,total:s.total,byLevel:Object.fromEntries(s.byLevel)}])),
};
fs.writeFileSync(outPath, JSON.stringify(outData, null, 2));
console.log(`\n✓ Detaylı sonuç (level-bazlı tam veri dahil) kaydedildi: ${outPath}`);
