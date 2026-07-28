// Valida a seccao de metricas na Visao Geral (tendencia/ranking/produtos/uso API), dark+light.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const SP = '/tmp/claude-0/-root/bcaec054-5c64-423c-81cf-d6c1aa28e400/scratchpad';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let metricsResp = null;
page.on('response', async (r) => { if (r.url().includes('/api/pipedrive/metrics')) { let b = null; try { b = await r.json(); } catch {} metricsResp = { http: r.status(), keys: b?.data ? Object.keys(b.data) : null, owners: b?.data?.owners?.length, hourly: b?.data?.hourly?.length, daily: b?.data?.daily?.length }; } });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
// Visao Geral e a tela default; espera as metricas
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const h3s = [...document.querySelectorAll('.pp-main .pp-card h3')].map(h => h.textContent.trim());
  const sparks = document.querySelectorAll('.pp-spark').length;
  const sparkBars = document.querySelectorAll('.pp-spark-bar').length;
  const ownersCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Ranking'));
  const ownerRows = ownersCard ? ownersCard.querySelectorAll('.pp-table tbody tr').length : 0;
  const ownerFirst = ownersCard ? [...(ownersCard.querySelector('.pp-table tbody tr')?.querySelectorAll('td') || [])].map(td => td.textContent.trim()) : null;
  const prodCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Top produtos'));
  const prodEmpty = prodCard ? !!prodCard.querySelector('.pp-placeholder') : null;
  const apiCard = [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Uso da API'));
  const apiBars = apiCard ? apiCard.querySelectorAll('.pp-spark-bar').length : 0;
  return { h3s, sparks, sparkBars, ownerRows, ownerFirst, prodEmpty, apiBars };
});
log('SECAO METRICAS:', JSON.stringify(info, null, 2));
log('API /metrics:', JSON.stringify(metricsResp));

// Rola ate o card de Uso da API e tira screenshots dark+light do root inteiro
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(600);
  const apiCard = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-card')].find(c => c.querySelector('h3')?.textContent.includes('Ranking')));
  await apiCard.asElement()?.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-metrics-${t}.png` }).catch(() => {});
  // tambem captura so a area de metricas (ranking+produtos+api) para inspecao
  const rank = await page.$('.pp-main');
  await rank?.screenshot({ path: `${SP}/metrics-full-${t}.png` }).catch(() => {});
  log('shot', t);
}

const pipeErrs = errors.filter(e => /pipedrive|metrics/i.test(e));
log('RESUMO =>', JSON.stringify({
  temTendencia: info.h3s.some(h => h.includes('Tendência')),
  temRanking: info.h3s.some(h => h.includes('Ranking')),
  temTopProdutos: info.h3s.some(h => h.includes('Top produtos')),
  temUsoAPI: info.h3s.some(h => h.includes('Uso da API')),
  metricsHttp: metricsResp?.http,
  ownerRows: info.ownerRows,
  apiBars: info.apiBars,
  prodEmptyState: info.prodEmpty,
  consoleErrsPipe: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
