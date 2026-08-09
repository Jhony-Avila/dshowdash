// testes/workers-as6.mjs — lote 1091–1100 (decisão #111, flag
// as6.workers): POOL DE WORKERS p/ tarefas pesadas (AS6 Parte 9).
//   A) flag ON (padrão): guardar projeto de foto CONSTRÓI worker(s)
//      (compressão fora da main thread) e o projeto salvo tem a
//      foto-base JPEG válida — o worker é aceleração, nunca
//      dependência (qualquer falha cai no canvas síncrono).
//   B) rollback §651: flag OFF = ZERO workers construídos e o save
//      funciona igual pelo caminho síncrono de sempre.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irFoto = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
};
const avatarVirouFoto = async (p) => {
  await p.locator('[data-teste="foto-do-avatar"]').click();
  await p.waitForTimeout(900);
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(700);
};
const salvarProjeto = async (p) => {
  await p.locator('[data-teste="guardar-projeto"]').click();
  await p.waitForTimeout(1200); // roundtrip do worker (timeout interno 4s)
};

// instrumentação: conta construções de Worker ANTES de qualquer script
const contarWorkers = () => {
  const W = window.Worker;
  window.__workersCriados = 0;
  if (!W) return;
  window.Worker = class extends W {
    constructor(...a) { super(...a); window.__workersCriados += 1; }
  };
};

// ── A) flag ON (padrão do código) ───────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: contarWorkers,
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irFoto(p);
    await avatarVirouFoto(p);
    await salvarProjeto(p);
    const criados = await p.evaluate(() => window.__workersCriados ?? 0);
    ok(criados >= 1, `flag ON deveria construir worker(s) no save (veio ${criados})`);
    const lista = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '[]'));
    ok(lista.length === 1, `esperava 1 projeto salvo, veio ${lista.length}`);
    ok(typeof lista[0]?.foto === 'string' && lista[0].foto.startsWith('data:image/jpeg'),
      'projeto salvo sem foto-base JPEG válida (worker OU fallback deveriam produzir)');
    // pool ≤ 2 (§ regra do WorkerPool): nunca um worker por chamada
    ok(criados <= 2, `pool deveria ter no máx. 2 workers (veio ${criados})`);
    await p.screenshot({ path: `${SAIDA}/workers-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651: flag OFF = caminho síncrono byte a byte ───────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      const W = window.Worker;
      window.__workersCriados = 0;
      if (W) {
        window.Worker = class extends W {
          constructor(...a) { super(...a); window.__workersCriados += 1; }
        };
      }
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': false, 'as5.palco3d': false, 'as5.classico_aaa': false,
        'as6.workers': false,
      }));
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irFoto(p);
    await avatarVirouFoto(p);
    await salvarProjeto(p);
    const criados = await p.evaluate(() => window.__workersCriados ?? 0);
    ok(criados === 0, `flag OFF deveria construir ZERO workers (veio ${criados})`);
    const lista = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst5.foto.projetos.v1') ?? '[]'));
    ok(lista.length === 1 && typeof lista[0]?.foto === 'string' && lista[0].foto.startsWith('data:image/jpeg'),
      'flag OFF: save síncrono deveria funcionar igual (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[workers-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[workers-as6] FALHAS: nenhuma');
console.log('[workers-as6] ERROS JS: nenhum');
