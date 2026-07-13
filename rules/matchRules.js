// [Oturum 15 — rules/ katmanı] Eşleşme şekil şablonları ve grup
// sabitleri. Mantık (Sh() fabrikası, findAllMatches vb.)
// engine/matchEngine.js'de. Sh() fonksiyon-hoisting sayesinde
// (bkz. TASARIM notu) bu dosyanın Sh()'ten ÖNCE yüklenmesi güvenli.
//
// [Oturum 30 — KULLANICI VERİSİ] Tüm şekil koordinatları (3/4/5/6/7'li
// bloklar) kullanıcının verdiği tam koordinat listesiyle DEĞİŞTİRİLDİ
// (bkz. HANDOFF.md + README.md Oturum 30). 3'lü bloklar zaten birebir
// aynıydı (değişmedi). 4'lü ve 5'li gruplar eskiden 8/12 şekildi,
// kullanıcının listesiyle 12/12'ye netleşti (4'lüde L+Tack'ın yerini
// 12 farklı blok aldı). 6'lı ve 7'li gruplar aynı sayıda (4'er) ama
// kullanıcının verdiği TAM koordinatlarla değiştirildi — bu arada
// eski SIX_SHAPES'teki 2 şeklin (six_2, six_3) normalize edilmemiş
// (satır/sütunu 0'dan başlamayan) koordinatları vardı; bu, arama
// motorunun (findAllMatches, maxDr/maxDc tabanlı) board'un en üst/sol
// kenarında o şekli hiç test edememesi anlamına geliyordu — GİZLİ BİR
// KÖR NOKTA. Kullanıcının verileri zaten hepsi normalize (min satır/
// sütun=0) olduğu için bu sorun da yan etki olarak düzeldi.

const GROUP_A="a",GROUP_B="b",GROUP_C="c",GROUP_D="d",GROUP_E="e";

// 3'lü bloklar — DEĞİŞMEDİ (kullanıcının verisiyle zaten birebir aynıydı,
// doğrulandı: 4 köşe şekli + satır/sütun çizgisi 3 spawn noktasıyla).
const SMALL_CORNER_SHAPES=[
  Sh("kkose_1",GROUP_A,[[0,1],[1,0],[1,1]],[1,1]), Sh("kkose_2",GROUP_A,[[0,0],[0,1],[1,0]],[0,0]),
  Sh("kkose_3",GROUP_A,[[0,0],[0,1],[1,1]],[0,1]), Sh("kkose_4",GROUP_A,[[0,0],[1,0],[1,1]],[1,0]),
];

// 4'lü bloklar — Oturum 30: eski L_SHAPES(4)+TACK_SHAPES(4)=8 şeklin
// yerine kullanıcının verdiği 12 blok geçti (çizgi hariç, çizgi ayrı
// LINE_4_H/V mekanizmasıyla değişmeden devam ediyor).
const BLOCK_4_SHAPES=[
  Sh("b4_01",GROUP_B,[[0,0],[1,0],[2,0],[1,1]],[1,0]),
  Sh("b4_02",GROUP_B,[[0,1],[1,1],[2,1],[1,0]],[1,1]),
  Sh("b4_03",GROUP_B,[[0,0],[0,1],[0,2],[1,1]],[0,1]),
  Sh("b4_04",GROUP_B,[[1,0],[1,1],[1,2],[0,1]],[1,1]),
  Sh("b4_05",GROUP_B,[[0,0],[0,1],[1,1],[2,1]],[2,1]),
  Sh("b4_06",GROUP_B,[[0,0],[1,0],[2,0],[2,1]],[2,0]),
  // [Oturum 61 — kullanıcı düzeltmesi: "b4_07 b4_06'nın aynası olsun"]
  // b4_06'nın (sütun eksenine göre, c -> 1-c) GERÇEK aynası — eski
  // b4_07 (Oturum 32'den beri b4_05 ile birebir aynı hücrelerdi, bkz.
  // Oturum 60'ın b4_dual denemesi) yerine geldi. Kullanıcının önerdiği
  // ham koordinatlar (0,0)(1,0)(1,1)(1,2) kontrol edilince b4_11 ile
  // birebir çakıştığı bulundu (aynı hata, farklı çift) — bu yüzden
  // gerçek aynalama hesaplanıp kullanıldı. Diğer 35 şekille TEK TEK
  // karşılaştırıldı, çakışma YOK (bkz. debug script doğrulaması).
  Sh("b4_07",GROUP_B,[[0,1],[1,1],[2,1],[2,0]],[2,1]),
  Sh("b4_08",GROUP_B,[[0,0],[1,0],[2,0],[0,1]],[0,0]),
  Sh("b4_09",GROUP_B,[[0,0],[0,1],[0,2],[1,0]],[0,0]),
  Sh("b4_10",GROUP_B,[[0,0],[0,1],[0,2],[1,2]],[0,2]),
  Sh("b4_11",GROUP_B,[[1,0],[1,1],[1,2],[0,0]],[1,0]),
  Sh("b4_12",GROUP_B,[[1,0],[1,1],[1,2],[0,2]],[1,2]),
];

