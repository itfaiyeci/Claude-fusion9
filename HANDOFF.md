# FUSION 9 — YENİ SOHBET BAŞLANGIÇ REHBERİ

> Bu dosyayı yeni sohbette İLK paylaşılan/okunan dosya yap. Detaylı
> oturum-oturum geçmiş için `README.md`'ye bak (1100+ satır, tüm
> kararların gerekçeleri var) — ama önce bunu oku, hızlı yönelim için.

## Proje nedir

Fusion9: sayı tabanlı bir match-3 oyunu (iki bitişik hücreyi değiştirip
toplam/fark/çarpım/bölümünün basamak-kökü 9 olmasını sağlıyorsun).
9'lardan oluşan geometrik şekiller (3'lü köşe, 4'lü L, 5'li U/T, 6'lı,
7'li) tamamlanınca "hediye" (bakır→bronz→gümüş→altın→elmas→Matrix
Eşleşme) üretiyor. Tek bir ~1MB'lık HTML dosyasıydı, modüler bir kaynak
ağacına dönüştürüldü.

## ✅ Üretim bayrağı DÜZELTİLDİ (Oturum 60)

- **`core/game-engine.js`'teki `HOURLY_REWARD_TEST_MODE`** artık `false`
  (üretim değeri: `HOURLY_REWARD_REAL_SEC=3600`, 1 saat). Kullanıcı
  GitHub web arayüzünden elle düzeltmeye çalışırken `False` (Python
  tarzı, büyük harf) yazmıştı — bu geçerli JS değil, runtime hatası
  verirdi ("False is not defined"). Bu oturumda `false` (küçük harf)
  olarak düzeltildi ve `node build/build.js` ile doğrulandı.

## Mimari durumu (özet tablo)

| Katman | Durum | Not |
|---|---|---|
| `core/` (Board, GameCore, bootstrap) | %95 | Sağlam |
| `engine/` (match/evolution/element) | %95 | Sağlam |
| `rules/` (8 dosya: sabitler) | %95 | Sağlam |
| `features/` (blockers/wave/hint/dda/hourglass/league) | %90 | Sağlam |
| `economy/` (energy-shop, EnergyTracker) | %85 | Sağlam |
| `ui/` (screens.js, renderer.js) | %95 | Render fonksiyonları ayrıldı. **Oturum 65:** tahta etkileşimi tıkla-tıkla'dan sürükle-bırak'a geçti (Pointer Events API, mouse+dokunma+kalem tek kod yolu) — eski tıkla-tıkla hâlâ ÇALIŞIYOR (hareketsiz dokunma = eski davranış), `flow/moveFlow.js`'e dokunulmadı, sadece `handleCellClick()` doğru sırada 2 kez çağrılıyor. Sürüklerken sayfa kaymasın diye `.f9-board-container`'a `touch-action:none` eklendi. |
| `content/` (worlds/levels/rewards/blockers) | %95 | Duality çözüldü + name/theme dublikasyonu giderildi (Oturum 25) |
| `save/` | %85 | Sağlam |
| `debug/` + `debug/benchmark/` | %90 | F9Bot + headless test altyapısı sağlam |
| `flow/` (GameFlow: moveFlow/levelFlow/rewardFlow/transitionFlow) | %95 | Oturum 23'te ayrıldı — `core/game-engine.js` artık sadece saf motor+state |
| Game Feel Engine (`fx/camera,particles,combo,juice,game-feel.js`) | %60 | Oturum 47'de eklendi (kamera+particle+combo+juice+ses). **Oturum 55/56'da**: sayılara floresan+3D küp denendi, kullanıcı geri istedi → TAMAMEN GERİ ALINDI, sonra kullanıcı "küpleri de kaldır" dedi → sayı küpleri (Oturum 54'ün kendi özelliği) de kaldırıldı. **Oturum 57-59'da**: kullanıcı "AR alanındaki gibi gerçeklik görüntüsü" istedi → önce 6-yüzlü döner küp denendi (Oturum 57) → kullanıcı "küp istemedim" dedi, kutu/kenarlık tamamen kaldırılıp sayının kendisine (span/img) doğrudan biner bir efekte geçildi, ama hâlâ dönüyordu (Oturum 58) → kullanıcı "kare dönüyor hala, pipet gibi düşün, dönme YOK" dedi, TÜM rotateY/perspective kaldırıldı (Oturum 59). **ŞU AN LIVE (kalıcı, geri alınmadı) durum**: sayılar üzerinde `f9-num-holo` (span, ::before ile statik çapraz ışık şeridi) / `f9-num-holo-img` (img, sadece filter tabanlı statik glow) sınıfları — TAMAMEN ANİMASYONSUZ/STATİK, kutu/kenarlık/arka plan yok. Tek hareket kaynağı nefes alma (breathe), hâlâ aktif. Hediyeler bu efektten muaf (isSpecial filtresi). `fx/juice.js`'teki eski `_apply3DCube()` fonksiyonu artık dosyada bile yok (Oturum 59'da `_applyHoloNumber()` ile değiştirildi). Kullanıcının "300+ ses varyasyonu"/"squash-stretch her taş türü" gibi ince ayarları hâlâ yapılmadı |
| Performans ölçümü (gerçek FPS/süre) | **%100** | Oturum 26'da yapıldı — `debug/benchmark/perf-measure.js`, motor sağlıklı (bkz. README.md Oturum 26) |
| Evolution tablosu (üretim/etki/puan sabitlenmesi) | **%100** | **DONDURULDU (Oturum 29)** — Oturum 24'ün değerleri kullanıcı kararıyla değişti, yeni değerler resmi |
| İlk 100 level ilerleme eğrisi (öğretici/bakır/bronz/...) | %55 | **Oturum 64'te büyük ilerleme.** İlk 10 bölüm (level 1-100'ün TAMAMI, 10 bölüm × 10 level) artık gerçek bir ÖĞRETİM MÜFREDATI: `TUTORIAL_CURRICULUM` (core/game-engine.js) — bölüm 1-5 doğrudan oluşturma (3'lü→Bakır ... 7'li→Elmas), bölüm 6-10 terfi (Bakır+9→Bronz ... Elmas+9→Matrix). Engel yoğunluğu bu bölümlerde ÖNEMLİ ÖLÇÜDE düşürüldü (`_tutorialDampen`: bölüm 1-5'te %85 azalma, 6-10'da %65 azalma) — tahta kalabalık olmasın. `features/hint/hint-system.js` artık bölümün hedef mekanizmasını üreten hamleyi (varsa) normal ipucundan farklı renkte (yeşilimsi) ve daha erken (4sn, normalde 8sn) gösteriyor. **Hâlâ eksik:** level 101+ için müfredat/eğri tanımlı değil — bu sadece 1-100 arasını kapsıyor. |

