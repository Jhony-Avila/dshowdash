import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [], all500 = [], usersApi = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0,200)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('response', async (r) => {
  const u = r.url().replace('https://dshowdash.com.br','');
  if (r.status() === 500) { let b=''; try{b=(await r.text()).slice(0,200);}catch{} all500.push(r.status()+' '+u+' :: '+b); }
  if (/admin\/users/.test(u)) { let b=''; try{b=(await r.text()).slice(0,300);}catch{} usersApi.push(r.status()+' '+u+' :: '+b); }
});

function classify() {
  return page.evaluate(() => {
    const pum = document.querySelector('.panel-user-management, [data-module-id*="user-management"], .enterprise-component.user-management');
    const scope = pum || document.querySelector('#container-main') || document.body;
    const has = (sel) => !!scope.querySelector(sel);
    let kind = 'unknown';
    if (has('.pum-skeleton, .skeleton, [class*="skeleton"]')) kind = 'SKELETON';
    else if (has('.pum-error-container, [class*="error"]')) kind = 'ERROR';
    else if (has('[class*="auth"], [class*="blocked"], [class*="denied"]')) kind = 'AUTH-BLOCKED';
    else if (has('table, .pum-table, [class*="user-row"], [class*="user-card"], [data-user-id]')) kind = 'LIST/DATA';
    else if (has('[class*="empty"]')) kind = 'EMPTY';
    const rows = scope.querySelectorAll('[data-user-id], tr[class*="user"], .pum-user-row, [class*="user-card"]').length;
    return { hash: location.hash, hasPUM: !!pum, kind, rows, textSample: (pum||scope).innerText.slice(0,300).replace(/\s+/g,' ') };
  });
}

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }

  await page.evaluate(() => { location.hash = '#/admin-users'; });
  await page.waitForTimeout(6000);
  console.log('DIRECT #/admin-users:', JSON.stringify(await classify(), null, 1));
  await page.screenshot({ path: `${OUT}/usermgmt2-direct.png` });

  console.log('USERS API calls:', JSON.stringify(usersApi, null, 1));
  console.log('HTTP 500s:', JSON.stringify(all500, null, 1));
  console.log('CONSOLE ERRORS ('+errors.length+'):', JSON.stringify(errors.slice(0,20), null, 1));
} catch (e) {
  console.log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/usermgmt2-fail.png` }).catch(()=>{});
} finally { await browser.close(); }
