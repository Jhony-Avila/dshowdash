// Valida redimensionamento de coluna (drag + persistencia) e exportacao CSV.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { readFileSync } from 'node:fs';
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport:{width:1600,height:950}, ignoreHTTPSErrors:true, acceptDownloads:true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = []; page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
await page.goto('https://dshowdash.com.br/',{waitUntil:'domcontentloaded',timeout:30000}); await page.waitForTimeout(2000);
if (await isLoginPage(page)) await loginViaPage(page); await page.waitForTimeout(2500);
const t = await page.$('[data-panel-trigger="panel-pipedrive"]')||await page.$('.panel-pipedrive-component'); if(t) await t.click().catch(()=>{});
await page.waitForSelector('[data-pp-react-root] .pp-shell',{timeout:30000}); await page.waitForTimeout(1500);
const go = async (n) => { await page.evaluate((x)=>{const b=[...document.querySelectorAll('.pp-navitem')].find(y=>y.textContent.includes(x));b?.click();},n); await page.waitForTimeout(900); };
await page.evaluate(()=>localStorage.removeItem('pp:cols:/activities'));
await go('Atividades'); await page.waitForSelector('.pp-table tbody tr',{timeout:15000}); await page.waitForTimeout(500);
const fixo = await page.evaluate(()=>getComputedStyle(document.querySelector('.pp-table')).tableLayout);
const antes = await page.evaluate(()=>document.querySelectorAll('.pp-table thead th')[1]?.offsetWidth);
const h=(await page.$$('.pp-th-resize'))[1]; const box=await h.boundingBox();
await page.mouse.move(box.x+3,box.y+box.height/2); await page.mouse.down(); await page.mouse.move(box.x+93,box.y+box.height/2,{steps:6}); await page.mouse.up(); await page.waitForTimeout(400);
const depois = await page.evaluate(()=>document.querySelectorAll('.pp-table thead th')[1]?.offsetWidth);
const ls = await page.evaluate(()=>JSON.parse(localStorage.getItem('pp:cols:/activities')||'{}'));
log('table-layout:', fixo, '| resize', antes, '->', depois, '| LS.larguras:', JSON.stringify(ls.larguras));
// CSV export (logo apos, como no dbg que passou)
const [dl] = await Promise.all([ page.waitForEvent('download',{timeout:40000}), page.evaluate(()=>{const b=[...document.querySelectorAll('.pp-btn')].find(x=>x.textContent.includes('CSV'));b?.click();}) ]);
const csv = readFileSync(await dl.path(),'utf8'); const linhas = csv.split(/\r?\n/);
log('CSV:', dl.suggestedFilename(), '| linhas:', linhas.length, '| BOM:', csv.charCodeAt(0)===0xFEFF, '| header:', linhas[0]);
// persistencia via remount (esperas amplas)
await go('Pessoas'); await go('Atividades'); await page.waitForSelector('.pp-table tbody tr',{timeout:15000}); await page.waitForTimeout(900);
const persist = await page.evaluate(()=>document.querySelectorAll('.pp-table thead th')[1]?.offsetWidth);
const pipeErrs = errors.filter(e=>/pipedrive/i.test(e));
log('RESUMO =>', JSON.stringify({ tableFixed: fixo==='fixed', resizeOk: depois-antes>50, lsPersistiu: (ls.larguras?.type)===depois, remontou: Math.abs(persist-depois)<8, csvBaixou: linhas.length>2, csvBOM: csv.charCodeAt(0)===0xFEFF, csvColunas:(linhas[0]||'').split(';').length, consoleErrs: pipeErrs.length }, null, 2));
await browser.close(); log('FIM');
