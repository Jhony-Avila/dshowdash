// Valida a secao "Campos personalizados" no DealDrawer (nomes/rotulos reais).
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

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trig = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trig) await trig.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

// verifica direto pela API que o deal 40565 traz custom_fields resolvidos
const apiCF = await page.evaluate(async () => {
  const r = await fetch('/api/pipedrive/deals/40565', { credentials: 'include', headers: { Accept: 'application/json' } });
  const b = await r.json();
  return { http: r.status, campos: (b?.data?.custom_fields || []).map(c => `${c.name}=${String(c.value).slice(0, 20)}`) };
});
log('API deal 40565 custom_fields:', JSON.stringify(apiCF, null, 1));

// Negocios -> buscar "Painel" -> abrir 1o resultado -> conferir secao
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Negócios')); b?.click(); });
await page.waitForSelector('.pp-table tbody tr', { timeout: 15000 });
await page.fill('.pp-filtros input', 'Painel');
await page.keyboard.press('Enter');
await page.waitForTimeout(1500);
let achou = null;
for (let i = 0; i < 6; i++) {
  const linhas = await page.$$('.pp-table tbody tr');
  if (linhas[i]) {
    await linhas[i].click();
    await page.waitForSelector('.pp-drawer', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const info = await page.evaluate(() => {
      const dr = document.querySelector('.pp-drawer'); if (!dr) return null;
      const h4 = [...dr.querySelectorAll('h4')].map(h => h.textContent.trim());
      const temCF = h4.includes('Campos personalizados');
      let campos = [];
      if (temCF) {
        const idx = [...dr.children].findIndex(() => false);
        campos = [...dr.querySelectorAll('.pp-row')].filter(r => r.previousElementSibling || true).map(r => r.querySelector('.pp-k')?.textContent?.trim()).filter(Boolean);
      }
      return { titulo: dr.querySelector('h2')?.textContent?.trim(), h4, temCF };
    });
    if (info?.temCF) { achou = info; break; }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  }
}
log('DRAWER com campos personalizados:', JSON.stringify(achou));

// screenshot do drawer atual (se aberto)
for (const t of ['dark', 'light']) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(600); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); }
  await page.waitForTimeout(400);
  const dr = await page.$('.pp-drawer');
  await dr?.screenshot({ path: `${SP}/cf-${t}.png` }).catch(() => {});
  const el = await page.$('[data-pp-react-root]') || page;
  await el.screenshot({ path: `${OUT}/pipedrive-cf-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => /pipedrive|deals/i.test(e));
log('RESUMO =>', JSON.stringify({ apiHttp: apiCF.http, apiCampos: apiCF.campos.length, drawerTemCF: !!achou, consoleErrsPipe: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 5));
await browser.close();
log('FIM');