## En kritik kararlar (bunları TERSİNE ÇEVİRME, kullanıcı onaylı)

1. **`generateLevel()` tek yetkili kaynak.** `content/levels/chapter-database.js`
   (CHAPTER_DB) SADECE görev tipini (score/create9/giftCount/breakBlockers)
   ve score-dışı tiplerde değeri tutar. "score" tipinde value YOK —
   `core/game-engine.js`'teki `newLevel()` içinde çalışma zamanında
   `generateLevel()`'ın gerçek `targetScore`'undan senkronize edilir.
2. **Hamle sayısı HER LEVELDA sabit 16.** `movesMult` denendi, geri
   alındı — kullanıcı kararı, değiştirme.
3. **EvolutionEngine zinciri DEĞİŞMEDİ**: Bakır(3'lü)→Bronz(+9)→
   Gümüş(+9)→Altın(+9)→Elmas(+9)→"Matrix Eşleşme"(+9, tüm tahta patlar
   +10 hamle). Kullanıcı farklı bir zincir (1A/Fusion içeren) önermişti
   ama **mimari sağlığı için mevcut, test edilmiş zinciri korumaya karar
   verildi** — bunu değiştirmeden önce kullanıcıya sor.
4. **F9Bot'ta Monte Carlo simülasyonu KAPALI** (`debug/bot.js`,
   `USE_MC=false`). Deneysel olarak AKTİF OLARAK ZARARLI olduğu kanıtlandı
   (bazı levellerde kazanma oranını %0'dan %88'e çıkardı MC kapatılınca).
   Bot şu an sadece greedy heuristiğe (`_scoreMove`) güveniyor.
5. **Kum saati bonus patlaması (2x2) İPTAL edildi** (kullanıcı kararı),
   3x3 olarak kaldı.
6. **Aynı-tür hediye kombinasyonu (bakır+bakır vb.) artık element
   üretmenin YANINDA haç şeklinde patlama da yapıyor** (3/4/5/6/7 hücre).
7. **Karışık-tür kombinasyon patlaması (bronz+altın vb.) gerçek haç
   şekli** — 3x4=12 hücrelik dolu blok DEĞİL, merkezden geçen ince haç.
8. **`flow/` katmanı ayrıldı (Oturum 23).** `handleCellClick`→
   `flow/moveFlow.js`, `newLevel`→`flow/levelFlow.js`, `executeMove`+
   `watchAd`→`flow/rewardFlow.js`, `checkAndTransition`+`_checkNearMiss`→
   `flow/transitionFlow.js`. Taze önce/sonra benchmark karşılaştırmasıyla
   davranışın DEĞİŞMEDİĞİ doğrulandı (bkz. README.md Oturum 23). Bunu
   TEKRAR yapmaya kalkma — iş bitti.
