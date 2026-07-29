// #66 — a tela de Saúde precisa EXPLICAR a diferença entre eventos e jobs.
//
// Antes: "Eventos recebidos 5.486" ao lado de "Concluídos 3.960", dois números que não
// fecham e cuja diferença não aparecia em lugar nenhum — parecia perda de dado. É
// coalescing: vários eventos do mesmo alvo colapsam num job só, porque o job re-busca o
// estado ATUAL e um re-fetch cobre todos eles.
//
// Esta prova exige, em dark e light:
//   1. o card da fila traz a linha "Eventos → jobs" com jobs e agrupados;
//   2. os números FECHAM: eventos totais = jobs de webhook + agrupados;
//   3. o tile "Eventos recebidos" mostra o TOTAL, não os em aberto — senão, com o ciclo
//      fechado (#65), ele leria 0 e pareceria que nada chega;
//   4. a linha "Eventos em aberto" existe e bate com o payload;
//   5. o DOM concorda com a API (nada é calculado no front);
//   6. 0 erro de console do painel.
//
// ⚠️ Tema tem de ser aplicado em CONTEXTO FRESCO via addInitScript(cm_theme), ANTES de
// qualquer script da página rodar. Trocar localStorage com a página já montada não
// repinta o painel: a primeira versão desta prova fazia isso, "passou" nos dois temas e
// gerou dois PNGs BYTE A BYTE IDÊNTICOS — ou seja, o segundo tema nunca foi exercitado.
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
const num = (s) => Number(String(s ?? '').replace(/[^\d]/g, ''));

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});

const cookies = await getSessionCookies().catch(() => []);

/** Abre o painel na aba Saúde num contexto novo, já no tema pedido. */
async function abrirSaude(tema) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  try { await ctx.addCookies(cookies); } catch { /* */ }

  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  let stats = null;
  page.on('response', async (r) => {
    if (!r.url().includes('/api/pipedrive/health')) return;
    try { const b = await r.json(); if (b?.data?.queue?.stats) stats = b.data.queue.stats; } catch { /* */ }
  });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
  if (trigger) await trigger.click().catch(() => {});
  await page.waitForSelector('[data-pp-react-root] .pp-shell', { timeout: 30000 });
  await page.waitForTimeout(1500);

  const btn = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-navitem')].find(b => b.textContent.includes('Saúde')));
  await btn.asElement()?.click().catch(() => {});
  await page.waitForTimeout(3000);

  return { ctx, page, errors, stats: () => stats };
}

const lerCard = (page) => page.evaluate(() => {
  const c = [...document.querySelectorAll('.pp-main .pp-card')]
    .find(x => x.querySelector('h3')?.textContent.includes('Fila de ingestão'));
  if (!c) return null;
  const linha = (rotulo) => {
    const r = [...c.querySelectorAll('.pp-row')].find(x => x.querySelector('.pp-k')?.textContent.includes(rotulo));
    return r ? r.querySelector('.pp-v')?.textContent.trim() : null;
  };
  const tile = (rotulo) => {
    const t = [...c.querySelectorAll('.pp-tile')].find(x => x.textContent.includes(rotulo));
    return t ? (t.querySelector('.pp-tile-n')?.textContent.trim() ?? t.textContent.trim()) : null;
  };
  return {
    eventosJobs: linha('Eventos → jobs'),
    emAberto: linha('Eventos em aberto'),
    tileEventos: tile('Eventos recebidos'),
    // Prova de que o tema REALMENTE mudou, e não só o localStorage. ⚠️ NÃO usar a classe
    // `theme-light` do <html> como sinal: ela aparece nos dois casos e o painel não se
    // guia por ela — a cor computada do card é o que de fato distingue.
    fundo: getComputedStyle(c).backgroundColor,
  };
});

const doPainel = (t) => !/\[header\.|container-main:logger|Performance critical|weather|Failed to load resource/i.test(t);
const fundos = {};
let statsRef = null;

for (const tema of ['dark', 'light']) {
  log(`\n=== ${tema} ===`);
  const { ctx, page, errors, stats } = await abrirSaude(tema);
  const s = stats();
  if (!statsRef) statsRef = s;

  const total = s?.webhook_events?.total;
  const abertos = s?.webhook_events?.received;
  const fechados = s?.webhook_events?.processed;
  const jobs = s?.webhook_jobs;
  const agrupados = s?.events_coalesced;

  checa('/health devolveu as contagens da fila', !!s, JSON.stringify(s?.webhook_events ?? null));
  checa('o payload traz total, webhook_jobs e events_coalesced',
    [total, jobs, agrupados].every(v => Number.isFinite(v)), `total=${total} jobs=${jobs} agrupados=${agrupados}`);
  checa('OS NÚMEROS FECHAM: eventos = jobs + agrupados', total === jobs + agrupados, `${total} == ${jobs} + ${agrupados}`);
  checa('total = abertos + fechados + erros + duplicados',
    total === abertos + fechados + s?.webhook_events?.error + s?.webhook_events?.duplicate,
    `${total} == ${abertos}+${fechados}+${s?.webhook_events?.error}+${s?.webhook_events?.duplicate}`);

  const card = await lerCard(page);
  checa('o card da fila existe', !!card, JSON.stringify(card));
  const rgb = (card?.fundo ?? '').match(/\d+/g)?.map(Number) ?? [];
  const claro = rgb.length >= 3 && (rgb[0] + rgb[1] + rgb[2]) / 3 > 128;
  checa(`o tema aplicado é mesmo ${tema}`, claro === (tema === 'light'), `fundo=${card?.fundo}`);
  checa('linha "Eventos → jobs" presente', !!card?.eventosJobs, card?.eventosJobs ?? '');
  checa('linha "Eventos em aberto" presente', !!card?.emAberto, card?.emAberto ?? '');

  const nums = (card?.eventosJobs ?? '').match(/[\d.]+/g)?.map(num) ?? [];
  checa('os números da linha vêm da API, não do front',
    nums[0] === jobs && nums[1] === agrupados, `DOM=[${nums}] API=[${jobs},${agrupados}]`);

  const numsAberto = (card?.emAberto ?? '').match(/[\d.]+/g)?.map(num) ?? [];
  checa('"em aberto · fechados" bate com a API',
    numsAberto[0] === abertos && numsAberto[1] === fechados, `DOM=[${numsAberto}] API=[${abertos},${fechados}]`);

  checa('o tile "Eventos recebidos" mostra o TOTAL (não os em aberto)',
    num(card?.tileEventos) === total, `tile=${card?.tileEventos} total=${total} abertos=${abertos}`);

  fundos[tema] = card?.fundo;

  const alvo = await page.evaluateHandle(() => [...document.querySelectorAll('.pp-main .pp-card')]
    .find(x => x.querySelector('h3')?.textContent.includes('Fila de ingestão')));
  await alvo.asElement()?.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await alvo.asElement()?.screenshot({ path: `${OUT}/pipedrive-ciclo-evento-${tema}.png` }).catch(() => {});

  const errsPainel = errors.filter(doPainel);
  checa('0 erro de console do painel', errsPainel.length === 0, errsPainel.slice(0, 3).join(' | '));
  await ctx.close();
}

log('\n=== os dois temas foram mesmo exercitados? ===');
checa('o fundo do card difere entre dark e light',
  !!fundos.dark && !!fundos.light && fundos.dark !== fundos.light, `dark=${fundos.dark} light=${fundos.light}`);

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
