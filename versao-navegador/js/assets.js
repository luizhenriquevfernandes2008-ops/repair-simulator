// Modelos 3D baixados (poly.pizza) + utilidades de cena
(function () {
  const D = Math.PI / 180;
  // rot em graus aplicada antes de normalizar; size = maior dimensão horizontal (x/z); fit:'y' usa altura
  const MODELS = {
    // --- aparelhos para conserto ---
    phone_iphone: { file: 'phone_k2kg', rot: [-90, 0, 0], size: 2.5 },
    notch: { file: 'notchphone_1fhw', rot: [-90, 0, 0], size: 2.5 },
    galaxy: { file: 'phone_8f1o', rot: [-90, 0, 0], size: 2.6 },
    redphone: { file: 'red_smartphone_7rxn', rot: [90, 0, 0], size: 2.5 },
    moto: { file: 'cell_phone_bezr', rot: [0, 0, 0], size: 2.4 },
    lumia: { file: 'cell_phone_3ogd', rot: [0, 90, 0], size: 2.4 },
    tablet: { file: 'tablet_2lxo', rot: [0, 0, 0], size: 3.2 },
    ds: { file: 'portable_game_device_cgbo', rot: [0, 0, 0], size: 2.6 },
    dslite: { file: 'handheld_videogame_console_5kxd', rot: [0, 90, 0], size: 2.7 },
    watch: { file: 'watch_5mfj', rot: [-90, 0, 0], size: 3.4 },
    pixel: { file: 'phone_1l9o', rot: [90, 0, 0], size: 2.5 },
    tab2: { file: 'tablet_dtjv', rot: [0, -32, 0], size: 3.1 },
    switch: { file: 'nintendo_switch_600p', rot: [-90, 0, 0], size: 3.1 },
    mac: { file: 'laptop_macbook_pro_27hc', rot: [0, 0, 0], size: 3.0 },
    notebook: { file: 'laptop_gnbw', rot: [0, 180, 0], size: 2.9 },
    xpad: { file: 'videogame_controller_6365', rot: [0, 0, 0], size: 2.6 },
    cubepad: { file: 'game_cube_controller_3e4n', rot: [-90, 0, 0], size: 2.5 },
    dslr: { file: 'camera_f5xo', rot: [0, 0, 0], size: 2.4 },
    instax: { file: 'instant_camera_aybr', rot: [0, 180, 0], size: 2.3 },
    rotary: { file: 'phone_esax', rot: [0, 0, 0], size: 2.4 },
    rotarypink: { file: 'low_poly_phone_5azr', rot: [0, 0, 0], size: 2.4 },
    walkie: { file: 'stylized_walkie_talkie_fcpe', rot: [-90, 0, 0], size: 2.5 },
    boombox: { file: 'boom_box_cbtv', rot: [0, 0, 0], size: 3.0 },
    jbl: { file: 'speaker_zoqo', rot: [0, 0, 0], size: 2.2, fit: 'max' },
    ipod: { file: 'mp3_player_1xls', rot: [0, 0, 0], size: 2.2 },
    shuffle: { file: 'mp3_player_42xo', rot: [0, 0, 0], size: 2.0 },
    calc: { file: 'calculator_oaaw', rot: [0, 0, 0], size: 2.4 },
    nes: { file: 'nes_beuj', rot: [0, 0, 0], size: 2.8 },
    gameboy: { file: 'game_boy_954c', rot: [90, 0, 0], size: 2.4 },
    tamago: { file: 'virtual_pet_60lq', rot: [0, 0, 0], size: 2.0, fit: 'max' },
    digiwatch: { file: 'wrist_watch_6908', rot: [-90, 0, 0], size: 3.4 },
    drone: { file: 'drone_dnbu', rot: [0, 0, 0], size: 2.8 },
    minidrone: { file: 'little_drone_dj9m', rot: [0, 0, 0], size: 2.4 },
    vr: { file: 'vr_headset_racb', rot: [0, 0, 0], size: 2.6 },
    // --- ferramentas / bancada ---
    screwdriver: { file: 'screwdriver_a4vs', rot: [0, 0, 0], size: 1.1 },
    screwdriver2: { file: 'screwdriver_qbfm', rot: [0, 0, 0], size: 1.1 },
    heatgun: { file: 'hair_dryer_b5nw', rot: [0, 0, 0], size: 1.1 },
    pick: { file: 'scalpel_9ykg', rot: [0, 0, 0], size: 1.0 },
    tweezers: { file: 'tweezers_c9o6', rot: [0, 0, 0], size: 1.0 },
    magnifier: { file: 'magnifying_glass_bcdk', rot: [0, 0, 0], size: 1.1 },
    multimeter: { file: 'multimeter_ymu4', rot: [0, 0, 0], size: 1.1, fit: 'y' },
    solderstation: { file: 'soldering_iron_elue', rot: [0, 0, 0], size: 1.3 },
    pliers: { file: 'pliers_14fv', rot: [0, 0, 0], size: 1.0, fit: 'max' },
    toolbox: { file: 'toolbox_bnqh', rot: [0, 0, 0], size: 1.6 },
    desklamp: { file: 'desk_lamp_0_fd', rot: [0, 0, 0], size: 2.4, fit: 'y' },
    board: { file: 'circuit_board_1_fxkd', rot: [0, 0, 0], size: 1 },
    boardparts: { file: 'circuit_parts_fl02', rot: [0, 0, 0], size: 1.4 },
    battery_aa: { file: 'battery_9gnj', rot: [0, 0, 0], size: 0.5, fit: 'y' },
    charger: { file: 'phone_charger_lkhj', rot: [0, 0, 0], size: 0.6 },
    cable: { file: 'phone_charging_cable_cdov', rot: [0, 0, 0], size: 2.0 },
    headphones: { file: 'headphones_ewlp', rot: [0, 0, 0], size: 0.7 },
    // --- loja ---
    counter: { file: 'counter_straight_zpur', rot: [0, 0, 0], size: 4 },
    register: { file: 'cash_register_crxb', rot: [0, 0, 0], size: 0.7 },
    deskbell: { file: 'desk_bell_1bxi', rot: [0, 0, 0], size: 0.22 },
    pos: { file: 'pos_machine_ju1c', rot: [0, 0, 0], size: 0.5 },
    shelves: { file: 'shelves_od78', rot: [0, 0, 0], size: 2.6, fit: 'y' },
    plant: { file: 'houseplant_bflo', rot: [0, 0, 0], size: 1.0 },
    // --- cassino ---
    casino_icon: { file: 'casino_ch4r', rot: [0, 0, 0], size: 2.2 },
    chips: { file: 'poker_chips_2rwn', rot: [0, 0, 0], size: 0.9 },
    chip: { file: 'poker_chip_aser', rot: [0, 0, 0], size: 0.4 },
    dice: { file: 'dice_dls2', rot: [0, 0, 0], size: 0.35 },
    coinpile: { file: 'coin_piles_9owk', rot: [0, 0, 0], size: 0.9 },
    coin: { file: 'coin_7irl', rot: [0, 0, 0], size: 0.3, fit: 'max' },
    cash: { file: 'cash_stack_alp0', rot: [0, 0, 0], size: 0.9 },
    stool: { file: 'bar_stool_2do9', rot: [0, 0, 0], size: 1.1, fit: 'y' },
    cherry: { file: 'cherry_8bsj', rot: [0, 0, 0], size: 0.5, fit: 'max' },
    bellsym: { file: 'bell_efbz', rot: [0, 0, 0], size: 0.5, fit: 'max' },
    diamond: { file: 'diamond_5svq', rot: [0, 0, 0], size: 0.5, fit: 'max' },
    spade: { file: 'spade_6nst', rot: [0, 0, 0], size: 0.5, fit: 'max' },
    trophy: { file: 'trophy_6xu7', rot: [0, 0, 0], size: 0.5, fit: 'max' },
    lever: { file: 'lever_gur2', rot: [0, 0, 0], size: 0.7, fit: 'max' },
    arcade: { file: 'arcade_machine_gldk', rot: [0, 0, 0], size: 2.6, fit: 'y' },
    signs: { file: 'cyberpunk_signs_rszj', rot: [0, 0, 0], size: 4 },
    spotlight: { file: 'spotlight_yoho', rot: [0, 0, 0], size: 0.7, fit: 'max' },
    lootbox: { file: 'lootbox_lnqw', rot: [0, 0, 0], size: 1.2 },
    vending: { file: 'vending_machine_0cx6', rot: [0, 0, 0], size: 2.9, fit: 'y' },
    speaker: { file: 'speaker_5aco', rot: [0, 0, 0], size: 2.0, fit: 'y' },
    gambleicon: { file: 'gambling_icon_3ef3', rot: [0, 0, 0], size: 1.4, fit: 'y' },
    // --- decoração (catálogo) ---
    d_sofa: { file: 'deco_sofa', rot: [0, 0, 0], size: 2.0 },
    d_sofa2: { file: 'deco_sofa2', rot: [0, 0, 0], size: 2.2 },
    d_piano: { file: 'deco_piano', rot: [0, 0, 0], size: 1.9 },
    d_zoltar: { file: 'deco_zoltar', rot: [0, 0, 0], size: 2.0, fit: 'y' },
    d_bookcase: { file: 'deco_bookcase', rot: [0, 0, 0], size: 2.2, fit: 'y' },
    d_fishtank: { file: 'deco_fishtank', rot: [0, 0, 0], size: 1.3, fit: 'y' },
    d_beanbag: { file: 'deco_beanbag', rot: [0, 0, 0], size: 1.0 },
    d_plantbig: { file: 'deco_plantbig', rot: [0, 0, 0], size: 1.1, fit: 'y' },
    d_plantwhite: { file: 'deco_plantwhite', rot: [0, 0, 0], size: 1.5, fit: 'y' },
    d_houseplant: { file: 'deco_houseplant2', rot: [0, 0, 0], size: 1.0, fit: 'y' },
    d_floorlamp: { file: 'deco_floorlamp', rot: [0, 0, 0], size: 1.7, fit: 'y' },
    d_guitar: { file: 'deco_guitar', rot: [-78, 0, 0], size: 1.25, fit: 'y' },
    d_extinguisher: { file: 'deco_extinguisher', rot: [0, 0, 0], size: 0.7, fit: 'y' },
    d_tv: { file: 'deco_tv3', rot: [0, 90, 0], size: 1.25, fit: 'max' },
    d_rug: { file: 'deco_rug', rot: [0, 0, 0], size: 2.2 },
    d_rug2: { file: 'deco_rug2', rot: [0, 0, 0], size: 2.6 },
    d_clock: { file: 'deco_clock', rot: [0, -90, 0], size: 0.75, fit: 'max' },
    d_camera: { file: 'deco_camera', rot: [0, 0, 0], size: 0.6, fit: 'max' },
    d_ceilfan: { file: 'deco_ceilfan', rot: [0, 0, 0], size: 1.4 },
    d_lava: { file: 'deco_lavalamp', rot: [0, 0, 0], size: 0.6, fit: 'y' },
    d_bonsai: { file: 'deco_bonsai', rot: [0, 0, 0], size: 0.6, fit: 'y' },
    d_cactus: { file: 'deco_cactus', rot: [0, 0, 0], size: 0.5, fit: 'y' },
    d_fishbowl: { file: 'deco_fishbowl', rot: [0, 0, 0], size: 0.45, fit: 'y' },
    d_parrot: { file: 'deco_parrot', rot: [0, 0, 0], size: 0.55, fit: 'y' },
    d_catloaf: { file: 'deco_catloaf', rot: [0, 0, 0], size: 0.55 },
    d_record: { file: 'deco_record', rot: [0, 0, 0], size: 0.65 },
    d_coffee: { file: 'deco_coffee', rot: [0, 0, 0], size: 0.5, fit: 'y' },
    d_cat: { file: 'deco_cat', rot: [0, 0, 0], size: 0.72, fit: 'y', anim: true },
    d_cat2: { file: 'deco_cat2', rot: [0, 0, 0], size: 0.75, fit: 'y', anim: true },
    d_dog: { file: 'deco_dog', rot: [0, 0, 0], size: 0.85, fit: 'y', anim: true },
    // --- eventos ---
    e_wallet: { file: 'ev_wallet', rot: [0, 0, 0], size: 0.35 },
    e_rat: { file: 'ev_rat', rot: [0, 0, 0], size: 0.4, anim: true },
    e_pigeon: { file: 'ev_pigeon', rot: [0, 0, 0], size: 0.45, fit: 'max', anim: true },
    e_box: { file: 'ev_box', rot: [0, 0, 0], size: 0.6 },
    e_mop: { file: 'ev_mop', rot: [0, 0, 0], size: 1.0, fit: 'y' },
    e_coinbag: { file: 'ev_coinbag', rot: [0, 0, 0], size: 0.5 },
    e_piggy: { file: 'ev_piggy', rot: [0, 0, 0], size: 0.6 },
    e_magazine: { file: 'ev_magazine', rot: [0, 0, 0], size: 0.6 },
    e_briefcase: { file: 'ev_briefcase', rot: [0, 0, 0], size: 0.6 },
    e_fire: { file: 'ev_fire', rot: [0, 0, 0], size: 0.9, fit: 'y' },
    e_umbrella: { file: 'ev_umbrella', rot: [0, 0, 0], size: 0.9, fit: 'max' },
    e_candles: { file: 'ev_candles', rot: [0, 0, 0], size: 0.4 },
  };

  const cache = {};
  const loader = new THREE.GLTFLoader();

  function b64ToBuf(b64) {
    const bin = atob(b64); const len = bin.length; const u = new Uint8Array(len);
    for (let i = 0; i < len; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }

  function loadFile(file) {
    if (cache[file]) return cache[file];
    cache[file] = new Promise((res) => {
      const done = g => res(g);
      const fail = e => { console.warn('Falha ao carregar', file, e); res(null); };
      if (window.MODEL_DATA && window.MODEL_DATA[file]) {
        loader.parse(b64ToBuf(window.MODEL_DATA[file]), '', done, fail);
      } else {
        loader.load('models/' + file + '.glb', done, undefined, fail);
      }
    });
    return cache[file];
  }

  async function preloadAll(onProgress) {
    const files = [...new Set(Object.values(MODELS).map(m => m.file))];
    let n = 0;
    await Promise.all(files.map(f => loadFile(f).then(() => { n++; onProgress && onProgress(n / files.length, f); })));
  }

  const loaded = {};
  // Retorna uma cópia normalizada (centralizada em x/z, base em y=0)
  function get(key, opts = {}) {
    const m = MODELS[key];
    const wrap = new THREE.Group();
    wrap.name = key;
    const g = loaded[m.file];
    let inner;
    if (!g) {
      inner = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshStandardMaterial({ color: 0xff66aa }));
    } else {
      inner = m.anim ? cloneSkinned(g.scene) : g.scene.clone(true);
      inner.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          if (o.isSkinnedMesh) o.frustumCulled = false;
          if (opts.cloneMat !== false) {
            o.material = Array.isArray(o.material) ? o.material.map(x => x.clone()) : o.material.clone();
          }
        }
      });
    }
    const rot = opts.rot || m.rot;
    const pivot = new THREE.Group();
    pivot.rotation.set(rot[0] * D, rot[1] * D, rot[2] * D);
    pivot.add(inner);
    const holder = new THREE.Group(); holder.add(pivot);
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder);
    const sz = box.getSize(new THREE.Vector3());
    const size = opts.size || m.size;
    let ref = Math.max(sz.x, sz.z);
    if ((opts.fit || m.fit) === 'y') ref = sz.y;
    if ((opts.fit || m.fit) === 'max') ref = Math.max(sz.x, sz.y, sz.z);
    const s = size / (ref || 1);
    holder.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3());
    holder.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    wrap.add(holder);
    wrap.userData.size = new THREE.Vector3(sz.x * s, sz.y * s, sz.z * s);
    wrap.userData.inner = inner;
    return wrap;
  }

  // clone com esqueleto (mesmo algoritmo do SkeletonUtils.clone do three.js)
  function cloneSkinned(source) {
    const srcOf = new Map(), cloneOf = new Map();
    const clone = source.clone(true);
    (function par(a, b) { srcOf.set(b, a); cloneOf.set(a, b); for (let i = 0; i < a.children.length; i++) par(a.children[i], b.children[i]); })(source, clone);
    clone.traverse(node => {
      if (!node.isSkinnedMesh) return;
      const src = srcOf.get(node);
      node.skeleton = src.skeleton.clone();
      node.bindMatrix.copy(src.bindMatrix);
      node.skeleton.bones = src.skeleton.bones.map(b => cloneOf.get(b));
      node.bind(node.skeleton, node.bindMatrix);
    });
    return clone;
  }

  function sizeOf(obj) {
    obj.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  }

  // Aplica/retira brilho de destaque em todos os materiais de um objeto
  function setGlow(obj, color, intensity) {
    obj.traverse(o => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mt of mats) {
          if (!mt.emissive) continue;
          if (mt.userData.baseEm === undefined) { mt.userData.baseEm = mt.emissive.getHex(); mt.userData.baseEi = mt.emissiveIntensity; }
          if (intensity > 0) { mt.emissive.setHex(color); mt.emissiveIntensity = intensity; }
          else { mt.emissive.setHex(mt.userData.baseEm); mt.emissiveIntensity = mt.userData.baseEi; }
        }
      }
    });
  }

  function tint(obj, color, mix = 1) {
    const c = new THREE.Color(color);
    obj.traverse(o => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mt of mats) { if (mt.color) mt.color.lerp(c, mix); if (mt.map && mix >= 1) mt.map = null; mt.needsUpdate = true; }
      }
    });
  }

  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    t.userData.canvas = cv;
    return t;
  }

  // Miniaturas (para a barra de ferramentas e cartas de melhorias)
  let thumbR = null;
  const thumbCache = {};
  function thumb(key, { w = 160, h = 130, dir = [1, 1.1, 1.4], bg = null, obj = null } = {}) {
    const ck = key + w + h + dir.join();
    if (!obj && thumbCache[ck]) return thumbCache[ck];
    if (!thumbR) {
      thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.outputEncoding = THREE.sRGBEncoding;
    }
    thumbR.setSize(w, h);
    const sc = new THREE.Scene();
    if (bg) sc.background = new THREE.Color(bg);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x886677, 1.1));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 4, 3); sc.add(dl);
    const o = obj || get(key);
    sc.add(o);
    const box = new THREE.Box3().setFromObject(o);
    const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3());
    const r = Math.max(sz.x, sz.y, sz.z);
    const cam = new THREE.PerspectiveCamera(30, w / h, r / 50, r * 50);
    cam.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(r * 2.3));
    cam.lookAt(c);
    thumbR.render(sc, cam);
    const url = thumbR.domElement.toDataURL();
    if (!obj) thumbCache[ck] = url;
    return url;
  }

  // Imagem de sprite SVG -> textura (para personagens dentro da cena 3D)
  function svgTexture(svg, w = 600, h = 900) {
    return new Promise(res => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
        res(t);
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }

  // Modelo animado (bichinhos): cópia com esqueleto próprio + as animações do arquivo
  function getAnimated(key, opts = {}) {
    const obj = get(key, opts); const g = loaded[MODELS[key].file];
    return { obj, clips: (g && g.animations) || [], root: obj.userData.inner };
  }

  window.ASSETS = {
    MODELS, get, getAnimated, sizeOf, setGlow, tint, canvasTex, thumb, svgTexture,
    async preload(onProgress) {
      await preloadAll(onProgress);
      for (const f of Object.keys(cache)) loaded[f] = await cache[f];
    },
  };
})();
