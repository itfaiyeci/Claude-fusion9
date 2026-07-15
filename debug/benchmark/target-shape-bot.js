#!/usr/bin/env node
/**
 * Fusion 9 — Hedef Şekil Botu (GERÇEK level koşullarında)
 *
 * [Oturum 92 — kullanıcı isteği] "Casual/normal/pro farklı hedefe
 * odaklı bir bot lazım — her türlü levelde 48 şekli yapacak ve bize
 * rapor verecek."
 *
 * strategic-shape-bot.js'in İNŞA MANTIĞINI (donor hücre + permütasyon
 * deneme) AYNEN kullanır — ama makeCleanGC() (boş, engelsiz, sınırsız
 * hamleli hayali tahta) yerine GERÇEK generateLevel() çıktısı (gerçek
 * engel yerleşimi, gerçek hamle limiti) üzerinde çalışır. Yani bu
 * araç "mekanik olarak mümkün mü" (strategic-shape-bot zaten kanıtladı)
 * DEĞİL, "GERÇEK bir level'da, GERÇEK engellerle, GERÇEK hamle
 * bütçesiyle YİNE DE yapılabiliyor mu" sorusuna cevap arıyor.
 *
 * KULLANIM:
 *   node debug/benchmark/target-shape-bot.js [levelListesi] [şekilAdıYaAll]
 *   örn: node debug/benchmark/target-shape-bot.js 1,10,25,50,75,100 all
 */
const fs = require("fs");
const path = require("path");
const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
if (!fs.existsSync(BUNDLE_PATH)) {
  console.error("✗ Önce headless bundle'ı derleyin: node debug/benchmark/build-headless-engine.js");
  process.exit(1);
}
const engine = require(BUNDLE_PATH);
const { GameCore, ALL_FIXED_SHAPES, generateLevel } = engine;

const GRID = 8;
function cellKey(r, c) { return r + "," + c; }

const [, , levelsArg, shapeArg] = process.argv;
const LEVELS = (levelsArg || "1,10,25,41,50,75,91,100").split(",").map(s => parseInt(s.trim(), 10));
const TARGET_SHAPE = shapeArg || "all";

// Belirli bir GERÇEK level'ı (engelleri + hamle limitiyle) yükler.
function loadRealLevel(levelNumber, seed) {
  const cfg = generateLevel(levelNumber, seed);
  const gc = new GameCore({ seed, blockerLayout: cfg.blockerLayout, moves: cfg.moves, targetScore: cfg.targetScore });
  return { gc, cfg };
}

function isBlocked(gc, r, c) {
  return gc.blockers.has(cellKey(r, c));
}

function swapCellToNine(gc, targetR, targetC, donorRC) {
  const [dr, dc] = donorRC;
  const targetVal = gc.board.getCell(targetR, targetC);
  if (targetVal === null) return { ok: false, reason: "hedef hücre boş (engel/hediye)" };
  const neededDonorVal = 9 - targetVal;
  if (neededDonorVal < 1 || neededDonorVal > 8) return { ok: false, reason: `targetVal=${targetVal} için uygun donor değeri yok` };
  gc.board.cells[dr][dc] = neededDonorVal;
  const outcome = gc.applyPlayerMove(dr, dc, targetR, targetC, 9);
  return { ok: true, outcome };
}
function hasUnwantedMatch(outcome, expectedShapeName) {
  for (const ev of (outcome.chain || [])) if (ev.match && ev.match.shapeName !== expectedShapeName) return ev.match.shapeName;
  return null;
}
function hasExpectedMatch(outcome, expectedShapeName) {
  for (const ev of (outcome.chain || [])) if (ev.match && ev.match.shapeName === expectedShapeName) return ev.match;
  return null;
}
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

// [Oturum 92] tryOrder — strategic-shape-bot.js ile AYNI mantık, TEK
// FARKI: donor/hedef seçerken ENGELLİ hücreleri atlıyor (gerçek
// tahtada bloklu bir hücre swap hedefi/donor olamaz).
function tryOrder(gc, order, shapeCellSet, shapeName) {
  const log = [];
  const usedDonors = new Set();
  const setCells = new Set();

  for (let i = 0; i < order.length; i++) {
    const [r, c] = order[i];
    if (isBlocked(gc, r, c)) return { success: false, reason: `(${r},${c}) hedef hücre ENGELLİ`, log };
    const isLast = (i === order.length - 1);

    let donor = null, borrowedFrom = null;
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [ddr, ddc] of deltas) {
      const nr = r + ddr, nc = c + ddc;
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
      const k = cellKey(nr, nc);
      if (shapeCellSet.has(k)) continue;
      if (usedDonors.has(k)) continue;
      if (isBlocked(gc, nr, nc)) continue; // [Oturum 92] engelli donor OLAMAZ
      donor = [nr, nc];
      break;
    }
    if (!donor) {
      for (const [ddr, ddc] of deltas) {
        const nr = r + ddr, nc = c + ddc;
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
        const k = cellKey(nr, nc);
        if (!shapeCellSet.has(k)) continue;
        if (setCells.has(k)) continue;
        if (k === cellKey(r, c)) continue;
        if (isBlocked(gc, nr, nc)) continue;
        donor = [nr, nc]; borrowedFrom = k;
        break;
      }
    }
    if (!donor) return { success: false, reason: `(${r},${c}) için donor bulunamadı`, log };
    if (!borrowedFrom) usedDonors.add(cellKey(...donor));

    const result = swapCellToNine(gc, r, c, donor);
    if (!result.ok) return { success: false, reason: `(${r},${c}) swap başarısız: ${result.reason}`, log };
    setCells.add(cellKey(r, c));
    log.push({ step: i, cell: [r, c], donor, borrowed: !!borrowedFrom });

    if (isLast) {
      const found = hasExpectedMatch(result.outcome, shapeName);
      if (!found) {
        const chainNames = (result.outcome.chain || []).map(ev => ev.match?.shapeName).filter(Boolean);
        return { success: false, reason: `son hamlede beklenen şekil OLUŞMADI — oluşan: [${chainNames.join(",")}]`, log };
      }
      return { success: true, reason: "OK", log };
    } else {
      const unwanted = hasUnwantedMatch(result.outcome, shapeName);
      if (unwanted) return { success: false, reason: `ara adımda istenmeyen eşleşme: ${unwanted}`, log };
      if (hasExpectedMatch(result.outcome, shapeName)) return { success: false, reason: "hedef şekil ERKEN oluştu", log };
    }
  }
  return { success: false, reason: "beklenmeyen akış sonu", log };
}

