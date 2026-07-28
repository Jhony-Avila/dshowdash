// Valida a Visao Geral turbinada: grafico de ganhos (#1, toggle dia/semana/mes) + Conversao&Ciclo (#2).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let metricsResp = null, convResp = null;
page.on('response', async (r) => {
  const u = r.url();
  if (u.includes('/api/pipedrive/metrics')) { let b = null; try { b = await r.json(); } catch {} metricsResp = { http: r.status(), daily: b?.data?.daily?.length, days: b?.data?.days }; }
  if (u.includes('/api/pipedrive/conversion')) { let b = null; try { b = await r.json(); } catch {} convResp = { http: r.status(), win: b?.data?.win_rate, cycleAvg: b?.data?.cycle?.avg_dias, cycleN: b?.data?.cycle?.count, aging: b?.data?.stage_aging?.length, won: b?.data?.closed?.won, lost: b?.data?.closed?.lost }; }
});

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(6500); // Visao Geral e default; espera overview->metrics+conversion montarem

const info = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-main .pp-card h3')].map(h => h.textContent.trim());
  const chart = document.querySelector('.pp-chart');
  const chartPts = document.querySelectorAll('.pp-chart polyline').length;
  const seg = document.querySelectorAll('.pp-seg .pp-seg-b').length;
  const segLabels = [...document.querySelectorAll('.pp-seg .pp-seg-b')].map(b => b.textContent.trim());
  const distRows = document.querySelectorAll('.pp-dist-row').length;
  const convCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Conversão'));
  const convTiles = convCard ? [...convCard.querySelectorAll('.pp-tile')].map(t => ({ n: t.querySelector('.pp-tile-n')?.textContent.trim(), l: t.querySelector('.pp-tile-l')?.textContent.trim() })) : [];
  const agingRows = convCard ? convCard.querySelectorAll('.pp-funil-row').length : 0;
  return { h3s, temChart: !!chart, chartPolylines: chartPts, seg, segLabels, distRows, convTiles, agingRows };
});
log('VISAO GERAL DOM:', JSON.stringify(info, null, 2));
log('API /metrics:', JSON.stringify(metricsResp));
log('API /conversion:', JSON.stringify(convResp));

// Testa o toggle: clica em "Semana" e depois "Mês", confirma que o grafico permanece
const clicaSeg = async (lbl) => { const h = await page.evaluateHandle((l) => [...document.querySelectorAll('.pp-seg-b')].find(b => b.textContent.trim() === l), lbl); await h.asElement()?.click().catch(() => {}); await page.waitForTimeout(700); return await page.evaluate(() => document.querySelector('.pp-seg-b.is-active')?.textContent.trim()); };
const aposSemana = await clicaSeg('Semana');
const aposMes = await clicaSeg('Mês');
log('Toggle => Semana ativo:', aposSemana, '| Mês ativo:', aposMes);
const aindaTemChart = await page.evaluate(() => !!document.querySelector('.pp-chart polyline'));
log('Gráfico persiste após toggle:', aindaTemChart);

// Screenshots dark+light (rola ate a area de graficos)
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(500);
  const conv = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Ganhos ao longo')));
  await conv.asElement()?.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await (await page.$('.pp-main'))?.screenshot({ path: `${OUT}/pipedrive-graficos-${t}.png` }).catch(() => {});
  log('shot', t);
}

const pipeErrs = errors.filter(e => /pipedrive|metrics|conversion/i.test(e));
log('RESUMO =>', JSON.stringify({
  metricsHttp: metricsResp?.http, dailyPts: metricsResp?.daily,
  convHttp: convResp?.http, winRate: convResp?.win, cicloMedio: convResp?.cycleAvg, agingApi: convResp?.aging,
  temGrafico: info.temChart, segBotoes: info.seg, distBaldes: info.distRows,
  convTiles: info.convTiles.length, agingRows: info.agingRows,
  toggleSemana: aposSemana === 'Semana', toggleMes: aposMes === 'Mês', graficoPersiste: aindaTemChart,
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
