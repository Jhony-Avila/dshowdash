import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1200);
 const titleBefore=await p.evaluate(()=>document.querySelector('.dsd-container__title, [class*="container__title"], [data-panel-title]')?.textContent?.trim()||document.title);
 await p.keyboard.press('Control+K'); await p.waitForTimeout(700);
 await p.keyboard.type('koala',{delay:40}); await p.waitForTimeout(500);
 const match=await p.evaluate(()=>[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()));
 console.log('match "koala":', JSON.stringify(match));
 // clicar no primeiro
 await p.evaluate(()=>{const it=document.querySelector('.dsd-command-palette__item'); if(it) it.click();});
 await p.waitForTimeout(2000);
 const after=await p.evaluate(()=>({ title: document.querySelector('.dsd-container__title, [class*="container__title"], [data-panel-title]')?.textContent?.trim(), activeNav: document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text')?.textContent?.trim(), paletteVisible: !!document.querySelector('.dsd-command-palette--visible'), url: location.href.replace('https://dshowdash.com.br','') }));
 console.log('tituloAntes:', JSON.stringify(titleBefore));
 console.log('DEPOIS do clique:', JSON.stringify(after));
 await p.screenshot({path:`${OUT}/cp-nav-after.png`});
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
