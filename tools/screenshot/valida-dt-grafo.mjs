import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';
const cookies=await getSessionCookies();
async function rodar(tema){
  const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
  const c=await b.newContext({viewport:{width:1500,height:1050},colorScheme:tema,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await c.addCookies(cookies);
  await c.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.setItem('dt_force_impl','react');}catch(e){}},tema);
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await p.goto('https://dshowdash.com.br/#/panel-datatables/data/dependencies',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await p.waitForTimeout(2600);
  if(await isLoginPage(p)){await loginViaPage(p).catch(()=>{});await p.goto('https://dshowdash.com.br/#/panel-datatables/data/dependencies').catch(()=>{});await p.waitForTimeout(2600);}
  await p.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
  await p.waitForTimeout(3800); // grafo lazy + simulação
  const m=await p.evaluate(()=>{const svg=document.querySelector('svg[aria-label*="Grafo"]');return{svg:!!svg,circulos:svg?svg.querySelectorAll('circle').length:0,linhas:svg?svg.querySelectorAll('line').length:0,seletor:!!document.querySelector('select[aria-label*="grafo"]')};});
  await p.screenshot({path:`${OUT}/grafo-${tema}.png`}).catch(()=>{});
  await b.close();
  return {tema,m,errs};
}
const d=await rodar('dark'); const l=await rodar('light');
console.log(JSON.stringify({dark:d,light:l},null,2));
