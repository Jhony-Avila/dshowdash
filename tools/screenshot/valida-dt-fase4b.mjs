// valida-dt-fase4b.mjs — round-trip LIMPO de POST+DELETE (silêncio + limite por conexão).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
await ctx.addCookies(cookies);
await ctx.addInitScript(()=>{try{localStorage.setItem('cm_theme','dark');localStorage.setItem('dt_force_impl','react');}catch(e){}});
const page=await ctx.newPage(); const errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
page.on('response',r=>{if(r.url().includes('/api/datatables')&&r.status()>=400&&r.request().method()!=='GET')errors.push(r.request().method()+' '+r.status()+' '+r.url().split('/api')[1].split('?')[0]);});
page.on('dialog',d=>d.accept());
const R={};
await page.goto('https://dshowdash.com.br/#/panel-datatables/admin/settings',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(2600);
if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables/admin/settings').catch(()=>{});await page.waitForTimeout(2600);}
await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});await page.waitForTimeout(2400);

// ── SILÊNCIO round-trip ──
const contaSil=()=>page.evaluate(()=>document.querySelectorAll('[class*="silencio"]').length);
const MARCA='TESTE-FASE4-'+Math.floor(4242);  // motivo distinto (sem Math.random no runtime do painel)
const antesSil=await contaSil();
await page.click('[data-dt-react-root] button:has-text("Nova janela")'); await page.waitForTimeout(700);
// preenche o Motivo (último input de texto do dialog)
await page.evaluate((marca)=>{
  const dlg=document.querySelector('[role="dialog"]');
  const textos=[...dlg.querySelectorAll('input')].filter(i=>i.type==='text'||i.type==='');
  const motivo=textos[textos.length-1];
  if(motivo){const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(motivo,marca);motivo.dispatchEvent(new Event('input',{bubbles:true}));}
},MARCA);
await page.waitForTimeout(300);
await page.click('[role="dialog"] button:has-text("Criar janela")'); await page.waitForTimeout(2200);
const depoisCriarSil=await contaSil();
const apareceuSil=await page.evaluate((m)=>document.body.textContent.includes(m),MARCA);
// exclui a janela recém-criada (a que tem a marca)
await page.evaluate((m)=>{const li=[...document.querySelectorAll('[class*="silencio"]')].find(x=>x.textContent.includes(m));li?.querySelector('button[aria-label="Excluir"]')?.click();},MARCA);
await page.waitForTimeout(2200);
const depoisExcluirSil=await contaSil();
R.silencio={antes:antesSil,depoisCriar:depoisCriarSil,depoisExcluir:depoisExcluirSil,apareceu:apareceuSil,
  criou:depoisCriarSil===antesSil+1,removeu:depoisExcluirSil===antesSil};

// ── LIMITE por conexão round-trip ──
const contaLim=()=>page.evaluate(()=>{const h=[...document.querySelectorAll('h2')].find(x=>/Limites/.test(x.textContent||''));return h?.closest('section')?.querySelectorAll('tbody tr').length||0;});
const antesLim=await contaLim();
await page.click('[data-dt-react-root] button:has-text("Novo limite")'); await page.waitForTimeout(700);
// escolhe a 1ª conexão no select de Escopo (não-global) e valores distintos
await page.evaluate(()=>{
  const dlg=document.querySelector('[role="dialog"]');
  const sel=dlg.querySelector('select');  // 1º select = Escopo
  if(sel&&sel.options.length>1){const set=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;set.call(sel,sel.options[1].value);sel.dispatchEvent(new Event('change',{bubbles:true}));}
});
await page.waitForTimeout(200);
const nums=await page.$$('[role="dialog"] input[type="number"]');
if(nums[0])await nums[0].fill('7777'); if(nums[1])await nums[1].fill('8888');
await page.click('[role="dialog"] button:has-text("Salvar")'); await page.waitForTimeout(2200);
const depoisCriarLim=await contaLim();
const apareceuLim=await page.evaluate(()=>/7777/.test(document.body.textContent||''));
await page.evaluate(()=>{const tr=[...document.querySelectorAll('tbody tr')].find(x=>/7777/.test(x.textContent||''));tr?.querySelector('button[aria-label="Excluir"]')?.click();});
await page.waitForTimeout(2200);
const depoisExcluirLim=await contaLim();
R.limiteConexao={antes:antesLim,depoisCriar:depoisCriarLim,depoisExcluir:depoisExcluirLim,apareceu:apareceuLim,
  criou:depoisCriarLim===antesLim+1,removeu:depoisExcluirLim===antesLim};

R.erros=errors;
console.log(JSON.stringify(R,null,2));
await browser.close();
