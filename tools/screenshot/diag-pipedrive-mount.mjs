// DIAG: por que o painel Pipedrive nao monta ao clicar no botao header.
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
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1500);

// Prova o manifest e o bundle acessiveis
const assets = await page.evaluate(async () => {
  const out = {};
  for (const u of [
    '/components/panels/panel-pipedrive/dist/.vite/manifest.json',
    '/components/panels/panel-pipedrive/index.js',
  ]) {
    try { const r = await fetch(u, { cache: 'no-store' }); out[u] = { http: r.status, ct: r.headers.get('content-type') }; }
    catch (e) { out[u] = { erro: String(e) }; }
  }
  return out;
});
log('ASSETS:', JSON.stringify(assets, null, 2));

// Clica o trigger
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]');
log('trigger presente:', !!trig);
logs.length = 0;
if (trig) await trig.click();
await page.waitForTimeout(6000);

const snap = await page.evaluate(() => {
  const cm = document.querySelector('#container-main, .container-main, [data-container-main]');
  const root = document.querySelector('[data-pp-react-root]');
  return {
    hash: location.hash,
    containerMainSel: cm ? (cm.id || cm.className) : null,
    containerMainHtmlLen: cm ? cm.innerHTML.length : null,
    containerMainSnippet: cm ? cm.innerHTML.slice(0, 400) : null,
    ppRoot: !!root,
    ppShell: !!document.querySelector('.pp-shell'),
    errorDiv: document.body.innerText.includes('Nao foi possivel carregar o Pipedrive') || document.body.innerText.includes('não foi possível carregar'),
    anyPp: document.querySelectorAll('[class^="pp-"],[class*=" pp-"]').length,
  };
});
log('SNAP:', JSON.stringify(snap, null, 2));
log('LOGS pos-clique:', logs.length);
logs.slice(0, 25).forEach(l => log('  ', l));

await browser.close();
log('=== FIM ===');
