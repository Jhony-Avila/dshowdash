// testes/diff-v6.mjs — lote 961–970 (decisão #98, flag as6.diff_v6):
// diff campo a campo no salvar (AS6 §350/§322).
//   A) flag ON: mudar cabelo + cor → "Detalhes" abre o painel com
//      linhas LEGÍVEIS (nomes do catálogo, de → para; cor com hex);
//      salvar grava o HISTÓRICO local (ring) e o painel passa a listar
//      "salvamentos anteriores" na próxima mudança.
//   B) rollback §651: flag OFF = barra anterior byte a byte (sem botão
//      Detalhes, sem painel, sem ring no storage).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const equiparCabelo = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado');
    cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(500);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await equiparCabelo(p);
    ok(await p.locator('[data-teste="diff-abrir"]').count() === 1, 'botão Detalhes ausente com a flag ON');
    await p.locator('[data-teste="diff-abrir"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="diff-painel"]').count() === 1, 'painel de diff não abriu (§350)');
    const linhas = await p.locator('[data-teste="diff-linha"]').allTextContents();
    ok(linhas.length >= 1, 'nenhuma linha de diff');
    ok(linhas.some((l) => l.includes('Cabelo') && l.includes('→')), `diff sem a linha legível do cabelo (${linhas.join(' | ')})`);
    ok(!linhas.some((l) => /\bcab_[a-z_]+/.test(l)), 'diff vazou ID cru em vez do nome do catálogo');
    // salvar grava o histórico local
    await p.locator('.avst5-salvar button', { hasText: /^ Salvar$|Salvar/ }).last().click();
    await p.waitForTimeout(600);
    const ring = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst6.diff.hist.v1') ?? '[]'));
    ok(Array.isArray(ring) && ring.length === 1 && ring[0].total >= 1,
      `histórico não gravou no salvar (${JSON.stringify(ring).slice(0, 80)})`);
    // nova mudança → painel mostra os salvamentos anteriores
    await equiparCabelo(p);
    await p.locator('[data-teste="diff-abrir"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="diff-historico"]').count() === 1,
      'painel sem a seção de salvamentos anteriores');
    await p.screenshot({ path: `${SAIDA}/diff-v6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.diff_v6': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await equiparCabelo(p);
    ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'barra pendente ausente');
    ok(await p.locator('[data-teste="diff-abrir"]').count() === 0, 'flag OFF ainda mostra Detalhes (§651)');
    await p.evaluate(() => { document.querySelector('.avst5-salvar .avst-botao-primario')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await p.waitForTimeout(600);
    const ring = await p.evaluate(() => localStorage.getItem('dshow.avst6.diff.hist.v1'));
    ok(ring === null, 'flag OFF gravou histórico (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[diff-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[diff-v6] FALHAS: nenhuma');
console.log('[diff-v6] ERROS JS: nenhum');
