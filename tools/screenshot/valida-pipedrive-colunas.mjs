// Valida o seletor de colunas (ocultar/reordenar/persistir) + Negocios migrado ao EntityGrid.
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

await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 });
await page.waitForTimeout(800);

const colsAntes = await page.evaluate(() => [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim()));
log('colunas antes:', JSON.stringify(colsAntes));

const temBotao = await page.evaluate(() => [...document.querySelectorAll('.pp-iconbtn')].some(b => /colunas/i.test(b.getAttribute('title') || '')));
log('botao Colunas presente:', temBotao);

// abre menu
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-iconbtn')].find(x => /colunas/i.test(x.getAttribute('title') || '')); b?.click(); });
await page.waitForSelector('.pp-colmenu', { timeout: 5000 });
const menu = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.pp-colmenu-item')].map(it => ({ lbl: it.querySelector('label')?.textContent?.trim(), fixa: it.querySelector('input')?.disabled }));
  return { itens: items.length, fixaCount: items.filter(i => i.fixa).length, labels: items.map(i => i.lbl) };
});
log('MENU:', JSON.stringify(menu));

// desmarca "Contato"
await page.evaluate(() => { const it = [...document.querySelectorAll('.pp-colmenu-item')].find(x => x.textContent.includes('Contato')); it?.querySelector('input')?.click(); });
await page.waitForTimeout(500);
const colsAposOcultar = await page.evaluate(() => [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim()));
log('colunas apos ocultar Contato:', JSON.stringify(colsAposOcultar), '-> removeu:', !colsAposOcultar.includes('Contato'));

// move "Dono" para cima 1x
await page.evaluate(() => { const it = [...document.querySelectorAll('.pp-colmenu-item')].find(x => x.textContent.trim().startsWith('Dono')); it?.querySelector('.pp-colmenu-mv button')?.click(); });
await page.waitForTimeout(400);
const colsAposMover = await page.evaluate(() => [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim()));
log('colunas apos mover Dono p/ cima:', JSON.stringify(colsAposMover));

// fecha menu e testa persistencia (reabre a aba)
await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Pessoas')); b?.click(); });
await page.waitForTimeout(600);
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForSelector('.pp-table tbody tr', { timeout: 10000 });
await page.waitForTimeout(600);
const colsPersistido = await page.evaluate(() => [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim()));
log('colunas apos re-navegar (persistencia):', JSON.stringify(colsPersistido), '-> Contato oculto:', !colsPersistido.includes('Contato'));

// row click ainda abre drawer?
await page.click('.pp-table tbody tr');
await page.waitForSelector('.pp-drawer', { timeout: 6000 }).catch(() => {});
const drawer = await page.evaluate(() => !!document.querySelector('.pp-drawer'));
log('row->drawer:', drawer);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// screenshot com menu aberto
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-iconbtn')].find(x => /colunas/i.test(x.getAttribute('title') || '')); b?.click(); });
await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/colunas-menu.png`, clip: { x: 210, y: 80, width: 1380, height: 560 } }).catch(() => {});
// restaura padrao (limpa p/ nao deixar config alterada)
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-colmenu .pp-btn')].find(x => x.textContent.includes('Restaurar')); b?.click(); });
await page.waitForTimeout(400);
const colsRestaurado = await page.evaluate(() => [...document.querySelectorAll('.pp-table thead th')].map(t => t.textContent.replace(/[▲▼]/g, '').trim()));
log('apos restaurar padrao:', JSON.stringify(colsRestaurado));

const pipeErrs = errors.filter(e => /pipedrive/i.test(e));
log('RESUMO =>', JSON.stringify({
  negociosMigrado: colsAntes.length === 9, botaoColunas: temBotao, menuItens: menu.itens, fixaCount: menu.fixaCount,
  ocultouContato: !colsAposOcultar.includes('Contato'), persistiu: !colsPersistido.includes('Contato'),
  restaurou: colsRestaurado.includes('Contato'), rowDrawer: drawer, consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
