#!/usr/bin/env node
/**
 * Fusion 9 — Build Script (v2 — revize edilmiş mimari)
 * Modüler dosyaları ORİJİNAL SIRAYLA birleştirip tek bir fusion9_clean.html üretir.
 * Kullanım: node build/build.js
 *
 * ÖNEMLİ: Gerçek ES module (import/export) KULLANILMIYOR. Orijinal kod tek
 * bir global scope (IIFE) içinde çalışacak şekilde yazılmıştı; bu build
 * script sadece dosyaları doğru sırada birleştirir. Davranış korunur.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "build", "template.html");
const OUTPUT_PATH = path.join(ROOT, "..", "fusion9_clean.html");

// Birleştirme sırası — DEĞİŞTİRMEYİN, orijinal script akışına karşılık gelir.
// Birleştirme sırası — TEK doğruluk kaynağı build/manifest.js'de
// (headless benchmark da aynı listeyi kullanır — bkz. o dosya).
const MANIFEST = require("./manifest.js");

function build() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  const jsParts = MANIFEST.map((rel) => {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Eksik dosya: ${rel}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return `\n// ===== ${rel} =====\n${content}`;
  });

  const combinedJs = jsParts.join("\n");
  const output = template.replace("/*__FUSION9_SCRIPT__*/", combinedJs);

  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");

  // Sözdizimi doğrulaması
  const { execSync } = require("child_process");
  const tmpJs = path.join(ROOT, "build", "_syntax_check.js");
  fs.writeFileSync(tmpJs, combinedJs, "utf-8");
  try {
    execSync(`node -c "${tmpJs}"`, { stdio: "pipe" });
    console.log("✓ Sözdizimi doğrulandı (node -c)");
  } catch (e) {
    console.error("✗ SÖZDİZİMİ HATASI:");
    console.error(e.stderr.toString());
    process.exitCode = 1;
    return;
  } finally {
    fs.unlinkSync(tmpJs);
  }

  // ⚠️ ÇALIŞMA ZAMANI DOĞRULAMASI — node -c SADECE sözdizimini kontrol eder,
  // "X is not defined" gibi scope/reference hatalarını YAKALAMAZ (bkz.
  // Oturum 10'daki GameCore/IIFE sınır hatası). Bu yüzden burada minimal
  // DOM stub'larıyla dosyayı GERÇEKTEN ÇALIŞTIRIYORUZ.
  const runtimeCheckJs = path.join(ROOT, "build", "_runtime_check.js");
  const runtimeStubs = `
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = {
  documentElement: { style: { setProperty: () => {} } },
  head: { appendChild: () => {} },
  querySelector: () => null, querySelectorAll: () => [],
  getElementById: (id) => ({ style:{}, dataset:{}, classList:{add(){},remove(){},contains:()=>false}, addEventListener(){}, appendChild(){}, querySelector:()=>null, querySelectorAll:()=>[], setAttribute(){}, innerHTML:"" }),
  addEventListener: () => {}, removeEventListener: () => {},
  createElement: () => ({ style: {}, addEventListener(){}, classList:{add(){},remove(){}}, setAttribute(){}, appendChild(){} }),
  body: { appendChild: () => {}, style:{} },
};
global.requestAnimationFrame = () => {};
global.prompt = () => "Oyuncu";
global.alert = () => {};
global.confirm = () => true;
global.AudioContext = function(){ return { createOscillator:()=>({connect(){},start(){},stop(){}}), createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}), destination:{}, currentTime:0 }; };
`;
  fs.writeFileSync(runtimeCheckJs, runtimeStubs + "\n" + combinedJs + "\n\nsetTimeout(() => process.exit(0), 800);\n", "utf-8");
  try {
    execSync(`node "${runtimeCheckJs}"`, { stdio: "pipe", timeout: 10000 });
    console.log("✓ Çalışma zamanı doğrulandı (script hatasız çalıştı)");
  } catch (e) {
    console.error("✗ ÇALIŞMA ZAMANI HATASI (node -c bunu YAKALAYAMAZ, dikkat):");
    console.error(e.stderr && e.stderr.toString() ? e.stderr.toString() : e.message);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(runtimeCheckJs)) fs.unlinkSync(runtimeCheckJs);
  }

  console.log(`✓ Çıktı yazıldı: ${OUTPUT_PATH}`);
  console.log(`  Toplam JS satırı: ${combinedJs.split("\n").length}`);
}

build();
