// VARREDURA DE ENCERRAMENTO (read-only): navega painéis reais no LIGHT e classifica.
// Gradiente-aware: detecta bg escuro por backgroundColor OU backgroundImage (corrige cegueira do scanner antigo).
import pkg from '/var/www/dshowdash/tools/screenshot/node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from '/var/www/dshowdash/tools/screenshot/auth.mjs';
const DIR='/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/';
const PANELS = [
  ['panel-dashboard','#/'],['panel-01','#/compras'],['panel-03','#/clientes'],['panel-04','#/comercial'],
  ['panel-05','#/colaboradores'],['panel-06','#/orcamento-clientes'],['panel-07','#/contratos'],['panel-08','#/fornecedores'],
  ['panel-09','#/financeiro'],['panel-10','#/importacao'],['panel-11','#/geral'],['panel-12','#/automacoes'],
  ['panel-13','#/rh-pessoas'],['panel-15','#/produtos'],['panel-17','#/instagram'],
  ['panel-audit-trail','#/admin/auditoria'],['panel-enterprise','#/operacional'],['panel-gestao-paineis','#/admin/gestao-paineis'],
  ['panel-integration-adwords','#/google-ads'],['panel-integration-bling','#/bling'],['panel-integration-google-drive','#/google-drive'],
  ['panel-integration-pipedrive','#/pipedrive'],['panel-nav-admin','#/admin/navegacao'],['panel-observability','#/servidores'],
  ['panel-orchestrator-manager','#/admin/orchestrator-manager'],['panel-permissions-admin','#/admin/permissoes'],
  ['panel-session-admin','#/admin/sessoes'],['panel-user-management','#/centros-custo/cadastro'],['panel-user-preferences','#/preferencias'],
];
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await b.newContext({viewport:{width:1400,height:950}});
try{await ctx.addCookies(await getSessionCookies());}catch(e){}
const p=await ctx.newPage();
await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:30000}); await p.waitForTimeout(1500);
if(await isLoginPage(p)) await loginViaPage(p);
await p.waitForSelector('[data-dsd-theme-toggle]',{timeout:12000}); await p.waitForTimeout(2500);
let c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));
for(let i=0;i<3&&c!=='light';i++){await p.click('[data-dsd-theme-toggle]');await p.waitForTimeout(650);c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));}
// expande todos os grupos
const groups=p.locator('.dsd-sidebar__group-button'); const gn=await groups.count();
for(let i=0;i<gn;i++){ await groups.nth(i).click().catch(()=>{}); await p.waitForTimeout(80); }
await p.waitForTimeout(400);

const measure=(route)=>p.evaluate((route)=>{
  const lum=({r,g,b})=>0.2126*r+0.7152*g+0.0722*b;
  const parse=s=>{const m=s&&s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(',').map(parseFloat);return{r:a[0],g:a[1],b:a[2],a:a[3]===undefined?1:a[3]};};
  const content=document.querySelector('.dsd-container__content')||document.querySelector('.main-content');
  if(!content)return{err:'no-content'};
  const title=(document.querySelector('.dsd-container__title')||{}).textContent||'';
  const stub=/em desenvolvimento|panel-stub-dev/i.test(content.textContent);
  let darkBlocks=0, whiteText=0, sample=[];
  for(const el of content.querySelectorAll('*')){
    const cs=getComputedStyle(el); const rc=el.getBoundingClientRect();
    if(rc.width<60||rc.height<16||cs.visibility==='hidden'||+cs.opacity<0.1)continue;
    // bg escuro: backgroundColor opaco OU backgroundImage gradiente com rgb baixo
    const bc=parse(cs.backgroundColor); let darkBg=false;
    if(bc&&bc.a>0.6&&lum(bc)<0.30)darkBg=true;
    const gm=cs.backgroundImage&&cs.backgroundImage.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if(gm&&lum({r:+gm[1],g:+gm[2],b:+gm[3]})<0.30*255)darkBg=true;
    if(darkBg&&rc.width>100&&rc.height>24){darkBlocks++; if(sample.length<3){let s=el.tagName.toLowerCase();if(typeof el.className==='string'&&el.className.trim())s+='.'+el.className.trim().split(/\s+/)[0];sample.push(s.slice(0,30));}}
    // texto branco
    const fg=parse(cs.color); const hasT=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);
    if(hasT&&fg&&fg.a>0.3&&lum(fg)>180)whiteText++;
  }
  return {title:title.trim().slice(0,28),stub,darkBlocks,whiteText,sample};
},route);

const results=[];
for(const [panel,route] of PANELS){
  let reached=false;
  const link=p.locator(`a.dsd-sidebar__link[href="${route}"]`).first();
  try{
    if(await link.count()){ await link.scrollIntoViewIfNeeded().catch(()=>{}); await link.click().catch(()=>{}); reached=true; }
    else { await p.evaluate(r=>{location.hash=r;window.dispatchEvent(new HashChangeEvent('hashchange'));},route); reached='hash'; }
  }catch(e){}
  await p.waitForTimeout(4500);
  let m; try{ m=await measure(route); }catch(e){ m={err:String(e).slice(0,40)}; }
  let cls='OK';
  if(m.err)cls='ERRO';
  else if(m.stub)cls='STUB';
  else if(m.darkBlocks>0||m.whiteText>12)cls='DARK';
  else if(m.whiteText>0)cls='MISTO';
  results.push({panel,route,cls,...m,reached});
}
await b.close();
console.log('SWEEP='+JSON.stringify(results));
