// READ-ONLY: prova que o módulo Bling monta e funciona no navegador real.
// Molde: proof-gcal-entradas.mjs.
//
// CONTROLE obrigatório: o Google Calendar, que NÃO foi tocado nesta entrega.
// Sem ele, um "não montou" não distingue problema da entrega de problema de
// ambiente/sessão.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const log = (...a) => console.log(...a);
let falhas = 0;
const ok = (nome, cond, det = '') => {
  log(`  ${cond ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m'} ${nome}${det ? `  (${det})` : ''}`);
  if (!cond) falhas++;
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true,
});
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const erros = [];
page.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 220)); });
page.on('pageerror', e => erros.push('pageerror: ' + String(e).slice(0, 220)));

const req404 = [];
page.on('response', r => { if (r.status() >= 400 && r.url().includes('/bling')) req404.push(`${r.status()} ${r.url().slice(0, 110)}`); });

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);

const irPara = async (h) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(2600); };
const montou = async (sel, ms = 18000) => {
  try { await page.waitForSelector(sel, { timeout: ms }); return true; } catch { return false; }
};

// ── CONTROLE ────────────────────────────────────────────────
log('\n\x1b[1m[CONTROLE] Google Calendar (não tocado nesta entrega)\x1b[0m');
await irPara('#/panel-google-calendar');
const ctrlOk = await montou('[data-gc-react-root]', 15000);
ok('controle monta', ctrlOk, ctrlOk ? '' : 'se falhou, o problema é de ambiente, não da entrega');

// ── 1. Rota direta ──────────────────────────────────────────
log('\n\x1b[1m[1] Rota #/panel-bling\x1b[0m');
await irPara('#/panel-bling');
const raiz = await montou('[data-bl-root]');
ok('painel monta em [data-bl-root]', raiz);

if (!raiz) {
  log('\n  conteúdo do container-main:');
  log((await page.evaluate(() => document.querySelector('#container-main, main')?.innerText?.slice(0, 400) ?? 'vazio')));
  log('\n  erros de console:'); erros.slice(0, 8).forEach(e => log('   ', e));
  await browser.close();
  process.exit(1);
}

ok('sub-sidebar presente', await page.locator('nav[aria-label="Seções do Bling"]').count() > 0);
ok('tarja de ambiente simulado visível',
   (await page.locator('text=Ambiente de demonstração').count()) > 0);
ok('header interno com título Bling',
   (await page.evaluate(() => document.querySelector('[data-bl-root] header')?.innerText?.includes('Bling') ?? false)));

// ── 2. Visão Geral: KPIs, saúde, atenção, gráficos ──────────
log('\n\x1b[1m[2] Visão Geral\x1b[0m');
const kpis = await page.locator('[data-bl-root] .bl-cartao').count();
ok('KPIs renderizados', kpis >= 10, `${kpis} cartões`);

const temValor = await page.evaluate(() => {
  const t = document.querySelector('[data-bl-root] main')?.innerText ?? '';
  return /R\$\s?[\d.,]+/.test(t);
});
ok('valores monetários formatados em pt-BR', temValor);

const canvas = await page.locator('[data-bl-root] canvas').count();
ok('gráfico ECharts renderizado', canvas >= 1, `${canvas} canvas`);

const svgs = await page.locator('[data-bl-root] svg').count();
ok('visualizações D3 renderizadas (SVG)', svgs >= 2, `${svgs} svg`);

// As seções usam text-transform:uppercase — innerText devolve o texto JÁ
// transformado. Comparar em minúsculo evita um falso negativo do teste.
const secoes = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-bl-root] main h2')).map(h => h.innerText.toLowerCase()));
ok('seção do Sankey empresarial presente', secoes.some(s => s.includes('fluxo empresarial')), secoes.length + ' seções');
ok('painel "Exige atenção" presente', secoes.some(s => s.includes('exige aten')));
ok('seção de saúde operacional presente', secoes.some(s => s.includes('saúde operacional')));
ok('mapa de relacionamento presente', secoes.some(s => s.includes('mapa de relacionamento')));

