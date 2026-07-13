# Fusion 9 — Modüler Kaynak Yapısı (v2)

## Nasıl çalışır?
Gerçek ES modülleri (import/export) **kullanılmıyor**. Orijinal kod tek bir
global scope (IIFE) içinde çalışacak şekilde yazılmıştı; bunu bozmamak için
`build/build.js`, dosyaları **orijinal sırayla** tek bir `<script>` bloğunda
birleştirip `fusion9_clean.html` üretir.

```
cd fusion9-src2
node build/build.js
```

Doğrulandı: eski/yeni JS içerik olarak birebir aynı mantığı üretiyor (sadece
dosya-başlığı yorumları eklendi). `file://` ile de, sunucudan da çalışır.

## Mimari kararlar (bu revizyonda düzeltildi)

**engine/ vs features/ ayrımı:** `engine/` = tahtanın temel fizik kuralları
(değişmez, oyunun her modunda geçerli). `features/` = açılıp kapatılabilen,
sonradan eklenmiş modüller.

**Evrim sistemi (1A→Bakır→Gümüş→Altın→Elmas) → `engine/evolutionEngine.js`
olacak, `features/` DEĞİL.** Kodda bunun karşılığı `GIFT_*` sabitleri ve
"Mekanizma 1/2/3" (terfi, alan patlaması, enerji) — Fusion9'un özgün
kimliği, çekirdek kural. Şu an `core/game-engine.js` içinde gömülü,
henüz çıkarılmadı (bkz. Faz 2).

**`F9Difficulty` yeniden sınıflandırıldı → `features/dda/opportunity-analysis.js`.**
İsmi yanıltıcıydı: aslında "zorluk seviyesi" değil, tahtada fırsat analizi
yapıp oyuncu sıkıştığında sessizce müdahale eden bir DDA alt-sistemi
(`_degree1Count`, `_intervene`). `game-engine.js` içindeki kayıp-serisi
bazlı `dda` nesnesiyle (satır ~5333, henüz çıkarılmadı) aynı aile —
ikisi de `features/dda/` altında toplanmalı.

**`F9Anim` → `fx/blast-fx.js`.** Zaten tam olarak fx katmanının tanımına
uyuyor: patlama + sayı animasyon motoru, mekaniği etkilemiyor, sadece görsel.

## Mevcut durum

```
core/
 ├─ bootstrap.js        ✓  F9_CONFIG + türetilmiş sabitler
 └─ game-engine.js      ⚠️ HENÜZ BÖLÜNMEDİ (5404 satır) — bkz. Faz 2

engine/                 ⏳ Faz 2'de dolacak
 ├─ matchEngine.js
 ├─ mergeEngine.js
 ├─ evolutionEngine.js  ← GIFT_SILVER/GOLD/DIAMOND terfi mekaniği burada
 ├─ gravityEngine.js
 ├─ spawnEngine.js
 ├─ scoreEngine.js
 └─ specialEngine.js

features/
 ├─ blockers/           ⏳ Faz 2'de dolacak (BLOCKER_* sabitleri, geometrik dizilim)
 ├─ wave/
 │   └─ wave-system.js  ✓  F9Wave
 ├─ hourglass/          ⏳ Faz 2'de dolacak (satır ~6701-7098, net BAŞLA/SON yorumları var)
 ├─ gifts/               ⏳ Faz 2'de dolacak (GIFT terfi UI/hediye kutusu davranışı — evolutionEngine'den ayrı, UI/tetikleme kısmı)
 ├─ dda/
 │   ├─ churn-system.js          ✓  F9Churn
 │   └─ opportunity-analysis.js  ✓  F9Difficulty (yeniden adlandırıldı)
 └─ hint/
     └─ hint-system.js  ✓  F9Hint  (orijinal listede yoktu, ayrı klasör açtım — istersen features/hint yerine başka yere taşıyabiliriz)

ui/                     ⏳ Faz 2'de dolacak
 ├─ renderer.js
 ├─ screens.js
 └─ hud.js

fx/
 └─ blast-fx.js         ✓  F9Anim

content/                ⏳ Faz 2/3 — level tasarımı işine başlarken dolacak
 ├─ levels/
 ├─ patterns/
 ├─ missions/
 ├─ rewards/
 └─ worlds/

save/                   ⏳ Faz 2'de dolacak (saveGame/loadGame, applyLoad game-engine.js içinde)
 ├─ saveManager.js
 └─ profile.js

debug/
 ├─ debug.js       ✓  F9Debug
 ├─ analytics.js   ✓  F9Report (yeniden adlandırıldı — sorun bildirme/hata raporlama)
 ├─ bot.js         ✓  F9Bot
 └─ director.js    ✓  F9Director

build/
 ├─ build.js
 └─ template.html
```

## Oturum 6'da bulunan eksikler (mimaride yeri olmayan, ama kodda zaten var olan sistemler)

**Ekonomi katmanı hiç tanımlı değildi — eklendi: `economy/`**
```
economy/
 ├─ energy-shop.js     ← spendEnergyForMoves/AreaBoost/RandomBlockerBreak/
 │                        FullTypeBlockerBreak/SuperBlast + renderEnergyShop()
 ├─ ad-rewards.js       ← watchAdContinue, AD_CONTINUE_* (reklamla devam)
 └─ daily-reward.js     ← renderDailyReward, lastLoginDate, "daily" ekranı
```
Not: Kullanıcının orijinal önceliğinde "günlük görev/ekonomi" en sona
konmuştu, ama mekanizma zaten kodda çalışıyor — bölümlendirme sırasında
bir yere yerleştirilmezse Faz 2'de game-engine.js içinde kalmaya devam eder.

**Lig/skor tablosu sistemi hiç tanımlı değildi — eklendi:**
```
features/league/
 └─ leaderboard-system.js   ← LEAGUE_BOARD, TIER_ICONS (bronz/gumus/altin/elmas/sampiyonluk)
```

**⚠️ İSİM ÇAKIŞMASI RİSKİ — "Bakır/Gümüş/Altın/Elmas" kelimesi kodda
3 farklı, birbiriyle alakasız sistemde kullanılıyor:**

| Sistem | Yer | Örnek sabit |
|---|---|---|
| Hücre terfi mekaniği | `engine/evolutionEngine.js` (Faz 2) | `GIFT_SILVER/GOLD/DIAMOND` |
| Lig sıralaması (sosyal) | `features/league/` | `TIER_ICONS: bronz/gumus/altin/elmas` |
| Dünya/bölüm temaları | `content/worlds/` (Faz 2/3) | `"Bakır Vadisi"`, `"Gümüş Ormanı"`, `"Altın Kalesi"`, `"Elmas Zirvesi"` |

Öneri: Faz 2'de bu üç sistemi ayırırken kod-içi sabit adlarını
netleştir (örn. `LEAGUE_TIER_GOLD`, `WORLD_THEME_GOLD`), kullanıcıya
gösterilen metin aynı kalsın. Aksi halde `grep "altin"` üçüne birden
denk gelir, yanlış dosyada değişiklik yapma riski oluşur.

## 🎯 ANA YOL HARİTASI (Oturum 6'da netleşti — bunu referans al)

Motor ~%85, oyunun tamamı ~%55-60 seviyesinde. Kalan iş "oyunu çalıştırmak"
değil "oyunu büyütmek". Mühendislik bağımlılığına göre kabul edilen sıra:

```
1. Performans temizliği + bölümlendirmenin bitmesi   ← ŞU AN BURADAYIZ (Faz 2)
2. Level dengeleme        ← ucuz: F9Bot + F9Director zaten hazır, sadece
                             toplu koşturup rapor katmanı lazım
3. İçerik üretim hattı    ← level dengelemeden çıkan zorluk eğrisi
                             bilgilendirir (1000+ level hedefi)
4. Meta oyun              ← içerik büyüdükçe anlamlı olur (LEAGUE_BOARD ve
                             daily-reward zaten var, koleksiyon/başarım/
                             sezon eksik, birbirine bağlanmalı)
5. Gelir modeli           ← en son, mühendislik değil iş kararı gerektirir
                             (reklam-ağırlıklı mı IAP-ağırlıklı mı önce
                             netleşmeli, economy/ klasörü ona göre dolar)
```

Ufak detaylar (input/etkileşim katmanı yeri, ses/müzik yeri) süreç
içinde tamamlanacak, şimdilik ana fikir bu.

## Eşleşme ve Patlama Modeli Doğrulaması (Oturum 7)

Kullanıcının yüklediği tasarım belgesiyle kod satır satır karşılaştırıldı.
Sonuç kullanıcı onayıyla netleşti:

- **Terfi (gift+9) patlama alanları ve mixed-tür kombinasyon şekilleri**:
  MEVCUT KOD KORUNDU (belge daha eski bir taslak, kod bilinçli olarak
  dengelenmiş — TASARIM.md Bölüm 10j/10k referanslı yorumlar bunu
  doğruluyor).
- **✓ UYGULANDI — Aynı-tür kombinasyon haç patlaması**: `bakır+bakır`,
  `bronz+bronz`, `gümüş+gümüş`, `altın+altın`, `elmas+elmas` artık
  element üretmenin YANINDA satır+sütun boyunca haç şeklinde bir patlama
  da yapıyor (boyut: 3/4/5/6/7 hücre). Önceden sadece element üretilip
  hiç patlama olmuyordu (`blastSize:null`).
  - Yeni kod: `engine/board-rules.js` → `SAME_TYPE_BLAST_SIZE`,
    `crossOffsets(n)`, `mechanism3GiftCombo` güncellendi.
  - Uygulama noktası: `core/game-engine.js` → `applyPlayerMove()`,
    `result.element` dalı.
  - Doğrulama: headless motorda manuel test edildi — bakır+bakır artık
    `firtina` elementi ÜRETİYOR + 4 hücrelik haç patlaması yapıyor
    (merkez hariç: yatay 2 + dikey 2 = "3 hücre yatay, 3 hücre dikey").
- **❌ İPTAL — Kum saati bonus patlaması (2x2)**: Kullanıcı kararıyla
  eklenmedi. Kum saati küçük patlaması mevcut haliyle (3x3) kalıyor.

⚠️ **Bakım notu**: Bu değişiklik `core/game-engine.js`'e satır eklediği
için `debug/benchmark/build-headless-engine.js` içindeki
`PURE_ENGINE_END_LINE` sabiti güncellendi (1304 → 1317). Motor dosyasına
her satır ekleme/çıkarmada bu sabit kontrol edilmeli — aksi halde headless
benchmark bundle'ı sözdizimi hatası verir.

## ✅ FAZ 2 TAMAMLANDI — engine/board-rules.js tamamen ayıklandı (Oturum 8)

406 satırlık iç içe geçmiş "kurallar" bloğu, bağımlılık analizi yapılarak
7 ayrı dosyaya bölündü. Sıralama ÖNEMLİ — bazı sabitler (örn.
`SAME_TYPE_TO_ELEMENT`, `ELEMENT_NINE_BREAKS_BLOCKER_TYPES`) başka
dosyalardaki sabitlere üst-seviye (top-level) referans veriyor, bu yüzden
build manifest'inde şu sıra ZORUNLU:

```
core/debug-init-guard.js       ← F9Debug stub/init (17 satır)
engine/rng.js                  ← VALUES, makeRng, rngInt, rngChoice
fx/assets.js                   ← GIFT_ASSETS, ELEM_ASSETS, HOURGLASS_ASSET, BLOCK_ASSETS
features/blockers/
  blocker-constants.js         ← BLOCKER_*, BLOCKER_POWER/LAYERS/LABEL/COLOR/ICON
engine/evolutionEngine.js      ← GIFT_*, PROMOTION_CHAIN, AREA_BLAST_*,
                                  GIFT_SPAWN_BLAST, GIFT_PROMO_BLAST,
                                  SAME_TYPE_BLAST_SIZE, crossOffsets, pairKey,
                                  mechanism1/2/3b/3c/3GiftCombo
engine/elementEngine.js        ← ELEM_*, DESTROYER_POWER, SAME_TYPE_TO_ELEMENT
                                  (GIFT_* gerektirir → evolutionEngine SONRASI),
                                  POWER_TO_DESTROYER, mechanism4/5/6,
                                  ELEMENT_NINE_BREAKS_BLOCKER_TYPES
                                  (BLOCKER_* gerektirir → blockers SONRASI)
engine/matchEngine.js          ← Sh, şekil şablonları, findLineMatches,
                                  findAllMatches, cellKey, allNine, translate,
                                  digitalRoot, producesNineWith, NINE_PARTNERS
```

**Doğrulama (3 katmanlı, önceki oturumlardaki metodoloji tekrarlandı):**
1. `node -c` → sözdizimi geçerli
2. Python multiset karşılaştırması → 429 satırın TAMAMI, kayıpsız/çoğalmasız
   yeni dosyalara dağıtıldı (doğrulandı)
