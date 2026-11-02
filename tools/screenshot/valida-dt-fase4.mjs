// valida-dt-fase4.mjs — escrita (Fase 4): renderização dos modais, round-trip
// de limite (criar→excluir) e prova anti-perda no editar conexão.
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
page.on('response',r=>{if(r.url().includes('/api/datatables')&&r.status()>=400&&r.request().method()!=='GET')errors.push(r.request().method()+' '+r.status()+' '+r.url().split('/api')[1].split('?')[0]);});
page.on('dialog',d=>d.accept());  // aceita os confirm() de exclusão
const R={};
const goto=async(rota)=>{await page.goto('https://dshowdash.com.br/#/panel-datatables/'+rota,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});await page.waitForTimeout(2600);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables/'+rota).catch(()=>{});await page.waitForTimeout(2600);}
  await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});await page.waitForTimeout(2400);};
const dialogAberto=()=>page.evaluate(()=>!!document.querySelector('[role="dialog"]'));
const fecharDialog=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(400);};

// ── A) RENDER dos modais ──
async function abre(rota,btnTexto){
  await goto(rota);
  await page.click(`[data-dt-react-root] button:has-text("${btnTexto}")`).catch(()=>{});
  await page.waitForTimeout(900);
  const ok=await dialogAberto();
  const campos=await page.evaluate(()=>document.querySelectorAll('[role="dialog"] input, [role="dialog"] select').length);
  await fecharDialog();
  return { abriu:ok, campos };
}
R.modalConexao   = await abre('infrastructure/connections','Nova conexão');
R.modalServidor  = await abre('infrastructure/servers','Novo servidor');
R.modalAplicacao = await abre('infrastructure/servers','Nova aplicação');
R.modalManutencao= await abre('observability/maintenance','Abrir janela');
R.modalLimite    = await abre('admin/settings','Novo limite');
R.modalRegra     = await abre('admin/settings','Nova regra');
R.modalSilencio  = await abre('admin/settings','Nova janela');

// ── B) ROUND-TRIP limite: criar → aparecer → excluir → sumir ──
await goto('admin/settings');
const contaLimites=()=>page.evaluate(()=>{
  const h=[...document.querySelectorAll('h2')].find(x=>/Limites/.test(x.textContent||''));
  const sec=h?.closest('section'); return sec?sec.querySelectorAll('tbody tr').length:0;});
const antes=await contaLimites();
await page.click('[data-dt-react-root] button:has-text("Novo limite")'); await page.waitForTimeout(700);
// preenche atenção/crítico com valores distintos (número via label)
const inputs=await page.$$('[role="dialog"] input[type="number"]');
if(inputs[0]) await inputs[0].fill('4242');
if(inputs[1]) await inputs[1].fill('9393');
await page.click('[role="dialog"] button:has-text("Salvar")'); await page.waitForTimeout(2200);
const depoisCriar=await contaLimites();
const temValor=await page.evaluate(()=>/4242/.test(document.body.textContent||''));
// exclui o que acabou de criar (última linha com 4242)
await page.evaluate(()=>{const tr=[...document.querySelectorAll('tbody tr')].find(x=>/4242/.test(x.textContent||''));tr?.querySelector('button[aria-label="Excluir"]')?.click();});
await page.waitForTimeout(2200);
const depoisExcluir=await contaLimites();
R.roundtripLimite={antes,depoisCriar,depoisExcluir,apareceu:temValor,criouUm:depoisCriar===antes+1,removeu:depoisExcluir===antes};

// ── C) ANTI-PERDA: editar conexão carrega o username ──
await goto('infrastructure/connections');
await page.click('[data-dt-react-root] button:has-text("Editar")').catch(()=>{});
await page.waitForTimeout(1800);  // espera o GET /{id}
R.editarConexao = await page.evaluate(()=>{
  const dlg=document.querySelector('[role="dialog"]'); if(!dlg) return {abriu:false};
  const inputs=[...dlg.querySelectorAll('input')];
  // Usuário é o input de texto após Host/Porta/Banco; procura por preenchido não-senha
  const preenchidos=inputs.filter(i=>i.type!=='password'&&i.type!=='checkbox'&&i.value.trim()!=='').map(i=>i.value);
  return {abriu:true, valoresPreenchidos:preenchidos, temValor: preenchidos.length>0};
});
await fecharDialog();

R.errosEscrita=errors;
await page.screenshot({path:`${OUT}/dt-fase4-admin.png`,fullPage:true}).catch(()=>{});
console.log(JSON.stringify(R,null,2));
await browser.close();
