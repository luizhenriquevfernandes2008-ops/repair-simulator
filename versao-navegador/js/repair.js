// Bancada de conserto 3D — sistema de etapas com ferramentas
(function () {
  const V3 = THREE.Vector3;
  const D2R = Math.PI / 180;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .55, metalness: .1 }, o));

  // ---------- catálogos ----------
  const DEVICES = {
    phone_iphone: { name: 'iFone 7', type: 'phone', value: 1.0 },
    notch: { name: 'Notch X Pro', type: 'phone', value: 1.2 },
    galaxy: { name: 'Galáxia S9', type: 'phone', value: 1.1 },
    redphone: { name: 'Xiaomy Rubi Note', type: 'phone', value: 0.9 },
    moto: { name: 'Motorolo G5', type: 'phone', value: 0.85 },
    lumia: { name: 'Nokio Lumen', type: 'phone', value: 0.8 },
    tablet: { name: 'iPed Air', type: 'tablet', value: 1.4 },
    ds: { name: 'NinDuo 3D', type: 'console', value: 1.2 },
    dslite: { name: 'NinDuo Lite', type: 'console', value: 1.0 },
    watch: { name: 'Relógio Clássico', type: 'watch', value: 0.9 },
    // --- novos ---
    pixel: { name: 'Pixelado 4', type: 'phone', value: 1.05 },
    tab2: { name: 'Galáxia Tab', type: 'tablet', value: 1.25 },
    switch: { name: 'Swítchi OLED', type: 'console', value: 1.35 },
    mac: { name: 'MacBrook Pro', type: 'laptop', value: 1.7 },
    notebook: { name: 'Notebook Negativo', type: 'laptop', value: 1.2 },
    xpad: { name: 'Controle XCaixa', type: 'controller', value: 0.75 },
    cubepad: { name: 'Controle CuboGame', type: 'controller', value: 0.8 },
    dslr: { name: 'Canoa PowerShot', type: 'camera', value: 1.3 },
    instax: { name: 'Polaroide Mini', type: 'camera', value: 0.9 },
    rotary: { name: 'Telefone de Disco', type: 'vintage', value: 0.8 },
    rotarypink: { name: 'Telefone Rosa Retrô', type: 'vintage', value: 0.85 },
    walkie: { name: 'Walkie-Talkie', type: 'audio', value: 0.7 },
    boombox: { name: 'Rádio Boombox', type: 'audio', value: 0.95 },
    jbl: { name: 'Caixinha JPL', type: 'audio', value: 0.9 },
    ipod: { name: 'iPódio Clássico', type: 'audio', value: 0.8 },
    shuffle: { name: 'iPódio Shuffle', type: 'audio', value: 0.65 },
    calc: { name: 'Calculadora Cassio', type: 'calc', value: 0.6 },
    nes: { name: 'Nintendinho', type: 'retro', value: 1.1, faults: ['button', 'chip', 'camera', 'water'] },
    gameboy: { name: 'GameKid Clássico', type: 'retro', value: 1.0 },
    tamago: { name: 'Tamagochi', type: 'pet', value: 0.6 },
    digiwatch: { name: 'Relógio Digital', type: 'watch', value: 0.8 },
    drone: { name: 'Drone DJá', type: 'drone', value: 1.6 },
    minidrone: { name: 'Minidrone Zumbi', type: 'drone', value: 1.1 },
    vr: { name: 'Óculos VR Missão', type: 'vr', value: 1.5 },
  };
  const FAULTS = {
    screen: { name: 'Tela quebrada', part: 'screen', base: 170, sym: ['A tela trincou toda!', 'Caiu no chão e a tela rachou...', 'Sentei em cima sem querer...'] },
    battery: { name: 'Bateria viciada', part: 'battery', base: 110, sym: ['Descarrega muito rápido.', 'Desliga sozinho com 30%.', 'Tá meio estufado, sabe?'] },
    port: { name: 'Conector de carga', part: 'port', base: 90, sym: ['Não carrega de jeito nenhum.', 'O cabo fica frouxo e não carrega.'] },
    camera: { name: 'Câmera com defeito', part: 'camera', base: 120, sym: ['A câmera só mostra tela preta.', 'A câmera não abre de jeito nenhum.'] },
    water: { name: 'Oxidação (água)', part: null, base: 150, sym: ['Caiu na piscina...', 'Derrubei café em cima!', 'Caiu na privada... não pergunta.'] },
    chip: { name: 'Chip em curto', part: 'chip', base: 210, sym: ['Esquenta muito e desliga.', 'Fica quente e trava tudo.'] },
    button: { name: 'Botões sujos', part: null, base: 80, sym: ['Os botões não respondem direito.', 'O botão A vive travando.'] },
    coin: { name: 'Pilha gasta', part: 'coin', base: 60, sym: ['Os ponteiros pararam.', 'Parou de funcionar do nada.'] },
    crystal: { name: 'Vidro trincado', part: 'crystal', base: 90, sym: ['O vidro do mostrador trincou.', 'Bati na parede e o vidro rachou.'] },
  };
  const AMBIG = ['Não liga de jeito nenhum.', 'Simplesmente morreu. Tela preta.'];
  const FAULTS_BY_TYPE = {
    phone: ['screen', 'battery', 'port', 'camera', 'water', 'chip'],
    tablet: ['screen', 'battery', 'port', 'camera', 'water', 'chip'],
    console: ['screen', 'battery', 'port', 'button', 'water', 'chip'],
    watch: ['coin', 'crystal', 'water'],
    laptop: ['battery', 'port', 'camera', 'water', 'chip', 'button'],
    controller: ['camera', 'button', 'battery', 'port'],
    camera: ['camera', 'battery', 'water', 'button'],
    audio: ['camera', 'battery', 'port', 'water'],
    vintage: ['camera', 'button', 'water', 'chip'],
    calc: ['battery', 'button', 'water', 'screen'],
    retro: ['screen', 'button', 'chip', 'camera'],
    pet: ['battery', 'button', 'chip', 'water'],
    drone: ['camera', 'battery', 'chip', 'water'],
    vr: ['camera', 'battery', 'port', 'chip'],
  };
  // O "módulo" muda conforme o tipo de aparelho (o defeito 'camera' vira cooler, analógico, lente...)
  const MODS = {
    camera: { name: 'Câmera com defeito', part: 'camera', tp: 'CAM', label: 'Módulo de câmera', cond: 'Lente embaçada e flex rasgado', sym: ['A câmera só mostra tela preta.', 'A câmera não abre de jeito nenhum.'] },
    fan: { name: 'Cooler travado', part: 'fan', tp: 'FAN', label: 'Cooler (ventoinha)', cond: 'Pás travadas e cheias de poeira', sym: ['Esquenta e faz um barulho horrível.', 'A ventoinha parece um avião decolando.'] },
    stick: { name: 'Analógico com drift', part: 'stick', tp: 'STK', label: 'Analógico', cond: 'Potenciômetro gasto (drift!)', sym: ['O personagem anda sozinho no jogo!', 'O analógico tá com drift.'] },
    lens: { name: 'Lente quebrada', part: 'lens', tp: 'LEN', label: 'Conjunto da lente', cond: 'Vidro da lente rachado', sym: ['Tudo sai borrado.', 'A lente trincou quando caiu.'] },
    speaker: { name: 'Alto-falante estourado', part: 'speaker', tp: 'SPK', label: 'Alto-falante', cond: 'Cone rasgado', sym: ['O som sai todo chiado.', 'Não sai som nenhum!'] },
    motor: { name: 'Motor queimado', part: 'motor', tp: 'MOT', label: 'Motor da hélice', cond: 'Cheiro de queimado no motor', sym: ['Uma hélice não gira mais.', 'Ele tomba pro lado quando decola.'] },
    cart: { name: 'Slot de cartucho quebrado', part: 'cart', tp: 'CRT', label: 'Slot de cartucho', cond: 'Pinos tortos e oxidados', sym: ['Não lê os cartuchos.', 'Tenho que assoprar o cartucho mil vezes.'] },
  };
  const MOD_BY_TYPE = { phone: 'camera', tablet: 'camera', laptop: 'fan', controller: 'stick', camera: 'lens', audio: 'speaker', vintage: 'speaker', drone: 'motor', vr: 'lens', retro: 'cart' };
  const GLUED = { phone: 1, tablet: 1, console: 1 };
  const HAS_SCREEN = { phone: 1, tablet: 1, console: 1, calc: 1, retro: 1 };
  const BUTTON_SYM = {
    laptop: ['O teclado tá com teclas grudando.', 'Derrubei refrigerante no teclado.'], camera: ['O botão de disparo travou.', 'Os botões não respondem.'],
    calc: ['As teclas não funcionam.', 'A tecla de igual morreu. Justo ela.'], vintage: ['O disco não gira direito.', 'As teclas tão duras.'],
    controller: ['O botão A não responde.', 'Os gatilhos tão grudando.'], pet: ['Os botões não funcionam, o bichinho vai morrer!', 'Não consigo alimentar o bichinho!'],
    retro: ['Os botões tão duros e grudentos.', 'O botão Start não funciona.'],
  };
  const PARTS = {
    screen: { name: 'Tela', cost: 60 }, battery: { name: 'Bateria', cost: 30 }, port: { name: 'Conector USB', cost: 20 },
    camera: { name: 'Câmera', cost: 40 }, chip: { name: 'Chip', cost: 55 }, coin: { name: 'Pilha CR2032', cost: 8 }, crystal: { name: 'Vidro safira', cost: 25 },
    fan: { name: 'Cooler', cost: 35 }, stick: { name: 'Analógico', cost: 22 }, lens: { name: 'Lente', cost: 45 }, speaker: { name: 'Alto-falante', cost: 18 },
    motor: { name: 'Motor', cost: 30 }, cart: { name: 'Slot de cartucho', cost: 25 },
  };
  function modKind(type) { return MOD_BY_TYPE[type] || 'camera'; }
  function faultsFor(model) { const d = DEVICES[model]; return d.faults || FAULTS_BY_TYPE[d.type]; }
  function faultName(f, type) { return f === 'camera' ? MODS[modKind(type)].name : FAULTS[f].name; }
  function faultPart(f, type) { return f === 'camera' ? MODS[modKind(type)].part : FAULTS[f].part; }
  function symptomsFor(f, type) {
    if (f === 'camera') return MODS[modKind(type)].sym;
    if (f === 'button' && BUTTON_SYM[type]) return BUTTON_SYM[type];
    if (f === 'screen' && type === 'calc') return ['O visor trincou.', 'Caiu e o visor rachou.'];
    return FAULTS[f].sym;
  }
  const READ_NORMAL = { BAT: () => (3.8 + Math.random() * .3).toFixed(2) + ' V', USB: () => (4.9 + Math.random() * .2).toFixed(2) + ' V', LCD: () => '1.80 V', CAM: () => '2.80 V', CPU: () => (0.95 + Math.random() * .1).toFixed(2) + ' V', MOV: () => '1.50 V' };

  // ---------- cena ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2b1d2c);
  scene.fog = new THREE.Fog(0x2b1d2c, 12, 22);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 100);
  const CAM_POS = new V3(0, 6.3, 3.6), CAM_LOOK = new V3(0, 0, 0.3);
  const CAM_OPEN = new V3(-0.1, 5.1, 3.05), LOOK_OPEN = new V3(-0.15, 0, 0.2);
  const camLookCur = CAM_LOOK.clone(); let camIntro = 0;
  const camPosCur = CAM_POS.clone(), camOpenCur = CAM_OPEN.clone();
  // aparelhos grandes: afasta a câmera proporcionalmente
  function fitCamera(size) {
    const k = Math.max(1, Math.min(1.45, size / 2.6));
    camPosCur.copy(CAM_LOOK).addScaledVector(CAM_POS.clone().sub(CAM_LOOK), k);
    camOpenCur.copy(LOOK_OPEN).addScaledVector(CAM_OPEN.clone().sub(LOOK_OPEN), k);
  }
  camera.position.copy(CAM_POS); camera.lookAt(CAM_LOOK);

  scene.add(new THREE.HemisphereLight(0xfff0f6, 0x442233, 0.6));
  const sun = new THREE.DirectionalLight(0xfff4e8, 0.75); sun.position.set(-3, 8, 2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 1, far: 20 }); sun.shadow.bias = -0.0005;
  scene.add(sun);
  const lampLight = new THREE.SpotLight(0xfff1d6, 0.9, 14, 0.7, 0.5); lampLight.position.set(-3.2, 3.4, -2); lampLight.target.position.set(0, 0, 0.3);
  scene.add(lampLight, lampLight.target);

  // bancada + tapete de corte
  const wood = ASSETS.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#8a5a3c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${60 + Math.random() * 40},${30 + Math.random() * 20},20,.35)`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 10 - Math.random() * 20, w * .6, y + 10 - Math.random() * 20, w, y + Math.random() * 8); g.stroke(); }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(3, 2);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 10), M(0xffffff, { map: wood, roughness: .8 }));
  bench.position.y = -0.25; bench.receiveShadow = true; scene.add(bench);
  const matTex = ASSETS.canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#2f7d6d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#ff8fc8'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.font = 'bold 26px sans-serif'; g.fillText('REPAIR SIMULATOR ♥ ESD SAFE', 30, h - 26);
    g.beginPath(); g.arc(w * .5, h * .5, 150, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.stroke();
  });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 6), M(0xffffff, { map: matTex, roughness: .9 }));
  mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.004, 0.1); mat.receiveShadow = true; scene.add(mat);

  const PARK = new V3(-2.3, 0, -0.45); // onde a carcaça fica quando aberta
  const TRASH = new V3(-2.45, 0, 1.45);
  const DISH = new V3(-1.3, 0.02, 1.55);
  const TRAY = new V3(1.95, 0, 1.15);
  const BRACKET_PARK = new V3(1.45, 0.05, -1.25);

  let decorBuilt = false;
  const decor = new THREE.Group(); scene.add(decor);
  function buildDecor() {
    if (decorBuilt) return; decorBuilt = true;
    const lamp = ASSETS.get('desklamp'); lamp.position.set(-4.3, 0, -2.3); lamp.rotation.y = 0.9; decor.add(lamp);
    const st = ASSETS.get('solderstation'); st.position.set(3.9, 0, -2.2); st.rotation.y = -0.5; decor.add(st);
    const mm = ASSETS.get('multimeter'); mm.position.set(4.6, 0, -0.5); mm.rotation.y = -0.7; decor.add(mm);
    const tb = ASSETS.get('toolbox'); tb.position.set(-5.6, 0, -1.4); tb.rotation.y = 0.6; decor.add(tb);
    const bp = ASSETS.get('boardparts'); bp.position.set(4.9, 0, 1.3); bp.rotation.y = 0.4; decor.add(bp);
    const cab = ASSETS.get('cable'); cab.position.set(1.8, 0, -2.6); cab.rotation.y = 0.2; decor.add(cab);
    const chg = ASSETS.get('charger'); chg.position.set(3.0, 0, -2.6); decor.add(chg);
    const aa = ASSETS.get('battery_aa'); aa.position.set(-4.8, 0, 0.6); decor.add(aa);
    // lixeira
    const bin = new THREE.Group();
    const binMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.7, 24, 1, true), M(0xff8fc8, { side: THREE.DoubleSide, roughness: .4 }));
    binMesh.position.y = 0.35; bin.add(binMesh);
    const binBottom = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), M(0x7a2d52)); binBottom.rotation.x = -Math.PI / 2; binBottom.position.y = 0.02; bin.add(binBottom);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 32), M(0xffffff)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.7; bin.add(rim);
    const lbl = label('DESCARTE', '#7a2d52', '#fff'); lbl.position.set(0, 0.95, 0); lbl.scale.set(0.9, 0.22, 1); bin.add(lbl);
    bin.position.copy(TRASH); decor.add(bin);
    reg('trash', bin, 'Lixeira de descarte');
    // prato magnético de parafusos
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.06, 32), M(0x9aa5b1, { metalness: .7, roughness: .3 }));
    dish.position.copy(DISH); dish.castShadow = dish.receiveShadow = true; decor.add(dish);
    const dl = label('PARAFUSOS', '#334', '#fff'); dl.position.set(DISH.x, 0.35, DISH.z - 0.1); dl.scale.set(0.8, 0.2, 1); decor.add(dl);
    // bandeja de peças
    const tray = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.3), M(0x8fd3ff, { roughness: .35 })); base.position.y = 0.03; tray.add(base);
    for (const [x, z, w, d] of [[0, -0.62, 1.7, .06], [0, .62, 1.7, .06], [-.82, 0, .06, 1.3], [.82, 0, .06, 1.3]]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(w, .14, d), M(0x5fb8f0)); r.position.set(x, .07, z); tray.add(r);
    }
    const tl = label('PEÇAS NOVAS', '#1d4e89', '#fff'); tl.position.set(0, 0.45, -0.5); tl.scale.set(0.9, 0.22, 1); tray.add(tl);
    tray.position.copy(TRAY); tray.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); decor.add(tray);
  }

  function label(text, bg = '#4a2040', fg = '#fff', w = 256, h = 64) {
    const t = ASSETS.canvasTex(w, h, (g) => {
      g.fillStyle = bg; roundRect(g, 2, 2, w - 4, h - 4, 14); g.fill();
      g.fillStyle = fg; g.font = `bold ${h * .5}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.renderOrder = 10; return s;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- registro de alvos ----------
  let T = {};       // id -> {obj, label, cond}
  let pickables = [];
  function reg(id, obj, lbl, cond) {
    T[id] = { obj, label: lbl, cond: cond || null, id };
    obj.traverse(o => { if (o.isMesh || o.isSprite) { o.userData.tid = id; if (o.isMesh) pickables.push(o); } });
    obj.userData.tid = id;
    return obj;
  }
  function unreg(id) {
    const t = T[id]; if (!t) return;
    pickables = pickables.filter(m => m.userData.tid !== id);
    delete T[id];
  }

  // ---------- ferramentas ----------
  const TOOLS = [
    { id: 'hand', name: 'Mão', key: '1', ico: '✋' },
    { id: 'screwdriver', name: 'Chave', key: '2', model: 'screwdriver', pose: [0, 0, 90] },
    { id: 'heat', name: 'Soprador', key: '3', model: 'heatgun', pose: [90, 0, 0], tilt: [0.2, 0, -0.25] },
    { id: 'pick', name: 'Palheta', key: '4', model: 'pick', pose: [0, 0, -90] },
    { id: 'tweezers', name: 'Pinça', key: '5', model: 'tweezers', pose: [90, 0, 0] },
    { id: 'meter', name: 'Multímetro', key: '6', proc: 'probe', thumbModel: 'multimeter' },
    { id: 'solder', name: 'Ferro solda', key: '7', proc: 'solder', thumbModel: 'solderstation' },
    { id: 'brush', name: 'Escova', key: '8', proc: 'brush' },
    { id: 'magnifier', name: 'Lupa', key: '9', model: 'magnifier', pose: [0, 0, 0], tilt: [0, 0, 0] },
  ];
  const toolRoot = new THREE.Group(); scene.add(toolRoot);
  const toolObjs = {};
  const solderTipMat = M(0x888888, { metalness: .8, roughness: .3, emissive: 0x000000 });
  function procTool(kind) {
    const g = new THREE.Group();
    if (kind === 'probe') {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 8), M(0xdddddd, { metalness: .9 })); tip.rotation.x = Math.PI; tip.position.y = 0.1; g.add(tip);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.8, 12), M(0xe63946)); body.position.y = 0.6; g.add(body);
      const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), M(0x9d0208)); guard.position.y = 0.22; g.add(guard);
    } else if (kind === 'solder') {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.28, 8), solderTipMat); tip.rotation.x = Math.PI; tip.position.y = 0.14; g.add(tip);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.3, 12), M(0xbbbbbb, { metalness: .8 })); sleeve.position.y = 0.43; g.add(sleeve);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.75, 14), M(0x3a86ff)); body.position.y = 0.95; g.add(body);
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 6, 16), M(0x1d3557)); r.rotation.x = Math.PI / 2; r.position.y = 0.75 + i * 0.1; g.add(r); }
    } else if (kind === 'brush') {
      const bristle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.22, 12), M(0xfff1c1, { roughness: 1 })); bristle.position.y = 0.11; g.add(bristle);
      const ferr = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 12), M(0xcccccc, { metalness: .8 })); ferr.position.y = 0.28; g.add(ferr);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 12), M(0xff70a6)); handle.position.y = 0.78; g.add(handle);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  function buildToolObjs() {
    for (const t of TOOLS) {
      if (t.id === 'hand') continue;
      let o;
      if (t.proc) o = procTool(t.proc);
      else {
        const m = ASSETS.get(t.model, { cloneMat: false });
        m.traverse(x => { if (x.isMesh) x.castShadow = true; });
        const pose = new THREE.Group(); pose.rotation.set(t.pose[0] * D2R, t.pose[1] * D2R, t.pose[2] * D2R); pose.add(m);
        const holder = new THREE.Group(); holder.add(pose); holder.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(holder); const c = b.getCenter(new V3());
        pose.position.set(-c.x, -b.min.y, -c.z);
        o = holder;
        if (t.id === 'magnifier') { o.scale.setScalar(0.9); }
      }
      // inclina como se estivesse na mão (cabo para a câmera/direita)
      const tilt = new THREE.Group(); tilt.add(o);
      const tl = t.tilt || [0.75, 0, -0.45];
      tilt.rotation.set(tl[0], tl[1], tl[2]);
      tilt.visible = false; toolRoot.add(tilt);
      toolObjs[t.id] = { root: tilt, inner: o };
    }
  }

  // ---------- partículas ----------
  const particles = [];
  const pGeo = new THREE.SphereGeometry(1, 6, 4);
  function emit(pos, { n = 10, color = 0xffcc33, speed = 2, life = 0.6, size = 0.03, up = 1, grav = -6, emissive = true } = {}) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: !emissive }));
      m.scale.setScalar(size * (0.6 + Math.random() * .8)); m.position.copy(pos);
      const v = new V3((Math.random() - .5) * speed, Math.random() * speed * up, (Math.random() - .5) * speed);
      scene.add(m); particles.push({ m, v, life, max: life, grav });
    }
  }
  function updParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= dt;
      p.v.y += p.grav * dt; p.m.position.addScaledVector(p.v, dt);
      p.m.material.opacity = Math.max(0, p.life / p.max);
      if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); }
    }
  }

  // ---------- texturas procedurais ----------
  function crackTex(seed = Math.random()) {
    return ASSETS.canvasTex(512, 768, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 0, w, h);
      const cx = w * (0.3 + seed * 0.4), cy = h * (0.25 + (seed * 7 % 1) * 0.5);
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        let x = cx, y = cy; const a0 = i / 16 * Math.PI * 2 + Math.random() * .3;
        g.lineWidth = 3 + Math.random() * 2; g.beginPath(); g.moveTo(x, y);
        let a = a0;
        for (let k = 0; k < 14; k++) { a += (Math.random() - .5) * .7; x += Math.cos(a) * (25 + Math.random() * 30); y += Math.sin(a) * (25 + Math.random() * 30); g.lineTo(x, y); g.lineWidth = Math.max(1, g.lineWidth * .9); }
        g.stroke();
      }
      for (let r = 30; r < 120; r += 35) { g.lineWidth = 2; g.beginPath(); for (let a = 0; a < Math.PI * 2; a += .4) { const rr = r + (Math.random() - .5) * 14; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(cx, cy, 10, 0, Math.PI * 2); g.fill();
    });
  }
  function bootTex(name) {
    return ASSETS.canvasTex(256, 384, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff8fc8'); gr.addColorStop(1, '#7b2ff7');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.fillText('♥', w / 2, h / 2);
      g.font = 'bold 22px Fredoka, sans-serif'; g.fillText(name, w / 2, h / 2 + 50); g.font = 'bold 16px sans-serif'; g.fillText('100% OK!', w / 2, h / 2 + 80);
    });
  }
  function batteryTex(brand) {
    return ASSETS.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#20232a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, 36);
      g.fillStyle = '#20232a'; g.font = 'bold 22px sans-serif'; g.fillText('⚠ Li-ion', 10, 26);
      g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(brand, 14, 90);
      g.font = '18px sans-serif'; g.fillText('3.85V  3000mAh', 14, 124); g.fillText('11.55Wh', 14, 150);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(14, 170, 60, 60); g.font = 'bold 14px sans-serif'; g.fillText('♻ CE', 90, 210);
    });
  }
  function chipTex(t) {
    return ASSETS.canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#15171c'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0c4cc'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(t, w / 2, h / 2 + 8);
      g.fillStyle = '#555'; g.beginPath(); g.arc(18, 18, 6, 0, 7); g.fill();
    });
  }

  // ---------- estado do trabalho ----------
  let job = null;
  let root = null, shell = null, inner = null;
  let steps = [], sIdx = 0;
  let tool = 'hand';
  let carry = null;
  let integ = 100, timeUsed = 0, heat = 0, holding = false, holdT = 0, holdTarget = null;
  let hovered = null, lastHover = null;
  let finished = false, onFinish = null;
  let batteryConnected = true, skippedBattery = false, sparked = false;
  let measured = {};
  let active = false;
  let shellInfo = null; // {w,h,d}
  let bootPlane = null, crackPlane = null;
  const mouse = new THREE.Vector2(), ray = new THREE.Raycaster();
  const hoverPlane = new THREE.Plane(new V3(0, 1, 0), -0.05);
  let pointer = { x: 0, y: 0, in: false };
  const holdStart = { x: 0, y: 0 };

  // modificadores vindos das melhorias, relíquias, itens e buffs (ver meta.js)
  function mod(k) { return window.META ? META.mod(k) : 0; }
  let shieldLeft = 0;

  // ---------- construção do aparelho ----------
  function screwMesh(axis = 'y') {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), M(0xc9ced6, { metalness: .85, roughness: .25 }));
    head.position.y = 0.015; g.add(head);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.014), M(0x333333)); c1.position.y = 0.031; g.add(c1);
    const c2 = c1.clone(); c2.rotation.y = Math.PI / 2; g.add(c2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.14, 8), M(0xaab0b8, { metalness: .8 })); shaft.position.y = -0.07; g.add(shaft);
    // área de clique invisível (parafusos são pequenos)
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.03; g.add(hit);
    g.userData.hit = hit;
    const wrap = new THREE.Group(); wrap.add(g);
    if (axis === 'z') g.rotation.x = Math.PI / 2;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    wrap.userData.inner = g; wrap.userData.axis = axis;
    return wrap;
  }
  function holeMesh() {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 14), M(0x111111));
    return h;
  }
  function marker(color = 0xffffff) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 24), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    ring.rotation.x = Math.PI / 2; g.add(ring);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 12), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    cone.rotation.x = Math.PI; cone.position.y = 0.22; g.add(cone);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.08; g.add(hit);
    g.userData.cone = cone;
    return g;
  }
  function box(w, h, d, mat) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m; }

  // Raycast de cima para achar a superfície da tela da carcaça
  function surfaceAt(obj, x, z) {
    obj.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(new V3(x, 20, z), new V3(0, -1, 0));
    const hits = rc.intersectObject(obj, true).filter(h => h.object !== obj.userData.hb);
    return hits[0] || null;
  }

  // o ponto p (no topo da carcaça) é visível da câmera de trabalho?
  function visibleFromCam(p) {
    const dir = p.clone().sub(camPosCur); const dist = dir.length(); dir.normalize();
    const rc = new THREE.Raycaster(camPosCur.clone(), dir);
    const hits = rc.intersectObject(shell, true).filter(h => h.object !== shell.userData.hb);
    return !hits.length || hits[0].distance > dist - 0.04;
  }
  // procura um ponto visível na superfície de cima, começando pelas bordas e indo para o centro
  function topSpot(x, z, ks = [0.36, 0.28, 0.2, 0.12, 0.05]) {
    let fallback = null;
    const cands = [];
    for (const k of ks) cands.push([x * k, z * k]);
    // se os cantos de trás estiverem escondidos, tenta ir para a frente
    for (const k of ks) cands.push([x * k, 0], [x * k, Math.abs(z) * 0.2]);
    for (const [cx, cz] of cands) {
      const hit = surfaceAt(shell, cx, cz);
      if (!hit) continue;
      if (!fallback) fallback = hit.point.clone();
      if (visibleFromCam(hit.point.clone().add(new V3(0, 0.03, 0)))) return hit.point.clone();
    }
    return fallback;
  }

  function buildDevice() {
    root = new THREE.Group(); scene.add(root);
    shell = ASSETS.get(job.model);
    shell.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    root.add(shell);
    const sz = shell.userData.size; shellInfo = { w: sz.x, h: sz.y, d: sz.z };
    PARK.set(-(sz.x + 0.5), 0, -0.45);
    fitCamera(Math.max(sz.x, sz.z));
    // caixa de clique invisível (ativa só com o aparelho aberto — facilita pegar carcaças vazadas, como óculos VR)
    const hb = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.y = sz.y / 2; hb.visible = false; shell.add(hb); shell.userData.hb = hb;
    reg('shell', shell, job.name);
    const { w, h, d } = shellInfo;
    const type = job.type;

    // área da tela (para trinca e tela de boot)
    let best = null;
    const zs = type === 'console' ? [d * .25, -d * .25] : [0];
    for (const z of zs) { const s = surfaceAt(shell, 0, z); if (s && (!best || s.point.y < best.point.y)) best = s; }
    const faceY = best ? best.point.y : h;
    const faceZ = best ? best.point.z : 0;
    const faceW = type === 'watch' ? Math.min(w, 0.8) * 0.8 : w * (type === 'console' ? 0.55 : 0.82);
    const faceD = type === 'watch' ? faceW : (type === 'console' ? d * 0.34 : d * 0.82);
    shellInfo.face = { y: faceY, z: faceZ, w: faceW, d: faceD };
    if (job.fault === 'screen' || job.fault === 'crystal') addCrack(shell);

    // parafusos externos: aparelhos colados têm 2 na borda inferior; os aparafusados têm 4 por cima
    shellInfo.xs = [];
    if (type !== 'watch' && GLUED[type]) {
      [-1, 1].forEach((s, i) => {
        const pos = new V3(s * Math.min(w * 0.18, 0.4), Math.min(h * 0.45, 0.1), d / 2 + 0.005);
        const sc = screwMesh('z'); sc.position.copy(pos); root.add(sc);
        sc.userData.home = pos.clone(); sc.userData.out = new V3(0, 0, 1);
        reg('xs' + i, sc, 'Parafuso externo'); shellInfo.xs.push('xs' + i);
      });
    } else if (type !== 'watch') {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
        const spot = topSpot(sx * w, sz * d);
        const pos = spot ? spot : new V3(sx * w * .3, h, sz * d * .3);
        pos.y += 0.005;
        const sc = screwMesh('y'); sc.position.copy(pos); root.add(sc);
        sc.userData.home = pos.clone(); sc.userData.out = new V3(0, 1, 0);
        reg('xs' + i, sc, 'Parafuso da carcaça'); shellInfo.xs.push('xs' + i);
      });
    }
    // pontos de abertura
    const pry = type === 'watch' ? [[w / 2 + 0.02, 0.02, 0]]
      : GLUED[type] ? [[-w / 2 - 0.04, h * .5, -d * .22], [w / 2 + 0.04, h * .5, -d * .22], [-w / 2 - 0.04, h * .5, d * .22], [w / 2 + 0.04, h * .5, d * .22]]
        : [-1, 1].map(s => {
          // encaixes: marcados por cima da carcaça, perto das laterais (sempre visíveis)
          const p = topSpot(s * w, 0.0001, [0.44, 0.36, 0.26, 0.16]);
          return p ? [p.x, p.y + 0.04, p.z] : [s * w * .4, h + 0.04, 0];
        });
    pry.forEach((p, i) => { const m = marker(0xffffff); m.position.set(...p); m.visible = false; root.add(m); reg('pry' + i, m, 'Ponto de abertura'); });

    // botão de ligar (lateral)
    const pw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), M(0x444444, { emissive: 0x000000 }));
    const pwm = marker(0x52d68a); pwm.visible = false;
    pwm.position.set(w / 2 + 0.06, h * .5, -d * .15); pw.position.set(w / 2 + 0.01, h * .5, -d * .15);
    if (!GLUED[type] && type !== 'watch') {
      // aparelhos altos: botão de ligar em cima, visível para a câmera
      const p = topSpot(w, d * .6, [0.25, 0.15, 0.06, 0.0]) || new V3(w * .25, h, d * .2);
      pw.position.set(p.x, p.y + 0.02, p.z); pw.scale.set(3, 1, .8);
      pwm.position.set(p.x, p.y + 0.05, p.z);
    }
    root.add(pw, pwm); reg('power', pwm, 'Botão de ligar');

    // ---- interior ----
    inner = new THREE.Group(); inner.visible = false; root.add(inner);
    if (type === 'watch') buildWatchInner(); else buildPhoneInner();
  }

  function addCrack(target) {
    const f = shellInfo.face;
    const t = crackTex();
    crackPlane = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: .9 }));
    crackPlane.rotation.x = -Math.PI / 2; crackPlane.position.set(0, f.y + 0.006, f.z);
    // a trinca fica "dentro" da carcaça (acompanha a animação)
    const inv = new THREE.Matrix4().copy(target.matrixWorld).invert();
    target.updateMatrixWorld(true);
    crackPlane.applyMatrix4(inv);
    target.add(crackPlane);
  }

  const P = {}; // posições úteis do interior
  function buildPhoneInner() {
    const { w, d } = shellInfo;
    // bandeja interna com tamanho mínimo (aparelhos rasos/pequenos ainda têm espaço para as peças)
    const W = Math.min(2.6, Math.max(w * 0.9, 1.25)), Dd = Math.min(2.8, Math.max(d * 0.9, 2.2));
    const metal = M(0x5a6068, { metalness: .6, roughness: .45 });
    const frame = box(W, 0.06, Dd, metal); frame.position.y = 0.03; inner.add(frame);
    const rimM = M(0x3a3f45, { metalness: .6 });
    for (const [x, z, ww, dd] of [[0, -Dd / 2, W, 0.05], [0, Dd / 2, W, .05], [-W / 2, 0, .05, Dd], [W / 2, 0, .05, Dd]]) { const r = box(ww, 0.14, dd, rimM); r.position.set(x, 0.07, z); inner.add(r); }

    // placa-mãe (modelo baixado, esticado para caber)
    const bw = W * 0.86, bd = Dd * 0.36, bz = -Dd * 0.27;
    const brd = ASSETS.get('board');
    const bs = brd.userData.size;
    brd.scale.set(bw / bs.x, 0.07 / bs.y, bd / bs.z); brd.position.set(0, 0.06, bz); inner.add(brd);
    reg('board', brd, 'Placa-mãe', job.fault === 'water' ? 'Manchas de oxidação!' : 'Parece OK');
    P.boardZ = bz; P.bd = bd; P.bw = bw;

    // chip
    const chip = box(0.26, 0.05, 0.26, [M(0x15171c), M(0x15171c), M(0xffffff, { map: chipTex('A15') }), M(0x15171c), M(0x15171c), M(0x15171c)]);
    chip.position.set(W * 0.2, 0.155, bz - bd * 0.33); inner.add(chip);
    reg('chip', chip, 'Processador (CPU)', job.fault === 'chip' ? 'Marcas de queimado no chip!' : 'Parece OK');
    P.chip = chip.position.clone();

    // módulo (câmera / cooler / analógico / lente / alto-falante / motor / slot)
    const mk = MODS[modKind(job.type)];
    const cam = moduleMesh(modKind(job.type), false);
    cam.position.set(-W * 0.3, 0.13, -Dd * 0.4); inner.add(cam);
    reg('camera', cam, mk.label, job.fault === 'camera' ? mk.cond : 'Parece OK');
    P.cam = cam.position.clone();

    // bateria
    const bat = new THREE.Group();
    const batMats = [M(0x20232a), M(0x20232a), M(0xffffff, { map: batteryTex(job.brand) }), M(0x20232a), M(0x20232a), M(0x20232a)];
    const bb = box(W * 0.76, 0.09, Dd * 0.38, batMats); bb.position.y = 0.045; bat.add(bb);
    if (job.fault === 'battery') { bb.scale.y = 2.2; bb.position.y = 0.1; }
    bat.position.set(0, 0.06, Dd * 0.08); inner.add(bat);
    reg('battery', bat, 'Bateria', job.fault === 'battery' ? 'Estufada! Perigo!' : 'Parece OK');
    P.bat = bat.position.clone(); P.batW = W * 0.76; P.batD = Dd * 0.38;
    // abas de adesivo
    [-1, 1].forEach((s, i) => {
      const tab = box(0.14, 0.014, 0.18, M(0xf1f1f1, { roughness: .9 }));
      tab.position.set(s * W * 0.16, 0.075, Dd * 0.27 + 0.08); inner.add(tab);
      reg('tab' + i, tab, 'Aba adesiva da bateria');
    });

    // conectores + flexes
    const flexM = M(0xff9f1c, { roughness: .6 });
    function connector(id, x, z, lbl, flexTo) {
      const g = new THREE.Group();
      const c = box(0.2, 0.05, 0.12, M(0x111111)); c.position.y = 0.025; g.add(c);
      const pin = box(0.18, 0.012, 0.1, M(0xd4af37, { metalness: .9 })); pin.position.y = 0.055; g.add(pin);
      g.position.set(x, 0.14, z); inner.add(g);
      if (flexTo) { const len = flexTo.distanceTo(new V3(x, 0.14, z)); const f = box(0.16, 0.01, len, flexM); f.position.set((x + flexTo.x) / 2, 0.12, (z + flexTo.z) / 2); f.lookAt(flexTo.x, 0.12, flexTo.z); inner.add(f); }
      g.userData.connected = true; g.userData.home = g.position.clone();
      reg(id, g, lbl);
      return g;
    }
    const cz = bz + bd * 0.3; // fileira de conectores sob a blindagem
    connector('c_bat', W * 0.28, cz, 'Conector da bateria', new V3(W * 0.28, 0.12, Dd * 0.0));
    connector('c_lcd', -W * 0.18, cz, 'Conector da tela', new V3(-W * 0.45, 0.12, cz));
    connector('c_cam', -W * 0.05, -Dd * 0.4, 'Conector da câmera', new V3(-W * 0.2, 0.12, -Dd * 0.4));
    connector('c_port', W * 0.33, Dd * 0.34, 'Conector da porta USB', new V3(W * 0.33, 0.12, Dd * 0.42));

    // blindagem (bracket) com 2 parafusos sobre os conectores
    const br = box(W * 0.62, 0.02, 0.3, M(0xc0c6cf, { metalness: .85, roughness: .25 }));
    br.position.set(W * 0.05, 0.24, cz); inner.add(br);
    br.userData.home = br.position.clone();
    reg('bracket', br, 'Blindagem metálica');
    [-1, 1].forEach((s, i) => {
      const x = W * 0.05 + s * W * 0.27, z = cz;
      const hole = holeMesh(); hole.position.set(x, 0.245, z); inner.add(hole);
      const sc = screwMesh('y'); sc.position.set(x, 0.25, z); inner.add(sc);
      sc.userData.home = sc.position.clone(); sc.userData.out = new V3(0, 1, 0);
      reg('bs' + i, sc, 'Parafuso da blindagem');
    });

    // porta USB
    const port = new THREE.Group();
    const pb = box(W * 0.5, 0.04, 0.22, M(0x1b5e20)); pb.position.y = 0.02; port.add(pb);
    const plug = box(0.3, 0.08, 0.12, M(0xb0b6bf, { metalness: .9, roughness: .2 })); plug.position.set(0, 0.07, 0.08); port.add(plug);
    port.position.set(0, 0.07, Dd * 0.43); inner.add(port);
    reg('port', port, 'Porta de carga USB', job.fault === 'port' ? 'Pinos tortos e sujos' : 'Parece OK');
    P.port = port.position.clone();
    [-1, 1].forEach((s, i) => {
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), M(0xd9d9d9, { metalness: 1, roughness: .2 }));
      j.position.set(s * W * 0.2, 0.12, Dd * 0.43); inner.add(j); reg('j' + i, j, 'Ponto de solda');
    });

    // pontos de teste do multímetro
    const tpz = bz - bd * 0.06;
    const tps = [['BAT', -W * 0.4, tpz], ['USB', -W * 0.2, tpz], ['LCD', 0, tpz], ['CAM', W * 0.2, tpz], ['CPU', W * 0.4, tpz]];
    for (const [i, [n, x, z]] of tps.entries()) {
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), M(0xffd23f, { metalness: 1, roughness: .2, emissive: 0x332200 }));
      tp.position.set(x, 0.15, z); inner.add(tp);
      const l = label(n === 'CAM' ? MODS[modKind(job.type)].tp : n, '#000', '#ffd23f', 128, 48); l.position.set(x, 0.36 + (i % 2) * 0.16, z - 0.05); l.scale.set(0.27, 0.1, 1); inner.add(l);
      reg('tp_' + n, tp, 'Ponto de teste ' + n);
    }

    // oxidação / sujeira
    if (job.fault === 'water') {
      const spots = [[-W * .2, 0], [W * .22, Dd * .16], [-W * .33, Dd * .43], [W * .43, bz - bd * .25]];
      spots.forEach(([x, z], i) => {
        const g = new THREE.Group();
        for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 8, 6), M(k % 2 ? 0x7fe0a0 : 0xe8f5e9, { roughness: 1 })); b.position.set((Math.random() - .5) * .16, 0.16, (Math.random() - .5) * .16); b.scale.y = .4; g.add(b); }
        g.position.set(x, 0, z); inner.add(g); reg('rust' + i, g, 'Oxidação verde', 'Corrosão por líquido');
      });
    }
    if (job.fault === 'button') {
      [[-W * .25, -Dd * .05], [W * .25, -Dd * .05]].forEach(([x, z], i) => {
        const g = new THREE.Group();
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 20), M(0x6d4c41, { roughness: 1 })); pad.position.y = 0.16; g.add(pad);
        for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), M(0x4e342e)); b.position.set((Math.random() - .5) * .18, 0.18, (Math.random() - .5) * .18); g.add(b); }
        g.position.set(x, 0, z); inner.add(g); reg('dirt' + i, g, 'Contato do botão', 'Sujeira grudenta (refrigerante?)');
      });
    }
    // slots para peças novas (invisíveis)
    addSlot('slot_battery', P.bat, P.batW, P.batD);
    addSlot('slot_port', P.port, W * 0.5, 0.3);
    addSlot('slot_cam', P.cam, 0.36, 0.36);
    addSlot('slot_chip', P.chip, 0.3, 0.3);
    // tampa traseira “fantasma” no local de estacionamento da carcaça (para colocar a tela nova)
    const ps = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), new THREE.MeshBasicMaterial({ color: 0xff8fc8, transparent: true, opacity: 0.25, depthWrite: false }));
    ps.position.copy(PARK).add(new V3(0, 0.05, 0)); ps.visible = false; scene.add(ps); ps.userData.isSlot = true;
    reg('slot_shell', ps, 'Encaixe da tela nova');
    P.slotShell = ps;
  }

  // Módulos trocáveis — cada tipo de aparelho tem o seu
  function moduleMesh(kind, isNew) {
    const g = new THREE.Group();
    const dark = M(0x222428), metal = M(0xb8bec7, { metalness: .85, roughness: .25 });
    if (kind === 'camera') {
      const cb = box(0.32, 0.08, 0.32, dark); cb.position.y = 0.04; g.add(cb);
      for (const [x, z] of [[-.07, -.07], [.07, .07]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .05, 18), M(isNew ? 0x1a3a7a : 0x0a1a3a, { metalness: .9, roughness: .1 })); l.position.set(x, .1, z); g.add(l); }
    } else if (kind === 'fan') {
      const house = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .07, 24, 1, true), M(0x30343a, { side: THREE.DoubleSide })); house.position.y = .04; g.add(house);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .08, 16), M(isNew ? 0x3a86ff : 0x555555)); hub.position.y = .05; g.add(hub);
      const blades = new THREE.Group(); blades.position.y = .05; g.add(blades);
      for (let i = 0; i < 7; i++) { const b = box(.14, .01, .05, M(isNew ? 0x8ecae6 : 0x6c757d)); b.position.x = .09; const p = new THREE.Group(); p.rotation.y = i / 7 * Math.PI * 2; b.rotation.x = .5; p.add(b); blades.add(p); }
      if (!isNew) for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), M(0x9e9e9e, { roughness: 1 })); d.position.set((Math.random() - .5) * .25, .09, (Math.random() - .5) * .25); g.add(d); }
      g.userData.blades = blades;
    } else if (kind === 'stick') {
      const base = box(.26, .06, .26, dark); base.position.y = .03; g.add(base);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .12, 10), metal); shaft.position.y = .12; if (!isNew) shaft.rotation.z = .35; g.add(shaft);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.09, .08, .04, 20), M(isNew ? 0x7209b7 : 0x333333)); cap.position.set(isNew ? 0 : .04, .19, 0); g.add(cap);
    } else if (kind === 'lens') {
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.17 - i * .025, .17 - i * .025, .05, 28), M(i % 2 ? 0x111111 : 0x444444, { metalness: .6 })); r.position.y = .025 + i * .05; g.add(r); }
      const gl = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .02, 28), M(isNew ? 0x5fa8ff : 0x7a8fa6, { metalness: .9, roughness: isNew ? .05 : .5 })); gl.position.y = .16; g.add(gl);
    } else if (kind === 'speaker') {
      const frame = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .04, 28), dark); frame.position.y = .02; g.add(frame);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.16, .09, 28, 1, true), M(isNew ? 0x3a3a3a : 0x5c4033, { side: THREE.DoubleSide })); cone.rotation.x = Math.PI; cone.position.y = .09; g.add(cone);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x222222)); cap.position.y = .05; g.add(cap);
      if (!isNew) { const tear = box(.12, .005, .02, M(0xffffff)); tear.position.set(.04, .11, .03); tear.rotation.y = .6; g.add(tear); }
    } else if (kind === 'motor') {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .14, 20), M(isNew ? 0xc0c6cf : 0x6b5b4b, { metalness: .8 })); can.position.y = .07; g.add(can);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .1, 8), metal); sh.position.y = .18; g.add(sh);
      const prop = box(.34, .01, .05, M(isNew ? 0xff8fc8 : 0x444444)); prop.position.y = .23; g.add(prop); g.userData.blades = prop;
    } else if (kind === 'cart') {
      const slot = box(.34, .1, .16, M(0x2b2d42)); slot.position.y = .05; g.add(slot);
      const gap = box(.28, .02, .04, M(0x000000)); gap.position.set(0, .101, 0); g.add(gap);
      for (let i = 0; i < 8; i++) { const pin = box(.015, .02, .06, M(isNew ? 0xffd23f : 0x7a6a3a, { metalness: 1 })); pin.position.set(-.12 + i * .035, .11, .06); if (!isNew && i % 3 === 0) pin.rotation.z = .5; g.add(pin); }
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  function buildWatchInner() {
    const r = Math.min(shellInfo.w, 0.8) * 0.48;
    const mov = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 40), M(0xd4af37, { metalness: .9, roughness: .3 }));
    mov.position.y = 0.04; inner.add(mov);
    reg('board', mov, 'Mecanismo', job.fault === 'water' ? 'Pontos de ferrugem!' : 'Parece OK');
    // engrenagens
    const gearShape = (R, n) => { const s = new THREE.Shape(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? R : R * 0.82; if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } return s; };
    P.gears = [];
    [[-r * .35, -r * .3, r * .32, 14, 0xe9c46a], [r * .3, -r * .35, r * .22, 10, 0xc0c0c0], [r * .1, r * .05, r * .18, 9, 0xe9c46a]].forEach(([x, z, R, n, c]) => {
      const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(R, n), { depth: 0.02, bevelEnabled: false }), M(c, { metalness: .9, roughness: .3 }));
      gm.rotation.x = -Math.PI / 2; gm.position.set(x, 0.09, z); inner.add(gm); P.gears.push(gm);
    });
    // pilha (moeda baixada, prateada)
    const coin = ASSETS.get('coin', { size: r * 0.75 });
    ASSETS.tint(coin, 0xd9dde3, 1);
    coin.traverse(o => { if (o.isMesh) { o.material.metalness = .9; o.material.roughness = .25; } });
    const coinW = new THREE.Group(); coinW.add(coin); coin.rotation.x = -Math.PI / 2; coin.position.y = 0;
    coinW.position.set(r * 0.3, 0.1, r * 0.35); inner.add(coinW);
    reg('battery', coinW, 'Pilha CR2032', job.fault === 'coin' ? 'Pilha oxidada, 0.9V' : 'Parece OK');
    P.bat = coinW.position.clone();
    // parafuso da trava
    const hole = holeMesh(); hole.position.set(r * 0.62, 0.1, r * 0.1); inner.add(hole);
    const sc = screwMesh('y'); sc.position.set(r * 0.62, 0.11, r * 0.1); sc.scale.setScalar(0.8); inner.add(sc);
    sc.userData.home = sc.position.clone(); sc.userData.out = new V3(0, 1, 0); reg('bs0', sc, 'Parafuso da trava');
    // pontos de teste
    for (const [n, x, z] of [['BAT', -r * .1, r * .6], ['MOV', -r * .6, r * .1]]) {
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 14), M(0xffd23f, { metalness: 1, emissive: 0x332200 }));
      tp.position.set(x, 0.1, z); inner.add(tp);
      const l = label(n, '#000', '#ffd23f', 128, 48); l.position.set(x, 0.32, z); l.scale.set(0.3, 0.11, 1); inner.add(l);
      reg('tp_' + n, tp, 'Ponto de teste ' + n);
    }
    if (job.fault === 'water') {
      [[-r * .5, -r * .1], [r * .1, -r * .6], [-r * .1, r * .3]].forEach(([x, z], i) => {
        const g = new THREE.Group();
        for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M(k % 2 ? 0xb5651d : 0x8d6e63, { roughness: 1 })); b.position.set((Math.random() - .5) * .1, 0.11, (Math.random() - .5) * .1); b.scale.y = .5; g.add(b); }
        g.position.set(x, 0, z); inner.add(g); reg('rust' + i, g, 'Ferrugem', 'Corrosão por água');
      });
    }
    addSlot('slot_battery', P.bat, r * 0.8, r * 0.8);
    const { w, d } = shellInfo;
    const ps = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), new THREE.MeshBasicMaterial({ color: 0xff8fc8, transparent: true, opacity: 0.25, depthWrite: false }));
    ps.position.copy(PARK).add(new V3(0, 0.05, 0)); ps.visible = false; scene.add(ps);
    reg('slot_shell', ps, 'Encaixe do vidro novo'); P.slotShell = ps;
  }

  function addSlot(id, pos, w, d) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), new THREE.MeshBasicMaterial({ color: 0xff8fc8, transparent: true, opacity: 0.3, depthWrite: false }));
    s.position.copy(pos).add(new V3(0, 0.08, 0)); s.visible = false; inner.add(s);
    reg(id, s, 'Encaixe');
  }

  // Peça nova na bandeja
  function spawnPart(kind) {
    let o;
    const { w, d } = shellInfo;
    if (kind === 'screen' || kind === 'crystal') {
      o = ASSETS.get(job.model); o.scale.setScalar(0.42);
    } else if (kind === 'battery') {
      o = new THREE.Group(); const b = box(P.batW, 0.09, P.batD, [M(0x20232a), M(0x20232a), M(0xffffff, { map: batteryTex(job.brand + ' NEW') }), M(0x20232a), M(0x20232a), M(0x20232a)]); b.position.y = .045; o.add(b);
      if (P.batW > 1.2) o.scale.setScalar(1.2 / P.batW);
    } else if (kind === 'port') {
      o = new THREE.Group(); const pb = box(w * 0.45, 0.04, 0.22, M(0x1b5e20)); o.add(pb); const pl = box(0.3, 0.08, 0.12, M(0xe0e4ea, { metalness: .9, roughness: .15 })); pl.position.set(0, .05, .08); o.add(pl);
    } else if (MODS[kind]) {
      o = moduleMesh(kind, true);
    } else if (kind === 'chip') {
      o = box(0.26, 0.05, 0.26, [M(0x15171c), M(0x15171c), M(0xffffff, { map: chipTex('A15+') }), M(0x15171c), M(0x15171c), M(0x15171c)]);
    } else if (kind === 'coin') {
      o = ASSETS.get('coin', { size: 0.3 }); ASSETS.tint(o, 0xeef1f5, 1); const g = new THREE.Group(); o.rotation.x = -Math.PI / 2; g.add(o); o = g;
    }
    o.position.copy(TRAY).add(new V3(0, 0.1, 0));
    o.traverse(x => { if (x.isMesh) x.castShadow = true; });
    scene.add(o);
    reg('part_' + kind, o, 'Peça nova: ' + PARTS[kind].name);
    return o;
  }

  // ---------- etapas ----------
  function S(id, text, tool, targets, o = {}) { return Object.assign({ id, text, tool, targets, done: new Set(), mode: 'click', hold: 0.6 }, o); }

  function buildSteps(retry) {
    const type = job.type;
    const st = [];
    const hasExt = type !== 'watch';
    if (!retry) {
      if (hasExt) st.push(S('ext', `Remova os ${shellInfo.xs.length} parafusos da carcaça`, 'screwdriver', shellInfo.xs.slice(), { mode: 'hold', hold: 0.7 }));
      if (GLUED[type]) st.push(S('heat', 'Aqueça as bordas para soltar a cola', 'heat', ['shell'], { mode: 'heat', skip: 'heat' }));
      const pries = Object.keys(T).filter(k => k.startsWith('pry'));
      st.push(S('pry', type === 'watch' ? 'Abra a tampa com a palheta' : `Solte os encaixes com a palheta (${pries.length} pontos)`, 'pick', pries, { onComplete: openShell }));
    }
    st.push(S('diag', 'Diagnóstico: meça os pontos de teste', 'meter', Object.keys(T).filter(k => k.startsWith('tp_')), { onComplete: askDiagnosis }));
    if (type !== 'watch') {
      st.push(S('bs', 'Remova os parafusos da blindagem', 'screwdriver', ['bs0', 'bs1'], { mode: 'hold', hold: 0.6 }));
      st.push(S('bracket', 'Retire a blindagem com a pinça', 'tweezers', ['bracket'], { onTarget: removeBracket }));
      st.push(S('batoff', 'Desconecte a bateria (segurança!)', 'tweezers', ['c_bat'], { onTarget: id => toggleConn(id, false), skip: 'battery' }));
    }
    steps = st;
    sIdx = 0;
    renderSteps();
  }

  function fixSteps(diag) {
    const t = job.type; const st = [];
    switch (diag) {
      case 'screen': case 'crystal':
        if (t !== 'watch') st.push(S('lcdoff', 'Desconecte o cabo da tela', 'tweezers', ['c_lcd'], { onTarget: id => toggleConn(id, false) }));
        st.push(S('rmshell', diag === 'crystal' ? 'Leve o vidro trincado ao descarte' : 'Leve a tela quebrada ao descarte', 'tweezers', ['shell'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newshell', 'Pegue a peça nova na bandeja e encaixe', 'tweezers', ['part_' + (diag === 'crystal' ? 'crystal' : 'screen')], { mode: 'carry', drop: 'slot_shell' }));
        break;
      case 'battery':
        st.push(S('tabs', 'Puxe as abas adesivas (segure)', 'tweezers', ['tab0', 'tab1'], { mode: 'hold', hold: 1.0, onTarget: id => pullTab(id) }));
        st.push(S('rmbat', 'Leve a bateria velha ao descarte', 'tweezers', ['battery'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newbat', 'Coloque a bateria nova', 'tweezers', ['part_battery'], { mode: 'carry', drop: 'slot_battery' }));
        break;
      case 'coin':
        st.push(S('clip', 'Solte o parafuso da trava', 'screwdriver', ['bs0'], { mode: 'hold', hold: 0.6 }));
        st.push(S('rmbat', 'Leve a pilha velha ao descarte', 'tweezers', ['battery'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newbat', 'Coloque a pilha nova', 'tweezers', ['part_coin'], { mode: 'carry', drop: 'slot_battery' }));
        st.push(S('clipback', 'Recoloque o parafuso da trava (clique no prato)', 'screwdriver', ['bs0'], { onTarget: reinsertScrew }));
        break;
      case 'port':
        st.push(S('portoff', 'Desconecte o flex da porta', 'tweezers', ['c_port'], { onTarget: id => toggleConn(id, false) }));
        st.push(S('desolder', 'Dessolde os 2 pontos (segure)', 'solder', ['j0', 'j1'], { mode: 'hold', hold: 1.2, solder: true }));
        st.push(S('rmport', 'Leve a porta velha ao descarte', 'tweezers', ['port'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newport', 'Encaixe a porta nova', 'tweezers', ['part_port'], { mode: 'carry', drop: 'slot_port' }));
        st.push(S('resolder', 'Solde os 2 pontos (segure)', 'solder', ['j0', 'j1'], { mode: 'hold', hold: 1.2, solder: true, again: true }));
        break;
      case 'camera': {
        const mk = MODS[modKind(t)], nm = PARTS[mk.part].name.toLowerCase();
        st.push(S('camoff', `Desconecte o cabo do(a) ${nm}`, 'tweezers', ['c_cam'], { onTarget: id => toggleConn(id, false) }));
        st.push(S('rmcam', `Leve o(a) ${nm} velho(a) ao descarte`, 'tweezers', ['camera'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newcam', `Encaixe o(a) ${nm} novo(a)`, 'tweezers', ['part_' + mk.part], { mode: 'carry', drop: 'slot_cam' }));
        if (mk.part === 'motor' || mk.part === 'speaker') st.push(S('solmod', 'Solde os fios do módulo (segure)', 'solder', ['camera'], { mode: 'hold', hold: 1.2, solder: true, again: true }));
        break;
      }
      case 'water':
        if (mod('instaClean')) { Object.keys(T).filter(k => k.startsWith('rust')).forEach(cleanSpot); META.consumeMod('instaClean'); UI.toast('🧪 O álcool limpou a oxidação na hora!', 'good'); }
        else st.push(S('clean', 'Limpe a oxidação com escova + álcool (segure)', 'brush', Object.keys(T).filter(k => k.startsWith('rust')), { mode: 'hold', hold: 1.1, onTarget: id => cleanSpot(id) }));
        st.push(S('dry', 'Seque a placa com o soprador (segure)', 'heat', ['board'], { mode: 'hold', hold: 2.2 }));
        break;
      case 'chip':
        st.push(S('desolchip', 'Dessolde o chip (segure)', 'solder', ['chip'], { mode: 'hold', hold: 2.2, solder: true }));
        st.push(S('rmchip', 'Leve o chip queimado ao descarte', 'tweezers', ['chip'], { mode: 'carry', drop: 'trash' }));
        st.push(S('newchip', 'Posicione o chip novo', 'tweezers', ['part_chip'], { mode: 'carry', drop: 'slot_chip' }));
        st.push(S('solchip', 'Solde o chip novo (segure)', 'solder', ['chip'], { mode: 'hold', hold: 2.2, solder: true, again: true }));
        break;
      case 'button':
        if (mod('instaClean')) { ['dirt0', 'dirt1'].forEach(cleanSpot); META.consumeMod('instaClean'); UI.toast('🧪 O álcool limpou os contatos na hora!', 'good'); break; }
        st.push(S('cleanbtn', 'Limpe os contatos dos botões (segure)', 'brush', ['dirt0', 'dirt1'], { mode: 'hold', hold: 1.3, onTarget: id => cleanSpot(id) }));
        break;
    }
    return st;
  }

  function closeSteps() {
    const t = job.type; const st = [];
    if (t !== 'watch') {
      const conns = ['c_lcd', 'c_cam', 'c_port', 'c_bat'].filter(c => T[c] && !T[c].obj.userData.connected);
      if (conns.length) st.push(S('reconnect', 'Reconecte os cabos (bateria por ÚLTIMO!)', 'tweezers', conns, { onTarget: id => reconnect(id) }));
      st.push(S('bracketback', 'Recoloque a blindagem', 'tweezers', ['bracket'], { onTarget: placeBracket }));
      st.push(S('bsback', 'Recoloque os parafusos da blindagem (clique no prato)', 'screwdriver', ['bs0', 'bs1'], { onTarget: reinsertScrew }));
    }
    st.push(S('close', 'Feche o aparelho (mão)', 'hand', ['shell'], { onTarget: closeShell }));
    if (t !== 'watch') st.push(S('extback', 'Recoloque os parafusos da carcaça (clique no prato)', 'screwdriver', shellInfo.xs.slice(), { onTarget: reinsertScrew }));
    st.push(S('test', 'Ligue o aparelho para testar!', 'hand', ['power'], { onTarget: testPower }));
    return st;
  }

  function renderSteps() {
    const ol = UI.$('#rp-steps');
    ol.innerHTML = steps.map((s, i) => `<li class="${s.skipped ? 'skipped' : i < sIdx ? 'done' : i === sIdx ? 'cur' : ''}">${s.text}</li>`).join('')
      + (steps.length && !steps.find(s => s.id === 'test') ? '<li>…</li>' : '');
    const cur = steps[sIdx];
    UI.$('#rp-instr').textContent = cur ? cur.text : '';
    UI.$('#rp-instr').style.visibility = cur && cur.text ? 'visible' : 'hidden';
    document.querySelectorAll('.tool').forEach(el => el.classList.toggle('hint', !!cur && el.dataset.id === cur.tool && cur.tool !== tool));
    const li = ol.querySelector('.cur'); if (li) li.scrollIntoView({ block: 'nearest' });
    const showMeter = cur && (cur.mode === 'heat');
    UI.$('#rp-meter').classList.toggle('hidden', !showMeter && !holding);
  }

  function curStep() { return steps[sIdx]; }
  function advanceStep() {
    const s = curStep();
    if (s && s.onComplete) s.onComplete();
    sIdx++;
    renderSteps();
    if (sIdx >= steps.length) { /* aguardando novas etapas (ex: diagnóstico) */ }
  }
  function markTarget(s, id) {
    s.done.add(id);
    if (s.onTarget) s.onTarget(id);
    if (s.targets.every(t => s.done.has(t))) advanceStep(); else renderSteps();
  }

  // ---------- ações ----------
  function damage(v, why) {
    if (shieldLeft > 0) { shieldLeft--; AUDIO.sfx('glass', { vol: .6 }); UI.toast(`🛡️ Proteção absorveu o erro: ${why}`, 'good'); return; }
    v = Math.max(1, Math.round(v * (1 - Math.min(.8, mod('damageMult')))));
    job.damaged = true;
    integ = Math.max(0, integ - v);
    UI.toast(`⚠ ${why} <b style="color:#c1121f">−${v}%</b>`, 'bad');
    UI.shake();
    updateHUD();
    if (integ <= 0) destroyed();
  }

  function stepMatches(s, id, tl) { return s && s.tool === tl && s.targets.includes(id) && !s.done.has(id); }

  function action(id, kind) {
    if (finished || !job) return;
    let s = curStep();
    if (!s) return;
    // carregando algo: só aceita o destino
    if (carry) {
      if (kind !== 'down') return;
      if (id === carry.drop) dropCarry(); else if (id) { AUDIO.sfx('error', { vol: .5 }); UI.toast('Leve até: ' + (T[carry.drop] ? T[carry.drop].label : ''), ''); }
      return;
    }
    if (!id) return;
    if (tool === 'magnifier') return;
    // recolocar parafusos: qualquer parafuso do prato serve
    if (s.onTarget === reinsertScrew && tool === 'screwdriver' && T[id] && T[id].obj.userData.inDish && !stepMatches(s, id, tool)) {
      const left = s.targets.filter(t => !s.done.has(t) && T[t] && T[t].obj.userData.inDish);
      if (left.length) id = left[0];
    }
    if (!stepMatches(s, id, tool)) {
      // pular etapa arriscada?
      const nx = steps[sIdx + 1];
      if (s.skip && stepMatches(nx, id, tool)) {
        s.skipped = true;
        if (s.skip === 'heat') { heatSkipped = true; }
        if (s.skip === 'battery') { skippedBattery = true; }
        sIdx++; renderSteps(); s = curStep();
      } else {
        if (kind === 'down') wrong(id);
        return;
      }
    }
    // perigo: mexer com a bateria conectada
    if (batteryConnected && skippedBattery && !sparked && ['tweezers', 'solder', 'brush', 'screwdriver'].includes(tool) && inner.visible && id !== 'c_bat' && !mod('noSpark')) {
      sparked = true;
      AUDIO.sfx('zap'); emit(T[id].obj.getWorldPosition(new V3()).add(new V3(0, .2, 0)), { n: 40, color: 0x9ef0ff, speed: 3.5, life: .5 });
      UI.flash('#bde0fe', .6);
      damage(20, 'CURTO-CIRCUITO! A bateria estava conectada!');
    }
    if (s.mode === 'click' && kind === 'down') {
      if (s.id === 'pry') doPry(id);
      AUDIO.sfx(tool === 'tweezers' ? 'snap' : 'click');
      markTarget(s, id);
    } else if ((s.mode === 'hold' || s.mode === 'heat') && kind === 'down') {
      holding = true; holdTarget = id; holdT = 0; holdStart.x = pointer.x; holdStart.y = pointer.y;
      if (tool === 'heat') AUDIO.heat(true, 'heat');
      if (tool === 'solder' || tool === 'brush') AUDIO.heat(true, 'sizzle');
      UI.$('#rp-meter').classList.remove('hidden');
    } else if (s.mode === 'carry' && kind === 'down') {
      pickCarry(id, s.drop);
    }
  }
  let heatSkipped = false;

  function wrong(id) {
    AUDIO.sfx('error', { vol: .45 });
    const s = curStep();
    const t = TOOLS.find(x => x.id === s.tool);
    UI.toast(`Agora: <b>${s.text}</b> — use <b>${t ? t.name : ''}</b>`);
    timeUsed += 1.5;
  }

  function doPry(id) {
    AUDIO.sfx('pry'); AUDIO.sfx('pop', { vol: .6 });
    const m = T[id].obj; m.visible = false;
    shell.position.y += 0.02;
    const needHeat = !!GLUED[job.type];
    if (needHeat && heat < 60 && !mod('noCrack')) {
      if (Math.random() < 0.4) {
        AUDIO.sfx('glassBreak');
        if (!crackPlane) addCrack(shell);
        damage(15, 'A tela trincou! Faltou aquecer a cola.');
        job.extraCrack = true;
      } else UI.toast('Cuidado: a cola está fria, pode trincar!', '');
    }
  }

  function openShell() {
    AUDIO.sfx('pop');
    inner.visible = true;
    setGlow(shell, 0, 0);
    const from = shell.position.clone(), fromR = shell.rotation.z;
    const to = PARK.clone();
    TWEENS.add(0.9, e => {
      shell.position.lerpVectors(from, to, e); shell.position.y = from.y + Math.sin(e * Math.PI) * 1.2 + (job.type === 'watch' ? 0 : shellInfo.h * e);
      shell.rotation.z = fromR + Math.PI * e;
    }, 'inOut');
    // parafusos externos já estão no prato; esconde os marcadores
    for (let i = 0; i < 4; i++) if (T['pry' + i]) T['pry' + i].obj.visible = false;
  }

  function closeShell() {
    const from = shell.position.clone(), fromR = shell.rotation.z;
    AUDIO.sfx('pop');
    TWEENS.add(0.8, e => {
      shell.position.lerpVectors(from, new V3(0, 0, 0), e); shell.position.y = (1 - e) * from.y + Math.sin(e * Math.PI) * 1.2;
      shell.rotation.z = fromR * (1 - e);
    }, 'inOut', () => { shell.rotation.z = 0; shell.position.set(0, 0, 0); inner.visible = false; AUDIO.sfx('snap'); });
  }

  function removeBracket() {
    const b = T.bracket.obj; const from = b.position.clone();
    const to = BRACKET_PARK.clone();
    b.userData.parked = to.clone();
    TWEENS.add(0.5, e => { b.position.lerpVectors(from, to, e); b.position.y += Math.sin(e * Math.PI) * .6; });
    AUDIO.sfx('place');
    // o inner é filho do root; move o bracket para fora do "inner" visualmente continua ok
  }
  function placeBracket() {
    const b = T.bracket.obj; const from = b.position.clone(); const to = b.userData.home;
    TWEENS.add(0.5, e => { b.position.lerpVectors(from, to, e); b.position.y += Math.sin(e * Math.PI) * .6; }, 'inOut', () => AUDIO.sfx('place'));
  }

  function toggleConn(id, on) {
    const c = T[id].obj; c.userData.connected = on;
    const from = c.rotation.x, to = on ? 0 : -0.9;
    const fy = c.position.y, ty = on ? c.userData.home.y : c.userData.home.y + 0.08;
    TWEENS.add(0.25, e => { c.rotation.x = from + (to - from) * e; c.position.y = fy + (ty - fy) * e; });
    AUDIO.sfx('snap');
    if (id === 'c_bat') batteryConnected = on;
  }
  function reconnect(id) {
    if (id === 'c_bat') {
      const others = ['c_lcd', 'c_cam', 'c_port'].filter(c => T[c] && !T[c].obj.userData.connected);
      if (others.length) {
        AUDIO.sfx('zap'); emit(T[id].obj.getWorldPosition(new V3()).add(new V3(0, .15, 0)), { n: 30, color: 0xffe066, speed: 3, life: .5 });
        damage(12, 'Faísca! A bateria deve ser conectada por último.');
      }
    }
    toggleConn(id, true);
  }
  // parafuso volta do prato magnético para o furo e é apertado
  function reinsertScrew(id) {
    // prato magnético grande: um clique recoloca todos os parafusos da etapa
    const s0 = curStep();
    if (mod('reassemblyFast') && s0 && s0.onTarget === reinsertScrew && !reinsertScrew.busy) {
      reinsertScrew.busy = true;
      s0.targets.filter(t => t !== id && !s0.done.has(t)).forEach(t => { s0.done.add(t); reinsertScrew(t); });
      reinsertScrew.busy = false;
    }
    const o = T[id].obj;
    const par = id.startsWith('xs') ? root : inner;
    par.attach(o);
    o.userData.inDish = false;
    const from = o.position.clone(); const home = o.userData.home.clone();
    const out = home.clone().addScaledVector(o.userData.out, 0.14);
    AUDIO.sfx('screwOut', { rate: .8 });
    TWEENS.add(0.3, e => { o.position.lerpVectors(from, out, e); o.position.y += Math.sin(e * Math.PI) * .35; }, 'out', () => {
      TWEENS.add(0.35, e => {
        o.position.lerpVectors(out, home, e);
        o.userData.inner.rotation[o.userData.axis === 'z' ? 'z' : 'y'] -= 0.5;
        if (Math.random() < .3) AUDIO.sfx('ratchet', { vol: .3 });
      }, 'lin');
    });
  }
  function screwToDish(id) {
    const o = T[id] && T[id].obj; if (!o || o.userData.inDish) return;
    scene.attach(o);
    o.position.copy(DISH).add(new V3((Math.random() - .5) * .45, .06, (Math.random() - .5) * .35));
    o.userData.inDish = true;
  }

  function pullTab(id) {
    const t = T[id].obj; const from = t.position.z;
    TWEENS.add(0.4, e => { t.position.z = from + e * 0.7; t.position.y = 0.075 + e * 0.2; t.scale.z = 1 + e * 1.5; }, 'out', () => { t.visible = false; });
    AUDIO.sfx('pry');
  }
  function cleanSpot(id) {
    const g = T[id].obj;
    emit(g.getWorldPosition(new V3()).add(new V3(0, .2, 0)), { n: 14, color: 0xe0fbfc, speed: 1.2, life: .8, grav: 1, size: .04, emissive: false });
    TWEENS.add(0.3, e => g.scale.setScalar(1 - e), 'in', () => { g.visible = false; });
    unregLater(id);
  }
  function unregLater(id) { setTimeout(() => unreg(id), 350); }

  // --- carregar peça ---
  function pickCarry(id, drop) {
    const o = T[id].obj;
    const wp = o.getWorldPosition(new V3()); const wq = o.getWorldQuaternion(new THREE.Quaternion());
    const ws = o.getWorldScale(new V3());
    scene.attach(o);
    carry = { id, obj: o, drop, startPos: wp, q: wq, s: ws };
    if (T[drop]) { T[drop].obj.visible = true; }
    AUDIO.sfx('snap');
    if (id === 'battery' && job.fault === 'battery') UI.toast('Cuidado com a bateria estufada!', '');
  }
  function dropCarry() {
    const c = carry; carry = null;
    const target = T[c.drop].obj;
    const s = curStep();
    if (c.drop === 'trash') {
      const to = TRASH.clone().add(new V3(0, 0.5, 0));
      const from = c.obj.position.clone();
      AUDIO.sfx('trash');
      TWEENS.add(0.45, e => { c.obj.position.lerpVectors(from, to, e); c.obj.position.y += Math.sin(e * Math.PI) * .5; c.obj.scale.setScalar(c.s.x * (1 - e * .85)); }, 'in', () => { c.obj.visible = false; });
      unreg(c.id);
      if (c.id === 'shell') { crackPlane = null; }
    } else {
      // encaixa a peça nova na posição do encaixe
      const wp = target.getWorldPosition(new V3()); wp.y -= 0.08;
      const from = c.obj.position.clone();
      let toScale = c.obj.scale.x;
      const isShell = c.drop === 'slot_shell';
      if (isShell) { toScale = 1; wp.copy(PARK); wp.y = shellInfo.h; }
      // registra já com o id "oficial" (as próximas etapas dependem dele)
      const canon = isShell ? 'shell' : ({ part_battery: 'battery', part_port: 'port', part_chip: 'chip', part_coin: 'battery' }[c.id] || (MODS[c.id.replace('part_', '')] ? 'camera' : c.id));
      unreg(c.id);
      reg(canon, c.obj, isShell ? job.name + ' (peça nova)' : (PARTS[c.id.replace('part_', '')] || { name: 'Peça' }).name + ' (nova)', 'Novinha em folha');
      if (isShell) shell = c.obj;
      TWEENS.add(isShell ? 0.7 : 0.45, e => {
        c.obj.position.lerpVectors(from, wp, e); c.obj.position.y += Math.sin(e * Math.PI) * (isShell ? .9 : .4);
        c.obj.scale.setScalar(c.s.x + (toScale - c.s.x) * e);
        if (isShell) c.obj.rotation.z = Math.PI * e;
      }, 'out', () => {
        AUDIO.sfx('place');
        if (isShell) root.attach(c.obj); // a peça nova vira a carcaça (virada, esperando o fechamento)
        else { inner.attach(c.obj); c.obj.rotation.set(0, 0, 0); }
      });
      target.visible = false;
    }
    markTarget(s, c.id);
  }

  // --- diagnóstico ---
  function reading(n) {
    const f = job.fault;
    if (n === 'BAT' && (f === 'battery' || f === 'coin')) return (f === 'coin' ? '0.91 V' : (2.1 + Math.random() * .6).toFixed(2) + ' V');
    if (n === 'BAT' && job.type === 'watch' && f !== 'water') return (1.5 + Math.random() * .08).toFixed(2) + ' V';
    if (n === 'USB' && f === 'port') return '0.00 V';
    if (n === 'LCD' && f === 'screen') return 'O.L.';
    if (n === 'CAM' && f === 'camera') return '0.00 V';
    if (n === 'CPU' && f === 'chip') return '0.02 V';
    if (f === 'water' && (n === 'BAT' || n === 'USB' || n === 'MOV')) return (1 + Math.random() * 3).toFixed(2) + ' V?';
    return READ_NORMAL[n] ? READ_NORMAL[n]() : '---';
  }
  function isBadReading(n) {
    const f = job.fault;
    return (n === 'BAT' && (f === 'battery' || f === 'coin')) || (n === 'USB' && f === 'port') || (n === 'LCD' && f === 'screen') || (n === 'CAM' && f === 'camera') || (n === 'CPU' && f === 'chip') || (f === 'water' && ['BAT', 'USB', 'MOV'].includes(n));
  }
  function measure(id) {
    const n = id.replace('tp_', '');
    const v = reading(n);
    measured[n] = v;
    const lcd = UI.$('#rp-lcd'); lcd.textContent = (n === 'CAM' ? MODS[modKind(job.type)].tp : n) + ' ' + v;
    const bad = isBadReading(n);
    lcd.style.color = (bad && mod('scanner')) ? '#c1121f' : '#1b3a1b';
    AUDIO.sfx(v.startsWith('0.0') ? 'beep' : 'meter', { vol: .5 });
    if (n === 'CPU' && job.fault === 'chip') { setGlow(T.chip.obj, 0xff3300, 0.8); UI.toast('O chip está fervendo! 🔥'); }
    if (bad && mod('scanner')) UI.toast(`Scanner: leitura anormal em <b>${n}</b>!`, 'gold');
  }

  function askDiagnosis() {
    const opts = faultsFor(job.model);
    const readings = Object.entries(measured).map(([k, v]) => `${k}: <b>${v}</b>`).join(' · ');
    const box = UI.screen(`<div class="card" style="max-width:640px">
      <h2>Qual é o defeito?</h2>
      <p style="font-size:14px">Leituras: ${readings}</p>
      <p style="font-size:13px;opacity:.8">Dica: compare com os valores normais. Use a <b>lupa</b> para inspecionar peças. Diagnóstico errado custa caro!</p>
      <div class="grid" style="grid-template-columns:repeat(3,1fr)">${opts.map(o => `<button class="btn ${o === 'water' || o === 'button' ? 'purple' : ''}" data-f="${o}" style="font-size:16px">${faultName(o, job.type)}${faultPart(o, job.type) ? `<br><small style="font-size:12px">peça: ${PARTS[faultPart(o, job.type)].name}</small>` : '<br><small style="font-size:12px">sem peça</small>'}</button>`).join('')}</div>
      <button class="btn" id="dg-back" style="font-size:14px;background:#aaa;box-shadow:0 4px 0 #666">Voltar e inspecionar mais</button>
    </div>`, 'dim');
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { UI.closeScreen(); applyDiagnosis(b.dataset.f); });
    box.querySelector('#dg-back').onclick = () => {
      UI.closeScreen();
      // volta para permitir usar a lupa: reinsere uma etapa de diagnóstico simples
      steps.splice(sIdx, 0, S('diag2', 'Inspecione e clique num ponto de teste para decidir', 'meter', Object.keys(T).filter(k => k.startsWith('tp_')), { onComplete: askDiagnosis, anyOne: true }));
      renderSteps();
    };
  }

  function applyDiagnosis(d) {
    job.diag = d;
    job.wrongDiag = d !== job.fault;
    UI.$('#rp-fault').textContent = faultName(d, job.type);
    AUDIO.sfx('confirm');
    // compra da peça
    const part = faultPart(d, job.type);
    if (part) {
      const ok = GAME.consumePart(part, job);
      if (!ok) { failJob('Sem dinheiro para comprar a peça!'); return; }
      spawnPart(part);
    }
    // insere etapas de conserto após as etapas de abertura restantes
    const rest = steps.slice(sIdx);
    steps = steps.slice(0, sIdx).concat(rest, fixSteps(d));
    // as etapas de fechamento serão adicionadas depois do conserto
    steps.push(S('_close', '', null, [], { marker: true }));
    expandClose();
    renderSteps();
  }
  function expandClose() {
    const i = steps.findIndex(s => s.marker);
    if (i >= 0) {
      // adiada até chegar nela (para saber quais conectores estão soltos)
      steps[i] = S('_prep', 'Preparar a remontagem', null, [], { lazyClose: true });
    }
  }

  function testPower() {
    const ok = !job.wrongDiag && !(job.extraCrack && job.diag !== 'screen');
    AUDIO.sfx(ok ? 'boot' : 'fail');
    if (ok) {
      bootVisual();
      finished = true;
      setTimeout(() => { AUDIO.sfx('success'); finish(true); }, 1600);
    } else {
      const why = job.wrongDiag ? 'Não ligou... O defeito era outro!' : 'Ligou, mas a tela trincada que VOCÊ causou está péssima!';
      if (job.extraCrack && !job.wrongDiag) { finished = true; bootVisual(); setTimeout(() => finish(true), 1500); UI.toast(why, 'bad'); return; }
      if (job.wrongDiag) { job.hadWrong = true; if (window.GAME) GAME.refundWrong(job); }
      damage(8, why);
      if (finished) return;
      UI.toast('Reabrindo o aparelho para diagnosticar de novo...', '');
      timeUsed += 10;
      setTimeout(reopen, 900);
    }
  }
  function reopen() {
    // abre de novo automaticamente (sem parafusos externos/cola)
    finished = false;
    if (bootPlane) { root.remove(bootPlane); bootPlane = null; }
    shellInfo.xs.forEach(screwToDish);
    openShell();
    // blindagem e parafusos saem sozinhos, bateria desconectada
    if (job.type !== 'watch') ['bs0', 'bs1'].forEach(screwToDish);
    if (T.bracket) { T.bracket.obj.position.copy(BRACKET_PARK); }
    if (T.c_bat && T.c_bat.obj.userData.connected) toggleConn('c_bat', false);
    measured = {};
    job.wrongDiag = false; job.diag = null;
    UI.$('#rp-fault').textContent = '?';
    steps = [S('diag', 'Diagnóstico: meça os pontos de teste', 'meter', Object.keys(T).filter(k => k.startsWith('tp_')), { onComplete: askDiagnosis })];
    sIdx = 0; renderSteps();
  }

  function bootVisual() {
    const f = shellInfo.face;
    if (job.type === 'watch') {
      shell.traverse(o => { if (o.isMesh && /hand/i.test(o.name)) o.userData.spin = true; });
    } else if (HAS_SCREEN[job.type]) {
      bootPlane = new THREE.Mesh(new THREE.PlaneGeometry(f.w * .92, f.d * .92), new THREE.MeshBasicMaterial({ map: bootTex(job.name), transparent: true, opacity: 0, toneMapped: false }));
      bootPlane.rotation.x = -Math.PI / 2; bootPlane.position.set(0, f.y + 0.012, f.z); root.add(bootPlane);
      TWEENS.add(0.8, e => { bootPlane.material.opacity = e; });
    } else {
      // aparelhos sem tela: LED verde de "funcionando" + selo flutuante
      const top = surfaceAt(shell, 0, 0);
      const y = top ? top.point.y : shellInfo.h;
      bootPlane = new THREE.Group();
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0x52ff8f, toneMapped: false }));
      led.position.set(0, y + 0.08, 0); bootPlane.add(led);
      const tag = label('♥ 100% OK!', '#52d68a', '#fff'); tag.position.set(0, y + 0.55, 0); tag.scale.set(1.2, 0.3, 1); bootPlane.add(tag);
      root.add(bootPlane);
      TWEENS.add(0.8, e => { tag.material.opacity = e; led.scale.setScalar(1 + Math.sin(e * 20) * .3); });
    }
    emit(new V3(0, 0.6, 0), { n: 30, color: 0xff8fc8, speed: 2.5, life: 1, size: .04 });
    UI.flash('#fff', .35);
  }

  function destroyed() {
    finished = true;
    AUDIO.sfx('zap'); AUDIO.sfx('glassBreak');
    emit(new V3(0, .3, 0), { n: 60, color: 0x444444, speed: 1.5, life: 1.5, grav: 1, size: .08, emissive: false });
    setTimeout(() => finish(false, 'destroyed'), 1200);
  }
  function failJob(msg) {
    finished = true;
    UI.toast(msg, 'bad');
    setTimeout(() => finish(false, 'noparts'), 800);
  }

  function finish(ok, reason) {
    AUDIO.heat(false);
    if (!onFinish) return;
    const cb = onFinish; onFinish = null;
    cb({ ok, reason, integ: Math.round(integ), time: timeUsed, par: job.par, wrongDiag: job.wrongDiag, nodmg: !job.damaged, firstTry: !job.hadWrong });
  }

  // ---------- atualização ----------
  function setGlow(obj, color, i) { ASSETS.setGlow(obj, color, i); }
  let glowT = 0;
  function update(dt, t) {
    if (!job) return;
    updParticles(dt);
    if (!finished && active) { timeUsed += dt; }
    updateTimer();
    // lazy: gera as etapas de fechamento quando chega a vez
    const s = curStep();
    if (s && s.lazyClose) { steps.splice(sIdx, 1, ...closeSteps()); renderSteps(); }
    else if (s && !finished && s.targets && s.targets.length === 0 && !s.marker) { advanceStep(); return; }

    // destaque dos alvos da etapa atual
    glowT += dt;
    const pulse = 0.25 + (Math.sin(glowT * 6) * .5 + .5) * 0.45;
    for (const id in T) {
      const tt = T[id];
      const isTarget = s && s.targets && s.targets.includes(id) && !s.done.has(id) && !carry;
      const isDrop = carry && carry.drop === id;
      const hov = hovered === id;
      if (tt.obj.userData.isSlot || id.startsWith('slot_')) { tt.obj.visible = isDrop; if (isDrop) tt.obj.material.opacity = 0.2 + pulse * .3; continue; }
      if (id.startsWith('pry') || id === 'power') { tt.obj.visible = !!isTarget; if (isTarget) { tt.obj.userData.cone.position.y = 0.22 + Math.sin(glowT * 5) * .05; } continue; }
      if (id === 'trash') { setGlow(tt.obj, 0xff4fa8, isDrop ? pulse : 0); continue; }
      if (id === 'shell' && s && s.mode === 'heat') { setGlow(tt.obj, 0xff5500, Math.min(1, heat / 100) * 0.6 + (isTarget ? pulse * .3 : 0)); continue; }
      setGlow(tt.obj, hov ? 0xffffff : 0xff4fa8, isTarget || isDrop ? (hov ? .55 : pulse) : (hov && tool !== 'hand' ? 0.15 : 0));
    }
    // aquecimento
    if (s && s.mode === 'heat') {
      if (holding && tool === 'heat' && hovered === 'shell') {
        heat += dt * 30 * (1 + mod('heatSpeed'));
        if (Math.random() < .5) emit(cursorWorld.clone().add(new V3(0, .1, 0)), { n: 1, color: 0xff8a00, speed: .6, life: .5, grav: 1.5, size: .05 });
      }
      if (heat > 150 && !mod('noOverheat')) { integ -= dt * 8; job.damaged = true; if (Math.random() < dt * 2) UI.toast('Está queimando! Solte o soprador!', 'bad'); updateHUD(); if (integ <= 0) destroyed(); }
      showMeter(Math.min(1, heat / 100), heat >= 100 ? (heat > 150 ? 'QUENTE DEMAIS!' : 'Pronto! Solte.') : `Cola: ${Math.round(heat)}%`, heat > 150 ? '#e63946' : null);
      if (!holding && heat >= 100) { markTarget(s, 'shell'); }
    }
    if (!holding) heat = Math.max(0, heat - dt * 5);
    // segurar (parafusos, solda, escova, abas)
    if (holding && s && s.mode === 'hold') {
      const near = Math.hypot(pointer.x - holdStart.x, pointer.y - holdStart.y) < 45;
      if ((hovered === holdTarget || near) && tool === s.tool) {
        let rate = 1;
        if (tool === 'screwdriver') rate = 1 + mod('screwSpeed');
        if (tool === 'solder') rate = 1 + mod('solderSpeed');
        if (tool === 'heat') rate = 1 + mod('heatSpeed');
        holdT += dt * rate;
        animateHold(holdTarget, s, holdT / s.hold, dt);
        showMeter(Math.min(1, holdT / s.hold), s.text);
        if (s.solder && holdT > s.hold * 1.6 && !mod('noBurn')) { holding = false; damage(10, 'Queimou a placa! Ferro tempo demais.'); }
        if (holdT >= s.hold) {
          const id = holdTarget; holding = false; holdT = 0;
          AUDIO.heat(false);
          completeHold(id, s);
        }
      } else if (hovered !== holdTarget) { /* saiu do alvo: pausa */ }
    }
    if (shell && shell.userData.hb) shell.userData.hb.visible = !!(inner && inner.visible);
    // câmera aproxima quando o aparelho está aberto
    if (camIntro <= 0) {
      const open = inner && inner.visible;
      const tp = open ? camOpenCur : camPosCur, tl = open ? LOOK_OPEN : CAM_LOOK;
      camera.position.lerp(tp, Math.min(1, dt * 2.5)); camLookCur.lerp(tl, Math.min(1, dt * 2.5)); camera.lookAt(camLookCur);
    } else camIntro -= dt;
    // ferramenta seguindo o cursor
    updateToolCursor(dt, t);
    // ponteiros do relógio após o boot
    if (finished && shell) shell.traverse(o => { if (o.userData.spin) o.rotation.y -= dt * (o.name.includes('Second') ? 3 : 0.4); });
    // chip queimando solta fumaça
    if (job.fault === 'chip' && T.chip && inner && inner.visible && Math.random() < dt * 3) emit(T.chip.obj.getWorldPosition(new V3()).add(new V3(0, .1, 0)), { n: 1, color: 0x777777, speed: .2, life: 1.2, grav: .8, size: .05, emissive: false });
    // carregando
    if (carry) {
      const p = cursorWorld.clone(); p.y = 0.7 + Math.sin(t * 4) * .03;
      carry.obj.position.lerp(p, Math.min(1, dt * 14));
    }
  }

  function animateHold(id, s, k, dt) {
    const o = T[id] && T[id].obj; if (!o) return;
    if (s.tool === 'screwdriver') {
      const inn = o.userData.inner; inn.rotation[o.userData.axis === 'z' ? 'z' : 'y'] += dt * 14 * (s.reinsert ? -1 : 1);
      if (Math.random() < dt * 8) AUDIO.sfx('ratchet', { vol: .35 });
      if (!s.reinsert) { const out = o.userData.out; o.position.copy(o.userData.home).addScaledVector(out, k * 0.14); }
    } else if (s.tool === 'solder') {
      if (Math.random() < dt * 20) emit(o.getWorldPosition(new V3()).add(new V3(0, .08, 0)), { n: 1, color: 0xdddddd, speed: .3, life: 1, grav: 1, size: .04, emissive: false });
      if (Math.random() < dt * 10) emit(o.getWorldPosition(new V3()).add(new V3(0, .08, 0)), { n: 1, color: 0xffcc33, speed: 1.2, life: .3, size: .015 });
    } else if (s.tool === 'brush') {
      if (Math.random() < dt * 14) emit(o.getWorldPosition(new V3()).add(new V3(0, .15, 0)), { n: 1, color: 0xe0fbfc, speed: .8, life: .6, grav: 1, size: .03, emissive: false });
    } else if (s.tool === 'heat') {
      if (Math.random() < dt * 10) emit(o.getWorldPosition(new V3()).add(new V3(0, .2, 0)), { n: 1, color: 0xff8a00, speed: .6, life: .5, grav: 1.5, size: .05 });
    } else if (s.tool === 'tweezers') {
      o.position.y = 0.075 + k * 0.05;
    }
  }

  function completeHold(id, s) {
    const o = T[id] && T[id].obj;
    if (s.tool === 'screwdriver') {
      if (!s.reinsert) {
        AUDIO.sfx('screwOut');
        const wp = o.getWorldPosition(new V3()); scene.attach(o);
        const to = DISH.clone().add(new V3((Math.random() - .5) * .45, .06, (Math.random() - .5) * .35));
        const from = wp.clone();
        TWEENS.add(0.45, e => { o.position.lerpVectors(from, to, e); o.position.y += Math.sin(e * Math.PI) * .6; }, 'inOut', () => AUDIO.sfx('screwDrop', { vol: .5 }));
        o.userData.inDish = true;
      }
    } else if (s.solder) {
      AUDIO.sfx('pop', { vol: .4 });
      if (id === 'chip' && !s.again) setGlow(o, 0, 0);
    } else if (s.id === 'dry') {
      AUDIO.sfx('confirm2');
    }
    markTarget(s, id);
  }

  let meterEl = null;
  function showMeter(k, txt, color) {
    UI.$('#rp-meter').classList.remove('hidden');
    const f = UI.$('#rp-meter-fill'); f.style.width = (k * 100) + '%';
    f.style.background = color || (k >= 1 ? 'linear-gradient(90deg,#52d68a,#9ef0b5)' : 'linear-gradient(90deg,#ffb703,#fb5607)');
    UI.$('#rp-meter-label').textContent = txt;
  }

  // ---------- cursor 3D ----------
  const cursorWorld = new V3();
  function updateToolCursor(dt, t) {
    for (const id in toolObjs) toolObjs[id].root.visible = false;
    const to = toolObjs[tool];
    if (!to || !pointer.in || carry) return;
    to.root.visible = true;
    const p = cursorWorld.clone();
    let lift = holding ? 0.0 : 0.08;
    to.root.position.lerp(new V3(p.x, p.y + lift, p.z), Math.min(1, dt * 20));
    if (tool === 'screwdriver' && holding) to.inner.rotation.y += dt * 14;
    if (tool === 'solder') solderTipMat.emissive.setHex(holding ? 0xff5500 : 0x331100);
    if (tool === 'brush' && holding) to.root.rotation.z = -0.35 + Math.sin(t * 30) * .15; else if (tool === 'brush') to.root.rotation.z = -0.35;
    if (tool === 'heat') to.root.position.y += 0.35;
    if (tool === 'magnifier') to.root.position.y += 0.35;
  }

  function onMove(e) {
    if (!active) return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    const r = ENGINE.canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.in = e.target === ENGINE.canvas;
    scene.updateMatrixWorld();
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(pickables.filter(m => isVisible(m)), false);
    const h = hits.find(x => x.object.userData.tid && T[x.object.userData.tid] && (!carry || x.object.userData.tid !== carry.id));
    hovered = h ? h.object.userData.tid : null;
    if (h) cursorWorld.copy(h.point); else ray.ray.intersectPlane(hoverPlane, cursorWorld);
    // tooltip
    if (hovered && pointer.in) {
      const tt = T[hovered];
      let txt = tt.label;
      if (tool === 'magnifier' && tt.cond) txt += ' — ' + tt.cond;
      else if (tool === 'magnifier') txt += ' — nada de estranho';
      UI.tooltip(txt, e.clientX, e.clientY);
    } else UI.tooltip(null);
    ENGINE.canvas.style.cursor = tool === 'hand' ? (hovered ? 'pointer' : 'default') : (pointer.in ? 'none' : 'default');
  }
  function isVisible(o) { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; }
  function onDown(e) {
    if (!active || e.button !== 0 || e.target !== ENGINE.canvas) return;
    onMove(e);
    const s = curStep();
    if (s && s.anyOne && tool === 'meter' && hovered && hovered.startsWith('tp_')) { measure(hovered); advanceStep(); return; }
    if (tool === 'meter' && hovered && hovered.startsWith('tp_')) measure(hovered);
    action(hovered, 'down');
  }
  function onUp() {
    if (!active) return;
    if (holding) { holding = false; AUDIO.heat(false); }
    holdTarget = null; holdT = 0;
    const s = curStep();
    if (!s || s.mode !== 'heat') UI.$('#rp-meter').classList.add('hidden');
  }
  function onKey(e) {
    if (!active) return;
    const t = TOOLS.find(x => x.key === e.key);
    if (t) selectTool(t.id);
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('keydown', onKey);

  function selectTool(id) {
    if (carry) { UI.toast('Solte a peça primeiro!'); return; }
    tool = id;
    AUDIO.sfx('toggle', { vol: .5 });
    document.querySelectorAll('.tool').forEach(el => el.classList.toggle('sel', el.dataset.id === id));
    UI.$('#rp-multi').classList.toggle('hidden', id !== 'meter');
    renderSteps();
  }

  function buildToolbar() {
    const bar = UI.$('#rp-tools'); bar.innerHTML = '';
    for (const t of TOOLS) {
      const d = document.createElement('div'); d.className = 'tool'; d.dataset.id = t.id;
      let img = '';
      if (t.ico) img = `<div class="ico">${t.ico}</div>`;
      else if (t.proc && !t.thumbModel) img = `<img src="${ASSETS.thumb('tool_' + t.id, { obj: procTool(t.proc), dir: [1, .6, 1] })}">`;
      else img = `<img src="${ASSETS.thumb(t.thumbModel || t.model, { dir: [1, 1.2, 1.3] })}">`;
      d.innerHTML = `<kbd>${t.key}</kbd>${img}<span>${t.name}</span>`;
      d.onclick = () => selectTool(t.id);
      d.onmouseenter = () => AUDIO.sfx('hover', { vol: .3 });
      bar.appendChild(d);
    }
  }

  function updateTimer() {
    const m = Math.floor(timeUsed / 60), s = Math.floor(timeUsed % 60);
    const el = UI.$('#rp-timer'); el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.style.color = timeUsed > job.par ? '#c1121f' : '#1b7a3a';
  }
  function updateHUD() {
    const f = UI.$('#rp-integ'); f.style.width = integ + '%';
    f.className = 'bar-fill ' + (integ > 66 ? 'good' : integ > 33 ? 'mid' : 'bad');
  }

  // ---------- API ----------
  function clear() {
    if (root) scene.remove(root);
    for (const id in T) { const o = T[id].obj; if (o.parent === scene && id !== 'trash') scene.remove(o); }
    if (P.slotShell) scene.remove(P.slotShell);
    particles.forEach(p => scene.remove(p.m)); particles.length = 0;
    T = {}; pickables = []; root = shell = inner = null; carry = null; crackPlane = bootPlane = null;
    for (const k in P) delete P[k];
  }

  const REPAIR = {
    DEVICES, FAULTS, FAULTS_BY_TYPE, PARTS, AMBIG, MODS,
    faultsFor, faultName, faultPart, symptomsFor, modKind,
    scene, camera,
    init() { buildDecor(); buildToolObjs(); buildToolbar(); },
    // job: {model,name,type,fault,brand,customer,price,par}
    start(j, cb) {
      clear();
      buildDecor();
      // registra de novo a lixeira
      decor.traverse(o => { if (o.userData.tid === 'trash') { } });
      const bin = decor.children.find(c => c.userData.tid === 'trash'); if (bin) reg('trash', bin, 'Lixeira de descarte');
      job = j; onFinish = cb;
      integ = 100; timeUsed = 0; heat = 0; holding = false; finished = false; batteryConnected = true; skippedBattery = false; sparked = false; heatSkipped = false; measured = {};
      job.wrongDiag = false; job.diag = null; job.extraCrack = false;
      buildDevice();
      buildSteps(false);
      job.par = 70 + steps.length * 6 + (job.type === 'tablet' ? 15 : 0) + mod('parTime');
      UI.$('#rp-device').textContent = job.name;
      UI.$('#rp-owner').textContent = 'de ' + job.customerName;
      UI.$('#rp-symptom').textContent = '“' + job.symptom + '”';
      UI.$('#rp-fault').textContent = mod('scanner') ? '? (use o multímetro)' : '?';
      shieldLeft = Math.round(mod('shield')); job.damaged = false; job.hadWrong = false;
      if (mod('diagHint')) { UI.$('#rp-fault').textContent = '💡 Dica: ' + faultName(job.fault, job.type); META.consumeMod('diagHint'); }
      UI.$('#rp-price').textContent = UI.money(job.price);
      UI.$('#rp-par').textContent = `(meta ${Math.floor(job.par / 60)}:${String(Math.round(job.par % 60)).padStart(2, '0')})`;
      UI.$('#rp-lcd').textContent = '---';
      const tpn = MODS[modKind(job.type)].tp;
      UI.$('#rp-multi .legend').innerHTML = job.type === 'watch' ? 'Valores normais:<br>BAT 1.5 V · MOV 1.5 V' : `Valores normais:<br>BAT 3.7–4.2 V · USB 4.8–5.2 V<br>LCD 1.8 V · ${tpn} 2.8 V · CPU 0.9–1.1 V`;
      updateHUD(); selectTool('hand');
      UI.$('#rp-giveup').onclick = () => { if (!finished && confirm('Desistir? O cliente vai embora bravo e não paga nada.')) { finished = true; finish(false, 'giveup'); } };
      // câmera entra suavemente
      const from = new V3(0, 9, 7);
      camIntro = 1.05; camLookCur.copy(CAM_LOOK);
      fitCamera(Math.max(shellInfo.w, shellInfo.d));
      TWEENS.add(1.0, e => { camera.position.lerpVectors(from, camPosCur, e); camera.lookAt(CAM_LOOK); }, 'out');
    },
    onEnter() { active = true; UI.$('#repair-ui').classList.remove('hidden'); AUDIO.music('repair'); },
    onExit() { active = false; UI.$('#repair-ui').classList.add('hidden'); UI.tooltip(null); ENGINE.canvas.style.cursor = 'default'; AUDIO.heat(false); },
    update,
    get integ() { return integ; },
    get active() { return active && !finished; },
    heal(n) { if (!job || finished) return false; integ = Math.min(100, integ + n); updateHUD(); emit(new V3(0, .8, 0), { n: 24, color: 0x52ff8f, speed: 1.6, life: .9, size: .035 }); return true; },
    _dbg() { return { hovered, tool, sIdx, holding, holdT, step: curStep() && curStep().id, done: curStep() && [...curStep().done], targets: curStep() && curStep().targets, carry: carry && carry.id, T: Object.keys(T), cursor: cursorWorld.toArray().map(v => +v.toFixed(2)) }; },
    _step() { return curStep(); }, _job() { return job; },
    _tool(id) { const o = toolObjs[id].root; o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); return { vis: o.visible, pos: o.position.toArray().map(v => +v.toFixed(2)), min: b.min.toArray().map(v => +v.toFixed(2)), max: b.max.toArray().map(v => +v.toFixed(2)) }; },
    _who(id) { return pickables.filter(m => m.userData.tid === id).map(m => [m.geometry.type, m.parent && m.parent.name, m.getWorldPosition(new V3()).toArray().map(v => +v.toFixed(2))]); },
    _vis(id) { const o = T[id].obj; const p = o.getWorldPosition(new V3()); return { vis: visibleFromCam(p.clone().add(new V3(0, .03, 0))), cam: camPosCur.toArray().map(v => +v.toFixed(2)), real: camera.position.toArray().map(v => +v.toFixed(2)) }; },
    _hitsAt(id) { const p = this._screen(id); if (!p) return null; onMove({ clientX: p[0], clientY: p[1], target: ENGINE.canvas }); return this._hits().map(h => h[0]); },
    _hits() { const h = ray.intersectObjects(pickables.filter(m => isVisible(m)), false); return h.slice(0, 6).map(x => [x.object.userData.tid, x.object.name, x.object.type, +x.distance.toFixed(2)]); },
    _screen(id) {
      let o = T[id] && T[id].obj; if (!o) return null;
      if (o.userData.inner && o.userData.inner.userData.hit) o = o.userData.inner.userData.hit;
      else if (!o.isMesh) { const b = new THREE.Box3().setFromObject(o); const c = b.getCenter(new V3()); const p = c.project(camera); return [Math.round((p.x + 1) / 2 * innerWidth), Math.round((1 - p.y) / 2 * innerHeight)]; }
      const p = o.getWorldPosition(new V3()).project(camera); return [Math.round((p.x + 1) / 2 * innerWidth), Math.round((1 - p.y) / 2 * innerHeight)]; },
  };
  window.REPAIR = REPAIR;
  ENGINE.register('repair', REPAIR);
})();
