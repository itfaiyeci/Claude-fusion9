#!/usr/bin/env node
/**
 * Fusion 9 — Stratejik Şekil İnşa Botu + Debug
 *
 * [Oturum 32] "Levellerin rastgele değil kontrol edilebilir olması"
 * hedefi için: her 3/4/5/6/7'li şekli ve tüm terfi zincirini
 * (bakır+9→bronz→+9→gümüş→+9→altın→+9→elmas→+9→Matrix) SADECE GERÇEK
 * SWAP HAMLELERİYLE (gerçek oyuncunun yapabileceği gibi) inşa etmeye
 * çalışır — hücre değeri doğrudan atanmaz, her adım gerçek
 * GameCore.applyPlayerMove() üzerinden geçer.
 *
 * TEMEL FİKİR: resolveBoard() her hamleden sonra TÜM board'u tarar ve
 * eşleşmeleri UZUNLUĞA GÖRE BÜYÜKTEN KÜÇÜĞE öncelikli işler (örtüşen
 * küçük eşleşmeler elenir). Yani bir şeklin hücrelerini son hücre HARİÇ
 * hepsini önce 9 yapıp, SON hücreyi EN SONA bırakırsak — o son hamlede
 * TÜM şekil hücreleri aynı anda 9 olur ve motor büyük şekli tercih eder
 * (alt-kümedeki küçük şekiller değil). Her ara adımda İSTENMEYEN bir
 * eşleşme ateşlenmediği doğrulanır (aksi halde konstrüksiyon BOZULUR).
 *
 * KULLANIM:
 *   node debug/benchmark/strategic-shape-bot.js [shapeName ya da "all"]
 */
const fs = require("fs");
const path = require("path");
const BUNDLE_PATH = path.join(__dirname, ".headless-bundle.js");
const engine = require(BUNDLE_PATH);
const { GameCore, ALL_FIXED_SHAPES } = engine;

const GRID = 8;
const DEBUG = process.env.DEBUG === "1";
function dlog(...args) { if (DEBUG) console.log("  [debug]", ...args); }

function cellKey(r, c) { return r + "," + c; }

// Boş (blocker/gift/hourglass/element yok) bir GameCore oluştur.
function makeCleanGC() {
  const gc = new GameCore({ seed: 1, blockerLayout: null, moves: 999, targetScore: 999999 });
  gc.blockers.clear();
  gc.gifts.clear();
  gc.hourglasses.clear();
  gc.elements.clear();
  gc.movesLimit = null; // hamle sınırı yok — sadece inşa yeteneğini test ediyoruz
  return gc;
}

// Board'u nötr bir değerle doldur (şekil dışı hücreler için).
function fillNeutral(gc, avoidNine = true) {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      gc.board.cells[r][c] = 2; // 2: 2+2=4, komşu 2'ler kendiliğinden 9 yapmaz, güvenli dolgu
    }
  }
}

// (r,c)'ye bitişik, `excludeSet`te OLMAYAN bir hücre bul.
function findExternalNeighbor(r, c, excludeSet) {
  const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of deltas) {
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
    if (excludeSet.has(cellKey(nr,nc))) continue;
    return [nr,nc];
  }
  return null;
}

