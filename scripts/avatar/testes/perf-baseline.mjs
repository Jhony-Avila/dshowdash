// testes/perf-baseline.mjs — lote 1171–1180 (decisão #119, flag
// as6.perf_baseline): baseline de runtime local (AS6 Parte 9).
//   A) flag ON: window.__avstPerf existe; trocar de categoria e equipar
//      geram medidas fechadas PÓS-PAINT; valores dentro do ORÇAMENTO
//      (generoso — estourar é regressão real); performance.measure
//      registradas com prefixo avst:.
//   B) rollback §651: flag OFF = sem __avstPerf, zero marks avst:.
// @version 1.0.0  @created 2026-08-09
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.evaluate(() => typeof window.__avstPerf === 'function'), '__avstPerf ausente com a flag ON');
    // gera amostras: 3 trocas de categoria + 1 equipar
    for (const cat of ['Cabelo', 'Olhos', 'Roupa']) {
      await p.evaluate((c) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(c))?.click(); }, cat);
      await p.waitForTimeout(500);
    }
    await p.locator('.avst5-painel .avst-card').nth(2).click();
    await p.waitForTimeout(800);
    const rel = await p.evaluate(() => window.__avstPerf());
    ok((rel.medidas['troca-categoria']?.n ?? 0) >= 3, `esperava ≥3 medidas de troca (veio ${rel.medidas['troca-categoria']?.n})`);
    ok((rel.medidas.equipar?.n ?? 0) >= 1, 'equipar sem medida');
    ok(rel.medidas['troca-categoria'].mediaMs > 0 && rel.medidas['troca-categoria'].mediaMs < 1200,
      `troca-categoria fora do orçamento: ${Math.round(rel.medidas['troca-categoria'].mediaMs)}ms (limite 1200)`);
    ok(rel.medidas.equipar.mediaMs > 0 && rel.medidas.equipar.mediaMs < 1500,
      `equipar fora do orçamento: ${Math.round(rel.medidas.equipar.mediaMs)}ms (limite 1500)`);
    ok(typeof rel.longtasks.n === 'number', 'relatório sem long tasks');
    const measures = await p.evaluate(() => performance.getEntriesByType('measure').filter((m) => m.name.startsWith('avst:')).length);
    ok(measures >= 4, `esperava ≥4 performance.measure avst: (veio ${measures})`);
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.perf_baseline': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
    await p.waitForTimeout(500);
    ok(await p.evaluate(() => typeof window.__avstPerf === 'undefined'), 'flag OFF ainda expõe __avstPerf');
    ok(await p.evaluate(() => performance.getEntriesByType('measure').filter((m) => m.name.startsWith('avst:')).length) === 0,
      'flag OFF ainda registra measures avst:');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[perf-baseline] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[perf-baseline] FALHAS: nenhuma');
console.log('[perf-baseline] ERROS JS: nenhum');
