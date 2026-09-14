// Loja 3D — cenário das conversas com os clientes
(function () {
  const V3 = THREE.Vector3;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .7, metalness: .05 }, o));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffd6ea);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.05, 60);
  const CAM = new V3(0, 1.75, 4.2), LOOK = new V3(0, 1.55, -2);
  camera.position.copy(CAM); camera.lookAt(LOOK);

  const hemi = new THREE.HemisphereLight(0xfff5fa, 0x806070, 0.7); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0e0, 0.7); key.position.set(3, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 6, bottom: -3 }); scene.add(key);
  const lamps = [];
  for (const x of [-2.5, 0, 2.5]) {
    const l = new THREE.PointLight(0xffe2b8, 0.5, 9, 2); l.position.set(x, 3.7, -0.5); scene.add(l); lamps.push(l);
    const fx = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.18, 20), new THREE.MeshBasicMaterial({ color: 0xfff3d6 }));
    fx.position.set(x, 4.35, -0.5); scene.add(fx);
  }

  let built = false;
  const group = new THREE.Group(); scene.add(group);
  let skyMat, windowLight, neonMat, openSign;
  const slot = new THREE.Group(); slot.position.set(0, 0.12, 0.6); scene.add(slot);
  let sprite = null;

  function tex(w, h, f) { return ASSETS.canvasTex(w, h, f); }

  function build() {
    if (built) return; built = true;
    // piso de madeira
    const floorT = tex(512, 512, (g, w, h) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#c98f5f' : '#bd8454'; g.fillRect(0, i * 64, w, 64); g.strokeStyle = '#8a5a3c'; g.lineWidth = 3; g.strokeRect(((i * 97) % 256) - 256, i * 64, 512, 64); g.strokeRect(((i * 97) % 256), i * 64, 512, 64); }
      for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(90,50,20,.08)'; g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 2); }
    });
    floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(4, 4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), M(0xffffff, { map: floorT }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
    // paredes (papel de parede listrado rosa)
    const wallT = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#ffe3f1'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) { g.fillStyle = '#ffd0e7'; g.fillRect(x, 0, 16, h); }
      g.fillStyle = 'rgba(255,255,255,.6)'; for (let y = 16; y < h; y += 64) for (let x = 8; x < w; x += 32) { g.beginPath(); g.arc(x, y + ((x / 32) % 2) * 32, 3, 0, 7); g.fill(); }
    });
    wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(6, 2);
    const wallM = M(0xffffff, { map: wallT });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallM); back.position.set(0, 2.5, -4); back.receiveShadow = true; group.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), wallM); left.rotation.y = Math.PI / 2; left.position.set(-6, 2.5, 0); group.add(left);
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 6; group.add(right);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), M(0xfff6fb)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.5; group.add(ceil);
    // rodapé
    const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 0.06), M(0xe05aa0)); base.position.set(0, 0.15, -3.97); group.add(base);

    // porta com vidro (céu muda com a hora)
    skyMat = new THREE.MeshBasicMaterial({ color: 0x9ad7ff });
    const door = new THREE.Group();
    const frameM = M(0xffffff);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.6), skyMat); glass.position.set(0, 1.4, 0.01); door.add(glass);
    for (const [x, y, w, h] of [[0, 2.75, 1.8, .15], [0, 0.05, 1.8, .1], [-.83, 1.4, .15, 2.8], [.83, 1.4, .15, 2.8], [0, 1.4, .08, 2.6]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .12), frameM); b.position.set(x, y, 0.02); door.add(b); }
    openSign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: tex(256, 96, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e05aa0'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#e05aa0'; g.font = 'bold 54px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('ABERTO', w / 2, 68); }) }));
    openSign.position.set(0.35, 1.9, 0.09); door.add(openSign);
    door.position.set(0, 0, -3.95); group.add(door);
    // janela lateral
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), skyMat); win.rotation.y = Math.PI / 2; win.position.set(-5.97, 2.2, -0.8); group.add(win);
    for (const [y, h, z, d] of [[3.05, .12, -.8, 2.8], [1.35, .12, -.8, 2.8], [2.2, 1.7, -2.15, .12], [2.2, 1.7, .55, .12], [2.2, 1.6, -.8, .07]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.1, h, d), frameM); b.position.set(-5.94, y, z); group.add(b); }
    windowLight = new THREE.PointLight(0xbfe6ff, 0.6, 8); windowLight.position.set(-5, 2.2, -0.8); scene.add(windowLight);

    // letreiro neon
    neonMat = new THREE.MeshBasicMaterial({ map: tex(1024, 200, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = 'bold 84px Fredoka, sans-serif'; g.textAlign = 'center'; g.shadowColor = '#ff2bd6'; g.shadowBlur = 30; g.fillStyle = '#ffe3fb'; g.fillText('REPAIR SIMULATOR ♥', w / 2, 140); g.fillText('REPAIR SIMULATOR ♥', w / 2, 140); }), transparent: true, toneMapped: false });
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), neonMat); neon.position.set(0, 3.55, -3.93); group.add(neon);

    // pôsteres
    const poster = (t1, t2, c1, c2) => tex(256, 360, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; g.font = 'bold 40px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(t1, w / 2, 80);
      g.font = 'bold 26px Nunito, sans-serif'; t2.split('|').forEach((l, i) => g.fillText(l, w / 2, 250 + i * 34));
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(w / 2 - 45, 110, 90, 110); g.fillStyle = c2; g.fillRect(w / 2 - 38, 118, 76, 90);
    });
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.55), M(0xffffff, { map: poster('TELA', 'Troca em 1h!|Garantia 90d', '#ff8fc8', '#7b2ff7') })); p1.position.set(-2.1, 2.3, -3.94); group.add(p1);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.55), M(0xffffff, { map: poster('BATERIA', 'Original|Dura o dia todo', '#52d68a', '#1a936f') })); p2.position.set(2.1, 2.3, -3.94); group.add(p2);
    const p3 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.55), M(0xffffff, { map: poster('CASSINO', 'Hoje à noite|Sorte grande!', '#ff2bd6', '#1b1b2f') })); p3.rotation.y = -Math.PI / 2; p3.position.set(5.95, 2.3, -1.5); group.add(p3);

    // estantes com aparelhos à venda (modelos baixados)
    for (const sx of [-4.2, 4.2]) {
      const sh = ASSETS.get('shelves'); sh.name = 'shelves'; sh.position.set(sx, 0, -3.45); group.add(sh);
      const ssz = sh.userData.size;
      const levels = [0.62, 1.22, 1.82].map(f => f * ssz.y / 2.44);
      const items = sx < 0 ? ['tablet', 'xpad', 'gameboy', 'phone_iphone', 'boombox', 'notch'] : ['galaxy', 'instax', 'ds', 'redphone', 'jbl', 'calc'];
      items.forEach((k, i) => {
        const o = ASSETS.get(k, { size: k === 'tablet' ? 0.7 : k === 'watch' ? 0.6 : 0.5 });
        const lv = levels[i % 3];
        o.position.set(sx + (i < 3 ? -0.35 : 0.35), lv + 0.02, -3.45);
        if (['phone_iphone', 'notch', 'galaxy', 'redphone', 'lumia', 'tablet', 'calc', 'gameboy'].includes(k)) { o.rotation.x = -1.2; o.position.y += 0.2; o.position.z += 0.1; }
        group.add(o);
      });
    }
    // planta e caixas de peças
    const pl = ASSETS.get('plant', { size: 1.1 }); pl.position.set(-5.2, 0, -2.9); group.add(pl);
    const pl2 = ASSETS.get('plant', { size: 0.9 }); pl2.position.set(5.2, 0, -2.9); group.add(pl2);
    const tb = ASSETS.get('toolbox', { size: 1.1 }); tb.position.set(4.9, 0, 0.6); tb.rotation.y = -0.8; group.add(tb);

    // balcão (modelo baixado, achatado para altura de balcão)
    const ct = ASSETS.get('counter', { size: 5.6 });
    const csz = ct.userData.size;
    ct.scale.y = 1.05 / csz.y; ct.rotation.y = Math.PI;
    ct.position.set(0, 0, 2.35); group.add(ct);
    const topY = 1.05;
    const reg = ASSETS.get('register', { size: 0.75 }); reg.position.set(1.8, topY, 2.25); reg.rotation.y = Math.PI + 0.3; group.add(reg);
    const pos = ASSETS.get('pos', { size: 0.45 }); pos.position.set(-1.9, topY, 2.25); pos.rotation.y = Math.PI - 0.4; group.add(pos);
    const bell = ASSETS.get('deskbell'); bell.position.set(-0.8, topY, 2.1); group.add(bell);
    const ph = ASSETS.get('moto', { size: 0.5 }); ph.position.set(0.7, topY, 2.2); ph.rotation.y = 0.5; group.add(ph);
    group.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o.castShadow || false; } });
    SHOP.shelfTop = ASSETS.sizeOf(group.children.find(c => c.name === 'shelves') || new THREE.Group()).y || 2.6;
    if (window.DECOR) DECOR.apply();
  }

  // Clientes extras em cena (briga entre dois clientes)
  const extras = [];
  async function showExtra(def, x, fromDir = -1) {
    const sp = await makeSprite(def, 2.8);
    const holder = new THREE.Group(); holder.position.set(x, 0.12, 0.6); holder.add(sp.obj); scene.add(holder);
    sp.holder = holder; extras.push(sp);
    sp.obj.position.x = 3.5 * fromDir; sp.mesh.material.opacity = 0;
    AUDIO.sfx('steps', { vol: .6 });
    await TWEENS.add(0.6, e => { sp.obj.position.x = 3.5 * fromDir * (1 - e); sp.mesh.material.opacity = e; }, 'out');
    return sp;
  }
  async function leaveExtra(sp, dir = 1) {
    if (!sp || !extras.includes(sp)) return;
    await TWEENS.add(0.5, e => { sp.obj.position.x = 3.5 * dir * e; sp.mesh.material.opacity = 1 - e; }, 'in');
    scene.remove(sp.holder); sp.dispose(); extras.splice(extras.indexOf(sp), 1);
  }
  function clearExtras() { for (const sp of extras.splice(0)) { scene.remove(sp.holder); sp.dispose(); } }
  const hooks = [];

  // cores de céu por hora do dia
  function setTime(h) {
    if (!skyMat) return;
    const c = h < 12 ? 0x9ad7ff : h < 16 ? 0xbde0fe : h < 18 ? 0xffb38a : h < 19.5 ? 0xff7eb6 : 0x1b1f4a;
    skyMat.color.setHex(c);
    windowLight.color.setHex(h < 18 ? 0xbfe6ff : h < 19.5 ? 0xffa8c8 : 0x6c7cff);
    const night = h >= 19.5;
    hemi.intensity = night ? 0.45 : 0.7;
    lamps.forEach(l => l.intensity = night ? 0.8 : 0.5);
    if (openSign) openSign.visible = !night;
  }

  async function showCustomer(def) {
    hideCustomer();
    const sp = await makeSprite(def, 2.85);
    sprite = sp; slot.add(sp.obj);
    VN.speaker = sp;
    // entra deslizando
    sp.obj.position.x = -3.5; sp.mesh.material.opacity = 0;
    AUDIO.sfx('bell'); setTimeout(() => AUDIO.sfx('steps', { vol: .6 }), 250);
    await TWEENS.add(0.7, e => { sp.obj.position.x = -3.5 * (1 - e); sp.mesh.material.opacity = e; }, 'out');
    return sp;
  }
  async function leaveCustomer(dir = 1) {
    if (!sprite) return;
    const sp = sprite;
    AUDIO.sfx('steps', { vol: .5 });
    await TWEENS.add(0.6, e => { sp.obj.position.x = 3.5 * dir * e; sp.mesh.material.opacity = 1 - e; }, 'in');
    hideCustomer();
  }
  function hideCustomer() {
    if (sprite) { slot.remove(sprite.obj); sprite.dispose(); sprite = null; }
    VN.speaker = null;
  }

  const SHOP = {
    scene, camera, group, hooks, shelfTop: 2.6,
    get sprite() { return sprite; },
    init() { build(); },
    setTime, showCustomer, leaveCustomer, hideCustomer, showExtra, leaveExtra, clearExtras,
    onEnter() { build(); },
    update(dt, t) {
      if (sprite) sprite.update(dt);
      for (const sp of extras) sp.update(dt);
      for (const f of hooks) f(dt, t);
      camera.position.x = CAM.x + Math.sin(t * .3) * .05; camera.position.y = CAM.y + Math.sin(t * .5) * .02;
      camera.lookAt(LOOK);
      if (neonMat) neonMat.opacity = 0.85 + Math.sin(t * 9) * 0.05 + (Math.random() < .01 ? -.4 : 0);
    },
  };
  window.SHOP = SHOP;
  ENGINE.register('shop', SHOP);
})();
