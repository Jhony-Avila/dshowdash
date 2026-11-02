import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = process.env.ADS_OUT;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 }, deviceScaleFactor: 1.5, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1800);
await page.evaluate(() => { location.hash = '#/panel-ads/visao-geral'; });
await page.waitForSelector('[data-ads-react-root] .ads-shell', { timeout: 30000 });
await page.waitForTimeout(1600);
async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(500); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(400);
  const svg = page.locator('.ads-main svg[aria-label*="Streamgraph"]').first();
  if (await svg.count() > 0) {
    await svg.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    const b = await svg.boundingBox();
    if (b) { await page.screenshot({ path: `${OUT}/stream-card-${t}.png`, clip: { x: Math.max(0, b.x - 16), y: Math.max(0, b.y - 54), width: Math.min(1380, b.width + 32), height: b.height + 70 } }); console.log('cap', t, 'ok'); }
  } else { console.log('svg stream nao encontrado', t); }
}
await browser.close();
