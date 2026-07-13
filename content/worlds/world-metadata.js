// [Oturum 17 — content/ katmanı, Oturum 21'de TEK YETKİLİ KAYNAK yapıldı]
// Dünya (world/chapter) meta verisi. UI'da harita/level-başlangıç
// ekranlarında DOĞRUDAN kullanılıyor (bkz. ui/screens.js — eskiden orada
// 8 bölümlük, level 70'e kadar giden AYRI bir kopya vardı, level 71+
// oyuncular yanlış bölüm adı görüyordu — bu tutarsızlık giderildi).
//
// ✅ ÇÖZÜLDÜ (Oturum 25): content/levels/chapter-database.js'teki
// isim/tema kopyası KALDIRILDI — artık bu dosya (WORLD_DATABASE) tek
// kaynak, chapter-database.js sadece worldForLevel() üzerinden buraya
// bakıyor (bkz. core/game-engine.js getLevelGoal()). Elle senkron
// tutma ihtiyacı kalmadı.
const WORLD_DATABASE = [
  { chapter: 1,  name: "Başlangıç Adası",      theme: "wood",     icon: "🏝️", color: "#5DCAA5", levelRange: [1, 10] },
  { chapter: 2,  name: "Bakır Vadisi",          theme: "copper",   icon: "🟤", color: "#C17A4D", levelRange: [11, 20] },
  { chapter: 3,  name: "Bronz Dağları",         theme: "bronze",   icon: "⛰️", color: "#B08D57", levelRange: [21, 30] },
  { chapter: 4,  name: "Gümüş Ormanı",          theme: "silver",   icon: "🌲", color: "#C7CDD6", levelRange: [31, 40] },
  { chapter: 5,  name: "Altın Kalesi",          theme: "gold",     icon: "🏰", color: "#E0B23C", levelRange: [41, 50] },
  { chapter: 6,  name: "Elmas Zirvesi",         theme: "diamond",  icon: "💎", color: "#3E8FD4", levelRange: [51, 60] },
  { chapter: 7,  name: "Kristal Krallık",       theme: "crystal",  icon: "🔮", color: "#B95DE0", levelRange: [61, 70] },
  { chapter: 8,  name: "Volkan Adası",          theme: "volcano",  icon: "🌋", color: "#E0473C", levelRange: [71, 80] },
  { chapter: 9,  name: "Kar Zirvesi",           theme: "snow",     icon: "🏔️", color: "#8FCFE0", levelRange: [81, 90] },
  { chapter: 10, name: "Alacakaranlık Ormanı",  theme: "dark",     icon: "🌲", color: "#5A5570", levelRange: [91, 100] },
  { chapter: 11, name: "Denizaltı Dünyası",     theme: "ocean",    icon: "🌊", color: "#2E86C1", levelRange: [101, 110] },
  { chapter: 12, name: "Gökyüzü Kalesi",        theme: "sky",      icon: "☁️", color: "#85C1E9", levelRange: [111, 120] },
  { chapter: 13, name: "Eski Tapınak",          theme: "ancient",  icon: "🏛️", color: "#A67C52", levelRange: [121, 130] },
  { chapter: 14, name: "Ejderha Yuvası",        theme: "dragon",   icon: "🐉", color: "#C0392B", levelRange: [131, 140] },
  { chapter: 15, name: "Zamansız Kule",         theme: "timeless", icon: "⏳", color: "#7D6B91", levelRange: [141, 150] },
  { chapter: 16, name: "Işık İmparatorluğu",    theme: "light",    icon: "✨", color: "#F4D03F", levelRange: [151, 160] },
  { chapter: 17, name: "Karanlık Boyut",        theme: "void",     icon: "🌑", color: "#34495E", levelRange: [161, 170] },
  { chapter: 18, name: "Sonsuz Fırtına",        theme: "storm",    icon: "⛈️", color: "#5D6D7E", levelRange: [171, 180] },
  { chapter: 19, name: "Phoenix Ülkesi",        theme: "phoenix",  icon: "🔥", color: "#E67E22", levelRange: [181, 190] },
  { chapter: 20, name: "Efsane Kulesi",         theme: "legend",   icon: "🗼", color: "#E0473C", levelRange: [191, null] }, // null = sonsuz
];

function worldForLevel(levelNumber) {
  return WORLD_DATABASE.find(w =>
    levelNumber >= w.levelRange[0] && (w.levelRange[1] === null || levelNumber <= w.levelRange[1])
  ) || WORLD_DATABASE[WORLD_DATABASE.length - 1];
}
