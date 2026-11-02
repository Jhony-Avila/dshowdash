// DIAG2: instrumenta o clique no trigger pipedrive — estado antes/depois + navegacao.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: [
  '--no-sandbox', '--disable-dev-shm-usage',
  '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors' ] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2000);

const titleOf = () => page.evaluate(() => document.querySelector('#container-main .dsd-container__title')?.textContent?.trim() || '(sem titulo)');
const hashOf = () => page.evaluate(() => location.hash);

// instala espioes de navegacao
await page.evaluate(() => {
  window.__nav = [];
  const push = (t) => window.__nav.push(t);
  window.addEventListener('hashchange', () => push('hashchange -> ' + location.hash));
  const _ps = history.pushState; history.pushState = function (...a) { push('pushState -> ' + JSON.stringify(a[2])); return _ps.apply(this, a); };
});

log('ANTES: titulo=', await titleOf(), '| hash=', await hashOf());

// existem multiplos triggers?
const trigs = await page.$$eval('[data-panel-trigger="panel-pipedrive"], .panel-pipedrive-trigger', els => els.map(e => ({
  cls: e.className, dt: e.getAttribute('data-panel-trigger'), tag: e.tagName
})));
log('TRIGGERS encontrados:', JSON.stringify(trigs));

await page.click('[data-panel-trigger="panel-pipedrive"]');
await page.waitForTimeout(4000);

log('DEPOIS: titulo=', await titleOf(), '| hash=', await hashOf());
log('NAV events:', JSON.stringify(await page.evaluate(() => window.__nav)));

// o que o router mapeia p/ #/panel-pipedrive?
const routed = await page.evaluate(() => {
  const cm = document.querySelector('#container-main');
  return { title: cm?.querySelector('.dsd-container__title')?.textContent?.trim(), ppRoot: !!document.querySelector('[data-pp-react-root]') };
});
log('ROUTED:', JSON.stringify(routed));

await browser.close();
log('=== FIM ===');
