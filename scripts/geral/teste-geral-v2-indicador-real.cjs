// GERAL V2 · PROVA PONTA A PONTA DO ESTADO POR INDICADOR (CIMA, 24/11) — a tela contra as respostas CRUAS do serviço 2a035013
// (ACIMA_ESQUERDA) sobre a T_13: app/20261124-geral-v2-indicador/respostas-2a035013/ (SHA256SUMS conferido). Cada rota responde com
// os BYTES do arquivo; o esperado sai dos próprios arquivos. Uso: CENARIO=1|2 W=2200 H=1470 PORTA=8112 node …
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const RAIZ = '/srv/dshow-modularizacao/app/20261124-geral-v2-indicador';
const CEN = process.env.CENARIO === '2' ? 'cenario-2-degradado' : 'cenario-1-normal';
const R = path.join(RAIZ, 'respostas-2a035013', CEN);
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = process.env.CAP || `capturas-indicador-${CEN}-${W}`; fs.mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
execFileSync('sha256sum', ['-c', '--quiet', 'SHA256SUMS'], { cwd: RAIZ });   // os arquivos são os gravados (ou o teste para aqui)
const bytes = (f) => fs.readFileSync(path.join(R, f));
const dado = (f) => JSON.parse(bytes(f).toString()).data;
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
const moeda = (v) => (v === null ? '—' : norm(Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })));
const SELO = { zero: 'Zero real', desatualizado: 'Desatualizado', parcial: 'Dados parciais', aguardando: 'Aguardando conexão', erro: 'Com problema' };

