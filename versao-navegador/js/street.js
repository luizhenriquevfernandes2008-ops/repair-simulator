// RUA DO BAIRRO — cena 3D das cutscenes: a assistência da Tia Neide de um lado da rua,
// a ConsertaJá do rival do outro. Prédios, postes, carros e árvores são modelos baixados.
(function () {
  const V3 = THREE.Vector3;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: .02 }, o));
  const scene = new THREE.Scene();
  const sky = new THREE.Color(0x9ad7ff); scene.background = sky;
  scene.fog = new THREE.Fog(0x9ad7ff, 30, 70);
  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 120);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x77665a, .8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dd, .9); sun.position.set(-12, 20, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 25, bottom: -25, far: 80 }); scene.add(sun);
  const tex = (w, h, f) => ASSETS.canvasTex(w, h, f);

  const OURS = new V3(-7, 0, -9.5), RIVAL = new V3(-7, 0, 9.5);
  let built = false, oursSign, rivalSign, rivalClosed, lampLights = [], signMats = [], cars = [], sprites = [], crowd = [];
  let cam = { pos: new V3(-7, 2.6, 5), look: new V3(-7, 2.6, -9) }, camTween = null, sway = true;

  function signTex(text, color, glow, bg) {
    return tex(1024, 180, (g, w, h) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = color; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12); } else g.clearRect(0, 0, w, h);
      g.textAlign = 'center'; g.font = 'bold 92px Fredoka, sans-serif';
      if (glow) { g.shadowColor = glow; g.shadowBlur = 28; }
      g.fillStyle = color; g.fillText(text, w / 2, 124); if (glow) g.fillText(text, w / 2, 124);
    });
  }
  function signMesh(text, color, glow, bg, w = 5.6) {
    const m = new THREE.MeshBasicMaterial({ map: signTex(text, color, glow, bg), transparent: !bg, toneMapped: false });
    signMats.push(m);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 180 / 1024), m);
  }

  function build() {
    if (built) return; built = true;
    // chão: calçadas atrás dos prédios + asfalto (peças de rua baixadas)
    const walk = M(0xb8b2a7); const pave = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), walk); pave.rotation.x = -Math.PI / 2; pave.position.y = -.02; pave.receiveShadow = true; scene.add(pave);
    for (let i = -4; i <= 4; i++) { const t = ASSETS.get(i === 2 ? 'st_cross' : 'st_street'); t.position.set(-7 + i * 12, 0, 0); scene.add(t); }
    // lado norte: nossa loja
    const add = (k, x, z, ry = 0, o) => { const b = ASSETS.get(k, o); b.position.set(x, 0, z); b.rotation.y = ry; scene.add(b); return b; };
    add('st_large', -17.5, -10.5); add('st_ours', OURS.x, OURS.z); add('st_small', 2, -10.2); add('st_large', 11.5, -10.5); add('st_small', 21, -10.2);
    // lado sul (vira para a rua): a ConsertaJá bem em frente
    add('st_small', -17, 10.2, Math.PI); add('st_rival', RIVAL.x, RIVAL.z, Math.PI); add('st_large', 2.5, 10.5, Math.PI); add('st_small', 12, 10.2, Math.PI); add('st_large', 21.5, 10.5, Math.PI);
    // letreiros
    oursSign = signMesh('ASSISTÊNCIA DA NEIDE', '#e05aa0', null, '#fff4fa', 4.2); oursSign.position.set(OURS.x, 3.6, -6.85); scene.add(oursSign);
    rivalSign = signMesh('ConsertaJá EXPRESS', '#c9fbff', '#29f3ff', null, 5.2); rivalSign.position.set(RIVAL.x, 3.7, 6.85); rivalSign.rotation.y = Math.PI; scene.add(rivalSign);
    rivalClosed = signMesh('ALUGA-SE', '#c1121f', null, '#fffbe6', 3); rivalClosed.position.set(RIVAL.x, 2.0, 6.9); rivalClosed.rotation.y = Math.PI; scene.add(rivalClosed);
    // postes, árvores, banco, ponto de ônibus, carros estacionados
    for (const x of [-22, -12, -2, 8, 18]) {
      add('st_light', x, -5.4, Math.PI / 2); add('st_light', x + 1, 5.4, -Math.PI / 2);
      const l = new THREE.PointLight(0xffd89b, 0, 12, 2); l.position.set(x + .8, 5.2, -5); scene.add(l); lampLights.push(l);
      const l2 = new THREE.PointLight(0xffd89b, 0, 12, 2); l2.position.set(x + .2, 5.2, 5); scene.add(l2); lampLights.push(l2);
    }
    for (const [x, z] of [[-13.5, -5.2], [1, -5.3], [15, 5.3], [-2.5, 5.3], [24, -5.2]]) add('st_tree', x, z);
    add('st_bench', -3.3, -5.1); add('st_busstop', 6.5, 5.3, Math.PI);
    add('st_car', -14, -2.2, Math.PI / 2); add('st_car2', 4, 2.3, -Math.PI / 2);
    const moving = ASSETS.get('st_car2'); moving.rotation.y = Math.PI / 2; moving.position.set(-60, 0, -1.4); scene.add(moving); cars.push({ o: moving, v: 9, z: -1.4 });
    const moving2 = ASSETS.get('st_car'); moving2.rotation.y = -Math.PI / 2; moving2.position.set(60, 0, 1.4); scene.add(moving2); cars.push({ o: moving2, v: -7, z: 1.4 });
    scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    setTime(9); setRival(false);
  }

  function setTime(h) {
    const night = h >= 19 || h < 6, dusk = h >= 17 && h < 19;
    const c = night ? 0x141a3a : dusk ? 0xff9e7a : 0x9ad7ff;
    scene.background.setHex(c); scene.fog.color.setHex(c);
    hemi.intensity = night ? .35 : dusk ? .6 : .85; sun.intensity = night ? .08 : dusk ? .55 : .95;
    sun.color.setHex(dusk ? 0xffb07a : 0xfff1dd);
    lampLights.forEach(l => l.intensity = night ? 1.3 : dusk ? .5 : 0);
  }
  function setRival(open) { if (!built) build(); rivalSign.visible = open; rivalClosed.visible = !open; }
  function setOurSign(text) { if (!built) build(); oursSign.material.map = signTex(text, '#ffe3fb', '#ff2bd6', null); oursSign.material.transparent = true; oursSign.material.needsUpdate = true; }

  // câmera: tomadas prontas
  const SHOTS = {
    ours: [new V3(-7, 2.4, 4.5), new V3(-7, 2.5, -9)],
    oursClose: [new V3(-7, 2.1, 1.2), new V3(-7, 2.1, -9)],
    rival: [new V3(-7, 2.4, -4.5), new V3(-7, 2.8, 9)],
    rivalClose: [new V3(-7, 2.1, -1.2), new V3(-7, 2.2, 9)],
    wide: [new V3(-30, 8, 0), new V3(-6, 2, 0)],
    wide2: [new V3(14, 6, 1), new V3(-8, 2.5, -2)],
    street: [new V3(-7, 1.9, 0), new V3(-7, 2.1, -9)],
  };
  function shot(name, dur = 0) {
    const [p, l] = SHOTS[name] || SHOTS.ours;
    if (!dur) { cam.pos.copy(p); cam.look.copy(l); camTween = null; return Promise.resolve(); }
    const p0 = cam.pos.clone(), l0 = cam.look.clone();
    return TWEENS.add(dur, e => { cam.pos.lerpVectors(p0, p, e); cam.look.lerpVectors(l0, l, e); }, 'inOut');
  }

  // personagens na calçada (lado 'ours' = norte, 'rival' = sul)
  async function show(def, x, side = 'ours', from = null, h = 2.8) {
    const sp = await makeSprite(def, def.height || h);
    const holder = new THREE.Group();
    const z = side === 'ours' ? -4.3 : 4.3;
    holder.position.set(x, .18, z); if (side === 'rival') holder.rotation.y = Math.PI;
    holder.add(sp.obj); scene.add(holder); sp.holder = holder; sprites.push(sp);
    if (from !== null) { sp.obj.position.x = from; sp.mesh.material.opacity = 0; await TWEENS.add(.7, e => { sp.obj.position.x = from * (1 - e); sp.mesh.material.opacity = e; }, 'out'); }
    return sp;
  }
  async function hide(sp, dir = 0) {
    if (!sp || !sprites.includes(sp)) return;
    if (dir) await TWEENS.add(.5, e => { sp.obj.position.x = dir * 4 * e; sp.mesh.material.opacity = 1 - e; }, 'in');
    scene.remove(sp.holder); sp.dispose(); sprites.splice(sprites.indexOf(sp), 1);
  }
  function clear() { for (const sp of sprites.splice(0)) { scene.remove(sp.holder); sp.dispose(); } }

  // fogos de artifício (finais felizes)
  const fx = [];
  function fireworks(n = 6) {
    for (let i = 0; i < n; i++) setTimeout(() => {
      const c = new THREE.Color().setHSL(Math.random(), 1, .6);
      const origin = new V3(-7 + (Math.random() - .5) * 14, 9 + Math.random() * 4, (Math.random() - .5) * 6);
      for (let k = 0; k < 40; k++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
        m.position.copy(origin); const v = new V3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(4 + Math.random() * 3);
        scene.add(m); fx.push({ m, v, life: 1.8 });
      }
      AUDIO.sfx('pop', { vol: .7 });
    }, i * 450);
  }

  const STREET = {
    scene, camera,
    init() { build(); },
    onEnter() { build(); },
    setTime, setRival, setOurSign, shot, show, hide, clear, fireworks,
    set sway(v) { sway = v; },
    update(dt, t) {
      for (const sp of sprites) sp.update(dt);
      const s = sway ? Math.sin(t * .35) * .06 : 0;
      camera.position.set(cam.pos.x + s, cam.pos.y + Math.sin(t * .5) * .02, cam.pos.z); camera.lookAt(cam.look);
      for (const c of cars) { c.o.position.x += c.v * dt; if (c.o.position.x > 62) c.o.position.x = -62; if (c.o.position.x < -62) c.o.position.x = 62; }
      for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; f.v.y -= 3 * dt; f.m.position.addScaledVector(f.v, dt); f.m.material.opacity = f.life; f.m.material.transparent = true; if (f.life <= 0) { scene.remove(f.m); fx.splice(i, 1); } }
      for (const m of signMats) if (m.transparent) m.opacity = .9 + Math.sin(t * 8) * .05;
    },
  };
  window.STREET = STREET;
  ENGINE.register('street', STREET);
})();
