import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// LIGHT
let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && c !== 'light'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(500); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
// tenta navegar p/ um painel de dados (nao a home weather-fx)
const tryClicks = ['Geral Compras', 'Koala Docs', 'Contratos', 'Clientes'];
let clicked = 'none';
for (const t of tryClicks) {
  const el = page.locator(`text="${t}"`).first();
  if (await el.count() && await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); clicked = t; await page.waitForTimeout(2500); break; }
}
await page.screenshot({ path: DIR + 'fase2-scout-light.png' });
const info = await page.evaluate(() => {
  const cs = s => { const el = document.querySelector(s); return el ? { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color } : 'n/a'; };
  return { clickedPanelHeader: cs('.dsd-container__header'), container: cs('.dsd-container'), content: cs('.dsd-container__content,.dsd-container__body,.main-content') };
});
await browser.close();
console.log(JSON.stringify({ navegouPara: clicked, info }, null, 2));
