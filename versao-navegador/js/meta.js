// Sistemas de progressão: melhorias (50), itens da lojinha (32), buffs, relíquias permanentes e conquistas.
(function () {
  const RAR = {
    comum: { name: 'Comum', color: '#8ecae6', w: 60 },
    raro: { name: 'Rara', color: '#52d68a', w: 28 },
    epico: { name: 'Épica', color: '#b388ff', w: 10 },
    lendario: { name: 'Lendária', color: '#ffc300', w: 3 },
  };

  // ---------- 50 MELHORIAS (valem até o fim da partida) ----------
  // mods: payMult tipMult haggle repGain repLossMult customers rentMult partsEmergency stockDiscount screwSpeed heatSpeed
  //       noOverheat solderSpeed noBurn scanner noSpark parTime fastBonus damageMult shield diagHint reassemblyFast
  //       vipChance combo interest xpMult levelChoices rerolls storeDiscount storeSlots luck casinoPay jackpot
  //       allInGuard lottery scratch box nightCash noFines dailyPart wrongRefund indemnity
  const U = (id, name, desc, rarity, mods, icon, extra) => Object.assign({ id, name, desc, rarity, mods, icon }, extra || {});
  const UPGRADES = [
    U('chave_mag', 'Chave magnética', 'Parafusos saem 2x mais rápido.', 'comum', { screwSpeed: 1.2 }, { model: 'screwdriver2' }),
    U('soprador_pro', 'Soprador Pro', 'Aquece 2x mais rápido e nunca queima.', 'comum', { heatSpeed: 1, noOverheat: 1 }, { model: 'heatgun' }),
    U('estacao_solda', 'Estação de solda digital', 'Solda 2x mais rápida, sem risco de queimar.', 'comum', { solderSpeed: 1, noBurn: 1 }, { model: 'solderstation' }),
    U('pinca_anti', 'Pinça antiestática', 'Nada de curto se esquecer a bateria conectada.', 'comum', { noSpark: 1 }, { model: 'tweezers' }),
    U('caixa_org', 'Caixa organizada', '+25s na meta de tempo dos consertos.', 'comum', { parTime: 25 }, { model: 'toolbox' }),
    U('sininho', 'Sininho da sorte', 'Gorjetas +20%.', 'comum', { tipMult: .2 }, { model: 'deskbell' }),
    U('maquininha', 'Maquininha de cartão', 'Clientes pagam +10%.', 'comum', { payMult: .1 }, { model: 'pos' }),
    U('plantinha', 'Plantinha zen', 'Reputação cai 30% menos e sobe 10% mais.', 'comum', { repLossMult: .3, repGain: .1 }, { model: 'plant' }),
    U('luminaria', 'Luminária LED', 'Negociar fica 15% mais fácil.', 'comum', { haggle: .15 }, { model: 'desklamp' }),
    U('fone', 'Fone antiestresse', 'Clientes irritados tiram 40% menos reputação.', 'comum', { repLossMult: .4 }, { model: 'headphones' }),
    U('cafeteira', 'Cafeteira italiana', '+15s na meta e +5% no bônus de rapidez.', 'comum', { parTime: 15, fastBonus: .05 }, { emoji: '☕' }),
    U('tapete_esd', 'Tapete antiestático', 'Erros causam 15% menos dano.', 'comum', { damageMult: .15 }, { emoji: '🟩' }),
    U('prato_mag', 'Prato magnético grande', 'Na remontagem, 1 clique recoloca todos os parafusos.', 'comum', { reassemblyFast: 1 }, { emoji: '🧲' }),
    U('wifi', 'Wi-Fi grátis', 'Gorjetas +10% e reputação sobe 10% mais.', 'comum', { tipMult: .1, repGain: .1 }, { emoji: '📶' }),
    U('cartaz', 'Cartaz de promoção', '+1 cliente por dia, mas pagam 5% menos.', 'comum', { customers: 1, payMult: -.05 }, { emoji: '📢' }),
    U('fornecedor', 'Contato no fornecedor', 'Peças compradas às pressas 30% mais baratas.', 'comum', { partsEmergency: .3 }, { emoji: '📦' }),
    U('atacado', 'Compra no atacado', 'Peças de estoque 30% mais baratas.', 'comum', { stockDiscount: .3 }, { emoji: '🏷️' }),
    U('banquinho', 'Banquinho de espera', 'Negociar +5% e reputação sobe 10% mais.', 'comum', { haggle: .05, repGain: .1 }, { model: 'stool' }),
    U('ventilador', 'Ventilador de mesa', 'Soprador 50% mais rápido e +5s na meta.', 'comum', { heatSpeed: .5, parTime: 5 }, { emoji: '🌀' }),
    U('xp_curso', 'Curso online', '+30% de XP.', 'comum', { xpMult: .3 }, { emoji: '🎓' }),
    U('scanner', 'Scanner de diagnóstico', 'O multímetro avisa quando a leitura está anormal.', 'raro', { scanner: 1 }, { model: 'multimeter' }),
    U('letreiro', 'Letreiro neon', '+1 cliente por dia.', 'raro', { customers: 1 }, { model: 'signs' }),
    U('seguro', 'Seguro da loja', 'Aluguel 20% mais barato.', 'raro', { rentMult: .2 }, { model: 'register' }),
    U('dado', 'Dado da sorte', 'Sorte +1 nos caça-níqueis e +5% nos prêmios do cassino.', 'raro', { luck: 1, casinoPay: .05 }, { model: 'dice' }),
    U('parafusadeira', 'Parafusadeira elétrica', 'Parafusos saem 3,5x mais rápido.', 'raro', { screwSpeed: 2.5 }, { emoji: '🔫' }),
    U('microscopio', 'Microscópio digital', 'Ao abrir o aparelho, mostra uma dica do defeito real.', 'raro', { diagHint: 1 }, { emoji: '🔬' }),
    U('contadora', 'Contadora Dona Irene', 'Rende 3% do caixa no fim do dia (máx. R$ 500).', 'raro', { interest: .03 }, { emoji: '🧮' }),
    U('influencer', 'Parceria com influencer', '+10% de chance de cliente VIP (paga 2,2x).', 'raro', { vipChance: .1 }, { emoji: '🤳' }),
    U('fidelidade', 'Cartão fidelidade', 'Combo de perfeitos rende +5% a mais por nível.', 'raro', { combo: .05 }, { emoji: '💳' }),
    U('bancada_pro', 'Bancada profissional', 'Erros causam 20% menos dano e +10s na meta.', 'raro', { damageMult: .2, parTime: 10 }, { model: 'toolbox' }),
    U('luvas', 'Luvas de nitrilo', 'O primeiro erro de cada conserto não causa dano.', 'raro', { shield: 1 }, { emoji: '🧤' }),
    U('deposito', 'Depósito de peças', 'Ganha 1 peça aleatória toda manhã.', 'raro', { dailyPart: 1 }, { emoji: '🏚️' }),
    U('amigo_prefeitura', 'Amigo na prefeitura', 'Imune a multas e cano estourado.', 'raro', { noFines: 1 }, { emoji: '🤝' }),
    U('pix', 'Pix na conta', 'Clientes pagam +5% e gorjetas +10%.', 'raro', { payMult: .05, tipMult: .1 }, { emoji: '💠' }),
    U('mochila_grande', 'Prateleira extra', 'Lojinha mostra +1 item e fica 5% mais barata.', 'raro', { storeSlots: 1, storeDiscount: .05 }, { emoji: '🎒' }),
    U('vip_cassino', 'Cartão VIP do cassino', 'Ganha R$ 40 em fichas toda noite no cassino.', 'raro', { nightCash: 40 }, { model: 'chip' }),
    U('raspador', 'Moeda raspadora', 'Prêmios de raspadinha +25%.', 'raro', { scratch: .25 }, { model: 'coin' }),
    U('assinatura', 'Assinatura da Mega-Sorte', '1 bilhete grátis toda noite no cassino.', 'raro', { lottery: 1 }, { emoji: '🎫' }),
    U('pe_coelho', 'Pé de coelho', 'Sorte +1 nos caça-níqueis.', 'raro', { luck: 1 }, { emoji: '🐰' }),
    U('advogado', 'Advogado', 'Indenizações 30% menores e diagnóstico errado devolve 50% da peça.', 'raro', { indemnity: .3, wrongRefund: .5 }, { emoji: '⚖️' }),
    U('diploma', 'Diploma técnico', '+1 opção nas escolhas de level up e +10% XP.', 'epico', { levelChoices: 1, xpMult: .1 }, { emoji: '📜' }),
    U('d20', 'Dado de 20 lados', '+1 troca grátis nas escolhas de level up.', 'epico', { rerolls: 1 }, { emoji: '🎲' }),
    U('segunda_bancada', 'Segunda bancada', '+1 cliente por dia e clientes pagam +5%.', 'epico', { customers: 1, payMult: .05 }, { model: 'counter' }),
    U('ima_jackpot', 'Ímã de jackpot', 'Jackpot cresce 50% mais rápido e sorte +0,5.', 'epico', { jackpot: .5, luck: .5 }, { model: 'trophy' }),
    U('rede', 'Rede de proteção', 'Se perder um ALL IN, recupera 25% (1x por noite).', 'epico', { allInGuard: 1 }, { emoji: '🥅' }),
    U('selo5', 'Selo 5 estrelas', 'Reputação sobe 30% mais e clientes pagam +5%.', 'epico', { repGain: .3, payMult: .05 }, { emoji: '🌟' }),
    U('braco_robo', 'Braço robótico', 'Parafusos, solda e soprador 2x mais rápidos.', 'epico', { screwSpeed: 1, solderSpeed: 1, heatSpeed: 1 }, { emoji: '🦾' }),
    U('bolsa', 'Investimento na bolsa', 'Rende 6% do caixa no fim do dia (máx. R$ 500).', 'epico', { interest: .06 }, { emoji: '📈' }),
    U('midas', 'Toque de Midas', 'Clientes pagam +25% e gorjetas +25%.', 'lendario', { payMult: .25, tipMult: .25 }, { emoji: '👑' }, { needAch: 3 }),
    U('trevo_dourado', 'Trevo dourado', 'Sorte +2, prêmios do cassino +15% e caixa misteriosa melhor.', 'lendario', { luck: 2, casinoPay: .15, box: 1 }, { emoji: '☘️' }, { needAch: 5 }),
  ];
  const UPG = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

  // ---------- 32 ITENS DA LOJINHA (consumíveis) ----------
  // use: 'casino' | 'repair' (durante o conserto) | 'day' | 'any'
  // buff: {kind:'bets'|'repairs'|'day'|'night', n, mods}
  const I = (id, name, emoji, price, use, desc, fx) => Object.assign({ id, name, emoji, price, use, desc }, fx);
  const ITEMS = [
    I('cigarro', 'Maço "Sorte Grande"', '🚬', 25, 'casino', 'Só pode fumar no cassino. Sorte +2 e prêmios +10% nas próximas 8 apostas. O cheiro tira 0,1 de reputação.', { buff: { kind: 'bets', n: 8, mods: { luck: 2, casinoPay: .1 } }, rep: -.1, smoke: true, pack: 5, warn: 'O Ministério da Saúde adverte: fumar causa câncer de pulmão.' }),
    I('charuto', 'Charuto cubano', '🟤', 70, 'casino', 'Prêmios do cassino +30% nas próximas 4 apostas. Cheiro forte: −0,2 de reputação.', { buff: { kind: 'bets', n: 4, mods: { casinoPay: .3 } }, rep: -.2, smoke: true, warn: 'O Ministério da Saúde adverte: fumar causa câncer de pulmão.' }),
    I('trevo4', 'Trevo de 4 folhas', '🍀', 40, 'casino', 'Sorte +6 na próxima aposta.', { buff: { kind: 'bets', n: 1, mods: { luck: 6 } } }),
    I('energetico_cas', 'Energético Tubarão', '⚡', 30, 'casino', '3 giros GRÁTIS nos caça-níqueis (com a aposta escolhida).', { freeSpins: 3 }),
    I('oculos', 'Óculos escuros', '🕶️', 35, 'casino', 'Se perder a próxima aposta, recupera 50%.', { buff: { kind: 'bets', n: 1, mods: { cashback: .5 } } }),
    I('ficha_ouro', 'Ficha dourada', '🟡', 90, 'casino', 'O próximo prêmio no cassino vale o DOBRO.', { buff: { kind: 'bets', n: 1, mods: { doublePrize: 1 } } }),
    I('dado_viciado', 'Dado viciado', '🎲', 60, 'casino', 'Na próxima roleta, 70% de chance de cair na sua cor. 20% de chance de ser pego...', { buff: { kind: 'bets', n: 1, mods: { rigged: 1 } } }),
    I('flores', 'Buquê para a Rubi', '💐', 45, 'casino', 'A Rubi fica caidinha: sorte +1 a noite toda e uma caixa misteriosa grátis.', { buff: { kind: 'night', n: 1, mods: { luck: 1 } }, freeBox: 1 }),
    I('cafe', 'Café expresso', '☕', 12, 'day', 'Próximo conserto: +30s na meta de tempo.', { buff: { kind: 'repairs', n: 1, mods: { parTime: 30 } } }),
    I('energetico', 'Energético', '🥫', 18, 'day', '+1 cliente hoje.', { extraCustomer: 1 }),
    I('chiclete', 'Chiclete de menta', '🍬', 8, 'day', 'Negociar +20% hoje.', { buff: { kind: 'day', n: 1, mods: { haggle: .2 } } }),
    I('pao_queijo', 'Pão de queijo', '🧀', 10, 'day', 'Gorjetas +30% hoje.', { buff: { kind: 'day', n: 1, mods: { tipMult: .3 } } }),
    I('superbonder', 'Cola instantânea', '🧴', 20, 'day', 'Próximo conserto: abrir sem aquecer não trinca a tela.', { buff: { kind: 'repairs', n: 1, mods: { noCrack: 1 } } }),
    I('alcool', 'Álcool isopropílico', '🧪', 15, 'day', 'Próximo conserto: oxidação e sujeira se limpam sozinhas.', { buff: { kind: 'repairs', n: 1, mods: { instaClean: 1 } } }),
    I('fita', 'Fita isolante', '⚫', 14, 'day', 'Próximo conserto: o primeiro erro não causa dano.', { buff: { kind: 'repairs', n: 1, mods: { shield: 1 } } }),
    I('bandaid', 'Band-aid de técnico', '🩹', 22, 'repair', 'Use durante um conserto: +20% de integridade.', { heal: 20 }),
    I('parafusadeira_emp', 'Parafusadeira emprestada', '🔩', 25, 'day', 'Próximo conserto: parafusos 4x mais rápidos.', { buff: { kind: 'repairs', n: 1, mods: { screwSpeed: 3 } } }),
    I('pilha', 'Bateria "Duracélula"', '🔋', 18, 'any', '+1 bateria no estoque.', { part: 'battery' }),
    I('tela_gen', 'Tela genérica', '📱', 40, 'any', '+1 tela no estoque.', { part: 'screen' }),
    I('chip_camelo', 'Chip do camelô', '💾', 35, 'any', '+1 chip no estoque.', { part: 'chip' }),
    I('revista', 'Revista "Técnico Hoje"', '📰', 20, 'day', 'Próximo conserto: dica do defeito real.', { buff: { kind: 'repairs', n: 1, mods: { diagHint: 1 } } }),
    I('chocolate', 'Caixa de bombom', '🍫', 15, 'day', 'A gorjeta do próximo cliente vem em dobro.', { buff: { kind: 'repairs', n: 1, mods: { tipMult: 1 } } }),
    I('cartoes', 'Cartões de visita', '📇', 25, 'any', '+0,3 de reputação.', { rep: .3 }),
    I('guarana', 'Guaraná 2 litros', '🥤', 9, 'day', 'Próximos 2 consertos: +15s na meta.', { buff: { kind: 'repairs', n: 2, mods: { parTime: 15 } } }),
    I('incenso', 'Incenso da Luna', '🕯️', 20, 'any', 'Sorte +1 na próxima noite de cassino.', { buff: { kind: 'night', n: 1, mods: { luck: 1 } } }),
    I('figurinha', 'Pacotinho de figurinhas', '✨', 30, 'any', 'Abra e torça: pode vir figurinha rara valendo até R$ 150.', { gamble: [[.45, 0], [.3, 20], [.15, 50], [.08, 90], [.02, 150]] }),
    I('raspinha', 'Raspadinha do mercadinho', '🎟️', 5, 'any', '25% de chance de R$ 15, 5% de R$ 50, 1% de R$ 200.', { gamble: [[.69, 0], [.25, 15], [.05, 50], [.01, 200]] }),
    I('bilhete', 'Bilhete Mega-Sorte', '🎫', 12, 'any', 'Um bilhete surpresinha para o sorteio da noite.', { ticket: 1 }),
    I('marmitex', 'Marmitex', '🍱', 16, 'day', 'Barriga cheia: bônus de rapidez +10% e +10s na meta hoje.', { buff: { kind: 'day', n: 1, mods: { fastBonus: .1, parTime: 10 } } }),
    I('figa', 'Figa de madeira', '🧿', 50, 'passive', 'Amuleto: enquanto estiver na mochila, sorte +0,5.', { passive: { luck: .5 } }),
    I('agua_coco', 'Água de coco', '🥥', 7, 'day', 'Hoje, clientes irritados não tiram reputação.', { buff: { kind: 'day', n: 1, mods: { repLossMult: 1 } } }),
    I('salgadinho', 'Salgadinho', '🍟', 6, 'any', '+15 de XP na hora.', { xp: 15 }),
  ];
  const ITM = Object.fromEntries(ITEMS.map(i => [i.id, i]));

  // ---------- 20 CONQUISTAS -> 20 RELÍQUIAS PERMANENTES ----------
  const ACH = [
    { id: 'first', name: 'Primeiro Conserto', desc: 'Conserte 1 aparelho.', stat: 'repairs', goal: 1, relic: { name: 'Chave de fenda da Tia Neide', emoji: '🪛', desc: 'Clientes pagam +5%.', mods: { payMult: .05 } } },
    { id: 'fairy', name: 'Mãos de Fada', desc: 'Faça 10 consertos perfeitos (100%).', stat: 'perfect', goal: 10, relic: { name: 'Pinça de cristal', emoji: '💎', desc: 'O primeiro erro de cada conserto não causa dano.', mods: { shield: 1 } } },
    { id: 'day7', name: 'Maratonista', desc: 'Chegue ao dia 7.', stat: 'bestDay', goal: 7, relic: { name: 'Cofrinho de porquinho', emoji: '🐷', desc: 'Começa toda partida com +R$ 100.', mods: { startMoney: 100 } } },
    { id: 'day15', name: 'Veterano', desc: 'Chegue ao dia 15.', stat: 'bestDay', goal: 15, relic: { name: 'Contrato de aluguel antigo', emoji: '📃', desc: 'Aluguel 10% mais barato.', mods: { rentMult: .1 } } },
    { id: 'day25', name: 'Lenda do Bairro', desc: 'Chegue ao dia 25.', stat: 'bestDay', goal: 25, relic: { name: 'Placa de honra', emoji: '🏅', desc: '+1 cliente por dia.', mods: { customers: 1 } } },
    { id: 'jackpot', name: 'JACKPOT!', desc: 'Acerte o jackpot da Mega (3 troféus).', stat: 'jackpots', goal: 1, relic: { name: 'Troféu dourado', emoji: '🏆', desc: 'Sorte +1 nos caça-níqueis.', mods: { luck: 1 } } },
    { id: 'allin', name: 'High Roller', desc: 'Ganhe uma aposta ALL IN.', stat: 'allinWins', goal: 1, relic: { name: 'Ficha da Rubi', emoji: '♦️', desc: 'Prêmios do cassino +5%.', mods: { casinoPay: .05 } } },
    { id: 'broke3', name: 'Fênix', desc: 'Vá à falência 3 vezes.', stat: 'bankrupt', goal: 3, relic: { name: 'Segunda chance', emoji: '🔥', desc: '1x por partida, se o dinheiro acabar você recebe R$ 80 e continua.', mods: { secondChance: 1 } } },
    { id: 'shopper', name: 'Freguês da Esquina', desc: 'Compre 20 itens na lojinha.', stat: 'itemsBought', goal: 20, relic: { name: 'Cartão fidelidade da Tati', emoji: '🎀', desc: 'Lojinha 10% mais barata e +1 item à venda.', mods: { storeDiscount: .1, storeSlots: 1 } } },
    { id: 'universal', name: 'Técnico Universal', desc: 'Conserte 15 modelos diferentes.', stat: 'devices', goal: 15, relic: { name: 'Manual universal', emoji: '📘', desc: 'Dica do defeito real em todo conserto.', mods: { diagHint: 1 } } },
    { id: 'rich', name: 'Milionário', desc: 'Junte R$ 10.000 numa partida.', stat: 'maxMoney', goal: 10000, relic: { name: 'Coroa do conserto', emoji: '👑', desc: 'Clientes pagam +10%.', mods: { payMult: .1 } } },
    { id: 'loyal', name: 'Cliente Fiel', desc: 'Atenda o mesmo cliente 5 vezes (numa partida).', stat: 'loyal', goal: 5, relic: { name: 'Agenda de clientes', emoji: '📒', desc: 'Gorjetas +10%.', mods: { tipMult: .1 } } },
    { id: 'lotto', name: 'Sorte Grande', desc: 'Acerte 4+ números na Mega-Sorte.', stat: 'megaHits', goal: 4, relic: { name: 'Bilhete premiado', emoji: '🎫', desc: '1 bilhete grátis toda noite no cassino.', mods: { lottery: 1 } } },
    { id: 'lvl10', name: 'Nível 10', desc: 'Chegue ao nível 10 numa partida.', stat: 'levelMax', goal: 10, relic: { name: 'Diploma emoldurado', emoji: '🎓', desc: '+1 opção nas escolhas de level up.', mods: { levelChoices: 1 } } },
    { id: 'clean', name: 'Sem Arranhões', desc: 'Termine um dia com todos os consertos ≥ 90%.', stat: 'cleanDays', goal: 1, relic: { name: 'Luvas de seda', emoji: '🧤', desc: 'Erros causam 25% menos dano.', mods: { damageMult: .25 } } },
    { id: 'boxes', name: 'Caçador de Caixas', desc: 'Abra 10 caixas misteriosas.', stat: 'boxes', goal: 10, relic: { name: 'Pé de cabra', emoji: '🪝', desc: 'Caixas misteriosas dão prêmios melhores.', mods: { box: 1 } } },
    { id: 'diag', name: 'Olho Clínico', desc: 'Acerte 25 diagnósticos de primeira.', stat: 'firstTry', goal: 25, relic: { name: 'Estetoscópio eletrônico', emoji: '🩺', desc: 'Scanner de diagnóstico sempre ligado.', mods: { scanner: 1 } } },
    { id: 'scratch', name: 'Rei da Raspadinha', desc: 'Ganhe 5 raspadinhas no cassino.', stat: 'scratchWins', goal: 5, relic: { name: 'Unha da sorte', emoji: '💅', desc: 'Prêmios de raspadinha +20%.', mods: { scratch: .2 } } },
    { id: 'haggle', name: 'Negociador', desc: 'Negocie com sucesso 10 vezes.', stat: 'haggles', goal: 10, relic: { name: 'Gravata da sorte', emoji: '👔', desc: 'Negociar +10%.', mods: { haggle: .1 } } },
    { id: 'nights', name: 'Rato de Cassino', desc: 'Vá ao cassino em 10 noites.', stat: 'casinoNights', goal: 10, relic: { name: 'Cartão VIP dourado', emoji: '💳', desc: 'Ganha R$ 30 em fichas toda noite no cassino.', mods: { nightCash: 30 } } },
    { id: 'diplomat', name: 'Diplomata', desc: 'Acalme 10 brigas conversando.', stat: 'fightsWon', goal: 10, relic: { name: 'Megafone da paz', emoji: '🕊️', desc: 'Clientes irritados começam as brigas bem mais calmos.', mods: { calm: 15 } } },
    { id: 'decorator', name: 'Decorador', desc: 'Tenha 8 decorações numa partida.', stat: 'decorOwned', goal: 8, relic: { name: 'Revista de decoração', emoji: '🛋️', desc: 'Catálogo Decora+ 15% mais barato.', mods: { decorDiscount: .15 } } },
    { id: 'survivor', name: 'Sobrevivente', desc: 'Passe por 25 eventos aleatórios.', stat: 'events', goal: 25, relic: { name: 'Amuleto do acaso', emoji: '🧿', desc: 'Eventos bons no jornal ficam 30% mais frequentes.', mods: { goodEvents: .3 } } },
    { id: 'hero', name: 'Pega Ladrão', desc: 'Pegue 2 ladrões no flagra.', stat: 'thieves', goal: 2, relic: { name: 'Taco de beisebol', emoji: '🏏', desc: 'Contas de luz e internet 20% mais baratas (a vizinhança te respeita).', mods: { billsCut: .2 } } },
  ];

  // ---------- MISSÕES DO DIA ----------
  const MISSIONS = [
    { id: 'perfect2', txt: 'Faça 2 consertos perfeitos (100%)', stat: 'perfect', goal: 2 },
    { id: 'earn', txt: 'Fature R$ {X} hoje', stat: 'income', goal: 'X' },
    { id: 'haggle1', txt: 'Negocie com sucesso 1 vez', stat: 'haggles', goal: 1 },
    { id: 'fast2', txt: 'Termine 2 consertos dentro da meta de tempo', stat: 'fast', goal: 2 },
    { id: 'nodmg', txt: 'Termine 2 consertos sem nenhum dano', stat: 'nodmg', goal: 2 },
    { id: 'serve4', txt: 'Conserte 3 aparelhos', stat: 'repairs', goal: 3 },
  ];

  // ---------- meta persistente (entre partidas) ----------
  const KEY = 'rs_meta';
  function loadMeta() { try { const m = JSON.parse(localStorage.getItem(KEY)); if (m && m.stats) return m; } catch (e) { } return { stats: {}, ach: [], seenUpg: [], seenItems: [] }; }
  let meta = loadMeta();
  function saveMeta() { try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) { } }

  const S = () => window.GAME && GAME.state;

  function relicMods() { const out = []; for (const a of ACH) if (meta.ach.includes(a.id)) out.push(a.relic.mods); return out; }

  const META = {
    RAR, UPGRADES, UPG, ITEMS, ITM, ACH, MISSIONS,
    get meta() { return meta; },
    // soma de um modificador: melhorias + relíquias + buffs ativos + amuletos na mochila
    mod(key) {
      const G = S(); let v = 0;
      for (const m of relicMods()) v += m[key] || 0;
      if (!G) return v;
      for (const id of G.upgrades || []) { const u = UPG[id]; if (u && u.mods[key]) v += u.mods[key]; }
      for (const b of G.buffs || []) if (b.mods[key]) v += b.mods[key];
      for (const id in (G.bag || {})) { const it = ITM[id]; if (it && it.passive && G.bag[id] > 0 && it.passive[key]) v += it.passive[key]; }
      if (window.DECOR) v += DECOR.modSum(key);
      if (G.event && G.event.mods && G.event.mods[key]) v += G.event.mods[key];
      return v;
    },
    has(key) { return this.mod(key) > 0; },
    relicsOwned() { return ACH.filter(a => meta.ach.includes(a.id)); },
    // ---- estatísticas vitalícias + conquistas ----
    bump(stat, v = 1, mode = 'add') {
      const s = meta.stats;
      if (mode === 'max') s[stat] = Math.max(s[stat] || 0, v);
      else s[stat] = (s[stat] || 0) + v;
      this.checkAch(); saveMeta();
    },
    addDevice(model) { meta.stats.deviceList = meta.stats.deviceList || []; if (!meta.stats.deviceList.includes(model)) { meta.stats.deviceList.push(model); meta.stats.devices = meta.stats.deviceList.length; this.checkAch(); saveMeta(); } },
    seeUpg(id) { if (!meta.seenUpg.includes(id)) { meta.seenUpg.push(id); saveMeta(); } },
    seeItem(id) { if (!meta.seenItems.includes(id)) { meta.seenItems.push(id); saveMeta(); } },
    checkAch() {
      for (const a of ACH) {
        if (meta.ach.includes(a.id)) continue;
        if ((meta.stats[a.stat] || 0) >= a.goal) {
          meta.ach.push(a.id); saveMeta();
          setTimeout(() => {
            AUDIO.sfx('victory');
            UI.bigText('CONQUISTA!', '#ffe066');
            UI.toast(`🏆 <b>${a.name}</b> desbloqueada!<br>Relíquia permanente: ${a.relic.emoji} <b>${a.relic.name}</b> — ${a.relic.desc}`, 'gold');
          }, 300);
        }
      }
    },
    // ---- sorteio de melhorias ----
    rollUpgrades(n, exclude = []) {
      const G = S();
      const achN = meta.ach.length;
      const pool = UPGRADES.filter(u => !(G.upgrades || []).includes(u.id) && !exclude.includes(u.id) && (!u.needAch || achN >= u.needAch));
      const out = [];
      while (out.length < n && pool.length) {
        const tot = pool.reduce((a, u) => a + RAR[u.rarity].w, 0);
        let r = Math.random() * tot, pickI = 0;
        for (let i = 0; i < pool.length; i++) { r -= RAR[pool[i].rarity].w; if (r <= 0) { pickI = i; break; } }
        out.push(pool.splice(pickI, 1)[0].id);
      }
      out.forEach(id => this.seeUpg(id));
      return out;
    },
    upgradePrice(id, day) { const base = { comum: 110, raro: 230, epico: 420, lendario: 760 }[UPG[id].rarity]; return Math.round(base * (1 + day * .05)); },
    rollStore(n) {
      const pool = ITEMS.slice(); const out = [];
      // o maço de cigarro aparece com frequência (é o carro-chefe da lojinha)
      if (Math.random() < .7) { out.push('cigarro'); pool.splice(pool.findIndex(i => i.id === 'cigarro'), 1); }
      while (out.length < n && pool.length) out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0].id);
      out.forEach(id => this.seeItem(id));
      return out;
    },
    itemPrice(id) { return Math.max(1, Math.round(ITM[id].price * (1 - Math.min(.5, this.mod('storeDiscount'))))); },
    // ---- buffs ----
    addBuff(src, buff) {
      const G = S();
      G.buffs.push({ id: src.id, name: src.name, emoji: src.emoji, kind: buff.kind, n: buff.n, mods: Object.assign({}, buff.mods) });
      renderBuffs();
    },
    tick(kind) { // consome 1 carga dos buffs de um tipo
      const G = S(); if (!G) return;
      for (const b of G.buffs) if (b.kind === kind) b.n--;
      G.buffs = G.buffs.filter(b => b.n > 0);
      renderBuffs();
    },
    clear(kind) { const G = S(); if (!G) return; G.buffs = G.buffs.filter(b => b.kind !== kind); renderBuffs(); },
    consumeMod(key) { // gasta o primeiro buff que tem esse modificador (efeitos de uso único)
      const G = S(); const b = G.buffs.find(x => x.mods[key]);
      if (!b) return false; delete b.mods[key]; if (!Object.keys(b.mods).length) b.n = 0;
      G.buffs = G.buffs.filter(x => x.n > 0); renderBuffs(); return true;
    },
    renderBuffs() { renderBuffs(); },
  };

  function renderBuffs() {
    const el = document.getElementById('hud-buffs'); if (!el) return;
    const G = S(); if (!G) { el.innerHTML = ''; return; }
    const label = { bets: 'apostas', repairs: 'conserto(s)', day: 'hoje', night: 'esta noite' };
    const passives = Object.keys(G.bag || {}).filter(id => ITM[id] && ITM[id].passive && G.bag[id] > 0);
    el.innerHTML = G.buffs.map(b => `<span class="buff" title="${b.name} — ${b.kind === 'bets' || b.kind === 'repairs' ? b.n + ' ' + label[b.kind] : label[b.kind]}">${b.emoji}${b.kind === 'bets' || b.kind === 'repairs' ? `<small>${b.n}</small>` : ''}</span>`).join('')
      + passives.map(id => `<span class="buff passive" title="${ITM[id].name} (amuleto)">${ITM[id].emoji}</span>`).join('')
      + (G.freeSpins ? `<span class="buff" title="Giros grátis">🎰<small>${G.freeSpins}</small></span>` : '');
  }

  window.META = META;
})();
