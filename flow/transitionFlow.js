// [Oturum 22 — flow/ katmanı ayrımı] Level sonu geçiş akışı.
// core/game-engine.js'ten TAŞINDI (bkz. HANDOFF.md "Flow Katmanı Eksik").
// Diğer flow/ dosyaları gibi ortak IIFE içinde yüklendiği için `state`
// gibi üst-seviye tanımlara erişebiliyor.
// SORUMLULUK: hamle bittiğinde won/lost değerlendirmesi, near-miss
// popup'ı (hedefe çok yakın kayıpta reklam-ile-devam teklifi) ve
// win/lose ekranına geçiş. flow/moveFlow.js ve flow/rewardFlow.js bu
// dosyadaki checkAndTransition()'ı çağırır; level yeniden başlatma
// flow/levelFlow.js'te.

// ── NEAR-MISS POPUP ─────────────────────────────────
// [Oturum 26 — YENİDEN TASARLANDI, kullanıcı kararı: "Tasarım B"]
// ESKİDEN bu fonksiyon "hamle bitmeden ÖNCE proaktif uyarı" (movesLeft
// 1-3 iken) modeline göre yazılmıştı, ama SADECE gc.status zaten
// "lost" olduktan SONRA (checkAndTransition'dan) çağrılıyordu — bu
// çelişki yüzünden hiç tetiklenmiyordu (bkz. HANDOFF.md "Bulunmuş
// hatalar"). Artık NİYET NET: oyuncu son hamlesini yapıp hedefe
// ulaşamayınca ("lost"), hedefe gerçekten yakınsa ("near miss"), kayıp
// ekranına geçmeden ÖNCE bu popup çıkar ve REKLAM İZLEYEREK devam
// (hamle alma) teklif eder — ücretsiz hamle YOK, mevcut
// watchAd()/GameCore.watchAdContinue() mekanizması kullanılıyor
// (flow/rewardFlow.js, economy/energy-shop.js — renderLose()'un kendi
// "Reklam izle" butonuyla AYNI mekanizma, tekrar icat edilmedi).
function _checkNearMiss(gc, cfg) {
  if (!gc || gc.status !== "lost") return false;

  // Modal zaten açıksa (bu render'dan önceki bir render'da oluşturulmuş
  // olabilir) TEKRAR true dön — checkAndTransition'ın modalı ezip
  // doğrudan "lose" ekranına geçmesini engelle. Kullanıcı bir butona
  // basana kadar (skip/reklam) bu şekilde kalır.
  if (document.getElementById("f9-near-miss-modal")) return true;

  const score  = gc.score || 0;
  const target = cfg?.targetScore || 630;
  const gap    = target - score;
  const canAd  = !gc.adContinueUsed;

  // Gerçek near-miss koşulu: hedefe %15'ten az kaldı VE bu level için
  // reklam hakkı henüz kullanılmadı (aksi halde watchAd() zaten
  // başarısız olur — bkz. GameCore.watchAdContinue()'daki throw).
  const isNearMiss = canAd && gap > 0 && gap <= target * 0.15;
  if (!isNearMiss) return false;

  const modal = document.createElement("div");
  modal.id = "f9-near-miss-modal";
  modal.style.cssText = `position:fixed;inset:0;background:#00000099;z-index:99999;
    display:flex;align-items:center;justify-content:center;padding:20px`;

  modal.innerHTML = `
    <div style="background:#07091A;border:1px solid #A78BFA;border-radius:16px;
      width:100%;max-width:360px;padding:24px;font-family:monospace;text-align:center">
      <div style="font-size:28px;margin-bottom:8px">🎯</div>
      <div style="font-size:16px;font-weight:700;color:#A78BFA;margin-bottom:6px">Çok yaklaştın!</div>
      <div style="font-size:12px;color:#6B7A9B;margin-bottom:16px">
        Hedefe sadece <span style="color:#FFD700;font-weight:700">${gap} puan</span> kaldı.
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
        <button id="f9-nm-buy"
          style="padding:12px;background:#A78BFA22;border:1px solid #A78BFA;
          color:#A78BFA;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
          📺 Reklam izle → devam et
        </button>
        <button id="f9-nm-skip"
          style="padding:12px 16px;background:#1A1D30;border:1px solid #2A2D48;
          color:#6B7A9B;border-radius:8px;font-size:13px;cursor:pointer">
          Vazgeç
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  document.getElementById("f9-nm-buy").onclick = () => {
    modal.remove();
    watchAd(); // gc.watchAdContinue() + state.screen="game" + render() — flow/rewardFlow.js
  };
  document.getElementById("f9-nm-skip").onclick = () => {
    modal.remove();
    // checkAndTransition()'ı TEKRAR çağırmıyoruz — gc.status zaten
    // "lost" ve gap hâlâ near-miss şartını sağlıyor, yeniden çağırmak
    // aynı modalı sonsuz döngüde tekrar açardı. Doğrudan kayıp ekranına
    // geç (clearAllHourglassTimers checkAndTransition'da zaten yapıldı
    // — hayır, henüz yapılmadı, burada da yapmalıyız).
    clearAllHourglassTimers();
    state.screen = "lose";
    render();
  };
  modal.addEventListener("click", e => { if (e.target===modal) modal.remove(); });
  return true;
}

function checkAndTransition() {
  const gc = state.gc;
  if (!gc || state.screen !== "game") return false;

  const goal = state.levelGoal || {type:"score", value: state.cfg?.targetScore || 630};

  // Hedef kontrolü — hamle bitince değerlendir
  // GameCore._updateStatus() hamle bitince zaten "lost" set ediyor.
  // Buradan önce "won" olup olmadığını kontrol edip override ediyoruz.
  const _movesUp = gc.movesLimit !== null &&
                   (gc.movesLeft === 0 || gc.movesUsed >= gc.movesLimit + gc.extraMoves);

  if (gc.status === "in_progress" || (gc.status === "lost" && _movesUp)) {
    if (_movesUp) {
      let achieved = false;
      if (goal.type === "score") {
        achieved = gc.score >= goal.value;
      } else {
        achieved = (state.goalProgress || 0) >= goal.value;
      }
      gc.status = achieved ? "won" : "lost";
      F9Debug.log("game", `Hamle bitti → ${gc.status}`, {
        score: gc.score, target: goal.value, type: goal.type,
        progress: state.goalProgress, achieved
      });
    }
  }

  if (gc.status === "won")  { clearAllHourglassTimers(); state.screen = "win";  return true; }
  if (gc.status === "lost") {
    // Near-miss kontrolü — gerçekten yakın mıydı VE reklam hakkı var mı?
    // (Oturum 26 — Tasarım B: kayıp SONRASI, reklam-ile-devam teklifi.)
    // ÖNEMLİ: modal gösterilirken/gösterildiğinde FALSY dönmeli — bu
    // fonksiyonun çağrıldığı ui/renderer.js'teki render(), dönüş değeri
    // truthy olursa render()'ı YENİDEN çağırıyor (bkz. "if
    // (checkAndTransition()) { render(); return; }"). true dönseydik
    // modal açıkken her render() yeni bir render() tetikleyip SONSUZ
    // ÖZYİNELEMEYE (stack overflow) girerdi — bu yüzden burada değeri
    // KULLANMIYORUZ, sadece "popup gösteriliyorsa dur" için kontrol
    // ediyoruz ve bare `return;` (undefined/falsy) ile çıkıyoruz.
    if (_checkNearMiss(gc, state.cfg)) return; // popup gösterildi/gösteriliyor, bekle — render() TEKRARLANMASIN
    // [Oturum 26 — KRİTİK HATA DÜZELTMESİ, motor sağlamlık denetimi]
    // ESKİDEN buraya hiç ulaşılmıyordu (bkz. HANDOFF.md "Bulunmuş
    // hatalar" — eski near-miss şartı movesLeft>0 arıyordu ama movesLeft
    // bir getter olduğu için bu noktada her zaman 0'dı). Artık
    // düzeltildi: near-miss uygun değilse (uzak kayıp VEYA reklam hakkı
    // bitmiş) doğrudan kayıp ekranına geçilir.
    clearAllHourglassTimers();
    state.screen = "lose";
    return true;
  }
  return false;
}
