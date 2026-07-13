// [Oturum 15 — rules/ katmanı ayrıştırması] Sabitler rules/evolutionRules.js'e
// taşındı — bu dosyada sadece MEKANİZMA FONKSİYONLARI kalıyor.
// rules/evolutionRules.js bu dosyadan ÖNCE yüklenmeli (build manifest'inde
// zaten öyle).

/** N uzunluğunda, merkezi (0,0) olan yatay+dikey haç offsetleri üretir
 *  (merkez hücrenin kendisi dahil değil — o zaten patlayan asıl hücre). */
function crossOffsets(n) {
  const before = Math.floor((n - 1) / 2);
  const after = (n - 1) - before;
  const offsets = [];
  for (let d = -before; d <= after; d++) if (d !== 0) offsets.push([0, d]); // yatay
  for (let d = -before; d <= after; d++) if (d !== 0) offsets.push([d, 0]); // dikey
  return offsets;
}

function pairKey(a,b){return [a,b].sort().join("|");}
// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10k] Mekanizma 6:
// Yıldırım+Yıldırım -> +12 Enerji.

function mechanism1MatchResult(group,basePoints){return {points:basePoints,gift:GROUP_TO_GIFT[group]??null,energy:GROUP_TO_ENERGY[group]??0};}

// [GÜNCELLENDİ — Oturum 29, kullanıcı kararı, DÜZELTİLDİ] Mekanizma 2:
// terfi + ALAN PATLAMASI (crossOffsets() ile ince haç — bkz.
// rules/evolutionRules.js GIFT_PROMO_CROSS_SIZE notu).
function mechanism2Promotion(giftType,basePoints){
  const result=PROMOTION_CHAIN[giftType];
  if(result===undefined) return {points:basePoints,gift:null,extraMoves:0,crossBlastOffsets:null,energy:0};
  const crossN=GIFT_PROMO_CROSS_SIZE[giftType]??null;
  const crossBlastOffsets=crossN?crossOffsets(crossN):null;
  if(result==="extra_move") return {
    // [Oturum 29 — KULLANICI KARARI: DEĞİŞTİ] Elmas+9 ("Matrix Eşleşme"
    // — isim/etiket AYNI kalıyor, kullanıcı net: "1 ama matrixde
    // kalsın") ARTIK tüm tahta patlar + 10 hamle DEĞİL — 8 hücrelik
    // ince haç (satır+sütun) + 3 hamle veriyor.
    points:basePoints,gift:null,extraMoves:3,
    crossBlastOffsets,
    energy:DIAMOND_PROMOTION_ENERGY
  };
  // Terfi + kademeli patlama alanı (ince haç, bkz. GIFT_PROMO_CROSS_SIZE)
  return {points:basePoints,gift:result,extraMoves:0,
    crossBlastOffsets,energy:0};
}

// [Oturum 29 — KULLANICI KARARI: RETIRE EDİLDİ] Mekanizma 3b (Bakır+
// farklı-tür → rastgele 3x3 blok sayısı) kaldırıldı — bkz.
// rules/evolutionRules.js'teki ilgili not. Bakır çiftleri artık
// mechanism3cAreaCombo() üzerinden DİĞER tüm karışık-tür çiftleriyle
// AYNI (satır/sütun ince haç) mekanizmayı kullanıyor.

// Mekanizma 3c: farklı-tür kombinasyonu -> hamle/enerji + ALAN PATLAMASI.
// [GÜNCELLENDİ] Gümüş+Elmas/Altın+Elmas artık HEM enerji HEM alan.
function mechanism3cAreaCombo(a,b,basePoints){
  const key=pairKey(a,b);
  const combo=DIFFERENT_TYPE_AREA_COMBOS[key];
  if(!combo) return {points:basePoints,extraMoves:0,energy:0,areaSize:null,comboPoints:0,comboCount:0};
  const [extraMoves,areaSize]=combo;
  const energy=DIFFERENT_TYPE_ENERGY[key]??0;
  const comboCount=AREA_SIZE_TO_COMBO_COUNT[areaSize.join(",")]??0;
  return {points:basePoints,extraMoves,energy,areaSize,comboPoints:comboCount*VIRTUAL_COMBO_POINTS,comboCount};
}
// Birleşik giriş noktası: aynı tür->3a, farklı tür (Bakır dahil)->3c
// [Oturum 29 — KULLANICI KARARI] Bakır+farklı-tür ÖZEL DALI kaldırıldı
// — artık TÜM farklı-tür çiftleri (Bakır dahil) mechanism3cAreaCombo'ya
// gidiyor, tek/tutarlı satır+sütun ince haç mekanizması.
function mechanism3GiftCombo(a,b,basePoints){
  if(a===b){
    const blastN=SAME_TYPE_BLAST_SIZE[a]??null;
    return {points:basePoints,element:SAME_TYPE_TO_ELEMENT[a],blastSize:null,extra3x3Blocks:0,extraMoves:0,energy:0,areaSize:null,comboPoints:0,comboCount:0,
      crossBlastOffsets: blastN ? crossOffsets(blastN) : null};
  }
  const r=mechanism3cAreaCombo(a,b,basePoints);
  return {points:r.points,element:null,blastSize:null,extra3x3Blocks:0,extraMoves:r.extraMoves,energy:r.energy,areaSize:r.areaSize,comboPoints:r.comboPoints,comboCount:r.comboCount};
}

