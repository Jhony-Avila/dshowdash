// Valida os PERÍODOS de calendário da Visão Geral (backlog #3 + fatia do #4).
//
// O risco aqui não é o seletor não trocar. É a COMPARAÇÃO mentir:
//   (a) comparar um mês corrente parcial (01–28) com o mês anterior INTEIRO (01–30)
//       faz o período atual parecer pior só porque ainda não acabou;
//   (b) o chip ▲/▼ significa coisas diferentes em cada modo (janela anterior, mesmo
//       trecho do mês passado, ano a ano) e a tela precisa dizer qual;
//   (c) quando as janelas têm tamanhos diferentes (fevereiro × janeiro), a variação
//       embute dias a menos — e isso tem de estar declarado, não escondido.
//
// Por isso a prova confere as DATAS que o backend devolve, não só se a tela mudou:
//   1. cada período devolve de/até coerentes com a definição (mês = dia 1; ano = 01/01);
//   2. períodos EM CURSO comparam com o MESMO TRECHO do anterior (mesmo nº de dias);
//   3. período encerrado (mes_ant) compara com o anterior completo;
//   4. período inválido cai no padrão (nunca em janela vazia);
//   5. os KPIs realmente mudam entre períodos (o parâmetro chega ao SQL);
//   6. a tela declara o período e a base de comparação, e avisa quando os tamanhos diferem;
//   7. a escolha PERSISTE ao sair e voltar da tela (#4);
//   8. sem estouro em 1600/480 e 0 erro de console do painel.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/1af6a59b-262c-4e47-bb42-c1a4935e1164/scratchpad/f34-shots';
const log = (...a) => console.log(...a);
const R = { dark: {}, light: {} };
const doPainel = (t) => !/\[header\.|\[container-main:|wechat|instagram|whatsapp|favicon|Failed to load resource/i.test(t);

const dias = (de, ate) => Math.round((new Date(ate) - new Date(de)) / 86400000) + 1;

async function irVisaoGeral(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Visão Geral'))?.click();
  });
  await page.waitForTimeout(2800);
}

