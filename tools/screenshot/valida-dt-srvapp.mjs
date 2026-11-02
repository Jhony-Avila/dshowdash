// valida-dt-srvapp.mjs — CRUD de servidores e aplicacoes pela tela.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const ctx=await browser.newContext({viewport:{width:1500,height:950},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
await ctx.addCookies(cookies);
const page=await ctx.newPage(); const errors=[],writes=[]; const log=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
page.on('response',r=>{const m=r.request().method(); if(r.url().includes('/api/datatables')&&m!=='GET') writes.push(`${m} ${r.status()} ${r.url().replace(/^https:\/\/[^/]+/,'')}`);});
page.on('dialog',d=>d.accept());

await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(3000);
if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{});await page.waitForTimeout(3000);}
await page.waitForSelector('.dt-root',{timeout:20000}).catch(()=>{});
await page.click('.dt-tab[data-tab="infra"]').catch(()=>{});
await page.waitForTimeout(2600);
log.push('servidores iniciais: '+await page.evaluate(()=>document.querySelectorAll('[data-dt-editsrv]').length));

// NOVO SERVIDOR
await page.click('[data-dt-newsrv]').catch(()=>{});
await page.waitForTimeout(700);
log.push('form servidor abriu: '+await page.evaluate(()=>!!document.querySelector('[data-s="name"]')));
await page.fill('[data-s="name"]','VPS Homologação').catch(()=>{});
await page.fill('[data-s="hostname"]','homolog.exemplo.com.br').catch(()=>{});
await page.fill('[data-s="ip"]','192.168.10.44').catch(()=>{});
await page.fill('[data-s="provider"]','Hostinger').catch(()=>{});
await page.screenshot({path:`${OUT}/dt-srvapp-1-form.png`}).catch(()=>{});
await page.click('[data-dt-savesrv]').catch(()=>{});
await page.waitForTimeout(3000);
const srv=await page.evaluate(()=>{
  const tr=[...document.querySelectorAll('tbody tr')].find(x=>x.textContent.includes('VPS Homologação'));
  return tr? [...tr.cells].slice(1,6).map(c=>c.textContent.trim()) : null; });
log.push('servidor na lista: '+JSON.stringify(srv));

// IP mascarado?
log.push('IP mascarado na listagem: '+(srv && srv[3]==='192.168.x.x'));

// IP INVALIDO deve ser rejeitado
const id=await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-dt-editsrv]')].find(x=>x.closest('tr').textContent.includes('VPS Homologação'));return b?b.dataset.dtEditsrv:null;});
await page.click(`[data-dt-editsrv="${id}"]`).catch(()=>{});
await page.waitForTimeout(1200);
await page.fill('[data-s="ip"]','999.999.999.999').catch(()=>{});
await page.click('[data-dt-savesrv]').catch(()=>{});
await page.waitForTimeout(2200);
log.push('toast IP invalido: '+await page.evaluate(()=>((document.querySelector('[data-dt-toast]')||{}).textContent||'').trim().slice(0,60)));

// NOVA APLICACAO + MODULO
await page.click('[data-dt-newapp]').catch(()=>{});
await page.waitForTimeout(800);
await page.fill('[data-a="label"]','Portal do Cliente').catch(()=>{});
await page.click('[data-dt-saveapp]').catch(()=>{});
await page.waitForTimeout(2800);
const appId=await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-dt-editapp]')].find(x=>x.closest('.dt-tree__node').textContent.includes('Portal do Cliente'));return b?b.dataset.dtEditapp:null;});
log.push('aplicacao criada id='+appId);
await page.click(`[data-dt-editapp="${appId}"]`).catch(()=>{});
await page.waitForTimeout(1400);
await page.fill('[data-a="new_module"]','Faturamento').catch(()=>{});
await page.click('[data-dt-addmod]').catch(()=>{});
await page.waitForTimeout(2800);
log.push('modulo aparece na arvore: '+await page.evaluate(()=>document.body.textContent.includes('Faturamento')));
await page.screenshot({path:`${OUT}/dt-srvapp-2-app.png`}).catch(()=>{});

// arvore agora agrupa pelo servidor real?
const arvore=await page.evaluate(()=>[...document.querySelectorAll('.dt-tree__row--srv')].map(x=>x.textContent.replace(/\s+/g,' ').trim().slice(0,50)));
log.push('nos raiz da arvore: '+JSON.stringify(arvore));
await page.screenshot({path:`${OUT}/dt-srvapp-3-arvore.png`}).catch(()=>{});

// DESATIVAR
await page.click(`[data-dt-delsrv="${id}"]`).catch(()=>{});
await page.waitForTimeout(2800);
log.push('servidor sumiu apos desativar: '+await page.evaluate(()=>![...document.querySelectorAll('tbody tr')].some(x=>x.textContent.includes('VPS Homologação'))));
await page.click(`[data-dt-delapp="${appId}"]`).catch(()=>{});
await page.waitForTimeout(2600);
log.push('aplicacao sumiu apos desativar: '+await page.evaluate(()=>!document.body.textContent.includes('Portal do Cliente')));

await ctx.close(); await browser.close();
console.log(JSON.stringify({log,writes:[...new Set(writes)],errors},null,2));
