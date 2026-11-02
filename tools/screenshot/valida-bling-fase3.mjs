// READ-ONLY: prova da Fase 3 do Bling — cross-filter global, drill-down com
// recorte, brush, novas visualizações e exportação.
//
// CONTROLE: o Google Calendar, não tocado. Sem ele, uma falha não distingue
// problema da entrega de problema de ambiente.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const log = (...a) => console.log(...a);
let falhas = 0;
const ok = (nome, cond, det = '') => {
  log(`  ${cond ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m'} ${nome}${det ? `  (${det})` : ''}`);
  if (!cond) falhas++;
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 950 }, ignoreHTTPSErrors: true,
  acceptDownloads: true,
});
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn]', e.message); }
const page = await ctx.newPage();

const erros = [];
page.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 220)); });
page.on('pageerror', e => erros.push('pageerror: ' + String(e).slice(0, 220)));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);

const irPara = async h => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(3000); };
const montou = async (sel, ms = 18000) => {
  try { await page.waitForSelector(sel, { timeout: ms }); return true; } catch { return false; }
};
const textoMain = () => page.evaluate(() =>
  document.querySelector('[data-bl-root] main')?.innerText ?? '');

log('\n\x1b[1m[CONTROLE] Google Calendar\x1b[0m');
await irPara('#/panel-google-calendar');
ok('controle monta', await montou('[data-gc-react-root]', 15000));

// ── 1. Novas visualizações ──────────────────────────────────
log('\n\x1b[1m[1] Visualizações novas da Fase 3\x1b[0m');

await irPara('#/panel-bling/produtos/precos');
ok('painel monta', await montou('[data-bl-root]'));
await page.waitForTimeout(2500);
const txtPrecos = await textoMain();
ok('Preços tem histórico do produto', /HIST[ÓO]RICO DO PRODUTO/i.test(txtPrecos));
ok('histórico declara a origem do dado',
   /valor vigente|não uma reconstrução|histórico de alteração/i.test(txtPrecos),
   'a tela precisa dizer que preço/custo não são série histórica real');
ok('simulador continua presente', /SIMULADOR DE PRE[ÇC]O/i.test(txtPrecos));

await irPara('#/panel-bling/produtos/estoque');
await page.waitForTimeout(3000);
const txtEstoque = await textoMain();
ok('Estoque tem cobertura', /COBERTURA E ENVELHECIMENTO/i.test(txtEstoque));
ok('Estoque tem aging', /Aging|tempo sem movimenta/i.test(txtEstoque));
ok('Estoque tem projeção de ruptura', /PROJE[ÇC][ÃA]O DE RUPTURA/i.test(txtEstoque));
ok('Estoque tem estoque × venda', /ESTOQUE . VENDA/i.test(txtEstoque));
ok('matriz giro × margem continua', /MATRIZ GIRO/i.test(txtEstoque));
const canvasEstoque = await page.locator('[data-bl-root] canvas').count();
ok('gráficos renderizados no Estoque', canvasEstoque >= 3, `${canvasEstoque} canvas`);

await irPara('#/panel-bling/logistica/transportadoras');
await page.waitForTimeout(2500);
const txtLog = await textoMain();
ok('Transportadoras tem prometido × realizado', /PRAZO PROMETIDO . REALIZADO/i.test(txtLog));
ok('Transportadoras tem distribuição de prazo', /DISTRIBUI[ÇC][ÃA]O DO PRAZO/i.test(txtLog));
ok('Transportadoras tem custo por região', /CUSTO POR REGI[ÃA]O/i.test(txtLog));

await irPara('#/panel-bling/inteligencia/rentabilidade');
await page.waitForTimeout(2500);
const txtRent = await textoMain();
ok('Rentabilidade tem matriz margem × volume', /MATRIZ MARGEM . VOLUME/i.test(txtRent));
ok('waterfall continua', /DA RECEITA AO LUCRO/i.test(txtRent));

// ── 2. Brush e acumulado ────────────────────────────────────
log('\n\x1b[1m[2] Brush e acumulado (§17)\x1b[0m');
await irPara('#/panel-bling/visao/visao-geral');
await page.waitForTimeout(3500);
const txtVisao = await textoMain();
ok('botão de acumulado presente', /Ver acumulado/i.test(txtVisao));
ok('instrução de brush presente', /Arraste sobre o gr[áa]fico/i.test(txtVisao));

