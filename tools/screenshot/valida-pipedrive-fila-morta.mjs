// FILA MORTA — reprocessamento em massa (#41). Prova da tela de Saúde da sincronização.
//
// Particularidade desta prova: a fila de PRODUÇÃO está limpa (3.597 jobs, 100% done,
// zero descartes desde 22/07). Então a UI de reprocessamento NÃO aparece com dado real
// e não pode ser provada só olhando a tela. Duas metades:
//
//   PARTE A — estado real: a tela mostra o vazio POSITIVO (não um card em branco, que
//             se confunde com painel quebrado) e não pede nada ao usuário.
//   PARTE B — estado sintético: a rota GET /queue/dead é interceptada no navegador com
//             uma fila morta fabricada. Nada é escrito no banco; o que se prova é a UI.
//             A lógica de banco por trás disso tem prova própria em PHP (colapso por
//             alvo, teto, idempotência), rodada contra o repositório real numa tabela
//             temporária que sombreia a de produção.
//
// O que a PARTE B exige:
//   1. o custo anunciado é em ALVOS, não em linhas — 3 descartes do MESMO negócio custam
//      1 chamada de API. Quem "simplificar" para contar linhas reprova aqui;
//   2. "reprocessar todos" fica DESABILITADO enquanto não há entidade escolhida — a
//      guarda de que "nada" nunca vira "tudo";
//   3. a ação de risco alto não dispara no primeiro clique (pede confirmação);
//   4. o corpo do POST leva ids[] OU entity, nunca os dois (o backend recusa ambíguo);
//   5. o resumo do lote mostra os três números — reenfileirados, colapsados e restantes.
//      Sumir com "restantes" transformaria um teto em perda silenciosa;
//   6. sem estouro horizontal em 1600 e 480, e 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/2969597e-35bb-482d-aedf-a6e7fd41d9e3/scratchpad/fila-morta-shots';
const log = (...a) => console.log(...a);
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

let ok = 0, fail = 0;
function checa(rotulo, condicao, detalhe = '') {
  if (condicao) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
}

// ── Fila morta fabricada ────────────────────────────────────────────
// 3 descartes do negócio 500 (um alvo só) + 1 do 777 + 2 de activity.
// 6 jobs, 4 alvos: é essa diferença que a tela precisa comunicar.
const MORTOS = [
  { id: 3, job_type: 'webhook', entity: 'deal', external_id: '500', attempts: 5, last_error: 'HTTP 500 upstream', created_at: '2026-07-22 09:00:00', processed_at: '2026-07-22 10:00:00' },
  { id: 2, job_type: 'webhook', entity: 'deal', external_id: '500', attempts: 5, last_error: 'HTTP 500 upstream', created_at: '2026-07-21 09:00:00', processed_at: '2026-07-21 10:00:00' },
  { id: 1, job_type: 'webhook', entity: 'deal', external_id: '500', attempts: 5, last_error: 'HTTP 500 upstream', created_at: '2026-07-20 09:00:00', processed_at: '2026-07-20 10:00:00' },
  { id: 4, job_type: 'webhook', entity: 'deal', external_id: '777', attempts: 5, last_error: 'timeout ao re-buscar', created_at: '2026-07-22 10:00:00', processed_at: '2026-07-22 11:00:00' },
  { id: 5, job_type: 'webhook', entity: 'activity', external_id: '900', attempts: 5, last_error: 'HTTP 403 sem escopo', created_at: '2026-07-22 11:00:00', processed_at: '2026-07-22 12:00:00' },
  { id: 6, job_type: 'webhook', entity: 'activity', external_id: '901', attempts: 5, last_error: 'HTTP 403 sem escopo', created_at: '2026-07-22 11:30:00', processed_at: '2026-07-22 12:30:00' },
];

function payloadDead(entity) {
  const itens = entity ? MORTOS.filter((m) => m.entity === entity) : MORTOS;
  return {
    ok: true,
    data: {
      stats: {
        total: 6, alvos: 4,
        mais_antigo: '2026-07-20 10:00:00', mais_novo: '2026-07-22 12:30:00',
        por_entidade: [
          { entity: 'deal', total: 4, alvos: 2, mais_novo: '2026-07-22 11:00:00' },
          { entity: 'activity', total: 2, alvos: 2, mais_novo: '2026-07-22 12:30:00' },
        ],
        por_erro: [
          { erro: 'HTTP 500 upstream', total: 3 },
          { erro: 'HTTP 403 sem escopo', total: 2 },
          { erro: 'timeout ao re-buscar', total: 1 },
        ],
        teto_lote: 200,
      },
      entidades: ['activity', 'deal'],
      lista: { itens, total: itens.length, page: 1, per_page: 25, paginas: 1 },
      filtro: { entity: entity ?? null },
    },
    meta: {},
  };
}

