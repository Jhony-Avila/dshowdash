// valida-dt-38.mjs — telas secundarias do §38: infraestrutura, dependencias, manutencoes.
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
  const abas=await page.evaluate(()=>[...document.querySelectorAll('.dt-tab')].map(t=>t.textContent.trim()));

  // INFRAESTRUTURA
  await page.click('.dt-tab[data-tab="infra"]').catch(()=>{});
  await page.waitForTimeout(2600);
  const infra=await page.evaluate(()=>({
    secoes:[...document.querySelectorAll('.dt-section__title')].map(x=>x.textContent.trim()),
    nosArvore:document.querySelectorAll('.dt-tree__row').length,
    temBotaoVerTabelas:!!document.querySelector('[data-dt-dbtables]'),
    srvVazio:(document.querySelector('.dt-state')||{}).textContent?.trim().slice(0,60)||''}));
  // expandir tabelas do banco
  await page.click('[data-dt-dbtables]').catch(()=>{});
  await page.waitForTimeout(2200);
  const exp=await page.evaluate(()=>({
    tabelasNaArvore:document.querySelectorAll('.dt-tree__row--tbl').length,
    textoBotao:(document.querySelector('[data-dt-dbtables]')||{}).textContent?.trim()}));
  await page.screenshot({path:`${OUT}/dt-${theme}-9-infra.png`}).catch(()=>{});
  // clicar numa tabela da arvore abre detalhe
  await page.click('.dt-tree__row--tbl').catch(()=>{});
  await page.waitForTimeout(2400);
  const detalheDaArvore=await page.evaluate(()=>!!document.querySelector('[data-dt-back]'));
  // voltar deve ir para INFRA, nao para tables
  await page.click('[data-dt-back]').catch(()=>{});
  await page.waitForTimeout(1800);
  const voltouPara=await page.evaluate(()=>{const a=document.querySelector('.dt-tab[aria-selected="true"]');return a?a.dataset.tab:'?';});

  // DEPENDENCIAS
  await page.click('.dt-tab[data-tab="deps"]').catch(()=>{});
  await page.waitForTimeout(2400);
  const deps=await page.evaluate(()=>({
    kpis:[...document.querySelectorAll('.dt-kpi')].map(k=>((k.querySelector('.dt-kpi__label')||{}).textContent||'')+'='+((k.querySelector('.dt-kpi__value')||{}).textContent||'')),
    secoes:[...document.querySelectorAll('.dt-section__title')].map(x=>x.textContent.trim()),
    linhas:document.querySelectorAll('.dt-table tbody tr').length,
    topRef:(document.querySelector('.dt-table tbody tr')||{}).textContent?.replace(/\s+/g,' ').trim().slice(0,60)}));
  await page.screenshot({path:`${OUT}/dt-${theme}-10-deps.png`}).catch(()=>{});

  // MANUTENCOES
  await page.click('.dt-tab[data-tab="maint"]').catch(()=>{});
  await page.waitForTimeout(2000);
  const maint=await page.evaluate(()=>({
    secoes:[...document.querySelectorAll('.dt-section__title')].map(x=>x.textContent.trim()),
    estados:[...document.querySelectorAll('.dt-state')].map(x=>x.textContent.trim().slice(0,45))}));
  await page.screenshot({path:`${OUT}/dt-${theme}-11-maint.png`}).catch(()=>{});

  await ctx.close();
  return {theme,abas,infra,exp,detalheDaArvore,voltouPara,deps,maint,errors};
}
const dark=await run('dark'); const light=await run('light');
await browser.close();
console.log(JSON.stringify({dark,light},null,2));
