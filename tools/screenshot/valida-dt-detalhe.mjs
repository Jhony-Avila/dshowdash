// valida-dt-detalhe.mjs — prova a tela de detalhe da tabela (§19/§38.8).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
async function run(theme){
  const ctx=await browser.newContext({viewport:{width:1500,height:950},colorScheme:theme,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.setItem('dshowdash-theme',t);}catch(e){}},theme);
  const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
  await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await page.waitForTimeout(3000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{});await page.waitForTimeout(3000);}
  await page.waitForSelector('.dt-root',{timeout:20000}).catch(()=>{});

  await page.click('.dt-tab[data-tab="tables"]').catch(()=>{});
  await page.waitForTimeout(2200);
  // busca app_users, que tem FKs inversas
  await page.fill('[data-dt-search]','app_users').catch(()=>{});
  await page.waitForTimeout(1800);
  const clicavel=await page.evaluate(()=>!!document.querySelector('tr[data-table]'));
  await page.click('tr[data-table]').catch(()=>{});
  await page.waitForTimeout(2600);

  const d=await page.evaluate(()=>{
    const sec=[...document.querySelectorAll('.dt-section__title')].map(x=>x.textContent.trim());
    const counts={};
    document.querySelectorAll('.dt-section').forEach(s=>{
      const t=(s.querySelector('.dt-section__title')||{}).textContent||'';
      counts[t.trim()]=s.querySelectorAll('tbody tr').length; });
    return { titulos:sec, linhas:counts,
      kpis:[...document.querySelectorAll('.dt-kpi')].map(k=>((k.querySelector('.dt-kpi__label')||{}).textContent||'')+'='+((k.querySelector('.dt-kpi__value')||{}).textContent||'')).slice(0,8),
      temVoltar:!!document.querySelector('[data-dt-back]'),
      dims:[...document.querySelectorAll('.dt-env')].map(e=>e.textContent.replace(/\s+/g,' ').trim()) };
  });
  await page.screenshot({path:`${OUT}/dt-${theme}-8-detalhe.png`,fullPage:false}).catch(()=>{});
  // voltar
  await page.click('[data-dt-back]').catch(()=>{});
  await page.waitForTimeout(1800);
  const voltou=await page.evaluate(()=>!!document.querySelector('[data-dt-search]'));
  await ctx.close();
  return {theme,clicavel,...d,voltou,errors};
}
const dark=await run('dark'); const light=await run('light');
await browser.close();
console.log(JSON.stringify({dark,light},null,2));
