// Valida o botao "Reconciliar exclusoes" no card Webhooks (Config). Clica -> POST /reconcile
// (deleted-scan, barato) e confere a mensagem de sucesso. Dark screenshot do card.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let reconResp = null, reconCalls = 0;
page.on('request', r => { if (r.url().includes('/api/pipedrive/reconcile')) reconCalls++; });
page.on('response', async r => { if (r.url().includes('/api/pipedrive/reconcile')) { let b = null; try { b = await r.json(); } catch {} reconResp = { http: r.status(), data: b?.data }; } });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Configurações')); b?.click(); });
await page.waitForSelector('#pp-token', { timeout: 15000 });
await page.waitForTimeout(2500);

const temBotao = await page.evaluate(() => [...document.querySelectorAll('.pp-btn')].some(b => b.textContent.includes('Reconciliar exclusões')));
log('botao Reconciliar presente:', temBotao);

await page.evaluate(() => {
  const whCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks'));
  const b = [...whCard.querySelectorAll('.pp-btn')].find(x => x.textContent.includes('Reconciliar'));
  b?.click();
});
await page.waitForTimeout(3000);
const msg = await page.evaluate(() => {
  const whCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks'));
  return whCard?.querySelector('.pp-msg')?.textContent.trim();
});
log('MSG apos reconciliar:', msg);
log('API /reconcile:', JSON.stringify(reconResp), '| calls:', reconCalls);

// screenshot do card
const h = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Webhooks')));
await h.asElement()?.scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(300);
await h.asElement()?.screenshot({ path: `${SP}/reconcile-card-dark.png` }).catch(() => {});

const pipeErrs = errors.filter(e => /pipedrive|reconcile/i.test(e));
log('RESUMO =>', JSON.stringify({
  temBotao,
  reconcileHttp: reconResp?.http,
  strategy: reconResp?.data?.strategy,
  marcados: reconResp?.data?.total_marked_deleted,
  msgOk: (msg || '').includes('Reconciliação concluída'),
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 4));
await browser.close();
log('FIM');
