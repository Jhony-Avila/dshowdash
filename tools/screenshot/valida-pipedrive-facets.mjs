// FACETS FORA DA PAGINAÇÃO (#46) — prova de que o grid parou de recalculá-las sem
// perder os filtros.
//
// As facets (etapas, donos, motivos de perda) são o catálogo da base: não dependem dos
// filtros aplicados e não mudam entre a página 1 e a 7. Ainda assim eram recomputadas em
// CADA página — medido: 154 ms na página 1 contra 59 ms sem elas, ~126 ms de `owners`
// (temporary+filesort) e `lost_reasons` (group by).
//
// Agora o front guarda a primeira leva e passa a mandar `facets=0`. O risco que esta
// prova cobre não é performance, é **o filtro ficar vazio ao paginar** — se o componente
// perder a cópia, os selects de Etapa/Dono/Motivo esvaziam e o usuário perde a navegação.
//
// Exige, em dark e light:
//   1. a 1ª carga pede facets e as recebe; da 2ª em diante manda `facets=0`;
//   2. os filtros continuam POPULADOS depois de paginar e de aplicar filtro;
//   3. filtrar por uma opção de facet ainda funciona (o recorte chega ao backend);
//   4. trocar de entidade recarrega as facets daquela entidade (não reaproveita as erradas);
//   5. 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/2969597e-35bb-482d-aedf-a6e7fd41d9e3/scratchpad/facets-shots';
const log = (...a) => console.log(...a);
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

let ok = 0, fail = 0;
function checa(rotulo, cond, detalhe = '') {
  if (cond) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
}
const precisaLogar = async (p) =>
  (await isLoginPage(p)) && await p.isVisible('input[type="password"]').catch(() => false);

const irPara = async (page, label) => {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.trim() === l)?.click();
  }, label);
  await page.waitForTimeout(2600);
};

/**
 * Opções de filtro da toolbar, como o usuário as vê. Duas formas convivem: `select`
 * simples (Produtos) e `MultiFiltro` — um botão que abre popover com checkboxes, que é o
 * caso de Etapa/Dono/Motivo em Negócios. Ler só `select` fazia o teste concluir
 * "sem filtros" onde havia três, e comparar dois vazios dava falso positivo.
 */
// Só estes dependem de FACET (ver Negocios.tsx/EntidadesGrids.tsx). "Status" tem opções
// fixas no código e "Avançado" nem é filtro — incluí-los poluía a leitura (Status:0 numa
// medição, Status:33 na outra, porque o popover do Avançado entrava no lugar).
const DE_FACET = ['Etapas', 'Donos', 'Motivo da perda', 'Todas as categorias', 'Todos os tipos'];

const lerFiltros = async (page) => {
  const selects = await page.evaluate(() => {
    const tb = document.querySelector('[data-pp-react-root] .pp-toolbar');
    return [...(tb?.querySelectorAll('select.pp-select') ?? [])].map((s) => ({
      tipo: 'select', rotulo: s.options[0]?.textContent.trim() ?? '', n: s.options.length,
    }));
  }, DE_FACET);
  // Cada MultiFiltro precisa ser ABERTO para revelar as opções.
  const nomes = await page.evaluate((lista) => {
    const tb = document.querySelector('[data-pp-react-root] .pp-toolbar');
    return [...(tb?.querySelectorAll('button.pp-btn') ?? [])]
      .filter((b) => /▾/.test(b.textContent ?? ''))
      .map((b) => b.textContent.replace(/[▾\s]+$/, '').replace(/\s*\(\d+\)$/, '').trim())
      .filter((r) => lista.includes(r));
  }, DE_FACET);
  const multis = [];
  for (const nome of nomes) {
    // Fecha o que estiver aberto ANTES de clicar: com um popover aberto, o backdrop
    // engole o clique no próximo botão e a leitura seguinte devolve o menu antigo —
    // foi o que deslocou a contagem em um (Etapas mostrava o total de Donos).
    await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-colmenu-bg')?.click());
    await page.waitForTimeout(200);
    await page.evaluate((rot) => {
      const tb = document.querySelector('[data-pp-react-root] .pp-toolbar');
      [...(tb?.querySelectorAll('button.pp-btn') ?? [])]
        .find((x) => x.textContent.replace(/[▾\s]+$/, '').replace(/\s*\(\d+\)$/, '').trim() === rot)?.click();
    }, nome);
    await page.waitForTimeout(400);
    // Confere pelo CABEÇALHO que o popover lido é o do filtro pedido.
    const r = await page.evaluate(() => {
      const menu = document.querySelector('[data-pp-react-root] .pp-colmenu.pp-colmenu-esq');
      if (!menu) return { cab: null, n: 0 };
      return { cab: menu.querySelector('.pp-colmenu-h')?.textContent.trim() ?? null,
               n: menu.querySelectorAll('.pp-colmenu-item label').length };
    });
    await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-colmenu-bg')?.click());
    await page.waitForTimeout(200);
    multis.push({ tipo: 'multi', rotulo: nome, n: r.cab === nome ? r.n : -1, cab: r.cab });
  }
  return [...selects, ...multis];
};

