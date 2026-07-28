// Valida os FILTROS do Kanban (backlog #26) — dono e previsão de fechamento.
//
// O risco deste recurso não é o filtro não filtrar. São dois outros:
//   (a) o ponderado (#25) vem de /forecast; se ele não receber o MESMO recorte, a coluna
//       passa a mostrar os negócios de um vendedor e o ponderado o da etapa inteira —
//       duas previsões discordando, que é o que o #25 existiu para evitar;
//   (b) 117 dos 248 abertos NÃO têm previsão de fechamento; qualquer recorte por data
//       esconde quase metade do quadro, e some sem avisar é pior do que não filtrar.
//
// Por isso a prova confere contra o BANCO (via API sem filtro), não contra a própria UI:
//   1. cada recorte devolve a contagem que o agregado do banco sustenta;
//   2. o total do quadro filtrado bate com a soma das colunas desenhadas;
//   3. o ponderado de cada coluna filtrada bate com /forecast COM o mesmo recorte —
//      e NÃO com o /forecast global (o teste falharia se alguém "otimizasse" reusando
//      o cache 'all');
//   4. com recorte por data, a tela DIZ quantos sem previsão ficaram de fora;
//   5. prazo inválido não filtra nada (falha para o lado de mostrar tudo);
//   6. "Limpar filtros" devolve o quadro inteiro;
//   7. nada estoura em 1600 nem em 480; 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/1af6a59b-262c-4e47-bb42-c1a4935e1164/scratchpad/f26-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

const brl = (t) => {
  if (!t) return null;
  const m = String(t).replace(/ /g, ' ').match(/-?[\d.]+/);
  return m ? Number(m[0].replace(/\./g, '')) : null;
};

async function irKanban(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Kanban'))?.click();
  });
  await page.waitForSelector('[data-pp-react-root] .pp-kanban', { timeout: 20000 });
  await page.waitForTimeout(2800);
}

