// Cassino 3D — caça-níqueis, roleta, lotérica (raspadinha + Mega-Sorte) e caixa misteriosa
(function () {
  const V3 = THREE.Vector3;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .5, metalness: .2 }, o));
  const E = (color, i = 1) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: i, roughness: 1 });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07010d);
  scene.fog = new THREE.FogExp2(0x12021c, 0.035);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 80);

  // pós-processamento (bloom neon)
  let composer = null, bloom = null;
  function setupComposer() {
    const r = ENGINE.renderer;
    composer = new THREE.EffectComposer(r);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.45, 0.72);
    composer.addPass(bloom);
    CASINO.composer = composer;
  }

  scene.add(new THREE.AmbientLight(0x331144, 0.9));
  scene.add(new THREE.HemisphereLight(0x8844ff, 0x220011, 0.5));
  const pulseLights = [];
  const colors = [0xff2bd6, 0x29f3ff, 0xffd23f, 0x7b2ff7, 0x52ff8f, 0xff4d4d];
  [[-8, 3.5, -5], [8, 3.5, -5], [-8, 3.5, 4], [8, 3.5, 4], [0, 4, -1], [0, 3.5, 5]].forEach((p, i) => {
    const l = new THREE.PointLight(colors[i], 1.2, 16, 1.6); l.position.set(...p); scene.add(l); pulseLights.push(l);
  });
  const spots = [];

  const stations = {
    lobby: { pos: new V3(0, 2.6, 10.5), look: new V3(0, 1.4, -2) },
    slots: { pos: new V3(0, 2.1, 1.6), look: new V3(0, 1.6, -4.5) },
    roulette: { pos: new V3(-3.2, 3.6, 3.2), look: new V3(-6, 1, 0.6) },
    lottery: { pos: new V3(3.3, 2.0, 0.6), look: new V3(7, 1.5, -1.2) },
    mystery: { pos: new V3(3.2, 2.2, 5.6), look: new V3(6, 1.0, 3.2) },
  };
  let camTarget = { pos: stations.lobby.pos.clone(), look: stations.lobby.look.clone() };
  const camLook = stations.lobby.look.clone();
  camera.position.copy(stations.lobby.pos); camera.lookAt(camLook);

  let built = false;
  const neonMats = [];
  const bulbs = [];
  let discoBall = null;
  const machines = [];
  let wheel = null, ball = null, vending = null, vendLight = null, lootbox = null, hostess = null;
  let speakers = [];

  function tex(w, h, f) { return ASSETS.canvasTex(w, h, f); }

  function build() {
    if (built) return; built = true;
    // piso: carpete de cassino
    const carpet = tex(512, 512, (g, w, h) => {
      g.fillStyle = '#2a0636'; g.fillRect(0, 0, w, h);
      const cols = ['#ff2bd6', '#29f3ff', '#ffd23f', '#7b2ff7'];
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
        g.save(); g.translate(x + 32, y + 32); g.rotate(((x + y) / 64) % 2 ? .78 : 0);
        g.strokeStyle = cols[((x + y) / 64) % 4]; g.lineWidth = 3; g.strokeRect(-18, -18, 36, 36);
        g.fillStyle = cols[((x / 64) + 1) % 4]; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.restore();
      }
    });
    carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(8, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), M(0xffffff, { map: carpet, roughness: .35, metalness: .25 }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const wallM = M(0x1a0426, { roughness: .8 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), wallM); back.position.set(0, 3.5, -7.5); scene.add(back);
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(20, 7), wallM); lw.rotation.y = Math.PI / 2; lw.position.set(-10, 3.5, 0); scene.add(lw);
    const rw = lw.clone(); rw.rotation.y = -Math.PI / 2; rw.position.x = 10; scene.add(rw);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), M(0x0c0214)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 6; scene.add(ceil);
    // faixas neon nas paredes
    const strip = (x, y, z, w, h, d, c) => { const m = E(c, 2.2); neonMats.push({ m, c, ph: Math.random() * 6 }); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); scene.add(b); return b; };
    for (const [y, c] of [[0.25, 0xff2bd6], [5.4, 0x29f3ff], [2.9, 0x7b2ff7]]) {
      strip(0, y, -7.45, 25, .08, .05, c); strip(-9.95, y, 0, .05, .08, 19.5, c); strip(9.95, y, 0, .05, .08, 19.5, c);
    }
    // letreiro principal
    const signT = tex(1024, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.textAlign = 'center';
      g.font = 'bold 150px Fredoka, sans-serif'; g.shadowColor = '#ff2bd6'; g.shadowBlur = 40; g.fillStyle = '#ffe3fb';
      g.fillText('LUCKY ♥ NEON', w / 2, 175); g.fillText('LUCKY ♥ NEON', w / 2, 175);
    });
    const signM = new THREE.MeshBasicMaterial({ map: signT, transparent: true, toneMapped: false, color: 0xffffff });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), signM); sign.position.set(0, 4.7, -7.4); scene.add(sign);
    neonMats.push({ basic: signM });
    // placas cyberpunk (modelo baixado)
    const cs = ASSETS.get('signs', { size: 4.5 }); cs.position.set(-6.2, 2.4, -7.3); scene.add(cs);
    const cs2 = ASSETS.get('signs', { size: 4.5 }); cs2.position.set(6.2, 2.4, -7.3); cs2.rotation.y = 0; scene.add(cs2);
    [cs, cs2].forEach(o => o.traverse(m => { if (m.isMesh && m.material.emissive) { m.material.emissiveIntensity = 1.6; if (m.material.emissive.getHex() === 0) m.material.emissive.copy(m.material.color).multiplyScalar(.6); } }));
    // globo espelhado
    discoBall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .12, flatShading: true, emissive: 0x442255 }));
    discoBall.position.set(0, 5.1, 0); scene.add(discoBall);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .9), M(0x999999)); rope.position.set(0, 5.75, 0); scene.add(rope);
    // holofotes (modelo baixado) + luzes spot girando
    [[-7, 5.6, -4], [7, 5.6, -4], [-7, 5.6, 5], [7, 5.6, 5]].forEach((p, i) => {
      const s = ASSETS.get('spotlight', { size: 0.9 }); s.position.set(p[0], p[1] - .9, p[2]); s.rotation.y = i * 1.3; scene.add(s);
      const sl = new THREE.SpotLight(colors[i], 2.4, 22, 0.35, 0.6, 1.2); sl.position.set(...p); scene.add(sl, sl.target);
      spots.push({ sl, ph: i * 1.7 });
    });
    // caixas de som (modelo baixado) que pulsam
    [[-9, -6.4], [9, -6.4]].forEach(([x, z]) => { const s = ASSETS.get('speaker', { size: 2.4 }); s.position.set(x, 0, z); s.rotation.y = x < 0 ? .5 : -.5; scene.add(s); speakers.push(s); });
    // decoração: ícone do cassino, dados, fichas, dinheiro, troféu
    const icon = ASSETS.get('casino_icon', { size: 2.4 }); icon.position.set(-8.3, 0, -1.8); icon.rotation.y = .9; scene.add(icon);
    const gi = ASSETS.get('gambleicon', { size: 1.6 }); gi.position.set(8.4, 0, 1.0); gi.rotation.y = -1.2; scene.add(gi);
    for (let i = 0; i < 6; i++) { const d = ASSETS.get('dice', { size: .35 }); d.position.set(-8.8 + Math.random() * 1.5, 0, 2.5 + Math.random() * 2); d.rotation.set(0, Math.random() * 6, 0); scene.add(d); }

    // --- caça-níqueis ---
    const defs = [
      { name: 'CEREJA CLÁSSICA', color: 0xc1121f, trim: 0xffd23f, top: 'cherry', bets: [10, 25, 50], x: -3.3 },
      { name: 'DIAMANTE DUPLO', color: 0x3a0ca3, trim: 0x29f3ff, top: 'diamond', bets: [50, 100, 250], x: 0 },
      { name: 'MEGA JACKPOT', color: 0x111111, trim: 0xff2bd6, top: 'trophy', bets: [100, 250, 500], x: 3.3, mega: true },
    ];
    defs.forEach((d, i) => machines.push(buildSlot(d, i)));

    // --- roleta ---
    buildRoulette();
    // --- lotérica: máquina de venda (modelo baixado) ---
    vending = ASSETS.get('vending', { size: 2.9 }); vending.position.set(7.4, 0, -1.2); vending.rotation.y = -Math.PI / 2; scene.add(vending);
    vending.traverse(m => { if (m.isMesh && m.material.emissive) { m.material.emissive.setHex(0x331133); } });
    const lt = tex(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = 'bold 80px Fredoka, sans-serif'; g.shadowColor = '#52ff8f'; g.shadowBlur = 24; g.fillStyle = '#eafff0'; g.fillText('LOTÉRICA', w / 2, 95); g.fillText('LOTÉRICA', w / 2, 95); });
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .6), new THREE.MeshBasicMaterial({ map: lt, transparent: true, toneMapped: false }));
    lm.position.set(7.3, 3.4, -1.2); lm.rotation.y = -Math.PI / 2; scene.add(lm);
    vendLight = new THREE.PointLight(0x52ff8f, 1.0, 6); vendLight.position.set(6.2, 2.2, -1.2); scene.add(vendLight);
    // --- caixa misteriosa (modelo baixado) em pedestal ---
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(.8, .95, 1.0, 32), M(0x2b0a3d, { metalness: .6, roughness: .3 })); ped.position.set(6.2, .5, 3.2); scene.add(ped);
    const pring = new THREE.Mesh(new THREE.TorusGeometry(.82, .04, 8, 40), E(0xffd23f, 2)); pring.rotation.x = Math.PI / 2; pring.position.set(6.2, 1.0, 3.2); scene.add(pring);
    neonMats.push({ m: pring.material, c: 0xffd23f, ph: 1 });
    lootbox = ASSETS.get('lootbox', { size: 1.1 }); lootbox.position.set(6.2, 1.0, 3.2); lootbox.rotation.y = -0.6; scene.add(lootbox);
    const ll = new THREE.SpotLight(0xffd23f, 2.5, 8, .4, .5); ll.position.set(6.2, 5.5, 3.2); ll.target = lootbox; scene.add(ll);
    const mt = tex(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = 'bold 62px Fredoka, sans-serif'; g.shadowColor = '#ffd23f'; g.shadowBlur = 24; g.fillStyle = '#fffbe6'; g.fillText('CAIXA MISTERIOSA', w / 2, 88); g.fillText('CAIXA MISTERIOSA', w / 2, 88); });
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({ map: mt, transparent: true, toneMapped: false }));
    mm.position.set(6.2, 2.9, 3.2); mm.rotation.y = -Math.PI / 2 + .4; scene.add(mm);
  }

  // ---------- caça-níquel ----------
  const SYMBOLS = ['cherry', 'spade', 'bellsym', 'coin', 'diamond', 'trophy'];
  const SYM_NAME = { cherry: 'Cereja', spade: 'Espada', bellsym: 'Sino', coin: 'Moeda', diamond: 'Diamante', trophy: 'Troféu' };
  const WEIGHTS = { cherry: 6, spade: 5, bellsym: 4, coin: 3, diamond: 2, trophy: 1 };
  const PAY3 = { cherry: 5, spade: 8, bellsym: 12, coin: 20, diamond: 50, trophy: 250 };
  const FACES = ['cherry', 'spade', 'bellsym', 'cherry', 'coin', 'spade', 'diamond', 'trophy'];

  function buildSlot(d, idx) {
    const g = new THREE.Group(); g.position.set(d.x, 0, -4.6); scene.add(g);
    const body = M(d.color, { metalness: .5, roughness: .25 });
    const trimM = E(d.trim, 1.8); neonMats.push({ m: trimM, c: d.trim, ph: idx });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 1.1), body); base.position.y = .5; g.add(base);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.85), body); upper.position.set(0, 1.85, -.1); g.add(upper);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, .55, .9), M(0x111111, { metalness: .6 })); top.position.set(0, 2.98, -.1); g.add(top);
    // painel do nome
    const nameT = tex(512, 128, (c, w, h) => { c.fillStyle = '#12001d'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.font = 'bold 58px Fredoka, sans-serif'; c.shadowColor = '#' + d.trim.toString(16).padStart(6, '0'); c.shadowBlur = 20; c.fillStyle = '#fff'; c.fillText(d.name, w / 2, 84); c.fillText(d.name, w / 2, 84); });
    const np = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .45), new THREE.MeshBasicMaterial({ map: nameT, toneMapped: false })); np.position.set(0, 2.98, .36); g.add(np);
    // lâmpadas ao redor
    const bl = [];
    for (let i = 0; i < 16; i++) {
      const t = i / 16; let x, y;
      if (t < .25) { x = -.85 + t * 4 * 1.7; y = 2.72; } else if (t < .5) { x = .85; y = 2.72 - (t - .25) * 4 * 1.55; } else if (t < .75) { x = .85 - (t - .5) * 4 * 1.7; y = 1.17; } else { x = -.85; y = 1.17 + (t - .75) * 4 * 1.55; }
      const bm = E(0xffe066, 2); const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), bm); b.position.set(x, y, .34); g.add(b); bl.push(bm);
    }
    bulbs.push(bl);
    // janela dos rolos
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, .95, .1), M(0x050505)); win.position.set(0, 1.95, .3); g.add(win);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(.1, .02, 6, 4), trimM);
    for (const [x, y, w, h] of [[0, 2.45, 1.5, .06], [0, 1.45, 1.5, .06], [-.73, 1.95, .06, 1.05], [.73, 1.95, .06, 1.05]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, .08), trimM); f.position.set(x, y, .37); g.add(f); }
    // rolos: cilindros com os símbolos 3D baixados em volta
    const reels = [];
    const reelM = M(0xd9ccb0, { roughness: .95, metalness: 0 });
    for (let r = 0; r < 3; r++) {
      const reel = new THREE.Group(); reel.position.set(-.44 + r * .44, 1.95, -0.08); g.add(reel);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .4, 32, 1, false), reelM); cyl.rotation.z = Math.PI / 2; reel.add(cyl);
      FACES.forEach((s, i) => {
        const th = i / FACES.length * Math.PI * 2;
        const o = ASSETS.get(s, { size: s === 'trophy' ? .26 : .24, fit: 'max' });
        const piv = new THREE.Group(); const sz = o.userData.size; o.position.y -= sz.y / 2; piv.add(o);
        if (s === 'spade') piv.scale.z = 3;
        piv.position.set(0, Math.sin(th) * .44, Math.cos(th) * .44); piv.rotation.x = -th;
        reel.add(piv);
      });
      reel.userData.angle = 0; reels.push(reel);
    }
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .95), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .12, roughness: .05, metalness: .5 })); glass.position.set(0, 1.95, .36); g.add(glass);
    // linha de pagamento
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.42, .015, .01), E(0xff3b3b, 2)); pl.position.set(0, 1.95, .37); g.add(pl);
    // visor LED
    const ledCanvasTex = tex(512, 96, () => { });
    const led = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .24), new THREE.MeshBasicMaterial({ map: ledCanvasTex, toneMapped: false })); led.position.set(0, 1.3, .31); g.add(led);
    // bandeja de moedas
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, .12, .35), M(0xc0c6cf, { metalness: .9, roughness: .2 })); tray.position.set(0, .55, .62); g.add(tray);
    const cp = ASSETS.get('coinpile', { size: .55 }); cp.position.set(.15, .6, .62); g.add(cp);
    // alavanca (modelo baixado)
    const lev = new THREE.Group(); lev.position.set(.92, 1.75, .05); g.add(lev);
    const lv = ASSETS.get('lever', { size: .5, fit: 'max' }); lv.rotation.y = Math.PI / 2; lv.position.y = -.2; lev.add(lv);
    ASSETS.tint(lv, 0x9aa0a8, .6);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), E(0xff2b2b, 1.5)); knob.position.set(.05, .45, 0); lev.add(knob);
    // enfeite no topo (modelo baixado)
    const orn = ASSETS.get(d.top, { size: .55, fit: 'max' }); orn.position.set(0, 3.26, -.1); g.add(orn);
    // banquinho (modelo baixado)
    const st = ASSETS.get('stool', { size: 1.0 }); st.position.set(d.x, 0, -3.1); scene.add(st);
    const light = new THREE.PointLight(d.trim, 0.6, 3.5); light.position.set(0, 2.4, 1.4); g.add(light);
    const m = { def: d, g, reels, led: ledCanvasTex, lever: lev, orn, light, spinning: false, bulbs: bl, winFlash: 0 };
    setLED(m, 'APOSTE!', '#ff2bd6');
    return m;
  }
  function setLED(m, txt, color = '#ffd23f') {
    const cv = m.led.userData.canvas, g = cv.getContext('2d');
    g.fillStyle = '#0b0010'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = color; g.font = 'bold 60px Consolas, monospace'; g.textAlign = 'center'; g.shadowColor = color; g.shadowBlur = 16;
    g.fillText(txt, cv.width / 2, 68);
    m.led.needsUpdate = true;
  }

  function pickSymbol() {
    const luck = (window.GAME && GAME.luck()) || 0;
    const w = Object.assign({}, WEIGHTS);
    w.cherry += luck * 0.5; w.trophy += luck * 0.15; w.diamond += luck * 0.25;
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const s of SYMBOLS) { r -= w[s]; if (r <= 0) return s; }
    return 'cherry';
  }
  function payout(res, bet, mega) {
    const [a, b, c] = res;
    if (a === b && b === c) {
      if (a === 'trophy' && mega) return { win: jackpot, jackpot: true, mult: 0 };
      return { win: bet * PAY3[a], mult: PAY3[a] };
    }
    const cherries = res.filter(x => x === 'cherry').length;
    if (cherries === 2) return { win: bet * 2, mult: 2 };
    for (const [s, m] of [['diamond', 3], ['trophy', 5]]) if (res.filter(x => x === s).length === 2) return { win: bet * m, mult: m };
    return { win: 0, mult: 0 };
  }
  let jackpot = 5000;

  async function spinSlot(m, bet) {
    if (m.spinning) return;
    m.spinning = true;
    const free = GAME.useFreeSpin();
    if (!free) GAME.addMoney(-bet, true); else UI.toast('⚡ Giro grátis!', 'gold');
    if (m.def.mega) jackpot += Math.round(bet * 0.2 * (1 + GAME.mod('jackpot')));
    AUDIO.sfx('lever'); AUDIO.sfx('chipLay');
    TWEENS.add(0.25, e => { m.lever.rotation.x = e * 1.1; }, 'out').then(() => TWEENS.add(0.4, e => { m.lever.rotation.x = 1.1 * (1 - e); }, 'bounce'));
    AUDIO.sfx('spinStart', { vol: .5 });
    setLED(m, 'GIRANDO...', '#29f3ff');
    const res = [pickSymbol(), pickSymbol(), pickSymbol()];
    const jobs = m.reels.map((reel, i) => {
      const options = FACES.map((f, k) => f === res[i] ? k : -1).filter(k => k >= 0);
      const k = options[(Math.random() * options.length) | 0];
      const th = k / FACES.length * Math.PI * 2;
      const a0 = reel.userData.angle;
      const turns = Math.ceil(a0 / (Math.PI * 2)) + 3 + i;
      const a1 = th + turns * Math.PI * 2;
      const dur = 1.3 + i * 0.45;
      let lastTick = 0;
      return TWEENS.add(dur, e => {
        reel.rotation.x = a0 + (a1 - a0) * e; reel.userData.angle = reel.rotation.x;
        const tk = Math.floor(reel.rotation.x / (Math.PI * 2 / FACES.length));
        if (tk !== lastTick && e < .97) { lastTick = tk; if (i === 0 || Math.random() < .5) AUDIO.sfx('reelTick', { vol: .25 }); }
      }, 'back').then(() => AUDIO.sfx('reelStop', { vol: .7 }));
    });
    await Promise.all(jobs);
    const p = payout(res, bet, m.def.mega);
    m.spinning = false;
    const luckMult = (window.GAME && GAME.payMult()) || 1;
    let win = Math.round(p.win * (p.jackpot ? 1 : luckMult));
    const st = GAME.casinoSettle({ game: 'slot', bet: free ? 0 : bet, win, jackpot: p.jackpot });
    win = st.win;
    if (st.refund) GAME.addMoney(st.refund, true);
    if (win > 0) {
      GAME.addMoney(win, true);
      if (p.jackpot) { jackpot = 5000; UI.bigText('JACKPOT!!!'); AUDIO.sfx('jackpot'); celebrate(m, 5); setLED(m, UI.money(win), '#ffd23f'); }
      else if (p.mult >= 20) { UI.bigText('SUPER PRÊMIO!'); AUDIO.sfx('bigWin'); celebrate(m, 3); setLED(m, '+' + UI.money(win), '#52ff8f'); }
      else { AUDIO.sfx(p.mult >= 5 ? 'win' : 'winSmall'); celebrate(m, p.mult >= 5 ? 1.5 : .7); setLED(m, '+' + UI.money(win), '#52ff8f'); }
      AUDIO.sfx('chips');
      CASINO.onResult && CASINO.onResult({ game: 'slot', bet: free ? 0 : bet, win, res });
    } else {
      setLED(m, 'TENTE DE NOVO', '#ff4d6d');
      AUDIO.sfx('loseSmall', { vol: .6 });
      CASINO.onResult && CASINO.onResult({ game: 'slot', bet: free ? 0 : bet, win: 0, res });
    }
    return { res, win };
  }

  // chuva de moedas (modelo baixado) + luzes
  const flying = [];
  function celebrate(m, power) {
    strobe = 1.5 * power;
    UI.flash('#ffe066', .35);
    const origin = m ? m.g.localToWorld(new V3(0, .7, .7)) : new V3(0, 1.5, 0);
    const n = Math.min(60, Math.round(12 * power));
    for (let i = 0; i < n; i++) {
      const c = ASSETS.get('coin', { size: .22, cloneMat: false });
      c.position.copy(origin);
      c.userData.v = new V3((Math.random() - .5) * 3, 3 + Math.random() * 4, 1.5 + Math.random() * 2.5);
      c.userData.rv = new V3(Math.random() * 10, Math.random() * 10, 0);
      c.userData.life = 2.5;
      scene.add(c); flying.push(c);
    }
    if (m) m.winFlash = 2 * power;
  }
  let strobe = 0;

  // ---------- roleta ----------
  const RSEQ = [0, 1, 8, 2, 9, 3, 10, 4, 11, 5, 12, 6, 13, 7, 14];
  const rColor = n => n === 0 ? 'green' : (n <= 7 ? 'red' : 'black');
  function buildRoulette() {
    const table = new THREE.Group(); table.position.set(-6, 0, 0.6); scene.add(table);
    const felt = tex(1024, 512, (g, w, h) => {
      g.fillStyle = '#0f5b2e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
      const zones = [['VERMELHO 2x', '#c1121f', 560], ['PRETO 2x', '#111', 740], ['VERDE 14x', '#1a936f', 900]];
      zones.forEach(([t, c, x]) => { g.fillStyle = c; g.fillRect(x - 80, 150, 160, 220); g.strokeStyle = '#ffd23f'; g.lineWidth = 4; g.strokeRect(x - 80, 150, 160, 220); g.save(); g.translate(x, 260); g.rotate(-Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 34px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(t, 0, 12); g.restore(); });
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.2, .2, 2.6), [M(0x5c2e0e), M(0x5c2e0e), M(0xffffff, { map: felt, roughness: .9 }), M(0x5c2e0e), M(0x5c2e0e), M(0x5c2e0e)]);
    top.position.set(0.4, 1.0, 0); top.rotation.y = Math.PI / 2; table.add(top);
    const legM = M(0x3b1d08);
    for (const [x, z] of [[-1, -2], [1, -2], [-1, 2.6], [1, 2.6]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.2, 1, .2), legM); l.position.set(x + .4, .5, z * .9 - .2); table.add(l); }
    // roda
    const wt = tex(1024, 1024, (g, w, h) => {
      const cx = w / 2, cy = h / 2, R = w / 2 - 4;
      RSEQ.forEach((n, i) => {
        const a0 = i / 15 * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / 15 * Math.PI * 2 - Math.PI / 2;
        g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath();
        g.fillStyle = rColor(n) === 'green' ? '#1a936f' : rColor(n) === 'red' ? '#c1121f' : '#151515'; g.fill();
        g.strokeStyle = '#ffd23f'; g.lineWidth = 4; g.stroke();
        const am = (a0 + a1) / 2; g.save(); g.translate(cx + Math.cos(am) * R * .82, cy + Math.sin(am) * R * .82); g.rotate(am + Math.PI / 2);
        g.fillStyle = '#fff'; g.font = 'bold 56px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(n, 0, 20); g.restore();
      });
      g.fillStyle = '#3b1d08'; g.beginPath(); g.arc(cx, cy, R * .45, 0, 7); g.fill();
      g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R * .45, 0, 7); g.stroke();
    });
    wheel = new THREE.Group(); wheel.position.set(-6, 1.12, -0.35); scene.add(wheel);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, .08, 60), [M(0x3b1d08), M(0xffffff, { map: wt, roughness: .4 }), M(0x3b1d08)]);
    wheel.add(disk);
    const hub = new THREE.Mesh(new THREE.ConeGeometry(.18, .35, 16), M(0xffd23f, { metalness: 1, roughness: .2 })); hub.position.y = .2; wheel.add(hub);
    for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .05), M(0xffd23f, { metalness: 1 })); a.position.y = .3; a.rotation.y = i * Math.PI / 4; wheel.add(a); }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, .08, 12, 60), M(0x6b3a17, { metalness: .3 })); rim.rotation.x = Math.PI / 2; rim.position.set(-6, 1.15, -0.35); scene.add(rim);
    const rimN = new THREE.Mesh(new THREE.TorusGeometry(1.14, .025, 8, 60), E(0xff2bd6, 2)); rimN.rotation.x = Math.PI / 2; rimN.position.set(-6, 1.16, -0.35); scene.add(rimN);
    neonMats.push({ m: rimN.material, c: 0xff2bd6, ph: 2 });
    ball = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), M(0xffffff, { roughness: .1, metalness: .2, emissive: 0x333333 }));
    ball.position.set(-6, 1.2, -0.35 + .95); scene.add(ball);
    wheel.userData.a = 0; ball.userData.a = 0;
    // fichas e dinheiro (modelos baixados)
    const ch = ASSETS.get('chips', { size: .8 }); ch.position.set(-5.2, 1.1, 1.8); scene.add(ch);
    const cash = ASSETS.get('cash', { size: .8 }); cash.position.set(-6.8, 1.1, 2.0); cash.rotation.y = .5; scene.add(cash);
    const chip1 = ASSETS.get('chip', { size: .3 }); chip1.position.set(-5.6, 1.1, 2.4); scene.add(chip1);
    const tr = new THREE.PointLight(0xffe0a0, 1.2, 5); tr.position.set(-6, 3, .6); scene.add(tr);
  }
  let rSpinning = false;
  async function spinRoulette(betColor, bet) {
    if (rSpinning) return null;
    rSpinning = true;
    GAME.addMoney(-bet, true);
    AUDIO.sfx('chipLay'); AUDIO.sfx('diceShake', { vol: .4 });
    let idx = (Math.random() * 15) | 0;
    let caught = false;
    if (GAME.consumeMod('rigged')) {
      // dado viciado: 70% de cair na cor apostada, 20% de ser pego
      if (Math.random() < .7) { const opts = RSEQ.map((nn, i) => rColor(nn) === betColor ? i : -1).filter(i => i >= 0); idx = opts[(Math.random() * opts.length) | 0]; }
      caught = Math.random() < .2;
    }
    const n = RSEQ[idx];
    const w0 = wheel.userData.a, w1 = w0 + Math.PI * 2 * (3 + Math.random());
    // No topo do CylinderGeometry, um ponto no ângulo θ (x=sinθ, z=cosθ) aparece no canvas no ângulo φ=-θ.
    // O setor idx foi desenhado centrado em φc; girando o disco em W, ele fica no ângulo de mundo W-φc.
    const phiC = (idx + .5) / 15 * Math.PI * 2 - Math.PI / 2;
    const b0 = ball.userData.a;
    let b1 = w1 - phiC; while (b1 > b0 - Math.PI * 2 * 5) b1 -= Math.PI * 2;
    let tick = 0;
    await TWEENS.add(4.2, (e, k) => {
      wheel.userData.a = w0 + (w1 - w0) * e; wheel.rotation.y = wheel.userData.a;
      ball.userData.a = b0 + (b1 - b0) * e;
      const r = 0.95 - Math.max(0, (k - .6) / .4) * .2;
      const bounce = k > .6 && k < .9 ? Math.abs(Math.sin(k * 60)) * .04 * (1 - k) * 3 : 0;
      ball.position.set(-6 + Math.sin(ball.userData.a) * r, 1.2 + bounce, -0.35 + Math.cos(ball.userData.a) * r);
      tick += 1; if (tick % 7 === 0 && k > .5 && k < .95) AUDIO.sfx('ball', { vol: .3 });
    }, 'out');
    rSpinning = false;
    const col = rColor(n);
    let win = 0;
    if (col === betColor) win = bet * (col === 'green' ? 14 : 2);
    win = Math.round(win * ((window.GAME && GAME.payMult()) || 1));
    const st = GAME.casinoSettle({ game: 'roulette', bet, win });
    win = st.win; if (st.refund) GAME.addMoney(st.refund, true);
    if (win) { GAME.addMoney(win, true); AUDIO.sfx(col === 'green' ? 'bigWin' : 'win'); celebrate(null, col === 'green' ? 3 : 1); if (col === 'green') UI.bigText('VERDE!!!', '#52ff8f'); }
    else AUDIO.sfx('loseSmall', { vol: .6 });
    CASINO.onResult && CASINO.onResult({ game: 'roulette', bet, win, caught });
    return { n, col, win, caught };
  }

  // ---------- caixa misteriosa ----------
  async function openBox(free) {
    const price = free ? 0 : 50;
    if (price) GAME.addMoney(-price, true);
    GAME.bumpMeta('boxes');
    AUDIO.sfx('packOpen');
    const b = lootbox; const y0 = b.position.y;
    await TWEENS.add(1.1, (e) => { b.rotation.z = Math.sin(e * 40) * .12 * (1 - e * .5); b.position.y = y0 + Math.abs(Math.sin(e * 20)) * .1; }, 'lin');
    b.rotation.z = 0;
    await TWEENS.add(0.3, e => { b.scale.setScalar(1 + Math.sin(e * Math.PI) * .35); }, 'out');
    b.position.y = y0;
    let r = Math.random();
    const bl = GAME.mod('box'); if (bl > 0) r = Math.pow(r, 1 / (1 + bl * .6));
    let res;
    if (r < .38) res = { txt: 'Poeira... e uma traça. Nada!', win: 0 };
    else if (r < .62) res = { txt: 'R$ 25 amassados!', win: 25 };
    else if (r < .77) res = { txt: 'R$ 60!', win: 60 };
    else if (r < .87) res = { txt: 'Uma peça grátis pro estoque!', part: true };
    else if (r < .94) res = { txt: 'R$ 120!!', win: 120 };
    else if (r < .98) res = { txt: 'UMA MELHORIA GRÁTIS!', upgrade: true };
    else if (r < .996) res = { txt: 'R$ 400!!!', win: 400 };
    else res = { txt: 'PRÊMIO MÁXIMO: R$ 2.000!!!', win: 2000 };
    if (res.win) { GAME.addMoney(res.win, true); AUDIO.sfx(res.win >= 120 ? 'bigWin' : 'winSmall'); }
    if (res.part) { res.txt += ' (' + GAME.giftPart() + ')'; AUDIO.sfx('winSmall'); }
    if (res.upgrade) { res.txt += ' ' + GAME.giftUpgrade(); AUDIO.sfx('bigWin'); }
    if (res.win || res.part || res.upgrade) celebrate(null, res.win >= 400 ? 4 : 1); else AUDIO.sfx('loseSmall');
    const wp = b.getWorldPosition(new V3());
    for (let i = 0; i < 20; i++) { /* confete */ }
    CASINO.onResult && CASINO.onResult({ game: 'box', bet: price, win: res.win || 0 });
    return res;
  }

  // ---------- lotérica ----------
  async function vendFlash() {
    AUDIO.sfx('card');
    await TWEENS.add(0.6, e => { vendLight.intensity = 1 + Math.sin(e * 30) * 2; }, 'lin');
    vendLight.intensity = 1;
  }

  // ---------- fumar (cigarro/charuto) — só no cassino ----------
  let smokeTex = null;
  const smokes = [];
  function puffSmoke(pos, big) {
    if (!smokeTex) smokeTex = tex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(235,235,245,.85)'); gr.addColorStop(.5, 'rgba(200,200,215,.35)'); gr.addColorStop(1, 'rgba(180,180,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const n = big ? 7 : 2;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: big ? .75 : .5 }));
      s.position.copy(pos).add(new V3((Math.random() - .5) * .05, 0, (Math.random() - .5) * .05));
      const sc = big ? .12 + Math.random() * .1 : .05;
      s.scale.setScalar(sc);
      s.userData = { v: new V3((Math.random() - .3) * (big ? .35 : .08), .18 + Math.random() * (big ? .25 : .1), (Math.random() - .5) * .1), life: big ? 2.6 : 1.6, max: big ? 2.6 : 1.6, grow: big ? .45 : .12 };
      scene.add(s); smokes.push(s);
    }
  }
  function updSmoke(dt) {
    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i]; const u = s.userData; u.life -= dt;
      s.position.addScaledVector(u.v, dt); u.v.multiplyScalar(.985);
      s.scale.addScalar(u.grow * dt); s.material.rotation += dt * .4;
      s.material.opacity = Math.max(0, (u.life / u.max)) * (u.grow > .3 ? .75 : .5);
      if (u.life <= 0) { scene.remove(s); s.material.dispose(); smokes.splice(i, 1); }
    }
  }
  async function smoke(kind = 'cigarro') {
    if (!camera.parent) scene.add(camera);
    const cigar = kind === 'charuto';
    const g = new THREE.Group();
    const len = cigar ? .2 : .16, rad = cigar ? .012 : .0065;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 16), M(cigar ? 0x6b3e1e : 0xf5f5f0, { roughness: .9, emissive: cigar ? 0x1a0d05 : 0x5a5a5a }));
    body.rotation.z = Math.PI / 2; g.add(body);
    if (!cigar) { const filt = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.02, rad * 1.02, .04, 16), M(0xe08a2e, { roughness: .8 })); filt.rotation.z = Math.PI / 2; filt.position.x = -len / 2 - .02; g.add(filt); }
    else { const band = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.05, rad * 1.05, .02, 16), M(0xffd23f, { metalness: .8 })); band.rotation.z = Math.PI / 2; band.position.x = -len * .25; g.add(band); }
    const emberM = new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff4400, emissiveIntensity: 1.2 });
    const ember = new THREE.Mesh(new THREE.CylinderGeometry(rad * .98, rad * .98, .012, 16), emberM); ember.rotation.z = Math.PI / 2; ember.position.x = len / 2 + .006; g.add(ember);
    const ash = new THREE.Mesh(new THREE.CylinderGeometry(rad * .95, rad * .95, .008, 16), M(0x777777, { roughness: 1 })); ash.rotation.z = Math.PI / 2; ash.position.x = len / 2 + .015; g.add(ash);
    const glow = new THREE.PointLight(0xff5a1a, .6, 1.2); glow.position.x = len / 2 + .02; g.add(glow);
    g.scale.setScalar(.8);
    camera.add(g);
    const rest = new V3(.24, -.23, -.52), mouth = new V3(.04, -.15, -.34);
    g.position.set(.45, -.45, -.5); g.rotation.set(.2, .5, .35);
    await TWEENS.add(.5, e => { g.position.lerpVectors(new V3(.45, -.45, -.5), rest, e); }, 'out');
    const haze = document.getElementById('haze');
    for (let p = 0; p < 3; p++) {
      await TWEENS.add(.45, e => { g.position.lerpVectors(rest, mouth, e); g.rotation.y = .5 - e * .3; }, 'inOut');
      AUDIO.heat(true, 'sizzle');
      await TWEENS.add(.7, e => { emberM.emissiveIntensity = 1.2 + Math.sin(e * Math.PI) * 4; glow.intensity = .6 + Math.sin(e * Math.PI) * 1.8; ash.position.x = len / 2 + .015 + e * .004; }, 'lin');
      AUDIO.heat(false);
      await TWEENS.add(.4, e => { g.position.lerpVectors(mouth, rest, e); g.rotation.y = .2 + e * .3; }, 'inOut');
      // solta a fumaça (baforada) na frente da câmera
      const out = camera.localToWorld(new V3(0, -.08, -.45));
      puffSmoke(out, true);
      if (haze) { haze.classList.remove('on'); void haze.offsetWidth; haze.classList.add('on'); }
      for (let k = 0; k < 6; k++) setTimeout(() => puffSmoke(g.localToWorld(new V3(len / 2 + .02, 0, 0)), false), k * 90);
      await wait(.35);
    }
    await TWEENS.add(.5, e => { g.position.lerpVectors(rest, new V3(.5, -.55, -.5), e); }, 'in');
    camera.remove(g);
    g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }

  // ---------- anfitriã ----------
  async function showHostess() {
    if (hostess) return hostess;
    hostess = await makeSprite(CHARS.HOSTESS, 2.3);
    hostess.obj.position.set(-2.6, 0.35, 7.2);
    hostess.obj.rotation.y = 0.25;
    scene.add(hostess.obj);
    return hostess;
  }

  // ---------- atualização ----------
  function update(dt, t) {
    // câmera suave
    camera.position.lerp(camTarget.pos, Math.min(1, dt * 3));
    camLook.lerp(camTarget.look, Math.min(1, dt * 3));
    camera.position.y += Math.sin(t * .8) * .002;
    camera.lookAt(camLook);
    const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.75)), 6); // ~105 bpm
    strobe = Math.max(0, strobe - dt);
    pulseLights.forEach((l, i) => {
      l.intensity = 0.8 + beat * 1.4 + (strobe > 0 ? (Math.sin(t * 40 + i) > 0 ? 2.5 : 0) : 0);
      if (strobe > 0 && Math.random() < .2) l.color.setHex(colors[(Math.random() * colors.length) | 0]);
    });
    spots.forEach((s, i) => {
      const a = t * .7 + s.ph;
      s.sl.target.position.set(Math.cos(a) * 6, 0, Math.sin(a * 1.3) * 5);
      s.sl.color.setHSL(((t * .08 + i * .25) % 1), 1, .55);
      s.sl.intensity = 2 + beat * 2;
    });
    neonMats.forEach((n, i) => {
      if (n.basic) { n.basic.color.setScalar(0.85 + beat * .3 + (Math.random() < .005 ? -.6 : 0)); return; }
      n.m.emissiveIntensity = 1.4 + Math.sin(t * 3 + n.ph) * .5 + beat * .8 + (strobe > 0 ? Math.random() * 2 : 0);
    });
    if (discoBall) { discoBall.rotation.y += dt * .6; }
    speakers.forEach(s => s.scale.setScalar(1 + beat * .04));
    // lâmpadas das máquinas em sequência
    bulbs.forEach((bl, mi) => {
      const m = machines[mi]; const fast = m && (m.spinning || m.winFlash > 0);
      if (m) m.winFlash = Math.max(0, m.winFlash - dt);
      bl.forEach((b, i) => { const on = ((Math.floor(t * (fast ? 22 : 7)) + i) % 4) < 2; b.emissiveIntensity = on ? 3 : .3; b.emissive.setHex(fast && m.winFlash > 0 ? colors[(i + Math.floor(t * 10)) % colors.length] : 0xffe066); });
      if (m) m.orn.rotation.y += dt * (fast ? 5 : .8);
    });
    if (lootbox) lootbox.rotation.y += dt * .4;
    if (hostess) hostess.update(dt);
    updSmoke(dt);
    // moedas voando
    for (let i = flying.length - 1; i >= 0; i--) {
      const c = flying[i]; c.userData.life -= dt;
      c.userData.v.y -= 9.8 * dt; c.position.addScaledVector(c.userData.v, dt);
      if (c.position.y < .05) { c.position.y = .05; c.userData.v.y *= -.4; c.userData.v.x *= .7; c.userData.v.z *= .7; }
      c.rotation.x += c.userData.rv.x * dt; c.rotation.y += c.userData.rv.y * dt;
      if (c.userData.life <= 0) { scene.remove(c); flying.splice(i, 1); }
    }
  }

  const CASINO = {
    scene, camera, composer: null,
    SYMBOLS, SYM_NAME, PAY3,
    get machines() { return machines; },
    get jackpot() { return jackpot; },
    init() { build(); },
    go(station, machineIdx) {
      const s = stations[station];
      if (station === 'slots' && machineIdx !== undefined) {
        const x = machines[machineIdx].def.x;
        camTarget = { pos: new V3(x, 2.35, -0.75), look: new V3(x, 1.75, -4.6) };
      } else camTarget = { pos: s.pos.clone(), look: s.look.clone() };
    },
    spinSlot, spinRoulette, openBox, vendFlash, showHostess, celebrate, smoke,
    onEnter() {
      build();
      if (!composer) setupComposer();
      AUDIO.music('casino');
    },
    onExit() { },
    update,
    onResult: null,
  };
  window.CASINO = CASINO;
  ENGINE.register('casino', CASINO);
})();
