// PROVA Fase 1b (A2 + contraste): dark intacto + light (header/ticker/sidebar/busca/rodapé/rail) + stress.
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

const setTheme = async (t) => { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } };
const cs = (s) => page.evaluate(sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : 'n/a'; }, s);
const col = (s) => page.evaluate(sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).color : 'n/a'; }, s);

// DARK
await setTheme('dark'); await page.waitForTimeout(400);
await page.screenshot({ path: DIR + 'a2-DARK.png' });
const darkBody = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

// LIGHT
await setTheme('light'); await page.waitForTimeout(500);
await page.screenshot({ path: DIR + 'a2-LIGHT.png' });
const light = {
  body: await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  header: await cs('.site-header,.main-header'),
  ticker: await cs('.news-ticker-component'),
  searchBg: await cs('.dsd-sidebar__search-input'),
  searchText: await col('.dsd-sidebar__search-input'),
  footer: await cs('.site-footer,[class*="footer-bottombar"]'),
  rail: await cs('.nav-rail,.navrail'),
  groupTitle: await col('.dsd-sidebar__group-title'),
};

// STRESS 5 cliques -> thread livre
for (let i = 0; i < 5; i++) { await page.click('[data-dsd-theme-toggle]', { timeout: 2000 }).catch(() => {}); }
let responsive = true, timerMs = -1;
try { timerMs = await Promise.race([page.evaluate(() => new Promise(r => { const t0 = performance.now(); setTimeout(() => r(performance.now() - t0), 100); })), new Promise((_, rej) => setTimeout(() => rej(new Error('UNRESP')), 4000))]); } catch { responsive = false; }

await browser.close();
console.log(JSON.stringify({ darkBody_shouldBeBlack: darkBody, light, stress: { responsive, timerMs: Math.round(timerMs) } }, null, 2));
