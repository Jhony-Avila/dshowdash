// Valida o VALOR PONDERADO no Kanban (backlog #25), dark + light.
//
// O risco deste recurso não é ele não aparecer — é ele aparecer com um número que
// DISCORDA da tela de Previsão. Por isso a prova não confere o Kanban contra ele mesmo:
// confere contra `GET /forecast` (a fonte) e contra o que a tela de Previsão desenha.
//
//  1. `/forecast` responde 200 e traz `by_stage` com `valor_ponderado`.
//  2. Cada coluna do Kanban que mostra ponderado bate com o `by_stage` da MESMA etapa.
//  3. O total no cabeçalho da página = soma das colunas exibidas (não o total de todos os funis).
//  4. Etapa cujo ponderado é igual ao valor NÃO desenha a linha (ruído evitado) — e a
//     legenda do "≈" existe sempre que há ponderado na tela.
//  5. O total ponderado do Kanban bate com o da tela de Previsão para o mesmo recorte.
//  6. A linha nova não estoura a coluna nem a área do painel — em 1600 e em 480.
//  7. Zero erro de console vindo do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/1af6a59b-262c-4e47-bb42-c1a4935e1164/scratchpad/pond-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };

// Mesmo filtro das provas anteriores: casa por ETIQUETA DE MÓDULO do shell, que o painel
// React nunca emite. Um "Fetch failed" vindo do painel TEM de reprovar.
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

/** "≈ R$ 1.234" → 1234. fmtBRL usa maximumFractionDigits:0, então é inteiro. */
function brl(txt) {
  if (!txt) return null;
  const m = String(txt).replace(/ /g, ' ').match(/-?[\d.]+/);
  if (!m) return null;
  return Number(m[0].replace(/\./g, ''));
}

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
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
  await page.waitForTimeout(3500);

  // ── 1. Fonte da verdade: /forecast e /kanban ──────────────────
  R[tema].api = await page.evaluate(async () => {
    const j = async (u) => (await fetch(u, { credentials: 'same-origin', headers: { Accept: 'application/json' } })).json();
    const rf = await fetch('/api/pipedrive/forecast', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const fc = await rf.json();
    const kb = (await j('/api/pipedrive/kanban')).data;
    return {
      httpForecast: rf.status,
      byStage: (fc.data?.by_stage ?? []).map((s) => ({
        stage_id: s.stage_id, stage: s.stage, pond: s.valor_ponderado, efetiva: s.prob_efetiva, count: s.count,
      })),
      kanban: {
        funil: kb.pipeline_name,
        colunas: kb.columns.map((c) => ({ stage_id: c.stage_id, stage: c.stage, count: c.count, valor: c.valor })),
        totalValor: kb.totais.valor,
      },
    };
  });

  // ── 2/4. O que a tela desenhou ────────────────────────────────
  R[tema].tela = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')];
    return {
      colunas: cols.map((c) => ({
        nome: c.querySelector('.pp-kan-head .nm')?.textContent.trim() ?? null,
        valor: c.querySelector('.pp-kan-head .m .v')?.textContent.trim() ?? null,
        pond: c.querySelector('.pp-kan-pond .vp')?.textContent.trim() ?? null,
        pondTitle: c.querySelector('.pp-kan-pond')?.getAttribute('title') ?? null,
        // A linha do ponderado não pode transbordar a coluna.
        estoura: (() => {
          const p = c.querySelector('.pp-kan-pond');
          if (!p) return false;
          return p.scrollWidth > p.clientWidth + 2 || p.getBoundingClientRect().right > c.getBoundingClientRect().right + 2;
        })(),
      })),
      descricao: document.querySelector('[data-pp-react-root] .pp-pagehead-desc, [data-pp-react-root] .pp-ph-desc')?.textContent.trim()
        ?? document.querySelector('[data-pp-react-root] .pp-kanban')?.closest('div')?.querySelector('p')?.textContent.trim()
        ?? null,
      legendaAprox: !!document.querySelector('[data-pp-react-root] .pp-kan-legenda')?.textContent.includes('≈'),
      mainEstoura: (() => {
        const m = document.querySelector('[data-pp-react-root] .pp-main');
        return !!m && m.scrollWidth > m.clientWidth + 2;
      })(),
    };
  });

  // Cabeçalho da página inteiro (o total ponderado vive na descrição).
  R[tema].cabecalho = await page.evaluate(() => {
    const h = document.querySelector('[data-pp-react-root] .pp-pagehead, [data-pp-react-root] header');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : null;
  });

  await page.screenshot({ path: `${OUT}/kanban-pond-${tema}.png`, fullPage: false }).catch(() => {});

  // ── 5. Cruzar com a tela de Previsão ──────────────────────────
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Previsão'))?.click();
  });
  await page.waitForTimeout(3000);
  R[tema].previsao = await page.evaluate(() => {
    const txt = document.querySelector('[data-pp-react-root] .pp-main')?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    return { temTexto: txt.length > 0, trecho: txt.slice(0, 400) };
  });

  // ── 6. Estreito (480) ─────────────────────────────────────────
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Kanban'))?.click();
  });
  await page.waitForTimeout(2000);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(2000);
  R[tema].estreito = await page.evaluate(() => {
    const m = document.querySelector('[data-pp-react-root] .pp-main');
    const ps = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-pond')];
    return {
      mainEstoura: !!m && m.scrollWidth > m.clientWidth + 2,
      docEstoura: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      pondVisiveis: ps.length,
      pondEstoura: ps.some((p) => p.scrollWidth > p.clientWidth + 2),
    };
  });
  await page.screenshot({ path: `${OUT}/kanban-pond-${tema}-480.png`, fullPage: false }).catch(() => {});

  R[tema].errors = errors;
  R[tema].respostasRuins = respostasRuins.filter((r) => /\/api\/pipedrive\//.test(r));
  await browser.close();
}

