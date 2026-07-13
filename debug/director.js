const F9Director = (() => {
  // F9Debug içindeki _dir nesnesine erişim
  function _dir()   { return window._f9dir || null; }  // F9Debug init sonrası set edilir

  return {
    // Oyun sağlık skoru (0-100)
    health: ()    => F9Debug?.dirHealth?.() ?? 50,
    // Geliştirici notları
    notes:  ()    => F9Debug?.dirNotes?.()  ?? [],
    // Aktif level özeti
    active: ()    => F9Debug?.dirActive?.() ?? null,
    // Son N level geçmişi
    history:(n=5) => F9Debug?.dirHistory?.(n) ?? [],
    // Churn durumu (belirli level için)
    churn:  (lvl) => typeof F9Churn !== "undefined" ? F9Churn.status(lvl) : null,
    // Direktör panelini yenile
    render: ()    => F9Debug?.renderDirector?.(),
    // Level hook'ları (oyun akışından çağrılır)
    onLevelStart: (lvl, cfg, gc) => F9Debug?.dirLevelStart?.(lvl, cfg, gc),
    onMove:       (outcome, gc)  => F9Debug?.dirMove?.(outcome, gc),
    onLevelEnd:   (won, gc)      => F9Debug?.dirLevelEnd?.(won, gc),
  };
})();

// ══════════════════════════════════════════════════════
// F9 PATLAMA & YENİ SAYI ANİMASYON MOTORU
// Mekanik değişmez — sadece görsel. "Uçup git, yukarıdan düş" hissi.
// ══════════════════════════════════════════════════════
