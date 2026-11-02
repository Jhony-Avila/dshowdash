import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});const p=await ctx.newPage();
try{ await p.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}); await p.waitForTimeout(3500);
 if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
 await p.waitForSelector('.dsd-sidebar__link',{timeout:30000}); await p.waitForTimeout(1500);
 const info=await p.evaluate(()=>{const links=[...document.querySelectorAll('.dsd-sidebar__link')].filter(a=>(a.getAttribute('href')||'').indexOf('#/')===0); return links.slice(0,6).map(a=>({label:a.querySelector('.dsd-sidebar__item-text')?.textContent?.trim(), href:a.getAttribute('href'), itemId:a.closest('.dsd-sidebar__item')?.dataset?.itemId, panelId:a.closest('.dsd-sidebar__item')?.dataset?.panelId}));});
 console.log('links leaf:', JSON.stringify(info));
 const before=await p.evaluate(()=>({active:document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text')?.textContent?.trim(), url:location.href.replace('https://dshowdash.com.br','')}));
 const target=await p.evaluate(()=>{const a=[...document.querySelectorAll('.dsd-sidebar__link')].find(x=>(x.getAttribute('href')||'').indexOf('#/')===0 && x.querySelector('.dsd-sidebar__item-text')); return a?a.getAttribute('href'):null;});
 console.log('clique direto:', target, 'antes:', JSON.stringify(before));
 await p.click('.dsd-sidebar__link[href="'+target+'"]').catch(e=>console.log('click err',e.message));
 await p.waitForTimeout(2500);
 const after=await p.evaluate(()=>({active:document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text')?.textContent?.trim(), url:location.href.replace('https://dshowdash.com.br',''), title:document.querySelector('.dsd-container__title,[class*="container__title"]')?.textContent?.trim()}));
 console.log('DEPOIS:', JSON.stringify(after));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
