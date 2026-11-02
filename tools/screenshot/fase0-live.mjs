// PROVA AO VIVO da Fase 0 deployada (sem injeção): clica o toggle real -> light -> casco claro?
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
// garante LIGHT clicando o toggle real
let t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && t !== 'light'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(600); t = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
await page.waitForTimeout(500);
await page.screenshot({ path: DIR + 'fase0-LIVE-light.png' });
const m = await page.evaluate(() => {
  const cs = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).backgroundColor : 'n/a'; };
  const linked = !!document.querySelector('link[href*="theme.light-total.css"]');
  return { dataTheme: document.documentElement.getAttribute('data-theme'), linkPresent: linked, body: getComputedStyle(document.body).backgroundColor, header: cs('.site-header,.main-header'), sidebar: cs('.navrail,.sidebar,.nav-rail'), ticker: cs('.ticker') };
});
await browser.close();
console.log(JSON.stringify(m, null, 2));
