
const BLOCKER_GLASS="cam", BLOCKER_ROCK="kaya", BLOCKER_ICE="buz", BLOCKER_IRON="demir";
const BLOCKER_WOOD="agac";
const BLOCKER_COPPER="bakir_engel"; // Bakır: orta güç, 2 vuruşla kırılır
const BLOCKER_STEEL="celik"; // Çelik: en güçlü, yalnızca Yıldırım+9 veya Süper Patlama
// YENİ ENGELLER
const BLOCKER_LOCK="kilit";        // Kilit: yalnızca komşu eşleşmeyle açılır
const BLOCKER_DOUBLE_ICE="cift_buz"; // Çift Buz: 2 kez vurulması gerekir
const BLOCKER_FOG="sis";           // Sis: altındaki taşı gizler (görünmez)
const BLOCKER_CRATE="kasa";        // Kasa: sadece doğrudan bitişik eşleşmeyle kırılır
const BLOCKER_POWER={
  [BLOCKER_GLASS]:-4,[BLOCKER_ROCK]:-6,[BLOCKER_ICE]:-8,[BLOCKER_IRON]:-10,
  [BLOCKER_WOOD]:-2,        // ağaç: en zayıf, normal eşleşmeyle de kırılabilir
  [BLOCKER_COPPER]:-6,      // bakır: orta, 2 kat
  [BLOCKER_STEEL]:-14,      // çelik: en güçlü
  [BLOCKER_LOCK]:-8,       // güç bazlı değil ama fallback için
  [BLOCKER_DOUBLE_ICE]:-10,// ilk vuruda -10, katman 2'ye düşer
  [BLOCKER_FOG]:-6,        // tek vuruyla kalkar
  [BLOCKER_CRATE]:-8,      // komşu eşleşme gerekir
};

// Katmanlı engel: bu engeller vurulunca bir alt katmana iner
const BLOCKER_NEXT_LAYER = {
  [BLOCKER_DOUBLE_ICE]: BLOCKER_ICE,  // çift buz → tek buz
  [BLOCKER_COPPER]: BLOCKER_WOOD,   // bakır engel: 1.kat → ağaç → kırıldı
  [BLOCKER_STEEL]: BLOCKER_COPPER,  // çelik: 1.kat → bakır engel → ağaç → kırıldı (3 vuruş)
};

// Katman sayısı (görsel badge)
const BLOCKER_LAYERS = {
  [BLOCKER_GLASS]:1,[BLOCKER_ROCK]:1,[BLOCKER_ICE]:1,[BLOCKER_IRON]:1,[BLOCKER_WOOD]:1,[BLOCKER_COPPER]:2,[BLOCKER_STEEL]:3,
  [BLOCKER_LOCK]:1,[BLOCKER_DOUBLE_ICE]:2,[BLOCKER_FOG]:1,[BLOCKER_CRATE]:1,
};

// Görsel label ve renk
const BLOCKER_LABEL={
  [BLOCKER_GLASS]:"Cam",[BLOCKER_ROCK]:"Kaya",[BLOCKER_ICE]:"Buz",[BLOCKER_IRON]:"Demir",[BLOCKER_WOOD]:"Ağaç",[BLOCKER_COPPER]:"Bakır Engel",[BLOCKER_STEEL]:"Çelik",
  [BLOCKER_LOCK]:"Kilit",[BLOCKER_DOUBLE_ICE]:"Çift Buz",[BLOCKER_FOG]:"Sis",[BLOCKER_CRATE]:"Kasa",
};
const BLOCKER_COLOR={
  [BLOCKER_GLASS]:"#7FA8C9",[BLOCKER_ROCK]:"#8B7355",[BLOCKER_ICE]:"#A8D8E8",[BLOCKER_IRON]:"#6B6B70",[BLOCKER_WOOD]:"#A0784A",[BLOCKER_COPPER]:"#C17A4D",[BLOCKER_STEEL]:"#9AAABB",
  [BLOCKER_LOCK]:"#E0B23C",[BLOCKER_DOUBLE_ICE]:"#6DD5FA",[BLOCKER_FOG]:"#9B9BAA",[BLOCKER_CRATE]:"#B08D57",
};
const BLOCKER_ICON={
  [BLOCKER_GLASS]:"🪟",[BLOCKER_ROCK]:"🪨",[BLOCKER_ICE]:"🧊",[BLOCKER_IRON]:"⚙️",[BLOCKER_WOOD]:"🪵",[BLOCKER_COPPER]:"🔶",[BLOCKER_STEEL]:"🔒",
  [BLOCKER_LOCK]:"🔒",[BLOCKER_DOUBLE_ICE]:"❄️❄️",[BLOCKER_FOG]:"🌫️",[BLOCKER_CRATE]:"📦",
};
