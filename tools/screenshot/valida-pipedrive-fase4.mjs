// Valida a FASE 4 do Pipedrive (visuais gerenciais), dark + light:
//  1. Visão Geral em grade de 12 colunas, com big-numbers (variação + sparkline)
//     e gráficos ECharts renderando canvas de verdade (não cartão vazio).
//  2. Seletor de período (7/30/90/180) refazendo GET /summary com o days certo.
//  3. Drill-down: clique num big-number leva a Negócios JÁ filtrado (hash + chip).
//  4. Funis: chips de funil, funil visual, tabela de etapas com gargalo destacado.
//  5. Alertas: painel de risco, rosca de severidade, alternador dono/funil/etapa,
//     filtros rápidos recortando a lista.
//  6. Zero erro de console vindo do painel, nos dois temas.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/14c7a297-852d-4236-a877-cb8c020f1514/scratchpad/fase4-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };

// Ruído PRÉ-EXISTENTE do app-shell, não do painel. O filtro casa pela ETIQUETA DE MÓDULO
// que o logger do shell imprime — nenhuma delas pode ser emitida pelo painel React, que
// só existe dentro de [data-pp-react-root] e não usa esse logger:
//   • `header.*`            → menu de usuário e ícones sociais (wechat/insta/whatsapp);
//   • `container-main:*`    → bootstrap do shell ("Performance critical").
// Provado: carregando a página SEM abrir o Pipedrive, o mesmo erro aparece.
// ⚠️ Filtrar por etiqueta, não por frase solta: um "Fetch failed" do painel tem de FALHAR
// a prova. Alguns destes são intermitentes (fetchCurrentUser), daí o casamento por módulo.
// "Failed to load resource: ... 4xx" é anônimo no console (não diz a URL). Em vez de
// aceitá-lo às cegas, ele é ignorado AQUI e cobrado pelo `respostasRuins`, que carrega a
// URL: qualquer 4xx/5xx em /api/pipedrive/ reprova a prova. Caçado nesta bateria:
// `403 POST /api/telemetry/collect.php` — telemetria do shell, intermitente, dono é o shell.
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* faz login pela página */ }
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* ignora */ } }, tema);

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && doPainel(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (doPainel(e.message)) errors.push('PAGEERROR: ' + e.message); });
  // "Failed to load resource: ... 403" no console NÃO diz QUAL recurso. Registramos a URL
  // de toda resposta >= 400 para o erro ser diagnosticável em vez de virar ruído aceito.
  const respostasRuins = [];
  page.on('response', (r) => {
    if (r.status() >= 400) respostasRuins.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  const chamadas = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/api/pipedrive/summary')) chamadas.push('summary?' + (u.split('summary?')[1] ?? ''));
    if (u.includes('/api/pipedrive/funnel')) chamadas.push('funnel');
    if (u.includes('/api/pipedrive/alerts')) chamadas.push('alerts');
  });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
  await page.waitForTimeout(3500); // ECharts é chunk assíncrono: dá tempo de baixar e desenhar

  const irPara = async (label, ms = 3200) => {
    await page.evaluate((l) => {
      const b = [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes(l));
      b?.click();
    }, label);
    await page.waitForTimeout(ms);
  };

  // Canvas "vivo" = tem pixel não transparente. Um ECharts que falhou fica 100% vazio.
  const canvasVivos = () => page.evaluate(() => {
    const cs = [...document.querySelectorAll('[data-pp-react-root] .pp-cc-body canvas')];
    return cs.filter((c) => {
      try {
        const ctx = c.getContext('2d');
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) return true;
        return false;
      } catch { return false; }
    }).length;
  });

  // ── 1. Visão Geral ────────────────────────────────────────────────
  await irPara('Visão Geral');
  R[tema].visaoGeral = await page.evaluate(() => ({
    grades: document.querySelectorAll('[data-pp-react-root] .pp-g12').length,
    bigNumbers: document.querySelectorAll('[data-pp-react-root] .pp-bn').length,
    comVariacao: document.querySelectorAll('[data-pp-react-root] .pp-delta').length,
    comSparkline: document.querySelectorAll('[data-pp-react-root] .pp-bn-spark path').length,
    cartoesGrafico: document.querySelectorAll('[data-pp-react-root] .pp-cc').length,
    clicaveis: document.querySelectorAll('[data-pp-react-root] button.pp-bn').length,
    // A grade tem de ocupar a largura toda (critério §12): mais larga que o antigo 640px.
    larguraGrade: Math.round(document.querySelector('[data-pp-react-root] .pp-g12')?.getBoundingClientRect().width ?? 0),
  }));
  R[tema].visaoGeral.canvasVivos = await canvasVivos();
  await page.screenshot({ path: `${OUT}/${tema}-01-visao-geral.jpg`, quality: 82, type: 'jpeg', fullPage: true });

  // ── 2. Seletor de período refaz a consulta ────────────────────────
  const antes = chamadas.filter((c) => c.startsWith('summary')).length;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.pp-pagehead-r .pp-seg-b')].find((x) => x.textContent.trim() === '90 d');
    b?.click();
  });
  await page.waitForTimeout(2200);
  R[tema].periodo = {
    novasChamadas: chamadas.filter((c) => c.startsWith('summary')).length - antes,
    pediu90: chamadas.some((c) => c.includes('days=90')),
    ativo: await page.evaluate(() => document.querySelector('.pp-pagehead-r .pp-seg-b.is-active')?.textContent.trim()),
  };

  // ── 3. Drill-down para Negócios ───────────────────────────────────
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button.pp-bn')].find((x) => x.textContent.includes('Negócios ganhos'));
    b?.click();
  });
  await page.waitForTimeout(3000);
  R[tema].drill = await page.evaluate(() => ({
    hash: window.location.hash,
    chips: [...document.querySelectorAll('[data-pp-react-root] .pp-fchip')].map((c) => c.textContent.trim()),
    linhas: document.querySelectorAll('[data-pp-react-root] .pp-table tbody tr').length,
    // Se o filtro pegou, a coluna Status só mostra "Ganho".
    statusUnicos: [...new Set([...document.querySelectorAll('[data-pp-react-root] .pp-table tbody tr .pp-badge')].map((b) => b.textContent.trim()))],
  }));
  await page.screenshot({ path: `${OUT}/${tema}-02-drilldown.jpg`, quality: 82, type: 'jpeg' });

  // ── 4. Funis ──────────────────────────────────────────────────────
  await irPara('Funis');
  R[tema].funis = await page.evaluate(() => ({
    chips: document.querySelectorAll('[data-pp-react-root] .pp-quick-b').length,
    cartoesGrafico: document.querySelectorAll('[data-pp-react-root] .pp-cc').length,
    etapas: document.querySelectorAll('[data-pp-react-root] .pp-etapa:not(.cab)').length,
    gargalos: document.querySelectorAll('[data-pp-react-root] .pp-etapa.is-gargalo').length,
    temNotaMetodologia: [...document.querySelectorAll('[data-pp-react-root] .pp-cc-rodape')]
      .some((p) => /estimativa|alcance/i.test(p.textContent)),
    conversoes: [...document.querySelectorAll('[data-pp-react-root] .pp-etapa:not(.cab) .num')]
      .map((n) => n.textContent.trim()).filter((t) => t.endsWith('%')).length,
  }));
  R[tema].funis.canvasVivos = await canvasVivos();
  await page.screenshot({ path: `${OUT}/${tema}-03-funis.jpg`, quality: 82, type: 'jpeg', fullPage: true });

  // ── 5. Alertas ────────────────────────────────────────────────────
  await irPara('Alertas');
  const antesFiltro = await page.evaluate(() => document.querySelectorAll('[data-pp-react-root] .pp-alert').length);
  R[tema].alertas = await page.evaluate(() => ({
    bigNumbers: document.querySelectorAll('[data-pp-react-root] .pp-bn').length,
    afetados: document.querySelector('[data-pp-react-root] .pp-bn .pp-bn-n')?.textContent.trim(),
    cartoesGrafico: document.querySelectorAll('[data-pp-react-root] .pp-cc').length,
    chips: document.querySelectorAll('[data-pp-react-root] .pp-quick-b').length,
    regras: document.querySelectorAll('[data-pp-react-root] .pp-alert').length,
  }));
  R[tema].alertas.canvasVivos = await canvasVivos();

  // Filtro rápido "Alta" tem de recortar a lista
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.pp-quick-b')].find((x) => x.textContent.trim().startsWith('Alta'));
    b?.click();
  });
  await page.waitForTimeout(900);
  R[tema].alertas.aposFiltroAlta = await page.evaluate(() => document.querySelectorAll('[data-pp-react-root] .pp-alert').length);
  R[tema].alertas.antesFiltro = antesFiltro;

  // Alternador de agrupamento (dono → etapa) não pode quebrar o gráfico
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.pp-cc-tools .pp-seg-b')].find((x) => x.textContent.trim() === 'Etapa');
    b?.click();
  });
  await page.waitForTimeout(1400);
  R[tema].alertas.canvasAposTrocaAgrupamento = await canvasVivos();
  await page.screenshot({ path: `${OUT}/${tema}-04-alertas.jpg`, quality: 82, type: 'jpeg', fullPage: true });

  R[tema].erros = errors;
  R[tema].respostasRuins = respostasRuins;
  R[tema].chamadas = [...new Set(chamadas)];
  await browser.close();
}

