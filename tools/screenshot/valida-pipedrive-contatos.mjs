// Valida PersonDrawer e OrgDrawer (+ deal drawer empilhado).
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
const hits = {};
page.on('response', (r) => { const u = r.url(); let m; if ((m = u.match(/\/api\/pipedrive\/(persons|organizations|deals)\/\d+/))) hits[m[1]] = r.status(); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

async function abreAba(nome) {
  await page.evaluate((n) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(n)); b?.click(); }, nome);
  await page.waitForSelector('.pp-table tbody tr.pp-clik', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}
function lerDrawer() {
  return page.evaluate(() => {
    const dr = document.querySelector('.pp-drawer');
    if (!dr) return { aberto: false };
    return { aberto: true, h2: dr.querySelector('h2')?.textContent?.trim(), secoes: [...dr.querySelectorAll('h4')].map(h => h.textContent.trim()), tiles: dr.querySelectorAll('.pp-tile').length, miniDeals: dr.querySelectorAll('.pp-row').length };
  });
}

// PESSOAS
await abreAba('Pessoas');
await page.click('.pp-table tbody tr.pp-clik');
await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1200);
const pessoa = await lerDrawer();
log('PERSON DRAWER:', JSON.stringify(pessoa));
await page.keyboard.press('Escape'); await page.waitForTimeout(400);

// ORGANIZACOES
await abreAba('Organizações');
await page.click('.pp-table tbody tr.pp-clik');
await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1200);
const org = await lerDrawer();
log('ORG DRAWER:', JSON.stringify(org));

// negocio empilhado: clicar 1o mini-deal (se houver)
let stacked = null;
const temDeal = await page.evaluate(() => { const rows = [...document.querySelectorAll('.pp-drawer .pp-row')]; const alvo = rows.find(r => r.style.cursor === 'pointer'); if (alvo) { alvo.click(); return true; } return false; });
if (temDeal) { await page.waitForTimeout(1200); stacked = await page.evaluate(() => document.querySelectorAll('.pp-drawer').length); }
log('deal empilhado: clicou=', temDeal, 'drawers no DOM=', stacked);

for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-orgdrawer-${t}.png` }).catch(() => {});
  const drs = await page.$$('.pp-drawer');
  await drs[drs.length - 1]?.screenshot({ path: `${SP}/orgdrawer-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => /pipedrive|persons|organizations|deals/i.test(e));
log('RESUMO =>', JSON.stringify({ personDrawer: pessoa.aberto, orgDrawer: org.aberto, orgTiles: org.tiles, apiHits: hits, dealEmpilhado: temDeal, consoleErrsPipe: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
