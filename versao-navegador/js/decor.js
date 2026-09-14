// CATÁLOGO DE DECORAÇÃO — móveis, plantas, máquinas e mascotes (todos modelos 3D baixados)
// que aparecem na loja, dão bônus e somam "estilo". Mascotes andam pela loja e aceitam carinho.
(function () {
  const $ = s => document.querySelector(s);
  const G = () => GAME.state;
  const pick = a => a[(Math.random() * a.length) | 0];

  // lugares da loja (coordenadas da cena da loja)
  const SLOTS = {
    chaoE: { type: 'chao', pos: [-3.2, 0, -1.8], rot: .5, label: 'chão (esquerda)' },
    chaoD: { type: 'chao', pos: [3.2, 0, -1.8], rot: -.5, label: 'chão (direita)' },
    cantoE: { type: 'canto', pos: [-2.4, 0, -3.3], rot: .25, label: 'canto (esquerda)' },
    cantoD: { type: 'canto', pos: [2.4, 0, -3.3], rot: -.25, label: 'canto (direita)' },
    tapete: { type: 'tapete', pos: [0, 0.012, -3.0], rot: Math.PI / 2, label: 'piso' },
    paredeE: { type: 'parede', pos: [-3.05, 3.0, -3.9], rot: 0, label: 'parede (esquerda)' },
    paredeD: { type: 'parede', pos: [3.05, 3.0, -3.9], rot: 0, label: 'parede (direita)' },
    teto: { type: 'teto', pos: [-1.8, 4.5, -3.1], rot: 0, label: 'teto' },
    topoE: { type: 'topo', pos: [-4.2, 0, -3.45], rot: .3, label: 'estante (esquerda)', top: true },
    topoD: { type: 'topo', pos: [4.2, 0, -3.45], rot: -.3, label: 'estante (direita)', top: true },
    pet: { type: 'pet', pos: [1.2, 0, -3.1], rot: 0, label: 'mascote' },
  };
  const TYPES = { chao: '🛋️ Móveis', canto: '🌿 Cantos', tapete: '🟥 Tapetes', parede: '🕰️ Parede & teto', teto: '🕰️ Parede & teto', topo: '🏺 Estante', pet: '🐾 Mascotes' };

  const D = (id, name, model, type, price, style, mods, desc, extra) => Object.assign({ id, name, model, type, price, style, mods, desc }, extra || {});
  const LIST = [
    D('sofa_rosa', 'Sofá retrô rosa', 'd_sofa', 'chao', 180, 8, { calm: 8, haggle: .05 }, 'Clientes esperam sentadinhos: brigas começam mais calmas e negociar fica 5% mais fácil.'),
    D('sofa_couro', 'Sofá de couro em L', 'd_sofa2', 'chao', 480, 16, { calm: 12, vipChance: .04, payMult: .03 }, 'Luxo! Mais clientes VIP e pagamentos +3%.'),
    D('piano', 'Piano de cauda', 'd_piano', 'chao', 950, 30, { vipChance: .08, payMult: .06, tipMult: .1 }, 'A loja mais chique do bairro: VIP +8%, pagamento +6%, gorjeta +10%.'),
    D('fliperama', 'Fliperama', 'arcade', 'chao', 520, 14, { customers: 1, xpMult: .1 }, 'A molecada vem jogar e traz os pais: +1 cliente por dia e +10% XP.', { elec: 1, size: 1.9, rotY: -Math.PI / 2 }),
    D('refri', 'Máquina de refrigerante', 'vending', 'chao', 450, 8, { dailyIncome: 35 }, 'Renda passiva: R$ 35 por dia, todo dia.', { elec: 1, size: 1.95, rotY: Math.PI }),
    D('zoltar', 'Zoltar, o vidente', 'd_zoltar', 'chao', 380, 18, { luck: .8, fortune: 1 }, 'Toda manhã uma previsão misteriosa. Sorte +0,8 no cassino.', { elec: 1 }),
    D('estante', 'Estante de livros', 'd_bookcase', 'chao', 300, 10, { xpMult: .15, parTime: 5 }, 'Manuais técnicos pra estudar: +15% XP e +5s na meta.'),
    D('aquario', 'Aquário grande', 'd_fishtank', 'chao', 350, 14, { calm: 15, luck: .3 }, 'Peixinhos acalmam qualquer um: brigas bem mais tranquilas.', { elec: 1 }),
    D('pufe', 'Pufe gigante', 'd_beanbag', 'chao', 90, 4, { calm: 5 }, 'Confortável e barato.'),
    D('planta_vaso', 'Espada-de-são-jorge', 'd_plantbig', 'canto', 60, 4, { repGain: .05, calm: 3 }, 'Protege contra mau-olhado (e reputação sobe 5% mais).'),
    D('planta_alta', 'Planta do vaso branco', 'd_plantwhite', 'canto', 110, 7, { repGain: .08, calm: 4 }, 'Verde deixa todo mundo de bom humor.'),
    D('costela', 'Costela-de-adão', 'd_houseplant', 'canto', 45, 3, { repLossMult: .05 }, 'Reputação cai 5% menos.'),
    D('luminaria', 'Luminária de chão', 'd_floorlamp', 'canto', 70, 5, { tipMult: .04 }, 'Luz amarelinha aconchegante: gorjeta +4%.', { elec: 1 }),
    D('violao', 'Violão encostado', 'd_guitar', 'canto', 140, 8, { tipMult: .06, calm: 4 }, 'Nas horas vagas você toca um sambinha. Gorjeta +6%.'),
    D('extintor', 'Extintor de incêndio', 'd_extinguisher', 'canto', 50, 1, { fireSafe: 1 }, 'Obrigatório pelo fiscal! Apaga incêndios e evita multa.'),
    D('tv', 'TV de tela plana', 'd_tv', 'canto', 260, 8, { calm: 10, tipMult: .05 }, 'Novela passando: ninguém reclama da espera.', { elec: 1 }),
    D('tapete_redondo', 'Tapete redondo', 'd_rug', 'tapete', 70, 5, { tipMult: .03 }, 'Dá um charme no piso.'),
    D('tapete_persa', 'Tapete persa', 'd_rug2', 'tapete', 240, 12, { tipMult: .06, payMult: .02 }, 'Importado (do camelô). Gorjeta +6%, pagamento +2%.'),
    D('relogio', 'Relógio de parede', 'd_clock', 'parede', 80, 4, { parTime: 10 }, 'Olho no tempo: +10s na meta de cada conserto.'),
    D('camera', 'Câmera de segurança', 'd_camera', 'parede', 200, 2, { antiTheft: 1 }, 'Espanta ladrões: assaltos quase nunca dão certo.', { elec: 1 }),
    D('ventilador', 'Ventilador de teto', 'd_ceilfan', 'teto', 150, 6, { parTime: 8, calm: 4 }, 'Brisa fresquinha: +8s na meta e clientes menos esquentados.', { elec: 1, spin: 1 }),
    D('lava', 'Luminária de lava', 'd_lava', 'topo', 55, 5, { luck: .3 }, 'Hipnotizante. Sorte +0,3.', { elec: 1 }),
    D('bonsai', 'Bonsai', 'd_bonsai', 'topo', 95, 6, { calm: 6, repLossMult: .05 }, 'Zen. Muito zen.'),
    D('cacto', 'Cacto', 'd_cactus', 'topo', 30, 2, { repGain: .03 }, 'Não precisa regar. Igual você no fim do dia.'),
    D('aquario_bola', 'Aquário de peixinho', 'd_fishbowl', 'topo', 65, 4, { luck: .2, calm: 3 }, 'O peixinho se chama Chip.'),
    D('papagaio', 'Papagaio falante', 'd_parrot', 'topo', 280, 10, { tipMult: .06, parrot: 1 }, 'Repete o que você fala nas brigas (e às vezes faz todo mundo rir).', { pet: 1 }),
    D('gato_origami', 'Gato de origami', 'd_catloaf', 'topo', 40, 3, { luck: .2 }, 'Um gatinho de papel da sorte.'),
    D('vitrola', 'Vitrola', 'd_record', 'topo', 170, 9, { tipMult: .08, calm: 4 }, 'Um jazz de fundo: gorjeta +8%.', { elec: 1 }),
    D('cafeteira', 'Cafeteira expressa', 'd_coffee', 'topo', 120, 4, { fastBonus: .05, tipMult: .04 }, 'Cafezinho pra você e pros clientes.', { elec: 1 }),
    D('trofeu', 'Troféu de melhor técnico', 'trophy', 'topo', 150, 6, { repGain: .1 }, 'Prova de competência. Reputação sobe 10% mais.'),
    D('gato', 'Gato Pixel (mascote)', 'd_cat', 'pet', 250, 12, { luck: .5, calm: 5 }, 'Anda pela loja. Faça carinho 1x por dia: sorte +1 no dia.', { pet: 1, anim: 1 }),
    D('gatao', 'Gatão Cabeçudo (mascote)', 'd_cat2', 'pet', 300, 14, { luck: .5, tipMult: .05 }, 'Os clientes AMAM. Carinho diário: sorte +1.', { pet: 1, anim: 1 }),
    D('cachorro', 'Shiba "Caramelo" (mascote)', 'd_dog', 'pet', 350, 12, { antiTheft: 1, repGain: .05 }, 'Late pra ladrão e todo mundo quer tirar foto.', { pet: 1, anim: 1 }),
  ];
  const DEC = Object.fromEntries(LIST.map(d => [d.id, d]));
  const STYLE_TIERS = [
    { min: 15, name: 'Aconchegante', mods: { tipMult: .05 }, txt: 'gorjeta +5%' },
    { min: 35, name: 'Estilosa', mods: { payMult: .03, calm: 5 }, txt: 'pagamento +3%' },
    { min: 60, name: 'Instagramável', mods: { vipChance: .05, customers: 1 }, txt: '+1 cliente/dia e VIP +5%' },
    { min: 95, name: 'Lendária', mods: { repGain: .2, payMult: .05 }, txt: 'reputação +20%, pagamento +5%' },
  ];

  function st() { const g = G(); if (!g.decor) g.decor = { owned: [], placed: {}, broken: [], petDay: 0 }; return g.decor; }
  function placedIds() { if (!G()) return []; return Object.values(st().placed).filter(Boolean); }
  function active() { const s = st(); return placedIds().filter(id => !s.broken.includes(id)); }
  function style() { return Math.round(active().reduce((a, id) => a + DEC[id].style, 0) * (1 + (G() && G().upgrades ? META.UPGRADES.filter(u => G().upgrades.includes(u.id)).reduce((a, u) => a + (u.mods.styleMult || 0), 0) : 0))); }
  function tier() { const s = style(); let t = null; for (const x of STYLE_TIERS) if (s >= x.min) t = x; return t; }

  // modificadores somados em META.mod
  function modSum(key) {
    if (!G() || !G().decor) return 0;
    let v = 0; for (const id of active()) v += DEC[id].mods[key] || 0;
    const t = tier(); if (t) for (const x of STYLE_TIERS) if (style() >= x.min) v += x.mods[key] || 0;
    return v;
  }

  // ---------- 3D ----------
  let root = null; const anims = []; let petObj = null;
  function slotPos(sl) {
    const p = SLOTS[sl]; const v = new THREE.Vector3(...p.pos);
    if (p.top) v.y = (SHOP.shelfTop || 2.6) + 0.01;
    return v;
  }
  function apply() {
    if (!SHOP.group) return;
    if (!root) { root = new THREE.Group(); root.name = 'decor'; SHOP.scene.add(root); }
    while (root.children.length) root.remove(root.children[0]);
    anims.length = 0; petObj = null;
    if (!G() || !G().decor) return;
    const s = st();
    for (const [sl, id] of Object.entries(s.placed)) {
      if (!id) continue;
      const d = DEC[id]; const p = SLOTS[sl];
      let obj, clips = [], inner = null;
      const o = d.size ? { size: d.size } : {};
      if (d.anim) { const a = ASSETS.getAnimated(d.model, o); obj = a.obj; clips = a.clips; inner = a.root; }
      else obj = ASSETS.get(d.model, o);
      const pos = slotPos(sl);
      obj.position.copy(pos); obj.rotation.y = p.rot + (d.rotY || 0);
      if (p.type === 'teto') obj.position.y = 4.5 - obj.userData.size.y;
      if (p.type === 'parede') obj.position.z = -3.9 + obj.userData.size.z / 2;
      if (s.broken.includes(id)) ASSETS.tint(obj, 0x555555, .55);
      obj.userData.decor = id;
      root.add(obj);
      if (d.spin) anims.push({ kind: 'spin', obj });
      if (d.anim && clips.length) {
        const mixer = new THREE.AnimationMixer(inner);
        const byName = re => clips.find(c => re.test(c.name));
        const walk = byName(/walk/i) || byName(/run/i) || clips[0];
        const idle = byName(/idle/i) || byName(/sit/i) || clips[0];
        const extra = clips.filter(c => /(eat|sit|jump|lick|attack|gallop|no|yes|clicked|dance|wave|idle_2)/i.test(c.name));
        const actWalk = mixer.clipAction(walk), actIdle = mixer.clipAction(idle);
        actIdle.play();
        petObj = { obj, mixer, actWalk, actIdle, extra, cur: 'idle', t: 2 + Math.random() * 3, target: null, id };
        anims.push({ kind: 'pet', pet: petObj });
      } else if (d.type === 'pet') {
        petObj = { obj, id, t: 3, target: null };
        anims.push({ kind: 'pet', pet: petObj });
      }
    }
  }
  function playAct(pet, act) {
    if (!pet.mixer) return;
    const now = pet.curAct;
    if (now === act) return;
    act.reset().fadeIn(.25).play(); if (now) now.fadeOut(.25);
    pet.curAct = act;
  }
  function updatePet(pet, dt) {
    if (pet.mixer) pet.mixer.update(dt);
    const o = pet.obj;
    if (pet.hop > 0) { pet.hop -= dt; o.position.y = Math.sin((1 - pet.hop / .6) * Math.PI) * .35; } else o.position.y = 0;
    if (pet.target) {
      const dx = pet.target.x - o.position.x, dz = pet.target.z - o.position.z; const dist = Math.hypot(dx, dz);
      if (dist < .05) { pet.target = null; pet.t = 2.5 + Math.random() * 4; if (pet.mixer) playAct(pet, pet.extra.length && Math.random() < .4 ? pet.mixer.clipAction(pick(pet.extra)) : pet.actIdle); }
      else { const sp = .55 * dt; o.position.x += dx / dist * Math.min(sp, dist); o.position.z += dz / dist * Math.min(sp, dist); const want = Math.atan2(dx, dz); let dr = want - o.rotation.y; while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2; o.rotation.y += dr * Math.min(1, dt * 6); }
    } else {
      pet.t -= dt;
      if (pet.t <= 0) { pet.target = { x: -2.3 + Math.random() * 4.6, z: -3.55 + Math.random() * .8 }; if (pet.mixer) playAct(pet, pet.actWalk); }
    }
  }
  function hookUpdate(dt) {
    for (const a of anims) {
      if (a.kind === 'spin') a.obj.rotation.y += dt * 3.5;
      else if (a.kind === 'pet' && DEC[a.pet.id].type === 'pet') updatePet(a.pet, dt);
      else if (a.kind === 'pet' && a.pet.mixer) a.pet.mixer.update(dt);
    }
  }

  // carinho no mascote (clique no bichinho)
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function onPointer(e) {
    if (ENGINE.active !== SHOP || !petObj || DEC[petObj.id].type !== 'pet') return;
    if (!$('#screen').classList.contains('hidden') || !$('#bag').classList.contains('hidden')) return;
    ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    SHOP.scene.updateMatrixWorld(); ray.setFromCamera(ptr, SHOP.camera);
    const box = new THREE.Box3().setFromObject(petObj.obj).expandByScalar(.15);
    if (!ray.ray.intersectsBox(box)) return;
    petObj.hop = .6; AUDIO.sfx('pet');
    const g = G(), s = st();
    if (s.petDay !== g.day) {
      s.petDay = g.day;
      META.addBuff({ id: 'carinho', name: 'Carinho no mascote', emoji: '💞' }, { kind: 'day', n: 1, mods: { luck: 1 } });
      UI.toast(`💞 ${DEC[petObj.id].name.split(' (')[0]} adorou o carinho! <b>Sorte +1 hoje.</b>`, 'gold');
      META.bump('pets');
    } else UI.toast(pick(['💕 Ronrom...', '💕 Mais carinho!', '💕 Feliz da vida.', '💕 *derrete*']), '');
    e.stopPropagation();
  }
  window.addEventListener('pointerdown', onPointer, true);

  // ---------- regras ----------
  function electricCount() { return active().filter(id => DEC[id].elec).length; }
  function petCount() { return active().filter(id => DEC[id].pet).length; }
  function freeSlot(type) { const s = st(); return Object.keys(SLOTS).find(k => (SLOTS[k].type === type || (type === 'parede' && SLOTS[k].type === 'parede')) && !s.placed[k]); }
  function slotsOf(type) { return Object.keys(SLOTS).filter(k => SLOTS[k].type === type); }
  function place(id, slot) {
    const s = st(); for (const k in s.placed) if (s.placed[k] === id) s.placed[k] = null;
    s.placed[slot] = id; apply();
  }
  function breakRandom() {
    const ids = active().filter(id => DEC[id].type !== 'pet'); if (!ids.length) return null;
    const id = pick(ids); st().broken.push(id); apply(); AUDIO.sfx('glassBreak'); return DEC[id];
  }
  function repairCost(id) { return Math.round(DEC[id].price * .3); }

  // ---------- catálogo (tela) ----------
  let tab = 'chao';
  function openCatalog(onClose) {
    const g = G(); const s = st();
    AUDIO.sfx('open');
    const tabs = [['chao', '🛋️ Móveis'], ['canto', '🌿 Cantos'], ['tapete', '🟥 Tapetes'], ['parede', '🕰️ Parede & teto'], ['topo', '🏺 Estante'], ['pet', '🐾 Mascotes'], ['meus', '📦 Minha loja']];
    const render = () => {
      const sty = style(), t = tier(); const next = STYLE_TIERS.find(x => x.min > sty);
      const items = tab === 'meus' ? LIST.filter(d => s.owned.includes(d.id)) : LIST.filter(d => d.type === tab || (tab === 'parede' && d.type === 'teto'));
      const disc = Math.min(.3, META.mod('decorDiscount'));
      const price = d => Math.round(d.price * (1 - disc));
      const scr = UI.screen(`<div class="card catalog" style="max-width:1100px;width:95vw">
        <div class="cat-head"><div class="cat-logo">Decora<span>+</span></div><div>Catálogo de decoração · <b>Caixa: ${UI.money(g.money)}</b></div>
          <div class="style-meter">✨ Estilo da loja: <b>${sty}</b>${t ? ` — <b>${t.name}</b>` : ''}<div class="bar" style="height:10px;width:180px;display:inline-block;vertical-align:middle;margin-left:6px"><div class="bar-fill good" style="width:${Math.min(100, sty / 95 * 100)}%"></div></div>${next ? `<small> próximo nível (${next.min}): ${next.name} — ${next.txt}</small>` : ''}</div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>
        <div class="cat-grid">${items.length ? items.map(d => {
        const own = s.owned.includes(d.id), placed = placedIds().includes(d.id), broken = s.broken.includes(d.id);
        const slotName = Object.keys(s.placed).find(k => s.placed[k] === d.id);
        const p = price(d);
        return `<div class="cat-card ${placed ? 'placed' : ''} ${broken ? 'broken' : ''}">
            <img src="${ASSETS.thumb(d.model, { w: 180, h: 140, bg: '#fff4fa' })}">
            <h3>${d.name}</h3><p>${d.desc}</p>
            <div class="cat-tags"><span>✨ ${d.style}</span>${d.elec ? '<span title="Aumenta a conta de luz">⚡ luz</span>' : ''}${d.pet ? '<span title="Ração: aumenta um pouco as contas">🦴 ração</span>' : ''}<span>📍 ${TYPES[d.type].split(' ').slice(1).join(' ')}</span></div>
            ${broken ? `<button class="btn gold" data-fix="${d.id}" ${repairCost(d.id) >= g.money ? 'disabled' : ''}>🔧 Consertar (${UI.money(repairCost(d.id))})</button>`
            : own ? (placed ? `<div class="cat-ok">✔ Na loja (${SLOTS[slotName].label})</div><button class="btn" data-store="${d.id}" style="font-size:13px;padding:4px 12px">Guardar no depósito</button>`
              : `<button class="btn green" data-place="${d.id}">Colocar na loja</button>`)
              : `<button class="btn green" data-buy="${d.id}" ${p >= g.money ? 'disabled' : ''}>${UI.money(p)}</button>`}
          </div>`;
      }).join('') : '<p>Você ainda não comprou nenhuma decoração.</p>'}</div>
        <div class="store-foot"><button class="btn purple" id="cat-look">👀 Ver a loja</button><button class="btn big" id="cat-close">Fechar catálogo</button></div></div>`, 'dim');
      scr.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; AUDIO.sfx('select'); render(); });
      scr.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
        const d = DEC[b.dataset.buy]; const p = price(d); if (p >= g.money) return;
        GAME.addMoney(-p, true); s.owned.push(d.id); META.bump('decorBought'); META.bump('decorOwned', s.owned.length, 'max');
        AUDIO.sfx('buy'); UI.toast(`🛋️ <b>${d.name}</b> comprado!`, 'good');
        choosePlace(d, render);
      });
      scr.querySelectorAll('[data-place]').forEach(b => b.onclick = () => choosePlace(DEC[b.dataset.place], render));
      scr.querySelectorAll('[data-store]').forEach(b => b.onclick = () => { for (const k in s.placed) if (s.placed[k] === b.dataset.store) s.placed[k] = null; apply(); AUDIO.sfx('drop'); render(); GAME.refreshHUD(); });
      scr.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => { const id = b.dataset.fix, c = repairCost(id); if (c >= g.money) return; GAME.addMoney(-c, true); s.broken = s.broken.filter(x => x !== id); apply(); AUDIO.sfx('confirm2'); render(); });
      scr.querySelector('#cat-look').onclick = async () => {
        UI.closeScreen(); const prev = ENGINE.active; ENGINE.use('shop'); SHOP.setTime(Math.min(G().hour || 10, 18));
        const tip = document.createElement('div'); tip.className = 'look-tip'; tip.textContent = 'Clique em qualquer lugar para voltar ao catálogo'; document.body.appendChild(tip);
        await new Promise(r => setTimeout(() => window.addEventListener('pointerdown', r, { once: true }), 200));
        tip.remove(); if (prev && prev !== SHOP) ENGINE.use(Object.keys(ENGINE.scenes).find(k => ENGINE.scenes[k] === prev)); render();
      };
      scr.querySelector('#cat-close').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); GAME.refreshHUD(); onClose && onClose(); };
    };
    function choosePlace(d, done) {
      const opts = slotsOf(d.type === 'teto' ? 'teto' : d.type);
      const free = opts.filter(k => !s.placed[k]);
      if (free.length) { place(d.id, free[0]); AUDIO.sfx('place'); done(); GAME.refreshHUD(); return; }
      // todos ocupados: escolher o que substituir
      const scr = UI.screen(`<div class="card"><h2>Onde colocar ${d.name}?</h2><p>Os lugares desse tipo estão ocupados. O item que sair vai pro depósito (dá pra trocar de novo depois).</p>
        ${opts.map(k => `<button class="btn" data-sl="${k}">${SLOTS[k].label}: trocar ${DEC[s.placed[k]].name}</button>`).join('<br>')}<br><button class="btn red" id="pl-no">Guardar no depósito</button></div>`, 'dim');
      scr.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { place(d.id, b.dataset.sl); AUDIO.sfx('place'); done(); GAME.refreshHUD(); });
      scr.querySelector('#pl-no').onclick = () => done();
    }
    render();
  }

  // bônus diários (máquina de refri, Zoltar)
  const FORTUNES = ['A sorte sorri para quem aposta... no vermelho.', 'Um cliente de cabelo colorido trará alegria.', 'Hoje, cuidado com a cola da tela.', 'O número 7 vai aparecer quando você menos esperar.', 'Alguém vai tentar te passar a perna. Fique esperto.', 'Uma moeda perdida vai voltar pra você.', 'Não confie em quem diz "é rapidinho".', 'O trevo dourado está mais perto do que você imagina.', 'Hoje a lua favorece os caça-níqueis.', 'Um bichinho vai te trazer sorte.', 'Paciência: a raiva de um cliente passa com um cafezinho.', 'Os astros dizem: poupar hoje, sorrir amanhã.'];
  function morning() {
    const out = [];
    const inc = META.mod('dailyIncome'); if (inc > 0) { GAME.addMoney(inc, true); if (G().log) G().log.events += inc; out.push(`🥤 Máquina de refrigerante rendeu <b>${UI.money(inc)}</b>`); }
    if (modSum('fortune') > 0) out.push(`🔮 Zoltar diz: <i>"${pick(FORTUNES)}"</i>`);
    return out;
  }

  ENGINE.scenes.shop && SHOP.hooks.push(hookUpdate);
  window.DECOR = { LIST, DEC, SLOTS, STYLE_TIERS, apply, modSum, style, tier, electricCount, petCount, openCatalog, breakRandom, morning, active, owned: () => st().owned, state: st, repairCost };
})();