function rotear(ctx, troca = {}) {
  return ctx.route('**/api/geral/v2/**', (r) => {
    const u = new URL(r.request().url()); const rota = u.pathname.replace('/api/geral/v2/', '');
    let f = null;
    if (rota === 'resumo.php') f = `resumo-${u.searchParams.get('periodo')}.json`;
    else if (rota === 'prioridades.php') f = 'prioridades.json';
    else if (rota === 'prioridades/lista.php') f = `lista-${u.searchParams.get('id')}-p${u.searchParams.get('pagina')}.json`;
    else if (rota === 'agenda.php') f = 'agenda.json';
    else if (rota === 'fontes.php') f = 'fontes.json';
    if (f && troca[f]) f = troca[f];
    if (!f || !fs.existsSync(path.join(R, f))) return r.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"NOT_FOUND"}' });
    return r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: bytes(f) });
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const abrir = async (troca = {}) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H } }); await rotear(ctx, troca);
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); } catch {} });
    const pg = await ctx.newPage(); await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(500);
    return { ctx, pg };
  };
  const cartoes = (pg) => pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => Object.fromEntries(xs.map((x) => [x.dataset.gv2Cartao, {
    estado: x.dataset.gv2Estado, selo: x.querySelector('.gv2-selo')?.textContent || '', valor: (x.querySelector('.gv2-num-valor')?.textContent || '').replace(/\s+/g, ' ').trim(),
    linha: (x.querySelector('.gv2-num-linha')?.textContent || '').replace(/\s+/g, ' ').trim() }])));
  const conferir = (rotulo, c, ind) => {
    const zeroNc = ind.quantidade === 0 && ind.estado !== 'zero';
    afirma(`${rotulo}: estado da tela = estado do serviço ("${ind.estado}")`, c.estado === ind.estado, JSON.stringify(c));
    if (SELO[ind.estado]) afirma(`${rotulo}: selo "${SELO[ind.estado]}" escrito`, c.selo === SELO[ind.estado], c.selo);
    const esperado = zeroNc ? '—' : moeda(ind.valor);
    afirma(`${rotulo}: valor ${esperado}${zeroNc ? ' (0 não confirmado nunca aparece como R$ 0)' : ''}`, c.valor === esperado, c.valor);
    if (ind.estado === 'parcial' && (ind.lacunas || []).includes('sem_valor') && ind.sem_valor > 0) {
      const txt = `${ind.valor === null ? 'Nenhum valor informado' : 'Soma dos valores informados'} · ${ind.sem_valor} ${ind.sem_valor === 1 ? 'negócio' : 'negócios'} sem valor`;
      afirma(`${rotulo}: "${txt}"`, c.linha.includes(txt), c.linha);
    } else if (ind.estado === 'parcial' && ind.motivo) {
      afirma(`${rotulo}: motivo do serviço escrito ("${ind.motivo}")`, c.linha.includes(ind.motivo), c.linha);
    }
    if (ind.estado !== 'zero') afirma(`${rotulo}: nunca "R$ 0" fora do "Zero real"`, !/^R\$\s?0$/.test(c.valor), c.valor);
  };

  // ── 1. página nos períodos 7d e ontem: cartões, fontes, prioridades ──
  { const { ctx, pg } = await abrir();
    for (const per of ['7d', 'ontem']) {
      if (per === 'ontem') { await pg.click('.gv2-periodo:has-text("Ontem")'); await pg.waitForFunction(() => /ontem/.test(document.querySelector('[data-gv2-bloco="resultado"]')?.textContent || ''), null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(600); }
      const r = dado(`resumo-${per}.json`); const c = await cartoes(pg);
      conferir(`${per} · Pedidos`, c.pedidos, r.pedidos_bling); conferir(`${per} · Ganhos`, c.ganhos, r.negocios_ganhos); conferir(`${per} · Funil`, c.funil, r.funil_aberto);
      await pg.screenshot({ path: `${CAP}/geral-${W}-${CEN}-${per}.png` });
    }
    const fs_ = dado('fontes.json');
    const tela = await pg.$$eval('[data-gv2-fonte]', (xs) => Object.fromEntries(xs.map((x) => [x.dataset.gv2Fonte, [x.dataset.gv2FonteEstado, x.textContent.replace(/\s+/g, ' ').trim()]])));
    for (const f of fs_) {
      afirma(`fonte ${f.fonte}: estado da linha = serviço ("${f.estado}")`, tela[f.fonte]?.[0] === f.estado, JSON.stringify(tela[f.fonte]));
      if (f.estado !== 'conectada') afirma(`fonte ${f.fonte}: não diz "Atualizado" estando "${f.estado}"`, !/^\S+( \S+)? Atualizado/.test(tela[f.fonte]?.[1] || ''), tela[f.fonte]?.[1]);
    }
    afirma('linha de fontes com "Google Calendar" por extenso', /Google Calendar/.test(Object.values(tela).map((x) => x[1]).join(' ')));
    const pr = dado('prioridades.json');
    for (const p of pr.itens.filter((x) => x.estado === 'desatualizado')) {
      const t = await pg.textContent(`[data-gv2-prio="${p.id}"]`).catch(() => '');
      afirma(`prioridade ${p.id} desatualizada no serviço → "Desatualizado" escrito na linha`, /Desatualizado/.test(t), t);
    }
    // ── 2. lista: mesmo critério e mesmo número ──
    const av = pr.itens.find((x) => x.id === 'atividade_vencida'); const l1 = dado('lista-atividade_vencida-p1.json');
    if (av && av.quantidade > 0) {
      await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] tbody tr', { timeout: 20000 }); await pg.waitForTimeout(600);
      const tot = norm(await pg.textContent('[data-gv2-total]')); const rod = norm(await pg.textContent('[data-gv2-conferencia]')); const crit = norm(await pg.textContent('.gv2-filtros .gv2-chip--info'));
      afirma(`lista "atividade vencida": ${l1.total} negócios = número da Geral (${av.quantidade}) = total_sem_filtro (${l1.total_sem_filtro})`, l1.total === av.quantidade && l1.total_sem_filtro === av.quantidade && tot.includes(`${l1.total} negócios encontrados`) && /= número da prioridade na Geral/.test(rod), `${tot} · ${rod}`);
      afirma('lista: o critério exato do serviço aparece na tela', crit === norm(l1.criterios.texto), crit);
      afirma('lista: 50 por página e a página 2 existe com o restante', (await pg.$$('.gv2-tabela-raiz tbody tr')).length === Math.min(50, l1.total) && (l1.total <= 50 || /página 1 de 2/.test(rod)), rod);
      await pg.screenshot({ path: `${CAP}/geral-${W}-${CEN}-lista.png` });
    }
    await ctx.close(); }

  // ── 3. degradados gravados (cenário 1): Bling desatualizado / indisponível, agenda parcial, Pipedrive aguardando ──
  if (CEN === 'cenario-1-normal') {
    { const { ctx, pg } = await abrir({ 'resumo-7d.json': 'degradado-bling-desatualizado-resumo-7d.json', 'fontes.json': 'degradado-bling-desatualizado-fontes.json' });
      const r = dado('degradado-bling-desatualizado-resumo-7d.json'); const c = await cartoes(pg);
      conferir('Bling desatualizado · Pedidos', c.pedidos, r.pedidos_bling);
      const fb = await pg.$eval('[data-gv2-fonte="bling"]', (x) => [x.dataset.gv2FonteEstado, x.textContent]);
      afirma('Bling desatualizado: a linha de fontes concorda com o cartão', fb[0] === dado('degradado-bling-desatualizado-fontes.json').find((x) => x.fonte === 'bling').estado, JSON.stringify(fb));
      await pg.screenshot({ path: `${CAP}/geral-${W}-${CEN}-bling-desatualizado.png` }); await ctx.close(); }
    { const { ctx, pg } = await abrir({ 'resumo-7d.json': 'degradado-bling-indisponivel-resumo-7d.json' });
      const r = dado('degradado-bling-indisponivel-resumo-7d.json'); const c = await cartoes(pg);
      afirma(`Bling indisponível: cartão de Pedidos no estado do serviço ("${r.pedidos_bling.estado}"), sem R$`, c.pedidos.estado === r.pedidos_bling.estado && !/R\$/.test(c.pedidos.valor), JSON.stringify(c.pedidos));
      await ctx.close(); }
    { const { ctx, pg } = await abrir({ 'agenda.json': 'degradado-agenda-parcial.json' });
      const t = norm(await pg.textContent('[data-gv2-bloco="agenda"]'));
      afirma('agenda parcial: "Dados parciais" escrito no bloco', /Dados parciais/.test(t), t.slice(0, 200)); await ctx.close(); }
    { const { ctx, pg } = await abrir({ 'prioridades.json': 'degradado-pipedrive-aguardando-prioridades.json' });
      const t = norm(await pg.textContent('[data-gv2-bloco="prioridades"]'));
      afirma('Pipedrive sem conta: prioridades "Aguardando conexão", nunca "Sem pendências"', /Aguardando conexão/.test(t) && !/Sem pendências/.test(t), t.slice(0, 200)); await ctx.close(); }
  }

  console.log(`GERAL V2 × SERVIÇO 2a035013 (${CEN}, ${W}x${H}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, (e.stack || '').split('\n')[1]); process.exit(2); });
