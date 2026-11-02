// valida-dt-telas2.mjs — Conexões, Dependências e Qualidade (React), dark + light.
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
  page.on('response',r=>{if(r.url().includes('/api/datatables')&&r.status()>=400)errors.push('API '+r.status()+' '+r.url().split('/api')[1]);});

  const ir=async(rota)=>{
    await page.goto('https://dshowdash.com.br/#/panel-datatables?route='+rota,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
    await page.waitForTimeout(3000);
    if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/#/panel-datatables?route='+rota).catch(()=>{});await page.waitForTimeout(3000);}
    await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});
    await page.waitForTimeout(2800);
  };
  const naoMigrada=()=>page.evaluate(()=>document.body.textContent.includes('ainda não foi migrada'));
  R[theme]={};

  // ── CONEXÕES ──
  await ir('infrastructure/connections');
  R[theme].conexoes={
    naoMigrada: await naoMigrada(),
    cards: await page.evaluate(()=>document.querySelectorAll('article').length),
    temBotaoVerificar: await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>/Verificar/i.test(b.textContent||''))),
    temBotaoInventariar: await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>/Inventariar/i.test(b.textContent||''))),
    pulso: await page.evaluate(()=>document.querySelectorAll('[class*="pulso"]').length),
  };
  await page.screenshot({path:`${OUT}/dt2-conexoes-${theme}.png`}).catch(()=>{});

  // ── DEPENDÊNCIAS ──
  await ir('data/dependencies');
  R[theme].dependencias={
    naoMigrada: await naoMigrada(),
    cards: await page.evaluate(()=>document.querySelectorAll('[class*="cartao"]').length),
    grids: await page.evaluate(()=>document.querySelectorAll('[role="table"]').length),
    linhas: await page.evaluate(()=>document.querySelectorAll('[role="row"]').length),
    nota: await page.evaluate(()=>document.body.textContent.includes('sem diagrama')||document.body.textContent.includes('Sem diagrama')),
    barras: await page.evaluate(()=>document.querySelectorAll('[class*="barra"]').length),
  };
  await page.screenshot({path:`${OUT}/dt2-dependencias-${theme}.png`,fullPage:true}).catch(()=>{});

  // ── QUALIDADE ──
  await ir('observability/quality');
  R[theme].qualidade={
    naoMigrada: await naoMigrada(),
    gauge: await page.evaluate(()=>{const e=document.querySelector('[class*="Gauge"],[class*="gauge"]');return !!e;}),
    scoreTexto: await page.evaluate(()=>{const e=document.querySelector('[class*="valor"]');return e?e.textContent.trim():null;}),
    cards: await page.evaluate(()=>document.querySelectorAll('[class*="cartao"]').length),
    regras: await page.evaluate(()=>document.querySelectorAll('[class*="regra"]').length),
    linhas: await page.evaluate(()=>document.querySelectorAll('[role="row"]').length),
  };
  await page.screenshot({path:`${OUT}/dt2-qualidade-${theme}.png`,fullPage:true}).catch(()=>{});

  if(theme==='dark'){
    // filtro por severidade a partir do card
    const antes=R.dark.qualidade.linhas;
    await page.click('text=Atenção').catch(()=>{});
    await page.waitForTimeout(2400);
    R.filtroSeveridade={antes,depois:await page.evaluate(()=>document.querySelectorAll('[role="row"]').length),
      chip:await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/filtrando por/.test(x.textContent||''));return b?b.textContent.trim():null;})};
    await page.screenshot({path:`${OUT}/dt2-qualidade-filtro.png`}).catch(()=>{});
  }
  R[theme].errosJs=errors;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R,null,2));
