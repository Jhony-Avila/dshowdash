// Valida a Fase 2 do grid (Elevação Visual do Pipedrive):
// zebra · seleção de linhas · fixar colunas (sticky) · master-detail · totalizadores ·
// itens-por-página · tooltip em conteúdo truncado (Floating UI).
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
page.on('request', r => { const u = r.url(); if (u.includes('/api/pipedrive/deals?')) reqs.push(decodeURIComponent(u.split('/deals?')[1])); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
// estado limpo: sem colunas fixadas/densidade de sessões anteriores
await page.evaluate(() => { localStorage.removeItem('pp:cols:/deals'); localStorage.setItem('pp:dens', 'padrao'); localStorage.setItem('pp:perpage', '25'); });
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);

const fechaPopover = () => page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
const irPara = async (label, ms = 2500) => {
  await fechaPopover();
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(ms);
};
await irPara('Negócios');

// ── 1. Zebra ──────────────────────────────────────────────────
R.zebra = await page.evaluate(() => {
  const trs = [...document.querySelectorAll('.pp-main .pp-table tbody tr')].slice(0, 4);
  const bg = (tr) => getComputedStyle(tr.querySelector('td')).backgroundColor;
  return { impar: bg(trs[0]), par: bg(trs[1]), alternam: bg(trs[0]) !== bg(trs[1]), opacos: !bg(trs[0]).includes('rgba(0, 0, 0, 0)') };
});
log('1. zebra =>', JSON.stringify(R.zebra));

// ── 2. Seleção de linhas ──────────────────────────────────────
await page.evaluate(() => {
  const cbs = [...document.querySelectorAll('.pp-main .pp-td-sel input[type=checkbox]')];
  cbs[0]?.click(); cbs[2]?.click();
});
await page.waitForTimeout(500);
const sel2 = await page.evaluate(() => ({
  barra: document.querySelector('.pp-main .pp-selbar')?.textContent?.replace(/\s+/g, ' ').trim(),
  linhasMarcadas: document.querySelectorAll('.pp-main tbody tr.is-sel').length,
  temExportar: !!document.querySelector('.pp-main .pp-selbar .pp-btn'),
  drawerAbriu: !!document.querySelector('.pp-drawer'),   // clicar no checkbox NÃO pode abrir o drawer
}));
await page.evaluate(() => document.querySelector('.pp-main .pp-th-sel input')?.click());  // marca a página toda
await page.waitForTimeout(500);
const selTodas = await page.evaluate(() => document.querySelectorAll('.pp-main tbody tr.is-sel').length);
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-grid-selecao.png` }).catch(() => {});
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-main .pp-selbar button')].find(x => x.textContent.includes('Limpar')); b?.click(); });
await page.waitForTimeout(400);
R.selecao = { ...sel2, aoMarcarPagina: selTodas, limpou: await page.evaluate(() => !document.querySelector('.pp-main .pp-selbar')) };
log('2. seleção =>', JSON.stringify(R.selecao));

// ── 3. Fixar coluna à esquerda (sticky de verdade) ────────────
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-toolbar-r .pp-iconbtn')].at(-1); b?.click(); });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const item = [...document.querySelectorAll('.pp-colmenu-item')].find(i => i.textContent.includes('Negócio'));
  [...item.querySelectorAll('.pp-colmenu-mv button')].find(b => b.getAttribute('aria-label') === 'Fixar à esquerda')?.click();
});
await page.waitForTimeout(500);
await fechaPopover();
R.fixarCol = await page.evaluate(async () => {
  const cont = document.querySelector('.pp-main .pp-gridcard > div');
  const cel = document.querySelector('.pp-main tbody tr td.pp-stk-esq:not(.pp-td-sel):not(.pp-td-exp)');
  const solta = document.querySelector('.pp-main tbody tr td:not(.pp-stk)');
  if (!cont || !cel || !solta) return null;
  const antes = cel.getBoundingClientRect().left, antesSolta = solta.getBoundingClientRect().left;
  cont.scrollLeft = 320;
  await new Promise(r => setTimeout(r, 350));
  return {
    posicao: getComputedStyle(cel).position,
    fixaNaoAndou: Math.abs(cel.getBoundingClientRect().left - antes) < 2,
    soltaAndou: Math.abs(solta.getBoundingClientRect().left - antesSolta) > 100,
    temSombra: getComputedStyle(document.querySelector('.pp-main tbody td.pp-stk-esq.is-edge')).boxShadow !== 'none',
  };
});
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-grid-colunafixa.png` }).catch(() => {});
log('3. coluna fixa =>', JSON.stringify(R.fixarCol));

