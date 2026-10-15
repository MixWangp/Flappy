// All sound is synthesized live with the Web Audio API: a quiet lo-fi chill loop and a
// bag of silly jump sounds. Nothing is downloaded, so there is no licensing to worry about.
//
// Browsers only allow audio after the player touches the page, so call unlock() from the
// first tap/click/key press.

const VOL_KEY = "flappy.v2.volume";

function loadVolumes() {
  try {
    const v = JSON.parse(localStorage.getItem(VOL_KEY));
    if (v && typeof v.music === "number" && typeof v.sfx === "number") return v;
  } catch { /* ignore */ }
  return { music: 0.35, sfx: 0.8, muted: false };
}

/** Shuffle bag so the same jump sound never plays twice in a row. */
function bag(items) {
  let pool = [];
  let last = null;
  return () => {
    if (!pool.length) {
      pool = items.filter((i) => i !== last);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    last = pool.pop();
    return last;
  };
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createAudio() {
  let ctx = null;
  let master, musicBus, musicDuck, sfxBus, delay;
  let noiseBuf = null;
  let schedTimer = null;
  let nextBeat = 0;
  let beat = 0;
  const vol = loadVolumes();
  const listeners = new Set();

  function save() {
    try { localStorage.setItem(VOL_KEY, JSON.stringify(vol)); } catch { /* ignore */ }
    listeners.forEach((fn) => fn({ ...vol }));
  }

  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(vol.muted ? 0 : 1, t, 0.05);
    musicBus.gain.setTargetAtTime(vol.music * 0.5, t, 0.1);
    sfxBus.gain.setTargetAtTime(vol.sfx * 1.8, t, 0.05);
  }

  function unlock() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    // warm the music: gentle lowpass + a soft feedback echo
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 1800;
    // musicDuck dips the music for a moment on every jump so the sound effect pops out
    musicDuck = ctx.createGain();
    musicBus.connect(musicDuck).connect(warm).connect(master);
    delay = ctx.createDelay(1);
    delay.delayTime.value = 0.38;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(warm);
    // effects go through a compressor so they hit hard but never clip
    const punch = ctx.createDynamicsCompressor();
    punch.threshold.value = -20;
    punch.knee.value = 6;
    punch.ratio.value = 5;
    punch.attack.value = 0.002;
    punch.release.value = 0.12;
    sfxBus.connect(punch).connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    applyVolumes();
    startMusic();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
  }

  // ---------- music: 78 bpm lo-fi loop, Cmaj7 – Am7 – Fmaj7 – G6 ----------
  const BPM = 78;
  const SPB = 60 / BPM; // seconds per beat
  const CHORDS = [
    [48, 52, 55, 59], // Cmaj7
    [45, 52, 55, 60], // Am7
    [41, 48, 52, 57], // Fmaj7
    [43, 50, 55, 59], // G6-ish
  ];
  const PENTA = [72, 74, 76, 79, 81, 84];

  function startMusic() {
    nextBeat = ctx.currentTime + 0.1;
    schedTimer = setInterval(schedule, 120);
  }

  function schedule() {
    while (nextBeat < ctx.currentTime + 0.5) {
      const bar = Math.floor(beat / 4) % CHORDS.length;
      const inBar = beat % 4;
      const chord = CHORDS[bar];
      if (inBar === 0) {
        chord.forEach((n) => pad(midi(n), nextBeat, SPB * 4));
        bass(midi(chord[0] - 12), nextBeat, SPB * 1.6);
      }
      if (inBar === 2) bass(midi(chord[0] - 12), nextBeat + SPB * 0.5, SPB * 0.9);
      // soft swung hi-hats on the off-beats
      hat(nextBeat + SPB * 0.58, 0.05);
      if (inBar % 2 === 1) hat(nextBeat, 0.03);
      // a lazy kick on 1 and 3, rim on 2 and 4
      if (inBar === 0 || inBar === 2) kick(nextBeat);
      else rim(nextBeat);
      // sparse pentatonic noodling
      if (Math.random() < 0.45) bell(midi(PENTA[Math.floor(Math.random() * PENTA.length)]), nextBeat + (Math.random() < 0.5 ? 0 : SPB / 2));
      nextBeat += SPB;
      beat++;
    }
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function pad(f, t, dur) {
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      o.detune.value = det;
      const g = ctx.createGain();
      env(g, t, 0.6, 0.035, dur + 0.4);
      o.connect(g).connect(musicBus);
      o.start(t);
      o.stop(t + dur + 0.5);
    }
  }

  function bass(f, t, dur) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    env(g, t, 0.02, 0.22, dur);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function bell(f, t) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    env(g, t, 0.01, 0.05, 1.2);
    o.connect(g);
    g.connect(musicBus);
    g.connect(delay);
    o.start(t);
    o.stop(t + 1.3);
  }

  function noise(t, dur, type, freq, peak, bus = musicBus) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = freq;
    const g = ctx.createGain();
    env(g, t, 0.003, peak, dur);
    src.connect(flt).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const hat = (t, peak) => noise(t, 0.05, "highpass", 7000, peak);
  const rim = (t) => noise(t, 0.04, "bandpass", 1800, 0.06);

  function kick(t) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = ctx.createGain();
    env(g, t, 0.005, 0.28, 0.25);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + 0.3);
  }

  // ---------- silly jump sounds ----------
  function tone({ type = "sine", from, to, dur, peak = 0.35, vibrato = 0, filter = null, at = 0 }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    let node = o;
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibrato;
      depth.gain.value = from * 0.06;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    if (filter) {
      const f = ctx.createBiquadFilter();
      Object.assign(f, { type: filter.type });
      f.frequency.value = filter.freq;
      f.Q.value = filter.q || 1;
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    env(g, t, 0.008, peak, dur);
    node.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  const JUMPS = {
    boing: () => tone({ type: "sine", from: 160, to: 700, dur: 0.3, peak: 0.5, vibrato: 18 }),
    squeak: () => tone({ type: "square", from: 1300, to: 2300, dur: 0.11, peak: 0.25 }),
    quack: () => {
      tone({ type: "sawtooth", from: 560, to: 380, dur: 0.15, peak: 0.45, filter: { type: "bandpass", freq: 1100, q: 3 } });
      tone({ type: "sawtooth", from: 500, to: 340, dur: 0.13, peak: 0.4, filter: { type: "bandpass", freq: 1100, q: 3 }, at: 0.14 });
    },
    pew: () => tone({ type: "square", from: 1600, to: 140, dur: 0.2, peak: 0.25 }),
    slide: () => tone({ type: "sine", from: 380, to: 1700, dur: 0.33, peak: 0.45 }),
    bloop: () => tone({ type: "sine", from: 280, to: 1000, dur: 0.12, peak: 0.55 }),
    kazoo: () => tone({ type: "sawtooth", from: 330, to: 450, dur: 0.25, peak: 0.3, vibrato: 7, filter: { type: "lowpass", freq: 1800 } }),
    pfft: () => noise(ctx.currentTime, 0.2, "lowpass", 700, 0.9, sfxBus),
    boink: () => {
      tone({ type: "triangle", from: 950, to: 300, dur: 0.12, peak: 0.5 });
      tone({ type: "triangle", from: 600, to: 1300, dur: 0.11, peak: 0.45, at: 0.1 });
    },
    honk: () => tone({ type: "square", from: 260, to: 235, dur: 0.22, peak: 0.25, filter: { type: "lowpass", freq: 1000 } }),
    chirp: () => {
      tone({ type: "sine", from: 2000, to: 3100, dur: 0.06, peak: 0.3 });
      tone({ type: "sine", from: 2200, to: 3300, dur: 0.06, peak: 0.3, at: 0.08 });
    },
    wobble: () => tone({ type: "triangle", from: 240, to: 560, dur: 0.32, peak: 0.5, vibrato: 25 }),

    // --- new ones ---
    spring: () => tone({ type: "triangle", from: 120, to: 900, dur: 0.38, peak: 0.5, vibrato: 32 }),
    siren: () => tone({ type: "sawtooth", from: 500, to: 1500, dur: 0.3, peak: 0.22, vibrato: 9, filter: { type: "lowpass", freq: 2500 } }),
    coin: () => {
      tone({ type: "square", from: 988, to: 988, dur: 0.07, peak: 0.22 });
      tone({ type: "square", from: 1319, to: 1319, dur: 0.2, peak: 0.22, at: 0.07 });
    },
    meow: () => tone({ type: "sawtooth", from: 700, to: 450, dur: 0.32, peak: 0.35, vibrato: 5, filter: { type: "bandpass", freq: 1500, q: 2 } }),
    yip: () => tone({ type: "sawtooth", from: 900, to: 1500, dur: 0.09, peak: 0.4, filter: { type: "bandpass", freq: 1800, q: 2 } }),
    airhorn: () => [233, 294, 349].forEach((f) => tone({ type: "sawtooth", from: f, to: f * 0.98, dur: 0.32, peak: 0.16, filter: { type: "lowpass", freq: 2600 } })),
    robot: () => [660, 990, 1320, 880].forEach((f, i) => tone({ type: "square", from: f, to: f, dur: 0.05, peak: 0.2, at: i * 0.05 })),
    bubble: () => tone({ type: "sine", from: 400, to: 1600, dur: 0.07, peak: 0.6 }),
    ribbit: () => {
      tone({ type: "sawtooth", from: 180, to: 140, dur: 0.08, peak: 0.45, filter: { type: "bandpass", freq: 700, q: 4 } });
      tone({ type: "sawtooth", from: 220, to: 160, dur: 0.1, peak: 0.45, filter: { type: "bandpass", freq: 700, q: 4 }, at: 0.1 });
    },
    cork: () => {
      noise(ctx.currentTime, 0.03, "highpass", 2000, 0.8, sfxBus);
      tone({ type: "sine", from: 800, to: 300, dur: 0.08, peak: 0.5, at: 0.01 });
    },
    cowbell: () => [540, 800].forEach((f) => tone({ type: "square", from: f, to: f, dur: 0.25, peak: 0.16, filter: { type: "bandpass", freq: 900, q: 3 } })),
    whistle: () => tone({ type: "sine", from: 1800, to: 2600, dur: 0.25, peak: 0.35, vibrato: 14 }),
    rubberChicken: () => tone({ type: "sawtooth", from: 900, to: 1700, dur: 0.35, peak: 0.3, vibrato: 11, filter: { type: "bandpass", freq: 2000, q: 1.5 } }),
    zap: () => {
      tone({ type: "sawtooth", from: 2400, to: 90, dur: 0.16, peak: 0.25 });
      tone({ type: "square", from: 1800, to: 120, dur: 0.16, peak: 0.12 });
    },
  };
  const nextJump = bag(Object.keys(JUMPS));

  return {
    unlock,
    get volumes() { return { ...vol }; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setMusic(v) { vol.music = v; applyVolumes(); save(); },
    setSfx(v) { vol.sfx = v; applyVolumes(); save(); },
    setMuted(m) { vol.muted = m; applyVolumes(); save(); },

    jump() {
      if (!ctx || vol.muted) return;
      const t = ctx.currentTime;
      // a crisp "tick" on top of every jump sound so the tap always feels responsive
      noise(t, 0.025, "highpass", 3500, 0.5, sfxBus);
      // duck the music for a beat
      musicDuck.gain.cancelScheduledValues(t);
      musicDuck.gain.setValueAtTime(musicDuck.gain.value, t);
      musicDuck.gain.linearRampToValueAtTime(0.45, t + 0.02);
      musicDuck.gain.linearRampToValueAtTime(1, t + 0.4);
      JUMPS[nextJump()]();
    },
    score() {
      if (!ctx || vol.muted) return;
      tone({ type: "sine", from: 1320, to: 1320, dur: 0.12, peak: 0.08 });
      tone({ type: "sine", from: 1760, to: 1760, dur: 0.16, peak: 0.07, at: 0.06 });
    },
    // the classic sad trombone "wah wah wah waaah"
    death() {
      if (!ctx || vol.muted) return;
      [[392, 370], [370, 349], [349, 330], [330, 262]].forEach(([a, b], i) =>
        tone({ type: "sawtooth", from: a, to: b, dur: i === 3 ? 0.7 : 0.28, peak: 0.13, vibrato: i === 3 ? 6 : 0, filter: { type: "lowpass", freq: 1200 }, at: i * 0.3 }),
      );
    },
  };
}
