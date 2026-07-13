// [Oturum 52 — Event-Driven Architecture, kullanıcı önerisi]
// Resmi bir Event Bus (yayın/abonelik) sistemi. Motor artık ses/
// animasyon/kamera/combo/istatistik gibi sistemlerin HİÇBİRİNİ
// doğrudan çağırmak ZORUNDA değil — bunun yerine bir OLAY yayınlar,
// dinleyen sistemler kendi işini yapar. Motor onları TANIMAZ.
//
// TASARIM KARARI (kullanıcıyla anlaşıldı): ~100 event'lik tam liste
// TEK SEFERDE kurulmuyor — bu, projenin daha önce (Oturum 49/50)
// "güvenli sandığım temizlik ciddi regresyona yol açtı" dersinden
// sonra BİLİNÇLİ bir risk azaltma kararı. Bunun yerine:
//   1) Event Bus'ın kendisi (bu dosya) — küçük, bağımsız, test edilmiş.
//   2) Motor/flow katmanı GERÇEKTEN VAR OLAN anlarda event YAYINLAR
//      (emit) — ama MEVCUT doğrudan çağrılar SİLİNMİYOR (ilk aşamada).
//   3. SADECE Game Feel Engine (fx/game-feel.js — en yeni, en izole
//      sistem) event DİNLEYİCİSİNE geçiriliyor — kanıt niteliğinde.
//   4) Diğer sistemler (Audio genişletmesi, Achievement, AI Director,
//      Tutorial vb.) ve eksik event'ler (Explosion ayrımı, Board
//      event'leri, UI event'leri) — kullanıcı onayıyla kademeli olarak
//      eklenecek, tek seferde değil.
//
// KULLANIM:
//   F9Events.on("ComboDetected", (data) => { ... });
//   F9Events.emit("ComboDetected", { count: 5, tier: "GREAT" });
//   const unsubscribe = F9Events.on(...); unsubscribe(); // aboneliği iptal
const F9Events = (() => {
  const _listeners = {}; // { eventName: [fn, fn, ...] }
  let _debugLog = false; // F9Debug hazır olunca otomatik açılabilir

  function on(eventName, fn) {
    if (!_listeners[eventName]) _listeners[eventName] = [];
    _listeners[eventName].push(fn);
    return () => off(eventName, fn); // unsubscribe fonksiyonu döner
  }

  function once(eventName, fn) {
    const wrapper = (data) => { off(eventName, wrapper); fn(data); };
    return on(eventName, wrapper);
  }

  function off(eventName, fn) {
    if (!_listeners[eventName]) return;
    _listeners[eventName] = _listeners[eventName].filter(f => f !== fn);
  }

  function emit(eventName, data) {
    if (_debugLog && typeof F9Debug !== "undefined") {
      F9Debug.log("event", eventName, data);
    }
    const fns = _listeners[eventName];
    if (!fns || fns.length === 0) return;
    // Her dinleyici İZOLE try/catch içinde — BİR dinleyicinin hatası
    // DİĞERLERİNİ ya da motoru ETKİLEMEMELİ (event-driven mimarinin
    // temel garantisi: motor dinleyicilerin varlığından/hatalarından
    // habersiz kalmalı).
    for (const fn of fns.slice()) { // slice(): dinleyici kendi içinde on/off çağırırsa güvenli
      try { fn(data); }
      catch (e) {
        console.error(`[F9Events] "${eventName}" dinleyicisinde hata:`, e);
        if (typeof F9Debug !== "undefined") F9Debug.err(`[EVENT] ${eventName} dinleyici hatası`, { msg: e.message });
      }
    }
  }

  function listenerCount(eventName) { return (_listeners[eventName] || []).length; }
  function eventNames() { return Object.keys(_listeners); }
  function setDebugLog(v) { _debugLog = !!v; }

  return { on, once, off, emit, listenerCount, eventNames, setDebugLog };
})();
