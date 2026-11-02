import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/0903b6f4-a700-436e-a68e-ac94ab07007c/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [], failed = [], profileApi = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0,260)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText||'')));
page.on('response', (r) => { const u=r.url(); if (r.status() >= 400) failed.push('HTTP '+r.status()+' '+u); if (/profile\.php|avatars|avatar\.php|check\.php/.test(u)) profileApi.push(r.status()+' '+u.replace('https://dshowdash.com.br','')); });
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2500); }

  // Navega direto para a rota
  await page.evaluate(() => { location.hash = '#/meu-perfil'; });
  await page.waitForTimeout(4000);

  const st = await page.evaluate(() => {
    const pup = document.querySelector('.pup');
    const main = document.querySelector('[data-region="main"], .container-main, .dsd-main, #main, .app-main');
    return {
      hash: location.hash,
      hasPup: !!pup,
      hasPupAvatar: !!document.querySelector('.pup-avatar'),
      hasPicker: !!document.querySelector('.pup-avatar-btn'),
      pupState: pup ? (pup.querySelector('.pup-skeleton') ? 'skeleton' : (pup.querySelector('.pup-state') ? 'state/error' : (pup.querySelector('.pup-scroll') ? 'profile' : 'unknown'))) : 'NO-PUP',
      mainSnippet: main ? main.innerHTML.slice(0, 400) : 'NO-MAIN',
      panelUserProfileGlobal: typeof window !== 'undefined'
    };
  });
  console.log('STATE:', JSON.stringify(st, null, 1));
  await page.screenshot({ path: `${OUT}/perfil-repro.png`, fullPage: false });

  console.log('PROFILE APIs:', JSON.stringify(profileApi, null, 1));
  console.log('CONSOLE ERRORS ('+errors.length+'):', JSON.stringify(errors.slice(0,20), null, 1));
  console.log('FAILED REQ ('+failed.length+'):', JSON.stringify(failed.slice(0,20), null, 1));
} catch (e) {
  console.log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/perfil-repro-fail.png` }).catch(()=>{});
  console.log('CONSOLE ERRORS:', JSON.stringify(errors.slice(0,20)));
} finally { await browser.close(); }
