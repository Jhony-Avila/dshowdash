import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});
const R={};

async function ctxNovo(theme){
  const ctx=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:theme,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.removeItem('dt_force_impl');}catch(e){}},theme);
  return ctx;
}
async function irPara(page,hash){
  await page.goto('https://dshowdash.com.br/'+hash,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await page.waitForTimeout(3000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/'+hash).catch(()=>{});await page.waitForTimeout(3000);}
  await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(2500);
}

for (const theme of ['dark','light']) {
  const ctx=await ctxNovo(theme); const page=await ctx.newPage();
  const rede=[], errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
  page.on('response',r=>{const u=r.url();
    if(u.includes('/panel-datatables/dist/')) rede.push({f:u.split('/dist/')[1].split('?')[0], s:r.status()});
    if(u.includes('/api/datatables') && r.status()>=400) errors.push('API '+r.status()+' '+u.slice(-40));});

  await irPara(page,'#/panel-datatables');
  R[theme]={
    montou: await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]')),
    rota: await page.evaluate(()=>{const e=document.querySelector('[data-dt-rota]');return e?e.getAttribute('data-dt-rota'):null;}),
    grupos: await page.evaluate(()=>[...document.querySelectorAll('[role="tab"][aria-selected]')].length),
    cards: await page.evaluate(()=>document.querySelectorAll('[class*="cartao"]').length),
    banner: await page.evaluate(()=>{const e=document.querySelector('[role="status"]');return e?e.textContent.replace(/\s+/g,' ').trim().slice(0,90):null;}),
    chunks: [...new Set(rede.map(x=>x.f))],
    falhas: rede.filter(x=>x.s>=400),
    errors,
  };
  await page.screenshot({path:`${OUT}/dt-f1-${theme}.png`}).catch(()=>{});

  if (theme==='dark') {
    // ── navegacao entre grupos + URL ──
    await page.click('[role="tab"]:nth-of-type(3)').catch(()=>{});
    await page.waitForTimeout(1400);
    R.nav={ hashAposClique: await page.evaluate(()=>location.hash),
            rota: await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota')) };
    // ── voltar ──
    await page.goBack(); await page.waitForTimeout(1400);
    R.nav.aposVoltar = await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));
    await page.goForward(); await page.waitForTimeout(1400);
    R.nav.aposAvancar = await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));

    // ── deep link direto + recarregar ──
    await irPara(page,'#/panel-datatables?route=observability/quality');
    R.deep={ rota: await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota')),
             mostraNaoMigrada: await page.evaluate(()=>document.body.textContent.includes('ainda não foi migrada')) };
    await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
    R.deep.aposRecarregar = await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));

    // ── rota invalida cai no padrao ──
    await irPara(page,'#/panel-datatables?route=nao/existe');
    R.rotaInvalida = await page.evaluate(()=>document.querySelector('[data-dt-rota]')?.getAttribute('data-dt-rota'));

    // ── teclado ──
    await irPara(page,'#/panel-datatables');
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    R.teclado={ focoVisivel: await page.evaluate(()=>{const a=document.activeElement; return a? a.tagName+':'+(a.textContent||'').trim().slice(0,22):null;}) };
    await page.screenshot({path:`${OUT}/dt-f1-teclado.png`}).catch(()=>{});
  }
  await ctx.close();
}

// ── API indisponivel: rota bloqueada ──
{
  const ctx=await ctxNovo('dark'); const page=await ctx.newPage();
  await page.route('**/api/datatables/**', r=>r.abort());
  await irPara(page,'#/panel-datatables');
  R.apiFora={
    mostraErro: await page.evaluate(()=>document.body.textContent.includes('Não foi possível carregar')),
    temBotaoRetry: await page.evaluate(()=>!!document.body.textContent.includes('Tentar novamente')),
    painelVivo: await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]')),
    shellVivo: await page.evaluate(()=>!!document.querySelector('[class*="sidebar"]')),
  };
  await page.screenshot({path:`${OUT}/dt-f1-api-fora.png`}).catch(()=>{});
  await ctx.close();
}

// ── rollback: flag off via override ──
{
  const ctx=await browser.newContext({viewport:{width:1500,height:950},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript(()=>{try{localStorage.setItem('dt_force_impl','legacy');}catch(e){}});
  const page=await ctx.newPage();
  const chunks=[];
  page.on('request',r=>{if(r.url().includes('/panel-datatables/dist/')) chunks.push(1);});
  await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(3000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{});await page.waitForTimeout(3500);}
  await page.waitForTimeout(2500);
  R.rollback={ legadoCarregou: await page.evaluate(()=>!!document.querySelector('.dt-root')),
               reactAusente: await page.evaluate(()=>!document.querySelector('[data-dt-react-root]')),
               chunksBaixados: chunks.length };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R,null,2));
