// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10o] Enerji
// Harcama sistemi sabitleri ve gerçek EnergyTracker sınıfı (eski
// {energy:0, add(n){...}} basit nesnesinin yerine geçti).


const WARMUP_END_LEVEL=0;
// [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10h] Pro
// kademe yumuşatıldı: kullanıcı kararı "%70 oyuncu kazanmalı, cömert
// olmalıyız" — eski (0.75,1.10) ile pro kademe kazanma oranı sadece
// %20'ydi, yeni (1.10,0.85) ile %87'ye çıktı.
// [DÜZELTME — Oturum 13, "Level dengeleme" fazı] movesMult değerleri
// düzeltildi: "uzman" tier'i eskiden 0.85 (EN AZ hamle) veriyordu — ama
// aynı zamanda densityBase=0.55 (2. en yüksek) ve targetMult=1.00 (en
// yüksek) ile zaten en zor tierlerden biriydi. Bu, tam da en yoğun/zor
// levellerde hamleyi AZALTIYORDU (kötüleştiriyordu), "pro" tier'in
// (density=0.80, en yüksek, ama movesMult=1.10, cömert) tutarlı deseninin
// TERSİNE. zor/uzman artık pro ile tutarlı: yoğunluk arttıkça hamle de
// biraz artıyor (tamamen telafi etmiyor — hâlâ zorluk var — ama artık
// yoğun levellerde oyuncuyu cezalandırmıyor).
const DIFFICULTY_TIERS=[["kolay",1.30,0.0,0.70],["orta",1.10,0.15,0.80],["zor",1.00,0.35,0.90],["uzman",1.05,0.55,1.00],["pro",1.10,0.80,0.85]];
// [Oturum 64 — kullanıcı isteği] Öğretim müfredatı: ilk 10 bölüm (level
// 1-10, 11-20, ... 91-100), her biri TEK bir eşleşme/terfi mekanizmasına
// odaklanır. "create" = o grup boyutunda bir eşleşme yapmak DOĞRUDAN o
// hediyeyi oluşturur (GROUP_TO_GIFT, bkz. rules/evolutionRules.js).
// "promote" = var olan bir hediyeyi 9'larla haç şeklinde birleştirip bir
// üst kademeye terfi ettirmek (GIFT_PROMO_CROSS_SIZE, aynı dosya).
// features/hint/hint-system.js bu tabloyu okuyup ilgili hamleyi öncelikli
// gösteriyor; generateLevel() blocker yoğunluğunu bu bölümlerde düşürüyor
// (bkz. _tutorialDampen, aşağıda) — tahta kalabalık olmasın diye.
const TUTORIAL_CURRICULUM = {
  1:  { kind:"create",  group:"a",     label:"3'lü eşleşme → Bakır" },
  2:  { kind:"create",  group:"b",     label:"4'lü eşleşme → Bronz" },
  3:  { kind:"create",  group:"c",     label:"5'li eşleşme → Gümüş" },
  4:  { kind:"create",  group:"d",     label:"6'lı eşleşme → Altın" },
  5:  { kind:"create",  group:"e",     label:"7'li eşleşme → Elmas" },
  6:  { kind:"promote", gift:"bakir",  label:"Bakır + 9 → Bronz" },
  7:  { kind:"promote", gift:"bronz",  label:"Bronz + 9 → Gümüş" },
  8:  { kind:"promote", gift:"gumus",  label:"Gümüş + 9 → Altın" },
  9:  { kind:"promote", gift:"altin",  label:"Altın + 9 → Elmas" },
  10: { kind:"promote", gift:"elmas",  label:"Elmas + 9 → Matrix Eşleşme" },
};

// Tier'a göre hedef skor (21 hamlede 3 eşleşme kriteri)


// ── Profil Sistemi ────────────────────────────────────
const XP_PER_LEVEL = 100;
const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦝','🐼','🦄','🐉','🦋','🌟','👾'];
const PLAYER_TITLES = [
  'Acemi','Çaylak','Stajyer','Aday','Kalfa',
  'Usta','Şampiyon','Efsane','Kahraman','Titan','İlahi','FÜZYON9'
];
function getPlayerTitle(level) {
  return PLAYER_TITLES[Math.min(level-1, PLAYER_TITLES.length-1)];
}
function xpForNextLevel(level) { return level * XP_PER_LEVEL; }
function xpProgress(xp, level) {
  const base = (level-1) * XP_PER_LEVEL;
  const next = level * XP_PER_LEVEL;
  return Math.min(100, Math.round(((xp - base) / (next - base)) * 100));
}

// ── Bölüm Veritabanı ─────────────────────────────────
// Her bölüm 10 level, her level'in hedefi farklı olabilir

// Level için bölüm ve hedef bul
function getLevelGoal(levelNumber) {
  for (const ch of CHAPTER_DB) {
    const lv = ch.levels.find(l => l.level === levelNumber);
    // [Oturum 25 — name/theme dublikasyonu çözüldü] chapterName artık
    // CHAPTER_DB'nin kendi (silinmiş) kopyasından değil, WORLD_DATABASE'den
    // (content/worlds/world-metadata.js) geliyor — TEK kaynak.
    if (lv) return { ...lv, chapterName: worldForLevel(levelNumber).name, chapter: ch.chapter };
  }
  // Fallback: skor hedefi (value her zaman generateLevel()'dan senkronize edilir)
  return { level:levelNumber, goal:{type:"score"}, chapterName: worldForLevel(levelNumber).name, chapter:0 };
}

// Hedef tipi için Türkçe açıklama
function goalLabel(goal) {
  if (goal.type === "score")         return `${goal.value} puan kazan`;
  if (goal.type === "create9")       return `${goal.value} kez 9 yap`;
  if (goal.type === "giftCount")     return `${goal.value} hediye taşı oluştur`;
  if (goal.type === "breakBlockers") return `${goal.value} engeli kır`;
  return "";
}

// Hedef ikonu
function goalIcon(goal) {
  if (goal.type === "score")         return "⭐";
  if (goal.type === "create9")       return "9️⃣";
  if (goal.type === "giftCount")     return "🎁";
  if (goal.type === "breakBlockers") return "💥";
  return "🎯";
}

const TIER_TARGET_SCORE = {
  kolay:  630,  // temel: 21 hamlede 7×3'lü = 630
  orta:   900,  // +%43: daha hızlı eşleşme gerekir
  zor:    1260, // ×2 temel
  uzman:  1800, // ×2.85
  pro:    2520, // ×4: sadece büyük eşleşmelerle ulaşılır
};
const ALL_BLOCKER_TYPES=Object.keys(BLOCKER_POWER);
function tierForLevel(levelNumber){
  const n=levelNumber-WARMUP_END_LEVEL-1, cycleLength=DIFFICULTY_TIERS.length;
  const tierIndex=((n%cycleLength)+cycleLength)%cycleLength, cycleNumber=Math.floor(n/cycleLength);
  return [DIFFICULTY_TIERS[tierIndex],cycleNumber];
}
// ══════════════════════════════════════════════════════
// GEOMETRİK ENGEL DİZİLİM SİSTEMİ — Oyuncuya Endeksli
// Rastgele yerleşim yerine matematiksel desenler kullanır.
// Direktör AI, oyuncunun hangi desende zorlandığını öğrenir
// ve yoğunluğu buna göre ayarlar.
// ══════════════════════════════════════════════════════

// ── 5 bölüm teması × 4 rotasyon varyasyonu ──────────

