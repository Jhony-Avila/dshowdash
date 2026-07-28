// Valida o Kanban read-only (colunas, cards, seletor de funil, card->drawer).
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
let kanbanHits = 0, dealHit = null;
page.on('response', (r) => { const u = r.url(); if (u.includes('/api/pipedrive/kanban')) kanbanHits++; if (/\/api\/pipedrive\/deals\/\d+/.test(u)) dealHit = r.status(); });

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

await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Kanban')); b?.click(); });
await page.waitForSelector('.pp-kan-col', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);

const board = await page.evaluate(() => {
  const cols = [...document.querySelectorAll('.pp-kan-col')].map(c => ({
    stage: c.querySelector('.pp-kan-head .t')?.textContent?.trim(),
    meta: c.querySelector('.pp-kan-head .m')?.textContent?.trim(),
    cards: c.querySelectorAll('.pp-kan-card').length,
  }));
  const seletor = document.querySelector('.pp-filtros select')?.options?.length ?? 0;
  return { cols, seletorFunis: seletor, totalCards: document.querySelectorAll('.pp-kan-card').length };
});
log('BOARD:', JSON.stringify(board, null, 1));

// troca funil (seleciona 2a opcao)
await page.evaluate(() => { const s = document.querySelector('.pp-filtros select'); if (s && s.options.length > 1) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
await page.waitForTimeout(1500);
const trocou = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent?.trim());
log('APOS TROCAR FUNIL:', trocou, '| kanban fetches:', kanbanHits);

// volta pro 1o funil e clica um card
await page.evaluate(() => { const s = document.querySelector('.pp-filtros select'); if (s) { s.value = s.options[0].value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
await page.waitForSelector('.pp-kan-card', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.click('.pp-kan-card');
await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);
const drawerAbriu = await page.evaluate(() => !!document.querySelector('.pp-drawer'));
log('card->drawer abriu:', drawerAbriu, '| /deals/{id}:', dealHit);
await page.keyboard.press('Escape'); await page.waitForTimeout(400);

for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-kanban-${t}.png` }).catch(() => {});
  await page.screenshot({ path: `${SP}/kanban-${t}.png`, clip: { x: 210, y: 80, width: 1280, height: 640 } }).catch(() => {});
}

const pipeErrs = errors.filter(e => /pipedrive|kanban|deals/i.test(e));
log('RESUMO =>', JSON.stringify({ totalAbas: abas.length, temKanban: abas.some(a => a.includes('Kanban')), colunas: board.cols.length, totalCards: board.totalCards, seletorFunis: board.seletorFunis, trocouFunil: kanbanHits >= 2, cardAbriuDrawer: drawerAbriu, dealHttp: dealHit, consoleErrsPipe: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