3. **Headless benchmark (level 1-100, 10 seed) → mevcut baseline'la
   BİREBİR AYNI sonuç** (`compare-benchmark.js` çıktısı: "Anlamlı fark yok
   — refactor güvenli"). Bu, en güçlü kanıt — gerçek oyun mantığının
   davranışı hiç değişmedi.

⚠️ **Bakım notu:** `debug/benchmark/build-headless-engine.js` artık bu 6
yeni dosyayı da (doğru sırayla) yüklüyor — motor dosyalarından biri
yeniden adlandırılır/taşınırsa bu script güncellenmeli.

## ✅ Oturum 9 — resolveBoard() refactor + GameCore/Board/EnergyTracker ayrıştırma

**1. `resolveBoard()` refactor edildi:** Gift-spawn/blast bloğu artık
`GameCore.prototype._applyGiftSpawn(...)` adında ayrı bir metod. Davranış
BİREBİR AYNI (benchmark ile doğrulandı) — sadece kod organizasyonu değişti.

**2. `features/dda/dda-state.js`:** `dda` nesnesi + `saveDDA`/`loadDDA`
buraya taşındı (çağrı noktası `loadDDA();` bootstrap sırasında olduğu
için `game-engine.js`'te kaldı, sadece tanımlar taşındı).

**3. `economy/` dolduruldu:**
- `energy-shop.js` — enerji harcama metotları (`spendEnergyForMoves` vb.)
  **`GameCore.prototype` mixin** olarak yazıldı (class body'den çıkarılıp
  `GameCore.prototype.X = function(){...}` haline getirildi — bu, bir
  sınıfı bölmeden metod taşımanın standart, düşük riskli yöntemi).
  `watchAdContinue` de aynı dosyaya eklendi.
- `ad-rewards.js` — `AD_CONTINUE_*` sabitleri (erken yüklenir)
- `EnergyTracker.js` — enerji sınıfının kendisi + ilgili sabitler

**4. `features/league/leaderboard-data.js`:** `LEAGUE_BOARD` mock verisi
taşındı. (Not: `TIER_ICONS` hâlâ 3 farklı render fonksiyonunun içinde
yerel olarak tekrarlanıyor — bu bir UI-katmanı temizliği, `ui/` fazında
ele alınmalı.)

**5. ⭐ BÜYÜK ADIM — 4 sınıf kendi dosyalarına taşındı:**
```
core/Board.js                        ← Board sınıfı (41 satır)
features/blockers/level-blocker-layout.js ← LevelBlockerLayout (5 satır)
economy/EnergyTracker.js             ← EnergyTracker sınıfı + sabitleri
core/GameCore.js                     ← GameCore sınıfı (579 satır)
```
**Yöntem:** Sınıfların İÇİNİ değiştirmedim (gerçek bir OOP parçalama —
örn. GameCore'u Board/Cell/GameState olarak yeniden tasarlamak — bugünün
kapsamı için çok riskli olurdu). Bunun yerine her sınıfı OLDUĞU GİBİ
kendi dosyasına taşıdım — tıpkı `matchEngine.js`/`evolutionEngine.js`
çıkarımlarında yaptığımız gibi. Sınıflar birbirini sadece constructor
içinde (`new Board(...)` gibi) çağırıyor — bu çalışma zamanında
(instantiation anında) gerçekleştiği için dosya sırası esnek.

**`core/game-engine.js` artık 3785 satır** (oturum başında ~5400 satırdı).

**Doğrulama:** Bu oturumun her adımından sonra `node -c` + headless
benchmark (level 1-100, 10 seed) karşılaştırması yapıldı — HEPSİ
baseline ile birebir aynı sonuç verdi. Satır-bazlı multiset kontrolünde
küçük farklar çıktı ama hepsi açıklanabilir (yorum metni değişiklikleri,
`class` metodundan `prototype` atamasına sözdizimi dönüşümü) —
davranışsal test (benchmark) bunların zararsız olduğunu kanıtladı.

**⚠️ Bilinen, ertelenen küçük eksik:** `game-engine.js`'in başında hâlâ
dağınık bir sabit kümesi var (BASE_POINTS, WAVE_* + waveInterval,
BLAST_CELL_POINTS/BLAST_BLOCKER_POINTS, GUARANTEED_GIFT_THRESHOLD, birkaç
kum saati sabiti). Bunlar farklı sistemlere ait (score/wave/evolution/
hourglass) ama küçük hacimli (~40 satır) ve karışık — gelecek bir
oturumda ince kategorize edilebilir, şu an davranışı etkilemiyor.

## Faz 2 yol haritası (öncelik sırasıyla) — GÜNCEL DURUM

1. ~~`engine/board-rules.js` içini ayıkla~~ ✅ TAMAMLANDI
2. ~~`resolveBoard()` refactor~~ ✅ TAMAMLANDI
3. ~~`features/dda/`, `economy/`, `features/league/`~~ ✅ TAMAMLANDI
4. ~~GameCore/Board/EnergyTracker kendi dosyalarına taşındı~~ ✅ TAMAMLANDI
5. **Kalan:** `ui/{renderer,screens,hud}.js` — render fonksiyonlarının
   ayrılması (bu, `game-engine.js`'te kalan ~3700 satırın büyük kısmı —
   ekran render fonksiyonları, event handler'lar, ana oyun akışı).
   Bu, GameCore'un gerçek anlamda Board/Cell/GameState olarak yeniden
   TASARLANMASINDAN daha düşük risklidir (çünkü render fonksiyonları
   zaten birbirinden bağımsız, sadece `state`/`document` paylaşıyorlar)
   ama hacim olarak en büyük kalan iş.
6. Dağınık sabitlerin ince kategorizasyonu (yukarıdaki not)
7. `TIER_ICONS`'un tek bir yere toplanması

**Öneri:** Bölümlendirme burada makul bir duraklama noktası — motor
(engine/, core/Board.js, core/GameCore.js, economy/, features/) artık
tamamen modüler. Kalan iş (`ui/`) daha çok "büyük bir dosyayı ekran
bazında bölme" işi, mekanik açıdan daha basit ama hacimce büyük. Ana
yol haritasındaki 2. maddeye (Level dengeleme) geçmek de mantıklı bir
alternatif, çünkü motor artık yeterince temiz.

## 🐛 Oturum 10 — KRİTİK HATA BULUNDU VE DÜZELTİLDİ + Yeni Doğrulama Katmanı

**Hata:** Kullanıcı tarayıcıda `Uncaught ReferenceError: GameCore is not defined` bildirdi.

**Kök neden:** `core/bootstrap.js` dosyanın sonunda tüm oyunu saran bir
IIFE açıyor (`(function () {`), bu IIFE ancak `core/game-engine.js`'in
son satırındaki `})();` ile kapanıyor. `economy/energy-shop.js`
(`GameCore.prototype.X = ...` içeren dosya) manifest'te YANLIŞLIKLA
`game-engine.js`'DEN SONRA konmuştu — yani bu kod IIFE kapandıktan
SONRA, global scope'ta çalışıyordu. Ama `GameCore` sınıfı IIFE'nin
İÇİNDE tanımlı olduğu için dışarıdan görünmüyordu.

**Düzeltme:** `energy-shop.js`, manifest'te `core/GameCore.js`'den SONRA
ama `core/game-engine.js`'den ÖNCE (yani hâlâ IIFE'nin içinde) konumlandırıldı.

**⚠️ NEDEN DAHA ÖNCE YAKALANMADI — önemli metodoloji dersi:**
`node -c` SADECE sözdizimini kontrol eder, "X is not defined" gibi
scope/reference hatalarını YAKALAMAZ (script sözdizimsel olarak
tamamen geçerliydi, sadece çalışırken patlıyordu). Ayrıca headless
benchmark testimiz KENDİ ELLE KURULMUŞ bir dosya sırası kullanıyordu
(gerçek `build.js` manifest'ini birebir yansıtmıyordu) — bu yüzden bu
spesifik sıra hatasını hiç test etmemiş olduk.

**Kalıcı çözüm — build script'e ÜÇÜNCÜ bir doğrulama katmanı eklendi:**
`build/build.js` artık üretilen dosyayı sadece `node -c` ile değil,
minimal DOM stub'larıyla GERÇEKTEN ÇALIŞTIRARAK da doğruluyor
(`✓ Çalışma zamanı doğrulandı`). Bu, tam olarak bu tür "sınıf/değişken
IIFE dışında kaldı" hatalarını yakalar. Test edildi: manifest sırası
bilerek bozulup bu yeni kontrolün hatayı doğru şekilde yakaladığı
doğrulandı, sonra düzeltme geri yüklendi.

**Genel ilke (gelecekteki tüm dosya taşımalarında akılda tutulmalı):**
Bu proje gerçek ES modülleri kullanmıyor — her şey TEK bir büyük IIFE
içinde birleştiriliyor. Bir dosyayı manifest'te başka bir dosyanın
`})();` ile biten kapanışından SONRAYA koymak, o dosyayı yanlışlıkla
IIFE'nin dışına, farklı bir scope'a düşürür. `core/game-engine.js`
ÖZELLİKLE bu IIFE'yi kapatan dosya olduğu için, ondan sonra gelen HER
ŞEY (şu an sadece `energy-shop.js`) bu riski taşır — yeni prototype-mixin
dosyaları eklenirken bu netleştirilmeli.

## 🐛 Oturum 11 — Patlama efekti görünmüyordu (terfi/kombinasyon) — DÜZELTİLDİ

**Bulgu (kullanıcı raporu):** 3'lü/4'lü gibi normal eşleşmelerde patlama
görünüyordu, ama `bakır+9`, `bronz+9` gibi terfi eşleşmelerinde ve
hediye kombinasyonlarında (aynı-tür/farklı-tür) patlama etkisi
görünmüyordu — skor değişiyordu ama görsel efekt yoktu.

**Kök neden:** `handleCellClick` içinde `F9Anim.playBlast(...)` (patlama
animasyonunu başlatan çağrı) tetiklendikten HEMEN SONRA, aynı senkron
akışta `render()` çağrılıyordu. `render()`, tahtanın innerHTML'ini
tamamen yeniden yazıyor — bu da `playBlast`'ın animasyon için stil/class
eklediği DOM elemanlarını, animasyon daha görünmeden yok ediyordu.

Bunun tam olarak AYNI kök nedenle kum saati sisteminde daha önce
çözüldüğünü fark ettik: `features/hourglass/hourglass-system.js` içinde
açık bir yorum var: *"renderBoardOnly innerHTML'i yeniden yazıyor — bu
animasyonu kesiyor"* — bu yüzden kum saati bilerek 1400ms bekliyor,
patlama efekti tam oynadıktan SONRA tahtayı güncelliyor. Ama bu
gecikme SADECE kum saatine uygulanmıştı, diğer patlama türlerine
(terfi, kombinasyon) hiç uygulanmamıştı.

**Düzeltme:** `handleCellClick` içinde, zincirsiz (chain'siz) bir
patlama varsa (`blastFlash.size > 0 && !hasChainAnim` — yani terfi,
aynı-tür kombinasyon, farklı-tür kombinasyon), `render()` çağrısı
patlama animasyon süresine göre hesaplanan kısa bir gecikmeyle
(stagger×hücre-sayısı + BLAST_DURATION + FALL_DURATION, max 1200ms)
erteleniyor. Zincir eşleşmeler zaten kendi render zamanlamasını
yönettiği için dokunulmadı. Sonuç: **artık tüm patlama türlerinde
aynı, tutarlı görsel efekt.**

**Doğrulama:**
- `node -c` + YENİ çalışma zamanı testi (Oturum 10'da eklenen) → geçti
- Headless benchmark (level 1-100, 10 seed) → baseline ile birebir
  aynı (beklenen — bu saf bir UI/render zamanlama düzeltmesi, oyun
  mantığına (`GameCore`) hiç dokunmadı)

**Not:** Bu değişiklik tarayıcıda görsel olarak test edilemedi (bu
ortamda tarayıcı yok) — mantık sağlam (kum saatinin çözümüyle birebir
aynı desen) ama kullanıcının gerçek tarayıcıda deneyip teyit etmesi
gerekiyor.

## 🐛 Oturum 12 — "Level dengeleme" fazı — KRİTİK BOT HATASI BULUNDU VE DÜZELTİLDİ

**Başlangıç noktası:** Önceki oturumlarda "level 1-100'de neredeyse
%0 kazanma oranı" bulgusu vardı, ama "bot mu zayıf yoksa oyun mu zor"
sorusu açıktı. Bu fazda bunu netleştirmek için 3 bot profilini
(casual/normal/pro) aynı seviyelerde karşılaştırdık.

**Şoke edici bulgu:** `casual` profili (Monte Carlo KULLANMIYOR)
`normal`/`pro`'dan (MC KULLANIYOR) TUTARLI biçimde daha iyi oynuyordu —
profil sıralaması TERSİNE dönmüştü (beklenen: pro>normal>casual,
gerçek: casual>pro>normal). Bu, oyunun zorluğuyla değil, **botun karar
mantığındaki gerçek bir hatayla** ilgiliydi.

**Kök neden — `debug/bot.js` `_mcSimulate()`:**
```js
let simScore = gc.score;  // ❌ HATA: o ana kadarki TÜM birikmiş skor
```
Bu değer `_evalBoard()`'a geçiyordu (`W1*score + W2*empty - W3*isolated + W4*clustering`).
İlk düşünce: bu sabit terim aday hamleler arasında aynı olduğu için
göreli sıralamayı etkilememeli (matematiksel olarak doğru — düzeltmesi
davranışı DEĞİŞTİRMEDİ, doğrulandı). Asıl sorun daha derindi:
**`_evalBoard`'un empty/isolated/clustering ağırlıkları (W2=8, W3=12,
W4=6) gerçek skor potansiyelinden kopuk, yanıltıcı bir sinyal
üretiyordu** — MC simülasyonu greedy heuristiğin doğru kararını
%70 ağırlıkla (`score*0.3 + mcScore*0.7`) bu yanıltıcı sinyalle
eziyordu.

**Kanıt (deneysel test):** MC'yi tamamen devre dışı bırakıp level 1-30
tekrar koşturuldu — `normal` profil örn. level 6'da %0'dan %88'e,
level 21'de %0'dan %25'e çıktı. Bu, MC'nin GÜRÜLTÜ değil, AKTİF OLARAK
ZARARLI olduğunu kesin kanıtladı.

**Kalıcı düzeltme:** `USE_MC = false` — bot artık sadece greedy
heuristiğe (`_scoreMove`) güveniyor, MC simülasyonu kapatıldı (kod ve
gerekçe yorum olarak dosyada kalıcı, ileride düzgün bir MC/heuristic
yeniden tasarımı ayrı bir oturum gerektirir).

**SONUÇ (level 1-100, 10 seed/level, düzeltme sonrası):**

| Profil | Ort. kazanma oranı | Ort. skor/hedef |
|---|---|---|
| casual | %4.6 | 0.39 |
| normal | %11.2 | 0.48 |
| pro | %33.4 | 0.98 |

Artık **doğru, monotonik sıralama**: casual < normal < pro. Önceki
(hatalı) haliyle bu sıralama tersine dönmüştü.

**Yeni baseline'lar kaydedildi:**
`debug/benchmark/baselines/baseline-2026-07-05-post-mc-fix-{casual,normal,pro}.json`
— eski `baseline-2026-07-05-pre-boardrules-refactor.json` artık GEÇERSİZ
(hatalı bot mantığına dayanıyordu), sadece tarihsel referans için tutuldu.

**Açık soru (gelecek oturumlar için):** Düzeltilmiş botla bile level
1-100'ün YARISI (50/100) hâlâ %0 kazanıyor, ortalama skor/hedef oranı
normal profilde 0.48. Bu iki şekilde yorumlanabilir:
1. Zorluk eğrisi gerçekten sert (WARMUP_END_LEVEL=0 zaten biliniyordu)
2. Greedy heuristik bile insan oyuncudan daha zayıf olabilir (gerçek
   MC/deeper-search olmadan "pro" bile mükemmel değil)
Bir sonraki adım: ya zorluk eğrisini (hedef skor/hamle oranı) gözden
geçirmek, ya da bot heuristiğini iyileştirmek (düzgün MC tasarımı).

## 🐛 Oturum 13 — "Level dengeleme" devamı — movesMult aktif edildi

**Kullanıcı kararı:** Önceki oturumda bulunan 3-çarpan-birikmesi sorunu
(tier + cycle + pacing hep birlikte çarpımsal artıyor, hamle sayısı
sabit) için 2 seçenek sunuldu — kullanıcı **"movesMult'u aktif et"**
seçeneğini seçti.

**Uygulama öncesi kritik bulgu:** 15 geçilemez levelin ALTINDA yatan
gerçek tier (görünen "zor" etiketinden bağımsız) hep **"uzman"**
çıktı — ve `DIFFICULTY_TIERS`'te uzman'ın `movesMult` değeri **0.85**
(tablodaki EN DÜŞÜK değer!) idi. Aynı zamanda uzman `densityBase=0.55`
(2. en yüksek) ve `targetMult=1.00` (en yüksek) ile zaten en zor
tierlerden biriydi. Yani olduğu gibi aktif etseydik, tam da düzeltmek
istediğimiz levellerde hamleyi 16'dan 14'e düşürüp durumu
KÖTÜLEŞTİRECEKTİ — "pro" tier'in (density=0.80 en yüksek ama
movesMult=1.10 cömert) tutarlı desenine aykırıydı.

**Düzeltme:** `zor` movesMult 0.95→1.00, `uzman` movesMult 0.85→1.05
(pro'nun cömert deseniyle tutarlı hale getirildi) + `moves` artık
gerçekten `BASE_MOVES*movesMult`'tan hesaplanıyor (eskiden sabit 16'ydı,
alt sınır: 12 hamle güvenlik payı).

**SONUÇ (pro profil, level 1-100, 10 seed):**

| Metrik | Önce | Sonra |
|---|---|---|
| Ort. kazanma oranı | %33.4 | **%44.9** |
| Ort. skor/hedef | 0.98 | **1.42** |
| Kötüleşen level sayısı | — | **0** |

57 seviyede anlamlı iyileşme, HİÇBİRİNDE kötüleşme.

**⚠️ Ama dürüst olmak gerekirse — en uç 15 "geçilemez" level için
yetersiz kaldı:** Bu levellerin çoğu hâlâ %0 kazanıyor (sadece 62 ve 67
hafif iyileşti). Sebep: bu levellerin hedef skoru zaten o kadar aşırı
şişmiş (900-1071, 3 çarpanın aynı anda tetiklenmesinden) ki +1-2 hamle
(movesMult=1.05'in verdiği küçük telafi) yeterli gelmiyor.

**Sonraki adım için not:** Bu en uç noktaları çözmek için muhtemelen
1. maddedeki "çarpanları sınırla" fikri de gerekecek — movesMult
tek başına genel eğriyi iyileştirdi ama en aşırı spike'ları düzeltmedi.
Yeni baseline: `debug/benchmark/baselines/baseline-2026-07-05-post-movesMult-fix-pro.json`

## 📋 Tahta Engeli (Blocker) Zorluk ve Dizilim Mantığı

Kullanıcı talebiyle belgelenen sistem — `core/game-engine.js` içindeki
"GEOMETRİK ENGEL DİZİLİM SİSTEMİ" ve `features/blockers/blocker-constants.js`.

### 1. Engel Türleri ve Kırılma Zorluğu (`BLOCKER_POWER`)

Her engel türünün bir "direnç" değeri var (negatif = ne kadar güç
gerektiği). Element gücü (fırtına/su/tnt/ateş/yıldırım) bu dirençle
toplanıp (`mechanism4BreakBlockers`) sıfırın üzerine çıkarsa engel kırılır:

| Engel | Direnç | Not |
|---|---|---|
| `agac` (ağaç) | -2 | En zayıf — normal eşleşmeyle bile (bitişik 9 oluşunca) kırılabilir |
| `cam` (cam) | -4 | |
| `bronz_engel`/`bakir_engel` | -6 | Orta — 2 katman (önce ağaca düşer, sonra kırılır) |
| `kaya`, `sis` | -6 | Sis tek vuruşla kalkar |
| `buz` | -8 | |
| `kasa` | -8 | Sadece DOĞRUDAN bitişik eşleşmeyle kırılır (element gerekmez) |
| `kilit` | -8 | Güç bazlı değil, sadece komşu eşleşmeyle açılır |
| `demir` | -10 | |
| `cift_buz` (çift buz) | -10 | İlk vuruşta tek buza düşer, sonra kırılır (2 katman) |
| `celik` (çelik) | -14 | **En güçlü** — 3 katman (çelik→bakır engel→ağaç→kırıldı), sadece Yıldırım+9 veya Süper Patlama pratik çözüm |

**Kırılma yolları (3 bağımsız mekanizma):**
1. **Mekanizma 4** — element (fırtına/su/tnt/ateş/yıldırım) bitişikteki
   engellere değince, element gücü + engellerin direnç toplamı
   hesaplanır; sıfırın üstündeyse hepsi kırılır, kalan güç bir sonraki
   elemente dönüşür (zincirleme kırma).
2. **Mekanizma 5** — element + "9" eşleşmesi, board GENELİNDE o
   elementin kırabildiği TÜM engel türlerini kırar (komşuluk şartı yok).
3. **Ağaç/kasa özel durumu** — sadece bitişik bir eşleşme 9 üretirse,
   yanındaki ağaç/kasa engelleri (element gerekmeden) doğrudan kırılır.

### 2. Bölüme Göre Engel Havuzu (`allowedBlockersForChapter`)

Level ilerledikçe yeni, daha güçlü engel türleri devreye giriyor
(chapter = level'in 10'a bölümü, yukarı yuvarlanmış):

```
Bölüm 1        → sadece ağaç
Bölüm 2        → ağaç + cam
Bölüm 3        → cam + kaya + buz
Bölüm 4        → kaya + buz + bakır engel + demir
Bölüm 5        → buz + demir + bakır engel + kilit + sis
Bölüm 6        → demir + bakır engel + çelik + kilit + sis
Bölüm 7+       → HEPSİ (11 tür) — çift buz ve kasa dahil
```

### 3. Geometrik Dizilim Sistemi — Rastgele DEĞİL, Matematiksel Desen

Yorum satırında da belirtildiği gibi, engeller RASTGELE dağıtılmıyor —
bölüme göre 5 farklı matematiksel desen kullanılıyor:

| Bölüm | Desen | Mantık |
|---|---|---|
| 1-4 | **Piramit** | Alt satırdan üste daralan üçgen |
| 5-8 | **Fibonacci sarmalı** | Altın oran açısıyla merkezden dışa spiral |
| 9-12 | **Asal sayı** | Hücre indeksi (r×8+c) asal sayıysa engel |
| 13-16 | **Simetrik ayna** | Merkeze göre 4 köşeden X şekli (+ merkez artı) |
| 17+ | **Çapraz/X** | Köşelerden içe doğru çapraz çizgiler |

Her desen ayrıca **level numarasına göre 4 rotasyon varyasyonundan**
birine çevriliyor (0°/90°/180°/270°, `level % 4`) — böylece aynı desen
ailesindeki levellar birbirinin birebir aynısı olmuyor.

### 4. Yoğunluk (`density`) Nasıl Hücre Sayısına Dönüşüyor?

**Önemli düzeltme (bu konuşmada netleştirildi):** `density` değeri
(örn. 0.68) tahtanın %68'inin blocked olduğu anlamına GELMİYOR — her
desen fonksiyonu kendi çarpanıyla kullanıyor (`density*5` piramit
katman sayısı, `density*13` Fibonacci hücre sayısı, `density*16` asal
sayı taraması vb.), VE sonunda **`GRID*GRID*0.25` (16 hücre / %25)
sabit bir TAVANLA sınırlanıyor.** Yani density ne kadar yüksek olursa
olsun, bir levelda asla 16'dan fazla engel hücresi olamaz. Örnek: Level
89'da density=0.68 görünse de gerçek engel sayısı sadece **14/64
hücre** (~%22).

**Engel TÜRÜ seçimi** de yoğunlukla ilişkili: `_pickBlockerType()`
%70 ihtimalle yoğunluğa uygun (yoğunluk yüksekse havuzun güçlü ucundan),
%30 ihtimalle havuzdan tamamen rastgele bir tür seçiyor.

### 5. AI Yoğunluk Ayarı (`_aiAdjustDensity`) — Yarı-Aktif Direktör Sistemi

Oyuncunun `localStorage`'daki geçmiş performansına (`f9_director_v1`)
bakarak, AYNI DESENDE (örn. hep "fibonacci" bölümünde) son 10 seferlik
kazanma oranını hesaplıyor:
- Kazanma oranı **<%25** → yoğunluk ×0.65 (belirgin kolaylaştırma)
- Kazanma oranı **<%40** → yoğunluk ×0.85 (hafif kolaylaştırma)
- Kazanma oranı **>%80** VE verimlilik yüksekse → yoğunluk ×1.20 (zorlaştır)
- Aksi halde değişiklik yok

Bu, en az 5 geçmiş kayıt VE aynı desende en az 3 kayıt gerektiriyor —
yeni oyuncularda/erken levellerde devre dışı kalıyor.

### Özet zorluk kaynakları (tümü BİRBİRİNDEN BAĞIMSIZ, aynı anda etkili)
1. Hedef skor formülü (tier + cycle + pacing çarpanları — Oturum 12-13'te incelendi)
2. Hamle sayısı (movesMult — Oturum 13'te düzeltildi)
3. **Engel sayısı** (density → pattern → max %25 tavan)
4. **Engel türü/gücü** (chapter'a göre havuz + yoğunluğa göre seçim ağırlığı)
5. AI'nin geçmişe göre yoğunluk ince ayarı (sadece deneyimli oyuncularda aktif)

## Oturum 14 — Kullanıcı netleştirmeleri (3 değişiklik)

**1. "Matrix Eşleşme" adlandırması (elmas+9 efekti):**
Elmas+9 terfi efekti (tüm tahta patlar + 10 hamle) bundan böyle
**"Matrix Eşleşme"** olarak anılacak — görüntüsü beğenildi, ileride
özel durumlarda (özel level hedefleri, sezon etkinlikleri vb.)
referans olarak kullanılacak. Davranış DEĞİŞMEDİ, sadece isim/etiket
olarak `engine/evolutionEngine.js`'e not düşüldü.

**2. Hamle sayısı GERİ ALINDI — sabit 16:**
Oturum 13'te aktif edilen `movesMult` (tier'e göre hamle sayısı
değişimi) kullanıcı kararıyla GERİ ALINDI. `moves` artık yine
`BASE_MOVES` (16) — hiçbir tier/level bunu değiştirmiyor.
`DIFFICULTY_TIERS`'taki düzeltilmiş `movesMult` değerleri koda duruyor
ama KULLANILMIYOR (ileride tekrar aktif edilebilir).

**3. ⭐ Karışık-tür kombinasyon patlaması artık GERÇEK bir haç şekli:**
Kullanıcı netleştirdi: "3 hücre yatay 4 hücre dikey" merkezden geçen
bir haç demek (yatayda 3, dikeyde 4 hücre — 3×4=12 hücrelik dolu blok
DEĞİL). İki kök sorun bulundu ve düzeltildi:

- `areaBlastCells()`'in "bilinmeyen tip" fallback'i eskiden GERÇEKTEN
  dikdörtgen (nRows×nCols'un HER hücresi) üretiyordu. Artık merkezden
  geçen haç üretiyor (yatay kol=cols hücre, dikey kol=rows hücre).
- **Daha derin bir sorun**: kombinasyonun kendi şekli yerine, iki
  hediyeden BİRİNİN (`_gt1`, r1/r2'ye rastgele hangi hediye denk
  gelirse) kendi terfi şekli ödünç alınıyordu (örn. bronz+gümüş,
  bronz+altın, bronz+elmas hepsi "bronz"un şeklini kullanıyordu, çünkü
  boyut eşleşmesi/giftType önceliği karışıktı). Artık kombinasyonlar
  için `giftType=false` özel sinyaliyle otomatik-eşleştirme tamamen
  atlanıyor, HER ZAMAN kendi [rows,cols]'undan haç hesaplanıyor.

**Doğrulama (headless motor, manuel test):**
```
bronz+altın [rows=3,cols=4] → 6 hücre: merkez + yatay 3 + dikey 2
gümüş+elmas [rows=6,cols=7] → 12 hücre: merkez + yatay 6 + dikey 5
```
Genişlik/yükseklik artık BİREBİR istenen sayılara karşılık geliyor,
alan hücre sayısı (rows×cols yerine rows+cols-1) çok daha küçük ve
doğru — özellikle büyük kombinasyonlarda (gümüş+elmas eskiden 42
hücrelik dolu blok olurdu, şimdi 12 hücrelik ince haç).

**Not:** Terfi (promotion) patlamaları ve hediye-spawn patlamaları bu
değişiklikten ETKİLENMEDİ — onlar zaten kendi özel `AREA_BLAST_OFFSETS`
şablonlarını (gift'e özgü, önceden tasarlanmış haç/artı desenleri)
kullanıyor, sadece "bilinmeyen tip" (mixed-combo) fallback'i değişti.

## ✅ Oturum 15 — `rules/` katmanı oluşturuldu + kalıcı manifest senkronizasyon çözümü

Kullanıcının "mimari iyileştirme, önce mimari eksikleri tespit et" talebine
yanıt olarak: **istenen 9 klasörden 4'ü (`ui/`, `content/`, `save/`,
`rules/`) hiç yoktu.** Bu oturumda `save/` ve `rules/` açıldı (`ui/` ve
`content/` bir sonraki adım — bkz. aşağıdaki yol haritası).

### `rules/` — 8 dosya (istenen 5 + 3 doğal ek)

```
rules/
 ├─ matchRules.js       ← eşleşme şekil şablonları (GROUP_A-E, Sh() çıktıları)
 ├─ evolutionRules.js   ← GIFT_*, PROMOTION_CHAIN, alan/spawn patlama tabloları
 ├─ elementRules.js     ← ELEM_*, DESTROYER_POWER, element↔blocker kırma tablosu
 ├─ blockerRules.js     ← BLOCKER_* (zaten saf sabitti, sadece taşındı/yeniden adlandırıldı)
 ├─ rewardRules.js      ← AD_CONTINUE_*, MOVE_PURCHASE_OPTIONS, SUPER_BLAST_*
 ├─ scoringRules.js     ← BASE_POINTS, BLAST_CELL_POINTS, BLAST_BLOCKER_POINTS
 ├─ waveRules.js        ← WAVE_BREAK_POWER vb. (istenmemişti ama tutarlılık için)
 └─ hourglassRules.js   ← HOURGLASS_*, DIFF_DURATION (game-engine.js'te "yetim" kalmıştı)
```

**Yöntem:** Her dosyada SADECE mekanizma fonksiyonlarının kullandığı
sabitler var — mantık (fonksiyonlar) `engine/`, `features/`, `economy/`
içinde kaldı. Kritik incelik: bazı "sabitler" aslında fonksiyona
bağımlı hesaplamalar (örn. `NINE_PARTNERS`, şekil şablonlarının
`Sh()` çağrıları) — bunlar JS'in `function` hoisting özelliği sayesinde
güvenle ayrıldı (fonksiyon tanımı dosyada sonra gelse bile, IIFE'nin
en başına taşınıyor, bkz. Oturum 8'deki aynı teknik).

### ⭐ Kalıcı mimari düzeltme: `build/manifest.js` — TEK doğruluk kaynağı

**Kök sorun:** Dosya listesi hem `build/build.js` hem
`debug/benchmark/build-headless-engine.js`'de AYRI AYRI elle
tutuluyordu — Oturum 10'daki "GameCore is not defined" hatası ve bu
oturumdaki DOM-stub hataları hep bu çift-liste senkronizasyon
sorunundan çıktı. Kullanıcı "kod ileride bizi yormamalı" dediği için
bu kez KALICI çözüldü: `build/manifest.js` artık dosya sırasının
**tek** kaynağı, her iki script de onu `require()` ediyor. Bir dosya
eklendiğinde/taşındığında artık SADECE `manifest.js` güncellenir.

**Doğrulama:** `node -c` + çalışma zamanı testi + headless benchmark
(level 1-100, 10 seed) → mevcut baseline'la **birebir aynı sonuç**
("Anlamlı fark yok — refactor güvenli"). 8 dosyalık büyük bir
yeniden yapılandırmaya rağmen davranışta hiçbir değişiklik yok.

## ✅ Oturum 16 — `ui/` katmanı açıldı — en büyük tek kazanç

Kullanıcının önceliklendirdiği gibi: render/UI kodu motorun dışına
çıkarıldı. **27 fonksiyon**, üç yeni dosyaya taşındı:

```
ui/screens.js    (1144 satır, 16 fonksiyon) — renderMap, renderWin,
                  renderLose, renderMenu, renderLeague, renderHowto,
                  renderAccount, renderDailyReward, renderPlayIntro,
                  renderLevelStart, renderReward, renderLoading,
                  renderEnergyShop, showNoTubesModal, showAdForTube,
                  showJackpotAnimation
ui/renderer.js   (520 satır, 8 fonksiyon)  — render, renderBoardOnly,
                  renderOptionsArea, renderStatusArea, cellDisplay,
                  attachBoardListener, attachTopHandlers, fmtTier
fx/audio.js      (75 satır, 3 fonksiyon)   — initAudio, getAudioCtx, playSound
```

**Yöntem:** Elle satır saymak yerine, acorn tokenizer ile HER
fonksiyonun tam başlangıç/bitiş satırını programatik olarak bulan bir
script yazıldı (derinlik takibi — Oturum 8'de board-rules.js için
kullandığımız yöntemin genelleştirilmiş hali). Bu, ~30 fonksiyonu elle
sınır bulmadan güvenle kategorize edip taşımayı mümkün kıldı. Ayrıca
kullanılmayan `_renderStatusArea_UNUSED` fonksiyonu (adından da belli
olduğu gibi çağrılmayan ölü kod) silindi.

**SONUÇ: `core/game-engine.js` 3108 satırdan → 1913 satıra indi.**

**Doğrulama:**
- `node -c` + çalışma zamanı testi → geçti
- Headless benchmark (level 1-100) → mevcut baseline'la birebir aynı
  (beklenen — bu saf UI kodu, `GameCore`/motor mantığına hiç dokunmadı)
- Yapısal doğrulama: 27 fonksiyonun hepsi doğru isimle, eksiksiz
  (kapanış parantezleri dahil) yeni dosyalarda bulundu

**Not:** `ui/`'nin render fonksiyonları henüz `handleCellClick`,
`executeMove`, `checkAndTransition`, `newLevel` gibi "oyun akışı"
fonksiyonlarından ayrılmadı — bunlar hâlâ `game-engine.js`'de (kasıtlı,
bu oturumun kapsamı sadece render/UI idi). `content/` (level/dünya
verisi) hâlâ açılmadı.

## ✅ Oturum 17 — `content/` katmanı açıldı + kritik tutarsızlık bulundu

Kullanıcının "artık içerik zamanı" önceliğine yanıt: `content/` klasörü
açıldı, 4 alt klasör dolduruldu.

```
content/
 ├─ worlds/world-metadata.js        ← 20 dünya (isim/tema/level aralığı), YENİ
 ├─ levels/chapter-database.js      ← level-bazlı görev verisi (185 satır), TAŞINDI
 ├─ rewards/milestones.js           ← L10/25/50/100... özel ödüller, TAŞINDI
 ├─ blockers/chapter-blocker-pools.js ← bölüme göre engel havuzu, if-zincirinden VERİ TABLOSUNA çevrildi
 └─ missions/README_TODO.md          ← görev sistemi henüz yok (dürüstçe belgelendi, uydurulmadı)
```

**core/game-engine.js 1913 satırdan → ~1730 satıra indi.**

### ⚠️ KRİTİK BULGU — content/levels/37.json hedefine ulaşmadan önce çözülmesi gereken

`CHAPTER_DB` (şimdi `content/levels/chapter-database.js`) zaten level
1-190 için "görev" verisi tanımlıyordu (hangi hedef: score/create9/
giftCount/breakBlockers) — ama bu, `generateLevel()`'ın PROSEDÜREL
ürettiği GERÇEK oynanış parametreleriyle (moves, targetScore,
blockerLayout) **hiç senkron değil**. Somut örnek:

| | CHAPTER_DB'nin istediği | generateLevel()'ın ürettiği |
|---|---|---|
| Level 1 hedef skoru | 630 | 441 |

**İki paralel sistem var:**
1. `content/levels/chapter-database.js` — "görev" verisi (UI'da ne gösterilir)
2. `generateLevel()` (`core/game-engine.js`) — asıl oynanabilir tahta
   parametreleri, kendi tier-döngüsü formülüyle üretiliyor, tablodaki
   değerlere hiç bakmıyor

Bu, "motor `content/levels/37.json` yüklesin" hedefine ulaşmak için
**çözülmesi gereken temel karar noktası.**

### Önerilen çözüm (uygulanmadı, kullanıcı onayı bekliyor)

**Öneri: `generateLevel()`'ın ürettiği değerleri yetkili kabul et**
(çünkü bunlar zaten F9Bot ile test edilip dengelendi — Oturum 12-14'te
üzerinde çalıştığımız veriler). Somut adımlar:
1. `generateLevel(n, sabit_seed)`'i 1-100 için ÇALIŞTIRIP çıktısını
   dondurmak ("bake" etmek) — `content/levels/baked/1.js ... 100.js`
   ya da tek `content/levels/baked-levels.js` olarak
2. `CHAPTER_DB`'den SADECE goal TİPİNİ (score/create9/vb.) almak,
   goal DEĞERİNİ generateLevel()'ın gerçek targetScore'una göre
   yeniden hesaplamak (tutarlılık için)
3. Çalışma zamanında: `loadLevel(n)` önce "dondurulmuş" içeriğe bakar,
   yoksa (level 101+) `generateLevel()`'a düşer — tam olarak chapter
   20'nin ("Efsane Kulesi") zaten yaptığı sonsuz-prosedürel modelin
   genellemesi

### Önerilen level veri şeması

```json
{
  "level": 37,
  "chapter": 4,
  "moves": 22,
  "targetScore": 495,
  "blockerDensity": 0.32,
  "blockerPattern": "fibonacci",
  "goal": { "type": "score", "value": 495 },
  "milestone": null
}
```

**Doğrulama:** `node -c` + çalışma zamanı testi + headless benchmark
(level 1-100) → mevcut baseline'la birebir aynı (bu oturumda oynanışa
hiç dokunulmadı, sadece veri taşındı).

## ✅ Oturum 18 — "Duality" sorunu ÇÖZÜLDÜ (kullanıcı kararıyla)

**Karar:** `generateLevel()` tek yetkili kaynak. `CHAPTER_DB` artık
SADECE goal tipini (+ score-dışı tiplerde değeri) tutuyor.

**Kök neden düzeltmesi:** `core/game-engine.js` → `newLevel()` içinde
`if (_lvGoal.goal.type === "score") cfg.targetScore = _lvGoal.goal.value;`
satırı **TERSİNE çevrildi**:
`if (_lvGoal.goal.type === "score") _lvGoal.goal.value = cfg.targetScore;`

**⚠️ Bu, sadece bir "gösterim" hatası DEĞİLDİ — gerçek oynanışı
etkiliyordu.** Eski satır, `new GameCore(...)` çağrısından (satır 531)
ÖNCE çalışıyordu ve `cfg.targetScore`'u DOĞRUDAN değiştiriyordu — yani
canlı oyunda GameCore'un gerçek kazanma hedefi CHAPTER_DB'nin (yanlış,
genelde çok daha yüksek) değeriyle kuruluyordu. Headless benchmarkımız
bunu hiç yakalamamıştı çünkü test aracı `newLevel()`'ı (UI orkestrasyon
katmanı) hiç çağırmıyor, `generateLevel()`'ın çıktısını doğrudan
kullanıyor — bu yüzden "değişiklik yok" sonucu doğru ama YANILTICI
görünüyordu: motor mantığı hep doğruydu, ama CANLI OYUNDA bu doğru
değer `newLevel()` tarafından eziliyordu.

**Yapılan değişiklikler:**
1. `core/game-engine.js` — override satırı tersine çevrildi (yukarıda)
2. `content/levels/chapter-database.js` — TÜM 20 bölümden `moves` ve
   `blockerTypes` alanları kaldırıldı (moves generateLevel'dan gelir,
   blockerTypes zaten `content/blockers/chapter-blocker-pools.js`'te
   chapter'a göre tanımlı). "score" tipi hedeflerde `value` kaldırıldı
   (artık generateLevel'dan senkronize ediliyor) — SADECE create9/
   giftCount/breakBlockers tiplerinde value kaldı (generateLevel'ın
   karşılığı yok, bunlar kalıcı içerik).
3. `generateLevel()`'ın döndürdüğü nesneye **`pattern`** alanı eklendi
   (`blockerLayout._patternName`'den) — artık kullanıcının istediği tam
   kanonik şema üretiliyor:
   ```json
   { "level":37, "moves":16, "targetScore":630, "pattern":"pyramid", "density":0.17 }
   ```

**Doğrulama:**
- `node -c` + çalışma zamanı testi → geçti
- Headless benchmark (level 1-100) → mevcut baseline'la birebir aynı
  (beklenen — bu test zaten hep generateLevel()'ın DOĞRU çıktısını
  kullanıyordu, bug sadece newLevel()'da idi)
- Manuel test: `generateLevel(37)` artık tam istenen şemayı üretiyor

## ✅ Oturum 19 — F9Bot Büyük Ölçekli Test + Kademe Üretim Verisi

**Yeni araç:** `debug/benchmark/large-scale-simulation.js` — level-aralığı
yerine TOPLAM oyun sayısı bazlı çalışır, kademe (bakır/bronz/gümüş/altın/
elmas/Matrix) ÜRETİM ORANLARINI da ölçer. Bunun için `core/GameCore.js`'e
`giftTierCounts` + `matrixMatchCount` takibi eklendi (her hediye
üretiminde/Matrix Eşleşme tetiklenmesinde artıyor).

**SONUÇLAR (10.000 oyun, level 1-100, pro profil, 65.8sn):**

| Metrik | Değer |
|---|---|
| Kazanma oranı | %37.9 |
| Ortalama skor | 561 |
| Ortalama skor/hedef | 1.06 |
| Ortalama hamle | 16.7 |

**KADEME ÜRETİM ORANLARI (oyun başına ortalama):**

| Kademe | Adet/oyun | Bakır'a göre nadirlik |
|---|---|---|
| Bakır | 1.343 | 1.0x (referans) |
| Bronz | 0.737 | 1.8x |
| Gümüş | 0.534 | 2.5x |
| Altın | 0.329 | 4.1x |
| Elmas | 0.178 | 7.5x |
| **Matrix Eşleşme** | 0.066 | **20.3x** |

**Not:** 50.000 oyun denendi ama bu ortamın komut süre sınırını aştı
(zaman aşımı, doğrulanamadı). 1000→10000 oyun arası sonuçlar iyi
yakınsadı (kazanma oranı %39.6→%37.9, elmas nadirliği 6.7x→7.5x) — 10K
istatistiksel olarak yeterince sağlam kabul edildi. Veri seti:
`debug/benchmark/baselines/large-scale-10000games-pro-2026-07-06.json`

**Bu veri "Evolution tablosunu kesinleştirmek" için doğrudan kullanılabilir**
— her kademenin GERÇEK nadirlik oranı artık ölçülmüş durumda (tahmin değil).

## ✅ Oturum 20 — Duality doğrulaması tamamlandı (%100) + Bake Pipeline kuruldu

**1. Duality doğrulaması (kullanıcının "Level 1-100 tutarlılığını doğrula"
maddesi) — TAMAMLANDI:**
- `generateLevel()` 1-100 arası hepsi geçerli `targetScore` üretiyor (doğrulandı)
- `content/levels/chapter-database.js`'in 20 bölümünün TAMAMINDA "score"
  tipi hedeflerde artık HİÇ sabit `value` yok (programatik tarama: 0 satır)
- Senkronizasyon kodu (`core/game-engine.js`) yerinde ve doğrulandı

**2. Bake Pipeline — YENİ:** `content/levels/bake-pipeline.js`
`generateLevel()`'ı SABİT bir referans seed (1) ile çalıştırıp level
1-100 için veriyi `content/levels/baked-levels-1-100.js`'e donduruyor.

```
targetScore aralığı: 290 - 1071
moves aralığı: 16 - 16  (Oturum 14 kararı gereği hep sabit)
```

**⚠️ AÇIK TASARIM SORUSU (kod değil, ürün kararı):** Bu dondurulmuş
dosya şu an SADECE referans/analiz amaçlı — motora bağlı DEĞİL. Çünkü
oyunun kendisi hâlâ `generateLevel(n, state.seed)` çağırıyor
(**oyuncuya özel** seed ile, her oyuncu farklı tahta görüyor). Dondurulmuş
veriyi gerçekten "yetkili" yapmak (yani "level 37'de HERKES aynı tahtayı
görsün") ayrı bir ürün kararı — çoğu match-3 oyununda level dengesi için
bu tercih edilir, ama bu projede henüz kararlaştırılmadı.

**Doğrulama:** `node -c` (hem baked dosya hem üretim build'i) + çalışma
zamanı testi → geçti. Üretim davranışı bu oturumda DEĞİŞMEDİ (bake
dosyası henüz runtime'a bağlı değil, sadece üretildi).

## 🔴 Oturum 21 — Kullanıcının şüphesi HAKLI ÇIKTI: aktif, oyuncuya görünür bir duality bulundu ve düzeltildi

**Soru:** "Motor bir şey üretiyor, UI başka şey gösteriyor durumu hâlâ
var mı?" — Evet, vardı, hem de düşünülenden fazla yerde.

**Bulgu — 3 AYRI dünya/bölüm veri kaynağı tespit edildi:**
1. `content/levels/chapter-database.js` (CHAPTER_DB) — 20 bölüm, level 190'a kadar
2. `content/worlds/world-metadata.js` (WORLD_DATABASE) — aynı 20 bölüm
3. **`ui/screens.js` içinde, İKİ AYRI yerde tekrarlanan yerel bir
   `CHAPTERS` dizisi — sadece 8 bölüm, level 70'e kadar, sonrası hep
   "Sonsuz Kulesi"**

**Somut, oyuncuya görünür etki:** Level 71+ bir oyuncu haritada/level-
başlangıç ekranında hep **"Sonsuz Kulesi"** görüyordu, ama motorun asıl
görev sistemi (CHAPTER_DB) onu gerçekte **"Volkan Adası"**, **"Kar
Zirvesi"**, **"Alacakaranlık Ormanı"** gibi 12 farklı, isimli bölümde
takip ediyordu (level 190'a kadar). Bu, kullanıcının tarif ettiği
"oyuncu hiçbir zaman dengeyi hissedemez" durumunun tam örneği.

**Düzeltme:**
1. `content/worlds/world-metadata.js` (WORLD_DATABASE) TEK yetkili
   kaynak yapıldı — eksik olan `icon`/`color` alanları eklendi (20
   bölümün hepsi için, ui/screens.js'in eski 8 bölümlük paletiyle
   tutarlı yeni renkler/ikonlar seçildi).
2. `ui/screens.js`'teki İKİ yerel `CHAPTERS` tanımı silindi, ikisi de
   artık `WORLD_DATABASE.map(...)` ile türetiliyor — tek kaynaktan.

**Kalan, daha düşük öncelikli not:** `CHAPTER_DB` hâlâ kendi
name/theme alanlarını AYRICA tutuyor (görev-tipi lookup için) —
`WORLD_DATABASE` ile içerik olarak eşleşiyor ama hâlâ elle senkronize
edilen 2 kopya var (aktif olarak DİVERGE etmiş değiller, CHAPTER_DB'nin
kendisi UI'da render edilmiyor artık — risk düşük ama sıfır değil).

**Doğrulama:** `node -c` + çalışma zamanı testi → geçti. Headless
benchmark (level 1-30) → değişmedi (bu tamamen bir UI düzeltmesi, oyun
mantığına dokunmadı).

## ✅ Oturum 22 — Tam Format: level001.json..level100.json + Level-Bazlı Denge Raporu

Kullanıcının kesin talebi: `level001.json ... level100.json` formatı +
her level için ayrı kazanma oranı/puan/hamle/kademe raporu. İkisi de
üretildi.

**1. `content/levels/baked/level001.json ... level100.json`** — 100
gerçek, ayrı JSON dosyası (`content/levels/bake-pipeline.js` güncellendi).
Örnek (`level037.json`):
```json
{ "level":37, "moves":16, "targetScore":630, "pattern":"pyramid",
  "density":0.17, "tierName":"orta", "isBreathe":false,
  "milestone":null, "blockerCells":1 }
```

**2. `debug/benchmark/level-balance-report.js`** — YENİ araç, level
BAZINDA (large-scale-simulation.js'in aksine, o toplam/ortalama
veriyordu) kazanma oranı + skor + hamle + kademe üretimini raporluyor.

**SONUÇ (10.000 oyun — level başına 100, pro profil, 62.1sn):**

**Genel özet:** Kazanma %38.0, skor/hedef 1.07, ortalama hamle 16.7 —
Oturum 19'daki toplu 10K sonucuyla (kazanma %37.9, oran 1.06) neredeyse
BİREBİR aynı, iki bağımsız ölçüm birbirini doğruluyor.

**⚠️ ÖNEMLİ DÜZELTME — önceki "geçilemez" bulgusu kısmen istatistiksel
gürültüymüş:** Önceki oturumlarda (level başına sadece 10 örnekle)
%0 çıkan level 29/53/89/99 gibi seviyeler, bu 10x daha büyük örneklemde
(100 oyun/level) **HİÇBİRİ %0 çıkmadı** (level 89: %11, level 99: %10 —
zor ama geçilebilir). Küçük örneklem boyutuyla "geçilemez" etiketlemek
yanıltıcıymış — n=10'da %10 gerçek kazanma oranı %35 ihtimalle
10/10 kayıpla sonuçlanabilir (0.9^10≈0.35), bu bizi yanlış yönlendirmiş.
**100 level'ın TAMAMINDA hem %0 hem %90+ uç değer YOK** — zorluk eğrisi
aslında düşünülenden daha sağlıklı.

Tam veri: `debug/benchmark/baselines/level-balance-report-100games-pro-2026-07-06.json`
(her 100 level için ayrı satır: winRate, avgScore, avgScoreRatio,
avgMoves, bakir, bronz, gumus, altin, elmas, matrix)

**Bu veri artık "Evolution Tablosunu Kilitleme" ve "İlk 100 Level
Eğrisi" (Faz 2, madde 4 ve 6) için hazır — level bazında hangi
aralığın (öğretici/bakır/bronz/gümüş/altın) hangi zorlukta olduğu
şimdi ölçülebilir.**

## ✅ Oturum 23 — `flow/` katmanı ayrıldı (%40 → %95) — mimarideki son büyük borç kapandı

**Neden:** `core/game-engine.js` (1739 satır) hâlâ dört büyük fonksiyonu
(`handleCellClick`, `executeMove`, `checkAndTransition`, `newLevel`)
içinde barındırıyordu — mimarinin geri kalanı (%85-95) çoktan ayrılmışken
bu tek katman geride kalmıştı (bkz. HANDOFF.md "Flow Katmanı Eksik").

**Yapılan bölünme** (4 dosya, `flow/`):
- `flow/levelFlow.js` (74 satır) — `newLevel()`: level girişi,
  generateLevel() çağrısı, DDA ayarı, hedef senkronu, tüp/GameCore kurulumu.
- `flow/moveFlow.js` (147 satır) — `handleCellClick()` + `_breakAdjacentWood()`:
  hücre seçimi, komşuluk kontrolü, getMoveOptions() yönlendirmesi.
- `flow/rewardFlow.js` (377 satır, en büyük parça) — `executeMove()` +
  `watchAd()`: GameCore.applyPlayerMove() sonucunun mesaj/ses/animasyon/
  enerji/hedef-ilerlemesine dönüştürülmesi, reklam-ile-devam ödülü.
- `flow/transitionFlow.js` (119 satır) — `checkAndTransition()` +
  `_checkNearMiss()`: won/lost değerlendirmesi, near-miss popup'ı.

`core/game-engine.js`: 1739 → 1070 satır (geriye kalan: `generateLevel`,
`getLevelGoal`, pattern fonksiyonları, `state` tanımı, yardımcılar —
saf motor + state, artık akış kodu yok).

**Mimari not — neden bu kadar kolay oldu:** `build/manifest.js`'teki dosya
sırası aslında TEK bir dev IIFE'nin parçaları — `core/bootstrap.js`
sonunda `(function () {` açıyor, `core/game-engine.js` sonunda `})();`
kapatıyor. Aradaki HER dosya (rules/, features/, engine/, content/,
economy/, ui/ dahil) aynı closure scope'unda. Bu yüzden yeni `flow/*.js`
dosyalarını manifest'te `core/game-engine.js`'ten HEMEN ÖNCE eklemek
yeterliydi — `state`, `GameCore`, `cellKey`, `F9Debug`, `F9Wave`,
`F9Anim` gibi üst-seviye tanımlara qualifier'sız erişebiliyorlar (aynı
`economy/energy-shop.js`'in `GameCore.prototype`'a eriştiği gibi).

**🐛 Bulunan ve düzeltilen hata (bu oturumda):** İlk kesimde
`executeMove`/`watchAd`/`checkAndTransition` bloğunu tek parça halinde
çıkarırken, aralarında duran ama flow mantığının PARÇASI OLMAYAN üç
değişken (`_lastRenderedScreen`, `_boardListenerAttached`,
`_boardListenerEl` — `ui/renderer.js`'in `render()`/
`attachBoardListener()` fonksiyonlarının kullandığı, ekran/DOM izleme
değişkenleri) yanlışlıkla silindi. `node build/build.js` runtime
kontrolü anında `ReferenceError: _lastRenderedScreen is not defined`
ile yakaladı — üçü de `core/game-engine.js`'e geri eklendi (flow'un
parçası değiller, orada kalmaya devam ediyorlar).

**Doğrulama (üç katman):**
1. `node build/build.js` → ✓ sözdizimi + runtime.
2. `node debug/benchmark/build-headless-engine.js` → ✓ (flow/*.js
   headless bundle'dan bilerek hariç tutuldu — DOM'a bağımlılar, F9Bot
   hiçbirini çağırmıyor; `build-headless-engine.js`'e `flow/` başlayan
   dosyaları atlayan bir satır eklendi, önceki davranışla birebir aynı
   — eskiden bu fonksiyonlar zaten `PURE_ENGINE_END_LINE`'ın sonrasında
   olduğu için bundle'a hiç girmiyordu).
3. **En kritik test:** orijinal (flow ayrılmamış) koddan TAZE bir
   "önce" benchmark'ı koşturup (level 1-100, 10 oyun, pro profil)
   refactor SONRASIYLA `compare-benchmark.js` ile karşılaştırdım —
   **100 leveldeki TÜM satırlar (kazanma oranı, skor/hamle) birebir
   aynı çıktı.** ("Bilinen açık sorular" listesindeki 5 Temmuz baseline'ıyla
   karşılaştırma FARKLI çıkmıştı — ama o fark bu refactor'den değil,
   aradaki bağımsız dengeleme değişikliklerinden (movesMult, MC kapatma
   vb.) kaynaklanıyordu; taze önce/sonra testi bunu ayırt etti.)

**Sonuç:** `flow/` durumu %40 → **%95**. HANDOFF.md'deki mimari durum
tablosu ve "Sıradaki adım" listesi güncellendi.

## ✅ Oturum 24 — Evolution tablosu DONDURULDU (kullanıcı kararı, kod değişikliği YOK)

**Karar:** `rules/evolutionRules.js` (blast boyutları, spawn patlama
şekilleri, enerji değerleri: gümüş+3, altın+6, elmas+12) ve
`F9_CONFIG.POINTS.BASE` (direkt eşleşme puanı: a:90, b:150, c:240,
d:360, e:500) mevcut haliyle RESMİ/kalıcı ilan edildi. **Tek bir sayı
bile değişmedi** — bu oturumun tek çıktısı, kod dosyalarına ve
HANDOFF.md'ye "dondurulmuş" notu eklemek.

**Gerekçe (Oturum 19/22'nin ölçülmüş 10K oyun verisine dayanarak):**

| Kademe | Puan | Spawn patlaması | Enerji | Üretim/oyun | Nadirlik |
|---|---|---|---|---|---|
| Bakır | 90 | yok | — | 1.343 | 1.0x |
| Bronz | 150 | 4'lü haç | — | 0.737 | 1.8x |
| Gümüş | 240 | satır+sütun | 3 | 0.534 | 2.5x |
| Altın | 360 | 5x5 alan | 6 | 0.329 | 4.1x |
| Elmas | 500 | tüm tahta (engel kırar) | 12 | 0.178 | 7.5x |
| Matrix Eşleşme | — (+10 hamle) | tüm tahta patlar | — | 0.066 | 20.3x |

Üç gözlem karar için yeterli kabul edildi:
1. **Puan (~1.6x/kademe) ve nadirlik (~1.5-2x/kademe) birbirini
   dengeliyor** — nadir kademe zaten daha değerli, ayrı bir "adaletsizlik"
   düzeltmesi gerekmiyor.
2. **Etki gücü kademeyle monoton artıyor** (yok→4 hücre→satır/sütun→
   5x5→tüm tahta) — sıçrama yok, tutarlı bir eğri.
3. **level-balance-report'ta (100 level × 100 oyun) hiçbir level %0
   kazanma çıkmadı** (en zoru level 89: %11) — bu tablo oyunu
   kilitlemiyor, dolayısıyla "kırık" olduğuna dair kanıt yok.

**Değiştirilen dosyalar:** `core/bootstrap.js` (`POINTS.BASE` yorumu),
`rules/evolutionRules.js` (dosya başlığı) — ikisine de "DONDURULDU,
değiştirmeden önce kullanıcıya sor" notu eklendi. Davranışsal hiçbir
değişiklik yok, bu yüzden benchmark karşılaştırması gerekmedi.

**HANDOFF.md güncellemeleri:** mimari durum tablosunda "Evolution
tablosu" %60→%100; "En kritik kararlar" listesine madde 9 eklendi;
"Bilinen açık sorular" listesinden evolution maddesi çıkarıldı;
"Sıradaki adım" seçenekleri 3'ten 2'ye indi.

## ✅ Oturum 25 — name/theme dublikasyonu ÇÖZÜLDÜ (CHAPTER_DB → WORLD_DATABASE'e bağlandı)

**Kod taraması gösterdi ki risk zaten gerçekleşmemiş bir tehlikeydi
değil, ÖLÜ KODDU:** `content/levels/chapter-database.js`'teki her
chapter girdisinin `theme` alanı **hiçbir yerde okunmuyordu**
(codebase-genelinde `grep ".theme"` sıfır sonuç). `name` alanı ise
`getLevelGoal()` içinde `chapterName` olarak dönüyordu, ama UI kodu
(`ui/screens.js`) bunu hiç tüketmiyordu — zaten doğrudan
`WORLD_DATABASE`/`worldForLevel()` kullanıyordu (Oturum 21'de taşınmıştı).

**Yapılan değişiklik:**
1. `content/levels/chapter-database.js`: 20 chapter girdisinin tümünden
   `name:"..."` ve `theme:"..."` alanları kaldırıldı — artık sadece
   `{ chapter:N, levels:[...] }`.
2. `core/game-engine.js` `getLevelGoal()`: `chapterName: ch.name` →
   `chapterName: worldForLevel(levelNumber).name` — artık TEK kaynak
   `WORLD_DATABASE` (content/worlds/world-metadata.js).
3. `content/worlds/world-metadata.js`: "elle senkron tutulmalı" bakım
   notu kaldırıldı, artık geçerli değil.

**🐛 Bulunan ve düzeltilen ikincil hata:** `getLevelGoal()`'a eklenen
1 satırlık yorum, `core/game-engine.js`'in geri kalanını 1 satır
kaydırdı — bu da `debug/benchmark/build-headless-engine.js`'teki
hardcoded `PURE_ENGINE_END_LINE=349` sabitinin artık `generateLevel()`
içindeki bir `F9Debug.log(...)` çağrısının TAM ORTASINDAN kestiğini
ortaya çıkardı (`node debug/benchmark/build-headless-engine.js` anında
sözdizimi hatasıyla yakaladı). `PURE_ENGINE_END_LINE` → 352 olarak
güncellendi. **⚠️ Bilinen kırılganlık:** bu sabit, `core/game-engine.js`'in
generateLevel()'dan ÖNCEKİ herhangi bir satırına yapılan her ekleme/
silmede kaymaya devam edecek — kalıcı çözüm ayrı bir iyileştirme
konusu (örn. `generateLevel` fonksiyonunu ayrı bir dosyaya taşımak,
satır-numarası yerine dosya sınırı kullanmak).

**Doğrulama:** `node build/build.js` ✓, headless bundle ✓, 100 level ×
10 oyun (pro) benchmark → orijinal (bu oturum öncesi) koddan taze
"önce" sonucuyla **birebir aynı** çıktı — davranış hiç değişmedi
(beklenen, çünkü kaldırılan alanlar zaten ölüydü).

**HANDOFF.md güncellemeleri:** "Bilinen açık sorular" listesinden
name/theme maddesi kaldırıldı; artık açık soru olarak sadece "bake
pipeline yetkilendirmesi" kaldı.

## 🔴 Oturum 26 — Motor Sağlamlık Denetimi: KRİTİK HATA BULUNDU (kayıp ekranına hiç geçilmiyordu) + performans/stres testleri

**Kullanıcı önceliği:** "önce motor ve yönetimi hatasız kıl, renk/ses/
animasyon sona kalsın." Üç parçalı bir denetim yapıldı: (1) gerçek
performans ölçümü (HANDOFF'ta %0 işaretliydi, hiç yapılmamıştı),
(2) çoklu-bot-profili stres testi (şimdiye kadar sadece "pro" test
edilmişti), (3) flow kodunun edge-case denetimi.

### 1. Performans ölçümü (YENİ araç: `debug/benchmark/perf-measure.js`)

Gerçek wall-clock zamanlaması ölçüldü (headless motor, DOM/render/
animasyon YOK — sadece match/evolution/blocker/board-resolve'un saf
hesaplama süresi). 100 level × 10 oyun, "pro" profil (en agresif bot,
en çok chain/combo tetikleyen — en kötü senaryo):

- **applyPlayerMove() süresi:** ortalama 190µs, p50 ~125µs, p95 ~400µs,
  p99 ~660µs — 60fps'in 16.67ms bütçesinin **%1'inden azı**.
- Nadir sıçramalar var (%0.6 hamle, 8-21ms) ama **3 ayrı çalıştırmada
  p50/p95/p99 neredeyse birebir sabit kalırken `max` her seferinde
  farklı yerde/değerde sıçradı** — bu, GC (garbage collection)
  duraklaması imzası, algoritmik darboğaz DEĞİL (gerçek bir hotspot
  aynı level/hamlede tutarlı tekrar ederdi).
- **Sonuç: motor performansı sağlıklı**, mobil cihazda da bu oranın
  büyük ölçüde korunması beklenir (rakamlar mutlak değil ama
  göreceli bulgu — medyan hamle <1ms saf mantık — transfer eder).

### 2. Çoklu-profil stres testi (`level-balance-report.js`, 3 profil × 100 oyun/level)

| Profil | Kazanma oranı | Skor/hedef | Geçilemez (%0) level |
|---|---|---|---|
| casual | %4.7 | 0.38 | **43/100** |
| normal | %10.0 | 0.47 | **14/100** |
| pro | %38.0 | 1.07 | 0/100 |

**Yorum:** "pro" sayıları önceki temel veriyle (Oturum 19/22) birebir
tutarlı — ölçüm sağlam. Ama casual/normal'daki yüksek "geçilemez" oranı
muhtemelen **level tasarımı sorunu DEĞİL, bot-gerçekçiliği sorunu**:
`debug/bot.js`'teki `PROFILES.casual` (`ninePref:0.20`) bot'un oyunun
TEMEL kazanma mekanizmasını (9 oluşturma) hamlelerinin sadece %20'sinde
önceliklendirdiği anlamına geliyor — gerçek bir acemi insan oyuncu bile
gördüğü açık bir eşleşmeyi genelde alır, sadece çok adımlı kombo
planlamaz. Yani "casual" bot yarı-rastgele oynuyor, gerçekçi bir acemi
oyuncuyu değil. Bu, README'nin Oturum 6 notlarındaki hiç çözülmemiş
şüpheyi ("bot mu zayıf, level mi zor") n=10'dan n=100'e çıkararak çok
daha kesin hale getirdi ama TAM çözmedi — bot profili gerçek insan
verisiyle kalibre edilmeden level zorluğu hakkında kesin hüküm
verilemez. **Level zorluğuna DOKUNULMADI** — bu veri sadece gelecekteki
bir karar için hazır, aksiyon gerektirmiyor (henüz).

### 3. 🔴 KRİTİK HATA BULUNDU VE DÜZELTİLDİ: kayıp ekranına HİÇ geçilmiyordu

Flow kodu edge-case denetimi sırasında bulundu: `checkAndTransition()`
(flow/transitionFlow.js) `gc.status==="won"` olduğunda `state.screen=
"win"` yapıyordu ama **`gc.status==="lost"` olduğunda `state.screen`'i
HİÇBİR ZAMAN `"lose"` yapmıyordu.** `renderLose()` (ui/screens.js)
tam ve çalışır bir fonksiyondu (analytics, reklam-devam teklifi,
en-iyi-skor takibi, motivasyon mesajı) ama **hiç çağrılamıyordu** —
`ui/renderer.js`'deki `if (state.screen === "lose") renderLose();`
dalı codebase genelinde TEK yerdi, hiçbir kod `state.screen`'i
`"lose"` yapmıyordu (`grep` ile doğrulandı: sıfır atama).

**Sonuç:** bir oyuncu hedefe ulaşamadan hamlesi bitince, oyun donmuş
bir tahtada kalıyordu — geri bildirim yok, kayıp ekranı yok, devam
yolu yok. `handleCellClick` zaten `gc.status !== "in_progress"`
olunca sessizce hiçbir şey yapmıyor, yani oyuncu gerçekten sıkışıyordu.

**Kök neden (ikinci, bağlantılı ölü kod):** `_checkNearMiss()`'in
kendi İLK satırı `if (!gc || gc.status !== "in_progress") return
false;` — ama `checkAndTransition()` onu SADECE `gc.status==="lost"`
olduktan SONRA çağırıyor (status ya `GameCore._updateStatus()`
tarafından ya da `checkAndTransition()`'ın kendi `achieved` kontrolü
tarafından ÖNCEDEN "lost" yapılmış oluyor). Yani `_checkNearMiss`
çağrıldığı ANDA kendi koruması onu her zaman engelliyordu —
**near-miss popup'ı da hiçbir zaman gösterilmemiş**, tamamen ölü kod.
Bu ayrı bir tasarım kararı gerektiriyor (near-miss ne zaman
kontrol edilmeli — "lost" olmadan ÖNCE mi?) — şimdilik SADECE
kayıp-ekranı geçişi düzeltildi, near-miss'in ne zaman/nasıl
tetiklenmesi gerektiği kullanıcıya soruldu, henüz karar yok.

**Neden hiç yakalanmadı:** Tüm otomatik testler (F9Bot, benchmark)
`gc.status`'u doğrudan okuyor, `state.screen`'e hiç bakmıyor —
headless bundle zaten `flow/*.js`'i (ve dolayısıyla
`checkAndTransition()`'ı) hariç tutuyor. Yani bu, sadece gerçek
UI/ekran akışını çalıştıran bir denetimle bulunabilirdi.

**Düzeltme** (`flow/transitionFlow.js`):
```js
if (gc.status === "lost") {
  if (_checkNearMiss(gc, state.cfg)) return; // (hâlâ dead code, ayrı konu)
  clearAllHourglassTimers();
  state.screen = "lose";
  return true;
}
```

**Doğrulama:** `node build/build.js` ✓. Bu düzeltme F9Bot/benchmark
sonuçlarını ETKİLEMEZ (bot'lar `state.screen`'e bakmıyor, headless
bundle `flow/` dosyalarını zaten hariç tutuyor) — bu yüzden benchmark
karşılaştırması gerekmedi, ama gerçek oyun UI'sinde artık bir level
kaybedildiğinde doğru ekrana geçilecek.

## ✅ Oturum 26 (devam) — Near-miss "Tasarım B" olarak yeniden yazıldı + jsdom ile uçtan uca doğrulama + ikinci bir gizli hata bulundu/düzeltildi

**Kullanıcı kararı:** Near-miss, kayıptan SONRA (movesLeft=0 iken)
tetiklensin, hedefe %15'ten az kalmışsa VE reklam hakkı kullanılmamışsa
gösterilsin, birincil aksiyon **reklam izleyerek devam** olsun (ücretsiz
hamle YOK) — "Tasarım B", kullanıcının kendi ifadesiyle: *"oyuncunun
hamlesi kalmadıysa reklam izleyerek hamle alabilir."*

### Yeniden yazılan `_checkNearMiss()` (flow/transitionFlow.js)

- Guard `gc.status !== "in_progress"` → `gc.status !== "lost"` (artık
  DOĞRU çağrı noktasıyla tutarlı — bu fonksiyon zaten sadece kayıp
  KESİNLEŞTİKTEN sonra çağrılıyor).
- Şart `movesLeft<=3 && movesLeft>0 && ... && projected>=...` (hamle
  kalmışken proaktif uyarı modeli, asla tetiklenemiyordu) → sadeleşti:
  `canAd && gap>0 && gap<=target*0.15` (reklam hakkı VAR ve hedefe
  %15'ten az kaldıysa).
- Buton: "+N Hamle Al" (ücretsiz, direkt `extraMoves` arttırma) →
  "📺 Reklam izle → devam et", tıklanınca mevcut `watchAd()`
  (flow/rewardFlow.js) çağrılıyor — `GameCore.watchAdContinue()`
  (economy/energy-shop.js) ile AYNI mekanizma, `renderLose()`'un kendi
  reklam butonuyla tutarlı, ayrı bir ödül sistemi icat edilmedi.
- Modal-tekrar-oluşturma koruması güçlendirildi: modal zaten açıksa
  `true` dönüyor (önceden `false` dönüp `checkAndTransition()`'ın
  modalı ezip doğrudan kayıp ekranına geçmesine izin veriyordu —
  bu haliyle nadir bir render() tetiklenmesinde modal aniden
  kaybolabilirdi).

**🐛 Bunu yazarken bulunan YENİ bir hata (kendi kendine):** `_checkNearMiss`
artık modal-açıkken `true` döndüğü için, `checkAndTransition()`'ın bunu
`return true` olarak yukarı taşıması **sonsuz özyinelemeye yol açardı**
— `ui/renderer.js`'in `render()`'ı `if (checkAndTransition()) { render();
return; }` yapıyor, yani her `render()` çağrısı yeni bir `render()`
tetikleyip stack overflow'a giderdi. Fark edilir edilmez düzeltildi:
`checkAndTransition()` modal-bekleme durumunda hâlâ `return;` (falsy,
değersiz) ile çıkıyor — `_checkNearMiss`'in kendi iç `true`/`false`'u
SADECE "kayıp ekranına geç mi geçme mi" kararı için kullanılıyor, dışarı
sızmıyor.

### jsdom ile uçtan uca doğrulama (YENİ yöntem — önceki oturumlarda hiç kullanılmamıştı)

Önceki tüm doğrulamalar (F9Bot/benchmark) `flow/*.js`'i (ve dolayısıyla
`state.screen`/DOM'u) hiç çalıştırmıyordu — tam da bu yüzden kayıp-ekranı
hatası hiç yakalanmamıştı. Bu sefer `jsdom` kurulup (`npm install jsdom
--no-save`, geçici, teslimattan çıkarıldı) derlenmiş `fusion9_clean.html`
GERÇEKTEN bir DOM'da çalıştırıldı, test kodu üretim IIFE'sinin İÇİNE
enjekte edilip `window.__runLoseTest(senaryo)` gibi köprü fonksiyonlarla
sonuç dışarı aktarıldı. Test edilen 5 senaryo, hepsi ✓:

1. Uzak kayıp → `screen:"lose"`, modal yok.
2. Near-miss (reklam hakkı var) → `screen:"game"` (kalır), modal açık;
   modal açıkken 20x `render()` çağrısı → tek modal, özyineleme yok;
   "reklam izle" tıklanınca → `status:"in_progress"`, `screen:"game"`,
   modal kapanıyor.
3. Near-miss ama reklam hakkı BİTMİŞ → doğrudan `screen:"lose"`.
4. Near-miss + "vazgeç" → modal açık, tıklayınca `screen:"lose"`.
5. (Aşağıda) tüp-tükenmesi senkron testi.

### 🐛 İkinci, tesadüfen bulunan hata: tüp tükenirse state senkron kaybı

Test sırasında (art arda `newLevel()` çağrıları tüpleri tükettiğinde)
`gc.targetScore` (441) ile `state.levelGoal.value` (331) birbirinden
FARKLI çıktı — araştırınca: `newLevel()` `state.levelGoal`/`state.cfg`'yi
tüp kontrolünden ÖNCE güncelliyordu, ama `state.gc`'yi tüp kontrolünden
SONRA oluşturuyordu. Tüpler tam o an tükenmişse (`showNoTubesModal()`
+ erken `return`), `state.levelGoal/cfg` YENİ levele göre güncellenmiş
oluyordu ama `state.gc` ESKİ levelin GameCore'u olarak kalıyordu — anlık
bir tutarsızlık penceresi. **DÜZELTİLDİ:** tüp kontrolü artık
`state.levelGoal`/`state.cfg` güncellenmeden ÖNCE yapılıyor
(`flow/levelFlow.js`) — jsdom ile 3 ayrı alan (`gc` referansı,
`levelNumber`, `targetScore` eşleşmesi) doğrulandı, hepsi ✓.

**Doğrulama:** `node build/build.js` ✓, headless benchmark ✓ (100 level
× 10 oyun pro profil, orijinal koddan taze "önce" sonucuyla **birebir
aynı** — beklenen, çünkü her iki düzeltme de sadece `state.screen`/
tüp-senkron zamanlamasını etkiliyor, `gc.status`'u değil).

**HANDOFF.md güncellemeleri:** "En kritik kararlar" madde 10 (near-miss
Tasarım B, kilitli); "Bulunmuş hatalar" listesine tüp-senkron hatası
eklendi; performans satırı %100 olarak işaretlendi.

## ✅ Oturum 27 — "Saat başı ödül" reklamsız olduğu doğrulandı + hızlı test için 5 dakikaya çekildi (GEÇİCİ)

**Kullanıcı isteği:** "Oyuna başlarken reklam izle olmasın, oyuna
katıldığı için ödülünü alsın; her saat başı oyun açık kalırsa yine
ödül alsın; şu anki tasarımda her 5 dakika 1 saatmiş gibi geçerli
olsun, ileride düzeltiriz."

**Kod taraması gösterdi ki oyunun MEVCUT "saat başı ödül" mekanizması
zaten tam istenen şekilde çalışıyor** — bu, `renderPlayIntro()`'daki
tüp/can yenileme sistemi (`state.TUBE_REFILL_SEC`, `refillTubes()`):

- `btn-claim-tube` (renderPlayIntro) → doğrudan `refillTubes()` çağırır,
  **reklam YOK**.
- `btn-intro-play` (oyuna başla) → `refillTubes()` + tüp varsa direkt
  oyuna girer, **reklam YOK**.
- `renderDailyReward()` (günlük giriş ödülü) → zaten reklamsız enerji
  ödülü veriyordu.
- `showNoTubesModal()`'daki "📺 Reklam izle → +1 Tüp" butonu AYRI ve
  İSTEĞE BAĞLI bir hızlandırma seçeneği (tüpler tükendiğinde beklemek
  yerine anında +1 tüp) — kullanıcının istediği "temel döngü reklamsız"
  kuralını BOZMUYOR, sadece ek bir opsiyon.

**Yapılan TEK değişiklik:** `state.TUBE_REFILL_SEC` (önceden sabit 2700
saniye / 45 dakika) artık `HOURLY_REWARD_TEST_MODE` bayrağına bağlı:

```js
const HOURLY_REWARD_TEST_MODE = true;       // ⚠️ üretimde false yapılmalı
const HOURLY_REWARD_TEST_SEC  = 300;        // 5 dakika (test)
const HOURLY_REWARD_REAL_SEC  = 3600;       // 1 saat (gerçek/üretim)
...
TUBE_REFILL_SEC: HOURLY_REWARD_TEST_MODE ? HOURLY_REWARD_TEST_SEC : HOURLY_REWARD_REAL_SEC,
```

Kullanıcının kendi ifadesiyle "ileride düzeltiriz" — bu yüzden
HANDOFF.md'nin en üstüne, kaçırılmaması için **⚠️ Üretime Çıkmadan Önce
Kontrol Et** başlıklı ayrı bir bölüm eklendi (tek satırlık geri alma:
`HOURLY_REWARD_TEST_MODE = false`).

**Doğrulama:** `node build/build.js` ✓, headless bundle ✓ (bu değişiklik
F9Bot/benchmark'ı etkilemez — tubes/state.screen'e hiç dokunmuyorlar).

## ✅ Oturum 28 — Patlama şekilleri denetimi: Altın'ın spawn patlaması kalın "artı" iken ince haça çevrildi

**Kullanıcı isteği:** "Sayıların eşleşme ve patlama alanları, tüm
efektler Matrix hariç — örnek 3 hücre yatay 4 hücre dikey, 3x4 değil,
3 hücre satır 4 hücre sütun gibi — diğerleri de aynı, sadece sayılara
göre ayarla."

**Kod taraması: çoğu yer ZATEN doğruydu.** Bu prensip (satır+sütun
ince haç, dolu blok DEĞİL), karışık-tür kombinasyon patlaması için
Oturum 14'te ZATEN kullanıcının kendi bugünkü ifadesiyle BİREBİR AYNI
gerekçeyle uygulanmıştı (`core/GameCore.js areaBlastCells()` fallback
yolu — bkz. o zamanki yorum: *"3x4 değil, 3 hücre yatay 4 hücre dikey"*).
Aynı-tür kombinasyon patlaması (`crossOffsets()`) da zaten simetrik
ince bir haç. Bakır+farklı-tür (Mekanizma 3b) ayrı bir mekanizma —
tam satır+tam sütun süpürüyor, bu istekten etkilenmiyor.

**Bulunan tek gerçek uyumsuzluk: Altın'ın SPAWN patlaması.**
`rules/evolutionRules.js`'teki `GIFT_SPAWN_BLAST[GIFT_GOLD]=[5,5]`
görünüşte "5x5 alan" yorumuyla tanımlıydı, ama `_applyGiftSpawn()`
bunu `areaBlastCells(sr,sc,[5,5],false,giftType)` şeklinde giftType
İLE çağırıyordu — bu da otomatik olarak `AREA_BLAST_OFFSETS.normal
[GIFT_GOLD]` tablosunu (kombinasyon/terfi mekanizmasının kullandığı,
Oturum 14'te onaylanmış ama ORTASI KALINLAŞAN 17 hücrelik "artı formu")
tetikliyordu — gerçek şekli görselleştirip doğruladım:

```
. . . . . . . . .          . . . . . . . . .
. . . . X . . . .          . . . . . . . . .
. . . . X . . . .          . . . . X . . . .
. . . X X X . . .    →     . . . . X . . . .
. X X X O X X X .          . . X X O X X . .
. . . X X X . . .          . . . . X . . . .
. . . . X . . . .          . . . . X . . . .
. . . . X . . . .          . . . . . . . . .
(17 hücre, ORTASI KALIN)   (9 hücre, İNCE haç — 5 yatay+5 dikey)
```

**Düzeltme:** `_applyGiftSpawn()`'da giftType yerine `false` geçiliyor
— bu, `areaBlastCells()`'i giftType-tablosu yerine `[nRows,nCols]`
sayılarından (5,5) İNCE haç üreten (nRows/nCols tabanlı, aynı fallback
mekanizma) yola zorluyor. **SADECE spawn-anı patlamasını etkiler** —
kombinasyon/terfi (promotion) alan patlaması mekanizması (Oturum 14
kullanıcı onaylı, HANDOFF.md "En kritik kararlar" madde 7) DEĞİŞMEDİ,
kasıtlı olarak dokunulmadı.

**Doğrulama:** yeni şekil Node'da hesaplanıp görselleştirildi (9 hücre,
tam "5 yatay+5 dikey" — doğru). `node build/build.js` ✓. 100 level ×
10 oyun (pro) benchmark → orijinal koddan taze "önce" sonucuyla
**anlamlı fark yok** (beklenen: Altın nadir bir kademe — 0.329/oyun —
ve 17→9 hücre farkı toplam skora göre küçük kalıyor, istatistiksel
gürültüde kayboluyor).

## 🔴 Oturum 29 — Evolution mekaniği kapsamlı yeniden yazıldı (kullanıcı tam tablo verdi) + 2 kritik hata bulundu/düzeltildi

**Kullanıcı, tüm terfi (+9) ve karışık-tür kombinasyon patlama
boyutları için TAM bir tablo verdi** (bakır+9→4 hücre→bronz,
bronz+9→5→gümüş, ..., elmas+9→8 hücre+3 hamle; bakır+bronz→3 yatay+4
dikey, ..., altın+elmas→6 yatay+7 dikey). Uygulamadan önce iki kritik
netleştirme soruldu (Elmas+9'un "Matrix Eşleşme" ile çelişkisi, Bakır
çiftlerinin mekanizma değişimi) — kullanıcı onayladı: **Matrix Eşleşme
adı/etiketi kalıyor ama artık tüm-tahta+10-hamle DEĞİL, 8 hücre haç+3
hamle**; **Bakır çiftleri de diğerleriyle aynı satır/sütun haç
mekanizmasına geçiyor** (eski "rastgele 3x3 blok" mekanizması kaldırıldı).

### Yapılan değişiklikler

1. **`rules/evolutionRules.js`**: `GIFT_PROMO_BLAST` → `GIFT_PROMO_CROSS_SIZE`
   (tek sayı, `crossOffsets()` ile tüketiliyor — bkz. aşağıdaki hata #1).
   `DIFFERENT_TYPE_AREA_COMBOS` tamamen yeniden yazıldı: 4 yeni Bakır
   çifti eklendi (`extraMoves=0`, eski mekanizmalarıyla tutarlı), diğer
   6 çiftin `[nRows,nCols]` değerleri kullanıcının formülüne göre
   güncellendi (`extraMoves`/`energy` DEĞİŞMEDİ). `COPPER_BLAST_EXTRA_
   3X3_BLOCKS` retire edildi. `AREA_SIZE_TO_COMBO_COUNT` yeni boyut
   anahtarlarına göre yeniden sıralandı.
2. **`engine/evolutionEngine.js`**: `mechanism3bCopperBlast()` kaldırıldı;
   `mechanism3GiftCombo()`'daki Bakır özel dalı kaldırıldı — artık TÜM
   farklı-tür çiftleri `mechanism3cAreaCombo()`'ya gidiyor.
   `mechanism2Promotion()` `crossOffsets(GIFT_PROMO_CROSS_SIZE[...])`
   kullanacak şekilde yeniden yazıldı.
3. **`core/GameCore.js`**: terfi patlaması tüketim bloğu `result.
   crossBlastOffsets` kullanacak şekilde güncellendi (aynı-tür
   kombinasyonuyla AYNI tüketim deseni). Artık tetiklenemeyen eski
   Mekanizma 3b bloğu (`result.blastSize`) ve onun ürettiği `blastCells()`
   metodu kaldırıldı/retire edildi (referans için yorumla işaretli).

### 🐛 Test sırasında bulunan 2 kritik hata (ilk uygulamamda)

Doğrudan `GameCore` ile (jsdom değil, headless bundle + el ile hediye
yerleştirme) her kombinasyonu tek tek test ettim — iki gerçek hata
bulundu, ikisi de **ilk yaklaşımım `[nRows,nCols]` çiftlerini
`areaBlastCells()`'e beslemekti, ki bu SAME_TYPE_BLAST_SIZE'ın zaten
kullandığı `crossOffsets()`'ten FARKLI bir formül**:

1. **Yanlış hücre sayıları:** `GIFT_PROMO_BLAST[COPPER]=[4,4]` gibi
   simetrik çiftler `areaBlastCells()` ile beslenince 7 hücre üretti
   (beklenen 4'ün YERİNE `nRows+nCols-1` formülü çalıştı). `crossOffsets(4)`
   kullanınca doğru sayıya (6, board-kırpması hariç kalıcı formül
   `2*(N-1)`) geçildi — SAME_TYPE_BLAST_SIZE ile TUTARLI hale getirildi.
2. **🔴 DAHA CİDDİ: Elmas+9 hâlâ TÜM TAHTAYI patlatıyordu (64 hücre)!**
   `GIFT_PROMO_BLAST[DIAMOND]=[8,8]` yanlışlıkla `areaBlastCells()`'in
   kendi özel durumuna denk geldi: `if(nRows>=size&&nCols>=size){...tüm
   tahta...}` — board 8x8 olduğu için `[8,8]` bu eşiği TAM karşılıyordu!
   Kullanıcının "Matrix'i 8 hücreye küçült ama tüm tahta OLMASIN" kararı
   sessizce İHLAL EDİLİYORDU. `crossOffsets(8)` kullanımına geçilince
   düzeltildi — doğrudan `GameCore` testiyle (64→11-13 hücre) doğrulandı.

**Ders:** Bu codebase'de "N hücre" ifadesi HER YERDE `crossOffsets()`'e
verilen PARAMETREYİ belirtiyor (gerçek toplam hücre sayısını DEĞİL) —
`[nRows,nCols]` biçimi TAMAMEN FARKLI bir mekanizma (mixed-combo,
Mekanizma 3c) ve iki mekanizmayı karıştırmak sessiz, ciddi hatalara
yol açıyor.

### Denge etkisi (ölçüldü, beklenen ama belirgin)

100 level × 100 oyun (pro), Oturum 24'ün donmuş temel verisiyle kıyas:

| | Önce (Oturum 24) | Sonra (Oturum 29) |
|---|---|---|
| Kazanma oranı | %38.0 | %30.7 |
| Skor/hedef | 1.07 | 0.80 |
| Bakır/oyun | 1.343 | 1.295 |
| Bronz/oyun | 0.738 | 0.706 |
| Gümüş/oyun | 0.533 | 0.515 |
| Altın/oyun | 0.339 | 0.328 |
| Elmas/oyun | 0.186 | 0.186 |
| Matrix/oyun | 0.066 | 0.079 |
| Geçilemez (%0) level | 0 | 1 (level 69) |

**Yorum:** Düşüş esas olarak Matrix Eşleşme'nin çok küçülmesinden
kaynaklanıyor (tüm tahta+10 hamle → 8-13 hücre+3 hamle — oyunun en
büyük tek bonus olayının ezici çoğunluğu kayboldu). Bu, kullanıcının
AÇIKÇA istediği değişiklik — Oturum 24'ün "dondurma" kararı bu yeni
tabloyla TERSİNE ÇEVRİLDİ (kullanıcı kararı, HANDOFF güncellendi).

**Doğrulama:** `node build/build.js` ✓. Doğrudan GameCore testleriyle
tüm 5 terfi + 10 karışık-tür kombinasyon TEK TEK doğrulandı (beklenen
hücre sayıları, board-kırpması hesaba katılarak, birebir eşleşti).
100×100 benchmark koşturuldu, denge etkisi ölçülüp yukarıda raporlandı.

## ✅ Oturum 30 — Eşleşme şekilleri (3/4/5/6/7'li bloklar) kullanıcının tam koordinat listesiyle değiştirildi

**Kullanıcı, 9-oluşturan tüm şekil şablonları için TAM koordinat listesi
verdi** (3'lü'den 7'li'ye, hangi hücrenin "9" (spawn) olacağı dahil).
"Kordinatları öncekilerin yerine yaz, diğer durumlar aynı" talimatıyla.

### Analiz: neyin değiştiği, neyin aynı kaldığı

Kullanıcının verisini `rules/matchRules.js`'teki mevcut `Sh()` şablon
sistemiyle (cells + spawn, `engine/matchEngine.js`'in `findAllMatches()`
her board pozisyonunda kaydırarak test ediyor) karşılaştırdım:

- **3'lü bloklar (10 girdi):** 6 tanesi düz çizgi (LINE_3_H/V, zaten
  `LINE_3_SPAWN_OFFSETS=[0,1,2]` ile aynı), 4 tanesi köşe şekli —
  **kod ile birebir aynı çıktı, hiç değişmedi.**
- **4'lü bloklar (16 girdi):** 4 tanesi çizgi (zaten `LINE_4_SPAWN_
  OFFSETS=[1,2]` ile aynı), 12 tanesi blok — eski kod sadece 8 blok
  şekli tanımlıyordu (L_SHAPES+TACK_SHAPES), kullanıcının 12'si TAMAMEN
  yeni bir set olarak yazıldı (`BLOCK_4_SHAPES`).
- **5'li bloklar (14 girdi):** 2 çizgi (zaten `LINE_5_SPAWN_OFFSET=2`
  ile aynı), 12 blok — eski kod da 12 blok tanımlıyordu (CORNER_5+U+T),
  kullanıcının 12'si bunların yerini aldı (`BLOCK_5_SHAPES`).
- **6'lı bloklar (4 girdi):** çizgi yok, 4 blok — eskiyle aynı sayı,
  koordinatlar değişti (`BLOCK_6_SHAPES`).
- **7'li bloklar (4 girdi):** çizgi yok, 4 blok — aynı sayı, koordinatlar
  değişti (`BLOCK_7_SHAPES`).

### 🐛 Yan etki olarak bulunan/düzeltilen gizli hata

`findAllMatches()`'in arama algoritması her şeklin `maxDr`/`maxDc`'ini
(hücrelerin MAKSİMUM satır/sütun ofseti) kullanıyor, board üzerinde
`baseR=0..GRID-1-maxDr` aralığında kayıyor — eğer bir şeklin
koordinatları 0'dan BAŞLAMIYORSA (örn. min satır=1), motor o şekli
board'un en üst/sol kenarında ASLA test edemiyordu (gizli bir kör
nokta). Eski `SIX_SHAPES`'in 2 girdisinde (`six_2`, `six_3`) TAM BU
SORUN vardı. Kullanıcının verisi tamamen normalize (min satır/sütun=0)
olduğu için, tüm koordinatları olduğu gibi yazmak bu sorunu da
otomatik olarak düzeltti — ekstra bir işlem gerekmedi, sadece
doğrulandı (bkz. aşağıdaki test).

### Doğrulama

1. `node build/build.js` ✓
2. **36 sabit şeklin TAMAMI** (4 köşe + 12×4-blok + 12×5-blok + 4×6-blok
   + 4×7-blok) doğrudan `findAllMatches()` ile tek tek test edildi —
   board ortasına yerleştirilip hem TESPİT EDİLDİĞİ hem de doğru
   `spawn` hücresini ürettiği doğrulandı: **36/36 geçti.**
3. Çizgi şekilleri (3/4/5'li) `findLineMatches()` ile ayrı test edildi
   — bu fonksiyona hiç dokunulmadı, davranışı önceki oturumlardan
   değişmedi (kapsam dışı).
4. 100 level × 10 oyun (pro) benchmark + tam level-balance-report
   (100×100) çalıştırıldı — **Oturum 29'un sonuçlarıyla (kazanma
   %30.7, oran 0.80) neredeyse birebir aynı** — şekil geometrileri
   değişti ama toplam "9 oluşturma" olasılığı/dengesi bozulmadı
   (beklenen, iyi sonuç — şekil sayıları grup başına benzer kaldı).

**Değiştirilen dosya:** sadece `rules/matchRules.js` (tamamen yeniden
yazıldı, `SMALL_CORNER_SHAPES` hariç). `engine/matchEngine.js`'e hiç
dokunulmadı (Sh() tüketim mantığı zaten esnek, yeni şekil sayısına
otomatik uyum sağladı).

## 🔴 Oturum 31 — Level bazlı şekil (eşleşme) raporu + F9Bot'ta gerçek bir önyargı hatası bulundu/düzeltildi

**Kullanıcı isteği:** "Oyuncunun herhangi bir levelde yapabileceği
eşleştirmeleri önceden bilmek istiyorum" — kullanıcı ayrıca bağımsız
bir "9 eşleştirme" script'i paylaşıp bunun bir "level test botu" olarak
kullanılıp kullanılamayacağını sordu.

### Neden kullanıcının script'i değil, F9Bot genişletildi

Paylaşılan script incelendi: hücre değerlerini **doğrudan atayan**
(gerçek hamle/swap DEĞİL) sentetik bir board-üretici — `GameCore`,
enerji, hamle limiti, blocker gibi hiçbir gerçek oyun kuralına bağlı
değil. Kendi 3/4/5/6/7'li şekil tabloları da `rules/matchRules.js`'teki
(Oturum 30'da yazılan) GERÇEK tablolarla AYNI DEĞİL — ayrıca kendi
içinde bir kopya-tanım hatası var (`four_17`/`four_18`, `four_13`/
`four_14` ile birebir aynı). Bunu ayrı bir "ikinci gerçek kaynak"
olarak kullanmak, projenin daha önce defalarca düzelttiği "duality"
sorununu (bkz. Oturum 17/18) yeniden yaratırdı.

**Bunun yerine:** `outcome.chain[i].match.shapeName` verisi zaten
`engine/matchEngine.js`'in `findAllMatches()`'ından dışarı sızıyordu —
hiçbir oyun koduna dokunmadan, F9Bot'u gerçek motorla oynatıp bu veriyi
toplayan YENİ bir araç yazıldı: `debug/benchmark/shape-coverage-report.js`.

### 🐛 Bulunan gerçek hata: F9Bot'un "zincir potansiyeli" sezgisi SADECE yatay tarıyor

İlk rapor çalıştırıldığında çarpıcı bir asimetri çıktı: `line3_h`
2517 kez, `line3_v` sadece 34 kez (**74:1 oran** — simetrik bir 8x8
board için anlamsız). Kök neden bulundu: `debug/bot.js`'teki
`_scoreMove()`'un "zincir potansiyeli" bonusu (`adj9` sayacı) **sadece
`dc` (sütun) yönünde** tarıyordu, `dr` (satır) yönünde HİÇ. Bot bu
yüzden sürekli yatay 9 dizileri kurmaya itiliyordu — dikey veya
çok-yönlü (4-7'li blok) şekilleri hiç İNŞA ETMİYORDU, sadece rastgele
oluşurlarsa fark ediyordu.

**Düzeltme:** dikey tarama eklendi (yatayla simetrik, `dr` döngüsü).
**Doğrulama:** düzeltme sonrası `line3_h`:1207, `line3_v`:1228 —
neredeyse birebir simetrik.

**Yan etki (önemli, not düşülmeli):** düzeltme sonrası F9Bot GENEL
OLARAK daha iyi oynuyor (dikey fırsatları da görüyor) — kazanma oranı
**%30.7 → %39.0** yükseldi (100×100 level-balance-report). **Bu,
Oturum 24 ve 29'daki denge ölçümlerinin kısmen yanlı (yatay-önyargılı)
bir botla yapıldığı anlamına geliyor** — o kararların YANLIŞ olduğu
anlamına gelmiyor (kullanıcı kararları hâlâ geçerli), ama altındaki
ölçüm artık daha güvenilir bir botla tazelenmiş oldu.

### Şekil kapsama bulgusu (düzeltme SONRASI, güvenilir veri)

100 level × 20 oyun (pro), toplam 42 benzersiz şekil (36 sabit blok +
6 çizgi varyasyonu):

- **Sadece 10 şekil hiç en az bir kez oluştu**, 32'si (çoğunlukla 4-7'li
  bloklar) **hiç oluşmadı.**
- **Bu bir tespit hatası DEĞİL** — Oturum 30'da 36 şeklin TAMAMI
  `findAllMatches()` ile tek tek doğrulanmıştı (elle board'a
  yerleştirilip doğru tespit edildiği kanıtlanmıştı).
- **Muhtemel neden:** `resolveBoard()` HER eşleşmeyi (küçük olsun büyük
  olsun) ANINDA temizliyor. 4+ hücreli bir şekil oluşması için,
  tetikleyici hamleden önce o şeklin 3-6 hücresinin AYNI ANDA 9 olarak
  beklemesi gerekiyor — ama bunlardan herhangi bir alt-kümesi kendi
  başına küçük bir eşleşme (3'lü çizgi/köşe) oluşturursa hemen
  temizleniyor, büyük şekil hiç tamamlanamıyor. Bot da (düzeltilmiş
  haliyle bile) belirli bir şekli KASITLI kurmuyor, sadece "yakında 9
  var mı" bakıyor — 2D'de karmaşık bir geometriye doğru planlama
  yapmıyor.
- **Sonuç: 4-7'li şekiller muhtemelen greedy/basit oynayışta doğal
  olarak son derece nadir** — bu ille "kırık" anlamına gelmiyor,
  gerçek bir oyuncu bilinçli kurarsa daha sık olabilir, ama rastgele/
  greedy oynanışta pratikte neredeyse hiç görülmüyor.

### Yeni araç: `debug/benchmark/shape-coverage-report.js`

```bash
node debug/benchmark/build-headless-engine.js
node debug/benchmark/shape-coverage-report.js [başlangıç] [bitiş] [oyun/level] [profil]
```
Çıktı: konsola özet tablo (şekil→toplam kullanım, hiç oluşmayanlar
işaretli) + `debug/benchmark/results/shape-coverage-*.json` (level
bazlı tam kırılım dahil — hangi level'da hangi şekil kaç kez oluştu).
`build-headless-engine.js`'e `ALL_FIXED_SHAPES` export'u kalıcı olarak
eklendi (bu aracın ihtiyacı için).

**Açık soru (kullanıcıya soruldu, henüz karar yok):** 32 nadir/hiç
oluşmayan şekil için ileri adım — (a) olduğu gibi kabul et ("ileri
seviye/nadir kombinasyonlar," tasarım olarak sorun değil), (b) bu
şekilleri KASITLI arayan daha "stratejik" bir bot yazıp gerçek
erişilebilirliği (imkansız mı, sadece nadir mi) kesin olarak test et,
(c) level tasarımı/ödül sistemini bu gerçekliğe göre ayarla (örn. 4-7'li
şekillere dayalı ödülleri fazla vurgulama).

## ✅ Oturum 32 — Stratejik şekil inşa botu: 35/36 şekil + tam terfi zinciri GERÇEK swap hamleleriyle doğrulandı, 1 gerçek tasarım belirsizliği bulundu

**Kullanıcı isteği:** "Levellerin rastgele değil kontrol edilebilir
olması" — 3/4/5/6/7'li tüm şekilleri VE tüm terfi zincirini
(bakır+9=bronz, bronz+9=gümüş, ...) SADECE gerçek oyuncunun yapabileceği
gibi (bitişik hücre swap'ı, hücre değeri doğrudan atama YOK) inşa eden
bir bot + debug istendi — "%100 oyunda başarılır" garantisi ile.

### Algoritma

`resolveBoard()` her hamleden sonra TÜM board'u tarar ve eşleşmeleri
UZUNLUĞA GÖRE (büyükten küçüğe) önceliklendirir — örtüşen küçük
eşleşmeler elenir. Bu yüzden: bir şeklin N-1 hücresini önce 9 yapıp,
SON hücreyi en sona bırakırsak, o son hamlede TÜM N hücre aynı anda 9
olur ve motor büyük şekli küçük alt-kümeye tercih eder.

**Kritik düzeltme (geliştirme sırasında bulundu):** İlk tasarımda
"spawn hücresi HER ZAMAN son" kuralı vardı — YANLIŞTI. Bazı şekillerde
(örn. b4_05/b4_07) spawn-DIŞI hücreler kendi başına ZATEN küçük bir
şekil oluşturuyor, spawn ne zaman eklenirse eklensin bu erken ateşleniyor.
Doğru kural: **hangi hücrenin spawn olduğu ÖNEMLİ DEĞİL** — sadece
TÜM şekil hücrelerinin son hamlede AYNI ANDA 9 olması gerekiyor. Bot
artık TÜM hücrelerin (sadece spawn-dışı değil) permütasyonlarını dener.

**İkinci mekanizma:** sıkışık şekillerde (7'li bloklar gibi) harici
(şekil dışı) komşu kalmayabiliyor — bu durumda henüz 9 yapılmamış bir
KOMŞU ŞEKİL HÜCRESİ geçici donor olarak "ödünç" alınıyor (o hücre daha
sonra kendi sırasında ayrıca 9 yapılıyor).

### Sonuç: 35/36 şekil ✓, 1 gerçek tasarım belirsizliği bulundu

**b4_05 ve b4_07 BİREBİR AYNI 4 hücreyi kullanıyor**, sadece spawn
noktaları farklı (`Sh("b4_05",...,[[0,0],[0,1],[1,1],[2,1]],[2,1])` vs
`Sh("b4_07",...,[[0,0],[0,1],[1,1],[2,1]],[0,1])`). `findAllMatches()`
her ikisini de bağımsız kontrol ediyor, ikisi de eşleşiyor, `sort()`
STABIL olduğu için dizide ÖNCE gelen (`b4_05`) HER ZAMAN kazanıyor —
`b4_07` bu yüzden **yapısal olarak asla tetiklenemez**, hiçbir hücre
sıralaması bunu değiştiremez (bu, sıralama sorunu değil, array-sırası
tie-break sorunu). Doğrudan manuel testle doğrulandı: aynı 4 hücre
tamamlandığında motor HER ZAMAN `b4_05` döndürüyor.

**Not:** Bu durum senin orijinal koordinat listende de vardı (o zamanki
#9 ve #11 girdileri, "aynı hücreler farklı spawn" — bkz. README.md
Oturum 30) — Oturum 30'da bunu olduğu gibi aktarmıştım, şimdi pratik
sonucu netleşti: b4_07 fiilen b4_05'in bir "takma adı", asla kendi
başına gerçekleşmiyor. **Karar bekliyor:** (a) olduğu gibi bırak (b4_05
her zaman kazanır, zararsız), (b) b4_07'yi kaldır (madem asla tetiklenmiyor),
(c) farklı bir spawn kuralı iste (örn. hangi spawn'ın kullanılacağını
hamle konumuna göre seç).

### Terfi zinciri: TAM BAŞARILI

`node debug/benchmark/strategic-shape-bot.js chain` — bakır→bronz(6
hücre)→gümüş(8)→altın(9)→elmas(9)→**Matrix Eşleşme**(9 hücre + 3 hamle,
yeni hediye YOK) — hepsi gerçek `applyPlayerMove()` çağrılarıyla,
Oturum 29'daki tasarımla birebir tutarlı doğrulandı. (Hücre sayıları
board pozisyonuna göre biraz kırpılabilir — bkz. Oturum 29'daki
kırpma açıklaması, davranış doğru.)

### Yeni araç: `debug/benchmark/strategic-shape-bot.js`

```bash
node debug/benchmark/build-headless-engine.js
node debug/benchmark/strategic-shape-bot.js all          # 36 şeklin tamamı
node debug/benchmark/strategic-shape-bot.js <shapeName>  # tek şekil, DEBUG=1 ile detaylı log
node debug/benchmark/strategic-shape-bot.js chain         # tam terfi zinciri
```
`build-headless-engine.js`'e `findAllMatches` export'u da kalıcı olarak
eklendi (gelecekteki debug araçları için).

**Sonuç:** Kullanıcının "levellerin rastgele değil kontrol edilebilir
olması" hedefi doğrulandı — 35/36 şekil VE tam terfi zinciri, gerçek
oyun kurallarıyla, deterministik/planlı hamle dizileriyle KANITLANMIŞ
şekilde inşa edilebiliyor. Bake pipeline / level tasarım aracı için
sağlam bir temel.

## ✅ Oturum 33 — Görsel "Şekil Laboratuvarı": tahtada butonlarla hedef seçip test etme

**Kullanıcı isteği:** "Oyunun ana yapısını bozmuyoruz, script'teki gibi
hedef belirleyip oyunda yapılıp yapılamayacağını anlamak, bunu tahtada
butonlarla çalışmasını sağlamak."

**Yapılan:** `debug/build-shape-lab.js` — Oturum 32'nin (`strategic-
shape-bot.js`) inşa mantığını **tarayıcıda, gerçek bir 8x8 board
görselinde, tıklanabilir butonlarla** çalıştıran YENİ bir statik HTML
aracı üretir: `debug/shape-lab.html`.

**Ana yapıya DOKUNULMADI:** `debug/benchmark/build-headless-engine.js`
ile AYNI yöntem — `build/manifest.js`'ten dosya listesi okunur, AYNI
`PURE_ENGINE_END_LINE` kesimi uygulanır, `core/`/`engine/`/`rules/`/
`economy/` dosyalarına TEK SATIR bile eklenmez/değiştirilmez. Farkı:
Node.js stub'ları (sahte `document`/`window`) YERİNE gerçek tarayıcı
DOM'u kullanılıyor, `module.exports` yerine `window.__F9Engine` ile
sembol sızdırılıyor — üzerine YENİ (ayrı) bir kontrol paneli ekleniyor.

**Arayüz:**
- Sol: canlı 8x8 board (hücreler gerçek zamanlı renkleniyor — mor=9,
  altın=hediye).
- Sağ: 36 şekil butonu (3'lü'den 7'li'ye gruplanmış) + "Tam Terfi
  Zincirini Test Et" butonu + hız kontrolü + canlı log paneli.
- Bir butona tıklayınca: gerçek motor arka planda tüm hücre sıralaması
  permütasyonlarını dener, başarılı bir çözüm bulunca board üzerinde
  **adım adım animasyonla** (hangi hücre hangi donor ile 9 yapıldı)
  oynatılır, buton yeşil (✓) veya kırmızı (✗) renklenir.

**Doğrulama (jsdom ile gerçek DOM'da uçtan uca):**
- 64 hücre + 36 buton doğru oluşuyor.
- `kkose_1` tıklaması → 3 hamlede başarıyla inşa edildi, board'da
  görüldü.
- "Tam Terfi Zinciri" butonu → bakır→bronz→gümüş→altın→elmas→**MATRIX
  EŞLEŞME (+3 hamle, 9 hücre)** — uçtan uca, görsel olarak doğrulandı.
- Örneklem testi (`kkose_1, b4_05, b4_07, b5_01, b6_01, b7_01`) →
  hepsi Oturum 32'deki Node sonuçlarıyla BİREBİR aynı (b4_07 doğru
  şekilde ✗, diğerleri ✓) — mantık doğru PORT edilmiş.

**Kullanım:**
```bash
node debug/build-shape-lab.js
# Sonra debug/shape-lab.html'i herhangi bir tarayıcıda aç (sunucu gerekmez)
```

## ✅ Oturum 34 — Şekil Laboratuvarı: debug açıklamaları detaylandırıldı + board görseli gerçek oyunla birebir

**Kullanıcı isteği:** "Debugda tam eşleşmeyi açıklamalı yaz, ayrıca
tahta orijinal tahtaya aynı özelliklere sahip olmalı birebir."

### 1) Board görseli artık gerçek oyunla BİREBİR

`debug/shape-lab.html`'in `.f9-board`/`.f9-cell` CSS'i eskiden basit/
placeholder stildi (düz gri kutular). Artık `core/game-engine.js`'teki
GERÇEK CSS bloğu (gradient arkaplan, border-radius, font, `.f9-cell-nine`
altın parlama + nabız animasyonu) **birebir kopyalandı**. Sayı renkleri
`NUMBER_COLOR` sabitiyle (`{1:"#E2622B",2:"#3E8FD4",...}`), hediye
renkleri `GIFT_COLOR` sabitiyle aynı — jsdom testiyle doğrulandı: hücre
(0,0) değer=2 iken tam `#3E8FD4` rengini gösteriyor (NUMBER_COLOR[2]
ile birebir).

### 2) Debug log'u artık her adımı tam açıklıyor

Eskiden log sadece "(r,c) ← donor (r,c) → 9 yapıldı" gibi terse
satırlardı. Artık her adımda:
- **Hangi işlemle 9 üretildiği** açıkça yazılıyor (`GameCore.validOps()`
  ile gerçek işlem bulunup "7 + 2 = 9 (basamak kökü)" gibi gösteriliyor).
- **Ara adımlarda** "henüz sadece N/M hücre 9 — hiçbir eşleşme
  tamamlanmadı, güvenli" notu.
- **Son adımda** (hedef tamamlandığında): board'un o anki durumunda
  `findAllMatches()` ile TÜM aday eşleşmeler taranıyor (sadece hedef
  şekil değil, ONUNLA ÖRTÜŞEN küçük alt-örüntüler de dahil), hangisinin
  KAZANDIĞI ve hangilerinin ELENDİĞİ (ve NEDEN — uzunluğa göre büyükten
  küçüğe sıralama kuralı) açıkça listeleniyor.
- Terfi zincirinde her adımda hangi hediyenin hangi hücrede terfi
  ettirildiği, `getMoveOptions()`'ın hangi dala (`"promotion"`) girdiği
  ayrı ayrı belirtiliyor.

**🐛 Geliştirme sırasında bulunan zamanlama hatası:** İlk yaklaşımda
`findAllMatches()` swap'tan ÖNCE (hedef hücre henüz 9 olmadan)
çağrılıyordu — bu, "aday eşleşmeler" analizini anlamsız kılıyordu
(hep boş dönüyordu). Düzeltildi: board'un bir KOPYASI alınıp orada
hedef hücre 9 yapılarak "swap'tan hemen sonra, temizlemeden önceki an"
doğru şekilde simüle ediliyor; gerçek `applyPlayerMove()` çağrısı ayrı
ve yetkili kalıyor.

**Doğrulama:** jsdom ile `kkose_1` (başarılı) ve `b4_07` (bilinen
başarısız) testleri tekrar çalıştırıldı — açıklamalar doğru, sıralı,
JS hatası yok. Board CSS sınıfları (`f9-cell`, `f9-board`) gerçek
oyunla aynı.

## 🔴 Oturum 35 — Şekil Kontrol Paneli: 48 modelin TAMAMI + gerçek Sudoku-tarzı board dizilimi, 2 kritik hata bulundu/düzeltildi

**Kullanıcı geri bildirimi:** "48 modelin hepsi yok (36 tanıtılmış, 12
çizgi eksik). Renk/ses önemli değil, bu bir kontrol paneli. Sayılar
suni '2' ile başlamasın, gerçek Sudoku dizilimimizden (board üretim
mantığımız) elde edilecek eşleşmeleri bulalım. Debug'ta çok detay
olmasın — eşleşen sayılar + sonuç + koordinat yeterli."

### Dört değişiklik

1. **48 model TAMAMI eklendi.** Eskiden sadece `ALL_FIXED_SHAPES`
   (36 sabit blok) buton olarak vardı. Artık 12 çizgi varyasyonu da
   (`line3_h`×3 spawn ofseti, `line3_v`×3, `line4_h`×2, `line4_v`×2,
   `line5_h`×1, `line5_v`×1) ayrı model olarak listeleniyor — 36+12=48,
   kullanıcının saydığı sayıyla birebir.
2. **Görsel sadeleştirildi.** Gerçek oyunun CSS'ini birebir kopyalama
   çabası (Oturum 34) geri alındı — basit gri/monospace bir kontrol
   paneli yeterli, "renk/ses önemli değil" net talimatı.
3. **Gerçek board dizilimi kullanılıyor.** `GameCore` constructor'ı
   zaten `board.fillInitial()` çağırıyor (`core/Board.js`
   `pickValueAvoidingNeighbors()` — komşu-çakışmasız + "9-dostu"
   ağırlıklı seçim, yani gerçek "Sudoku dizilimi"). Suni "her hücreyi
   2 yap" dolgusu KALDIRILDI — artık her test GERÇEK, rastgele üretilmiş
   bir board'dan başlıyor. Donor seçiminde ÖNCE gerçek komşu değerleri
   deneniyor ("doğal" — enjeksiyon yok); sadece gerçekten uygun komşu
   yoksa bir komşunun değeri ayarlanıyor (log'da "(ayarlandı)" diye
   açıkça işaretleniyor).
4. **Debug log sadeleştirildi.** Oturum 34'ün uzun paragraf açıklamaları
   kaldırıldı — artık her satır: `(r,c)=değer + (r,c)=değer (doğal/
   ayarlandı) → 9`, son satır: `SONUÇ: şekilAdı | hücreler: ... | spawn: ...`.

### 🐛 Bulunan ve düzeltilen 2 kritik hata

1. **Zaten-9-olan bir şekil hücresi "doğal donor" olarak seçilebiliyordu.**
   `findNaturalDonor()` sadece `usedDonors` setini kontrol ediyordu,
   şekil hücrelerini (özellikle önceki adımda zaten 9 yapılmış olanları)
   HARİÇ TUTMUYORDU. Örnek bulunan gerçek vaka: `9 × 7 = 63 → 6+3 = 9`
   (basamak kökü) — motor bunu "geçerli bir 9-üretici işlem" olarak
   görüyor, önceden 9 yapılmış bir hücreyi donor seçip ONU normal bir
   sayıymış gibi swap ediyordu — bu da o hücrenin 9'luğunu (refill ile)
   YOK ediyordu. Sonuç: `kkose_1` gibi en basit şekiller bile
   başarısız oluyordu ("son hamlede hedef oluşmadı"). DÜZELTİLDİ:
   `findNaturalDonor()` artık `shapeCellSet`'i de dışlıyor.
2. **Çizgi modelleri (`line3_h_1` gibi) asla eşleşmiyordu.** Motor,
   çizgi eşleşmelerini HER ZAMAN taban isimle (`"line3_h"`) raporluyor
   — `"line3_h_1"` gibi ofsetli sentetik isimlerle ASLA eşleşmiyordu.
   DÜZELTİLDİ: her çizgi modeline ayrı bir `baseName` alanı eklendi
   (eşleşme kontrolü bununla yapılıyor), VE hangi spawn ofsetinin
   test edildiğini doğrulamak için `match.spawn` koordinatı da ayrıca
   karşılaştırılıyor (`findLineMatches()`'in `lastMovePos`'a göre spawn
   seçtiği için, hedef spawn hücresi HER ZAMAN sıralamanın SON elemanı
   yapılacak şekilde ayarlandı).

### Doğrulama

jsdom ile 48 modelin TAMAMI sırayla tıklandı: **47/48 başarılı**,
tek başarısız yine bilinen `b4_07` (b4_05 ile aynı hücreler, motor
her zaman b4_05'i tercih ediyor — Oturum 32'de belgelenen yapısal
durum, karar bekliyor). Terfi zinciri de (gerçek board dizilimiyle)
uçtan uca test edildi: bakır→bronz→gümüş→altın→elmas→Matrix (+3 hamle,
9 hücre) — başarılı, hiç JS hatası yok.

## ✅ Oturum 36 — İleri/Geri adım navigasyonu eklendi

**Kullanıcı isteği:** "İleri geri butonu ekle, hamlelere manuel
müdahale edeyim."

**Yapılan:** Otomatik oynatma tek seçenek olmaktan çıktı. Artık bir
model/zincir hesaplandığında TÜM adımlar (board+hediye durumu dahil)
önceden anlık görüntü olarak (`cloneSnapshot`) saklanıyor, kullanıcı
**◀ Geri** / **İleri ▶** butonlarıyla istediği hızda, istediği yöne
tek tek gezinebiliyor. **▶ Otomatik** butonu hâlâ mevcut (hız
ayarıyla) ama artık isteğe bağlı bir seçenek, zorunlu akış değil.

- Her adımda log kümülatif gösteriliyor (0'dan o adıma kadar).
- Mavi çift-vurgusu (Oturum 35.5) adım değiştikçe doğru güncelleniyor.
- Terfi zinciri de TEK bir adım listesine (bakır üretimi + 5 terfi
  adımı, her biri 2 alt-hamle = toplam 14 adım) birleştirildi — aynı
  navigasyon kontrolleriyle gezilebiliyor.
- "Board'u Yenile" butonu artık navigasyon durumunu da sıfırlıyor.

**Doğrulama:** jsdom ile ileri/geri/otomatik ayrı ayrı test edildi —
log içeriği her adımda doğru kümülatif gösteriliyor, sınır kontrolleri
(ilk/son adımda buton disable) doğru çalışıyor. 48 modelin tamamı
tekrar koşturuldu — **47/48 aynı sonuç** (regresyon yok, b4_07 hâlâ
bilinen tek istisna).

## 🔴 Oturum 39 — KRİTİK HATA: log'daki sayılar tahtayla uyuşmuyordu (farklı board'lar karıştırılmıştı)

**Kullanıcı bulgusu (ekran görüntüsüyle):** log "HEDEF (x4 y3)=4 +
donor (x4 y2)=5" diyordu ama tahtada o koordinatlarda 1 ve 8 yazıyordu.

**Kök neden:** `buildStepsFromMatchLog()` gösterim için **yepyeni,
farklı seed'li bir board** (`makeRealGC()`, `seed: Date.now()...`)
oluşturup aynı hücre/donor koordinat SIRASINI o YENİ board üzerinde
"tekrar oynatıyordu" — ama log metni (`step.targetVal`/`donorVal`)
`constructModel()`'in ORİJİNAL (başarılı) aramasında kullandığı
BAŞKA bir board'dan geliyordu. İki farklı board, aynı koordinatlar,
farklı değerler — log ile ekran tutmuyordu.

**Düzeltme:** Anlık görüntüler artık **gerçek inşa sırasında, aynı
board üzerinde, o an** yakalanıyor (`tryOrderOnGC()` içine
`beforeSnap`/`afterSnap` eklendi) — hiçbir board "yeniden oynatılmıyor".
Terfi zinciri de artık `constructModel()`'in döndürdüğü GERÇEK `gc`
referansını (`r1.gc`) kullanıyor, yeni bir tane oluşturmuyor.

**Doğrulama:** log'daki HEDEF/donor değerleri ile tahtadaki gerçek
hücre değerleri programatik olarak karşılaştırıldı — **birebir
tutarlı**. 48 modelin tamamı + terfi zinciri tekrar test edildi,
regresyon yok (47/48 aynı, bilinen b4_07 hariç).

## ✅ Oturum 40 — "Tüm Eşleşmeleri Yap" butonu: 48 model × 3, board'un farklı bölgelerinde

**Kullanıcı isteği:** "Şimdi tüm eşleşmeleri yapacak buton ekle, butona
basınca sırayla hepsini yapsın, en az 3'er defa, tahtanın her tarafını
kullanmalı, sabit kalmasın sıkışmasın."

**Yapılan:** Yeni "Tüm Eşleşmeleri Yap" butonu — 48 modelin her birini
**5 sabit bölgeden** (sol-üst, sağ-üst, sol-alt, sağ-alt, merkez — 1
hücre içeriden, tam köşe değil) 3'ünü sırayla dener, hepsini TEK bir
gezinebilir adım listesine (mevcut ileri/geri/otomatik kontrolleriyle)
ekler.

**🐛 Performans sorunu bulundu ve düzeltildi:** İlk denemede 48×3=144
model TAM köşelerde (0,0 gibi) denendi — **32.8 saniye** sürdü ve
başarı oranı **%78'e (113/144) düştü** çünkü tam köşedeki hücrelerin
sadece 2 komşusu var, donor bulmak zorlaşıyor. İki düzeltme:
1. Köşe yerine 1 hücre içeriden konumlar kullanıldı (hâlâ "board'un o
   bölgesi" ama daha fazla komşu) → başarı %98'e (141/144) çıktı.
2. `constructModel()`'in permütasyon deneme sınırı 5040'tan 400'e
   düşürüldü — gerçek başarılar hep ilk birkaç denemede bulunuyor,
   sadece YAPISAL OLARAK imkansız şekiller (b4_07 gibi) tüm denemeleri
   boşuna tüketiyordu. Süre **32.8sn → 1.6sn** (20 kat).

**Kalan 3 başarısızlık (141/144):** tam olarak `b4_07`'nin 3 denemesi
— konumdan bağımsız, Oturum 32'de belgelenen yapısal durum (aynı
hücreleri paylaşan `b4_05` her zaman kazanıyor). Beklenen, tutarlı.

**Doğrulama:** jsdom ile tam koşu + başarısızlıkların hangileri olduğu
programatik olarak doğrulandı.

## ✅ Oturum 41 — Kullanım sayacı, performans ölçümü, engel hücreleri, 3x hız

**Kullanıcı isteği:** "Modellerin altında hangi modelin kaç defa
yapıldığı yazsın, tahta performansını ölç, (x3y3)(x3y4)(x4y4)(x4y3)
hücrelerine engel butonu koy — algoritmanın diğer hücrelerde çalışıp
çalışmayacağını görelim, otomatik hız 3 katına çıkar."

**Dört değişiklik:**
1. **Kullanım sayacı** — her butonun altında "N×" — o model kaç kez
   BAŞARIYLA inşa edildi (tek model testi, "Tüm Eşleşmeler", ve zincir
   hepsi sayıyor).
2. **Performans paneli** — her çalıştırmadan sonra son/ortalama süre
   (ms) ve toplam çalıştırma sayısı gösteriliyor (`performance.now()`
   ile gerçek ölçüm).
3. **Engel hücreleri** — board'daki HERHANGİ bir hücreye tıklayınca
   engellenip/kaldırılabiliyor (kırmızı ✕ işareti); ayrıca kullanıcının
   istediği 4 merkez hücre (x3y3,x3y4,x4y3,x4y4) için özel bir toggle
   butonu var. Engellenen hücreler ne hedef ne donor olarak
   kullanılamıyor. **Tek model testi artık ADAPTİF:** varsayılan konum
   (x3,y3) engelliyse/başarısızsa, otomatik olarak `pickPositions`'ın
   5 alternatif bölgesini (4 köşe + merkez) dener — hangi konumun
   kullanıldığı log'da açıkça belirtiliyor. **Test edildi:** 4 merkez
   hücre engellenince `kkose_1` otomatik olarak `(x1,y1)`'e kayıp
   başarıyla inşa oldu — algoritma gerçekten board'un başka
   bölgelerinde çalışabiliyor.
4. **Otomatik hız 3x** — varsayılan 300ms/adım → 100ms/adım (slider
   aralığı da 20-1200ms'ye genişletildi, önceki 50-1200 idi).

**Doğrulama:** jsdom ile dört özellik de ayrı ayrı test edildi (sayaç
artışı, performans metni formatı, engelleme + alternatif konum bulma).
48 modelin tamamı tekrar koşturuldu (engelsiz) — **47/48 aynı**,
regresyon yok.

## ✅ Oturum 42 — 6 iddia kontrol edildi: 2'si zaten vardı (yanlış alarm), 4'ü gerçek eksiklikti — hepsi düzeltildi

**Kullanıcı 6 sorun bildirdi.** Her birini koda bakıp DOĞRULADIM önce:

| İddia | Durum |
|---|---|
| "stepIndicator güncellenmiyor" | ❌ YANLIŞ — zaten çalışıyordu (`renderStep()` içinde), test ettim |
| "Performans UI'da gösterilmiyor" | ❌ YANLIŞ — Oturum 41'de eklenmişti, `display:block`, görünür |
| "Engelli hücre loglaması eksik" | ✅ GERÇEK — hangi konumların denendiği/neden elendiği gösterilmiyordu |
| "Detaylı hata sadece BAŞARISIZ yazıyor" | ✅ GERÇEK — sadece SON denemenin nedeni gösteriliyordu, diğerleri değil |
| "Toplu istatistik eksik" | ✅ GERÇEK — grup bazlı döküm yoktu |
| "Zincir ilerleme göstermiyor" | ✅ GERÇEK — 5 aşama boyunca arayüz sessiz kalıyordu |

**Düzeltilen 4 gerçek eksiklik:**
1. `constructModelAdaptive()` artık HER denenen konumu (`attempts[]`)
   kaydediyor — hangi konum, engelli miydi, hangi nedenle başarısız —
   log'da `formatAttempts()` ile okunabilir liste olarak gösteriliyor.
2. Aynı `attempts` verisi başarı VE başarısızlık durumlarında da
   gösteriliyor (önceden sadece son denemenin nedeni vardı).
3. "Tüm Eşleşmeleri Yap" artık grup bazlı (3'lü/4'lü/5'li/6'lı/7'li)
   ayrı başarı/başarısızlık dökümü üretiyor.
4. Terfi zinciri artık HER aşamada (bakır üretildi, bakır+9→bronz,
   bronz+9→gümüş, ...) `#summary`'i canlı güncelliyor — kullanıcı
   artık hangi aşamada olduğunu görebiliyor. Başarısızlık noktalarında
   da (komşu yok / donor yok / promotion başarısız) hangi aşamada
   TAKILDIĞI açıkça gösteriliyor.

**Doğrulama:** jsdom ile `b4_07`'nin artık 6 denenen konumun HEPSİNİ
(hepsi başarısız, nedenleriyle) listelediği doğrulandı; zincir
çalışırken 5 farklı ilerleme mesajı ("Bakır üretildi ✓...", "bakir+9
→ bronz ✓...", ..., "TAM ZİNCİR BAŞARILI") canlı yakalandı. 48 model
tekrar test edildi — 47/48 aynı, regresyon yok.

## ✅ Oturum 43 — Level 1-100 artık TÜM oyuncularda BİREBİR AYNI (bake pipeline gerçekten "yetkili" oldu)

**Kullanıcı kararı:** "Evet, birebir aynı olsun (standart match-3
tasarımı — level dengesi/liderlik tablosu için gerekli)."

### Araştırma: sorun sandığımdan köklüydü

`state.seed`, oyuncu her level KAZANIP bir sonrakine geçtiğinde
YENİDEN RASTGELELEŞTİRİLİYORDU (`ui/screens.js`, kazanma-sonrası
handler). Bu seed hem `generateLevel()`'a (blocker yoğunluğu/deseni)
HEM `GameCore`'un board üretimine (`seed: state.seed*97+levelNumber`,
sayı dizilimi) besleniyordu — yani **level 37 ne farklı oyuncular
arasında ne de AYNI oyuncunun farklı oynayışları arasında hiçbir zaman
aynı olmuyordu.**

`content/levels/bake-pipeline.js` (Oturum 20) sadece üst-seviye
ayarları (moves/targetScore/blockerDensity) dondurmuştu — gerçek
blocker POZİSYONLARINI ve sayı DİZİLİMİNİ hiç kaydetmiyordu.

### Çözüm: beklenenden çok daha basit

`generateLevel(levelNumber, seed)` zaten **saf/deterministik** bir
fonksiyon (`combinedSeed=(seed*1000003+levelNumber)>>>0`,
`makeRng(combinedSeed)`) — yani baked JSON dosyalarını runtime'da
OKUMAYA hiç gerek yok. Tek yapılması gereken: level ≤100 için HER ZAMAN
aynı sabit referans seed'i kullanmak (`BAKED_REFERENCE_SEED=1`, bake
pipeline'la aynı) — `generateLevel()` otomatik olarak her seferinde
BİREBİR aynı sonucu üretiyor.

**Değişen tek dosya:** `flow/levelFlow.js`'teki `newLevel()`:
```js
const genSeed = levelNumber <= 100 ? BAKED_REFERENCE_SEED : state.seed;
const cfg = generateLevel(levelNumber, genSeed);
// ...
const gc = new GameCore({ seed: genSeed * 97 + levelNumber, ... });
```
Level 101+ hâlâ `state.seed` (oyuncuya özel) kullanıyor — bake pipeline
sadece 1-100'ü kapsıyor, kullanıcı kararı bunun ötesine geçmedi. DDA
(dinamik zorluk) bu sabit taban ÜZERİNE hâlâ uygulanıyor — sadece ham
level üretimi (blocker/sayı) sabitlendi.

### Doğrulama (jsdom, gerçek fusion9_clean.html üzerinde)

- Level 37: iki FARKLI rastgele oyuncu-seed'iyle → board BİREBİR AYNI,
  blocker yerleşimi BİREBİR AYNI. ✓
- Level 105 (baked dışı): aynı iki seed → board FARKLI (beklenen). ✓
- Sınır testi: level 100 (baked'in son üyesi) → aynı; level 101
  (baked dışı ilk üye) → farklı. ✓ Sınır davranışı doğru.

### 🐛 Doğrulama sırasında bulunan (ve düzeltilen) İKİ test-script hatası

Bu kararın denge etkisini ölçerken kendi hızlı test script'imde 2 hata
yaptım, ikisini de buldum/düzelttim ÖNCE sonuç raporlamadan:
1. `state.tubes` sıfırlanmadan art arda `newLevel()` çağırmak tüpü
   tüketip `state.gc`'nin güncellenmemesine yol açıyordu (daha önce
   Oturum 26'da da karşılaşılmış aynı hata sınıfı).
2. Headless bundle'da `GameCore` hiç `"won"` durumu ÜRETMİYOR (bu
   mantık bilerek `flow/`'da, headless'tan hariç) — `gc.status==='won'`
   kontrolü tek başına HER ZAMAN false dönüyor. Doğru kontrol (mevcut
   `level-balance-report.js`'in zaten kullandığı): `gc.status==='won'
   || gc.score>=target`. Bunu atlayınca yanlışlıkla "%0 kazanma"
   görüp paniklemiştim — düzeltince gerçek sonuç ortaya çıktı.

### Denge etkisi: YOK (iyi haber)

Sabit `seed=1` ile (artık gerçek oyunda görülecek TEK board dizisi)
100 level × 20 oyun (pro, doğru win-kontrolüyle): **kazanma %38.9**,
skor/hedef 0.78 — Oturum 31'in çoklu-seed ortalamasına (%39.0)
**neredeyse birebir aynı**. Yani bu karar mevcut denge kararlarını
(Oturum 24/29) GEÇERSİZ KILMIYOR — seed=1 tesadüfen temsili bir
zorluk kümesi üretmiş.

**Doğrulama:** `node build/build.js` ✓. Ana oyun kodu satır sayısı
sadece flow/levelFlow.js'e eklenen ~15 satırlık yorum+kod kadar arttı.

## 🔴 Oturum 44 — KRİTİK: fusion9_clean.html `file://` ile (çift tıklayıp) açılınca TAMAMEN BOŞ kalıyordu

**Kullanıcı sorusu:** "html'yi otonom çalışıyor mu" — yani dosyayı
doğrudan çift tıklayıp (sunucu olmadan) açınca çalışıyor mu.

**Cevap ÖNCEDEN: HAYIR.** jsdom ile `file://` protokolünü simüle
edip test ettim — `f9-root` **tamamen boş** kalıyordu, hiç render
olmuyordu.

### Kök neden

`debug/debug.js`'teki `F9Debug` modülü, dosya YÜKLENİR YÜKLENMEZ
(gecikmeli bir fonksiyon çağrısı DEĞİL, modül-seviyesi IIFE) şunu
çalıştırıyordu:
```js
const F9Debug = (() => {
  const ENABLED = localStorage.getItem("f9debug") === "1"; // ⚠️ try/catch YOK
  ...
})();
```
`file://` protokolüyle (dosyayı çift tıklayıp doğrudan açma) bazı
tarayıcı/ortamlar `localStorage`'ı "opaque origin" güvenlik
kısıtlamasıyla ENGELLİYOR ve `SecurityError` fırlatıyor. Bu satır
try/catch İÇİNDE OLMADIĞI için hata YAKALANMIYORDU — script'in TAMAMI
bu noktada çöküyordu (`F9Debug` hiç tanımlanmadan kalıyordu, ve
hemen hemen HER YERDE `F9Debug.log(...)` çağrıldığı için pratikte
oyunun HİÇBİR SATIRI çalışamıyordu).

**Neden `node build/build.js` bunu hiç yakalamamıştı:** build.js'in
kendi "çalışma zamanı doğrulaması" Node.js'te SAHTE (stub) bir
`localStorage` kullanıyor — bu stub hiçbir zaman throw etmiyor,
gerçek tarayıcıların `file://` kısıtlamasını simüle etmiyor. Yani bu
hata sınıfı, SADECE gerçek bir `file://` testiyle bulunabilirdi.

### Kontrol edilen diğer TÜM localStorage çağrıları — zaten korunmuşlar

`save/save-manager.js` (saveGame/loadGame), `core/game-engine.js`
(`_storageOk` testi + `_aiAdjustDensity`), `debug/analytics.js`,
`debug/debug.js`'in kendi `_dirLoad`/`_dirSave`'i — HEPSİ zaten
try/catch ile korunuyordu. **Sadece bu TEK satır** korumasızdı, ama
modül-seviyesinde olduğu için TEK BAŞINA tüm oyunu çökertmeye
yetiyordu.

### Düzeltme

```js
let ENABLED = false;
try { ENABLED = localStorage.getItem("f9debug") === "1"; } catch(e) {}
```

### Doğrulama (jsdom, `file://` protokolüyle GERÇEK senaryo)

- Düzeltme ÖNCESİ: `SecurityError` uncaught, root 0 karakter.
- Düzeltme SONRASI: hiç JS hatası yok, root 1346 karakter, 2 buton
  render oluyor ("Al ve Oyna" — günlük ödül ekranı), tam işlevsel.
- Normal (`http://` sunucu) senaryosu da tekrar test edildi —
  regresyon yok, aynı sonuç.

**Sonuç: `fusion9_clean.html` artık gerçekten otonom — sunucu
gerekmeden, doğrudan çift tıklayarak açılabiliyor.**

## 🔴 Oturum 45 — KRİTİK: Churn DDA sonrası oyuncu hedefi AŞSA BİLE kaybediyordu

**Kullanıcı bulgusu (gerçek oynanıştan ekran görüntüsü):** Level 1'de
skor **1.420**, hedef **630** gösteriliyordu (İlerleme **%225**, "En
yüksek skor: 1.420 ✓") — ama ekran **KAYIP** ("Yeterli Puan Yok!")
gösteriyordu. Skor hedefin 2 katından fazlayken kaybetmek imkansız
olmalıydı.

### Araştırma — iki katmanlı hata

**1) Görünürdeki sayı (630) yanlıştı — bu sadece bir belirti.**
`BASE_TARGET_SCORE=630` sabitiyle birebir eşleşiyor — `renderWin()`/
`renderLose()`/oyun-içi skor barı, `state.cfg?.targetScore || 630`
kullanıyordu. `state.cfg` herhangi bir nedenle tanımsız kalırsa, ekranda
GERÇEK hedef değil, bu sabit fallback görünüyordu.

**2) Asıl kök neden — `F9Churn.applyChurnDDA()`.** Oyuncu AYNI levelde
3+ kez kaybederse (`CHURN_THRESHOLD=3`), bu sistem `state.cfg.
targetScore`'u (ve `state.gc.targetScore`'u, yani gerçek oyun içi
hedefi) **düşürüyor** ("yardım" amaçlı, kolaylaştırma). AMA
`state.levelGoal.value` — `checkAndTransition()`'ın kazanma kararını
VERDİĞİ asıl kaynak — **hiç güncellenmiyordu**. Sonuç: ekranda
(kolaylaştırılmış, düşük) bir hedef gösteriliyordu, oyuncu onu (hatta
çok daha fazlasını) geçse bile, GERÇEK kontrol hâlâ ESKİ/YÜKSEK
`levelGoal.value`'ya göre yapıldığı için **kaybediyordu**. Bu, projenin
daha önce defalarca karşılaştığı "duality" (iki-kaynaklı state) hata
sınıfının bir başka örneği (bkz. Oturum 18).

### Düzeltmeler

1. **Kök neden (`ui/screens.js`, "OYNA" butonunun click handler'ı):**
   `F9Churn.applyChurnDDA()` çağrıldıktan hemen sonra artık
   `state.levelGoal.value` de senkronize ediliyor:
   ```js
   if (state.levelGoal?.type === "score") state.levelGoal.value = state.cfg.targetScore;
   ```
2. **Savunma katmanı (`renderWin`, `renderLose`, oyun-içi skor barı):**
   Üçü de artık `state.levelGoal?.value ?? state.cfg?.targetScore ?? 630`
   kullanıyor — `checkAndTransition()`'ın kullandığı AYNI birincil
   kaynak. Bu, `state.cfg` her ne sebeple tanımsız kalırsa kalsın,
   gösterilen hedefin ASLA gerçek karar mekanizmasından sapmamasını
   garanti ediyor.

### Doğrulama (jsdom, gerçek churn senaryosu simüle edilerek)

- 4 kayıp kaydedilip churn tetiklendi → `state.cfg.targetScore`,
  `state.gc.targetScore`, `state.levelGoal.value` **üçü de 309**
  (tutarlı, eskiden levelGoal.value senkronize OLMAZDI).
- Churn'lü (düşürülmüş) hedefin (309) hemen üzerinde bir skorla (319)
  `checkAndTransition()` çağrıldı → **`won:true, screen:"win"`** —
  düzeltmeden önce bu senaryo YANLIŞLIKLA kayıp verirdi.

**Bu, kullanıcının paylaştığı ekran görüntüsündeki TAM senaryo** —
muhtemelen birkaç kez kaybedilmiş bir level'de churn tetiklenmiş,
oyuncu (churn'lü, düşük) hedefi fazlasıyla geçmiş ama eski/senkronize
olmayan `levelGoal.value` yüzünden kaybettirilmişti.

## 🔴 Oturum 46 — F9 Direktör panelindeki BOT butonları 3 ayrı gerçek hata içeriyordu

**Kullanıcı konsol logu paylaştı:** debug panelinin bot başlatma
butonuna tıklayınca `Uncaught ReferenceError: F9Bot is not defined`.

### Hata 1: Kapsam (scope) sorunu — `F9Bot`/`F9Debug`/`F9Report` window'a hiç açılmamıştı

`F9Bot`, `debug/bot.js`'teki KENDİ IIFE'sinin içinde tanımlı — script'in
geri kalanı (ortak IIFE) buna closure üzerinden erişebiliyordu. AMA
`debug/debug.js`'teki panel butonları `onclick="F9Bot.start(...)"` gibi
**HTML string attribute'ları** olarak yazılmıştı — tarayıcı bunları
**global (window) kapsamında** çalıştırır, IIFE'nin iç kapsamına
ERİŞEMEZ. `window.F9Bot`/`window.F9Debug`/`window.F9Report` HİÇBİR
YERDE atanmamıştı → `grep` ile doğrulandı, sıfır sonuç.

**Düzeltme:** her üç modülün IIFE'si kapandıktan hemen sonra
`if (typeof window !== "undefined") window.X = X;` eklendi.

### Hata 2 (Hata 1 düzeltilince ORTAYA ÇIKTI): `_currentTab is not defined`

`debug/bot.js`'teki `_stepLevel()` fonksiyonu, `debug/debug.js`'teki
(TAMAMEN AYRI bir IIFE) `_currentTab`/`_dirPanel` **private** closure
değişkenlerine DOĞRUDAN erişmeye çalışıyordu — imkansız, iki modül
birbirinin private state'ini göremez. Muhtemelen bir zamanlar bu kod
F9Debug'ın içindeydi, F9Bot'a taşınırken bu satır yanlışlıkla
kopyalanmış.

**Düzeltme:** F9Debug zaten TAM bu mantığı kendi PUBLIC
`renderDirector()` metodunda barındırıyor — `if(_currentTab==="dir"...)
_renderDirector();` → `F9Debug.renderDirector();`.

### Hata 3 (Hata 2 düzeltilince ORTAYA ÇIKTI): `startNewLevel is not defined`

Bot bir level'i bitirip sıradakine geçerken `startNewLevel(levelNumber,
cfg)` çağırıyordu — **bu fonksiyon kod tabanında hiç yok**
(`grep` ile doğrulandı). Ayrıca yanında `generateLevel(state.
levelNumber, 0)` çağrısı **seed=0** kullanıyordu — Oturum 43'ün doğru
seed mantığını (BAKED_REFERENCE_SEED=1, level≤100 için) tamamen
atlıyordu.

**Düzeltme:** gerçek fonksiyon `newLevel(levelNumber)`
(`flow/levelFlow.js`) — kendi `generateLevel()` çağrısını doğru seed
mantığıyla zaten yapıyor, elle `cfg` hesaplamaya hiç gerek yok.

### Doğrulama (jsdom, uçtan uca gerçek bot oturumu)

Önce `newLevel(1)` ile gerçek bir level başlatıldı, sonra
`F9Bot.start('pro',30)` çağrıldı: **`won:true, score:450/target:441,
moves:16/16`, hiç hata yok.** Hedef (441) Oturum 43'ün sabit seed'iyle
BİREBİR TUTARLI. Üç hata da art arda, birbirini ortaya çıkararak
bulundu — klasik "bir hatayı düzeltince altındaki ortaya çıkar" zinciri.

**Not:** Bu 3 hata SADECE debug panelinin bot-test özelliğini
etkiliyordu — normal oyuncu deneyimi (menü, level oynama, kazanma/
kayıp) bundan hiç etkilenmiyordu, panel varsayılan olarak kapalı
(`localStorage.f9debug !== "1"`).

## 🎮 Oturum 47 — "Fusion 9 Game Feel Engine v1.0"

**Kullanıcının stratejik pivotu:** "Şu ana kadar 'hangi sistemi
ekleyelim' diye geliştirdik. Artık soru 'oyuncu ne hissedecek' olmalı.
CORE ENGINE/GAMEPLAY güçlü ama GAME FEEL zayıf — kamera sarsıntısı,
canvas parçacık, combo director, ses çeşitliliği, taş 'canlılığı'
eksik. Bunları AYRI bir katman (`fx/`) olarak, hepsini birden kapsamlı
bir yapı olarak kur."

### Mevcut durum tespiti (koddan doğrulandı)

- `fx/blast-fx.js`: patlama efektleri var ama **DOM tabanlı** (CSS
  class + boxShadow), canvas particle değil.
- `fx/audio.js`: sadece **5 ses tipi**, Web Audio API ile sentezleniyor
  (gerçek ses dosyası yok — bu iyi haber, çeşitlilik eklemek dosya
  yönetimi gerektirmiyor).
- Kamera sarsıntısı, canvas parçacık sistemi, combo director, taş
  idle/basınç animasyonu — **hiçbiri yoktu.**

### Yapılan — 5 yeni fx/ modülü + 1 orkestratör

1. **`fx/camera.js` (F9Camera)** — Kamera sarsıntısı. Kullanıcının
   verdiği tabloyla birebir: 3'lü=0px, 4'lü=1px, 5'li=2px, 7'li=5px,
   Diamond/Matrix=8px. Sönümlü (exponential decay), rastgele titreşim,
   `requestAnimationFrame` ile.
2. **`fx/particles.js` (F9Particles)** — Kullanıcının özellikle
   istediği gibi **DOM elementi DEĞİL, tek bir `<canvas>` üzerinde
   gerçek fizikli parçacıklar** (hız, yerçekimi, dönme, solma). Patlama
   başına ~40 parçacık, toplam aktif parçacık sayısı 500 ile
   sınırlanmış (performans tavanı).
3. **`fx/combo.js` (F9Combo)** — Combo Director, kullanıcının tam
   eşik tablosuyla: 3=GOOD, 5=GREAT, 8=SWEET, 12=TASTY, 18=DELICIOUS,
   25+=DİVİNE. Animasyonlu, kademeli renkli metin.
4. **`fx/juice.js` (F9Juice)** — Taş "canlılığı": idle nefes alma
   (staggered, hücre pozisyonuna göre kademeli gecikme), basınca
   küçülme, bırakınca zıplama, hover parlama. `MutationObserver` ile
   her render sonrası otomatik yeniden uygulanıyor — `ui/renderer.js`'e
   HİÇ dokunulmadı.
5. **`fx/audio.js` genişletildi** — eski 5 tip (match/select/gift/
   blast/jackpot) **birebir korundu**, üzerine touch/move/promotion/
   combo/supercombo/victory/lose/blastSized eklendi. Her çalışta hafif
   rastgele perde sapması (±3%) — art arda çalınca tekdüze hissetmesin.
6. **`fx/game-feel.js` (F9GameFeel)** — merkezi orkestratör. Tek
   entegrasyon noktası: `flow/rewardFlow.js`'teki `executeMove()`.
   Mevcut `F9Anim`/`playSound` çağrılarını SİLMEDİ, yanlarına ekledi.

### Entegrasyon noktaları

- `executeMove()` başı: `F9GameFeel.init()` + `resetCombo()`.
- Direkt patlama (zincirsiz): `celebrateBlast()` — kamera+particle+ses.
- Zincir döngüsü (her eşleşme): `onChainMatch()` — aynısı + Combo
  Director sayacı.
- `renderWin()`/`renderLose()`: `celebrateVictory()`/`acknowledgeLoss()`.
- `flow/moveFlow.js`: hücre dokunma sesleri `select`→`touch` (jitter'lı
  varyasyon).

### Doğrulama (jsdom, gerçek fonksiyon çağrılarıyla)

- 7'li şekil simülasyonu → kamera transform `translate(-1.61px,
  1.41px)` (kullanıcının "7'li=5px" değeriyle tutarlı aralıkta). ✓
- `celebrateBlast()` → particle canvas gerçekten DOM'a ekleniyor. ✓
  (jsdom'un canvas 2D context kısıtlaması sadece TEST ortamı
  sınırlaması, gerçek tarayıcıda tam çalışır.)
- 5 ardışık `onChainMatch()` → `.f9-combo-text` ("GREAT!") oluştu. ✓
- Gerçek bir level başlatılıp hamle uygulandı → **hiç JS hatası yok.**
- Standart benchmark (100 level × 10 oyun) — regresyon yok (bu
  değişiklik sadece `fx/`/`flow/`/`ui/` katmanında, motor mantığına
  dokunmadı).

### Bilinçli olarak YAPILMAYAN (kapsam notu)

Kullanıcının listesindeki "300+ level", "mağaza/XP/avatar" gibi
Aşama 3-4 maddeleri bu oturumun kapsamı DIŞINDA tutuldu — açıkça
"önce mekanik eklemeyi bırak, game feel'e odaklan" denildiği için.
80-100 ses yerine ~13 kategori + jitter yaklaşımı seçildi (gerçekçi
mühendislik — 100 GERÇEKTEN farklı sentezlenmiş ses pratikte
ayırt edilemez olurdu).

## 🔴 Oturum 48 — Game Feel Engine hiçbir zaman İLK andan aktif olmuyordu

**Kullanıcı bulgusu:** "değişiklik ne oldu tahta aynı gibi."

**Kök neden:** `F9Juice.init()` (nefes alma, basınca küçülme, hover
parlama) **SADECE `executeMove()` başında** çağrılıyordu — yani level
İLK AÇILDIĞINDA, oyuncu henüz hiç hamle yapmadan, board tamamen statik
kalıyordu (CSS enjekte edilmemiş, hücrelere `f9-cell-breathe` class'ı
hiç uygulanmamış). Kullanıcı levele girip bakınca gerçekten "aynı"
görüyordu — bu bir algı değil, gerçek bir entegrasyon eksikliğiydi.

**Düzeltme:** `F9Juice.init()` artık `renderBoardOnly()`'nin sonunda
çağrılıyor — bu fonksiyon HEM level ilk açıldığında HEM her hamle
sonrası çağrılan TEK ortak nokta. `init()` idempotent (tekrar çağrı
zararsız).

**Doğrulama (jsdom, sıfır hamle senaryosu):** level açıldı, HİÇ hamle
yapılmadı — **64/64 hücre** `f9-cell-breathe` class'ını taşıyor, CSS
enjekte edilmiş, hiç hata yok. Standart benchmark regresyon vermedi.

## 🔴 Oturum 49 — Oturum 45'in düzeltmesine RAĞMEN "630" hatası tekrar oluyordu: gerçek kök neden bulundu

**Kullanıcı bulgusu (tekrar):** Skor hedefin %190-225'i olduğu halde
"Yeterli Puan Yok!" (kayıp) gösteriliyordu — Oturum 45'te düzelttiğimizi
düşündüğümüz hata AYNI belirtiyle tekrar bildirildi.

**Gerçek kök neden — Oturum 45'ten TAMAMEN AYRI, çok daha temel bir
hata:** "OYNA" butonunun (`btn-start-game`) click handler'ında (`ui/
screens.js`), `newLevel()`'ın (flow/levelFlow.js) ZATEN doğru kurduğu
`state.cfg`/`state.gc`/`state.levelGoal`'ın **ÜZERİNE**, tamamen ayrı,
DUPLICATE bir level-kurulum bloğu vardı:
- `generateLevel(state.levelNumber, 7)` — **sabit `seed=7`**,
  Oturum 43'ün `BAKED_REFERENCE_SEED` mantığını tamamen yok sayıyordu.
- `getLevelGoal()`'dan HAM (senkronize edilmemiş) `goal.value`'yu
  okuyup `cfg.targetScore`'u eziyordu — Oturum 18'den beri "score"
  tipi hedefler CHAPTER_DB'de `.value` TUTMADIĞI için bu her zaman
  `undefined` oluyordu.
- `gc.score >= undefined` JavaScript'te HER ZAMAN `false` döner —
  yani **oyuncu skoru ne olursa olsun ASLA kazanamıyordu.**
- Üstüne yeni bir `GameCore` oluşturup `newLevel()`'ın doğru kurduğu
  `state.gc`'yi çöpe atıyordu, tüpü de İKİNCİ KEZ düşürüyordu.

**Düzeltme:** Bu duplicate blok tamamen kaldırıldı — buton artık
SADECE ekranı `"game"`ye geçirip state'i temizliyor, level'ı yeniden
kurmuyor (`newLevel()` zaten level_start ekranına girerken bunu
yapmıştı).

**Doğrulama (jsdom, gerçek "OYNA" butonu tıklamasıyla):** `newLevel(1)`
→ level_start ekranı → **gerçek `btn-start-game` butonuna tıklandı**
(kullanıcının tıkladığı TAM buton) → `cfg.targetScore`/`levelGoal.value`
hâlâ 441 (bozulmadı) → hedefin 50 üzerinde bir skorla
`checkAndTransition()` çağrıldı → **`gcStatus:"won", screen:"win"`,
doğru.**

**Not:** Bu düzeltme, Oturum 45'in düzeltmesini GEÇERSİZ KILMIYOR —
ikisi FARKLI kod yollarındaki (churn senkronu vs. OYNA butonunun
duplicate kurulumu) aynı SEMPTOMU (630 fallback, haksız kayıp)
üreten BAĞIMSIZ hatalardı, ikisi de artık düzeltilmiş durumda.

## 🔴🔴 Oturum 50 — Oturum 49'un düzeltmesi oyunu TAMAMEN AÇILMAZ HALE GETİRMİŞTİ

**Kullanıcı bulgusu:** "oyun açmıyor."

**Ne oldu:** Oturum 49'un TEŞHİSİ doğruydu (bkz. yukarısı — "OYNA"
butonundaki eski kod sabit `seed=7` kullanıyordu, `undefined` hedefle
oyuncu asla kazanamıyordu) — **ama ÇÖZÜMÜ yanlıştı.** O kod "duplicate,
`newLevel()` zaten level kuruyor" varsayımıyla TAMAMEN SİLİNMİŞTİ. Bu
varsayım YANLIŞTI: `newLevel()` gerçek oyuncu akışında (menü→harita→
level_start→OYNA) **hiçbir yerde çağrılmıyordu** — grep ile TÜM
kod tabanında doğrulandı (sadece kendi tanımı, debug/bot.js, ve
level-atlama debug butonlarında geçiyordu). "Level 1 Oyna" gibi TÜM
"oyna" butonları sadece `state.screen="level_start"` yapıyor, gerçek
level kurulumu (GameCore oluşturma) SADECE o silinen kodun içindeydi.

**Sonuç:** `state.gc` HİÇ KURULMUYORDU. `render()`'ın `if (!gc) {
renderMenu(); return; }` mantığı her defasında devreye giriyor, oyuncu
"OYNA"ya her bastığında OYUN EKRANI YERİNE ANA MENÜ görüyordu — oyun
fiilen hiç açılmıyordu.

**Düzeltme:** Eski (yanlış seed=7'li) kodun YERİNE, GERÇEK `newLevel()`
(flow/levelFlow.js — Oturum 43'ün doğru `BAKED_REFERENCE_SEED`
mantığını kullanan) çağrısı eklendi. Oturum 49'un teşhisi korunuyor
(seed=7/undefined goal.value gerçek bir hataydı), ama artık DOĞRU
fonksiyonla değiştiriliyor, TAMAMEN SİLİNMİYOR.

**Doğrulama (jsdom, tam tıklama akışıyla):** "Al ve Oyna" → "Level 1
Oyna" → "OYNA" → **board 64 hücreyle tam render oluyor** (önceden 0
hücre, ana menü görünüyordu). İki hücreye tıklanıp gerçek bir hamle
denendi — sorunsuz. Standart benchmark regresyon vermedi.

**Ders:** "Bu kod duplicate/gereksiz" varsayımı, KODUN GERÇEKTEN
BAŞKA BİR YERDEN çağrıldığını doğrulamadan (grep ile TÜM çağrı
noktalarını bulmadan) asla yapılmamalı — bir önceki oturumda bu adım
atlanmış, ciddi bir regresyona yol açmıştı.

## ✅ Oturum 51 — Juice listesindeki eksikler tamamlandı: hafif dönme + bağımsız parlama

**Kullanıcı isteği:** Kendi "nefes alma/hafif dönme/parlama/hover/
basınca küçülme/bırakınca zıplama" listesini teker teker kontrol ettim
— 4/6 tamdı, "hafif dönme" hiç yoktu, "parlama" sadece hover'a bağlıydı
(taşın kendiliğinden parlaması yoktu). İkisini de ekledim.

- **Hafif dönme:** `f9-breathe` keyframe'ine `rotate()` eklendi — her
  hücre pozisyonuna göre farklı yön/miktar (±0.6°-1.8°, hücrenin
  (r,c)'sine göre DETERMİNİSTİK, her render'da aynı kalıyor ama
  hücreden hücreye farklı — hepsi aynı anda aynı yöne dönerse mekanik
  görünürdü).
- **Bağımsız parlama:** Yeni `f9-cell-shimmer` — hover'dan TAMAMEN
  BAĞIMSIZ, 0.7-2.3 saniye arası rastgele aralıklarla rastgele bir
  taş kısa süreliğine (`brightness(1.35) saturate(1.15)`, 1.4sn)
  parlıyor. Ekran değişince (`f9-board-container` DOM'dan kalkınca)
  döngü otomatik duruyor.

**Doğrulama:** jsdom ile gerçek oyun ekranında `--breathe-tilt` değeri
(`0.60deg`) ve 2.5 saniye içinde en az bir `f9-cell-shimmer`
tetiklenmesi doğrulandı, hiç JS hatası yok. Standart benchmark
regresyon vermedi.

**Not:** Kullanıcının Game Feel listesindeki tek kalan gerçek eksik
**"yavaşlatma" (slow motion)** — büyük patlamalarda kısa bir
time-dilation hissi — henüz yapılmadı.

## 🏗️ Oturum 52 — Event-Driven Architecture (Event Bus) — kullanıcı önerisi, kademeli uygulandı

**Kullanıcının önerisi:** Fusion 9 artık küçük bir proje değil, motor
ile ses/animasyon/kamera/combo/istatistik/başarım/AI Director gibi
sistemleri BİRBİRİNDEN BAĞIMSIZLAŞTIRAN resmi bir Event Bus (yayın/
abonelik) mimarisi kurulmalı. ~100 event'lik bir liste önerdi (Oyuncu,
Sayılar, Patlamalar, Kombolar, Özel taşlar, Tahta, Seviye, Ekonomi, UI
kategorilerinde).

### Kapsam kararı (kullanıcıyla anlaşıldı)

Projenin Oturum 49/50'de yaşadığı ders ("güvenli sandığım bir temizlik
ciddi regresyona yol açtı") göz önünde bulundurularak, **~100 event tek
seferde KURULMADI.** Bunun yerine:
1. **Event Bus'ın kendisi** (`core/event-bus.js`) — küçük, bağımsız,
   sıfır dış bağımlılık.
2. Motor/flow katmanı **gerçekten var olan** ~10 anda event YAYINLIYOR
   (emit) — ama bunu yaparken **mevcut doğrudan çağrılar İLK AŞAMADA
   SİLİNMEDİ** (güvenlik için önce ADDITIVE, sonra doğrulanmış tek tek
   kaldırıldı).
3. **SADECE Game Feel Engine** (`fx/game-feel.js` — en yeni, en izole
   sistem) event dinleyicisine TAM geçirildi — kanıt niteliğinde.
4. Kalan ~90 event, Achievement/AI Director/Tutorial gibi sistemler,
   ve Explosion ayrımı/Board/UI event'leri — **kullanıcı onayıyla
   kademeli olarak eklenecek**, tek seferde değil.

### Şu an yayınlanan event'ler (10)

`PlayerMove`, `NumberCreated`, `ExplosionStarted`, `ComboDetected`,
`ComboIncreased`, `Promotion`, `GiftSpawned`, `LevelStarted`,
`LevelCompleted`, `LevelFailed` — flow/rewardFlow.js, flow/levelFlow.js,
ui/screens.js'ten yayınlanıyor. **`core/GameCore.js`'e (saf motor) HİÇ
DOKUNULMADI** — event yayınları sadece flow/ui katmanında.

### F9GameFeel migrasyonu (kanıt)

`fx/game-feel.js`'in `init()`'i artık kendi event dinleyicilerini
kayıt ediyor (`F9Events.on("ExplosionStarted", ...)` vb.) — flow/
rewardFlow.js ve ui/screens.js'teki KARŞILIK GELEN doğrudan çağrılar
(`F9GameFeel.celebrateBlast()`, `.onChainMatch()`, `.celebrateVictory()`,
`.acknowledgeLoss()`, `.resetCombo()`) **çift tetiklenmeyi önlemek
için** kaldırıldı — SADECE bu 5 çağrı, dikkatlice, tek tek doğrulanarak.

**🐛 Geliştirme sırasında bulunan zamanlama hatası:** İlk denemede
`F9GameFeel.init()` `newLevel()`'da `render()`'DAN ÖNCE çağrılmıştı —
bu, board container henüz DOM'da olmadığı için `F9Juice.init()`'in
"container yok" deyip ERKEN ÇIKMASINA ve idempotent guard'ın ERKEN
TÜKETİLMESİNE yol açıyordu (Oturum 48'in aynı sınıftan riski).
Düzeltildi: `render()` önce, `F9GameFeel.init()`+`emit("LevelStarted")`
sonra.

### Doğrulama (jsdom)

- Gerçek "OYNA" tıklama akışı + gerçek hamle: board 64 hücre, hiç hata
  yok (Oturum 50'nin regresyon dersine göre TEKRAR doğrulandı).
- F9Bot ile gerçek bir oyun (19 hamle): `LevelStarted×1, PlayerMove×19,
  NumberCreated×13, ExplosionStarted×5, LevelCompleted×1` — event'ler
  GERÇEKTEN yayınlanıyor.
- Manuel `F9Events.emit("ExplosionStarted", ...)` (7 hücre) →
  **kamera GERÇEKTEN hareket etti** (`translate(0.54px, 0.30px)`) —
  event zinciri (emit→dinleyici→görsel etki) uçtan uca çalışıyor.
- Standart benchmark regresyon vermedi.

## ✅ Oturum 53 — Hücre efektleri (nefes/dönme/parlama/hover/basınç) %50 güçlendirildi

**Kullanıcı isteği:** "Hücre efektlerini %50 artır. Dönme nefes gibi,
patlama eşleşme efektleri değil" — yani SADECE idle/juice efektleri
(`fx/juice.js`), patlama/eşleşme efektlerine (kamera/particle/combo/
ses — `fx/game-feel.js`) DOKUNULMADI.

Her değerin sapması (1'den/0'dan farkı) × 1.5:

| Efekt | Eski | Yeni |
|---|---|---|
| Nefes alma ölçek | 1.035 | 1.0525 |
| Dönme açısı | 0.6°–1.8° | 0.9°–2.7° |
| Parlama (shimmer) parlaklık | 1.35 | 1.525 |
| Parlama doygunluk | 1.15 | 1.225 |
| Basınca küçülme | 0.88 | 0.82 |
| Bırakınca zıplama | 1.12 | 1.18 |
| Hover parlaklık | 1.12 | 1.18 |

**Doğrulama:** jsdom ile gerçek oyun ekranında enjekte edilen CSS'te
tüm yeni değerlerin (`scale(1.0525)`, `brightness(1.525)`,
`scale(0.82)`, `scale(1.18)`) ve JS'te hesaplanan dönme açısının
(0.90deg, beklenen 0.9-2.7 aralığında) gerçekten uygulandığı
doğrulandı, hiç JS hatası yok.

## 🎲 Oturum 54 — Gerçek 3D döner küp (kendi ekseni etrafında)

**Kullanıcı sorusu:** "Küpleri kendi ekseni etrafında dönen küp nasıl
yaparız?"

**Teknik:** Düz CSS `rotate()` (2D) DEĞİL — gerçek 3D: `perspective`
(sahne derinliği) + `transform-style: preserve-3d` (çocuk elementler
3D uzayda kalır) + 6 yüz (her biri `translateZ()` ile küpün kenarına
itiliyor, `rotateX/rotateY` ile doğru yöne çevriliyor) + sürekli
`rotateX+rotateY` animasyonu.

### 🐛 Geliştirme sırasında bulunan yanlış varsayım

İlk denemede "sayı hücreleri düz `<span>`" varsayımıyla kod yazıldı —
**yanlıştı**. jsdom ile gerçek hücre HTML'ini kontrol edince meğer
`ui/renderer.js` sayıları çoğunlukla **`<img>`** (GIFT_ASSETS'teki
hazır base64 PNG) olarak render ediyormuş, düz metin SADECE o görsel
yoksa kullanılıyor. Düzeltildi: `_apply3DCube()` artık HER İKİ durumu
da (img VEYA span) destekliyor — img varsa görseli 6 yüze kopyalıyor,
yoksa metni kopyalıyor.

### Uygulama (`fx/juice.js`, `ui/renderer.js`'e HİÇ dokunulmadı)

- Her render sonrası (MutationObserver) düz sayı hücrelerinin
  içeriğini (img/span) okuyup 6 yüzlü bir küp yapısına SARIYOR.
- Aynı değer tekrar render edilirse küp YENİDEN KURULMUYOR (animasyon
  kesintisiz devam etsin, gereksiz "sıfırlama" olmasın).
- Her küpün başlangıç fazı (negatif `animation-delay`) hücre
  pozisyonuna göre farklı — hepsi aynı anda aynı açıda dönmüyor,
  organik görünüyor.
- Eski düz 2D "hafif dönme" (Oturum 51/53) KALDIRILDI — artık gerçek
  3D küp dönüşü onun yerini alıyor. Nefes alma (`scale()`) AYNEN
  kalıyor, sadece dönme kısmı 3D küpe taşındı.

### Doğrulama (jsdom)

- 64 hücre → 64 küp, her küpte tam 6 yüz (`front/back/right/left/
  top/bottom`), görseller doğru kopyalanmış.
- Gerçek "OYNA" akışı + gerçek hamle: hamle öncesi/sonrası 64 hücre +
  64 küp sağlam, hiç JS hatası yok.
- Standart benchmark regresyon vermedi (sadece `fx/` katmanı,
  motor mantığına dokunulmadı).

## ✅ Oturum 55 — Sayılara floresan parlama, hediyeler de 3D döner küpe dahil edildi

**Kullanıcı isteği:** "Sayıları florasan, hediyeleri küp olarak ayarla."

**Keşif:** `fx/juice.js` (Oturum 47/53/54'te eklenmiş "Game Feel Engine")
zaten sayı hücrelerini GERÇEK 3D döner bir küpe sarıyordu — ama hediyeler
bu sistemden HARİÇ tutulmuştu (`isSpecial` listesinde `f9-cell-gift` var,
`_apply3DCube` hiç çağrılmıyordu).

**İlk yaklaşımım (CSS-only fake-3D) ÇAKIŞMA yarattı:** Önce sayılara
`drop-shadow` glow filtresi + hediyelere ayrı bir sahte-3D CSS küp
eklemiştim — ama `_apply3DCube()` her render sonrası orijinal `<img>`'i
OKUYUP YENİ bir img oluşturup `.src`'yi kopyalıyor, class/style KOPYALAMIYOR.
Sonuç: glow class'ım küp tarafından SESSİZCE SİLİNİYORDU, ekranda hiç
görünmüyordu (jsdom ile fark edildi — `f9-cube-scene` beklenmedik yapısı).

**Doğru çözüm — TEK bir tutarlı 3D küp sistemi:**
1. Sahte-3D CSS küp yaklaşımımı GERİ ALDIM (gereksiz, çakışıyordu).
2. `fx/juice.js`'teki `_apply3DCube()` artık orijinal img/span'ın
   `f9-num-glow` class'ını VE `--glow` CSS custom property'sini her
   küp yüzüne KOPYALIYOR — küp dönerken TÜM 6 yüzde neon parlaması sürüyor.
3. `applyBreathing()`'teki `isSpecial` erken-dönüşü ayrıştırıldı: hediyeler
   hâlâ "nefes alma" animasyonundan hariç (o efekt anlamsız olurdu) AMA
   artık `_apply3DCube()` ONLARA DA uygulanıyor — sayılarla AYNI gerçek
   3D döner küp mekanizması, tutarlı görsel dil.
4. `ui/renderer.js`'de sayı render'ına `class="f9-num-glow" style="--glow:..."`
   eklendi — her sayının kendi rengiyle (`NUMBER_COLOR`), 9 için altın
   vurgu rengiyle (`var(--f9-accent)`). Aynı glow, hamle-seçenekleri
   popup'ındaki küçük sayı simgelerine de tutarlılık için eklendi.

**Doğrulama (jsdom, gerçek level başlatılıp):** Sayı küpü bulundu, içinde
`img.f9-num-glow` ile `--glow` değeri (örn. `#E8C53C`, 6 rakamının rengi)
korunmuş halde doğrulandı. Hediye zorla üretilip (`bakir`) aynı
`.f9-cube-scene` yapısına sarıldığı doğrulandı. Hiç JS hatası yok.

**Not — numaralandırma:** İlk denemede bu değişikliği yanlışlıkla
"Oturum 47" olarak etiketlemiştim — ama README.md'de Oturum 47-54 zaten
DOLU (bu konuşmanın öncesinde yapılmış, `fx/juice.js`'in kendisi de o
oturumlarda eklenmiş). Fark edilip Oturum 55 olarak düzeltildi (kod
içindeki yorumlar dahil).

### 🔧 Düzeltme (aynı oturum içinde) — "sayılar dönmeyecek"

**Kullanıcı geri bildirimi:** "Yanlış anladın beni, sayılar dönmeyecek,
eski sistem — sadece floresan 3D gibi olacak." Netleştirme: hediyeler
dönmeye DEVAM etsin, sadece sayılar dursun.

**Düzeltme:** `fx/juice.js`'teki `applyBreathing()`'den sayı hücreleri
için `_apply3DCube()` çağrısı KALDIRILDI — sayılar artık HİÇ döner küpe
sarılmıyor. Bunun yerine `core/game-engine.js`'teki `.f9-num-glow`
CSS'ine SABİT (animasyonsuz) bir `perspective(220px) rotateX(9deg)`
eğimi eklendi — "3D gibi" derinlik hissi veriyor ama DÖNMÜYOR, sadece
parlaklık nabzı (glow flicker) devam ediyor. Hediyeler değişmedi, hâlâ
gerçek 3D döner küp.

**Doğrulama:** jsdom ile gerçek level başlatılıp — 64 sayı hücresinin
HİÇBİRİ artık `.f9-cube-scene` içermiyor (0/64), floresan glow hâlâ
mevcut (`--glow` korunmuş), hediye zorla üretilip hâlâ döner küpe
sarıldığı doğrulandı. Hiç JS hatası yok.

### 🔙 Tam geri alma (aynı oturum içinde) — "tamamen eski sisteme gel, küp dahil"

**Kullanıcı kararı:** Yukarıdaki tüm floresan/küp değişiklikleri
(hem ilk deneme hem düzeltme) TAMAMEN geri alındı — Oturum 54'ün
ORİJİNAL davranışına dönüldü:
- `ui/renderer.js`: sayı render'ındaki `f9-num-glow` class/style'ları
  (3 yerde: ana hücre, popup küçük simgeler, işlem sonucu) kaldırıldı.
- `core/game-engine.js`: `.f9-num-glow`/`.f9-num-text-glow`/
  `@keyframes f9-num-flicker` CSS'i ve eklediğim `.f9-gift-tile` CSS'i
  tamamen silindi (orijinalde `.f9-gift-tile` için hiç CSS yoktu).
- `fx/juice.js`: `applyBreathing()` ve `_apply3DCube()` Oturum 54'teki
  ORİJİNAL haline döndürüldü — sayılar yine döner küpe sarılıyor,
  hediyeler yine hariç tutuluyor (düz kalıyor), glow-koruma kodu
  tamamen kaldırıldı.

**Doğrulama:** jsdom ile — 64/64 sayı hücresi yine `.f9-cube-scene`
içeriyor (dönüyor), `f9-num-glow` class'ı hiçbir yerde yok, hediye
küpe sarılmıyor (düz). Hiç JS hatası yok. Bugünkü tüm görsel
değişiklikler net biçimde geri alındı.

### 🔚 Son adım (aynı oturum) — "küpleri de kaldır, sadece renkli sayılar"

**Kullanıcı kararı:** Sayı küpleri (Oturum 54'ün kendisi) de tamamen
kaldırılsın, sadece düz renkli sayılar kalsın.

**Değişiklik:** `fx/juice.js`'teki `applyBreathing()`'den `_apply3DCube()`
çağrısı kaldırıldı — sayılar artık hiç döner küpe sarılmıyor,
`ui/renderer.js`'in ürettiği düz renkli görsel/metin aynen kalıyor.
Nefes alma (ölçek nabzı, küp DEĞİL) hâlâ aktif — kaldırılması
istenmedi. `_apply3DCube()` fonksiyonunun kendisi dosyada duruyor
(artık hiç çağrılmıyor, zararsız) — ileride tekrar istenirse tek
satırla geri açılabilir.

**Doğrulama:** jsdom ile — 64/64 sayı hücresinde `.f9-cube-scene`
YOK, düz renkli sayı görseli/metni gösteriliyor, nefes alma animasyonu
hâlâ çalışıyor. Hiç JS hatası yok.

## 📌 Oturum 55/56 sonu — sohbet geçiş notu

**Kod durumu:** Tüm floresan/küp deneyleri geri alındı. `fusion9_clean.html`
şu an: sayılar düz renkli görsel (nefes alma animasyonu hariç hiçbir
efekt yok), hediyeler düz görsel, hiçbir şey dönmüyor. Yeni hiçbir
oyun-mantığı/dengeleme değişikliği YOK — bu oturum tamamen kozmetik
deneme+geri alma idi.

**Kod DIŞI konuşma (bilgi amaçlı, hiçbir dosyaya etkisi yok):**
Kullanıcı, Claude Code ekosistemindeki açık kaynak araçları (ECC,
Matt Pocock skills, GStack, Graphify, DeerFlow, OpenMontage, GBrain,
SkillSpector, OpenClaw) sordu — bir blog yazısından (yzokulu.com).
Değerlendirme: **Matt Pocock skills** (`/grill-me`) ve **ECC** bu proje
için en anlamlıları (ama HEPSİ Claude Code CLI gerektiriyor, şu anki
claude.ai sohbet arayüzünde kurulamaz). Kod tabanına HİÇBİR değişiklik
yapılmadı, sadece tartışıldı. Yeni sohbette bu konu tekrar açılırsa,
yukarıdaki "Peki nereden başlamalı?" tavsiyesi geçerli: önce
Matt Pocock skills + SkillSpector ile tarama.

**Yeni sohbet için hazır mı:** Evet — `fusion9_clean.html` build'i
temiz, hata yok, `node build/build.js` son kez başarıyla çalıştı.
Açık kalan tek gerçek "kod" kararı hâlâ `b4_05`/`b4_07` (bkz. HANDOFF.md
madde 3, "Kalan açık adımlar").

## 📌 Oturum 57-59 sonu — sohbet geçiş notu

**Kod durumu:** Kullanıcı "sayılara AR alanındaki gibi gerçeklik
görüntüsü" istedi. Üç iterasyonda son hâline ulaşıldı:

1. **Oturum 57** — 6 yüzlü, gerçek 3D döner küp (cam/metalik yüzeyler,
   tek eksen yavaş dönüş) denendi. Kullanıcı: "güzel ama küp istemedim,
   sadece sayılar dedim, nefes alan sayılar."
2. **Oturum 58** — Kutu/kenarlık tamamen kaldırıldı, efekt doğrudan
   sayının kendisine (`<span>`/`<img>`, olduğu gibi) bindirildi — ama
   hâlâ `rotateY` ile dönüyordu. Kullanıcı: "kare dönüyor hala, pipet
   gibi düşün, dönme yok."
3. **Oturum 59 (ŞU AN LIVE, kalıcı)** — Tüm dönme/perspective kaldırıldı.
   `fx/juice.js`'te `_apply3DCube()` fonksiyonu tamamen silindi, yerine
   `_applyHoloNumber()` geldi: normal sayı hücrelerindeki `<span>`'a
   `f9-num-holo` sınıfı (statik, sabit açılı bir ışık şeridi — `::before`,
   `mix-blend-mode:overlay`), `<img>`'e ise `f9-num-holo-img` sınıfı
   (sadece `filter: drop-shadow(...) brightness(...)`, çünkü `<img>`
   "replaced element" olduğundan `::before` render etmiyor) ekleniyor.
   **Tamamen animasyonsuz/statik** — tek hareket kaynağı nefes alma
   (`.f9-cell-breathe`, ayrı element, üst `.f9-cell`'de). Hediyeler bu
   efektten muaf (`isSpecial` filtresi, değişmedi).

**Doğrulama:** Her adımda `node build/build.js` (sözdizimi+çalışma
zamanı) VE `vm` ile izole birim testleri (sahte hücrelerle
`F9Juice.applyBreathing()` çağrılıp DOM'da beklenen sınıf/element
sayıları/CSS içeriği doğrulandı — gerçek tarayıcıda görsel test
YAPILMADI, sadece DOM/CSS yapısı doğrulandı). Kod tabanında oyun
mantığı/dengeleme değişikliği YOK, tamamen kozmetik.

**HANDOFF.md güncellendi:** "Game Feel Engine" satırı bu üç oturumun
özetini ve şu anki LIVE durumu içeriyor.

**Yeni sohbet için hazır mı:** Evet. Açık kalan tek gerçek "kod" kararı
hâlâ `b4_05`/`b4_07`.

## Faz 2 ilerleme (eski notlar — artık geçmiş, referans için tutuldu)

**✓ `features/hourglass/hourglass-system.js` çıkarıldı.**
Bu çıkarım öncekilerden farklı: kum saati bloğu `game-engine.js`'in TAM
ORTASINDAYDI (satır ~4094-4492), bu yüzden basit "kes-yapıştır" yeniden
SIRALAMA gerektirdi (sadece bölme değil). Bunun güvenli olduğunu şöyle
doğruladık:
1. `node -c` → sözdizimi geçerli
2. Sıralanmış satır listesi (multiset) karşılaştırması → orijinal ve yeni
   JS'te BİREBİR AYNI 7328 satır var, hiçbiri kaybolmadı/çoğalmadı
3. Mantıksal güvenlik: çıkarılan blok sadece `function` tanımları (hoisting
   ile otomatik yukarı taşınır) ve kendi kendine yeten `const` dizileri
   içeriyor — üst-seviye yan etkili kod yok. Bu yüzden metin sırası
   değişse de çalışma zamanı davranışı aynı kalır.

Bundan sonraki her reorder-gerektiren çıkarımda (blocker layout,
evolutionEngine, GameCore bölünmesi) bu üç adımlı doğrulama tekrarlanmalı
— özellikle 3. madde: çıkarılan blokta üst-seviye yan etkili kod
(hemen çalışan IIFE, DOM'a hemen erişim, döngüsel referans) olup
olmadığı kontrol edilmeli.

**✓ `engine/board-rules.js` çıkarıldı (GEÇİCİ, henüz iç bölünmedi).**
Bu, düz bir "önce/sonra" kesimi (satır 1-406), sıralama değişmedi — hourglass'tan
daha düşük riskli. Ama içeriği incelerken önemli bir şey ortaya çıktı:

**⚠️ BULGU: match/score/evolution/blocker/element sabitleri TEK BİR
İÇ İÇE GEÇMİŞ BLOKTA.** `resolveBoard()` metodunun kendisi (Sorun A,
yukarıda) match+score+evolution'ı birleştiriyordu; ama asıl kaynak
daha da geniş — dosyanın en başındaki 406 satırlık "kurallar" bloğu
şunları SIRAYLA, İÇ İÇE tanımlıyor:
```
F9Debug stub/init → VALUES/makeRng → GIFT_* (evolution) → ELEM_*/DESTROYER_*
→ BLOCKER_* → mechanism1-6 fonksiyonları (hepsi karışık) → eşleşme şekil
şablonları (Sh, GROUP_A-E) → findLineMatches/findAllMatches (gerçek matchEngine)
→ digitalRoot/producesNineWith/NINE_PARTNERS (hint/match yardımcıları)
```
Yani `engine/matchEngine.js`, `engine/scoreEngine.js`, `engine/evolutionEngine.js`,
`features/blockers/`, ve element sistemi hepsi bu 406 satırda TEK TEK
satır satır ayıklanmayı bekliyor — kontrollü bir "kes-yapıştır" değil,
her sabitin/fonksiyonun hangi sisteme ait olduğuna karar verip TEK TEK
çıkarmak gerekiyor. Bu, ayrı ve dikkatli bir oturum gerektiriyor.

Şimdilik `board-rules.js` tek parça olarak duruyor, GameCore'un
(`class Board`, sonrasında gelen ana sınıf) DIŞINA çıkarılmış olması
bile başlı başına bir kazanç (artık board mantığı ile kural sabitleri
ayrı dosyalarda).

## 🤖 Headless Benchmark Altyapısı (Oturum 6'da kuruldu — Faz 2 refactor'lerinin güvenlik ağı)

**Neden:** `engine/board-rules.js` ve `resolveBoard()` refactor'ü riskli
(bkz. yukarıdaki bulgular). Her adımdan sonra "oyun davranışı değişmedi mi?"
sorusuna OBJEKTİF cevap lazım. Bunun için F9Bot'u gerçek motora karşı,
**tarayıcı olmadan, saf Node.js'te** koşturan bir altyapı kurduk.

**Nasıl çalışır:** `GameCore` sınıfı ve `generateLevel` neredeyse tamamen
saf mantık (sadece 2 küçük DOM dokunuşu var, ikisi de stub'landı). F9Bot'un
`pickMove`/`applyMove` metotları da (yeni eklendi, mevcut `start()`/`stop()`
davranışını DEĞİŞTİRMEDEN) canlı `state`'e dokunmadan çalışabiliyor.

### Kullanım

```bash
# 1. Headless bundle'ı derle (motor dosyaları değiştiğinde yeniden çalıştır)
node debug/benchmark/build-headless-engine.js

# 2. Benchmark koştur: node run-benchmark.js <başlangıç> <bitiş> <seed-sayısı> <profil>
node debug/benchmark/run-benchmark.js 1 100 10 normal

# 3. Refactor'den önce/sonra karşılaştır
node debug/benchmark/run-benchmark.js 1 100 10 normal   # refactor ÖNCESİ, sonucu sakla
# ... refactor yap ...
node debug/benchmark/build-headless-engine.js            # bundle'ı yeniden derle
node debug/benchmark/run-benchmark.js 1 100 10 normal   # refactor SONRASI
node debug/benchmark/compare-benchmark.js <önce.json> <sonra.json>
```

`compare-benchmark.js` çıkış kodu 0 = güvenli, 1 = anlamlı fark var
(refactor'ü incele). CI/otomasyon script'lerinde bu kodu kullanılabilir.

### Baseline sonucu (5 Temmuz 2026, refactor ÖNCESİ — `baselines/baseline-2026-07-05-pre-boardrules-refactor.json`)

Level 1-100, 10 seed, "normal" profil: **neredeyse tüm seviyelerde %0
kazanma oranı**, ortalama skor/hedef oranı ~0.15-0.55 arası. Sadece
20/41/50/96 gibi birkaç seviyede %10 kazanma çıktı, geri kalanı "GEÇİLEMEZ Mİ?".

**⚠️ Bu sonucu OLDUĞU GİBİ kaydediyorum ama tek bir nedene bağlamıyorum —
iki ayrı olası açıklama var, ayırt edecek kanıt henüz yok:**

1. **Bot zayıf olabilir**: `F9Bot`'un `_pickMove` mantığı sığ (3-5 Monte
   Carlo simülasyonu, derinlik 3-4). 16 hamlede 300-500+ puan hedefine
   ulaşmak, ileri görüşlü/derin bir arama gerektiriyor olabilir —
   bu bot seviyesinde değil.
2. **Zorluk gerçekten çok yüksek olabilir**: `WARMUP_END_LEVEL=0` zaten
   bilinen bir bulguydu; belki hedef skor/hamle oranı genel olarak dar.

**Ayırt etmenin yolu (henüz yapılmadı, "Level dengeleme" fazının konusu):**
- "pro" profil "normal"den belirgin şekilde iyi çıkmalı, aksi halde bot
  mantığında bir sorun var demektir (ilk küçük örneklemde bu net değildi).
- Gerçek bir insan oyuncunun (veya çok daha derin aramalı bir "mükemmel"
  bot'un) aynı seviyelerde nasıl performans gösterdiği karşılaştırılmalı.

**Bu oturumdaki amaç için önemli olan:** Bu sayılar mükemmel olmasa da
**deterministik ve tekrarlanabilir** — board-rules.js refactor'ünden sonra
aynı komutla tekrar koşturup `compare-benchmark.js` ile kıyaslarsak,
refactor'ün bu sayıları DEĞİŞTİRİP DEĞİŞTİRMEDİĞİNİ kesin olarak görürüz.
Sayıların "iyi" olması bu aşamada şart değil — "aynı kalması" yeterli kanıt.

### Dosyalar
```
debug/benchmark/
 ├─ build-headless-engine.js   ← motor+bot'u Node için paketler
 ├─ run-benchmark.js            ← level aralığında toplu test
 ├─ compare-benchmark.js        ← iki sonucu karşılaştırır
 ├─ .headless-bundle.js         ← (otomatik üretilir, git'e eklenmez)
 └─ results/*.json              ← (otomatik üretilir, git'e eklenmez)
```

**⚠️ Bakım notu:** `build-headless-engine.js` içindeki `PURE_ENGINE_END_LINE`
sabiti (`core/game-engine.js`'in "saf mantık" kısmının bittiği satır),
Faz 2 devam ederken (özellikle GameCore/Board core/ altına taşınınca)
GÜNCELLENMELİ — dosya yapısı değiştikçe bu sınır kayacaktır.

## Faz 2 yol haritası (öncelik sırasıyla)

1. ~~`engine/board-rules.js` içini satır satır ayıkla~~ ✅ TAMAMLANDI (Oturum 8)
2. **`resolveBoard()` metodunu refactor et** — gift-spawn/blast bloğunu
   `_applyGiftSpawn(...)` adında ayrı bir metoda çıkar, sonra evolutionEngine'e taşı.
   (Not: mechanism fonksiyonları artık `engine/evolutionEngine.js`'de,
   ama ORKESTRASYON hâlâ `core/game-engine.js`'teki `GameCore.resolveBoard()`
   içinde — bu adım hâlâ yapılmadı.)
3. **`features/dda/`** içine `dda` nesnesini taşı (~satır 5333 civarı, kaymış olabilir)
4. **`economy/`** içini doldur (energy-shop, ad-rewards, daily-reward)
5. **`features/league/`** içini doldur (leaderboard-system)
6. **`core/{Board,Cell,GameState}.js`** — GameCore sınıfının parçalanması
7. **`ui/{renderer,screens,hud}.js`** — render fonksiyonlarının ayrılması

**Önemli:** Her adımda `node -c` + multiset doğrulaması + headless benchmark
karşılaştırması yapılmalı (bkz. yukarıdaki "Headless Benchmark Altyapısı"
bölümü — artık üç doğrulama katmanı standart yöntem).

Her adımdan sonra `node build/build.js` ile hem sözdizimi hem de
eski/yeni JS diff karşılaştırması yapılmalı (bu oturumda kullandığımız
yöntem: `re.sub` ile başlık yorumlarını çıkarıp normalize edilmiş metni
karşılaştırmak).
