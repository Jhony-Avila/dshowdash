// valida-dt-fase1.mjs — fundacao React: flag, montagem, tema, error boundary.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies=await getSessionCookies();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1']});

async function abrir(theme='dark'){
  const ctx=await browser.newContext({viewport:{width:1500,height:950},colorScheme:theme,serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t)=>{try{localStorage.setItem('cm_theme',t);localStorage.setItem('dshowdash-theme',t);}catch(e){}},theme);
  const page=await ctx.newPage();
  const chunks=[], errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
  page.on('request',r=>{ const u=r.url();
    if(u.includes('/panel-datatables/dist/')) chunks.push(u.split('/dist/')[1].split('?')[0]); });
  await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await page.waitForTimeout(3000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{});await page.waitForTimeout(3000);}
  await page.waitForTimeout(3500);
  return {ctx,page,chunks,errors};
}

const R={};

// ── 1. FLAG OFF: nao pode baixar NENHUM chunk React ──
{
  const {ctx,page,chunks,errors}=await abrir('dark');
  R.off={
    chunksReact: chunks.filter(c=>c.endsWith('.js')),
    temLegado: await page.evaluate(()=>!!document.querySelector('.dt-root')),
    temReact: await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]')),
    impl: await page.evaluate(async()=>{ try{ const m=await import('/components/panels/panel-datatables/index.js'); return m.info().impl; }catch(e){ return 'erro'; } }),
    errors,
  };
  await page.screenshot({path:`${OUT}/dt-fase1-off.png`}).catch(()=>{});
  await ctx.close();
}

// ── liga a flag ──
// (feito por PHP fora deste script)

// ── 2. FLAG ON via override local ──
{
  const ctx=await browser.newContext({viewport:{width:1500,height:950},colorScheme:'dark',serviceWorkers:'block',ignoreHTTPSErrors:true});
  await ctx.addCookies(cookies);
  await ctx.addInitScript(()=>{try{localStorage.setItem('cm_theme','dark');localStorage.setItem('dt_force_impl','react');}catch(e){}});
  const page=await ctx.newPage();
  const chunks=[],errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
  page.on('request',r=>{const u=r.url(); if(u.includes('/panel-datatables/dist/')) chunks.push(u.split('/dist/')[1].split('?')[0]);});
  await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
  await page.waitForTimeout(3000);
  if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{});await page.waitForTimeout(3000);}
  await page.waitForSelector('[data-dt-react-root]',{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(2000);

  R.on={
    chunks: chunks,
    montou: await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]')),
    tema: await page.evaluate(()=>(document.querySelector('[data-test="tema"]')||{}).textContent),
    flagSource: await page.evaluate(()=>(document.querySelector('[data-test="flag-source"]')||{}).textContent),
    cssInjetado: await page.evaluate(()=>!!document.getElementById('dt-react-css')),
    errors,
  };
  await page.screenshot({path:`${OUT}/dt-fase1-on-dark.png`}).catch(()=>{});

  // ── 3. TEMA REATIVO: troca data-theme ao vivo ──
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
  await page.waitForTimeout(900);
  R.tema={ aposTrocar: await page.evaluate(()=>(document.querySelector('[data-test="tema"]')||{}).textContent) };
  await page.screenshot({path:`${OUT}/dt-fase1-on-light.png`}).catch(()=>{});
  await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));
  await page.waitForTimeout(600);
  R.tema.aoVoltar = await page.evaluate(()=>(document.querySelector('[data-test="tema"]')||{}).textContent);

  // ── 4. ERROR BOUNDARY por widget ──
  await page.click('[data-test="quebrar"]').catch(()=>{});
  await page.waitForTimeout(900);
  R.boundary={
    widgetMostraErro: await page.evaluate(()=>document.body.textContent.includes('Não foi possível exibir')),
    vizinhoVivo: await page.evaluate(()=>{const e=document.querySelector('[data-test="vizinho"]'); return e? e.textContent : null;}),
    painelInteiroVivo: await page.evaluate(()=>!!document.querySelector('[data-dt-react-root]')),
    shellVivo: await page.evaluate(()=>!!document.querySelector('.sidebar, [class*="sidebar"]')),
  };
  await page.screenshot({path:`${OUT}/dt-fase1-boundary.png`}).catch(()=>{});

  // ── 5. UNMOUNT limpa DOM e CSS ──
  const limpeza = await page.evaluate(async()=>{
    const m=await import('/components/panels/panel-datatables/index.js');
    await m.unmount();
    return { root: !!document.querySelector('[data-dt-react-root]'), css: !!document.getElementById('dt-react-css') };
  });
  R.unmount=limpeza;
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(R,null,2));
