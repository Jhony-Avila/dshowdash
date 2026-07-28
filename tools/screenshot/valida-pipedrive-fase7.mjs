// FASE 7 — Estabilização do Pipedrive: varredura de TODAS as telas + medição de performance.
//
// Diferente das provas 4/5/6 (que aprovam uma tela nova), esta é uma VARREDURA de
// regressão sobre o módulo inteiro:
//   0. CONFERE A PRÓPRIA COBERTURA: lê os itens de navegação que o painel realmente
//      oferece e exige que batam com a lista TELAS. Tela nova na sidebar sem entrada
//      aqui REPROVA — foi assim que a tela "Perdas" (17ª, criada 2026-07-27) passou
//      dias sem cobertura enquanto esta prova anunciava "varredura limpa" sobre 16.
//      Uma prova que não sabe o que deixou de fora mente com convicção.
//   1. abre TODAS as telas, em dark e light, e exige 0 erro de console do painel;
//   2. cobra consistência: toda tela tem cabeçalho padrão (ícone + título) e nenhuma
//      mostra o `<h1>` cru que sobrou de antes do PageHeader;
//   3. cobra "sem estouros" (§23) nas larguras onde o painel tem área: 1600 e 480;
//   4. MEDE a página de 200 linhas do grid (nós no DOM, tempo até pintar e resposta ao
//      rolar) para decidir por dado, e não por palpite, se virtualizar as listas.
//
// Sobre virtualizar: os grids são paginados NO SERVIDOR (25–200 por página). Virtualizar
// só compensa se 200 linhas pesarem — por isso a medição vem antes da decisão.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/1af6a59b-262c-4e47-bb42-c1a4935e1164/scratchpad/fase7-shots';
const log = (...a) => console.log(...a);

// Contrato de cobertura: a lista é conferida contra a navegação real do painel
// (ver `conferirCobertura`). Ordem = a da sidebar, para a varredura seguir o caminho
// que o usuário percorre.
const TELAS = [
  'Visão Geral', 'Alertas', 'Rankings', 'Previsão', 'Perdas', 'Funis',
  'Negócios', 'Kanban', 'Leads', 'Atividades',
  'Pessoas', 'Organizações', 'Produtos', 'Notas',
  'Usuários', 'Saúde', 'Configurações',
];

const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

async function abrirPainel(page) {
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

const irPara = async (page, label, ms) => {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes(l))?.click();
  }, label);
  await page.waitForTimeout(ms);
};

const R = { dark: {}, light: {}, perf: null };

async function varrer(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.setItem('pp:dens', 'padrao'); localStorage.setItem('pp:perpage', '25'); } catch { /* ignora */ }
  }, tema);

  const page = await ctx.newPage();
  const errosPorTela = {};
  let telaAtual = '(boot)';
  page.on('console', (m) => {
    if (m.type() === 'error' && doPainel(m.text())) (errosPorTela[telaAtual] ??= []).push(m.text().slice(0, 160));
  });
  page.on('pageerror', (e) => {
    if (doPainel(e.message)) (errosPorTela[telaAtual] ??= []).push('PAGEERROR: ' + e.message.slice(0, 160));
  });
  const ruins = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/api/pipedrive/')) ruins.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });

  await abrirPainel(page);

  // ── 0. A prova confere a própria cobertura ────────────────────────────────
  // Lê os rótulos que a sidebar do painel realmente oferece. Comparar com TELAS
  // pega os dois lados: tela nova sem cobertura E tela removida que ficou na lista.
  const navReal = await page.evaluate(() =>
    [...document.querySelectorAll('[data-pp-react-root] .pp-navitem')]
      .map((x) => x.textContent.trim())
      .filter(Boolean));

  const telas = {};
  for (const nome of TELAS) {
    telaAtual = nome;
    const t0 = Date.now();
    await irPara(page, nome, 2600);
    telas[nome] = await page.evaluate(() => {
      const main = document.querySelector('[data-pp-react-root] .pp-main');
      const head = main?.querySelector('.pp-pagehead');
      return {
        montou: !!main && main.textContent.trim().length > 0,
        temCabecalho: !!head,
        temIcone: !!head?.querySelector('.pp-pagehead-ic'),
        titulo: head?.querySelector('h1, .pp-pagehead-tit, .pp-h1')?.textContent.trim() ?? null,
        // `.pp-h1` solto = tela que ficou para trás na padronização do PageHeader.
        h1Solto: !!main?.querySelector(':scope > .pp-h1'),
        estouro: !!main && main.scrollWidth > main.clientWidth + 2,
        nosNoMain: main?.querySelectorAll('*').length ?? 0,
      };
    });
    telas[nome].ms = Date.now() - t0;
    await page.screenshot({ path: `${OUT}/${tema}-${nome.replace(/[^\wÀ-ú]+/g, '-')}.jpg`, quality: 70, type: 'jpeg' });
  }

  // Estouro no celular real (480px — onde a sidebar do shell recolhe; ver prova da Fase 6)
  await page.setViewportSize({ width: 480, height: 950 });
  await page.waitForTimeout(1200);
  const estouroCelular = {};
  for (const nome of ['Visão Geral', 'Negócios', 'Kanban', 'Funis', 'Alertas', 'Configurações']) {
    telaAtual = `${nome} (480px)`;
    await irPara(page, nome, 2400);
    estouroCelular[nome] = await page.evaluate(() => {
      const main = document.querySelector('[data-pp-react-root] .pp-main');
      return main ? Math.max(0, main.scrollWidth - main.clientWidth) : -1;
    });
  }

  R[tema] = { telas, estouroCelular, errosPorTela, ruins, navReal };
  await browser.close();
}

