// Valida a sidebar colapsável + agrupada + ícones Lucide (Elevação visual Fase 1).
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
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const nav = document.querySelector('.pp-nav');
  return {
    grupos: [...document.querySelectorAll('.pp-nav-group-h')].map(h => h.firstChild?.textContent?.trim()),
    navItens: document.querySelectorAll('.pp-navitem').length,
    iconesSVG: document.querySelectorAll('.pp-navitem .pp-navitem-ic').length,
    temFooter: !!document.querySelector('.pp-nav-footer'),
    footerTxt: document.querySelector('.pp-nav-footer')?.innerText?.replace(/\n/g, ' '),
    ativo: document.querySelector('.pp-navitem.is-active .pp-navitem-txt')?.textContent,
    larguraExpandida: nav?.getBoundingClientRect().width,
  };
});
log('SIDEBAR (expandida):', JSON.stringify(info, null, 2));
for (const t of ['dark', 'light']) { await setTheme(t); await page.waitForTimeout(400); await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-sidebar-${t}.png` }).catch(() => {}); }
await setTheme('dark');

// Recolher
await page.click('.pp-nav-toggle').catch(() => {});
await page.waitForTimeout(600);
const compacto = await page.evaluate(() => {
  const nav = document.querySelector('.pp-nav');
  return {
    temClasseCompacta: nav?.classList.contains('compacta'),
    larguraCompacta: nav?.getBoundingClientRect().width,
    labelsVisiveis: document.querySelectorAll('.pp-navitem .pp-navitem-txt').length,
    lsCompact: localStorage.getItem('pp:sidebar:compact'),
  };
});
log('SIDEBAR (compacta):', JSON.stringify(compacto));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-sidebar-compacta.png` }).catch(() => {});

// Expandir de volta e testar recolher grupo
await page.click('.pp-nav-toggle').catch(() => {});
await page.waitForTimeout(500);
const itensAntes = await page.evaluate(() => document.querySelectorAll('.pp-navitem').length);
await page.evaluate(() => { const h = [...document.querySelectorAll('.pp-nav-group-h')].find(x => x.textContent.includes('Cadastros')); h?.click(); });
await page.waitForTimeout(500);
const grupoRecolhido = await page.evaluate(() => ({
  itensDepois: document.querySelectorAll('.pp-navitem').length,
  lsGroups: localStorage.getItem('pp:sidebar:groups'),
}));
log('grupo Cadastros recolhido: itens', itensAntes, '->', grupoRecolhido.itensDepois, '| ls:', grupoRecolhido.lsGroups);

// navegar por um item (Kanban) para confirmar roteamento
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Kanban')); b?.click(); });
await page.waitForTimeout(1500);
const navegou = await page.evaluate(() => ({ hash: location.hash, ativo: document.querySelector('.pp-navitem.is-active .pp-navitem-txt')?.textContent }));
log('navegou p/ Kanban:', JSON.stringify(navegou));

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather-sp|weather\.sp/i.test(e));
log('RESUMO =>', JSON.stringify({
  grupos: info.grupos, navItens: info.navItens, iconesSVG: info.iconesSVG, temFooter: info.temFooter,
  recolheu: compacto.temClasseCompacta, encolheu: (compacto.larguraCompacta ?? 999) < (info.larguraExpandida ?? 0),
  labelsSumiram: compacto.labelsVisiveis === 0, persistiuCompact: compacto.lsCompact === '1',
  grupoRecolheItens: grupoRecolhido.itensDepois < itensAntes, navegouKanban: navegou.hash.includes('kanban'),
  consoleErrs: pipeErrs.length,
}, null, 2));
if (pipeErrs.length) log('ERROS:', pipeErrs.slice(0, 8));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