// 5'li bloklar — Oturum 30: eski CORNER_5_SHAPES(4)+U_SHAPES(4)+
// T_SHAPES(4)=12 şeklin yerine kullanıcının verdiği 12 blok geçti
// (aynı sayı, tamamen yeni koordinatlar).
const BLOCK_5_SHAPES=[
  Sh("b5_01",GROUP_C,[[0,0],[1,0],[2,0],[0,1],[2,1]],[1,0]),
  Sh("b5_02",GROUP_C,[[0,1],[1,1],[2,1],[0,0],[2,0]],[1,1]),
  Sh("b5_03",GROUP_C,[[0,0],[1,0],[1,1],[0,2],[1,2]],[1,1]),
  Sh("b5_04",GROUP_C,[[0,0],[1,0],[0,1],[0,2],[1,2]],[0,1]),
  Sh("b5_05",GROUP_C,[[0,2],[1,2],[2,2],[2,1],[2,0]],[2,2]),
  Sh("b5_06",GROUP_C,[[0,2],[1,2],[2,2],[0,1],[0,0]],[0,2]),
  Sh("b5_07",GROUP_C,[[0,2],[0,1],[0,0],[1,0],[2,0]],[0,0]),
  Sh("b5_08",GROUP_C,[[2,2],[2,1],[2,0],[1,0],[0,0]],[2,0]),
  Sh("b5_09",GROUP_C,[[0,0],[1,0],[2,0],[1,1],[1,2]],[1,0]),
  Sh("b5_10",GROUP_C,[[0,2],[1,2],[2,2],[1,1],[1,0]],[1,2]),
  Sh("b5_11",GROUP_C,[[0,0],[0,1],[0,2],[1,1],[2,1]],[2,1]),
  Sh("b5_12",GROUP_C,[[2,0],[2,1],[2,2],[1,1],[0,1]],[0,1]),
];

// 6'lı bloklar — Oturum 30: eski SIX_SHAPES(4) tamamen değiştirildi
// (kullanıcının verdiği koordinatlar — 2 tanesi eskiden normalize
// edilmemişti, bkz. dosya başı notu).
const BLOCK_6_SHAPES=[
  Sh("b6_01",GROUP_D,[[0,0],[1,0],[2,0],[3,0],[4,0],[2,1]],[2,0]),
  Sh("b6_02",GROUP_D,[[0,1],[1,1],[2,1],[3,1],[4,1],[2,0]],[2,1]),
  Sh("b6_03",GROUP_D,[[1,0],[1,1],[1,2],[1,3],[1,4],[0,2]],[1,2]),
  Sh("b6_04",GROUP_D,[[0,0],[0,1],[0,2],[0,3],[0,4],[1,2]],[0,2]),
];

// 7'li bloklar — Oturum 30: eski SEVEN_SHAPES(4) tamamen değiştirildi.
const BLOCK_7_SHAPES=[
  Sh("b7_01",GROUP_E,[[0,0],[1,0],[2,0],[3,0],[4,0],[2,1],[2,2]],[2,0]),
  Sh("b7_02",GROUP_E,[[0,2],[1,2],[2,2],[3,2],[4,2],[2,1],[2,0]],[2,2]),
  Sh("b7_03",GROUP_E,[[2,0],[2,1],[2,2],[2,3],[2,4],[1,2],[0,2]],[2,2]),
  Sh("b7_04",GROUP_E,[[0,0],[0,1],[0,2],[0,3],[0,4],[1,2],[2,2]],[0,2]),
];

const ALL_FIXED_SHAPES=[...SMALL_CORNER_SHAPES,...BLOCK_4_SHAPES,...BLOCK_5_SHAPES,...BLOCK_6_SHAPES,...BLOCK_7_SHAPES];
const LINE_3_H=[[0,0],[0,1],[0,2]], LINE_3_V=[[0,0],[1,0],[2,0]], LINE_3_SPAWN_OFFSETS=[0,1,2];
const LINE_4_H=[[0,0],[0,1],[0,2],[0,3]], LINE_4_V=[[0,0],[1,0],[2,0],[3,0]], LINE_4_SPAWN_OFFSETS=[1,2];
const LINE_5_H=[[0,0],[0,1],[0,2],[0,3],[0,4]], LINE_5_V=[[0,0],[1,0],[2,0],[3,0],[4,0]], LINE_5_SPAWN_OFFSET=2;
