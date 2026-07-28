// Valida a aba Saúde da sincronização (#39): entidades, fila, erros, uso API, rodadas.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
let healthResp = null;
page.on('response', async (r) => { if (r.url().includes('/api/pipedrive/health')) { let b = null; try { b = await r.json(); } catch {} healthResp = { http: r.status(), entities: b?.data?.entities?.length, runs: b?.data?.runs?.length, pending: b?.data?.queue?.stats?.jobs?.pending, dead: b?.data?.queue?.stats?.jobs?.dead, errs: b?.data?.errors?.length, apiCalls: b?.data?.api_24h?.calls }; } });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

const btn = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-navitem')].find(b => b.textContent.includes('Saúde')));
await btn.asElement()?.click().catch(() => {});
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-main .pp-card h3')].map(h => h.textContent.trim());
  const cards = [...document.querySelectorAll('.pp-main .pp-card')];
  const rowsOf = (t) => { const c = cards.find(c => c.querySelector('h3')?.textContent.includes(t)); return c ? c.querySelectorAll('.pp-table tbody tr').length : 0; };
  const tiles = [...document.querySelectorAll('.pp-main .pp-tile')].length;
  const badges = [...document.querySelectorAll('.pp-main .pp-badge')].map(b => b.textContent.trim());
  return { h3s, entidadesRows: rowsOf('Estado por entidade'), rodadasRows: rowsOf('Rodadas recentes'), tiles, badgesSample: badges.slice(0, 4) };
});
log('SAUDE DOM:', JSON.stringify(info, null, 2));
log('API /health:', JSON.stringify(healthResp));

for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(500);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-saude-${t}.png` }).catch(() => {});
  // captura tambem o card de entidades isolado
  const h = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-main .pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Estado por entidade')));
  await h.asElement()?.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await h.asElement()?.screenshot({ path: `${OUT}/pipedrive-saude-card-${t}.png` }).catch(() => {});
  log('shot', t);
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical/.test(e));
log('RESUMO =>', JSON.stringify({
  healthHttp: healthResp?.http, apiEntities: healthResp?.entities, apiRuns: healthResp?.runs,
  domEntidades: info.entidadesRows, domRodadas: info.rodadasRows, domTiles: info.tiles,
  badges: info.badgesSample, temCards: info.h3s.length, consoleErrs: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
