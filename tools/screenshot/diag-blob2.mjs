import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
try { await ctx.addCookies(await getSessionCookies()); } catch(e){}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil:'domcontentloaded', timeout:30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout:12000 });
await page.waitForTimeout(2500);
let c = await page.evaluate(()=>document.documentElement.getAttribute('data-theme'));
for (let i=0;i<3&&c!=='light';i++){ await page.click('[data-dsd-theme-toggle]'); await page.waitForTimeout(700); c=await page.evaluate(()=>document.documentElement.getAttribute('data-theme')); }
await page.waitForTimeout(600);
const res = await page.evaluate(()=>{
  const out=[];
  document.querySelectorAll('.site-header *').forEach(el=>{
    const r=el.getBoundingClientRect();
    if (r.width<10||r.height<10) return;
    if (r.left<220||r.left>360) return;
    const cs=getComputedStyle(el);
    out.push({ cls: (el.className||'').toString().slice(0,60), tag: el.tagName,
      x:Math.round(r.left), w:Math.round(r.width), h:Math.round(r.height),
      bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,40), border: cs.border.slice(0,30) });
  });
  return out;
});
await browser.close();
console.log(JSON.stringify(res,null,1));