// ⚠️ isLoginPage() do auth.mjs só checa PRESENÇA do formulário no DOM. Numa aba já
// autenticada o form continua no DOM, oculto — o helper dá true e loginViaPage espera
// para sempre por um campo que nunca fica visível. Aqui a decisão é por VISIBILIDADE.
const precisaLogar = async (page) =>
  (await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false);

async function abrirSaude(page) {
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await precisaLogar(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.trim() === 'Saúde')?.click();
  });
  await page.waitForTimeout(2600);
}

/** Texto do card da fila morta, como o usuário lê. */
const lerCard = (page) => page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
  const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
  if (!card) return null;
  const acoes = [...card.querySelectorAll('.pp-acao')].map((a) => ({
    titulo: a.querySelector('.pp-acao-tit')?.textContent.trim() ?? '',
    desc: a.querySelector('.pp-acao-desc')?.textContent.trim() ?? '',
    risco: a.querySelector('.pp-risco')?.className ?? '',
    botao: a.querySelector('.pp-acao-bts button')?.textContent.trim() ?? '',
    desabilitado: a.querySelector('.pp-acao-bts button')?.disabled ?? null,
  }));
  return {
    texto: card.textContent ?? '',
    tiles: [...card.querySelectorAll('.pp-tile')].map((t) => ({
      n: t.querySelector('.pp-tile-n')?.textContent.trim() ?? '',
      l: t.querySelector('.pp-tile-l')?.textContent.trim() ?? '',
    })),
    // Só a tabela de JOBS. O card também tem a tabela de "motivos do descarte";
    // contar 'tbody tr' do card inteiro somava as duas (6 jobs + 3 motivos = 9).
    linhas: card.querySelectorAll('.pp-tabela-rolavel tbody tr').length,
    checkboxes: card.querySelectorAll('tbody input[type=checkbox]').length,
    acoes,
    temVazio: !!card.querySelector('.pp-estado'),
    msg: card.querySelector('.pp-msg')?.textContent.trim() ?? null,
    confirma: card.querySelector('.pp-confirma')?.textContent.trim() ?? null,
    select: card.querySelector('select.pp-select')?.value ?? null,
  };
});

const marcar = (page, n) => page.evaluate((qtd) => {
  const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
  const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
  const cbs = [...card.querySelectorAll('tbody input[type=checkbox]')];
  cbs.slice(0, qtd).forEach((cb) => cb.click());
}, n);