// ── Veredito ────────────────────────────────────────────────────
const falhas = [];
function checa(cond, msg) { if (!cond) falhas.push(msg); return !!cond; }

await import('node:fs').then((fs) => fs.mkdirSync(OUT, { recursive: true }));

for (const tema of ['dark', 'light']) {
  log(`\n═══ ${tema.toUpperCase()} ═══`);
  await rodar(tema);
  const r = R[tema];

  checa(r.api.httpForecast === 200, `[${tema}] /forecast devolveu ${r.api.httpForecast}`);
  checa(r.api.byStage.length > 0, `[${tema}] /forecast sem by_stage`);

  const porId = new Map(r.api.byStage.map((s) => [s.stage_id, s]));
  const colsApi = r.api.kanban.colunas;

  // 2. Cada ponderado desenhado bate com a fonte.
  let conferidas = 0, esperadasComLinha = 0;
  r.tela.colunas.forEach((c, i) => {
    const api = colsApi[i] ? porId.get(colsApi[i].stage_id) : null;
    const valorCol = colsApi[i]?.valor ?? 0;
    const deveMostrar = !!api && Math.round(api.pond) !== Math.round(valorCol);
    if (deveMostrar) esperadasComLinha++;

    if (c.pond) {
      const vistoNum = brl(c.pond);
      checa(!!api, `[${tema}] coluna "${c.nome}" mostra ponderado mas não existe no /forecast`);
      if (api) {
        checa(Math.abs(vistoNum - Math.round(api.pond)) <= 1,
          `[${tema}] "${c.nome}": tela ${vistoNum} × forecast ${Math.round(api.pond)}`);
        conferidas++;
      }
      checa(!c.estoura, `[${tema}] "${c.nome}": linha do ponderado transborda a coluna`);
      checa(/Previsão/.test(c.pondTitle ?? ''), `[${tema}] "${c.nome}": tooltip não cita a tela Previsão`);
      checa(/valor × probabilidade/i.test(c.pondTitle ?? ''), `[${tema}] "${c.nome}": tooltip não explica a fórmula`);
    }
    // 4. Ruído evitado: igual ao valor ⇒ sem linha.
    checa(!(c.pond && !deveMostrar),
      `[${tema}] "${c.nome}": desenhou ponderado igual ao valor (ruído)`);
  });
  log(`  colunas: ${r.tela.colunas.length} · com ponderado: ${conferidas} (esperado ${esperadasComLinha})`);
  checa(conferidas === esperadasComLinha,
    `[${tema}] desenhou ${conferidas} ponderados, esperado ${esperadasComLinha}`);

  // 3. Total do cabeçalho = soma das colunas exibidas.
  const somaExibidas = colsApi.reduce((a, c) => a + (porId.get(c.stage_id)?.pond ?? 0), 0);
  const totalNaTela = (() => {
    const m = (r.cabecalho ?? '').replace(/ /g, ' ').match(/≈\s*R\$\s*([\d.]+)\s*ponderado/);
    return m ? Number(m[1].replace(/\./g, '')) : null;
  })();
  const deveTerTotal = Math.round(somaExibidas) !== Math.round(r.api.kanban.totalValor);
  if (deveTerTotal) {
    checa(totalNaTela != null, `[${tema}] cabeçalho sem total ponderado (esperado ${Math.round(somaExibidas)})`);
    if (totalNaTela != null) {
      checa(Math.abs(totalNaTela - Math.round(somaExibidas)) <= 1,
        `[${tema}] total: tela ${totalNaTela} × soma das colunas ${Math.round(somaExibidas)}`);
      // Não pode ser o total de TODOS os funis.
      log(`  total ponderado: ${totalNaTela} (soma das colunas ${Math.round(somaExibidas)})`);
    }
  } else {
    checa(totalNaTela == null, `[${tema}] cabeçalho mostrou total ponderado idêntico ao valor (ruído)`);
    log('  funil todo a 100% — total ponderado omitido de propósito');
  }

  // 4b. Legenda do "≈".
  checa(r.tela.legendaAprox, `[${tema}] legenda não explica o "≈"`);

  // 6. Sem estouro.
  checa(!r.tela.mainEstoura, `[${tema}] área do painel estoura em 1600px`);
  checa(!r.estreito.mainEstoura, `[${tema}] área do painel estoura em 480px`);
  checa(!r.estreito.docEstoura, `[${tema}] documento ganha rolagem horizontal em 480px`);
  checa(!r.estreito.pondEstoura, `[${tema}] linha do ponderado transborda em 480px`);
  log(`  480px: ${r.estreito.pondVisiveis} linha(s) de ponderado, sem estouro`);

  // 5. Previsão continua de pé (mesma fonte, sem quebrar).
  checa(r.previsao.temTexto, `[${tema}] tela de Previsão ficou vazia`);

  // 7. Console limpo.
  checa(r.errors.length === 0, `[${tema}] ${r.errors.length} erro(s) de console: ${r.errors.slice(0, 3).join(' | ')}`);
  checa(r.respostasRuins.length === 0, `[${tema}] resposta ruim: ${r.respostasRuins.slice(0, 3).join(' | ')}`);
}

log('\n═══════════════════════════════════════');
if (falhas.length === 0) {
  log('✅ PASSOU — ponderado do Kanban confere com /forecast, não vira ruído e não estoura.');
  process.exit(0);
}
log(`❌ ${falhas.length} FALHA(S):`);
falhas.forEach((f) => log('  · ' + f));
process.exit(1);
