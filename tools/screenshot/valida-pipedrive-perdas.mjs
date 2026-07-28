// PERDAS (#30) — prova da tela de motivos de perda e do filtro por motivo no grid.
//
// No molde das provas das Fases 4-7. O que exige, em dark e light:
//   1. a tela monta, tem cabeçalho padrão (ícone + título) e 0 erro de console do painel;
//   2. os NÚMEROS da tela batem com a API — e a API bate com o SQL (conferido à parte
//      pela prova PHP); aqui a comparação é tela × API, que é o elo que faltava;
//   3. a tela DIZ o que não sabe: com perdidos sem motivo, o aviso de cobertura aparece;
//   4. o drill-down leva a Negócios filtrado pelo motivo, e o grid volta só aquele motivo;
//   5. troca de janela (12m → todo o histórico) muda os números de verdade;
//   6. sem estouro horizontal em 1600 e 480.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/7546410f-fa6e-43d3-bfdc-519d6939e111/scratchpad/perdas-shots';
const log = (...a) => console.log(...a);

const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

let ok = 0, fail = 0;
function checa(rotulo, condicao, detalhe = '') {
  if (condicao) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
}

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

const irPara = async (page, label, ms = 2600) => {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes(l))?.click();
  }, label);
  await page.waitForTimeout(ms);
};

