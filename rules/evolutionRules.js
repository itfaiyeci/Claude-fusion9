// [Oturum 15 — rules/ katmanı] Fusion 9 evrim (hediye terfi) sistemi
// sabitleri ve denge değerleri. Mantık (mekanizma fonksiyonları)
// engine/evolutionEngine.js'de — bu dosya SADECE sayısal/yapısal
// sabitler içerir, hiç fonksiyon YOK.
//
// [Oturum 24 — KULLANICI KARARI: DONDURULDU] Bu dosyadaki tüm sabitler
// (blast boyutları, enerji değerleri, spawn patlama şekilleri) ölçülmüş
// üretim/nadirlik verisiyle (bkz. HANDOFF.md) birlikte RESMİ ilan edildi.
// Değiştirmeden önce kullanıcıya sor.

const GIFT_COPPER="bakir", GIFT_BRONZE="bronz", GIFT_SILVER="gumus", GIFT_GOLD="altin", GIFT_DIAMOND="elmas";
const GIFT_ORDER=[GIFT_COPPER,GIFT_BRONZE,GIFT_SILVER,GIFT_GOLD,GIFT_DIAMOND];
const GROUP_TO_GIFT={a:GIFT_COPPER,b:GIFT_BRONZE,c:GIFT_SILVER,d:GIFT_GOLD,e:GIFT_DIAMOND};
const PROMOTION_CHAIN={[GIFT_COPPER]:GIFT_BRONZE,[GIFT_BRONZE]:GIFT_SILVER,[GIFT_SILVER]:GIFT_GOLD,[GIFT_GOLD]:GIFT_DIAMOND,[GIFT_DIAMOND]:"extra_move"};

// [YENİ — Oturum 7, kullanıcı onayıyla eklendi] Aynı-tür hediye
// kombinasyonu (bakır+bakır, bronz+bronz, ...) artık element üretmenin
// YANINDA satır+sütun boyunca haç şeklinde bir patlama da yapıyor.
// Boyut: bakır=3, bronz=4, gümüş=5, altın=6, elmas=7 hücre (yatay+dikey,
// merkez ortak). Kum saati bonus patlaması (2x2) kullanıcı kararıyla
// İPTAL edildi — kum saati küçük patlaması 3x3 olarak kalıyor.
const SAME_TYPE_BLAST_SIZE = {
  [GIFT_COPPER]: 3, [GIFT_BRONZE]: 4, [GIFT_SILVER]: 5, [GIFT_GOLD]: 6, [GIFT_DIAMOND]: 7,
};
// [Oturum 29 — kullanıcı referansı] Tüm karışık/terfi patlama
// boyutlarının TEK ortak kaynağı: her kademenin kendi "boyut numarası"
// (SAME_TYPE_BLAST_SIZE ile AYNI: bakır=3, bronz=4, gümüş=5, altın=6,
// elmas=7). Karışık-tür kombinasyonlarda (aşağıda DIFFERENT_TYPE_AREA_
// COMBOS) yatay=min(boyutA,boyutB), dikey=max(boyutA,boyutB) — kullanıcı
// tablosuyla birebir. Terfi (+9, GIFT_PROMO_BLAST) simetrik: kademe+9
// için boyut = kendi TIER_SIZE'ının bir fazlası (aşağıda ayrıca not).
const TIER_SIZE = SAME_TYPE_BLAST_SIZE;

// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10j] Mekanizma 1:
// c/d/e grupları (5'li/6'lı/7'li) artık enerji de veriyor.
const GROUP_TO_ENERGY={c:3, d:6, e:12};
// Mekanizma 2'nin son halkası (Elmas+9) artık enerji de veriyor.

