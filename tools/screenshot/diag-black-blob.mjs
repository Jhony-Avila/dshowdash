// READ-ONLY: identifica o elemento de fundo escuro no cluster esquerdo do header (light).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// garantir LIGHT
let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 3 && c !== 'light'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
await page.waitForTimeout(600);

const res = await page.evaluate(() => {
  const isDark = (rgb) => { const m = rgb.match(/\d+/g); if (!m) return false; const [r, g, b, a = '1'] = m; return (+r < 60 && +g < 60 && +b < 60 && (a === '1' || +a > 0.5)); };
  const header = document.querySelector('.site-header');
  const out = [];
  header.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.left > 520) return; // só cluster esquerdo (antes das cotações)
    if (isDark(cs.backgroundColor)) {
      out.push({ cls: el.className, tag: el.tagName, bg: cs.backgroundColor, x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  return out;
});
await browser.close();
console.log(JSON.stringify(res, null, 2));
