// [Oturum 20 — Bake Pipeline] Level 1-100 için DONDURULMUŞ referans veri.
// content/levels/bake-pipeline.js tarafından ÜRETİLDİ — elle DÜZENLEMEYİN,
// yeniden üretmek için: node content/levels/bake-pipeline.js
//
// Referans seed: 1
// Üretim tarihi: 2026-07-06T19:08:31.495Z
//
// ⚠️ RUNTIME DAVRANIŞI NOTU: Bu dosya şu an SADECE referans/analiz için —
// oyunun kendisi hâlâ generateLevel(n, state.seed) çağırıyor (oyuncuya
// özel seed ile, çeşitlilik için). Bu dosyayı motora BAĞLAMAK (yani
// "level 37'de her zaman bu dondurulmuş veriyi kullan" demek) ayrı bir
// karar gerektirir çünkü şu anki tasarım her oyuncuya FARKLI bir tahta
// diziliminin üretilmesine izin veriyor (state.seed oyuncuya özel).
// Eğer TÜM oyuncuların level 37'de AYNI tahtayı görmesi isteniyorsa
// (çoğu match-3 oyununda böyledir — level dengesi için), bu dosya
// gerçekten "yetkili" hale getirilmeli. Bu bir tasarım kararı, kod
// değişikliği değil — bkz. README.md "Bake Pipeline — açık soru".
const BAKED_LEVELS_1_100 = {
  "1": {
    "level": 1,
    "moves": 16,
    "targetScore": 441,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "2": {
    "level": 2,
    "moves": 16,
    "targetScore": 504,
    "pattern": "pyramid",
    "density": 0.15,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "3": {
    "level": 3,
    "moves": 16,
    "targetScore": 567,
    "pattern": "pyramid",
    "density": 0.35,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "4": {
    "level": 4,
    "moves": 16,
    "targetScore": 788,
    "pattern": "pyramid",
    "density": 0.55,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 9
  },
  "5": {
    "level": 5,
    "moves": 16,
    "targetScore": 348,
    "pattern": "pyramid",
    "density": 0.48,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 4
  },
  "6": {
    "level": 6,
    "moves": 16,
    "targetScore": 310,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "7": {
    "level": 7,
    "moves": 16,
    "targetScore": 546,
    "pattern": "pyramid",
    "density": 0.16,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "8": {
    "level": 8,
    "moves": 16,
    "targetScore": 614,
    "pattern": "pyramid",
    "density": 0.37,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "9": {
    "level": 9,
    "moves": 16,
    "targetScore": 853,
    "pattern": "pyramid",
    "density": 0.58,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "10": {
    "level": 10,
    "moves": 16,
    "targetScore": 290,
    "pattern": "pyramid",
    "density": 0.51,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": {
      "type": "yeni_mekanik",
      "msg": "Bakır Hediye Taşı Kilidi Açıldı!",
      "icon": "🥉"
    },
    "blockerCells": 9
  },
  "11": {
    "level": 11,
    "moves": 16,
    "targetScore": 324,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "12": {
    "level": 12,
    "moves": 16,
    "targetScore": 570,
    "pattern": "pyramid",
    "density": 0.16,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "13": {
    "level": 13,
    "moves": 16,
    "targetScore": 642,
    "pattern": "pyramid",
    "density": 0.38,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "14": {
    "level": 14,
    "moves": 16,
    "targetScore": 891,
    "pattern": "pyramid",
    "density": 0.6,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "15": {
    "level": 15,
    "moves": 16,
    "targetScore": 591,
    "pattern": "pyramid",
    "density": 0.52,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 16
  },
  "16": {
    "level": 16,
    "moves": 16,
    "targetScore": 334,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "17": {
    "level": 17,
    "moves": 16,
    "targetScore": 588,
    "pattern": "pyramid",
    "density": 0.17,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "18": {
    "level": 18,
    "moves": 16,
    "targetScore": 661,
    "pattern": "pyramid",
    "density": 0.39,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "19": {
    "level": 19,
    "moves": 16,
    "targetScore": 919,
    "pattern": "pyramid",
    "density": 0.61,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "20": {
    "level": 20,
    "moves": 16,
    "targetScore": 312,
    "pattern": "pyramid",
    "density": 0.53,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 9
  },
  "21": {
    "level": 21,
    "moves": 16,
    "targetScore": 342,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "22": {
    "level": 22,
    "moves": 16,
    "targetScore": 601,
    "pattern": "pyramid",
    "density": 0.17,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "23": {
    "level": 23,
    "moves": 16,
    "targetScore": 677,
    "pattern": "pyramid",
    "density": 0.4,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "24": {
    "level": 24,
    "moves": 16,
    "targetScore": 940,
    "pattern": "pyramid",
    "density": 0.62,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "25": {
    "level": 25,
    "moves": 16,
    "targetScore": 415,
    "pattern": "pyramid",
    "density": 0.54,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": {
      "type": "yeni_engel",
      "msg": "Buz Engeli Sahneye Çıktı!",
      "icon": "🧊"
    },
    "blockerCells": 9
  },
  "26": {
    "level": 26,
    "moves": 16,
    "targetScore": 348,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "27": {
    "level": 27,
    "moves": 16,
    "targetScore": 612,
    "pattern": "pyramid",
    "density": 0.17,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "28": {
    "level": 28,
    "moves": 16,
    "targetScore": 689,
    "pattern": "pyramid",
    "density": 0.4,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "29": {
    "level": 29,
    "moves": 16,
    "targetScore": 957,
    "pattern": "pyramid",
    "density": 0.63,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "30": {
    "level": 30,
    "moves": 16,
    "targetScore": 488,
    "pattern": "pyramid",
    "density": 0.55,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 16
  },
  "31": {
    "level": 31,
    "moves": 16,
    "targetScore": 354,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "32": {
    "level": 32,
    "moves": 16,
    "targetScore": 622,
    "pattern": "pyramid",
    "density": 0.17,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "33": {
    "level": 33,
    "moves": 16,
    "targetScore": 699,
    "pattern": "pyramid",
    "density": 0.4,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "34": {
    "level": 34,
    "moves": 16,
    "targetScore": 971,
    "pattern": "pyramid",
    "density": 0.64,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "35": {
    "level": 35,
    "moves": 16,
    "targetScore": 429,
    "pattern": "pyramid",
    "density": 0.55,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 9
  },
  "36": {
    "level": 36,
    "moves": 16,
    "targetScore": 358,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "37": {
    "level": 37,
    "moves": 16,
    "targetScore": 630,
    "pattern": "pyramid",
    "density": 0.17,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 1
  },
  "38": {
    "level": 38,
    "moves": 16,
    "targetScore": 708,
    "pattern": "pyramid",
    "density": 0.41,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 4
  },
  "39": {
    "level": 39,
    "moves": 16,
    "targetScore": 984,
    "pattern": "pyramid",
    "density": 0.64,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 16
  },
  "40": {
    "level": 40,
    "moves": 16,
    "targetScore": 335,
    "pattern": "pyramid",
    "density": 0.56,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 9
  },
  "41": {
    "level": 41,
    "moves": 16,
    "targetScore": 362,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "42": {
    "level": 42,
    "moves": 16,
    "targetScore": 637,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "43": {
    "level": 43,
    "moves": 16,
    "targetScore": 716,
    "pattern": "fibonacci",
    "density": 0.41,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "44": {
    "level": 44,
    "moves": 16,
    "targetScore": 995,
    "pattern": "fibonacci",
    "density": 0.65,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "45": {
    "level": 45,
    "moves": 16,
    "targetScore": 660,
    "pattern": "fibonacci",
    "density": 0.56,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 5
  },
  "46": {
    "level": 46,
    "moves": 16,
    "targetScore": 366,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "47": {
    "level": 47,
    "moves": 16,
    "targetScore": 643,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "48": {
    "level": 48,
    "moves": 16,
    "targetScore": 724,
    "pattern": "fibonacci",
    "density": 0.41,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "49": {
    "level": 49,
    "moves": 16,
    "targetScore": 1005,
    "pattern": "fibonacci",
    "density": 0.65,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "50": {
    "level": 50,
    "moves": 16,
    "targetScore": 342,
    "pattern": "fibonacci",
    "density": 0.57,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": {
      "type": "yeni_mekanik",
      "msg": "Kum Saati Aktif Oldu!",
      "icon": "⏳"
    },
    "blockerCells": 7
  },
  "51": {
    "level": 51,
    "moves": 16,
    "targetScore": 369,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "52": {
    "level": 52,
    "moves": 16,
    "targetScore": 649,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "53": {
    "level": 53,
    "moves": 16,
    "targetScore": 730,
    "pattern": "fibonacci",
    "density": 0.42,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "54": {
    "level": 54,
    "moves": 16,
    "targetScore": 1014,
    "pattern": "fibonacci",
    "density": 0.66,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "55": {
    "level": 55,
    "moves": 16,
    "targetScore": 448,
    "pattern": "fibonacci",
    "density": 0.57,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 7
  },
  "56": {
    "level": 56,
    "moves": 16,
    "targetScore": 372,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "57": {
    "level": 57,
    "moves": 16,
    "targetScore": 654,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "58": {
    "level": 58,
    "moves": 16,
    "targetScore": 736,
    "pattern": "fibonacci",
    "density": 0.42,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "59": {
    "level": 59,
    "moves": 16,
    "targetScore": 1022,
    "pattern": "fibonacci",
    "density": 0.66,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "60": {
    "level": 60,
    "moves": 16,
    "targetScore": 521,
    "pattern": "fibonacci",
    "density": 0.58,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 5
  },
  "61": {
    "level": 61,
    "moves": 16,
    "targetScore": 375,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "62": {
    "level": 62,
    "moves": 16,
    "targetScore": 659,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "63": {
    "level": 63,
    "moves": 16,
    "targetScore": 742,
    "pattern": "fibonacci",
    "density": 0.42,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "64": {
    "level": 64,
    "moves": 16,
    "targetScore": 1030,
    "pattern": "fibonacci",
    "density": 0.66,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "65": {
    "level": 65,
    "moves": 16,
    "targetScore": 455,
    "pattern": "fibonacci",
    "density": 0.58,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 7
  },
  "66": {
    "level": 66,
    "moves": 16,
    "targetScore": 377,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "67": {
    "level": 67,
    "moves": 16,
    "targetScore": 664,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "68": {
    "level": 68,
    "moves": 16,
    "targetScore": 747,
    "pattern": "fibonacci",
    "density": 0.42,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 6
  },
  "69": {
    "level": 69,
    "moves": 16,
    "targetScore": 1037,
    "pattern": "fibonacci",
    "density": 0.67,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "70": {
    "level": 70,
    "moves": 16,
    "targetScore": 353,
    "pattern": "fibonacci",
    "density": 0.58,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 7
  },
  "71": {
    "level": 71,
    "moves": 16,
    "targetScore": 380,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "72": {
    "level": 72,
    "moves": 16,
    "targetScore": 668,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "73": {
    "level": 73,
    "moves": 16,
    "targetScore": 751,
    "pattern": "fibonacci",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 6
  },
  "74": {
    "level": 74,
    "moves": 16,
    "targetScore": 1043,
    "pattern": "fibonacci",
    "density": 0.67,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "75": {
    "level": 75,
    "moves": 16,
    "targetScore": 692,
    "pattern": "fibonacci",
    "density": 0.58,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 5
  },
  "76": {
    "level": 76,
    "moves": 16,
    "targetScore": 382,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "77": {
    "level": 77,
    "moves": 16,
    "targetScore": 672,
    "pattern": "fibonacci",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "78": {
    "level": 78,
    "moves": 16,
    "targetScore": 756,
    "pattern": "fibonacci",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 6
  },
  "79": {
    "level": 79,
    "moves": 16,
    "targetScore": 1050,
    "pattern": "fibonacci",
    "density": 0.67,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 5
  },
  "80": {
    "level": 80,
    "moves": 16,
    "targetScore": 357,
    "pattern": "fibonacci",
    "density": 0.59,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 7
  },
  "81": {
    "level": 81,
    "moves": 16,
    "targetScore": 384,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "82": {
    "level": 82,
    "moves": 16,
    "targetScore": 675,
    "pattern": "prime",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "83": {
    "level": 83,
    "moves": 16,
    "targetScore": 760,
    "pattern": "prime",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 7
  },
  "84": {
    "level": 84,
    "moves": 16,
    "targetScore": 1055,
    "pattern": "prime",
    "density": 0.67,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 13
  },
  "85": {
    "level": 85,
    "moves": 16,
    "targetScore": 466,
    "pattern": "prime",
    "density": 0.59,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 9
  },
  "86": {
    "level": 86,
    "moves": 16,
    "targetScore": 386,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "87": {
    "level": 87,
    "moves": 16,
    "targetScore": 679,
    "pattern": "prime",
    "density": 0.18,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "88": {
    "level": 88,
    "moves": 16,
    "targetScore": 764,
    "pattern": "prime",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 7
  },
  "89": {
    "level": 89,
    "moves": 16,
    "targetScore": 1061,
    "pattern": "prime",
    "density": 0.68,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 14
  },
  "90": {
    "level": 90,
    "moves": 16,
    "targetScore": 541,
    "pattern": "prime",
    "density": 0.59,
    "tierName": "boss",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 14
  },
  "91": {
    "level": 91,
    "moves": 16,
    "targetScore": 388,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "92": {
    "level": 92,
    "moves": 16,
    "targetScore": 682,
    "pattern": "prime",
    "density": 0.19,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "93": {
    "level": 93,
    "moves": 16,
    "targetScore": 767,
    "pattern": "prime",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 7
  },
  "94": {
    "level": 94,
    "moves": 16,
    "targetScore": 1066,
    "pattern": "prime",
    "density": 0.68,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 14
  },
  "95": {
    "level": 95,
    "moves": 16,
    "targetScore": 471,
    "pattern": "prime",
    "density": 0.59,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": null,
    "blockerCells": 9
  },
  "96": {
    "level": 96,
    "moves": 16,
    "targetScore": 390,
    "pattern": null,
    "density": 0,
    "tierName": "nefes",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 0
  },
  "97": {
    "level": 97,
    "moves": 16,
    "targetScore": 685,
    "pattern": "prime",
    "density": 0.19,
    "tierName": "orta",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 3
  },
  "98": {
    "level": 98,
    "moves": 16,
    "targetScore": 771,
    "pattern": "prime",
    "density": 0.43,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 7
  },
  "99": {
    "level": 99,
    "moves": 16,
    "targetScore": 1071,
    "pattern": "prime",
    "density": 0.68,
    "tierName": "zor",
    "isBreathe": false,
    "milestone": null,
    "blockerCells": 14
  },
  "100": {
    "level": 100,
    "moves": 16,
    "targetScore": 364,
    "pattern": "prime",
    "density": 0.6,
    "tierName": "pro",
    "isBreathe": true,
    "milestone": {
      "type": "yeni_engel",
      "msg": "Çelik Engel Kilidi Açıldı!",
      "icon": "🔒"
    },
    "blockerCells": 10
  }
};
