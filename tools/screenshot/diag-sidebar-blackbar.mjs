// READ-ONLY: identifica a BARRA PRETA no topo do item ATIVO da sidebar (ambos temas).
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

async function ensureTheme(target) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 3 && c !== target; i++) { await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(500);
  return c;
}

async function measure() {
  return await page.evaluate(() => {
    const isDark = (rgb) => { const m = (rgb||'').match(/[\d.]+/g); if (!m) return false; const [r, g, b, a = '1'] = m; return (+r < 70 && +g < 70 && +b < 70 && +a > 0.4); };
    // pega o 1o item ativo com dimensões reais
    const items = [...document.querySelectorAll('.dsd-sidebar__item--active')].filter(el => el.getBoundingClientRect().height > 4);
    if (!items.length) return { error: 'nenhum item ativo visivel', total: document.querySelectorAll('.dsd-sidebar__item--active').length };
    const item = items[0];
    const link = item.querySelector('.dsd-sidebar__link') || item;
    const lr = link.getBoundingClientRect();
    const report = { itemClass: item.className, linkRect: { x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height) }, darkNearTop: [], pseudos: [] };
    // pseudo-elementos do link e do item
    for (const host of [item, link, link.querySelector('.dsd-sidebar__item-icon')].filter(Boolean)) {
      for (const p of ['::before', '::after']) {
        const cs = getComputedStyle(host, p);
        if (cs.content && cs.content !== 'none') {
          report.pseudos.push({ host: host.className, pseudo: p, content: cs.content, bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,50), w: cs.width, h: cs.height, top: cs.top, left: cs.left, pos: cs.position, transform: cs.transform, borderRadius: cs.borderRadius });
        }
      }
    }
    // qualquer descendente ESCURO perto do topo do link
    link.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 6 || r.height < 3) return;
      const cs = getComputedStyle(el);
      const dark = isDark(cs.backgroundColor);
      const nearTop = Math.abs(r.top - lr.top) < 14;
      if (dark || (nearTop && r.width > 20 && r.height < 16)) {
        report.darkNearTop.push({ cls: (el.className||'').toString().slice(0,50), tag: el.tagName, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,40), dark });
      }
    });
    return report;
  });
}

const out = {};
out.light = { theme: await ensureTheme('light'), ...(await measure()) };
out.dark = { theme: await ensureTheme('dark'), ...(await measure()) };
await browser.close();
console.log(JSON.stringify(out, null, 2));
