import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
const fetched=[]; p.on('request',r=>{if(/features\/command-palette\.js|sidebar\.bundle\.js/.test(r.url()))fetched.push(r.url().replace('https://dshowdash.com.br',''));});
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1000);
 await p.keyboard.press('Control+K'); await p.waitForTimeout(800);
 const s=await p.evaluate(()=>{const ph=document.querySelector('.dsd-command-palette__input')?.getAttribute('placeholder'); const items=[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()); return {placeholder:ph, count:items.length, sample:items.slice(0,10)};});
 console.log('LIVE:', JSON.stringify(s));
 console.log('fetched raw/bundle:', JSON.stringify([...new Set(fetched)]));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
