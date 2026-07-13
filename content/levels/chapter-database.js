// [Oturum 18 — content/ katmanı, kullanıcı kararı] Level bazlı GÖREV
// TİPİ verisi. core/game-engine.js'ten taşındı.
//
// ✅ ÇÖZÜLDÜ (Oturum 17'de bulunan "duality" sorunu): kullanıcı kararı
// gereği generateLevel() TEK yetkili kaynak — moves/targetScore/
// blockerDensity/pattern SADECE oradan gelir. Bu dosya artık SADECE:
//   - goal.type (score/create9/giftCount/breakBlockers)
//   - "score" DIŞINDAKİ tiplerde goal.value (generateLevel'ın karşılığı
//     yok — create9/giftCount/breakBlockers hedefleri burada tanımlı kalır)
// tutuyor. "score" tipinde value ARTIK YOK — çalışma zamanında
// generateLevel()'ın gerçek targetScore'undan senkronize ediliyor
// (bkz. core/game-engine.js newLevel() içindeki senkronizasyon satırı).
//
// moves ve blockerTypes de KALDIRILDI — moves generateLevel()'dan gelir,
// blockerTypes zaten content/blockers/chapter-blocker-pools.js'te
// chapter numarasına göre tanımlı (burada tekrarlamaya gerek yok).
//
// ✅ ÇÖZÜLDÜ (Oturum 25 — name/theme dublikasyonu): bu dosyada eskiden
// her chapter girdisinin kendi `name`/`theme` kopyası vardı,
// `content/worlds/world-metadata.js`'teki WORLD_DATABASE ile elle
// senkron tutuluyordu (bkz. HANDOFF.md "açık soru #2"). Kod taraması
// gösterdi ki bu alanlar TAMAMEN ÖLÜYDÜ: `theme` hiçbir yerde
// okunmuyordu, `name` ise getLevelGoal()'da `chapterName` olarak
// dönüyordu ama o da hiçbir UI kodunda tüketilmiyordu (ui/screens.js
// zaten doğrudan WORLD_DATABASE/worldForLevel() kullanıyor). İkisi de
// KALDIRILDI — artık tek kaynak WORLD_DATABASE (bkz. getLevelGoal()'daki
// worldForLevel() çağrısı, core/game-engine.js).

const CHAPTER_DB = [
  { chapter:1,
    levels: Array.from({length:10},(_,i)=>({
      level:1+i, goal:{ type:"score" },
    }))},

  { chapter:2,
    levels: Array.from({length:10},(_,i)=>({
      level:11+i, goal:{ type:"create9", value: 3 + Math.floor(i/3) },
    }))},

  { chapter:3,
    levels: Array.from({length:10},(_,i)=>({
      level:21+i, goal:{ type:"giftCount", value: 2 + Math.floor(i/4) },
    }))},

  { chapter:4,
    levels: Array.from({length:10},(_,i)=>({
      level:31+i, goal:{ type:"breakBlockers", value: 2 + Math.floor(i/3) },
    }))},

  { chapter:5,
    levels: Array.from({length:10},(_,i)=>({
      level:41+i, goal:{ type:"score" },
    }))},

  { chapter:6,
    levels: Array.from({length:10},(_,i)=>({
      level:51+i,
      goal: i%3===0 ? { type:"create9", value:6 }
          : i%3===1 ? { type:"giftCount", value:4 }
          : { type:"score" },
    }))},

  { chapter:7,
    levels: Array.from({length:10},(_,i)=>({
      level:61+i, goal:{ type:"breakBlockers", value: 5 + Math.floor(i/2) },
    }))},

  { chapter:8,
    levels: Array.from({length:10},(_,i)=>({
      level:71+i, goal:{ type:"score" },
    }))},

  { chapter:9,
    levels: Array.from({length:10},(_,i)=>({
      level:81+i,
      goal: i%2===0 ? { type:"giftCount", value: 5+Math.floor(i/3) }
                    : { type:"breakBlockers", value: 8+Math.floor(i/2) },
    }))},

  { chapter:10,
    levels: Array.from({length:10},(_,i)=>({
      level:91+i, goal:{ type:"score" },
    }))},

  { chapter:11,
    levels: Array.from({length:10},(_,i)=>({
      level:101+i,
      goal: i%3===0 ? { type:"create9", value:8 }
          : i%3===1 ? { type:"score" }
          : { type:"breakBlockers", value: 10+Math.floor(i/2) },
    }))},

  { chapter:12,
    levels: Array.from({length:10},(_,i)=>({
      level:111+i, goal:{ type:"score" },
    }))},

  { chapter:13,
    levels: Array.from({length:10},(_,i)=>({
      level:121+i,
      goal: i%2===0 ? { type:"giftCount", value: 6+Math.floor(i/3) }
                    : { type:"breakBlockers", value: 12+Math.floor(i/2) },
    }))},

  { chapter:14,
    levels: Array.from({length:10},(_,i)=>({
      level:131+i, goal:{ type:"score" },
    }))},

  { chapter:15,
    levels: Array.from({length:10},(_,i)=>({
      level:141+i,
      goal: i%3===0 ? { type:"create9", value:10 }
          : i%3===1 ? { type:"giftCount", value:8 }
          : { type:"score" },
    }))},

  { chapter:16,
    levels: Array.from({length:10},(_,i)=>({
      level:151+i, goal:{ type:"score" },
    }))},

  { chapter:17,
    levels: Array.from({length:10},(_,i)=>({
      level:161+i,
      goal: i%2===0 ? { type:"breakBlockers", value: 15+i }
                    : { type:"score" },
    }))},

  { chapter:18,
    levels: Array.from({length:10},(_,i)=>({
      level:171+i,
      goal: i%3===0 ? { type:"giftCount", value:9 }
          : i%3===1 ? { type:"create9", value:12 }
          : { type:"score" },
    }))},

  { chapter:19,
    levels: Array.from({length:10},(_,i)=>({
      level:181+i, goal:{ type:"score" },
    }))},

  // ─── ADA 20-∞: EFSANE KULE (Sonsuz) ─────────────────────────────
  { chapter:20,
    levels: Array.from({length:9999},(_,i)=>({
      level:191+i,
      goal: i%5===0 ? { type:"giftCount", value: Math.min(20,8+Math.floor(i/15)) }
          : i%5===1 ? { type:"create9", value: Math.min(18,10+Math.floor(i/20)) }
          : i%5===2 ? { type:"breakBlockers", value: Math.min(25,12+Math.floor(i/10)) }
          : i%5===3 ? { type:"giftCount", value: Math.min(15,6+Math.floor(i/12)) }
          : { type:"score" },
    }))},
];
