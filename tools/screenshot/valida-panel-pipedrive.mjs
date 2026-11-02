// READ-ONLY: valida o painel Pipedrive Analytics (Fase 2 — Visao Geral + Sync).
// Origin autenticado (host-resolver MAP -> 127.0.0.1). NAO dispara sync destrutiva.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors']
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let overviewResp = null, syncCalls = 0, dealsResp = null, dealsCalls = 0;
page.on('response', async (r) => {
  if (r.url().includes('/api/pipedrive/overview')) { let b = null; try { b = await r.json(); } catch {} overviewResp = { http: r.status(), body: b }; }
  if (r.url().includes('/api/pipedrive/deals')) { let b = null; try { b = await r.json(); } catch {} dealsResp = { http: r.status(), n: b?.data?.rows?.length, total: b?.data?.total }; dealsCalls++; }
});
page.on('request', (r) => { if (r.url().includes('/api/pipedrive/sync')) syncCalls++; });

// Boot + navegacao real (botao do header)
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
log('botao header:', !!trigger);
if (trigger) await trigger.click().catch(() => {});

let mounted = false;
try { await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 }); mounted = true; log('OK montou'); }
catch { log('FALHA: nao montou'); }

// ── VISAO GERAL (default) ──────────────────────────────────
await page.waitForTimeout(2500);
const geral = await page.evaluate(() => {
  const h1 = document.querySelector('.pp-main .pp-h1')?.textContent?.trim();
  const tiles = [...document.querySelectorAll('.pp-tile')].map(t => ({
    n: t.querySelector('.pp-tile-n')?.textContent?.trim(), l: t.querySelector('.pp-tile-l')?.textContent?.trim()
  }));
  const funil = [...document.querySelectorAll('.pp-funil-row')].length;
  const vazio = !!document.querySelector('.pp-main .pp-placeholder');
  return { h1, tiles, funil, vazio };
});
log('VISAO GERAL:', JSON.stringify(geral));
log('OVERVIEW API:', JSON.stringify(overviewResp));

for (const t of ['dark', 'light']) {
  await setTheme(page, t); await page.waitForTimeout(700);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-geral-${t}.png` }).catch(() => {});
  log(`shot geral ${t}`);
}

// ── NEGOCIOS (DataGrid) ────────────────────────────────────
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios'));
  b?.click();
});
await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
const negocios = await page.evaluate(() => {
  const h1 = document.querySelector('.pp-main .pp-h1')?.textContent?.trim();
  const cols = [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.trim());
  const linhas = document.querySelectorAll('.pp-table tbody tr').length;
  const primeira = (() => {
    const tr = document.querySelector('.pp-table tbody tr');
    if (!tr) return null;
    return [...tr.querySelectorAll('td')].map(td => td.textContent.trim().slice(0, 22));
  })();
  const filtros = [...document.querySelectorAll('.pp-filtros select, .pp-filtros input')].length;
  return { h1, cols, linhas, primeira, filtros };
});
log('NEGOCIOS:', JSON.stringify(negocios));
log('DEALS API:', JSON.stringify(dealsResp));
// testa ordenacao: clicar no header "Valor"
await page.evaluate(() => {
  const th = [...document.querySelectorAll('.pp-table thead th')].find(t => t.textContent.includes('Valor'));
  th?.click();
});
await page.waitForTimeout(1500);
const aposSort = await page.evaluate(() => document.querySelector('.pp-table thead th:nth-child(2)')?.textContent?.trim());
log('APOS SORT (col Valor):', aposSort, '| chamadas /deals ate agora:', dealsCalls);
for (const t of ['dark', 'light']) {
  await setTheme(page, t); await page.waitForTimeout(600);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-negocios-${t}.png` }).catch(() => {});
}

// ── CONFIGURACOES (clicar aba) ─────────────────────────────
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Configurações'));
  b?.click();
});
await page.waitForTimeout(1500);
const config = await page.evaluate(() => {
  const h1 = document.querySelector('.pp-main .pp-h1')?.textContent?.trim();
  const temToken = !!document.querySelector('#pp-token');
  const temDesconectar = [...document.querySelectorAll('.pp-btn')].some(b => b.textContent.trim() === 'Desconectar');
  const h3s = [...document.querySelectorAll('.pp-card h3')].map(h => h.textContent.trim());
  const btnsSync = [...document.querySelectorAll('.pp-btn')].map(b => b.textContent.trim())
    .filter(t => t.includes('Sincroniz'));
  return { h1, temToken, temDesconectar, h3s, btnsSync };
});
log('CONFIG:', JSON.stringify(config, null, 2));
for (const t of ['dark', 'light']) {
  await setTheme(page, t); await page.waitForTimeout(600);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-config-${t}.png` }).catch(() => {});
}

log('CONSOLE ERRORS:', errors.length, errors.filter(e => /pipedrive|overview|sync/i.test(e)).slice(0, 6));
log('RESUMO =>', JSON.stringify({
  mounted,
  overviewHttp: overviewResp?.http,
  tiles: geral.tiles?.length,
  telaGeral: geral.h1 === 'Visão Geral',
  telaNegocios: negocios.h1 === 'Negócios',
  negociosLinhas: negocios.linhas,
  negociosCols: negocios.cols?.length,
  dealsHttp: dealsResp?.http,
  dealsTotal: dealsResp?.total,
  dealsRefetchOuSort: dealsCalls, // >1 = re-fetch por sort/filtro funcionou
  telaConfig: config.h1 === 'Configurações',
  temSyncCard: config.h3s?.some(h => h.includes('Sincronização')),
  syncCallsDisparadas: syncCalls, // deve ser 0
}));
await browser.close();
log('=== FIM ===');

async function setTheme(page, t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]').catch(() => {});
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
}
