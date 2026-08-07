// testes/foto329.mjs — lote 721–730 (§329, flag as5.foto3d): FOTO×3D em
// ALTA com o estado do usuário.
//   A) flag ON: galeria 3D → escolher o Herói (UBC) → fases §329.3
//      aparecem durante a captura → Estilizar abre com captura REAL
//      embutida (pose Idle do pacote UAL, cores/corpo do avatar);
//   B) rollback §651: flag OFF = fluxo antigo byte a byte (captura
//      funciona, texto genérico, sem fases §329.3).
// @version 1.0.0  @created 2026-08-07
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const fluxo = async (p, { esperaFases }) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('[data-teste="origem-3d"]').click();
  await p.waitForSelector('[data-teste="galeria-3d"]', { timeout: 10000 });
  // escolhe o HERÓI (UBC): exercita rebind/cores/corpo/pose da onda 611+
  const fases = [];
  const sonda = setInterval(() => {
    void p.evaluate(() => document.querySelector('[data-teste="foto-329-fase"]')?.textContent ?? null)
      .then((t) => { if (t) fases.push(t); })
      .catch(() => { /* página ocupada */ });
  }, 350);
  await p.locator('.avst-foto-3d-item', { hasText: 'Herói (UBC)' }).click();
  await p.waitForSelector('.avst-ft-preview svg', { timeout: 90000 });
  clearInterval(sonda);
  const texto = fases.join(' | ');
  if (esperaFases) {
    ok(/Preparando|Carregando|Ajustando|Renderizando|Finalizando/.test(texto),
      `fases §329.3 não apareceram (visto: "${texto.slice(0, 120)}")`);
  } else {
    ok(!/Preparando|Carregando materiais|Ajustando|Renderizando|Finalizando/.test(texto),
      `flag off mas fases §329.3 apareceram (§651): "${texto.slice(0, 120)}"`);
  }
  const svg = await p.locator('.avst-ft-preview svg').evaluate((el) => el.outerHTML);
  ok(svg.includes('<image'), 'preview sem a captura embutida');
  ok(svg.length > 20000, `captura suspeita de vazia (${svg.length} chars)`);
  ok(await p.locator('[data-teste="templates-foto"]').count() === 1, 'Estilizar não abriu após a captura');
};

// ── A) flag ON (padrão): captura ALTA §329 no Herói UBC ─────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({ webgl: true });
  try {
    await irParaHarness(p, 'avst-harness.html', 900);
    await fluxo(p, { esperaFases: true });
    await p.screenshot({ path: `${SAIDA}/foto329.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651: flag OFF = fluxo antigo ───────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    webgl: true,
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as5.classico_aaa': false, 'as5.foto3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 900);
    await fluxo(p, { esperaFases: false });
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS foto329:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('foto329 OK');
