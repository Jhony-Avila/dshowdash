import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1000);
 await p.keyboard.press('Control+K'); await p.waitForTimeout(800);
 const openState=await p.evaluate(()=>{const items=[...document.querySelectorAll('.dsd-command-palette__item')]; return {visible:!!document.querySelector('.dsd-command-palette--visible'), itemCount:items.length, labels:items.map(i=>i.querySelector('.dsd-command-palette__label')?.textContent?.trim())};});
 console.log('ABERTO (sem digitar):', JSON.stringify(openState));
 await p.keyboard.type('theme',{delay:40}); await p.waitForTimeout(400);
 const q=await p.evaluate(()=>[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()));
 console.log('query "theme":', JSON.stringify(q));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
