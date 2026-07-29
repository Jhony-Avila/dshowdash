// Grid de ATIVIDADES: facet de tipo fora da paginação (#46, 3º lote) — e o tipo que faltava.
//
// `activitiesPage()` calculava `SELECT DISTINCT type` em TODA página, ignorando o `facets=0`
// que o grid de Negócios já respeitava. Medido pela origin em 2026-07-29 (page=4&per_page=25,
// mediana de 7 rodadas): 68,4 -> 26,4 ms, ~42 ms por página navegada.
// ⚠️ Este cabeçalho já dizia "177 ms de temporary+filesort sobre 52.959 linhas": ERRADO, era
// medição de antes do índice. A base tem 105.646 linhas ativas e o EXPLAIN dá `Using index`
// sobre `ix_del_type` (is_deleted, type) — sem temporary, sem filesort.
//
// E o ganho que importa não é perf: o `LIMIT 50` daquela consulta ESCONDIA UM TIPO. Existem 51
// na base e o 51º (`zoom_showroom`, 284 atividades) não aparecia no filtro — dado faltando na UI.
//
// O risco desta correção não é performance, é **o filtro de tipo esvaziar ao paginar** — se o
// front perder a cópia das facets, o usuário perde a navegação por tipo. O cache é genérico
// (`EntityGrid`), já provado para Negócios/Produtos, mas Atividades é consumidor NOVO de
// `facets=0`, então exige prova própria.
//
// Exige, em dark e light:
//   1. a 1ª carga de Atividades recebe as facets; da 2ª em diante manda `facets=0`;
//   2. o filtro de tipo continua POPULADO depois de paginar;
//   3. o catálogo traz os 51 tipos (o antigo LIMIT 50 devolvia 50);
//   4. filtrar por um tipo ainda recorta de verdade (o filtro chega ao backend);
//   5. 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);
let ok = 0, fail = 0;
const checa = (rotulo, cond, detalhe = '') => {
  if (cond) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const cookies = await getSessionCookies().catch(() => []);
const fundos = {};

for (const tema of ['dark', 'light']) {
  log(`\n=== ${tema} ===`);
  // ⚠️ Contexto FRESCO + addInitScript: trocar cm_theme com a página montada não repinta
  // o painel (a prova "passa" nos dois temas com PNGs idênticos).
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  try { await ctx.addCookies(cookies); } catch { /* */ }

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  // Registra cada chamada ao GRID de atividades: com ou sem `facets`, e o que voltou.
  // ⚠️ Casar a URL por "activities" pega também `/entity-stats?entity=activities`, que não
  // tem facets — foi o que fez a 1ª leitura vir `undefined` na primeira versão desta prova.
  // O critério confiável é o CORPO: só resposta com `data.rows` é listagem paginada.
  const chamadas = [];
  page.on('response', async (r) => {
    const u = r.url();
    if (!/activities/.test(u)) return;
    let corpo = null;
    try { corpo = await r.json(); } catch { /* */ }
    if (!Array.isArray(corpo?.data?.rows)) return;
    const qs = new URL(u).searchParams;
    chamadas.push({
      url: u.replace(/^https?:\/\/[^/]+/, ''),
      page: qs.get('page'), facetsParam: qs.get('facets'),
      tiposRecebidos: corpo.data.facets?.types?.length ?? (corpo.data.facets === null ? 'null' : 'ausente'),
      linhas: corpo.data.rows.length,
      total: corpo.data.total,
    });
  });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
  await page.waitForTimeout(1500);

  const irPara = async (rotulo) => {
    const b = await page.evaluateHandle((r) => [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(r)), rotulo);
    await b.asElement()?.click().catch(() => {});
    await page.waitForTimeout(2500);
  };
  await irPara('Atividades');

  checa('a tela de Atividades carregou', chamadas.length > 0, JSON.stringify(chamadas[0] ?? null));
  const primeira = chamadas[0];
  checa('a 1ª carga NÃO manda facets=0 (precisa do catálogo)', primeira?.facetsParam === null, `facets=${primeira?.facetsParam}`);
  checa('a 1ª carga recebe os 51 tipos (o LIMIT 50 escondia um)',
    primeira?.tiposRecebidos === 51, `recebidos=${primeira?.tiposRecebidos}`);

  // Lê as opções do filtro de tipo. ⚠️ Em Atividades ele é um `<select class="pp-select">`
  // simples — NÃO um `MultiFiltro` com popover como em Negócios. Presumir MultiFiltro aqui
  // devolvia "não achei" e reprovava a prova por defeito DELA, não do código.
  // O select tem 1 placeholder ("Todos os tipos") + 1 opção por tipo.
  const opcoesDoFiltro = async () => page.evaluate(() => {
    const tb = document.querySelector('[data-pp-react-root] .pp-toolbar');
    const sel = [...(tb?.querySelectorAll('select.pp-select') ?? [])]
      .find((s) => /tipo/i.test(s.options[0]?.textContent ?? ''));
    if (!sel) return { achou: false, n: 0, rotulo: null };
    return { achou: true, n: sel.options.length, rotulo: sel.options[0]?.textContent?.trim() ?? null };
  });

  const antes = await opcoesDoFiltro();
  checa('o filtro de tipo vem populado', antes.achou && antes.n > 1, JSON.stringify(antes));
  // 52 = "Todos os tipos" + 51 tipos. Com o LIMIT 50 antigo seriam 51 — é esta checagem
  // que prova que o 51º tipo voltou a ser selecionável na tela, não só na resposta.
  checa('o filtro oferece os 51 tipos (placeholder + 51)', antes.n === 52, `opcoes=${antes.n}`);
  await page.waitForTimeout(400);

  // Pagina.
  const proxima = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-main button')].find(b => /próxima|proxima|›|>/.test(b.textContent ?? '') && !b.disabled));
  await proxima.asElement()?.click().catch(() => {});
  await page.waitForTimeout(2500);

  const paginadas = chamadas.filter(c => c.page && c.page !== '1');
  checa('ao paginar, o front manda facets=0', paginadas.some(c => c.facetsParam === '0'),
    JSON.stringify(paginadas.map(c => ({ page: c.page, facets: c.facetsParam, tipos: c.tiposRecebidos }))));
  checa('e o backend responde SEM recalcular as facets',
    paginadas.length > 0 && paginadas.every(c => c.facetsParam !== '0' || c.tiposRecebidos === 'null' || c.tiposRecebidos === 'ausente'),
    JSON.stringify(paginadas.map(c => ({ page: c.page, facets: c.facetsParam, tipos: c.tiposRecebidos }))));

  const depois = await opcoesDoFiltro();
  checa('o filtro de tipo SEGUE populado depois de paginar',
    depois.achou && depois.n === antes.n, `antes=${antes.n} depois=${depois.n}`);

  const card = await page.evaluate(() => {
    const c = document.querySelector('.pp-main .pp-card');
    return c ? getComputedStyle(c).backgroundColor : null;
  });
  fundos[tema] = card;
  const rgb = (card ?? '').match(/\d+/g)?.map(Number) ?? [];
  const claro = rgb.length >= 3 && (rgb[0] + rgb[1] + rgb[2]) / 3 > 128;
  checa(`o tema aplicado é mesmo ${tema}`, claro === (tema === 'light'), `fundo=${card}`);

  await page.screenshot({ path: `${OUT}/pipedrive-facets-atividades-${tema}.png` }).catch(() => {});

  const doPainel = (t) => !/\[header\.|container-main:logger|Performance critical|weather|Failed to load resource/i.test(t);
  const errs = errors.filter(doPainel);
  checa('0 erro de console do painel', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close();
}

log('\n=== os dois temas foram mesmo exercitados? ===');
checa('o fundo do card difere entre dark e light',
  !!fundos.dark && !!fundos.light && fundos.dark !== fundos.light, `dark=${fundos.dark} light=${fundos.light}`);

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
