// wcm-proof.mjs — Prova do Relógio Mundial (panel-relogio-mundial) no container-main.
// Bypass Cloudflare via host-resolver (origin). Login via formulário. Captura dark+light.
import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';
import { isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const URL = 'https://dshowdash.com.br/';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors']
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

async function setTheme(t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]').catch(() => {});
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
}

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(2500);
  if (await isLoginPage(page)) { await loginViaPage(page); }
  // Espera o relógio do header aparecer.
  await page.waitForSelector('.real-time-clock-component', { timeout: 40000 });
  console.log('CLOCK visível. Clicando…');
  await page.click('.real-time-clock-component');
  // Espera o painel montar no container-main.
  await page.waitForSelector('.wcm-map-wrap', { timeout: 20000 });
  await page.waitForTimeout(1500);

  const audit = await page.evaluate(() => {
    const wrap = document.querySelector('.wcm-map-wrap');
    const inMain = !!(wrap && wrap.closest('[data-region="main"], .dsd-main, .app-main, #main, .container-main'));
    const overlay = !!document.querySelector('.wcm-overlay'); // deve ser FALSE (não é overlay)
    const chips = document.querySelectorAll('.wcm-chip').length;
    const dots = document.querySelectorAll('.wcm-dot').length;
    const night = document.querySelector('.wcm-night');
    const nightLen = night ? (night.getAttribute('d') || '').length : 0;
    const spot = document.querySelector('.wcm-spotlight__time');
    const spotTxt = spot ? spot.textContent : '';
    const spotCity = (document.querySelector('.wcm-spotlight__city') || {}).textContent || '';
    const landLen = (document.querySelector('.wcm-land')?.getAttribute('d') || '').length;
    return { inMain, overlay, chips, dots, nightLen, spotTxt, spotCity, landLen };
  });
  console.log('AUDIT:', JSON.stringify(audit));

  const dark = await setTheme('dark');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/wcm-dark.png` });
  console.log('dark theme=', dark, '-> wcm-dark.png');

  const light = await setTheme('light');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/wcm-light.png` });
  console.log('light theme=', light, '-> wcm-light.png');

  console.log('CONSOLE ERRORS:', errors.length, JSON.stringify(errors.slice(0, 8)));
} catch (e) {
  console.log('FALHA:', e.message);
  await page.screenshot({ path: `${OUT}/wcm-fail.png` }).catch(() => {});
  console.log('CONSOLE ERRORS:', errors.length, JSON.stringify(errors.slice(0, 8)));
} finally {
  await browser.close();
}
