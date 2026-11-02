// READ-ONLY: mede a COR do ícone (svg) no repouso vs hover — navrail x footer, dark+light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 15000 });
await page.waitForTimeout(2500);

const setTheme = async (t) => {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  return c;
};

// lê cor do svg (e do botão) para o 1º elemento que casar o seletor
const readColor = async (btnSel, svgSel) => page.evaluate(([bs, ss]) => {
  const btn = document.querySelector(bs);
  if (!btn) return { missing: bs };
  const svg = btn.querySelector(ss) || btn.querySelector('svg');
  const bc = getComputedStyle(btn);
  const sc = svg ? getComputedStyle(svg) : null;
  return {
    btnColor: bc.color,
    svgColor: sc ? sc.color : null,
    svgStroke: sc ? sc.stroke : null,
    svgOpacity: sc ? sc.opacity : null,
  };
}, [btnSel, svgSel]);

const out = {};
for (const theme of ['dark', 'light']) {
  await setTheme(theme);
  await page.waitForTimeout(400);
  await page.evaluate(() => { const f = document.querySelector('.dsd-footer'); if (f) f.scrollIntoView({ block: 'end' }); });
  await page.waitForTimeout(300);

  // navrail
  const navRest = await readColor('.navrail-btn', '.navrail-btn__icon svg');
  await page.hover('.navrail-btn').catch(() => {});
  await page.waitForTimeout(350);
  const navHover = await readColor('.navrail-btn', '.navrail-btn__icon svg');

  // footer
  await page.mouse.move(5, 5); await page.waitForTimeout(200);
  const footRest = await readColor('.footer-icon-host', 'svg');
  await page.hover('.footer-icon-host').catch(() => {});
  await page.waitForTimeout(350);
  const footHover = await readColor('.footer-icon-host', 'svg');

  out[theme] = { navRest, navHover, footRest, footHover };
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