async function rodar(tema) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* login pela página */ }
  // Começa sempre do padrão para o teste de persistência ser determinístico.
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('cm_theme', t); localStorage.removeItem('pp:periodo'); } catch { /* ignora */ }
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
  await irVisaoGeral(page);

  // ── 1-5. A verdade do backend, período a período ──────────────
  R[tema].api = await page.evaluate(async () => {
    const g = async (p) => {
      const r = await fetch(`/api/pipedrive/summary?periodo=${p}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const j = await r.json();
      const d = j.data;
      return {
        http: r.status,
        ...d.periodo,
        // Assinatura dos KPIs: se o parâmetro não chegasse ao SQL, seria idêntica entre períodos.
        kpis: d.kpis.map((k) => `${k.chave}:${k.valor}`).join('|'),
      };
    };
    const out = {};
    for (const p of ['d7', 'd30', 'd90', 'mes', 'mes_ant', 'trim', 'ano', 'NAO_EXISTE']) out[p] = await g(p);
    return out;
  });

  // ── 6. O que a tela declara ───────────────────────────────────
  const lerNota = () => page.evaluate(() => {
    const n = document.querySelector('[data-pp-react-root] .pp-periodo-nota');
    return {
      texto: n?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      alerta: n?.querySelector('.pp-periodo-alerta')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      ativo: document.querySelector('[data-pp-react-root] .pp-seg-b.is-active')?.textContent.trim() ?? null,
      separadores: document.querySelectorAll('[data-pp-react-root] .pp-seg-sep').length,
      estoura: (() => {
        const m = document.querySelector('[data-pp-react-root] .pp-main');
        return !!m && m.scrollWidth > m.clientWidth + 2;
      })(),
    };
  });

  R[tema].notaPadrao = await lerNota();

  // Clica em "Este mês"
  await page.evaluate(() => {
    [...document.querySelectorAll('[data-pp-react-root] .pp-seg-b')].find((b) => b.textContent.trim() === 'Este mês')?.click();
  });
  await page.waitForTimeout(3000);
  R[tema].notaMes = await lerNota();

  // Clica em "Mês passado" (o que costuma ter tamanhos diferentes)
  await page.evaluate(() => {
    [...document.querySelectorAll('[data-pp-react-root] .pp-seg-b')].find((b) => b.textContent.trim() === 'Mês passado')?.click();
  });
  await page.waitForTimeout(3000);
  R[tema].notaMesAnt = await lerNota();
  await page.screenshot({ path: `${OUT}/visaogeral-periodo-${tema}.png` }).catch(() => {});

  // ── 7. Persistência (#4): sai da tela, volta, e a escolha continua ──
  await page.evaluate(() => {
    [...document.querySelectorAll('.pp-navitem')].find((x) => x.textContent.includes('Kanban'))?.click();
  });
  await page.waitForTimeout(2200);
  await irVisaoGeral(page);
  R[tema].aposVoltar = await lerNota();
  R[tema].guardado = await page.evaluate(() => { try { return localStorage.getItem('pp:periodo'); } catch { return null; } });

  // ── 8. 480px ──────────────────────────────────────────────────
  await page.setViewportSize({ width: 480, height: 950 });
  await page.waitForTimeout(2000);
  R[tema].estreito = await page.evaluate(() => {
    const m = document.querySelector('[data-pp-react-root] .pp-main');
    const n = document.querySelector('[data-pp-react-root] .pp-periodo-nota');
    return {
      mainEstoura: !!m && m.scrollWidth > m.clientWidth + 2,
      docEstoura: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      notaVisivel: !!n && n.getBoundingClientRect().height > 0,
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
  const r = R[tema], a = r.api;

  for (const [p, v] of Object.entries(a)) {
    checa(v.http === 200, `[${tema}] /summary?periodo=${p} → HTTP ${v.http}`);
  }

  // 1. Definição de cada período.
  checa(a.mes.de.endsWith('-01'), `[${tema}] "mes" não começa no dia 1: ${a.mes.de}`);
  checa(a.ano.de.endsWith('-01-01'), `[${tema}] "ano" não começa em 01/01: ${a.ano.de}`);
  checa(a.mes_ant.de.endsWith('-01'), `[${tema}] "mes_ant" não começa no dia 1: ${a.mes_ant.de}`);
  checa(dias(a.d7.de, a.d7.ate) === 7, `[${tema}] d7 tem ${dias(a.d7.de, a.d7.ate)} dias`);
  checa(dias(a.d30.de, a.d30.ate) === 30, `[${tema}] d30 tem ${dias(a.d30.de, a.d30.ate)} dias`);

  // 2. EM CURSO compara com o MESMO TRECHO — este é o coração do #3.
  for (const p of ['mes', 'trim', 'ano']) {
    const v = a[p];
    checa(v.dias_atual === v.dias_anterior,
      `[${tema}] "${p}" em curso comparado com trecho de tamanho diferente: ${v.dias_atual}d × ${v.dias_anterior}d (${v.de}..${v.ate} vs ${v.de_anterior}..${v.ate_anterior})`);
  }
  log(`  mês: ${a.mes.de}..${a.mes.ate} (${a.mes.dias_atual}d) vs ${a.mes.de_anterior}..${a.mes.ate_anterior} (${a.mes.dias_anterior}d)`);
  log(`  ano: ${a.ano.de}..${a.ano.ate} (${a.ano.dias_atual}d) vs ${a.ano.de_anterior}..${a.ano.ate_anterior} (${a.ano.dias_anterior}d)`);

  // 3. Encerrado compara com o anterior COMPLETO (mês cheio contra mês cheio).
  // `new Date('2026-06-30')` é meia-noite UTC; com getDate() (fuso local -03) o dia
  // seguinte volta a cair em 30 e o teste reprovaria uma data correta. getUTCDate()
  // mantém a conta no mesmo fuso em que a string foi lida.
  const ultimoDia = new Date(a.mes_ant.ate);
  const ehFimDeMes = new Date(ultimoDia.getTime() + 86400000).getUTCDate() === 1;
  checa(ehFimDeMes, `[${tema}] "mes_ant" não termina no último dia do mês: ${a.mes_ant.ate}`);
  log(`  mês passado: ${a.mes_ant.de}..${a.mes_ant.ate} (${a.mes_ant.dias_atual}d) vs ${a.mes_ant.de_anterior}..${a.mes_ant.ate_anterior} (${a.mes_ant.dias_anterior}d)`);

  // 4. Inválido cai no padrão.
  checa(a.NAO_EXISTE.id === 'd30' && dias(a.NAO_EXISTE.de, a.NAO_EXISTE.ate) === 30,
    `[${tema}] período inválido não caiu no padrão: id=${a.NAO_EXISTE.id}`);

  // 5. O parâmetro chega ao SQL (KPIs diferentes entre períodos).
  const assinaturas = new Set([a.d7.kpis, a.d30.kpis, a.d90.kpis, a.ano.kpis]);
  checa(assinaturas.size > 1, `[${tema}] KPIs idênticos em todos os períodos — o parâmetro não chegou à consulta`);

  // 6. A tela declara período e base de comparação.
  checa(!!r.notaMes.texto && /variação contra/i.test(r.notaMes.texto),
    `[${tema}] a tela não declara a base de comparação`);
  checa(/mês anterior/i.test(r.notaMes.texto ?? ''),
    `[${tema}] em "Este mês" a nota não cita o mês anterior: "${r.notaMes.texto}"`);
  checa(r.notaMes.ativo === 'Este mês', `[${tema}] botão ativo é "${r.notaMes.ativo}"`);
  checa(r.notaPadrao.separadores === 1, `[${tema}] esperado 1 separador entre janela e calendário, achou ${r.notaPadrao.separadores}`);
  log(`  nota (mês): "${r.notaMes.texto}"`);
  // Se os tamanhos diferem, o aviso TEM de existir — e se não diferem, não deve existir.
  const difMesAnt = a.mes_ant.dias_atual !== a.mes_ant.dias_anterior;
  checa(difMesAnt ? !!r.notaMesAnt.alerta : !r.notaMesAnt.alerta,
    `[${tema}] aviso de tamanhos ${difMesAnt ? 'ausente' : 'indevido'} em "Mês passado" (${a.mes_ant.dias_atual}d × ${a.mes_ant.dias_anterior}d)`);
  if (r.notaMesAnt.alerta) log(`  aviso: "${r.notaMesAnt.alerta}"`);

  // 7. Persistência.
  checa(r.guardado === 'mes_ant', `[${tema}] pp:periodo guardou "${r.guardado}", esperado "mes_ant"`);
  checa(r.aposVoltar.ativo === 'Mês passado',
    `[${tema}] após sair e voltar, o período ativo é "${r.aposVoltar.ativo}"`);
  log(`  persistência: pp:periodo="${r.guardado}" e ao voltar continua "${r.aposVoltar.ativo}"`);

  // 8. Layout e console.
  checa(!r.notaPadrao.estoura && !r.notaMes.estoura, `[${tema}] estouro em 1600px`);
  checa(!r.estreito.mainEstoura, `[${tema}] estouro do painel em 480px`);
  checa(!r.estreito.docEstoura, `[${tema}] documento rola horizontal em 480px`);
  checa(r.estreito.notaVisivel, `[${tema}] nota de período sumiu em 480px`);
  checa(r.errors.length === 0, `[${tema}] ${r.errors.length} erro(s) de console: ${r.errors.slice(0, 2).join(' | ')}`);
  checa(r.ruins.length === 0, `[${tema}] HTTP ruim: ${r.ruins.slice(0, 2).join(' | ')}`);
}

log('\n═══════════════════════════════════════');
if (!falhas.length) {
  log('✅ PASSOU — períodos de calendário comparam trecho equivalente, a tela declara a base e a escolha persiste.');
  process.exit(0);
}
log(`❌ ${falhas.length} FALHA(S):`);
falhas.forEach((f) => log('  · ' + f));
process.exit(1);