// Şekli, GERÇEK level'ın tahtasında, tahtadaki HER olası konumda dener
// (blokeli hücrelere denk gelen konumlar atlanır). movesLimit'i AŞAN
// başarılı inşalar da "movesExceeded" olarak ayrıca işaretlenir.
function constructOnRealLevel(gc, movesLimit, shapeDef) {
  const maxDr = Math.max(...shapeDef.cells.map(([r]) => r));
  const maxDc = Math.max(...shapeDef.cells.map(([, c]) => c));
  let lastFail = null;
  for (let baseR = 0; baseR <= GRID - 1 - maxDr; baseR++) {
    for (let baseC = 0; baseC <= GRID - 1 - maxDc; baseC++) {
      const cellsAbs = shapeDef.cells.map(([dr, dc]) => [baseR + dr, baseC + dc]);
      if (cellsAbs.some(([r, c]) => isBlocked(gc, r, c))) continue; // bu konumda engel var, atla
      const shapeCellSet = new Set(cellsAbs.map(([r, c]) => cellKey(r, c)));
      const orderCandidates = permutations(cellsAbs);
      let tried = 0;
      const MAX_TRIES = shapeDef.cells.length >= 6 ? 200 : 5040; // büyük şekillerde performans için örnekle
      for (const order of orderCandidates) {
        if (tried++ >= MAX_TRIES) break;
        const gcCopy = cloneGc(gc);
        const r = tryOrder(gcCopy, order, shapeCellSet, shapeDef.name);
        if (r.success) {
          const movesUsed = r.log.length;
          return { success: true, movesUsed, movesLimit, exceedsBudget: movesLimit != null && movesUsed > movesLimit, baseR, baseC };
        }
        lastFail = r;
      }
    }
  }
  return { success: false, reason: lastFail?.reason || "hiçbir konumda/sıralamada başarılı olmadı" };
}

// GameCore'un yüzeysel bir kopyası — Board'un PROTOTİPİNİ korur (sadece
// cells verisini bağımsızlaştırır), çünkü applyPlayerMove() içeride
// board.pickValueAvoidingNeighbors() gibi gerçek Board metodlarını
// çağırıyor — sahte/basit bir {getCell,setCell} nesnesi YETMEZ.
function cloneGc(gc) {
  const clone = Object.create(Object.getPrototypeOf(gc));
  Object.assign(clone, gc);
  const boardClone = Object.create(Object.getPrototypeOf(gc.board));
  Object.assign(boardClone, gc.board);
  boardClone.cells = gc.board.cells.map(row => row.slice());
  clone.board = boardClone;
  clone.gifts = new Map(gc.gifts);
  clone.elements = new Map(gc.elements);
  clone.blockers = new Map(gc.blockers);
  clone.hourglasses = new Map(gc.hourglasses);
  clone.score = gc.score;
  return clone;
}

const shapesToTest = TARGET_SHAPE === "all" ? ALL_FIXED_SHAPES : ALL_FIXED_SHAPES.filter(s => s.name === TARGET_SHAPE);
console.log(`Hedef şekil botu — level listesi: [${LEVELS.join(",")}], şekil: ${TARGET_SHAPE}\n`);

const report = []; // { shapeName, group, results: [{level, success, movesUsed, exceedsBudget, reason}] }
for (const shapeDef of shapesToTest) {
  const results = [];
  for (const levelNumber of LEVELS) {
    const seed = levelNumber * 7919;
    const { gc, cfg } = loadRealLevel(levelNumber, seed);
    const res = constructOnRealLevel(gc, cfg.moves, shapeDef);
    results.push({ level: levelNumber, movesLimit: cfg.moves, ...res });
  }
  report.push({ shapeName: shapeDef.name, group: shapeDef.group, results });
  const successCount = results.filter(r => r.success && !r.exceedsBudget).length;
  const budgetExceeded = results.filter(r => r.success && r.exceedsBudget).length;
  console.log(`[${shapeDef.group}] ${shapeDef.name.padEnd(10)} — ${successCount}/${LEVELS.length} level'da hamle bütçesi İÇİNDE başarılı` +
    (budgetExceeded ? `, ${budgetExceeded} level'da MÜMKÜN ama bütçe AŞILDI` : ""));
}

const outPath = path.join(__dirname, "results", `target-shape-bot-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\n✓ Detaylı sonuç kaydedildi: ${outPath}`);
