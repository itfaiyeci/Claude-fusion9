// [Oturum 15 — Faz mimari] Kayıt (save) sistemi API'si.
// NOT: saveGame/loadGame burada TASLAK olarak tanımlanıyor,
// game-engine.js'in en sonunda (_storage hazır olduktan sonra)
// GERÇEK implementasyonla override ediliyor (bkz. o dosyadaki
// '_storageOk/_storage' bloğu — bu, uygulama başlatma sırasına
// sıkı bağlı olduğu için TAŞINMADI, sadece bu API taşındı).

// ── localStorage Kayıt Sistemi ─────────────────────────────
const SAVE_KEY = F9_CONFIG.SAVE_KEY;

// saveGame ve loadGame — _storage ile override edilecek (dosya sonunda)
// Şimdilik localStorage fallback
let saveGame = function() {
  const me = LEAGUE_BOARD.find(e => e.isMe);
  const data = {
    energy:        state.energyTracker.energy,
    xp:            state.xp || 0,
    playerLevel:   state.playerLevel || 1,
    avatar:        state.avatar || 0,
    lastLoginDate: state.lastLoginDate,
    loginStreak:   state.loginStreak,
    playerName:    state.playerName || "Oyuncu",
    leagueScore:   me ? me.score : 0,
    leagueTier:    state.league?.tier || "bronz",
    soundOn:       state._soundOn !== false,
    tubes:         state.tubes,
    lastTubeTime:  state.lastTubeTime,
    savedAt:       Date.now(),
    bestScore:     state.bestScore || {},
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
};

let loadGame = function() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
};

function applyLoad(data) {
  if (!data) { F9Debug.warn("applyLoad: data null/undefined"); return; }
  F9Debug.log("save", "Kayıt yüklendi", {lvl:data.levelNumber,energy:data.energy});
  state.levelNumber              = 1; // Her açılışta 1'den başla
  state.xp                       = parseInt(data.xp) || 0;
  state.playerLevel               = parseInt(data.playerLevel) || 1;
  state.avatar                    = parseInt(data.avatar) || 0;
  state.lastLoginDate            = data.lastLoginDate  || "";
  state.loginStreak              = Math.max(0, parseInt(data.loginStreak) || 0);
  state.playerName               = data.playerName     || "Oyuncu";
  state.energyTracker.energy     = Math.max(0, Number(data.energy) || 0);
  state.tubes = Math.min(Math.max(0, parseInt(data.tubes) ?? 3), state.maxTubes);
  if (data.bestScore && typeof data.bestScore === 'object') state.bestScore = data.bestScore;
  state.lastTubeTime             = data.lastTubeTime   || 0;
  const me = LEAGUE_BOARD.find(e => e.isMe);
  if (me) {
    me.score = Math.max(0, data.leagueScore || 0);
    me.name  = state.playerName || "Oyuncu";
  }
  // Her durumda sırala — me bulunsa da bulunmasa da
  LEAGUE_BOARD.sort((a,b) => b.score - a.score);
  // Lig tier'ı geri yükle
  if (data.leagueTier && state.league) state.league.tier = data.leagueTier;
  state._soundOn = data.soundOn !== false;
}


// ── Kayıt Dışa/İçe Aktar ─────────────────────────────
function exportSave() {
  const data = {
    v: 1,
    savedAt: new Date().toISOString(),
    energy:      state.energyTracker.energy,
    xp:          state.xp || 0,
    playerLevel: state.playerLevel || 1,
    avatar:      state.avatar || 0,
    lastLoginDate: state.lastLoginDate,
    loginStreak:  state.loginStreak,
    playerName:   state.playerName || "Oyuncu",
    leagueScore:  (LEAGUE_BOARD.find(e=>e.isMe)||{}).score || 0,
    leagueTier:   state.league?.tier || "bronz",
    soundOn:      state._soundOn !== false,
    tubes:        state.tubes,
    dda: {
      losses: dda.losses, totalPlayed: dda.totalPlayed, totalWon: dda.totalWon
    }
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fusion9_save_${Date.now()}.json`;
  a.click();
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.v) throw new Error("Geçersiz kayıt");
      applyLoad(data);
      if (data.dda) {
        dda.losses = data.dda.losses || 0;
        dda.totalPlayed = data.dda.totalPlayed || 0;
        dda.totalWon = data.dda.totalWon || 0;
      }
      saveGame(); saveDDA();
      alert("✅ Kayıt yüklendi!");
      state.screen = "menu"; render();
    } catch(err) {
      alert("❌ Geçersiz kayıt dosyası: " + err.message);
    }
  };
  reader.readAsText(file);
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}
