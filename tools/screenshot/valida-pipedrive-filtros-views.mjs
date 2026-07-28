// Valida filtros avançados (#8: multi/faixa) e visões salvas (#9) no grid de Negócios.
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
const dealsUrls = [];
page.on('request', r => { const u = r.url(); if (u.includes('/api/pipedrive/deals?')) dealsUrls.push(decodeURIComponent(u.split('/deals?')[1])); });

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
const fecharPopover = async () => { await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click()); await page.waitForTimeout(300); };
const clickBtnText = async (txt) => {
  await fecharPopover(); // garante que nenhum overlay intercepta o clique
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('.pp-filtros button')].find(b => b.textContent.includes(t)), txt);
  await h.asElement()?.click().catch(() => {});
  await page.waitForTimeout(500);
};

await clickTab('Negócios');
const totalInicial = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent);
log('total inicial:', totalInicial);

// ── #8 multi-seleção: abre "Status", marca "Abertos" ──
await clickBtnText('Status');
await page.waitForSelector('.pp-colmenu-esq', { timeout: 4000 }).catch(() => {});
// marca o checkbox "Abertos"
const marcou = await page.evaluate(() => {
  const menu = document.querySelector('.pp-colmenu-esq');
  const item = [...(menu?.querySelectorAll('.pp-colmenu-item label') || [])].find(l => l.textContent.includes('Abertos'));
  const cb = item?.querySelector('input[type=checkbox]');
  if (cb) { cb.click(); return true; } return false;
});
await page.waitForTimeout(1800);
await fecharPopover();
const totalAbertos = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent);
log('multi Status=Abertos marcou:', marcou, '| total:', totalAbertos);

// ── #8 faixa de valor: abre Avançado, seta value_min ──
await clickBtnText('Avançado');
await page.waitForSelector('.pp-adv', { timeout: 4000 }).catch(() => {});
const temAdv = await page.evaluate(() => !!document.querySelector('.pp-adv'));
await page.fill('.pp-adv input[type=number]', '100000').catch(() => {});
await page.waitForTimeout(1800);
const totalFaixaValor = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent);
log('painel avançado:', temAdv, '| após value_min=100000:', totalFaixaValor);

// screenshots com painel avançado aberto
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(400); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-filtros-${t}.png` }).catch(() => {}); }
await setTheme('dark');

// ── #9 salvar visão ──
await clickBtnText('Visões');
await page.fill('.pp-colmenu input[placeholder*="Salvar visão"]', 'Abertos alto valor').catch(() => {});
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-colmenu button')].find(x => x.textContent.trim() === 'Salvar'); b?.click(); });
await page.waitForTimeout(700);
const salvou = await page.evaluate(() => JSON.parse(localStorage.getItem('pp:views:/deals') || '[]').map(v => v.nome));
log('visões no localStorage após salvar:', JSON.stringify(salvou));

// limpa filtros, confirma reset, depois aplica a visão salva
await fecharPopover();
await clickBtnText('Limpar');
await page.waitForTimeout(1500);
const totalLimpo = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent);
await clickBtnText('Visões');
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-view-apply')].find(x => x.textContent.includes('Abertos alto valor')); b?.click(); });
await page.waitForTimeout(1800);
const totalReaplicado = await page.evaluate(() => document.querySelector('.pp-sub')?.textContent);
const valMinReaplicado = await page.evaluate(() => document.querySelector('.pp-adv input[type=number]')?.value);
log('após Limpar:', totalLimpo, '| após aplicar visão:', totalReaplicado, '| value_min restaurado:', valMinReaplicado);

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather-sp|weather\.sp/i.test(e));
log('URLS /deals (amostra):', JSON.stringify(dealsUrls.slice(-6)));
log('RESUMO =>', JSON.stringify({
  multiMarcou: marcou, statusNaUrl: dealsUrls.some(u => /status=open/.test(u)),
  temPainelAvancado: temAdv, valueMinNaUrl: dealsUrls.some(u => /value_min=100000/.test(u)),
  visaoSalva: salvou.includes('Abertos alto valor'),
  reaplicouValueMin: valMinReaplicado === '100000',
  consoleErrs: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