// ALAN PATLAMASI boyutları (satır, sütun). Mekanizma 2 (terfi).
// Alan patlaması - artı formu offset'leri (skor_eşleşme.txt)
// [Oturum 29 — ARTIK SADECE Mekanizma 1'in (a/b/d grupları, normal
// eşleşme sonrası hediye üretmeyen alan patlamaları) kullandığı tablo.
// Terfi (+9, Mekanizma 2) ve karışık-tür (Mekanizma 3c) artık BU
// tabloyu KULLANMIYOR — ikisi de areaBlastCells()'in ince nRows/nCols
// haç üretme yoluna (giftType=false ile) yönlendiriliyor, bkz.
// GIFT_PROMO_BLAST ve DIFFERENT_TYPE_AREA_COMBOS aşağıda.]
const AREA_BLAST_OFFSETS={
  // Normal patlama (gift+9 olmadan) — artı formu
  normal:{
    [GIFT_COPPER]: [[-1,0],[0,-1],[0,1],[1,0]],                                    // 5 hücre
    [GIFT_BRONZE]: [[-2,0],[-1,0],[0,-2],[0,-1],[0,1],[0,2],[1,0]],               // 8 hücre
    [GIFT_SILVER]: [[-3,0],[-2,0],[-1,0],[0,-3],[0,-2],[0,-1],[0,1],[0,2],[0,3],[1,0],[2,0],[3,0]], // 13
    [GIFT_GOLD]:   [[-3,0],[-2,0],[-1,-1],[-1,0],[-1,1],[0,-3],[0,-2],[0,-1],[0,1],[0,2],[0,3],[1,-1],[1,0],[1,1],[2,0],[3,0]], // 17
    // Elmas: alan patlaması yok (extra_move veriyor), null → areaBlastCells fallback kullanır
    [GIFT_DIAMOND]: null,
  },
  // +9 patlaması — ARTIK KULLANILMIYOR (bkz. yukarıdaki not) — tarihsel
  // referans için tutuluyor, hiçbir kod yolu buraya erişmiyor.
  nine:{
    [GIFT_COPPER]: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],       // 3x3 = 9
    [GIFT_BRONZE]: [[-1,0],[-1,1],[0,-1],[0,1],[0,2],[1,-1],[1,0],[1,1],[1,2],[2,0],[2,1]], // 12
    [GIFT_SILVER]: [[-2,0],[-2,1],[-1,0],[-1,1],[0,-2],[0,-1],[0,1],[0,2],[0,3],[1,-2],[1,-1],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[3,0],[3,1]], // 20
    [GIFT_GOLD]:   [[-3,0],[-3,1],[-2,0],[-2,1],[-1,0],[-1,1],[0,-3],[0,-2],[0,-1],[0,1],[0,2],[0,3],[0,4],[1,-3],[1,-2],[1,-1],[1,0],[1,1],[1,2],[1,3],[1,4],[2,0],[2,1],[3,0],[3,1],[4,0],[4,1]], // 28
    [GIFT_DIAMOND]: null,
  },
};
const AREA_BLAST_SIZES={
  [GIFT_COPPER]:[3,3],[GIFT_BRONZE]:[3,4],[GIFT_SILVER]:[4,5],[GIFT_GOLD]:[5,6],
};

// Hediye SPAWN anında tetiklenen patlama boyutları
// Bakır: yok (en zayıf, sadece spawn), Bronz: komşu 4 hücre (artı),
// Gümüş: satır+sütun (haç), Altın: İNCE haç (5 yatay+5 dikey — Oturum 28'de
// düzeltildi, bkz. core/GameCore.js _applyGiftSpawn()), Elmas: tüm tahta efekti
const GIFT_SPAWN_BLAST = {
  [GIFT_COPPER]:  null,        // sadece spawn, patlama yok
  [GIFT_BRONZE]:  "cross4",    // komşu 4 hücre (yukarı/aşağı/sol/sağ)
  [GIFT_SILVER]:  "rowcol",    // spawn noktasının satırı + sütunu
  [GIFT_GOLD]:    [5,5],       // 5x5 alan
  [GIFT_DIAMOND]: "board",     // tüm tahta (efekt, blocker kırar)
};

// [Oturum 29 — kullanıcı kararı, DÜZELTİLDİ] Hediye+9 terfi patlaması:
// ARTIK SİMETRİK İNCE HAÇ, ama areaBlastCells()'in [nRows,nCols] yolu
// yerine crossOffsets() kullanıyor (SAME_TYPE_BLAST_SIZE ile AYNI
// mekanizma) — İKİ SEBEP: (1) "N hücre" ifadesi bu kod tabanında
// HER YERDE crossOffsets()'e verilen PARAMETRE anlamına geliyor
// (SAME_TYPE_BLAST_SIZE'daki "3/4/5/6/7 hücre" ifadesi de böyle), gerçek
// toplam hücre sayısı değil; [nRows,nCols] formülü FARKLI bir toplam
// üretiyordu (test sırasında bulundu: [4,4] → 7 hücre, beklenen 4 değil).
// (2) [8,8] (Elmas+9) yanlışlıkla areaBlastCells()'in "nRows/nCols ≥
// board boyutu → TÜM TAHTA" özel durumuna denk geliyordu — Elmas+9
// hâlâ 64 hücre (tüm tahta) patlatıyordu, kullanıcının "tüm tahta
// DEĞİL, 8 hücre haç" kararına aykırıydı. Bu YENİDEN test edilip
// doğrulandı (bkz. README.md Oturum 29). Boyut = TIER_SIZE[kademe]+1:
// bakır+9→4, bronz+9→5, gümüş+9→6, altın+9→7, elmas+9→8.
// NOT: bu değişiklik _maybeApplyAreaBoost() (enerji ile alan büyütme
// satın alma) özelliğinin terfi patlamalarını ARTIK etkilemediği
// anlamına geliyor (crossOffsets sabit bir liste, [nRows,nCols] değil)
// — mechanism3c (karışık-tür kombinasyon) için bu özellik hâlâ çalışıyor.
const GIFT_PROMO_CROSS_SIZE = {
  [GIFT_COPPER]:  4,   // Bakır+9 → Bronz
  [GIFT_BRONZE]:  5,   // Bronz+9 → Gümüş
  [GIFT_SILVER]:  6,   // Gümüş+9 → Altın
  [GIFT_GOLD]:    7,   // Altın+9 → Elmas
  [GIFT_DIAMOND]: 8,   // Elmas+9 → "Matrix Eşleşme" (+3 hamle, TÜM TAHTA DEĞİL)
};

