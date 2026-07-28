// Valida a FASE 5 do Pipedrive (Kanban), dark + light:
//  1. Quadro em largura total, rolando por DENTRO (a página não ganha rolagem horizontal).
//  2. Cabeçalho de coluna: contagem, valor, % do funil, probabilidade e conversão para a
//     próxima, com a etapa-gargalo marcada — e a contagem CONFERINDO com a da API.
//  3. Cartões ricos: avatar, tempo na etapa, próxima atividade (ou "sem agenda"),
//     etiquetas e selos de atenção.
//  4. Densidade compacta/padrão/confortável muda a altura do cartão e persiste (`pp:dens`).
//  5. Virtualização: coluna com ≥ 40 negócios renderiza bem menos nós que o total, e
//     rolar traz cartões novos.
//  6. Clique no cartão abre o drawer do negócio.
//  7. Zero erro de console vindo do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/14c7a297-852d-4236-a877-cb8c020f1514/scratchpad/fase5-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };

// Ruído PRÉ-EXISTENTE do app-shell (mesma justificativa da prova da Fase 4): o filtro casa
// por ETIQUETA DE MÓDULO do logger do shell, que o painel React nunca emite. "Failed to load
// resource" é anônimo no console e é cobrado por `respostasRuins`, que carrega a URL.
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  // Começa sempre da densidade padrão para o teste de densidade ser determinístico.
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.setItem('pp:dens', 'padrao'); } catch { /* ignora */ }
  }, tema);

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (doPainel(e.message)) errors.push('PAGEERROR: ' + e.message); });
  const respostasRuins = [];
  page.on('response', (r) => { if (r.status() >= 400) respostasRuins.push(`${r.status()} ${r.request().method()} ${r.url()}`); });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Kanban'))?.click();
  });
  await page.waitForSelector('[data-pp-react-root] .pp-kanban', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Verdade da API para conferir contra o que foi desenhado.
  R[tema].api = await page.evaluate(async () => {
    const r = await fetch('/api/pipedrive/kanban', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const j = await r.json();
    const d = j.data;
    return {
      http: r.status,
      funil: d.pipeline_name,
      colunas: d.columns.map((c) => ({ stage: c.stage, count: c.count, exibidos: c.exibidos })),
      totalCount: d.totais.count,
      etiquetas: d.etiquetas.length,
      limite: d.limite_por_etapa,
    };
  });

  // ── 1. Largura total + rolagem por dentro ─────────────────────
  R[tema].layout = await page.evaluate(() => {
    const q = document.querySelector('[data-pp-react-root] .pp-kanban');
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    // Largura ÚTIL da área do painel (desconta o padding do <main>), para comparar o
    // quadro com o espaço que ele realmente tem — não com um número mágico. A área é
    // ~976px neste viewport porque a sidebar do painel e a do shell já comeram o resto.
    const cs = main ? getComputedStyle(main) : null;
    const util = main
      ? main.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
      : 0;
    return {
      largura: Math.round(q?.getBoundingClientRect().width ?? 0),
      larguraUtil: Math.round(util),
      alturaQuadro: Math.round(q?.getBoundingClientRect().height ?? 0),
      rolaPorDentro: !!q && q.scrollWidth > q.clientWidth + 1,
      // A área do painel não pode ganhar rolagem horizontal por causa do quadro.
      mainEstoura: !!main && main.scrollWidth > main.clientWidth + 2,
      colunas: document.querySelectorAll('[data-pp-react-root] .pp-kan-col').length,
    };
  });

  // ── 2. Cabeçalhos ricos ───────────────────────────────────────
  R[tema].cabecalhos = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')];
    return cols.map((c) => ({
      nome: c.querySelector('.pp-kan-head .nm')?.textContent.trim(),
      qtd: c.querySelector('.pp-kan-head .qtd')?.textContent.trim(),
      meta: c.querySelector('.pp-kan-head .m')?.textContent.trim(),
      conversao: c.querySelector('.pp-kan-conv .pct')?.textContent.trim() ?? null,
      gargalo: !!c.querySelector('.pp-kan-tag-gargalo'),
      barraShare: c.querySelector('.pp-kan-share > span')?.getAttribute('style') ?? null,
    }));
  });

  // ── 3. Cartões ricos ──────────────────────────────────────────
  R[tema].cartoes = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-card')];
    return {
      desenhados: cards.length,
      comAvatar: cards.filter((c) => c.querySelector('.pp-avatar')).length,
      comTempo: cards.filter((c) => /\d+\s?d/.test(c.querySelector('.pp-kan-meta')?.textContent ?? '')).length,
      comAgenda: cards.filter((c) => /sem agenda|em \d+ d|há \d+ d|hoje|amanhã|ontem/.test(c.querySelector('.pp-kan-meta')?.textContent ?? '')).length,
      comEtiqueta: cards.filter((c) => c.querySelector('.pp-kan-label')).length,
      comSelo: cards.filter((c) => c.querySelector('.pp-kan-sinal')).length,
      comValor: cards.filter((c) => c.querySelector('.cv')).length,
    };
  });
  await page.screenshot({ path: `${OUT}/${tema}-01-kanban.jpg`, quality: 82, type: 'jpeg' });

  // ── 5. Virtualização (antes da densidade, que remonta as colunas) ──
  R[tema].virtual = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')];
    // A coluna mais cheia é a candidata a virtualizar.
    let alvo = null, maior = -1;
    for (const c of cols) {
      const n = Number((c.querySelector('.pp-kan-head .qtd')?.textContent ?? '0').replace(/\D/g, ''));
      if (n > maior) { maior = n; alvo = c; }
    }
    return {
      maiorColuna: maior,
      nome: alvo?.querySelector('.pp-kan-head .nm')?.textContent.trim(),
      virtualizada: !!alvo?.querySelector('.pp-kan-virt'),
      nosRenderizados: alvo?.querySelectorAll('.pp-kan-card').length ?? 0,
    };
  });
  if (R[tema].virtual.virtualizada) {
    const antes = await page.evaluate(() => {
      const c = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')]
        .find((x) => x.querySelector('.pp-kan-virt'));
      return [...c.querySelectorAll('.pp-kan-card .ct')].map((t) => t.textContent).join('|');
    });
    await page.evaluate(() => {
      const c = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')]
        .find((x) => x.querySelector('.pp-kan-virt'));
      c.querySelector('.pp-kan-body').scrollTop = 2500;
    });
    await page.waitForTimeout(900);
    const depois = await page.evaluate(() => {
      const c = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')]
        .find((x) => x.querySelector('.pp-kan-virt'));
      return [...c.querySelectorAll('.pp-kan-card .ct')].map((t) => t.textContent).join('|');
    });
    R[tema].virtual.rolagemTrouxeNovos = antes !== depois && depois.length > 0;
    await page.evaluate(() => {
      const c = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')]
        .find((x) => x.querySelector('.pp-kan-virt'));
      c.querySelector('.pp-kan-body').scrollTop = 0;
    });
    await page.waitForTimeout(500);
  }

  // ── 4. Densidade ──────────────────────────────────────────────
  const alturaCartao = () => page.evaluate(() =>
    Math.round(document.querySelector('[data-pp-react-root] .pp-kan-card')?.getBoundingClientRect().height ?? 0));
  const trocar = async (rotulo) => {
    await page.evaluate((r) => {
      const b = [...document.querySelectorAll('.pp-pagehead-r .pp-seg-b')].find((x) => x.textContent.trim() === r);
      b?.click();
    }, rotulo);
    await page.waitForTimeout(1000);
  };
  const hPadrao = await alturaCartao();
  await trocar('Compacta');
  const hCompacta = await alturaCartao();
  const persistiu = await page.evaluate(() => localStorage.getItem('pp:dens'));
  await trocar('Confortável');
  const hConfortavel = await alturaCartao();
  R[tema].densidade = { hPadrao, hCompacta, hConfortavel, persistiu };
  await page.screenshot({ path: `${OUT}/${tema}-02-confortavel.jpg`, quality: 82, type: 'jpeg' });
  await trocar('Padrão');

  // ── 6. Drawer ─────────────────────────────────────────────────
  await page.evaluate(() => document.querySelector('[data-pp-react-root] .pp-kan-card')?.click());
  await page.waitForTimeout(2200);
  R[tema].drawer = await page.evaluate(() => {
    const dr = document.querySelector('[data-pp-react-root] .pp-drawer');
    return { abriu: !!dr, temAbas: !!dr?.querySelector('[role="tab"]') };
  });
  await page.screenshot({ path: `${OUT}/${tema}-03-drawer.jpg`, quality: 82, type: 'jpeg' });

  R[tema].erros = errors;
  R[tema].respostasRuins = respostasRuins;
  await browser.close();
}

