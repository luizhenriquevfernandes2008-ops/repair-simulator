// HISTÓRIA — "A herança da Tia Neide": cutscenes, capítulos, o rival Vitor Valadares e a
// Guerra do Bairro, o aprendiz, a reforma da loja, os clientes lendários e os finais com escolha.
(function () {
  const $ = s => document.querySelector(s);
  const pick = a => a[(Math.random() * a.length) | 0];
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const G = () => GAME.state;
  const mod = k => META.mod(k);
  const money = v => UI.money(v);
  const FINAL_DAY = 25, GOAL = 10000;
  const S = CHARS.STORY;

  // =====================================================================
  // CUTSCENES (letterbox, cartão de capítulo, carta, chamada de vídeo)
  // =====================================================================
  const CUT = {
    active: false,
    async begin() {
      CUT.active = true; VN.hide(); UI.closeScreen();
      $('#hud').classList.add('hidden'); $('#hud-buffs').classList.add('hidden');
      $('#letterbox').classList.add('on'); $('#cut-skip').classList.remove('hidden');
      await wait(.35);
    },
    async end() {
      VN.hide(); $('#letterbox').classList.remove('on'); $('#cut-skip').classList.add('hidden');
      VN.setSkip && VN.setSkip(false);
      $('#hud').classList.remove('hidden'); $('#hud-buffs').classList.remove('hidden');
      CUT.active = false; await wait(.3);
    },
    card(top, title, sub = '') {
      return new Promise(res => {
        const d = document.createElement('div'); d.className = 'chapter-card';
        d.innerHTML = `<small>${top}</small><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}`;
        document.body.appendChild(d); AUDIO.sfx('bong');
        let done = false; const fin = () => { if (done) return; done = true; d.classList.add('out'); setTimeout(() => { d.remove(); res(); }, 600); };
        setTimeout(fin, 3200); d.onclick = fin;
      });
    },
    fade(color = '#000', dur = .6) {
      return new Promise(res => { const f = document.createElement('div'); f.className = 'cut-fade'; f.style.background = color; f.style.animationDuration = dur * 2 + 's'; document.body.appendChild(f); setTimeout(res, dur * 1000); setTimeout(() => f.remove(), dur * 2000); });
    },
    letter(html) {
      return new Promise(res => {
        const d = document.createElement('div'); d.className = 'cut-letter'; d.innerHTML = `<div class="paper-letter">${html}<div class="letter-next">clique para continuar ▼</div></div>`;
        document.body.appendChild(d); AUDIO.sfx('card');
        d.onclick = () => { d.remove(); res(); };
      });
    },
    call(on, name) {
      let f = $('#call-frame');
      if (on && !f) { f = document.createElement('div'); f.id = 'call-frame'; f.innerHTML = `<div class="call-top">📱 Chamada de vídeo · <b>${name}</b> <span class="rec">● AO VIVO</span></div>`; document.body.appendChild(f); AUDIO.sfx('beep'); }
      if (!on && f) f.remove();
    },
    say(sp, name, text, expr) { VN.speaker = sp || null; return VN.say(name || '', text, expr ? { expr } : {}); },
    narr(text) { VN.speaker = null; return VN.say('', text); },
    choose(opts) { return VN.choose(opts); },
  };

  // =====================================================================
  // RIVAL — Guerra do Bairro
  // =====================================================================
  function rs() { const g = G(); if (!g.rival) g.rival = { active: false, share: .62, evidence: 0, clues: [], counterNight: 0, action: null, defeated: false, ally: false, promoDay: 0 }; return g.rival; }
  const ACTIONS = [
    { id: 'promo', txt: 'ConsertaJá anuncia "TUDO PELA METADE DO PREÇO"', share: -.05 },
    { id: 'influ', txt: 'ConsertaJá contrata influencer com 2 milhões de seguidores', share: -.06 },
    { id: 'fake', txt: 'Avaliações falsas contra sua loja aparecem no Guia do Bairro', share: -.03, rep: -.15 },
    { id: 'rouba', txt: 'Vitor oferece cupom de desconto pros seus clientes fiéis', cust: -1, share: -.02 },
    { id: 'pecas', txt: 'ConsertaJá compra o estoque do fornecedor: peças 30% mais caras hoje', parts: 1.3 },
    { id: 'tropeco', txt: 'Cliente viraliza reclamando da ConsertaJá: "trocaram minha tela por uma falsa!"', share: .04, good: 1 },
    { id: 'lotada', txt: 'ConsertaJá lota e a fila transborda pra sua calçada', share: .02, cust: 1, good: 1 },
    { id: 'viagem', txt: 'Vitor viajou pra uma convenção de franquias. Paz no bairro... por hoje.', share: 0, good: 1 },
    { id: 'outdoor', txt: 'Outdoor gigante da ConsertaJá aparece na esquina', share: -.04 },
  ];
  const RIVAL = {
    state: rs,
    active() { const r = G() && G().rival; return !!(r && r.active && !r.defeated && !r.ally); },
    share(d) {
      const r = rs(); if (!RIVAL.active()) return;
      if (d < 0) d *= (1 - Math.min(.7, mod('rivalResist')));
      r.share = Math.max(.05, Math.min(.95, +(r.share + d).toFixed(3)));
      if (d) UI.toast(`⚔️ Bairro: <b>${Math.round(r.share * 100)}%</b> ${d > 0 ? '▲' : '▼'} ${Math.round(Math.abs(d) * 100)}%`, d > 0 ? 'good' : 'bad');
      GAME.refreshHUD();
    },
    evidence(n, why) {
      const r = rs(); r.evidence += n; if (why) r.clues.push(why);
      AUDIO.sfx('eventGood'); UI.toast(`🔎 <b>Prova contra a ConsertaJá!</b> (${r.evidence}/3)<br><small>${why || ''}</small>`, 'gold');
      META.bump('evidence', r.evidence, 'max');
    },
    rivalRep() { return Math.min(4.6, 3.1 + G().day * .045); },
    // efeito diário (jornal)
    dailyAction() {
      const g = G(), r = rs(); if (!RIVAL.active()) { r.action = null; return null; }
      const drift = (g.rep - RIVAL.rivalRep()) * .012 + mod('shareDaily');
      r.share = Math.max(.05, Math.min(.95, r.share + drift));
      const a = r.nextKnown || pick(ACTIONS); r.nextKnown = null; r.action = a;
      if (a.share) RIVAL.share(a.share);
      if (a.rep) GAME.repChange(a.rep * (1 - Math.min(.7, mod('rivalResist'))));
      return a;
    },
    dayMods() {
      if (!RIVAL.active()) return { cust: 0, pay: 1, parts: 1 };
      const r = rs(), a = r.action || {};
      let cust = r.share >= .75 ? 1 : r.share >= .5 ? 0 : r.share >= .3 ? -1 : -2;
      cust += a.cust || 0;
      if (r.promoDay === G().day) cust += 1;
      return { cust, pay: (.92 + r.share * .16) * (r.promoDay === G().day ? .9 : 1), parts: a.parts || 1 };
    },
    // ações à noite (1 por noite)
    openCounter(onClose) {
      const g = G(), r = rs();
      const used = r.counterNight === g.day;
      const opts = [
        { id: 'panfleto', ico: '📄', name: 'Panfletagem no bairro', cost: r5(50 + g.day * 4), txt: '+4% do bairro' },
        { id: 'radio', ico: '📻', name: 'Anúncio na Rádio Bairro FM', cost: r5(140 + g.day * 8), txt: '+8% do bairro' },
        { id: 'promo', ico: '🏷️', name: 'Promoção relâmpago amanhã', cost: 0, txt: '+1 cliente e +3% do bairro, mas pagamentos −10% amanhã' },
        { id: 'espiar', ico: '🕵️', name: 'Espiar a ConsertaJá', cost: 30, txt: 'Pode achar provas... ou ser pego' },
        { id: 'festa', ico: '🎉', name: 'Festa na calçada', cost: r5(350 + g.day * 10), txt: '+12% do bairro e +reputação (precisa de loja Estilosa)', need: () => DECOR.style() >= 35 },
      ];
      const s = UI.screen(`<div class="card" style="max-width:860px">
        <h2>📣 Contra-ataque à ConsertaJá</h2>
        <div class="share-big"><span>Você</span><div class="share-bar"><div style="width:${r.share * 100}%"></div></div><span>Vitor</span></div>
        <p>Sua fatia do bairro: <b>${Math.round(r.share * 100)}%</b> · Provas: <b>${r.evidence}/3</b> · Caixa: <b>${money(g.money)}</b></p>
        ${used ? '<p class="negv">Você já fez uma ação hoje. Volte amanhã à noite.</p>' : ''}
        <div class="counter-grid">${opts.map(o => { const ok = !used && o.cost < g.money && (!o.need || o.need()); return `<button class="counter-card" data-c="${o.id}" ${ok ? '' : 'disabled'}><span class="ico">${o.ico}</span><b>${o.name}</b><small>${o.txt}</small><em>${o.cost ? money(o.cost) : 'grátis'}</em></button>`; }).join('')}</div>
        <button class="btn big" id="ct-close">Voltar</button></div>`, 'dim');
      s.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
        const o = opts.find(x => x.id === b.dataset.c); if (!o || used) return;
        GAME.addMoney(-o.cost, true); r.counterNight = g.day; UI.closeScreen();
        if (o.id === 'panfleto') { AUDIO.sfx('card'); RIVAL.share(.04); }
        else if (o.id === 'radio') { AUDIO.sfx('win'); RIVAL.share(.08); }
        else if (o.id === 'promo') { r.promoDay = g.day + 1; RIVAL.share(.03); UI.toast('🏷️ Promoção marcada pra amanhã!', 'good'); }
        else if (o.id === 'festa') { AUDIO.sfx('bigWin'); RIVAL.share(.12); GAME.repChange(.3); }
        else if (o.id === 'espiar') {
          const x = Math.random();
          if (x < .45 && rs().ch4) RIVAL.evidence(1, pick(['Você fotografou caixas de "peças originais" com etiqueta de falsificação.', 'Você achou no lixo da ConsertaJá notas fiscais com valores adulterados.', 'Você ouviu o Vitor mandando trocar telas originais por paralelas.']));
          else if (x < .75) { const a = pick(ACTIONS.filter(a => !a.good)); r.nextKnown = a; UI.toast(`🕵️ Você descobriu o plano do Vitor pra amanhã: <b>${a.txt}</b>. Pelo menos não vai ser pego de surpresa (efeito reduzido).`, 'good'); r.nextKnown = Object.assign({}, a, { share: (a.share || 0) / 2, rep: (a.rep || 0) / 2 }); }
          else { AUDIO.sfx('alarm'); GAME.repChange(-.1); RIVAL.share(-.02); UI.toast('🚨 O segurança da ConsertaJá te pegou espiando! Que vergonha... (−reputação)', 'bad'); }
        }
        await wait(.3); RIVAL.openCounter(onClose);
      });
      s.querySelector('#ct-close').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); onClose && onClose(); };
    },
    // Duelo de Consertos
    duel(label = 'DUELO DE CONSERTOS') {
      return new Promise(resolve => {
        const g = G(); const c = pick(CHARS.ROSTER);
        const job = GAME.makeJob(c); job.price = 0; job.duel = true;
        const rivalScore = Math.min(97, Math.round(76 + Math.random() * 14 + g.day * .3 - rs().evidence * 2));
        UI.bigText(label, '#29f3ff'); AUDIO.sfx('jackpot');
        UI.toast(`⚔️ Nota do Vitor: <b>${rivalScore}</b>. Seja rápido e perfeito!`, 'gold');
        VN.hide(); ENGINE.use('repair');
        REPAIR.start(job, async res => {
          const speed = res.ok ? (res.time <= res.par ? 10 : res.time > res.par * 1.6 ? -10 : 0) : 0;
          const mine = res.ok ? Math.max(0, Math.min(100, res.integ + speed)) : 0;
          resolve({ win: mine >= rivalScore, mine, rival: rivalScore, res });
        });
      });
    },
  };
  window.RIVAL = RIVAL;

  // =====================================================================
  // EQUIPE — o aprendiz
  // =====================================================================
  const CANDS = {
    leo: { id: 'leo', skill: 55, salary: 40, pitch: 'Estudo engenharia! Sou bom de teoria... meio desastrado na prática. Cobro R$ 40 por dia.' },
    rafa: { id: 'rafa', skill: 65, salary: 55, pitch: 'De dia faço entrega, mas preciso de um bico. Sou rápido e não reclamo! R$ 55 por dia.' },
    nina: { id: 'nina', skill: 82, salary: 95, pitch: 'Tenho doutorado em explodir coisas. Digo, em eletrônica. R$ 95 por dia. Sem negociação.', risk: .04 },
  };
  const TEAM = {
    get hired() { const g = G(); return g && g.team && g.team.hired ? g.team : null; },
    hire(id) { const c = CANDS[id], ch = CHARS.ROSTER.find(x => x.id === id); G().team = { hired: id, name: ch.name, skill: c.skill, salary: c.salary, risk: c.risk || 0, jobsDay: 0, jobs: 0, day: 0 }; META.bump('hired'); },
    jobsLeft() { const t = TEAM.hired; if (!t) return 0; if (t.day !== G().day) { t.day = G().day; t.jobsDay = 0; } return 1 + Math.round(mod('apprenticeJobs')) + (t.skill >= 85 ? 1 : 0) - t.jobsDay; },
    // o aprendiz faz o conserto sozinho (resultado instantâneo)
    delegate(job) {
      const t = TEAM.hired; t.jobsDay++; t.jobs++;
      const F = REPAIR.FAULTS[job.fault];
      if (F.part && !GAME.consumePart(F.part, job)) return { ok: false, reason: 'noparts' };
      if (Math.random() < (t.risk || 0) + (t.skill < 60 ? .05 : 0)) return { ok: false, reason: 'destroyed', integ: 0 };
      const g1 = (Math.random() + Math.random() + Math.random() - 1.5) * 16;
      const integ = Math.max(30, Math.min(100, Math.round(t.skill + g1)));
      t.skill = Math.min(96, +(t.skill + (integ >= 80 ? 1.3 : .6) * (1 + mod('apprenticeXp'))).toFixed(1));
      return { ok: true, integ, time: 1.2, par: 1, firstTry: true, nodmg: integ >= 95, apprentice: true };
    },
    openManage(onClose) {
      const g = G(), t = TEAM.hired;
      const s = UI.screen(`<div class="card" style="max-width:720px">
        <h2>🧑‍🔧 Equipe</h2>
        ${t ? `<p><b>${t.name}</b> — habilidade <b>${Math.round(t.skill)}</b>/100 · salário ${money(t.salary)}/dia · ${t.jobs} consertos feitos</p>
          <div class="bar" style="max-width:420px;margin:0 auto 10px"><div class="bar-fill good" style="width:${t.skill}%"></div></div>
          <p style="font-size:14px">Pode assumir <b>${1 + Math.round(mod('apprenticeJobs')) + (t.skill >= 85 ? 1 : 0)}</b> cliente(s) por dia. Quanto maior a habilidade, melhor o conserto (e acima de 85 ele pega um cliente a mais).</p>
          <button class="btn green" id="tm-train" ${t.trainDay === g.day || g.money <= 180 ? 'disabled' : ''}>📚 Curso técnico (R$ 180): +6 habilidade</button>
          <button class="btn red" id="tm-fire">Demitir</button>`
          : '<p>Você não tem aprendiz. Às vezes aparecem candidatos procurando emprego...</p>'}
        <br><button class="btn big" id="tm-close">Voltar</button></div>`, 'dim');
      const tr = s.querySelector('#tm-train'); if (tr) tr.onclick = () => { if (g.money <= 180) return; GAME.addMoney(-180, true); t.skill = Math.min(96, t.skill + 6); t.trainDay = g.day; AUDIO.sfx('buy'); TEAM.openManage(onClose); };
      const fi = s.querySelector('#tm-fire'); if (fi) fi.onclick = () => { g.team = null; AUDIO.sfx('close'); UI.toast('Aprendiz demitido.', ''); TEAM.openManage(onClose); };
      s.querySelector('#tm-close').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); onClose && onClose(); };
    },
  };
  window.TEAM = TEAM;

  // =====================================================================
  // REFORMA DA LOJA
  // =====================================================================
  const RENO = {
    LV: [null,
      { name: 'Loja da Tia Neide', mods: {} },
      { name: 'Assistência Reformada', cost: 1600, mods: { payMult: .08, calm: 5 }, txt: 'Pagamentos +8%, brigas mais calmas, papel de parede novo' },
      { name: 'Centro Técnico PRO', cost: 4200, mods: { payMult: .15, customers: 1, vipChance: .05 }, txt: '+1 cliente/dia, pagamentos +15%, VIP +5%, holofotes' },
      { name: 'Mega Assistência', cost: 9500, mods: { payMult: .25, customers: 2, vipChance: .08, tipMult: .1 }, txt: '+2 clientes/dia, pagamentos +25%, gorjetas +10%, visual de luxo' },
    ],
    level() { return (G() && G().shopLevel) || 1; },
    cost(lv) { return Math.round(RENO.LV[lv].cost * (1 - Math.min(.5, mod('renoDiscount')))); },
    open(onClose) {
      const g = G(), lv = RENO.level();
      const s = UI.screen(`<div class="card" style="max-width:820px">
        <h2>🏗️ Reforma da loja</h2>
        <p>Nível atual: <b>${lv} — ${RENO.LV[lv].name}</b> · Caixa: <b>${money(g.money)}</b></p>
        <div class="reno-list">${[2, 3, 4].map(l => { const done = lv >= l, next = l === lv + 1; const c = RENO.cost(l); return `<div class="reno ${done ? 'done' : ''}"><b>Nível ${l}: ${RENO.LV[l].name}</b><small>${RENO.LV[l].txt}</small>${done ? '<span class="cat-ok">✔ Feita</span>' : next ? `<button class="btn gold" data-l="${l}" ${c >= g.money ? 'disabled' : ''}>Reformar (${money(c)})</button>` : '<small>🔒 faça a reforma anterior</small>'}</div>`; }).join('')}</div>
        <p style="font-size:13px;opacity:.8">A reforma é permanente nesta partida e muda o visual da loja.</p>
        <button class="btn big" id="rn-close">Voltar</button></div>`, 'dim');
      s.querySelectorAll('[data-l]').forEach(b => b.onclick = async () => {
        const l = +b.dataset.l, c = RENO.cost(l); if (c >= g.money) return;
        GAME.addMoney(-c, true); g.shopLevel = l; SHOP.setLevel(l); META.bump('reno', l, 'max');
        UI.closeScreen(); AUDIO.sfx('victory'); UI.bigText('REFORMA!', '#ffd23f');
        ENGINE.use('shop'); SHOP.setTime(12);
        await wait(2.2); RENO.open(onClose);
      });
      s.querySelector('#rn-close').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); onClose && onClose(); };
    },
  };
  window.RENO = RENO;

  // =====================================================================
  // CLIENTES LENDÁRIOS (dias 5, 10, 15, 20, 30, 35...)
  // =====================================================================
  const BOSS = {
    dayHasBoss(day) { return day % 5 === 0 && day !== FINAL_DAY; },
    pick(day) { const i = Math.floor(day / 5 - 1) % CHARS.BOSSES.length; return CHARS.BOSSES[i]; },
  };
  window.BOSS = BOSS;

  // =====================================================================
  // CAPÍTULOS
  // =====================================================================
  function st() { const g = G(); if (!g.story) g.story = { seen: [], ending: null, done: false }; return g.story; }
  async function cutStreet(h = 9, shot = 'ours') { ENGINE.use('street'); STREET.clear(); STREET.setTime(h); STREET.setRival(rs().active || G().day >= 3); STREET.shot(shot); AUDIO.music(h >= 18 ? 'night' : 'title'); }
  async function cutShop(h = 10) { ENGINE.use('shop'); SHOP.setTime(h); SHOP.hideCustomer(); SHOP.clearExtras(); AUDIO.music('shop'); }

  const CH = {
    // ---------- CAPÍTULO 1 ----------
    async intro() {
      await CUT.begin();
      await cutStreet(8, 'wide'); STREET.setRival(false);
      await CUT.card('REPAIR SIMULATOR', 'Capítulo 1', 'A Herança');
      const pan = STREET.shot('ours', 4);
      await CUT.narr('Rua das Palmeiras, sete da manhã. O bairro acorda devagar: cheiro de pão, ônibus passando, um cachorro latindo longe...');
      await pan;
      await CUT.narr('Você chega com uma mochila nas costas e uma carta amassada na mão. A fachada é exatamente como a Tia Neide descreveu.');
      await CUT.letter(`<p>Meu bem,</p><p>A coluna não aguenta mais, então vou me aposentar na praia. <b>A loja agora é sua.</b></p><p>A Dona Olga, dona do prédio, vai vendê-lo no <b>dia ${FINAL_DAY}</b>. Se você juntar <b>${money(GOAL)}</b> até lá, o prédio é nosso — digo, seu!</p><p>O aluguel sobe todo dia. Não deixe o dinheiro acabar. E fique longe do cassino da esquina.</p><p>Com amor,<br><b>Tia Neide ♥</b></p><p><small>P.S.: se aparecer alguém com o sobrenome Valadares, desconfie.</small></p>`);
      const tati = await STREET.show(CHARS.CLERK, -4.6, 'ours', 5);
      await CUT.say(tati, 'Tati', 'Ei! Você deve ser da família da Dona Neide! Eu sou a Tati, do mercadinho aqui do lado.', 'happy');
      await CUT.say(tati, 'Tati', 'A loja da frente tá pra alugar faz tempo. Dizem que uma tal de "ConsertaJá" quer o ponto... gente estranha.', 'worried');
      await CUT.say(tati, 'Tati', 'Bom, boa sorte! Qualquer coisa, tô no mercadinho. Tenho de tudo: café, chiclete, raspadinha... cigarro, mas esse só pro cassino, hein!', 'smile');
      await STREET.hide(tati, 1);
      await STREET.shot('oursClose', 1.5); await CUT.fade('#fff', .5);
      await cutShop(8.5);
      const ne = await SHOP.showCustomer(S.neide);
      await CUT.say(ne, 'Tia Neide', 'Chegou! Ai, que alegria! Deixa eu te dar um abraço antes do meu ônibus!', 'happy');
      await CUT.say(ne, 'Tia Neide', 'É simples: cliente chega, você ouve com carinho, conserta caprichado e cobra direitinho. Se quiser, negocia o preço — conversando, sempre.', 'smile');
      await CUT.say(ne, 'Tia Neide', 'No fim do dia vêm o aluguel, a luz e os impostos. E se um cliente chegar nervoso... respira e conversa com calma. Com jeitinho tudo se resolve.', 'neutral');
      await CUT.say(ne, 'Tia Neide', `Agora vou pegar meu ônibus. Juízo! E lembra: <b>dia ${FINAL_DAY}</b>. A Dona Olga não espera ninguém.`, 'smile');
      await SHOP.leaveCustomer(1);
      await CUT.end();
    },
    // ---------- CAPÍTULO 2 ----------
    async rival() {
      const r = rs();
      await CUT.begin();
      await cutStreet(9, 'rival'); STREET.setRival(true);
      await CUT.card('Dia 3', 'Capítulo 2', 'O Rival');
      AUDIO.sfx('jackpot');
      await CUT.narr('Na manhã do terceiro dia, o prédio da frente amanhece de cara nova: letreiro neon, faixa de inauguração e música alta.');
      const vi = await STREET.show(S.vitor, -7, 'rival', 0);
      await CUT.say(vi, 'Vitor Valadares', 'Senhoras e senhores! A partir de hoje, a Rua das Palmeiras tem a <b>ConsertaJá EXPRESS</b>! Conserto em 15 minutos ou seu dinheiro de volta!', 'smug');
      await STREET.hide(vi); await STREET.shot('ours', 1.2);
      const v2 = await STREET.show(S.vitor, -5.2, 'ours', -5);
      await CUT.say(v2, 'Vitor Valadares', 'Então você é o herdeiro da lojinha da velha Neide. Prazer: Vitor Valadares. CEO.', 'smile');
      await CUT.say(v2, 'Vitor Valadares', `Vou ser direto: quero esse ponto. Te pago ${money(3000)} agora. Você volta pra casa e ninguém se machuca... financeiramente.`, 'smug');
      const c = await CUT.choose([{ label: 'Recusar com educação', value: 'edu' }, { label: '"Nem por 3 milhões."', value: 'nem' }, { label: 'Perguntar por que ele quer tanto esta loja', value: 'pq' }]);
      if (c === 'edu') await CUT.say(v2, 'Vitor Valadares', 'Educado. Gosto. Vai ser divertido te ver falir educadamente.', 'smug');
      else if (c === 'nem') await CUT.say(v2, 'Vitor Valadares', 'Hahaha! Brabo! Vamos ver quanto tempo dura essa marra.', 'happy');
      else { await CUT.say(v2, 'Vitor Valadares', `Porque no dia ${FINAL_DAY} a Dona Olga vende o prédio. E eu vou comprar. Com você ou sem você aqui dentro.`, 'smug'); st().knows = true; }
      await CUT.say(v2, 'Vitor Valadares', 'A partir de hoje, cada cliente que entrar aqui é um cliente a menos pra mim. Isso é guerra, vizinho.', 'angry');
      await STREET.hide(v2, 1);
      r.active = true; r.share = .62;
      await CUT.narr('⚔️ <b>Guerra do Bairro!</b> A barra "Bairro" no topo mostra quantos clientes preferem sua loja. Consertos bons e reputação alta ajudam. À noite, use o <b>📣 Contra-ataque</b>. Se a sua fatia cair muito, os clientes somem!');
      await CUT.end();
    },
    // ---------- CAPÍTULO 3 ----------
    async reforcos() {
      await CUT.begin();
      await cutShop(9);
      await CUT.card('Dia 6', 'Capítulo 3', 'Reforços');
      const ta = await SHOP.showCustomer(CHARS.CLERK);
      await CUT.say(ta, 'Tati', 'Bom dia! Nossa, que olheira! Você tá trabalhando demais. Por que não contrata um ajudante?', 'worried');
      await CUT.say(ta, 'Tati', 'Espalhei no bairro que você tava procurando. Olha, já tem gente na porta!', 'happy');
      await SHOP.leaveCustomer(1);
      const cands = ['leo', 'rafa', 'nina'];
      for (const id of cands) {
        const ch = CHARS.ROSTER.find(x => x.id === id); const sp = await SHOP.showCustomer(ch);
        await CUT.say(sp, ch.name, CANDS[id].pitch, 'smile');
        await SHOP.leaveCustomer(1);
      }
      const opt = cands.map(id => { const ch = CHARS.ROSTER.find(x => x.id === id), c = CANDS[id]; return { label: `Contratar ${ch.name}`, sub: `habilidade ${c.skill} · ${money(c.salary)}/dia${c.risk ? ' · às vezes explode coisas' : ''}`, value: id }; });
      opt.push({ label: 'Não contratar ninguém por enquanto', value: 'no' });
      const c = await CUT.choose(opt);
      if (c !== 'no') {
        TEAM.hire(c); const ch = CHARS.ROSTER.find(x => x.id === c); const sp = await SHOP.showCustomer(ch);
        await CUT.say(sp, ch.name, pick(['Uhuul! Não vou te decepcionar, chefe!', 'Obrigado! Começo agora mesmo!', 'Excelente escolha. Estatisticamente.']), 'happy');
        await SHOP.leaveCustomer(1);
        await CUT.narr(`🧑‍🔧 <b>${ch.name}</b> agora é seu aprendiz! Ao atender um cliente, use <b>"Passar pro aprendiz"</b> e ele conserta sozinho (1 por dia, mais quando melhorar). O salário sai no fim do dia. Gerencie em <b>🧑‍🔧 Equipe</b>, à noite.`);
      } else await CUT.narr('Tudo bem. Se mudar de ideia, candidatos aparecem de vez em quando.');
      await CUT.narr('🏗️ E tem mais: o Seu Toninho indicou um pedreiro. Agora você pode <b>reformar a loja</b> à noite — mais clientes, pagamentos maiores e um visual novo.');
      st().reno = true;
      await CUT.end();
    },
    // ---------- CAPÍTULO 4 ----------
    async segredo() {
      await CUT.begin();
      await cutShop(8.5);
      await CUT.card('Dia 9', 'Capítulo 4', 'O Segredo da Tia Neide');
      AUDIO.sfx('beep'); await CUT.narr('📱 O celular vibra. É uma chamada de vídeo da praia.');
      CUT.call(true, 'Tia Neide');
      const ne = await SHOP.showCustomer(S.neide);
      await CUT.say(ne, 'Tia Neide', 'Oi, meu bem! A Tati me contou desse tal de Vitor... Valadares, né?', 'worried');
      await CUT.say(ne, 'Tia Neide', 'Eu conheço esse sobrenome. O pai dele, o Valdemar, foi meu aprendiz há vinte anos. Um menino esperto... esperto demais.', 'sad');
      await CUT.say(ne, 'Tia Neide', 'Um dia ele sumiu com a minha agenda de clientes e abriu a primeira ConsertaJá. Vendia peça falsificada como se fosse original.', 'angry');
      await CUT.say(ne, 'Tia Neide', 'Se o filho puxou o pai, deve estar fazendo a mesma coisa. Se você juntar provas, o bairro inteiro vai saber quem ele é.', 'neutral');
      await CUT.say(ne, 'Tia Neide', 'Mas me promete uma coisa: não vira igual a eles. Honestidade é a melhor ferramenta da bancada. Beijo, meu bem!', 'smile');
      CUT.call(false); await SHOP.leaveCustomer(1);
      rs().ch4 = true;
      await CUT.narr(`🔎 <b>Provas:</b> fique de olho em pistas contra a ConsertaJá — espiando à noite, conversando com as pessoas certas... Com <b>3 provas</b>, algo muda no dia ${FINAL_DAY}. <small>(Você tem ${rs().evidence})</small>`);
      await CUT.end();
    },
    // ---------- CAPÍTULO 5 ----------
    async duelo() {
      const r = rs();
      await CUT.begin();
      await cutStreet(17, 'wide2');
      await CUT.card('Dia 12', 'Capítulo 5', 'O Duelo');
      await CUT.narr('A Rua das Palmeiras está em festa: é a Feira do Bairro. E no meio da rua, um palco improvisado...');
      await STREET.shot('street', 2);
      const crowd = [];
      for (const [i, x] of [[0, -10.5], [4, -3.4], [9, -9.2], [12, -4.5]]) crowd.push(await STREET.show(CHARS.ROSTER[i], x, 'ours'));
      const cr = await STREET.show(S.cris, -7, 'ours');
      await CUT.say(cr, 'Cris Notícia', 'Boa tarde, bairro! Ao vivo da Feira da Rua das Palmeiras: o primeiro <b>DUELO DE CONSERTOS</b> da história!', 'happy');
      await STREET.hide(cr); const vi = await STREET.show(S.vitor, -7, 'ours');
      await CUT.say(vi, 'Vitor Valadares', 'Um aparelho, um defeito, e o bairro decide quem é o melhor técnico. O perdedor... bom, o perdedor perde os clientes.', 'smug');
      await CUT.say(vi, 'Vitor Valadares', 'Minha equipe já fez a parte dela. Agora é com você, vizinho. Não tremam as mãozinhas!', 'smile');
      await CUT.end();
      const d = await RIVAL.duel();
      await wait(.5);
      await CUT.begin(); await cutStreet(18, 'street');
      for (const [i, x] of [[0, -10.5], [4, -3.4], [9, -9.2], [12, -4.5]]) await STREET.show(CHARS.ROSTER[i], x, 'ours');
      const cr2 = await STREET.show(S.cris, -7, 'ours');
      await CUT.say(cr2, 'Cris Notícia', `Resultado: Vitor, nota <b>${d.rival}</b>. E o herdeiro da Tia Neide... nota <b>${d.mine}</b>!`, 'surprised');
      if (d.win) {
        STREET.fireworks(5); AUDIO.sfx('victory');
        await CUT.say(cr2, 'Cris Notícia', 'TEMOS UM VENCEDOR! O bairro enlouquece! A lojinha da Tia Neide leva o troféu!', 'happy');
        GAME.addMoney(300, true); GAME.repChange(.4); RIVAL.share(.12); META.bump('duelsWon');
        await CUT.narr(`🏆 Você venceu o duelo! +${money(300)} de prêmio, +reputação e +12% do bairro.`);
      } else {
        AUDIO.sfx('lose');
        await CUT.say(cr2, 'Cris Notícia', 'E a ConsertaJá vence o duelo! Não foi dessa vez pra lojinha da Tia Neide...', 'sad');
        GAME.repChange(-.2); RIVAL.share(-.1);
        await CUT.narr('Você perdeu o duelo. −10% do bairro. Mas a guerra ainda não acabou.');
      }
      await CUT.end();
    },
    // ---------- CAPÍTULO 6 ----------
    async proposta() {
      await CUT.begin();
      await cutShop(9.5);
      await CUT.card('Dia 15', 'Capítulo 6', 'A Proposta');
      const vi = await SHOP.showCustomer(S.vitor);
      await CUT.say(vi, 'Vitor Valadares', 'Vamos conversar como adultos. Sem briga, sem duelo.', 'neutral');
      await CUT.say(vi, 'Vitor Valadares', `${money(8000)}. Pela loja, pelo ponto, por tudo. E ainda te dou um emprego na ConsertaJá: salário fixo, sem aluguel, sem dor de cabeça.`, 'smile');
      await CUT.say(vi, 'Vitor Valadares', 'É a melhor oferta que você vai receber na vida. Pensa bem.', 'smug');
      const c = await CUT.choose([{ label: 'Recusar', value: 'no' }, { label: 'Aceitar a proposta', sub: `FIM DE JOGO: vende a loja por ${money(8000)}`, value: 'yes' }]);
      if (c === 'yes') { await CUT.end(); return STORY.ending('empregado'); }
      await CUT.say(vi, 'Vitor Valadares', 'Hmpf. Vai se arrepender. No dia 25, você vai ver.', 'angry');
      await SHOP.leaveCustomer(1);
      const ol = await SHOP.showCustomer(S.olga);
      await CUT.say(ol, 'Dona Olga', 'Então você é o herdeiro da Neide. Eu sou a Olga, a dona deste prédio. Ouvi o Vitor saindo daqui bufando... bom sinal.', 'smug');
      await CUT.say(ol, 'Dona Olga', `No dia ${FINAL_DAY}, ao pôr do sol, eu decido pra quem vendo o prédio. Quero no mínimo <b>${money(GOAL)}</b>... e quero ser <b>convencida</b>. Dinheiro não é tudo, meu jovem.`, 'neutral');
      await SHOP.leaveCustomer(1);
      await CUT.end();
    },
    // ---------- CAPÍTULO 7 ----------
    async sabotagem() {
      const g = G();
      await CUT.begin();
      await cutStreet(8, 'oursClose');
      await CUT.card('Dia 18', 'Capítulo 7', 'Sabotagem');
      AUDIO.sfx('eventBad');
      await CUT.narr('Você chega cedo e congela: a porta está pichada com "LOJA DE GOLPISTA". E o Guia do Bairro amanheceu cheio de avaliações de uma estrela...');
      GAME.repChange(-.3); RIVAL.share(-.05);
      const c = await CUT.choose([{ label: 'Limpar tudo e seguir em frente', sub: 'R$ 60', value: 'limpa' }, { label: 'Atravessar a rua e tirar satisfação com o Vitor', sub: 'discussão digitando', value: 'vitor' }]);
      if (c === 'limpa') { GAME.addMoney(-Math.min(60, g.money - 1), true); await CUT.narr('Você passa a manhã esfregando a porta. Alguns vizinhos param pra ajudar. O bairro vê quem trabalha de verdade. (+0,2★)'); GAME.repChange(.2); }
      else {
        await STREET.shot('rival', 1.2);
        const vi = await STREET.show(S.vitor, -7, 'rival');
        await CUT.say(vi, 'Vitor Valadares', 'Pichação? Avaliações falsas? Nossa, que coisa feia. Eu? Jamais. Prova?', 'smug');
        $('#letterbox').classList.remove('on');
        await FIGHTS.run('rival', { sprites: [vi] });
        $('#letterbox').classList.add('on');
        await STREET.hide(vi);
      }
      await STREET.shot('ours', 1); STREET.setTime(21);
      await CUT.narr('Naquela noite, depois de fechar a loja, alguém bate na porta dos fundos...');
      const be = await STREET.show(S.beto, -5.5, 'ours', 4);
      $('#letterbox').classList.remove('on');
      await FIGHTS.run('beto', { sprites: [be] });
      $('#letterbox').classList.add('on');
      await STREET.hide(be, 1);
      await CUT.end();
    },
    // ---------- CAPÍTULO 8 ----------
    async volta() {
      const g = G(), r = rs();
      await CUT.begin();
      await cutShop(9);
      await CUT.card('Dia 21', 'Capítulo 8', 'A Volta da Tia Neide');
      const ne = await SHOP.showCustomer(S.neide);
      await CUT.say(ne, 'Tia Neide', 'Surpresa! Não aguentei ficar na praia sabendo que faltam só quatro dias!', 'happy');
      await CUT.say(ne, 'Tia Neide', DECOR.style() >= 35 || RENO.level() >= 2 ? 'Olha só essa loja! Tá mais bonita do que no meu tempo. Tô até com ciúmes!' : 'A loja tá do jeitinho que eu deixei... dá até saudade.', 'smile');
      await CUT.say(ne, 'Tia Neide', g.money >= GOAL ? `Você já tem ${money(g.money)}?! Eu sabia! Eu SABIA!` : `Faltam ${money(GOAL - g.money)} pro prédio... quatro dias. Eu confio em você.`, g.money >= GOAL ? 'happy' : 'worried');
      if (r.active) await CUT.say(ne, 'Tia Neide', r.share >= .55 ? 'E o bairro inteiro só fala de você! O Valadares deve estar arrancando os cabelos.' : 'Ouvi que a ConsertaJá tá levando muitos clientes... ainda dá tempo de virar esse jogo.', r.share >= .55 ? 'smug' : 'worried');
      if (r.evidence >= 3) await CUT.say(ne, 'Tia Neide', 'E essas provas... meu bem, com isso a gente acaba com a farra dos Valadares de uma vez por todas.', 'angry');
      await CUT.say(ne, 'Tia Neide', 'Toma. Foi com essa chave de fenda que eu abri esta loja há quarenta anos. Agora ela é sua.', 'smile');
      g.neideGift = true; AUDIO.sfx('victory');
      await CUT.narr('🪛 Você recebeu a <b>Chave de fenda de ouro da Tia Neide</b>: clientes pagam +10% e +10s na meta de tempo até o fim da partida.');
      await SHOP.leaveCustomer(1);
      await CUT.end();
    },
  };
  const CHAPTERS = [
    { id: 'rival', day: 3, fn: CH.rival }, { id: 'reforcos', day: 6, fn: CH.reforcos }, { id: 'segredo', day: 9, fn: CH.segredo },
    { id: 'duelo', day: 12, fn: CH.duelo }, { id: 'proposta', day: 15, fn: CH.proposta }, { id: 'sabotagem', day: 18, fn: CH.sabotagem },
    { id: 'volta', day: 21, fn: CH.volta },
  ];

  // =====================================================================
  // FINAL — O LEILÃO
  // =====================================================================
  async function finale() {
    const g = G(), r = rs();
    await CUT.begin();
    await cutStreet(18.2, 'wide');
    await CUT.card(`Dia ${FINAL_DAY}`, 'Capítulo Final', 'O Leilão');
    await STREET.shot('street', 2.5);
    const crowd = [];
    for (const [i, x] of [[3, -11], [15, -3], [5, -12.5], [11, -1.8]]) crowd.push(await STREET.show(CHARS.ROSTER[i], x, 'ours'));
    const ne = await STREET.show(S.neide, -9.6, 'ours'); const ta = await STREET.show(CHARS.CLERK, -4.4, 'ours');
    const ol = await STREET.show(S.olga, -7, 'ours');
    await CUT.say(ol, 'Dona Olga', 'Boa tarde a todos. Como prometido, hoje, ao pôr do sol, este prédio muda de dono.', 'neutral');
    await CUT.say(ol, 'Dona Olga', 'Tenho duas propostas. A primeira é do senhor Valadares.', 'neutral');
    await STREET.hide(ol); const vi = await STREET.show(S.vitor, -7, 'ours');
    await CUT.say(vi, 'Vitor Valadares', `${money(12000)}, à vista. E prometo modernizar este bairro velho.${r.active && r.share < .35 ? ' Aliás, o bairro já é meu. Olhem as filas.' : ''}`, 'smug');
    await STREET.hide(vi); const ol2 = await STREET.show(S.olga, -7, 'ours');
    await CUT.say(ol2, 'Dona Olga', 'Agora, você. Me convença.', 'neutral');
    $('#letterbox').classList.remove('on');
    const sp = await FIGHTS.run('olga', { sprites: [ol2] });
    $('#letterbox').classList.add('on');
    const score = sp.score || 0;
    META.bump('speechBest', score, 'max');
    let decided = null;
    const tried = new Set();
    while (!decided) {
      const opts = [
        { label: `💰 Fazer o meu lance`, sub: `seu caixa: ${money(g.money)}${g.bank.savings ? ` + ${money(g.bank.savings)} na poupança` : ''}`, value: 'lance' },
        { label: '📂 Mostrar as provas contra a ConsertaJá', sub: `${r.evidence}/3 provas`, value: 'provas', disabled: r.evidence < 3 },
        { label: '🤝 Propor sociedade ao Vitor', value: 'socios', disabled: tried.has('socios') },
        { label: `🏳️ Vender a loja para o Vitor (${money(8000)})`, value: 'vender' },
      ];
      const c = await CUT.choose(opts);
      const total = g.money + (g.bank.savings || 0);
      if (c === 'lance') {
        const winByMoney = total >= 12500, winByHeart = total >= GOAL && (score >= 55 || r.share >= .6 || !r.active);
        if (winByMoney || winByHeart) {
          const price = winByMoney ? 12500 : GOAL;
          const fromSav = Math.max(0, price - (g.money - 1)); if (fromSav > 0) { g.bank.savings -= fromSav; g.money += fromSav; }
          g.money -= price;
          await CUT.say(ol2, 'Dona Olga', winByMoney ? `${money(price)}? Cobriu o lance do Valadares. O prédio é seu!` : `${money(price)}... menos que o Vitor. Mas você me convenceu, e o bairro está do seu lado. O prédio é seu!`, 'happy');
          decided = 'dono';
        } else {
          await CUT.say(ol2, 'Dona Olga', total < GOAL ? `Só ${money(total)}? Sinto muito, meu jovem. Eu pedi no mínimo ${money(GOAL)}.` : 'Você tem o dinheiro, mas não me convenceu... e o Vitor paga mais. Sinto muito.', 'sad');
          decided = r.evidence >= 3 && !tried.has('provas') ? null : 'despejo';
          if (!decided) { await CUT.narr('Espera... ainda dá tempo. As provas!'); tried.add('lance'); }
        }
      } else if (c === 'provas') {
        tried.add('provas');
        await CUT.say(ne, 'Tia Neide', 'Olga, olha isso: notas fiscais falsas, peças paralelas vendidas como originais... É a ConsertaJá. De novo.', 'angry');
        await STREET.hide(ol2); const vi2 = await STREET.show(S.vitor, -7, 'ours');
        await CUT.say(vi2, 'Vitor Valadares', 'I-isso é montagem! Isso é... Beto?! BETO, VOLTA AQUI!', 'surprised');
        await STREET.hide(vi2); const ol3 = await STREET.show(S.olga, -7, 'ours');
        await CUT.say(ol3, 'Dona Olga', 'Fraude. No MEU bairro. A proposta do senhor Valadares está cancelada.', 'angry');
        const pay = Math.min(GOAL, Math.max(0, total - 1));
        if (pay >= 5000) { const fromSav = Math.max(0, pay - (g.money - 1)); if (fromSav > 0) { g.bank.savings -= fromSav; g.money += fromSav; } g.money -= pay; g.ownBuilding = true; }
        await CUT.say(ol3, 'Dona Olga', pay >= 5000 ? `Me pague ${money(pay)} e o prédio é seu. O resto, você paga cuidando bem deste lugar.` : 'Você não tem o dinheiro todo... então eu fico com o prédio e te alugo a loja por um preço justo. Pra sempre.', 'happy');
        decided = 'justica';
      } else if (c === 'socios') {
        tried.add('socios');
        await STREET.hide(ol2); const vi3 = await STREET.show(S.vitor, -7, 'ours');
        if (r.share >= .4 || !r.active) {
          await CUT.say(vi3, 'Vitor Valadares', 'Sociedade...? Hmm. Metade do bairro gosta de você, metade gosta de mim. Juntos... a gente domina a cidade.', 'smile');
          await CUT.say(vi3, 'Vitor Valadares', `Fechado. Eu pago o prédio, você toca a oficina. Meio a meio. Mas nada de peças paralelas, prometo.`, 'happy');
          decided = 'socios';
        } else { await CUT.say(vi3, 'Vitor Valadares', 'Sócio? Você? Com essa fatia do bairro? Hahaha! Não, obrigado.', 'smug'); await STREET.hide(vi3); await STREET.show(S.olga, -7, 'ours'); }
      } else if (c === 'vender') { decided = 'horizontes'; }
    }
    STREET.clear();
    await CUT.end();
    return STORY.ending(decided, { score });
  }

  // =====================================================================
  // FINAIS
  // =====================================================================
  const ENDINGS = {
    dono: { title: 'O DONO DO PEDAÇO', tag: 'Final bom', emoji: '🏠', good: true, text: ['A Dona Olga assina a escritura ali mesmo, no capô de um carro estacionado. O bairro inteiro aplaude.', 'A Tia Neide chora abraçada na Tati. O Vitor atravessa a rua sozinho, de cabeça baixa.', 'Agora não tem mais aluguel: a loja da Tia Neide é sua, com prédio e tudo. E a ConsertaJá? Continua lá na frente... mas agora você joga em casa.'], cont: 'Você é dono do prédio: o aluguel virou só um condomínio baratinho.' },
    justica: { title: 'JUSTIÇA DO BAIRRO', tag: 'Final verdadeiro', emoji: '🌟', good: true, text: ['A notícia se espalha antes do jantar: "ConsertaJá vendia peças falsas". Na manhã seguinte, o neon da frente está apagado.', 'Uma semana depois, o Vitor aparece na sua porta, sem terno, sem óculos escuros. "Meu pai errou. Eu errei. Tem vaga de aprendiz?"', 'A Tia Neide sorri: "Honestidade é a melhor ferramenta da bancada". O bairro nunca foi tão seu.'], cont: 'A ConsertaJá fechou: fim da guerra do bairro, e o prédio (ou um aluguel justo) é seu.' },
    socios: { title: 'SÓCIOS IMPROVÁVEIS', tag: 'Final neutro', emoji: '🤝', good: true, text: ['Ninguém no bairro acredita quando a placa nova aparece: "ConsertaJá & Assistência da Neide".', 'O Vitor cuida da propaganda e das planilhas; você cuida da bancada. Brigam todo dia. Faturam todo dia.', 'A Tia Neide ainda não sabe se ri ou se chora. Por via das dúvidas, faz os dois.'], cont: 'Sócio do Vitor: fim da guerra, e metade dos lucros da ConsertaJá cai na sua conta todo dia.' },
    horizontes: { title: 'NOVOS HORIZONTES', tag: 'Final agridoce', emoji: '🏖️', text: ['Você entrega as chaves ao Vitor e pega o ônibus para a praia com a Tia Neide.', `Com os ${money(8000)} no bolso, vocês abrem uma barraquinha: "Consertos da Neide — Frente para o Mar".`, 'Não é a mesma coisa. Mas o pôr do sol é bonito, e ninguém cobra aluguel na areia.'] },
    empregado: { title: 'FUNCIONÁRIO DO MÊS', tag: 'Final alternativo', emoji: '👔', text: ['Você aceita a proposta. A loja da Tia Neide vira "ConsertaJá — Unidade 2".', 'O uniforme azul coça, o crachá tem seu nome escrito errado e o Vitor te chama de "colaborador".', 'Mas no fim do mês você é o Funcionário do Mês. De novo. E de novo. A Tia Neide não atende mais suas ligações.'] },
    despejo: { title: 'DESPEJO', tag: 'Final ruim', emoji: '📦', text: ['A Dona Olga vende o prédio para o Vitor. Uma semana depois, chega a carta de despejo.', 'Você empacota as ferramentas da Tia Neide em caixas de papelão, uma por uma.', 'Na calçada, a Tati te dá um abraço e um cafezinho. "Não foi dessa vez. Mas você vai voltar, eu sei."'] },
  };
  async function ending(id, extra = {}) {
    const g = G(), E = ENDINGS[id];
    st().ending = id; st().done = true;
    META.bump('end_' + id); META.meta.endings = [...new Set([...(META.meta.endings || []), id])]; try { localStorage.setItem('rs_meta', JSON.stringify(META.meta)); } catch (e) { }
    if (id === 'dono') { g.ownBuilding = true; }
    if (id === 'justica') { rs().defeated = true; }
    if (id === 'socios') { rs().ally = true; g.partnerIncome = true; }
    if (id === 'horizontes' || id === 'empregado') g.money += 8000;
    // cena final
    await CUT.begin();
    if (E.good) { await cutStreet(20, 'ours'); STREET.setOurSign(id === 'socios' ? 'ConsertaJá & NEIDE' : 'ASSISTÊNCIA DA NEIDE'); if (id === 'justica') STREET.setRival(false); STREET.fireworks(10); AUDIO.music('title'); AUDIO.sfx('victory'); }
    else { await cutStreet(id === 'horizontes' ? 17.5 : 19.5, id === 'horizontes' ? 'wide' : 'ours'); AUDIO.music('night'); }
    for (const t of E.text) await CUT.narr(t);
    await CUT.end();
    META.checkAch();
    // cartão do final + créditos
    return new Promise(res => {
      const ends = META.meta.endings || [];
      const s = UI.screen(`<div class="card ending-card ${E.good ? 'good' : ''}">
        <div class="end-emoji">${E.emoji}</div><small>${E.tag}</small><h1>${E.title}</h1>
        <p>${E.text[E.text.length - 1]}</p>
        <table class="sum"><tr><td>Dias</td><td>${g.day}</td></tr><tr><td>Consertos</td><td>${g.stats.repairs}</td></tr><tr><td>Caixa final</td><td>${money(g.money)}</td></tr><tr><td>Nível</td><td>${g.level}</td></tr>${rs().active || rs().defeated || rs().ally ? `<tr><td>Fatia do bairro</td><td>${Math.round(rs().share * 100)}%</td></tr><tr><td>Provas</td><td>${rs().evidence}</td></tr>` : ''}</table>
        <p>🏆 Finais descobertos: <b>${ends.length}/6</b> ${Object.keys(ENDINGS).map(k => ends.includes(k) ? ENDINGS[k].emoji : '❔').join(' ')}</p>
        <p style="font-size:13px;opacity:.8">Cada final libera uma relíquia permanente (veja em Coleção).</p>
        <button class="btn purple" id="end-cred">🎬 Ver créditos</button>
        ${E.cont ? `<button class="btn green big" id="end-cont">Continuar jogando</button><small style="display:block">${E.cont}</small>` : ''}
        <button class="btn" id="end-menu">Menu principal</button></div>`, 'dim');
      s.querySelector('#end-cred').onclick = () => credits();
      const ct = s.querySelector('#end-cont'); if (ct) ct.onclick = () => { AUDIO.sfx('confirm'); UI.closeScreen(); res('continue'); };
      s.querySelector('#end-menu').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); res('menu'); };
    });
  }
  function credits() {
    const d = document.createElement('div'); d.className = 'credits-roll';
    const cast = [...CHARS.ROSTER.map(c => c.name), 'Tia Neide', 'Vitor Valadares', 'Dona Olga', 'Tati', 'Rubi', 'Beto', 'Cris Notícia', 'Seu Toninho', 'Jorjão', 'Fiscal Barbosa', 'Dona Neusa', 'Dona Regina', 'Zé Esperto', 'Juninho'];
    const models = (window.MODEL_CREDITS || []).map(m => `${m.title} — ${m.author}`);
    d.innerHTML = `<div class="roll"><h1>REPAIR SIMULATOR</h1><p>uma história sobre ferramentas, família e um bairro inteiro</p><h2>Elenco</h2>${cast.map(c => `<p>${c}</p>`).join('')}<h2>Modelos 3D (poly.pizza)</h2>${models.map(m => `<p>${m}</p>`).join('')}<h2>Sons</h2><p>Kenney (kenney.nl)</p><h2>Músicas</h2><p>Kevin MacLeod (incompetech.com) — CC BY 4.0</p><h2>Motor 3D</h2><p>three.js</p><h1 style="margin-top:60px">Obrigado por jogar ♥</h1></div><button class="btn" id="roll-x">Fechar</button>`;
    document.body.appendChild(d); AUDIO.music('title');
    d.querySelector('#roll-x').onclick = () => d.remove();
  }

  // =====================================================================
  // API usada pelo jogo
  // =====================================================================
  const STORY = {
    FINAL_DAY, GOAL, CUT, ENDINGS, ending, credits, finale,
    intro: CH.intro,
    state: st,
    async play(id) { if (id === 'intro') return CH.intro(); if (id === 'finale') return finale(); if (id.startsWith('end_')) return ending(id.slice(4)); const c = CHAPTERS.find(x => x.id === id); if (c) { G().day = c.day; if (!st().seen.includes(c.id)) st().seen.push(c.id); return c.fn(); } },
    // chamado no começo de cada dia (antes do jornal). Retorna 'ended' se a partida acabou num final.
    async onDayStart() {
      const g = G(), s = st();
      if (s.done) return null;
      if (g.day === FINAL_DAY) { const r = await finale(); return r === 'menu' ? 'menu' : 'continued'; }
      const ch = CHAPTERS.find(c => c.day === g.day && !s.seen.includes(c.id));
      if (ch) { s.seen.push(ch.id); const r = await ch.fn(); if (r === 'menu' || r === 'continue') return r === 'menu' ? 'menu' : 'continued'; }
      return null;
    },
    // modificadores da história (reforma, presente da Neide, prédio próprio, sociedade)
    modSum(k) {
      const g = G(); if (!g) return 0; let v = 0;
      const L = RENO.LV[g.shopLevel || 1]; if (L && L.mods[k]) v += L.mods[k];
      if (g.neideGift) v += ({ payMult: .1, parTime: 10 })[k] || 0;
      if (g.ownBuilding && k === 'rentMult') v += .75;
      if (g.partnerIncome && k === 'dailyIncome') v += r5(120 + g.day * 5);
      return v;
    },
    chapterLabel() { const g = G(), s = st(); if (s.done) return `Final: ${ENDINGS[s.ending].title}`; const next = CHAPTERS.find(c => !s.seen.includes(c.id)); return next ? `Próximo capítulo no dia ${next.day}` : `Leilão no dia ${FINAL_DAY}`; },
  };
  window.STORY = STORY;
})();
