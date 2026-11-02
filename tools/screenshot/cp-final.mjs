import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error'&&!/non-fatal/.test(m.text()))errs.push(m.text().slice(0,140));});
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}); await p.waitForTimeout(1200);
 await p.keyboard.press('Control+K'); await p.waitForTimeout(800);
 const open=await p.evaluate(()=>{const ph=document.querySelector('.dsd-command-palette__input')?.getAttribute('placeholder'); const items=[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()); return {placeholder:ph, count:items.length, sample:items.slice(0,14)};});
 console.log('ABERTO:', JSON.stringify(open));
 await p.screenshot({path:`${OUT}/cp-final-open.png`});
 // buscar "compras" (deve casar item de navegação)
 await p.keyboard.type('compras',{delay:40}); await p.waitForTimeout(500);
 const q1=await p.evaluate(()=>[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()));
 console.log('query "compras":', JSON.stringify(q1));
 // limpar e buscar "tema" (pt-BR)
 for(let i=0;i<9;i++) await p.keyboard.press('Backspace'); await p.waitForTimeout(200);
 await p.keyboard.type('tema',{delay:40}); await p.waitForTimeout(400);
 const q2=await p.evaluate(()=>[...document.querySelectorAll('.dsd-command-palette__item .dsd-command-palette__label')].map(l=>l.textContent.trim()));
 console.log('query "tema":', JSON.stringify(q2));
 // clicar no primeiro resultado de "compras" novamente p/ testar navegação
 for(let i=0;i<6;i++) await p.keyboard.press('Backspace'); await p.waitForTimeout(150);
 await p.keyboard.type('compras',{delay:40}); await p.waitForTimeout(400);
 const before=await p.evaluate(()=>location.hash);
 await p.evaluate(()=>{const it=document.querySelector('.dsd-command-palette__item'); if(it) it.click();});
 await p.waitForTimeout(900);
 const after=await p.evaluate(()=>({hash:location.hash, paletteVisible:!!document.querySelector('.dsd-command-palette--visible')}));
 console.log('navegação: hashAntes=',before,'-> depois=',JSON.stringify(after));
 console.log('ERROS:', errs.length, JSON.stringify(errs.slice(0,5)));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
