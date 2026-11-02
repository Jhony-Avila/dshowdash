// READ-ONLY: item admin ativo COM FOCO — prova visual da barra (tooltip arrow vazado).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/#/admin/sessoes', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1800);
if (await isLoginPage(page)) { await loginViaPage(page); await page.goto('https://dshowdash.com.br/#/admin/sessoes'); }
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);
// garantir LIGHT (como o print do usuário)
let c = await page.evaluate(()=>document.documentElement.getAttribute('data-theme'));
for (let i=0;i<3&&c!=='light';i++){ await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(600); c=await page.evaluate(()=>document.documentElement.getAttribute('data-theme')); }
// expandir grupos, achar link admin ativo, rolar p/ dentro, FOCAR
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch(e){} }));
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const a = document.querySelector('.dsd-sidebar [data-section-id="sidebar.grp-admin"] .dsd-sidebar__item--active .dsd-sidebar__link')
         || document.querySelector('a[data-panel="panel-session-admin"]');
  if (!a) return { err: 'sem link admin' };
  a.scrollIntoView({ block: 'center' });
  a.focus();
  const cs = getComputedStyle(a, '::before');
  return { vis: cs.visibility, opacity: cs.opacity, bg: cs.backgroundColor, borderTop: cs.borderTopWidth+' '+cs.borderTopColor, w: cs.width, h: cs.height, top: cs.top };
});
await page.waitForTimeout(400);
let shot = 'sem box';
try {
  const box = await page.evaluate(() => {
    const a = document.querySelector('.dsd-sidebar [data-section-id="sidebar.grp-admin"] .dsd-sidebar__item--active .dsd-sidebar__link') || document.querySelector('a[data-panel="panel-session-admin"]');
    const r = a.getBoundingClientRect();
    if (r.y < 0 || r.y > 960) return null;
    return { x: Math.max(0,r.x-14), y: Math.max(0,r.y-26), width: Math.min(340, r.width+52), height: r.height+52 };
  });
  if (box) { await page.screenshot({ path: '/var/www/dshowdash/tools/screenshot/out-admin-focus.png', clip: box }); shot='ok'; }
} catch (e) { shot = 'erro:'+e.message.slice(0,40); }
await browser.close();
console.log('FOCO ::before ->', JSON.stringify(info));
console.log('shot ->', shot);