// ── Medição: a página de 200 linhas pesa? ────────────────────────────────────
async function medirGrid() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  const page = await ctx.newPage();
  await abrirPainel(page);

  const medidas = {};
  for (const perPage of [25, 200]) {
    await page.evaluate((n) => { try { localStorage.setItem('pp:perpage', String(n)); } catch { /* ignora */ } }, perPage);
    // Remonta a tela para o grid reler a preferência (ela é lida na montagem).
    await irPara(page, 'Visão Geral', 1500);
    const t0 = Date.now();
    await irPara(page, 'Atividades', 4200);   // 105 mil atividades = o pior caso do módulo
    const pronto = Date.now() - t0;

    const dom = await page.evaluate(() => {
      const main = document.querySelector('[data-pp-react-root] .pp-main');
      return {
        linhas: main?.querySelectorAll('.pp-table tbody tr').length ?? 0,
        celulas: main?.querySelectorAll('.pp-table tbody td').length ?? 0,
        nos: main?.querySelectorAll('*').length ?? 0,
      };
    });

    // ⚠️ NÃO medimos por QUADROS. Tentamos: o piso deste ambiente (headless sem GPU, com
    // o ticker de notícias e o relógio do shell animando) é ~29ms de intervalo entre
    // quadros SEM grid nenhum, e a série saiu não-monotônica (25 linhas medindo PIOR que
    // 100). Um sinal que se contradiz não sustenta decisão. Medimos então algo
    // determinístico: nós no DOM e custo de um reflow forçado da tabela.
    const layout = await page.evaluate(() => {
      const tbl = document.querySelector('[data-pp-react-root] .pp-table');
      if (!tbl) return null;
      const amostras = [];
      for (let i = 0; i < 7; i++) {
        const t0 = performance.now();
        tbl.style.setProperty('--forca-reflow', String(i));
        void tbl.getBoundingClientRect();
        void tbl.offsetHeight;
        amostras.push(performance.now() - t0);
      }
      amostras.sort((a, b) => a - b);
      return { medianaMs: +amostras[3].toFixed(2) };
    });

    medidas[perPage] = { prontoMs: pronto, ...dom, layout };
  }
  R.perf = medidas;
  await browser.close();
}

await varrer('dark');
await varrer('light');
await medirGrid();

log('\n===== FASE 7 — varredura + performance =====');
log(JSON.stringify(R, null, 2));

