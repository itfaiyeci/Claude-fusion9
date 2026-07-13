// [Oturum 17 — content/ katmanı] Kilometre taşı (milestone) ödülleri.
// core/game-engine.js'in generateLevel() fonksiyonu içinden taşındı
// (yerel değişkendi, artık üst-seviye/paylaşılan sabit).

const MILESTONES={
    10:  {type:"yeni_mekanik", msg:"Bakır Hediye Taşı Kilidi Açıldı!", icon:"🥉"},
    25:  {type:"yeni_engel",   msg:"Buz Engeli Sahneye Çıktı!",        icon:"🧊"},
    50:  {type:"yeni_mekanik", msg:"Kum Saati Aktif Oldu!",            icon:"⏳"},
    100: {type:"yeni_engel",   msg:"Çelik Engel Kilidi Açıldı!",       icon:"🔒"},
    150: {type:"bonus",        msg:"Enerji Kapasitesi +10 Artırıldı!", icon:"⚡"},
    200: {type:"yeni_mekanik", msg:"Elmas Kalkanı Açıldı!",            icon:"💎"},
    250: {type:"bonus",        msg:"Günlük Bonus ×2 Oldu!",            icon:"🎁"},
    300: {type:"yeni_engel",   msg:"Sis Engeli Sahneye Çıktı!",        icon:"🌫️"},
    500: {type:"boss",         msg:"Efsane Modu Kilidi Açıldı!",       icon:"👑"},
  };