9. **~~Evolution tablosu DONDURULDU (Oturum 24)~~ → Oturum 29'da
   KULLANICI TARAFINDAN TERSİNE ÇEVRİLDİ.** Kullanıcı yeni, tam bir
   terfi+kombinasyon tablosu verdi (bkz. madde 13). Oturum 24'ün
   "değiştirmeden önce sor" kuralı zaten işledi — soruldu, kullanıcı
   onayladı, değiştirildi. Eski %38.0 kazanma oranı → %30.7'ye düştü
   (beklenen, madde 13'e bkz.).
10. **Near-miss "Tasarım B" (Oturum 26, kullanıcı kararı).** Near-miss
    popup'ı kayıptan SONRA (movesLeft=0 iken) tetiklenir, sadece hedefe
    %15'ten az kalmışsa VE reklam hakkı kullanılmamışsa gösterilir,
    birincil aksiyon reklam-izle-devam-et (ücretsiz hamle YOK). Bunu
    "Tasarım A"ya (hamleden ÖNCE proaktif uyarı) çevirme — kullanıcı
    onayı gerekir.
11. **⚠️ GEÇİCİ TEST AYARI (Oturum 27, kullanıcı kararı) — ÜRETİME
    ÇIKMADAN ÖNCE DÜZELT.** "Saat başı ödül" (tüp/can yenileme,
    `state.TUBE_REFILL_SEC`) reklam GEREKTİRMİYOR (zaten böyleydi,
    `refillTubes()` ücretsiz — `showNoTubesModal()`'daki reklam butonu
    ayrı, isteğe bağlı bir hızlandırma). Kullanıcı hızlı test edebilmek
    için süreyi geçici olarak 5 dakikaya (`HOURLY_REWARD_TEST_SEC=300`)
    çekti — gerçek/üretim değeri 1 saat (`HOURLY_REWARD_REAL_SEC=3600`).
    `core/game-engine.js`'teki `HOURLY_REWARD_TEST_MODE=true` bayrağını
    **üretime çıkmadan önce `false` yap** — tek satır değişiklik.
12. **Patlama şekilleri: satır+sütun ince haç, dolu blok DEĞİL, Matrix
    hariç (Oturum 28, kullanıcı kararı — Oturum 14'ün genişletilmesi).**
    Karışık-tür kombinasyon (Oturum 14) ve aynı-tür kombinasyon zaten
    bu ilkeye uygundu. Altın'ın SPAWN patlaması (`GIFT_SPAWN_BLAST
    [GIFT_GOLD]`) düzeltildi: eskiden kalın "artı formu" (17 hücre,
    `AREA_BLAST_OFFSETS.normal[GIFT_GOLD]` tablosu) kullanıyordu, artık
    ince haç (9 hücre, 5 yatay+5 dikey). **Kombinasyon/terfi (promotion)
    alan patlaması mekanizması BİLEREK DOKUNULMADI** (Oturum 14 kararı
    hâlâ geçerli) — bu SADECE spawn-anı efektini değiştirdi.
13. **Evolution mekaniği KAPSAMLI YENİDEN YAZILDI (Oturum 29, kullanıcı
    tam tablo verdi — Oturum 24'ün "dondurma"sını TERSİNE ÇEVİRİYOR,
    kullanıcı onayıyla).** Yeni tablo:
    - **+9 Terfi (crossOffsets ile, GIFT_PROMO_CROSS_SIZE):** bakır+9→4,
      bronz+9→5, gümüş+9→6, altın+9→7, elmas+9→8. **Elmas+9 ("Matrix
      Eşleşme" — İSİM AYNI KALDI) artık tüm-tahta+10-hamle DEĞİL, 8
      hücre haç+3 hamle.**
    - **Karışık-tür kombinasyon (DIFFERENT_TYPE_AREA_COMBOS, [nRows,nCols]
      ile):** her kademenin TIER_SIZE'ı (bakır=3,bronz=4,gümüş=5,altın=6,
      elmas=7) kullanılarak yatay=min(A,B), dikey=max(A,B). **Bakır
      çiftleri artık BURAYA dahil** (eski "rastgele 3x3 blok" mekanizması
      — mechanism3bCopperBlast/COPPER_BLAST_EXTRA_3X3_BLOCKS — tamamen
      kaldırıldı).
    - **Ölçülen denge etkisi:** kazanma %38.0→%30.7, skor/hedef
      1.07→0.80 (esas olarak Matrix Eşleşme'nin küçülmesinden). Bu
      BEKLENEN bir sonuç, kullanıcı kararının doğal sonucu — "hata"
      değil.
    - **⚠️ Bu tabloyu TEKRAR DEĞİŞTİRMEDEN önce kullanıcıya sor** —
      hem +9 terfi hem karışık-tür değerleri artık kilitli.
14. **Eşleşme şekilleri (3/4/5/6/7'li bloklar) kullanıcının TAM koordinat
    listesiyle DEĞİŞTİRİLDİ (Oturum 30).** `rules/matchRules.js`
    tamamen yeniden yazıldı: 3'lü aynı kaldı (zaten birebirdi), 4'lü
    eski 8 blok→12 yeni blok (`BLOCK_4_SHAPES`), 5'li eski 12→yeni 12
    (`BLOCK_5_SHAPES`), 6'lı/7'li aynı sayı (4'er) yeni koordinatlarla
    (`BLOCK_6/7_SHAPES`). Çizgi şekilleri (LINE_3/4/5_H/V +
    SPAWN_OFFSETS) DEĞİŞMEDİ — kullanıcının çizgi girdileri zaten
    birebir aynıydı. **36 şeklin TAMAMI `findAllMatches()` ile tek tek
    doğrulandı** (tespit + doğru spawn hücresi). Yan etki: eski
    `SIX_SHAPES`'in 2 girdisinde normalize-edilmemiş koordinat (board
    kenarında kör nokta) hatası vardı, kullanıcının verisi zaten
    normalize olduğu için bu da düzeldi. Denge etkisi yok (36/36 test
    geçti, benchmark Oturum 29 ile aynı). **Bu koordinatları
    DEĞİŞTİRMEDEN önce kullanıcıya sor.**
15. **Level 1-100 TÜM oyuncularda BİREBİR AYNI (Oturum 43, kullanıcı
    kararı: "standart match-3 tasarımı, level dengesi/liderlik tablosu
    için gerekli").** `flow/levelFlow.js`'teki `newLevel()`: level ≤100
    için `BAKED_REFERENCE_SEED=1` (bake pipeline'la aynı sabit seed)
    kullanılıyor, hem `generateLevel()`'a hem `GameCore`'un board
    üretimine (blocker yerleşimi + sayı dizilimi dahil) besleniyor.
    Level 101+ hâlâ `state.seed` (oyuncuya özel). DDA bu sabit taban
    üzerine hâlâ uygulanıyor (ayrı dokunulmadı). jsdom ile doğrulandı
    (level 37 iki farklı oyuncu-seed'iyle birebir aynı board/blocker,
    level 105 farklı, sınır 100/101 doğru). Denge etkisi YOK ölçüldü
    (seed=1 ile %38.9 kazanma, Oturum 31'in çoklu-seed ortalamasıyla
    %39.0 neredeyse aynı). **Bu seed kararını DEĞİŞTİRMEDEN önce
    kullanıcıya sor.**

## Bilinen açık sorular (kod değil, ürün/tasarım kararları bekliyor)

1. **~~"Level 37'de HERKES aynı tahtayı görsün mü?"~~ → Oturum 43'te
   ÇÖZÜLDÜ: EVET.** Bkz. "En kritik kararlar" madde 15.
2. **Near-miss popup'ı YENİDEN TASARLANDI VE DÜZELTİLDİ (Oturum 26).**
   Kullanıcı kararı: "Tasarım B" — near-miss, kayıptan SONRA (movesLeft
   zaten 0 iken), hedefe %15'ten az kalmışsa VE bu level için reklam
   hakkı henüz kullanılmamışsa tetiklenir; birincil buton mevcut
   `watchAd()`/`GameCore.watchAdContinue()` mekanizmasını kullanır
   (ücretsiz hamle YOK). Kök neden (kendi kendini engelleyen guard)
   düzeltildi, jsdom ile uçtan uca doğrulandı (bkz. README.md
   Oturum 26). **Karar artık kapalı, tekrar açma.**

> (Eski madde 2 — chapter-database.js'in name/theme dublikasyonu —
> Oturum 25'te ÇÖZÜLDÜ, bkz. README.md Oturum 25. Eski madde 3 —
> Evolution tablosu — Oturum 24'te DONDURULDU, bkz. "En kritik
> kararlar" madde 9.)

> (Oturum 25) **Bilinen kırılganlık:** `debug/benchmark/
> build-headless-engine.js`'teki `PURE_ENGINE_END_LINE` sabiti,
> `core/game-engine.js`'in `generateLevel()`'dan ÖNCEKİ satırlarına
> yapılan her ekleme/silmede kayıyor (bu oturumda bir kez sözdizimi
> hatasına yol açtı, düzeltildi). Kalıcı çözüm ayrı bir iyileştirme.

> (Oturum 26) **Casual/normal bot profili verisi hazır ama aksiyon
> gerektirmiyor:** `debug/bot.js`'teki `PROFILES.casual`
> (`ninePref:0.20`) muhtemelen gerçekçi bir acemi oyuncuyu değil,
> yarı-rastgele oyunu simüle ediyor — bu yüzden casual/normal'daki
> yüksek "geçilemez level" oranı (43/14 dolarında 100) muhtemelen
> bot-gerçekçiliği sorunu, level tasarımı sorunu değil. Level
> zorluğuna DOKUNULMADI. Eğer gerçek kullanıcı verisi (churn/level
> terk oranı) toplanmaya başlanırsa, bu veriyle karşılaştırılıp
> kesin karar verilebilir.

## Ölçülmüş veri (Oturum 24'te bu veriyle DONDURULMUŞTU — Oturum 29'da kullanıcı tablosuyla TERSİNE ÇEVRİLDİ, aşağıda GÜNCEL veri de var)

F9Bot ile 10.000 oyun (level 1-100, pro profil) — `debug/benchmark/
baselines/large-scale-10000games-pro-2026-07-06.json` — **bu, ESKİ
(Oturum 24 öncesi/o zamanki) tablonun verisi, artık geçerli değil,
sadece tarihsel referans:**

| Kademe | Oyun başına üretim (ESKİ) | Bakır'a göre nadirlik |
|---|---|---|
| Bakır | 1.343 | 1.0x |
| Bronz | 0.737 | 1.8x |
| Gümüş | 0.534 | 2.5x |
| Altın | 0.329 | 4.1x |
| Elmas | 0.178 | 7.5x |
| Matrix Eşleşme | 0.066 | 20.3x |

Genel (ESKİ): kazanma oranı %37.9/%38.0, ort. skor/hedef 1.06/1.07, ort. hamle 16.7.

**GÜNCEL veri (Oturum 29'un yeni tablosuyla, 100 level × 100 oyun,
pro):** kazanma **%30.7**, skor/hedef **0.80**, ort. hamle 16.2 —
bakır 1.295, bronz 0.706, gümüş 0.515, altın 0.328, elmas 0.186,
matrix 0.079. Geçilemez (%0) level sayısı: 1 (level 69) — bkz.
README.md Oturum 29 için tam kıyas tablosu ve gerekçe.

## Bulunmuş ve düzeltilmiş büyük hatalar (tekrar yapma)

- **🔴 KRİTİK (Oturum 65) — İpucu sistemi (F9Hint) muhtemelen HİÇ
  ÇALIŞMAMIŞTI, hiç fark edilmeden.** `features/hint/hint-system.js`
  `window.state?.gc` kullanıyordu — ama `state` (core/game-engine.js)
  paylaşımlı IIFE kapsamında `const` olarak tanımlı, üst-seviye
  `const`'lar `window`'a ASLA otomatik eklenmez (sadece `var`/fonksiyon
  bildirimleri eklenir). Yani `gc` HER ZAMAN `undefined`'dı,
  `_findBestHint(undefined)` sessizce `null` dönüyordu — parıldama efekti
  hiç tetiklenmiyordu. `debug/bot.js`'in doğru kullandığı çıplak
  `state.gc` ile karşılaştırılınca fark edildi (Oturum 65'te sürükle-
  bırak özelliğini test ederken tesadüfen bulundu). Aynı hata
  `debug/analytics.js`'te de vardı (4 yerde) — o da düzeltildi. **Ders:**
  paylaşımlı IIFE'de üst-seviye `const`/`let` değişkenlere HER ZAMAN
  çıplak isimle eriş, `window.` öneki ekleme — sadece gerçekten
  `window`'a atanmış şeyler (`window.state=...` gibi açık bir satır
  varsa) `window.` ile erişilebilir.

- **🔴 KRİTİK (Oturum 29) — Elmas+9 ("Matrix Eşleşme") hâlâ TÜM
  TAHTAYI patlatıyordu (64 hücre), kullanıcının "8 hücre haç, tüm
  tahta DEĞİL" kararına rağmen.** İlk uygulama denemesinde
  `GIFT_PROMO_BLAST[DIAMOND]=[8,8]` kullanılmıştı — bu, `areaBlastCells()`
  içindeki "nRows/nCols ≥ board boyutu (8) → TÜM TAHTA" özel durumuna
  TAM denk geliyordu, sessizce eski davranışı geri getiriyordu.
  Doğrudan GameCore testiyle (jsdom değil, headless bundle + el ile
  hediye yerleştirme) yakalandı. DÜZELTİLDİ: `crossOffsets()` kullanımına
  geçildi (SAME_TYPE_BLAST_SIZE'ın zaten kullandığı AYNI mekanizma) —
  64→11-13 hücreye düştüğü doğrulandı. **Ders: "N hücre" bu kod
  tabanında HER YERDE crossOffsets()'e verilen parametreyi ifade eder,
  [nRows,nCols] TAMAMEN FARKLI bir mekanizmadır — ikisini karıştırmak
  sessiz hatalara yol açar.**
- **Yanlış hücre sayıları (Oturum 29, aynı kök neden).** `[N,N]`
  çiftlerini `areaBlastCells()`'e beslemek `nRows+nCols-1` formülünü
  tetikliyordu (örn. `[4,4]`→7 hücre), ama kullanıcının "N hücre"
  ifadesi `crossOffsets(N)`'in `2*(N-1)` formülünü kastediyordu (örn.
  N=4→6 hücre). Aynı düzeltmeyle (`crossOffsets()` kullanımı) çözüldü.

- **"GameCore is not defined"** — build manifest sırası: bootstrap.js
  sonunda açılan IIFE, game-engine.js'in son satırında kapanıyor.
  `economy/energy-shop.js` gibi `GameCore.prototype` ekleyen dosyalar
  bu ikisinin ARASINDA olmalı, SONRASINDA değil.
- **Patlama animasyonu görünmüyordu** — `render()` senkron çağrılıp
  animasyonu kesiyordu, kum saatinin 1400ms bekleme desenine göre
  düzeltildi.
- **CHAPTER_DB↔generateLevel senkron değildi** — level 1 için 630 vs
  441 gibi farklı hedefler (yukarıda çözüldü).
- **ui/screens.js'te 8-bölümlük, level 70'e kadar giden AYRI bir
  CHAPTERS listesi vardı** — 20 bölümlük asıl veriden bağımsızdı,
  level 71+ oyuncular yanlış bölüm adı görüyordu. Düzeltildi.
- **flow/ ayrımı sırasında (Oturum 23) `_lastRenderedScreen`/
  `_boardListenerAttached`/`_boardListenerEl` yanlışlıkla silindi** —
  bu üç değişken `executeMove`/`checkAndTransition` bloğunun ARASINDA
  duruyordu ama flow mantığının parçası değildi (ui/renderer.js
  kullanıyor). `node build/build.js` runtime kontrolü anında yakaladı.
  Ders: büyük bir bloğu tek seferde keserken aradaki "yabancı" kod
  parçalarına dikkat et — sadece fonksiyon sınırlarına değil.
- **🔴 KRİTİK (Oturum 26) — kayıp ekranına HİÇ geçilmiyordu.**
  `checkAndTransition()` `gc.status==="lost"` olunca `state.screen`'i
  asla `"lose"` yapmıyordu — oyuncu hedefe ulaşamayınca donmuş bir
  tahtada, geri bildirimsiz kalıyordu. `renderLose()` tam/çalışır
  haldeydi ama hiç çağrılamıyordu. Kök neden: `_checkNearMiss()`'in
  kendi ilk satırı (`gc.status!=="in_progress" → return false`) onu
  çağıran her yerde kendi kendini engelliyordu. DÜZELTİLDİ:
  `flow/transitionFlow.js`'de artık `state.screen="lose"` atanıyor,
  near-miss de "Tasarım B"ye göre yeniden yazıldı ve jsdom ile uçtan
  uca doğrulandı (bkz. README.md Oturum 26). Otomatik testler bunu HİÇ
  yakalayamazdı çünkü F9Bot/benchmark `gc.status`'a bakıyor,
  `state.screen`'e değil.
- **Tüp (can) tükenmesi sırasında state senkron kaybı (Oturum 26,
  jsdom testiyle bulundu).** `newLevel()` eskiden `state.levelGoal`/
  `state.cfg`'yi tüp kontrolünden ÖNCE güncelliyordu — tüp yoksa
  fonksiyon `showNoTubesModal()` sonrası erken dönüyordu ama
  `state.gc` (eski levelin GameCore'u) hiç değişmiyordu. Yani tüpler
  tam o an biterse `state.levelGoal/cfg` (yeni level) ile `state.gc`
  (eski level) anlık olarak birbirinden ayrışıyordu. DÜZELTİLDİ: tüp
  kontrolü artık state.levelGoal/cfg güncellenmeden ÖNCE yapılıyor.
- **🔴 KRİTİK (Oturum 44) — `fusion9_clean.html` `file://` ile (çift
  tıklayıp) açılınca TAMAMEN BOŞ kalıyordu.** `debug/debug.js`'teki
  `F9Debug` modülü, dosya yüklenir yüklenmez (modül-seviyesi, gecikmeli
  değil) `localStorage.getItem("f9debug")`'a **try/catch OLMADAN**
  erişiyordu. `file://` protokolünde bazı ortamlar localStorage'ı
  "opaque origin" kısıtlamasıyla engelleyip `SecurityError` fırlatıyor
  — bu YAKALANMADIĞI için TÜM script çöküyordu (`F9Debug` hiç
  tanımlanmıyordu, her yerde `F9Debug.log(...)` çağrıldığı için
  pratikte hiçbir satır çalışamıyordu). `node build/build.js` bunu
  YAKALAYAMAZ (Node'da sahte/stub localStorage kullanıyor, hiç throw
  etmiyor) — SADECE gerçek `file://` testiyle bulunabilirdi (jsdom ile
  `url:"file:///..."` simülasyonu). DÜZELTİLDİ: `try/catch` eklendi.
  Diğer TÜM localStorage çağrıları (save-manager, `_storageOk` testi,
  director) zaten korunuyordu — sadece bu satır korumasızdı.
- **🔴 KRİTİK (Oturum 45) — Churn DDA sonrası oyuncu hedefi AŞSA BİLE
  kaybediyordu.** Kullanıcı ekran görüntüsüyle bulundu: skor 1420,
  hedef görünüşte 630 (%225 ilerleme) ama "Yeterli Puan Yok!" (kayıp)
  gösteriliyordu. Kök neden: `F9Churn.applyChurnDDA()` (aynı levelde
  3+ kayıptan sonra hedefi düşüren yardım sistemi) `state.cfg.
  targetScore`/`state.gc.targetScore`'u güncelliyordu ama
  `state.levelGoal.value`'ya (checkAndTransition()'ın GERÇEK karar
  kaynağı) HİÇ DOKUNMUYORDU — ekranda düşük/kolay hedef görünürken,
  gerçek kazanma kontrolü hâlâ eski/yüksek değere göre yapılıyordu.
  Ayrıca `renderWin/renderLose`/skor barı `state.cfg?.targetScore ||
  630` (BASE_TARGET_SCORE ile aynı sayı) kullanıyordu — `state.cfg`
  tanımsız kalırsa ekranda YANLIŞ bir sayı (630) görünüyordu. Bu,
  Oturum 18'in "duality" hata sınıfının bir başka örneği. DÜZELTİLDİ:
  (1) `applyChurnDDA` sonrası `state.levelGoal.value` de senkronize
  ediliyor, (2) `renderWin`/`renderLose`/skor barı artık HEP
  `state.levelGoal?.value` öncelikli okuyor. jsdom ile gerçek churn
  senaryosu simüle edilip doğrulandı.
