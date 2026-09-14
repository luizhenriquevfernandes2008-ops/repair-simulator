// BRIGAS — clientes irritados que você acalma conversando pelo teclado.
// Cada conflito cria uma "mente" (brain.js) por personagem; o jogador digita livremente e o
// personagem responde conforme o que foi escrito, a personalidade e o humor do momento.
(function () {
  const $ = s => document.querySelector(s);
  const pick = a => a[(Math.random() * a.length) | 0];
  const G = () => GAME.state;
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);

  // personagens extras (desenhados por código, como o elenco)
  const NPCS = {
    fiscal: { id: 'fiscal', name: 'Fiscal Barbosa', spec: { skin: '#e8c4a0', hair: '#5b5b5b', hairBack: 'short', hairFront: 'parted', eyes: '#3a3a3a', eyeStyle: 'sharp', male: true, outfit: 'suit', outfitColor: '#5c677d', outfitColor2: '#ffd23f', acc: ['glasses', 'mustache'], glassesColor: '#222' } },
    neusa: { id: 'neusa', name: 'Dona Neusa', spec: { skin: '#f1d3bc', hair: '#a8a8b3', hairBack: 'bun', hairFront: 'curly', eyes: '#6b705c', eyeStyle: 'old', old: true, outfit: 'cardigan', outfitColor: '#8e7dbe', outfitColor2: '#f7f7ff', acc: ['glasses'], glassesColor: '#6c584c' } },
    jorjao: { id: 'jorjao', name: 'Jorjão', spec: { skin: '#b5835a', hair: '#1b1b1b', hairBack: 'bald', hairFront: 'bald', eyes: '#2b2b2b', eyeStyle: 'sharp', male: true, outfit: 'jacket', outfitColor: '#111111', outfitColor2: '#ffd23f', acc: ['beard', 'earrings'] } },
    regina: { id: 'regina', name: 'Dona Regina', spec: { skin: '#ffe0cc', hair: '#f4d35e', hairBack: 'bob', hairFront: 'side', eyes: '#577590', outfit: 'turtleneck', outfitColor: '#e0aaff', outfitColor2: '#ffffff', acc: ['earrings', 'glasses'], glassesColor: '#111', lips: '#c9184a' } },
    ladrao: { id: 'ladrao', name: 'Ladrão', spec: { skin: '#e0b98e', hair: '#222', hairBack: 'short', hairFront: 'messy', eyes: '#222', eyeStyle: 'sharp', male: true, outfit: 'hoodie', outfitColor: '#2b2d42', outfitColor2: '#8d99ae', acc: ['beanie'] } },
  };

  // ---------- interface do chat ----------
  let chatResolve = null, pendingSay = null;
  let meterInvert = false;
  function openChat(npcs, hints, opts = {}) {
    const el = $('#chat'); meterInvert = !!opts.invert;
    el.innerHTML = `<div class="chat-top">${opts.badge ? `<div class="chat-badge" id="chat-badge">${opts.badge}</div>` : ''}${npcs.map(n => `<div class="chat-npc" data-id="${n.id}"><b>${n.name}</b><small class="meter-lbl">${opts.meter || 'raiva'}</small><div class="anger"><div class="anger-fill"></div></div><span class="anger-emo">😠</span></div>`).join('')}</div>
      <div class="chat-log" id="chat-log"></div>
      <div class="chat-hints hidden" id="chat-hints">${hints.map(h => `<span>${h}</span>`).join('')}</div>
      <div class="chat-row"><input id="chat-in" maxlength="180" autocomplete="off" spellcheck="false" placeholder="Digite o que você vai dizer e aperte Enter..."><button id="chat-send" class="btn green">Enviar</button><button id="chat-hint" class="btn purple" title="Ideias de frases">💡</button></div>
      <div class="chat-foot"><span id="chat-turns"></span><button id="chat-quit" class="mini-btn">${opts.quit || 'Encerrar a conversa (o cliente vai embora bravo)'}</button></div>`;
    el.classList.remove('hidden');
    const inp = $('#chat-in');
    pendingSay = null;
    const send = () => { const v = inp.value.trim(); if (inp.disabled) return; if (!chatResolve) { if (v) { pendingSay = v; inp.value = ''; inp.disabled = true; } return; } const r = chatResolve; chatResolve = null; inp.value = ''; r(v); };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); send(); } else if (e.key.length === 1 || e.key === 'Backspace') AUDIO.sfx('key', { vol: .25, rate: .9 + Math.random() * .3 }); });
    $('#chat-send').onclick = send;
    $('#chat-hint').onclick = () => { $('#chat-hints').classList.toggle('hidden'); AUDIO.sfx('select'); };
    $('#chat-hints').querySelectorAll('span').forEach(s => s.onclick = () => { inp.value = s.textContent; inp.focus(); });
    $('#chat-quit').onclick = () => { if (!chatResolve) return; const r = chatResolve; chatResolve = null; r(null); };
    setTimeout(() => inp.focus(), 50);
  }
  function closeChat() { $('#chat').classList.add('hidden'); $('#chat').innerHTML = ''; chatResolve = null; }
  function ask() { const inp = $('#chat-in'); if (pendingSay !== null) { const v = pendingSay; pendingSay = null; return Promise.resolve(v); } inp.disabled = false; inp.focus(); return new Promise(r => { chatResolve = r; }); }
  function logLine(who, text, cls) {
    const log = $('#chat-log'); const d = document.createElement('div'); d.className = 'msg ' + cls;
    d.innerHTML = `<b>${who}</b><span></span>`; log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d.querySelector('span');
  }
  async function typeLine(sp, who, text, cls = 'npc') {
    const span = logLine(who, '', cls);
    if (sp) sp.talk(true);
    const plain = text;
    for (let i = 1; i <= plain.length; i += 2) {
      span.textContent = plain.slice(0, i);
      if (i % 6 === 1) AUDIO.sfx('blip', { vol: .22, rate: 1 + Math.random() * .3 });
      $('#chat-log').scrollTop = 1e6;
      await wait(.018);
    }
    span.textContent = plain;
    if (sp) sp.talk(false);
  }
  function setBars(minds) {
    for (const m of minds) {
      const box = document.querySelector(`.chat-npc[data-id="${m.npc.id}"]`); if (!box) continue;
      const f = box.querySelector('.anger-fill'); f.style.width = (meterInvert ? 100 - m.anger : m.anger) + '%';
      f.style.background = m.anger >= 70 ? 'linear-gradient(90deg,#e63946,#ff4d6d)' : m.anger >= 35 ? 'linear-gradient(90deg,#ffb703,#fb8500)' : 'linear-gradient(90deg,#52d68a,#9ef0b5)';
      box.querySelector('.anger-emo').textContent = m.anger >= 85 ? '🤬' : m.anger >= 65 ? '😡' : m.anger >= 45 ? '😠' : m.anger >= 25 ? '😒' : m.anger >= 10 ? '🙂' : '😊';
    }
  }
  function setTurns(t, max) { const el = $('#chat-turns'); if (el) el.innerHTML = 'Paciência: ' + '●'.repeat(Math.max(0, max - t)) + '<span style="opacity:.3">' + '●'.repeat(Math.min(max, t)) + '</span>'; }

  // papagaio repete o que você disse
  function parrot(raw, minds) {
    if (!window.DECOR || !DECOR.modSum('parrot') || Math.random() > .35) return null;
    const w = raw.split(/\s+/).filter(x => x.length >= 4).sort((a, b) => b.length - a.length)[0];
    if (!w) return null;
    for (const m of minds) if (m.p.humor > .45) m.anger = Math.max(0, m.anger - 8);
    return `🦜 ${w.toUpperCase().replace(/[^A-ZÀ-Ú0-9%$ ]/g, '')}! ${w.toUpperCase().replace(/[^A-ZÀ-Ú0-9%$ ]/g, '')}! RRRÁ!`;
  }

  // ---------- cenários ----------
  const HINTS = {
    base: ['Peço desculpas pelo transtorno, você tem toda razão.', 'Calma, vamos conversar numa boa.', 'Te dou 20% de desconto.', 'Posso consertar de novo de graça, com garantia.', 'Aceita um cafezinho enquanto a gente resolve?', 'O que eu posso fazer pra resolver isso?'],
    calote: ['Esse é o preço combinado, mas faço 10% pra você.', 'Entendo que tá caro, mas a peça é original.', 'Combinado é combinado, né?', 'Faço 15% e fica tudo certo.', 'Você viu como ficou perfeito?', 'Tá bom, pode pagar só metade.'],
    fila: ['Calma, os dois! Vamos por ordem de chegada.', 'Aiko, você chegou primeiro, é a sua vez.', 'Atendo os dois, um de cada vez.', 'Quem esperar ganha 10% de desconto!', 'Sem briga na minha loja, por favor.', 'Vamos tirar no par ou ímpar?'],
    barraco: ['Desculpa, Dona Neusa, prometo que não vai acontecer de novo.', 'A senhora tem razão, vou desligar mais cedo.', 'Aceita um café e um bolo?', 'Que tal a gente combinar um horário?', 'Nossa, que situação chata, sinto muito.', 'Palavra de honra: vou resolver hoje.'],
    fiscal: ['Está tudo em dia, o alvará está ali na parede.', 'Posso pagar a multa com desconto?', 'Me dá um prazo pra regularizar, por favor.', 'Prometo regularizar essa semana.', 'Com todo respeito, senhor, estou cumprindo as normas.', 'Eu pago a multa.'],
    agiota: ['Me dá mais uns dias de prazo, prometo pagar.', 'Toma R$ 100 agora e o resto amanhã.', 'Eu pago tudo, calma!', 'Jorjão, você sabe que eu sou de palavra.', 'A loja tá difícil, mas vou pagar.', 'Aceita um cafezinho?'],
    karen: ['A senhora tem toda razão, peço desculpas.', 'Eu sou o gerente, como posso ajudar?', 'Vou anotar sua sugestão, prometo melhorar.', 'Que tal um desconto na próxima visita?', 'Entendo sua frustração.', 'A senhora está linda hoje, aliás.'],
  };
  const SC = {
    reclamacao(c, prev) {
      const dev = prev ? prev.name : pick(c.devices.map(k => REPAIR.DEVICES[k].name));
      const base = prev ? prev.price : r5(120 + G().day * 12);
      const greedy = c.haggle > .45 || Math.random() < .35;
      return {
        kind: 'reclamacao', anger0: 55, maxTurns: 7, base, obj: dev, demand: greedy ? 'refund' : 'redo', target: greedy ? r5(50 + Math.random() * 40) : 0,
        grievance: `meu ${dev} voltou a dar problema depois do seu conserto`, demandTxt: greedy ? 'meu dinheiro de volta' : 'que você conserte direito, de graça',
        theirFault: Math.random() < .3,
        intro: [[`Ei! VOCÊ! Lembra do meu <i>${dev}</i>? Voltou a dar defeito!`, 'angry'], [greedy ? `Quero meu dinheiro de volta. Agora! Paguei ${UI.money(base)} nisso!` : 'Paguei caro e ficou pior! Conserta direito isso!', 'angry']],
      };
    },
    calote(c, job) {
      const target = r5(20 + c.haggle * 30 + Math.random() * 10);
      return {
        kind: 'calote', anger0: 45, maxTurns: 6, base: job.price, obj: job.name, demand: 'discount', target,
        grievance: `${UI.money(job.price)} por esse conserto é um roubo`, demandTxt: `${target}% de desconto`,
        intro: [[`Espera aí... ${UI.money(job.price)}?! Isso é um ASSALTO!`, 'angry'], [`Não pago isso nem a pau. Quero pelo menos ${target}% de desconto!`, 'angry']],
      };
    },
    barraco() {
      const why = pick([['esse letreiro neon piscando a noite toda na minha janela', 'que desligue esse letreiro de noite'], ['esse barulho de furadeira e solda o dia inteiro', 'silêncio e respeito'], ['os clientes estacionando na frente da minha garagem', 'que avise seus clientes'], ['o cheiro de solda subindo pro meu apartamento', 'que você resolva esse cheiro']]);
      return {
        kind: 'barraco', anger0: 62, maxTurns: 7, base: 0, demand: 'respect', target: 0,
        grievance: why[0], demandTxt: why[1],
        intro: [['Muito bonito, hein! Achei o dono da bagunça!', 'angry'], [`Eu não aguento mais ${why[0]}!`, 'angry']],
      };
    },
    fiscal() {
      const fine = r5(90 + G().day * 18);
      return {
        kind: 'fiscal', anger0: 40, maxTurns: 6, base: fine, fine, demand: 'docs', target: 100,
        grievance: 'encontrei irregularidades nesta loja', demandTxt: `o alvará e o extintor em dia, ou a multa de ${UI.money(fine)}`,
        intro: [['Bom dia. Fiscalização da prefeitura. Vistoria de rotina.', 'neutral'], [`Sem alvará à vista e sem extintor, a multa é de <b>${UI.money(fine)}</b>. Algo a declarar?`, 'smug']],
      };
    },
    agiota(debt) {
      return {
        kind: 'agiota', anger0: 58, maxTurns: 6, base: debt, debt, demand: 'pay', target: 100,
        grievance: 'o prazo acabou e você não pagou', demandTxt: `os meus ${UI.money(debt)}`,
        intro: [['Toc, toc. Lembra de mim, chapa?', 'smug'], [`Hoje é o dia. ${UI.money(debt)}. Em dinheiro. Agora.`, 'angry']],
      };
    },
    karen() {
      const why = pick([['vocês não consertam secador de cabelo', 'um pedido de desculpas e um desconto'], ['o técnico não me cumprimentou com entusiasmo', 'respeito'], ['a cor do seu letreiro é brega', 'que você reconheça que eu tenho razão'], ['vocês não aceitam cheque', 'falar com o gerente']]);
      return {
        kind: 'karen', anger0: 66, maxTurns: 7, base: 100, demand: 'respect', target: 0,
        grievance: `é um absurdo que ${why[0]}`, demandTxt: why[1],
        intro: [['Com licença. Quero falar com o GERENTE.', 'angry'], [`É um absurdo que ${why[0]}! Eu sou cliente há anos! ...De outras lojas, mas sou!`, 'angry']],
      };
    },
  };

  Object.assign(HINTS, {
    rival: ['Minha loja tem tradição, os clientes confiam em mim.', 'Qualidade não se compra, Vitor.', 'Pode vir, a gente se vê no fim do mês.', 'Aceita um cafezinho? Pra você ver como se atende bem.', 'Seu terno é bonito, pena que o serviço não é.', 'Sai da minha loja, por favor.'],
    golpista: ['De onde veio esse celular?', 'Tem nota fiscal?', 'Não compro coisa roubada.', 'Vou chamar a polícia!', 'Quanto você quer?', 'Compro, fechado.'],
    casal: ['Calma, os dois! Foi um acidente, ninguém tem culpa.', 'Vocês se amam, não briguem por um celular.', 'Divide o valor meio a meio!', 'Eu conserto e fica tudo bem.', 'Não importa de quem foi a culpa.', 'Aceitam um cafezinho?'],
    crianca: ['Calma, campeão, eu vou consertar seu bichinho!', 'Não chora, quer uma bala?', 'Prometo que ele vai ficar novinho.', 'Que bichinho legal! Como ele se chama?', 'Kkk ele só tá dormindo, relaxa.', 'Você é muito corajoso, sabia?'],
    jornalista: ['Nossa loja tem tradição de 40 anos no bairro, com peça original e garantia.', 'A gente cobra preço justo e trata cada cliente como família.', 'O segredo é cuidado, paciência e honestidade.', 'Obrigado a todos os vizinhos que confiam na gente!', 'A concorrência é boa pra todo mundo melhorar.', 'Venham tomar um café com a gente!'],
    beto: ['Calma, Beto, pode confiar em mim.', 'Eu entendo, deve ser difícil trabalhar pro Vitor.', 'Prometo que ninguém vai saber que foi você.', 'Você é uma pessoa boa, dá pra ver.', 'Se precisar de emprego, minha loja tá de portas abertas.', 'Quer um café?'],
    fornecedor: ['Seu Toninho, sou cliente fiel há anos, o senhor sabe.', 'Prometo pagar sempre em dia, palavra de honra.', 'Entendo que o Vitor paga mais, mas a gente tem história.', 'A Tia Neide sempre falou bem do senhor.', 'Aceita um cafezinho?', 'Vamos fazer um acordo justo pros dois.'],
    olga: ['Esse prédio é a história do bairro e eu quero cuidar dele com carinho.', 'Vou manter a loja da Tia Neide aberta pros vizinhos, com preço justo.', 'Prometo contratar gente do bairro e ensinar o ofício.', 'A Neide diria que eu trabalhei duro e fui honesto.', 'Com todo respeito, a senhora merece alguém que ame esse lugar.', 'Não é só um negócio, é um sonho de família.'],
  });
  Object.assign(SC, {
    rival() {
      const why = pick(['Vim ver de perto a "concorrência". Fofo. Parece um museu.', 'Minha loja atendeu 40 clientes hoje. E você? Três?', 'Sabe que seus clientes estão indo pra mim, né?']);
      return { kind: 'rival', anger0: 55, maxTurns: 6, base: 0, demand: 'respect', target: 0, grievance: 'essa sua lojinha atrapalha meus planos', demandTxt: 'que você aceite a derrota',
        intro: [['Ora, ora... bom dia, "vizinho".', 'smug'], [why, 'smug']] };
    },
    golpista() {
      const price = r5(150 + G().day * 6);
      return { kind: 'golpista', anger0: 20, maxTurns: 6, base: price, demand: 'sell', target: 0, grievance: '', demandTxt: 'que você compre',
        intro: [['Psiu, patrão... negócio da China aqui.', 'smug'], [`iFone "novinho", sem caixa, sem nota, sem perguntas. Só ${UI.money(price)}. Vai?`, 'smug']] };
    },
    crianca() {
      return { kind: 'crianca', anger0: 62, maxTurns: 6, base: 0, demand: 'respect', target: 0, grievance: 'meu bichinho virtual morreu', demandTxt: 'que você salve o Pipoca',
        intro: [['Buááá! O Pipoca MORREU!', 'sad'], ['É meu bichinho virtual... a tela apagou e ele não volta! BUÁÁÁ!', 'sad']] };
    },
    jornalista() {
      return { kind: 'jornalista', anger0: 60, maxTurns: 4, base: 0, demand: 'judge', target: 0, grievance: '', demandTxt: '',
        intro: [['Oi! Cris Notícia, da Gazeta do Bairro. Posso fazer umas perguntinhas?', 'smile'], ['A matéria é sobre a guerra das assistências técnicas. Vamos lá: por que o bairro deveria escolher a sua loja e não a ConsertaJá?', 'neutral']] };
    },
    beto() {
      return { kind: 'beto', anger0: 64, maxTurns: 7, base: 0, demand: 'respect', target: 0, grievance: 'o Vitor me obriga a fazer coisas erradas', demandTxt: 'que eu possa confiar em você',
        intro: [['P-psiu... sou o Beto, da ConsertaJá. Não conta pra ninguém que eu vim aqui.', 'worried'], ['O Vitor... ele manda a gente trocar peça original por falsificada. Eu tenho as notas. Mas tô com medo...', 'worried']] };
    },
    fornecedor() {
      return { kind: 'fornecedor', anger0: 58, maxTurns: 6, base: 0, demand: 'respect', target: 0, grievance: 'o Vitor quer comprar todo o meu estoque de peças', demandTxt: 'um motivo pra eu não vender tudo pra ele',
        intro: [['Rapaz... preciso te contar uma coisa chata.', 'worried'], ['O Vitor ofereceu o dobro por TODO o meu estoque de peças. Me dá um motivo pra eu não aceitar.', 'neutral']] };
    },
    olga() {
      return { kind: 'olga', anger0: 60, maxTurns: 3, base: 0, demand: 'judge', target: 0, grievance: '', demandTxt: '',
        intro: [['Muito bem. O Vitor já falou. Agora é a sua vez, meu jovem.', 'neutral'], ['Então me diga: por que eu deveria vender este prédio a você?', 'neutral']] };
    },
  });

  // ---------- executar uma briga ----------
  async function run(kind, arg = {}) {
    const g = G();
    VN.hide(); closeChat();
    let npcs, sc;
    if (kind === 'reclamacao') { npcs = [arg.char]; sc = SC.reclamacao(arg.char, arg.prev); }
    else if (kind === 'calote') { npcs = [arg.char]; sc = SC.calote(arg.char, arg.job); }
    else if (kind === 'fila') { npcs = arg.pair; sc = { kind: 'fila', anger0: 50, maxTurns: 8, base: 60, demand: 'first', target: 10, firstId: arg.pair[Math.random() < .5 ? 0 : 1].id, grievance: 'eu cheguei primeiro', demandTxt: 'ser atendido primeiro' }; }
    else if (kind === 'barraco') { npcs = [NPCS.neusa]; sc = SC.barraco(); }
    else if (kind === 'fiscal') { npcs = [NPCS.fiscal]; sc = SC.fiscal(); }
    else if (kind === 'agiota') { npcs = [NPCS.jorjao]; sc = SC.agiota(arg.debt); }
    else if (kind === 'casal') { npcs = [CHARS.STORY.marcela, CHARS.STORY.rodrigo]; sc = { kind: 'casal', anger0: 60, maxTurns: 7, base: 60, demand: 'first', target: 10, firstId: null, grievance: 'a culpa foi sua', demandTxt: 'que o outro admita a culpa' }; }
    else if (SC[kind] && ['rival', 'golpista', 'crianca', 'jornalista', 'beto', 'fornecedor', 'olga'].includes(kind)) { const ids = { rival: 'vitor', golpista: 'zeesperto', crianca: 'juninho', jornalista: 'cris', beto: 'beto', fornecedor: 'toninho', olga: 'olga' }; npcs = [CHARS.STORY[ids[kind]]]; sc = SC[kind](); }
    else { npcs = [NPCS.regina]; sc = SC.karen(); kind = 'karen'; }
    if (kind !== 'olga' && kind !== 'jornalista') META.bump('fights');

    // personagens em cena
    let sprites = [];
    if (arg.sprites) sprites = arg.sprites;
    else if (npcs.length === 1) {
      if (!arg.keepSprite || !SHOP.sprite) await SHOP.showCustomer(npcs[0]);
      sprites = [SHOP.sprite];
    } else {
      SHOP.hideCustomer();
      sprites = [await SHOP.showExtra(npcs[0], -1.15, -1), await SHOP.showExtra(npcs[1], 1.15, 1)];
    }
    const minds = npcs.map(n => BRAIN.create(n, sc));
    const spOf = m => sprites[minds.indexOf(m)];
    const nameKeys = npcs.map(n => ({ id: n.id, keys: BRAIN.norm(n.name).filter(w => w.length >= 3 && !['dona', 'seu', 'dr'].includes(w)) }));
    minds.forEach((m, i) => sprites[i] && sprites[i].setExpr('angry'));

    // introdução
    AUDIO.sfx('question');
    if (kind === 'casal') {
      const [A, B] = npcs;
      VN.speaker = sprites[0]; await VN.say(A.name, 'Foi VOCÊ que deixou o celular cair na piscina!', { expr: 'angry' });
      VN.speaker = sprites[1]; await VN.say(B.name, 'EU?! Você que jogou a boia em cima dele!', { expr: 'angry' });
      VN.speaker = null; await VN.say('', `O casal <b>${A.name}</b> e <b>${B.name}</b> chegou brigando por causa do celular molhado. Acalme os dois digitando!`);
    } else if (kind === 'fila') {
      const [A, B] = npcs; const first = npcs.find(n => n.id === sc.firstId), other = npcs.find(n => n.id !== sc.firstId);
      VN.speaker = sprites[0]; await VN.say(A.name, first === A ? 'Com licença, eu cheguei primeiro!' : 'Ei! Eu tava aqui antes de você!', { expr: 'angry' });
      VN.speaker = sprites[1]; await VN.say(B.name, first === B ? 'Mentira! Eu cheguei primeiro, todo mundo viu!' : 'Ah, é? Chegou nada! Furou a fila na cara dura!', { expr: 'angry' });
      VN.speaker = null; await VN.say('', `<b>${A.name}</b> e <b>${B.name}</b> estão brigando pra ver quem é atendido primeiro. <small>(${first.name} chegou mesmo primeiro...)</small> Resolva digitando!`);
    } else {
      VN.speaker = sprites[0];
      for (const [t, e] of sc.intro) await VN.say(npcs[0].name, t, { expr: e });
      VN.speaker = null;
    }
    VN.hide();
    const judgeKind = kind === 'jornalista' || kind === 'olga';
    openChat(npcs, (kind === 'reclamacao' ? HINTS.base : HINTS[kind] || HINTS.base).map(h => h.replace('Aiko', (npcs.find(n => n.id === sc.firstId) || npcs[0]).name.split(' ').pop())), judgeKind ? { meter: 'impressão', invert: true, quit: 'Encerrar a conversa' } : kind === 'golpista' ? { meter: 'nervosismo', quit: 'Mandar ele embora' } : {});
    if (judgeKind) minds.forEach(m => { m.score = 40; m.anger = 60; });
    setBars(minds); setTurns(0, sc.maxTurns);
    await typeLine(sprites[0], npcs[0].name, sc.intro ? sc.intro[sc.intro.length - 1][0].replace(/<[^>]+>/g, '') : kind === 'casal' ? 'Fala pra ela que a culpa foi dela!' : 'Resolve isso aí, moço! Quem vai ser atendido primeiro?');

    let outcome = null, deal = null, turn = 0;
    const group = npcs.length > 1 ? { minds, sc } : null;
    while (!outcome) {
      const said = await ask();
      if (said === null) { outcome = kind === 'golpista' ? 'calm' : 'quit'; break; }
      $('#chat-in').disabled = true;
      logLine('Você', said || '...', 'me').textContent = said || '...';
      turn++; setTurns(turn, sc.maxTurns);
      await wait(.35 + Math.random() * .3);
      if (group) {
        const res = BRAIN.respondGroup(group, said, { names: nameKeys });
        for (const ln of res.lines) { const sp = spOf(ln.who); if (sp) sp.setExpr(ln.expr); await typeLine(sp, ln.who.npc.name, ln.text); await wait(.15); }
        outcome = res.outcome;
      } else {
        const m = minds[0];
        const ctx = { names: nameKeys, hasDocs: META.mod('fireSafe') > 0 || META.mod('noFines') > 0 };
        const res = BRAIN.respond(m, said, ctx);
        sprites[0].setExpr(res.expr);
        if (res.delta < -12) AUDIO.sfx('pluck'); else if (res.delta > 12) { AUDIO.sfx('error', { vol: .5 }); UI.shake(); }
        await typeLine(sprites[0], npcs[0].name, res.text);
        outcome = res.outcome; deal = res.deal;
      }
      const pr = parrot(said || '', minds); if (pr && !outcome) { await wait(.2); await typeLine(null, 'Papagaio', pr, 'parrot'); }
      setBars(minds);
    }
    await wait(.9);
    closeChat();
    const result = await consequences(kind, outcome, deal, { sc, npcs, sprites, minds, arg });
    result.score = minds[0].score;
    return result;
  }

  // ---------- consequências ----------
  async function consequences(kind, outcome, deal, { sc, npcs, sprites, minds, arg }) {
    const g = G(); const res = { outcome, deal, pay: 1, cost: 0, redo: false };
    const say = async (name, t, e, sp) => { VN.speaker = sp || sprites[0]; await VN.say(name, t, { expr: e }); };
    const narr = async t => { VN.speaker = null; await VN.say('', t); };
    const win = outcome === 'calm' || outcome === 'deal';
    if (win) { META.bump('fightsWon'); GAME.missionProgress('calm'); }
    if (outcome === 'quit') outcome = 'leave';
    const rep = v => GAME.repChange(v);
    const leaveAll = async (dir = 1) => { if (arg.sprites) return; if (npcs.length > 1) { for (const sp of sprites) SHOP.leaveExtra(sp, dir); await wait(.6); } else await SHOP.leaveCustomer(dir); };

    if (kind === 'reclamacao') {
      if (outcome === 'deal') {
        if (deal.type === 'redo' || deal.type === 'free') { res.redo = true; await narr('Você pega o aparelho de volta para refazer o serviço na garantia, sem cobrar nada.'); }
        else { const pct = deal.type === 'free' ? 100 : deal.pct; const v = Math.round(sc.base * pct / 100 * (deal.type === 'discount' ? .5 : 1)); res.cost = v; GAME.addMoney(-v, true); g.log.events = (g.log.events || 0) - v; await narr(deal.type === 'discount' ? `Combinado: ${pct}% de desconto no próximo serviço (−${UI.money(v)} na prática).` : `Você devolveu <b style="color:#c1121f">${UI.money(v)}</b>. O cliente foi embora satisfeito.`); rep(.1); }
      } else if (outcome === 'calm') { await narr('A conversa acalmou o cliente. Ele vai dar outra chance pra loja.'); rep(.15); }
      else if (outcome === 'explode') { rep(-.45); const d = window.DECOR && Math.random() < .5 ? DECOR.breakRandom() : null; UI.shake(); AUDIO.sfx('punch'); await narr(`O cliente saiu batendo a porta${d ? ` e derrubou o seu <b>${d.name}</b>!` : '!'} Vai falar mal da loja em todo lugar.`); }
      else { rep(-.25); await narr('O cliente foi embora bufando. A reputação caiu um pouco.'); }
    } else if (kind === 'calote') {
      if (outcome === 'deal') { res.pay = 1 - Math.min(100, deal.pct || 100) / 100; await narr(`Fechado: ${deal.pct}% de desconto no pagamento.`); }
      else if (outcome === 'calm') { res.pay = 1; rep(.1); await narr('O cliente pensou melhor e pagou o valor combinado.'); }
      else if (outcome === 'explode') { res.pay = 0; rep(-.3); UI.shake(); AUDIO.sfx('thud'); await narr('O cliente pegou o aparelho e saiu correndo sem pagar! 😤'); }
      else { res.pay = .5; rep(-.1); await narr('Depois de muita discussão, o cliente jogou metade do dinheiro no balcão e foi embora.'); }
    } else if (kind === 'fila') {
      if (win) { res.first = sc.firstId; res.discountFor = minds.filter(m => m.dealPct).map(m => ({ id: m.npc.id, pct: m.dealPct })); rep(.15); await narr('A briga acabou! Os dois vão ser atendidos, um de cada vez.'); }
      else if (outcome === 'explode') {
        UI.shake(); AUDIO.sfx('punch'); await wait(.2); AUDIO.sfx('slap');
        const d = window.DECOR ? DECOR.breakRandom() : null; rep(-.4);
        await narr(`Os dois saíram no tapa no meio da loja!${d ? ` O <b>${d.name}</b> foi pro chão!` : ''} Os dois foram embora.`);
        res.lost = 2;
      } else { const stay = pick(minds); res.first = stay.npc.id; res.lost = 1; rep(-.15); await narr(`${minds.find(m => m !== stay).npc.name} desistiu e foi embora. ${stay.npc.name} ficou.`); }
      await leaveAll();
      return res;
    } else if (kind === 'barraco') {
      if (win) { rep(.1); await say('Dona Neusa', 'Hunf. Tá bom. Mas eu tô de olho, hein!', 'neutral'); }
      else { rep(-.2); g.fiscalTomorrow = true; await say('Dona Neusa', 'Pois eu vou ligar pra PREFEITURA! Amanhã você vai ver!', 'angry'); }
    } else if (kind === 'fiscal') {
      const fine = sc.fine;
      if (outcome === 'calm' && minds[0].docsOk) { await narr('Tudo em ordem. Sem multa! 😎'); rep(.05); }
      else if (outcome === 'calm') { const v = Math.round(fine * .5); res.cost = v; GAME.addMoney(-v, true); g.log.events = (g.log.events || 0) - v; await narr(`O fiscal aliviou: multa reduzida para <b style="color:#c1121f">${UI.money(v)}</b>.`); }
      else if (outcome === 'deal') { const v = Math.round(fine * (deal.pct || 100) / 100); res.cost = v; GAME.addMoney(-v, true); g.log.events = (g.log.events || 0) - v; await narr(`Multa paga: <b style="color:#c1121f">${UI.money(v)}</b>.`); }
      else { const v = Math.round(fine * (minds[0].bribed ? 2.2 : outcome === 'explode' ? 1.6 : 1)); res.cost = v; GAME.addMoney(-v, true); g.log.events = (g.log.events || 0) - v; rep(-.2); await narr(`${minds[0].bribed ? 'Tentar subornar um fiscal?! ' : ''}Multa de <b style="color:#c1121f">${UI.money(v)}</b>. Da próxima vez, tenha o extintor e o alvará em dia.`); }
    } else if (kind === 'agiota') {
      const b = ECON.bank(); const debt = b.agiota ? b.agiota.debt : sc.debt;
      if (outcome === 'deal' && deal.type === 'pay') {
        const v = Math.min(deal.money, Math.max(0, g.money - 1)); GAME.addMoney(-v, true);
        if (b.agiota) { b.agiota.debt = Math.max(0, b.agiota.debt - v); if (b.agiota.debt <= 0) { b.agiota = null; META.bump('agiotaPaid'); } else b.agiota.due = g.day + 2; }
        await narr(v < deal.money ? `Você só tinha ${UI.money(v)}... O Jorjão pegou e anotou o resto.` : `Você pagou ${UI.money(v)} ao Jorjão.`);
      } else if (outcome === 'deal' || outcome === 'calm') {
        if (b.agiota) { b.agiota.due = g.day + 2; b.agiota.debt = Math.round(b.agiota.debt * 1.15); }
        await narr(`O Jorjão te deu mais 2 dias. A dívida subiu para <b style="color:#c1121f">${UI.money(b.agiota ? b.agiota.debt : debt)}</b>.`);
      } else {
        AUDIO.sfx('punch'); UI.shake(); UI.glitch();
        const d = window.DECOR ? DECOR.breakRandom() : null; const take = Math.round(Math.max(0, g.money) * .3);
        if (take > 0) GAME.addMoney(-take, true);
        if (b.agiota) { b.agiota.debt = Math.max(0, b.agiota.debt - take); b.agiota.due = g.day + 2; }
        rep(-.3);
        await narr(`Os "sobrinhos" do Jorjão entraram na loja${d ? `, quebraram seu <b>${d.name}</b>` : ''} e levaram <b style="color:#c1121f">${UI.money(take)}</b> do caixa. A poupança, pelo menos, ficou a salvo.`);
      }
    } else if (kind === 'casal') {
      if (win) { rep(.2); g.vipNext = true; await narr('O casal fez as pazes e se abraçou no meio da loja! 💕 Eles vão deixar o celular com você e pagar bem.'); }
      else if (outcome === 'explode') { UI.shake(); AUDIO.sfx('thud'); const d = window.DECOR ? DECOR.breakRandom() : null; rep(-.35); await narr(`O casal saiu brigando${d ? ` e derrubou o seu <b>${d.name}</b>` : ''}. Que climão.`); }
      else { rep(-.15); await narr('Os dois foram embora ainda de cara feia.'); }
      await leaveAll(); return res;
    } else if (kind === 'rival') {
      if (win) { RIVAL.share(.05); rep(.15); META.bump('rivalWins'); await say('Vitor Valadares', 'Hmpf... Tá bom, tá bom. Aproveita enquanto dura.', 'sad'); await narr('Os clientes que estavam na loja viram tudo. Ponto pra você! (+5% do bairro)'); }
      else { RIVAL.share(-.05); rep(-.2); await say('Vitor Valadares', 'Hahaha! Gravei tudo. Vai bombar no grupo do bairro! Tchauzinho~', 'smug'); await narr('O Vitor saiu rindo. O vídeo da discussão circulou pelo bairro. (−5% do bairro)'); }
    } else if (kind === 'golpista') {
      if (outcome === 'deal') {
        const v = Math.min(sc.base, Math.max(0, g.money - 1)); GAME.addMoney(-v, true); g.log.events -= v; g.stolenPhone = { paid: v, day: g.day };
        await narr(`Você pagou ${UI.money(v)} pelo celular "misterioso". Amanhã dá pra revender... se ninguém vier atrás dele.`);
      } else if (outcome === 'leave') { rep(.2); await narr('O golpista saiu correndo quando ouviu falar em polícia. O bairro agradece! (+reputação)'); }
      else { rep(.1); await narr('Você recusou o negócio suspeito. O Zé Esperto foi embora resmungando.'); }
      if (minds[0].snitched && window.RIVAL && RIVAL.active()) RIVAL.evidence(1, 'O Zé Esperto confessou que o celular veio de um funcionário da ConsertaJá.');
    } else if (kind === 'crianca') {
      if (win) { const v = r5(40 + g.day * 3); GAME.addMoney(v, true); g.log.events += v; rep(.15); await narr(`O Juninho parou de chorar e até riu! A mãe dele ficou tão agradecida que deu ${UI.money(v)} de gorjeta. 💛`); }
      else { rep(-.15); await narr('O Juninho saiu chorando ainda mais alto. A mãe te olhou torto.'); }
    } else if (kind === 'jornalista') {
      const sc2 = minds[0].score;
      if (sc2 >= 60) { RIVAL.share(.07); rep(.3); await narr(`📰 Amanhã a Gazeta publica: <b>"A assistência que tem coração"</b>. Impressão: ${sc2}/100. (+7% do bairro, +reputação)`); }
      else if (sc2 >= 35) { RIVAL.share(.02); await narr(`📰 Saiu uma notinha simpática sobre a loja. Impressão: ${sc2}/100. (+2% do bairro)`); }
      else { RIVAL.share(-.05); rep(-.15); await narr(`📰 A matéria saiu com o título <b>"Técnico perde a linha"</b>. Impressão: ${sc2}/100. (−5% do bairro)`); }
    } else if (kind === 'beto') {
      if (win) { RIVAL.evidence(2, 'O Beto te entregou cópias das notas fiscais falsas da ConsertaJá.'); rep(.1); await say('Beto', 'Toma. São as notas das peças falsificadas. Usa isso direito, tá? Obrigado por me ouvir.', 'smile'); }
      else { await say('Beto', 'Esquece... eu não devia ter vindo. Não conta pra ninguém!', 'worried'); }
    } else if (kind === 'fornecedor') {
      if (win) { for (const p of ['screen', 'screen', 'battery']) g.stock[p]++; rep(.05); await say('Seu Toninho', 'Tá bom, rapaz. Amizade vale mais que dinheiro. Separei 2 telas e 1 bateria pra você, por conta da casa.', 'smile'); }
      else { g.partsShock = (g.partsShock || 0) + 2; await say('Seu Toninho', 'Desculpa, rapaz... negócio é negócio. As peças vão ficar caras por uns dias.', 'sad'); }
    } else if (kind === 'olga') {
      await narr(`Dona Olga fecha o caderninho. <small>(Impressão: ${minds[0].score}/100)</small>`);

    } else if (kind === 'karen') {
      if (win) { g.vipNext = true; rep(.1); await say('Dona Regina', 'Hmpf. Pelo menos aqui sabem tratar uma cliente. Vou voltar... com o MEU celular. E pago bem.', 'smug'); }
      else { rep(-.4); await say('Dona Regina', 'Vou dar UMA estrela! UMA! E vou postar no grupo do condomínio!', 'angry'); }
    }
    VN.hide();
    if (!arg.keepSprite) await leaveAll(win ? 1 : -1);
    if (window.EVENTS && ['reclamacao', 'calote', 'karen', 'crianca', 'barraco'].includes(kind)) EVENTS.review(npcs[0], win ? (outcome === 'deal' ? 4 : 5) : 1, kind);
    return res;
  }

  // ---------- NEGOCIAÇÃO DE PREÇO (digitando) ----------
  async function haggle(c, job) {
    const sp = SHOP.sprite;
    const hg = BRAIN.createHaggle(c, job.price, { rep: G().rep, bonus: META.mod('haggleTalk') + META.mod('haggle') * .5 });
    const pr = f => UI.money(r5(job.price * f));
    VN.hide();
    openChat([c], [`Faço por ${pr(1.3)}.`, 'É peça original, com garantia de 90 dias.', `${pr(1.15)}, preço de amigo.`, 'Esse conserto é complicado, leva tempo.', 'Tá bom, pode ser.', `${pr(1.5)} e fica perfeito.`], { meter: 'paciência', badge: `💬 Oferta: <b>${UI.money(hg.offer)}</b>`, quit: 'Aceitar a oferta atual' });
    const bar = () => { setBars([{ npc: c, anger: hg.anger }]); const b = $('#chat-badge'); if (b) b.innerHTML = `💬 Oferta: <b>${UI.money(hg.offer)}</b>`; };
    bar(); setTurns(0, hg.maxTurns);
    await typeLine(sp, c.name, `Eu pago ${UI.money(job.price)}. Quanto você quer? Fala aí.`);
    let result = null, final = false;
    while (!result) {
      const said = await ask();
      if (said === null) { result = { price: hg.offer }; break; }
      $('#chat-in').disabled = true;
      logLine('Você', said, 'me').textContent = said || '...';
      await wait(.3);
      if (final) {
        const a = BRAIN.analyze(said); const n = a.num.money;
        if (a.hits.agree || (n !== null && n <= hg.offer) || /(^| )(fechado|aceito|pode ser|ok|esta bom|ta bom)( |$)/.test(a.s)) { await typeLine(sp, c.name, `Fechado em ${UI.money(hg.offer)}!`); result = { price: hg.offer }; }
        else { if (sp) sp.setExpr('angry'); await typeLine(sp, c.name, 'Então não dá. Tchau!'); result = { price: null }; }
        break;
      }
      const res = BRAIN.respondHaggle(hg, said);
      if (sp) sp.setExpr(res.expr);
      await typeLine(sp, c.name, res.text);
      setTurns(hg.turn, hg.maxTurns); bar();
      if (res.outcome === 'deal') result = { price: res.price };
      else if (res.outcome === 'leave') result = { price: null };
      else if (res.outcome === 'final') final = true;
    }
    await wait(.6); closeChat();
    if (result.price) { META.bump('haggleTalks'); GAME.missionProgress('haggleTalks'); if (result.price > job.price) { META.bump('haggles'); GAME.missionProgress('haggles'); } }
    return result;
  }

  window.FIGHTS = { run, haggle, NPCS, closeChat };
})();