function _rotateCell(r, c, variant) {
  const G = GRID - 1;
  if (variant === 0) return [r, c];           // 0°
  if (variant === 1) return [c, G - r];        // 90° saat yönü
  if (variant === 2) return [G - r, G - c];    // 180°
  return [G - c, r];                           // 270° (ayna)
}

// Piramit: alt satırdan üste üçgen — bölüm 1-4
function _patternPyramid(density, rng) {
  const cells = [];
  const layers = Math.max(1, Math.round(density * 5));
  for (let layer = 0; layer < layers; layer++) {
    const rowFromBottom = layer;
    const width = Math.max(1, layers * 2 - 1 - layer * 2);
    const startCol = Math.floor((GRID - width) / 2);
    for (let dc = 0; dc < width; dc++) {
      cells.push([GRID - 1 - rowFromBottom, startCol + dc]);
    }
  }
  return cells;
}

// Fibonacci sarmalı: altın oran — bölüm 5-8
function _patternFibonacci(density, rng) {
  const cells = [];
  const count = Math.max(3, Math.round(density * 13));
  const phi = (1 + Math.sqrt(5)) / 2;
  const centerR = Math.floor(GRID / 2), centerC = Math.floor(GRID / 2);
  for (let i = 0; i < count * 3; i++) {
    const angle = i * 2 * Math.PI / phi;
    const radius = Math.sqrt(i) * (density * 2 + 0.5);
    const r = Math.round(centerR + Math.sin(angle) * radius);
    const c = Math.round(centerC + Math.cos(angle) * radius);
    if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
      const k = cellKey(r, c);
      if (!cells.some(([cr, cc]) => cr === r && cc === c)) {
        cells.push([r, c]);
        if (cells.length >= count) break;
      }
    }
  }
  return cells;
}

// Asal sayı pozisyonları: hücre indeksi asal ise engel — bölüm 9-12
function _patternPrime(density, rng) {
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
  }
  const cells = [];
  const maxCount = Math.round(density * 16);
  for (let idx = 2; idx < GRID * GRID && cells.length < maxCount; idx++) {
    if (isPrime(idx)) cells.push([Math.floor(idx / GRID), idx % GRID]);
  }
  return cells;
}

// Simetrik ayna: merkeze göre X şekli — bölüm 13-16
function _patternSymmetric(density, rng) {
  const cells = [];
  const depth = Math.max(1, Math.round(density * 3.5));
  for (let d = 0; d < depth; d++) {
    const r1 = d, r2 = GRID - 1 - d;
    const c1 = d, c2 = GRID - 1 - d;
    [[r1,c1],[r1,c2],[r2,c1],[r2,c2]].forEach(([r,c]) => {
      if (!cells.some(([cr,cc]) => cr===r && cc===c)) cells.push([r,c]);
    });
  }
  // Merkez artı
  if (density > 0.3) {
    const m = Math.floor(GRID / 2);
    [[m,m],[m-1,m],[m,m-1],[m+1,m],[m,m+1]].forEach(([r,c]) => {
      if (r>=0&&r<GRID&&c>=0&&c<GRID&&!cells.some(([cr,cc])=>cr===r&&cc===c))
        cells.push([r,c]);
    });
  }
  return cells;
}

// Çapraz/X: köşelerden içe — bölüm 17-20
function _patternDiagonal(density, rng) {
  const cells = [];
  const steps = Math.max(2, Math.round(density * 5));
  for (let s = 0; s < steps; s++) {
    [[s,s],[s,GRID-1-s],[GRID-1-s,s],[GRID-1-s,GRID-1-s]].forEach(([r,c]) => {
      if (r>=0&&r<GRID&&c>=0&&c<GRID&&!cells.some(([cr,cc])=>cr===r&&cc===c))
        cells.push([r,c]);
    });
  }
  return cells;
}

// ── Ana desen seçici ────────────────────────────────
function _selectPattern(chapter, density, rng) {
  if (chapter <= 4)  return _patternPyramid(density, rng);
  if (chapter <= 8)  return _patternFibonacci(density, rng);
  if (chapter <= 12) return _patternPrime(density, rng);
  if (chapter <= 16) return _patternSymmetric(density, rng);
  return _patternDiagonal(density, rng);
}

// ── Engel tipi seçici (bölüm havuzundan) ────────────
function _pickBlockerType(density, chapter, rng) {
  const pool = allowedBlockersForChapter(chapter);
  // Yoğunluk arttıkça havuzun daha güçlü engellerini seç
  const idx = Math.min(pool.length - 1, Math.floor(density * pool.length));
  // %70 oranında yoğunluğa uygun tip, %30 rastgele havuzdan
  return rng() < 0.7 ? pool[idx] : rngChoice(rng, pool);
}

// ── AI entegrasyonu — direktör hafızasından yoğunluk ayarı ──
function _aiAdjustDensity(baseDensity, chapter, pattern) {
  try {
    const dirData = JSON.parse(localStorage.getItem("f9_director_v1") || "{}");
    const hist = dirData.history || [];
    if (hist.length < 5) return baseDensity; // yeterli veri yok

    // Bu desende oyuncunun kazanma oranı
    const relevant = hist.filter(h => h._pattern === pattern).slice(-10);
    if (relevant.length < 3) return baseDensity;

    const winRate = relevant.filter(h => h.won).length / relevant.length;
    const avgNineEff = relevant.reduce((a,h) => a + (h.nine_eff||0), 0) / relevant.length;

    // Oyuncu bu desende çok zorlanıyor → yoğunluğu düşür
    if (winRate < 0.25) return Math.max(0.05, baseDensity * 0.65);
    // Oyuncu çok rahat → biraz artır
    if (winRate > 0.80 && avgNineEff > 0.25) return Math.min(0.9, baseDensity * 1.20);
    // Orta → hafif ayar
    if (winRate < 0.40) return baseDensity * 0.85;
    return baseDensity;
  } catch(e) { return baseDensity; }
}

// ── Ana scaledBlockerLayout ──────────────────────────
function scaledBlockerLayout(density, rng, levelNumber=1, chapter=1) {
  if (density <= 0) return new LevelBlockerLayout([]);

  // Desen adı (direktör hafızasına kaydedilir)
  const patternName = chapter<=4?"pyramid": chapter<=8?"fibonacci":
    chapter<=12?"prime": chapter<=16?"symmetric":"diagonal";

  // AI yoğunluk ayarı
  const adjDensity = _aiAdjustDensity(density, chapter, patternName);

  // Level varyasyonu: her 4 levelda rotasyon
  const variant = levelNumber % 4;

  // Geometrik desen hücrelerini al
  let cells = _selectPattern(chapter, adjDensity, rng);

  // Rotasyon uygula
  cells = cells.map(([r,c]) => _rotateCell(r, c, variant));

  // Maksimum %25 sınırı
  const maxBlockers = Math.floor(GRID * GRID * 0.25);
  cells = cells.slice(0, maxBlockers);

  // Yerleşim listesi oluştur
  const occupied = new Set();
  const placements = [];
  for (const [r, c] of cells) {
    const k = cellKey(r, c);
    if (occupied.has(k)) continue;
    occupied.add(k);
    placements.push([r, c, _pickBlockerType(adjDensity, chapter, rng)]);
  }

  // Direktör için desen adını level kaydına ekle (sonraki AI analizi için)
  const layout = new LevelBlockerLayout(placements);
  layout._patternName = patternName;
  layout._variant = variant;
  return layout;
}
// Bölüme göre hangi engeller çıkabilir
// [Oturum 17 — content/ katmanı] Veri content/blockers/chapter-blocker-pools.js'e
// taşındı — burada sadece ince bir arama kaldı.
function allowedBlockersForChapter(chapter){
  for(const pool of CHAPTER_BLOCKER_POOLS){
    if(pool.maxChapter===null || chapter<=pool.maxChapter) return pool.blockers;
  }
  return CHAPTER_BLOCKER_POOLS[CHAPTER_BLOCKER_POOLS.length-1].blockers;
}