// ── 3b. Cabeçalho ALINHADO com o corpo (com coluna fixada, rolado e no início) ──
R.alinhamento = await page.evaluate(async () => {
  const t = document.querySelector('.pp-main .pp-table');
  const cont = document.querySelector('.pp-main .pp-gridcard > div');
  const medir = () => {
    const ths = [...t.querySelectorAll('thead th')];
    const tds = [...t.querySelectorAll('tbody tr:not(.pp-det-tr)')[0].querySelectorAll('td')];
    const dif = ths.map((th, i) => Math.abs(th.getBoundingClientRect().left - tds[i].getBoundingClientRect().left));
    return { celulas: ths.length, maiorDesvio: Math.round(Math.max(...dif)), todasSticky: ths.filter(th => getComputedStyle(th).position === 'sticky').length };
  };
  const rolado = medir();
  cont.scrollLeft = 0; await new Promise(r => setTimeout(r, 300));
  return { rolado, inicio: medir() };
});
log('3b. alinhamento cabeçalho×corpo =>', JSON.stringify(R.alinhamento));
await page.evaluate(() => { const c = document.querySelector('.pp-main .pp-gridcard > div'); if (c) c.scrollLeft = 0; });

// ── 4. Master-detail (linha expansível) ───────────────────────
await page.evaluate(() => document.querySelector('.pp-main .pp-expbtn')?.click());
await page.waitForTimeout(600);
R.detalhe = await page.evaluate(() => ({
  abriu: !!document.querySelector('.pp-main tr.pp-det-tr'),
  campos: document.querySelectorAll('.pp-main tr.pp-det-tr .pp-det-item').length,
  drawerAbriu: !!document.querySelector('.pp-drawer'),   // expandir NÃO pode abrir o drawer
}));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-grid-detalhe.png` }).catch(() => {});
await page.evaluate(() => document.querySelector('.pp-main .pp-expbtn')?.click());
await page.waitForTimeout(400);
R.detalhe.fechou = await page.evaluate(() => !document.querySelector('.pp-main tr.pp-det-tr'));
log('4. master-detail =>', JSON.stringify(R.detalhe));

// ── 5. Totalizadores (rodapé) ─────────────────────────────────
R.totais = await page.evaluate(() => {
  const tf = document.querySelector('.pp-main .pp-table tfoot');
  return tf ? { rotulo: tf.querySelector('.pp-tot-lbl')?.textContent, valor: tf.querySelector('.pp-tot')?.textContent, sticky: getComputedStyle(tf.querySelector('td')).position } : null;
});
log('5. totalizadores =>', JSON.stringify(R.totais));

// ── 6. Itens por página ───────────────────────────────────────
const antesReq = reqs.length;
await page.selectOption('.pp-pager select.pp-select', '50');
await page.waitForTimeout(2500);
R.itensPorPagina = await page.evaluate(() => ({
  linhas: document.querySelectorAll('.pp-main tbody tr:not(.pp-det-tr)').length,
  storage: localStorage.getItem('pp:perpage'),
}));
R.itensPorPagina.requisicao = reqs.slice(antesReq).at(-1)?.includes('per_page=50') ?? false;
log('6. itens/página =>', JSON.stringify(R.itensPorPagina));

// ── 7. Tooltip em conteúdo truncado (Floating UI) ─────────────
const alvo = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.pp-main tbody td')];
  const el = els.find(e => { const i = e.querySelector('.pp-td-title') ?? e; return i.scrollWidth > i.clientWidth + 1; });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, texto: el.textContent.trim().slice(0, 30) };
});
if (alvo) { await page.mouse.move(alvo.x, alvo.y); await page.waitForTimeout(700); }
R.tooltip = await page.evaluate(() => {
  const t = document.querySelector('.pp-tip');
  return t ? { apareceu: true, texto: t.textContent.slice(0, 40), posicao: getComputedStyle(t).position } : { apareceu: false };
});
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-grid-tooltip.png` }).catch(() => {});
// sai de cima da célula: a tooltip precisa sumir
await page.mouse.move(10, 10); await page.waitForTimeout(500);
R.tooltip.sumiu = await page.evaluate(() => !document.querySelector('.pp-tip'));
log('7. tooltip =>', JSON.stringify(R.tooltip));

// ── 8. Screenshots dark + light ───────────────────────────────
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(600);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-grid-fase2-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather|whatsapp|instagram|wechat|integration\.api\.fetch/i.test(e));
log('\nRESUMO =>', JSON.stringify({ ...R, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', JSON.stringify(pipeErrs.slice(0, 8)));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
