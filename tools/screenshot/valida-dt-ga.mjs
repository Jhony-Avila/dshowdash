// valida-dt-ga.mjs — pós-remoção do legado: React deve montar SEM override local,
// via flag 100%. Também confirma que legacy.js e panel.css saíram (404).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
await ctx.addCookies(cookies);
// SEM dt_force_impl — depende só da flag 100% (como um usuário comum).
await ctx.addInitScript(()=>{try{localStorage.setItem('cm_theme','dark');localStorage.removeItem('dt_force_impl');}catch(e){}});
const page=await ctx.newPage(); const errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
await page.goto('https://dshowdash.com.br/#/panel-datatables/observability/quality',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(3000);
if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables/observability/quality').catch(()=>{});await page.waitForTimeout(3000);}
await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(2600);
const R={};
R.reactMontou = await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]'));
R.rota = await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));
R.temGauge = await page.evaluate(()=>!!document.querySelector('[class*="Gauge"],[class*="gauge"]'));
// navega para conexões e confirma a escrita presente (Nova conexão)
await page.click('[data-dt-react-root] >> text=Infraestrutura').catch(()=>{});
await page.waitForTimeout(800);
await page.click('[data-dt-react-root] >> text=Conexões').catch(()=>{});
await page.waitForTimeout(2000);
R.temBotaoNova = await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>/Nova conexão/.test(b.textContent||'')));
// legacy.js e panel.css devem dar 404 agora
const stat=async(p)=>{const r=await page.request.get('https://dshowdash.com.br/components/panels/panel-datatables/'+p).catch(()=>null);return r?r.status():'ERR';};
R.legacy404 = await stat('legacy.js');
R.panelcss404 = await stat('panel.css');
R.indexjs = await stat('index.js');
R.errosJs = errors;
await page.screenshot({path:`${OUT}/dt-ga-quality.png`}).catch(()=>{});
console.log(JSON.stringify(R,null,2));
await browser.close();