/** Lê o quadro desenhado: contagem por coluna e ponderado por coluna. */
const lerQuadro = (page) => page.evaluate(() => {
  const cols = [...document.querySelectorAll('[data-pp-react-root] .pp-kan-col')];
  return {
    colunas: cols.map((c) => ({
      nome: c.querySelector('.pp-kan-head .nm')?.textContent.trim() ?? null,
      qtd: Number((c.querySelector('.pp-kan-head .qtd')?.textContent ?? '0').replace(/\D/g, '')) || 0,
      pond: c.querySelector('.pp-kan-pond .vp')?.textContent.trim() ?? null,
    })),
    recorte: document.querySelector('[data-pp-react-root] .pp-kan-recorte')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    fora: document.querySelector('[data-pp-react-root] .pp-kan-fora')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    temLimpar: !!document.querySelector('[data-pp-react-root] .pp-kan-limpar'),
    mainEstoura: (() => {
      const m = document.querySelector('[data-pp-react-root] .pp-main');
      return !!m && m.scrollWidth > m.clientWidth + 2;
    })(),
  };
});

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* login pela página */ }
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.setItem('pp:dens', 'padrao'); } catch { /* ignora */ }
  }, tema);

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (doPainel(e.message)) errors.push('PAGEERROR: ' + e.message); });
  const ruins = [];
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/api/pipedrive/')) ruins.push(`${r.status()} ${r.url()}`); });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);
  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await irKanban(page);

  // ── Verdade do banco, pela API ────────────────────────────────
  R[tema].api = await page.evaluate(async () => {
    const g = async (u) => (await fetch(u, { credentials: 'same-origin', headers: { Accept: 'application/json' } })).json();
    const base = (await g('/api/pipedrive/kanban')).data;
    const dono = base.owners.find((o) => o.id != null);
    const porPrazo = {};
    for (const p of ['vencidos', 'mes', 'd30', 'd90', 'sem_previsao', 'NAO_EXISTE']) {
      porPrazo[p] = (await g(`/api/pipedrive/kanban?prazo=${p}`)).data.totais.count;
    }
    const kbDono = (await g(`/api/pipedrive/kanban?owner_id=${dono.id}`)).data;
    const fcDono = (await g(`/api/pipedrive/forecast?owner_id=${dono.id}`)).data;
    const fcGlobal = (await g('/api/pipedrive/forecast')).data;
    return {
      total: base.totais.count,
      semPrevisao: base.filtros.sem_previsao_no_funil,
      donos: base.owners.length,
      dono: { id: dono.id, name: dono.name, count: dono.count },
      porPrazo,
      // ponderado por etapa COM e SEM o recorte — é a diferença entre eles que
      // prova que o /forecast recebeu o filtro.
      pondDono: Object.fromEntries(fcDono.by_stage.filter((s) => s.stage_id != null).map((s) => [s.stage_id, s.valor_ponderado])),
      pondGlobal: Object.fromEntries(fcGlobal.by_stage.filter((s) => s.stage_id != null).map((s) => [s.stage_id, s.valor_ponderado])),
      colunasBase: base.columns.map((c) => ({ id: c.stage_id, nome: c.stage, count: c.count })),
      colunasDono: kbDono.columns.map((c) => ({ id: c.stage_id, nome: c.stage, count: c.count })),
    };
  });

  R[tema].semFiltro = await lerQuadro(page);

  // ── Filtrar por DONO na UI ────────────────────────────────────
  const donoId = R[tema].api.dono.id;
  await page.selectOption('[data-pp-react-root] select[aria-label="Dono"]', String(donoId));
  await page.waitForTimeout(3200);
  R[tema].porDono = await lerQuadro(page);

  // ── Filtrar por PRAZO (com dono ainda ativo) ──────────────────
  await page.selectOption('[data-pp-react-root] select[aria-label="Previsão de fechamento"]', 'd90');
  await page.waitForTimeout(3200);
  R[tema].donoEPrazo = await lerQuadro(page);

  // ── "Sem previsão" como recorte próprio ───────────────────────
  await page.selectOption('[data-pp-react-root] select[aria-label="Dono"]', '');
  await page.selectOption('[data-pp-react-root] select[aria-label="Previsão de fechamento"]', 'sem_previsao');
  await page.waitForTimeout(3200);
  R[tema].semPrevisao = await lerQuadro(page);
  await page.screenshot({ path: `${OUT}/kanban-filtros-${tema}.png` }).catch(() => {});

  // ── Limpar ────────────────────────────────────────────────────
  await page.click('[data-pp-react-root] .pp-kan-limpar');
  await page.waitForTimeout(3000);
  R[tema].limpo = await lerQuadro(page);

  // ── 480px ─────────────────────────────────────────────────────
  await page.selectOption('[data-pp-react-root] select[aria-label="Dono"]', String(donoId));
  await page.waitForTimeout(2600);
  await page.setViewportSize({ width: 480, height: 950 });
  await page.waitForTimeout(2200);
  R[tema].estreito = await page.evaluate(() => {
    const m = document.querySelector('[data-pp-react-root] .pp-main');
    const f = document.querySelector('[data-pp-react-root] .pp-kan-recorte');
    return {
      mainEstoura: !!m && m.scrollWidth > m.clientWidth + 2,
      docEstoura: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      recorteVisivel: !!f && f.getBoundingClientRect().height > 0,
      recorteEstoura: !!f && f.scrollWidth > f.clientWidth + 2,
    };
  });

  R[tema].errors = errors;
  R[tema].ruins = ruins;
  await browser.close();
}

const falhas = [];
const checa = (c, m) => { if (!c) falhas.push(m); return !!c; };
await import('node:fs').then((fs) => fs.mkdirSync(OUT, { recursive: true }));

