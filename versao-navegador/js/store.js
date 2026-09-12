// Mercadinho da esquina — cena 3D com a Tati no caixa (a lojinha de itens)
(function () {
  const V3 = THREE.Vector3;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .7, metalness: .05 }, o));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2a3a);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.05, 60);
  const CAM = new V3(0, 1.7, 4.0), LOOK = new V3(0, 1.45, -2);
  camera.position.copy(CAM); camera.lookAt(LOOK);
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x445566, 0.75));
  const key = new THREE.DirectionalLight(0xfff4e0, 0.6); key.position.set(2, 6, 4); scene.add(key);
  const tubes = [];
  for (const x of [-2.6, 0, 2.6]) {
    const l = new THREE.PointLight(0xeaffff, 0.55, 8, 2); l.position.set(x, 3.6, 0); scene.add(l); tubes.push(l);
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .18), new THREE.MeshBasicMaterial({ color: 0xf2ffff })); t.position.set(x, 4.1, 0); scene.add(t);
  }
  let built = false, sprite = null, neonM = null;
  const slot = new THREE.Group(); slot.position.set(0, 0.1, 0.2); scene.add(slot);
  const tex = (w, h, f) => ASSETS.canvasTex(w, h, f);

  function pack(color, stripe) {
    // maço de cigarro/produto em caixinha
    const t = tex(64, 96, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      g.fillStyle = stripe; g.fillRect(0, 22, w, 18);
      g.fillStyle = '#fff'; g.fillRect(4, 60, w - 8, 30);
      g.fillStyle = '#111'; g.font = 'bold 7px sans-serif'; g.fillText('FUMAR FAZ', 8, 72); g.fillText('MAL À SAÚDE', 6, 82);
    });
    return new THREE.Mesh(new THREE.BoxGeometry(.13, .19, .06), [M(color), M(color), M(color), M(color), M(0xffffff, { map: t }), M(color)]);
  }

  function build() {
    if (built) return; built = true;
    const floorT = tex(256, 256, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e9ecef' : '#ced4da'; g.fillRect(x * 32, y * 32, 32, 32); } });
    floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(5, 5);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), M(0xffffff, { map: floorT, roughness: .4 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const wallM = M(0xfff3c4);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallM); back.position.set(0, 2.25, -3.6); scene.add(back);
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.5), wallM); lw.rotation.y = Math.PI / 2; lw.position.set(-5.5, 2.25, 0); scene.add(lw);
    const rw = lw.clone(); rw.rotation.y = -Math.PI / 2; rw.position.x = 5.5; scene.add(rw);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), M(0xf8f9fa)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.2; scene.add(ceil);
    const faixa = new THREE.Mesh(new THREE.BoxGeometry(14, .5, .05), M(0xe63946)); faixa.position.set(0, .25, -3.57); scene.add(faixa);
    // letreiro neon
    neonM = new THREE.MeshBasicMaterial({ map: tex(1024, 200, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = 'bold 96px Fredoka, sans-serif'; g.shadowColor = '#29f3ff'; g.shadowBlur = 30; g.fillStyle = '#e8feff'; g.fillText('MERCADINHO 24H', w / 2, 130); g.fillText('MERCADINHO 24H', w / 2, 130); }), transparent: true, toneMapped: false });
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(4.4, .86), neonM); neon.position.set(0, 3.45, -3.55); scene.add(neon);
    // estante de cigarros atrás do caixa (maços procedurais) + aviso
    const rack = new THREE.Group(); rack.position.set(0, 1.6, -3.4); scene.add(rack);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, .12), M(0x3d2b1f)); rack.add(rb);
    const cols = [['#c1121f', '#fff'], ['#1d3557', '#ffd23f'], ['#f1faee', '#e63946'], ['#2a9d8f', '#fff'], ['#6a4c93', '#ffd23f']];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) { const [a, b] = cols[(r + c) % cols.length]; const p = pack(a, b); p.position.set(-1.14 + c * .207, -.45 + r * .3, .1); rack.add(p); }
    const aviso = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .28), new THREE.MeshBasicMaterial({ map: tex(512, 56, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('PROIBIDA A VENDA PARA MENORES DE 18 ANOS', w / 2, 36); }) }));
    aviso.position.set(0, -.8, .08); rack.add(aviso);
    // geladeira (modelo baixado da máquina de venda) e prateleiras com produtos (modelos baixados)
    const fr = ASSETS.get('vending', { size: 2.6 }); fr.position.set(-4.3, 0, -2.6); fr.rotation.y = .35; scene.add(fr);
    const frl = new THREE.PointLight(0x9ef0ff, .8, 4); frl.position.set(-3.8, 1.5, -1.8); scene.add(frl);
    const sh = ASSETS.get('shelves', { size: 2.4 }); sh.position.set(4.1, 0, -2.8); sh.rotation.y = -.35; scene.add(sh);
    const lv = sh.userData.size.y;
    [['chips', .58], ['dice', .58], ['cash', 1.12], ['coinpile', 1.12], ['charger', 1.66], ['battery_aa', 1.66]].forEach(([k, f], i) => {
      const o = ASSETS.get(k, { size: k === 'cash' || k === 'chips' || k === 'coinpile' ? .5 : .32 });
      o.position.set(4.1 + (i % 2 ? .35 : -.35), f * lv / 2.44 + .02, -2.8); scene.add(o);
    });
    const pl = ASSETS.get('plant', { size: .9 }); pl.position.set(-5, 0, 1); scene.add(pl);
    // balcão com caixa registradora e maquininha (modelos baixados)
    const ct = ASSETS.get('counter', { size: 4.8 }); ct.scale.y = 1.0 / ct.userData.size.y; ct.rotation.y = Math.PI; ct.position.set(0, 0, 2.0); scene.add(ct);
    const reg = ASSETS.get('register', { size: .7 }); reg.position.set(-1.6, 1.0, 1.9); reg.rotation.y = Math.PI - .4; scene.add(reg);
    const pos = ASSETS.get('pos', { size: .42 }); pos.position.set(1.7, 1.0, 1.95); pos.rotation.y = Math.PI + .3; scene.add(pos);
    const bell = ASSETS.get('deskbell'); bell.position.set(.9, 1.0, 1.8); scene.add(bell);
    const cand = ASSETS.get('cherry', { size: .22, fit: 'max' }); cand.position.set(-.8, 1.0, 1.85); scene.add(cand);
  }

  async function showClerk() {
    if (sprite) return sprite;
    sprite = await makeSprite(CHARS.CLERK, 2.7);
    slot.add(sprite.obj);
    return sprite;
  }

  const STORE = {
    scene, camera,
    init() { build(); },
    showClerk,
    onEnter() { build(); AUDIO.music('night'); },
    update(dt, t) {
      if (sprite) sprite.update(dt);
      camera.position.x = CAM.x + Math.sin(t * .3) * .04; camera.lookAt(LOOK);
      if (neonM) neonM.opacity = .88 + Math.sin(t * 7) * .05 + (Math.random() < .008 ? -.5 : 0);
      tubes.forEach((l, i) => l.intensity = .55 + (Math.random() < .004 ? -.4 : 0));
    },
  };
  window.STORE = STORE;
  ENGINE.register('store', STORE);
})();
