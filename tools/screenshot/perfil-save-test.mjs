import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/0903b6f4-a700-436e-a68e-ac94ab07007c/scratchpad';
const URL = 'https://dshowdash.com.br/';
const theme = process.argv[2] || 'dark';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch(e){} }, theme);
const page = await ctx.newPage();
const errors = [], avatarPost = [];
page.on('console', (m) => { if (m.type() === 'error' && !/currency|weather|telemetry|non-fatal/.test(m.text())) errors.push(m.text().slice(0,200)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('response', (r) => { if (/user\/avatar\.php/.test(r.url())) avatarPost.push(r.request().method()+' '+r.status()); });
const log = (...a) => console.log(...a);
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2500); }

  // 1) Fluxo REAL: abrir o menu do usuário e clicar "Meu Perfil"
  const trigger = await page.$('.user-menu-component .user-menu-trigger, .user-menu-trigger, [data-action="toggle-user-menu"], .user-avatar');
  if (trigger) { await trigger.click().catch(()=>{}); await page.waitForTimeout(600); }
  const profileBtn = await page.$('[data-action="profile"]');
  log('menu -> botão Meu Perfil encontrado:', !!profileBtn);
  if (profileBtn) { await profileBtn.click(); }
  else { await page.evaluate(() => { location.hash = '#/meu-perfil'; }); }
  await page.waitForTimeout(3500);

  log('após clique -> hash:', await page.evaluate(()=>location.hash), '| .pup:', await page.$eval('.pup', ()=>true).catch(()=>false));

  // avatar do header ANTES
  const headerBefore = await page.evaluate(() => {
    const img = document.querySelector('.user-avatar .avatar-img, .user-avatar-large .avatar-img');
    return img ? (img.getAttribute('src')||'') : 'NO-IMG';
  });

  // 2) abrir picker
  await page.click('.pup-avatar-btn').catch(e=>log('picker btn err', e.message));
  await page.waitForTimeout(800);
  const pickerItems = await page.$$('.pup-picker-item');
  log('itens no picker:', pickerItems.length);

  // 3) escolher um avatar específico (o 3º, para garantir mudança)
  let chosenUrl = null;
  if (pickerItems.length) {
    const idx = Math.min(2, pickerItems.length-1);
    chosenUrl = await pickerItems[idx].$eval('img', el => el.getAttribute('src')).catch(()=>null);
    await pickerItems[idx].click();
    await page.waitForTimeout(600);
  }
  log('avatar escolhido:', chosenUrl);
  const footerVisible = await page.$eval('.pup-footer', el => el.classList.contains('visible')).catch(()=>false);
  log('footer (alterações não salvas) visível:', footerVisible);
  await page.screenshot({ path: `${OUT}/perfil-${theme}-picked.png` });

  // 4) salvar
  await page.click('.pup-btn.pri[data-action="save"]').catch(e=>log('save err', e.message));
  await page.waitForTimeout(2500);

  const headerAfter = await page.evaluate(() => {
    const img = document.querySelector('.user-avatar .avatar-img, .user-avatar-large .avatar-img');
    return img ? { src: img.getAttribute('src')||'', display: getComputedStyle(img).display } : 'NO-IMG';
  });
  log('AVATAR POST:', JSON.stringify(avatarPost));
  log('header avatar ANTES:', headerBefore);
  log('header avatar DEPOIS:', JSON.stringify(headerAfter));
  log('refletiu no header?', JSON.stringify(headerAfter).includes(chosenUrl||'###'));
  await page.screenshot({ path: `${OUT}/perfil-${theme}-saved.png` });
  log('ERROS relevantes ('+errors.length+'):', JSON.stringify(errors.slice(0,10)));
} catch (e) {
  log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/perfil-${theme}-fail.png` }).catch(()=>{});
  log('ERROS:', JSON.stringify(errors.slice(0,10)));
} finally { await browser.close(); }
