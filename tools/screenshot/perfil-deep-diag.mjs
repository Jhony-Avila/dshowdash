import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/0903b6f4-a700-436e-a68e-ac94ab07007c/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [], reqs = [];
page.on('console', (m) => { if (m.type()==='error') errors.push(m.text().slice(0,240)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: '+e.message));
page.on('response', (r)=>{ const u=r.url(); if(/panel-user-profile/.test(u)) reqs.push(r.status()+' '+u.replace('https://dshowdash.com.br','').slice(0,80)); });
const log=(...a)=>console.log(...a);
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2500); }

  // Clique REAL: abre menu do usuário -> clica "Meu Perfil"
  const trig = await page.$('.user-menu-trigger');
  log('trigger existe?', !!trig);
  if (trig) { await trig.click(); await page.waitForTimeout(700); }
  const dd = await page.evaluate(()=>{
    const b=document.querySelector('[data-action="profile"]');
    return { btnExiste: !!b, btnTxt: b?b.textContent.trim():null };
  });
  log('dropdown:', JSON.stringify(dd));
  await page.screenshot({ path: `${OUT}/diag-1-dropdown.png` });

  await page.click('[data-action="profile"]').catch(e=>log('click err:', e.message));
  await page.waitForTimeout(4000);

  const after = await page.evaluate(()=>{
    const main = document.querySelector('#container-main, [data-region="main"], .container-main');
    const pup = document.querySelector('.pup');
    const body = document.querySelector('.pup-scroll');
    // achar o elemento onde o painel deveria montar
    const contentHost = document.querySelector('.dsd-container__content, #container-main .dsd-container__body, [data-panel-content]');
    return {
      hash: location.hash,
      pupExiste: !!pup,
      pupScrollExiste: !!body,
      pupClasses: pup?pup.className:null,
      mainVazio: main ? (main.innerText||'').trim().length : -1,
      contentHostHTML: contentHost ? contentHost.innerHTML.slice(0,300) : 'NO-HOST',
      // procura texto que o painel renderiza
      temUserProfileTitle: !!Array.from(document.querySelectorAll('*')).find(e=>/User Profile|Meu Perfil/.test(e.textContent||'') && e.children.length<3)
    };
  });
  log('DEPOIS DO CLIQUE:', JSON.stringify(after, null, 1));
  log('REQs panel-user-profile:', JSON.stringify(reqs, null, 1));
  log('ERROS:', JSON.stringify(errors.slice(0,12), null, 1));
  await page.screenshot({ path: `${OUT}/diag-2-afterclick.png` });
} catch(e){ log('FALHA:', e.message); }
finally { await browser.close(); }
