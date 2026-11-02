// READ-ONLY: prova que os 2 pontos de entrada abrem o panel-google-calendar,
// com cliques REAIS (trusted). Molde: proof-ads-entradas.mjs.
//
// CONTROLE obrigatório: o Outlook, que NÃO foi tocado. Se o controle quebrar
// junto, o problema é do ambiente/sessão, não da entrega — sem ele um "não
// montou" não distingue as duas coisas.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true,
});
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

const erros = [];
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => erros.push('pageerror: ' + String(e).slice(0, 200)));

async function montou(tag, ms = 15000) {
  try {
    await page.waitForSelector('[data-gc-react-root] .gc-layout', { timeout: ms });
    log(`  ✓ montou (${tag})`);
    return true;
  } catch { log(`  ✗ NAO montou (${tag})`); return false; }
}
const hash = () => page.evaluate(() => location.hash);
async function goHome() { await page.evaluate(() => { location.hash = '#/'; }); await page.waitForTimeout(1200); }

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);

// CONTROLE: Outlook, intocado nesta entrega.
log('\n[CONTROLE] sidebar Outlook (clique real):');
await goHome();
let okOutlook = false;
try {
  await page.locator('[data-panel-id="panel-outlook"]').first().click({ timeout: 5000 });
  try {
    await page.waitForSelector('[data-ol-react-root]', { timeout: 12000 });
    okOutlook = true; log('  ✓ Outlook montou (controle intacto)');
  } catch { log('  hash:', await hash()); log('  ✗ Outlook nao montou'); }
} catch (e) { log('  erro click Outlook:', e.message); }

// PROOF 1: ícone de calendário do header (a string patchada no bundle).
log('\n[PROOF 1] header icone de calendario (clique real):');
await goHome();
let okHeader = false;
try {
  const n = await page.locator('[data-panel-trigger="panel-calendar"]').count();
  log('  elementos [data-panel-trigger=panel-calendar]:', n);
  await page.locator('[data-panel-trigger="panel-calendar"]').first().click({ timeout: 5000 });
  okHeader = await montou('header');
  log('  hash:', await hash());
} catch (e) { log('  erro click header:', e.message); }

// PROOF 2: botão na sidebar (linha nova em ui_nav_items).
log('\n[PROOF 2] sidebar botao Google Calendar (clique real):');
await goHome();
let okSidebar = false;
try {
  const n = await page.locator('[data-panel-id="panel-google-calendar"]').count();
  log('  elementos [data-panel-id=panel-google-calendar]:', n);
  await page.locator('[data-panel-id="panel-google-calendar"]').first().click({ timeout: 5000 });
  okSidebar = await montou('sidebar');
  log('  hash:', await hash());
} catch (e) { log('  erro click sidebar:', e.message); }

// PROOF 3: as telas realmente trocam e trazem dado (não é casca).
log('\n[PROOF 3] navegacao interna + conteudo:');
const telas = [];
if (okSidebar || okHeader) {
  for (const [rota, seletor, nome] of [
    ['hoje', '.gc-tela-hoje .gc-kpi', 'Hoje'],
    ['agenda', '.gc-fc-wrap .fc', 'Agenda (FullCalendar)'],
    ['proximos', '.gc-grid tbody tr', 'Próximos (grade)'],
    ['convites', '.gc-convites, .gc-estado-vazio', 'Convites'],
    ['disponibilidade', '.gc-matriz td.gc-slot', 'Disponibilidade (matriz)'],
    ['conflitos', '.gc-conflitos li, .gc-estado-vazio', 'Conflitos'],
    ['carga', '.gc-gr svg', 'Carga (ECharts)'],
    ['relatorios', '.gc-rel-tabela tbody tr', 'Relatórios'],
    ['calendarios', '.gc-cal-item', 'Calendários'],
    ['recursos', '.gc-recursos .gc-card', 'Recursos'],
    ['alertas', '.gc-alerta, .gc-estado-vazio', 'Alertas'],
    ['contas', '.gc-conta', 'Contas'],
    ['sincronizacao', '.gc-grid tbody tr', 'Sincronização'],
    ['configuracoes', '.gc-tela-config .gc-card', 'Configurações'],
    ['equipe', '.gc-colunas-equipe .gc-card, .gc-estado-vazio', 'Visão da Equipe'],
  ]) {
    await page.evaluate((r) => { location.hash = `#/panel-google-calendar/${r}`; }, rota);
    await page.waitForTimeout(1400);
    let n = 0;
    try {
      await page.waitForSelector(seletor, { timeout: 9000 });
      n = await page.locator(seletor).count();
    } catch { /* fica 0 */ }
    log(`  ${n > 0 ? '✓' : '✗'} ${nome.padEnd(24)} ${n} elemento(s)`);
    telas.push({ rota, nome, elementos: n, ok: n > 0 });
  }
}

// PROOF 4: a faixa de demonstração está visível (§72 — mock não pode se passar por real).
const faixa = await page.locator('.gc-faixa-mock').count();
log(`\n[PROOF 4] faixa de demonstracao visivel: ${faixa > 0 ? '✓ sim' : '✗ NAO'}`);

log('\n=== RESUMO ===');
const falhas = telas.filter((t) => !t.ok).map((t) => t.rota);
log(JSON.stringify({
  controleOutlook: okOutlook,
  header_panelGoogleCalendar: okHeader,
  sidebar_panelGoogleCalendar: okSidebar,
  telasOk: `${telas.filter((t) => t.ok).length}/${telas.length}`,
  telasFalhando: falhas,
  faixaMock: faixa > 0,
  errosConsole: erros.slice(0, 8),
}, null, 2));
await browser.close();
log('=== FIM ===');
