// READ-ONLY: varredura AMPLA @1920 do item ativo — todos elementos que cruzam a borda superior.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

// expandir grupos + ativar Oportunidades
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch(e){} }));
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const links = [...document.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__item a')];
  const alvo = links.find(l => /oportunidad/i.test(l.textContent || ''));
  if (alvo) alvo.click();
});
await page.waitForTimeout(1200);

const res = await page.evaluate(() => {
  const isDark = (rgb) => { const m = (rgb||'').match(/[\d.]+/g); if (!m) return false; const [r,g,b,a='1']=m; return (+r<80&&+g<80&&+b<80&&+a>0.35); };
  const item = [...document.querySelectorAll('.dsd-sidebar__item--active')].find(el => el.getBoundingClientRect().height > 4);
  if (!item) return { error: 'sem item ativo' };
  const link = item.querySelector('.dsd-sidebar__link') || item;
  const lr = link.getBoundingClientRect();
  const topBand = { yMin: lr.top - 16, yMax: lr.top + 14 };
  const hits = [];
  // TODOS os elementos da sidebar cujo rect cruza a faixa da borda superior do link ativo
  document.querySelectorAll('.dsd-sidebar *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 2) return;
    const crossesTop = r.top <= topBand.yMax && r.bottom >= topBand.yMin;
    const horizontalOverlap = r.right > lr.left && r.left < lr.right;
    if (!(crossesTop && horizontalOverlap)) return;
    const cs = getComputedStyle(el);
    const darkBg = isDark(cs.backgroundColor);
    const darkBorder = isDark(cs.borderTopColor) && cs.borderTopWidth !== '0px';
    const darkShadow = /rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(cs.boxShadow) && cs.boxShadow !== 'none';
    if (darkBg || darkBorder) {
      hits.push({ cls: (el.className||'').toString().slice(0,45), tag: el.tagName, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, bTop: `${cs.borderTopWidth} ${cs.borderTopColor}`, radius: cs.borderTopLeftRadius, z: cs.zIndex, pos: cs.position });
    }
  });
  // pseudo-elementos de item, link, e ancestrais próximos
  const pse = [];
  let node = link; let depth = 0;
  while (node && depth < 4) {
    for (const p of ['::before','::after']) {
      const cs = getComputedStyle(node, p);
      if (cs.content && cs.content !== 'none' && (isDark(cs.backgroundColor) || /rgb\(0|#000|0,\s*0,\s*0/.test(cs.backgroundImage))) {
        pse.push({ host: (node.className||'').toString().slice(0,40), p, bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,50), w: cs.width, h: cs.height, top: cs.top, left: cs.left, transform: cs.transform });
      }
    }
    node = node.parentElement; depth++;
  }
  return { activeText: (item.textContent||'').trim().slice(0,25), linkRect: {x:Math.round(lr.x),y:Math.round(lr.y),w:Math.round(lr.width),h:Math.round(lr.height)}, topBand, darkHits: hits, darkPseudos: pse };
});

// screenshot ampliado da borda superior do item ativo
const box = await page.evaluate(() => {
  const item = [...document.querySelectorAll('.dsd-sidebar__item--active')].find(el => el.getBoundingClientRect().height > 4);
  const r = (item.querySelector('.dsd-sidebar__link')||item).getBoundingClientRect();
  return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 20), width: Math.min(320, r.width + 40), height: r.height + 40 };
});
await page.screenshot({ path: '/var/www/dshowdash/tools/screenshot/out-blackbar-zoom.png', clip: box });
await browser.close();
console.log(JSON.stringify(res, null, 2));
