// READ-ONLY: reproduz item ativo em grupos (Oportunidades / Gestão Usuários), screenshot + medição.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2500);

// expandir todos os grupos
await page.evaluate(() => {
  document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch(e){} });
});
await page.waitForTimeout(1200);

// tentar ativar "Oportunidades" (clicar no link com esse texto)
const clicked = await page.evaluate(() => {
  const links = [...document.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__item a, .dsd-sidebar__item button')];
  const alvo = links.find(l => /oportunidad/i.test(l.textContent || ''));
  if (alvo) { alvo.click(); return alvo.textContent.trim().slice(0,30); }
  return null;
});
await page.waitForTimeout(1500);

// forçar classe ativa em Oportunidades caso o clique nao roteie, para medir o visual do estado
await page.evaluate(() => {
  const links = [...document.querySelectorAll('.dsd-sidebar__item')];
  const alvo = links.find(l => /oportunidad/i.test(l.textContent || ''));
  if (alvo && !alvo.classList.contains('dsd-sidebar__item--active')) alvo.classList.add('dsd-sidebar__item--active');
});
await page.waitForTimeout(400);

const measure = await page.evaluate(() => {
  const isDark = (rgb) => { const m = (rgb||'').match(/[\d.]+/g); if (!m) return false; const [r,g,b,a='1']=m; return (+r<70&&+g<70&&+b<70&&+a>0.4); };
  const out = [];
  document.querySelectorAll('.dsd-sidebar__item--active').forEach(item => {
    const link = item.querySelector('.dsd-sidebar__link') || item;
    const lr = link.getBoundingClientRect();
    if (lr.height < 4) return;
    const entry = { text: (item.textContent||'').trim().slice(0,25), linkRect: {x:Math.round(lr.x),y:Math.round(lr.y),w:Math.round(lr.width),h:Math.round(lr.height)}, pseudos: [], darkKids: [] };
    for (const host of [item, link]) for (const p of ['::before','::after']) {
      const cs = getComputedStyle(host, p);
      if (cs.content && cs.content !== 'none') entry.pseudos.push({ host: host.className.replace('dsd-sidebar__',''), p, content: cs.content, bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,45), w: cs.width, h: cs.height, top: cs.top, left: cs.left, transform: cs.transform });
    }
    link.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if ((isDark(cs.backgroundColor) || isDark(cs.borderTopColor)) && r.width>10 && r.height>2)
        entry.darkKids.push({ cls:(el.className||'').toString().slice(0,40), x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height), bg:cs.backgroundColor });
    });
    out.push(entry);
  });
  return out;
});

await page.screenshot({ path: '/var/www/dshowdash/tools/screenshot/out-sidebar-blackbar.png', clip: { x:0, y:120, width:340, height:800 } });
await browser.close();
console.log('clicked=', clicked);
console.log(JSON.stringify(measure, null, 2));
