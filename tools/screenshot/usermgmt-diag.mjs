import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/d641198f-64da-4c9b-bc01-71cbb2c0a93a/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [], failed = [], api = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0,300)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url().replace('https://dshowdash.com.br','') + ' :: ' + (r.failure()?.errorText||'')));
page.on('response', (r) => { const u=r.url(); if (r.status() >= 400) failed.push('HTTP '+r.status()+' '+u.replace('https://dshowdash.com.br','')); if (/admin\/users|user-management|ui\/navigation/.test(u)) api.push(r.status()+' '+u.replace('https://dshowdash.com.br','')); });

function snap() {
  return page.evaluate(() => {
    const main = document.querySelector('[data-region="main"], .container-main, .dsd-main, #main, .app-main, [data-slot="main"]');
    const pum = document.querySelector('.panel-user-management, .enterprise-component.user-management, [data-module-id*="user-management"]');
    const active = document.querySelector('.dsd-sidebar__item--active .dsd-sidebar__item-text');
    return {
      hash: location.hash,
      activeItem: active ? active.textContent.trim() : null,
      hasPUM: !!pum,
      pumClass: pum ? pum.className : null,
      mainLen: main ? main.innerHTML.length : -1,
      mainSnippet: main ? main.innerHTML.slice(0, 500) : 'NO-MAIN',
      cssLink: !!document.getElementById('pum-styles'),
      swVer: (self.navigator.serviceWorker && 'sw-present') || 'no-sw'
    };
  });
}

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(3000); }

  console.log('=== 1) NAV DIRETA #/admin-users ===');
  await page.evaluate(() => { location.hash = '#/admin-users'; });
  await page.waitForTimeout(4500);
  console.log('STATE:', JSON.stringify(await snap(), null, 1));
  await page.screenshot({ path: `${OUT}/usermgmt-direct.png` });

  console.log('=== 2) CLIQUE no item da sidebar "Gestao Usuarios" ===');
  // volta a outra rota primeiro p/ testar a troca
  await page.evaluate(() => { location.hash = '#/'; });
  await page.waitForTimeout(1500);
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.dsd-sidebar__item'));
    const t = links.find(li => /usu[aá]rio/i.test(li.textContent));
    if (!t) return 'ITEM-NAO-ENCONTRADO';
    const a = t.querySelector('a,.dsd-sidebar__link') || t;
    a.click();
    return 'CLICOU: ' + t.textContent.trim().slice(0,40) + ' | href=' + (t.querySelector('a')?.getAttribute('href')||'?');
  });
  console.log(clicked);
  await page.waitForTimeout(4500);
  console.log('STATE:', JSON.stringify(await snap(), null, 1));
  await page.screenshot({ path: `${OUT}/usermgmt-click.png` });

  console.log('APIs:', JSON.stringify(api.slice(0,15), null, 1));
  console.log('CONSOLE ERRORS ('+errors.length+'):', JSON.stringify(errors.slice(0,25), null, 1));
  console.log('FAILED REQ ('+failed.length+'):', JSON.stringify(failed.slice(0,25), null, 1));
} catch (e) {
  console.log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/usermgmt-fail.png` }).catch(()=>{});
  console.log('CONSOLE ERRORS:', JSON.stringify(errors.slice(0,25)));
} finally { await browser.close(); }
