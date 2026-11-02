// READ-ONLY: mede background/box-shadow computados dos widgets do header no LIGHT + versão do CSS carregado.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

const setTheme = async (t) => {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 3 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]');
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
};

const measure = () => page.evaluate(() => {
  const out = {
    theme: document.documentElement.getAttribute('data-theme'),
    htmlClass: document.documentElement.className,
  };
  // versão do CSS carregado
  out.lightTotalHref = Array.from(document.querySelectorAll('link[rel=stylesheet]'))
    .map(l => l.href).filter(h => h.includes('theme.light-total')).join(' | ') || 'NAO CARREGADO';

  const sample = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false };
    const cs = getComputedStyle(el);
    return {
      sel, found: true,
      inSiteHeader: !!el.closest('.site-header'),
      parentHeaderClass: (el.closest('.site-header') ? 'site-header' : (el.closest('[class*=header]')?.className || 'NENHUM')),
      background: cs.backgroundColor,
      backgroundImage: cs.backgroundImage.slice(0, 60),
      boxShadow: cs.boxShadow.slice(0, 90),
    };
  };
  out.email    = sample('.email-integration-component');
  out.whatsapp = sample('.whatsapp-integration-component');
  out.usdBrl   = sample('.currency-usd-brl-component');
  out.btc      = sample('.currency-btc-component');
  out.clock    = sample('.real-time-clock-component');

  // todos os -component dentro do header
  out.allComponents = Array.from(document.querySelectorAll('.site-header [class$="-component"]')).map(el => {
    const cs = getComputedStyle(el);
    return { cls: el.className, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 50) };
  });
  return out;
});

await setTheme('dark'); await page.waitForTimeout(500);
const dark = await measure();
await setTheme('light'); await page.waitForTimeout(500);
const light = await measure();
await browser.close();
const pick = (m) => ({ theme: m.theme, ver: m.lightTotalHref.split('?').pop(),
  email: { bg: m.email.background, sh: m.email.boxShadow },
  usdBrl: { bg: m.usdBrl.background, sh: m.usdBrl.boxShadow },
  clock: { bg: m.clock.background, sh: m.clock.boxShadow } });
console.log('DARK :', JSON.stringify(pick(dark)));
console.log('LIGHT:', JSON.stringify(pick(light)));
