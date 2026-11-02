// Diagnóstico: por que o TH da coluna de seleção fica 34px à direita do TD correspondente?
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.removeItem('pp:cols:/deals'));
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForTimeout(2800);

const r = await page.evaluate(() => {
  const t = document.querySelector('.pp-main .pp-table');
  const thExp = t.querySelector('thead th'), thSel = t.querySelector('thead th.pp-th-sel');
  const tdExp = t.querySelector('tbody td.pp-td-exp'), tdSel = t.querySelector('tbody td.pp-td-sel');
  const L = (el) => Math.round(el.getBoundingClientRect().left);
  const out = { base: { thExp: L(thExp), thSel: L(thSel), tdExp: L(tdExp), tdSel: L(tdSel) } };
  out.estilos = {
    thSel: { pos: getComputedStyle(thSel).position, left: getComputedStyle(thSel).left, top: getComputedStyle(thSel).top },
    tdSel: { pos: getComputedStyle(tdSel).position, left: getComputedStyle(tdSel).left },
    thExp: { pos: getComputedStyle(thExp).position, left: getComputedStyle(thExp).left },
  };
  // Variante A: zerar o left do TH de seleção
  thSel.style.left = '0px';
  out.A_leftZero = { thSel: L(thSel) };
  // Variante B: tirar o sticky do TH de seleção
  thSel.style.position = 'static';
  out.B_semSticky = { thSel: L(thSel) };
  // Variante C: sticky de volta, mas com o TH do expansor sem sticky
  thSel.style.position = ''; thSel.style.left = '';
  thExp.style.position = 'static';
  out.C_expSemSticky = { thSel: L(thSel), thExp: L(thExp) };
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