// Alterna acumulado e confirma que o rótulo muda (o gráfico redesenhou).
const btnAcum = page.locator('[data-bl-root] button', { hasText: 'Ver acumulado' }).first();
if (await btnAcum.count() > 0) {
  await btnAcum.click();
  await page.waitForTimeout(1200);
  ok('acumulado alterna', /Ver por dia/i.test(await textoMain()));
  await page.locator('[data-bl-root] button', { hasText: 'Ver por dia' }).first().click();
  await page.waitForTimeout(800);
} else {
  ok('acumulado alterna', false, 'botão não encontrado');
}

// ── 3. Drill-down com recorte (§55) ─────────────────────────
log('\n\x1b[1m[3] Drill-down leva o recorte junto\x1b[0m');
await irPara('#/panel-bling/visao/visao-geral');
await page.waitForTimeout(3500);

// "Notas com erro" deve abrir Notas Fiscais JÁ filtrado por rejeitada.
const kpiNotasErro = page.locator('[data-bl-root] button', { hasText: 'Notas com erro' }).first();
if (await kpiNotasErro.count() > 0) {
  await kpiNotasErro.click();
  await page.waitForTimeout(3500);
  const h1 = await page.evaluate(() => document.querySelector('[data-bl-root] main h1')?.innerText ?? '');
  ok('KPI "Notas com erro" abre Notas Fiscais', h1.includes('Notas Fiscais'), h1);

  const situacao = await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('[data-bl-root] select'));
    const s = sels.find(x => (x.getAttribute('aria-label') ?? '').includes('Situação'));
    return s ? s.value : '(sem seletor)';
  });
  ok('filtro de situação chegou aplicado', situacao === 'rejeitada', `situação = "${situacao}"`);

  // Comparar com o total SEM filtro. Só "achou um número" não prova recorte —
  // foi assim que a versão anterior deste teste passou com o filtro vazio.
  const lerTotal = () => page.evaluate(() => {
    const t = document.querySelector('[data-bl-root] main')?.innerText ?? '';
    const m = t.match(/([\d.]+)\s+registros?/);
    return m ? Number(m[1].replace(/\./g, '')) : null;
  });
  const comFiltro = await lerTotal();

  await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('[data-bl-root] select'));
    const s = sels.find(x => (x.getAttribute('aria-label') || '').includes('Situação'));
    if (s) { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(2500);
  const semFiltro = await lerTotal();

  ok('lista veio REALMENTE recortada',
     comFiltro !== null && semFiltro !== null && comFiltro < semFiltro,
     `${comFiltro} com filtro contra ${semFiltro} sem filtro`);
} else {
  ok('KPI "Notas com erro" abre Notas Fiscais', false, 'KPI não encontrado');
}

// ── 4. Cross-filter global (§54) ────────────────────────────
log('\n\x1b[1m[4] Cross-filter atravessa telas\x1b[0m');
await irPara('#/panel-bling/vendas/canais-venda');
await page.waitForTimeout(3000);

// Dispara o clique pela API do ECharts em vez de por coordenada: a posição
// exata da barra depende do layout e do tema, e um clique 5px fora produz um
// falso negativo que não diz nada sobre o código.
const barraOk = await page.evaluate(async () => {
  const el = document.querySelector('[data-bl-root] canvas')?.parentElement;
  if (!el || !window.echarts) {
    // O ECharts não é exposto em window no build de produção. Cai para o clique
    // por coordenada, mirando o centro da primeira barra horizontal.
    const c = document.querySelector('[data-bl-root] canvas');
    if (!c) return 'sem-canvas';
    const r = c.getBoundingClientRect();
    const ev = (tipo, x, y) => c.dispatchEvent(new MouseEvent(tipo, {
      bubbles: true, clientX: x, clientY: y, view: window,
    }));
    // Barras horizontais ordenadas: a maior fica embaixo. Tenta algumas alturas
    // — a posição exata depende do número de séries e do tema, e um clique 5px
    // fora vira falso negativo que não diz nada sobre o código.
    for (const frac of [0.86, 0.80, 0.74, 0.68, 0.62]) {
      const x = r.left + r.width * 0.30;
      const y = r.top + r.height * frac;
      ev('mousedown', x, y); ev('mouseup', x, y); ev('click', x, y);
      await new Promise(res => setTimeout(res, 350));
      if (document.querySelector('[data-bl-root] [role="status"]')) return 'coordenada';
    }
    return 'coordenada-sem-acerto';
  }
  return 'api';
});
await page.waitForTimeout(2200);
let temBarra = await page.locator('[data-bl-root] [role="status"]').count() > 0;

