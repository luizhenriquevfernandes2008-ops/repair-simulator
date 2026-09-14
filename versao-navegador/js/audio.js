// Áudio: músicas (Kevin MacLeod / incompetech) e efeitos (Kenney) via HTMLAudio
// (HTMLAudio funciona abrindo o index.html direto do disco, sem servidor)
(function () {
  const MUSIC = {
    title: 'audio/music/easylemon.mp3',
    shop: 'audio/music/localforecastelevator.mp3',
    repair: 'audio/music/investigations.mp3',
    night: 'audio/music/dreamer.mp3',
    casino: 'audio/music/funkorama.mp3',
  };
  const S = 'audio/sfx/';
  const r = (base, n, pad = 3, start = 0) => Array.from({ length: n }, (_, i) => `${base}${String(i + start).padStart(pad, '0')}.ogg`);
  const SFX = {
    click: [S + 'interface-sounds/click_002.ogg'],
    hover: [S + 'ui-audio/rollover2.ogg'],
    select: [S + 'interface-sounds/select_002.ogg'],
    confirm: [S + 'interface-sounds/confirmation_001.ogg'],
    confirm2: [S + 'interface-sounds/confirmation_002.ogg'],
    error: [S + 'interface-sounds/error_006.ogg'],
    blip: [S + 'interface-sounds/tick_002.ogg'],
    open: [S + 'interface-sounds/open_001.ogg'],
    close: [S + 'interface-sounds/close_001.ogg'],
    toggle: r(S + 'interface-sounds/switch_', 3, 3, 1),
    ratchet: r(S + 'interface-sounds/scroll_', 5, 3, 1),
    screwOut: r(S + 'impact-sounds/impactMetal_light_', 5),
    screwDrop: r(S + 'impact-sounds/impactTin_medium_', 5),
    pry: r(S + 'interface-sounds/scratch_', 5, 3, 1),
    pop: r(S + 'impact-sounds/impactPlate_light_', 5),
    glass: r(S + 'impact-sounds/impactGlass_light_', 5),
    glassBreak: [S + 'impact-sounds/impactGlass_heavy_000.ogg', S + 'impact-sounds/impactGlass_heavy_002.ogg'],
    place: r(S + 'impact-sounds/impactGeneric_light_', 5),
    trash: r(S + 'impact-sounds/impactPlank_medium_', 5),
    snap: r(S + 'interface-sounds/switch_', 3, 3, 4),
    zap: [S + 'digital-audio/zap1.ogg', S + 'digital-audio/zap2.ogg'],
    beep: [S + 'digital-audio/tone1.ogg'],
    meter: [S + 'digital-audio/highUp.ogg'],
    boot: [S + 'digital-audio/powerUp2.ogg'],
    fail: [S + 'digital-audio/lowDown.ogg'],
    bell: [S + 'impact-sounds/impactBell_heavy_000.ogg'],
    steps: r(S + 'impact-sounds/footstep_wood_', 5),
    chips: r(S + 'casino-audio/chips-stack-', 6, 1, 1),
    chipsHandle: r(S + 'casino-audio/chips-handle-', 6, 1, 1),
    chipsCollide: r(S + 'casino-audio/chips-collide-', 4, 1, 1),
    chipLay: r(S + 'casino-audio/chip-lay-', 3, 1, 1),
    card: r(S + 'casino-audio/card-slide-', 8, 1, 1),
    cardFan: r(S + 'casino-audio/card-fan-', 2, 1, 1),
    shuffle: [S + 'casino-audio/card-shuffle.ogg'],
    dice: r(S + 'casino-audio/dice-throw-', 3, 1, 1),
    diceShake: r(S + 'casino-audio/dice-shake-', 3, 1, 1),
    packOpen: r(S + 'casino-audio/cards-pack-open-', 2, 1, 1),
    lever: [S + 'impact-sounds/impactMetal_heavy_001.ogg'],
    reelStop: r(S + 'impact-sounds/impactPlate_medium_', 5),
    // ui-audio usa nomes switch1..switch38 (sem zeros)
    reelTick: [1, 2, 3, 4, 5, 6].map(i => S + 'ui-audio/switch' + i + '.ogg'),
    spinStart: [S + 'digital-audio/phaserUp3.ogg'],
    win: [S + 'music-jingles/jingles_NES03.ogg'],
    winSmall: [S + 'digital-audio/powerUp5.ogg'],
    bigWin: [S + 'music-jingles/jingles_STEEL00.ogg'],
    jackpot: [S + 'music-jingles/jingles_STEEL16.ogg'],
    lose: [S + 'music-jingles/jingles_SAX05.ogg'],
    loseSmall: [S + 'digital-audio/lowThreeTone.ogg'],
    success: [S + 'music-jingles/jingles_PIZZI03.ogg'],
    dayStart: [S + 'music-jingles/jingles_PIZZI00.ogg'],
    buy: [S + 'digital-audio/powerUp7.ogg'],
    cash: r(S + 'casino-audio/chips-collide-', 4, 1, 1),
    gameover: [S + 'music-jingles/jingles_SAX10.ogg'],
    victory: [S + 'music-jingles/jingles_NES16.ogg'],
    glitch: [S + 'interface-sounds/glitch_001.ogg', S + 'interface-sounds/glitch_003.ogg'],
    scratch: r(S + 'interface-sounds/scratch_', 5, 3, 1),
    ball: r(S + 'casino-audio/chip-lay-', 3, 1, 1),
    coin: r(S + 'casino-audio/chips-handle-', 6, 1, 1),
    // v1.3 — eventos, brigas, decoração
    punch: r(S + 'impact-sounds/impactPunch_heavy_', 5),
    slap: r(S + 'impact-sounds/impactPunch_medium_', 5),
    thud: r(S + 'impact-sounds/impactWood_heavy_', 5),
    soft: r(S + 'impact-sounds/impactSoft_heavy_', 5),
    key: [S + 'ui-audio/mouseclick1.ogg', S + 'ui-audio/mouserelease1.ogg'],
    question: r(S + 'interface-sounds/question_', 4, 3, 1),
    bong: [S + 'interface-sounds/bong_001.ogg'],
    pluck: r(S + 'interface-sounds/pluck_', 2, 3, 1),
    drop: r(S + 'interface-sounds/drop_', 4, 3, 1),
    news: [S + 'music-jingles/jingles_HIT00.ogg', S + 'music-jingles/jingles_HIT03.ogg'],
    event: [S + 'music-jingles/jingles_HIT05.ogg', S + 'music-jingles/jingles_HIT08.ogg'],
    eventBad: [S + 'music-jingles/jingles_SAX05.ogg', S + 'digital-audio/zapThreeToneDown.ogg'],
    eventGood: [S + 'music-jingles/jingles_PIZZI03.ogg', S + 'digital-audio/zapThreeToneUp.ogg'],
    alarm: [S + 'digital-audio/threeTone1.ogg', S + 'digital-audio/threeTone2.ogg'],
    pet: r(S + 'digital-audio/pepSound', 5, 1, 1),
    jump: r(S + 'digital-audio/phaseJump', 5, 1, 1),
  };
  const pools = {};
  let muted = false, musicVol = 0.45, sfxVol = 0.8;
  let cur = null, curName = null;
  let ctx = null, heatNode = null;

  function getAudio(src) {
    const p = pools[src] || (pools[src] = []);
    for (const a of p) if (a.paused || a.ended) return a;
    if (p.length >= 6) { p[0].currentTime = 0; return p[0]; }
    const a = new Audio(src); a.preload = 'auto'; p.push(a); return a;
  }

  const AUDIO = {
    sfx(name, { vol = 1, rate = 1 } = {}) {
      if (muted) return;
      const list = SFX[name]; if (!list) return;
      const src = list[(Math.random() * list.length) | 0];
      const a = getAudio(src);
      try { a.currentTime = 0; } catch (e) { }
      a.volume = Math.max(0, Math.min(1, sfxVol * vol));
      a.playbackRate = rate;
      a.play().catch(() => { });
    },
    music(name) {
      if (curName === name) return;
      curName = name;
      const old = cur;
      if (old) fade(old, old.volume, 0, 700, () => old.pause());
      if (!name) { cur = null; return; }
      const a = new Audio(MUSIC[name]); a.loop = true; a.volume = 0; cur = a;
      if (!muted) a.play().catch(() => { });
      fade(a, 0, musicVol, 900);
    },
    retry() { if (cur && cur.paused && !muted) cur.play().catch(() => { }); },
    toggleMute() {
      muted = !muted;
      if (cur) { if (muted) cur.pause(); else cur.play().catch(() => { }); }
      if (muted) this.heat(false);
      return muted;
    },
    get muted() { return muted; },
    // Ruído contínuo sintetizado (soprador / ferro de solda) — som ambiente de ferramenta
    heat(on, kind = 'heat') {
      if (muted && on) return;
      try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (on && !heatNode) {
          const len = ctx.sampleRate * 1;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
          const f = ctx.createBiquadFilter(); f.type = kind === 'heat' ? 'lowpass' : 'highpass'; f.frequency.value = kind === 'heat' ? 900 : 3500;
          const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(kind === 'heat' ? 0.18 : 0.06, ctx.currentTime + 0.15);
          src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
          heatNode = { src, g };
        } else if (!on && heatNode) {
          const h = heatNode; heatNode = null;
          h.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
          setTimeout(() => { try { h.src.stop(); } catch (e) { } }, 250);
        }
      } catch (e) { }
    },
  };

  function fade(a, from, to, ms, done) {
    const t0 = performance.now();
    function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    }
    requestAnimationFrame(step);
  }

  window.AUDIO = AUDIO;
})();
