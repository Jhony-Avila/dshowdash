// ORIGEM DOS LEADS (#31) — prova da 18ª tela.
//
// No molde da prova de Perdas (#30). O que exige, em dark e light:
//   1. a tela monta, tem cabeçalho padrão (ícone + título) e 0 erro de console do painel;
//   2. os NÚMEROS da tela batem com a API — e a API bate com o SQL (conferido à parte pela
//      prova PHP em scratchpad/prova-lead-sources.php);
//   3. a ARITMÉTICA multi-valor fecha: soma(origens.n) − com_origem == multi_origem.
//      Este é o coração do #31: o campo aceita duas origens por negócio, e se a tela não
//      declarar isso o usuário soma a coluna, não bate com o total e perde a confiança;
//   4. a tela DIZ o que não sabe: aviso de cobertura quando há negócio sem origem, e a
//      conversão da fatia sem origem exposta como teste de viés;
//   5. a dispersão é REGISTRADA de verdade (ScatterChart no echarts-core) — o sintoma de
//      esquecer é um cartão vazio, sem erro;
//   6. conversão nunca vira "0%" quando o certo é "—" (nada fechou ainda);
//   7. troca de janela (12m → todo o histórico) muda os números de verdade;
//   8. sem estouro horizontal em 1600 e 480.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/e02a89a8-4b11-4e81-b13d-1316968b26cc/scratchpad/origem-shots';
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
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.trim() === l)?.click();
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
  const tabelas = [...(main?.querySelectorAll('table.pp-table') ?? [])].map((t) =>
    [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())));
  const txt = main?.textContent ?? '';
  return {
    montou: !!main && main.textContent.trim().length > 0,
    temCabecalho: !!head,
    temIcone: !!head?.querySelector('.pp-pagehead-ic'),
    titulo: head?.querySelector('h1, .pp-h1')?.textContent.trim() ?? null,
    contagem: num(head?.querySelector('.pp-pagehead-count')?.textContent ?? ''),
    bigs,
    // 1ª tabela = ranking de origens; as demais, os recortes.
    origens: (tabelas[0] ?? []).map((c) => ({ origem: c[0], n: num(c[1]), conversao: c[3] })),
    tabelas: tabelas.length,
    graficos: main?.querySelectorAll('canvas').length ?? 0,
    // Cartão de gráfico que ficou VAZIO (sintoma de série não registrada no echarts-core).
    cartoesVazios: main?.querySelectorAll('.pp-cc-vazio').length ?? 0,
    avisoCobertura: /não têm origem|não tem origem/.test(txt),
    avisoMulti: /mais de uma\s+origem/.test(txt),
    notaMultiValor: /soma das origens pode passar do total/i.test(txt),
    notaSafra: /ainda não terminou de converter/i.test(txt),
    estouro: !!main && main.scrollWidth > main.clientWidth + 2,
    // Tabela mais larga que o próprio contêiner: o conteúdo é CORTADO dentro do card sem
    // alargar o .pp-main, então a medida de estouro global não enxerga. Foi assim que a
    // 4ª coluna dos recortes ("Origem principal") saiu truncada em "Clie…" na 1ª versão.
    tabelasCortadas: [...(main?.querySelectorAll('.pp-tabela-rolavel') ?? [])]
      .filter((d) => d.scrollWidth > d.clientWidth + 2)
      .map((d) => `${d.querySelector('table')?.querySelector('th')?.textContent?.trim() ?? '?'}: ${d.scrollWidth}>${d.clientWidth}`),
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
  await irPara(page, 'Origem', 3600);
  await page.screenshot({ path: `${OUT}/${tema}-origem.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  const tela = await lerTela(page);
  checa(`[${tema}] tela monta`, tela.montou);
  checa(`[${tema}] cabeçalho padrão (ícone + título)`, tela.temCabecalho && tela.temIcone && tela.titulo === 'Origem dos Leads', `titulo=${tela.titulo}`);
  checa(`[${tema}] dispersão + tendência desenharam`, tela.graficos >= 2, `canvas=${tela.graficos}`);
  // Série não registrada no echarts-core falha em SILÊNCIO: o cartão fica vazio.
  checa(`[${tema}] nenhum cartão de gráfico vazio`, tela.cartoesVazios === 0, `vazios=${tela.cartoesVazios}`);
  checa(`[${tema}] tem ranking + recortes`, tela.tabelas >= 3, `tabelas=${tela.tabelas}`);
  checa(`[${tema}] repete a ressalva do multi-valor`, tela.notaMultiValor);
  checa(`[${tema}] repete a ressalva da safra recente`, tela.notaSafra);
  checa(`[${tema}] sem estouro horizontal (1600px)`, !tela.estouro);
  checa(`[${tema}] nenhuma tabela cortada dentro do card`, tela.tabelasCortadas.length === 0,
    tela.tabelasCortadas.join(' | '));

  // A API é a referência: a tela não pode mostrar número que a API não devolveu.
  const api = await page.evaluate(async () => {
    const r = await fetch('/api/pipedrive/lead-sources?months=12', { credentials: 'include' });
    return (await r.json()).data;
  });
  const t = api.totais;
  const big = (re) => tela.bigs.find((b) => re.test(b.rotulo))?.valor;

  checa(`[${tema}] "leads classificados" da tela == API`, big(/classificados/i) === t.com_origem, `tela=${big(/classificados/i)} api=${t.com_origem}`);
  checa(`[${tema}] "cobertura" da tela == API`, big(/cobertura/i) === t.cobertura_pct, `tela=${big(/cobertura/i)} api=${t.cobertura_pct}`);
  checa(`[${tema}] "conversão geral" da tela == API`, big(/conversão geral/i) === t.conversao_pct, `tela=${big(/conversão geral/i)} api=${t.conversao_pct}`);
  checa(`[${tema}] contagem do cabeçalho == classificados`, tela.contagem === t.com_origem);
  checa(`[${tema}] ranking lista todas as origens`, tela.origens.length === api.origens.length, `tela=${tela.origens.length} api=${api.origens.length}`);

  // 3) A ARITMÉTICA MULTI-VALOR — a razão de ser das ressalvas desta tela.
  const somaN = api.origens.reduce((a, o) => a + o.n, 0);
  checa(`[${tema}] soma(origens) − classificados == multi_origem`,
    somaN - t.com_origem === t.multi_origem,
    `soma=${somaN} com_origem=${t.com_origem} multi=${t.multi_origem} (dif=${somaN - t.com_origem})`);
  checa(`[${tema}] aviso de multi-origem condiz com o dado`,
    tela.avisoMulti === (t.multi_origem > 0), `multi=${t.multi_origem} aviso=${tela.avisoMulti}`);

  // 4) Cobertura e o teste de viés da fatia sem origem.
  checa(`[${tema}] aviso de cobertura condiz com o dado`,
    tela.avisoCobertura === (t.sem_origem > 0), `sem_origem=${t.sem_origem} aviso=${tela.avisoCobertura}`);
  checa(`[${tema}] API expõe a conversão da fatia SEM origem`,
    t.sem_origem_fechados === 0 || typeof t.sem_origem_conversao_pct === 'number',
    `fechados=${t.sem_origem_fechados} conv=${t.sem_origem_conversao_pct}`);

  // Denominador honesto: conversão só sobre o que fechou, nunca sobre o total.
  const conversaoBate = api.origens.every((o) =>
    o.fechados === 0
      ? o.conversao_pct === null
      : Math.abs(o.conversao_pct - (o.ganhos / o.fechados) * 100) < 0.06);
  checa(`[${tema}] conversão = ganhos/fechados em TODAS as origens`, conversaoBate);

  // 6) "—" e não "0%" quando nada fechou — zero é uma afirmação, ausência é outra.
  const semFechados = api.origens.filter((o) => o.fechados === 0).map((o) => o.origem);
  const traçoCerto = semFechados.every((nome) => {
    const linha = tela.origens.find((l) => l.origem === nome);
    return !linha || linha.conversao.startsWith('—');
  });
  checa(`[${tema}] origem sem negócio fechado mostra "—", não "0%"`, traçoCerto,
    semFechados.length ? `sem fechados: ${semFechados.join(', ')}` : 'nenhuma origem sem fechados nesta janela');

  // 7) Janela: "Todo o histórico" precisa mudar os números.
  await page.evaluate(() => {
    [...document.querySelectorAll('[data-pp-react-root] .pp-quick-b')].find((b) => /histórico/i.test(b.textContent))?.click();
  });
  await page.waitForTimeout(3500);
  const telaHist = await lerTela(page);
  checa(`[${tema}] janela "todo o histórico" muda os números`,
    telaHist.bigs.find((b) => /classificados/i.test(b.rotulo))?.valor > big(/classificados/i),
    `12m=${big(/classificados/i)} tudo=${telaHist.bigs.find((b) => /classificados/i.test(b.rotulo))?.valor}`);
  await page.screenshot({ path: `${OUT}/${tema}-origem-historico.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  // 8) 480px: onde o app-shell recolhe a sidebar (zona morta documentada na Fase 6).
  await page.setViewportSize({ width: 480, height: 950 });
  await page.waitForTimeout(1200);
  await irPara(page, 'Origem', 3000);
  const estouro480 = await page.evaluate(() => {
    const main = document.querySelector('[data-pp-react-root] .pp-main');
    return main ? Math.max(0, main.scrollWidth - main.clientWidth) : -1;
  });
  checa(`[${tema}] sem estouro em 480px`, estouro480 <= 2, `estouro=${estouro480}px`);
  await page.screenshot({ path: `${OUT}/${tema}-origem-480.jpg`, quality: 70, type: 'jpeg', fullPage: true });

  checa(`[${tema}] 0 erro de console do painel`, erros.length === 0, erros.slice(0, 3).join(' | '));
  checa(`[${tema}] 0 resposta 4xx/5xx da API`, ruins.length === 0, ruins.slice(0, 3).join(' | '));

  await browser.close();
}

await rodar('dark');
await rodar('light');
log(`\n== ${ok} OK, ${fail} falhas ==`);
process.exit(fail > 0 ? 1 : 0);
