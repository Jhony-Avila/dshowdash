import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2000);
await page.evaluate(() => { location.hash = '#/panel-pipedrive/config'; });
await page.waitForTimeout(6000);
const snap = await page.evaluate(() => ({
  hash: location.hash,
  title: document.querySelector('#container-main .dsd-container__title')?.textContent?.trim(),
  ppRoot: !!document.querySelector('[data-pp-react-root]'),
  ppShell: !!document.querySelector('.pp-shell'),
  ppH1: document.querySelector('[data-pp-react-root] .pp-h1')?.textContent?.trim(),
}));
log('HASH-NAV snap:', JSON.stringify(snap, null, 2));
log('errs:', errs.slice(0,6));
await browser.close(); log('=== FIM ===');