function generateLevel(levelNumber,seed=0){
  const combinedSeed=(seed*1000003+levelNumber)>>>0;
  const rng=makeRng(combinedSeed);
  if(levelNumber<=WARMUP_END_LEVEL && WARMUP_END_LEVEL>0){
    return {levelNumber,tierName:"isinma",moves:BASE_MOVES,targetScore:Math.round(BASE_TARGET_SCORE*0.6),blockerLayout:new LevelBlockerLayout([]),blockerDensity:0.0,isBreathe:false,milestone:null};
  }

  let [[tierName,movesMult,densityBase,targetMult],cycleNumber]=tierForLevel(levelNumber);
  const targetCycleScale=1.0+Math.min(0.8,Math.log1p(cycleNumber)*0.12);

  // ── NEFES ALMA SİSTEMİ ──────────────────────────────────
  // Her 5. level %35 daha kolay, her 10. level %50 daha kolay
  const posInCycle=(levelNumber-1)%10+1; // 1-10 arası konum
  const isBreathe=posInCycle===5||posInCycle===10;
  const breatheMult=posInCycle===10?0.50:posInCycle===5?0.65:1.0;

  // [GERİ ALINDI — Oturum 14, kullanıcı kararı] Oturum 13'te movesMult
  // aktif edilmişti (kısmen faydalıydı ama en uç levelleri çözmedi).
  // Kullanıcı hamle sayısının HER ZAMAN 16 sabit kalmasını istiyor —
  // movesMult artık KULLANILMIYOR (DIFFICULTY_TIERS'taki değerler
  // düzeltilmiş haliyle duruyor, ileride tekrar aktif edilebilir).
  const moves=BASE_MOVES; // Sabit 16 hamle — tüm leveller için

  // Sinüzoidal pacing — her 5 levelda ritim dalgalanır
  // L%5=4: ZOR (+%25) | L%5=1: NEFES (-35%) | L%15=0: BOSS (+%50)
  const _isBossLvl   = levelNumber > 1 && levelNumber % 15 === 0;
  const _isBreathLvl = levelNumber > 1 && levelNumber % 5  === 1 && !_isBossLvl;
  const _isHardLvl   = levelNumber > 1 && levelNumber % 5  === 4 && !_isBossLvl;
  const _pacingMult  = _isBossLvl ? 1.5 : _isBreathLvl ? 0.65 : _isHardLvl ? 1.25 : 1.0;

  let targetScore=Math.round(BASE_TARGET_SCORE*targetMult*targetCycleScale*_pacingMult*(isBreathe?breatheMult:1.0));

  const _chapterNum = Math.ceil(levelNumber / 10) || 1;
  // [Oturum 64 — kullanıcı isteği: "ilk levelde oyuncunun tüm şekilleri
  // yapmasını beklemeyelim, ısınma yapalım" + "tahta kalabalık"]
  // İlk 10 bölüm artık bir eşleşme/terfi ÖĞRETİM MÜFREDATI (bkz.
  // HANDOFF.md "Öğretim müfredatı" tablosu — bölüm 1=3'lü, 2=4'lü,
  // 3=5'li, 4=6'lı, 5=7'li (doğrudan oluşturma), 6=3'lü+9, 7=4'lü+9,
  // 8=5'li+9, 9=6'lı+9, 10=7'li+9 (terfi)). Oyuncu tek bir mekanizmaya
  // odaklanabilsin diye bu 10 bölümde engel yoğunluğu ÖNEMLİ ÖLÇÜDE
  // düşürüldü — tahta "kalabalık" olmasın, hedef şekli görmek/kurmak
  // kolay olsun. Bölüm 1-5 (doğrudan oluşturma, daha basit) neredeyse
  // temiz tahta; 6-10 (terfi, tahtada zaten hediye+9 olması gerekiyor,
  // biraz daha karmaşık ama yine de normalden çok daha az) orta düzey.
  // Bölüm 11+ dokunulmadı, eski formül aynen çalışıyor.
  const _tutorialDampen = _chapterNum<=5 ? 0.15 : _chapterNum<=10 ? 0.35 : 1.0;
  const density=Math.min(0.9,densityBase*(1.0+Math.min(0.5,Math.log1p(cycleNumber)*0.08))*(isBreathe?0.6:1.0)*_tutorialDampen);

  const milestone=MILESTONES[levelNumber]||null;

  // ── SİNÜZOİDAL PACING — dalgalı zorluk eğrisi ────────
  // Her 5 levelde: 3 normal → 1 zor → 1 nefes
  // Her 15 levelde: 1 "hard" boss level
  const _posInCycle = levelNumber % 5;        // 0-4 arası döngü
  const _isBoss     = levelNumber % 15 === 0 && levelNumber > 0;
  const _isBreath   = _posInCycle === 1;      // zor sonrası kolay
  const _isHard     = _posInCycle === 4;      // zor level

  // _pacingMult yukarıda tanımlı (sinüzoidal pacing)

  // Nefes levelında hedefi düşür, boss'ta artır
  if (_isBoss || _isHard || _isBreath) {
    // targetScore zaten yukarıda _pacingMult ile hesaplandı
    targetScore = Math.max(150, Math.min(1200, targetScore));
    if (_isBoss)   tierName = "boss";
    if (_isBreath) tierName = "nefes";
    if (_isHard)   tierName = "zor";
  }

  const blockerLayout=scaledBlockerLayout(density*_pacingMult,rng,levelNumber,_chapterNum);
  // [Oturum 18] "pattern" alanı eklendi — kullanıcının onayladığı kanonik
  // şemaya uysun diye (level/moves/targetScore/pattern/density).
  // blockerLayout._patternName zaten vardı, sadece üst seviyeye taşındı.
  const result={levelNumber,tierName,moves,targetScore,blockerLayout,blockerDensity:density,pattern:blockerLayout._patternName??null,isBreathe,milestone,tutorialFocus:TUTORIAL_CURRICULUM[_chapterNum]??null};
  if (levelNumber !== state._lastGeneratedLevel) {
    state._lastGeneratedLevel = levelNumber;
    F9Debug.log("game", `Level ${levelNumber} üretildi: ${tierName}${isBreathe?" [NEFES]":""}${milestone?" [MILESTONE:"+milestone.icon+"]":""}`,
      {moves, targetScore, density: density.toFixed(2)});
  }
  return result;
}

