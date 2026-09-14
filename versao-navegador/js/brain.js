// CÉREBRO — "IA" local (offline) dos clientes nas brigas.
// Entende o que o jogador digita (português + gírias + erros de digitação), detecta intenções
// (desculpa, empatia, ofertas com valores, insulto, ameaça, piada, cantada, pergunta, assunto aleatório...),
// atualiza humor/confiança de cada personagem conforme a personalidade e gera uma resposta com a "voz" dele.
// Nunca fica sem resposta: se não entender, reflete a frase, cita uma palavra ou reage ao humor do momento.
(function () {
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- normalização ----------
  const SLANG = {
    vc: 'voce', vcs: 'voces', ce: 'voce', oce: 'voce', tu: 'voce', teu: 'seu', tua: 'sua', tb: 'tambem', tbm: 'tambem', pq: 'porque', pk: 'porque', q: 'que', k: 'que',
    n: 'nao', nn: 'nao', naum: 'nao', nao: 'nao', ñ: 'nao', mt: 'muito', mto: 'muito', mts: 'muitos', blz: 'beleza', vlw: 'valeu', obg: 'obrigado', obgd: 'obrigado', obgda: 'obrigada',
    pfv: 'por favor', pf: 'por favor', pfvr: 'por favor', plz: 'por favor', pls: 'por favor', td: 'tudo', tds: 'todos', oq: 'o que', cmg: 'comigo', ctz: 'certeza', sla: 'sei la',
    qnd: 'quando', qdo: 'quando', msm: 'mesmo', dps: 'depois', hj: 'hoje', agr: 'agora', tlgd: 'ta ligado', tmj: 'tamo junto', flw: 'falou', pdc: 'pode crer', nd: 'nada',
    ngm: 'ninguem', bjs: 'beijos', bj: 'beijo', vdd: 'verdade', dnv: 'de novo', tlg: 'ta ligado', cmo: 'como', qm: 'quem', qual: 'qual', aki: 'aqui', ai: 'ai', eh: 'e', to: 'estou',
    ta: 'esta', tá: 'esta', tô: 'estou', pra: 'para', pro: 'para o', num: 'nao', mn: 'mano', mano: 'mano', vey: 'vei', fdp: 'filho da puta', vsf: 'vai se ferrar', vtnc: 'vai tomar',
    pqp: 'puta que pariu', krl: 'caralho', crl: 'caralho', prr: 'porra', mds: 'meu deus', slk: 'se loko', pprt: 'papo reto', sdds: 'saudades', rs: 'risok', rsrs: 'risok', kk: 'risok',
    ok: 'ok', okay: 'ok', oky: 'ok', okey: 'ok', desculpa: 'desculpa', dsclp: 'desculpa', desc: 'desculpa', perdao: 'perdao', grts: 'gratis', gratiz: 'gratis', dinhero: 'dinheiro',
    real: 'real', reau: 'real', conto: 'reais', contos: 'reais', pila: 'reais', pilas: 'reais', mangos: 'reais', temq: 'tem que', tbem: 'tambem', entao: 'entao', ent: 'entao',
  };
  const NUMW = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, trezentos: 300, quinhentos: 500, mil: 1000 };

  function stripAcc(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(raw) {
    let s = stripAcc(String(raw || '').toLowerCase());
    s = s.replace(/k{2,}/g, ' risok ').replace(/(^|\s)(rs)+(?=\s|$)/g, ' risok ').replace(/(ha|he|hi|hua|ah){2,}h?/g, ' risok ').replace(/([a-z])\1{2,}/g, '$1');
    s = s.replace(/(\d)\s*%/g, '$1 %').replace(/r\$\s*/g, ' reais_ ');
    const toks = s.replace(/[^a-z0-9%_?!ç ]+/g, ' ').replace(/([?!])/g, ' $1 ').split(/\s+/).filter(Boolean);
    const out = [];
    for (const t of toks) { const m = SLANG[t]; if (m) out.push(...m.split(' ')); else out.push(t); }
    return out;
  }

  // ---------- intenções (regex sobre o texto normalizado) ----------
  const R = (s) => new RegExp('(?:^| )(?:' + s + ')(?= |$)');
  const INT = {
    greet: R('oi|ola|opa|bom dia|boa tarde|boa noite|e ai|eae|salve|fala (ai|mano|parceiro)|hey|hello'),
    apology: R('desculpa\\w*|desculpe\\w*|desculpo|perdao|perdoa\\w*|perdoe|foi mal|sinto muito|lamento|lamentamos|minha culpa|culpa minha|erro meu|foi erro nosso|errei|erramos|vacilei|vacilo meu|mil perdoes|me perdoa'),
    empathy: R('entendo|compreendo|imagino|tem razao|voce esta certo|voce esta certa|com razao|faz sentido|que chato|que situacao|sei como e|deve ser (dificil|chato|horrivel|ruim)|te entendo|coitad\\w*|que triste|nossa que|poxa|puxa vida|puts|que pena|voce tem todo direito|seu direito|justo (voce|sua)'),
    calm: R('calma|se acalma|acalm\\w*|respira|tranquil\\w*|relaxa|sem estresse|sem briga|devagar|paz|abaixa o tom|vamos conversar|conversar com calma|sem gritar|nao precisa gritar|fica frio|de boa|numa boa|na paz|sossega'),
    polite: R('por favor|senhor\\w*|senhora|obrigad\\w*|agradec\\w*|com todo respeito|respeitosamente|prezad\\w*|gentileza|valeu|grato|grata|perdao pelo transtorno|com licenca'),
    refund: R('devolv\\w*|reembols\\w*|estorn\\w*|dinheiro de volta|seu dinheiro|te pago de volta|ressarc\\w*|pix de volta|te devolvo|devolucao|pago de volta'),
    discount: R('desconto\\w*|abatimento|abato|descont\\w*|mais barato|abaixo o preco|baixo o preco|diminuo o preco|metade|reduz\\w*|%|por cento|off|abaixar|abaixo|cobro menos|faco por menos|faco mais barato|preco especial|precinho'),
    free: R('de graca|gratis|sem custo|sem cobrar|nao cobro|nao vou cobrar|nao te cobro|por conta da casa|cortesia|na faixa|0800|zero reais|nada a pagar|nao precisa pagar|fica de graca'),
    redo: R('(conserto|arrumo|refaco|faco|reparo|troco) (de novo|novamente|outra vez|dnv)|refazer|refaco|garantia|arrumar de novo|consertar de novo|vou arrumar|vou consertar|vou resolver|resolvo|eu resolvo|eu arrumo|eu conserto|deixa comigo|troco a peca|troco a tela|troco a bateria|olho de novo|dou uma olhada'),
    gift: R('brinde|presente|cafe\\w*|agua|bala|balinha|chocolate|bombom|salgad\\w*|lanche|pao de queijo|figurinha|cupom|doce|biscoito|bolacha|suco|refri\\w*|coxinha|pastel|pizza'),
    promise: R('prometo|garanto|palavra|juro|te dou minha palavra|pode confiar|confia em mim|confia|nunca mais|nao vai acontecer de novo|nao vai se repetir|pode deixar|compromisso|dou certeza|pode ter certeza|palavra de honra|tem minha palavra'),
    explain: R('peca|pecas|bateria|tela|placa|chip|conector|oxid\\w*|curto|defeito|fabrica|fabricante|tecnic\\w*|diagnostic\\w*|original|paralela|sistema|software|atualiza\\w*|umidade|queda|ferrugem|solda|componente\\w*|circuito|firmware|resistor|capacitor|flex|display|lcd|touch|mau contato|desgaste|vida util'),
    blame: R('culpa (e )?(sua|e sua|foi sua|de voce)|voce (que )?(quebrou|derrubou|molhou|estragou|deixou cair)|mau uso|problema (e )?seu|nao e culpa minha|nao tenho culpa|a culpa nao e minha|nao fui eu|voce que fez|voce que usou|foi voce|culpa sua'),
    insult: R('idiota\\w*|burr[oa]\\w*|otari\\w*|imbecil|babaca|chat[oa]|pentelh\\w*|palhac\\w*|ridicul\\w*|lixo|fei[oa]|nojent\\w*|trouxa|mane|besta|vagabund\\w*|folgad\\w*|mala sem alca|cala a boca|cale a boca|cala boca|vai se \\w+|vai a merda|vai tomar|merda|porra|caralho|puta|filho da puta|puta que pariu|desgracad\\w*|maldit\\w*|retardad\\w*|escroto|cuzao|arrombad\\w*|bosta|imundo|verme|inutil|incompetente|mongol\\w*|anta|jumento|tapad[oa]|cretin[oa]|safad[oa]|corno|otaria|piranha|nojo|ignorante|fedid[oa]|chorao|chorona|mimad[oa]|louc[oa] de pedra|velh[oa] chat[oa]|vai se ferrar|se ferrar|te odeio|odeio voce'),
    threat: R('policia|seguranca|te expulso|expulsar|sai da minha loja|sai daqui|some daqui|vaza|olho da rua|pra rua|fora daqui|processo|processar|procon|te bato|vou te bater|porrada|soco|chamar a policia|chamo a policia|delegacia|denunci\\w*|boletim|vou chamar|cai fora|vai embora|pode ir embora|nao volta mais|nunca mais volta'),
    humor: R('risok|kkk|haha|piada|brincadeira|zoeira|zoando|to brincando|estou brincando|lol|engracad\\w*|risada|so rindo|morri|kkkk'),
    flirt: R('gat[oa]|lind[oa]|gostos[oa]|charmos\\w*|princesa|meu amor|amor|casa comigo|me da seu (numero|zap|whats)|namora\\w*|beijo|crush|delicia|cheiros[oa]|gatinh[oa]|meu bem|bonitao|bonitona|te amo|apaixonad\\w*|sai comigo|me passa seu'),
    compliment: R('(seu|sua|que) (estilo|roupa|cabelo|oculos|bone|look|voz|sorriso)|voce e (legal|incrivel|demais|gente boa|simpatic\\w*|educad\\w*|inteligente|esperto|esperta)|adoro voce|gosto de voce|admiro|elegante|estilos[oa]|fof[oa]|bonit[oa]|arrasou|mandou bem|voce e top|voce e o melhor|voce e a melhor|brab[oa]|parabens pel'),
    agree: R('sim|ok|beleza|claro|combinado|fechado|fechou|pode ser|tudo bem|esta bom|esta certo|certo|isso ai|isso mesmo|exato|com certeza|aceito|feito|bora|topo|negocio fechado|trato feito|trato|perfeito|show|demorou|firmeza|tamo junto|pode crer|concordo|fechamos|pode fechar|ta fechado|entao ta'),
    disagree: R('nunca|jamais|de jeito nenhum|nem pensar|nem a pau|recuso|negativo|sem chance|impossivel|nada disso|nem sonhando|nem ferrando|nem morto|esquece|de jeito algum|nao da|nao rola|nao posso|nao aceito|nao topo|nao quero|nao concordo|nao mesmo|claro que nao'),
    rules: R('politica da (loja|empresa)|regra\\w*|regulamento|termo\\w*|contrato|nota fiscal|cupom fiscal|lei|codigo do consumidor|cdc|direito\\w*|norma\\w*|alvara|licenca|documento\\w*|papelada|tudo em dia|regularizad\\w*|registrad\\w*|cnpj|imposto\\w* em dia'),
    time: R('ja ja|rapidinho|rapido|urgente|pressa|demora|demorar|um instante|so um momento|espera ai|aguarda|aguenta ai|ja volto'),
    askName: R('(qual|como) (e )?(o )?(seu|teu) nome|como (voce )?se chama|quem e voce|quem (e|eh) voce|seu nome'),
    askWant: R('o que (voce|tu) quer|quer o que|que (que )?(voce )?quer|como posso (te )?ajudar|o que (eu )?posso fazer|como resolvo|como (a gente )?resolve|o que (resolveria|resolve)|qual (e )?o problema|o que aconteceu|o que houve|que houve|o que foi|qual e a sua|que foi|como assim|me explica|explica'),
    askWhy: R('por que|porque (voce|isso)|pq voce|qual (o|e o) motivo|qual (a|e a) razao'),
    askPrice: R('quanto|qual (o )?valor|qual (o )?preco|quanto custa|quanto voce quer'),
    askHow: R('como (voce )?(esta|vai|anda)|tudo bem com voce|td bem|tudo bom|como foi seu dia'),
    dismiss: R('ah (claro|ta)|com certeza ne|parabens|grande coisa|e dai|tanto faz|problema (e )?seu|azar o seu|azar seu|nao to nem ai|nem ai|dane-se|dane se|foda-se|foda se|sei la|whatever|chora|chora mais|mimimi|aceita que doi menos|supera|se vira'),
    fair: R('ordem de chegada|quem chegou primeiro|chegou primeiro|senha|fila|um de cada vez|cada um na sua vez|vez dele|vez dela|par ou impar|sorteio|os dois|ambos|atendo (os )?dois|justo para os dois|metade para cada|voces dois|nenhum dos dois|os dois juntos|um por vez|pedra papel'),
    pay: R('pago|pagar|toma|tome|aqui esta|aqui ta|te pago|vou pagar|eu pago|quito|quitar|acerto|acertar'),
    delay: R('prazo|amanha|semana que vem|mais (uns )?dias|depois|mes que vem|parcel\\w*|espera (um pouco|ai)|me da um tempo|mais tempo|adiar|adia|outro dia'),
    bribe: R('propina|por fora|cafezinho|acerto (por fora|entre nos)|agrado|molhar a mao|um trocado|jeitinho|dar um jeito|te dou um dinheiro|fica com isso'),
    goodbye: R('tchau|adeus|ate mais|ate logo|falou|flw|fui|bye'),
    manager: R('sou o gerente|eu sou o gerente|o gerente sou eu|sou o dono|eu sou o dono|o dono sou eu|eu que mando aqui|eu sou o responsavel|sou o responsavel'),
    thanks: R('obrigad\\w*|valeu|grato|grata|agradeco'),
    yell: R('!{2,}'),
  };
  const TOPICS = {
    futebol: R('futebol|flamengo|corinthians|timao|palmeiras|verdao|sao paulo|vasco|gremio|internacional|cruzeiro|atletico|galo|santos|botafogo|fluminense|bahia|sport|jogo de ontem|gol|copa|brasileirao|neymar|messi|cr7|selecao'),
    clima: R('chuva|chovendo|sol|calor|frio|tempo (hoje|la fora)|temperatura|nublado|garoa'),
    comida: R('fome|comida|almoco|almocar|janta|jantar|pizza|lamen|churrasco|coxinha|hamburguer|feijoada|acai|brigadeiro|pastel|sushi|marmita'),
    musica: R('musica|funk|pagode|sertanejo|rock|kpop|k pop|show|cantor|cantora|banda|playlist|forro|samba|rap|trap'),
    games: R('game|games|videogame|video game|free fire|minecraft|fortnite|lol|valorant|roblox|gta|pokemon|zelda|mario|console|ranked'),
    vida: R('namorad\\w*|casamento|familia|filh[oa]\\w*|mae|pai|neto|neta|avo|esposa|marido|trabalho|escola|faculdade|prova|chefe'),
    animal: R('gato|gatinho|cachorro|cachorrinho|papagaio|peixe|pet|bicho'),
    cassino: R('cassino|aposta|apostar|jackpot|roleta|caca niquel|sorte|loteria|mega sena|raspadinha'),
    politica: R('politica|politico|eleicao|presidente|governo|prefeito|vereador|deputado'),
  };
  const STOP = new Set('a o os as um uma uns umas de do da dos das em no na nos nas por para com sem que e é eu voce ele ela nos eles elas me te se lhe meu minha seu sua isso isto aquilo esse essa este esta aquele aquela ja mais menos muito pouco bem mal la aqui ai entao mas ou nem so tambem ate como quando onde qual quem porque pq ne tipo assim mano cara vei ta estou esta sou foi ser ter tem tenho vou vai fazer faz fiz ok sim nao'.split(' '));

  // Extrai números: 20% | 20 por cento | R$ 50 | 50 reais | metade | "dez por cento"
  function numbers(tokens, s) {
    const out = { pct: null, money: null };
    let m = s.match(/(\d{1,3}) ?(%|por cento)/); if (m) out.pct = +m[1];
    m = s.match(/reais_ (\d+)|(\d+) (reais|real|conto|pila)/); if (m) out.money = +(m[1] || m[2]);
    if (out.pct === null) { for (const [w, v] of Object.entries(NUMW)) if (v <= 100 && new RegExp(`(^| )${w} (%|por cento)`).test(s)) out.pct = v; }
    if (out.money === null) { for (const [w, v] of Object.entries(NUMW)) if (new RegExp(`(^| )${w} (reais|real|conto|pila)`).test(s)) out.money = v; }
    if (/(^| )metade( |$)/.test(s)) out.pct = Math.max(out.pct || 0, 50);
    if (/(^| )(o dobro|dobro)( |$)/.test(s)) out.pct = out.pct || 0;
    if (out.pct === null && out.money === null) { m = s.match(/(^| )(\d{1,4})( |$)/); if (m) out.bare = +m[2]; }
    return out;
  }
  function gibberish(tokens, s) {
    const letters = s.replace(/[^a-z]/g, '');
    if (letters.length < 5) return false;
    const vow = (letters.match(/[aeiou]/g) || []).length / letters.length;
    if (vow < .18) return true;
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(letters)) return true;
    if (/(asdf|qwer|zxcv|hjkl|sdfg|dfgh|jkl;|ghjk|xcvb|uiop|poiu|lkjh)/.test(s)) return true;
    return false;
  }

  function analyze(raw, names = []) {
    const tokens = norm(raw);
    const s = tokens.join(' ');
    const r = { raw: String(raw || '').trim(), s, tokens, hits: {}, topics: [], num: numbers(tokens, s) };
    for (const [k, re] of Object.entries(INT)) if (re.test(s)) r.hits[k] = true;
    if (tokens[0] === 'nao' && tokens.length <= 3) r.hits.disagree = true;
    if (r.hits.insult && !INT.insult.test(s.replace(/que chat[oa]|coisa chata|situacao chata/g, ' '))) delete r.hits.insult;
    if (r.hits.gift && !/(^| )(dou|te dou|ofereco|oferecer|trago|trouxe|toma|tome|aceita|quer|pago|dar|sirvo|servir|pega|brinde|presente|cortesia|posso)( |$)/.test(s)) delete r.hits.gift;
    if (/!{2,}/.test(raw)) r.hits.yell = true;
    for (const [k, re] of Object.entries(TOPICS)) if (re.test(s)) r.topics.push(k);
    const letters = r.raw.replace(/[^A-Za-zÀ-ÿ]/g, '');
    r.caps = letters.length >= 6 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > .65;
    r.question = /\?\s*$/.test(r.raw) || /^(o que|por que|porque|como|quando|onde|qual|quem|quanto|sera que|voce (acha|quer|pode|sabe))\b/.test(s);
    r.empty = !r.raw || /^[.\s…!?]*$/.test(r.raw);
    r.gib = !r.empty && gibberish(tokens, s);
    r.len = r.raw.length;
    r.names = names.filter(n => n.keys.some(k => new RegExp(`(^| )${k}( |$)`).test(s))).map(n => n.id);
    if (r.num.pct !== null && !r.hits.discount && !r.hits.refund) r.hits.discount = true;
    if (r.num.money !== null && !r.hits.refund && !r.hits.discount && !r.hits.pay) r.hits.money = true;
    // "não" colado numa oferta ("não vou devolver") inverte a oferta
    if (/(^| )nao (vou |posso |quero |dou |faco |devolvo |dar |fazer |te dou |aceito )?(devolv|reembols|desconto|abato|dar desconto|fazer desconto|baixar)/.test(s)) { delete r.hits.refund; delete r.hits.discount; r.hits.refuse = true; }
    if (/(^| )nao (foi|e) (minha )?culpa/.test(s)) r.hits.blame = true;
    if (/(^| )(sem|nada de) desconto/.test(s)) { delete r.hits.discount; r.hits.refuse = true; }
    if (r.hits.apology && /(^| )(nao|nunca) (vou )?(pedir )?desculpa/.test(s)) { delete r.hits.apology; r.hits.refuse = true; }
    if (r.hits.free && /(^| )nao (e|vai ser|sera|fica) de graca/.test(s)) { delete r.hits.free; r.hits.refuse = true; }
    return r;
  }

  // ---------- personalidades ----------
  const P = (voice, pride, humor, temper, extra) => Object.assign({ voice, pride, humor, temper, likes: [] }, extra || {});
  const PERS = {
    aiko: P('timida', .2, .4, .2, { flirt: 'blush' }), bia: P('patricinha', .7, .5, .7, { flirt: 'flatter', likes: ['musica'] }), kenji: P('gamer', .5, .7, .5, { likes: ['games'] }),
    cida: P('vovo', .3, .6, .1, { likes: ['comida', 'vida', 'animal'], flirt: 'vovo' }), marcos: P('executivo', .9, .1, .8, { likes: ['futebol'], formal: true }),
    luna: P('gotica', .5, .3, .3, { likes: ['cassino', 'animal'] }), rafa: P('mano', .4, .8, .5, { likes: ['futebol', 'comida'] }), mei: P('tsundere', .9, .3, .7, { flirt: 'tsun' }),
    otavio: P('tiozao', .6, .6, .4, { likes: ['futebol', 'vida'], formal: true }), yumi: P('idol', .4, .6, .3, { likes: ['musica'], flirt: 'blush' }), nina: P('cientista', .5, .5, .3, { nerd: true }),
    zeca: P('tiozao', .4, .9, .3, { likes: ['comida', 'futebol', 'musica'] }), kiara: P('streamer', .5, .8, .6, { likes: ['games', 'animal'] }), dante: P('chuuni', .8, .4, .5, { likes: ['games'] }),
    jessica: P('artista', .4, .6, .3, { likes: ['musica', 'animal'] }), lurdes: P('vovo', .4, .7, .2, { likes: ['comida', 'vida', 'animal'], flirt: 'vovo' }), leo: P('estudante', .3, .7, .4, { nerd: true, likes: ['games', 'futebol'] }),
    sora: P('mano', .5, .6, .5, { likes: ['musica'] }), kaito: P('chef', .6, .5, .5, { likes: ['comida'] }),
    fiscal: P('autoridade', .8, .1, .5, { formal: true }), neusa: P('vovo_brava', .7, .3, .8, { likes: ['vida', 'animal'] }), jorjao: P('agiota', .7, .3, .7, {}), regina: P('karen', .95, .1, .9, { formal: true }),
  };
  const VOICE = {
    timida: { pre: ['E-eh...', 'B-bom...', 'Ah...', 'Hm...'], suf: ['...', ' ...eu acho.', ''], addr: 'moço' },
    patricinha: { pre: ['Tipo,', 'Gente,', 'Amore,', 'Aff,'], suf: [' Sério!', ' Aff.', '', ' Tô chocada.'], addr: 'querido' },
    gamer: { pre: ['Mano,', 'Pô,', 'Cara,', 'Pqp, mano,'], suf: [' GG.', ' Sério.', '', ' Tá bugado isso.'], addr: 'chefe' },
    vovo: { pre: ['Ai, meu filho,', 'Olha, querido,', 'Minha nossa,', 'Ai, ai...'], suf: [' Viu?', '', ' Credo.', ' Ai, meu coração...'], addr: 'meu filho' },
    vovo_brava: { pre: ['Escuta aqui, mocinho,', 'Olha aqui,', 'No meu tempo,', 'Ai, que gente!'], suf: [' Hunf!', '', ' Onde já se viu!'], addr: 'mocinho' },
    executivo: { pre: ['Escute,', 'Veja bem,', 'Olhe,', 'Seja objetivo:'], suf: [' Entendeu?', ' Sem rodeios.', '', ' Tempo é dinheiro.'], addr: 'rapaz' },
    gotica: { pre: ['Hm.', '...', 'Tsc.', 'Curioso.'], suf: [' Os astros discordam.', '', ' ...interessante.', ' A lua anotou.'], addr: 'mortal' },
    mano: { pre: ['Parceiro,', 'Qual é,', 'Ô meu,', 'Pô, irmão,'], suf: [' Tá ligado?', ' Pô.', '', ' Papo reto.'], addr: 'parceiro' },
    tsundere: { pre: ['Hmpf!', 'B-baka!', 'Olha aqui,', 'Tch!'], suf: [' Não que eu ligue!', ' Hmpf.', '', ' Baka!'], addr: 'baka' },
    tiozao: { pre: ['Ô rapaz,', 'Meu querido,', 'Olha só,', 'Pois é,'], suf: [' Viu, campeão?', ' Hein?', '', ' Pode escrever.'], addr: 'campeão' },
    idol: { pre: ['Mouu~', 'Ehh~', 'Uuh,', 'Hmm~'], suf: ['~', ' Kyaa!', '', ' Nee~'], addr: 'senpai' },
    cientista: { pre: ['Hipótese:', 'Tecnicamente,', 'Observação:', 'Dados preliminares:'], suf: [' Fato.', ' Anotado.', '', ' Estatisticamente.'], addr: 'colega' },
    streamer: { pre: ['Chat,', 'Gente do chat,', 'Nyaa,', 'Chat, olha isso:'], suf: [' Né, chat?', ' Nyaa!', '', ' Clipa isso!'], addr: 'moço' },
    chuuni: { pre: ['Kukuku...', 'Mortal!', 'Silêncio!', 'Hmph...'], suf: [' Meu olho selado pulsa...', '', ' As trevas anotaram.'], addr: 'mortal' },
    artista: { pre: ['Amor,', 'Olha,', 'Querido,', 'Ai,'], suf: [' Tá?', '', ' Sem drama.'], addr: 'amor' },
    estudante: { pre: ['Mano,', 'Tipo,', 'Véi,', 'Cara,'], suf: [' Pô.', '', ' Sério mesmo.'], addr: 'professor' },
    chef: { pre: ['Sumimasen,', 'Olha,', 'Hmm.', 'Escuta,'], suf: [' Falta tempero.', '', ' Hai.'], addr: 'chef' },
    autoridade: { pre: ['Senhor,', 'Cidadão,', 'Veja bem,', 'Pois não:'], suf: [' Conforme a lei.', '', ' Está anotado.', ' Artigo 12, parágrafo 3.'], addr: 'senhor' },
    agiota: { pre: ['Ô meu chapa,', 'Presta atenção,', 'Escuta aqui,', 'Olha só,'], suf: [' Tá entendendo?', '', ' Não me faz voltar aqui.', ' Tic-tac.'], addr: 'chapa' },
    karen: { pre: ['Escuta aqui,', 'Olha só,', 'Com licença,', 'Inacreditável!'], suf: [' Quero falar com o gerente!', '', ' Absurdo!', ' Vou postar no grupo do condomínio!'], addr: 'moço' },
  };

  // ---------- respostas por intenção e humor (F furioso, I irritado, C calmo) ----------
  const T = {
    apology: {
      F: ['Desculpa não conserta nada!', 'Desculpa?! Desculpa é o mínimo!', 'Pedir desculpa é fácil, quero ver resolver!', 'Hmm... pelo menos admitiu o erro.'],
      I: ['Tá... já é um começo.', 'Desculpas aceitas... em parte.', 'Ok, pelo menos você reconhece.', 'Tá bom, tá bom. Mas e agora?'],
      C: ['Tudo bem, acontece.', 'Ah, desculpa aceita.', 'Tá tudo bem, sério.', 'Relaxa, eu entendo.'],
    },
    apologyAgain: { F: ['Para de pedir desculpa e FAZ alguma coisa!', 'Já ouvi. Resolve!'], I: ['Já pediu desculpa. E aí?', 'Tá, tá, já entendi que você sente muito.'], C: ['Já passou, sério.', 'Já desculpei, pode parar~'] },
    empathy: {
      F: ['Entende nada! Não é você que tá no prejuízo!', 'Se entendesse, já tinha resolvido!', 'Hmm... pelo menos alguém me ouve.'],
      I: ['É... é isso mesmo. Que bom que você entende.', 'Pois é! Finalmente alguém me escuta.', 'Tá, pelo menos você tá me ouvindo.'],
      C: ['Obrigado por entender.', 'É bom saber que você me entende.', 'Viu? Conversando a gente se entende.'],
    },
    calm: {
      F: ['NÃO ME MANDA ACALMAR!', 'Calma?! CALMA?! Eu tô CALMÍSSIMO!', 'Não vem com "calma" pra cima de mim!'],
      I: ['Tô tentando ficar calmo, tá?', 'Tá... respirando... respirando...', 'Hmpf. Tá, vou tentar.'],
      C: ['Tô calmo, tá tudo bem.', 'Tá, tá, tô tranquilo.', 'Relaxa, já passou.'],
    },
    polite: { F: ['Educação não paga meu prejuízo!', 'Ser educadinho agora não vai te salvar!'], I: ['Pelo menos você é educado.', 'Hm. Educado, pelo menos.'], C: ['Que educação! Assim dá gosto.', 'Obrigado pela gentileza.'] },
    greet: { F: ['"Oi"?! Sério que você vai me dar OI?!', 'Nada de oi! Resolve meu problema!'], I: ['Oi, oi... vamos ao que interessa.', 'Tá, olá. Agora resolve.'], C: ['Oi de novo!', 'Olá~'] },
    refundAcc: ['Isso! Meu dinheiro de volta. Assim sim!', 'Ótimo. Devolvendo, a gente fica de boa.', 'Fechado. Era só isso que eu queria.'],
    freeAcc: ['De graça?! Aí sim! Negócio fechado!', 'Opa! Assim eu esqueço tudo que aconteceu.', 'Sério? De graça? ...Tá bom, você me ganhou.'],
    discAcc: ['{pct}%? Fechado!', 'Com {pct}% de desconto eu aceito.', 'Hmm... {pct}%. Tá bom, trato feito.'],
    refundPart: ['Devolve {pct}% e a gente fica quite.', '{pct}% de volta? ...Tá, aceito.', 'Tá. {pct}% do meu dinheiro de volta e esqueço isso.'],
    discLow: ['Só {pct}%?! Tá de brincadeira com a minha cara?', '{pct}%? Isso é esmola!', 'Com {pct}% não dá nem pro ônibus!'],
    discCounter: ['{pct}%? Faz {cpct}% e a gente fecha.', 'Hmm... {pct} não. {cpct}% e tá resolvido.', 'Nem {pct} nem 100: {cpct}% e esqueço tudo.'],
    counterRepeat: ['Eu já disse: {cpct}%. Topa ou não?', 'Minha proposta continua: {cpct}%.'],
    redoAcc: ['Tá bom, conserta de novo. Mas direito dessa vez!', 'Ok... vou te dar mais uma chance. Capricha!', 'Fechado. Refaz e a gente fica em paz.'],
    redoMeh: ['Consertar de novo? E se der problema de novo?', 'Refazer? Não sei se confio...', 'Hmm, você já teve sua chance...'],
    giftAcc: ['Hm... tá, aceito o {gift}. Mas não acabou!', 'Ah, {gift}? ...Tá bom, obrigado.', '{gift}? Até que ajuda a esfriar a cabeça.'],
    giftLove: ['{gift}?! Ai, você sabe me conquistar!', 'Opa, {gift}! Aí você falou minha língua!', 'Hmm, {gift}... tá perdoado. Quase.'],
    giftAgain: ['Não vou aceitar mais nada, só quero resolver!', 'Chega de agrado!'],
    promise: {
      F: ['Promessa? Já ouvi muita promessa!', 'Palavra não enche barriga!'],
      I: ['Vou cobrar essa promessa, hein.', 'Tá. Vou confiar... por enquanto.'],
      C: ['Tá bom, confio em você.', 'Beleza, palavra dada é palavra cumprida.'],
    },
    explain: {
      F: ['Não quero saber de peça nenhuma!', 'Não me enrola com termo técnico!', 'Tá me enrolando com "{w}"?'],
      I: ['Hmm... "{w}"? Tá, faz sentido... um pouco.', 'Tá, você entende do assunto. Mas e aí?', 'Explicou, mas não resolveu.'],
      C: ['Ah, então era isso. Entendi.', 'Obrigado por explicar direitinho.', 'Viu, explicando fica mais fácil.'],
    },
    explainNerd: ['Hmm, "{w}"... interessante! Continue.', 'Ah, agora sim uma explicação técnica decente.', 'Faz sentido. Os dados batem.'],
    blame: {
      F: ['A CULPA É MINHA?! Você tá louco?!', 'Agora a culpa é minha?! Era só o que faltava!', 'Não inverte as coisas!'],
      I: ['Eu não fiz nada de errado!', 'Tá dizendo que a culpa é minha?', 'Hmm, não gostei desse tom.'],
      C: ['Bom... talvez eu tenha deixado cair um pouquinho...', 'Tá, pode ser que eu tenha culpa também.', 'Hmm, é, eu uso meio mal mesmo...'],
    },
    insult: {
      F: ['O QUE VOCÊ DISSE?!', 'Repete se tiver coragem!', 'Olha a boca!', 'Que falta de respeito!'],
      I: ['Ei! Me respeita!', 'Sério que você vai me xingar?', 'Que grosseria!'],
      C: ['Nossa... que grosso.', 'Eu tava calmo até agora...', 'Não precisava disso.'],
    },
    threat: {
      F: ['Chama! Chama a polícia que eu quero ver!', 'Tá me ameaçando?!', 'Ah é? Vou te processar primeiro!'],
      I: ['Tá me ameaçando agora?', 'Nossa, que atendimento...', 'Isso é jeito de tratar cliente?'],
      C: ['Calma, ninguém precisa de polícia...', 'Opa, opa, não precisa disso.', 'Tá bom, tá bom, sem estresse.'],
    },
    humorOk: ['Hahaha! Tá, essa foi boa.', 'Kkkk... não me faz rir que eu tô bravo!', 'Pff... tá, você é engraçado.', 'Hahaha! Ai, ai... tá bom.'],
    humorBad: ['Tá rindo da minha cara?!', 'Você acha isso ENGRAÇADO?!', 'Não tem graça nenhuma!', 'Piadinha agora?'],
    flirt: {
      blush: ['E-ehh?! O-o que você tá falando?!', 'N-não muda de assunto assim! ...', 'Q-que isso! Foco no problema!'],
      flatter: ['Eu sei que sou linda, amore. Mas isso não resolve.', 'Obrigada, eu sei. Agora foco.', 'Cantada não paga conserto, querido.'],
      tsun: ['B-B-BAKA! Não fala essas coisas!', 'Q-quem você pensa que é?! ...Hmpf!', 'Idiota! Não é hora pra isso!'],
      vovo: ['Ai, meu filho, eu podia ser sua avó! Hihi.', 'Que menino galanteador! Mas não muda de assunto.'],
      annoyed: ['Que falta de profissionalismo!', 'Tá dando em cima de mim no meio da reclamação?!', 'Isso é sério? Que ridículo.', 'Não é hora pra gracinha.'],
    },
    compliment: { F: ['Elogio não resolve nada!', 'Não adianta puxar meu saco!'], I: ['Hm... obrigado, mas continuo bravo.', 'Tá, tá. Obrigado. Mas e aí?'], C: ['Ah, obrigado! Que gentil.', 'Hehe, obrigado~'] },
    agreeNoOffer: { F: ['"Sim" o quê?! Fala o que vai fazer!', 'Concordar não resolve!'], I: ['Então resolve!', 'Se concorda, faz alguma coisa.'], C: ['Que bom que a gente concorda.', 'Beleza então.'] },
    disagree: { F: ['NÃO?! Como assim não?!', 'Não?! Então eu não saio daqui!'], I: ['Não? Então como fica?', 'Hmm, "não" não é resposta.'], C: ['Tá bom, mas então me dá uma solução.', 'Hmm, tudo bem... e aí?'] },
    refuse: { F: ['Não vai?! Então vou fazer escândalo!', 'Ah, não vai? Pois eu vou falar mal dessa loja pra todo mundo!'], I: ['Então a gente tem um problema.', 'Não? Que atendimento péssimo.'], C: ['Hmm, que pena. Pensei que você fosse mais legal.', 'Tá... não gostei, mas tá.'] },
    rules: { F: ['Enfia a regra no bolso!', 'Regra?! Que regra?! Eu sou o cliente!'], I: ['Regra, regra... e o bom senso?', 'Hmm, conheço meus direitos também, tá?'], C: ['Tá, se é a regra, é a regra.', 'Justo. Regras são regras.'] },
    rulesFormal: ['Hmm. Se está no regulamento, respeito.', 'Certo, procedimento é procedimento.', 'Correto. Documentado?'],
    time: { F: ['Pressa tenho EU!', 'Não tenho o dia todo!'], I: ['Anda logo então.', 'Tempo é algo que eu não tenho.'], C: ['Tá, sem pressa.', 'Tudo bem, eu espero.'] },
    dismiss: { F: ['"Tanto faz"?! TANTO FAZ?!', 'Você não tá nem aí mesmo, né?!', 'Que desrespeito!'], I: ['Nossa, que descaso.', 'Legal. Muito profissional.'], C: ['Hmm... não gostei do tom.', 'Tá... que frieza.'] },
    askName: ['Meu nome é {nome}, e eu não vou esquecer o seu!', 'Sou {nome}. Anota aí: cliente insatisfeito!', 'É {nome}. Por quê? Vai me dar desconto de aniversário?', '{nome}. Prazer... ou quase.'],
    askHow: { F: ['Como eu tô?! PÉSSIMO, graças a você!', 'Tô ótimo, olha minha cara!'], I: ['Já estive melhor.', 'Tô bem... tirando esse problema.'], C: ['Tô bem, obrigado por perguntar!', 'Agora tô melhor~'] },
    askWhy: ['Porque {grievance}!', 'Por quê?! Porque {grievance}, ora!', 'Simples: {grievance}.'],
    askPrice: ['Eu quero {demandTxt}.', 'Pra mim resolver custa {demandTxt}.', 'Faz as contas: {demandTxt}.'],
    askWant: ['O que eu quero? {demandTxt}!', 'Simples: {demandTxt}.', 'Quero {demandTxt}. Só isso.', 'Olha, {grievance}. Eu quero {demandTxt}.'],
    question: { F: ['Quem faz as perguntas aqui sou EU!', 'Pergunta?! Resposta você me deve!', 'Não me vem com pergunta!'], I: ['Você que tem que me responder!', 'Hmm, pergunta difícil. Mas e meu problema?'], C: ['Boa pergunta... não sei.', 'Hmm, deixa eu pensar... não sei, sério.'] },
    topicLike: ['Opa, {topic}? Aí você me pegou...', 'Hmm, {topic}... tá, esse assunto eu gosto.', 'Ah, {topic}! Bom... mas não esquece meu problema.'],
    topicOff: ['Tá mudando de assunto?!', '{topic}?! O que isso tem a ver comigo?', 'Não tenta me distrair com {topic}!', 'Foco! Esquece {topic}!'],
    politica: ['Política não! Nem começa!', 'Ih, política... não vou discutir isso aqui.'],
    gib: ['Hã? Que língua é essa?', 'Você bateu a cabeça no teclado?', 'Tá me zoando? Escreve direito!', '"{raw}"?! Isso é código secreto?'],
    empty: ['...Vai ficar calado?', 'Silêncio? Sério?', 'Fala alguma coisa!', 'Tô esperando...'],
    repeat: ['Você vai repetir isso de novo?', 'Já ouvi isso. Tenta outra coisa.', 'Disco arranhado, é?'],
    caps: ['NÃO GRITA COMIGO!', 'Tá gritando por quê?!', 'Abaixa esse tom!'],
    thanks: { F: ['Obrigado por quê?! Não fiz nada!'], I: ['De nada... eu acho.'], C: ['De nada!', 'Imagina~'] },
    goodbye: { F: ['Tchau não! A gente não terminou!', 'Vai fugir, é?'], I: ['Ainda não acabou!'], C: ['Calma, ainda não resolvemos.'] },
    bribe: ['O QUÊ?! Tá me oferecendo PROPINA?!', 'Isso é corrupção! Vou anotar!', 'Nem pense nisso!'],
    unknownF: ['Eu não tô aqui pra conversa fiada!', 'Isso não resolve NADA!', 'Enrolação! Quero uma solução!', 'Blá-blá-blá... e meu problema?'],
    unknownI: ['Hmm... e daí?', 'Tá, mas e o meu problema?', 'Não entendi aonde você quer chegar.', 'Certo... e aí?'],
    unknownC: ['Hmm, interessante.', 'Ah, é? Legal.', 'Hmm... tá bom.', 'Entendi... acho.'],
    reflect: ['Você diz que {r}... e daí?', '{R}? Problema seu! E o meu?', 'Hmm, {r}? Não muda nada pra mim.', 'Ah, então {r}. E eu com isso?'],
    reflectC: ['Ah, {r}? Entendi.', 'Hmm, então {r}... faz sentido.', 'Sério que {r}? Hm.'],
    quote: ['"{w}"? O que "{w}" tem a ver com isso?', 'Como assim, "{w}"?', '"{w}"... tá, e aí?', 'Não entendi esse "{w}".'],
    demandRemind: ['E aí, vai resolver ou não?', 'Tô esperando uma solução.', 'Lembrando: {demandTxt}.', 'E {demandTxt}?'],
    calmDone: ['...Tá bom. Esfriei a cabeça. Vamos esquecer isso.', 'Ah, tudo bem. Você me convenceu. Desculpa o escândalo.', 'Hmpf... tá. Tá tudo bem agora.'],
    explode: ['CHEGA! Eu vou embora e vou falar mal dessa espelunca pra TODO MUNDO!', 'ACABOU! Nunca mais piso aqui!', 'É O FIM! Vou te processar! Vou postar! Vou... ARGH!'],
    leave: ['Cansei. Tô indo embora.', 'Não dá. Perdi meu tempo aqui.', 'Esquece. Tchau.'],
  };

  const GIFTNAMES = { cafe: 'café', agua: 'água', bala: 'bala', balinha: 'balinha', chocolate: 'chocolate', bombom: 'bombom', salgado: 'salgado', lanche: 'lanche', 'pao de queijo': 'pão de queijo', doce: 'docinho', biscoito: 'biscoito', suco: 'suco', refri: 'refri', coxinha: 'coxinha', pastel: 'pastel', pizza: 'pizza', brinde: 'brinde', presente: 'presente', cupom: 'cupom', vale: 'vale' };
  const TOPICNAME = { futebol: 'futebol', clima: 'o tempo', comida: 'comida', musica: 'música', games: 'videogame', vida: 'família', animal: 'bichinho', cassino: 'cassino', politica: 'política' };
  const REFL = { eu: 'você', voce: 'eu', meu: 'seu', minha: 'sua', meus: 'seus', minhas: 'suas', seu: 'meu', sua: 'minha', estou: 'está', esta: 'estou', sou: 'é', fui: 'foi', tenho: 'tem', posso: 'pode', quero: 'quer', acho: 'acha', me: 'te', te: 'me', comigo: 'com você', contigo: 'comigo', mim: 'você', vou: 'vai', fiz: 'fez', sei: 'sabe', gosto: 'gosta', preciso: 'precisa', estava: 'estava', era: 'era', odeio: 'odeia', amo: 'ama', faco: 'faz', penso: 'pensa', consigo: 'consegue' };

  function mood(a) { return a >= 70 ? 'F' : a >= 35 ? 'I' : 'C'; }
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, (_, k) => v[k] !== undefined ? v[k] : ''); }

  // ---------- mente de um personagem ----------
  function create(npc, sc) {
    const p = Object.assign({}, PERS[npc.id] || P('mano', .5, .5, .5));
    const temper = p.temper, calmMod = (window.GAME && GAME.mod('calm')) || 0;
    const m = {
      npc, p, v: VOICE[p.voice] || VOICE.mano, sc,
      anger: clamp(Math.round(sc.anger0 + temper * 18 - calmMod), 20, 95), trust: 35, turn: 0, maxTurns: sc.maxTurns || 7,
      used: new Set(), seen: {}, last: '', counter: null, giftTaken: false, outcome: null, deal: null, lastExpr: 'angry',
    };
    return m;
  }
  function say(m, bank, vars) {
    const arr = Array.isArray(bank) ? bank : bank[mood(m.anger)];
    let opts = arr.filter(x => !m.used.has(x)); if (!opts.length) opts = arr;
    const t = pick(opts); m.used.add(t);
    return fill(t, Object.assign({ nome: m.npc.name, addr: m.v.addr, grievance: m.sc.grievance, demandTxt: m.sc.demandTxt }, vars || {}));
  }
  function flavor(m, txt) {
    if (Math.random() < .45) txt = pick(m.v.pre) + ' ' + (/^[A-ZÀ-Ú][a-zà-ú]/.test(txt) ? txt.charAt(0).toLowerCase() + txt.slice(1) : txt);
    if (Math.random() < .35) { const s = pick(m.v.suf); if (s) txt = /^[.~]/.test(s) ? txt.replace(/[.!?~]+$/, '') + s : txt.replace(/[.!?~]*$/, m => m || '.') + s; }
    if (Math.random() < .12 && m.v.addr) txt = txt.replace(/([^.!?~\s])([.!?~]+)(\s|$)/, `$1, ${m.v.addr}$2$3`);
    return txt;
  }
  function reflectText(raw) {
    const words = raw.replace(/[?!.]+$/, '').split(/\s+/).slice(0, 14);
    return words.map(w => { const k = stripAcc(w.toLowerCase()).replace(/[^a-z]/g, ''); return REFL[k] || w.toLowerCase(); }).join(' ');
  }
  function keyWord(r) {
    const cands = r.raw.split(/[\s,.;!?]+/).filter(w => w.length >= 4 && !STOP.has(stripAcc(w.toLowerCase())));
    cands.sort((a, b) => b.length - a.length);
    return cands[0] || null;
  }
  function giftName(r) { for (const k of Object.keys(GIFTNAMES)) if (new RegExp(`(^| )${k}\\w*( |$)`).test(r.s)) return GIFTNAMES[k]; return 'presente'; }
  function pctFrom(m, r) {
    if (r.num.pct !== null) return r.num.pct;
    if (r.num.money !== null) return Math.round(r.num.money / Math.max(1, m.sc.base) * 100);
    if (r.num.bare !== undefined && r.num.bare <= 100 && (r.hits.discount || r.hits.refund)) return r.num.bare;
    return null;
  }

  // Processa uma fala do jogador. Retorna {text, expr, delta, outcome, deal}
  function respond(m, raw, ctx = {}) {
    if (m.outcome) return { text: '', expr: m.lastExpr, outcome: m.outcome };
    const r = analyze(raw, ctx.names || []);
    const h = r.hits, p = m.p, sc = m.sc;
    m.turn++;
    let d = 0, text = null, expr = null, trustD = 0;
    const seen = k => (m.seen[k] = (m.seen[k] || 0) + 1) - 1; // quantas vezes já usou
    const dim = k => Math.pow(.55, seen(k));                   // retorno decrescente
    const lines = [];
    const add = (t) => { if (t) lines.push(t); };
    const addressedOther = ctx.addressedOther; // (briga de fila) falou com o outro

    // ---- casos especiais primeiro ----
    if (r.empty) { d += 6; add(say(m, T.empty)); }
    else if (r.gib) { d += 8; add(say(m, T.gib, { raw: r.raw.slice(0, 18) })); expr = 'surprised'; }
    else if (stripAcc(r.raw.toLowerCase()) === m.last) { d += 9; add(say(m, T.repeat)); }
    else {
      if (r.caps) { d += 10; add(say(m, T.caps)); expr = 'angry'; }
      // propina (fiscal leva muito a sério)
      if (h.bribe && (sc.kind === 'fiscal' || sc.kind === 'agiota')) { d += sc.kind === 'fiscal' ? 38 : 5; trustD -= 30; add(say(m, T.bribe)); m.bribed = true; expr = 'angry'; }
      // ofensas
      if (h.insult) { d += 26 * (0.7 + p.pride * .6) + seen('insult') * 8; trustD -= 20; add(say(m, T.insult)); expr = 'angry'; }
      if (h.threat) {
        d += 16 * (0.6 + p.pride * .6); trustD -= 25;
        if (m.anger + d > 65 && Math.random() < .5) { m.leaving = true; }
        add(say(m, T.threat)); expr = expr || (m.anger > 60 ? 'angry' : 'worried');
      }
      if (h.dismiss) { d += 14; trustD -= 10; add(say(m, T.dismiss)); expr = 'angry'; }
      if (h.blame) {
        const truth = sc.theirFault;
        d += truth && m.anger < 45 ? -6 : 16 * (0.6 + p.pride * .8);
        add(say(m, T.blame)); expr = expr || (truth && m.anger < 45 ? 'worried' : 'angry');
      }

      // ---- ofertas / acordos ----
      const pct = pctFrom(m, r);
      // "conserto de novo de graça" = refazer na garantia (não é devolver dinheiro)
      if (h.free && h.redo && sc.kind === 'reclamacao') delete h.free;
      const offerType = h.free ? 'free' : h.refund ? 'refund' : (h.discount || pct !== null) && !h.refuse ? 'discount' : null;
      if (sc.kind === 'fiscal') {
        if (h.rules && !h.bribe) {
          if (ctx.hasDocs) { d -= 45; add('Hm... alvará, licença, extintor... Tá tudo em ordem, de fato.'); expr = 'neutral'; m.docsOk = true; }
          else if (seen('docs') === 0) { d += 4; add('Então me mostra. Estou esperando o alvará.'); }
          else { d += 12; add('Não estou vendo documento nenhum. Não me enrole.'); expr = 'angry'; }
        }
        if (h.pay || (h.agree && m.counter)) { m.deal = { type: 'fine', pct: m.counter ? m.counter.pct : 100 }; }
        if (h.delay && !m.deal && (h.promise || h.apology || m.trust >= 45)) { m.deal = { type: 'fine', pct: 50 }; add('Tá. Vou te dar um prazo pra regularizar. Mas a multa reduzida você paga hoje.'); }
        else if (h.delay && !m.deal) { m.counter = { type: 'fine', pct: 70 }; d -= 4; add('Prazo? Posso reduzir a multa pra 70% se pagar agora. Aceita?'); }
      } else if (sc.kind === 'agiota') {
        const val = r.num.money !== null ? r.num.money : null;
        if (h.pay && val) { m.deal = { type: 'pay', money: val }; }
        else if (h.pay && !val) { add('Paga quanto? Fala o valor, chapa.'); d -= 2; }
        if (h.delay && !m.deal) {
          if (m.trust >= 40 || h.promise) { m.deal = { type: 'prazo' }; }
          else { d += 8; add('Prazo? Prazo é pra quem eu confio. Me convence.'); }
        }
      } else if (sc.kind === 'fila') {
        // tratado no grupo
      } else if (offerType === 'free') {
        m.deal = { type: 'free', pct: 100 };
      } else if (offerType === 'refund' && (sc.demand === 'refund' || sc.demand === 'discount')) {
        const want = pct !== null ? pct : 100;
        if (want >= sc.target) m.deal = { type: 'refund', pct: want };
        else if (want >= sc.target * .5) { m.counter = { type: 'refund', pct: Math.round((want + sc.target) / 2 / 5) * 5 }; d -= 8; add(say(m, T.discCounter, { pct: want, cpct: m.counter.pct })); }
        else { d += 6; add(say(m, T.discLow, { pct: want })); }
      } else if (offerType === 'discount' || (offerType === 'refund' && sc.demand !== 'refund')) {
        if (pct === null) { d -= 3; add(pick(['Desconto de quanto?', 'Quanto de desconto? Fala um número.', 'Desconto? Quanto?'])); }
        else if (pct >= sc.target) m.deal = { type: sc.demand === 'refund' ? 'refund' : 'discount', pct };
        else if (pct >= sc.target * .45) {
          const c = Math.round((pct + sc.target) / 2 / 5) * 5;
          if (m.counter && pct >= m.counter.pct) m.deal = { type: m.counter.type, pct };
          else { m.counter = { type: sc.demand === 'refund' ? 'refund' : 'discount', pct: c }; d -= 8; add(say(m, T.discCounter, { pct, cpct: c })); }
        } else { d += 6 * (1 + p.pride); add(say(m, T.discLow, { pct })); }
      }
      if (h.redo && !m.deal && sc.kind !== 'fiscal' && sc.kind !== 'agiota' && sc.kind !== 'fila' && sc.kind !== 'barraco') {
        if (sc.demand === 'redo' || m.trust >= 55) m.deal = { type: 'redo' };
        else { d -= 10 * dim('redo'); add(say(m, T.redoMeh)); }
      }
      if (h.agree && m.counter && !m.deal && !h.disagree) m.deal = Object.assign({}, m.counter);
      if (h.disagree && m.counter && !m.deal && !h.agree) { d += 10; add(say(m, T.counterRepeat, { cpct: m.counter.pct })); }
      if (h.refuse) { d += 12; add(say(m, T.refuse)); expr = 'angry'; }

      // ---- aproximação ----
      if (h.manager && !h.insult) {
        if ((sc.kind === 'karen' || /gerente/.test(sc.demandTxt || '')) && !seen('manager')) { d -= 24; trustD += 12; add(pick(['Ah! Finalmente o GERENTE. Agora sim vamos conversar direito.', 'O gerente em pessoa? Hm. Muito bem, assim eu gosto.'])); expr = 'smug'; }
        else if (!lines.length) add(pick(['Ah, você é o dono? Então a culpa é sua mesmo!', 'Dono, é? Pois então resolve!']));
      }
      if (h.apology) {
        const k = seen('apology');
        d -= (sc.demand === 'respect' ? 20 : 12) * (0.6 + p.pride) * Math.pow(.5, k); trustD += 8 * Math.pow(.5, k);
        add(k ? say(m, T.apologyAgain) : say(m, T.apology)); expr = expr || (m.anger > 60 ? 'angry' : 'worried');
      }
      if (h.empathy) { d -= 11 * dim('empathy'); trustD += 6; add(say(m, T.empathy)); }
      if (h.calm) {
        if (m.anger >= 70 && Math.random() < .4 + p.pride * .4) { d += 5; add(say(m, T.calm)); expr = 'angry'; }
        else { d -= 7 * dim('calm'); add(say(m, T.calm)); }
      }
      if (h.polite && !h.thanks) { d -= 4 * dim('polite'); trustD += 3; if (!lines.length) add(say(m, T.polite)); }
      if (h.thanks && !lines.length) { d -= 1; add(say(m, T.thanks)); }
      if (h.promise) { d -= 8 * (m.trust / 50) * dim('promise'); trustD += 6; if (sc.demand === 'respect' && h.apology) m.deal = m.deal || { type: 'promise' }; add(say(m, T.promise)); }
      if (h.gift && sc.kind !== 'fiscal') {
        const g = giftName(r);
        if (m.giftTaken) add(say(m, T.giftAgain));
        else { m.giftTaken = true; const love = (p.likes || []).includes('comida'); d -= love ? 18 : 9; trustD += 5; add(say(m, love ? T.giftLove : T.giftAcc, { gift: g })); expr = love ? 'happy' : null; m.giftCost = /cafe/.test(r.s) ? 3 : 6; }
      }
      if (h.explain && !h.insult) {
        const w = (r.raw.match(/\b(pe[çc]a|bateria|tela|placa|chip|conector|oxida\w*|curto|defeito|f[áa]brica|solda|display|flex|circuito|software|sistema)\b/i) || [])[0] || 'isso';
        if (p.nerd) { d -= 12 * dim('explain'); trustD += 6; add(say(m, T.explainNerd, { w })); }
        else { d += m.anger >= 70 ? 3 : -5 * dim('explain'); add(say(m, T.explain, { w })); }
      }
      if (h.rules && sc.kind !== 'fiscal') { if (p.formal) { d -= 6; add(say(m, T.rulesFormal)); } else { d += 5; add(say(m, T.rules)); } }
      if (h.flirt && !h.insult) {
        const kind = p.flirt || 'annoyed';
        d += kind === 'annoyed' ? 12 : kind === 'flatter' ? -4 : kind === 'vovo' ? -6 : 2;
        add(say(m, T.flirt[kind])); expr = kind === 'annoyed' ? 'angry' : kind === 'vovo' ? 'happy' : 'blush';
      }
      if (h.compliment && !h.flirt && !h.insult) { d -= (5 + p.pride * 6) * dim('compliment'); add(say(m, T.compliment)); expr = expr || (m.anger < 50 ? 'blush' : null); }
      if (h.humor && !h.insult) {
        if (p.humor > .5 && m.anger < 72) { d -= 13 * p.humor * dim('humor'); add(say(m, T.humorOk)); expr = 'happy'; }
        else { d += 9; add(say(m, T.humorBad)); expr = 'angry'; }
      }
      if (h.greet && !lines.length) { d += m.turn > 1 ? 1 : -2; add(say(m, T.greet)); }
      if (h.askName) add(say(m, T.askName));
      if (h.askHow && !lines.length) add(say(m, T.askHow));
      if (h.askWant) { add(say(m, T.askWant)); d -= 2; }
      if (h.askPrice && !h.askWant) add(say(m, T.askPrice));
      if (h.askWhy && !h.askWant) add(say(m, T.askWhy));
      if (h.goodbye && !lines.length) { d += 6; add(say(m, T.goodbye)); }
      if (h.time && !lines.length) { d += p.temper > .5 ? 3 : -1; add(say(m, T.time)); }
      if (h.agree && !m.counter && !m.deal && !lines.length) { d -= 1; add(say(m, T.agreeNoOffer)); }
      if (h.disagree && !m.counter && !lines.length && !h.refuse) { d += 5; add(say(m, T.disagree)); }
      // assuntos aleatórios
      if (r.topics.length && lines.length < 2) {
        const tp = r.topics[0];
        if (tp === 'politica') { d += 3; add(pick(T.politica)); }
        else if ((p.likes || []).includes(tp) && m.anger < 75) { d -= 9 * dim('topic'); trustD += 4; add(say(m, T.topicLike, { topic: TOPICNAME[tp] })); expr = expr || 'smile'; }
        else if (!lines.length) { d += m.anger >= 50 ? 6 : 1; add(say(m, T.topicOff, { topic: TOPICNAME[tp] })); }
      }
      if (h.money && !m.deal && !lines.length) add(pick([`R$ ${r.num.money}? Pra quê? Explica direito.`, `${r.num.money} reais o quê? Tá oferecendo?`]));
      // nada reconhecido: reflete, cita ou reage
      if (!lines.length) {
        const words = r.tokens.length;
        if (r.question) { add(say(m, T.question)); d += m.anger > 60 ? 2 : 0; }
        else if (/(^| )eu( |$)/.test(r.s) && words <= 14 && words >= 3) { const rf = reflectText(r.raw); add(say(m, m.anger < 35 ? T.reflectC : T.reflect, { r: rf, R: rf.charAt(0).toUpperCase() + rf.slice(1) })); d += m.anger > 50 ? 2 : 0; }
        else { const w = keyWord(r); if (w && Math.random() < .55) add(say(m, T.quote, { w: w.toLowerCase() })); else add(say(m, m.anger >= 70 ? T.unknownF : m.anger >= 35 ? T.unknownI : T.unknownC)); d += m.anger > 60 ? 3 : 1; }
      }
      // esforço: mensagens longas e educadas contam mais
      if (r.len > 70 && (h.apology || h.empathy || h.promise || h.explain) && !h.insult) d -= 5;
      if (r.names.includes(m.npc.id) && !h.insult) d -= 3;
    }
    if (addressedOther) d = d * .35 + 4; // falou com o outro na briga
    m.last = stripAcc(r.raw.toLowerCase());
    m.anger = clamp(Math.round(m.anger + d), 0, 100);
    m.trust = clamp(Math.round(m.trust + trustD), 0, 100);

    // ---- desfecho ----
    if (m.deal) {
      m.outcome = 'deal';
      const dl = m.deal;
      let t;
      if (dl.type === 'free') t = say(m, T.freeAcc);
      else if (dl.type === 'refund') t = dl.pct >= 100 ? say(m, T.refundAcc) : say(m, T.refundPart, { pct: dl.pct });
      else if (dl.type === 'discount') t = say(m, T.discAcc, { pct: dl.pct });
      else if (dl.type === 'redo') t = say(m, T.redoAcc);
      else if (dl.type === 'promise') t = 'Tá bom. Vou acreditar na sua palavra. Mas não quero ver isso de novo!';
      else if (dl.type === 'fine') t = dl.pct < 100 ? `Certo: multa com ${100 - dl.pct}% de desconto. Assine aqui.` : 'Muito bem. Multa paga, assunto encerrado.';
      else if (dl.type === 'pay') t = dl.money >= (sc.debt || 0) ? 'Hehe... tudo pago. Foi um prazer fazer negócio, chapa.' : `R$ ${dl.money} por enquanto... tá. Mas o resto continua correndo, hein.`;
      else if (dl.type === 'prazo') t = 'Hmpf. Mais 2 dias. Mas os juros sobem, hein? Não me decepciona.';
      lines.length = 0; lines.push(t); expr = dl.type === 'fine' || dl.type === 'prazo' ? 'smug' : 'smile';
    } else if (m.docsOk && m.anger <= 30) {
      m.outcome = 'calm'; lines.length = 0; lines.push('Está tudo regularizado. Tenha um bom dia, senhor. E desculpe o incômodo.'); expr = 'smile';
    } else if (m.anger <= 12) {
      m.outcome = 'calm'; lines.push(say(m, T.calmDone)); expr = 'smile';
    } else if (m.anger >= 100) {
      m.outcome = 'explode'; lines.length = Math.min(lines.length, 1); lines.push(say(m, T.explode)); expr = 'angry';
    } else if (m.leaving && m.anger >= 60) {
      m.outcome = 'leave'; lines.push(say(m, T.leave)); expr = 'angry';
    } else if (m.turn >= m.maxTurns) {
      m.outcome = m.anger < 45 ? 'calm' : 'leave';
      lines.push(m.outcome === 'calm' ? 'Tá... quer saber? Deixa pra lá. Já perdi tempo demais.' : say(m, T.leave)); expr = m.outcome === 'calm' ? 'neutral' : 'angry';
    } else if (lines.length === 1 && Math.random() < .3 && m.anger > 35 && sc.demandTxt) {
      lines.push(say(m, T.demandRemind));
    }
    if (!expr) expr = m.anger >= 70 ? 'angry' : m.anger >= 45 ? 'worried' : m.anger >= 25 ? 'neutral' : 'smile';
    m.lastExpr = expr;
    let text2 = lines.slice(0, 2).join(' ');
    if (!m.outcome || m.outcome === 'deal') text2 = flavor(m, text2);
    return { text: text2, expr, delta: d, outcome: m.outcome, deal: m.deal, analysis: r };
  }

  // ---------- briga entre dois clientes (fila) ----------
  const G2 = {
    fairOk: ['Hmm... tá, se for por ordem de chegada, é justo.', 'Justo. Não tenho como discordar.', 'Tá bom, assim é justo.'],
    fairFirst: ['Viu?! Eu disse que cheguei primeiro!', 'Obrigado! Finalmente alguém com bom senso.', 'Isso! A vez é minha!'],
    fairLoser: ['Tá... eu espero. Mas não demora!', 'Hmpf. Tá bom, eu espero minha vez.', 'Tá, tá... pelo menos foi justo.'],
    favored: ['Ha! Tá vendo? O técnico tá do meu lado!', 'Obrigado! Viu só?', 'Aí sim! Justiça!'],
    unfavored: ['O QUÊ?! Você tá do lado dele?!', 'Que injustiça! Eu tô esperando há horas!', 'Ah, é assim? Proteção pra quem grita mais?'],
    bicker: ['Eu cheguei primeiro, e todo mundo viu!', 'Mentira! Eu tava aqui antes!', 'Você furou a fila na cara dura!', 'Para de mentir! Eu cheguei junto com a porta abrindo!', 'Olha a cara de pau!'],
    both: ['...Tá bom. Pelos dois, então.', 'Hmm, se é pros dois, tudo bem.'],
  };
  function respondGroup(g, raw, ctx = {}) {
    const [A, B] = g.minds;
    const r = analyze(raw, ctx.names || []);
    const h = r.hits, out = [];
    g.turn = (g.turn || 0) + 1;
    const addr = r.names.length === 1 ? r.names[0] : null;
    const first = g.sc.firstId;
    const sidePhrase = /(voce|voce primeiro|sua vez|seu primeiro|primeiro voce|pode vir|vem voce|atendo voce|primeiro)/.test(r.s);
    if (h.fair && !h.insult) {
      const k = (g.fairN = (g.fairN || 0) + 1);
      const orderTalk = /(chegada|chegou primeiro|quem chegou|senha|fila|um de cada vez|um por vez|vez de cada)/.test(r.s);
      for (const m of g.minds) {
        let d = -18 / k;
        if (orderTalk) d += m.npc.id === first ? -14 : -4;
        if (/(os dois|ambos|voces dois|atendo (os )?dois|os dois juntos)/.test(r.s)) d -= 6;
        m.anger = clamp(Math.round(m.anger + d), 0, 100); m.trust = clamp(m.trust + 8, 0, 100);
      }
      if (orderTalk) { const W = g.minds.find(m => m.npc.id === first), L = g.minds.find(m => m.npc.id !== first); out.push({ who: W, text: flavor(W, say(W, G2.fairFirst)), expr: 'smile' }); out.push({ who: L, text: flavor(L, say(L, G2.fairLoser)), expr: 'worried' }); }
      else { const m = pick(g.minds); out.push({ who: m, text: flavor(m, say(m, G2.fairOk)), expr: 'neutral' }); }
    } else if (addr && sidePhrase && !h.insult && !h.threat) {
      const fav = g.minds.find(m => m.npc.id === addr), oth = g.minds.find(m => m.npc.id !== addr);
      fav.anger = clamp(fav.anger - 24, 0, 100); oth.anger = clamp(oth.anger + (fav.npc.id === first ? 8 : 22), 0, 100);
      out.push({ who: fav, text: flavor(fav, say(fav, G2.favored)), expr: 'smug' });
      out.push({ who: oth, text: flavor(oth, say(oth, fav.npc.id === first ? G2.fairLoser : G2.unfavored)), expr: fav.npc.id === first ? 'worried' : 'angry' });
    } else if ((h.free || h.discount) && !h.refuse) {
      // agrado pra quem espera
      const pct = pctFrom(A, r);
      const tgt = addr ? g.minds.find(m => m.npc.id === addr) : g.minds.find(m => m.npc.id !== first);
      if (h.free || (pct !== null && pct >= 10)) { tgt.anger = clamp(tgt.anger - 40, 0, 100); tgt.dealPct = h.free ? 100 : pct; out.push({ who: tgt, text: flavor(tgt, h.free ? 'De graça pra mim? ...Tá. Pode atender o outro primeiro.' : `${pct}% de desconto por esperar? ...Fechado, eu espero.`), expr: 'smile' }); }
      else { out.push({ who: tgt, text: flavor(tgt, pct === null ? 'Desconto de quanto?' : `Só ${pct}%? Por esperar esse tempo todo?`), expr: 'worried' }); tgt.anger = clamp(tgt.anger + 3, 0, 100); }
    } else {
      // cada um reage (quem foi chamado pelo nome responde primeiro)
      const order = addr === B.npc.id ? [B, A] : [A, B];
      for (const m of order) {
        // o segundo não repete a mesma frase do primeiro
        if (out.length) m.used = new Set([...m.used, ...order[0].used]);
        const res = respond(m, raw, { names: ctx.names, addressedOther: addr && addr !== m.npc.id });
        m.outcome = null; m.deal = null; m.turn = Math.min(m.turn, 50);
        if (res.text && (out.length === 0 || !addr || Math.random() < .55)) out.push({ who: m, text: res.text, expr: res.expr });
      }
    }
    // os dois se alfinetam de vez em quando
    if (out.length < 2 && Math.random() < .45 && A.anger > 30 && B.anger > 30) { const m = pick(g.minds); out.push({ who: m, text: flavor(m, say(m, G2.bicker)), expr: 'angry' }); m.anger = clamp(m.anger + 3, 0, 100); }
    // desfecho
    let outcome = null;
    if (g.minds.some(m => m.anger >= 100)) outcome = 'explode';
    else if (g.minds.every(m => m.anger <= 25 || m.dealPct)) outcome = 'calm';
    else if (g.turn >= (g.sc.maxTurns || 8)) outcome = g.minds.every(m => m.anger < 55) ? 'calm' : 'leave';
    g.outcome = outcome;
    return { lines: out, outcome, analysis: r };
  }

  window.BRAIN = { analyze, create, respond, respondGroup, norm, PERS, VOICE, mood };
})();
