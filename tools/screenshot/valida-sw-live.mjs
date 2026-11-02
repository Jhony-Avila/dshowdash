// valida-sw-live.mjs — simula USUÁRIO REAL: via Cloudflare, SW ATIVO, reload, abre painel, dados ao vivo.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/28fb90a7-db93-4420-a07b-70b677e76c69/scratchpad';
const cookies = await getSessionCookies();
// SEM host-resolver → vai pela Cloudflare (DNS público), como um usuário real. SW habilitado (default).
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, colorScheme:'dark' });
await ctx.addCookies(cookies);
await ctx.addInitScript(()=>{try{localStorage.setItem('dshowdash-theme','dark');localStorage.setItem('cm_theme','dark');}catch(e){}});
const page = await ctx.newPage();
const leafletReqs=[], errors=[], reqFail=[];
page.on('request', r=>{ const u=r.url(); if(u.includes('leaflet')||u.includes('panel-transito')) leafletReqs.push('REQ '+u.split('/').pop().slice(0,60)); });
page.on('response', r=>{ const u=r.url(); if(u.includes('leaflet')||u.includes('panel-transito')) leafletReqs.push('RES '+r.status()+' '+u.split('/').pop().slice(0,60)); });
page.on('pageerror', e=>errors.push(String(e).slice(0,140)));
page.on('requestfailed', r=>{ const u=r.url(); if(u.includes('/api/traffic')||u.includes('leaflet')||u.includes('panel-transito')) reqFail.push(r.method()+' '+u.slice(-70)+' :: '+(r.failure()?.errorText)); });

// 1) primeira carga (registra SW) + login
await page.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:40000}).catch(e=>errors.push('nav1:'+e));
await page.waitForTimeout(3500);
if (await isLoginPage(page)) await loginViaPage(page).catch(()=>{});
await page.waitForTimeout(4000);
// aguarda o SW registrar/ativar
await page.evaluate(async()=>{ try{ await navigator.serviceWorker.ready; }catch(e){} }).catch(()=>{});
// 2) RELOAD (agora o SW controla a página) — como você faria
await page.reload({waitUntil:'domcontentloaded',timeout:40000}).catch(e=>errors.push('reload:'+e));
await page.waitForTimeout(4000);
if (await isLoginPage(page)) await loginViaPage(page).catch(()=>{});

const swInfo = await page.evaluate(async()=>{
  const c = navigator.serviceWorker.controller;
  let ver=null; try{ const r=await fetch('/sw.js',{cache:'no-store'}); const t=await r.text(); ver=(t.match(/var VERSION = '([^']+)'/)||[])[1]; }catch(e){}
  return { controlled: !!c, controllerUrl: c?c.scriptURL.split('/').pop():null, swFileVersion: ver };
});

// 3) abre o painel pelo botão da sidebar
await page.waitForSelector('.dsd-sidebar',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(1500);
await page.evaluate(()=>{ const it=[...document.querySelectorAll('.dsd-sidebar__item,.dsd-sidebar__link')].find(e=>/tr[âa]nsito/i.test(e.textContent||'')); if(it) it.click(); });
await page.waitForSelector('.transit-panel',{timeout:15000}).catch(()=>{});
await page.waitForTimeout(6000);

const panel = await page.evaluate(()=>{
  const p=document.querySelector('.transit-panel'); if(!p) return {present:false};
  const idx=(p.querySelector('.tp-card--index .tp-card__value')||{}).textContent;
  const inc=(p.querySelectorAll('.tp-card')[3]?.querySelector('.tp-card__value')||{}).textContent;
  return { present:true, index:idx, incidentsCard:inc, hasMap:!!p.querySelector('.leaflet-container'),
    flowLines:document.querySelectorAll('.leaflet-overlay-pane path').length,
    clusters:document.querySelectorAll('.marker-cluster').length,
    incRows:p.querySelectorAll('.tp-list--incidents .tp-row').length,
    situation:(p.querySelector('.tp-situation .txt')||{}).textContent };
});
await page.screenshot({ path:`${OUT}/sw-live-panel.png` }).catch(()=>{});
await browser.close();
console.log(JSON.stringify({ swInfo, panel, leafletReqs: leafletReqs.slice(-8), reqFail, errors:errors.slice(0,6) }, null, 2));
