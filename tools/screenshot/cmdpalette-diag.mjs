import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const URL='https://dshowdash.com.br/';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
const p=await ctx.newPage();
try{
  await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForTimeout(3500);
  if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
  await p.waitForSelector('.cm-devtools-toggle',{timeout:30000});
  await p.waitForTimeout(1500);

  // instância exposta em window.ContainerMain
  const winInfo=await p.evaluate(()=>{
    const CM=window.ContainerMain;
    let mgr=null, all=null;
    try{ mgr = CM && CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : (CM && CM.commandPalette && CM.commandPalette.get ? CM.commandPalette.get() : null); }catch(e){}
    try{ all = mgr && mgr.getAllCommands ? mgr.getAllCommands().length : (CM && CM.commandPalette && CM.commandPalette.get && CM.commandPalette.get().getAllCommands ? CM.commandPalette.get().getAllCommands().length : null); }catch(e){}
    return { hasCM: !!CM, cmKeys: CM? Object.keys(CM).slice(0,25):[], hasGetMgr: !!(CM&&CM.getCommandPaletteManager), allCmds: all };
  });
  console.log('window.ContainerMain:', JSON.stringify(winInfo));

  await p.keyboard.press('Control+K'); await p.waitForTimeout(700);
  const roots=await p.evaluate(()=>document.querySelectorAll('.dsd-command-palette').length);
  console.log('palettes no DOM:', roots);
  for(const q of ['tema','home','zoom','imprimir','>home','@']){
    await p.evaluate(()=>{const i=document.querySelector('.dsd-command-palette input, .dsd-cp-input, input[class*="command"]'); if(i){i.value='';}});
    await p.keyboard.type(q,{delay:20}); await p.waitForTimeout(500);
    const r=await p.evaluate(()=>{const items=[...document.querySelectorAll('.dsd-cp-item')]; return {count:items.length, titles:items.slice(0,6).map(i=>i.querySelector('.dsd-cp-item-title')?.textContent?.trim()||i.textContent.trim().slice(0,20))};});
    console.log(`  query "${q}" -> ${r.count}:`, JSON.stringify(r.titles));
    // limpar
    for(let k=0;k<q.length+2;k++) await p.keyboard.press('Backspace');
    await p.waitForTimeout(150);
  }
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