async function rodar(tema) {
  const browser = await chromium.launch({
    args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--no-sandbox'],
  });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  const cookies = await getSessionCookies();
  if (cookies?.length) await ctx.addCookies(cookies);

  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));

  const req = [];   // {rota, facets, page}
  page.on('request', (r) => {
    const u = r.url();
    const m = u.match(/\/api\/pipedrive\/(deals|products|persons)\?/);
    if (m) {
      const sp = new URL(u).searchParams;
      req.push({ rota: m[1], facets: sp.get('facets'), page: sp.get('page') });
    }
  });

  log(`\n===== TEMA ${tema.toUpperCase()} =====`);
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await precisaLogar(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const t = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (t) await t.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(1200);

  await irPara(page, 'Negócios');
  const deals1 = req.filter((r) => r.rota === 'deals');
  checa('1 a 1ª carga PEDE as facets', deals1.length > 0 && !deals1[0].facets, JSON.stringify(deals1[0]));

  const filtrosAntes = await lerFiltros(page);
  checa('2 os filtros vieram populados',
    filtrosAntes.length > 0 && filtrosAntes.every((f) => f.n > 0) && filtrosAntes.some((f) => f.n > 1),
    filtrosAntes.map((f) => `${f.rotulo}:${f.n}`).join(' · '));
  await page.screenshot({ path: `${OUT}/${tema}-1-pagina1.png` });

  // ── paginar ──────────────────────────────────────────────────────
  req.length = 0;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-pp-react-root] .pp-pager button')]
      .find((x) => /próxima|proxima/i.test(x.textContent ?? ''));
    b?.click();
  });
  await page.waitForTimeout(2400);
  const aoPaginar = req.filter((r) => r.rota === 'deals');
  checa('3 ao paginar manda facets=0', aoPaginar.length > 0 && aoPaginar.every((r) => r.facets === '0'),
    JSON.stringify(aoPaginar[0]));

  const filtrosDepois = await lerFiltros(page);
  // Exige conteúdo, não só igualdade: dois vazios são iguais e não provam nada.
  checa('4 os filtros SEGUEM populados depois de paginar',
    filtrosDepois.length > 0 && filtrosDepois.some((f) => f.n > 1)
      && JSON.stringify(filtrosDepois) === JSON.stringify(filtrosAntes),
    filtrosDepois.map((f) => `${f.rotulo}:${f.n}`).join(' · '));

  // ── filtrar por uma opção de facet ───────────────────────────────
  req.length = 0;
  await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-colmenu-bg')?.click());
  await page.waitForTimeout(200);
  const rotuloAlvo = await page.evaluate(() => {
    const tb = document.querySelector('[data-pp-react-root] .pp-toolbar');
    const b = [...(tb?.querySelectorAll('button.pp-btn') ?? [])]
      .find((x) => /▾/.test(x.textContent ?? '') && /Etapas|Donos|Motivo/.test(x.textContent ?? ''));
    b?.click();
    return b ? b.textContent.replace(/[▾\s]+$/, '').trim() : null;
  });
  await page.waitForTimeout(400);   // o popover precisa pintar antes de procurar a opção
  const filtrou = await page.evaluate((rot) => {
    const menu = document.querySelector('[data-pp-react-root] .pp-colmenu.pp-colmenu-esq');
    const cb = menu?.querySelector('.pp-colmenu-item label input[type=checkbox]');
    const opcao = cb ? (cb.closest('label')?.textContent.trim() ?? null) : null;
    cb?.click();
    document.querySelector('[data-pp-react-root] .pp-colmenu-bg')?.click();
    return { rotulo: rot, opcao };
  }, rotuloAlvo);
  await page.waitForTimeout(2600);
  const pedidosComFiltro = req.filter((r) => r.rota === 'deals');
  checa('5 filtrar por uma facet ainda funciona',
    filtrou?.opcao != null && pedidosComFiltro.length > 0,
    filtrou ? `${filtrou.rotulo} = ${filtrou.opcao}` : 'nenhum MultiFiltro na toolbar');
  checa('5b e o recorte foi para o backend',
    pedidosComFiltro.some((r) => r.page === '1'), JSON.stringify(pedidosComFiltro[0] ?? null));
  const filtrosComFiltro = await lerFiltros(page);
  checa('6 os filtros não esvaziam ao aplicar filtro',
    filtrosComFiltro.length > 0 && filtrosComFiltro.some((f) => f.n > 1),
    filtrosComFiltro.map((f) => `${f.rotulo}:${f.n}`).join(' · '));
  await page.screenshot({ path: `${OUT}/${tema}-2-filtrado.png` });

  // ── outra entidade: facets próprias ──────────────────────────────
  req.length = 0;
  await irPara(page, 'Produtos');
  const prod = req.filter((r) => r.rota === 'products');
  checa('7 outra entidade pede as PRÓPRIAS facets', prod.length > 0 && !prod[0].facets,
    JSON.stringify(prod[0] ?? null));
  const fProd = await lerFiltros(page);
  checa('8 e os filtros dela vêm populados', fProd.length > 0 && fProd.some((f) => f.n > 1),
    fProd.map((f) => `${f.rotulo}:${f.n}`).join(' · ') || '(nenhum filtro)');

  // Voltar para Negócios: não pode reaproveitar as facets de Produtos.
  req.length = 0;
  await irPara(page, 'Negócios');
  const voltou = await lerFiltros(page);
  checa('9 voltar a Negócios traz os filtros certos (não os de Produtos)',
    voltou.length > 0 && JSON.stringify(voltou) === JSON.stringify(filtrosAntes),
    voltou.map((f) => `${f.rotulo}:${f.n}`).join(' · '));

  checa('10 zero erro de console do painel', erros.length === 0, erros.slice(0, 2).join(' | '));
  await browser.close();
}

const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });
for (const tema of ['dark', 'light']) await rodar(tema);
log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);
