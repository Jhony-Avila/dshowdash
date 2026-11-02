import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [], failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0,200)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText||'')));
page.on('response', (r) => { if (r.status() >= 400) failed.push('HTTP '+r.status()+' '+r.url()); });
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2000); }
  const booted = await page.evaluate(() => ({
    hasClock: !!document.querySelector('.real-time-clock-component'),
    hasSidebar: !!document.querySelector('.dsd-sidebar, .app-sidebar, [data-region="sidebar"]'),
    hasHeader: !!document.querySelector('.dsd-header, .app-header, [data-region="header"]'),
    bodyState: document.body.getAttribute('data-state'),
    appChildren: (document.getElementById('app')||{}).childElementCount || 0,
    preloaderVisible: !!document.querySelector('.preloader:not([hidden]), [class*="preloader"]:not([hidden])')
  }));
  console.log('BOOT:', JSON.stringify(booted));
  await page.screenshot({ path: `${OUT}/wcm-boot.png` });
  // tenta clicar no relógio
  if (booted.hasClock) {
    await page.click('.real-time-clock-component').catch((e)=>console.log('click err', e.message));
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => ({
      overlay: !!document.querySelector('.wcm-overlay'),
      panel: !!document.querySelector('.wcm-panel'),
      mapInMain: !!(document.querySelector('.wcm-map-wrap') && document.querySelector('.wcm-map-wrap').closest('[data-region="main"], .dsd-main, .app-main, #main, .container-main')),
      hash: location.hash
    }));
    console.log('AFTER CLICK:', JSON.stringify(after));
    await page.screenshot({ path: `${OUT}/wcm-afterclick.png` });
  }
  console.log('CONSOLE ERRORS ('+errors.length+'):', JSON.stringify(errors.slice(0,15), null, 1));
  console.log('FAILED REQ ('+failed.length+'):', JSON.stringify(failed.slice(0,20), null, 1));
} catch (e) {
  console.log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/wcm-boot-fail.png` }).catch(()=>{});
  console.log('CONSOLE ERRORS ('+errors.length+'):', JSON.stringify(errors.slice(0,15)));
  console.log('FAILED REQ ('+failed.length+'):', JSON.stringify(failed.slice(0,20)));
} finally { await browser.close(); }
