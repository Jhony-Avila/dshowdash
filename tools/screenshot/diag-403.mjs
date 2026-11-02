import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const log=(...a)=>console.log(...a);
const browser = await chromium.launch({ headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport:{width:1400,height:900}, ignoreHTTPSErrors:true });
try{ await ctx.addCookies(await getSessionCookies()); }catch{}
const page = await ctx.newPage();
const bad=[];
page.on('response', r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.request().method()+' '+r.url()); });
await page.goto('https://dshowdash.com.br/', {waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1500);
if(await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1500);
bad.length=0;
await page.evaluate(()=>{location.hash='#/panel-pipedrive/config';});
await page.waitForTimeout(6000);
log('REQS >=400:', JSON.stringify([...new Set(bad)], null, 2));
// testa o endpoint de feature-flags direto
const ff = await page.evaluate(async()=>{ try{ const r=await fetch('/api/feature-flags/?action=check&flag=panel_pipedrive_enabled',{credentials:'same-origin'}); return {http:r.status, body:(await r.text()).slice(0,200)}; }catch(e){return{erro:String(e)};} });
log('feature-flags direto:', JSON.stringify(ff));
await browser.close(); log('FIM');
