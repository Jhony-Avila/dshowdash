// READ-ONLY: hover 1 botão navrail e 1 do footer (dark), captura ampliada + mede fundo.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 3, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 15000 });
await page.waitForTimeout(2500);

const measure = async (sel) => page.evaluate((s) => {
  const el = document.querySelector(s); if (!el) return { missing: s };
  const cs = getComputedStyle(el);
  return { bgImage: cs.backgroundImage, bgColor: cs.backgroundColor, border: cs.borderTopColor, boxShadow: cs.boxShadow, color: cs.color, borderRadius: cs.borderRadius, width: cs.width, height: cs.height };
}, sel);

// captura o botão + margem (p/ enxergar o glow) via bounding box expandido
const shotPadded = async (sel, name, pad = 24) => {
  const el = await page.$(sel); if (!el) { console.log('sem', sel); return; }
  const b = await el.boundingBox();
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } });
  console.log('salvo', name);
};

// garante DARK
let t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
for (let i = 0; i < 4 && t !== 'dark'; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); t = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
console.log('theme=', t);

// NAVRAIL — hover no 2º botão (o 1º pode ser especial)
const navSel = '.navrail-btn';
await page.hover(navSel).catch(() => {});
await page.waitForTimeout(400);
console.log('NAV hover:', JSON.stringify(await measure(navSel)));
await shotPadded(navSel, 'sbs-navrail-hover-dark');

// FOOTER — scroll + hover
await page.evaluate(() => { const f = document.querySelector('.dsd-footer'); if (f) f.scrollIntoView({ block: 'end' }); });
await page.waitForTimeout(300);
const footSel = '.footer-icon-host';
await page.hover(footSel).catch(() => {});
await page.waitForTimeout(400);
console.log('FOOT hover:', JSON.stringify(await measure(footSel)));
await shotPadded(footSel, 'sbs-footer-hover-dark');

await browser.close();
