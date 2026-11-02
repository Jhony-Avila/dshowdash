import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/0903b6f4-a700-436e-a68e-ac94ab07007c/scratchpad';
const URL = 'https://dshowdash.com.br/';
const theme = process.argv[2] || 'dark';
const FUNCAO = 'Engenheiro QA';
const DEPTO = 'Tecnologia';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch(e){} }, theme);
const page = await ctx.newPage();
const api = [];
page.on('response', (r) => { const u=r.url(); if (/user\/profile\.php/.test(u)) api.push(r.request().method()+' '+r.status()); });
const log=(...a)=>console.log(...a);
async function openPerfil(){ const t=await page.$('.user-menu-trigger, .user-avatar'); if(t){await t.click().catch(()=>{});await page.waitForTimeout(500);} const b=await page.$('[data-action="profile"]'); if(b)await b.click(); else await page.evaluate(()=>{location.hash='#/meu-perfil';}); await page.waitForTimeout(3000); }
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2500); }
  await openPerfil();

  const fields = await page.evaluate(() => ({
    hasFuncao: !!document.querySelector('[data-field="jobTitle"]'),
    hasDepto: !!document.querySelector('[data-field="department"]'),
    cards: document.querySelectorAll('.pup-card').length
  }));
  log('CAMPOS presentes:', JSON.stringify(fields));

  await page.fill('[data-field="jobTitle"]', FUNCAO);
  await page.fill('[data-field="department"]', DEPTO);
  await page.waitForTimeout(300);
  await page.click('.pup-btn.pri[data-action="save"]').catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/perfil-fields-${theme}.png` });
  log('API profile:', JSON.stringify(api));

  // re-navegar e conferir prefill
  await page.evaluate(()=>{location.hash='#/panel-home';}); await page.waitForTimeout(1500);
  await openPerfil();
  const reload = await page.evaluate(() => ({
    funcao: document.querySelector('[data-field="jobTitle"]')?.value,
    depto: document.querySelector('[data-field="department"]')?.value
  }));
  log('APÓS RE-NAVEGAR:', JSON.stringify(reload));
  log('PERSISTIU funcao+depto?', reload.funcao===FUNCAO && reload.depto===DEPTO);
} catch (e) { log('FALHA:', e.message); await page.screenshot({ path: `${OUT}/perfil-fields-fail.png` }).catch(()=>{}); }
finally { await browser.close(); }
