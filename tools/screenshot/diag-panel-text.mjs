// READ-ONLY: mede cor computada + estilo inline dos textos do panel-dashboard (#/docs) em dark e light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// navega ao panel-dashboard via rota #/docs
await page.evaluate(() => { location.hash = '#/docs'; });
await page.waitForTimeout(3500);
const present = await page.locator('text="Dashboard - Painel de Teste"').count();

const setTheme = async (t) => { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 3 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(650); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } };
const measure = () => page.evaluate(() => {
  const byText = (txt, tag) => { const els = Array.from(document.querySelectorAll(tag || '*')); const el = els.find(e => (e.childNodes.length && Array.from(e.childNodes).some(n => n.nodeType === 3 && n.textContent.includes(txt)))); if (!el) return 'not-found'; const cs = getComputedStyle(el); return { computedColor: cs.color, inlineColor: el.style.color || '(none)', tag: el.tagName }; };
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    title: byText('Painel de Teste', 'h2'),
    subtitle: byText('componente Main', 'p'),
    cardLabel_SistemaOK: byText('Sistema OK', 'div'),
    json_pre: (() => { const p = document.querySelector('pre'); return p ? { computedColor: getComputedStyle(p).color, inlineColor: p.style.color || '(none)' } : 'no-pre'; })(),
  };
});

let dark = 'panel-not-open', light = 'panel-not-open';
if (present) {
  await setTheme('dark'); await page.waitForTimeout(400); dark = await measure();
  await page.screenshot({ path: DIR + 'panel-text-dark.png' });
  await setTheme('light'); await page.waitForTimeout(400); light = await measure();
  await page.screenshot({ path: DIR + 'panel-text-light.png' });
}
await browser.close();
console.log(JSON.stringify({ panelPresent: !!present, dark, light }, null, 2));
