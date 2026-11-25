// GERAL V2 · ciclo 116 · decisão de negócio de 25/11 (CIMA). A tela serve o /painel.php com os BYTES de um arquivo (RESP=<arquivo painel-7d>).
// Aceite: 4 indicadores (Negócios ganhos = QUANTIDADE · Funil = R$ potencial, fotografia · Pedidos/OS = QUANTIDADE, sem R$ · Recebido =
// "— · Aguardando conexão", Precifica, nunca Asaas); gráfico de Pedidos/OS em CONTAGEM diária (soma = cartão); P0 do briefing §7.
// Uso: RESP=…/painel-7d.json CONTRATO=novo|antigo W=2200 H=1470 TEMA=claro|escuro PORTA=8112 node teste-geral-v2-116.cjs (cwd = saída)
//   CONTRATO=antigo: resposta do 674fa53e (ainda com `valor` nos pedidos, sem `recebido`) — prova que a tela não mostra R$ nem assim.
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs');
const RESP = process.env.RESP; const NOVO = process.env.CONTRATO !== 'antigo';
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const TEMA = process.env.TEMA === 'escuro' ? 'dark' : 'light'; const NT = process.env.TEMA || 'claro';
const CAP = process.env.CAP || `capturas-${NT}-${W}`; fs.mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x !== '' ? ' · ' + String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 320) : '')); } };
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
const massa = JSON.parse(fs.readFileSync(RESP)).data; const r = massa.resumo;

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ colorScheme: TEMA, viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await ctx.route('**/api/geral/v2/**', (rt) => { const u = new URL(rt.request().url());
    if (u.pathname.endsWith('/painel.php') && u.searchParams.get('periodo') === '7d') return rt.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: fs.readFileSync(RESP) });
    return rt.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"SEM_ARQUIVO"}' }); });
  await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); sessionStorage.clear(); } catch {} });
  const pg = await ctx.newPage();
  const cap = async (nome, sel) => { await pg.mouse.move(1, 1); await pg.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 6000 }).catch(() => {});
    if (sel) await pg.$eval(sel, (x) => x.scrollIntoView({ block: 'end' })).catch(() => {}); await pg.waitForTimeout(300);
    const t = await pg.evaluate(() => document.documentElement.getAttribute('data-theme')); afirma(`captura ${nome} no tema pedido (${TEMA})`, t === TEMA, String(t));
    await pg.screenshot({ path: `${CAP}/geral116-${W}-${NT}-${nome}.png` }); };
  try {
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== TEMA) { await pg.click('[data-dsd-theme-toggle]').catch(() => {}); await pg.waitForTimeout(600); }
    await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(700);

    const c = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => ({ id: x.dataset.gv2Cartao, estado: x.dataset.gv2Estado, marcador: x.querySelector('[data-gv2-marcador]')?.textContent.trim() ?? null,
      valor: x.querySelector('.gv2-num-valor')?.textContent.trim() ?? null, texto: x.innerText.replace(/\s+/g, ' '), dica: x.getAttribute('title') || '',
      rodape: [...x.querySelectorAll('.gv2-num-rodape .gv2-fraco')].map((e) => ({ t: e.textContent.trim(), inteiro: e.scrollWidth <= e.clientWidth + 1 })), alt: Math.round(x.getBoundingClientRect().height), top: Math.round(x.getBoundingClientRect().top),
      cortado: [...x.querySelectorAll('.gv2-h3, [data-gv2-marcador], .gv2-num-valor, .gv2-num-rodape .gv2-fraco')].some((e) => e.scrollWidth > e.clientWidth + 1),
      tituloUmaLinha: (() => { const h = x.querySelector('.gv2-h3'); return !!h && h.getClientRects().length === 1 && h.getBoundingClientRect().height < parseFloat(getComputedStyle(h).fontSize) * 1.9; })() })));
    const porId = Object.fromEntries(c.map((x) => [x.id, x]));
    afirma('4 cartões, nesta ordem: Negócios ganhos · Funil aberto agora · Pedidos / OS lançados · Recebido no período', JSON.stringify(c.map((x) => x.id)) === '["ganhos","funil","pedidos","recebido"]', c.map((x) => x.id));
    afirma('marcadores: Comercial · Pipedrive (2×), Operação · Bling, Financeiro · Precifica', JSON.stringify(c.map((x) => x.marcador)) === JSON.stringify(['Comercial · Pipedrive', 'Comercial · Pipedrive', 'Operação · Bling', 'Financeiro · Precifica']), c.map((x) => x.marcador));
    // P0 1 · nenhum R$ no indicador Bling nem no gráfico (mesmo com o contrato ANTIGO, que ainda manda `valor`)
    const graf = norm(await pg.textContent('[data-gv2-bloco="grafico"]')); const grafAria = await pg.$eval('[data-gv2-bloco="grafico"] svg', (x) => x.getAttribute('aria-label')).catch(() => '');
    afirma(`P0 1 · Pedidos/OS: número = QUANTIDADE (${r.pedidos_bling.quantidade}), sem "R$" no cartão`, porId.pedidos?.valor === String(r.pedidos_bling.quantidade) && !/R\$/.test(porId.pedidos?.texto || ''), porId.pedidos);
    afirma('P0 1 · gráfico Pedidos/OS sem "R$" (texto, eixo, dica e rótulo acessível)', !/R\$/.test(graf) && !/R\$/.test(grafAria || '') && /Pedidos \/ OS no período/.test(graf), graf.slice(0, 200));
    const somaDias = (r.pedidos_bling.por_dia || []).reduce((s, d) => s + (d.quantidade ?? 0), 0);
    const barras = await pg.$$eval('[data-gv2-bloco="grafico"] [data-gv2-dia]', (xs) => xs.length);
    afirma(`gráfico em CONTAGEM: ${barras} dias, "Total: ${r.pedidos_bling.quantidade} pedidos/OS · soma igual ao cartão acima" (soma dos dias = ${somaDias})`,
      barras === r.pedidos_bling.por_dia.length && somaDias === r.pedidos_bling.quantidade && new RegExp(`Total: ${r.pedidos_bling.quantidade} pedidos?/OS · soma igual ao cartão acima`).test(graf), graf.slice(-160));
    if (NOVO) afirma('decisão 2 · pedidos sem canal NÃO deixam Pedidos/OS "Dados parciais"', !(r.pedidos_bling.lacunas || []).includes('sem_canal') && porId.pedidos?.estado === 'ok' && !/Dados parciais/.test(porId.pedidos?.texto || ''), porId.pedidos);
    else afirma('decisão 2 (contrato antigo, lacuna só "sem_canal") · a tela já não marca Pedidos/OS parcial', porId.pedidos?.estado === 'ok' && !/Dados parciais/.test(porId.pedidos?.texto || ''), porId.pedidos);
    // Negócios ganhos = quantidade; valor faltando não deixa a contagem parcial
    afirma(`Negócios ganhos: número = QUANTIDADE (${r.negocios_ganhos.quantidade}), sem R$; "Fechados no período"; valor faltando não marca parcial`,
      porId.ganhos?.valor === String(r.negocios_ganhos.quantidade) && !/R\$/.test(porId.ganhos?.valor || '') && /Fechados no período/.test(porId.ganhos?.texto || '') && porId.ganhos?.estado === 'ok', porId.ganhos);
    // Funil = R$ potencial, fotografia (P0 5)
    afirma('P0 5 · Funil aberto agora: R$ potencial + "Fotografia de …" (texto neutro) + dica "não filtra pelo período"', /^R\$/.test(porId.funil?.valor || '') && /Fotografia de/.test(porId.funil?.texto || '') && /não filtra pelo período/.test(porId.funil?.dica || ''), porId.funil);
    // P0 2/3a · Recebido = "— · Aguardando conexão", Precifica, nunca número, nunca R$ 0, nunca Asaas
    afirma('P0 2 · Recebido no período: "—" + "Aguardando conexão" + "Precifica · recebido"; nunca número, "R$ 0" ou "Asaas"', porId.recebido?.valor === '—' && porId.recebido?.estado === 'aguardando'
      && /Aguardando conexão/.test(porId.recebido?.texto || '') && /Precifica · recebido/.test(porId.recebido?.texto || '') && !/\d/.test(porId.recebido?.valor || '') && !/Asaas/.test(porId.recebido?.texto || ''), porId.recebido);
    const fontes = await pg.$$eval('[data-gv2-fonte]', (xs) => xs.map((x) => ({ id: x.dataset.gv2Fonte, t: x.textContent.replace(/\s+/g, ' ').trim() })));
    if (NOVO) {
      afirma('fontes: Pipedrive, Bling, Google Calendar, Precifica (o Asaas sai da linha da Geral no 116)', JSON.stringify(fontes.map((f) => f.id)) === '["pipedrive","bling","calendar","precifica"]', fontes.map((f) => f.id));
      afirma('fontes: "Precifica Aguardando conexão (recebimentos)"', /Precifica\s*Aguardando conexão \(recebimentos\)/.test(fontes.find((f) => f.id === 'precifica')?.t || ''), fontes);
    }
    // P1 · 1440/2200: 4 cartões alinhados, mesma altura, nada cortado; gráfico e agenda começam na primeira dobra
    const tops = new Set(c.map((x) => x.top)), alts = c.map((x) => x.alt);
    const dobra = await pg.evaluate(() => ({ g: Math.round(document.querySelector('[data-gv2-bloco="grafico"]').getBoundingClientRect().top), a: Math.round(document.querySelector('[data-gv2-bloco="agenda"]').getBoundingClientRect().top), h: innerHeight }));
    afirma(`P1 · ${W}: 4 cartões na MESMA linha e com a mesma altura; título, marcador, número e rodapé inteiros (sem reticências)`, tops.size === 1 && Math.max(...alts) - Math.min(...alts) <= 1 && c.every((x) => !x.cortado), { tops: [...tops], alts, cortados: c.filter((x) => x.cortado).map((x) => x.id) });
    afirma(`P1 · ${W}: títulos dos 4 cartões numa linha só`, c.every((x) => x.tituloUmaLinha), c.filter((x) => !x.tituloUmaLinha).map((x) => x.id));
    afirma(`P1 · ${W}: gráfico e agenda começam na primeira dobra`, dobra.g < dobra.h - 40 && dobra.a < dobra.h - 40, dobra);
    const peq = await pg.evaluate(() => { const out = []; const w = document.createTreeWalker(document.querySelector('.gv2'), NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.bl-so-leitor, title')) continue; if (!el.getBoundingClientRect().width) continue;
        if (parseFloat(getComputedStyle(el).fontSize) < 12) out.push(n.textContent.trim().slice(0, 24)); } return [...new Set(out)].slice(0, 6); });
    afirma('nenhum texto abaixo de 12 px na Geral V2', peq.length === 0, peq);
    await cap('topo'); await cap('rolada', '[data-gv2-bloco="fontes"]');
  } catch (e) { falhas++; console.log('ERRO ' + (e.message || e).split('\n')[0]); }
  await b.close(); console.log(`GERAL V2 · 116 (${NOVO ? 'contrato novo' : 'contrato antigo'}, ${NT}, ${W}x${H}): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