- **🔴 KRİTİK (Oturum 49) — AYNI belirti (skor hedefi aşsa da kayıp)
  Oturum 45'in düzeltmesine RAĞMEN tekrar bildirildi — TAMAMEN AYRI,
  daha temel bir kök neden bulundu.** "OYNA" butonunun (`ui/screens.js`,
  `btn-start-game` click handler'ı) İÇİNDE, `newLevel()`'ın zaten doğru
  kurduğu cfg/gc/levelGoal'ın ÜZERİNE DUPLICATE bir kurulum bloğu vardı:
  sabit `seed=7` (Oturum 43'ün BAKED_REFERENCE_SEED'ini yok sayıyordu),
  `getLevelGoal()`'dan HAM `goal.value` okuyordu (Oturum 18'den beri
  "score" tipi hedefler `.value` tutmadığı için hep `undefined` —
  `gc.score >= undefined` HER ZAMAN false, oyuncu ASLA kazanamıyordu),
  üstüne yeni bir GameCore kurup `newLevel()`'ın doğru `state.gc`'sini
  çöpe atıyor, tüpü İKİNCİ KEZ düşürüyordu. DÜZELTİLDİ: duplicate blok
  kaldırıldı, buton artık sadece ekran geçişi yapıyor. jsdom ile GERÇEK
  `btn-start-game` tıklaması simüle edilip doğrulandı — hedefin 50
  üzerinde skorla artık doğru "won" veriyor. Oturum 45'in düzeltmesini
  GEÇERSİZ KILMIYOR — iki FARKLI kod yolundaki bağımsız hatalardı.
