import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { const t=m.text(); if (/user-management|Already mounted|lifecycle|Mounted/i.test(t)) logs.push(m.type()+': '+t.slice(0,140)); });
const clickItem = async (rx) => page.evaluate((r) => {
  const li = Array.from(document.querySelectorAll('.dsd-sidebar__item')).find(x => new RegExp(r,'i').test(x.textContent));
  if (!li) return 'NAO-ACHOU';
  (li.querySelector('a')||li).click(); return 'ok';
}, rx);
const state = () => page.evaluate(() => ({ hasPUM: !!document.querySelector('.panel-user-management,[data-module-id*="user-management"]'), hasPSA: !!document.querySelector('.psa,[data-module-id*="session-admin"]'), title: document.querySelector('.dsd-container__title')?.textContent?.trim(), rows: document.querySelectorAll('[data-user-id],[class*="user-card"],[class*="user-row"]').length }));
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }
  console.log('1. -> Usuarios:', await clickItem('usu[aá]rio')); await page.waitForTimeout(5000); console.log('   ', JSON.stringify(await state()));
  console.log('2. -> Sessoes :', await clickItem('sess[õo]es')); await page.waitForTimeout(5000); console.log('   ', JSON.stringify(await state()));
  console.log('3. -> Usuarios:', await clickItem('usu[aá]rio')); await page.waitForTimeout(6000); console.log('   ', JSON.stringify(await state()));
  console.log('4. -> Sessoes :', await clickItem('sess[õo]es')); await page.waitForTimeout(5000); console.log('   ', JSON.stringify(await state()));
  console.log('5. -> Usuarios:', await clickItem('usu[aá]rio')); await page.waitForTimeout(6000); console.log('   ', JSON.stringify(await state()));
  await page.screenshot({ path: `${OUT}/uv-roundtrip.png` });
  console.log('LOGS:', JSON.stringify(logs.slice(0,30), null, 1));
} catch (e) { console.log('FAIL', e.message); } finally { await browser.close(); }
