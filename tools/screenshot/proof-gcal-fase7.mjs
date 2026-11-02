// Prova a Fase 7: relatórios (§64) e visualizações D3 (§40, §65).
// Cada bloco assere COMPORTAMENTO, não presença de elemento.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/8c88ec85-e267-42fe-b900-d339ee8df790/scratchpad';
const log = (...a) => console.log(...a);
const r = {};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true,
  acceptDownloads: true,
});
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn]', e.message); }
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e).slice(0, 180)));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(3000);
await page.evaluate(() => { location.hash = '#/panel-google-calendar/relatorios'; });
await page.waitForSelector('[data-gc-react-root] .gc-rel-layout', { timeout: 25000 });
await page.waitForTimeout(2500);

/* ── 1. Catálogo e navegação entre relatórios ──────────────────────── */
log('\n[1] Catálogo de relatórios:');
{
  // O catálogo vem do backend; contar antes de ele chegar mede o menu vazio.
  await page.waitForFunction(() => document.querySelectorAll('.gc-rel-item').length >= 13,
    undefined, { timeout: 15000 }).catch(() => {});
  const itens = await page.locator('.gc-rel-item').count();
  const grupos = await page.locator('.gc-rel-grupo h4').allInnerTexts();
  log(`  relatórios no menu: ${itens} · grupos: ${grupos.join(', ')}`);
  // text-transform:uppercase faz allInnerTexts devolver em maiúsculas.
  r.catalogo = itens >= 13 && grupos.some((g) => g.toLowerCase().includes('visualiza'));
}

/* ── 2. Cada relatório renderiza tabela COM dado ───────────────────── */
log('\n[2] Renderização de cada relatório:');
{
  const tipos = ['eventos', 'carga-dia', 'horarios', 'duracao', 'participantes',
                 'convites', 'clientes', 'calendarios', 'recursos', 'conflitos', 'cancelamentos'];
  const falhas = [];
  for (const t of tipos) {
    await page.evaluate((x) => { location.hash = `#/panel-google-calendar/relatorios`; void x; }, t);
    // Clica no item do menu pelo texto do relatório (navegação real do usuário).
    const alvo = page.locator('.gc-rel-item').filter({ hasText: rotulo(t) }).first();
    if (await alvo.count()) await alvo.click();
    await page.waitForTimeout(1500);
    const linhas = await page.locator('.gc-rel-tabela tbody tr').count();
    const temTotal = await page.locator('.gc-rel-tabela tfoot').count();
    const vazio = await page.locator('.gc-estado-vazio').count();
    const ok = linhas > 0 && temTotal > 0;
    log(`  ${ok ? '✓' : '✗'} ${t.padEnd(14)} ${linhas} linha(s)${vazio ? ' (vazio)' : ''}`);
    if (!ok) falhas.push(t);
  }
  r.relatorios = falhas.length === 0;
  r.relatoriosFalhando = falhas;
}
function rotulo(t) {
  return ({
    eventos: 'Eventos', 'carga-dia': 'Carga por dia', horarios: 'Distribuição por hora',
    duracao: 'Duração das reuniões', participantes: 'Participantes', convites: 'Convites',
    clientes: 'Clientes e negócios', calendarios: 'Calendários', recursos: 'Recursos e salas',
    conflitos: 'Conflitos', cancelamentos: 'Cancelamentos',
  })[t] ?? t;
}

/* ── 3. Ordenação por coluna ───────────────────────────────────────── */
log('\n[3] Ordenação da tabela:');
{
  await page.locator('.gc-rel-item').filter({ hasText: 'Participantes' }).first().click();
  await page.waitForTimeout(1600);
  const col = page.locator('.gc-rel-tabela thead th').filter({ hasText: 'Reuniões' }).first();
  const antes = await page.locator('.gc-rel-tabela tbody tr td:first-child').first().innerText();
  await col.click();                            // desc
  await page.waitForTimeout(500);
  const desc = await page.locator('.gc-rel-tabela tbody tr td:first-child').first().innerText();
  await col.click();                            // asc
  await page.waitForTimeout(500);
  const asc = await page.locator('.gc-rel-tabela tbody tr td:first-child').first().innerText();
  const aria = await col.getAttribute('aria-sort');
  log(`  1ª linha: inicial="${antes}" desc="${desc}" asc="${asc}" · aria-sort=${aria}`);
  r.ordenacao = desc !== asc && (aria === 'ascending' || aria === 'descending');
}

