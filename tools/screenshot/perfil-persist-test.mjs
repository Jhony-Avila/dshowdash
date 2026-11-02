import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/0903b6f4-a700-436e-a68e-ac94ab07007c/scratchpad';
const URL = 'https://dshowdash.com.br/';
const NEW_FULL = 'Screenshot Bot QA ' + (process.argv[3] || '1');
const NEW_DISP = 'Bot QA ' + (process.argv[3] || '1');
const theme = process.argv[2] || 'dark';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch(e){} }, theme);
const page = await ctx.newPage();
const api = [];
page.on('response', (r) => { const u=r.url(); if (/user\/profile\.php|user\/avatar\.php/.test(u)) api.push(r.request().method()+' '+r.status()+' '+u.replace('https://dshowdash.com.br','')); });
const log = (...a)=>console.log(...a);
async function openPerfil() {
  const t = await page.$('.user-menu-trigger, .user-avatar'); if (t) { await t.click().catch(()=>{}); await page.waitForTimeout(500); }
  const b = await page.$('[data-action="profile"]'); if (b) await b.click(); else await page.evaluate(()=>{location.hash='#/meu-perfil';});
  await page.waitForTimeout(3000);
}
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2500); }

  await openPerfil();
  const before = await page.evaluate(() => ({
    full: document.querySelector('[data-field="fullName"]')?.value,
    disp: document.querySelector('[data-field="displayName"]')?.value,
    headerName: document.querySelector('.user-name-full')?.textContent
  }));
  log('ANTES:', JSON.stringify(before));

  // Editar os dois campos de nome
  await page.fill('[data-field="fullName"]', NEW_FULL);
  await page.fill('[data-field="displayName"]', NEW_DISP);
  await page.waitForTimeout(400);
  const footerVisible = await page.$eval('.pup-footer', el=>el.classList.contains('visible')).catch(()=>false);
  // cursor/foco preservado? valor do input == o que digitamos (sem re-render destrutivo)
  const midState = await page.evaluate(() => ({
    full: document.querySelector('[data-field="fullName"]')?.value,
    disp: document.querySelector('[data-field="displayName"]')?.value
  }));
  log('DIGITADO (input mantém valor):', JSON.stringify(midState), '| footer visível:', footerVisible);

  // Escolher avatar tambconfigurar
  await page.click('.pup-avatar-btn').catch(()=>{});
  await page.waitForTimeout(600);
  const items = await page.$$('.pup-picker-item');
  let chosen=null;
  if (items.length) { const i=Math.min(5,items.length-1); chosen=await items[i].$eval('img',e=>e.getAttribute('src')).catch(()=>null); await items[i].click(); await page.waitForTimeout(500); }

  // Salvar
  await page.click('.pup-btn.pri[data-action="save"]').catch(()=>{});
  await page.waitForTimeout(2500);
  const afterSave = await page.evaluate(() => ({
    headerNameSmall: document.querySelector('.user-name')?.textContent,
    headerNameFull: document.querySelector('.user-name-full')?.textContent,
    headerAvatar: document.querySelector('.user-avatar .avatar-img, .user-avatar-large .avatar-img')?.getAttribute('src')
  }));
  log('API:', JSON.stringify(api));
  log('avatar escolhido:', chosen);
  log('APÓS SALVAR (header):', JSON.stringify(afterSave));
  await page.screenshot({ path: `${OUT}/perfil-persist-${theme}.png` });

  // RE-NAVEGAR (sai e volta) p/ provar persistência via GET
  await page.evaluate(()=>{location.hash='#/panel-home';}); await page.waitForTimeout(1500);
  await openPerfil();
  const reload = await page.evaluate(() => ({
    full: document.querySelector('[data-field="fullName"]')?.value,
    disp: document.querySelector('[data-field="displayName"]')?.value
  }));
  log('APÓS RE-NAVEGAR (prefill do GET):', JSON.stringify(reload));
  log('PERSISTIU nome?', reload.full===NEW_FULL && reload.disp===NEW_DISP);
} catch (e) {
  log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/perfil-persist-fail.png` }).catch(()=>{});
} finally { await browser.close(); }