// (targetR,targetC) hücresini GERÇEK bir swap ile 9 yap. Donor'un mevcut
// değeri, target'ın mevcut değeriyle 9 üretecek şekilde ÖNCEDEN ayarlanır
// (kontrollü test ortamı — gerçek oyunda "uygun komşuyu bul" adımına denk gelir).
function swapCellToNine(gc, targetR, targetC, donorRC) {
  const [dr, dc] = donorRC;
  const targetVal = gc.board.getCell(targetR, targetC);
  const neededDonorVal = 9 - targetVal;
  if (neededDonorVal < 1 || neededDonorVal > 8) {
    return { ok: false, reason: `targetVal=${targetVal} için uygun donor değeri yok (${neededDonorVal})` };
  }
  gc.board.cells[dr][dc] = neededDonorVal;
  const ops = GameCore.validOps(neededDonorVal, targetVal);
  if (!ops.some(o => o.value === 9)) {
    return { ok: false, reason: `validOps(${neededDonorVal},${targetVal}) 9 üretmiyor (beklenmedik)` };
  }
  const outcome = gc.applyPlayerMove(dr, dc, targetR, targetC, 9);
  return { ok: true, outcome };
}
function hasUnwantedMatch(outcome, expectedShapeName) {
  for (const ev of (outcome.chain || [])) {
    if (ev.match && ev.match.shapeName !== expectedShapeName) return ev.match.shapeName;
  }
  return null;
}
function hasExpectedMatch(outcome, expectedShapeName) {
  for (const ev of (outcome.chain || [])) {
    if (ev.match && ev.match.shapeName === expectedShapeName) return ev.match;
  }
  return null;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0,i), ...arr.slice(i+1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

/**
 * Tek bir sıralama denemesi (order[] = hücre listesi, SON eleman spawn).
 */
function tryOrder(order, cellsAbs, shapeCellSet, shapeName, externalGc) {
  const log = [];
  const gc = externalGc || makeCleanGC();
  if (!externalGc) fillNeutral(gc);
  const usedDonors = new Set();
  const setCells = new Set(); // hangi şekil hücreleri ZATEN 9 yapıldı

  for (let i = 0; i < order.length; i++) {
    const [r,c] = order[i];
    const isLast = (i === order.length - 1);

    // 1) Önce PUR harici (şekil dışı) donor ara.
    let donor = null;
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [ddr,ddc] of deltas) {
      const nr=r+ddr, nc=c+ddc;
      if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
      const k = cellKey(nr,nc);
      if (shapeCellSet.has(k)) continue;
      if (usedDonors.has(k)) continue;
      donor = [nr,nc];
      break;
    }
    // 2) Harici yoksa: HENÜZ 9 YAPILMAMIŞ bir komşu şekil-hücresini
    //    GEÇİCİ donor olarak kullan (o hücre daha sonra kendi sırasında
    //    ayrıca 9 yapılacak, şimdi "harcanması" sorun değil).
    let borrowedFrom = null;
    if (!donor) {
      for (const [ddr,ddc] of deltas) {
        const nr=r+ddr, nc=c+ddc;
        if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
        const k = cellKey(nr,nc);
        if (!shapeCellSet.has(k)) continue;
        if (setCells.has(k)) continue; // zaten 9 yapılmışsa BOZMA
        if (k === cellKey(r,c)) continue;
        donor = [nr,nc];
        borrowedFrom = k;
        break;
      }
    }
    if (!donor) {
      return { success:false, reason:`(${r},${c}) için donor bulunamadı (harici veya ödünç)`, log };
    }
    if (!borrowedFrom) usedDonors.add(cellKey(...donor));

    const result = swapCellToNine(gc, r, c, donor);
    if (!result.ok) {
      return { success:false, reason:`(${r},${c}) swap başarısız: ${result.reason}`, log };
    }
    setCells.add(cellKey(r,c));
    log.push({ step:i, cell:[r,c], donor, borrowed: !!borrowedFrom, chainLen:(result.outcome.chain||[]).length });

    if (isLast) {
      const found = hasExpectedMatch(result.outcome, shapeName);
      if (!found) {
        const chainNames = (result.outcome.chain||[]).map(ev=>ev.match?.shapeName).filter(Boolean);
        return { success:false, reason:`son hamlede beklenen şekil OLUŞMADI — oluşan: [${chainNames.join(",")}]`, log };
      }
      return { success:true, reason:"OK", log, finalOutcome:result.outcome, gc };
    } else {
      const unwanted = hasUnwantedMatch(result.outcome, shapeName);
      if (unwanted) {
        return { success:false, reason:`ara adımda istenmeyen eşleşme: ${unwanted} (adım ${i})`, log };
      }
      const early = hasExpectedMatch(result.outcome, shapeName);
      if (early) return { success:false, reason:`hedef şekil ERKEN oluştu (adım ${i})`, log };
    }
  }
  return { success:false, reason:"beklenmeyen akış sonu", log };
}

/**
 * Bir şekli GERÇEK swap hamleleriyle inşa etmeyi dener. Birden fazla
 * hücre sıralaması (permütasyon) dener — biri başarısız olursa
 * (istenmeyen erken eşleşme ya da donor bulunamaması) bir SONRAKİ
 * sıralamayı dener. Küçük şekillerde (≤5 hücre) TÜM permütasyonlar
 * denenir; büyük şekillerde (6-7 hücre) rastgele örneklenmiş bir alt
 * küme denenir (performans için).
 */