/* ── 4. Totalizadores batem com a soma das linhas ──────────────────── */
log('\n[4] Totalizadores:');
{
  await page.locator('.gc-rel-item').filter({ hasText: 'Carga por dia' }).first().click();
  await page.waitForTimeout(1600);
  const conf = await page.evaluate(() => {
    const tab = document.querySelector('.gc-rel-tabela');
    if (!tab) return null;
    const idxReunioes = [...tab.querySelectorAll('thead th')]
      .findIndex((th) => th.textContent.trim().startsWith('Reuniões'));
    if (idxReunioes < 0) return null;
    const soma = [...tab.querySelectorAll('tbody tr')]
      .reduce((s, tr) => s + (Number(tr.children[idxReunioes]?.textContent.replace(/\D/g, '')) || 0), 0);
    const rodape = Number(tab.querySelector('tfoot')?.children[0]?.children[idxReunioes]
      ?.textContent.replace(/\D/g, '')) || 0;
    return { soma, rodape };
  });
  log(`  soma das linhas: ${conf?.soma} · rodapé: ${conf?.rodape}`);
  r.totalizadores = !!conf && conf.soma === conf.rodape && conf.soma > 0;
}

/* ── 5. Exportação CSV (download real) ─────────────────────────────── */
log('\n[5] Exportar CSV:');
{
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
    page.getByRole('button', { name: /Exportar CSV/i }).click(),
  ]);
  if (download) {
    const caminho = `${OUT}/relatorio.csv`;
    await download.saveAs(caminho);
    const fs = await import('node:fs');
    const bruto = fs.readFileSync(caminho);
    const texto = bruto.toString('utf8');
    const temBom = bruto[0] === 0xEF && bruto[1] === 0xBB && bruto[2] === 0xBF;
    const linhas = texto.trim().split(/\r\n/);
    const temPontoVirgula = (linhas[6] ?? '').includes(';');
    const temTotal = texto.includes('TOTAL');
    const acentoOk = texto.includes('Reuniões') || texto.includes('Duração');
    log(`  arquivo: ${download.suggestedFilename()}`);
    log(`  BOM UTF-8: ${temBom} · separador ";": ${temPontoVirgula} · linha TOTAL: ${temTotal} · acentos: ${acentoOk} · ${linhas.length} linhas`);
    r.csv = temBom && temPontoVirgula && temTotal && acentoOk;
  } else { log('  ✗ download não ocorreu'); r.csv = false; }
}

/* ── 6. Sankey (§40) ───────────────────────────────────────────────── */
log('\n[6] Fluxo de reuniões (Sankey):');
{
  await page.locator('.gc-rel-item').filter({ hasText: 'Fluxo de reuniões' }).first().click();
  await page.waitForTimeout(2500);
  const nos = await page.locator('.gc-fluxo-no').count();
  const fitas = await page.locator('.gc-fluxo-fita').count();
  const rotulos = await page.locator('.gc-fluxo-rot').allInnerTexts();
  const tabela = await page.locator('.gc-fluxo .gc-tabela-alt').count();
  log(`  nós: ${nos} · fitas: ${fitas} · rótulos: ${rotulos.slice(0, 5).join(', ')}…`);
  r.sankey = nos >= 5 && fitas >= 4 && tabela > 0;
  if (nos) await page.screenshot({ path: `${OUT}/f7-sankey.png` });
}

