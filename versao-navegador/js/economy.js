// ECONOMIA — balanceamento do dinheiro.
// Aluguel com curva calibrada (simulação: começo apertado, meio confortável, fim de jogo exigente),
// contas de luz/internet, imposto progressivo sobre o faturamento, índice de preços das peças que
// oscila todo dia, e o Banco do Bairro (poupança protegida, empréstimo parcelado e o agiota).
(function () {
  const $ = s => document.querySelector(s);
  const G = () => GAME.state;
  const mod = k => META.mod(k);
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const money = v => UI.money(v);

  const ECON = {
    // ---------- custos ----------
    rent(day) {
      const d = Math.max(0, day - 1);
      return Math.round((55 + 25 * d + 2 * d * d + 0.035 * d * d * d) * (1 - Math.min(.6, mod('rentMult'))));
    },
    bills(day) {
      const g = G(); const el = window.DECOR ? DECOR.electricCount() : 0; const pets = window.DECOR ? DECOR.petCount() : 0;
      return Math.round((12 + 2 * day + 6 * el + 5 * pets) * (1 - Math.min(.5, mod('billsCut'))));
    },
    // imposto progressivo sobre o faturamento de consertos (sem gorjeta)
    tax(gross) {
      const t = Math.min(gross, 1000) * .06 + Math.max(0, Math.min(gross, 3000) - 1000) * .10 + Math.max(0, gross - 3000) * .14;
      return Math.round(t * (1 - Math.min(.8, mod('taxCut'))));
    },
    // ---------- índice de preços das peças (passeio aleatório com volta à média) ----------
    rollMarket() {
      const g = G(); let m = g.market || 1;
      const shock = (Math.random() + Math.random() + Math.random() - 1.5) * .14;
      m = m + (1 - m) * .25 + shock + (g.event && g.event.partsMult ? 0 : 0);
      g.market = Math.max(.7, Math.min(1.45, +m.toFixed(2)));
      g.marketHist = (g.marketHist || []).concat(g.market).slice(-7);
      return g.market;
    },
    marketTxt() {
      const m = G().market || 1, h = G().marketHist || [];
      const prev = h.length > 1 ? h[h.length - 2] : 1;
      const arrow = m > prev + .02 ? '📈' : m < prev - .02 ? '📉' : '➡️';
      return `${arrow} Índice das peças: <b style="color:${m > 1.1 ? '#c1121f' : m < .92 ? '#1b7a3a' : 'inherit'}">${Math.round(m * 100)}%</b>`;
    },
    partMult() { return (G().market || 1) * (1 + G().day * .01); },
    // sorte com retorno decrescente (evita cassino virar máquina de dinheiro com muitos bônus)
    luckEff(raw) { return raw <= 0 ? raw : raw / (1 + raw / 6); },

    // ---------- banco ----------
    bank() { const g = G(); if (!g.bank) g.bank = { savings: 0, loan: null, agiota: null, dirty: 0, metAgiota: false }; return g.bank; },
    loanLimit() { const g = G(); return r5(150 + 45 * g.day + 80 * g.rep); },
    // resgate automático da poupança quando o caixa zera (taxa de 10%)
    rescue(reason) {
      const g = G(); const b = ECON.bank();
      if (g.money > 0 || b.savings <= 0) return false;
      const need = Math.min(b.savings, Math.max(60, -g.money + 60));
      const fee = Math.round(need * .1);
      b.savings -= need; GAME.addMoney(need - fee, true);
      UI.toast(`🏦 <b>Débito automático:</b> saquei ${money(need)} da poupança (taxa de ${money(fee)}) pra você não falir!`, 'gold');
      AUDIO.sfx('cash');
      return g.money > 0;
    },
    // fechamento do dia: rendimentos, parcelas e juros
    closeDay(log) {
      const g = G(), b = ECON.bank(); const out = [];
      if (b.savings > 0) { const y = Math.min(250, Math.round(b.savings * .01)); b.savings += y; out.push(['Rendimento da poupança 🐷', y]); }
      if (b.loan) {
        const inst = Math.min(b.loan.left, b.loan.per);
        if (g.money - inst > 0) { GAME.addMoney(-inst, true); b.loan.left -= inst; out.push([`Parcela do empréstimo (${b.loan.paid + 1}/${b.loan.n})`, -inst]); b.loan.paid++; log.loan = (log.loan || 0) + inst; }
        else { const pen = Math.round(inst * .15); b.loan.left += pen; b.loan.late++; GAME.state.rep = Math.max(0, GAME.state.rep - .2); out.push([`Parcela ATRASADA (+${money(pen)} de multa, −0,2★)`, 0]); if (b.loan.late >= 2) b.dirty = 1; }
        if (b.loan.left <= 0) { out.push(['Empréstimo quitado! 🎉', 0]); META.bump('loansPaid'); b.loan = null; }
      }
      if (b.agiota) {
        b.agiota.debt = Math.round(b.agiota.debt * 1.08);
        if (g.day + 1 >= b.agiota.due) out.push([`⚠️ O Jorjão vem cobrar ${money(b.agiota.debt)} amanhã!`, 0]);
      }
      return out;
    },

    // ---------- tela do banco ----------
    openBank(onClose) {
      const g = G(), b = ECON.bank();
      AUDIO.sfx('open');
      const render = () => {
        const lim = ECON.loanLimit();
        const agMax = r5(400 + g.day * 120);
        const s = UI.screen(`<div class="card bank-card" style="max-width:1000px;width:94vw">
          <h2>🏦 Banco do Bairro</h2>
          <p style="font-size:14px">Caixa: <b>${money(g.money)}</b> · Poupança: <b style="color:#1b7a3a">${money(b.savings)}</b>${b.dirty ? ' · <b style="color:#c1121f">NOME SUJO (sem crédito)</b>' : ''}</p>
          <div class="bank-cols">
            <div class="bank-col">
              <div class="bank-ico">🐷</div><h3>Poupança</h3>
              <p>Rende <b>1% ao dia</b> (máx. R$ 250). Ladrões, multas e o cassino não alcançam esse dinheiro. Se o caixa zerar, o banco saca sozinho (taxa de 10%) pra você não falir.</p>
              <div class="bank-row">
                <button class="btn green" data-dep=".25" ${g.money < 20 ? 'disabled' : ''}>Depositar 25%</button>
                <button class="btn green" data-dep=".5" ${g.money < 20 ? 'disabled' : ''}>50%</button>
                <button class="btn green" data-dep="all" ${g.money <= 60 ? 'disabled' : ''}>Tudo − R$ 50</button>
              </div>
              <div class="bank-row">
                <button class="btn" data-wd=".5" ${b.savings <= 0 ? 'disabled' : ''}>Sacar 50%</button>
                <button class="btn" data-wd="1" ${b.savings <= 0 ? 'disabled' : ''}>Sacar tudo</button>
              </div>
            </div>
            <div class="bank-col">
              <div class="bank-ico">📄</div><h3>Empréstimo</h3>
              ${b.loan ? `<p>Você deve <b>${money(b.loan.left)}</b> — parcelas de ${money(b.loan.per)} no fim de cada dia (${b.loan.paid}/${b.loan.n} pagas).</p>
                <button class="btn gold" id="bk-payoff" ${g.money <= b.loan.left ? 'disabled' : ''}>Quitar agora (${money(Math.round(b.loan.left * .95))}, 5% off)</button>`
            : b.dirty ? '<p>Seu nome está sujo por atrasar parcelas. O gerente não quer nem te ver.</p>'
              : `<p>Limite de hoje: <b>${money(lim)}</b> (sobe com o dia e a reputação). Paga <b>30% de juros</b> em 5 parcelas automáticas. Atrasar = multa e −reputação.</p>
                <div class="bank-row">${[.25, .5, 1].map(f => `<button class="btn purple" data-loan="${r5(lim * f)}">Pegar ${money(r5(lim * f))}</button>`).join('')}</div>`}
            </div>
            <div class="bank-col agiota">
              <div class="bank-ico">🕶️</div><h3>Seu Jorjão</h3>
              ${!b.metAgiota ? '<p>Ninguém sabe onde ele fica. Dizem que <i>ele</i> é quem te encontra...</p>'
            : b.agiota ? `<p>Você deve <b style="color:#c1121f">${money(b.agiota.debt)}</b> ao Jorjão. Prazo: dia ${b.agiota.due}. A dívida cresce 8% por dia.</p>
                <button class="btn red" id="bk-agpay" ${g.money <= b.agiota.debt ? 'disabled' : ''}>Pagar tudo (${money(b.agiota.debt)})</button>`
              : `<p>Dinheiro na hora, sem perguntas e sem limite de crédito... até ${money(agMax)}. Devolve <b>50% a mais em 3 dias</b>. Atrasou? Os "sobrinhos" dele fazem uma visita.</p>
                <div class="bank-row">${[.3, .6, 1].map(f => `<button class="btn red" data-ag="${r5(agMax * f)}">Pegar ${money(r5(agMax * f))}</button>`).join('')}</div>`}
            </div>
          </div>
          <button class="btn big" id="bk-close">Sair do banco</button></div>`, 'dim');
        s.querySelectorAll('[data-dep]').forEach(el => el.onclick = () => {
          const f = el.dataset.dep; const v = f === 'all' ? g.money - 50 : Math.round(g.money * +f);
          if (v <= 0 || g.money - v <= 0) return;
          GAME.addMoney(-v, true); b.savings += v; AUDIO.sfx('cash'); META.bump('saved', v); render();
        });
        s.querySelectorAll('[data-wd]').forEach(el => el.onclick = () => {
          const v = Math.round(b.savings * +el.dataset.wd); if (v <= 0) return;
          b.savings -= v; GAME.addMoney(v, true); AUDIO.sfx('cash'); render();
        });
        s.querySelectorAll('[data-loan]').forEach(el => el.onclick = () => {
          const v = +el.dataset.loan; const total = Math.round(v * 1.3);
          b.loan = { left: total, per: Math.ceil(total / 5), n: 5, paid: 0, late: 0 };
          GAME.addMoney(v, true); AUDIO.sfx('cash'); UI.toast(`📄 Empréstimo de ${money(v)} aprovado! 5 parcelas de ${money(b.loan.per)}.`, 'good'); render();
        });
        const po = s.querySelector('#bk-payoff'); if (po) po.onclick = () => { const v = Math.round(b.loan.left * .95); if (g.money <= v) return; GAME.addMoney(-v, true); b.loan = null; META.bump('loansPaid'); AUDIO.sfx('victory'); UI.toast('Empréstimo quitado! 🎉', 'gold'); render(); };
        s.querySelectorAll('[data-ag]').forEach(el => el.onclick = () => {
          const v = +el.dataset.ag;
          b.agiota = { debt: Math.round(v * 1.5), due: g.day + 3, took: v };
          GAME.addMoney(v, true); AUDIO.sfx('coin'); UI.glitch();
          UI.toast(`🕶️ O Jorjão contou ${money(v)} em notas de 50. "Dia ${b.agiota.due}, chapa. Nem um dia a mais."`, 'bad'); render();
        });
        const ap = s.querySelector('#bk-agpay'); if (ap) ap.onclick = () => { if (g.money <= b.agiota.debt) return; GAME.addMoney(-b.agiota.debt, true); b.agiota = null; META.bump('agiotaPaid'); AUDIO.sfx('cash'); UI.toast('🕶️ Dívida com o Jorjão quitada. Ufa.', 'good'); render(); };
        s.querySelector('#bk-close').onclick = () => { AUDIO.sfx('close'); UI.closeScreen(); GAME.refreshHUD(); onClose && onClose(); };
        GAME.refreshHUD();
      };
      render();
    },
  };
  window.ECON = ECON;
})();