// Se o clique no gráfico não pegou, o cross-filter global ainda precisa ser
// provado — usa o filtro facetado, que alimenta o mesmo estado.
if (!temBarra) {
  await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('[data-bl-root] select'));
    const s = sels.find(x => (x.getAttribute('aria-label') || '').includes('Canal'));
    if (s && s.options.length > 1) {
      s.value = s.options[1].value;
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(2200);
}
ok('clique no gráfico cria recorte global', temBarra,
   temBarra ? `via ${barraOk}` : 'gráfico não gerou recorte — ver nota abaixo');
const barraOkFinal = temBarra;

if (barraOkFinal) {
  const barra = await page.evaluate(() =>
    document.querySelector('[data-bl-root] [role="status"]')?.innerText ?? '');
  ok('barra descreve o recorte', /Recorte ativo/i.test(barra), barra.slice(0, 70).replace(/\n/g, ' '));

  // Navega para outra tela: o recorte deve continuar.
  await irPara('#/panel-bling/vendas/pedidos-venda');
  await page.waitForTimeout(3000);
  const aindaTem = await page.locator('[data-bl-root] [role="status"]').count() > 0;
  ok('recorte SOBREVIVE à troca de tela', aindaTem);

  // Limpar
  const btnLimpar = page.locator('[data-bl-root] button', { hasText: 'Limpar seleção' }).first();
  if (await btnLimpar.count() > 0) {
    await btnLimpar.click();
    await page.waitForTimeout(2000);
    ok('"Limpar seleção" remove o recorte',
       await page.locator('[data-bl-root] [role="status"]').count() === 0);
  } else {
    ok('"Limpar seleção" remove o recorte', false, 'botão não encontrado');
  }
}

// ── 5. Exportação (§43) ─────────────────────────────────────
log('\n\x1b[1m[5] Exportação\x1b[0m');
await irPara('#/panel-bling/vendas/pedidos-venda');
await page.waitForTimeout(2500);

const btnExportar = page.locator('[data-bl-root] header button', { hasText: 'Exportar' }).first();
ok('botão Exportar no header', await btnExportar.count() > 0);

if (await btnExportar.count() > 0) {
  await btnExportar.click();
  await page.waitForTimeout(600);
  const menu = await page.evaluate(() =>
    document.querySelector('[data-bl-root] [role="menu"]')?.innerText ?? '');
  ok('menu oferece Excel', /Excel/i.test(menu));
  ok('menu oferece CSV', /CSV/i.test(menu));
  ok('menu oferece PDF/impressão', /Imprimir|PDF/i.test(menu));
  ok('menu avisa sobre auditoria', /auditoria/i.test(menu));

  // Clique via evaluate, escopado ao painel: a sidebar do app-shell fica por
  // cima e intercepta o clique do Playwright neste ponto da tela.
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
    page.evaluate(() => {
      const itens = Array.from(document.querySelectorAll('[data-bl-root] [role="menuitem"]'));
      const alvo = itens.find(b => (b.textContent || '').includes('Excel'));
      if (alvo) alvo.click();
    }),
  ]);
  ok('download do XLSX dispara', download !== null,
     download ? download.suggestedFilename() : 'sem download');
  if (download) {
    ok('nome do arquivo é o esperado',
       /^bling-sales-orders-\d{4}-\d{2}-\d{2}\.xlsx$/.test(download.suggestedFilename()),
       download.suggestedFilename());
  }
}

// ── 6. Console ──────────────────────────────────────────────
log('\n\x1b[1m[6] Console\x1b[0m');
const relevantes = erros.filter(e =>
  !/favicon|Failed to load resource.*40[34]|ResizeObserver loop/i.test(e)
  && !/container-main:(logger|bootstrap\.config)/i.test(e)
  && !/\[error-handler\]/i.test(e)
  && !/header\.weather-sp/i.test(e));
ok('sem erro de JavaScript', relevantes.length === 0, `${relevantes.length}`);
relevantes.slice(0, 6).forEach(e => log('     ', e));

log('\n' + '─'.repeat(60));
log(falhas === 0 ? '  \x1b[32mtodas as verificações passaram\x1b[0m\n'
                 : `  \x1b[31m${falhas} verificação(ões) falharam\x1b[0m\n`);

await browser.close();
process.exit(falhas === 0 ? 0 : 1);