function constructShape(shapeDef, baseR = 3, baseC = 3) {
  const cellsAbs = shapeDef.cells.map(([dr,dc]) => [baseR+dr, baseC+dc]);
  for (const [r,c] of cellsAbs) {
    if (r<0||r>=GRID||c<0||c>=GRID) return { success:false, reason:"board dışına taştı", log:[] };
  }
  const shapeCellSet = new Set(cellsAbs.map(([r,c])=>cellKey(r,c)));

  // [Oturum 32 — DÜZELTME] Spawn hücresini HER ZAMAN son sırada tutmak
  // yanlıştı: bazı şekillerde (örn. b4_05/b4_07) spawn-DIŞI hücreler
  // kendi başlarına ZATEN geçerli daha küçük bir şekil oluşturuyor —
  // spawn ne zaman eklenirse eklensin, ondan ÖNCE o alt-küme tamamlanıp
  // ateşleniyor. Doğru kısıtlama: "spawn son olsun" DEĞİL, "TÜM şekil
  // hücreleri son hamlede AYNI ANDA 9 olsun" — hangi hücrenin fiilen
  // SON çevrildiği önemli değil (resolveBoard büyük şekli otomatik
  // tercih eder), sadece spawn'ın DA dahil olduğu tam küme aynı anda
  // tamamlanmalı. Bu yüzden artık TÜM hücrelerin permütasyonu deneniyor
  // (spawn'a özel bir kısıtlama YOK).
  const orderCandidates = permutations(cellsAbs);

  let lastFail = null;
  let tried = 0;
  const MAX_TRIES = 5040; // 7! — en büyük şekil için üst sınır, güvenlik
  for (const order of orderCandidates) {
    if (tried++ >= MAX_TRIES) break;
    const r = tryOrder(order, cellsAbs, shapeCellSet, shapeDef.name);
    if (r.success) return r;
    lastFail = r;
  }
  return { success:false, reason:`${tried} sıralamanın HİÇBİRİ başarılı olmadı — son hata: ${lastFail?.reason}`, log: lastFail?.log||[] };
}

