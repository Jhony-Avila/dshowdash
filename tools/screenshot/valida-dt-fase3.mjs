// valida-dt-fase3.mjs — URL limpa em segmentos (Fase 3).
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
const goto=async(h)=>{await page.goto('https://dshowdash.com.br/'+h,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});await page.waitForTimeout(2600);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/'+h).catch(()=>{});await page.waitForTimeout(2600);}
  await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});await page.waitForTimeout(2400);};
const rota=()=>page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));
const hash=()=>page.evaluate(()=>location.hash);
const R={};

// 1) DEEP-LINK em segmentos
await goto('#/panel-datatables/observability/alerts');
R.deeplinkSegmento={hash:await hash(),rota:await rota(),montou:await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]'))};

// 2) DEEP-LINK tela profunda (tabelas)
await goto('#/panel-datatables/data/tables');
R.deeplinkTabelas={hash:await hash(),rota:await rota(),linhas:await page.evaluate(()=>document.querySelectorAll('[role="row"]').length)};

// 3) CLIQUE interno: a URL vira segmento e SOBREVIVE?
await page.click('[data-dt-react-root] >> text=Observabilidade').catch(()=>{});
await page.waitForTimeout(900);
await page.click('[data-dt-react-root] >> text=Qualidade').catch(()=>{});
await page.waitForTimeout(2200);
R.aposClique={hash:await hash(),rota:await rota()};
await page.waitForTimeout(600);
R.hashPersistiu=await hash();  // relê depois de 600ms: shell reescreveu?

// 4) VOLTAR (back) volta para tables?
await page.goBack().catch(()=>{});
await page.waitForTimeout(1800);
R.voltar={hash:await hash(),rota:await rota()};

// 5) LEGADO ?route= ainda lê?
await goto('#/panel-datatables?route=infrastructure/connections');
R.legado={hash:await hash(),rota:await rota()};

// 6) BARE cai em overview
await goto('#/panel-datatables');
R.bare={hash:await hash(),rota:await rota()};

R.errosJs=errors;
await page.screenshot({path:`${OUT}/dt-fase3-qualidade.png`}).catch(()=>{});
console.log(JSON.stringify(R,null,2));
await browser.close();
