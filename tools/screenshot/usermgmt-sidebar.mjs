import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';

async function run(theme) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t)=>{ try{ localStorage.setItem('cm_theme',t);}catch(e){} }, theme);
  const page = await ctx.newPage();
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(3500);
    if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }
    // expande grupo Administração
    const exp = await page.evaluate(() => {
      const grp = Array.from(document.querySelectorAll('.dsd-sidebar__section, [data-section-id]')).find(s => /administra/i.test(s.textContent));
      if (grp) { const h = grp.querySelector('.dsd-sidebar__section-header, [role="button"], button, a') || grp; h.click(); return 'exp'; }
      return 'no-grp';
    });
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => {
      const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => /usu[aá]rio/i.test(x.textContent));
      if (!li) return { found:false };
      li.scrollIntoView({ block:'center' });
      const r = li.getBoundingClientRect();
      const icon = li.querySelector('.dsd-sidebar__item-icon');
      const before = getComputedStyle(li.querySelector('.dsd-sidebar__link')||li, '::before');
      return { found:true, rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, dataIcon: icon?.getAttribute('data-icon'), iconTag: icon?.firstElementChild?.tagName, beforeBg: before.backgroundColor, beforeContent: before.content, text: li.textContent.trim().slice(0,30) };
    });
    console.log(theme.toUpperCase(), 'exp='+exp, JSON.stringify(info));
    await page.waitForTimeout(400);
    // screenshot recortado da sidebar
    const sb = await page.$('.dsd-sidebar, #sidebar');
    if (sb) await sb.screenshot({ path: `${OUT}/uv-sidebar-${theme}.png` });
    else await page.screenshot({ path: `${OUT}/uv-sidebar-${theme}.png`, clip:{x:0,y:90,width:300,height:810} });
  } catch (e) { console.log(theme, 'FAIL', e.message); } finally { await browser.close(); }
}
await run('dark');
await run('light');
