// testes/workers-v2.mjs — lote 1161–1170 (decisão #118, flag
// as6.workers_v2): ENCODE do export de foto fora da main thread.
//   A) flag ON: "Baixar PNG" envia tarefa 'encodar' ao worker (bitmap
//      transferido) e o resultado é um PNG válido; falha → fallback.
//   B) rollback §651: flag OFF = zero tarefas 'encodar' e o download
//      segue funcionando (toDataURL síncrono de sempre).
// @version 1.0.0  @created 2026-08-09
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const instrumentar = () => {
  const W = window.Worker;
  window.__encodes = 0;
  if (!W) return;
  window.Worker = class extends W {
    postMessage(m, tr) { if (m && m.tarefa === 'encodar') window.__encodes += 1; return super.postMessage(m, tr); }
  };
};
const irFoto = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('[data-teste="foto-do-avatar"]').click();
  await p.waitForTimeout(900);
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(700);
};

for (const ligada of [true, false]) {
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: (cfg) => {
      const W = window.Worker;
      window.__encodes = 0;
      if (W) window.Worker = class extends W {
        postMessage(m, tr) { if (m && m.tarefa === 'encodar') window.__encodes += 1; return super.postMessage(m, tr); }
      };
      localStorage.setItem('dshow.avst.flags.v1', cfg);
    },
    initArg: JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, ...(ligada ? {} : { 'as6.workers_v2': false }) }),
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irFoto(p);
    await p.locator('button', { hasText: 'Baixar PNG' }).first().click();
    await p.waitForTimeout(2500);
    const encodes = await p.evaluate(() => window.__encodes ?? 0);
    if (ligada) ok(encodes >= 1, `flag ON deveria encodar no worker (veio ${encodes})`);
    else ok(encodes === 0, `flag OFF deveria ter zero encodes no worker (veio ${encodes})`);
    ok(erros.length === 0, `erros de página (${ligada ? 'ON' : 'OFF'}): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (${ligada ? 'ON' : 'OFF'}): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[workers-v2] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[workers-v2] FALHAS: nenhuma');
console.log('[workers-v2] ERROS JS: nenhum');