// [Oturum 29 — kullanıcı kararı: RETIRE EDİLDİ] Mekanizma 3b (Bakır+
// farklı-tür → rastgele 3x3 blok sayısı) kaldırıldı. Bakır+farklı-tür
// çiftleri artık DİĞER TÜM karışık-tür çiftleriyle AYNI mekanizmayı
// (Mekanizma 3c, aşağıdaki DIFFERENT_TYPE_AREA_COMBOS) kullanıyor —
// satır/sütun ince haç, kullanıcı kararı: "evet, bakır çiftleri de
// aynı haç kuralına geçsin". Eski COPPER_BLAST_EXTRA_3X3_BLOCKS sabiti
// ve mechanism3bCopperBlast() fonksiyonu (engine/evolutionEngine.js)
// kaldırıldı — artık hiçbir kod yolu bunlara erişmiyor.

// Mekanizma 3c: farklı-tür kombinasyonu -> [hamle_bonusu, [dikey,yatay]]
// [Oturum 29 — kullanıcı tablosuyla YENİDEN YAZILDI] Her kademenin
// TIER_SIZE'ı kullanılarak yatay=min(A,B), dikey=max(A,B) — kullanıcının
// verdiği tam tabloyla birebir. Bakır çiftleri YENİ eklendi (eskiden
// Mekanizma 3b'ydi, hamle/enerji bonusu yoktu — aynı şekilde 0 tutuldu).
// Diğer çiftlerin hamle/enerji bonusları DEĞİŞMEDİ, sadece alan boyutları
// yeni formüle göre güncellendi.
const DIFFERENT_TYPE_AREA_COMBOS={
  // Bakır çiftleri (Oturum 29'da yeni, Mekanizma 3b'nin yerine)
  [pairKey(GIFT_COPPER,GIFT_BRONZE)]: [0, [4,3]],   // 3 yatay, 4 dikey
  [pairKey(GIFT_COPPER,GIFT_SILVER)]: [0, [5,3]],   // 3 yatay, 5 dikey
  [pairKey(GIFT_COPPER,GIFT_GOLD)]:   [0, [6,3]],   // 3 yatay, 6 dikey
  [pairKey(GIFT_COPPER,GIFT_DIAMOND)]:[0, [7,3]],   // 3 yatay, 7 dikey
  // Diğer çiftler (hamle/enerji AYNI kaldı, alan boyutu güncellendi)
  [pairKey(GIFT_BRONZE,GIFT_SILVER)]: [3, [5,4]],   // 4 yatay, 5 dikey
  [pairKey(GIFT_BRONZE,GIFT_GOLD)]:   [5, [6,4]],   // 4 yatay, 6 dikey
  [pairKey(GIFT_BRONZE,GIFT_DIAMOND)]:[7, [7,4]],   // 4 yatay, 7 dikey
  [pairKey(GIFT_SILVER,GIFT_GOLD)]:   [6, [6,5]],   // 5 yatay, 6 dikey
  [pairKey(GIFT_SILVER,GIFT_DIAMOND)]:[8, [7,5]],   // 5 yatay, 7 dikey — enerji de var (aşağıda)
  [pairKey(GIFT_GOLD,GIFT_DIAMOND)]:  [5, [7,6]],   // 6 yatay, 7 dikey — enerji de var (aşağıda)
};
// [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10k]
// Gümüş+Elmas ve Altın+Elmas artık HEM enerji HEM alan patlaması veriyor
// (kullanıcı kararı — Enerji üretimi alan patlamasıyla BİRLİKTE geri geldi).
const DIFFERENT_TYPE_ENERGY={
  [pairKey(GIFT_SILVER,GIFT_DIAMOND)]: 4,   // Gümüş+Elmas
  [pairKey(GIFT_GOLD,GIFT_DIAMOND)]: 10,    // Altın+Elmas
};
// Alan boyutu -> garanti "sanal combo" sayısı (kullanıcı kararı:
// "alan patlamasından sonra derecesine göre mutlaka combo olmalı").
// [Oturum 29 — yeni areaSize değerlerine göre yeniden sıralandı: rank,
// çiftin TIER_SIZE toplamına göre (7→1 ... 13→7, artan zorluk/değer).]
const AREA_SIZE_TO_COMBO_COUNT={
  "4,3":1,  // bakır+bronz (toplam 7)
  "5,3":2,  // bakır+gümüş (8)
  "6,3":3,  // bakır+altın (9)
  "5,4":3,  // bronz+gümüş (9)
  "7,3":4,  // bakır+elmas (10)
  "6,4":4,  // bronz+altın (10)
  "7,4":5,  // bronz+elmas (11)
  "6,5":5,  // gümüş+altın (11)
  "7,5":6,  // gümüş+elmas (12)
  "7,6":7,  // altın+elmas (13)
};
const VIRTUAL_COMBO_POINTS=45; // combo bonusu ½ 3lü eşleşme kadar

// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10h] Garanti
// hediye eşiği: kullanıcı kararı "her oyunda hediye süreç içinde olmalı".
const GUARANTEED_GIFT_THRESHOLD=0.6;
