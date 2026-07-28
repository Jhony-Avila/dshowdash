// Valida a tela de Alertas comerciais (cards, expandir, deal->drawer).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let alertsHit = null, dealHit = null;
page.on('response', (r) => { const u = r.url(); if (u.includes('/api/pipedrive/alerts')) alertsHit = r.status(); if (/\/api\/pipedrive\/deals\/\d+/.test(u)) dealHit = r.status(); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

const abas = await page.evaluate(() => [...document.querySelectorAll('.pp-navitem')].map(b => b.textContent.trim().replace(/\s+/g, ' ')));
log('ABAS (' + abas.length + '):', JSON.stringify(abas));

await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Alertas')); b?.click(); });
await page.waitForSelector('.pp-alert', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.pp-alert')].map(c => ({
    lbl: c.querySelector('.lbl')?.textContent?.trim(),
    cnt: c.querySelector('.cnt')?.textContent?.trim(),
    dealsVisiveis: c.querySelectorAll('.pp-alert-deal').length,
  }));
  return { cards, totalCards: cards.length };
});
log('ALERTAS:', JSON.stringify(info, null, 1));

// expandir um card colapsado (o ultimo, low) e clicar 1o deal do 1o card
await page.evaluate(() => { const heads = [...document.querySelectorAll('.pp-alert-head')]; heads[heads.length - 1]?.click(); });
await page.waitForTimeout(800);
const aposExpandir = await page.evaluate(() => [...document.querySelectorAll('.pp-alert')].pop()?.querySelectorAll('.pp-alert-deal').length);
log('ultimo card apos expandir - deals:', aposExpandir);

await page.click('.pp-alert-deal');
await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);
const drawerAbriu = await page.evaluate(() => !!document.querySelector('.pp-drawer'));
log('deal->drawer:', drawerAbriu, '| /deals/{id}:', dealHit);
await page.keyboard.press('Escape'); await page.waitForTimeout(400);

for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-alertas-${t}.png` }).catch(() => {});
  await page.screenshot({ path: `${SP}/alertas-${t}.png`, clip: { x: 210, y: 80, width: 900, height: 700 } }).catch(() => {});
}

const pipeErrs = errors.filter(e => /pipedrive|alerts|deals/i.test(e));
log('RESUMO =>', JSON.stringify({ totalAbas: abas.length, temAlertas: abas.some(a => a.includes('Alertas')), alertsHttp: alertsHit, cards: info.totalCards, dealAbriuDrawer: drawerAbriu, dealHttp: dealHit, consoleErrsPipe: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