const GIFT_LABEL={[GIFT_COPPER]:"Bakır",[GIFT_BRONZE]:"Bronz",[GIFT_SILVER]:"Gümüş",[GIFT_GOLD]:"Altın",[GIFT_DIAMOND]:"Elmas"};
const GIFT_COLOR={[GIFT_COPPER]:"#C17A4D",[GIFT_BRONZE]:"#B08D57",[GIFT_SILVER]:"#C7CDD6",[GIFT_GOLD]:"#E0B23C",[GIFT_DIAMOND]:"#6FE3D8"};
const ELEM_LABEL={[ELEM_STORM]:"Fırtına",[ELEM_WATER]:"Su",[ELEM_TNT]:"TNT",[ELEM_FIRE]:"Ateş",[ELEM_LIGHTNING]:"Yıldırım"};
const ELEM_COLOR={[ELEM_STORM]:"#9AA7B8",[ELEM_WATER]:"#3E8FD4",[ELEM_TNT]:"#E0473C",[ELEM_FIRE]:"#E2622B",[ELEM_LIGHTNING]:"#E8C53C"};
// BLOCKER_LABEL ve BLOCKER_COLOR yukarıda (satır ~129) tanımlı
const NUMBER_COLOR={1:"#E2622B",2:"#3E8FD4",3:"#639922",4:"#D4537E",5:"#B95DE0",6:"#E8C53C",7:"#4FB8A8",8:"#C7CDD6"};

const root = document.getElementById("f9-root");

// [Oturum 27 — kullanıcı kararı] "Saat başı ödül" (tüp/can yenileme)
// artık gerçek reklam GEREKTİRMİYOR — sadece oyunun açık kalması/beklemesi
// yeterli (bkz. ui/screens.js renderPlayIntro() → btn-claim-tube →
// refillTubes(), reklam çağrısı YOK; showNoTubesModal()'daki "reklam izle"
// butonu ayrı, İSTEĞE BAĞLI bir hızlandırma seçeneği, zorunlu değil).
// HEDEF TASARIM: gerçek 1 saat (3600sn) aralıkla. TEST MODU: kullanıcı
// isteğiyle şu an 5 dakikada (300sn) bir veriliyor ki tüm döngü hızlıca
// test edilebilsin — "ileride düzeltiriz" (kullanıcının kendi ifadesi).
// ÜRETİME ÇIKMADAN ÖNCE bu bayrağı false yapıp gerçek 1 saate dönün.
const HOURLY_REWARD_TEST_MODE = false;
const HOURLY_REWARD_TEST_SEC  = 300;  // 5 dakika (sadece test modunda kullanılır)
const HOURLY_REWARD_REAL_SEC  = 3600; // 1 saat (gerçek/üretim değeri)

const state = {
  levelNumber: 1,
  xp: 0,           // Toplam XP
  playerLevel: 1,  // Oyuncu seviyesi (level != game level)
  avatar: 0,       // Avatar index (0-11)
  seed: (Date.now() ^ Math.trunc(Math.random() * 0xFFFFFF)),
  gc: null,
  cfg: null,
  selected: null,
  screen: "menu",
  _animTimeouts: [],
  lastLoginDate: "",
  loginStreak: 0,
  playerName: "Oyuncu",
  tubes: 3,
  maxTubes: 3,
  lastTubeTime: 0,
  TUBE_REFILL_SEC: HOURLY_REWARD_TEST_MODE ? HOURLY_REWARD_TEST_SEC : HOURLY_REWARD_REAL_SEC,
  league: { tier: "bronz", xp: 0 },
  neighbors: [],
  pendingOptions: null,
  bestScore: {},        // level → en yüksek skor
  hourglassTimers: [],       // aktif setTimeout ID'leri
  hourglassBlastCells: null, // patlayan kum saati hücreleri (animasyon için)
  hourglassBlastMode: null,  // "small" veya "big"
  hourglassKnight: null,     // at yürüyüşü pozisyon durumu
  hourglassWarnTimers: [],   // uyarı timer ID'leri
  levelGoal: null,       // Mevcut level hedefi
  goalProgress: 0,       // Hedefe ulaşma sayacı
  message: "",
  glowCells: new Map(),
  hgBlastCells: null,
  hgBlastMode: null,
  hgBlastCenter: null,
  blastFlashCells: new Set(),
  brokenBlockerFlash: new Set(),
  // [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10o]
  // Enerji KALICI bir kaynak (Can sistemi gibi) — level değiştiğinde
  // SIFIRLANMAZ. Artık gerçek EnergyTracker sınıfı (harcama dahil).
  energyTracker: new EnergyTracker(0),
};

// [TEST AMAÇLI — kullanıcı isteği] Skor hedefi ve hamle sayısı, bu
// prototip oturumunda deneme yapabilmek için 3 katına çıkarıldı. Bu
// kalıcı bir dengeleme kararı DEĞİL — level_generator.js'in kendi
// formülüne dokunulmadı, sadece burada çarpan uygulanıyor.
// TEST_SCALE_MULTIPLIER kullanılmıyor — hamle 21 sabit, skor TIER_TARGET_SCORE'dan geliyor
// const TEST_SCALE_MULTIPLIER = 1.5;


// Simüle lig verisi



function refillTubes() {
  if (state.tubes >= state.maxTubes) return;
  const now = Date.now();
  if (!state.lastTubeTime || state.lastTubeTime < 1000000000000) {
    state.lastTubeTime = now; saveGame(); return;
  }
  const elapsed = (now - state.lastTubeTime) / 1000;
  const filled = Math.floor(elapsed / state.TUBE_REFILL_SEC);
  if (filled > 0) {
    state.tubes = Math.min(state.maxTubes, state.tubes + filled);
    state.lastTubeTime = now;
    saveGame();
  }
}

function tubeTimeLeft() {
  if (state.tubes >= state.maxTubes) return 0;
  if (!state.lastTubeTime || state.lastTubeTime < 1000000000000) return state.TUBE_REFILL_SEC;
  const elapsed = (Date.now() - state.lastTubeTime) / 1000;
  return Math.max(0, Math.ceil(state.TUBE_REFILL_SEC - (elapsed % state.TUBE_REFILL_SEC)));
}

function formatTime(sec) {
  if (sec <= 0) return "Hazır!";
  const m = Math.floor(sec/60), s = sec%60;
  if (m >= 60) { const h = Math.floor(m/60), rm = m%60; return h+"s "+rm+"dk"; }
  return m+"dk "+String(s).padStart(2,"0")+"s";
}






// ── Ses Sistemi (Web Audio API - dosya gerekmez) ───────────
let _audioCtx = null;
let _audioReady = false;


// İlk kullanıcı etkileşiminde ses başlat
document.addEventListener("click", initAudio, { once: true });
document.addEventListener("touchstart", initAudio, { once: true });




// ── LOADING ekranı ────────────────────────────────────

// ── MAP ekranı ────────────────────────────────────────



// ── WIN ekranı ────────────────────────────────────────

// ── LOSE ekranı ───────────────────────────────────────

// ── REWARD ekranı ─────────────────────────────────────




// ── Play Intro: Hangi bölümde + saat başı ödül ───────────────────────────






// [Oturum 22 — flow/ katmanı ayrımı] newLevel() → flow/levelFlow.js'e
// TAŞINDI. Aynı ortak IIFE içinde (build/manifest.js sırası) yüklendiği
// için burada hâlâ tanımlıymış gibi çağrılabilir.



// [Oturum 22 — flow/ katmanı ayrımı] handleCellClick() ve
// _breakAdjacentWood() → flow/moveFlow.js'e TAŞINDI. Aynı ortak IIFE
// içinde (build/manifest.js sırası) yüklendiği için burada hâlâ
// tanımlıymış gibi çağrılabilir.

