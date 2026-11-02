// READ-ONLY: prova que os botões do FOOTER (.footer-icon-host) adotaram os efeitos
// de interação da NAVRAIL (.navrail-btn) via padrão compartilhado nav-button-fx.css.
// Compara getComputedStyle no HOVER REAL (footer vs navrail) e captura DARK+LIGHT.
// Usa origin (host-resolver MAP -> 127.0.0.1) p/ bytes frescos do nginx (bypass CF).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
    '--ignore-certificate-errors',
  ],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { console.log('cookie auth falhou, tentarei form:', e.message); }
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 15000 });
await page.waitForTimeout(2500);

const FOOT = '.footer-icon-host';
const NAV = '.navrail-btn';

const setTheme = async (t) => {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]');
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
};

const readState = async (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return { missing: true, sel: s };
  const cs = getComputedStyle(el);
  return {
    transition: cs.transitionProperty + ' | ' + cs.transitionDuration,
    boxShadow: cs.boxShadow,
    borderColor: cs.borderTopColor,
    transform: cs.transform,
  };
}, sel);

const report = {};
for (const theme of ['dark', 'light']) {
  const applied = await setTheme(theme);
  await page.waitForTimeout(500);

  // garante footer visível
  await page.evaluate(() => { const f = document.querySelector('.dsd-footer'); if (f) f.scrollIntoView({ block: 'end' }); });
  await page.waitForTimeout(300);

  const footRest = await readState(FOOT);

  // HOVER REAL no primeiro ícone do footer -> lê estilos de :hover
  await page.hover(FOOT).catch(() => {});
  await page.waitForTimeout(400);
  const footHover = await readState(FOOT);

  // referência navrail no hover
  await page.hover(NAV).catch(() => {});
  await page.waitForTimeout(400);
  const navHover = await readState(NAV);

  report[theme] = { footRest, footHover, navHover };

  // capturas visuais
  await page.hover(FOOT).catch(() => {});
  await page.waitForTimeout(400);
  const foot = await page.$('.dsd-footer');
  if (foot) { await foot.screenshot({ path: `${OUT}/navfx-footer-${theme}-hover.png` }); console.log('salvo footer', theme); }
  const nav = await page.$('.nav-rail');
  if (nav) { await nav.screenshot({ path: `${OUT}/navfx-navrail-${theme}.png` }); console.log('salvo navrail', theme); }
  console.log(`themeAplicado=${applied}`);
}

console.log('\n===== PROVA getComputedStyle =====');
console.log(JSON.stringify(report, null, 2));
await browser.close();
