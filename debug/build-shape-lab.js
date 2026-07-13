#!/usr/bin/env node
/**
 * Fusion 9 — Şekil Laboratuvarı (Shape Lab) Builder
 *
 * [Oturum 33] "Oyunun ana yapısını bozmuyoruz, sadece script'teki gibi
 * hedef belirleyip bunun oyunda yapılıp yapılamayacağını anlamak,
 * bunu da tahtada butonlarla çalışmasını sağlamak" isteğine cevap.
 *
 * debug/benchmark/build-headless-engine.js İLE AYNI mantıkla (aynı
 * manifest.js sırası, aynı PURE_ENGINE_END_LINE kesimi, aynı dosya
 * atlamaları) ama Node.js stub'ları YERİNE gerçek tarayıcı DOM'unu
 * kullanan bir HTML dosyası üretir. core/, engine/, rules/, economy/
 * dosyalarına HİÇBİR SATIR eklenmez/değiştirilmez — sadece OKUNUR ve
 * bir HTML kabuğuna gömülür, üzerine YENİ (bu dosyaya özel) bir
 * interaktif kontrol paneli eklenir.
 *
 * ÇIKTI: debug/shape-lab.html (git'e eklenebilir, statik dosya —
 * tarayıcıda doğrudan açılabilir, sunucu gerekmez)
 *
 * KULLANIM: node debug/build-shape-lab.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "shape-lab.html");
const MANIFEST = require(path.join(ROOT, "build/manifest.js"));
const PURE_ENGINE_END_LINE = 352; // debug/benchmark/build-headless-engine.js ile AYNI (bkz. oradaki not)

function buildEngineScript() {
  const parts = [];
  for (const rel of MANIFEST) {
    if (rel === "debug/debug.js") continue;
    if (rel.startsWith("flow/")) continue;
    const filePath = path.join(ROOT, rel);
    let content = fs.readFileSync(filePath, "utf-8");
    if (rel === "core/game-engine.js") {
      content = content.split("\n").slice(0, PURE_ENGINE_END_LINE).join("\n");
    }
    parts.push(`\n// ===== ${rel} =====\n${content}`);
  }
  // Node stub'ları YOK (gerçek tarayıcıdayız) — sadece core/bootstrap.js'in
  // açtığı IIFE'yi kapatırken, dışarıya (window'a) ihtiyacımız olan
  // sembolleri sızdırıyoruz (module.exports yerine).
  const code = parts.join("\n") +
    `\nwindow.__F9Engine = { GameCore, generateLevel, Board, F9Bot, ALL_FIXED_SHAPES, findAllMatches, GRID, cellKey };\n})();`;
  return code;
}

const engineScript = buildEngineScript();

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Fusion 9 — Şekil Kontrol Paneli</title>
<style>
  body { background:#101010; color:#DDD; font-family: monospace; margin:0; padding:16px; font-size:13px; }
  h1 { font-size:16px; color:#8AF; margin-bottom:2px; }
  .sub { color:#888; font-size:11px; margin-bottom:16px; }
  .layout { display:flex; gap:20px; flex-wrap:wrap; }
  .board-panel { flex:0 0 auto; }
  #board { display:grid; grid-template-columns: 26px repeat(8, 48px); grid-template-rows: repeat(8, 48px) 26px; gap:1px; background:#333; padding:4px; }
  .coord-label { display:flex; align-items:center; justify-content:center; font-size:11px; color:#666; background:#181818; }
  .cell { width:48px; height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1E1E1E; color:#999; position:relative; }
  .cell .val { font-weight:700; font-size:17px; line-height:1; }
  .cell .coord { font-size:8px; color:#555; line-height:1; margin-top:2px; }
  .cell.nine .coord, .cell.gift .coord { color:#0008; }
  .cell.nine { background:#443; color:#FF0; }
  .cell.gift { background:#530; color:#FA0; }
  .cell.flash { outline: 2px solid #0F0; }
  .cell.matchpair { outline: 2px solid #3AF; outline-offset:-2px; }
  .cell.blocked { background:#611 !important; }
  .cell.blocked::after { content:'✕'; position:absolute; top:2px; right:4px; color:#F55; font-size:11px; font-weight:700; }
  .controls-panel { flex:1; min-width:360px; }
  .group-title { font-size:11px; color:#888; text-transform:uppercase; margin:10px 0 4px; }
  .btn-grid { display:flex; flex-wrap:wrap; gap:4px; }
  button.shape-btn { background:#222; border:1px solid #444; color:#BBB; padding:4px 8px; font-size:11px; cursor:pointer; font-family:monospace; }
  .btn-wrap { display:flex; flex-direction:column; align-items:center; }
  .usage-count { font-size:9px; color:#666; margin-top:1px; }
  button.shape-btn:hover { border-color:#8AF; }
  button.shape-btn.ok { border-color:#5A5; color:#5F5; }
  button.shape-btn.fail { border-color:#A55; color:#F55; }
  #chainBtn { background:#223; border:1px solid #8AF; color:#8AF; padding:8px 12px; font-size:12px; cursor:pointer; margin-bottom:8px; font-family:monospace; }
  #allBtn { background:#232; border:1px solid #8A8; color:#8F8; padding:8px 12px; font-size:12px; cursor:pointer; margin-bottom:8px; margin-left:6px; font-family:monospace; }
  #resetBtn { background:#222; border:1px solid #666; color:#AAA; padding:8px 12px; font-size:12px; cursor:pointer; margin-bottom:8px; margin-left:6px; font-family:monospace; }
  #stepRow button { background:#222; border:1px solid #666; color:#AAA; padding:6px 12px; font-size:12px; cursor:pointer; font-family:monospace; }
  #stepRow button:disabled { opacity:0.35; cursor:default; }
  #stepRow button:not(:disabled):hover { border-color:#8AF; color:#8AF; }
  #autoBtn.playing { border-color:#5A5; color:#5F5; }
  #speedRow { margin:8px 0; font-size:11px; color:#888; }
  #log { background:#0A0A0A; border:1px solid #333; padding:8px; font-size:11px; white-space:pre-wrap; max-height:480px; overflow-y:auto; margin-top:8px; line-height:1.5; }
  .ok { color:#5F5; }
  .fail { color:#F55; }
  #summary { font-size:12px; margin-top:8px; color:#BBB; }
</style>
</head>
<body>

<h1>Fusion 9 — Şekil Kontrol Paneli</h1>
<div class="sub">48 model (3'lü×10, 4'lü×16, 5'li×14, 6'lı×4, 7'li×4). Board her testte gerçek Board.fillInitial() (komşu-çakışmasız, Sudoku-tarzı) diziliminden başlıyor.</div>

<div class="layout">
  <div class="board-panel">
    <div id="board"></div>
    <div id="summary"></div>
    <div id="perf" style="font-size:10px; color:#666; margin-top:4px;">Performans: —</div>
    <div style="margin-top:6px;">
      <button id="block4Btn" style="background:#611; border:1px solid #A55; color:#F99; padding:5px 10px; font-size:11px; cursor:pointer; font-family:monospace;">Merkez 4 Hücreyi Engelle/Kaldır (x3y3,x3y4,x4y3,x4y4)</button>
    </div>
    <div id="blockedInfo" style="font-size:10px; color:#666; margin-top:4px;">Engellenmiş hücre yok.</div>
    <div id="stepRow" style="margin-top:8px;">
      <button id="backBtn" disabled>◀ Geri</button>
      <button id="fwdBtn" disabled>İleri ▶</button>
      <button id="autoBtn" disabled>▶ Otomatik</button>
      <span id="stepIndicator" style="color:#888; margin-left:8px;"></span>
    </div>
  </div>
  <div class="controls-panel">
    <button id="chainBtn">Tam Terfi Zinciri (bakır=bronz=gümüş=altın=elmas=Matrix)</button>
    <button id="allBtn">Tüm Eşleşmeleri Yap (48 model × 3, farklı konumlarda)</button>
    <button id="resetBtn">Board'u Yenile</button>
    <div id="speedRow">
      Otomatik hız: <input type="range" id="speed" min="20" max="1200" value="100"> <span id="speedVal">100ms</span>/adım
    </div>
    <div id="shapeGroups"></div>
    <div id="log">Bir model seç...</div>
  </div>
</div>

<script>
${engineScript}
</script>
<script>
(function(){
  const { GameCore, ALL_FIXED_SHAPES, GRID, cellKey } = window.__F9Engine;


  // ============================================================
  // 48 MODEL LİSTESİ: 36 sabit şekil (ALL_FIXED_SHAPES) + 12 çizgi
  // varyasyonu (LINE_3/4/5_H/V × spawn ofsetleri) — kullanıcının
  // saydığı 10+16+14+4+4=48 ile BİREBİR.
  // ============================================================
  const LINE_MODELS = [];
  const L3H=[[0,0],[0,1],[0,2]], L3V=[[0,0],[1,0],[2,0]];
  const L4H=[[0,0],[0,1],[0,2],[0,3]], L4V=[[0,0],[1,0],[2,0],[3,0]];
  const L5H=[[0,0],[0,1],[0,2],[0,3],[0,4]], L5V=[[0,0],[1,0],[2,0],[3,0],[4,0]];
  for (const off of [0,1,2]) LINE_MODELS.push({ name:'line3_h_'+off, baseName:'line3_h', group:'a', cells:L3H, spawn:L3H[off] });
  for (const off of [0,1,2]) LINE_MODELS.push({ name:'line3_v_'+off, baseName:'line3_v', group:'a', cells:L3V, spawn:L3V[off] });
  for (const off of [1,2])   LINE_MODELS.push({ name:'line4_h_'+off, baseName:'line4_h', group:'b', cells:L4H, spawn:L4H[off] });
  for (const off of [1,2])   LINE_MODELS.push({ name:'line4_v_'+off, baseName:'line4_v', group:'b', cells:L4V, spawn:L4V[off] });
  LINE_MODELS.push({ name:'line5_h_2', baseName:'line5_h', group:'c', cells:L5H, spawn:L5H[2] });
  LINE_MODELS.push({ name:'line5_v_2', baseName:'line5_v', group:'c', cells:L5V, spawn:L5V[2] });

  const ALL_MODELS = [...ALL_FIXED_SHAPES, ...LINE_MODELS];
  // beklenen: 36 + 12 = 48

  // ============================================================
  // BOARD GÖRSEL (sade — renk/animasyon önemli değil, kontrol paneli)
  // ============================================================
  const boardEl = document.getElementById('board');
  const cellEls = {};
  // [Oturum 41 — kullanıcı isteği] Engellenmiş hücreler — hedef VEYA
  // donor olarak KULLANILAMAZ, algoritmanın bunları atlayıp board'un
  // BAŞKA bölgelerini kullanıp kullanamadığını test etmek için.
  const blockedCells = new Set();
  // [Oturum 38 — kullanıcı kararı] Üst sütun başlıkları KALDIRILDI —
  // her hücre zaten kendi koordinatını gösteriyor, üstte tekrar yazmaya
  // gerek yok. Sadece SOL (satır) ve ALT (sütun) etiketleri kalıyor.
  // [Oturum 37 — kullanıcı kararı] Satırlar TERS sırada çiziliyor —
  // r=7 en üstte, r=0 en altta — matematik ekseni gibi "0 altta, yukarı
  // doğru artıyor" görünsün diye. SADECE görsel DOM sırası değişti;
  // cellEls hâlâ GERÇEK (r,c) ile anahtarlanıyor, board.getCell(r,c),
  // log'lar, flashPair vb. HİÇBİRİ değişmedi — gerçek oyunun kendi
  // (r,c) tanımıyla (r=0 üst satır) hâlâ birebir aynı, sadece BURADA
  // (laboratuvar aracında) ekranda ters sırayla gösteriliyor.
  for (let r=GRID-1; r>=0; r--) {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'coord-label';
    rowLabel.textContent = r;
    boardEl.appendChild(rowLabel);
    for (let c=0;c<GRID;c++) {
      const d = document.createElement('div');
      d.className = 'cell';
      d.id = 'cell-'+r+'-'+c;
      d.innerHTML = '<span class="val"></span><span class="coord">x'+c+' y'+r+'</span>';
      d.style.cursor = 'pointer';
      d.title = 'Tıkla: engelle/kaldır';
      d.addEventListener('click', () => toggleBlocked(r,c));
      boardEl.appendChild(d);
      cellEls[r+','+c] = d;
    }
  }
  // [YENİ] Alt sütun başlıkları (0-7) — üsttekiyle simetrik
  {
    const cornerBottom = document.createElement('div');
    cornerBottom.className = 'coord-label';
    boardEl.appendChild(cornerBottom);
    for (let c=0;c<GRID;c++) {
      const d = document.createElement('div');
      d.className = 'coord-label';
      d.textContent = c;
      boardEl.appendChild(d);
    }
  }
  function renderBoard(gc) {
    for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) {
      const el = cellEls[r+','+c];
      const valEl = el.querySelector('.val');
      const gift = gc.gifts.get(cellKey(r,c));
      const val = gc.board.getCell(r,c);
      if (gift) { valEl.textContent = gift.giftType[0].toUpperCase(); el.className = 'cell gift'; }
      else { valEl.textContent = val===null ? '' : val; el.className = 'cell' + (val===9 ? ' nine' : ''); }
      if (blockedCells.has(r+','+c)) el.classList.add('blocked'); // [Oturum 41] engel görseli her render'da korunur
    }
  }
  function toggleBlocked(r,c) {
    const k = r+','+c;
    if (blockedCells.has(k)) blockedCells.delete(k); else blockedCells.add(k);
    cellEls[k].classList.toggle('blocked', blockedCells.has(k));
    updateBlockedSummary();
  }
  function updateBlockedSummary() {
    const el = document.getElementById('blockedInfo');
    if (!el) return;
    if (blockedCells.size === 0) { el.textContent = 'Engellenmiş hücre yok.'; return; }
    const list = [...blockedCells].map(k => { const [r,c]=k.split(',').map(Number); return 'x'+c+'y'+r; }).join(', ');
    el.textContent = blockedCells.size + ' hücre engellenmiş: ' + list;
  }
  function flashCell(r,c) {
    const el = cellEls[r+','+c];
    el.classList.add('flash');
    setTimeout(()=>el.classList.remove('flash'), 300);
  }
  function flashPair(r1,c1,r2,c2) {
    // [YENİ — kullanıcı isteği] Eşleşen iki hücreyi (donor + hedef)
    // MAVİ ÇERÇEVEYLE işaretle — hangi hücrelerin birleştiği net görünsün.
    // renderBoard() className'i her adımda sıfırladığı için, bir SONRAKİ
    // adımın render()'ına kadar görünür kalır (ekstra timeout gerekmez).
    cellEls[r1+','+c1].classList.add('matchpair');
    cellEls[r2+','+c2].classList.add('matchpair');
  }
  const log = document.getElementById('log');
  function writeLog(text, cls) {
    const line = document.createElement('div');
    if (cls) line.innerHTML = '<span class="'+cls+'">'+text+'</span>';
    else line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }
  function clearLog() { log.innerHTML = ''; }

  let speedMs = 100; // [Oturum 41] kullanıcı isteğiyle 3x hızlandırıldı (eskiden 300)
  document.getElementById('speed').addEventListener('input', e => {
    speedMs = parseInt(e.target.value);
    document.getElementById('speedVal').textContent = speedMs + 'ms';
  });
  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  // ============================================================
  // GERÇEK BOARD ÜRETİMİ — GameCore constructor'ı zaten board.fillInitial()
  // çağırıyor (komşu-çakışmasız + "9-dostu" ağırlıklı seçim — Sudoku-tarzı
  // dizilim, bkz. core/Board.js pickValueAvoidingNeighbors()). Artık
  // suni "hepsini 2 yap" dolgusu YOK — gerçek oyun board'u ne üretiyorsa o.
  // ============================================================
  function makeRealGC() {
    const gc = new GameCore({ seed: Date.now()%1000000, blockerLayout:null, moves:999, targetScore:999999 });
    gc.gifts.clear(); gc.hourglasses.clear(); gc.elements.clear();
    gc.movesLimit = null;
    return gc;
  }

  // ============================================================
  // İNŞA MANTIĞI — hücreyi 9 yapmak için ÖNCE komşularında GERÇEKTEN
  // 9 üretecek bir değer var mı bakılıyor (suni enjeksiyon YOK); yoksa
  // (Sudoku dizilimi doğası gereği nadiren) komşu değeri ayarlanıyor
  // ve bu log'da AÇIKÇA belirtiliyor.
  // ============================================================
  function findNaturalDonor(gc, r, c, excludeSet, shapeCellSet) {
    const targetVal = gc.board.getCell(r,c);
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of deltas) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
      const k = nr+','+nc;
      if (excludeSet.has(k)) continue;
      if (shapeCellSet && shapeCellSet.has(k)) continue; // [DÜZELTME] şekil hücresi (özellikle zaten 9 olan) ASLA donor olamaz — donor kullanılınca refill ile 9'luğunu kaybeder
      if (blockedCells.has(k)) continue; // [Oturum 41] engellenmiş hücre donor olarak KULLANILAMAZ
      const donorVal = gc.board.getCell(nr,nc);
      if (donorVal===null) continue;
      const ops = GameCore.validOps(donorVal, targetVal);
      if (ops.some(o=>o.value===9)) return { pos:[nr,nc], val:donorVal, natural:true };
    }
    return null;
  }
  function findAnyExternalNeighbor(r, c, shapeCellSet, excludeSet) {
    const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of deltas) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
      const k = nr+','+nc;
      if (shapeCellSet.has(k) || excludeSet.has(k)) continue;
      if (blockedCells.has(k)) continue; // [Oturum 41] engellenmiş hücre donor olarak KULLANILAMAZ
      return [nr,nc];
    }
    return null;
  }
  function swapCellToNine(gc, targetR, targetC, donorRC, forceVal) {
    const [dr,dc] = donorRC;
    const targetVal = gc.board.getCell(targetR, targetC);
    let usedForced = false;
    if (forceVal !== undefined) {
      gc.board.cells[dr][dc] = forceVal;
      usedForced = true;
    }
    const donorVal = gc.board.getCell(dr,dc);
    const ops = GameCore.validOps(donorVal, targetVal);
    if (!ops.some(o=>o.value===9)) return { ok:false, reason:'validOps 9 üretmiyor' };
    const outcome = gc.applyPlayerMove(dr,dc,targetR,targetC,9);
    return { ok:true, outcome, donorVal, targetVal, forced:usedForced };
  }
  function hasUnwantedMatch(outcome, expectedName) {
    for (const ev of (outcome.chain||[])) if (ev.match && ev.match.shapeName !== expectedName) return ev.match.shapeName;
    return null;
  }
  function hasExpectedMatch(outcome, expectedName, expectedSpawnAbs) {
    for (const ev of (outcome.chain||[])) {
      if (!ev.match || ev.match.shapeName !== expectedName) continue;
      if (expectedSpawnAbs) {
        if (ev.match.spawn[0]!==expectedSpawnAbs[0] || ev.match.spawn[1]!==expectedSpawnAbs[1]) continue; // [DÜZELTME] çizgi modellerinde aynı shapeName farklı spawn ofsetlerinde de eşleşebilir — TAM spawn konumu da doğrulanmalı
      }
      return ev.match;
    }
    return null;
  }
  function permutations(arr) {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i=0;i<arr.length;i++) {
      const rest = [...arr.slice(0,i), ...arr.slice(i+1)];
      for (const p of permutations(rest)) result.push([arr[i], ...p]);
    }
    return result;
  }

  function tryOrderOnGC(gc, order, shapeCellSet, matchName, expectedSpawnAbs) {
    const usedDonors = new Set(); const setCells = new Set();
    const matchLog = [];
    for (let i=0;i<order.length;i++) {
      const [r,c] = order[i];
      const isLast = (i === order.length-1);

      // 1) Doğal komşuda uygun değer ara (enjeksiyon YOK)
      let picked = findNaturalDonor(gc, r, c, usedDonors, shapeCellSet);
      let donor, forced;
      if (picked) {
        donor = picked.pos;
      } else {
        // 2) Doğal yoksa: harici bir komşuyu bul ve değerini ayarla (belirtilerek)
        donor = findAnyExternalNeighbor(r, c, shapeCellSet, usedDonors) ||
                [...shapeCellSet].map(k=>k.split(',').map(Number)).find(([nr,nc])=>!setCells.has(nr+','+nc) && Math.abs(nr-r)+Math.abs(nc-c)===1 && !(nr===r&&nc===c));
        if (!donor) return { success:false, reason:'donor bulunamadı ('+r+','+c+')', matchLog };
        forced = 9 - gc.board.getCell(r,c);
        if (forced<1||forced>8) return { success:false, reason:'uygun donor değeri yok', matchLog };
      }
      usedDonors.add(donor[0]+','+donor[1]);

      // [ÇİZGİ MODELLERİ İÇİN] gc.lastMovePos, findLineMatches()'in hangi
      // spawn ofsetini seçeceğini belirliyor — son hamlede TAM istenen
      // spawn hücresine denk gelmesi için, SON adımda hedef hücrenin
      // KENDİSİ zaten lastMovePos olacak (applyPlayerMove bunu otomatik
      // ayarlıyor, bkz. core/GameCore.js "normal" dalı).
      // [Oturum 39 — KRİTİK DÜZELTME] Snapshot'ı BURADA, GERÇEK inşa
      // sırasında, AYNI board üzerinde alıyoruz — eskiden bu adımlar
      // sonradan YENİ (farklı seed'li, farklı değerli) bir board'da
      // "tekrar oynatılıyordu", bu da log'daki sayılarla ekrandaki
      // sayıların TUTMAMASINA yol açıyordu (kullanıcı bulgusu:
      // "(x4 y3)=4 diyor ama tahtada 1 yazıyor").
      const beforeSnap = cloneSnapshot(gc);
      const result = swapCellToNine(gc, r, c, donor, forced);
      if (!result.ok) return { success:false, reason:result.reason, matchLog };
      const afterSnap = cloneSnapshot(gc);
      setCells.add(r+','+c);
      matchLog.push({ cell:[r,c], targetVal:result.targetVal, donor, donorVal:result.donorVal, natural:!result.forced, outcome:result.outcome, beforeSnap, afterSnap });

      if (isLast) {
        const found = hasExpectedMatch(result.outcome, matchName, expectedSpawnAbs);
        if (!found) {
          const chainNames = (result.outcome.chain||[]).map(ev=>ev.match && (ev.match.shapeName+'@'+ev.match.spawn)).filter(Boolean);
          return { success:false, reason:'son hamlede hedef oluşmadı (oluşan: '+chainNames.join(',')+')', matchLog };
        }
        return { success:true, matchLog, finalMatch:found, finalOutcome:result.outcome };
      } else {
        const unwanted = hasUnwantedMatch(result.outcome, matchName);
        if (unwanted) return { success:false, reason:'istenmeyen erken eşleşme: '+unwanted, matchLog };
        if (hasExpectedMatch(result.outcome, matchName, expectedSpawnAbs)) return { success:false, reason:'hedef erken oluştu', matchLog };
      }
    }
    return { success:false, reason:'beklenmeyen akış sonu', matchLog };
  }

  function constructModel(modelDef, baseR, baseC) {
    const cellsAbs = modelDef.cells.map(([dr,dc]) => [baseR+dr, baseC+dc]);
    for (const [r,c] of cellsAbs) if (r<0||r>=GRID||c<0||c>=GRID) return { success:false, reason:'board dışı' };
    // [Oturum 41 — kullanıcı isteği] Engellenmiş hücrelerle çakışan bir
    // konum hiç denenmesin — algoritma bu pozisyonu tamamen reddetsin.
    for (const [r,c] of cellsAbs) if (blockedCells.has(r+','+c)) return { success:false, reason:'hedef hücreler engellenmiş bölgeyle çakışıyor' };
    const shapeCellSet = new Set(cellsAbs.map(([r,c])=>r+','+c));
    const matchName = modelDef.baseName || modelDef.name; // çizgi modellerinde motor HER ZAMAN taban ismi (örn. "line3_h") döndürür
    const isLineModel = !!modelDef.baseName;
    const expectedSpawnAbs = isLineModel ? [baseR+modelDef.spawn[0], baseC+modelDef.spawn[1]] : null;
    // [ÇİZGİ MODELLERİ] Doğru spawn'ı garantilemek için hedef spawn
    // hücresi HER ZAMAN sıralamanın SON elemanı olmalı (findLineMatches
    // lastMovePos'u kullanıyor — bkz. yukarıdaki not).
    let orderCandidates;
    if (isLineModel) {
      const spawnCell = expectedSpawnAbs;
      const rest = cellsAbs.filter(([r,c]) => !(r===spawnCell[0]&&c===spawnCell[1]));
      orderCandidates = permutations(rest).map(p => [...p, spawnCell]);
    } else {
      orderCandidates = permutations(cellsAbs);
    }
    let lastFail = null, tried = 0;
    for (const order of orderCandidates) {
      if (tried++ >= 400) break; // [Oturum 40 — performans] 5040→400: gerçek başarılar hep ilk birkaç denemede bulunuyor, sadece b4_07 gibi YAPISAL OLARAK imkansız şekiller tüm denemeleri tüketiyordu (48×3'lük toplu koşuda 32sn'ye mal oluyordu)
      const gc = makeRealGC(); // HER denemede TAZE, GERÇEK dizilimli board
      const r = tryOrderOnGC(gc, order, shapeCellSet, matchName, expectedSpawnAbs);
      if (r.success) { r.gc = gc; return r; }
      lastFail = r;
    }
    return { success:false, reason: tried+' sıralamanın hiçbiri başarılı olmadı: '+(lastFail&&lastFail.reason) };
  }

  // ============================================================
  // ADIM ANLIK GÖRÜNTÜLERİ — İleri/Geri navigasyonu için. Her adımda
  // board+hediye durumu KLONLANIP saklanıyor; ileri/geri sadece bu
  // önceden hesaplanmış anlık görüntüler arasında gezmek (gerçek hamle
  // TEKRAR uygulanmıyor, sadece görüntüleniyor).
  // ============================================================
  function cloneSnapshot(gc) {
    return {
      cells: gc.board.cells.map(row => row.slice()),
      gifts: new Map(gc.gifts),
    };
  }
  function snapshotToRenderable(snap) {
    return { board: { getCell: (r,c) => snap.cells[r][c] }, gifts: snap.gifts };
  }

  let currentSteps = []; // [{ snapshot, logLine, logCls, pair:[r,c,dr,dc]|null }]
  let currentIndex = 0;
  let autoPlaying = false;

  const backBtn = document.getElementById('backBtn');
  const fwdBtn = document.getElementById('fwdBtn');
  const autoBtn = document.getElementById('autoBtn');
  const stepIndicator = document.getElementById('stepIndicator');

  function renderStep(i) {
    if (i<0 || i>=currentSteps.length) return;
    currentIndex = i;
    const step = currentSteps[i];
    renderBoard(snapshotToRenderable(step.snapshot));
    if (step.pair) flashPair(step.pair[0], step.pair[1], step.pair[2], step.pair[3]);
    clearLog();
    for (let j=0; j<=i; j++) {
      if (currentSteps[j].logLine) writeLog(currentSteps[j].logLine, currentSteps[j].logCls);
    }
    stepIndicator.textContent = 'Adım ' + i + '/' + (currentSteps.length-1);
    backBtn.disabled = (i<=0);
    fwdBtn.disabled = (i>=currentSteps.length-1);
    autoBtn.disabled = (i>=currentSteps.length-1) && !autoPlaying;
  }

  backBtn.onclick = () => { stopAuto(); renderStep(currentIndex-1); };
  fwdBtn.onclick = () => { stopAuto(); renderStep(currentIndex+1); };
  function stopAuto() { autoPlaying = false; autoBtn.textContent = '▶ Otomatik'; autoBtn.classList.remove('playing'); }
  autoBtn.onclick = async () => {
    if (autoPlaying) { stopAuto(); return; }
    autoPlaying = true;
    autoBtn.textContent = '⏸ Durdur';
    autoBtn.classList.add('playing');
    while (autoPlaying && currentIndex < currentSteps.length-1) {
      renderStep(currentIndex+1);
      await sleep(speedMs);
    }
    if (autoPlaying) stopAuto();
  };

  // matchLog (constructModel çıktısı) -> adım anlık görüntüleri.
  // NOT: matchLog AYRI bir gc'de üretildi — burada aynı adımları TAZE
  // bir board üzerinde (aynı hücre/donor konumları, aynı değerler)
  // tekrar uyguluyoruz ki her adımın GERÇEK snapshot'ı alınabilsin.
  function fmtXY(r,c) { return 'x'+c+' y'+r; }

  function buildStepsFromMatchLog(matchLog, finalMatch, introLine) {
    const steps = [];
    // İlk adım (hiç hamle yapılmadan önceki board) — matchLog'un İLK
    // kaydının "beforeSnap"i TAM olarak budur (gerçek inşa sırasında
    // yakalandı, aynı board).
    const introSnap = matchLog.length ? matchLog[0].beforeSnap : cloneSnapshot(makeRealGC());
    steps.push({ snapshot: introSnap, logLine: introLine, pair: null });
    for (const step of matchLog) {
      const [r,c] = step.cell;
      const [dr,dc] = step.donor;
      const tag = step.natural ? '(doğal)' : '(ayarlandı)';

      // [Oturum 38/39] EŞLEŞME fazı: değerler henüz DEĞİŞMEDİ — bu adımın
      // KENDİ "beforeSnap"i kullanılıyor (gerçek inşa anında yakalandı).
      const matchLine = 'EŞLEŞME: HEDEF (' + fmtXY(r,c) + ')=' + step.targetVal + ' + donor (' + fmtXY(dr,dc) + ')=' + step.donorVal + ' ' + tag;
      steps.push({ snapshot: step.beforeSnap, logLine: matchLine, pair: [r,c,dr,dc] });

      // SONUÇ fazı: bu adımın "afterSnap"i.
      const resultLine = 'SONUÇ: (' + fmtXY(r,c) + ') = 9';
      steps.push({ snapshot: step.afterSnap, logLine: resultLine, pair: [r,c,dr,dc] });
    }
    if (finalMatch && matchLog.length) {
      const cellsStr = finalMatch.cells.map(([r,c])=>'('+fmtXY(r,c)+')').join(' ');
      const logLine = 'ŞEKİL SONUCU: ' + finalMatch.shapeName + ' | hücreler: ' + cellsStr + ' | spawn: (' + fmtXY(finalMatch.spawn[0],finalMatch.spawn[1]) + ')';
      steps.push({ snapshot: matchLog[matchLog.length-1].afterSnap, logLine, pair:null, resultCls:'ok' });
    }
    return { steps };
  }

  // ============================================================
  // BUTON PANELİ (48 model) — her butonun altında kaç kez BAŞARILI
  // inşa edildiği sayacı var (kullanıcı isteği).
  // ============================================================
  const groupNames = { a:"3'lü", b:"4'lü", c:"5'li", d:"6'lı", e:"7'li" };
  const groupsEl = document.getElementById('shapeGroups');
  const byGroup = {};
  for (const m of ALL_MODELS) { (byGroup[m.group] = byGroup[m.group]||[]).push(m); }
  const buttonsByName = {};
  const usageCountEls = {};
  const usageCount = {}; // modelName -> kaç kez başarıyla inşa edildi
  for (const m of ALL_MODELS) usageCount[m.name] = 0;
  function bumpUsage(name) {
    usageCount[name] = (usageCount[name]||0) + 1;
    if (usageCountEls[name]) usageCountEls[name].textContent = usageCount[name] + '×';
  }
  for (const g of ['a','b','c','d','e']) {
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = groupNames[g] + ' (' + (byGroup[g]||[]).length + ' model)';
    groupsEl.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'btn-grid';
    for (const model of (byGroup[g]||[])) {
      const wrap = document.createElement('div');
      wrap.className = 'btn-wrap';
      const btn = document.createElement('button');
      btn.className = 'shape-btn';
      btn.textContent = model.name;
      btn.onclick = () => runModelTest(model);
      wrap.appendChild(btn);
      const count = document.createElement('div');
      count.className = 'usage-count';
      count.textContent = '0×';
      wrap.appendChild(count);
      grid.appendChild(wrap);
      buttonsByName[model.name] = btn;
      usageCountEls[model.name] = count;
    }
    groupsEl.appendChild(grid);
  }
  document.querySelector('.sub').textContent += ' [Yüklenen model sayısı: ' + ALL_MODELS.length + ']';

  let busy = false;
  // [Oturum 41] Performans takibi
  const perfStats = { count:0, totalMs:0, lastMs:0 };
  function recordPerf(ms) {
    perfStats.count++; perfStats.totalMs += ms; perfStats.lastMs = ms;
    const avg = perfStats.totalMs/perfStats.count;
    document.getElementById('perf').textContent =
      'Performans: son=' + ms.toFixed(1) + 'ms | ortalama=' + avg.toFixed(1) + 'ms | toplam=' + perfStats.count + ' çalıştırma';
  }

  // [Oturum 41] Varsayılan konum (3,3) engellenmiş/başarısız olursa
  // board'un DİĞER bölgelerini (pickPositions'ın 5 sabit konumu)
  // otomatik dener — "algoritma başka hücrelerde çalışıyor mu" testi.
  function constructModelAdaptive(modelDef) {
    const t0 = performance.now();
    const attempts = []; // [{pos:[r,c], success, reason, blocked}]
    const cellsOverlapBlocked = (br,bc) => modelDef.cells.some(([dr,dc]) => blockedCells.has((br+dr)+','+(bc+dc)));

    let result = constructModel(modelDef, 3, 3);
    attempts.push({ pos:[3,3], success:result.success, reason: result.success?null:result.reason, blocked: cellsOverlapBlocked(3,3) });
    let usedPos = [3,3];
    if (!result.success) {
      for (const [br,bc] of pickPositions(modelDef, 5)) {
        if (br===3 && bc===3) continue; // zaten denendi
        const r = constructModel(modelDef, br, bc);
        attempts.push({ pos:[br,bc], success:r.success, reason: r.success?null:r.reason, blocked: cellsOverlapBlocked(br,bc) });
        if (r.success) { result = r; usedPos = [br,bc]; break; }
      }
    }
    const elapsed = performance.now() - t0;
    return { result, usedPos, elapsed, attempts };
  }
  // [Oturum 42 — kullanıcı isteği] Deneme geçmişini OKUNABİLİR log'a çevirir:
  // hangi konum denendi, engelliydi mi, başarısızsa NEDEN.
  function formatAttempts(attempts) {
    return attempts.map(a => {
      const posStr = 'x' + a.pos[1] + ' y' + a.pos[0];
      if (a.success) return '  ✓ (' + posStr + ') BAŞARILI';
      const blockedNote = a.blocked ? ' [ENGELLİ HÜCREYLE ÇAKIŞIYOR]' : '';
      return '  ✗ (' + posStr + ')' + blockedNote + ': ' + a.reason;
    }).join('\\n');
  }

  async function runModelTest(modelDef) {
    if (busy) return;
    busy = true;
    stopAuto();
    clearLog();
    document.getElementById('summary').textContent = 'Hesaplanıyor...';
    await sleep(10);
    const { result, usedPos, elapsed, attempts } = constructModelAdaptive(modelDef);
    recordPerf(elapsed);
    const posNote = (usedPos[0]!==3||usedPos[1]!==3) ? ' [ALTERNATİF konum: x'+usedPos[1]+' y'+usedPos[0]+' — varsayılan (x3 y3) engellenmiş/başarısızdı]' : '';
    const attemptsBlock = attempts.length>1 ? '\\nDenenen konumlar:\\n' + formatAttempts(attempts) : '';
    if (result.success) {
      buttonsByName[modelDef.name].className = 'shape-btn ok';
      bumpUsage(modelDef.name);
      document.getElementById('summary').innerHTML = modelDef.name + ' <span class="ok">İNŞA EDİLEBİLİR</span>' + posNote;
      const built = buildStepsFromMatchLog(result.matchLog, result.finalMatch, 'Model: ' + modelDef.name + ' (grup ' + modelDef.group + ')' + posNote + attemptsBlock);
      currentSteps = built.steps;
      renderStep(0);
    } else {
      buttonsByName[modelDef.name].className = 'shape-btn fail';
      currentSteps = [{ snapshot: cloneSnapshot(makeRealGC()), logLine: 'Model: ' + modelDef.name + ' (grup ' + modelDef.group + ')\\nBAŞARISIZ (varsayılan VE tüm alternatif konumlarda)' + attemptsBlock, logCls:'fail', pair:null }];
      renderStep(0);
      document.getElementById('summary').innerHTML = modelDef.name + ' <span class="fail">İNŞA EDİLEMEDİ</span>';
    }
    busy = false;
  }

  // ============================================================
  // TERFİ ZİNCİRİ — tüm adımlar TEK bir steps dizisinde birleştirilir
  // ============================================================
  document.getElementById('chainBtn').onclick = async () => {
    if (busy) return;
    busy = true;
    stopAuto();
    clearLog();
    document.getElementById('summary').textContent = 'Hesaplanıyor...';
    await sleep(10);
    const chainT0 = performance.now();

    const kkose1 = ALL_FIXED_SHAPES.find(s => s.name === 'kkose_1');
    const baseR=3, baseC=3;
    const r1 = constructModel(kkose1, baseR, baseC);
    if (!r1.success) {
      currentSteps = [{ snapshot: cloneSnapshot(makeRealGC()), logLine: 'Terfi zinciri: bakır=bronz=gümüş=altın=elmas=Matrix\\nBakır üretimi başarısız: ' + r1.reason, logCls:'fail', pair:null }];
      renderStep(0);
      document.getElementById('summary').innerHTML = '<span class="fail">BAŞARISIZ (bakır)</span>';
      busy = false; return;
    }
    bumpUsage('kkose_1');
    const built = buildStepsFromMatchLog(r1.matchLog, r1.finalMatch, 'Terfi zinciri: bakır=bronz=gümüş=altın=elmas=Matrix');
    const steps = built.steps;
    const gc = r1.gc; // [Oturum 39 DÜZELTMESİ] gerçek, inşa sırasında kullanılan gc — yeniden oluşturulmuş DEĞİL
    let giftPos = [baseR+kkose1.spawn[0], baseC+kkose1.spawn[1]];
    document.getElementById('summary').innerHTML = 'Bakır üretildi <span class="ok">✓</span> — terfi zinciri başlıyor...';
    await sleep(0);

    const chainSteps = [ {from:'bakir',to:'bronz'}, {from:'bronz',to:'gumus'}, {from:'gumus',to:'altin'}, {from:'altin',to:'elmas'}, {from:'elmas',to:'matrix'} ];
    const usedCells = new Set(kkose1.cells.map(([dr,dc])=>(baseR+dr)+','+(baseC+dc)));
    let ok = true;
    for (const step of chainSteps) {
      const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
      let nineCell = null;
      for (const [dr,dc] of deltas) {
        const nr=giftPos[0]+dr, nc=giftPos[1]+dc;
        if (nr<0||nr>=GRID||nc<0||nc>=GRID) continue;
        const k = nr+','+nc;
        if (usedCells.has(k)) continue;
        nineCell = [nr,nc]; break;
      }
      if (!nineCell) { steps.push({snapshot:cloneSnapshot(gc), logLine:step.from+'+9 için komşu bulunamadı', logCls:'fail', pair:null}); document.getElementById('summary').innerHTML = step.from+'+9 aşamasında <span class="fail">TAKILDI</span> (komşu hücre yok)'; ok=false; break; }
      const giftCellSet = new Set([giftPos[0]+','+giftPos[1]]);
      const natural = findNaturalDonor(gc, nineCell[0], nineCell[1], usedCells, giftCellSet);
      let donor, forced;
      if (natural) { donor = natural.pos; }
      else {
        donor = findAnyExternalNeighbor(nineCell[0], nineCell[1], giftCellSet, usedCells);
        if (!donor) { steps.push({snapshot:cloneSnapshot(gc), logLine:step.from+'+9: donor bulunamadı', logCls:'fail', pair:null}); document.getElementById('summary').innerHTML = step.from+'+9 aşamasında <span class="fail">TAKILDI</span> (donor yok)'; ok=false; break; }
        forced = 9 - gc.board.getCell(nineCell[0], nineCell[1]);
      }
      usedCells.add(donor[0]+','+donor[1]); usedCells.add(nineCell[0]+','+nineCell[1]);

      const targetVal = gc.board.getCell(nineCell[0], nineCell[1]);
      const donorVal = forced!==undefined ? forced : gc.board.getCell(donor[0],donor[1]);
      const tag = forced!==undefined ? '(ayarlandı)' : '(doğal)';
      // [Oturum 38] EŞLEŞME fazı (değerler henüz değişmedi)
      steps.push({ snapshot: cloneSnapshot(gc), pair:[nineCell[0],nineCell[1],donor[0],donor[1]],
        logLine: 'EŞLEŞME: HEDEF (' + fmtXY(nineCell[0],nineCell[1]) + ')=' + targetVal + ' + donor (' + fmtXY(donor[0],donor[1]) + ')=' + donorVal + ' ' + tag });
      if (forced!==undefined) gc.board.cells[donor[0]][donor[1]] = forced;
      gc.applyPlayerMove(donor[0], donor[1], nineCell[0], nineCell[1], 9);
      // [Oturum 38] SONUÇ fazı (hedef artık 9)
      steps.push({ snapshot: cloneSnapshot(gc), pair:[nineCell[0],nineCell[1],donor[0],donor[1]],
        logLine: 'SONUÇ: (' + fmtXY(nineCell[0],nineCell[1]) + ') = 9' });

      // [Oturum 38] Terfi hamlesi de EŞLEŞME+SONUÇ olarak ikiye bölünüyor
      steps.push({ snapshot: cloneSnapshot(gc), pair:[giftPos[0],giftPos[1],nineCell[0],nineCell[1]],
        logLine: 'EŞLEŞME: ' + step.from + ' hediyesi (' + fmtXY(giftPos[0],giftPos[1]) + ') + 9 (' + fmtXY(nineCell[0],nineCell[1]) + ') → terfi tetikleniyor' });
      const promo = gc.applyPlayerMove(giftPos[0], giftPos[1], nineCell[0], nineCell[1], null);
      if (promo.kind !== 'promotion') {
        steps.push({ snapshot: cloneSnapshot(gc), pair:[giftPos[0],giftPos[1],nineCell[0],nineCell[1]], logLine: 'SONUÇ: ' + step.from + '+9 → "promotion" değil: '+promo.kind, logCls:'fail' });
        document.getElementById('summary').innerHTML = step.from+'+9 aşamasında <span class="fail">TAKILDI</span> ("'+promo.kind+'" döndü, "promotion" bekleniyordu)';
        ok=false; break;
      }
      if (step.to === 'matrix') {
        steps.push({ snapshot: cloneSnapshot(gc), pair:[giftPos[0],giftPos[1],nineCell[0],nineCell[1]],
          logLine: 'SONUÇ: elmas+9 → MATRIX EŞLEŞME | +' + promo.extraMoves + ' hamle | ' + (promo.areaCells||[]).length + ' hücre', logCls:'ok' });
        document.getElementById('summary').innerHTML = 'elmas+9 → MATRIX EŞLEŞME <span class="ok">✓</span> — tamamlanıyor...';
      } else {
        steps.push({ snapshot: cloneSnapshot(gc), pair:[giftPos[0],giftPos[1],nineCell[0],nineCell[1]],
          logLine: 'SONUÇ: ' + step.from + '+9 → ' + promo.gift + ' @ (' + fmtXY(nineCell[0],nineCell[1]) + ')', logCls:'ok' });
        giftPos = nineCell;
        // [Oturum 42 — kullanıcı isteği] CANLI aşama göstergesi — eskiden
        // zincir sessizce çalışıp SADECE sonunda "BAŞARILI/YARIM KALDI"
        // gösteriyordu, kullanıcı hangi aşamada olduğunu bilemiyordu.
        document.getElementById('summary').innerHTML = step.from + '+9 → ' + promo.gift + ' <span class="ok">✓</span> — sıradaki: ' + step.to + '...';
      }
      await sleep(0);
    }
    currentSteps = steps;
    renderStep(0);
    recordPerf(performance.now() - chainT0);
    document.getElementById('summary').innerHTML = ok ? '<span class="ok">TAM ZİNCİR BAŞARILI</span>' : '<span class="fail">ZİNCİR YARIM KALDI</span>';
    busy = false;
  };

  // ============================================================
  // TÜM EŞLEŞMELERİ YAP — 48 model × en az 3 tekrar, HER SEFERİNDE
  // board'un FARKLI bir bölgesinde (sol-üst köşe / merkez / sağ-alt
  // köşe) — sabit tek konumda sıkışıp kalmasın diye.
  // ============================================================
  function pickPositions(modelDef, count) {
    const maxDr = Math.max(...modelDef.cells.map(p=>p[0]));
    const maxDc = Math.max(...modelDef.cells.map(p=>p[1]));
    const maxBaseR = GRID-1-maxDr; // şeklin sığdığı en büyük baseR
    const maxBaseC = GRID-1-maxDc;
    // [Oturum 40 — düzeltme] TAM köşe (0,0) yerine mümkünse 1 hücre
    // içeriden konumlar kullanılıyor — tam köşedeki hücrelerin sadece
    // 2 komşusu oluyor, bu da donor bulmayı zorlaştırıp başarı oranını
    // düşürüyordu (113/144). 1 içeriden başlamak hâlâ "board'un o
    // bölgesini" kullanıyor ama daha fazla komşu bırakıyor.
    const inset = (v, max) => Math.max(0, Math.min(max, v));
    const in1 = 1;
    const candidates = [
      [inset(in1,maxBaseR), inset(in1,maxBaseC)],                     // sol-üst (içeriden)
      [inset(in1,maxBaseR), inset(maxBaseC-in1,maxBaseC)],             // sağ-üst
      [inset(maxBaseR-in1,maxBaseR), inset(in1,maxBaseC)],             // sol-alt
      [inset(maxBaseR-in1,maxBaseR), inset(maxBaseC-in1,maxBaseC)],    // sağ-alt
      [Math.floor(maxBaseR/2), Math.floor(maxBaseC/2)],                // merkez
    ];
    const positions = [];
    for (let i=0;i<count;i++) positions.push(candidates[i % candidates.length]);
    return positions;
  }

  document.getElementById('allBtn').onclick = async () => {
    if (busy) return;
    busy = true;
    stopAuto();
    clearLog();
    document.getElementById('summary').textContent = 'Hesaplanıyor (48 model × 3)...';
    await sleep(10);
    const allT0 = performance.now();

    const REPS = 3;
    const steps = [];
    steps.push({ snapshot: cloneSnapshot(makeRealGC()), logLine: 'TÜM EŞLEŞMELER — ' + ALL_MODELS.length + ' model × ' + REPS + ' tekrar, board\\'un farklı bölgelerinde', pair:null });
    let okCount = 0, failCount = 0, modelIdx = 0;
    const groupStats = {}; // grup -> {ok, fail}
    for (const modelDef of ALL_MODELS) {
      modelIdx++;
      groupStats[modelDef.group] = groupStats[modelDef.group] || {ok:0, fail:0};
      const positions = pickPositions(modelDef, REPS);
      for (let rep=0; rep<REPS; rep++) {
        const [baseR, baseC] = positions[rep];
        const result = constructModel(modelDef, baseR, baseC);
        const introLine = modelDef.name + ' (grup ' + modelDef.group + ') — deneme ' + (rep+1) + '/' + REPS + ' @ konum (x' + baseC + ' y' + baseR + ')';
        if (result.success) {
          okCount++; groupStats[modelDef.group].ok++;
          bumpUsage(modelDef.name);
          const built = buildStepsFromMatchLog(result.matchLog, result.finalMatch, introLine);
          steps.push(...built.steps);
        } else {
          failCount++; groupStats[modelDef.group].fail++;
          steps.push({ snapshot: steps[steps.length-1].snapshot, logLine: introLine + '\\nBAŞARISIZ: ' + result.reason, logCls:'fail', pair:null });
        }
      }
      // [Oturum 42 — kullanıcı isteği] CANLI ilerleme — eskiden bu döngü
      // sessizce çalışıp SADECE sonunda sonuç gösteriyordu, kullanıcı
      // hiçbir aşama bilgisi göremiyordu.
      document.getElementById('summary').innerHTML =
        'İşleniyor: ' + modelIdx + '/' + ALL_MODELS.length + ' model (' + modelDef.name + ') — ' +
        '<span class="ok">' + okCount + ' ✓</span> / <span class="fail">' + failCount + ' ✗</span>';
      await sleep(0); // UI donmasın diye ara ara nefes ver
    }
    // [Oturum 42] Grup bazlı detaylı istatistik
    const groupLines = Object.entries(groupStats).map(([g,s]) =>
      '  [' + g + '] ' + groupNames[g] + ': ' + s.ok + ' başarılı, ' + s.fail + ' başarısız (' + (s.ok+s.fail) + ' toplam)'
    ).join('\\n');
    steps.push({ snapshot: steps[steps.length-1].snapshot,
      logLine: 'TOPLAM: ' + okCount + ' başarılı, ' + failCount + ' başarısız (' + ALL_MODELS.length + ' model × ' + REPS + ' = ' + (ALL_MODELS.length*REPS) + ' deneme)\\n\\nGrup bazlı döküm:\\n' + groupLines,
      logCls: failCount===0?'ok':'fail', pair:null });

    currentSteps = steps;
    renderStep(0);
    recordPerf(performance.now() - allT0);
    document.getElementById('summary').innerHTML = 'Tümü: <span class="' + (failCount===0?'ok':'fail') + '">' + okCount + '/' + (ALL_MODELS.length*REPS) + ' başarılı</span>';
    busy = false;
  };

  document.getElementById('block4Btn').onclick = () => {
    // x3y3,x3y4,x4y3,x4y4 -> (r,c): (3,3),(4,3),(3,4),(4,4)
    const targets = [[3,3],[4,3],[3,4],[4,4]];
    const allBlocked = targets.every(([r,c]) => blockedCells.has(r+','+c));
    for (const [r,c] of targets) {
      if (allBlocked) blockedCells.delete(r+','+c); else blockedCells.add(r+','+c);
      cellEls[r+','+c].classList.toggle('blocked', !allBlocked);
    }
    updateBlockedSummary();
  };

  document.getElementById('resetBtn').onclick = () => {
    stopAuto();
    const gc = makeRealGC();
    currentSteps = [{ snapshot: cloneSnapshot(gc), logLine: null, pair: null }];
    renderStep(0);
    document.getElementById('summary').textContent = '';
  };

  // Başlangıç görünümü — GERÇEK dizilim
  (function initBoard(){
    const gc = makeRealGC();
    currentSteps = [{ snapshot: cloneSnapshot(gc), logLine: null, pair: null }];
    renderStep(0);
  })();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, "utf-8");
console.log("✓ Şekil Kontrol Paneli oluşturuldu:", OUT);
console.log("  Toplam model: 48 (36 sabit şekil + 12 çizgi varyasyonu)");
console.log("  İleri/geri adım navigasyonu + otomatik oynatma eklendi.");
console.log("  Tarayıcıda doğrudan açılabilir (sunucu gerekmez).");