const falhas = [];
for (const t of ['dark', 'light']) {
  const r = R[t];

  // ── 0. Cobertura: a lista TELAS bate com a navegação real? ────────────────
  // Sem isto a prova só sabe o que já sabia: uma tela nova nasce invisível e a
  // varredura segue anunciando "limpa" sobre um módulo que cresceu.
  const semCobertura = (r.navReal ?? []).filter((n) => !TELAS.includes(n));
  const sobrando = TELAS.filter((n) => !(r.navReal ?? []).includes(n));
  if (semCobertura.length) {
    falhas.push(`${t}: ${semCobertura.length} tela(s) na navegação SEM cobertura nesta prova — ${semCobertura.join(', ')}. Inclua em TELAS.`);
  }
  if (sobrando.length) {
    falhas.push(`${t}: TELAS lista tela(s) que a navegação não oferece — ${sobrando.join(', ')}. Removida do painel?`);
  }
  if (!semCobertura.length && !sobrando.length) {
    log(`  ${t}: cobertura conferida — ${TELAS.length} telas na lista = ${r.navReal.length} na navegação`);
  }

  for (const [tela, v] of Object.entries(r.telas)) {
    if (!v.montou) falhas.push(`${t}/${tela}: tela vazia`);
    if (!v.temCabecalho) falhas.push(`${t}/${tela}: sem cabeçalho padrão (PageHeader)`);
    if (!v.temIcone) falhas.push(`${t}/${tela}: cabeçalho sem ícone da área`);
    if (v.h1Solto) falhas.push(`${t}/${tela}: <h1> cru fora do PageHeader (inconsistência §24)`);
    if (v.estouro) falhas.push(`${t}/${tela}: estouro horizontal em 1600px`);
  }
  for (const [tela, px] of Object.entries(r.estouroCelular)) {
    if (px > 2) falhas.push(`${t}/${tela} @480px: estouro de ${px}px`);
  }
  const comErro = Object.entries(r.errosPorTela).filter(([, v]) => v.length);
  for (const [tela, msgs] of comErro) falhas.push(`${t}/${tela}: ${msgs.length} erro(s) — ${msgs[0]}`);
  if (r.ruins.length) falhas.push(`${t}: HTTP ruim no /api/pipedrive → ${r.ruins.join(' | ')}`);
}

// Veredito da performance: números determinísticos, não opinião.
const p25 = R.perf?.[25], p200 = R.perf?.[200];
if (p25 && p200) {
  const porLinha25 = p25.layout ? p25.layout.medianaMs / p25.linhas : 0;
  const porLinha200 = p200.layout ? p200.layout.medianaMs / p200.linhas : 0;
  log('\n── Performance do grid (medida determinística) ──');
  log(`  25 linhas : ${p25.nos} nós · reflow ${p25.layout?.medianaMs}ms (${porLinha25.toFixed(3)}ms/linha)`);
  log(`  200 linhas: ${p200.nos} nós · reflow ${p200.layout?.medianaMs}ms (${porLinha200.toFixed(3)}ms/linha)`);
  // Penhasco = o custo por linha DISPARA com o volume (aí virtualizar paga). Custo
  // linear significa que o navegador está lidando bem e a complexidade não se paga.
  const penhasco = porLinha25 > 0 && porLinha200 > porLinha25 * 2.5;
  R.vereditoVirtualizar = penhasco;
  log(penhasco
    ? '  → PENHASCO: o custo por linha dispara. Virtualizar as linhas se justifica.'
    : '  → LINEAR: sem penhasco. O padrão é 25 linhas; 200 é opção do usuário e cabe no orçamento.\n' +
      '    Virtualizar poria em risco colunas fixas, master-detail e totalizadores por ganho não comprovado.');
  // Teto de segurança: acima disto a página de 200 linhas virou outra coisa.
  if (p200.nos > 12000) falhas.push(`grid 200 linhas: ${p200.nos} nós no DOM (teto 12.000)`);
  if ((p200.layout?.medianaMs ?? 0) > 120) falhas.push(`grid 200 linhas: reflow de ${p200.layout.medianaMs}ms`);
}

// O número sai de TELAS.length, não de um literal: foi um "16" escrito à mão que
// deixou a varredura anunciando cobertura total sobre 17 telas.
log(falhas.length
  ? `\n❌ FALHAS (${falhas.length}):\n - ` + falhas.join('\n - ')
  : `\n✅ VARREDURA LIMPA — ${TELAS.length} telas × 2 temas`);
process.exit(falhas.length ? 1 : 0);
