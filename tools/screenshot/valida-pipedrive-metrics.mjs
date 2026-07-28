// Fetch autenticado de GET /api/pipedrive/metrics (shape + HTTP 200).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });

const r = await page.evaluate(async () => {
  const res = await fetch('/api/pipedrive/metrics?days=90', { credentials: 'include', headers: { Accept: 'application/json' } });
  let b = null; try { b = await res.json(); } catch {}
  const d = b?.data ?? {};
  return {
    status: res.status,
    ok: b?.ok,
    daily_n: (d.daily || []).length,
    hourly_n: (d.hourly || []).length,
    top_products_n: (d.top_products || []).length,
    owners_n: (d.owners || []).length,
    coverage: d.coverage,
    hourly_sample: (d.hourly || []).slice(-2),
    owners_sample: (d.owners || []).slice(0, 2),
  };
});
await browser.close();
console.log(JSON.stringify(r, null, 2));
