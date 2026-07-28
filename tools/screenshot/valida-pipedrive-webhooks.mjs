// Valida os endpoints admin do ingest de webhooks (autenticado, origin).
// GET /api/pipedrive/queue     -> estado da fila (base local, sem API)
// GET /api/pipedrive/webhooks  -> receptor + lista REAL de webhooks no Pipedrive
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });

async function apiGet(path) {
  return await page.evaluate(async (p) => {
    const r = await fetch(p, { credentials: 'include', headers: { 'Accept': 'application/json' } });
    let body = null; try { body = await r.json(); } catch (e) { body = '<<nao-json>>'; }
    return { status: r.status, body };
  }, path);
}

const out = {};
out.status = await apiGet('/api/pipedrive/status');
out.queue = await apiGet('/api/pipedrive/queue');
out.webhooks = await apiGet('/api/pipedrive/webhooks');

await browser.close();
console.log(JSON.stringify(out, null, 2));
