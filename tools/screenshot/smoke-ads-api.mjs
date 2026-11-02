// READ-ONLY: confirma que a API do mock continua respondendo apos o scaffold real.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1200);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1000);
async function get(path) {
  return await page.evaluate(async (p) => {
    const r = await fetch('/api/ads' + p, { headers: { 'Accept': 'application/json' } });
    let b = null; try { b = await r.json(); } catch {}
    return { status: r.status, body: b };
  }, path);
}
const status = await get('/status');
const auds = await get('/audiences?account_id=1');
const dash = await get('/dashboard?account_id=1&period=30d');
console.log('STATUS', status.status, 'provider=', status.body?.data?.provider ?? status.body?.provider);
console.log('AUDIENCES', auds.status, 'items=', auds.body?.data?.items?.length, 'overlap_labels=', auds.body?.data?.overlap?.labels?.length);
console.log('DASHBOARD', dash.status, 'series_by_channel=', dash.body?.data?.series_by_channel?.channels?.length, 'big=', dash.body?.data?.big?.length);
await browser.close();
