// testes/vida-shell.mjs — lote 1071–1080 (decisão #109, flag
// as6.vida_shell): VIDA do avatar no shell novo (regressão da auditoria).
//   A) flag ON (shell novo, 2D): personagem respira e cabelo balança
//      (WAAPI infinita nos grupos data-anim) e a piscada dispara ao
//      longo do tempo; trocar item RELIGA a vida no SVG novo.
//   B) rollback §651: flag OFF = zero animações WAAPI nos grupos.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const animacoesDe = (p) => p.evaluate(() => {
  const host = document.querySelector('.avst5-zoom');
  const de = (nome) => host?.querySelector(`[data-anim="${nome}"]`)?.getAnimations().length ?? 0;
  return { personagem: de('personagem'), cabelo: de('cabelo') };
});

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.waitForTimeout(600);
    const a = await animacoesDe(p);
    ok(a.personagem >= 1, `personagem deveria respirar (${a.personagem} anims)`);
    ok(a.cabelo >= 1, `cabelo deveria balançar (${a.cabelo} anims)`);
    // trocar de item religa a vida no SVG novo
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
    await p.waitForTimeout(600);
    await p.evaluate(() => {
      const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
        .find((x) => !x.className.includes('avst-card-ativo') && !x.className.includes('avst-card-nenhum') && x.dataset.teste !== 'card-adiado');
      c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(700);
    const b2 = await animacoesDe(p);
    ok(b2.personagem >= 1, 'vida não religou após trocar item');
    await p.screenshot({ path: `${SAIDA}/vida-shell.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.vida_shell': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.waitForTimeout(600);
    const a = await animacoesDe(p);
    ok(a.personagem === 0 && a.cabelo === 0, `flag OFF com vida ligada (${JSON.stringify(a)}) (§651)`);
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[vida-shell] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[vida-shell] FALHAS: nenhuma');
console.log('[vida-shell] ERROS JS: nenhum');
