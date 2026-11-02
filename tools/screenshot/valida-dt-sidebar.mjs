// valida-dt-sidebar.mjs — botao DataTables na sidebar, abaixo do Transito.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
async function run(theme){
  const ctx=await browser.newContext({viewport:{width:1500,height:1000},colorScheme:theme,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.setItem('dshowdash-theme',t);}catch(e){}},theme);
  const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
  await page.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await page.waitForTimeout(4000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/').catch(()=>{});await page.waitForTimeout(4000);}
  await page.waitForTimeout(2500);

  // ordem visual dos itens do grupo Favoritos
  const itens = await page.evaluate(() => {
    const els=[...document.querySelectorAll('[data-panel-id], [data-item-key], .sidebar-item, [role="menuitem"]')];
    const vistos=[];
    els.forEach(e=>{
      const t=(e.textContent||'').trim().replace(/\s+/g,' ');
      const pid=e.getAttribute('data-panel-id')||'';
      if(t && t.length<40) vistos.push({texto:t.slice(0,30), panelId:pid, y:Math.round(e.getBoundingClientRect().top)});
    });
    return vistos.filter(v=>['Geral','Geral Compras','Koala Docs','Transito','DataTables'].some(n=>v.texto===n))
                 .sort((a,b)=>a.y-b.y);
  });
  const btn = await page.evaluate(() => {
    const e=[...document.querySelectorAll('*')].find(x=>(x.textContent||'').trim()==='DataTables'
      && x.children.length===0);
    if(!e) return null;
    const alvo=e.closest('[data-panel-id]')||e.closest('a,button,li,div');
    const r=alvo.getBoundingClientRect();
    return { existe:true, panelId:alvo.getAttribute('data-panel-id'),
             displayTitle:alvo.getAttribute('data-display-title'),
             visivel:r.width>0&&r.height>0, x:Math.round(r.x), y:Math.round(r.y) };
  });
  await page.screenshot({path:`${OUT}/dt-sidebar-${theme}.png`}).catch(()=>{});

  // clicar e conferir que abre o painel
  let abriu=false, titulo='';
  const el = await page.$('text=DataTables');
  if(el){ await el.click().catch(()=>{}); await page.waitForTimeout(4000);
    abriu = await page.evaluate(()=>!!document.querySelector('.dt-root'));
    titulo = await page.evaluate(()=>{const t=document.querySelector('[data-display-title]');return t?t.getAttribute('data-display-title'):'';});
  }
  await page.screenshot({path:`${OUT}/dt-sidebar-${theme}-aberto.png`}).catch(()=>{});
  await ctx.close();
  return {theme,ordem:itens.map(i=>i.texto),btn,abriu,titulo,errors};
}
const dark=await run('dark'); const light=await run('light');
await browser.close();
console.log(JSON.stringify({dark,light},null,2));