/* ── 7. Rede (§65) com seleção ─────────────────────────────────────── */
log('\n[7] Rede de coparticipação:');
{
  await page.locator('.gc-rel-item').filter({ hasText: 'Rede de coparticipação' }).first().click();
  await page.waitForTimeout(3500);              // força precisa estabilizar
  const nos = await page.locator('.gc-rede-no').count();
  const arestas = await page.locator('.gc-rede-aresta').count();
  const posicionados = await page.evaluate(() =>
    [...document.querySelectorAll('.gc-rede-no')]
      .filter((c) => Number(c.getAttribute('cx')) > 0).length);
  log(`  nós: ${nos} · arestas: ${arestas} · com posição calculada: ${posicionados}`);

  let selOk = false;
  if (nos > 0) {
    await page.locator('.gc-rede-no').first().click();
    await page.waitForTimeout(700);
    const sel = await page.locator('.gc-rede-no.is-sel').count();
    const apagados = await page.locator('.gc-rede-aresta.is-apagada').count();
    selOk = sel === 1;
    log(`  após clicar → selecionado: ${sel} · arestas atenuadas: ${apagados}`);
    await page.screenshot({ path: `${OUT}/f7-rede.png` });
  }
  r.rede = nos >= 3 && arestas >= 2 && posicionados === nos && selOk;
}

/* ── 8. Dado insuficiente é declarado, não desenhado ───────────────── */
log('\n[8] Período curto → visualização se recusa a desenhar:');
{
  await page.locator('.gc-chip').filter({ hasText: '7 dias' }).first().click();
  await page.waitForTimeout(2500);
  const vazio = await page.locator('.gc-estado-vazio').count();
  const svg = await page.locator('.gc-rede-svg').count();
  const msg = vazio ? (await page.locator('.gc-estado-msg').first().innerText()).slice(0, 70) : '';
  log(`  estado vazio: ${vazio > 0} · svg desenhado: ${svg > 0} · "${msg}"`);
  // Aceita os dois: com 7 dias pode haver dado bastante. O que NÃO pode é
  // desenhar um grafo vazio sem dizer nada.
  r.dadoInsuficiente = (vazio > 0 && svg === 0) || (svg > 0 && vazio === 0);
  await page.locator('.gc-chip').filter({ hasText: '28 dias' }).first().click();
  await page.waitForTimeout(1500);
}

/* ── 9. Impressão esconde o cromo ──────────────────────────────────── */
log('\n[9] CSS de impressão:');
{
  await page.locator('.gc-rel-item').filter({ hasText: 'Carga por dia' }).first().click();
  await page.waitForTimeout(1600);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.documentElement.classList.add('gc-imprimindo'));
  await page.waitForTimeout(600);
  const d = await page.evaluate(() => {
    const menu = document.querySelector('.gc-rel-menu');
    const tabela = document.querySelector('.gc-rel-tabela');
    const raiz = document.querySelector('[data-gc-react-root]');
    return {
      menuOculto: menu ? getComputedStyle(menu).display === 'none' : null,
      tabelaVisivel: tabela ? getComputedStyle(tabela).visibility === 'visible' : null,
      fundoBranco: raiz ? getComputedStyle(raiz).getPropertyValue('--gc-surface').trim() : null,
      theadRepete: tabela ? getComputedStyle(tabela.querySelector('thead')).display : null,
    };
  });
  log(`  menu oculto: ${d.menuOculto} · tabela visível: ${d.tabelaVisivel} · surface: ${d.fundoBranco} · thead: ${d.theadRepete}`);
  await page.screenshot({ path: `${OUT}/f7-impressao.png` });
  r.impressao = d.menuOculto === true && d.tabelaVisivel === true
             && (d.fundoBranco === '#fff' || d.fundoBranco === '#ffffff') && d.theadRepete === 'table-header-group';
  await page.evaluate(() => document.documentElement.classList.remove('gc-imprimindo'));
  await page.emulateMedia({ media: 'screen' });
}

log('\n=== RESUMO FASE 7 ===');
log(JSON.stringify({ ...r, errosPagina: erros.slice(0, 5) }, null, 2));
const falhas = Object.entries(r).filter(([, v]) => v === false).map(([k]) => k);
log(falhas.length ? `FALHAS: ${falhas.join(', ')}` : 'TODOS OS CHECKS PASSARAM');
await browser.close();