- **🔴🔴 KRİTİK REGRESYON (Oturum 50) — Oturum 49'un çözümü oyunu
  TAMAMEN AÇILMAZ HALE GETİRMİŞTİ.** Oturum 49'un TEŞHİSİ doğruydu ama
  ÇÖZÜMÜ (kodu "duplicate" varsayıp TAMAMEN SİLMEK) yanlıştı —
  `newLevel()` gerçek oyuncu akışında (menü→harita→level_start→OYNA)
  HİÇBİR YERDE çağrılmıyordu (grep ile TÜM kod tabanında doğrulandı).
  Silinen kod, HATALI OLSA DA, `state.gc`'yi kuran TEK YERDİ — silinince
  `state.gc` hiç kurulmuyor, `render()` her zaman `renderMenu()`'ya
  düşüyor, oyun HİÇ AÇILMIYORDU. DÜZELTİLDİ: eski kodun yerine GERÇEK
  `newLevel()` çağrısı eklendi. jsdom ile tam tıklama akışıyla
  doğrulandı (board 64 hücreyle render oluyor, gerçek hamle çalışıyor).
  **Ders:** "bu kod duplicate" varsayımı, TÜM çağrı noktaları grep ile
  doğrulanmadan asla yapılmamalı.
- **🔴 KRİTİK (Oturum 46) — Debug panelindeki bot butonları 3 ZİNCİRLEME
  hata içeriyordu.** (1) `F9Bot`/`F9Debug`/`F9Report` hiçbir zaman
  `window`'a açılmamıştı — panel butonları `onclick="F9Bot...."` HTML
  string attribute'u kullanıyordu (global kapsamda çalışır, IIFE
  closure'ına erişemez) → "F9Bot is not defined". (2) Düzeltilince
  ortaya çıktı: `_stepLevel()` (debug/bot.js) F9Debug'ın (AYRI IIFE)
  private `_currentTab`'ına erişmeye çalışıyordu → "_currentTab is not
  defined". (3) O da düzeltilince ortaya çıktı: `startNewLevel(...)`
  diye bir fonksiyon kod tabanında hiç yok, gerçek fonksiyon
  `newLevel(levelNumber)` — ayrıca yanındaki `generateLevel(...,0)`
  çağrısı seed=0 kullanıp Oturum 43'ün BAKED_REFERENCE_SEED mantığını
  atlıyordu. Üçü de düzeltildi, jsdom ile uçtan uca gerçek bot oturumu
  (level başlat→bot çalıştır→kazan→sonraki level) doğrulandı. SADECE
  debug panelini etkiliyordu, normal oyuncu deneyimi etkilenmedi.
