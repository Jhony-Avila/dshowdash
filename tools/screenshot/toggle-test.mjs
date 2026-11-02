import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/toggle-test.png';
const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(3000); // window.load + setInterval injeta o botao (~1s)

// Botao do toggle apareceu?
const btn = await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 8000 }).catch(() => null);
const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

let clicked = false, themeAfter = null, responsive = true;
if (btn) {
  await btn.click().catch(e => errors.push('click:' + e));
  clicked = true;
  await page.waitForTimeout(600);
  themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
}
// responsividade pos-clique (garante que nao entrou em loop)
for (let i = 0; i < 8; i++) {
  try { await page.evaluate(() => document.readyState, { timeout: 2000 }); }
  catch { responsive = false; break; }
  await page.waitForTimeout(500);
}
await page.screenshot({ path: OUT }).catch(() => {});
await browser.close();
console.log(JSON.stringify({
  toggleButtonPresent: !!btn, themeBefore, clicked, themeAfter,
  themeFlipped: themeBefore && themeAfter && themeBefore !== themeAfter,
  responsiveAfterClick: responsive, pageErrors: errors, screenshot: OUT,
}, null, 2));