async function rodar(tema) {
  const browser = await chromium.launch({
    args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--no-sandbox'],
  });
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 },
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  const cookies = await getSessionCookies();
  if (cookies?.length) await ctx.addCookies(cookies);

  const erros = [];
  const vigiar = (p) => {
    p.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) erros.push(m.text()); });
    p.on('pageerror', (e) => erros.push(String(e)));
  };

  let filtroPedido = null;      // entity que a UI mandou no GET
  let postCorpo = null;         // corpo do POST de reprocessamento

  log(`\n===== TEMA ${tema.toUpperCase()} =====`);

  // ── PARTE A: o estado real de produção ────────────────────────────
  // Página própria, SEM interceptação: é a fila de verdade que responde.
  log('\n-- A. estado real (fila limpa) --');
  const pageA = await ctx.newPage();
  vigiar(pageA);
  await abrirSaude(pageA);
  let page = pageA;             // reaponta para pageB quando a PARTE B começa
  const real = await lerCard(page);
  checa('A1 card da fila morta existe', real !== null);
  checa('A2 mostra vazio positivo, não card em branco', real?.temVazio === true);
  checa('A3 o vazio explica o que significa',
    /nenhum job descartado/i.test(real?.texto ?? '') && /5 tentativas/i.test(real?.texto ?? ''));
  checa('A4 sem ações penduradas na fila limpa', (real?.acoes.length ?? 0) === 0);
  await page.screenshot({ path: `${OUT}/${tema}-A-vazio.png`, fullPage: false });
  await pageA.close();

  // ── PARTE B: fila morta fabricada ─────────────────────────────────
  // Página nova com as rotas já interceptadas — recarregar a de cima confundia o
  // detector de login (o formulário existe oculto no DOM da SPA).
  log('\n-- B. fila morta sintética (rota interceptada) --');
  const pageB = await ctx.newPage();
  vigiar(pageB);
  await pageB.route('**/api/pipedrive/queue/dead*', async (route) => {
    const u = new URL(route.request().url());
    filtroPedido = u.searchParams.get('entity');
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(payloadDead(filtroPedido)),
    });
  });
  await pageB.route('**/api/pipedrive/queue/requeue-bulk', async (route) => {
    postCorpo = JSON.parse(route.request().postData() ?? '{}');
    // Resposta com os três números, inclusive um teto que sobrou.
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: { reenfileirados: 1, colapsados: 2, alvos: 1, restantes: 3, ids: [3] }, meta: {} }),
    });
  });
  await abrirSaude(pageB);
  page = pageB;

  const b = await lerCard(pageB);
  const tile = (l) => b?.tiles.find((t) => new RegExp(l, 'i').test(t.l))?.n ?? null;
  checa('B1 mostra 6 jobs descartados', tile('descartados') === '6', String(tile('descartados')));
  checa('B2 mostra 4 alvos distintos', tile('alvos') === '4', String(tile('alvos')));
  checa('B3 declara o custo por ALVO, não por job', /uma chamada de API por alvo/i.test(b?.texto ?? ''));
  checa('B4 declara o teto do lote', /200 alvos por vez/i.test(b?.texto ?? ''));
  checa('B5 lista as 6 linhas com seleção', b?.linhas === 6 && b?.checkboxes === 6, `linhas=${b?.linhas} cb=${b?.checkboxes}`);
  checa('B6 traz os motivos do descarte', /Motivos do descarte/i.test(b?.texto ?? ''));

  // A guarda central: sem entidade escolhida, "reprocessar tudo" não pode disparar.
  const acaoTudo = b?.acoes.find((a) => /todos/i.test(a.titulo));
  checa('B7 "reprocessar todos" desabilitado sem entidade', acaoTudo?.desabilitado === true);
  checa('B8 e diz por quê', /não existe .reprocessar tudo. sem recorte/i.test(acaoTudo?.desc ?? ''));
  checa('B9 a ação de tudo é risco alto', /alto/.test(acaoTudo?.risco ?? ''));

  const acaoSel = b?.acoes.find((a) => /selecionados/i.test(a.titulo));
  checa('B10 "reprocessar selecionados" desabilitado sem seleção', acaoSel?.desabilitado === true);

  // ── O CORAÇÃO DO #41: custo em alvos, não em linhas ───────────────
  // As 3 primeiras linhas são o MESMO negócio (deal 500). Contar linhas diria
  // "3 chamadas de API"; o certo é 1.
  await marcar(page, 3);
  await page.waitForTimeout(400);
  const c = await lerCard(page);
  const sel = c?.acoes.find((a) => /selecionados/i.test(a.titulo));
  checa('B11 conta 3 jobs marcados', /3 jobs marcados/i.test(sel?.desc ?? ''), sel?.desc ?? '');
  checa('B12 mas anuncia 1 ALVO (não 3)', /1 alvos?/i.test(sel?.desc ?? '') && !/3 alvos/i.test(sel?.desc ?? ''), sel?.desc ?? '');
  checa('B13 e 1 chamada de API, no singular', /1 chamada de API/i.test(sel?.desc ?? ''));
  checa('B14 ação liberada com seleção', sel?.desabilitado === false);
  await page.screenshot({ path: `${OUT}/${tema}-B-selecao.png`, fullPage: false });

  // Disparo do lote por seleção (risco médio: sem confirmação)
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
    const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
    const acao = [...card.querySelectorAll('.pp-acao')].find((a) => /selecionados/i.test(a.textContent));
    acao.querySelector('.pp-acao-bts button')?.click();
  });
  await page.waitForTimeout(1200);
  checa('B15 POST leva ids[]', Array.isArray(postCorpo?.ids) && postCorpo.ids.length === 3, JSON.stringify(postCorpo));
  checa('B16 POST não leva entity junto (backend recusa ambíguo)', postCorpo?.entity === undefined);

  const d = await lerCard(page);
  checa('B17 resumo mostra reenfileirados', /1 job reenfileirado/i.test(d?.msg ?? ''), d?.msg ?? '');
  checa('B18 resumo explica os colapsados', /2 descartes repetidos/i.test(d?.msg ?? '') && /sem chamada extra/i.test(d?.msg ?? ''));
  checa('B19 resumo NÃO esconde o que sobrou do teto', /3 alvos ficaram para a próxima rodada/i.test(d?.msg ?? ''));
  await page.screenshot({ path: `${OUT}/${tema}-B-resultado.png`, fullPage: false });

  // ── Recorte por entidade + confirmação do risco alto ──────────────
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
    const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
    const s = card.querySelector('select.pp-select');
    s.value = 'deal';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(1400);
  checa('B20 o filtro chegou na requisição', filtroPedido === 'deal', String(filtroPedido));
  const e = await lerCard(page);
  checa('B21 lista recortada para deal', e?.linhas === 4, String(e?.linhas));
  const tudo = e?.acoes.find((a) => /todos/i.test(a.titulo));
  checa('B22 ação de tudo liberada com entidade', tudo?.desabilitado === false);
  checa('B23 e declara quantos alvos vai custar', /2 alvos disponíveis/i.test(tudo?.desc ?? '') || /2 disponíveis/i.test(tudo?.desc ?? ''), tudo?.desc ?? '');

  postCorpo = null;
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
    const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
    const acao = [...card.querySelectorAll('.pp-acao')].find((a) => /todos/i.test(a.textContent));
    acao.querySelector('.pp-acao-bts button')?.click();
  });
  await page.waitForTimeout(700);
  const f = await lerCard(page);
  checa('B24 risco alto NÃO dispara no 1º clique', postCorpo === null);
  checa('B25 pede confirmação declarando o custo', /chamada à API do Pipedrive/i.test(f?.confirma ?? ''), f?.confirma ?? '');
  await page.screenshot({ path: `${OUT}/${tema}-B-confirma.png`, fullPage: false });

  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-pp-react-root] .pp-card')];
    const card = cards.find((c) => /Fila morta/i.test(c.querySelector('h3')?.textContent ?? ''));
    [...card.querySelectorAll('.pp-confirma button')].find((b) => /^Sim/i.test(b.textContent))?.click();
  });
  await page.waitForTimeout(1200);
  checa('B26 confirmado: POST leva entity', postCorpo?.entity === 'deal', JSON.stringify(postCorpo));
  checa('B27 e não leva ids junto', postCorpo?.ids === undefined);

  // ── Layout ────────────────────────────────────────────────────────
  const estouro = (p) => p.evaluate(() => {
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    const cortadas = [...document.querySelectorAll('[data-pp-react-root] .pp-tabela-rolavel')]
      .filter((t) => t.scrollWidth > t.clientWidth + 2).length;
    return { estouro: main ? main.scrollWidth > main.clientWidth + 2 : false, cortadas };
  });
  const l1600 = await estouro(page);
  checa('B28 sem estouro horizontal em 1600', l1600.estouro === false);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(1000);
  const l480 = await estouro(page);
  checa('B29 sem estouro horizontal em 480', l480.estouro === false);

  // Por que passa: as tabelas largas rolam DENTRO do cartão. Checagem específica
  // porque a global acima só diz "estourou", não quem. Tirar o .pp-tabela-rolavel
  // de qualquer tabela larga da tela reprova aqui, apontando o card.
  const contencao = await page.evaluate(() => {
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    return [...main.querySelectorAll('.pp-table')]
      .filter((t) => t.scrollWidth > main.clientWidth + 2)   // só as largas
      .map((t) => ({
        card: t.closest('.pp-card')?.querySelector('h3')?.textContent.trim() ?? '?',
        contida: getComputedStyle(t.parentElement).overflowX === 'auto',
      }));
  });
  const soltas = contencao.filter((c) => !c.contida).map((c) => c.card);
  checa('B31 toda tabela larga rola dentro do cartão', soltas.length === 0, soltas.join(', '));
  await page.screenshot({ path: `${OUT}/${tema}-B-480.png`, fullPage: false });

  checa('B30 zero erro de console do painel', erros.length === 0, erros.slice(0, 2).join(' | '));

  await browser.close();
}

const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });
for (const tema of ['dark', 'light']) await rodar(tema);
log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);
