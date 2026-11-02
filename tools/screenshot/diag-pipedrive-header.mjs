// Diagnóstico: o cabeçalho da tabela está alinhado com o corpo? (contagem de células e rects)
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.removeItem('pp:cols:/deals'));
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForTimeout(2800);

const diag = await page.evaluate(() => {
  const t = document.querySelector('.pp-main .pp-table');
  const ths = [...t.querySelectorAll('thead th')];
  const tds = [...t.querySelectorAll('tbody tr:not(.pp-det-tr)')[0].querySelectorAll('td')];
  const cols = [...t.querySelectorAll('colgroup col')];
  return {
    nCols: cols.length, nThs: ths.length, nTds: tds.length,
    larguraCols: cols.map(c => c.style.width),
    cabecalho: ths.map(th => ({ txt: (th.textContent || '').trim().slice(0, 12), left: Math.round(th.getBoundingClientRect().left), w: Math.round(th.getBoundingClientRect().width) })),
    corpo: tds.map(td => ({ txt: (td.textContent || '').trim().slice(0, 12), left: Math.round(td.getBoundingClientRect().left), w: Math.round(td.getBoundingClientRect().width) })),
  };
});
console.log(JSON.stringify(diag, null, 1));
await browser.close();
