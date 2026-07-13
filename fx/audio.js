// [Oturum 16 — fx/ katmanı] Ses sistemi.
// core/game-engine.js'ten taşındı — davranış BİREBİR AYNI.
// [Oturum 47 — Game Feel Engine v1.0] Ses paleti genişletildi. Eski 5
// tip (match/select/gift/blast/jackpot) HİÇ DEĞİŞMEDİ — geriye dönük
// uyumluluk (flow/rewardFlow.js, ui/screens.js hâlâ bunları çağırıyor).
// Yeni kategoriler eklendi: touch, move, promotion, combo, supercombo,
// victory, lose — kullanıcının "80-100 kısa ses" isteğine, gerçek ses
// DOSYASI olmadan (Web Audio sentezi ile) cevap. Her çalışta hafif
// rastgele perde/zamanlama sapması var — arka arkaya çalınca hep AYNI
// ses gibi hissettirmesin diye.

function initAudio() {
  if (_audioReady) return;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    _audioReady = true;
  } catch(e) {}
}

function getAudioCtx() {
  if (!_audioCtx) initAudio();
  if (_audioCtx && _audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

// Basit bir sinüs/üçgen tonu çal — çoğu yeni ses tipi bunun üzerine kurulu.
function _tone(ctx, freq, startT, dur, opts = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = opts.wave || "sine";
  if (opts.slideTo) {
    o.frequency.setValueAtTime(freq, startT);
    o.frequency.exponentialRampToValueAtTime(opts.slideTo, startT + dur);
  } else {
    o.frequency.value = freq;
  }
  const vol = opts.vol ?? 0.25;
  g.gain.setValueAtTime(vol, startT);
  g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
  o.start(startT); o.stop(startT + dur);
}

function playSound(type, options = {}) {
  if (state._soundOn === false) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Hafif rastgele perde sapması (±3%) — tekrarlarda tekdüzelik olmasın.
    const jit = 1 + (Math.random() - 0.5) * 0.06;

    if (type === "match") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(523, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime+0.12);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.25);
      o.start(); o.stop(ctx.currentTime+0.25);

    } else if (type === "select") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 440;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.08);
      o.start(); o.stop(ctx.currentTime+0.08);

    } else if (type === "gift") {
      [523,659,784,1047].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        const t = ctx.currentTime + i*0.1;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t+0.18);
        o.start(t); o.stop(t+0.18);
      });

    } else if (type === "blast") {
      const buf = ctx.createBuffer(1, ctx.sampleRate*0.35, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i=0; i<d.length; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/3000);
      const src = ctx.createBufferSource(), g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(ctx.destination);
      f.type = "lowpass"; f.frequency.value = 400;
      g.gain.setValueAtTime(0.6, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.35);
      src.start();

    } else if (type === "jackpot") {
      [523,659,784,1047,1319,1568].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "triangle"; o.frequency.value = freq;
        const t = ctx.currentTime + i*0.12;
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t+0.3);
        o.start(t); o.stop(t+0.3);
      });

    // ═══════════════ [Oturum 47] YENİ KATEGORİLER ═══════════════

    } else if (type === "touch") {
      // Hücreye dokunma/seçme — "select"in kısa, hafif varyasyonu.
      _tone(ctx, 380 * jit, now, 0.05, { vol: 0.10, wave: "sine" });

    } else if (type === "move") {
      // Taş kaydırma/swap sırasında — çok kısa, nötr "tık".
      _tone(ctx, 300 * jit, now, 0.04, { vol: 0.08, wave: "triangle" });

    } else if (type === "promotion") {
      // Terfi (bakır→bronz→...) — yükselen parlak arpej, gift'ten
      // daha "önemli" hissettiren, 5 nota.
      [440, 554, 659, 831, 988].forEach((freq, i) => {
        _tone(ctx, freq * jit, now + i * 0.07, 0.22, { vol: 0.22, wave: "triangle" });
      });

    } else if (type === "combo") {
      // Kısa zincir (3-7 arası) — Combo Director "Good/Great/Sweet" ile eşleşir.
      const base = 500 + (options.tier || 0) * 60;
      _tone(ctx, base * jit, now, 0.10, { vol: 0.22, wave: "square", slideTo: base * 1.3 });

    } else if (type === "supercombo") {
      // Uzun zincir (Tasty/Delicious/Divine) — daha zengin, çok katmanlı.
      [1, 1.25, 1.5, 2].forEach((mult, i) => {
        _tone(ctx, 440 * mult * jit, now + i * 0.03, 0.28, { vol: 0.2, wave: "sawtooth" });
      });

    } else if (type === "victory") {
      // Level kazanma — küçük kutlama melodisi (major arpej + son akor).
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((freq, i) => {
        _tone(ctx, freq, now + i * 0.11, 0.35, { vol: 0.22, wave: "triangle" });
      });

    } else if (type === "lose") {
      // Level kaybetme — düşen, hüzünlü minör iniş.
      [440, 392, 349, 294].forEach((freq, i) => {
        _tone(ctx, freq, now + i * 0.14, 0.4, { vol: 0.18, wave: "sine" });
      });

    } else if (type === "blastSized") {
      // Boyuta göre ölçeklenen patlama — options.cellCount ile çağrılır
      // (3'lü hafif "pop", 7'li+ ağır "boom"). F9GameFeel bunu kullanır.
      const n = options.cellCount || 3;
      const dur = 0.2 + Math.min(n, 9) * 0.03;
      const freqBase = Math.max(150, 400 - n * 20);
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(2000 + n*300));
      const src = ctx.createBufferSource(), g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(ctx.destination);
      f.type = "lowpass"; f.frequency.value = freqBase;
      g.gain.setValueAtTime(Math.min(0.7, 0.35 + n * 0.03), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.start();
    }
  } catch(e) { console.warn("Ses hatası:", e.message); }
}
