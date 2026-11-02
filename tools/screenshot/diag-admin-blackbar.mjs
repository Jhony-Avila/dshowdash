// READ-ONLY: reproduz item ATIVO do grupo ADMIN (Gestão Sessões) e checa a barra preta.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/#/admin/sessoes', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1800);
if (await isLoginPage(page)) { await loginViaPage(page); await page.goto('https://dshowdash.com.br/#/admin/sessoes', { waitUntil: 'domcontentloaded' }); }
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// expandir grupos p/ garantir item admin visível + clicar nele
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch(e){} }));
await page.waitForTimeout(1000);
await page.evaluate(() => { const a = document.querySelector('a[data-panel="panel-session-admin"], a[href*="admin/sessoes"]'); if (a) a.click(); });
await page.waitForTimeout(1500);

async function probe(themeWanted) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i=0;i<3&&c!==themeWanted;i++){ await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c=await page.evaluate(()=>document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(500);
  return await page.evaluate(() => {
    const item = [...document.querySelectorAll('.dsd-sidebar [data-section-id="sidebar.grp-admin"] .dsd-sidebar__item--active')].find(e=>e.getBoundingClientRect().height>4)
              || [...document.querySelectorAll('.dsd-sidebar__item--active')].find(e=>/sess|usu/i.test(e.textContent||''));
    if (!item) return { err: 'sem item admin ativo', actives: [...document.querySelectorAll('.dsd-sidebar__item--active')].map(e=>e.textContent.trim().slice(0,20)) };
    const link = item.querySelector('.dsd-sidebar__link') || item;
    const lr = link.getBoundingClientRect();
    const out = { theme: document.documentElement.getAttribute('data-theme'), text: item.textContent.trim().slice(0,20), linkRect:{x:Math.round(lr.x),y:Math.round(lr.y),w:Math.round(lr.width),h:Math.round(lr.height)}, ps: {} };
    for (const p of ['::before','::after']) {
      const cs = getComputedStyle(link, p);
      out.ps[p] = { content: cs.content, vis: cs.visibility, opacity: cs.opacity, display: cs.display, bg: cs.backgroundColor, borderTop: cs.borderTopWidth+' '+cs.borderTopColor, w: cs.width, h: cs.height, top: cs.top, bottom: cs.bottom, left: cs.left, transform: cs.transform, radius: cs.borderTopLeftRadius, z: cs.zIndex };
    }
    return out;
  });
}

const dark = await probe('dark');
const light = await probe('light');
console.log('DARK  ', JSON.stringify(dark));
console.log('LIGHT ', JSON.stringify(light));
// rolar item admin p/ dentro do viewport e screenshot ampliado (tema atual = light)
let shot = 'sem box';
try {
  await page.evaluate(() => {
    const item = [...document.querySelectorAll('.dsd-sidebar [data-section-id="sidebar.grp-admin"] .dsd-sidebar__item--active')].find(e=>e.getBoundingClientRect().height>4) || [...document.querySelectorAll('.dsd-sidebar__item--active')].find(e=>/sess|usu/i.test(e.textContent||''));
    if (item) item.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  const box = await page.evaluate(() => {
    const item = [...document.querySelectorAll('.dsd-sidebar [data-section-id="sidebar.grp-admin"] .dsd-sidebar__item--active')].find(e=>e.getBoundingClientRect().height>4) || [...document.querySelectorAll('.dsd-sidebar__item--active')].find(e=>/sess|usu/i.test(e.textContent||''));
    if (!item) return null;
    const r = (item.querySelector('.dsd-sidebar__link')||item).getBoundingClientRect();
    if (r.y < 0 || r.y > 950) return null;
    return { x: Math.max(0,r.x-12), y: Math.max(0,r.y-24), width: Math.min(340, r.width+48), height: r.height+48 };
  });
  if (box) { await page.screenshot({ path: '/var/www/dshowdash/tools/screenshot/out-admin-blackbar.png', clip: box }); shot = 'ok'; }
} catch (e) { shot = 'erro:' + e.message.slice(0,40); }
await browser.close();
console.log('shot  ', shot);
