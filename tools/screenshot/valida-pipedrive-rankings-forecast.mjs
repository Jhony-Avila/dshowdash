// Valida as telas Rankings (#28) e Previsao/forecast (#29), dark+light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let rankResp = null, fcResp = null, fcCalls = 0;
page.on('response', async (r) => {
  const u = r.url();
  if (u.includes('/api/pipedrive/rankings')) { let b = null; try { b = await r.json(); } catch {} rankResp = { http: r.status(), sellers: b?.data?.sellers?.length, products: b?.data?.products?.length, orgs: b?.data?.orgs?.length, topSeller: b?.data?.sellers?.[0]?.name }; }
  if (u.includes('/api/pipedrive/forecast')) { fcCalls++; let b = null; try { b = await r.json(); } catch {} fcResp = { http: r.status(), open: b?.data?.totals?.open_count, total: b?.data?.totals?.valor_total, pond: b?.data?.totals?.valor_ponderado, stages: b?.data?.by_stage?.length, months: b?.data?.by_month?.length, pipelines: b?.data?.pipelines?.length }; }
});

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

const clickTab = async (label) => {
  const btn = await page.evaluateHandle((lbl) => [...document.querySelectorAll('.pp-navitem')].find(b => b.textContent.includes(lbl)), label);
  await btn.asElement()?.click().catch(() => {});
  await page.waitForTimeout(2500);
};

// ── RANKINGS ──────────────────────────────────────────────
await clickTab('Rankings');
const rk = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-main .pp-card h3')].map(h => h.textContent.trim());
  const cards = [...document.querySelectorAll('.pp-main .pp-card')];
  const rows = (t) => { const c = cards.find(c => c.querySelector('h3')?.textContent.includes(t)); return c ? c.querySelectorAll('.pp-table tbody tr').length : 0; };
  const first = (t) => { const c = cards.find(c => c.querySelector('h3')?.textContent.includes(t)); const tr = c?.querySelector('.pp-table tbody tr'); return tr ? [...tr.querySelectorAll('td')].map(td => td.textContent.trim()) : null; };
  return { h3s, vendedores: rows('Vendedores'), produtos: rows('Produtos'), organizacoes: rows('Organiz'), primeiroVend: first('Vendedores') };
});
log('RANKINGS DOM:', JSON.stringify(rk, null, 2));
log('API /rankings:', JSON.stringify(rankResp));
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(500); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-rankings-${t}.png` }).catch(() => {}); log('shot rankings', t); }

// ── PREVISAO ──────────────────────────────────────────────
await setTheme('dark');
await clickTab('Previsão');
const pv = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-main .pp-card h3')].map(h => h.textContent.trim());
  const tiles = [...document.querySelectorAll('.pp-main .pp-tile')].map(t => ({ n: t.querySelector('.pp-tile-n')?.textContent.trim(), l: t.querySelector('.pp-tile-l')?.textContent.trim() }));
  const fcBars = document.querySelectorAll('.pp-fc-bar').length;
  const sel = document.querySelector('.pp-main .pp-select');
  const opts = sel ? [...sel.querySelectorAll('option')].map(o => o.textContent.trim()) : [];
  return { h3s, tiles, fcBars, opts };
});
log('PREVISAO DOM:', JSON.stringify(pv, null, 2));
log('API /forecast:', JSON.stringify(fcResp));
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(500); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-previsao-${t}.png` }).catch(() => {}); log('shot previsao', t); }

// Troca o funil (2a opcao) e confirma refetch
await setTheme('dark');
const callsAntes = fcCalls;
await page.selectOption('.pp-main .pp-select', { index: 1 }).catch(() => {});
await page.waitForTimeout(2500);
const refez = fcCalls > callsAntes;
log('Troca de funil refez /forecast:', refez, `(${callsAntes} -> ${fcCalls})`, 'novo estado:', JSON.stringify(fcResp));

const pipeErrs = errors.filter(e => /pipedrive|rankings|forecast/i.test(e));
log('RESUMO =>', JSON.stringify({
  rankingsHttp: rankResp?.http, rankSellers: rankResp?.sellers, rankTop: rankResp?.topSeller,
  rankVendedoresRows: rk.vendedores, rankOrgRows: rk.organizacoes,
  forecastHttp: fcResp?.http, fcOpen: fcResp?.open, fcStages: fcResp?.stages, fcMonths: fcResp?.months,
  fcBars: pv.fcBars, fcTiles: pv.tiles.length, seletorFunil: pv.opts.length, trocaFunilRefetch: refez,
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
