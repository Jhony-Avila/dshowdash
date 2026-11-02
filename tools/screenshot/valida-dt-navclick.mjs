// Navegação REAL: monta uma vez e clica nas abas internas (sem page.goto).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
await ctx.addCookies(cookies);
await ctx.addInitScript(()=>{try{localStorage.setItem('cm_theme','dark');localStorage.setItem('dt_force_impl','react');}catch(e){}});
const page=await ctx.newPage(); const errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
await page.goto('https://dshowdash.com.br/#/panel-datatables?route=infrastructure/servers',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(2600);
if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables?route=infrastructure/servers').catch(()=>{});await page.waitForTimeout(2600);}
await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(2600);

const headerStyled=async()=>page.evaluate(()=>{
  const nav=[...document.querySelectorAll('[data-dt-react-root] *')].find(el=>/Observabilidade/.test(el.textContent||'')&&el.children.length);
  // trilha horizontal? medir se breadcrumb está em linha (flex)
  const trilha=document.querySelector('[data-dt-react-root] nav[aria-label="Caminho"]');
  const disp=trilha?getComputedStyle(trilha).display:'none';
  const tabs=document.querySelectorAll('[data-dt-react-root] [role="tab"]').length;
  return {trilhaDisplay:disp, tabs};
});

const R={inicial:await headerStyled()};
// clicar aba de topo "Observabilidade" e depois "Alertas" internamente
await page.click('[data-dt-react-root] >> text=Observabilidade').catch(()=>{});
await page.waitForTimeout(1200);
await page.click('[data-dt-react-root] >> text=Alertas').catch(()=>{});
await page.waitForTimeout(2400);
R.aposClique=await headerStyled();
R.rotaAtual=await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));
R.errosJs=errors;
await page.screenshot({path:`${OUT}/dt-navclick-alertas.png`}).catch(()=>{});
console.log(JSON.stringify(R,null,2));
await browser.close();
