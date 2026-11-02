// valida-sidebar-transito.mjs — confirma o botão "Trânsito" na sidebar e que abre o painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/28fb90a7-db93-4420-a07b-70b677e76c69/scratchpad';
const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, colorScheme:'dark', ignoreHTTPSErrors:true, serviceWorkers:'block' });
await ctx.addCookies(cookies);
await ctx.addInitScript(()=>{try{localStorage.setItem('dshowdash-theme','dark');localStorage.setItem('cm_theme','dark');}catch(e){}});
const page = await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e).slice(0,140)));
await page.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(3000);
if (await isLoginPage(page)) await loginViaPage(page).catch(()=>{});
await page.waitForSelector('.dsd-sidebar',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(2500);

// procura o item "Trânsito" na sidebar
const found = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.dsd-sidebar__item, .dsd-sidebar__link')];
  const hit = items.find(el => /tr[âa]nsito/i.test(el.textContent || ''));
  return hit ? { present:true, text:(hit.textContent||'').trim().slice(0,30), panelId: hit.closest('[data-panel-id]')?.getAttribute('data-panel-id') || hit.getAttribute('data-panel-id') || null } : { present:false, sample: items.slice(0,12).map(i=>(i.textContent||'').trim().slice(0,18)) };
});
await page.screenshot({ path:`${OUT}/sidebar-transito-item.png` }).catch(()=>{});

let clicked=false, panel=false;
if (found.present) {
  // clica no item
  const el = await page.evaluateHandle(() => {
    const items=[...document.querySelectorAll('.dsd-sidebar__item, .dsd-sidebar__link')];
    return items.find(el=>/tr[âa]nsito/i.test(el.textContent||''));
  });
  try { await el.asElement().click(); clicked=true; } catch(e){}
  await page.waitForSelector('.transit-panel',{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(4000);
  panel = await page.evaluate(()=>({ present:!!document.querySelector('.transit-panel'), title:(document.querySelector('.transit-panel .tp-head__title h1')||{}).textContent, hasMap:!!document.querySelector('.leaflet-container'), cards:document.querySelectorAll('.tp-card').length }));
  await page.screenshot({ path:`${OUT}/sidebar-transito-panel.png` }).catch(()=>{});
}
await browser.close();
console.log(JSON.stringify({ found, clicked, panel, errors:errors.slice(0,6) }, null, 2));
