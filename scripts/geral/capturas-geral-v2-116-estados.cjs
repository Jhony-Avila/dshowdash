// GERAL V2 · 116 · capturas dos ESTADOS para o pacote do mockup (CIMA, 25/11), só com RESPOSTAS REAIS do serviço 69c4ac60 (ACIMA_ESQUERDA).
// Cada cenário = uma pasta de respostas-69c4ac60-116/ (uma mesma gravação): o /painel.php responde com os bytes do arquivo do período pedido.
// Em todos: nenhum R$ em Pedidos/OS nem no gráfico; Recebido "—" + "Aguardando conexão"; fontes sem Asaas; nenhum texto < 12 px.
// Uso: RAIZ=…/respostas-69c4ac60-116 W=2200 H=1470 TEMA=claro|escuro PORTA=8112 node capturas-geral-v2-116-estados.cjs (cwd = saída)
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const path = require('path');
const RAIZ = process.env.RAIZ; const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470); const TEMA = process.env.TEMA === 'escuro' ? 'dark' : 'light'; const NT = process.env.TEMA || 'claro';
const CAP = process.env.CAP || `capturas-${NT}-${W}`; fs.mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x !== '' ? ' · ' + String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 300) : '')); } };
// cenário → período mostrado e o estado esperado do cartão/indicador principal do cenário
const CENARIOS = [
  ['2-zero-real', 'ontem', (c) => c.pedidos.estado === 'zero' && c.ganhos.estado === 'zero', 'Pedidos/OS e ganhos "zero" (zero real confirmado)'],
  ['3-pipedrive-funil-parcial', '7d', (c) => c.funil.estado === 'parcial' && /Soma dos valores informados/.test(c.funil.texto), 'Funil "Dados parciais · Soma dos valores informados"'],
  ['4-bling-desatualizado', '7d', (c) => c.pedidos.estado === 'desatualizado', 'Pedidos/OS "Desatualizado"'],
  ['5-bling-com-problema', '7d', (c) => c.pedidos.estado === 'erro', 'Pedidos/OS "Com problema"'],
  ['6-pipedrive-fora', '7d', (c) => c.ganhos.estado === 'erro' && c.funil.estado === 'erro', 'Ganhos e funil "Com problema"'],
  ['7-nada-lido', '7d', (c) => ['ganhos', 'funil'].every((k) => c[k].estado === 'erro'), 'nada lido: ganhos e funil "Com problema"; prioridades não verificadas'],
];

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const SO = (process.env.SO || '').split(',').filter(Boolean);   // ex.: SO=2-zero-real,3-pipedrive-funil-parcial (só as capturas afetadas)
  for (const [cen, periodo, conferir, rotulo] of CENARIOS.filter((c) => !SO.length || SO.includes(c[0]))) {
    const dir = path.join(RAIZ, cen);
    const ctx = await b.newContext({ colorScheme: TEMA, viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await ctx.route('**/api/geral/v2/**', (rt) => { const u = new URL(rt.request().url()); const f = path.join(dir, `painel-${u.searchParams.get('periodo')}.json`);
      if (u.pathname.endsWith('/painel.php') && fs.existsSync(f)) return rt.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: fs.readFileSync(f) });
      return rt.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"SEM_ARQUIVO_DA_GRAVACAO"}' }); });
    await ctx.addInitScript((p) => { try { sessionStorage.clear(); localStorage.setItem('dshow.geral.v2.periodo', p); } catch {} }, periodo);
    // P0 do parecer: relógio do navegador = referência das respostas do cenário (`leitura_em`)
    const pj = JSON.parse(fs.readFileSync(path.join(dir, `painel-${periodo}.json`))).data; if (pj.leitura_em) await ctx.clock.setFixedTime(new Date(pj.leitura_em));
    const pg = await ctx.newPage();
    try {
      await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
      // o 1º contexto de cada rodada às vezes não monta a Geral (boot do shell): uma 2ª tentativa, nunca mais que isso
      for (let t = 0; t < 2; t++) {
        await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
        await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
        if (await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 40000 }).then(() => true).catch(() => false)) break;
        if (t === 1) throw new Error('a Geral não montou em 2 tentativas');
      }
      if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== TEMA) { await pg.click('[data-dsd-theme-toggle]').catch(() => {}); await pg.waitForTimeout(600); }
      await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(700);
      const c = Object.fromEntries(await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Cartao, { estado: x.dataset.gv2Estado, valor: x.querySelector('.gv2-num-valor')?.textContent.trim() ?? null, texto: x.innerText.replace(/\s+/g, ' ') }])));
      const graf = (await pg.textContent('[data-gv2-bloco="grafico"]')) || ''; const fontes = await pg.$$eval('[data-gv2-fonte]', (xs) => xs.map((x) => x.dataset.gv2Fonte));
      afirma(`${cen}: ${rotulo}`, conferir(c), Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.estado])));
      const refDia = pj.leitura_em ? new Date(pj.leitura_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
      // na linha compacta de "Sem pendências" a tela mostra só "às HH:MM" (= hoje): vale a hora da referência
      const refHora = pj.leitura_em ? new Date(pj.leitura_em).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : null;
      const cabPrio = ((await pg.textContent('[data-gv2-bloco="prioridades"]').catch(() => '')) || '').replace(/\s+/g, ' ');
      const cabRes = ((await pg.textContent('[data-gv2-bloco="resultado"] .gv2-sec-cab').catch(() => '')) || '').replace(/\s+/g, ' ');
      afirma(`${cen}: data na tela = referência (${refDia}) e período "${pj.periodo.rotulo}" (${pj.periodo.de} a ${pj.periodo.ate})`, !!refDia && (cabPrio.includes(refDia) || (/Sem pendências/.test(cabPrio) && cabPrio.includes(`às ${refHora}`))) && cabRes.includes(pj.periodo.rotulo), { refDia, cabRes, cabPrio: cabPrio.slice(0, 120) });
      afirma(`${cen}: nenhum R$ em Pedidos/OS nem no gráfico; Recebido "—" + "Aguardando conexão"`, !/R\$/.test(c.pedidos?.texto || '') && !/R\$/.test(graf) && c.recebido?.valor === '—' && /Aguardando conexão/.test(c.recebido?.texto || ''), { pedidos: c.pedidos?.texto?.slice(0, 80), recebido: c.recebido });
      afirma(`${cen}: fontes = Pipedrive, Bling, Google Calendar, Precifica (sem Asaas)`, JSON.stringify(fontes) === '["pipedrive","bling","calendar","precifica"]', fontes);
      const peq = await pg.evaluate(() => { const out = []; const w = document.createTreeWalker(document.querySelector('.gv2'), NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.bl-so-leitor, title') || !el.getBoundingClientRect().width) continue; if (parseFloat(getComputedStyle(el).fontSize) < 12) out.push(n.textContent.trim().slice(0, 20)); } return out.slice(0, 4); });
      afirma(`${cen}: nenhum texto abaixo de 12 px`, peq.length === 0, peq);
      await pg.mouse.move(1, 1); await pg.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 6000 }).catch(() => {}); await pg.waitForTimeout(300);
      const t = await pg.evaluate(() => document.documentElement.getAttribute('data-theme')); afirma(`${cen}: tema pedido (${TEMA})`, t === TEMA, String(t));
      await pg.screenshot({ path: `${CAP}/geral116-${W}-${NT}-${cen}-topo.png` });
      await pg.$eval('[data-gv2-bloco="fontes"]', (x) => x.scrollIntoView({ block: 'end' })); await pg.waitForTimeout(300);
      await pg.screenshot({ path: `${CAP}/geral116-${W}-${NT}-${cen}-rolada.png` });
    } catch (e) { falhas++; console.log(`ERRO ${cen} ` + (e.message || e).split('\n')[0]); }
    await ctx.close();
  }
  await b.close(); console.log(`GERAL V2 · 116 · ESTADOS × respostas reais (${NT}, ${W}x${H}): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