await rodar('dark');
await rodar('light');

log('\n===== FASE 4 — resultado =====');
log(JSON.stringify(R, null, 2));

const falhas = [];
for (const t of ['dark', 'light']) {
  const r = R[t];
  if (r.erros.length) falhas.push(`${t}: ${r.erros.length} erro(s) de console`);
  // Só falha por HTTP ruim se for do BACKEND DO PAINEL — 4xx/5xx do shell é outro dono.
  const ruinsDoPainel = r.respostasRuins.filter((x) => x.includes('/api/pipedrive/'));
  if (ruinsDoPainel.length) falhas.push(`${t}: HTTP ruim no /api/pipedrive → ${ruinsDoPainel.join(' | ')}`);
  if (r.visaoGeral.grades < 3) falhas.push(`${t}: Visão Geral sem grade de 12 col`);
  if (r.visaoGeral.bigNumbers < 8) falhas.push(`${t}: menos de 8 big-numbers`);
  if (r.visaoGeral.comVariacao < 4) falhas.push(`${t}: poucos chips de variação`);
  if (r.visaoGeral.comSparkline < 2) falhas.push(`${t}: sparklines não desenharam`);
  if (r.visaoGeral.canvasVivos < 4) falhas.push(`${t}: só ${r.visaoGeral.canvasVivos} gráfico(s) vivo(s) na Visão Geral`);
  if (r.visaoGeral.larguraGrade < 900) falhas.push(`${t}: grade estreita (${r.visaoGeral.larguraGrade}px)`);
  if (!r.periodo.pediu90 || r.periodo.novasChamadas < 1) falhas.push(`${t}: seletor de período não refez /summary`);
  if (!r.drill.hash.includes('status=won')) falhas.push(`${t}: drill-down não levou o filtro no hash`);
  if (r.drill.statusUnicos.length && r.drill.statusUnicos.some((s) => s !== 'Ganho')) falhas.push(`${t}: drill-down não filtrou o grid (${r.drill.statusUnicos})`);
  if (r.funis.etapas < 3) falhas.push(`${t}: Funis sem tabela de etapas`);
  if (r.funis.gargalos < 1) falhas.push(`${t}: gargalo não destacado`);
  if (!r.funis.temNotaMetodologia) falhas.push(`${t}: falta a nota de metodologia nos Funis`);
  if (r.funis.canvasVivos < 3) falhas.push(`${t}: gráficos dos Funis não desenharam`);
  if (r.alertas.bigNumbers < 4) falhas.push(`${t}: painel de risco incompleto`);
  if (r.alertas.canvasVivos < 2) falhas.push(`${t}: gráficos de Alertas não desenharam`);
  if (!(r.alertas.aposFiltroAlta < r.alertas.antesFiltro)) falhas.push(`${t}: filtro rápido não recortou a lista`);
  if (r.alertas.canvasAposTrocaAgrupamento < 2) falhas.push(`${t}: gráfico morreu ao trocar o agrupamento`);
}

log(falhas.length ? `\n❌ FALHAS (${falhas.length}):\n - ` + falhas.join('\n - ') : '\n✅ TODAS AS VERIFICAÇÕES PASSARAM');
process.exit(falhas.length ? 1 : 0);
