// Valida os drawers de Atividade (#18), Lead (#19), Produto (#20) + "Abrir no Pipedrive" (#22).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const apis = [];
page.on('response', r => { const u = r.url(); const m = u.match(/\/api\/pipedrive\/(activities|leads|products)\/([^/?]+)/); if (m) apis.push(`${r.status()} ${m[1]}/${m[2].slice(0, 12)}`); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
await page.waitForTimeout(1500);

const clickTab = async (label) => {
  const btn = await page.evaluateHandle((lbl) => [...document.querySelectorAll('.pp-navitem')].find(b => b.textContent.includes(lbl)), label);
  await btn.asElement()?.click().catch(() => {});
  await page.waitForTimeout(2500);
};
const abreDrawerNaLinha = async () => {
  await page.click('.pp-main .pp-table tbody tr').catch(() => {});
  await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  return await page.evaluate(() => {
    const dr = document.querySelector('.pp-drawer');
    if (!dr) return null;
    const link = dr.querySelector('a.pp-btn[href*="pipedrive.com"]');
    return {
      titulo: dr.querySelector('h2')?.textContent?.trim(),
      h4s: [...dr.querySelectorAll('h4')].map(h => h.textContent.trim()),
      linhas: dr.querySelectorAll('.pp-row').length,
      abrirHref: link?.getAttribute('href') ?? null,
      abrirTexto: link?.textContent?.trim() ?? null,
      vinculosClicaveis: dr.querySelectorAll('.pp-clik').length,
    };
  });
};
const fechaDrawer = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(600); };

const R = {};
await clickTab('Atividades'); R.atividade = await abreDrawerNaLinha();
log('ATIVIDADE drawer:', JSON.stringify(R.atividade));
// screenshot do drawer de atividade (dark+light)
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(400); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-drawer-atividade-${t}.png` }).catch(() => {}); }
await setTheme('dark'); await fechaDrawer();

await clickTab('Leads'); R.lead = await abreDrawerNaLinha();
log('LEAD drawer:', JSON.stringify(R.lead));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-drawer-lead-dark.png` }).catch(() => {});
await fechaDrawer();

await clickTab('Produtos'); R.produto = await abreDrawerNaLinha();
log('PRODUTO drawer:', JSON.stringify(R.produto));
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(400); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-drawer-produto-${t}.png` }).catch(() => {}); }
await setTheme('dark');

// Testa navegacao empilhada: no drawer de produto, clicar num negocio abre DealDrawer
let empilhado = null;
if (R.produto && R.produto.vinculosClicaveis > 0) {
  await page.click('.pp-drawer .pp-clik').catch(() => {});
  await page.waitForTimeout(1200);
  empilhado = await page.evaluate(() => document.querySelectorAll('.pp-drawer').length);
}
log('Navegação empilhada (produto→negócio): drawers no DOM =', empilhado);

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather-sp|weather\.sp/i.test(e));
log('APIS detalhe:', JSON.stringify(apis));
log('RESUMO =>', JSON.stringify({
  atividade: { titulo: !!R.atividade?.titulo, abrir: R.atividade?.abrirTexto, href: R.atividade?.abrirHref?.includes('pipedrive.com') },
  lead: { titulo: !!R.lead?.titulo, abrir: R.lead?.abrirTexto, hrefLead: R.lead?.abrirHref?.includes('/leads/inbox/') },
  produto: { titulo: !!R.produto?.titulo, abrir: R.produto?.abrirTexto, hrefProd: R.produto?.abrirHref?.includes('/products/') },
  empilhado, apisOk: apis.every(a => a.startsWith('200')), consoleErrs: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
