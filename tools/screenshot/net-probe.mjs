import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const URL='https://dshowdash.com.br/';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
const p=await ctx.newPage();
const hits=[];
p.on('request',r=>{const u=r.url(); if(/devtools-panel|wire-system|main\.bundle|container-main\/utils\/index/.test(u)) hits.push(u.replace('https://dshowdash.com.br',''));});
try{
  await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForTimeout(3000);
  if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2500);}
  await p.waitForSelector('.cm-devtools-toggle',{timeout:30000}).catch(()=>{});
  await p.waitForTimeout(1500);
  console.log('REQUISIÇÕES relevantes:');
  [...new Set(hits)].forEach(h=>console.log('  ',h));
}catch(e){console.log('FALHA:',e.message);}finally{await b.close();}
