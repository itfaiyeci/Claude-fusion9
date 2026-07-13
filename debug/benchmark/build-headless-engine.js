#!/usr/bin/env node
/**
 * Fusion 9 — Headless Engine Bundle Builder
 *
 * Oyun motorunu (GameCore, Board, generateLevel) ve F9Bot'un karar verme
 * mantığını tarayıcı OLMADAN, saf Node.js'te çalıştırılabilir hale getirir.
 *
 * [Oturum 15 — mimari iyileştirme] Artık dosya listesini build/manifest.js'ten
 * OKUYOR — eskiden burada elle tutulan ikinci bir liste vardı, bu da build.js
 * ile senkronizasyonu bozan hatalara yol açıyordu (Oturum 10, "GameCore is
 * not defined" hatası gibi). Tek kaynak = tek yerde güncelleme.
 *
 * Sadece core/game-engine.js'in "saf motor" kısmı (UI/render öncesi) dahil
 * edilir — PURE_ENGINE_END_LINE bu sınırı belirtir.
 *
 * ÇIKTI: debug/benchmark/.headless-bundle.js (git'e eklenmemeli)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, ".headless-bundle.js");
const MANIFEST = require(path.join(ROOT, "build/manifest.js"));

// core/game-engine.js'in generateLevel'ın bittiği satırı (UI/render kodu
// bundan SONRA başlıyor). DEĞİŞİRSE burayı güncelleyin.
// [Oturum 25] getLevelGoal() içine eklenen 1 satırlık yorum yüzünden bu
// sınır 349'dan 352'ye kaydı — eski değer F9Debug.log() çağrısının
// ORTASINDAN kesip sözdizimi hatası veriyordu (bkz. README.md Oturum 25).
const PURE_ENGINE_END_LINE = 352;

function build() {
  const parts = [];
  for (const rel of MANIFEST) {
    // debug/debug.js'in gerçek init()'i tam bir DOM paneli kuruyor —
    // headless benchmark için gereksiz ve kapsamlı DOM mock'u gerektirir.
    // core/debug-init-guard.js'deki otomatik stub mekanizması zaten
    // F9Debug'ı no-op olarak sağlıyor — bu yüzden burada atlıyoruz.
    if (rel === "debug/debug.js") continue;
    // [Oturum 22 — flow/ katmanı ayrımı] flow/*.js, eskiden game-engine.js
    // içinde PURE_ENGINE_END_LINE'ın SONRASINDA olduğu için headless
    // bundle'a hiç girmiyordu (render/DOM/F9Anim'e bağımlılar, F9Bot
    // bunları hiç çağırmıyor). Aynı davranışı korumak için atlıyoruz.
    if (rel.startsWith("flow/")) continue;
    const filePath = path.join(ROOT, rel);
    let content = fs.readFileSync(filePath, "utf-8");
    if (rel === "core/game-engine.js") {
      // Sadece saf motor kısmı — UI/render HARİÇ. game-engine.js'in kendi
      // kapanış "})();" satırı bu kesimde YOK, onu biz ekliyoruz (aşağıda).
      content = content.split("\n").slice(0, PURE_ENGINE_END_LINE).join("\n");
    }
    parts.push(`\n// ===== ${rel} =====\n${content}`);
  }

  const stubs = `
// ── Headless DOM stub'ları (sadece benchmark için) ──────────────
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
  documentElement: { style: { setProperty: () => {} } },
  querySelector: () => null,
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, addEventListener: () => {}, classList: { add(){}, remove(){} } }),
  body: { appendChild: () => {} },
};
global.requestAnimationFrame = () => {};
global.state = { _lastGeneratedLevel: null };
global.localStorage = {
  getItem: () => null, setItem: () => {}, removeItem: () => {},
};
global.prompt = () => "Test";
global.alert = () => {};
`;

  // ÖNEMLİ: core/bootstrap.js kendi sonunda ZATEN bir "(function () {"
  // açıyor (üretimde bunu core/game-engine.js'in "})();" satırı kapatıyor).
  // Üretimdeki AYNI iki-scope yapısını (dış scope + iç IIFE) koruyoruz —
  // bootstrap.js'i STRIP ETMİYORUZ, sadece kendi açtığı IIFE'yi biz
  // kapatıyoruz (çünkü game-engine.js'i kestik, kendi kapanışı gelmiyor).
  const code = stubs + "\n" + parts.join("\n") +
    "\nmodule.exports = { GameCore, generateLevel, Board, F9Bot, ALL_FIXED_SHAPES, findAllMatches };\n})();";

  fs.writeFileSync(OUT, code, "utf-8");

  try {
    require("child_process").execSync(`node -c "${OUT}"`, { stdio: "pipe" });
    console.log("✓ Headless bundle sözdizimi geçerli:", OUT);
  } catch (e) {
    console.error("✗ SÖZDİZİMİ HATASI:", e.stderr.toString());
    process.exit(1);
  }
}

build();