// [Oturum 22 — flow/ katmanı ayrımı] executeMove(), watchAd() →
// flow/rewardFlow.js'e; _checkNearMiss(), checkAndTransition() →
// flow/transitionFlow.js'e TAŞINDI. Aynı ortak IIFE içinde (build/
// manifest.js sırası) yüklendiği için burada hâlâ tanımlıymış gibi
// çağrılabilirler.

// ui/renderer.js'in render() / attachBoardListener() fonksiyonlarının
// kullandığı, render durumunu izleyen değişkenler — flow fonksiyonlarının
// bir parçası değil, burada (game-engine.js) kalmaya devam ediyor.
let _lastRenderedScreen = null;
let _boardListenerAttached = false;
let _boardListenerEl = null;



// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10o] Enerji
// Harcama paneli. Kullanıcı kararı: "görsel ve sesi en sona
// bırakacağız" — bu yüzden SADECE METİN/BUTON, hiç animasyon/ikon
// detayı yok. Her buton, ilgili maliyeti karşılayamıyorsa devre dışı.


const style = document.createElement("style");
style.textContent = `
body { margin:0; background: #0B0D1A; /*base64-bg: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") center/cover no-repeat fixed; }
#f9-root { font-family: var(--font-sans, -apple-system, sans-serif); }
.f9-wrap {
  --f9-bg: #0B0D1A;
  --f9-surface: #13162A;
  --f9-border: #332C25;
  --f9-text: #F2EBE0;
  --f9-text-dim: #A89B89;
  --f9-accent: #E0B23C;
  background: #0B0D1A; 
  border-radius: 16px;
  padding: 12px;
  color: var(--f9-text);
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
}
.f9-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
.f9-level-pill { font-size:15px; font-weight:500; }
.f9-tier { font-size:12px; color:var(--f9-accent); border:0.5px solid var(--f9-accent); border-radius:999px; padding:2px 8px; margin-left:8px; }
.f9-controls { display:flex; gap:6px; align-items:center; }
.f9-btn {
  background: var(--f9-surface); color: var(--f9-text); border: 0.5px solid var(--f9-border);
  border-radius: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; transition: background 0.15s;
}
.f9-btn:hover { background: #2A241D; }
.f9-btn:active { transform: scale(0.97); }
.f9-btn-primary { background: var(--f9-accent); color: #2A1B05; border-color: var(--f9-accent); font-weight:500; }
.f9-btn-primary:hover { background: #ECC25C; }
.f9-level-input { width:54px; background:var(--f9-surface); border:0.5px solid var(--f9-border); border-radius:8px; color:var(--f9-text); padding:6px 8px; font-size:13px; }

.f9-score-bar { display:flex; align-items:center; justify-content:space-between; background:var(--f9-surface); border-radius:10px; padding:10px 14px; margin-bottom:10px; border:0.5px solid var(--f9-border); }
.f9-score-main { }
.f9-score-val { font-size:22px; font-weight:700; color:var(--f9-accent); font-variant-numeric:tabular-nums; }
.f9-score-lbl { font-size:10px; color:var(--f9-text-dim); text-transform:uppercase; letter-spacing:.04em; }
.f9-rank-badge { text-align:right; background:#1A1E35; border-radius:8px; padding:6px 12px; border:1px solid #252A45; }
.f9-rank-badge.f9-rank-top5 { background:linear-gradient(145deg,#2A1E00,#1A1200); border-color:#E0B23C66; }
.f9-rank-num { font-size:20px; font-weight:700; color:var(--f9-text); }
.f9-rank-badge.f9-rank-top5 .f9-rank-num { color:#E0B23C; }
.f9-rank-lbl { font-size:10px; color:var(--f9-text-dim); }
.f9-rank-badge.f9-rank-top5 .f9-rank-lbl { color:#E0B23C; font-weight:600; }
.f9-stats { display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin-bottom:10px; }
.f9-energy-bar { display:flex; align-items:center; gap:6px; background:var(--f9-surface); border-radius:10px; padding:8px 12px; margin-bottom:14px; }
.f9-energy-icon { font-size:14px; }
.f9-energy-label { font-size:11px; color:var(--f9-text-dim); flex:1; }
.f9-energy-value { font-size:15px; font-weight:600; color:#B95DE0; font-variant-numeric: tabular-nums; }

/* [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10o] Enerji
   Mağazası — kullanıcı kararı: "görsel ve sesi en sona bırakacağız",
   bu yüzden bilinçli olarak minimal/sade (animasyon, ikon detayı yok). */
.f9-energy-shop { background:var(--f9-surface); border-radius:10px; padding:10px 12px; margin-bottom:14px; }
.f9-energy-shop-title { font-size:11px; color:var(--f9-text-dim); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:8px; }
.f9-energy-shop-row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
.f9-energy-shop-row:last-child { margin-bottom:0; }
.f9-energy-btn {
  background:#2A241D; border:0.5px solid var(--f9-border); color:var(--f9-text);
  border-radius:8px; padding:6px 10px; font-size:12px; cursor:pointer;
}
.f9-energy-btn:hover:not(:disabled) { background:#352D23; }
.f9-energy-btn:disabled { opacity:0.35; cursor:not-allowed; }
.f9-energy-btn-super { border-color:#B95DE0; color:#B95DE0; font-weight:600; }
#f9-blocker-type-select {
  background:#2A241D; border:0.5px solid var(--f9-border); color:var(--f9-text);
  border-radius:8px; padding:6px 8px; font-size:12px;
}
.f9-stat { background:var(--f9-surface); border-radius:10px; padding:10px 12px; }
.f9-stat-label { font-size:11px; color:var(--f9-text-dim); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; }
.f9-stat-value { font-size:20px; font-weight:500; font-variant-numeric: tabular-nums; }
.f9-stat-sub { font-size:13px; color:var(--f9-text-dim); font-weight:400; }
.f9-progress-track { height:4px; background:#2A241D; border-radius:2px; margin-top:8px; overflow:hidden; }
.f9-progress-fill { height:100%; background:var(--f9-accent); border-radius:2px; transition: width 0.4s ease; }

.f9-board-container { position: relative; margin-bottom: 10px; width: 100%; box-sizing: border-box; overflow: hidden; touch-action: none; }

/* ── Seçenek Paneli v2 ── */
#f9-options-area {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
#f9-options-area.f9-options-area-visible {
  pointer-events: auto;
}
.f9-opts-panel2 {
  position: absolute;
  background: #0A0C20;
  border: 1px solid #534AB7;
  border-radius: 14px;
  padding: 12px 12px 10px;
  pointer-events: auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.7);
  width: max-content;
  max-width: 88%;
  z-index: 20;
  animation: f9-pop-in2 0.14s cubic-bezier(0.34,1.56,0.64,1);
}
.f9-opts-arrow2 {
  position: absolute;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}
.f9-opts-arrow2-up   { top:-8px;    border-bottom: 8px solid #534AB7; }
.f9-opts-arrow2-down { bottom:-8px; border-top:    8px solid #534AB7; }
.f9-opts-title {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-bottom: 10px;
}
.f9-opts-title-sep   { font-size:20px; font-weight:700; color:#534AB7; }
.f9-opts-title-label { font-size:11px; color:#7A8BAB; margin-left:4px; white-space:nowrap; }
.f9-opts-row2 { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:8px; }
.f9-op-btn2 {
  display:flex; align-items:center; gap:6px;
  background:#131630; border:1px solid #2A2D50;
  border-radius:10px; padding:8px 10px; cursor:pointer;
  transition:background .1s, border-color .1s, transform .1s; color:#E8E2D8;
}
.f9-op-btn2:hover  { background:#1E2248; border-color:#534AB7; }
.f9-op-btn2:active { transform:scale(0.94); }
.f9-op-btn2-nine   { border-color:#E0B23C !important; box-shadow:0 0 8px #E0B23C40; }
.f9-op-sym2  { font-size:15px; font-weight:700; color:#AFA9EC; min-width:14px; text-align:center; }
.f9-op-arr2  { font-size:12px; color:#3A3E60; }
.f9-op-res2  { display:flex; align-items:center; justify-content:center; min-width:36px; }
.f9-board {
  display:grid; grid-template-columns: repeat(8, 1fr); gap:2px;
  background: linear-gradient(145deg, #0A0C1A 0%, #0D0F1E 100%);
  border-radius:10px; padding:4px; width:100%; box-sizing:border-box;
}
.f9-cell {
  display:flex; align-items:center; justify-content:center;
  background: linear-gradient(145deg, #1A1E35 0%, #141728 100%);
  border-radius:5px; font-size: clamp(18px, 5.5vw, 34px);
  font-weight: 600; font-variant-numeric: tabular-nums; cursor:pointer; user-select:none;
  touch-action: manipulation;
  transition: background 0.12s, transform 0.12s; position:relative; aspect-ratio:1;
  border: 1px solid #252A45; overflow:hidden; min-width:0;
  will-change: background-color, box-shadow, transform; /* GPU katmanı — animasyon akıcılığı */
}
.f9-cell:hover { background: linear-gradient(145deg,#222848,#1A2038); }
.f9-cell-nine { color: var(--f9-accent); font-weight:600; box-shadow: inset 0 0 0 1px rgba(224,178,60,0.35); animation: f9-pulse 1.8s ease-in-out infinite; }
@keyframes f9-pulse { 0%,100% { box-shadow: inset 0 0 0 1px rgba(224,178,60,0.25); } 50% { box-shadow: inset 0 0 0 1px rgba(224,178,60,0.65); } }
/* ── KUM SAATİ HÜCRESİ ── */
.f9-cell-hourglass {
  background: #0E0A20 !important;
  border: 2px solid #7B5CF6 !important;
  box-shadow: 0 0 8px #7B5CF630;
  animation: hg-pulse 1.5s ease-in-out infinite;
}
.f9-cell-hourglass-warn {
  background: #1A0808 !important;
  border: 2px solid #E04B4B !important;
  box-shadow: 0 0 8px #E04B4B40;
  animation: hg-warn 0.5s ease-in-out infinite;
}
.f9-hg-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.f9-hg-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 110%;
  height: 110%;
  pointer-events: none;
}
.f9-hg-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
  position: relative;
  z-index: 1;
}
.f9-hg-secs {
  position: absolute;
  bottom: 2px;
  right: 3px;
  font-size: 9px;
  font-weight: 700;
  color: #A78BFA;
  z-index: 2;
  line-height: 1;
  text-shadow: 0 0 4px #0E0A20;
}
.f9-hg-secs.warn { color: #F87171; }
@keyframes hg-pulse {
  0%,100% { box-shadow: 0 0 6px #7B5CF620; }
  50%      { box-shadow: 0 0 14px #7B5CF650; }
}
@keyframes f9-milestone-pop {
  0%   { opacity:0; transform:scale(0.5) translateY(20px); }
  100% { opacity:1; transform:scale(1)   translateY(0); }
}
@keyframes f9-bounce {
  0%   { transform: scale(0.3); }
  60%  { transform: scale(1.15); }
  80%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes floatUp {
  0%   { opacity:1; transform: translateX(-50%) translateY(0); }
  100% { opacity:0; transform: translateX(-50%) translateY(-40px); }
}
@keyframes hg-warn {
  0%,100% { box-shadow: 0 0 6px #E04B4B30; transform: scale(1); }
  50%      { box-shadow: 0 0 16px #E04B4B60; transform: scale(1.03); }
}
/* ── KUM SAATİ SON ── */

.f9-cell-selected {
  outline: 1.5px solid #FFD700;
  outline-offset: -1px;
  box-shadow: 0 0 0 1.5px #FFD700, 0 0 9px rgba(255,215,0,0.45);
  transform: scale(1.06);
  z-index: 2;
}
.f9-cell-neighbor {
  outline: 1.5px dashed rgba(100,180,255,0.8);
  outline-offset: -1px;
  box-shadow: 0 0 8px rgba(100,180,255,0.35);
  animation: f9-neighbor-pulse 0.9s ease-in-out infinite;
}
@keyframes f9-neighbor-pulse {
  0%,100% { box-shadow: 0 0 5px rgba(100,180,255,0.2); }
  50%      { box-shadow: 0 0 12px rgba(100,180,255,0.6); }
}
.f9-cell-glow { animation: f9-flash 1.56s ease-out forwards; }
@keyframes f9-flash {
  0%   { background: #FFFFFF !important; box-shadow: 0 0 20px #FFFFFF, inset 0 0 12px rgba(255,255,255,0.8); transform: scale(1.1); }
  30%  { background: rgba(255,255,255,0.6) !important; transform: scale(1.05); }
  100% { background: linear-gradient(145deg,#1A1E35,#141728) !important; box-shadow: none; transform: scale(1); }
}
.f9-cell-blast { animation: f9-blast-flash 1.56s ease-out forwards; }
@keyframes f9-blast-flash {
  0%   { background: #FF3A1A !important; transform: scale(0.85); box-shadow: 0 0 24px #FF3A1A; }
  20%  { background: #FF6A30 !important; transform: scale(1.08); box-shadow: 0 0 16px #FF6A30; }
  60%  { background: #C0300A !important; transform: scale(1.02); }
  100% { background: linear-gradient(145deg,#1A1E35,#141728) !important; transform: scale(1); box-shadow: none; }
}
/* ── Kum Saati Patlama Animasyonu ── */
.f9-cell-hg-blast {
  animation: f9-hg-blast 1.0s cubic-bezier(0.34,1.56,0.64,1) forwards !important;
  position: relative;
  z-index: 10 !important;
  pointer-events: none;
  transition: none !important;
}
.f9-cell-hg-blast-big {
  animation: f9-hg-blast-big 1.3s cubic-bezier(0.34,1.56,0.64,1) forwards !important;
  position: relative;
  z-index: 10 !important;
  pointer-events: none;
  transition: none !important;
}
@keyframes f9-hg-blast {
  0%   { background:#FFFFFF !important; box-shadow:0 0 0 3px #FFF,0 0 24px 8px #FFF !important; transform:scale(1.25) !important; filter:brightness(3) !important; border-radius:10px; }
  20%  { background:#FDE68A !important; box-shadow:0 0 0 3px #F59E0B,0 0 20px #FCD34D !important; transform:scale(1.12) !important; filter:brightness(2) !important; }
  45%  { background:#C4B5FD !important; box-shadow:0 0 0 2px #7C3AED,0 0 12px #A78BFA !important; transform:scale(1.05) !important; filter:brightness(1.5) !important; }
  75%  { background:#EDE9FE66 !important; box-shadow:0 0 0 1px #6D28D955 !important; transform:scale(1.0) !important; filter:brightness(1) !important; }
  100% { background:transparent !important; box-shadow:none !important; transform:scale(1.0) !important; filter:brightness(1) !important; }
}
@keyframes f9-hg-blast-big {
  0%   { background:#FFFFFF !important; box-shadow:0 0 0 4px #FFF,0 0 32px 12px #FCD34D !important; transform:scale(1.3) !important; filter:brightness(4) !important; border-radius:10px; }
  15%  { background:#FCD34D !important; box-shadow:0 0 0 4px #F59E0B,0 0 28px #FDE68A !important; transform:scale(1.18) !important; filter:brightness(3) !important; }
  40%  { background:#FDE68A !important; box-shadow:0 0 0 2px #D97706,0 0 16px #FCD34D !important; transform:scale(1.08) !important; filter:brightness(2) !important; }
  70%  { background:#FFFBEB88 !important; box-shadow:none !important; transform:scale(1.02) !important; filter:brightness(1.2) !important; }
  100% { background:transparent !important; box-shadow:none !important; transform:scale(1.0) !important; filter:brightness(1) !important; }
}
@keyframes f9-pop-in2 {
  from { opacity:0; transform:scale(0.88); }
  to   { opacity:1; transform:scale(1); }
}
.f9-opts-arrow2 {
  position: absolute;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}
.f9-opts-arrow2-up   { top:-8px;    border-bottom: 8px solid #534AB7; }
.f9-opts-arrow2-down { bottom:-8px; border-top:    8px solid #534AB7; }
.f9-opts-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}
.f9-opts-title-sep {
  font-size: 20px;
  font-weight: 700;
  color: #534AB7;
}
.f9-opts-title-label {
  font-size: 11px;
  color: #7A8BAB;
  margin-left: 6px;
  white-space: nowrap;
}
.f9-opts-row2 {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.f9-op-btn2 {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #131630;
  border: 1px solid #2A2D50;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background .1s, border-color .1s, transform .1s;
  color: #E8E2D8;
}
.f9-op-btn2:hover  { background:#1E2248; border-color:#534AB7; }
.f9-op-btn2:active { transform: scale(0.94); }
.f9-op-btn2-nine   { border-color:#E0B23C !important; box-shadow:0 0 8px #E0B23C40; }
.f9-op-sym2 { font-size:15px; font-weight:700; color:#AFA9EC; min-width:14px; text-align:center; }
.f9-op-arr2 { font-size:12px; color:#3A3E60; }
.f9-op-res2 {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}
/* Eski panel — geriye dönük uyumluluk */
.f9-options-panel {
  position: absolute; transform: translateX(-50%);
  background: #0A0C20; border-radius:16px; padding:14px;
  border:1px solid #534AB7; pointer-events: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.45);
  width: max-content; max-width: min(320px, 94vw); z-index: 6;
}
.f9-options-arrow {
  position:absolute; left:50%; transform:translateX(-50%);
  width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent;
}
.f9-options-arrow-up { top:-7px; border-bottom:7px solid var(--f9-accent); }
.f9-options-arrow-down { bottom:-7px; border-top:7px solid var(--f9-accent); }
.f9-options-title { font-size:12px; color:var(--f9-text-dim); margin-bottom:8px; text-align:center; white-space:nowrap; }
.f9-options-row { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-bottom:8px; }
.f9-op-btn { display:flex;align-items:center;gap:8px;background:#1E2240;border:1px solid #3A3E68;color:#F2EBE0;border-radius:10px;padding:10px 14px;cursor:pointer;transition:background .12s,border-color .12s; }
.f9-op-btn:hover { background:#252A50; border-color:#534AB7; }
.f9-op-btn:active { transform:scale(0.95); }
.f9-op-btn-nine { border-color:#E0B23C; }
.f9-op-symbol { color:#AFA9EC; font-size:16px; font-weight:600; }
.f9-op-arrow  { color:#6B6580; font-size:12px; }
.f9-op-result { font-weight:700; font-size:clamp(24px,6vw,32px); line-height:1; }

.f9-overlay { background:var(--f9-surface); border-radius:12px; padding:20px; text-align:center; margin-bottom:14px; border:0.5px solid var(--f9-border); }
.f9-overlay-won { border-color: var(--f9-accent); }
.f9-overlay-title { font-size:17px; font-weight:500; margin-bottom:4px; }
.f9-overlay-sub { font-size:13px; color:var(--f9-text-dim); margin-bottom:14px; }
.f9-overlay-actions { display:flex; flex-direction:column; gap:8px; align-items:center; }
.f9-overlay-note { font-size:12px; color:var(--f9-text-dim); }

.f9-legend { margin-top:8px; }
.f9-legend-title { font-size:11px; color:var(--f9-text-dim); text-transform:uppercase; letter-spacing:0.04em; margin:10px 0 6px; }
.f9-legend-row { display:flex; flex-wrap:wrap; gap:6px; }
.f9-legend-chip { font-size:11px; border:0.5px solid; border-radius:999px; padding:3px 9px; }
.f9-legend-note { font-size:11px; color:var(--f9-text-dim); line-height:1.5; }


/* ── ANA MENÜ ── */
.f9-menu { display:flex; flex-direction:column; gap:12px; min-height:100vh; padding:20px 12px; box-sizing:border-box; }
.f9-logo { text-align:center; padding:24px 0 8px; }
.f9-logo-title { font-size:36px; font-weight:900; color:#F2EBE0; letter-spacing:.06em; text-shadow:0 0 30px rgba(224,178,60,0.4); }
.f9-logo-sub { font-size:13px; color:#A89B89; margin-top:4px; }
.f9-menu-card { display:flex; align-items:center; justify-content:space-between; background:rgba(19,22,42,0.95); border:1px solid #252A45; border-radius:14px; padding:14px 16px; cursor:pointer; transition:border-color .15s; }
.f9-menu-card:hover { border-color:#534AB7; }
.f9-menu-league { border-color:#534AB755; }
.f9-mc-left { display:flex; align-items:center; gap:12px; }
.f9-mc-icon { font-size:26px; }
.f9-mc-title { font-size:15px; font-weight:700; color:#F2EBE0; }
.f9-mc-sub { font-size:11px; color:#A89B89; margin-top:2px; }
.f9-mc-right { text-align:right; }
.f9-mc-rank { font-size:22px; font-weight:800; color:#F2EBE0; }
.f9-mc-rsub { font-size:10px; color:#A89B89; }
.f9-mc-top5 .f9-mc-rank { color:#E0B23C; }
.f9-mc-top5 .f9-mc-rsub { color:#E0B23C; }
.f9-mc-streak { font-size:13px; color:#E0B23C; }
.f9-start-btn { width:100%; padding:18px; background:linear-gradient(145deg,#534AB7,#3D3480); border:none; border-radius:16px; color:#fff; font-size:20px; font-weight:800; cursor:pointer; letter-spacing:.08em; box-shadow:0 4px 20px rgba(83,74,183,0.5); transition:transform .1s,box-shadow .1s; margin:4px 0; }
.f9-start-btn:active { transform:scale(0.97); box-shadow:0 2px 10px rgba(83,74,183,0.4); }
.f9-menu-row { display:flex; gap:8px; }
.f9-menu-btn { flex:1; background:rgba(19,22,42,0.95); border:1px solid #252A45; border-radius:12px; padding:12px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition:border-color .15s; }
.f9-menu-btn:hover { border-color:#534AB7; }
.f9-mb-icon { font-size:20px; }
.f9-mb-lbl { font-size:10px; color:#A89B89; font-weight:500; }
.f9-menu-version { text-align:center; font-size:10px; color:#A89B89; padding-bottom:8px; }
/* Oyun topbar - sade */
.f9-back-btn { background:transparent; border:1px solid #252A45; border-radius:8px; color:#A89B89; padding:5px 10px; font-size:12px; cursor:pointer; }
.f9-undo-btn {
  background: linear-gradient(145deg,#1E2240,#181C38);
  border: 1px solid #534AB7;
  border-radius: 8px;
  color: #AFA9EC;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, border-color .12s, opacity .12s;
}
.f9-undo-btn:hover:not(:disabled) { background: linear-gradient(145deg,#252A50,#1E2244); border-color:#7B5CF6; }
.f9-undo-btn:active:not(:disabled) { transform: scale(0.95); }
.f9-undo-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.f9-back-btn:hover { border-color:#534AB7; color:#F2EBE0; }
.f9-menu-level { text-align:center; margin-bottom:4px; }
.f9-ml-row { display:flex; align-items:center; justify-content:center; gap:10px; }
.f9-ml-lv { font-size:32px; font-weight:900; color:#F2EBE0; letter-spacing:-1px; }
.f9-ml-badge { display:inline-block; background:rgba(224,178,60,0.15); color:#E0B23C; border:1px solid rgba(224,178,60,0.4); border-radius:20px; padding:5px 16px; font-size:15px; font-weight:700; }
/* ── STAT BAR ── */
.f9-statbar { display:flex; gap:3px; margin-bottom:6px; }
.f9-stat-chip { flex:1; background:rgba(19,22,42,0.95); border:1px solid #252A45; border-radius:8px; padding:5px 3px; display:flex; flex-direction:column; align-items:center; gap:0px; }
.f9-stat-chip.f9-stat-danger { border-color:#E0473C88; background:rgba(40,10,10,0.95); }
.f9-stat-chip.f9-stat-rank { border-color:#534AB755; cursor:pointer; }
.f9-stat-chip.f9-stat-rank:hover { border-color:#534AB7; }
.f9-sc-icon { font-size:13px; line-height:1; }
.f9-sc-val { font-size:15px; font-weight:800; color:var(--f9-text); line-height:1.1; }
.f9-sc-lbl { font-size:8px; color:var(--f9-text-dim); }
.f9-stat-danger .f9-sc-val { color:#E0473C; animation:f9-danger-blink .7s ease-in-out infinite; }
@keyframes f9-danger-blink { 0%,100%{opacity:1} 50%{opacity:.4} }
/* ── GÜÇLER ── */
.f9-powers-bar { display:flex; gap:6px; margin-top:8px; }
.f9-pb { flex:1; background:rgba(19,22,42,0.95); border:1.5px solid #2A2E50; border-radius:12px; padding:10px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; transition:all .15s; min-height:64px; justify-content:center; }
.f9-pb:active:not(:disabled) { transform:scale(0.93); }
.f9-pb:not(:disabled) { border-color:#534AB7; box-shadow:0 2px 10px rgba(83,74,183,0.3); }
.f9-pb:disabled { opacity:.4; cursor:not-allowed; }
.f9-pb-icon { font-size:24px; line-height:1; }
.f9-pb-lbl { font-size:11px; font-weight:600; color:var(--f9-text); }
.f9-pb-cost { font-size:9px; color:#B95DE0; font-weight:700; }
.f9-pb-super:not(:disabled) { background:rgba(40,10,60,0.95); border-color:#B95DE0; box-shadow:0 2px 14px rgba(185,93,224,0.4); }
.f9-bar-powers,.f9-tubes-bar,.f9-hud,.f9-powers { display:none; }
/* Harita bölüm kartları */
.f9-chapter { display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(19,22,42,0.95);border:1px solid #252A45;border-radius:12px;transition:border-color .15s; }
.f9-chapter-active { background:rgba(19,22,42,0.98); }
.f9-chapter-done { opacity:.85; }
.f9-chapter-locked { opacity:.4; }
.f9-ch-icon { font-size:26px;flex-shrink:0;width:36px;text-align:center; }
.f9-ch-body { flex:1;min-width:0; }
.f9-ch-name { font-size:14px;font-weight:700;margin-bottom:2px; }
.f9-ch-sub { font-size:11px;color:#A89B89;margin-bottom:4px; }
.f9-ch-bar { height:5px;background:#1A1E35;border-radius:3px;overflow:hidden;margin-top:4px; }
.f9-ch-fill { height:100%;border-radius:3px;transition:width .3s; }
.f9-ch-right { flex-shrink:0; }
.f9-ch-play { border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer; }

.f9-danger { color:#E0473C !important; }
`;
document.head.appendChild(style);


