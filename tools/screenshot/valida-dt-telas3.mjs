// valida-dt-telas3.mjs — Servidores, Sensíveis, Busca, Alertas, Manutenções,
// Integrações, Administração (React), dark + light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const R={};
for (const theme of ['dark','light']) {
  const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:theme,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.setItem('dt_force_impl','react');}catch(e){}},theme);
  const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,180)));
  page.on('response',r=>{if(r.url().includes('/api/datatables')&&r.status()>=400)errors.push('API '+r.status()+' '+r.url().split('/api')[1].split('?')[0]);});
  const ir=async(rota)=>{
    await page.goto('https://dshowdash.com.br/#/panel-datatables?route='+rota,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
    await page.waitForTimeout(2800);
    if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables?route='+rota).catch(()=>{});await page.waitForTimeout(2800);}
    await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
    await page.waitForTimeout(2600);
  };
  const nm=()=>page.evaluate(()=>document.body.textContent.includes('ainda não foi migrada'));
  const txt=(s)=>page.evaluate((s)=>document.body.textContent.includes(s),s);
  R[theme]={};

  await ir('infrastructure/servers');
  R[theme].servidores={naoMigrada:await nm(),cards:await page.evaluate(()=>document.querySelectorAll('article').length),temMetric:await txt('Servidores')};
  await page.screenshot({path:`${OUT}/dt3-servidores-${theme}.png`}).catch(()=>{});

  await ir('data/sensitive');
  R[theme].sensiveis={naoMigrada:await nm(),avisoMetadado:await txt('Classificação por metadado'),chips:await page.evaluate(()=>document.querySelectorAll('[class*="chip"]').length),linhas:await page.evaluate(()=>document.querySelectorAll('[role="row"]').length)};
  await page.screenshot({path:`${OUT}/dt3-sensiveis-${theme}.png`}).catch(()=>{});

  await ir('data/search');
  const inp=await page.$('input[type="search"]');
  if(inp){await inp.fill('user');await page.waitForTimeout(2600);}
  R[theme].busca={naoMigrada:await nm(),temInput:!!inp,temResultado:await page.evaluate(()=>/resultado\(s\)/.test(document.body.textContent||''))};
  await page.screenshot({path:`${OUT}/dt3-busca-${theme}.png`}).catch(()=>{});

  await ir('observability/alerts');
  R[theme].alertas={naoMigrada:await nm(),cards:await page.evaluate(()=>document.querySelectorAll('[class*="cartao"]').length),filtros:await page.evaluate(()=>document.querySelectorAll('[role="tab"]').length),grid:await page.evaluate(()=>document.querySelectorAll('[role="table"]').length)};
  await page.screenshot({path:`${OUT}/dt3-alertas-${theme}.png`}).catch(()=>{});

  await ir('observability/maintenance');
  R[theme].manutencoes={naoMigrada:await nm(),nota:await txt('não conta como indisponibilidade')};
  await page.screenshot({path:`${OUT}/dt3-manutencoes-${theme}.png`}).catch(()=>{});

  await ir('sources/integrations');
  R[theme].integracoes={naoMigrada:await nm(),avisoCred:await txt('credencial expirada')};
  await page.screenshot({path:`${OUT}/dt3-integracoes-${theme}.png`}).catch(()=>{});

  await ir('admin/settings');
  R[theme].administracao={naoMigrada:await nm(),canais:await txt('Canais de alerta'),entregaWarn:await txt('NÃO entrega ainda'),cron:await txt('Frequências das rotinas'),tabelas:await page.evaluate(()=>document.querySelectorAll('table').length)};
  await page.screenshot({path:`${OUT}/dt3-admin-${theme}.png`,fullPage:true}).catch(()=>{});

  R[theme].errosJs=errors;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R,null,2));
