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
  page.on('pageerror',e=>errors.push(String(e).slice(0,160)));
  page.on('response',r=>{if(r.url().includes('/api/datatables')&&r.status()>=400)errors.push('API '+r.status());});

  const ir=async(hash)=>{await page.goto('https://dshowdash.com.br/'+hash,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
    await page.waitForTimeout(3000);
    if(await isLoginPage(page)){await loginViaPage(page).catch(()=>{});await page.goto('https://dshowdash.com.br/'+hash).catch(()=>{});await page.waitForTimeout(3000);}
    await page.waitForSelector('[data-dt-react-root]',{timeout:20000}).catch(()=>{});await page.waitForTimeout(2600);};

  // ── TABELAS ──
  await ir('#/panel-datatables?route=data/tables');
  R[theme]={tabelas:{
    linhas: await page.evaluate(()=>document.querySelectorAll('[role="row"]').length-1),
    temGrid: await page.evaluate(()=>!!document.querySelector('[role="table"]')),
    paginacao: await page.evaluate(()=>{const e=[...document.querySelectorAll('span')].find(x=>/item\(ns\).*página/.test(x.textContent||''));return e?e.textContent.trim():null;}),
    badges: await page.evaluate(()=>document.querySelectorAll('[class*="badge"]').length),
    aneis: await page.evaluate(()=>document.querySelectorAll('svg circle').length),
    erros: errors.slice(0,3),
  }};
  await page.screenshot({path:`${OUT}/dt-tabelas-${theme}.png`}).catch(()=>{});

  if(theme==='dark'){
    // expansao de linha
    await page.click('[aria-label="Expandir linha"]').catch(()=>{});
    await page.waitForTimeout(900);
    R.expansao = await page.evaluate(()=>document.body.textContent.includes('Engine')&&document.body.textContent.includes('Comentário'));
    await page.screenshot({path:`${OUT}/dt-tabelas-expansao.png`}).catch(()=>{});
    // ordenacao no servidor
    const antes=await page.evaluate(()=>document.querySelectorAll('[role="row"]')[1]?.textContent?.slice(0,30));
    await page.click('text=Tamanho').catch(()=>{});
    await page.waitForTimeout(2200);
    const depois=await page.evaluate(()=>document.querySelectorAll('[role="row"]')[1]?.textContent?.slice(0,30));
    R.ordenacao={antes,depois,mudou:antes!==depois};
    // filtro chip
    await page.click('text=Somente órfãs').catch(()=>{});
    await page.waitForTimeout(2200);
    R.filtro = await page.evaluate(()=>{const e=[...document.querySelectorAll('span')].find(x=>/item\(ns\)/.test(x.textContent||''));return e?e.textContent.trim():null;});
    // seletor de colunas
    await page.click('text=Colunas').catch(()=>{});
    await page.waitForTimeout(700);
    R.seletorColunas = await page.evaluate(()=>document.querySelectorAll('[role="dialog"] input[type=checkbox]').length);
    await page.screenshot({path:`${OUT}/dt-tabelas-colunas.png`}).catch(()=>{});
  }

  // ── BANCOS ──
  await ir('#/panel-datatables?route=infrastructure/databases');
  R[theme].bancos={
    cards: await page.evaluate(()=>document.querySelectorAll('article').length),
    temAlternador: await page.evaluate(()=>document.body.textContent.includes('Cards')&&document.body.textContent.includes('Grid')),
    erros: errors.slice(0,3),
  };
  await page.screenshot({path:`${OUT}/dt-bancos-${theme}.png`}).catch(()=>{});
  if(theme==='dark'){
    await page.click('text=Grid').catch(()=>{});
    await page.waitForTimeout(1500);
    R.bancosGrid = await page.evaluate(()=>!!document.querySelector('[role="table"]'));
  }
  R[theme].errosJs = errors;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R,null,2));
