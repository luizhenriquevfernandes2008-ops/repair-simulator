// Fluxo principal: dias de conserto, noites de aposta, economia roguelike,
// mochila de itens, lojinha da esquina, level up, missões, relíquias e conquistas.
(function () {
  const $ = UI.$;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const round5 = v => Math.max(5, Math.round(v / 5) * 5);
  const START_MONEY = 150;
  const GOAL = 10000;
  const mod = k => META.mod(k);

  const EVENTS = [
    { id: 'quiet', txt: 'Dia tranquilo. Nada de especial.', w: 4 },
    { id: 'promo', txt: 'Promoção do fornecedor! Peças 40% mais baratas hoje.', partsMult: 0.6, w: 2 },
    { id: 'rain', txt: 'Dia chuvoso... 1 cliente a menos, mas pagam 25% a mais.', cust: -1, payMult: 1.25, w: 2 },
    { id: 'viral', txt: 'Seu conserto viralizou nas redes! +2 clientes hoje.', cust: 2, w: 1.5 },
    { id: 'fiscal', txt: 'O fiscal da prefeitura passou... multa de R$ 40.', money: -40, fine: true, w: 1 },
    { id: 'pipe', txt: 'Cano estourado na loja! O encanador cobrou R$ 60.', money: -60, fine: true, w: 1 },
    { id: 'moon', txt: 'Lua cheia hoje... dizem que a sorte está no ar (+15% nos prêmios do cassino).', casino: 1.15, w: 1.5 },
    { id: 'coffee', txt: 'Você passou um café cheiroso! Gorjetas +30% hoje.', tip: 1.3, w: 1.5 },
    { id: 'rich', txt: 'Um evento de gente rica no bairro! Clientes pagam +30%.', payMult: 1.3, w: 1.2 },
    { id: 'gift', txt: 'Um fornecedor deixou uma caixa de peças de brinde!', gift: true, w: 1 },
    { id: 'sale', txt: 'Liquidação na lojinha da Tati! Tudo 30% mais barato hoje.', storeSale: .3, w: 1.2 },
  ];

  // ---------- estado ----------
  let G = null;
  function fresh() {
    return {
      day: 0, money: START_MONEY + mod('startMoney'), rep: 2.5, upgrades: [], stock: Object.fromEntries(Object.keys(REPAIR.PARTS).map(k => [k, 0])),
      stats: { repairs: 0, perfect: 0, casinoWon: 0, casinoLost: 0, best: START_MONEY, earned: 0 },
      visits: {}, tickets: [], event: null, customersLeft: 0, hour: 9, log: null, won: false,
      bag: {}, buffs: [], xp: 0, level: 1, combo: 0, freeSpins: 0, store: null, mission: null, secondUsed: false, extraCust: 0,
      dayQuality: [], served: [],
    };
  }
  function normalize(s) { // saves antigos
    const f = fresh();
    for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
    s.stock = Object.assign(f.stock, s.stock || {});
    s.upgrades = (s.upgrades || []).filter(id => META.UPG[id]);
    return s;
  }

  const GAME = {
    get state() { return G; },
    mod,
    hasUpgrade(id) { return !!G && G.upgrades.includes(id); },
    luck() { return mod('luck') + (G && G.event && G.event.casino ? 0.5 : 0); },
    payMult() { return (1 + mod('casinoPay')) * (G && G.event && G.event.casino ? G.event.casino : 1); },
    addMoney(v, silent) {
      G.money = Math.round(G.money + v);
      if (G.money > G.stats.best) G.stats.best = G.money;
      if (G.log && !silent) { if (v > 0) G.log.income += v; }
      if (G.money > 0) META.bump('maxMoney', G.money, 'max');
      updateHUD(v);
    },
    consumePart(part, job) {
      job.lastPartCost = 0;
      if (G.stock[part] > 0) { G.stock[part]--; UI.toast(`Peça do estoque: <b>${REPAIR.PARTS[part].name}</b> (restam ${G.stock[part]})`, 'good'); return true; }
      const mult = ((G.event && G.event.partsMult) || 1) * (1 - Math.min(.6, mod('partsEmergency')));
      const price = Math.round(REPAIR.PARTS[part].cost * 1.5 * mult * (job.type === 'tablet' && part === 'screen' ? 1.6 : 1));
      if (G.money - price <= 0) return false;
      G.money -= price; G.log.parts += price; updateHUD(-price);
      job.lastPartCost = price;
      AUDIO.sfx('cash');
      UI.toast(`Comprou ${REPAIR.PARTS[part].name} às pressas: <b style="color:#c1121f">−${UI.money(price)}</b>`, '');
      return true;
    },
    refundWrong(job) {
      const r = Math.round((job.lastPartCost || 0) * Math.min(1, mod('wrongRefund')));
      if (r > 0) { GAME.addMoney(r, true); UI.toast(`⚖️ O advogado recuperou ${UI.money(r)} da peça errada.`, 'good'); }
    },
    giftPart() { const keys = Object.keys(G.stock); const p = pick(keys); G.stock[p]++; return REPAIR.PARTS[p].name; },
    giftUpgrade() {
      const [id] = META.rollUpgrades(1);
      if (!id) { this.addMoney(300, true); return '(você já tem tudo: +R$ 300)'; }
      grantUpgrade(id);
      return `(${META.UPG[id].name})`;
    },
    bumpMeta(stat, v) { META.bump(stat, v || 1); },
    consumeMod(k) { return META.consumeMod(k); },
    useFreeSpin() { if (G.freeSpins > 0) { G.freeSpins--; META.renderBuffs(); return true; } return false; },
    // ajusta o prêmio de uma aposta com os buffs de itens e melhorias
    casinoSettle({ game, bet, win, jackpot }) {
      let refund = 0;
      const allIn = G.allInPending; G.allInPending = false;
      if (win > 0 && META.consumeMod('doublePrize')) { win *= 2; UI.toast('🟡 Ficha dourada: prêmio em DOBRO!', 'gold'); }
      if (win <= 0 && bet > 0) {
        const cb = mod('cashback');
        if (cb > 0) { refund += Math.round(bet * Math.min(1, cb)); META.consumeMod('cashback'); UI.toast(`🕶️ Óculos escuros: recuperou ${UI.money(refund)}`, 'good'); }
        if (allIn && mod('allInGuard') && !G.guardUsed) { G.guardUsed = true; const r = Math.round(bet * .25); refund += r; UI.toast(`🥅 Rede de proteção: salvou ${UI.money(r)} do ALL IN!`, 'gold'); }
      }
      if (jackpot) META.bump('jackpots');
      if (allIn && win > 0) META.bump('allinWins');
      META.tick('bets');
      return { win, refund };
    },
  };
  window.GAME = GAME;

  function grantUpgrade(id) {
    if (G.upgrades.includes(id)) return;
    G.upgrades.push(id);
    const u = META.UPG[id];
    if (id === 'plantinha') G.rep = Math.min(5, G.rep + .3);
    AUDIO.sfx('buy');
    UI.toast(`<span style="color:${META.RAR[u.rarity].color}">◆</span> Melhoria <b>${u.name}</b> — ${u.desc}`, 'good');
    updateHUD(); META.renderBuffs();
  }

  // ---------- HUD ----------
  function xpNeed(l) { return 50 + (l - 1) * 35; }
  function updateHUD(delta) {
    if (!G) return;
    $('#hud-day').textContent = 'Dia ' + G.day;
    const h = Math.floor(G.hour), m = Math.round((G.hour - h) * 60);
    $('#hud-time').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const mm = $('#hud-money');
    mm.textContent = UI.money(G.money);
    mm.classList.toggle('neg', G.money < 50);
    if (delta) { mm.classList.remove('bump'); void mm.offsetWidth; mm.classList.add('bump'); const r = mm.getBoundingClientRect(); UI.floatMoney(delta, r.left + 10, r.bottom + 4); }
    const st = Math.round(G.rep);
    $('#hud-rep').textContent = '★'.repeat(st) + '☆'.repeat(5 - st);
    $('#hud-rent').textContent = 'Aluguel hoje: ' + UI.money(rentFor(G.day));
    $('#hud-lvl').innerHTML = `Nv ${G.level}<div class="xpbar"><div style="width:${Math.min(100, G.xp / xpNeed(G.level) * 100)}%"></div></div>`;
    const c = $('#hud-combo'); c.textContent = G.combo >= 2 ? `🔥 Combo x${G.combo}` : ''; c.classList.toggle('hidden', G.combo < 2);
    const bagN = Object.values(G.bag).reduce((a, b) => a + b, 0);
    $('#btn-bag').innerHTML = `🎒<small>${bagN || ''}</small>`;
    META.renderBuffs();
  }
  function rentFor(day) { return Math.round(40 * Math.pow(1.17, Math.max(0, day - 1)) * (1 - Math.min(.6, mod('rentMult')))); }
  function hud(on) { $('#hud').classList.toggle('hidden', !on); $('#hud-buffs').classList.toggle('hidden', !on); }

  // ---------- cena de título ----------
  const TITLE = (() => {
    const scene = new THREE.Scene();
    const bg = ASSETS.canvasTex(512, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ffc2e2'); gr.addColorStop(1, '#ffe8f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.beginPath(); g.arc(x + ((y / 32) % 2) * 16, y, 4, 0, 7); g.fill(); }
    });
    scene.background = bg;
    const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 50);
    camera.position.set(0, 0.6, 6.5); camera.lookAt(1.6, 0.4, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xff88cc, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(3, 4, 5); scene.add(dl);
    const grp = new THREE.Group(); grp.position.set(2.7, 0.2, -0.6); scene.add(grp);
    const orbit = [];
    let built = false;
    return {
      scene, camera,
      build() {
        if (built) return; built = true;
        const ph = ASSETS.get('notch', { size: 2.2 }); const p = new THREE.Group(); ph.rotation.x = Math.PI / 2; ph.position.set(0, 0, 0); p.add(ph);
        ph.position.z = -0.05; p.rotation.x = -0.2; grp.add(p); this.phone = p;
        ['cherry', 'diamond', 'coin', 'bellsym', 'trophy', 'screwdriver', 'chip', 'spade'].forEach((k, i) => {
          const o = ASSETS.get(k, { size: k === 'screwdriver' ? .8 : .45, fit: 'max' });
          const piv = new THREE.Group(); piv.add(o); grp.add(piv);
          orbit.push({ o: piv, a: i / 8 * Math.PI * 2, r: 1.9 + (i % 2) * .3, y: (i % 3 - 1) * .5, s: .4 + Math.random() * .3 });
        });
      },
      update(dt, t) {
        if (this.phone) { this.phone.rotation.y = Math.sin(t * .6) * .6; this.phone.position.y = Math.sin(t * 1.2) * .08; }
        orbit.forEach(o => { o.a += dt * o.s; o.o.position.set(Math.cos(o.a) * o.r, o.y + Math.sin(t + o.a) * .2, Math.sin(o.a) * o.r * .6); o.o.rotation.y += dt; o.o.rotation.x += dt * .5; });
      },
    };
  })();
  ENGINE.register('title', TITLE);

  // ---------- início ----------
  async function boot() {
    try { await Promise.all([document.fonts.load('bold 30px Fredoka'), document.fonts.load('bold 20px Nunito'), document.fonts.load('20px Nunito')]); } catch (e) { }
    await ASSETS.preload((k) => { $('#load-fill').style.width = (k * 100) + '%'; $('#load-text').textContent = `Carregando modelos 3D... ${Math.round(k * 100)}%`; });
    $('#load-text').textContent = 'Preparando a loja...';
    await wait(0.05);
    REPAIR.init(); SHOP.init(); CASINO.init(); STORE.init(); TITLE.build();
    // atalhos de teste: ?test=repair&dev=ds&fault=screen | ?test=casino | ?test=night | ?test=store | ?test=levelup
    const q = new URLSearchParams(location.search);
    if (q.get('test')) {
      $('#loading').remove();
      G = fresh(); G.day = 1; G.money = +(q.get('money') || 500); G.log = { income: 0, parts: 0, casino: 0, rent: 0, tips: 0 }; G.event = EVENTS[0]; G.served = [];
      if (q.get('items')) q.get('items').split(',').forEach(id => G.bag[id] = (G.bag[id] || 0) + 1);
      hud(true); updateHUD();
      const t = q.get('test');
      if (t === 'repair') {
        const c = CHARS.ROSTER[0]; const job = makeJob(c);
        if (q.get('dev')) { job.model = q.get('dev'); const d = REPAIR.DEVICES[job.model]; job.name = d.name; job.type = d.type; }
        if (q.get('fault')) job.fault = q.get('fault');
        ENGINE.use('repair'); REPAIR.start(job, r => { window.__lastResult = r; console.log('RESULT', JSON.stringify(r)); });
      } else if (t === 'casino') goCasino();
      else if (t === 'night') nightChoiceOrDay(false);
      else if (t === 'store') visitStore(() => nightChoiceOrDay(false));
      else if (t === 'levelup') { ENGINE.use('shop'); levelUp().then(() => UI.toast('ok')); }
      else if (t === 'upgrades') { ENGINE.use('shop'); upgradeShop(); }
      else if (t === 'collection') collection();
      else if (t === 'shop') { G.customersLeft = 2; ENGINE.use('shop'); SHOP.setTime(10); AUDIO.music('shop'); nextCustomer(); }
      return;
    }
    $('#load-text').innerHTML = '<b>Clique para começar ♥</b>';
    $('#load-fill').style.width = '100%';
    await new Promise(r => { $('#loading').onclick = r; });
    $('#loading').remove();
    titleScreen();
  }

  $('#btn-mute').onclick = () => { const m = AUDIO.toggleMute(); $('#btn-mute').textContent = m ? '✕' : '♪'; };
  function toggleFullscreen() {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { }
  }
  $('#btn-fs').onclick = toggleFullscreen;
  $('#btn-bag').onclick = () => openBag();
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'm' || e.key === 'M') $('#btn-mute').click();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if ((e.key === 'i' || e.key === 'I' || e.key === 'b' || e.key === 'B') && G && !G.dead) { if ($('#bag').classList.contains('hidden')) openBag(); else closeBag(); }
    if (e.key === 'Escape' && !$('#bag').classList.contains('hidden')) closeBag();
  });
  // Modo aplicativo (aberto pelo .exe): avisa o servidor local que a janela continua aberta
  const APP = new URLSearchParams(location.search).get('app') === '1';
  if (APP) setInterval(() => { fetch('/__ping', { cache: 'no-store' }).catch(() => { }); }, 3000);
  function quitApp() { fetch('/__quit').catch(() => { }); setTimeout(() => { try { window.close(); } catch (e) { } }, 300); }

  function titleScreen() {
    hud(false); VN.hide(); closeBag();
    ENGINE.use('title');
    AUDIO.music('title');
    const save = loadSave();
    const best = META.meta.stats.bestDay || 0;
    const achN = META.meta.ach.length;
    const s = UI.screen(`
      <div class="title-wrap">
        <div class="logo">REPAIR<span>SIMULATOR</span><small>♥ assistência técnica & noites de sorte ♥</small></div>
        <div class="menu-item" id="m-new">Novo Jogo</div>
        <div class="menu-item ${save ? '' : 'off'}" id="m-cont">Continuar ${save ? `<small style="font-size:16px">(Dia ${save.day}, ${UI.money(save.money)})</small>` : ''}</div>
        <div class="menu-item" id="m-col">Coleção <small style="font-size:16px">(${achN}/${META.ACH.length} 🏆)</small></div>
        <div class="menu-item" id="m-how">Como Jogar</div>
        <div class="menu-item" id="m-cred">Créditos</div>
        <div class="menu-item" id="m-fs">Tela cheia</div>
        ${APP ? '<div class="menu-item" id="m-quit">Sair</div>' : ''}
      </div>
      <div class="title-foot">${best ? `Recorde: dia ${best} · ` : ''}Relíquias ativas: ${achN} · Modelos 3D: poly.pizza · Sons: Kenney · Música: Kevin MacLeod</div>`, '');
    s.style.background = 'transparent';
    $('#m-new').onclick = () => { AUDIO.sfx('confirm'); newGame(); };
    $('#m-cont').onclick = () => { if (save) { AUDIO.sfx('confirm'); G = normalize(save); hud(true); nightChoiceOrDay(true); } };
    $('#m-col').onclick = () => { AUDIO.sfx('open'); collection(); };
    $('#m-how').onclick = () => { AUDIO.sfx('open'); howTo(); };
    $('#m-cred').onclick = () => { AUDIO.sfx('open'); credits(); };
    $('#m-fs').onclick = () => { AUDIO.sfx('click'); toggleFullscreen(); };
    if (APP) $('#m-quit').onclick = () => { AUDIO.sfx('close'); quitApp(); };
  }

  function howTo() {
    const s = UI.screen(`<div class="card" style="text-align:left;max-width:780px">
      <h2 style="text-align:center">Como jogar</h2>
      <p>☀️ <b>De dia</b> você atende clientes. Ouça o problema, negocie o preço e conserte o aparelho na bancada 3D. Consertos dão <b>XP</b>: a cada nível você escolhe <b>1 de 3 melhorias</b> aleatórias.</p>
      <p>🔧 <b>No conserto</b>: tire os parafusos (segure o clique), aqueça a cola, abra, <b>meça os pontos de teste</b> para achar o defeito real, <b>desconecte a bateria</b>, troque a peça e remonte. Teclas <b>1–9</b> trocam de ferramenta. Consertos perfeitos seguidos formam <b>combo</b> 🔥.</p>
      <p>🏪 <b>Lojinha da esquina</b>: a Tati vende itens que mudam todo dia (café, cola, raspadinha, trevo, cigarro...). Eles vão para a <b>mochila</b> 🎒 (tecla <b>I</b>). O cigarro só pode ser fumado no cassino e dá sorte.</p>
      <p>🌙 <b>À noite</b>, depois do aluguel (que sobe todo dia!): <b>cassino</b> ou <b>loja de melhorias</b>. A lojinha não gasta a noite.</p>
      <p>🏆 <b>Conquistas</b> liberam <b>relíquias permanentes</b>: elas continuam valendo em todas as partidas, mesmo depois de falir.</p>
      <p>💀 <b>Se o dinheiro acabar, o jogo acaba.</b> Meta: ${UI.money(GOAL)}.</p>
      <div style="text-align:center"><button class="btn" id="hw-ok">Entendi!</button></div></div>`);
    s.querySelector('#hw-ok').onclick = () => { AUDIO.sfx('close'); titleScreen(); };
  }

  async function credits() {
    let list = [];
    try { list = window.MODEL_CREDITS || await fetch('models/credits.json').then(r => r.json()); } catch (e) { list = window.MODEL_CREDITS || []; }
    const used = new Set(Object.values(ASSETS.MODELS).map(m => m.file + '.glb'));
    const models = list.filter(m => used.has(m.file));
    const s = UI.screen(`<div class="card" style="max-width:940px">
      <h2>Créditos</h2>
      <div class="credits">
        <h3>Modelos 3D (poly.pizza)</h3>
        ${models.map(m => `${m.title} — ${m.author} (${m.license})<br>`).join('')}
        <h3>Efeitos sonoros</h3>
        Kenney (kenney.nl) — Casino Audio, Interface Sounds, Impact Sounds, UI Audio, Digital Audio, Music Jingles (CC0)<br>
        <h3>Músicas</h3>
        Kevin MacLeod (incompetech.com) — “Easy Lemon”, “Local Forecast - Elevator”, “Investigations”, “Dreamer”, “Funkorama”. Licença Creative Commons: By Attribution 4.0<br>
        <h3>Fontes</h3>
        Fredoka e Nunito (Google Fonts, SIL Open Font License)<br>
        <h3>Bibliotecas</h3>
        three.js r147 (MIT)<br>
        <h3>Personagens</h3>
        Desenhados por código (SVG) especialmente para este jogo.<br>
        <h3>Licenças</h3>
        CC-BY 3.0: creativecommons.org/licenses/by/3.0 · CC-BY 4.0: creativecommons.org/licenses/by/4.0 · CC0: domínio público
      </div>
      <button class="btn" id="cr-ok">Voltar</button></div>`);
    s.querySelector('#cr-ok').onclick = () => { AUDIO.sfx('close'); titleScreen(); };
  }

  // ---------- coleção: conquistas, relíquias, melhorias e itens ----------
  function collection(tab = 'ach') {
    const m = META.meta;
    const tabs = [['ach', `🏆 Conquistas (${m.ach.length}/${META.ACH.length})`], ['upg', `◆ Melhorias (${m.seenUpg.length}/${META.UPGRADES.length})`], ['itm', `🎒 Itens (${m.seenItems.length}/${META.ITEMS.length})`]];
    let body = '';
    if (tab === 'ach') {
      body = `<p style="font-size:14px">Cada conquista libera uma <b>relíquia permanente</b>, ativa em todas as partidas.</p><div class="ach-grid">` + META.ACH.map(a => {
        const got = m.ach.includes(a.id); const v = Math.min(a.goal, m.stats[a.stat] || 0);
        return `<div class="ach ${got ? 'got' : ''}"><div class="ach-ico">${got ? a.relic.emoji : '🔒'}</div><div><b>${a.name}</b><br><small>${a.desc}</small>
          <div class="bar" style="height:8px;margin:4px 0"><div class="bar-fill good" style="width:${v / a.goal * 100}%"></div></div>
          <small>${got ? `Relíquia: <b>${a.relic.name}</b> — ${a.relic.desc}` : `${v}/${a.goal} · Relíquia: ???`}</small></div></div>`;
      }).join('') + '</div>';
    } else if (tab === 'upg') {
      body = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">` + META.UPGRADES.map(u => {
        const seen = m.seenUpg.includes(u.id); const r = META.RAR[u.rarity];
        return `<div class="up-card mini" style="border-color:${seen ? r.color : '#ddd'}">${seen ? `<div class="ico">${upgIcon(u)}</div><h3>${u.name}</h3><small style="color:${r.color};font-weight:800">${r.name}</small><p>${u.desc}</p>` : `<div class="ico">❔</div><h3>???</h3><small>${r.name}${u.needAch ? ` · ${u.needAch} conquistas` : ''}</small>`}</div>`;
      }).join('') + '</div>';
    } else {
      body = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">` + META.ITEMS.map(it => {
        const seen = m.seenItems.includes(it.id);
        return `<div class="up-card mini">${seen ? `<div class="ico">${it.emoji}</div><h3>${it.name}</h3><p>${it.desc}</p>` : `<div class="ico">❔</div><h3>???</h3>`}</div>`;
      }).join('') + '</div>';
    }
    const s = UI.screen(`<div class="card" style="max-width:1040px;width:94vw">
      <h2>Coleção</h2>
      <div class="tabs">${tabs.map(([k, t]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}</div>
      ${body}
      <button class="btn" id="col-ok">Voltar</button></div>`);
    s.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { AUDIO.sfx('select'); collection(b.dataset.t); });
    s.querySelector('#col-ok').onclick = () => { AUDIO.sfx('close'); if (G && !G.dead) UI.closeScreen(); else titleScreen(); };
  }
  function upgIcon(u) { return u.icon.emoji ? `<span class="emo">${u.icon.emoji}</span>` : `<img src="${ASSETS.thumb(u.icon.model)}">`; }

  // ---------- novo jogo ----------
  async function newGame() {
    G = fresh();
    UI.closeScreen();
    ENGINE.use('shop'); SHOP.setTime(8.5); hud(false);
    AUDIO.music('shop');
    VN.speaker = null;
    await VN.say('', 'Sua tia Neide se aposentou e deixou a pequena assistência técnica dela nas suas mãos...');
    await VN.say('', 'Junto com a loja, veio um bilhete: <i>“O aluguel sobe todo santo dia. Não deixe o dinheiro acabar. Ah, e fique LONGE do cassino da esquina.”</i>');
    const relics = META.relicsOwned();
    if (relics.length) await VN.say('', `Suas relíquias te acompanham: ${relics.map(a => a.relic.emoji).join(' ')} <small>(${relics.length} ativas)</small>`);
    await VN.say('', 'Você tem <b>' + UI.money(G.money) + '</b>, uma bancada, algumas ferramentas... e muita coragem.');
    await VN.say('', 'Hora de abrir as portas! ♥');
    hud(true);
    startDay();
  }

  function rollEvent() {
    if (G.day === 1) return EVENTS[0];
    const pool = EVENTS.filter(e => !(e.fine && mod('noFines')));
    const tot = pool.reduce((a, e) => a + e.w, 0); let r = Math.random() * tot;
    for (const e of pool) { r -= e.w; if (r <= 0) return e; }
    return pool[0];
  }

  function newMission() {
    const t = pick(META.MISSIONS);
    const goal = t.goal === 'X' ? round5(150 + G.day * 45) : t.goal;
    const rewardItem = pick(META.ITEMS.filter(i => i.price >= 20)).id;
    return { id: t.id, txt: t.txt.replace('{X}', UI.money(goal).replace('R$ ', '')), stat: t.stat, goal, v: 0, done: false, rewardItem, rewardMoney: round5(40 + G.day * 12) };
  }
  function missionProgress(stat, v = 1) {
    const ms = G.mission; if (!ms || ms.done || ms.stat !== stat) return;
    ms.v += v;
    if (ms.v >= ms.goal) {
      ms.done = true; AUDIO.sfx('victory');
      addItem(ms.rewardItem); GAME.addMoney(ms.rewardMoney, true);
      UI.toast(`🎯 <b>Missão do dia cumprida!</b><br>+${UI.money(ms.rewardMoney)} e ${META.ITM[ms.rewardItem].emoji} ${META.ITM[ms.rewardItem].name}`, 'gold');
    }
  }

  async function startDay() {
    VN.hide();
    G.day++; G.hour = 9;
    META.bump('bestDay', G.day, 'max');
    G.event = rollEvent();
    G.log = { income: 0, parts: 0, casino: 0, rent: 0, tips: 0 };
    G.dayQuality = [];
    G.extraCust = 0;
    let n = 3 + Math.round(mod('customers')) + (G.rep >= 4.2 ? 1 : 0) + (G.event.cust || 0);
    if (G.day === 1) n = 3;
    G.customersLeft = Math.max(2, n);
    G.served = [];
    G.mission = newMission();
    if (!G.store || G.store.day !== G.day) G.store = null; // estoque da lojinha renova
    ENGINE.use('shop'); SHOP.setTime(9); SHOP.hideCustomer();
    AUDIO.music('shop');
    hud(true); updateHUD();
    AUDIO.sfx('dayStart');
    const s = UI.screen(`<div class="card">
      <h1>Dia ${G.day}</h1>
      <div class="event-card">📅 ${G.event.txt}</div>
      <div class="event-card mission">🎯 Missão: ${G.mission.txt} <small>(prêmio: ${UI.money(G.mission.rewardMoney)} + ${META.ITM[G.mission.rewardItem].emoji})</small></div>
      <p>Clientes esperados: <b>${G.customersLeft}</b> · Aluguel no fim do dia: <b style="color:#c1121f">${UI.money(rentFor(G.day))}</b></p>
      <p style="font-size:14px;opacity:.8">Caixa: ${UI.money(G.money)} · Meta: ${UI.money(GOAL)} · Nível ${G.level}</p>
      <button class="btn big" id="d-go">Abrir a loja ♥</button><br>
      <button class="btn purple" id="d-store" style="font-size:16px">🏪 Passar na lojinha da esquina antes</button></div>`);
    const go = await new Promise(r => { s.querySelector('#d-go').onclick = () => r('go'); s.querySelector('#d-store').onclick = () => r('store'); });
    AUDIO.sfx('confirm'); UI.closeScreen();
    if (go === 'store') { await new Promise(r => visitStore(r)); ENGINE.use('shop'); SHOP.setTime(9); AUDIO.music('shop'); }
    if (G.event.money) { GAME.addMoney(G.event.money, true); G.log.rent += -G.event.money; if (checkBroke('A multa levou seu último centavo...')) return; }
    if (G.event.gift) { const a = GAME.giftPart(), b = GAME.giftPart(); UI.toast(`Brinde: ${a} + ${b} no estoque!`, 'good'); }
    if (mod('dailyPart')) { const a = GAME.giftPart(); UI.toast(`🏚️ Do depósito: +1 ${a}`, 'good'); }
    nextCustomer();
  }

  // ---------- clientes ----------
  function chooseCustomer() {
    const pool = CHARS.ROSTER.filter(c => !G.served.includes(c.id));
    const c = pick(pool.length ? pool : CHARS.ROSTER);
    G.served.push(c.id);
    return c;
  }
  function makeJob(c) {
    const model = pick(c.devices);
    const dev = REPAIR.DEVICES[model];
    const faults = REPAIR.faultsFor(model);
    let f = pick(faults);
    const easy = faults.filter(x => ['battery', 'screen', 'port', 'coin', 'button'].includes(x));
    if (G.day <= 2 && easy.length && Math.random() < .6) f = pick(easy);
    const F = REPAIR.FAULTS[f];
    const ambiguous = ['battery', 'chip', 'water', 'port'].includes(f) && Math.random() < .35;
    const symptom = ambiguous ? pick(REPAIR.AMBIG) : pick(REPAIR.symptomsFor(f, dev.type));
    const brand = dev.name.split(' ')[0].toUpperCase();
    const vip = G.day > 1 && Math.random() < .05 + mod('vipChance');
    const mult = (1 + (G.day - 1) * .07) * (G.event.payMult || 1) * (0.85 + G.rep * .06) * rnd(.9, 1.12) * (vip ? 2.2 : 1);
    const price = round5(F.base * dev.value * c.wealth * mult);
    return { model, name: dev.name, type: dev.type, fault: f, symptom, brand, price, customerName: c.name, customer: c, vip };
  }

  async function nextCustomer() {
    if (G.customersLeft <= 0) {
      if (G.extraCust > 0) { G.extraCust--; G.customersLeft++; UI.toast('🥫 O energético te deu gás para mais um cliente!', 'good'); }
      else return endDay();
    }
    G.customersLeft--;
    const c = chooseCustomer();
    const job = makeJob(c);
    const visits = G.visits[c.id] || 0;
    await SHOP.showCustomer(c);
    if (job.vip) { AUDIO.sfx('bigWin', { vol: .5 }); UI.toast(`👑 <b>Cliente VIP!</b> ${c.name} paga 2,2x mais.`, 'gold'); }
    const greet = visits === 0 ? c.greet[0] : pick(c.greet.slice(1));
    await VN.say(c.name + (job.vip ? ' 👑' : ''), greet, { expr: visits ? 'smile' : (c.id === 'mei' ? 'angry' : 'neutral') });
    const faultExpr = job.fault === 'screen' ? 'sad' : 'worried';
    await VN.say(c.name, `É o meu <i>${job.name}</i>... ${job.symptom}`, { expr: faultExpr });
    if (job.customer.patience < .5 && Math.random() < .5) await VN.say(c.name, 'E eu tô com pressa, viu?', { expr: 'angry' });
    let price = job.price;
    const haggleChance = Math.max(.1, Math.min(.95, .82 - c.haggle * .7 + G.rep * .04 + mod('haggle')));
    await VN.say(c.name, `Quanto fica? Eu posso pagar <b>${UI.money(price)}</b>.`, { expr: 'neutral' });
    let decided = false, accepted = false, negotiated = false;
    while (!decided) {
      const ch = await VN.choose([
        { label: `Aceitar o serviço`, sub: `${UI.money(price)} — ${job.name}`, value: 'ok' },
        { label: 'Negociar (+30%)', sub: `chance ~${Math.round(haggleChance * 100)}%`, value: 'hag', disabled: negotiated },
        { label: '🎒 Usar item da mochila', sub: 'café, cola, revista...', value: 'bag' },
        { label: 'Recusar', sub: 'o cliente vai embora', value: 'no' },
      ]);
      if (ch === 'ok') { decided = accepted = true; }
      else if (ch === 'no') { decided = true; }
      else if (ch === 'bag') { await new Promise(r => openBag(r)); }
      else {
        negotiated = true;
        if (Math.random() < haggleChance) {
          price = round5(price * 1.3);
          AUDIO.sfx('confirm2'); META.bump('haggles'); missionProgress('haggles');
          await VN.say(c.name, `Hmm... tá bom, ${UI.money(price)}. Mas capricha!`, { expr: 'smug' });
        } else if (Math.random() < .5) {
          AUDIO.sfx('error');
          await VN.say(c.name, 'Quê?! Que absurdo! Vou procurar outra loja!', { expr: 'angry' });
          repLoss(.15);
          decided = true;
        } else {
          await VN.say(c.name, `Nem pensar. É ${UI.money(price)} ou nada.`, { expr: 'angry' });
        }
      }
    }
    if (!accepted) {
      await SHOP.leaveCustomer(-1);
      G.hour += 0.5; SHOP.setTime(G.hour); updateHUD();
      return nextCustomer();
    }
    job.price = price;
    await VN.say(c.name, pick(['Tá bom! Deixo com você.', 'Confio em você!', 'Vou esperar aqui, tá?', 'Por favor, cuida bem dele!']), { expr: 'smile' });
    VN.hide();
    UI.flash('#fff', .6);
    ENGINE.use('repair');
    REPAIR.start(job, res => afterRepair(c, job, res));
  }

  function repLoss(v) { G.rep = Math.max(0, G.rep - v * (1 - Math.min(1, mod('repLossMult')))); updateHUD(); }
  function repGain(v) { G.rep = Math.min(5, G.rep + v * (1 + mod('repGain'))); updateHUD(); }

  async function afterRepair(c, job, res) {
    await wait(0.6);
    UI.flash('#fff', .6);
    ENGINE.use('shop');
    AUDIO.music('shop');
    G.visits[c.id] = (G.visits[c.id] || 0) + 1;
    META.bump('loyal', G.visits[c.id], 'max');
    VN.speaker = null;
    await SHOP.showCustomer(c);
    const tipMult = (1 + mod('tipMult')) * ((G.event && G.event.tip) || 1);
    let xpGain = 0;
    if (res.ok) {
      const q = res.integ / 100;
      let pay = job.price * q;
      const lines = [];
      if (res.time <= res.par) { const fb = .1 + mod('fastBonus'); pay *= 1 + fb; lines.push(`rapidez +${Math.round(fb * 100)}%`); missionProgress('fast'); }
      else if (res.time > res.par * 1.6) { pay *= .85; lines.push('demora −15%'); }
      const pm = mod('payMult'); if (pm) { pay *= 1 + pm; lines.push(`melhorias ${pm > 0 ? '+' : ''}${Math.round(pm * 100)}%`); }
      // combo de consertos perfeitos
      if (res.integ >= 95) G.combo++; else G.combo = 0;
      if (G.combo >= 2) { const cb = Math.min(.5, (G.combo - 1) * (.03 + mod('combo'))); pay *= 1 + cb; lines.push(`🔥 combo x${G.combo} +${Math.round(cb * 100)}%`); }
      pay = Math.round(pay);
      let tip = res.integ >= 90 ? Math.round(job.price * c.tip * tipMult * rnd(.6, 1.4)) : 0;
      G.stats.repairs++; if (res.integ >= 100) G.stats.perfect++;
      META.bump('repairs'); if (res.integ >= 100) { META.bump('perfect'); missionProgress('perfect'); }
      if (res.firstTry) META.bump('firstTry');
      if (res.nodmg) missionProgress('nodmg');
      missionProgress('repairs');
      META.addDevice(job.model);
      G.dayQuality.push(res.integ);
      if (res.integ >= 70) {
        await VN.say(c.name, pick(c.thanks), { expr: 'happy' });
        repGain(.25 * q + (res.time <= res.par ? .1 : 0));
      } else {
        await VN.say(c.name, pick(c.angry), { expr: 'sad' });
        repLoss(.3);
      }
      GAME.addMoney(pay); AUDIO.sfx('cash');
      if (tip) { GAME.addMoney(tip); G.log.tips += tip; }
      missionProgress('income', pay + tip);
      await VN.say('', `Recebeu <b>${UI.money(pay)}</b> (qualidade ${res.integ}%${lines.length ? ' · ' + lines.join(' · ') : ''})${tip ? ` + gorjeta de <b>${UI.money(tip)}</b>` : ''}.`);
      if (c.id === 'cida' && Math.random() < .5 && res.integ >= 70) { await VN.say(c.name, 'Toma, meu filho, um bolinho! E um trocadinho pro cafezinho.', { expr: 'happy' }); GAME.addMoney(15); }
      if (c.id === 'luna' && Math.random() < .6) await VN.say(c.name, 'Hoje à noite... vá ao cassino. Ou não. As cartas estão confusas.', { expr: 'smug' });
      if (Math.random() < .12) { const it = pick(META.ITEMS.filter(i => i.price <= 30)).id; addItem(it); await VN.say(c.name, `Ah, e toma isso aqui, sobrou na minha bolsa: ${META.ITM[it].emoji} <b>${META.ITM[it].name}</b>!`, { expr: 'smile' }); }
      xpGain = Math.round((12 + job.price / 12) * (0.4 + q * .6) * (1 + mod('xpMult')) * (job.vip ? 1.5 : 1));
    } else if (res.reason === 'destroyed') {
      const ind = Math.round(job.price * .6 * (1 - Math.min(.9, mod('indemnity'))));
      G.combo = 0; G.dayQuality.push(0);
      await VN.say(c.name, 'O QUE VOCÊ FEZ COM ELE?! Tá TORRADO!', { expr: 'angry' });
      await VN.say('', `Você destruiu o aparelho e teve que indenizar <b style="color:#c1121f">${UI.money(ind)}</b>.`);
      GAME.addMoney(-ind); G.log.parts += ind;
      repLoss(1);
      xpGain = 5;
    } else {
      G.combo = 0; G.dayQuality.push(0);
      await VN.say(c.name, res.reason === 'noparts' ? 'Nem peça você tem?! Que loja é essa...' : 'Sério que você desistiu? Que decepção...', { expr: 'angry' });
      repLoss(.5);
    }
    META.tick('repairs');
    updateHUD();
    await SHOP.leaveCustomer(1);
    VN.hide();
    if (xpGain) await gainXP(xpGain);
    G.hour += rnd(1.6, 2.4); SHOP.setTime(G.hour); updateHUD();
    if (checkBroke('Você ficou sem nenhum centavo no caixa...')) return;
    nextCustomer();
  }

  // ---------- XP e level up (escolha 1 de 3 melhorias) ----------
  async function gainXP(v) {
    G.xp += v;
    UI.toast(`+${v} XP`, '');
    while (G.xp >= xpNeed(G.level)) {
      G.xp -= xpNeed(G.level); G.level++;
      META.bump('levelMax', G.level, 'max');
      updateHUD();
      await levelUp();
    }
    updateHUD();
  }
  function levelUp() {
    return new Promise(resolve => {
      AUDIO.sfx('victory'); UI.bigText('LEVEL UP!', '#9ef0b5');
      const n = 3 + Math.round(mod('levelChoices'));
      let freeRerolls = Math.round(mod('rerolls'));
      let paid = 0;
      let offer = META.rollUpgrades(n);
      const render = () => {
        const cost = 25 + paid * 15;
        const s = UI.screen(`<div class="card levelup" style="max-width:1000px">
          <h1>Nível ${G.level}!</h1>
          <p>Escolha <b>1</b> melhoria. Ela vale até o fim da partida.</p>
          <div class="grid" style="grid-template-columns:repeat(${Math.min(offer.length, 4)},1fr)">${offer.map((id, i) => upgCard(id, { anim: i })).join('')}</div>
          <button class="btn purple" id="lv-roll" ${!freeRerolls && cost >= G.money ? 'disabled' : ''}>🎲 Trocar opções (${freeRerolls ? `grátis x${freeRerolls}` : UI.money(cost)})</button>
          ${offer.length ? '' : '<button class="btn" id="lv-skip">Continuar</button>'}
        </div>`, 'dim');
        s.querySelectorAll('.up-card').forEach(el => el.onclick = () => { grantUpgrade(el.dataset.k); UI.closeScreen(); resolve(); });
        s.querySelector('#lv-roll').onclick = () => {
          if (freeRerolls) freeRerolls--; else { if (cost >= G.money) return; GAME.addMoney(-cost, true); paid++; }
          AUDIO.sfx('shuffle'); offer = META.rollUpgrades(n); render();
        };
        const sk = s.querySelector('#lv-skip'); if (sk) sk.onclick = () => { UI.closeScreen(); resolve(); };
      };
      render();
    });
  }
  function upgCard(id, { price, owned, cant, anim } = {}) {
    const u = META.UPG[id], r = META.RAR[u.rarity];
    return `<div class="up-card rar-${u.rarity} ${owned ? 'owned' : ''} ${cant ? 'cant' : ''}" data-k="${id}" style="--rc:${r.color};animation-delay:${(anim || 0) * .12}s">
      <div class="rar-tag">${r.name}</div><div class="ico">${upgIcon(u)}</div><h3>${u.name}</h3><p>${u.desc}</p>
      ${price !== undefined ? `<div class="price">${owned ? 'COMPRADA' : UI.money(price)}</div>` : ''}</div>`;
  }

  // ---------- mochila ----------
  function addItem(id, n = 1) { G.bag[id] = (G.bag[id] || 0) + n; META.seeItem(id); updateHUD(); }
  function ctxNow() {
    if (ENGINE.active === CASINO) return 'casino';
    if (ENGINE.active === REPAIR) return 'repair';
    return 'day';
  }
  let bagDone = null;
  function openBag(onClose) {
    if (!G) return;
    bagDone = onClose || null;
    renderBag();
    $('#bag').classList.remove('hidden');
    AUDIO.sfx('open');
  }
  function closeBag() {
    const el = $('#bag'); if (!el || el.classList.contains('hidden')) return;
    el.classList.add('hidden');
    const cb = bagDone; bagDone = null; if (cb) cb();
  }
  function canUse(it) {
    const ctx = ctxNow();
    if (it.passive) return [false, 'Amuleto: funciona só de estar na mochila'];
    if (it.use === 'casino' && ctx !== 'casino') return [false, 'Só pode usar no cassino'];
    if (it.use === 'repair' && ctx !== 'repair') return [false, 'Use durante um conserto'];
    if (it.use === 'day' && ctx === 'casino') return [false, 'Use de dia, na loja'];
    if (it.extraCustomer && (ctx !== 'day' || !G.log || G.nightPending)) return [false, 'Use durante o dia de trabalho'];
    return [true, ''];
  }
  function renderBag() {
    const ids = Object.keys(G.bag).filter(id => G.bag[id] > 0);
    const label = { bets: 'apostas', repairs: 'conserto(s)', day: 'hoje', night: 'esta noite' };
    $('#bag').innerHTML = `<div class="card bag-card">
      <h2>🎒 Mochila</h2>
      ${ids.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${ids.map(id => {
      const it = META.ITM[id]; const [ok, why] = canUse(it);
      return `<div class="item-card"><div class="ico">${it.emoji}</div><h3>${it.name} <small>x${G.bag[id]}</small></h3><p>${it.desc}</p>
          ${it.warn ? `<div class="warn">${it.warn}</div>` : ''}
          <button class="btn ${ok ? 'green' : ''}" data-use="${id}" ${ok ? '' : 'disabled'} style="font-size:14px;padding:6px 14px">${ok ? (it.smoke ? 'Fumar' : 'Usar') : why}</button></div>`;
    }).join('')}</div>` : '<p>Vazia. Passe na lojinha da esquina! 🏪</p>'}
      ${G.buffs.length || G.freeSpins ? `<h3 style="font:700 16px var(--f-title);color:var(--pink3)">Efeitos ativos</h3><div class="buff-list">${G.buffs.map(b => `<span>${b.emoji} ${b.name} <small>(${b.kind === 'bets' || b.kind === 'repairs' ? b.n + ' ' + label[b.kind] : label[b.kind]})</small></span>`).join('')}${G.freeSpins ? `<span>🎰 Giros grátis x${G.freeSpins}</span>` : ''}</div>` : ''}
      <p style="font-size:12px;opacity:.7">Tecla I abre e fecha a mochila.</p>
      <button class="btn" id="bag-close">Fechar</button></div>`;
    $('#bag').querySelectorAll('[data-use]').forEach(b => b.onclick = () => useItem(b.dataset.use));
    $('#bag-close').onclick = () => { AUDIO.sfx('close'); closeBag(); };
  }
  async function useItem(id) {
    const it = META.ITM[id]; if (!it || !G.bag[id]) return;
    const [ok] = canUse(it); if (!ok) return;
    if (it.heal && !REPAIR.heal(it.heal)) return;
    G.bag[id]--;
    AUDIO.sfx('confirm2');
    if (it.smoke) {
      closeBag(); $('#casino-ui').classList.add('hidden');
      await CASINO.smoke(it.id === 'charuto' ? 'charuto' : 'cigarro');
      $('#casino-ui').classList.remove('hidden');
      const h = await CASINO.showHostess(); VN.speaker = h;
      await VN.say('Rubi', pick(['Hmm... cheiro de sorte no ar~', 'Fumando no meu cassino? Ousado. Gostei~', 'Sopra essa fumaça pra longe, docinho. E aposta!']), { expr: 'smug' });
      VN.hide();
    }
    if (it.buff) META.addBuff(it, it.buff);
    if (it.rep) { if (it.rep > 0) repGain(it.rep); else { G.rep = Math.max(0, G.rep + it.rep); updateHUD(); UI.toast(`Cheiro de cigarro na roupa: ${it.rep} de reputação`, 'bad'); } }
    if (it.part) { G.stock[it.part]++; UI.toast(`+1 ${REPAIR.PARTS[it.part].name} no estoque`, 'good'); }
    if (it.freeSpins) { G.freeSpins += it.freeSpins; UI.toast(`⚡ ${it.freeSpins} giros grátis nos caça-níqueis!`, 'gold'); }
    if (it.extraCustomer) { G.extraCust += it.extraCustomer; UI.toast('🥫 +1 cliente hoje!', 'good'); }
    if (it.ticket) { const t = new Set(); while (t.size < 6) t.add(1 + ((Math.random() * 30) | 0)); G.tickets.push([...t].sort((a, b) => a - b)); UI.toast('🎫 Bilhete da Mega-Sorte guardado para o sorteio!', 'good'); }
    if (it.xp) await gainXP(it.xp);
    if (it.heal) UI.toast(`🩹 +${it.heal}% de integridade`, 'good');
    if (it.freeBox) { UI.toast('💐 A Rubi adorou! Uma caixa misteriosa grátis:', 'gold'); if (ENGINE.active === CASINO) { const r = await CASINO.openBox(true); UI.toast(r.txt, 'gold'); } }
    if (it.gamble) {
      let r = Math.random(), win = 0; for (const [p, v] of it.gamble) { r -= p; if (r <= 0) { win = v; break; } }
      if (win) { GAME.addMoney(win, true); AUDIO.sfx(win >= 100 ? 'bigWin' : 'winSmall'); UI.toast(`${it.emoji} Saiu prêmio: <b>${UI.money(win)}</b>!`, 'gold'); }
      else { AUDIO.sfx('loseSmall'); UI.toast(`${it.emoji} Nada dessa vez...`, ''); }
    }
    updateHUD();
    if (!$('#bag').classList.contains('hidden')) renderBag();
  }

  // ---------- lojinha da esquina (Tati) ----------
  async function visitStore(onLeave) {
    UI.closeScreen(); VN.hide();
    const prevScene = ENGINE.active;
    ENGINE.use('store');
    hud(true); updateHUD();
    const slots = 6 + Math.round(mod('storeSlots'));
    if (!G.store || G.store.day !== G.day) G.store = { day: G.day, items: META.rollStore(slots), sold: [], rerolls: 0 };
    const tati = await STORE.showClerk(); VN.speaker = tati;
    AUDIO.sfx('bell');
    await VN.say('Tati', pick(['Opa, bem-vindo ao Mercadinho 24h! O estoque muda todo dia, viu?', 'Voltou? Chegou coisa nova hoje... ou não. Olha aí.', 'E aí! Tô de olho no relógio, mas pode escolher com calma.']), { expr: 'smile' });
    VN.hide();
    const sale = (G.event && G.event.storeSale) || 0;
    const price = id => Math.max(1, Math.round(META.itemPrice(id) * (1 - sale)));
    const render = () => {
      const rc = 15 + G.store.rerolls * 10;
      const el = $('#store-ui');
      el.innerHTML = `<div class="store-panel">
        <div class="store-head"><b>🏪 MERCADINHO 24H</b> <span>Caixa: <b>${UI.money(G.money)}</b></span>${sale ? '<span class="sale">LIQUIDAÇÃO −30%</span>' : ''}</div>
        <div class="store-grid">${G.store.items.map((id, i) => {
        const it = META.ITM[id]; const sold = G.store.sold.includes(i); const p = price(id);
        return `<div class="item-card ${sold ? 'sold' : ''}"><div class="ico">${it.emoji}</div><h3>${it.name}${it.pack ? ` <small>(maço c/ ${it.pack})</small>` : ''}</h3><p>${it.desc}</p>
            ${it.warn ? `<div class="warn">${it.warn}</div>` : ''}
            <div class="tag">${it.use === 'casino' ? '🎰 cassino' : it.use === 'repair' ? '🔧 conserto' : it.use === 'day' ? '☀️ de dia' : it.use === 'passive' ? '🧿 amuleto' : '✨ qualquer hora'}</div>
            <button class="btn ${sold ? '' : 'green'}" data-buy="${i}" ${sold || p >= G.money ? 'disabled' : ''} style="font-size:15px;padding:6px 14px">${sold ? 'ESGOTADO' : UI.money(p)}</button></div>`;
      }).join('')}</div>
        <div class="store-foot"><button class="btn purple" id="st-roll" ${rc >= G.money ? 'disabled' : ''}>🔄 Pedir estoque novo (${UI.money(rc)})</button><button class="btn" id="st-bag">🎒 Mochila</button><button class="btn red" id="st-exit">Sair da lojinha</button></div></div>`;
      el.querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => {
        const i = +b.dataset.buy, id = G.store.items[i], p = price(id);
        if (G.store.sold.includes(i) || p >= G.money) return;
        GAME.addMoney(-p, true); G.store.sold.push(i);
        const it = META.ITM[id];
        addItem(id, it.pack || 1); META.bump('itemsBought');
        AUDIO.sfx('cash');
        render();
        VN.speaker = tati;
        if (it.smoke) await VN.say('Tati', 'Documento? ...Tá, tá. Mas fumar aqui dentro NEM PENSAR, hein. Só lá no cassino. E isso faz mal, tá?', { expr: 'worried' });
        else if (Math.random() < .5) await VN.say('Tati', pick([`${it.name}? Boa escolha!`, 'Quer sacolinha? É 10 centavos. Brincadeira.', 'Esse aí sai muito, hein!', 'Obrigada pela preferência~']), { expr: 'happy' });
        VN.hide();
      });
      el.querySelector('#st-roll').onclick = async () => {
        const c = 15 + G.store.rerolls * 10; if (c >= G.money) return;
        GAME.addMoney(-c, true); G.store.rerolls++; G.store.items = META.rollStore(slots); G.store.sold = [];
        AUDIO.sfx('shuffle'); render();
        VN.speaker = tati; await VN.say('Tati', 'Peraí que vou buscar lá no fundo... Pronto, estoque novinho!', { expr: 'smile' }); VN.hide();
      };
      el.querySelector('#st-bag').onclick = () => openBag(() => render());
      el.querySelector('#st-exit').onclick = async () => {
        AUDIO.sfx('close'); el.classList.add('hidden');
        VN.speaker = tati; await VN.say('Tati', pick(['Valeu! Volta sempre!', 'Tchau! Não esquece de pagar o aluguel, hein.', 'Até mais! Boa sorte hoje~']), { expr: 'smile' }); VN.hide();
        VN.speaker = null;
        onLeave && onLeave();
      };
      el.classList.remove('hidden');
    };
    render();
  }

  // ---------- fim do dia ----------
  async function endDay() {
    G.hour = Math.max(G.hour, 18.5); SHOP.setTime(19.6); updateHUD();
    VN.hide();
    const rent = rentFor(G.day);
    GAME.addMoney(-rent, true); G.log.rent += rent;
    let interest = 0;
    if (mod('interest') > 0 && G.money > 0) { interest = Math.min(500, Math.round(G.money * mod('interest'))); GAME.addMoney(interest, true); }
    if (G.dayQuality.length && G.dayQuality.every(q => q >= 90)) META.bump('cleanDays');
    META.clear('day');
    AUDIO.sfx(G.money > 0 ? 'cash' : 'fail');
    const net = G.log.income - G.log.parts - G.log.rent + interest;
    const s = UI.screen(`<div class="card">
      <h2>Fim do Dia ${G.day}</h2>
      <table class="sum">
        <tr><td>Consertos (com gorjetas)</td><td class="pos">+ ${UI.money(G.log.income)}</td></tr>
        <tr><td>Peças e indenizações</td><td class="negv">− ${UI.money(G.log.parts)}</td></tr>
        <tr><td>Aluguel e contas</td><td class="negv">− ${UI.money(G.log.rent)}</td></tr>
        ${interest ? `<tr><td>Rendimento 📈</td><td class="pos">+ ${UI.money(interest)}</td></tr>` : ''}
        <tr><td><b>Saldo do dia</b></td><td class="${net >= 0 ? 'pos' : 'negv'}">${net >= 0 ? '+' : '−'} ${UI.money(Math.abs(net))}</td></tr>
        <tr><td><b>Caixa agora</b></td><td>${UI.money(G.money)}</td></tr>
      </table>
      <p>🎯 Missão: ${G.mission.txt} — ${G.mission.done ? '<b class="pos">cumprida!</b>' : `<span class="negv">${Math.min(G.mission.v, G.mission.goal)}/${G.mission.goal}</span>`}</p>
      <p style="font-size:14px">Amanhã o aluguel será <b>${UI.money(rentFor(G.day + 1))}</b>.</p>
      <button class="btn big" id="e-go">Continuar</button></div>`);
    await new Promise(r => s.querySelector('#e-go').onclick = r);
    AUDIO.sfx('click'); UI.closeScreen();
    if (checkBroke('O aluguel levou tudo o que você tinha...')) return;
    if (G.money >= GOAL && !G.won) { G.won = true; return victory(); }
    nightChoiceOrDay(false);
  }

  function nightChoiceOrDay(fromSave) {
    if (fromSave && G.nightPending === false) { startDay(); return; }
    G.nightPending = true; saveGame();
    ENGINE.use('shop'); SHOP.setTime(21); SHOP.hideCustomer();
    AUDIO.music('night'); hud(true); updateHUD();
    const s = UI.screen(`<div class="card" style="max-width:900px">
      <h2>🌙 A loja fechou. O que fazer esta noite?</h2>
      <p>Caixa: <b>${UI.money(G.money)}</b> · Nível ${G.level} · ${G.upgrades.length} melhorias</p>
      <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:12px">
        <div class="big-choice casino" id="n-cas"><span class="em">🎰</span>Ir ao Cassino<small>Caça-níqueis, roleta, raspadinha, Mega-Sorte... dá pra apostar TUDO. Único lugar onde dá pra fumar.</small></div>
        <div class="big-choice upg" id="n-upg"><span class="em">🛠️</span>Loja de Melhorias<small>4 melhorias sorteadas das 50 + peças em estoque.</small></div>
      </div>
      <p style="font-size:13px;opacity:.75;margin-top:14px">Só dá tempo de uma dessas por noite. A lojinha da esquina não conta.</p>
      <button class="btn purple" id="n-store" style="font-size:15px">🏪 Lojinha da esquina</button>
      <button class="btn" id="n-sleep" style="font-size:15px;background:#6c8cff;box-shadow:0 4px 0 #3a0ca3,0 0 0 3px #6c8cff">😴 Só dormir</button>
    </div>`, 'dim');
    s.querySelector('#n-cas').onclick = () => { AUDIO.sfx('confirm'); UI.closeScreen(); goCasino(); };
    s.querySelector('#n-upg').onclick = () => { AUDIO.sfx('confirm'); upgradeShop(); };
    s.querySelector('#n-store').onclick = () => { AUDIO.sfx('confirm'); visitStore(() => nightChoiceOrDay(false)); };
    s.querySelector('#n-sleep').onclick = () => { AUDIO.sfx('click'); sleep(); };
  }

  function sleep() {
    UI.closeScreen(); closeBag();
    $('#store-ui').classList.add('hidden');
    G.nightPending = false;
    META.clear('night');
    saveGame();
    UI.flash('#1b1f4a', 1);
    startDay();
  }

  // ---------- loja de melhorias (4 das 50, com troca) ----------
  function upgradeShop() {
    if (!G.offer || G.offer.day !== G.day) G.offer = { day: G.day, list: META.rollUpgrades(4), rerolls: 0 };
    const partPrice = p => Math.max(1, Math.round(REPAIR.PARTS[p].cost * (1 - Math.min(.6, mod('stockDiscount')))));
    const render = () => {
      const rc = 20 + G.offer.rerolls * 15;
      const s = UI.screen(`<div class="card" style="max-width:1020px">
        <h2>🛠️ Loja do Seu Toninho — Melhorias & Peças</h2>
        <p>Caixa: <b>${UI.money(G.money)}</b> · <span style="font-size:13px">(não dá pra gastar até zerar — sem dinheiro, fim de jogo!)</span></p>
        <div class="grid" style="grid-template-columns:repeat(4,1fr)">${G.offer.list.map((k, i) => {
        const own = G.upgrades.includes(k), p = META.upgradePrice(k, G.day);
        return upgCard(k, { price: p, owned: own, cant: p >= G.money, anim: i });
      }).join('')}</div>
        <button class="btn purple" id="u-roll" ${rc >= G.money ? 'disabled' : ''} style="font-size:15px">🎲 Trocar ofertas (${UI.money(rc)})</button>
        <h3 style="font:700 18px var(--f-title);color:var(--pink3);margin:10px 0 6px">Peças para o estoque (mais baratas que na correria)</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">${Object.keys(G.stock).map(p => `<button class="btn ${partPrice(p) >= G.money ? '' : 'green'}" data-p="${p}" style="font-size:13px;padding:5px 10px" ${partPrice(p) >= G.money ? 'disabled' : ''}>${REPAIR.PARTS[p].name} ${UI.money(partPrice(p))}<br><small>estoque: ${G.stock[p]}</small></button>`).join('')}</div>
        <p style="font-size:13px;margin-top:10px">Suas melhorias (${G.upgrades.length}): ${G.upgrades.length ? G.upgrades.map(k => META.UPG[k].name).join(', ') : 'nenhuma ainda'}</p>
        <button class="btn big" id="u-done">Dormir 😴</button></div>`);
      s.querySelectorAll('.up-card').forEach(el => el.onclick = () => {
        const k = el.dataset.k, p = META.upgradePrice(k, G.day);
        if (G.upgrades.includes(k)) return;
        if (p >= G.money) { AUDIO.sfx('error'); UI.toast('Dinheiro insuficiente (não dá pra zerar o caixa)!', 'bad'); return; }
        GAME.addMoney(-p, true); grantUpgrade(k); render();
      });
      s.querySelector('#u-roll').onclick = () => {
        const c = 20 + G.offer.rerolls * 15; if (c >= G.money) return;
        GAME.addMoney(-c, true); G.offer.rerolls++; G.offer.list = META.rollUpgrades(4); AUDIO.sfx('shuffle'); render();
      };
      s.querySelectorAll('[data-p]').forEach(el => el.onclick = () => {
        const p = el.dataset.p, pr = partPrice(p);
        if (pr >= G.money) { AUDIO.sfx('error'); return; }
        GAME.addMoney(-pr, true); G.stock[p]++; AUDIO.sfx('cash'); render();
      });
      s.querySelector('#u-done').onclick = () => { AUDIO.sfx('click'); sleep(); };
    };
    render();
  }

  // ---------- cassino ----------
  let casinoSession = null;
  async function goCasino() {
    UI.flash('#ff2bd6', .8);
    ENGINE.use('casino');
    hud(true); updateHUD();
    CASINO.go('lobby');
    casinoSession = { start: G.money, spent: 0, won: 0 };
    G.guardUsed = false;
    META.bump('casinoNights');
    const h = await CASINO.showHostess();
    VN.speaker = h;
    const first = !G.visitedCasino; G.visitedCasino = true;
    await VN.say('Rubi', first ? 'Ora, ora... carinha nova no <i>Lucky ♥ Neon</i>. Eu sou a Rubi.' : 'Voltou, docinho? Eu sabia que voltaria~', { expr: 'smug' });
    await VN.say('Rubi', first ? 'Aqui a noite nunca acaba e a sorte... bem, a sorte escolhe. Quer apostar tudo? Ninguém vai te impedir~' : pick(['A máquina Mega está quentinha hoje...', 'Sinto cheiro de jackpot. Ou é perfume?', 'Aposte com o coração, docinho~']), { expr: 'smile' });
    if ((G.bag.cigarro || 0) + (G.bag.charuto || 0) > 0) await VN.say('Rubi', 'Vejo um maço aí na sua mochila... Aqui dentro pode fumar, viu? Dizem que dá sorte~', { expr: 'smug' });
    VN.hide();
    const nc = Math.round(mod('nightCash'));
    if (nc > 0) { GAME.addMoney(nc, true); UI.toast(`💳 Fichas VIP da casa: +${UI.money(nc)}`, 'gold'); }
    const lt = Math.round(mod('lottery'));
    for (let i = 0; i < lt; i++) { const t = new Set(); while (t.size < 6) t.add(1 + ((Math.random() * 30) | 0)); G.tickets.push([...t].sort((a, b) => a - b)); }
    if (lt) UI.toast(`🎫 ${lt} bilhete(s) grátis da Mega-Sorte!`, 'gold');
    CASINO.onResult = r => {
      casinoSession.spent += r.bet; casinoSession.won += r.win;
      G.stats.casinoWon += r.win; G.stats.casinoLost += r.bet;
      updateHUD();
      if (r.caught) { setTimeout(() => caughtCheating(), 1200); return; }
      setTimeout(() => { if (G.money <= 0) casinoBroke(); }, 900);
      renderCasinoPanel();
    };
    $('#casino-ui').classList.remove('hidden');
    renderCasinoNav('lobby');
  }
  async function caughtCheating() {
    $('#casino-ui').classList.add('hidden');
    UI.glitch(); AUDIO.sfx('error');
    const h = await CASINO.showHostess(); VN.speaker = h; CASINO.go('lobby');
    await VN.say('Rubi', 'Dado VICIADO?! No MEU cassino?! Seguranças!', { expr: 'angry' });
    const fine = Math.min(G.money - 1, 50);
    if (fine > 0) GAME.addMoney(-fine, true);
    await VN.say('', `Você foi expulso do cassino por esta noite${fine > 0 ? ` e pagou ${UI.money(fine)} de multa` : ''}.`);
    VN.hide();
    if (G.tickets.length) await lotteryDraw();
    if (checkBroke('Expulso e sem um tostão...')) return;
    sleep();
  }

  let station = 'lobby', slotIdx = 1, slotBet = null, rBet = 10, rColor = 'red';
  function renderCasinoNav(st) {
    station = st;
    const tabs = [['lobby', '🏠 Entrada'], ['slots', '🎰 Máquinas'], ['roulette', '🎡 Roleta'], ['lottery', '🎟️ Lotérica'], ['mystery', '🎁 Caixa Misteriosa']];
    $('#cs-nav').innerHTML = tabs.map(([k, t]) => `<div class="cs-tab ${k === st ? 'on' : ''}" data-s="${k}">${t}</div>`).join('') + '<div class="cs-tab" id="cs-bag">🎒 Mochila</div><div class="cs-tab exit" id="cs-exit">🚪 Ir embora</div>';
    $('#cs-nav').querySelectorAll('[data-s]').forEach(el => el.onclick = () => { AUDIO.sfx('select'); goStation(el.dataset.s); });
    $('#cs-bag').onclick = () => openBag(() => renderCasinoPanel());
    $('#cs-exit').onclick = () => leaveCasino();
    renderCasinoPanel();
  }
  function goStation(st) {
    station = st;
    if (st === 'slots') CASINO.go('slots', slotIdx); else CASINO.go(st);
    renderCasinoNav(st);
  }
  function betButtons(vals, cur, cls = '') {
    return vals.map(v => `<button class="nbtn ${v === cur ? 'sel' : ''} ${cls}" data-bet="${v}" ${v > G.money ? 'disabled' : ''}>${UI.money(v)}</button>`).join('');
  }
  function renderCasinoPanel() {
    const p = $('#cs-panel');
    const money = G.money;
    const smokeTip = (G.bag.cigarro || G.bag.charuto) ? '<div class="neon-sub">🚬 Você tem cigarro na mochila — fumar aqui dá sorte!</div>' : '';
    if (station === 'lobby') {
      p.innerHTML = `<div class="neon-title">LUCKY ♥ NEON CASSINO</div>
        <div class="neon-sub">Caixa: <b style="color:#ffd23f">${UI.money(money)}</b> · Jackpot da Mega: <b style="color:#ff2bd6">${UI.money(CASINO.jackpot)}</b> · Sorte: <b style="color:#52ff8f">+${GAME.luck().toFixed(1)}</b></div>
        <div class="bet-row"><button class="nbtn" data-go="slots">🎰 Caça-níqueis</button><button class="nbtn" data-go="roulette">🎡 Roleta</button><button class="nbtn" data-go="lottery">🎟️ Lotérica</button><button class="nbtn" data-go="mystery">🎁 Caixa Misteriosa</button></div>
        ${smokeTip}
        <div class="neon-sub">Nesta noite: apostou ${UI.money(casinoSession.spent)} · ganhou ${UI.money(casinoSession.won)}</div>`;
      p.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { AUDIO.sfx('select'); goStation(b.dataset.go); });
    } else if (station === 'slots') {
      const m = CASINO.machines[slotIdx];
      const bets = m.def.bets;
      if (!slotBet || !bets.includes(slotBet)) slotBet = bets[0];
      const free = G.freeSpins > 0;
      p.innerHTML = `<div class="bet-row">${CASINO.machines.map((mm, i) => `<button class="nbtn ${i === slotIdx ? 'sel' : ''}" data-m="${i}">${mm.def.name}</button>`).join('')}</div>
        <div class="neon-title">${m.def.name}</div>
        ${m.def.mega ? `<div class="neon-sub">JACKPOT PROGRESSIVO (3 troféus): <b style="color:#ffd23f;font-size:18px">${UI.money(CASINO.jackpot)}</b></div>` : ''}
        <div class="bet-row">Aposta: ${betButtons(bets, slotBet)}<button class="nbtn allin" id="s-all" ${money <= 0 ? 'disabled' : ''}>ALL IN (${UI.money(money)})</button></div>
        <div class="bet-row"><button class="nbtn hot" id="s-spin" style="font-size:22px;padding:10px 40px" ${slotBet > money && !free ? 'disabled' : ''}>🎰 ${free ? `GIRO GRÁTIS (${G.freeSpins})` : `GIRAR (${UI.money(slotBet)})`}</button></div>
        ${smokeTip}
        <div class="paytable">3x: 🍒 5x · ♠ 8x · 🔔 12x · 🪙 20x · 💎 50x · 🏆 250x${m.def.mega ? ' (Mega: JACKPOT!)' : ''} · 2 cerejas 2x · 2 💎 3x · 2 🏆 5x · Sorte +${GAME.luck().toFixed(1)} · <b>Espaço</b> para girar</div>`;
      p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { slotIdx = +b.dataset.m; AUDIO.sfx('select'); CASINO.go('slots', slotIdx); slotBet = null; renderCasinoPanel(); });
      p.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { slotBet = +b.dataset.bet; AUDIO.sfx('chipLay'); renderCasinoPanel(); });
      p.querySelector('#s-spin').onclick = () => doSpin(slotBet);
      p.querySelector('#s-all').onclick = () => confirmAllIn(() => doSpin(G.money, true));
    } else if (station === 'roulette') {
      const vals = [10, 25, 50, 100, 250, 500];
      if (rBet > money) rBet = vals.filter(v => v <= money).pop() || money;
      p.innerHTML = `<div class="neon-title">ROLETA NEON</div>
        <div class="neon-sub">Vermelho / Preto pagam 2x · Verde (0) paga 14x${mod('rigged') ? ' · <b style="color:#ff4d6d">🎲 dado viciado pronto...</b>' : ''}</div>
        <div class="bet-row">Aposta: ${betButtons(vals, rBet)}<button class="nbtn allin" id="r-all" ${money <= 0 ? 'disabled' : ''}>ALL IN</button></div>
        <div class="bet-row">Cor: <button class="nbtn ${rColor === 'red' ? 'sel' : ''}" data-c="red" style="border-color:#ff3b3b">🔴 Vermelho</button><button class="nbtn ${rColor === 'black' ? 'sel' : ''}" data-c="black" style="border-color:#aaa">⚫ Preto</button><button class="nbtn ${rColor === 'green' ? 'sel' : ''}" data-c="green" style="border-color:#52ff8f">🟢 Verde</button></div>
        <div class="bet-row"><button class="nbtn hot" id="r-spin" style="font-size:22px;padding:10px 40px" ${rBet > money || rBet <= 0 ? 'disabled' : ''}>🎡 GIRAR (${UI.money(rBet)})</button></div>
        <div class="neon-sub" id="r-res"></div>`;
      p.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { rBet = +b.dataset.bet; AUDIO.sfx('chipLay'); renderCasinoPanel(); });
      p.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { rColor = b.dataset.c; AUDIO.sfx('select'); renderCasinoPanel(); });
      p.querySelector('#r-spin').onclick = () => doRoulette(rBet);
      p.querySelector('#r-all').onclick = () => confirmAllIn(() => doRoulette(G.money, true));
    } else if (station === 'lottery') {
      p.innerHTML = `<div class="neon-title">LOTÉRICA DA SORTE</div>
        <div class="neon-sub">Raspadinhas: 3 valores iguais = prêmio!${mod('scratch') ? ` (+${Math.round(mod('scratch') * 100)}% nos prêmios)` : ''}</div>
        <div class="bet-row"><button class="nbtn" data-sc="5" ${5 >= money ? 'disabled' : ''}>Rosinha R$ 5</button><button class="nbtn" data-sc="20" ${20 >= money ? 'disabled' : ''}>Diamante R$ 20</button><button class="nbtn hot" data-sc="100" ${100 >= money ? 'disabled' : ''}>Milionária R$ 100</button></div>
        <div id="scratch-area"></div>
        <div class="neon-title" style="font-size:18px;margin-top:8px">MEGA-SORTE — escolha 6 de 30 (R$ 10)</div>
        <div class="neon-sub">Sorteio quando você for embora · 3 acertos R$ 20 · 4 R$ 300 · 5 R$ 5.000 · 6 = R$ 100.000!</div>
        <div class="lotto-grid" id="lotto"></div>
        <div class="bet-row"><button class="nbtn" id="l-rand">Surpresinha</button><button class="nbtn hot" id="l-buy" disabled>Comprar bilhete</button></div>
        <div id="l-tix">${G.tickets.map(t => `<span class="ticket">${t.join('-')}</span>`).join('')}</div>`;
      p.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => buyScratch(+b.dataset.sc));
      const sel = new Set();
      const lg = p.querySelector('#lotto');
      for (let i = 1; i <= 30; i++) { const b = document.createElement('button'); b.textContent = i; b.onclick = () => { if (sel.has(i)) sel.delete(i); else if (sel.size < 6) sel.add(i); b.classList.toggle('sel', sel.has(i)); AUDIO.sfx('toggle', { vol: .4 }); p.querySelector('#l-buy').disabled = sel.size !== 6 || G.money <= 10; }; lg.appendChild(b); }
      p.querySelector('#l-rand').onclick = () => { sel.clear(); lg.querySelectorAll('button').forEach(b => b.classList.remove('sel')); while (sel.size < 6) sel.add(1 + ((Math.random() * 30) | 0)); lg.querySelectorAll('button').forEach(b => b.classList.toggle('sel', sel.has(+b.textContent))); p.querySelector('#l-buy').disabled = G.money <= 10; AUDIO.sfx('shuffle'); };
      p.querySelector('#l-buy').onclick = () => {
        if (sel.size !== 6 || G.money <= 10) return;
        GAME.addMoney(-10, true); casinoSession.spent += 10; G.stats.casinoLost += 10;
        G.tickets.push([...sel].sort((a, b) => a - b)); AUDIO.sfx('card'); CASINO.vendFlash(); UI.toast('Bilhete comprado! Boa sorte~', 'gold');
        renderCasinoPanel();
      };
    } else if (station === 'mystery') {
      p.innerHTML = `<div class="neon-title">CAIXA MISTERIOSA</div>
        <div class="neon-sub">R$ 50 por caixa. Pode vir dinheiro, peças, melhorias... ou poeira.</div>
        <div class="bet-row"><button class="nbtn hot" id="b-open" style="font-size:22px;padding:10px 40px" ${50 >= money ? 'disabled' : ''}>🎁 ABRIR (R$ 50)</button></div>
        <div class="neon-sub" id="b-res" style="font-size:18px;min-height:26px"></div>`;
      p.querySelector('#b-open').onclick = async (e) => {
        if (G.money <= 50) return;
        e.target.disabled = true;
        const r = await CASINO.openBox();
        const el = $('#b-res'); if (el) el.innerHTML = r.txt;
        setTimeout(() => { if (station === 'mystery') { const b = $('#b-open'); if (b) b.disabled = G.money <= 50; const t = $('#b-res'); if (t) t.innerHTML = r.txt; } }, 50);
      };
    }
  }
  let busy = false;
  async function doSpin(bet, allIn) {
    const free = G.freeSpins > 0 && !allIn;
    if (busy || bet <= 0 || (!free && bet > G.money)) return;
    busy = true;
    G.allInPending = !!allIn;
    const m = CASINO.machines[slotIdx];
    await CASINO.spinSlot(m, bet);
    busy = false;
    if (G.money > 0) renderCasinoPanel();
  }
  async function doRoulette(bet, allIn) {
    if (busy || bet <= 0 || bet > G.money) return;
    busy = true;
    G.allInPending = !!allIn;
    const btn = $('#r-spin'); if (btn) btn.disabled = true;
    const r = await CASINO.spinRoulette(rColor, bet);
    busy = false;
    const names = { red: 'VERMELHO', black: 'PRETO', green: 'VERDE' };
    if (r) setTimeout(() => { const el = $('#r-res'); if (el) el.innerHTML = `Deu <b>${r.n} ${names[r.col]}</b> — ${r.win ? `<b style="color:#52ff8f">ganhou ${UI.money(r.win)}!</b>` : 'perdeu...'}`; }, 60);
  }
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && ENGINE.active === CASINO && station === 'slots' && $('#vn').classList.contains('hidden') && $('#screen').classList.contains('hidden') && $('#bag').classList.contains('hidden')) { e.preventDefault(); doSpin(slotBet); }
  });

  async function confirmAllIn(fn) {
    if (busy) return;
    UI.glitch();
    const h = await CASINO.showHostess();
    VN.speaker = h;
    await VN.say('Rubi', `Tudo? Todos os seus <b>${UI.money(G.money)}</b>? ...Se perder, <i>acabou pra você</i>, docinho~`, { expr: 'smug' });
    const ch = await VN.choose([{ label: '💀 SIM! APOSTAR TUDO!', value: 'y' }, { label: 'Melhor não...', value: 'n' }]);
    if (ch === 'y') { await VN.say('Rubi', 'Hihi~ Eu adoro gente corajosa.', { expr: 'happy' }); VN.hide(); UI.glitch(); fn(); }
    else { await VN.say('Rubi', 'Que sem graça~', { expr: 'sad' }); VN.hide(); }
  }

  // raspadinha
  function buyScratch(price) {
    if (price >= G.money || busy) return;
    GAME.addMoney(-price, true); casinoSession.spent += price; G.stats.casinoLost += price;
    CASINO.vendFlash();
    const mult = price / 5;
    const prizes = [[5, .2], [10, .1], [25, .04], [100, .008], [1000, .0005]];
    let r = Math.random(), win = 0;
    for (const [v, pr] of prizes) { r -= pr; if (r <= 0) { win = v * mult; break; } }
    const pool = [5, 10, 25, 100, 1000].map(v => v * mult);
    let cells = [];
    if (win) { cells = [win, win, win]; const others = pool.filter(v => v !== win); while (cells.length < 6) { const v = pick(others); if (cells.filter(x => x === v).length < 2) cells.push(v); } }
    else { while (cells.length < 6) { const v = pick(pool); if (cells.filter(x => x === v).length < 2) cells.push(v); } }
    cells.sort(() => Math.random() - .5);
    const bonus = 1 + mod('scratch');
    const area = $('#scratch-area');
    area.innerHTML = `<div class="scratch-wrap"><div class="scratch-grid">${cells.map(v => `<div class="${win && v === win ? 'win' : ''}">R$${v >= 1000 ? (v / 1000) + 'k' : v}</div>`).join('')}</div><canvas width="360" height="240"></canvas></div>
      <div class="bet-row"><button class="nbtn" id="sc-all">Raspar tudo</button></div>`;
    const cv = area.querySelector('canvas'), g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 360, 240); gr.addColorStop(0, '#c0c0c8'); gr.addColorStop(.5, '#f0f0f5'); gr.addColorStop(1, '#a8a8b0');
    g.fillStyle = gr; g.fillRect(0, 0, 360, 240);
    g.fillStyle = '#7b2ff7'; g.font = 'bold 34px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('RASPE AQUI ♥', 180, 110);
    g.font = 'bold 16px sans-serif'; g.fillText(price === 100 ? 'MILIONÁRIA' : price === 20 ? 'DIAMANTE' : 'ROSINHA', 180, 145);
    let done = false, down = false, n = 0;
    const reveal = () => {
      if (done) return; done = true;
      g.clearRect(0, 0, 360, 240);
      if (win) {
        const w = Math.round(win * bonus);
        GAME.addMoney(w, true); casinoSession.won += w; G.stats.casinoWon += w; META.bump('scratchWins');
        AUDIO.sfx(w >= 100 ? 'bigWin' : 'win'); CASINO.celebrate(null, w >= 100 ? 3 : 1); UI.toast(`Raspadinha premiada: <b>${UI.money(w)}</b>!`, 'gold'); if (w >= 500) UI.bigText('PREMIADA!!');
      }
      else { AUDIO.sfx('loseSmall'); }
      updateHUD();
      setTimeout(() => { if (G.money <= 0) casinoBroke(); }, 600);
    };
    const scratchAt = (x, y) => { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; if (++n % 6 === 0) { AUDIO.sfx('scratch', { vol: .3 }); const d = g.getImageData(0, 0, 360, 240).data; let c = 0; for (let i = 3; i < d.length; i += 64) if (d[i] === 0) c++; if (c / (d.length / 64) > .6) reveal(); } };
    cv.onpointerdown = e => { down = true; scratchAt(e.offsetX, e.offsetY); };
    cv.onpointermove = e => { if (down) scratchAt(e.offsetX, e.offsetY); };
    window.addEventListener('pointerup', () => down = false);
    area.querySelector('#sc-all').onclick = reveal;
    area.parentElement.querySelectorAll('[data-sc]').forEach(b => b.disabled = +b.dataset.sc >= G.money);
  }

  async function leaveCasino() {
    if (busy) return;
    AUDIO.sfx('close'); closeBag();
    $('#casino-ui').classList.add('hidden');
    const h = await CASINO.showHostess(); VN.speaker = h; CASINO.go('lobby');
    const net = casinoSession.won - casinoSession.spent;
    await VN.say('Rubi', net > 0 ? `Saindo no lucro de ${UI.money(net)}? Que sorte a sua... volte amanhã, tá?` : net < 0 ? 'Já vai? A sorte muda, docinho. Volte amanhã~' : 'Nem apostou direito! Covarde~', { expr: net > 0 ? 'surprised' : 'smug' });
    VN.hide();
    if (G.tickets.length) await lotteryDraw();
    G.log.casino = casinoSession.won - casinoSession.spent;
    if (checkBroke('A noite no cassino levou tudo...')) return;
    sleep();
  }

  async function lotteryDraw() {
    const drawn = []; while (drawn.length < 6) { const n = 1 + ((Math.random() * 30) | 0); if (!drawn.includes(n)) drawn.push(n); }
    const s = UI.screen(`<div class="card" style="background:#12001d;color:#fff;border-color:#ff2bd6">
      <h2 style="color:#ffd23f">🎱 SORTEIO DA MEGA-SORTE</h2><div id="balls" style="min-height:64px"></div><div id="tixr"></div>
      <button class="btn gold" id="ld-ok" style="display:none">Continuar</button></div>`, 'dim');
    AUDIO.music('casino');
    for (const n of drawn) { await wait(0.7); AUDIO.sfx('ball'); s.querySelector('#balls').insertAdjacentHTML('beforeend', `<span class="ball">${n}</span>`); }
    let total = 0, bestHits = 0;
    const pay = { 3: 20, 4: 300, 5: 5000, 6: 100000 };
    s.querySelector('#tixr').innerHTML = G.tickets.map(t => { const hits = t.filter(n => drawn.includes(n)).length; bestHits = Math.max(bestHits, hits); const w = pay[hits] || 0; total += w; return `<div style="margin:6px">${t.map(n => `<span class="ball ${drawn.includes(n) ? 'hit' : ''}" style="width:36px;height:36px;font-size:15px">${n}</span>`).join('')} → ${hits} acertos ${w ? `<b style="color:#52ff8f">${UI.money(w)}</b>` : ''}</div>`; }).join('');
    META.bump('megaHits', bestHits, 'max');
    if (total) { GAME.addMoney(total, true); if (casinoSession) casinoSession.won += total; G.stats.casinoWon += total; AUDIO.sfx(total >= 5000 ? 'jackpot' : 'win'); if (total >= 300) UI.bigText('GANHOU!'); }
    else AUDIO.sfx('lose');
    G.tickets = [];
    s.querySelector('#ld-ok').style.display = '';
    await new Promise(r => s.querySelector('#ld-ok').onclick = r);
    UI.closeScreen();
  }

  function casinoBroke() {
    if (G.money > 0 || G.dead) return;
    if (trySecondChance()) { renderCasinoPanel(); return; }
    $('#casino-ui').classList.add('hidden');
    gameOver('Você apostou tudo... e a casa sempre vence.');
  }

  // ---------- fim de jogo ----------
  function trySecondChance() {
    if (mod('secondChance') && !G.secondUsed) {
      G.secondUsed = true; G.money = 80; updateHUD(80);
      AUDIO.sfx('victory'); UI.bigText('SEGUNDA CHANCE!', '#ff9f1c');
      UI.toast('🔥 Relíquia <b>Segunda chance</b>: você recebeu R$ 80 e continua no jogo!', 'gold');
      return true;
    }
    return false;
  }
  function checkBroke(msg) {
    if (G.money <= 0) { if (trySecondChance()) return false; gameOver(msg); return true; }
    return false;
  }
  async function gameOver(msg) {
    if (G.dead) return; G.dead = true;
    localStorage.removeItem('ddcc_save');
    META.bump('bankrupt');
    closeBag(); $('#store-ui').classList.add('hidden');
    AUDIO.music(null);
    UI.glitch(); UI.shake();
    AUDIO.sfx('gameover');
    await wait(0.6);
    $('#casino-ui').classList.add('hidden');
    VN.hide();
    const next = META.ACH.filter(a => !META.meta.ach.includes(a.id)).map(a => ({ a, k: Math.min(1, (META.meta.stats[a.stat] || 0) / a.goal) })).sort((x, y) => y.k - x.k).slice(0, 3);
    const s = UI.screen(`<div class="card" style="background:#1a0010;color:#fff;border-color:#ff4d6d">
      <h1 style="color:#ff4d6d;text-shadow:0 3px 0 #5a0020">FALIU!</h1>
      <p style="font-size:20px">${msg}</p>
      <p>O dinheiro acabou. A loja da tia Neide fechou as portas.</p>
      <table class="sum" style="color:#fff"><tr><td>Dias sobrevividos</td><td>${G.day}</td></tr><tr><td>Nível</td><td>${G.level} (${G.upgrades.length} melhorias)</td></tr><tr><td>Consertos feitos</td><td>${G.stats.repairs} (${G.stats.perfect} perfeitos)</td></tr>
      <tr><td>Maior caixa</td><td>${UI.money(G.stats.best)}</td></tr><tr><td>Ganho no cassino</td><td>${UI.money(G.stats.casinoWon)}</td></tr><tr><td>Apostado no cassino</td><td>${UI.money(G.stats.casinoLost)}</td></tr></table>
      <p style="font-size:15px">🏆 Relíquias permanentes: <b>${META.meta.ach.length}/${META.ACH.length}</b> — elas continuam na próxima partida!</p>
      ${next.length ? `<p style="font-size:13px;opacity:.9">Quase lá: ${next.map(x => `${x.a.name} (${Math.round(x.k * 100)}%)`).join(' · ')}</p>` : ''}
      <button class="btn red big" id="go-again">Tentar de novo</button></div>`, 'dim');
    s.querySelector('#go-again').onclick = () => { AUDIO.sfx('confirm'); G = null; titleScreen(); };
  }

  async function victory() {
    AUDIO.sfx('victory');
    UI.bigText('VITÓRIA!');
    const s = UI.screen(`<div class="card"><h1>🏆 VOCÊ CONSEGUIU!</h1>
      <p>Com <b>${UI.money(G.money)}</b> no caixa, você comprou o prédio da loja! Chega de aluguel... pelo menos na teoria.</p>
      <p>Dias: ${G.day} · Consertos: ${G.stats.repairs} · Nível ${G.level}</p>
      <button class="btn green big" id="v-cont">Continuar jogando</button> <button class="btn" id="v-menu">Menu</button></div>`);
    s.querySelector('#v-cont').onclick = () => { AUDIO.sfx('confirm'); nightChoiceOrDay(false); };
    s.querySelector('#v-menu').onclick = () => { localStorage.removeItem('ddcc_save'); titleScreen(); };
  }

  // ---------- salvar ----------
  function saveGame() { try { if (G && !G.dead) localStorage.setItem('ddcc_save', JSON.stringify(G)); } catch (e) { } }
  function loadSave() { try { const s = JSON.parse(localStorage.getItem('ddcc_save')); return s && s.day ? s : null; } catch (e) { return null; } }

  window.addEventListener('pointerdown', () => AUDIO.retry(), { once: false });
  boot();
})();
