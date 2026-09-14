// EVENTOS ALEATÓRIOS — jornal da manhã (evento do dia), acontecimentos no meio do expediente
// (com escolhas, minigames e brigas), sustos da madrugada, avaliações dos clientes e contratos.
(function () {
  const $ = s => document.querySelector(s);
  const pick = a => a[(Math.random() * a.length) | 0];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const G = () => GAME.state;
  const money = v => UI.money(v);
  const mod = k => META.mod(k);

  // ---------- evento do dia (manchete do jornal) ----------
  const DAILY = [
    { id: 'quiet', head: 'Bairro em paz: nada de especial hoje', txt: 'Dia tranquilo.', w: 4 },
    { id: 'promo', head: 'Fornecedor faz queima de estoque!', txt: 'Peças 40% mais baratas hoje.', partsMult: 0.6, w: 2, good: 1 },
    { id: 'rain', head: 'Temporal alaga o centro', txt: '1 cliente a menos, mas pagam +25%. Muito aparelho molhado!', cust: -1, payMult: 1.25, faultBias: ['water'], w: 2 },
    { id: 'viral', head: 'Vídeo da sua loja viraliza!', txt: '+2 clientes hoje.', cust: 2, w: 1.5, good: 1 },
    { id: 'fiscal', head: 'Prefeitura faz blitz no comércio', txt: 'O fiscal vai passar na loja hoje...', fiscalVisit: true, fine: true, w: 1.1 },
    { id: 'pipe', head: 'Cano estourado na rua da loja', txt: 'O encanador cobrou R$ 60 da sua parte.', money: -60, fine: true, w: 1 },
    { id: 'moon', head: 'Lua cheia: astrólogos preveem sorte', txt: '+15% nos prêmios do cassino hoje à noite.', casino: 1.15, w: 1.5, good: 1 },
    { id: 'coffee', head: 'Padaria da esquina lança café especial', txt: 'Clientes bem-humorados: gorjetas +30%.', tip: 1.3, w: 1.5, good: 1 },
    { id: 'rich', head: 'Festa da alta sociedade no bairro', txt: 'Clientes pagam +30%.', payMult: 1.3, w: 1.2, good: 1 },
    { id: 'gift', head: 'Fornecedor distribui brindes', txt: 'Uma caixa de peças grátis na porta!', gift: true, w: 1, good: 1 },
    { id: 'sale', head: 'Liquidação no Mercadinho 24h', txt: 'Lojinha da Tati 30% mais barata hoje.', storeSale: .3, w: 1.2, good: 1 },
    { id: 'heat', head: 'Onda de calor: 38°C à sombra', txt: 'Celulares fervendo: muito defeito de bateria e chip.', faultBias: ['battery', 'chip'], w: 1.3 },
    { id: 'dollar', head: 'Dólar dispara e peças encarecem', txt: 'Peças 30% mais caras hoje.', partsMult: 1.3, w: 1.1 },
    { id: 'holiday', head: 'Feriado municipal', txt: 'Movimento fraco (−1 cliente), mas quem vem paga +20%.', cust: -1, payMult: 1.2, w: 1 },
    { id: 'bf', head: 'Black Friday do bairro!', txt: '+2 clientes, mas todo mundo pechincha (negociar −20%).', cust: 2, mods: { haggle: -.2 }, w: 1 },
    { id: 'game', head: 'Hoje tem jogo do Brasil!', txt: 'Clima de festa: pagamentos +15%, clientes com pressa (−10s na meta).', payMult: 1.15, mods: { parTime: -10 }, w: 1 },
    { id: 'scam', head: 'Golpe do falso técnico assusta moradores', txt: 'Clientes desconfiados: negociar −10%, brigas mais frequentes.', mods: { haggle: -.1 }, fightMult: 1.8, w: 1 },
    { id: 'friday13', head: 'Sexta-feira 13', txt: 'Gatos pretos por todo lado. Sorte −1 no cassino... ou será?', mods: { luck: -1 }, w: .8 },
    { id: 'fair', head: 'Feira de tecnologia no centro', txt: 'Clientes chegam com aparelhos caros: +20% no pagamento.', payMult: 1.2, w: 1, good: 1 },
    { id: 'strike', head: 'Greve de ônibus', txt: 'Poucos clientes (−1), mas os que vêm são fiéis: gorjetas +40%.', cust: -1, tip: 1.4, w: .9 },
  ];
  const FLAVOR = ['Gato da Dona Cida é eleito o mais fofo do bairro', 'Padaria anuncia pão de queijo de 1 metro', 'Moradores reclamam de pombos "muito ousados"', 'Cientista local explode (de novo) o próprio laboratório', 'Influencer do bairro troca de celular pela 5ª vez no mês', 'Tio Zeca promete churrasco "pro bairro todo" domingo', 'Cassino Lucky ♥ Neon bate recorde de jackpots', 'Novo sabor de energético esgota no Mercadinho 24h', 'Vó Lurdes pinta o cabelo de verde e vira tendência', 'Estudante passa em Cálculo 3 e faz festa na rua', 'Funcionário da ConsertaJá é visto comprando peças no camelô', 'Chef de lámen derruba caldo em mais um celular', 'Cartomante prevê "grandes mudanças" no comércio', 'Skatista cai de novo na mesma calçada; calçada vence', 'Streamer do bairro atinge 1.000 seguidores'];
  const WEATHER = ['☀️ Sol, 29°C', '🌤️ Parcialmente nublado, 25°C', '🌧️ Chuva à tarde, 21°C', '⛅ Abafado, 31°C', '🌬️ Ventania, 19°C', '🌈 Sol com chuva (casamento de viúva), 24°C'];

  function rollDaily() {
    const g = G();
    if (g.day === 1) return DAILY[0];
    if (g.fiscalTomorrow) { g.fiscalTomorrow = false; return DAILY.find(e => e.id === 'fiscal'); }
    const luckBias = mod('goodEvents');
    const pool = DAILY.filter(e => !(e.fine && mod('noFines')));
    const w = e => e.w * (e.good ? 1 + luckBias : 1);
    const tot = pool.reduce((a, e) => a + w(e), 0); let r = Math.random() * tot;
    for (const e of pool) { r -= w(e); if (r <= 0) return e; }
    return pool[0];
  }

  function newspaper(extra = []) {
    const g = G(), ev = g.event;
    const flav = [...FLAVOR].sort(() => Math.random() - .5).slice(0, 2);
    const contracts = (g.contracts || []).filter(c => !c.done);
    return `<div class="paper">
      <div class="paper-top"><span>Nº ${1000 + g.day}</span><b>GAZETA DO BAIRRO</b><span>Dia ${g.day} · R$ 1,50</span></div>
      <div class="paper-head">${ev.head}</div>
      <div class="paper-sub">${ev.txt}</div>
      <div class="paper-cols">
        <div>${flav.map(f => `<p>▪ ${f}</p>`).join('')}<p>${pick(WEATHER)}</p></div>
        <div><p>${ECON.marketTxt()}</p>${extra.map(x => `<p>${x}</p>`).join('')}${contracts.map(c => `<p>📋 Contrato ${c.company}: ${c.have}/${c.need} ${c.typeName} até o dia ${c.due}</p>`).join('')}</div>
      </div></div>`;
  }

  // ---------- avaliações ----------
  const REV = {
    5: ['Atendimento nota 10! Voltarei com certeza.', 'Mãos de fada, recomendo demais!', 'Rápido, honesto e simpático. ⭐⭐⭐⭐⭐', 'Melhor assistência do bairro, sem dúvida.', 'Resolveu tudo e ainda me acalmou. Profissional!'],
    4: ['Muito bom, só achei um pouquinho caro.', 'Resolveu meu problema. Recomendo.', 'Bom serviço, ambiente agradável.', 'Gostei! Poderia ser um pouco mais rápido.'],
    3: ['Ok. Nada demais.', 'Consertou, mas demorou.', 'Mais ou menos. Esperava mais.'],
    2: ['Não gostei muito do resultado.', 'Demorou e o aparelho ainda tá estranho.', 'Atendimento fraco.'],
    1: ['PÉSSIMO! Nunca mais!', 'Fui destratado. Uma estrela porque não dá zero.', 'Não recomendo pra ninguém!!!', 'Barraco, confusão e descaso. Fujam!'],
  };
  const REV_FIGHT = {
    5: ['Cheguei nervoso e saí sorrindo. Que atendimento!', 'Tive um problema, mas resolveram com muita educação.', 'O técnico tem paciência de santo. Recomendo!'],
    4: ['Rolou um estresse, mas no fim deu tudo certo.', 'Negociaram comigo de boa. Voltarei.'],
    3: ['Deu uma confusão, mas ok.'],
    2: ['Não gostei do jeito que me trataram.'],
    1: ['Me trataram muito mal! Barraco total!', 'Uma estrela e olhe lá. Que falta de educação!', 'Confusão, grito e descaso. Fujam!'],
  };
  function review(npc, stars, kind) {
    const g = G(); if (!g) return;
    stars = Math.max(1, Math.min(5, Math.round(stars)));
    const bank = kind && kind !== 'garantia' ? REV_FIGHT : REV;
    const r = { name: npc.name, stars, text: pick(bank[stars]), day: g.day };
    g.reviews = (g.reviews || []).concat(r).slice(-30);
    g.dayReviews = (g.dayReviews || []).concat(r);
    const avg = g.reviews.reduce((a, x) => a + x.stars, 0) / g.reviews.length;
    if (mod('reviewBonus') > 0 && stars === 5) GAME.repChange(.05);
    if (stars === 1) GAME.repChange(mod('reviewBonus') > 0 ? -.02 : -.05);
    UI.toast(`${'⭐'.repeat(stars)}<small style="opacity:.4">${'☆'.repeat(5 - stars)}</small> <b>${npc.name}</b>: “${r.text}”<br><small>Guia do Bairro: ${avg.toFixed(1)} ★</small>`, stars >= 4 ? 'good' : stars <= 2 ? 'bad' : '');
  }

  // ---------- contratos ----------
  const COMPANIES = ['TechNorte', 'Escola Estadual Monteiro', 'Pizzaria Bella Nápoli', 'Clínica Sorriso', 'Construtora Pedra Firme', 'Rádio Bairro FM', 'Hotel Estrela', 'Lan House Ctrl+Alt'];
  const TYPE_NAME = { phone: 'celulares', tablet: 'tablets', console: 'videogames portáteis', laptop: 'notebooks', controller: 'controles', camera: 'câmeras', audio: 'aparelhos de som', watch: 'relógios', drone: 'drones', vr: 'óculos VR', retro: 'videogames retrô', calc: 'calculadoras', vintage: 'telefones antigos', pet: 'bichinhos virtuais' };
  function makeContract() {
    const g = G();
    const types = ['phone', 'phone', 'tablet', 'console', 'laptop', 'controller', 'camera', 'audio', 'watch'];
    const type = pick(types); const need = type === 'phone' ? 3 : 2;
    return { company: pick(COMPANIES), type, typeName: TYPE_NAME[type], need, have: 0, due: g.day + (need === 3 ? 3 : 2), reward: r5((160 + g.day * 30) * need * (1 + mod('contractBonus'))), penalty: r5(60 + g.day * 10), done: false };
  }
  function contractProgress(job, integ) {
    const g = G(); for (const c of g.contracts || []) {
      if (c.done || c.type !== job.type || integ < 70) continue;
      c.have++;
      if (c.have >= c.need) { c.done = true; GAME.addMoney(c.reward, true); g.log.events = (g.log.events || 0) + c.reward; AUDIO.sfx('victory'); UI.toast(`📋 <b>Contrato ${c.company} concluído!</b> +${money(c.reward)}`, 'gold'); META.bump('contracts'); }
      else UI.toast(`📋 Contrato ${c.company}: ${c.have}/${c.need} ${c.typeName}`, 'good');
      break;
    }
  }
  function contractsEndDay() {
    const g = G(); const out = [];
    for (const c of g.contracts || []) {
      if (!c.done && g.day >= c.due) { c.done = true; c.failed = true; GAME.addMoney(-c.penalty, true); GAME.repChange(-.3); out.push([`Contrato ${c.company} NÃO cumprido (multa, −0,3★)`, -c.penalty]); }
    }
    g.contracts = (g.contracts || []).filter(c => !c.done || c.day === g.day);
    return out;
  }
  // um cliente do contrato aparece com mais frequência
  function contractDevice() {
    const g = G(); const c = (g.contracts || []).find(x => !x.done); if (!c || Math.random() > .4) return null;
    const devs = Object.keys(REPAIR.DEVICES).filter(k => REPAIR.DEVICES[k].type === c.type);
    return devs.length ? { model: pick(devs), company: c.company } : null;
  }

  // ---------- adereços 3D na loja ----------
  const props = [];
  async function prop(key, pos, opts = {}) {
    const a = ASSETS.MODELS[key].anim ? ASSETS.getAnimated(key) : { obj: ASSETS.get(key), clips: [] };
    const o = a.obj; o.position.set(...pos); o.rotation.y = opts.rot || 0; SHOP.scene.add(o);
    let mixer = null;
    if (a.clips.length) { mixer = new THREE.AnimationMixer(a.root); const c = a.clips.find(c => new RegExp(opts.clip || 'walk|run|fly', 'i').test(c.name)) || a.clips[0]; mixer.clipAction(c).play(); }
    const p = { o, mixer, path: opts.path || null, t: 0 };
    props.push(p);
    o.scale.setScalar(.01); await TWEENS.add(.35, e => o.scale.setScalar(Math.max(.01, e)), 'back');
    return p;
  }
  function clearProps() { for (const p of props.splice(0)) SHOP.scene.remove(p.o); }
  SHOP.hooks.push((dt, t) => { for (const p of props) { if (p.mixer) p.mixer.update(dt); if (p.path) { p.t += dt; p.path(p, dt, t); } } });

  // ---------- minigames ----------
  // clicar num alvo que corre pela tela
  function catchGame({ img, hits = 3, time = 5.5, title = 'PEGUE!', size = 150 }) {
    VN.hide();
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'mg-overlay';
      ov.innerHTML = `<div class="mini-head"><b>${title}</b> <span class="mini-hits">0/${hits}</span> <span class="mini-time"></span></div><img class="mini-target" src="${img}" draggable="false" style="width:${size}px">`;
      document.body.appendChild(ov);
      const tg = ov.querySelector('.mini-target');
      let x = innerWidth * .2, y = innerHeight * .5, vx = 340 + Math.random() * 200, vy = 260 * (Math.random() < .5 ? -1 : 1), n = 0, t0 = performance.now(), done = false, last = t0;
      const step = now => {
        if (done) return;
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        x += vx * dt; y += vy * dt;
        if (x < 0 || x > innerWidth - size) { vx *= -1; x = Math.max(0, Math.min(innerWidth - size, x)); }
        if (y < 70 || y > innerHeight - size) { vy *= -1; y = Math.max(70, Math.min(innerHeight - size, y)); }
        if (Math.random() < .02) { vx += rnd(-200, 200); vy += rnd(-200, 200); }
        const sp = Math.hypot(vx, vy); if (sp > 700) { vx *= 700 / sp; vy *= 700 / sp; }
        tg.style.transform = `translate(${x}px,${y}px) scaleX(${vx < 0 ? -1 : 1})`;
        const left = time - (now - t0) / 1000;
        ov.querySelector('.mini-time').textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's';
        if (left <= 0) return finish(false);
        requestAnimationFrame(step);
      };
      const finish = ok => { if (done) return; done = true; setTimeout(() => ov.remove(), 250); res(ok); };
      tg.addEventListener('pointerdown', e => {
        e.stopPropagation(); n++; AUDIO.sfx('slap'); tg.classList.remove('hit'); void tg.offsetWidth; tg.classList.add('hit');
        ov.querySelector('.mini-hits').textContent = `${n}/${hits}`;
        vx = (vx < 0 ? 1 : -1) * (400 + n * 90); vy = rnd(-400, 400);
        if (n >= hits) finish(true);
      });
      ov.addEventListener('pointerdown', () => AUDIO.sfx('soft', { vol: .3 }));
      requestAnimationFrame(step);
      window.__mini = { finish }; // (testes)
    });
  }
  // digitar uma palavra rápido
  function typeGame({ word, time = 4, title = 'DIGITE RÁPIDO!' }) {
    VN.hide();
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'mg-overlay';
      ov.innerHTML = `<div class="mini-type"><div class="mini-head"><b>${title}</b> <span class="mini-time"></span></div><div class="mini-word">${[...word].map(c => `<span>${c}</span>`).join('')}</div><input class="mini-in" maxlength="${word.length + 4}" autocomplete="off" spellcheck="false"></div>`;
      document.body.appendChild(ov);
      const inp = ov.querySelector('.mini-in'); setTimeout(() => inp.focus(), 30);
      const t0 = performance.now(); let done = false;
      const finish = ok => { if (done) return; done = true; clearInterval(iv); setTimeout(() => ov.remove(), 400); res(ok); };
      const iv = setInterval(() => { const left = time - (performance.now() - t0) / 1000; ov.querySelector('.mini-time').textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's'; if (left <= 0) finish(false); }, 50);
      inp.addEventListener('keydown', e => e.stopPropagation());
      inp.addEventListener('input', () => {
        const v = inp.value.toUpperCase(); AUDIO.sfx('key', { vol: .3 });
        const sp = ov.querySelectorAll('.mini-word span');
        sp.forEach((s, i) => s.className = i < v.length ? (v[i] === word[i] ? 'ok' : 'bad') : '');
        if (v === word) { AUDIO.sfx('confirm'); finish(true); }
      });
      window.__mini = { finish };
    });
  }
  function charImg(def, expr = 'angry') { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CHARS.drawCharacter(def.spec, expr, {})); }

  // ---------- helpers de narração ----------
  const narr = t => { VN.speaker = null; return VN.say('', t); };
  const choose = opts => VN.choose(opts);
  const addMoney = (v, why) => { GAME.addMoney(v, true); const g = G(); g.log.events = (g.log.events || 0) + v; };
  const safeLoss = pct => { const g = G(); const cap = mod('lossCap') > 0 ? Math.min(pct, mod('lossCap')) : pct; return Math.max(0, Math.min(Math.round(g.money * cap), 250 + g.day * 35, g.money - 1)); };

  // ---------- eventos do meio do expediente ----------
  const MID = [
    {
      id: 'carteira', w: 1.2, run: async () => {
        await prop('e_wallet', [0.6, 0.02, -0.9], { rot: .6 }); AUDIO.sfx('drop');
        await narr('Você acha uma <b>carteira</b> caída no chão da loja. Tem dinheiro e um documento dentro...');
        const c = await choose([{ label: '🤝 Guardar pra devolver ao dono', value: 'dev' }, { label: '💸 Ficar com o dinheiro', sub: 'ninguém tá vendo... será?', value: 'fica' }]);
        clearProps();
        if (c === 'dev') {
          GAME.repChange(.3);
          if (Math.random() < .6) { const v = r5(rnd(30, 90)); addMoney(v); AUDIO.sfx('eventGood'); await narr(`O dono voltou desesperado e te deu <b>${money(v)}</b> de recompensa. Honestidade compensa! (+reputação)`); }
          else await narr('O dono veio buscar e agradeceu muito. A história se espalhou pelo bairro. (+reputação)');
        } else {
          const v = r5(rnd(60, 160)); addMoney(v);
          if (Math.random() < .35) { GAME.repChange(-.5); AUDIO.sfx('eventBad'); await narr(`Você embolsou ${money(v)}... mas uma cliente viu tudo pela vitrine e contou pro bairro inteiro. (−0,5★)`); }
          else await narr(`Você embolsou <b>${money(v)}</b>. Ninguém viu. Dessa vez.`);
        }
      },
    },
    {
      id: 'ladrao', w: .9, cond: g => g.day >= 2, run: async () => {
        const g = G(); AUDIO.sfx('alarm'); UI.glitch();
        await narr('🚨 <b>ASSALTO!</b> Um sujeito de gorro entra correndo e vai direto no caixa!');
        if (mod('antiTheft') > 0) {
          const dog = DECOR.active().includes('cachorro');
          AUDIO.sfx('eventGood'); GAME.repChange(.15);
          await narr(dog ? 'O <b>Caramelo</b> late tão alto que o ladrão tropeça e sai correndo de mãos vazias! 🐕' : 'Ele vê a <b>câmera de segurança</b>, fica branco e sai correndo sem levar nada! 📹');
          return;
        }
        await narr('Clique no ladrão <b>3 vezes</b> antes que ele fuja com o dinheiro!');
        const ok = await catchGame({ img: charImg(FIGHTS.NPCS.ladrao), hits: 3, time: 6, title: '👊 PEGA LADRÃO!', size: 170 });
        if (ok) { const v = r5(40 + g.day * 5); addMoney(v); GAME.repChange(.3); META.bump('thieves'); AUDIO.sfx('victory'); await narr(`Você imobilizou o ladrão! A polícia levou ele e o bairro te deu <b>${money(v)}</b> de recompensa. Herói! 🦸`); }
        else { const v = safeLoss(.25); addMoney(-v); AUDIO.sfx('eventBad'); await narr(`O ladrão fugiu com <b style="color:#c1121f">${money(v)}</b>! 😭 <small>Dica: dinheiro na poupança do banco não pode ser roubado. Uma câmera ou um cachorro também ajudam.</small>`); }
      },
    },
    {
      id: 'rato', w: .8, run: async () => {
        const p = await prop('e_rat', [-2.5, 0, -1.8], { rot: Math.PI / 2, path: (p, dt) => { p.o.position.x += dt * 1.6; p.o.position.z = -1.8 + Math.sin(p.t * 3) * .3; if (p.o.position.x > 2.8) p.o.position.x = -2.8; } });
        AUDIO.sfx('question');
        await narr('Um <b>RATO</b> atravessou a loja bem na frente de uma cliente! 🐀');
        const c = await choose([{ label: '🧹 Pegar o rato (minigame)', value: 'pega' }, { label: '📞 Chamar a dedetizadora', sub: 'R$ 60', value: 'dede', disabled: G().money <= 60 }, { label: '🙈 Fingir que não viu', value: 'nada' }]);
        if (c === 'pega') {
          const ok = await catchGame({ img: ASSETS.thumb('e_rat', { w: 160, h: 130 }), hits: 4, time: 5, title: '🧹 PEGA O RATO!', size: 110 });
          clearProps();
          if (ok) { GAME.repChange(.1); await narr('Você capturou o rato com uma caixa de papelão e soltou longe. A cliente aplaudiu!'); }
          else { GAME.repChange(-.25); await narr('O rato sumiu atrás da estante... e a cliente foi embora com nojo. (−reputação)'); }
        } else if (c === 'dede') { clearProps(); addMoney(-60); await narr('A dedetizadora resolveu. Loja limpinha de novo.'); }
        else { clearProps(); GAME.repChange(-.35); await narr('A cliente postou um vídeo do rato. Ótimo. (−0,35★)'); }
      },
    },
    {
      id: 'pombo', w: .7, run: async () => {
        await prop('e_pigeon', [0.9, 2.2, -1.2], { rot: -.5, clip: 'fly|idle', path: (p, dt, t) => { p.o.position.x = Math.sin(t * .8) * 2.4; p.o.position.y = 2.1 + Math.sin(t * 2.1) * .4; p.o.rotation.y = Math.cos(t * .8) > 0 ? Math.PI / 2 : -Math.PI / 2; } });
        AUDIO.sfx('question');
        await narr('Um <b>pombo</b> entrou pela porta e tá voando pela loja! 🐦');
        const c = await choose([{ label: '👋 Espantar (minigame)', value: 'esp' }, { label: '🍿 Dar pipoca pra ele', sub: 'ele pode virar seu amigo...', value: 'pip' }, { label: '🤷 Deixar ele lá', value: 'nada' }]);
        if (c === 'esp') { const ok = await catchGame({ img: ASSETS.thumb('e_pigeon', { w: 160, h: 130 }), hits: 3, time: 5, title: '👋 XÔ, POMBO!', size: 110 }); clearProps(); await narr(ok ? 'O pombo foi embora. Missão cumprida.' : 'O pombo fez "cocô de despedida" no balcão antes de sair. Que nojo. (−0,1★)'); if (!ok) GAME.repChange(-.1); }
        else if (c === 'pip') { clearProps(); META.addBuff({ id: 'pombo', name: 'Pombo amigo', emoji: '🐦' }, { kind: 'day', n: 1, mods: { luck: .7 } }); await narr('O pombo comeu, arrulhou feliz e foi embora. Dizem que pombo amigo dá sorte... (sorte +0,7 hoje)'); }
        else { clearProps(); GAME.repChange(-.15); await narr('O pombo derrubou um parafuso na cabeça de um cliente. (−0,15★)'); }
      },
    },
    {
      id: 'ambulante', w: 1, run: async () => {
        const g = G();
        await prop('e_box', [1.4, 0, -0.7], { rot: .4 });
        await narr('Um vendedor ambulante encosta no balcão: <i>"Ô chefe! Caixa de peças usadas, R$ 60. Umas funcionam, outras... bom, é surpresa!"</i>');
        const c = await choose([{ label: '📦 Comprar a caixa (R$ 60)', value: 'sim', disabled: g.money <= 60 }, { label: 'Não, obrigado', value: 'nao' }]);
        clearProps();
        if (c === 'sim') {
          addMoney(-60); const n = Math.random() < .25 ? 0 : Math.random() < .6 ? 2 : 3; const got = [];
          for (let i = 0; i < n; i++) got.push(GAME.giftPart());
          AUDIO.sfx(n ? 'eventGood' : 'eventBad');
          await narr(n ? `Dentro da caixa: ${got.join(', ')}. Tudo funcionando!` : 'Dentro da caixa: poeira, um controle remoto sem botão e uma meia. Golpe!');
        } else await narr('O vendedor foi embora resmungando.');
      },
    },
    {
      id: 'influencer', w: .8, run: async () => {
        const g = G(); const v = r5(60 + g.day * 8);
        await narr(`Uma influencer do bairro quer fazer um "publi" da sua loja por <b>${money(v)}</b>. "Meus 12 mil seguidores vão AMAR!"`);
        const c = await choose([{ label: `📸 Pagar o post (${money(v)})`, value: 'sim', disabled: g.money <= v }, { label: 'Dispensar', value: 'nao' }]);
        if (c === 'sim') { addMoney(-v); g.extraCust += 1; GAME.repChange(.2); AUDIO.sfx('eventGood'); await narr('O post bombou! +1 cliente hoje e a reputação subiu.'); }
        else await narr('Ela fez biquinho e foi embora.');
      },
    },
    {
      id: 'energia', w: .8, run: async () => {
        const g = G(); AUDIO.sfx('fail'); SHOP.setTime(20);
        await narr('⚡ <b>Caiu a energia!</b> A loja inteira apagou.');
        const c = await choose([{ label: '🔌 Alugar um gerador (R$ 45)', value: 'ger', disabled: g.money <= 45 }, { label: '🕯️ Esperar a luz voltar', sub: 'perde tempo', value: 'esp' }]);
        if (c === 'ger') { addMoney(-45); SHOP.setTime(g.hour); await narr('O gerador roncou e a loja voltou a funcionar.'); }
        else { await prop('e_candles', [0.8, 1.06, 2.2]); g.hour += 1.5; await narr('Você acendeu umas velas e esperou... 1h30 perdida.'); clearProps(); SHOP.setTime(g.hour); if (g.customersLeft > 1 && Math.random() < .5) { g.customersLeft--; await narr('Um cliente desistiu de esperar e foi embora.'); } }
      },
    },
    {
      id: 'golpe', w: .9, run: async () => {
        const g = G(); AUDIO.sfx('beep');
        await narr('📱 Chega uma mensagem no seu celular: <i>"BANCO DO BAIRRO: sua conta será BLOQUEADA! Clique no link e confirme seus dados: bit.ly/b4nc0-0f1c14l"</i>');
        const c = await choose([{ label: '🔗 Clicar no link', value: 'click' }, { label: '🚫 Ignorar e apagar', value: 'ign' }, { label: '🏦 Ligar pro banco pra conferir', value: 'liga' }]);
        if (c === 'click') { const v = safeLoss(.12); addMoney(-v); AUDIO.sfx('eventBad'); await narr(`GOLPE! Levaram <b style="color:#c1121f">${money(v)}</b> da sua conta. 😭 Nunca clique em links estranhos!`); }
        else if (c === 'liga') { await GAME.gainXP(25); await narr('O gerente confirmou: era golpe! Você ganhou experiência (+25 XP) e o banco te agradeceu.'); }
        else { await GAME.gainXP(15); await narr('Esperto! Era golpe. (+15 XP)'); }
      },
    },
    {
      id: 'fornecedor', w: .9, run: async () => {
        const g = G(); const v = r5(55 * ECON.partMult());
        await prop('e_box', [-1.4, 0, -0.7]);
        await narr(`O Seu Toninho do fornecedor passou: <i>"Promoção relâmpago: 3 peças sortidas por ${money(v)}!"</i>`);
        const c = await choose([{ label: `📦 Comprar (${money(v)})`, value: 'sim', disabled: g.money <= v }, { label: 'Agora não', value: 'nao' }]);
        clearProps();
        if (c === 'sim') { addMoney(-v); const got = [GAME.giftPart(), GAME.giftPart(), GAME.giftPart()]; AUDIO.sfx('cash'); await narr(`Chegou: ${got.join(', ')}.`); }
      },
    },
    {
      id: 'crianca', w: .6, cond: () => window.DECOR && DECOR.active().some(id => DECOR.DEC[id].type !== 'pet'), run: async () => {
        const d = DECOR.breakRandom();
        UI.shake();
        await narr(`CRASH! Uma criança correndo derrubou seu <b>${d.name}</b>! A mãe vem pedindo mil desculpas...`);
        const c = await choose([{ label: '💰 Aceitar que ela pague o conserto', value: 'paga' }, { label: '😊 "Tudo bem, criança é assim mesmo"', value: 'perdoa' }]);
        if (c === 'paga') { const v = DECOR.repairCost(d.id); addMoney(v); DECOR.state().broken = DECOR.state().broken.filter(x => x !== d.id); DECOR.apply(); await narr(`Ela pagou ${money(v)} e o ${d.name} foi consertado na hora.`); }
        else { GAME.repChange(.35); await narr('A mãe ficou emocionada e prometeu trazer a família toda. (+0,35★) <small>Conserte a decoração pelo catálogo.</small>'); }
      },
    },
    {
      id: 'gatinho', w: .6, cond: () => window.DECOR && !DECOR.owned().some(id => DECOR.DEC[id].type === 'pet'), run: async () => {
        await narr('🐱 Um <b>gatinho de rua</b> entrou miando e se enroscou na sua perna. Ele parece com fome...');
        const c = await choose([{ label: '💕 Adotar! (vira o mascote da loja)', value: 'sim' }, { label: 'Levar pra fora', value: 'nao' }]);
        if (c === 'sim') { const s = DECOR.state(); s.owned.push('gato'); s.placed.pet = 'gato'; DECOR.apply(); META.bump('decorOwned', s.owned.length, 'max'); AUDIO.sfx('eventGood'); await narr('Agora a loja tem um mascote: o <b>Gato Pixel</b>! Clique nele pra fazer carinho (sorte +1 por dia). 🐾'); }
        else await narr('O gatinho foi embora... olhando pra trás. 💔');
      },
    },
    {
      id: 'quermesse', w: .6, run: async () => {
        const g = G();
        await narr('As senhoras da igreja estão arrecadando doações para a quermesse do bairro.');
        const c = await choose([{ label: '💝 Doar R$ 50', value: 50, disabled: g.money <= 50 }, { label: 'Doar R$ 15', value: 15, disabled: g.money <= 15 }, { label: 'Hoje não dá...', value: 0 }]);
        if (c) { addMoney(-c); GAME.repChange(c >= 50 ? .4 : .15); META.addBuff({ id: 'quermesse', name: 'Bênção da quermesse', emoji: '🙏' }, { kind: 'night', n: 1, mods: { luck: c >= 50 ? 1 : .4 } }); await narr(`Deus lhe pague! (+reputação e sorte +${c >= 50 ? 1 : .4} no cassino esta noite)`); }
      },
    },
    {
      id: 'contrato', w: 1, cond: g => g.day >= 2 && !(g.contracts || []).some(c => !c.done), run: async () => {
        const c0 = makeContract();
        await prop('e_briefcase', [1.3, 1.06, 2.0]);
        await narr(`📋 Um representante da <b>${c0.company}</b> quer um contrato: consertar <b>${c0.need} ${c0.typeName}</b> até o <b>dia ${c0.due}</b>. Pagamento extra de <b>${money(c0.reward)}</b>. Se falhar: multa de ${money(c0.penalty)}.`);
        const c = await choose([{ label: '✍️ Assinar o contrato', value: 'sim' }, { label: 'Recusar', value: 'nao' }]);
        clearProps();
        if (c === 'sim') { const g = G(); g.contracts = (g.contracts || []).concat(c0); AUDIO.sfx('confirm'); await narr(`Contrato assinado! Clientes da ${c0.company} vão aparecer com ${c0.typeName}.`); }
      },
    },
    {
      id: 'esquecido', w: .6, run: async () => {
        await narr('Você acha um celular velho esquecido na loja há meses. Ninguém veio buscar.');
        const c = await choose([{ label: '♻️ Vender pro ferro-velho', sub: 'R$ 30–70', value: 'vende' }, { label: '🔩 Desmontar e aproveitar as peças', value: 'pecas' }]);
        if (c === 'vende') { const v = r5(rnd(30, 70)); addMoney(v); await narr(`O ferro-velho pagou ${money(v)}.`); }
        else { const a = GAME.giftPart(); await narr(`Você aproveitou: ${a}.`); }
      },
    },
    {
      id: 'fogo', w: .5, run: async () => {
        const g = G(); AUDIO.sfx('alarm'); UI.flash('#ff7b00', .5);
        await prop('e_fire', [2.9, 0, -2.4]);
        await narr('🔥 <b>FOGO!</b> O estabilizador velho entrou em curto e pegou fogo!');
        if (mod('fireSafe') > 0) { clearProps(); AUDIO.sfx('eventGood'); await narr('Você pega o <b>extintor</b> e apaga tudo em 3 segundos. Ufa! 🧯'); return; }
        await narr('Sem extintor! Digite <b>APAGA</b> rapidinho enquanto joga água!');
        const ok = await typeGame({ word: 'APAGA', time: 4, title: '🔥 DIGITE RÁPIDO!' });
        clearProps();
        if (ok) { addMoney(-30); await narr('Você apagou o fogo com um balde! Só perdeu o estabilizador (R$ 30).'); }
        else { const v = r5(80 + g.day * 8); addMoney(-v); const d = window.DECOR ? DECOR.breakRandom() : null; GAME.repChange(-.2); AUDIO.sfx('eventBad'); await narr(`Os bombeiros tiveram que vir. Prejuízo de <b style="color:#c1121f">${money(v)}</b>${d ? ` e o ${d.name} estragou` : ''}. <small>Um extintor (catálogo) evita isso.</small>`); }
      },
    },
    {
      id: 'vazamento', w: .6, run: async () => {
        const g = G(); await prop('e_mop', [-2.0, 0, -1.0], { rot: .5 });
        await narr('💧 Tá pingando água do teto! Goteira bem em cima da bancada.');
        const c = await choose([{ label: '🔧 Chamar o encanador (R$ 50)', value: 'enc', disabled: g.money <= 50 }, { label: '🧽 Colocar um balde e seguir', value: 'balde' }]);
        clearProps();
        if (c === 'enc') { addMoney(-50); await narr('Goteira resolvida.'); }
        else { const keys = Object.keys(g.stock).filter(k => g.stock[k] > 0); if (keys.length && Math.random() < .5) { const k = pick(keys); g.stock[k]--; await narr(`A água pingou no estoque e estragou 1 ${REPAIR.PARTS[k].name}.`); } else await narr('O balde deu conta. Por enquanto.'); }
      },
    },
    {
      id: 'radio', w: .6, run: async () => {
        AUDIO.sfx('bell');
        await narr('📻 A Rádio Bairro FM tá ligando pros comércios: <i>"Quem responder a senha primeiro ganha R$ 150!"</i> A senha é <b>SORTE</b>!');
        const ok = await typeGame({ word: 'SORTE', time: 3.5, title: '📻 DIGITE A SENHA!' });
        if (ok) { addMoney(150); AUDIO.sfx('bigWin'); await narr('VOCÊ GANHOU! <b>R$ 150</b> no ar, ao vivo! 🎉'); }
        else await narr('A padaria respondeu primeiro. Droga!');
      },
    },
    {
      id: 'tati', w: .5, run: async () => {
        const it = pick(META.ITEMS.filter(i => i.price <= 25 && !i.smoke));
        GAME.addItem(it.id);
        await narr(`A <b>Tati</b> do mercadinho passou pra dar um oi e deixou de presente: ${it.emoji} <b>${it.name}</b>! "É por conta da casa, freguês!"`);
      },
    },
    {
      id: 'agiota_oferta', w: .8, cond: g => g.day >= 3 && !ECON.bank().metAgiota && g.money < 400 + g.day * 60, run: async () => {
        const b = ECON.bank(); b.metAgiota = true;
        const sp = await SHOP.showCustomer(FIGHTS.NPCS.jorjao); VN.speaker = sp;
        await VN.say('Jorjão', 'E aí, chapa... Tô vendo que a coisa tá apertada, né? O aluguel subindo, o caixa minguando...', { expr: 'smug' });
        await VN.say('Jorjão', 'Eu sou o Jorjão. Empresto dinheiro na hora, sem papelada. É só me procurar no Banco do Bairro... do lado de fora, sabe? Hehe.', { expr: 'smile' });
        VN.hide(); await SHOP.leaveCustomer(1);
        await narr('🕶️ Agora o <b>Seu Jorjão</b> aparece no Banco do Bairro. Dinheiro fácil... com juros difíceis.');
      },
    },
    // brigas
    { id: 'f_reclamacao', w: 1.8, fight: true, cond: g => g.day >= 2, run: async () => { const g = G(); const prev = (g.grudges || []).shift(); const c = prev ? CHARS.ROSTER.find(x => x.id === prev.id) || pick(CHARS.ROSTER) : pick(CHARS.ROSTER); const r = await FIGHTS.run('reclamacao', { char: c, prev }); if (r.redo) await GAME.warrantyRepair(c, prev); } },
    { id: 'f_barraco', w: 1.0, fight: true, cond: g => g.day >= 2, run: async () => { await FIGHTS.run('barraco'); } },
    { id: 'f_karen', w: 1.0, fight: true, cond: g => g.day >= 3, run: async () => { await FIGHTS.run('karen'); } },
    // ---- v1.4: mais brigas e conversas digitando ----
    { id: 'f_rival', w: 1.3, fight: true, cond: g => window.RIVAL && RIVAL.active(), run: async () => { await FIGHTS.run('rival'); } },
    { id: 'f_golpista', w: 1.0, fight: true, cond: g => g.day >= 3 && !g.stolenPhone, run: async () => { await FIGHTS.run('golpista'); } },
    { id: 'f_casal', w: 1.1, fight: true, cond: g => g.day >= 2, run: async () => { await FIGHTS.run('casal'); } },
    { id: 'f_crianca', w: 1.0, fight: true, run: async () => { await FIGHTS.run('crianca'); } },
    { id: 'f_jornalista', w: .9, fight: true, cond: g => window.RIVAL && RIVAL.active() && (g.lastPress || 0) + 4 <= g.day, run: async () => { G().lastPress = G().day; await FIGHTS.run('jornalista'); } },
    { id: 'f_fornecedor', w: .6, fight: true, cond: g => window.RIVAL && RIVAL.active() && g.day >= 5, run: async () => { await FIGHTS.run('fornecedor'); } },
    {
      id: 'hacker', w: .8, run: async () => {
        const g = G(); AUDIO.sfx('glitch'); UI.glitch();
        await narr('💻 O computador da loja travou com uma tela vermelha: <b>"SEUS ARQUIVOS FORAM SEQUESTRADOS"</b>. Digite os comandos rápido pra salvar os dados!');
        const words = pick([['ANTIVIRUS', 'BACKUP', 'REINICIAR'], ['DESCONECTAR', 'LIMPAR', 'SENHA'], ['FIREWALL', 'ESCANEAR', 'APAGAR']]);
        let ok = true;
        for (const w of words) { if (!await typeGame({ word: w, time: 3.2 + w.length * .12, title: `💻 COMANDO ${words.indexOf(w) + 1}/3` })) { ok = false; break; } }
        if (ok) { await GAME.gainXP(25); AUDIO.sfx('victory'); await narr('Vírus eliminado! Você salvou a agenda de clientes. (+25 XP)'); }
        else { const v = safeLoss(.08); addMoney(-v); GAME.repChange(-.1); await narr(`O vírus apagou metade da agenda. Você pagou <b style="color:#c1121f">${money(v)}</b> pra um técnico de informática recuperar o resto.`); }
      },
    },
    {
      id: 'senha', w: .8, run: async () => {
        const c = pick(CHARS.ROSTER); const code = String(1000 + ((Math.random() * 9000) | 0)) + String((Math.random() * 10) | 0);
        const sp = await SHOP.showCustomer(c); VN.speaker = sp;
        await VN.say(c.name, `Socorro! Esqueci a senha do meu celular! Minha filha anotou aqui... é <b>${code.split('').join(' ')}</b>! Digita pra mim, rápido, que vai bloquear!`, { expr: 'worried' });
        const ok = await typeGame({ word: code, time: 4, title: '🔒 DIGITE A SENHA!' });
        VN.speaker = sp;
        if (ok) { const v = r5(20 + G().day * 2); addMoney(v); await VN.say(c.name, `Destravou! Obrigada! Toma ${money(v)} pelo favor!`, { expr: 'happy' }); }
        else await VN.say(c.name, 'Bloqueou por 1 hora... tudo bem, eu espero. Snif.', { expr: 'sad' });
        VN.hide(); await SHOP.leaveCustomer(1);
      },
    },
    {
      id: 'ditado', w: .7, run: async () => {
        const code = pick(['BAT-7X2', 'LCD-44K', 'USB-C9', 'CHIP-3A', 'CAM-12M']);
        await narr(`📞 O Seu Toninho liga: <i>"Promoção pros 3 primeiros que me passarem o código da peça! Anota aí: <b>${code}</b>!"</i>`);
        const ok = await typeGame({ word: code, time: 4.5, title: '📞 DITE O CÓDIGO!' });
        if (ok) { const a = GAME.giftPart(), b = GAME.giftPart(); AUDIO.sfx('eventGood'); await narr(`Você foi o primeiro! Ganhou: ${a} e ${b}.`); }
        else await narr('"Ih, já acabou, rapaz." Fica pra próxima.');
      },
    },
    {
      id: 'cliente_consertaja', w: 1.0, cond: g => window.RIVAL && RIVAL.active(), run: async () => {
        const c = pick(CHARS.ROSTER); const sp = await SHOP.showCustomer(c); VN.speaker = sp;
        await VN.say(c.name, 'Fui na ConsertaJá do outro lado da rua... trocaram a tela e em dois dias parou tudo! Olha isso!', { expr: 'angry' });
        const ch = await choose([{ label: '💝 Arrumar de graça pra conquistar o cliente', sub: '+bairro, +reputação', value: 'gratis' }, { label: '💰 Cobrar o conserto normal', sub: `+${money(r5(90 + G().day * 8))}`, value: 'cobra' }, { label: '🔎 Examinar a peça que eles usaram', sub: 'pode virar prova', value: 'exam' }]);
        VN.speaker = sp;
        if (ch === 'gratis') { RIVAL.share(.05); GAME.repChange(.25); await VN.say(c.name, 'De graça?! Nunca mais piso naquela ConsertaJá! Vou contar pra todo mundo!', { expr: 'happy' }); }
        else if (ch === 'cobra') { const v = r5(90 + G().day * 8); addMoney(v); RIVAL.share(.02); await VN.say(c.name, 'Pelo menos aqui funciona. Tá pago!', { expr: 'smile' }); }
        else {
          if (RIVAL.state().ch4 && Math.random() < .65) { RIVAL.evidence(1, `A tela que a ConsertaJá colocou no aparelho de ${c.name} era falsificada, com etiqueta de original.`); await VN.say(c.name, 'Falsificada?! Eu paguei por original! Pode usar isso contra eles!', { expr: 'angry' }); }
          else await VN.say(c.name, 'Hmm, e aí? Não achou nada? Tá bom... valeu por olhar.', { expr: 'neutral' });
        }
        VN.hide(); await SHOP.leaveCustomer(1);
      },
    },
    {
      id: 'candidato', w: .5, cond: g => window.TEAM && !TEAM.hired && g.story && g.story.seen.includes('reforcos'), run: async () => {
        const id = pick(['leo', 'rafa', 'nina']); const ch = CHARS.ROSTER.find(x => x.id === id);
        const sp = await SHOP.showCustomer(ch); VN.speaker = sp;
        await VN.say(ch.name, 'Oi! Ainda tá precisando de ajudante? Eu topo!', { expr: 'smile' });
        const c = await choose([{ label: `Contratar ${ch.name}`, value: 'sim' }, { label: 'Agora não', value: 'nao' }]);
        if (c === 'sim') { TEAM.hire(id); await VN.say(ch.name, 'Uhuul! Amanhã cedo tô aqui!', { expr: 'happy' }); }
        VN.hide(); await SHOP.leaveCustomer(1);
      },
    },
  ];

  async function midday() {
    const g = G();
    if (!g || g.dead) return false;
    g.eventsToday = g.eventsToday || 0;
    if (g.eventsToday >= 3 || g.day < 1) return false;
    const fm = (g.event && g.event.fightMult) || 1;
    let chance = .5 + Math.min(.12, g.day * .006);
    if (Math.random() > chance) return false;
    const pool = MID.filter(e => !e.cond || e.cond(g));
    const w = e => e.w * (e.fight ? fm * (g.rep < 2 ? 1.4 : 1) * ((g.grudges || []).length && e.id === 'f_reclamacao' ? 2.5 : 1) : 1);
    const tot = pool.reduce((a, e) => a + w(e), 0); let r = Math.random() * tot; let ev = pool[0];
    for (const e of pool) { r -= w(e); if (r <= 0) { ev = e; break; } }
    return runEvent(ev);
  }
  async function runEvent(ev) {
    const g = G();
    g.eventsToday = (g.eventsToday || 0) + 1; META.bump('events');
    SHOP.hideCustomer(); VN.hide();
    if (!ev.fight) { AUDIO.sfx('event'); UI.bigText(pick(['EVENTO!', 'OPA!', 'EITA!']), '#ffd23f'); await wait(.6); }
    try { await ev.run(); } catch (e) { console.error('evento', ev.id, e); }
    clearProps(); VN.hide(); FIGHTS.closeChat();
    GAME.refreshHUD();
    return true;
  }

  // ---------- madrugada ----------
  const NIGHT = [
    {
      id: 'assalto_noite', w: 1, run: async () => {
        const g = G();
        if (mod('antiTheft') > 0) { await narr('🌙 De madrugada, alguém tentou arrombar a loja... mas a câmera/o cachorro espantou. Tudo intacto!'); return; }
        const v = safeLoss(.15);
        if (v <= 0) { await narr('🌙 Arrombaram a loja de madrugada... e não acharam nada pra levar. Vantagens de estar liso.'); return; }
        addMoney(-v); AUDIO.sfx('eventBad');
        await narr(`🌙 A loja foi <b>arrombada</b> de madrugada! Levaram <b style="color:#c1121f">${money(v)}</b> do caixa. <small>Dinheiro na poupança fica seguro. Câmera ou cachorro evitam isso.</small>`);
      },
    },
    { id: 'sonho', w: 1, run: async () => { const t = new Set(); while (t.size < 6) t.add(1 + ((Math.random() * 30) | 0)); const nums = [...t].sort((a, b) => a - b); G().tickets.push(nums); await narr(`💭 Você sonhou com a tia Neide sussurrando números: <b>${nums.join(' - ')}</b>. Ao acordar, achou um bilhete da Mega-Sorte com esses números no bolso!`); } },
    { id: 'vizinho', w: .9, run: async () => { META.addBuff({ id: 'olheiras', name: 'Noite mal dormida', emoji: '🥱' }, { kind: 'day', n: 1, mods: { parTime: -12 } }); await narr('🎶 O vizinho deu uma festa de arrocha até as 5 da manhã. Você mal dormiu. (−12s na meta dos consertos hoje)'); } },
    { id: 'tia', w: .7, run: async () => { const v = r5(rnd(40, 150)); addMoney(v); AUDIO.sfx('eventGood'); await narr(`💌 Chegou uma carta da tia Neide com <b>${money(v)}</b> e um bilhete: "Tô orgulhosa. E fique longe do cassino!"`); } },
    { id: 'insonia', w: .6, run: async () => { await GAME.gainXP(20); await narr('🌙 Sem sono, você passou a madrugada vendo tutoriais de conserto. (+20 XP)'); } },
    { id: 'goteira_noite', w: .5, run: async () => { const g = G(); const keys = Object.keys(g.stock).filter(k => g.stock[k] > 0); if (!keys.length) { await narr('🌧️ Choveu forte de madrugada, mas o estoque vazio não tinha nada pra estragar.'); return; } const k = pick(keys); g.stock[k]--; await narr(`🌧️ Choveu forte de madrugada e uma goteira estragou 1 ${REPAIR.PARTS[k].name} do estoque.`); } },
  ];
  async function night() {
    const g = G(); if (!g || Math.random() > .38) return;
    const ev = pick(NIGHT.flatMap(e => Array(Math.round(e.w * 10)).fill(e)));
    ENGINE.use('shop'); SHOP.setTime(23); SHOP.hideCustomer();
    AUDIO.sfx('event');
    await ev.run(); VN.hide(); META.bump('events'); GAME.refreshHUD();
  }


  // manhã: consequências de coisas feitas ontem (celular suspeito)
  async function morning() {
    const g = G(); const out = [];
    if (g.stolenPhone && g.stolenPhone.day < g.day) {
      const sp = g.stolenPhone; g.stolenPhone = null;
      if (Math.random() < .45) {
        const fine = r5(250 + g.day * 10); const v = Math.min(fine, Math.max(0, g.money - 1)); GAME.addMoney(-v, true); g.log.events -= v; GAME.repChange(-.6);
        out.push(`🚓 A polícia apareceu atrás do celular roubado que você comprou! Multa de <b style="color:#c1121f">${money(v)}</b> e −0,6★.`);
      } else { const v = r5(sp.paid * (1.8 + Math.random())); GAME.addMoney(v, true); g.log.events += v; out.push(`📱 Você revendeu o celular "misterioso" por <b>${money(v)}</b>. Ninguém fez perguntas... dessa vez.`); }
    }
    if (g.partsShock > 0) g.partsShock--;
    return out;
  }

  window.EVENTS = { morning, DAILY, rollDaily, newspaper, midday, night, runEvent, MID, NIGHT, review, contractProgress, contractsEndDay, contractDevice, catchGame, typeGame, prop, clearProps };
})();
