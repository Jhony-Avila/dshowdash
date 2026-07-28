// Valida Leads/Produtos/Notas/Funis/Usuarios no painel Pipedrive.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 980 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const apiHits = {};
page.on('response', (r) => { const u = r.url(); for (const e of ['leads', 'products', 'notes', 'users', 'pipelines']) { if (u.includes('/api/pipedrive/' + e)) apiHits[e] = r.status(); } });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(2000);

const abas = await page.evaluate(() => [...document.querySelectorAll('.pp-navitem')].map(b => b.textContent.trim().replace(/\s+/g, ' ')));
log('ABAS (' + abas.length + '):', JSON.stringify(abas));

const resultados = {};
for (const [aba, tabela] of [['Leads', true], ['Produtos', true], ['Notas', true], ['Funis', false], ['Usuários', true]]) {
  await page.evaluate((nome) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(nome)); b?.click(); }, aba);
  await page.waitForSelector(tabela ? '.pp-table tbody tr' : '.pp-funil-row', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const info = await page.evaluate((temTabela) => {
    const h1 = document.querySelector('.pp-main .pp-h1')?.textContent?.trim();
    const sub = document.querySelector('.pp-main .pp-sub')?.textContent?.trim();
    if (temTabela) {
      const cols = [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.trim());
      const linhas = document.querySelectorAll('.pp-table tbody tr').length;
      const primeira = (() => { const tr = document.querySelector('.pp-table tbody tr'); return tr ? [...tr.querySelectorAll('td')].map(td => td.textContent.trim().slice(0, 24)) : null; })();
      return { h1, sub, cols, linhas, primeira };
    }
    const cards = document.querySelectorAll('.pp-card').length;
    const funilRows = document.querySelectorAll('.pp-funil-row').length;
    return { h1, sub, cards, funilRows };
  }, tabela);
  resultados[aba] = info;
  log(`\n== ${aba} ==`, JSON.stringify(info));
}

// screenshots Funis + Leads dark/light
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Funis')); b?.click(); });
await page.waitForTimeout(1000);
for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-funis-${t}.png` }).catch(() => {});
  await page.screenshot({ path: `${SP}/funis-${t}.png`, clip: { x: 210, y: 80, width: 900, height: 640 } }).catch(() => {});
}

const pipeErrs = errors.filter(e => /pipedrive|leads|products|notes|users|pipelines/i.test(e));
log('\nRESUMO =>', JSON.stringify({
  totalAbas: abas.length,
  apiHits,
  linhas: { Leads: resultados['Leads']?.linhas, Produtos: resultados['Produtos']?.linhas, Notas: resultados['Notas']?.linhas, Usuarios: resultados['Usuários']?.linhas },
  funisCards: resultados['Funis']?.cards, funisRows: resultados['Funis']?.funilRows,
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
