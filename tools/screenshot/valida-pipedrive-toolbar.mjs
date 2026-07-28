// Valida a Fase 1 fatia 3 da Elevação Visual do Pipedrive:
// toolbar única (atualizar/densidade/tela cheia/CSV/visões/colunas), chips de filtro ativo
// e estados padronizados (skeleton no 1º load, vazio com "Limpar filtros", erro com retry).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);
const R = {};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const reqs = [];
page.on('request', r => { const u = r.url(); if (u.includes('/api/pipedrive/')) reqs.push(decodeURIComponent(u.split('/api/pipedrive/')[1])); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);

const irPara = async (label, ms = 2200) => {
  await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());  // fecha popover (Escape NÃO fecha)
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(ms);
};
const contagem = () => page.evaluate(() => document.querySelector('.pp-main .pp-pagehead-count')?.textContent ?? null);
const iconbtn = (i) => page.evaluate((n) => { const b = document.querySelectorAll('.pp-toolbar-r .pp-iconbtn')[n]; b?.click(); }, i);

// ── 1. Estrutura da toolbar (grid de Negócios) ────────────────
await irPara('Negócios');
R.toolbar = await page.evaluate(() => {
  const t = document.querySelector('.pp-main .pp-toolbar');
  return t ? {
    temBusca: !!t.querySelector('.pp-toolbar-l input.pp-input'),
    filtrosNaEsquerda: t.querySelectorAll('.pp-toolbar-l button, .pp-toolbar-l select').length,
    acoesNaDireita: t.querySelectorAll('.pp-toolbar-r .pp-iconbtn').length,
    acoesComRotulo: [...t.querySelectorAll('.pp-toolbar-r .pp-iconbtn')].every(b => !!b.getAttribute('aria-label')),
    sobrouFiltrosAntigo: !!document.querySelector('.pp-main .pp-filtros'),
  } : null;
});
log('1. toolbar =>', JSON.stringify(R.toolbar));

// ── 2. Atualizar dispara refetch ──────────────────────────────
const antes = reqs.length;
await iconbtn(0);
await page.waitForTimeout(1800);
R.atualizar = { novasChamadas: reqs.slice(antes).filter(u => u.startsWith('deals')).length };
log('2. atualizar =>', JSON.stringify(R.atualizar));

// ── 3. Densidade (compacta) + persistência ────────────────────
await iconbtn(1);
await page.waitForTimeout(400);
await page.evaluate(() => {
  const item = [...document.querySelectorAll('.pp-colmenu-item label')].find(l => l.textContent.includes('Compacta'));
  item?.querySelector('input[type=radio]')?.click();
});
await page.waitForTimeout(600);
R.densidade = await page.evaluate(() => ({
  classe: [...(document.querySelector('.pp-main .pp-table')?.classList ?? [])].filter(c => c.startsWith('pp-dens-')),
  storage: localStorage.getItem('pp:dens'),
  padTd: getComputedStyle(document.querySelector('.pp-main .pp-table tbody td')).paddingTop,
}));
log('3. densidade =>', JSON.stringify(R.densidade));