- **🟡 F9Bot'un "zincir potansiyeli" sezgisi SADECE yatay tarıyordu
  (Oturum 31, şekil kapsama raporu sırasında bulundu).** `debug/bot.js`
  `_scoreMove()` dikey yönde hiç kontrol yapmıyordu — bot sürekli
  yatay 9 dizileri kurmaya itiliyordu (line3_h:line3_v oranı 74:1).
  DÜZELTİLDİ: dikey tarama eklendi. **ÖNEMLİ SONUÇ:** bu düzeltme
  F9Bot'u GENEL OLARAK daha iyi oynatıyor — kazanma oranı %30.7→%39.0
  yükseldi. Oturum 24/29'daki denge ölçümleri kısmen bu yanlı botla
  yapılmıştı; kararların kendisi geçersiz değil ama altındaki ölçüm
  artık daha güvenilir. Gelecekte büyük bir denge kararı verilecekse
  bu düzeltilmiş botla TAZE ölçüm alınmalı.

## Doğrulama iş akışı (HER değişiklikten sonra bunu çalıştır)

```bash
cd fusion9-src2
node build/build.js                              # sözdizimi + çalışma zamanı testi
node debug/benchmark/build-headless-engine.js     # headless motor paketi
node debug/benchmark/run-benchmark.js 1 100 10 pro   # davranış testi
node debug/benchmark/perf-measure.js 100 10          # Oturum 26 — gerçek performans ölçümü
node debug/benchmark/shape-coverage-report.js 1 100 20 pro  # Oturum 31 — level bazlı şekil kullanım raporu
node debug/benchmark/strategic-shape-bot.js all              # YENİ (Oturum 32) — tüm şekiller gerçek swap ile inşa edilebiliyor mu?
node debug/benchmark/strategic-shape-bot.js chain             # YENİ (Oturum 32) — tam terfi zinciri (bakır→...→Matrix)
node debug/build-shape-lab.js                                  # Oturum 33/35 — 48-model kontrol paneli üretir (debug/shape-lab.html)
# Eskisiyle karşılaştır:
node debug/benchmark/compare-benchmark.js <eski.json> <yeni.json>
```

