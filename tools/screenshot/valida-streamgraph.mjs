// READ-ONLY: valida VisãoGeral (streamgraph D3) — dark+light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { mkdirSync } from 'fs';

const OUT = process.env.ADS_OUT || '/tmp/stream-shots';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

async function setTheme(t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(500); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  return c;
}

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2000);
await page.evaluate(() => { location.hash = '#/panel-ads/visao-geral'; });
await page.waitForSelector('[data-ads-react-root] .ads-shell', { timeout: 30000 });
await page.waitForTimeout(1800);

const info = await page.evaluate(() => {
  const stream = [...document.querySelectorAll('.ads-main [aria-label*="Streamgraph"]')][0];
  return {
    temStream: /Composição do investimento por canal/.test(document.querySelector('.ads-main')?.textContent || ''),
    areasPaths: stream ? stream.querySelectorAll('g[data-l="areas"] path').length : 0,
    svgTotal: document.querySelectorAll('.ads-main svg').length,
  };
});
log('INFO visao-geral:', JSON.stringify(info));

for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(500);
  const el = await page.$('[data-ads-react-root]') || page;
  await el.screenshot({ path: `${OUT}/visao-geral-${t}.png` }).catch(() => {});
}
log('RESUMO:', JSON.stringify({ ...info, consoleErrorsAds: errors.filter(e => /panel-ads|Streamgraph|d3-|ChartCard/i.test(e)).slice(0, 6), consoleErrorsTotal: errors.length }, null, 2));
await browser.close();
log('FIM —', OUT);
