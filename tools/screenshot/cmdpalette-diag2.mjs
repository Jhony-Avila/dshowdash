import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const URL='https://dshowdash.com.br/';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
const p=await ctx.newPage();
try{
  await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForTimeout(3500);
  if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
  await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1500);

  // globais com getCommandPaletteManager
  const globals=await p.evaluate(()=>{
    const out=[];
    for(const k of Object.getOwnPropertyNames(window)){
      try{ const v=window[k]; if(v && typeof v==='object'){ if(typeof v.getCommandPaletteManager==='function'){ let n=null; try{n=v.getCommandPaletteManager().getAllCommands().length;}catch(e){} out.push({g:k, via:'getCommandPaletteManager', cmds:n}); } if(v.commandPalette && v.commandPalette.get){ let n=null; try{n=v.commandPalette.get().getAllCommands().length;}catch(e){} out.push({g:k, via:'commandPalette.get', cmds:n}); } } }catch(e){}
    }
    return out;
  });
  console.log('GLOBAIS c/ palette API:', JSON.stringify(globals));

  // abrir e digitar "tema" (input auto-focado)
  await p.keyboard.press('Control+K'); await p.waitForTimeout(700);
  const inp=await p.evaluate(()=>{const i=document.activeElement; return {tag:i?.tagName, cls:(i?.className||'').slice(0,40)};});
  console.log('foco após Ctrl+K:', JSON.stringify(inp));
  await p.keyboard.type('tema',{delay:40}); await p.waitForTimeout(600);
  const r1=await p.evaluate(()=>{const items=[...document.querySelectorAll('.dsd-cp-item')]; const inputVal=document.querySelector('.dsd-command-palette input, input.dsd-cp-input, .dsd-cp-search input')?.value; return {count:items.length, titles:items.slice(0,8).map(i=>i.querySelector('.dsd-cp-item-title')?.textContent?.trim()||i.textContent.trim().slice(0,25)), inputVal, emptyMsg: !!document.querySelector('.dsd-cp-empty')};});
  console.log('query "tema":', JSON.stringify(r1));
  // roots
  const roots=await p.evaluate(()=>({palettes:document.querySelectorAll('.dsd-command-palette').length, inputs:document.querySelectorAll('.dsd-command-palette input').length}));
  console.log('DOM:', JSON.stringify(roots));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