/** Números como o USUÁRIO os vê (texto renderizado), para comparar com a API. */
const lerTela = (page) => page.evaluate(() => {
  const main = document.querySelector('[data-pp-react-root] .pp-main');
  const head = main?.querySelector('.pp-pagehead');
  const num = (s) => {
    if (!s) return null;
    const m = s.replace(/\./g, '').match(/-?\d+(,\d+)?/);
    return m ? Number(m[0].replace(',', '.')) : null;
  };
  const bigs = [...(main?.querySelectorAll('.pp-bn') ?? [])].map((b) => ({
    rotulo: b.querySelector('.pp-bn-l')?.textContent.trim() ?? '',
    valor: num(b.querySelector('.pp-bn-n')?.textContent ?? ''),
  }));
  const linhas = [...(main?.querySelectorAll('table.pp-table') ?? [])].map((t) =>
    [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())));
  return {
    montou: !!main && main.textContent.trim().length > 0,
    temCabecalho: !!head,
    temIcone: !!head?.querySelector('.pp-pagehead-ic'),
    titulo: head?.querySelector('h1, .pp-h1')?.textContent.trim() ?? null,
    contagem: num(head?.querySelector('.pp-pagehead-count')?.textContent ?? ''),
    bigs,
    // 1ª tabela = ranking de motivos; as outras, os recortes.
    motivos: (linhas[0] ?? []).map((c) => ({ motivo: c[0], n: num(c[1]), share: c[2] })),
    tabelas: linhas.length,
    graficos: main?.querySelectorAll('.pp-chart, canvas').length ?? 0,
    avisoCobertura: /não têm motivo|não tem motivo/.test(main?.textContent ?? ''),
    nota: /etapa de um negócio perdido/i.test(main?.textContent ?? ''),
    estouro: !!main && main.scrollWidth > main.clientWidth + 2,
  };
});

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* ignora */ } }, tema);

  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) erros.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => { if (doPainel(e.message)) erros.push('PAGEERROR: ' + e.message.slice(0, 160)); });
  const ruins = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/api/pipedrive/')) ruins.push(`${r.status()} ${r.url()}`);
  });

  log(`\n── ${tema.toUpperCase()} ──`);
  await abrirPainel(page);
  await irPara(page, 'Perdas', 3200);
  await page.screenshot({ path: `${OUT}/${tema}-perdas.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  const tela = await lerTela(page);
  checa(`[${tema}] tela monta`, tela.montou);
  checa(`[${tema}] cabeçalho padrão (ícone + título)`, tela.temCabecalho && tela.temIcone && tela.titulo === 'Perdas', `titulo=${tela.titulo}`);
  checa(`[${tema}] tem gráficos`, tela.graficos >= 2, `graficos=${tela.graficos}`);
  checa(`[${tema}] tem ranking + recortes`, tela.tabelas >= 3, `tabelas=${tela.tabelas}`);
  checa(`[${tema}] repete a ressalva da etapa de fechamento`, tela.nota);
  checa(`[${tema}] sem estouro horizontal (1600px)`, !tela.estouro);

  // A API é a referência: a tela não pode mostrar número que a API não devolveu.
  const api = await page.evaluate(async () => {
    const r = await fetch('/api/pipedrive/lost-reasons?months=12', { credentials: 'include' });
    return (await r.json()).data;
  });
  const bigPerdidos = tela.bigs.find((b) => /perdidos/i.test(b.rotulo))?.valor;
  const bigTaxa = tela.bigs.find((b) => /taxa de perda/i.test(b.rotulo))?.valor;
  const bigCobertura = tela.bigs.find((b) => /motivo informado/i.test(b.rotulo))?.valor;
  checa(`[${tema}] "perdidos" da tela == API`, bigPerdidos === api.totais.perdidos, `tela=${bigPerdidos} api=${api.totais.perdidos}`);
  checa(`[${tema}] "taxa de perda" da tela == API`, bigTaxa === api.totais.taxa_perda_pct, `tela=${bigTaxa} api=${api.totais.taxa_perda_pct}`);
  checa(`[${tema}] "cobertura" da tela == API`, bigCobertura === api.totais.cobertura_pct, `tela=${bigCobertura} api=${api.totais.cobertura_pct}`);
  checa(`[${tema}] contagem do cabeçalho == perdidos`, tela.contagem === api.totais.perdidos);
  checa(`[${tema}] ranking lista todos os motivos`, tela.motivos.length === api.motivos.length, `tela=${tela.motivos.length} api=${api.motivos.length}`);
  checa(`[${tema}] 1º motivo e volume conferem`, tela.motivos[0]?.motivo === api.motivos[0]?.motivo && tela.motivos[0]?.n === api.motivos[0]?.n,
    `${tela.motivos[0]?.motivo}=${tela.motivos[0]?.n}`);
  // O aviso só deve existir quando há perdido sem motivo — não é decoração fixa.
  checa(`[${tema}] aviso de cobertura condiz com o dado`, tela.avisoCobertura === (api.totais.sem_motivo > 0),
    `sem_motivo=${api.totais.sem_motivo} aviso=${tela.avisoCobertura}`);

  // Janela: "Todo o histórico" precisa mudar os números (senão o seletor é decorativo).
  await page.evaluate(() => {
    [...document.querySelectorAll('[data-pp-react-root] .pp-quick-b')].find((b) => /histórico/i.test(b.textContent))?.click();
  });
  await page.waitForTimeout(3000);
  const telaHist = await lerTela(page);
  checa(`[${tema}] janela "todo o histórico" muda os números`,
    telaHist.bigs.find((b) => /perdidos/i.test(b.rotulo))?.valor > bigPerdidos,
    `12m=${bigPerdidos} tudo=${telaHist.bigs.find((b) => /perdidos/i.test(b.rotulo))?.valor}`);
  await page.screenshot({ path: `${OUT}/${tema}-perdas-historico.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  // Drill-down: clicar no motivo leva a Negócios filtrado por aquele motivo.
  if (tema === 'dark') {
    const motivoAlvo = api.motivos[0].motivo;
    await page.evaluate(() => {
      [...document.querySelectorAll('[data-pp-react-root] .pp-quick-b')].find((b) => /12 meses/.test(b.textContent))?.click();
    });
    await page.waitForTimeout(2500);
    await page.evaluate((m) => {
      [...document.querySelectorAll('[data-pp-react-root] tr.pp-clik')].find((tr) => tr.textContent.startsWith(m))?.click();
    }, motivoAlvo);
    await page.waitForTimeout(3500);

    const drill = await page.evaluate(() => {
      const main = document.querySelector('[data-pp-react-root] .pp-main');
      const head = main?.querySelector('.pp-pagehead h1, .pp-pagehead .pp-h1')?.textContent.trim();
      const idxMotivo = [...(main?.querySelectorAll('table.pp-table thead th') ?? [])]
        .findIndex((th) => /motivo da perda/i.test(th.textContent));
      const motivosNaPagina = idxMotivo >= 0
        ? [...main.querySelectorAll('table.pp-table tbody tr')].map((tr) => tr.querySelectorAll('td')[idxMotivo]?.textContent.trim()).filter(Boolean)
        : [];
      return { head, hash: location.hash, motivosNaPagina: [...new Set(motivosNaPagina)] };
    });
    checa('[drill] foi para Negócios', drill.head === 'Negócios', `head=${drill.head}`);
    checa('[drill] filtro viaja no hash', drill.hash.includes('lost_reason=') && drill.hash.includes('status=lost'), drill.hash.slice(0, 90));
    checa('[drill] grid mostra SÓ o motivo pedido',
      drill.motivosNaPagina.length === 1 && drill.motivosNaPagina[0] === motivoAlvo,
      `motivos na página: ${JSON.stringify(drill.motivosNaPagina)}`);
    await page.screenshot({ path: `${OUT}/drill-negocios-motivo.jpg`, quality: 70, type: 'jpeg' });
  }

  // 480px: onde o app-shell recolhe a sidebar (ver zona morta documentada na Fase 6).
  await page.setViewportSize({ width: 480, height: 950 });
  await page.waitForTimeout(1200);
  await irPara(page, 'Perdas', 2800);
  const estouro480 = await page.evaluate(() => {
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    return main ? Math.max(0, main.scrollWidth - main.clientWidth) : -1;
  });
  checa(`[${tema}] sem estouro em 480px`, estouro480 <= 2, `estouro=${estouro480}px`);
  await page.screenshot({ path: `${OUT}/${tema}-perdas-480.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  checa(`[${tema}] 0 erro de console do painel`, erros.length === 0, erros.slice(0, 3).join(' | '));
  checa(`[${tema}] 0 resposta 4xx/5xx da API`, ruins.length === 0, ruins.slice(0, 3).join(' | '));

  await browser.close();
}

await rodar('dark');
await rodar('light');
log(`\n== ${ok} OK, ${fail} falhas ==`);
process.exit(fail > 0 ? 1 : 0);
