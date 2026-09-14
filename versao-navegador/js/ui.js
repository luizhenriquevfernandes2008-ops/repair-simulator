// Motor 3D compartilhado, diálogo estilo VN e utilidades de interface
(function () {
  const $ = s => document.querySelector(s);
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ---------- gerenciador de cenas ----------
  const ENGINE = {
    renderer, canvas, active: null, t: 0,
    scenes: {},
    register(name, mod) { this.scenes[name] = mod; },
    use(name) {
      if (this.active && this.active.onExit) this.active.onExit();
      this.active = this.scenes[name] || null;
      if (this.active && this.active.onEnter) this.active.onEnter();
      this.resize();
    },
    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      const a = this.active;
      if (a && a.camera) { a.camera.aspect = w / h; a.camera.updateProjectionMatrix(); }
      if (a && a.composer) a.composer.setSize(w, h);
    },
  };
  window.addEventListener('resize', () => ENGINE.resize());
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; ENGINE.t += dt;
    const a = ENGINE.active;
    if (a) {
      if (a.update) a.update(dt, ENGINE.t);
      if (a.composer) a.composer.render(dt);
      else if (a.scene && a.camera) renderer.render(a.scene, a.camera);
    }
    TWEENS.update(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- tweens simples ----------
  const TWEENS = {
    list: [],
    add(dur, fn, ease = 'inOut', done) {
      return new Promise(res => {
        this.list.push({ t0: performance.now(), dur: dur * 1000, fn, ease, done: () => { done && done(); res(); } });
      });
    },
    update(now) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const tw = this.list[i];
        let k = Math.min(1, (now - tw.t0) / tw.dur);
        const e = EASE[tw.ease](k);
        tw.fn(e, k);
        if (k >= 1) { this.list.splice(i, 1); tw.done(); }
      }
    },
  };
  const EASE = {
    lin: k => k,
    inOut: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
    out: k => 1 - Math.pow(1 - k, 3),
    in: k => k * k * k,
    back: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    bounce: k => { const n1 = 7.5625, d1 = 2.75; if (k < 1 / d1) return n1 * k * k; if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + .75; if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + .9375; return n1 * (k -= 2.625 / d1) * k + .984375; },
  };
  const wait = s => new Promise(r => setTimeout(r, s * 1000));

  // ---------- VN ----------
  const vn = $('#vn'), vnBox = $('#vn-box'), vnName = $('#vn-name'), vnText = $('#vn-text'), vnNext = $('#vn-next'), vnChoices = $('#vn-choices');
  let typing = null, advance = null, auto = false, skip = false;
  const VN = {
    speaker: null, // objeto com setExpr/talk (sprite do personagem na cena)
    show() { vn.classList.remove('hidden'); },
    hide() { vn.classList.add('hidden'); vnChoices.innerHTML = ''; },
    // say(nome, texto, {expr})
    say(name, text, opt = {}) {
      this.show();
      vnChoices.innerHTML = '';
      vnName.textContent = name || '';
      vnName.classList.toggle('empty', !name);
      vnNext.classList.remove('show');
      if (this.speaker && opt.expr) this.speaker.setExpr(opt.expr);
      return new Promise(res => {
        const html = text;
        const plain = html.replace(/<[^>]+>/g, '');
        let i = 0;
        clearInterval(typing);
        const speed = skip ? 1 : 22;
        const sp = this.speaker;
        if (sp && name && sp.name === name) sp.talk(true);
        const finish = () => {
          clearInterval(typing); typing = null;
          vnText.innerHTML = html;
          vnNext.classList.add('show');
          if (sp) sp.talk(false);
        };
        typing = setInterval(() => {
          i += skip ? 6 : 1;
          if (i >= plain.length) { finish(); if (auto || skip) setTimeout(() => advance && advance(), skip ? 80 : 1400); return; }
          vnText.textContent = plain.slice(0, i);
          if (i % 3 === 0 && !skip) AUDIO.sfx('blip', { vol: 0.25, rate: 1.1 + Math.random() * 0.3 });
        }, speed);
        advance = () => {
          if (typing) { finish(); return; }
          advance = null; AUDIO.sfx('click', { vol: .4 }); res();
        };
      });
    },
    setSkip(v) { skip = !!v; const s = document.querySelector('#vn-quick [data-q="skip"]'); if (s) s.classList.toggle('on', skip); if (skip && advance) advance(); },
    get skipping() { return skip; },
    // choose([{label, sub, value, disabled}]) => value
    choose(opts) {
      this.show();
      vnNext.classList.remove('show');
      return new Promise(res => {
        vnChoices.innerHTML = '';
        for (const o of opts) {
          const b = document.createElement('div');
          b.className = 'choice' + (o.disabled ? ' disabled' : '');
          b.innerHTML = o.label + (o.sub ? `<small>${o.sub}</small>` : '');
          b.onmouseenter = () => AUDIO.sfx('hover', { vol: .4 });
          b.onclick = e => { e.stopPropagation(); AUDIO.sfx('select'); vnChoices.innerHTML = ''; res(o.value); };
          vnChoices.appendChild(b);
        }
      });
    },
  };
  vnBox.addEventListener('click', () => advance && advance());
  document.getElementById('cut-skip').onclick = () => { VN.setSkip(!skip); document.getElementById('cut-skip').classList.toggle('on', skip); };
  window.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'Enter') && !vn.classList.contains('hidden') && advance && !vnChoices.children.length) { e.preventDefault(); advance(); }
  });
  document.querySelectorAll('#vn-quick span').forEach(s => s.onclick = () => {
    if (s.dataset.q === 'auto') { auto = !auto; s.classList.toggle('on', auto); if (auto && advance && !typing) advance(); }
    if (s.dataset.q === 'skip') { skip = !skip; s.classList.toggle('on', skip); if (skip && advance) advance(); }
  });

  // ---------- telas, toasts, efeitos ----------
  const screen = $('#screen');
  const UI = {
    $,
    screen(html, cls = 'stripes') {
      screen.className = cls; screen.innerHTML = html; screen.classList.remove('hidden');
      screen.querySelectorAll('.btn,.menu-item,.big-choice,.up-card').forEach(b => b.addEventListener('mouseenter', () => AUDIO.sfx('hover', { vol: .35 })));
      return screen;
    },
    closeScreen() { screen.classList.add('hidden'); screen.innerHTML = ''; },
    toast(msg, kind = '') {
      const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg;
      $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3100);
    },
    floatMoney(v, x, y) {
      const d = document.createElement('div'); d.className = 'float-money';
      d.textContent = (v >= 0 ? '+' : '−') + ' R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');
      d.style.color = v >= 0 ? '#1b7a3a' : '#c1121f';
      d.style.left = (x ?? window.innerWidth / 2 - 60) + 'px'; d.style.top = (y ?? 90) + 'px';
      document.body.appendChild(d); setTimeout(() => d.remove(), 1500);
    },
    flash(color = '#fff', op = .8) {
      const f = $('#flash'); f.style.background = color; f.style.setProperty('--fop', op);
      f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    },
    shake() { document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); },
    glitch() { const g = $('#glitch'); g.classList.remove('on'); void g.offsetWidth; g.classList.add('on'); AUDIO.sfx('glitch', { vol: .6 }); },
    bigText(txt, color) {
      const d = document.createElement('div'); d.className = 'big-win'; d.textContent = txt;
      if (color) d.style.color = color;
      document.body.appendChild(d); setTimeout(() => d.remove(), 2500);
    },
    tooltip(text, x, y) {
      const t = $('#tooltip');
      if (!text) { t.classList.remove('show'); return; }
      t.textContent = text; t.style.left = (x + 16) + 'px'; t.style.top = (y + 14) + 'px'; t.classList.add('show');
    },
    money(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); },
  };

  // ---------- sprite de personagem dentro da cena 3D ----------
  // Cria um plano com a arte SVG do personagem; troca de expressão, piscar e boca falando
  async function makeSprite(charDef, height = 3.2) {
    const exprs = ['neutral', 'smile', 'happy', 'sad', 'angry', 'surprised', 'blush', 'worried', 'smug'];
    const tex = {};
    const jobs = [];
    for (const e of exprs) {
      for (const v of ['', 'b', 't']) {
        const svg = CHARS.drawCharacter(charDef.spec, e, { blink: v === 'b', talk: v === 't' });
        jobs.push(ASSETS.svgTexture(svg, 480, 720).then(t => { tex[e + v] = t; }));
      }
    }
    await Promise.all(jobs);
    const mat = new THREE.MeshBasicMaterial({ map: tex.neutral, transparent: true, alphaTest: 0.02, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * 600 / 900, height), mat);
    mesh.renderOrder = 2;
    const holder = new THREE.Group(); holder.add(mesh); mesh.position.y = height / 2;
    let expr = 'neutral', talking = false, blinkT = 2 + Math.random() * 3, mouthT = 0, mouthOpen = false, hop = 0;
    const sp = {
      name: charDef.name, obj: holder, mesh,
      setExpr(e) { if (tex[e]) { if (e !== expr) hop = 0.25; expr = e; } },
      talk(on) { talking = on; if (!on) mouthOpen = false; },
      update(dt) {
        blinkT -= dt;
        let v = '';
        if (blinkT < 0) { v = 'b'; if (blinkT < -0.13) blinkT = 2.5 + Math.random() * 3.5; }
        if (talking) { mouthT -= dt; if (mouthT < 0) { mouthOpen = !mouthOpen; mouthT = 0.09 + Math.random() * 0.08; } if (mouthOpen && v === '') v = 't'; }
        const t = tex[expr + v] || tex[expr];
        if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
        if (hop > 0) { hop -= dt; mesh.position.y = height / 2 + Math.sin((0.25 - hop) / 0.25 * Math.PI) * 0.08; } else mesh.position.y = height / 2 + Math.sin(ENGINE.t * 1.6) * 0.008;
      },
      dispose() { Object.values(tex).forEach(t => t && t.dispose()); mat.dispose(); mesh.geometry.dispose(); },
    };
    return sp;
  }

  window.ENGINE = ENGINE; window.TWEENS = TWEENS; window.EASE = EASE; window.wait = wait;
  window.VN = VN; window.UI = UI; window.makeSprite = makeSprite;
})();
