import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error'&&!/non-fatal|403/.test(m.text()))errs.push(m.text().slice(0,120));});
async function setTheme(t){let c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));for(let i=0;i<4&&c!==t;i++){await p.click('[data-dsd-theme-toggle]').catch(()=>{});await p.waitForTimeout(600);c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));}return c;}
async function probe(theme){
 await p.keyboard.press('Control+K'); await p.waitForTimeout(700);
 const open=await p.evaluate(()=>({ph:document.querySelector('.dsd-command-palette__input')?.getAttribute('placeholder'),count:document.querySelectorAll('.dsd-command-palette__item').length}));
 await p.keyboard.type('koala',{delay:35}); await p.waitForTimeout(400);
 const first=await p.evaluate(()=>document.querySelector('.dsd-command-palette__item .dsd-command-palette__label')?.textContent?.trim());
 await p.screenshot({path:`${OUT}/cp-theme-${theme}.png`});
 await p.keyboard.press('Escape'); await p.waitForTimeout(300);
 console.log(`[${theme}] placeholder="${open.ph}" abertos=${open.count} buscaKoala1º="${first}"`);
}
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1200);
 console.log('tema dark=',await setTheme('dark')); await probe('dark');
 console.log('tema light=',await setTheme('light')); await probe('light');
 console.log('ERROS não-triviais:', errs.length, JSON.stringify(errs.slice(0,5)));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
