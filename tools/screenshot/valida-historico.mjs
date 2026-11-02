// READ-ONLY: valida SÓ a tela Histórico do panel-ads (mock) em dark+light.
// Foco: gráficos ECharts (canvas) + grid + filtro cruzado + 0 erro de console.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
import { mkdirSync } from 'fs';

const OUT = process.env.ADS_OUT || '/tmp/hist-shots';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors']
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

async function setTheme(t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]').catch(() => {});
    await page.waitForTimeout(500);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return c;
}

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2000);

await page.evaluate(() => { location.hash = '#/panel-ads/historico'; });
await page.waitForSelector('[data-ads-react-root] .ads-shell', { timeout: 30000 });
await page.waitForTimeout(1400);

const info = await page.evaluate(() => ({
  head: document.querySelector('.ads-main .ads-pagehead')?.textContent?.trim()?.slice(0, 40) || null,
  grid: document.querySelectorAll('.ads-tablescroll tbody tr').length,
  canvas: document.querySelectorAll('.ads-main canvas').length,     // ECharts = canvas
  chartCards: document.querySelectorAll('.ads-main [class*="ChartCard"], .ads-main [class*="chart"]').length,
  legenda: /origem/i.test(document.querySelector('.ads-main')?.textContent || ''),
}));
log('INFO historico:', JSON.stringify(info));

for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(500);
  const el = await page.$('[data-ads-react-root]') || page;
  await el.screenshot({ path: `${OUT}/historico-${t}.png` }).catch(() => {});
}

// prova de filtro cruzado: clica numa fatia do donut e vê a contagem do grid mudar
const antes = await page.evaluate(() => document.querySelectorAll('.ads-tablescroll tbody tr').length);
// clica no centro do 2º card (donut) para acionar um item
const donut = (await page.$$('.ads-main canvas'))[1];
let depois = antes, chip = false;
if (donut) {
  const box = await donut.boundingBox();
  // anel do donut fica à esquerda-meio (centro em 38%/50%, raio grande) → mira 0.12/0.50
  if (box) { await page.mouse.click(box.x + box.width * 0.12, box.y + box.height * 0.50); await page.waitForTimeout(700); }
  depois = await page.evaluate(() => document.querySelectorAll('.ads-tablescroll tbody tr').length);
  chip = await page.evaluate(() => /Origem:/.test(document.querySelector('.ads-grid-toolbar, .ads-main')?.textContent || ''));
}
log('FILTRO CRUZADO: grid antes=' + antes + ' depois=' + depois + ' chipVisivel=' + chip);

log('RESUMO:', JSON.stringify({
  gridRows: info.grid, canvas: info.canvas,
  consoleErrors: errors.length, amostraErros: errors.slice(0, 6),
}, null, 2));
await browser.close();
log('FIM — imagens em', OUT);
