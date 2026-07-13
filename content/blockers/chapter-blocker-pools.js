// [Oturum 17 — content/ katmanı] Bölüme göre engel havuzu — eskiden
// core/game-engine.js'de if/else zinciri olan allowedBlockersForChapter()
// fonksiyonunun İÇİNDEKİ VERİ, gerçek bir tabloya çevrildi. Fonksiyonun
// kendisi (ince bir arama/lookup) core/game-engine.js'de kaldı.
// Bu dosya rules/blockerRules.js'TEN SONRA yüklenmeli (BLOCKER_* sabitlerine
// ihtiyaç duyuyor).
const CHAPTER_BLOCKER_POOLS = [
  { maxChapter: 1, blockers: [BLOCKER_WOOD] },                                          // Bölüm 1: ağaç (en zayıf)
  { maxChapter: 2, blockers: [BLOCKER_WOOD, BLOCKER_GLASS] },                            // Bölüm 2: ağaç + cam
  { maxChapter: 3, blockers: [BLOCKER_GLASS, BLOCKER_ROCK, BLOCKER_ICE] },               // Bölüm 3: cam/kaya/buz
  { maxChapter: 4, blockers: [BLOCKER_ROCK, BLOCKER_ICE, BLOCKER_COPPER, BLOCKER_IRON] },// Bölüm 4
  { maxChapter: 5, blockers: [BLOCKER_ICE, BLOCKER_IRON, BLOCKER_COPPER, BLOCKER_LOCK, BLOCKER_FOG] }, // Bölüm 5
  { maxChapter: 6, blockers: [BLOCKER_IRON, BLOCKER_COPPER, BLOCKER_STEEL, BLOCKER_LOCK, BLOCKER_FOG] }, // Bölüm 6
  { maxChapter: null, blockers: [BLOCKER_WOOD, BLOCKER_GLASS, BLOCKER_ROCK, BLOCKER_ICE, BLOCKER_IRON, BLOCKER_COPPER, BLOCKER_STEEL, BLOCKER_LOCK, BLOCKER_DOUBLE_ICE, BLOCKER_FOG, BLOCKER_CRATE] }, // Bölüm 7+: hepsi (null = sınırsız)
];
