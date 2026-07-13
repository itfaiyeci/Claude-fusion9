const F9Report = (() => {
  const _errors = [];   // otomatik yakalanan hatalar
  const MAX = 20;

  // Otomatik hata yakalayıcı — window.onerror'ı zenginleştir
  function _captureError(msg, file, line, col, err) {
    const snap = {
      ts: new Date().toISOString(),
      msg, file, line, col,
      stack: err?.stack?.split("\n").slice(0,6).join(" | ") || "",
      state: _gameSnapshot(),
    };
    _errors.unshift(snap);
    if (_errors.length > MAX) _errors.pop();
  }

  // Oyun state özeti — hassas veri içermez
  // [Oturum 65 — aynı hata düzeltmesi, bkz. features/hint/hint-system.js]
  // `window.state` her zaman undefined'dı — `state` paylaşımlı kapsamda
  // `const`, window'a otomatik eklenmiyor.
  function _gameSnapshot() {
    try {
      const gc = state?.gc;
      return {
        screen: state?.screen,
        level: state?.levelNumber,
        score: gc?.score,
        moves: gc?.movesUsed + "/" + gc?.movesLimit,
        status: gc?.status,
        gifts: gc?.gifts?.size,
        blockers: gc?.blockers?.size,
        hourglasses: gc?.hourglasses?.size,
        energy: state?.energyTracker?.energy,
        build: document.title,
        ua: navigator.userAgent.slice(0, 80),
      };
    } catch(e) { return {err: e.message}; }
  }

  // Tam rapor oluştur
  function _buildReport(userNote) {
    const logs = (typeof F9Debug !== "undefined" && F9Debug.getLogs)
      ? F9Debug.getLogs().slice(-30).map(l =>
          "[" + l.cat.toUpperCase() + "] " + l.msg +
          (l.data ? " " + JSON.stringify(l.data) : ""))
      : [];

    return {
      version: document.title,
      timestamp: new Date().toISOString(),
      userNote: userNote || "",
      gameState: _gameSnapshot(),
      recentErrors: _errors.slice(0, 5),
      recentLogs: logs,
      dda: (() => {
        try {
          return JSON.parse(localStorage.getItem("f9_dda") || "null");
        } catch(e) { return null; }
      })(),
    };
  }

  // Raporu panoya kopyala
  function _copyReport(report) {
    const text = JSON.stringify(report, null, 2);
    // iOS Safari: writeText yalnızca senkron click akışında çalışır.
    // Önce senkron fallback (execCommand) dene — evrensel uyumluluk.
    // Başarısızsa async clipboard API'ye geç.
    const fallbackOk = _fallbackCopy(text);
    if (fallbackOk) {
      _showToast("Rapor panoya kopyalandı! Geliştiriciye yapıştırarak gönder.", "#4FB87A");
      return;
    }
    // Fallback başarısızsa (bazı tarayıcılarda execCommand kaldırıldı) async dene
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text)
        .then(() => _showToast("Rapor panoya kopyalandı!", "#4FB87A"))
        .catch(() => _showToast("Kopyalama başarısız — raporu manuel seçip kopyalayın.", "#E04B4B"));
    }
  }

  function _fallbackCopy(text) {
    // execCommand tabanlı senkron kopyalama — iOS Safari dahil geniş destek
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-999px;left:-999px;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok; // true=başarılı, false=başarısız
    } catch(e) {
      return false;
    }
  }

  function _showToast(msg, color) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:${color}22;border:1px solid ${color};color:${color};
      padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;
      z-index:99999;pointer-events:none;white-space:nowrap;
      animation:floatUp 3s ease forwards`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // Sorun bildir modal
  function showReportModal(isAutoError) {
    // Varsa eski modal kaldır
    document.getElementById("f9-report-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "f9-report-modal";
    modal.style.cssText = `position:fixed;inset:0;background:#00000088;z-index:99999;
      display:flex;align-items:center;justify-content:center;padding:20px`;

    const errorPreview = _errors[0]
      ? `<div style="background:#1A0808;border:1px solid #E04B4B44;border-radius:6px;
          padding:8px;margin-bottom:12px;font-size:10px;color:#E04B4B;word-break:break-all">
          Son hata: ${_errors[0].msg}<br>
          Satır ${_errors[0].line} · ${_errors[0].ts?.slice(11,19)}
        </div>` : "";

    modal.innerHTML = `
      <div style="background:#07091A;border:1px solid #2A2D48;border-radius:16px;
        width:100%;max-width:400px;padding:24px;font-family:monospace">
        <div style="font-size:16px;font-weight:700;color:#A78BFA;margin-bottom:4px">
          ${isAutoError ? "⚠ Hata tespit edildi" : "📋 Sorun Bildir"}
        </div>
        <div style="font-size:11px;color:#6B7A9B;margin-bottom:16px">
          Rapor otomatik hazırlandı — geliştiriciye iletmek için kopyala
        </div>
        ${errorPreview}
        <textarea id="f9-report-note" placeholder="Ne oldu? (isteğe bağlı açıklama)"
          style="width:100%;box-sizing:border-box;height:72px;
          background:#0C0F25;border:1px solid #2A2D48;border-radius:8px;
          color:#C8D0E0;font-size:12px;padding:8px;resize:none;
          font-family:monospace;margin-bottom:12px"></textarea>
        <div style="display:flex;gap:8px">
          <button id="f9-report-copy"
            style="flex:1;padding:10px;background:#A78BFA22;border:1px solid #A78BFA;
            color:#A78BFA;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
            📋 Raporu Kopyala
          </button>
          <button id="f9-report-close"
            style="padding:10px 16px;background:#1A1D30;border:1px solid #2A2D48;
            color:#6B7A9B;border-radius:8px;font-size:13px;cursor:pointer">
            Kapat
          </button>
        </div>
        <div id="f9-report-preview" style="margin-top:12px;font-size:9px;color:#444;
          max-height:100px;overflow:auto;display:none"></div>
      </div>`;

    document.body.appendChild(modal);

    document.getElementById("f9-report-copy").onclick = () => {
      const note = document.getElementById("f9-report-note").value;
      const report = _buildReport(note);
      _copyReport(report);
      // Önizleme göster
      const prev = document.getElementById("f9-report-preview");
      prev.style.display = "block";
      prev.textContent = JSON.stringify(report, null, 2).slice(0, 500) + "...";
    };
    document.getElementById("f9-report-close").onclick = () => modal.remove();
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  }

  // Otomatik hata tetikleyici — ciddi hatada modal aç
  function onError(msg, file, line, col, err) {
    _captureError(msg, file, line, col, err);
    // Kullanıcıya sorma — sadece kaydet
    // Ciddi hatalarda (TypeError, ReferenceError) bildirim göster
    if (msg && (msg.includes("TypeError") || msg.includes("ReferenceError"))) {
      _showToast("Hata kaydedildi. Sorun Bildir butonuyla raporla.", "#E08B2B");
    }
  }

  function getErrors() { return _errors; }

  return { showReportModal, onError, getErrors, captureError: _captureError };
})();
// [Oturum 46] F9Bot'la AYNI sebep — debug panelindeki bir buton
// onclick="F9Report...." kullanıyor. Bkz. debug/bot.js'teki not.
if (typeof window !== "undefined") window.F9Report = F9Report;

// ══════════════════════════════════════════════════════
// F9 ZORlUK ANALİZİ & CANLI MÜDAHALE SİSTEMİ
// "Everest zor ama zirveye çıkınca eureka"
//
// 3 katman:
//   1. Analiz  — tahta fırsat derecelerini say
//   2. Müdahale — sıkışınca sessizce yardım et
//   3. Rapor   — direktöre bildir
// ══════════════════════════════════════════════════════
