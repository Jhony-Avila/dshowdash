// READ-ONLY (exceto no MOCK, que é por sessão): prova a Fase 3 do Google Calendar
// com interação REAL — arrastar, redimensionar, selecionar faixa, atalhos,
// heatmap com cross-filter, popover do header e widget da home.
//
// Cada bloco tem uma asserção que só passa se a coisa funcionou de fato: contar
// que o elemento existe não prova que ele faz algo.
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
});
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn]', e.message); }
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e).slice(0, 180)));

async function ir(rota) {
  await page.evaluate((x) => { location.hash = `#/panel-google-calendar/${x}`; }, rota);
  await page.waitForSelector('[data-gc-react-root] .gc-layout', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1800);
}

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(3000);

/* ── 1. Popover do header (§9) ─────────────────────────────────────── */
log('\n[1] Popover do ícone do header (hover):');
{
  const btn = page.locator('[data-panel-trigger="panel-calendar"]').first();
  await btn.hover();
  await page.waitForTimeout(1400);
  const abriu = await page.locator('.gcal-pop').count();
  const temItens = await page.locator('.gcal-pop-item, .gcal-pop-vazio').count();
  const estado = await btn.getAttribute('data-gcal-estado');
  const badge = await page.locator('[data-panel-trigger="panel-calendar"] .gcal-badge').count();
  log(`  popover abriu: ${abriu > 0} · linhas: ${temItens} · estado do ícone: ${estado} · badge: ${badge}`);
  if (abriu) await page.screenshot({ path: `${OUT}/f3-header-popover.png`, clip: { x: 900, y: 0, width: 700, height: 340 } });
  r.headerPopover = abriu > 0 && !!estado;
  // Fecha para não atrapalhar os próximos passos.
  await page.mouse.move(400, 600);
  await page.waitForTimeout(500);
}

/* ── 2. Arrastar um evento (§60) ───────────────────────────────────── */
log('\n[2] Arrastar evento na agenda (drag real + persistência):');
await ir('agenda');
{
  // Semana é a visão com faixa horária: dá para arrastar na vertical.
  const ev = page.locator('.gc-fc-wrap .fc-timegrid-event.gc-ev-editavel').first();
  const n = await page.locator('.gc-fc-wrap .fc-timegrid-event').count();
  const editaveis = await page.locator('.gc-fc-wrap .gc-ev-editavel').count();
  const travados = await page.locator('.gc-fc-wrap .gc-ev-travado').count();
  log(`  eventos na grade: ${n} · arrastáveis: ${editaveis} · travados: ${travados}`);
  r.travadosExistem = travados > 0;   // §30: nem tudo pode ser arrastado

  if (await ev.count()) {
    const antes = await ev.getAttribute('data-gc-probe').catch(() => null);
    void antes;
    const cx = await ev.boundingBox();
    const titulo = (await ev.innerText()).slice(0, 40).replace(/\n/g, ' ');
    await page.mouse.move(cx.x + cx.width / 2, cx.y + 6);
    await page.mouse.down();
    await page.mouse.move(cx.x + cx.width / 2, cx.y + 90, { steps: 14 });
    await page.mouse.up();
    await page.waitForTimeout(2600);

    const toastOk = await page.locator('.gc-toast-ok, .gc-toast-salvando').count();
    const toastErro = await page.locator('.gc-toast-erro').count();
    const depois = await ev.boundingBox().catch(() => null);
    const moveu = depois ? Math.abs(depois.y - cx.y) > 20 : false;
    log(`  "${titulo}" · moveu: ${moveu} · toast ok/salvando: ${toastOk} · toast erro: ${toastErro}`);
    r.arrastar = moveu && toastErro === 0;
    await page.screenshot({ path: `${OUT}/f3-drag.png` });
  } else {
    log('  ✗ nenhum evento arrastável encontrado');
    r.arrastar = false;
  }
}

/* ── 3. Selecionar faixa vazia → criação rápida (§18) ──────────────── */
log('\n[3] Selecionar faixa vazia abre a criação rápida:');
{
  await page.waitForTimeout(1200);
  // Coluna de sábado costuma estar vazia; puxamos uma faixa de ~1h.
  const grade = await page.locator('.gc-fc-wrap .fc-timegrid-slots').boundingBox();
  if (grade) {
    const x = grade.x + grade.width * 0.9;
    const y = grade.y + grade.height * 0.45;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 55, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1200);
    const pop = await page.locator('.gc-criacao').count();
    log(`  popover de criação: ${pop > 0}`);
    r.criacaoRapida = pop > 0;
    if (pop) {
      await page.screenshot({ path: `${OUT}/f3-criacao-rapida.png` });
      // Cria de verdade e confere o toast + o evento na grade.
      await page.locator('.gc-criacao-titulo').fill('Teste Fase 3');
      await page.locator('.gc-criacao button[type="submit"]').click();
      await page.waitForTimeout(2600);
      const criou = await page.locator('.gc-toast-ok').count();
      const naGrade = await page.getByText('Teste Fase 3').count();
      log(`  criou (toast): ${criou > 0} · aparece na grade: ${naGrade > 0}`);
      r.criouEvento = criou > 0 || naGrade > 0;
    }
  } else { log('  ✗ grade não encontrada'); r.criacaoRapida = false; }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