**⚠️ `node build/build.js` yeterli DEĞİL — Node'da localStorage SAHTE
(stub), gerçek `file://` kısıtlamalarını (bkz. Oturum 44) YAKALAYAMAZ.**
`fusion9_clean.html`'e dokunan büyük bir değişiklikten sonra ARA SIRA
jsdom ile gerçek `file://` testi yapın:
```js
new JSDOM(html, { url: "file:///.../fusion9_clean.html", runScripts:"dangerously", ... })
```
Root'un boş kalmadığını (`f9-root` içeriği > 0) doğrulayın.

**⚠️ CLI argüman sırasına dikkat — ikisi FARKLI:**
- `run-benchmark.js [start] [end] [runsPerLevel] [profile]`
- `level-balance-report.js [gamesPerLevel] [profile]` (level aralığı hep 1-100 sabit)
Bu ikisini karıştırmak (Oturum 26'da bende olduğu gibi) sessizce
yanlış/anlamsız sonuç üretir — hata vermez, sadece `profil` argümanı
geçersiz bir string olur ve varsayılana düşer.

`build/manifest.js` — dosya yükleme sırasının TEK kaynağı (hem build.js
hem headless bundle bunu kullanır, elle iki yerde tutmuyoruz artık).

## Kalan açık adımlar

> (flow/ ayrımı → Oturum 23 TAMAMLANDI; Evolution tablosu → Oturum 24
> DONDURULDU (sonra Oturum 29'da kullanıcı kararıyla güncellendi);
> name/theme dublikasyonu → Oturum 25 ÇÖZÜLDÜ; eşleşme şekilleri →
> Oturum 30 kullanıcı verisiyle YENİDEN YAZILDI; bake pipeline → Oturum
> 43'te YETKİLİ YAPILDI. Bkz. yukarıdaki "En kritik kararlar" madde
> 8/9/13/14/15 ve README.md Oturum 23/24/25/29/30/43.)

1. **İlk 100 level'in öğretici/bakır/bronz/gümüş/altın ilerleme eğrisini
   tasarlamak** — artık bake pipeline'ın "yetkili" olması (Oturum 43)
   sayesinde YAPILABİLİR (level 1-100 artık gerçekten sabit/tasarlanabilir)
   — ama eğrinin KENDİSİ (hangi level'da hangi kademe hediyeye ağırlık
   verilsin) henüz tasarlanmadı, ayrı bir ürün kararı.
2. **32/42 eşleşme şeklinin (çoğunlukla 4-7'li bloklar) greedy/basit
   oynayışta neredeyse hiç oluşmaması (Oturum 31'de bulundu) — Oturum
   32'de ÇÖZÜLDÜ:** stratejik inşa botu (`debug/benchmark/
   strategic-shape-bot.js`) 35/36 sabit şekli VE tam terfi zincirini
   GERÇEK swap hamleleriyle başarıyla inşa etti — hepsi teorik olarak
   ERİŞİLEBİLİR, sadece greedy/rastgele oynayışta doğal olarak nadir.
3. **~~YENİ (Oturum 32) — `b4_05`/`b4_07` aynı 4 hücreyi paylaşıyor,
   `b4_07` yapısal olarak asla tetiklenemez.~~ → ÇÖZÜLDÜ (Oturum 61,
   NİHAİ).** İki aşamalı geçmiş: Oturum 60'ta önce `LINE_4`'teki
   "tek şekil + spawn seçim mekanizması" deseni denendi (`b4_dual`) —
   çalışıyordu ama kullanıcı "gereksiz karmaşık, b4_07 gerçekten farklı
   bir şekil olsun" dedi. Oturum 61'de `b4_07`, `b4_06`'nın GERÇEK
   aynası (sütun ekseninde, `c→1-c`) olarak yeniden tanımlandı: hücreler
   `[[0,1],[1,1],[2,1],[2,0]]`, spawn `(2,1)`. Kullanıcının ilk önerdiği
   ham koordinatlar `(0,0)(1,0)(1,1)(1,2)` kontrol edilince `b4_11` ile
   birebir çakıştığı bulundu (AYNI hata, farklı çift) — düzeltilmiş
   ayna kullanıldı. `b4_dual`/`B4_DUAL_*` tamamen geri alındı,
   `debug/benchmark/shape-coverage-report.js`, `strategic-shape-bot.js`,
   `debug/build-shape-lab.js` orijinal 36 sabit şekil + 12 çizgi
   varyasyonu haline döndü. **Doğrulama:** tüm 36 şeklin hücreleri
   birbiriyle programatik olarak karşılaştırıldı (çakışma YOK, spawn
   her zaman kendi şeklinin İÇİNDE, hücre sayıları grup ile tutarlı),
   `strategic-shape-bot.js all` → 36/36 gerçek swap hamleleriyle
   başarıyla inşa edildi.

   **⚠️ ÖNEMLİ — kullanıcının ana referans listesiyle KASITLI ayrım:**
   Kullanıcının elindeki tam 48-model listesi (3'lü×10, 4'lü×16, 5'li×14,
   6'lı×4, 7'li×4) TEK TEK koddaki her şekille karşılaştırıldı — 47/48
   birebir örtüşüyor. **Tek istisna `b4_07`:** kullanıcının ana
   listesinde HÂLÂ eski/hatalı haliyle duruyor (`(0,0)(0,1)(1,1)(2,1)
   -> (0,1)`, yani `b4_05` ile aynı hücreler). Kullanıcıya soruldu,
   açıkça onayladı: **"mevcut düzeltmeyi (b4_06'nın aynası) koru, ana
   liste zaten hatalıymış."** Yani koddaki `b4_07` BİLEREK ana referans
   listesinden farklı — bu bir hata DEĞİL, kullanıcı kararı. Ana liste
   güncellenmedi (kullanıcının elinde, bu repo'nun dışında). Gelecekte
   biri ana listeyle kodu karşılaştırıp "tutmuyor" derse, bu not
   geçerli açıklamadır — kodu geri "düzeltmeye" kalkma.

## Dosya haritası (hızlı referans)

```
fusion9-src2/
├─ README.md              ← TAM oturum geçmişi (1100+ satır)
├─ build/
│  ├─ manifest.js          ← TEK doğruluk kaynağı: dosya yükleme sırası
│  └─ build.js             ← üretim HTML'ini derler + 3 katmanlı doğrulama
├─ core/                   ← Board, GameCore, bootstrap, event-bus.js (Oturum 52), game-engine.js (saf motor + state)
├─ flow/                   ← moveFlow, levelFlow, rewardFlow, transitionFlow (Oturum 23)
├─ engine/                 ← matchEngine, evolutionEngine, elementEngine, rng
├─ rules/                  ← 8 dosya: tüm sabitler (mekanizma fonksiyonlarından ayrı)
├─ features/                ← blockers, wave, hint, dda, hourglass, league
├─ economy/                 ← energy-shop, EnergyTracker, (rewardRules rules/'da)
├─ ui/                      ← screens.js (16 fonksiyon), renderer.js (8 fonksiyon)
├─ fx/                      ← assets.js, audio.js(genişletildi), blast-fx.js,
│                              camera.js, particles.js, combo.js, juice.js,
│                              game-feel.js (Oturum 47 — Game Feel Engine v1.0)
├─ content/                 ← worlds, levels (CHAPTER_DB + bake-pipeline), rewards, blockers, missions(TODO)
├─ save/                    ← save-manager.js
└─ debug/
   ├─ debug.js, bot.js, director.js, analytics.js
   ├─ build-shape-lab.js       ← Oturum 33/35: 48-model kontrol paneli üretici (çıktı: shape-lab.html, statik HTML, gerçek board.fillInitial() dizilimi)
   └─ benchmark/            ← build-headless-engine.js, run-benchmark.js,
                                compare-benchmark.js, large-scale-simulation.js,
                                shape-coverage-report.js (Oturum 31),
                                strategic-shape-bot.js (Oturum 32),
                                baselines/ (kaydedilmiş referans sonuçlar)
```