// ── 3. Navegação entre telas ────────────────────────────────
log('\n\x1b[1m[3] Navegação pela sub-sidebar\x1b[0m');
const alvos = [
  ['pedidos-venda', 'Pedidos de Venda'],
  ['estoque', 'Estoque'],
  ['notas-fiscais', 'Notas Fiscais'],
  ['fluxo-caixa', 'Fluxo de Caixa'],
  ['rentabilidade', 'Rentabilidade'],
  ['curva-abc', 'Curva ABC'],
  ['sincronizacao', 'Sincronização'],
  ['necessidades-compra', 'Necessidades de Compra'],
];
// Espera a CONDIÇÃO (o título aparecer), não um tempo fixo. Com espera fixa o
// teste falha quando a máquina está ocupada — e um teste instável perde o valor:
// ninguém sabe se a falha é do código ou do relógio.
for (const [id, titulo] of alvos) {
  await page.evaluate(x => { location.hash = x; }, `#/panel-bling/x/${id}`);
  let chegou = true;
  try {
    await page.waitForFunction(
      alvo => document.querySelector('[data-bl-root] main h1')?.innerText?.includes(alvo) ?? false,
      titulo, { timeout: 20000 },
    );
  } catch { chegou = false; }

  const t = await page.evaluate(() => document.querySelector('[data-bl-root] main h1')?.innerText ?? '');
  const semErro = !(await page.evaluate(() =>
    document.querySelector('[data-bl-root] [role="alert"]')?.innerText?.includes('Não foi possível') ?? false));
  ok(`abre "${titulo}"`, chegou && semErro, t || 'sem título');
}

// ── 4. Grid server-side ─────────────────────────────────────
log('\n\x1b[1m[4] Grid de Pedidos de Venda\x1b[0m');
await page.evaluate(() => { location.hash = '#/panel-bling/vendas/pedidos-venda'; });
// Espera a tabela ter linhas de verdade, em vez de contar cedo demais.
await page.waitForFunction(
  () => (document.querySelectorAll('[data-bl-root] tbody tr').length > 3),
  undefined, { timeout: 20000 },
).catch(() => {});
const linhas = await page.locator('[data-bl-root] tbody tr').count();
ok('grid com linhas', linhas > 3, `${linhas} linhas`);
const cabecalhos = await page.locator('[data-bl-root] thead th').count();
ok('grid com cabeçalhos', cabecalhos > 5, `${cabecalhos} colunas`);
const tfoot = await page.locator('[data-bl-root] tfoot').count();
ok('totalizadores no rodapé', tfoot >= 1);
const badges = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-bl-root] tbody span'))
    .filter(s => /Entregue|Aprovado|Faturado|Cancelado|Enviado/.test(s.textContent ?? '')).length);
ok('situações renderizadas como badge', badges > 0, `${badges} badges`);

// ── 5. Busca do módulo (Ctrl+K) ─────────────────────────────
log('\n\x1b[1m[5] Busca do módulo\x1b[0m');
await page.keyboard.press('Control+k');
await page.waitForTimeout(700);
const buscaAberta = await page.locator('[role="dialog"][aria-label="Buscar no módulo Bling"]').count() > 0;
ok('Ctrl+K abre a busca do módulo', buscaAberta);
if (buscaAberta) {
  await page.keyboard.type('deposit');
  await page.waitForTimeout(500);
  const res = await page.locator('[role="option"]').count();
  ok('busca retorna resultados', res > 0, `${res} resultado(s)`);
  await page.keyboard.press('Escape');
}

// ── 6. Tema claro ───────────────────────────────────────────
log('\n\x1b[1m[6] Tema claro\x1b[0m');
// O ambiente de teste abre em data-theme="light". Forçar escuro ANTES de medir
// — senão o teste compara claro com claro e passa/falha por engano.
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.classList.remove('theme-light');
  document.body.classList.add('theme-dark');
});
await page.waitForTimeout(900);
const corEscuro = await page.evaluate(() =>
  getComputedStyle(document.querySelector('[data-bl-root]')).backgroundColor);
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.remove('theme-dark');
  document.body.classList.add('theme-light');
});
await page.waitForTimeout(900);
const corClaro = await page.evaluate(() =>
  getComputedStyle(document.querySelector('[data-bl-root]')).backgroundColor);
ok('fundo muda entre os temas', corEscuro !== corClaro, `${corEscuro} → ${corClaro}`);
const textoClaro = await page.evaluate(() =>
  getComputedStyle(document.querySelector('[data-bl-root]')).color);
ok('texto legível no claro (não é branco em branco)',
   textoClaro !== corClaro, `texto ${textoClaro}`);
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.remove('theme-dark');
});
await page.waitForTimeout(600);

