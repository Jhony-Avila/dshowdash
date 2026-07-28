// Valida o cabeçalho padrão de página (PageHeader) em várias telas — Fase 1 fatia 2.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2500);

const irPara = async (label) => {
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(1800);
  return await page.evaluate(() => {
    const h = document.querySelector('.pp-main .pp-pagehead');
    return h ? {
      temIcone: !!h.querySelector('.pp-pagehead-ic svg'),
      titulo: h.querySelector('.pp-h1')?.textContent,
      contagem: h.querySelector('.pp-pagehead-count')?.textContent ?? null,
    } : null;
  });
};

const telas = ['Visão Geral', 'Negócios', 'Funis', 'Alertas', 'Rankings', 'Previsão', 'Pessoas', 'Saúde', 'Configurações'];
const res = {};
for (const t of telas) res[t] = await irPara(t);
for (const [k, v] of Object.entries(res)) log(`  ${k.padEnd(16)} =>`, JSON.stringify(v));

// screenshots (Negócios com header+count) dark+light
await irPara('Negócios');
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(400); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-pagehead-${t}.png` }).catch(() => {}); }

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather-sp|weather\.sp/i.test(e));
const todasComIcone = Object.values(res).every(v => v && v.temIcone && v.titulo);
log('RESUMO =>', JSON.stringify({ telasComHeaderIcone: todasComIcone, negociosCount: res['Negócios']?.contagem, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