// ============================================================
// TERFİ ZİNCİRİ: bakır+9→bronz→+9→gümüş→+9→altın→+9→elmas→+9→Matrix
// ============================================================
function constructEvolutionChain() {
  const log = [];
  const gc = makeCleanGC();
  fillNeutral(gc);

  // 1) Bakır hediyesi üret (basit bir 3'lü köşe şekliyle — kkose_1)
  const kkose1 = ALL_FIXED_SHAPES.find(s => s.name === "kkose_1");
  const baseR = 3, baseC = 3;
  const cellsAbs = kkose1.cells.map(([dr,dc]) => [baseR+dr, baseC+dc]);
  const shapeCellSet = new Set(cellsAbs.map(([r,c])=>cellKey(r,c)));
  let r1 = null;
  for (const order of permutations(cellsAbs)) {
    r1 = tryOrder(order, cellsAbs, shapeCellSet, "kkose_1", gc);
    if (r1.success) break;
    // Başarısız denemeden sonra gc kirlenmiş olabilir — temizleyip tekrar dene
    for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) gc.board.cells[r][c]=2;
    gc.gifts.clear();
  }
  if (!r1 || !r1.success) return { success:false, reason:"Bakır üretimi başarısız (kkose_1 kurulamadı)", log };
  let giftPos = [baseR+kkose1.spawn[0], baseC+kkose1.spawn[1]];
  log.push({ stage:"bakir_uretildi", giftPos });

  const chainSteps = [
    { from:"bakir", to:"bronz" }, { from:"bronz", to:"gumus" },
    { from:"gumus", to:"altin" }, { from:"altin", to:"elmas" },
    { from:"elmas", to:"matrix" },
  ];
  const usedCells = new Set(cellsAbs.map(([r,c])=>cellKey(r,c)));

  for (const step of chainSteps) {
    const curGift = gc.gifts.get(cellKey(...giftPos));
    if (!curGift) return { success:false, reason:`${step.from} terfisinden önce hediye bulunamadı (${giftPos})`, log };
    if (curGift.giftType !== step.from) return { success:false, reason:`beklenen ${step.from}, bulunan ${curGift.giftType}`, log };

    // Hediyeye bitişik, kullanılmamış bir hücre bul — orası 9 olacak
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    let nineCell = null;
    for (const [dr,dc] of deltas) {
      const nr=giftPos[0]+dr, nc=giftPos[1]+dc;
      if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
      const k = cellKey(nr,nc);
      if (usedCells.has(k)) continue;
      nineCell = [nr,nc];
      break;
    }
    if (!nineCell) return { success:false, reason:`${step.from}+9 için komşu hücre bulunamadı`, log };

    // nineCell'i 9 yap (dışarıdan donor ile)
    let donor = null;
    for (const [dr,dc] of deltas) {
      const nr=nineCell[0]+dr, nc=nineCell[1]+dc;
      if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
      const k = cellKey(nr,nc);
      if (k === cellKey(...giftPos)) continue; // hediye hücresine dokunma
      if (usedCells.has(k)) continue;
      donor = [nr,nc];
      break;
    }
    if (!donor) return { success:false, reason:`${step.from}+9: (${nineCell}) için donor bulunamadı`, log };
    usedCells.add(cellKey(...donor));
    usedCells.add(cellKey(...nineCell));

    const setResult = swapCellToNine(gc, nineCell[0], nineCell[1], donor);
    if (!setResult.ok) return { success:false, reason:`${step.from}+9: hücre 9 yapılamadı: ${setResult.reason}`, log };
    // Bu swap sırasında istenmeyen bir şekil ateşlenmiş olabilir mi kontrol et
    for (const ev of (setResult.outcome.chain||[])) {
      if (ev.match) log.push({ warning: `${step.from}+9 hazırlığında yan eşleşme: ${ev.match.shapeName}` });
    }

    // Şimdi GERÇEK terfi hamlesi: (giftPos) + (nineCell) → promotion
    const promoOutcome = gc.applyPlayerMove(giftPos[0], giftPos[1], nineCell[0], nineCell[1], null);
    log.push({ stage:`${step.from}_plus_9`, kind: promoOutcome.kind, gift: promoOutcome.gift, extraMoves: promoOutcome.extraMoves, energy: promoOutcome.energy, areaCellCount: (promoOutcome.areaCells||[]).length });

    if (promoOutcome.kind !== "promotion") {
      return { success:false, reason:`${step.from}+9 "promotion" DEĞİL, "${promoOutcome.kind}" döndü`, log };
    }

    if (step.to === "matrix") {
      // Elmas+9: yeni hediye ÜRETMEZ, areaCells (ince haç) + extraMoves bekleniyor
      if (promoOutcome.gift) return { success:false, reason:`Matrix Eşleşme'de beklenmedik yeni hediye: ${promoOutcome.gift}`, log };
      if (promoOutcome.extraMoves !== 3) return { success:false, reason:`Matrix Eşleşme extraMoves=3 bekleniyor, ${promoOutcome.extraMoves} bulundu`, log };
      log.push({ stage:"MATRIX_ESLESME_TAMAMLANDI", extraMoves: promoOutcome.extraMoves, areaCellCount:(promoOutcome.areaCells||[]).length });
      return { success:true, reason:"Tüm terfi zinciri (bakır→bronz→gümüş→altın→elmas→Matrix) BAŞARILI", log };
    } else {
      if (promoOutcome.gift !== step.to) return { success:false, reason:`beklenen yeni hediye ${step.to}, bulunan ${promoOutcome.gift}`, log };
      giftPos = nineCell; // yeni hediye (r2,c2)'ye yerleşti
    }
  }
  return { success:false, reason:"beklenmeyen akış sonu", log };
}
function runAll() {
  const results = [];
  for (const shape of ALL_FIXED_SHAPES) {
    const r = constructShape(shape);
    results.push({ name: shape.name, group: shape.group, ...r });
    if (DEBUG) dlog(shape.name, r.success ? "✓" : `✗ ${r.reason}`);
  }
  return results;
}

const arg = process.argv[2] || "all";
if (arg === "chain") {
  console.log("Terfi zinciri testi: bakır+9→bronz→+9→gümüş→+9→altın→+9→elmas→+9→Matrix\n");
  const r = constructEvolutionChain();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.success ? 0 : 1);
} else if (arg === "all") {
  console.log("Stratejik şekil inşa botu — 36 sabit şekil (3-7'li bloklar) test ediliyor... [Oturum 61: b4_07 artık b4_06'nın gerçek aynası, b4_dual denemesi geri alındı]\n");
  const results = runAll();
  const success = results.filter(r=>r.success);
  const failed = results.filter(r=>!r.success);
  console.log(`✓ Başarılı: ${success.length}/${results.length}`);
  console.log(`✗ Başarısız: ${failed.length}/${results.length}\n`);
  if (failed.length) {
    console.log("── Başarısız şekiller ve nedenleri ──");
    for (const f of failed) {
      console.log(`  [${f.group}] ${f.name}: ${f.reason}`);
    }
  }
  const outPath = path.join(__dirname, "results", `strategic-shape-bot-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Detaylı sonuç: ${outPath}`);
} else {
  const shape = ALL_FIXED_SHAPES.find(s => s.name === arg);
  if (!shape) { console.error(`Şekil bulunamadı: ${arg}`); process.exit(1); }
  console.log(`Tek şekil testi: ${arg}\n`);
  process.env.DEBUG = "1";
  const r = constructShape(shape);
  console.log(JSON.stringify(r, null, 2));
}
