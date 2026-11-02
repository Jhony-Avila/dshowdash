// datatables-ui-smoke.mjs — smoke de UI do painel DataTables, para o runner de regressao.
// @version 1.0.0  @created 2026-07-20
//
// Complementa o smoke PHP: aquele prova o backend, este prova que a TELA monta,
// que as abas respondem e que nao ha erro de JS. Dois defeitos reais deste modulo
// (seções coladas e paginação cortada) passaram por TODAS as suites de backend —
// so apareceram olhando a tela.
//
// Contrato para o runner:
//   exit 0 = PASS | exit 1 = FALHA | exit 2 = nao pode executar (sem browser/sessao)
//   Ultima linha do stdout: "SMOKE-UI: <n> PASS / <n> FAIL"
//
// Uso: PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright node datatables-ui-smoke.mjs [--theme=dark|light|both]

import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const args  = process.argv.slice(2);
const themeArg = (args.find(a => a.startsWith('--theme=')) || '--theme=dark').split('=')[1];
const THEMES = themeArg === 'both' ? ['dark', 'light'] : [themeArg];

let PASS = 0, FAIL = 0;
const falhas = [];

function check(nome, cond, detalhe = '') {
  if (cond) { console.log(`  [PASS] ${nome}`); PASS++; }
  else { console.log(`  [FAIL] ${nome}${detalhe ? ' -> ' + detalhe : ''}`); FAIL++; falhas.push(nome); }
}

// Rotas (React, URL em SEGMENTOS — Fase 3). Cada uma monta e faz >= 1 chamada
// de API. `texto` é um trecho que deve aparecer na tela quando ela renderiza.
const ROTAS = [
  { rota: 'overview/overview',        texto: 'Infraestrutura', minKpis: 6 },
  { rota: 'infrastructure/servers',   texto: 'Servidor' },
  { rota: 'infrastructure/databases', texto: null },
  { rota: 'infrastructure/connections', texto: 'Credenciais' },
  { rota: 'data/tables',              texto: null, precisaLinhas: true },
  { rota: 'data/dependencies',        texto: 'referenciad' },
  { rota: 'data/sensitive',           texto: 'metadado' },
  { rota: 'data/search',              texto: 'catálogo' },
  { rota: 'observability/quality',    texto: 'Saúde' },
  { rota: 'observability/alerts',     texto: null },
  { rota: 'observability/maintenance', texto: 'disponibilidade' },
  { rota: 'sources/integrations',     texto: null },
  { rota: 'admin/settings',           texto: 'Canais de alerta' },
];

let cookies;
try {
  cookies = await getSessionCookies();
} catch (e) {
  console.log('SMOKE-UI: sem sessao — pulado');
  process.exit(2);
}

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage',
           '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'],
  });
} catch (e) {
  console.log('SMOKE-UI: browser indisponivel — pulado (' + String(e).slice(0, 80) + ')');
  process.exit(2);
}

for (const theme of THEMES) {
  console.log(`\n── UI (${theme}) ${'─'.repeat(46)}`);

  const ctx = await browser.newContext({
    viewport: { width: 1500, height: 1000 },
    colorScheme: theme, serviceWorkers: 'block', ignoreHTTPSErrors: true,
  });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.setItem('dshowdash-theme', t); } catch (e) {}
  }, theme);

  const page = await ctx.newPage();
  const errosJs = [], apisFalhas = [];
  page.on('pageerror', e => errosJs.push(String(e).slice(0, 160)));
  page.on('response', r => {
    if (r.url().includes('/api/datatables') && r.status() >= 400) {
      apisFalhas.push(`${r.status()} ${r.url().replace(/^https:\/\/[^/]+/, '')}`);
    }
  });

  await page.goto('https://dshowdash.com.br/#/panel-datatables',
    { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) {
    await loginViaPage(page).catch(() => {});
    await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(() => {});
    await page.waitForTimeout(3000);
  }

  const montou = await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 })
    .then(() => true).catch(() => false);
  check('painel React monta ([data-dt-react-root] presente)', montou);
  if (!montou) { await ctx.close(); continue; }

  // Cada rota precisa montar conteudo — nunca ficar em estado de erro (o
  // ErrorBoundary usa role="alert"; os estados de erro/skeleton têm marcas).
  for (const t of ROTAS) {
    await page.goto(`https://dshowdash.com.br/#/panel-datatables/${t.rota}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2400);

    const r = await page.evaluate(() => {
      const raiz = document.querySelector('[data-dt-react-root]');
      const txt = (raiz && raiz.textContent) || '';
      return {
        montado: !!raiz,
        erroBoundary: !!document.querySelector('[data-dt-react-root] [role="alert"]'),
        naoMigrada: txt.includes('ainda não foi migrada'),
        kpis: document.querySelectorAll('[data-dt-react-root] [class*="cartao"], [data-dt-react-root] [class*="MetricCard"]').length,
        linhas: document.querySelectorAll('[data-dt-react-root] [role="row"]').length,
        corpo: txt,
      };
    });

    check(`rota "${t.rota}" monta em React`, r.montado);
    check(`rota "${t.rota}" não caiu no ErrorBoundary`, !r.erroBoundary);
    check(`rota "${t.rota}" está migrada (não cai no legado)`, !r.naoMigrada);
    if (t.texto) {
      check(`rota "${t.rota}" renderiza conteúdo ("${t.texto}")`,
        r.corpo.includes(t.texto), r.corpo.slice(0, 70));
    }
    if (t.minKpis) {
      check(`rota "${t.rota}" tem >= ${t.minKpis} indicadores`, r.kpis >= t.minKpis, `tem ${r.kpis}`);
    }
    if (t.precisaLinhas) {
      check(`rota "${t.rota}" lista linhas no grid`, r.linhas > 1, `${r.linhas} linhas`);
    }
  }

  // Busca global (React): liga o modo "contém" (clicando no rótulo) e digita.
  await page.goto('https://dshowdash.com.br/#/panel-datatables/data/search',
    { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2200);
  await page.click('[data-dt-react-root] >> text=contém').catch(() => {});   // exato -> contém
  await page.waitForTimeout(300);
  await page.fill('input[type="search"]', 'user').catch(() => {});
  await page.waitForTimeout(3200);
  check('busca global devolve resultado',
    await page.evaluate(() => /resultado\(s\)/.test(
      document.querySelector('[data-dt-react-root]')?.textContent || '')));

  // Layout: conteudo largo rola DENTRO do container, nunca na pagina.
  const rolagem = await page.evaluate(() => ({
    corpoRolaH: document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
  }));
  check('página não rola horizontalmente', !rolagem.corpoRolaH);

  check('nenhum erro de JavaScript', errosJs.length === 0, errosJs.slice(0, 2).join(' | '));
  check('nenhuma chamada de API falhou', apisFalhas.length === 0, apisFalhas.slice(0, 3).join(' | '));

  await ctx.close();
}

await browser.close();

console.log(`\nSMOKE-UI: ${PASS} PASS / ${FAIL} FAIL`);
if (FAIL > 0) {
  console.log('Falharam: ' + falhas.join(', '));
}
process.exit(FAIL > 0 ? 1 : 0);
