// Valida o enriquecimento das tabelas (mais colunas, estilo Pipedrive).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

async function grid(aba) {
  await page.evaluate((n) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(n)); b?.click(); }, aba);
  await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  return await page.evaluate(() => {
    const cols = [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim());
    const tr = document.querySelector('.pp-table tbody tr');
    const primeira = tr ? [...tr.querySelectorAll('td')].map(td => td.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)) : null;
    const subtitulos = document.querySelectorAll('.pp-td-sub').length;
    const chips = document.querySelectorAll('.pp-chip').length;
    return { cols, primeira, subtitulos, chips };
  });
}

for (const aba of ['Negócios', 'Pessoas', 'Organizações', 'Leads', 'Produtos']) {
  const g = await grid(aba);
  log(`\n== ${aba} ==\n cols(${g.cols.length}): ${JSON.stringify(g.cols)}\n 1a linha: ${JSON.stringify(g.primeira)}\n subtitulos=${g.subtitulos} chips=${g.chips}`);
}

// screenshots Negocios + Organizacoes dark/light
for (const aba of ['Negócios', 'Organizações']) {
  await page.evaluate((n) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(n)); b?.click(); }, aba);
  await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  for (const t of ['dark', 'light']) {
    let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
    await page.waitForTimeout(400);
    const nome = aba === 'Negócios' ? 'neg' : 'org';
    await page.screenshot({ path: `${SP}/rich-${nome}-${t}.png`, clip: { x: 210, y: 80, width: 1380, height: 560 } }).catch(() => {});
  }
}

const pipeErrs = errors.filter(e => /pipedrive/i.test(e));
log('\nCONSOLE ERRS PIPE:', pipeErrs.length, pipeErrs.slice(0, 4));
await browser.close();
log('FIM');