for (const tema of ['dark', 'light']) {
  log(`\n═══ ${tema.toUpperCase()} ═══`);
  await rodar(tema);
  const r = R[tema], api = r.api;

  log(`  base: ${api.total} abertos · ${api.donos} donos · ${api.semPrevisao} sem previsão`);
  log(`  prazos: ${JSON.stringify(api.porPrazo)}`);

  // 5. Prazo inválido não filtra.
  checa(api.porPrazo.NAO_EXISTE === api.total,
    `[${tema}] prazo inválido filtrou (${api.porPrazo.NAO_EXISTE} de ${api.total}) — deveria ignorar`);
  // "sem_previsao" tem de bater com o número que a tela anuncia.
  checa(api.porPrazo.sem_previsao === api.semPrevisao,
    `[${tema}] recorte sem_previsao=${api.porPrazo.sem_previsao} ≠ sem_previsao_no_funil=${api.semPrevisao}`);

  // 1/2. Filtro por dono: soma das colunas = total do dono.
  const somaDono = api.colunasDono.reduce((a, c) => a + c.count, 0);
  checa(somaDono === api.dono.count,
    `[${tema}] soma das colunas do dono (${somaDono}) ≠ contagem do seletor (${api.dono.count})`);
  const naTelaDono = r.porDono.colunas.reduce((a, c) => a + c.qtd, 0);
  checa(naTelaDono === api.dono.count,
    `[${tema}] quadro desenhou ${naTelaDono} para o dono, API diz ${api.dono.count}`);
  log(`  dono "${api.dono.name}": ${naTelaDono} na tela = ${api.dono.count} na API`);

  // Filtrar tem de MUDAR o quadro (senão o filtro é decorativo).
  const somaSemFiltro = r.semFiltro.colunas.reduce((a, c) => a + c.qtd, 0);
  checa(somaSemFiltro > naTelaDono,
    `[${tema}] filtrar por dono não reduziu o quadro (${somaSemFiltro} → ${naTelaDono})`);

  // 3. O PONTO CENTRAL: o ponderado seguiu o recorte.
  let conferidos = 0, provaramRecorte = 0;
  r.porDono.colunas.forEach((c, i) => {
    const col = api.colunasDono[i];
    if (!col || !c.pond) return;
    const esperado = Math.round(api.pondDono[col.id] ?? 0);
    const global = Math.round(api.pondGlobal[col.id] ?? 0);
    const visto = brl(c.pond);
    checa(Math.abs(visto - esperado) <= 1,
      `[${tema}] "${c.nome}": ponderado ${visto} ≠ forecast COM recorte ${esperado}`);
    conferidos++;
    // Se o global difere do filtrado e a tela mostra o filtrado, está provado que o
    // recorte chegou ao /forecast — e não que reusaram o cache 'all'.
    if (global !== esperado) {
      provaramRecorte++;
      checa(Math.abs(visto - global) > 1,
        `[${tema}] "${c.nome}": ponderado igual ao forecast GLOBAL (${global}) — o recorte não chegou ao /forecast`);
    }
  });
  log(`  ponderado: ${conferidos} coluna(s) conferida(s), ${provaramRecorte} provam que o recorte chegou ao /forecast`);
  checa(conferidos > 0, `[${tema}] nenhuma coluna com ponderado para conferir`);
  checa(provaramRecorte > 0,
    `[${tema}] nenhuma coluna onde global ≠ filtrado — o teste não consegue provar o recorte`);

  // 4. A tela declara o recorte e o que ficou de fora.
  checa(!!r.porDono.recorte && r.porDono.recorte.includes(api.dono.name),
    `[${tema}] faixa de recorte não nomeia o dono`);
  checa(!!r.donoEPrazo.fora && /sem previsão/i.test(r.donoEPrazo.fora),
    `[${tema}] com recorte por data, a tela não diz quantos sem previsão ficaram de fora`);
  log(`  aviso: "${r.donoEPrazo.fora}"`);
  // No recorte "sem previsão" o aviso NÃO faz sentido (eles são o próprio recorte).
  checa(!r.semPrevisao.fora,
    `[${tema}] recorte "sem previsão" mostrou o aviso de exclusão (contradição)`);

  // 6. Limpar devolve o quadro inteiro.
  const somaLimpo = r.limpo.colunas.reduce((a, c) => a + c.qtd, 0);
  checa(somaLimpo === somaSemFiltro, `[${tema}] após limpar: ${somaLimpo} ≠ ${somaSemFiltro} do início`);
  checa(!r.limpo.recorte, `[${tema}] faixa de recorte continuou após limpar`);

  // 7. Layout e console.
  checa(!r.semFiltro.mainEstoura && !r.porDono.mainEstoura, `[${tema}] estouro em 1600px`);
  checa(!r.estreito.mainEstoura, `[${tema}] estouro do painel em 480px`);
  checa(!r.estreito.docEstoura, `[${tema}] documento rola horizontal em 480px`);
  checa(r.estreito.recorteVisivel && !r.estreito.recorteEstoura, `[${tema}] faixa de recorte quebrada em 480px`);
  checa(r.errors.length === 0, `[${tema}] ${r.errors.length} erro(s) de console: ${r.errors.slice(0, 2).join(' | ')}`);
  checa(r.ruins.length === 0, `[${tema}] HTTP ruim: ${r.ruins.slice(0, 2).join(' | ')}`);
}

log('\n═══════════════════════════════════════');
if (!falhas.length) {
  log('✅ PASSOU — filtros recortam o quadro, o ponderado segue o recorte e o que fica de fora é declarado.');
  process.exit(0);
}
log(`❌ ${falhas.length} FALHA(S):`);
falhas.forEach((f) => log('  · ' + f));
process.exit(1);
