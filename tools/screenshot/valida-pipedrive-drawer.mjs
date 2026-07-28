// Valida o DealDrawer: clicar numa linha de Negocios abre detalhe + timeline.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let detHit = null;
page.on('response', (r) => { if (/\/api\/pipedrive\/deals\/\d+/.test(r.url())) detHit = r.status(); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

// Negocios -> clicar primeira linha
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 });
await page.waitForTimeout(800);
const titulo = await page.evaluate(() => document.querySelector('.pp-table tbody tr .pp-td-title')?.textContent?.trim());
await page.click('.pp-table tbody tr');
await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1500);

const drawer = await page.evaluate(() => {
  const dr = document.querySelector('.pp-drawer');
  if (!dr) return { aberto: false };
  return {
    aberto: true,
    h2: dr.querySelector('h2')?.textContent?.trim(),
    secoes: [...dr.querySelectorAll('h4')].map(h => h.textContent.trim()),
    rows: dr.querySelectorAll('.pp-row').length,
    timelineItens: dr.querySelectorAll('.pp-tl-item').length,
    temBadge: !!dr.querySelector('.pp-badge'),
  };
});
log('linha clicada:', titulo);
log('DRAWER:', JSON.stringify(drawer, null, 1));
log('GET /deals/{id} http:', detHit);

for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-drawer-${t}.png` }).catch(() => {});
  const dr = await page.$('.pp-drawer');
  await dr?.screenshot({ path: `${SP}/drawer-${t}.png` }).catch(() => {});
}

// fechar via Esc
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
const fechou = await page.evaluate(() => !document.querySelector('.pp-drawer'));
log('fechou com Esc:', fechou);

const pipeErrs = errors.filter(e => /pipedrive|deals/i.test(e));
log('RESUMO =>', JSON.stringify({ drawerAbriu: drawer.aberto, detHttp: detHit, timeline: drawer.timelineItens, secoes: drawer.secoes, fechouEsc: fechou, consoleErrsPipe: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