/* ── 4. Atalhos de teclado (§80) ───────────────────────────────────── */
log('\n[4] Atalhos de teclado:');
{
  await page.mouse.click(700, 400);      // tira o foco de qualquer campo
  await page.keyboard.press('t');
  await page.waitForTimeout(1200);
  const emHoje = await page.locator('.gc-tela-hoje').count();

  await page.keyboard.press('x');
  await page.waitForTimeout(1200);
  const emConflitos = (await page.evaluate(() => location.hash)).includes('conflitos');

  await page.keyboard.press('/');
  await page.waitForTimeout(500);
  const buscaFocada = await page.evaluate(() =>
    document.activeElement?.getAttribute('type') === 'search');

  // A guarda que importa: digitar "t" num campo NÃO pode navegar.
  await page.keyboard.type('teste');
  await page.waitForTimeout(900);
  const naoNavegou = (await page.evaluate(() => location.hash)).includes('conflitos');

  log(`  T→Hoje: ${emHoje > 0} · X→Conflitos: ${emConflitos} · /→busca: ${buscaFocada} · digitar não navega: ${naoNavegou}`);
  r.atalhos = emHoje > 0 && emConflitos && buscaFocada && naoNavegou;
  await page.keyboard.press('Escape');
}

/* ── 5. Heatmap D3 + cross-filter (§39, §67, §68) ──────────────────── */
log('\n[5] Heatmap D3 com cross-filter e drill-down:');
await ir('carga');
{
  const celulas = await page.locator('.gc-heat-cel').count();
  const comCor = await page.locator('.gc-heat-cel:not(.is-vazio)').count();
  log(`  células: ${celulas} · com ocupação: ${comCor}`);

  let drill = 0;
  if (comCor > 0) {
    await page.locator('.gc-heat-cel:not(.is-vazio)').first().click();
    await page.waitForTimeout(1200);
    drill = await page.locator('.gc-lista-simples .gc-lev').count();
    const selecionada = await page.locator('.gc-heat-cel.is-sel').count();
    log(`  após clicar → selecionada: ${selecionada > 0} · eventos no drill-down: ${drill}`);
    r.heatmap = celulas > 0 && comCor > 0 && selecionada > 0;
    r.drilldown = drill > 0;
    await page.screenshot({ path: `${OUT}/f3-heatmap.png` });
    // Limpar seleção volta ao estado sem filtro.
    await page.getByRole('button', { name: /Limpar seleção/i }).first().click();
    await page.waitForTimeout(800);
    r.limparSelecao = (await page.locator('.gc-heat-cel.is-sel').count()) === 0;
  } else { r.heatmap = false; r.drilldown = false; }
}

/* ── 6. Widget da home (§36) ───────────────────────────────────────── */
log('\n[6] Widget de agenda na home:');
{
  // MEDIDO: em '#/' a home monta em modo IMERSIVO (config.home === true) e a
  // faixa de widgets não é renderizada — por design, não por bug. A zona de
  // widgets vive na versão não-imersiva do mesmo painel.
  await page.evaluate(() => { location.hash = '#/panel-dashboard'; });
  await page.waitForTimeout(6000);
  const itens = await page.locator('.ger-rgl-item').count();
  const naZona = await page.locator('.ger-zona-widgets').getByText('Google Calendar').count();
  log(`  itens no grid: ${itens} · Google Calendar na zona: ${naZona > 0}`);
  r.widgetHome = naZona > 0;
  if (naZona > 0) await page.screenshot({ path: `${OUT}/f3-widget-home.png` });
}

/* ── 7. Mobile (§79) ───────────────────────────────────────────────── */
log('\n[7] Viewport mobile:');
{
  await page.setViewportSize({ width: 390, height: 780 });
  await ir('hoje');
  const semScrollH = await page.evaluate(() => {
    const el = document.querySelector('[data-gc-react-root]');
    return el ? el.scrollWidth <= el.clientWidth + 2 : false;
  });
  const sidebarOculta = await page.evaluate(() => {
    const el = document.querySelector('[data-gc-react-root] .gc-subsidebar');
    return el ? getComputedStyle(el).display === 'none' : false;
  });
  await page.screenshot({ path: `${OUT}/f3-mobile-hoje.png` });

  // Drawer vira folha inferior.
  await page.locator('.gc-timeline .gc-lev').first().click().catch(() => {});
  await page.waitForTimeout(1200);
  const folha = await page.evaluate(() => {
    const d = document.querySelector('[data-gc-react-root] .gc-drawer');
    if (!d) return null;
    const s = getComputedStyle(d);
    return { largura: d.getBoundingClientRect().width, left: s.left };
  });
  const ehFolha = folha ? folha.largura > 340 : false;
  log(`  sem scroll horizontal: ${semScrollH} · sub-sidebar oculta: ${sidebarOculta} · drawer vira folha: ${ehFolha}`);
  if (folha) await page.screenshot({ path: `${OUT}/f3-mobile-drawer.png` });
  r.mobile = semScrollH && sidebarOculta && ehFolha;
  await page.setViewportSize({ width: 1600, height: 1000 });
}

log('\n=== RESUMO FASE 3 ===');
log(JSON.stringify({ ...r, errosPagina: erros.slice(0, 5) }, null, 2));
const falhas = Object.entries(r).filter(([, v]) => v === false).map(([k]) => k);
log(falhas.length ? `FALHAS: ${falhas.join(', ')}` : 'TODOS OS CHECKS PASSARAM');
await browser.close();