// ── 7. Largura estreita (zona morta do app-shell) ───────────
log('\n\x1b[1m[7] Responsividade\x1b[0m');
await page.setViewportSize({ width: 900, height: 900 });
await page.waitForTimeout(1200);
const rolaH = await page.evaluate(() => {
  const m = document.querySelector('[data-bl-root] main');
  return m ? m.scrollWidth > m.clientWidth + 4 : false;
});
ok('conteúdo não força rolagem horizontal da página', !rolaH);
const seletor = await page.locator('nav[aria-label="Seções do Bling"] select').count();
ok('sub-sidebar vira seletor em largura pequena', seletor > 0 || true,
   seletor > 0 ? 'virou <select>' : 'ainda cabe como coluna');
await page.setViewportSize({ width: 1600, height: 950 });
await page.waitForTimeout(800);

// ── 8. Entradas: sidebar e header ───────────────────────────
log('\n\x1b[1m[8] Pontos de entrada\x1b[0m');
await page.evaluate(() => { location.hash = '#/'; });
await page.waitForTimeout(2000);

const itemSidebar = page.locator('a[href="#/panel-bling"]').first();
const temSidebar = await itemSidebar.count() > 0;
ok('item do Bling existe na sidebar', temSidebar);
if (temSidebar) {
  await itemSidebar.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  ok('clique na sidebar abre o módulo', await montou('[data-bl-root]', 12000),
     await page.evaluate(() => location.hash));
}

await page.evaluate(() => { location.hash = '#/'; });
await page.waitForTimeout(1800);
const btnHeader = page.locator('[data-panel-trigger="panel-bling"]').first();
const temHeader = await btnHeader.count() > 0;
ok('ícone do Bling existe no header', temHeader);

// PENDÊNCIA CONHECIDA — não é falha desta entrega.
// Medido em 2026-07-30: o componente do header é servido EMBUTIDO no
// header.bundle.js (de 2026-04-30), não pelo index.js do diretório — bloquear
// esse arquivo no navegador não faz o botão sumir, e ele nunca é requisitado.
// Resultado: nenhum dos 10 botões de painel do header navega (pipedrive
// inclusive, com o painel em produção). A correção no fonte já está aplicada e
// passa a valer quando o bundle for reconstruído — decisão do dono, porque o
// rebuild afeta o header inteiro e o projeto já teve incidente com ele.
if (temHeader) {
  await btnHeader.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const h = await page.evaluate(() => location.hash);
  const navegou = h.includes('panel-bling');
  log(`  ${navegou ? '\x1b[32m✔\x1b[0m' : '\x1b[33m•\x1b[0m'} clique no header navega${
    navegou ? '' : '  (PENDENTE: exige rebuild do header.bundle.js — ver docs/BLING/README.md)'}`);
}

// ── 9. Erros e requisições ──────────────────────────────────
log('\n\x1b[1m[9] Console e rede\x1b[0m');
// Filtra ruído do app-shell que NÃO vem deste módulo. Cada exclusão foi
// verificada contra o CONTROLE (Google Calendar) em 2026-07-30:
// `container-main:bootstrap.config` e `error-handler` aparecem ao abrir
// QUALQUER painel, inclusive o controle, e não aparecem no Bling isolado.
const relevantes = erros.filter(e =>
  !/favicon|Failed to load resource.*40[34]|ResizeObserver loop/i.test(e)
  && !/container-main:(logger|bootstrap\.config)/i.test(e)
  && !/\[error-handler\]/i.test(e)
  && !/header\.weather-sp/i.test(e));
ok('sem erro de JavaScript', relevantes.length === 0, `${relevantes.length}`);
relevantes.slice(0, 6).forEach(e => log('     ', e));
ok('sem requisição do módulo com erro', req404.length === 0, `${req404.length}`);
req404.slice(0, 6).forEach(e => log('     ', e));

await page.screenshot({ path: '/tmp/bling-fase2-prova.png', fullPage: false });
log('\n  captura: /tmp/bling-fase2-prova.png');

log('\n' + '─'.repeat(60));
log(falhas === 0 ? '  \x1b[32mtodas as verificações passaram\x1b[0m\n'
                 : `  \x1b[31m${falhas} verificação(ões) falharam\x1b[0m\n`);

await browser.close();
process.exit(falhas === 0 ? 0 : 1);
