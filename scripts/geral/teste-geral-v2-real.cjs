// GERAL V2 · PROVA PONTA A PONTA (CIMA, madrugada 24/11) — a tela contra as respostas CRUAS do serviço real 24e70e69 sobre a T_13,
// gravadas pela ACIMA_DIREITA em app/20261123-integracoes/PORTAO-GERAL-V2/respostas/ (SHA256SUMS conferido). Cada rota responde com
// os BYTES do arquivo (nada é montado aqui). Os valores esperados saem dos próprios arquivos. Uso: W=2200 H=1470 PORTA=8112 node …
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const R = '/srv/dshow-modularizacao/app/20261123-integracoes/PORTAO-GERAL-V2/respostas';
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = process.env.CAP || `capturas-geral-v2-real-${W}`; fs.mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
execFileSync('sha256sum', ['-c', '--quiet', 'SHA256SUMS'], { cwd: R });   // os arquivos são os gravados (ou o teste para aqui)
const bytes = (f) => fs.readFileSync(path.join(R, f));
const dado = (f) => JSON.parse(bytes(f).toString()).data;
const moeda = (v) => (v === null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).replace(/\s/g, ' '));   // espaço não separável → espaço (a página é normalizada igual)
const norm = (t) => (t || '').replace(/\s+/g, ' ');