// ── 4. Tela cheia + Escape ────────────────────────────────────
await iconbtn(2);
await page.waitForTimeout(600);
const fsOn = await page.evaluate(() => {
  const w = document.querySelector('.pp-gridwrap.is-fs');
  if (!w) return null;
  const r = w.getBoundingClientRect(); const s = document.querySelector('.pp-shell').getBoundingClientRect();
  return { cobreShell: Math.round(r.width) === Math.round(s.width), navVisivel: !!document.querySelector('.pp-nav')?.offsetParent };
});
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-toolbar-telacheia.png` }).catch(() => {});
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
R.telaCheia = { ligou: fsOn, saiuComEsc: await page.evaluate(() => !document.querySelector('.pp-gridwrap.is-fs')) };
log('4. tela cheia =>', JSON.stringify(R.telaCheia));

// ── 5. Chips de filtro ativo (aplica multi Status=Abertos) ────
const totalSemFiltro = await contagem();
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-toolbar-l button')].find(x => x.textContent.includes('Status')); b?.click(); });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const item = [...document.querySelectorAll('.pp-colmenu-esq .pp-colmenu-item label')].find(l => l.textContent.includes('Abertos'));
  item?.querySelector('input[type=checkbox]')?.click();
});
await page.waitForTimeout(1800);
await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
await page.waitForTimeout(400);
const comFiltro = await contagem();
const chipTxt = await page.evaluate(() => document.querySelector('.pp-fchip')?.textContent ?? null);
await page.evaluate(() => document.querySelector('.pp-fchip button')?.click());   // remove pelo ✕ do chip
await page.waitForTimeout(1800);
R.chips = {
  totalSemFiltro, comFiltro, chip: chipTxt,
  totalAposRemover: await contagem(),
  chipsSumiram: await page.evaluate(() => document.querySelectorAll('.pp-fchip').length === 0),
};
log('5. chips =>', JSON.stringify(R.chips));

// ── 6. Estado VAZIO (busca sem resultado) + Limpar filtros ────
await page.fill('.pp-toolbar-l input.pp-input', 'zzzzz-nao-existe-zzzzz');
await page.press('.pp-toolbar-l input.pp-input', 'Enter');
await page.waitForTimeout(2000);
const vazio = await page.evaluate(() => {
  const e = document.querySelector('.pp-main .pp-estado');
  return e ? { titulo: e.querySelector('.pp-estado-t')?.textContent, temIcone: !!e.querySelector('.pp-estado-ic svg'), acao: e.querySelector('.pp-estado-a button')?.textContent } : null;
});
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-toolbar-vazio.png` }).catch(() => {});
await page.evaluate(() => document.querySelector('.pp-main .pp-estado-a button')?.click());
await page.waitForTimeout(2000);
R.vazio = { ...vazio, totalAposLimpar: await contagem() };
log('6. estado vazio =>', JSON.stringify(R.vazio));

// ── 7. SKELETON no 1º carregamento (atrasa /persons) ──────────
await page.route('**/api/pipedrive/persons**', async (route) => { await new Promise(r => setTimeout(r, 2500)); await route.continue(); });
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes('Pessoas')); b?.click(); });
await page.waitForTimeout(900);
R.skeleton = await page.evaluate(() => ({
  linhasFantasma: document.querySelectorAll('.pp-main .pp-skel-tr').length,
  celulas: document.querySelectorAll('.pp-main .pp-skel').length,
  cabecalhoVisivel: document.querySelectorAll('.pp-main .pp-table thead th').length,
}));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-toolbar-skeleton.png` }).catch(() => {});
await page.waitForTimeout(3000);
R.skeleton.sumiuAposCarregar = await page.evaluate(() => document.querySelectorAll('.pp-main .pp-skel-tr').length === 0);
await page.unroute('**/api/pipedrive/persons**');
log('7. skeleton =>', JSON.stringify(R.skeleton));

// ── 8. Estado de ERRO com "Tentar novamente" (força 500) ──────
let falhar = true;
await page.route('**/api/pipedrive/products**', async (route) => {
  if (falhar) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":{"code":"TESTE"}}' });
  return route.continue();
});
await irPara('Produtos', 9000);   // 2 retries do React Query (1s+2s) antes do erro aparecer
const erro = await page.evaluate(() => {
  const e = document.querySelector('.pp-main .pp-estado.is-err');
  return e ? { titulo: e.querySelector('.pp-estado-t')?.textContent, botao: e.querySelector('.pp-estado-a button')?.textContent } : null;
});
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-toolbar-erro.png` }).catch(() => {});
falhar = false;
await page.evaluate(() => document.querySelector('.pp-main .pp-estado-a button')?.click());
await page.waitForTimeout(2500);
R.erro = { ...erro, recuperouComRetry: await page.evaluate(() => document.querySelectorAll('.pp-main .pp-table tbody tr').length > 0) };
await page.unroute('**/api/pipedrive/products**');
log('8. estado erro =>', JSON.stringify(R.erro));

// ── 9. Screenshots dark + light do grid com toolbar/chips ─────
await irPara('Negócios');
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-toolbar-l button')].find(x => x.textContent.includes('Status')); b?.click(); });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const item = [...document.querySelectorAll('.pp-colmenu-esq .pp-colmenu-item label')].find(l => l.textContent.includes('Abertos'));
  item?.querySelector('input[type=checkbox]')?.click();
});
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(600);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-toolbar-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather-sp|weather\.sp|500 \(Internal Server Error\)|Failed to load resource/i.test(e));
log('\nRESUMO =>', JSON.stringify({ ...R, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS_FILTRADOS:', JSON.stringify(pipeErrs.slice(0, 8)));
log('ERROS_BRUTOS:', JSON.stringify(errors));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