await rodar('dark');
await rodar('light');

log('\n===== FASE 5 — resultado =====');
log(JSON.stringify(R, null, 2));

const falhas = [];
for (const t of ['dark', 'light']) {
  const r = R[t];
  if (r.erros.length) falhas.push(`${t}: ${r.erros.length} erro(s) de console`);
  const ruinsDoPainel = r.respostasRuins.filter((x) => x.includes('/api/pipedrive/'));
  if (ruinsDoPainel.length) falhas.push(`${t}: HTTP ruim no /api/pipedrive → ${ruinsDoPainel.join(' | ')}`);

  if (r.api.http !== 200) falhas.push(`${t}: /kanban devolveu ${r.api.http}`);
  // "Largura total" = ocupa a área útil do painel, seja ela qual for neste viewport.
  if (r.layout.largura < r.layout.larguraUtil * 0.98) {
    falhas.push(`${t}: quadro não ocupa a área (${r.layout.largura}px de ${r.layout.larguraUtil}px úteis)`);
  }
  if (r.layout.alturaQuadro < 300) falhas.push(`${t}: quadro sem altura (${r.layout.alturaQuadro}px)`);
  if (r.layout.mainEstoura) falhas.push(`${t}: o quadro estourou a área do painel (rolagem horizontal na página)`);
  if (r.layout.colunas !== r.api.colunas.length) falhas.push(`${t}: ${r.layout.colunas} colunas desenhadas vs ${r.api.colunas.length} da API`);

  // Cabeçalho: contagem desenhada tem de bater com a da API, etapa a etapa.
  r.cabecalhos.forEach((c, i) => {
    const esperado = r.api.colunas[i];
    if (!esperado) return;
    const qtd = Number((c.qtd ?? '').replace(/\D/g, ''));
    if (qtd !== esperado.count) falhas.push(`${t}: coluna "${c.nome}" mostra ${qtd} mas a API diz ${esperado.count}`);
    if (!/R\$/.test(c.meta ?? '')) falhas.push(`${t}: coluna "${c.nome}" sem valor no cabeçalho`);
    if (!/% do funil/.test(c.meta ?? '')) falhas.push(`${t}: coluna "${c.nome}" sem participação no funil`);
    if (!c.barraShare) falhas.push(`${t}: coluna "${c.nome}" sem barra de participação`);
  });
  if (!r.cabecalhos.some((c) => c.conversao)) falhas.push(`${t}: nenhuma coluna com conversão para a próxima etapa`);
  if (!r.cabecalhos.some((c) => c.gargalo)) falhas.push(`${t}: gargalo não marcado em nenhuma coluna`);

  // Cartões ricos
  if (r.cartoes.desenhados < 10) falhas.push(`${t}: poucos cartões desenhados (${r.cartoes.desenhados})`);
  if (r.cartoes.comAvatar !== r.cartoes.desenhados) falhas.push(`${t}: ${r.cartoes.desenhados - r.cartoes.comAvatar} cartão(ões) sem avatar`);
  if (r.cartoes.comTempo < r.cartoes.desenhados * 0.9) falhas.push(`${t}: tempo na etapa ausente em muitos cartões`);
  if (r.cartoes.comAgenda !== r.cartoes.desenhados) falhas.push(`${t}: próxima atividade ausente em ${r.cartoes.desenhados - r.cartoes.comAgenda} cartão(ões)`);
  if (r.cartoes.comEtiqueta < 1) falhas.push(`${t}: nenhuma etiqueta renderizada`);
  if (r.cartoes.comSelo < 1) falhas.push(`${t}: nenhum selo de atenção renderizado`);

  // Virtualização
  if (r.virtual.maiorColuna >= 40) {
    if (!r.virtual.virtualizada) falhas.push(`${t}: coluna "${r.virtual.nome}" com ${r.virtual.maiorColuna} negócios NÃO virtualizou`);
    if (r.virtual.nosRenderizados >= r.virtual.maiorColuna) falhas.push(`${t}: virtualização não reduziu nós (${r.virtual.nosRenderizados}/${r.virtual.maiorColuna})`);
    if (r.virtual.rolagemTrouxeNovos === false) falhas.push(`${t}: rolar a coluna virtualizada não trouxe cartões novos`);
  }

  // Densidade
  if (!(r.densidade.hCompacta < r.densidade.hPadrao)) falhas.push(`${t}: densidade compacta não reduziu o cartão (${r.densidade.hCompacta} vs ${r.densidade.hPadrao})`);
  if (!(r.densidade.hConfortavel > r.densidade.hPadrao)) falhas.push(`${t}: densidade confortável não aumentou o cartão (${r.densidade.hConfortavel} vs ${r.densidade.hPadrao})`);
  if (r.densidade.persistiu !== 'compacta') falhas.push(`${t}: densidade não persistiu em pp:dens (${r.densidade.persistiu})`);

  if (!r.drawer.abriu) falhas.push(`${t}: clique no cartão não abriu o drawer`);
}

log(falhas.length ? `\n❌ FALHAS (${falhas.length}):\n - ` + falhas.join('\n - ') : '\n✅ TODAS AS VERIFICAÇÕES PASSARAM');
process.exit(falhas.length ? 1 : 0);