function rotear(ctx, troca = {}) {
  const usado = [];
  return ctx.route('**/api/geral/v2/**', (r) => {
    const u = new URL(r.request().url()); const rota = u.pathname.replace('/api/geral/v2/', '');
    let f = null;
    if (rota === 'resumo.php') f = `resumo-${u.searchParams.get('periodo')}.json`;
    else if (rota === 'prioridades.php') f = 'prioridades.json';
    else if (rota === 'prioridades/lista.php') f = `lista-${u.searchParams.get('id')}-p${u.searchParams.get('pagina')}.json`;
    else if (rota === 'agenda.php') f = 'agenda.json';
    else if (rota === 'fontes.php') f = 'fontes.json';
    if (f && troca[f]) f = troca[f];
    usado.push(`${rota}${u.search} → ${f}`);
    if (!f || !fs.existsSync(path.join(R, f))) return r.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"NOT_FOUND"}' });
    return r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: bytes(f) });
  }).then(() => usado);
}

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const nova = async (troca) => { const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); const usado = await rotear(ctx, troca);
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); sessionStorage.clear(); } catch {} });
    const pg = await ctx.newPage(); await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(500);
    return { ctx, pg, usado }; };
  const txt = (pg, s) => pg.textContent(s).then(norm).catch(() => '');
  const cap = (pg, n) => pg.screenshot({ path: `${CAP}/geral-v2-real-${W}-${n}.png` });

  // ── NORMAL ──
  { const { ctx, pg } = await nova();
    const pr = dado('prioridades.json').itens; const q = Object.fromEntries(pr.map((p) => [p.id, p.quantidade]));
    const t = await pg.$$eval('.gv2 [data-gv2-prio] strong', (xs) => xs.map((x) => x.textContent));
    afirma(`prioridades com os números REAIS (${q.atividade_vencida} / ${q.sem_proxima_atividade} / ${q.conflito_agenda}), na ordem de gravidade`,
      new RegExp(`^${q.atividade_vencida} negócios abertos com atividade vencida`).test(t[0]) && new RegExp(`^${q.sem_proxima_atividade} negociações sem próxima atividade`).test(t[1]) && new RegExp(`^${q.conflito_agenda} compromisso com horários conflitantes`).test(t[2]), JSON.stringify(t));
    const r7 = dado('resumo-7d.json'); const c = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => x.textContent.replace(/\s+/g, ' ')));
    afirma(`7 dias: Pedidos ${moeda(r7.pedidos_bling.valor)} · ${r7.pedidos_bling.quantidade} pedidos (texto decimal do serviço convertido sem perder centavos)`, c[0].includes(moeda(r7.pedidos_bling.valor)) && c[0].includes(`${r7.pedidos_bling.quantidade} pedidos`), c[0]);
    afirma(`7 dias: sem a nota de canceladas (inclui_canceladas = ${r7.pedidos_bling.inclui_canceladas})`, r7.pedidos_bling.inclui_canceladas || !/canceladas/.test(c[0]));
    afirma(`Ganhos ${moeda(r7.negocios_ganhos.valor)} · ${r7.negocios_ganhos.quantidade} · Funil ${moeda(r7.funil_aberto.valor)} · ${r7.funil_aberto.quantidade} abertos · ${r7.funil_aberto.sem_valor} sem valor`,
      c[1].includes(moeda(r7.negocios_ganhos.valor)) && c[1].includes(`${r7.negocios_ganhos.quantidade} negócios ganhos`) && c[2].includes(moeda(r7.funil_aberto.valor)) && c[2].includes(`${r7.funil_aberto.quantidade} negócios abertos · ${r7.funil_aberto.sem_valor} sem valor`), JSON.stringify(c));
    const g = await txt(pg, '[data-gv2-bloco="grafico"]'); const dias = await pg.$$eval('[data-gv2-dia]', (xs) => xs.length);
    afirma(`gráfico: ${r7.pedidos_bling.por_dia.length} dias e "soma igual ao cartão acima"`, dias === r7.pedidos_bling.por_dia.length && /soma igual ao cartão acima/.test(g), `${dias} · ${g.slice(-110)}`);
    afirma('rótulo do período do serviço', (await txt(pg, '[data-gv2-bloco="resultado"]')).includes(r7.periodo.rotulo));
    const ag = dado('agenda.json'); const ev = await pg.$$eval('.gv2-evento', (xs) => xs.map((x) => x.dataset.gv2Conflito));
    afirma(`agenda: ${ag.itens.length} eventos, ${ag.itens.filter((i) => i.conflito).length} em conflito; url_evento null = sem "Abrir evento"`, ev.length === ag.itens.length && ev.filter((x) => x === '1').length === ag.itens.filter((i) => i.conflito).length && !(await pg.$('.gv2-evento a')), JSON.stringify(ev));
    const fo = await txt(pg, '[data-gv2-bloco="fontes"]');
    afirma('fontes: 3 com horário de atualização, 3 "Aguardando conexão"', (fo.match(/Atualizado /g) || []).length === 3 && (fo.match(/Aguardando conexão/g) || []).length === 3, fo);
    afirma('nenhum NaN/undefined/null na tela', !/NaN|undefined|null/.test(await txt(pg, '.gv2')));
    await cap(pg, '1-lancamento-real');
    for (const per of [['Ontem', 'ontem'], ['Mês até ontem', 'mes']]) {
      const rx = dado(`resumo-${per[1]}.json`); await pg.click(`.gv2-periodo:has-text("${per[0]}")`); await pg.waitForFunction((r) => document.querySelector('[data-gv2-bloco="resultado"]')?.textContent.includes(r), rx.periodo.rotulo, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(400);
      const cc = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Estado, x.textContent.replace(/\s+/g, ' ')]));
      const esp = rx.pedidos_bling.estado === 'zero' ? 'zero' : rx.pedidos_bling.estado;
      afirma(`${per[0]}: Pedidos ${moeda(rx.pedidos_bling.valor)} (estado ${esp}), Ganhos ${moeda(rx.negocios_ganhos.valor)}; gráfico com ${rx.pedidos_bling.por_dia.length} dias e soma conferida`,
        cc[0][0] === esp && cc[0][1].includes(moeda(rx.pedidos_bling.valor)) && cc[1][1].includes(moeda(rx.negocios_ganhos.valor)) && (esp === 'zero' ? !!(await pg.$('[data-gv2-zero]')) : /soma (igual ao cartão acima|dos dias com dado igual ao cartão)/.test(await txt(pg, '[data-gv2-bloco="grafico"]'))), JSON.stringify(cc.map((x) => x[0])));
    }
    await cap(pg, '1b-mes-real');
    await ctx.close(); }

  // ── LISTA: total real = prioridade; 50 + 13 ──
  { const { ctx, pg } = await nova(); const l1 = dado('lista-atividade_vencida-p1.json'), l2 = dado('lista-atividade_vencida-p2.json');
    await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('.gv2-tabela-raiz tbody tr', { timeout: 20000 }); await pg.waitForTimeout(400);
    const n1 = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.length);
    afirma(`lista: página 1 com ${l1.itens.length} linhas; "${l1.total} negócios encontrados" = número da prioridade`, n1 === l1.itens.length && (await txt(pg, '[data-gv2-total]')).includes(`${l1.total} negócios encontrados`) && /= número da prioridade na Geral/.test(await txt(pg, '[data-gv2-conferencia]')), `${n1}`);
    const a = await pg.$eval('.gv2-tabela-raiz tbody tr:first-child a', (x) => ({ h: x.getAttribute('href'), t: x.target }));
    afirma('"Abrir negócio" = a url_pipedrive do serviço, em nova aba', a.h === l1.itens.find((i) => i.url_pipedrive).url_pipedrive && a.t === '_blank', JSON.stringify(a));
    await cap(pg, '2-lista-real');
    await pg.click('.gv2-paginas button:has-text("Próxima")'); await pg.waitForTimeout(900);
    const n2 = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.length);
    afirma(`página 2 com ${l2.itens.length} linhas ("página 2 de ${l2.paginas}")`, n2 === l2.itens.length && (await txt(pg, '[data-gv2-conferencia]')).includes(`página 2 de ${l2.paginas}`), `${n2}`);
    await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(400);
    const l3 = dado('lista-sem_proxima_atividade-p1.json');
    await pg.click('[data-gv2-prio="sem_proxima_atividade"] .gv2-link'); await pg.waitForSelector('.gv2-tabela-raiz tbody tr', { timeout: 20000 }); await pg.waitForTimeout(400);
    afirma(`sem próxima atividade: ${l3.total} linhas = prioridade`, (await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.length)) === l3.itens.length && l3.itens.length === l3.total);
    await ctx.close(); }

  // ── DEGRADADOS (respostas reais do serviço com fonte velha, fora ou sem conta) ──
  { const { ctx, pg } = await nova({ 'resumo-7d.json': 'degradado-bling-desatualizado-resumo-7d.json', 'fontes.json': 'degradado-bling-desatualizado-fontes.json', 'agenda.json': 'degradado-agenda-parcial.json' });
    const d = dado('degradado-bling-desatualizado-resumo-7d.json').pedidos_bling; const nulos = d.por_dia.filter((x) => x.valor === null).length;
    const c0 = await txt(pg, '[data-gv2-cartao="pedidos"]'); const g = await txt(pg, '[data-gv2-bloco="grafico"]');
    afirma('Bling desatualizado: cartão "Desatualizado" + "Último valor válido preservado" (o número fica)', /Desatualizado/.test(c0) && /Último valor válido preservado/.test(c0) && c0.includes(moeda(d.valor)), c0);
    afirma(`gráfico desatualizado: soma dos dias COM dado = cartão e "${nulos} dias sem dado" (dia sem dado nunca vira zero)`, /soma dos dias com dado igual ao cartão/.test(g) && g.includes(`${nulos} dias sem dado`) && (await pg.$$eval('[data-gv2-dia] text', (xs) => xs.filter((t) => t.textContent === 'sem dado').length)) === nulos, g.slice(-160));
    afirma('fonte Bling "Desatualizado" na linha de fontes', /Bling Desatualizado/.test(await txt(pg, '[data-gv2-bloco="fontes"]')));
    afirma('agenda parcial: selo "Dados parciais" + o motivo do serviço', /Dados parciais/.test(await txt(pg, '[data-gv2-bloco="agenda"]')) && (await txt(pg, '[data-gv2-bloco="agenda"]')).includes(dado('degradado-agenda-parcial.json').motivo));
    await cap(pg, '3-degradado-desatualizado-parcial');
    await ctx.close(); }
  { const { ctx, pg } = await nova({ 'resumo-7d.json': 'degradado-bling-indisponivel-resumo-7d.json', 'prioridades.json': 'degradado-pipedrive-aguardando-prioridades.json' });
    const c0 = await txt(pg, '[data-gv2-cartao="pedidos"]');
    afirma('Bling fora: cartão "Com problema" + motivo + Tentar de novo, sem número (nunca R$ 0)', /Com problema/.test(c0) && /Tentar de novo/.test(c0) && !/R\$/.test(c0), c0);
    const pr = await pg.$$eval('.gv2 [data-gv2-prio]', (xs) => xs.map((x) => [x.dataset.gv2Prio, x.querySelector('strong').textContent, !!x.querySelector('.gv2-link')]));
    afirma('Pipedrive sem conta: as 2 prioridades do Pipedrive dizem "Aguardando conexão" (sem número, sem link); o conflito da agenda continua', pr.filter((p) => p[0] !== 'conflito_agenda').every((p) => /^Aguardando conexão/.test(p[1]) && !p[2]) && pr.some((p) => p[0] === 'conflito_agenda' && /^1 compromisso/.test(p[1])), JSON.stringify(pr));
    afirma('nunca "Sem pendências" quando uma fonte não respondeu', !/Sem pendências/.test(await txt(pg, '[data-gv2-bloco="prioridades"]')));
    await cap(pg, '4-degradado-fora-aguardando');
    await ctx.close(); }

  console.log(`GERAL V2 · PONTA A PONTA com as respostas REAIS (${W}x${H}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, (e.stack || '').split('\n')[1]); process.exit(2); });
