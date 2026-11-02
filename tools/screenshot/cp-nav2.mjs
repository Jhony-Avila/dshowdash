import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
async function nav(term){
 await p.keyboard.press('Control+K'); await p.waitForTimeout(600);
 await p.keyboard.type(term,{delay:40}); await p.waitForTimeout(500);
 const label=await p.evaluate(()=>document.querySelector('.dsd-command-palette__item .dsd-command-palette__label')?.textContent?.trim());
 // clique REAL no primeiro item
 await p.click('.dsd-command-palette__item').catch(async()=>{ await p.evaluate(()=>document.querySelector('.dsd-command-palette__item')?.click()); });
 await p.waitForTimeout(2000);
 const st=await p.evaluate(()=>({activeNav:document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text')?.textContent?.trim(), title:document.querySelector('.dsd-container__title,[class*="container__title"]')?.textContent?.trim(), url:location.href.replace('https://dshowdash.com.br',''), paletteOpen:!!document.querySelector('.dsd-command-palette--visible')}));
 console.log(`nav "${term}" (clicou "${label}") ->`, JSON.stringify(st));
 return st;
}
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1200);
 const home=await p.evaluate(()=>({activeNav:document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text')?.textContent?.trim(), url:location.href.replace('https://dshowdash.com.br','')}));
 console.log('ESTADO inicial:', JSON.stringify(home));
 await nav('koala');
 await nav('compras');
 await p.screenshot({path:`${OUT}/cp-nav2-after.png`});
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
