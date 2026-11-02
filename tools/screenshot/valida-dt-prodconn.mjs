import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
await ctx.addCookies(cookies);
await ctx.addInitScript(()=>{try{localStorage.setItem('cm_theme','dark');localStorage.removeItem('dt_force_impl');}catch(e){}});
const page=await ctx.newPage(); const errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
await page.goto('https://dshowdash.com.br/#/panel-datatables/infrastructure/connections',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(2800);
if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables/infrastructure/connections').catch(()=>{});await page.waitForTimeout(2800);}
await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(2400);
const R={
  temNomeProd: await page.evaluate(()=>document.body.textContent.includes('DSHOWDASH (Produção)')),
  aindaSandbox: await page.evaluate(()=>document.body.textContent.includes('SANDBOX')),
  temBadgeProd: await page.evaluate(()=>document.body.textContent.includes('Produção')),
  online: await page.evaluate(()=>/Online|online/.test(document.body.textContent||'')),
  errosJs: errors,
};
await page.screenshot({path:`${OUT}/dt-prodconn.png`}).catch(()=>{});
console.log(JSON.stringify(R,null,2));
await browser.close();