// localStorage çalışıp çalışmadığını test et
let _storageOk = false;
try {
  localStorage.setItem('_f9test', '1');
  _storageOk = localStorage.getItem('_f9test') === '1';
  localStorage.removeItem('_f9test');
} catch(e) { _storageOk = false; }

// localStorage yoksa in-memory fallback
const _storage = _storageOk ? localStorage : (() => {
  const _mem = {};
  return {
    getItem:    k   => _mem[k] ?? null,
    setItem:    (k,v) => { _mem[k] = v; },
    removeItem: k   => { delete _mem[k]; }
  };
})();

// saveGame ve loadGame'i _storage'a bağla (override)
let _saveDebounceTimer = null;
saveGame = function() {
  // Debounce: 300ms içinde gelen tüm çağrıları tek bir yazıma indirge
  if (_saveDebounceTimer) { clearTimeout(_saveDebounceTimer); }
  const _isFirst = !_saveDebounceTimer;
  _saveDebounceTimer = setTimeout(() => {
    _saveDebounceTimer = null;
    F9Debug.log("save", "Kayıt yapılıyor...", {lvl:state.levelNumber,energy:state.energyTracker?.energy});
    const me = LEAGUE_BOARD.find(e=>e.isMe);
    try {
      _storage.setItem(SAVE_KEY, JSON.stringify({
      energy:        state.energyTracker.energy,
      xp:            state.xp || 0,
      playerLevel:   state.playerLevel || 1,
      avatar:        state.avatar || 0,
      leagueScore:   me ? me.score : 0,
      leagueTier:    state.league?.tier || "bronz",
      lastLoginDate: state.lastLoginDate,
      loginStreak:   state.loginStreak,
      playerName:    state.playerName,
      tubes:         state.tubes,
      lastTubeTime:  state.lastTubeTime,
      soundOn:       state._soundOn !== false,
      bestScore:     state.bestScore || {},
      unlockedMilestones: state.unlockedMilestones || [],
    }));
    } catch(e) { F9Debug.err("saveGame hatası", e.message); }
  }, 100);
};

loadGame = function() {
  try {
    const raw = _storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
};

loadDDA(); // DDA geçmişini yükle
const _saved = loadGame();
if (_saved) {
  applyLoad(_saved);
} else {
  const _name = prompt("Fusion 9'a hoş geldin!\nİsmin nedir?", "Oyuncu");
  if (_name && _name.trim()) {
    state.playerName = _name.trim();
    const _me = LEAGUE_BOARD.find(e => e.isMe);
    if (_me) _me.name = state.playerName;
  }
}
// ── Başlangıç ekranı ─────────────────────────────────
const _today = new Date().toISOString().slice(0,10);
const _hasDaily = state.lastLoginDate !== _today;

if (_hasDaily) {
  // Günlük ödül ekranı — ödülü renderDailyReward içindeki butonla ver
  state.screen = "daily";
} else {
  state.screen = "menu";
}
render();

})();
