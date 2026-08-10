// testes/mobile-v6.mjs — lote 1241–1250 (decisão #127, flag
// as6.mobile_v6): telas estreitas — o topo da dock é uma ALÇA de
// swipe vertical.
//   A) flag ON (740px): swipe p/ CIMA sobe um degrau (padrão→
//      expandida); swipe p/ BAIXO desce (→padrão→compacta→recolhida);
//      alça visual presente; clique nos botões segue funcionando.
//   B) rollback §651: flag OFF = swipe não muda nada.
// @version 1.0.0  @created 2026-08-10
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const swipe = async (p, dy) => {
  const topo = await p.locator('.avst5-painel-topo').boundingBox();
  const x = topo.x + topo.width / 2;
  const y0 = topo.y + topo.height / 2;
  await p.mouse.move(x, y0);
  await p.mouse.down();
  for (let i = 1; i <= 5; i++) await p.mouse.move(x, y0 + (dy / 5) * i);
  await p.mouse.up();
  await p.waitForTimeout(450);
};
const estado = (p) => p.evaluate(() => document.querySelector('.avst5-painel')?.dataset.dockEstado ?? (document.querySelector('.avst5-painel-fechado') ? 'recolhida' : '?'));

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 740, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst5-shell[data-mobile-v6]').count() === 1, 'shell sem [data-mobile-v6]');
    ok((await estado(p)) === 'padrao', `estado inicial deveria ser padrão (${await estado(p)})`);
    await swipe(p, -80); // cima → expandida
    ok((await estado(p)) === 'expandida', `swipe p/ cima deveria expandir (${await estado(p)})`);
    await swipe(p, 80); // baixo → padrão
    ok((await estado(p)) === 'padrao', `swipe p/ baixo deveria voltar a padrão (${await estado(p)})`);
    await swipe(p, 80); // → compacta
    await swipe(p, 80); // → recolhida
    ok((await estado(p)) === 'recolhida', `dois swipes p/ baixo deveriam recolher (${await estado(p)})`);
    await swipe(p, -80); // cima → reabre
    ok((await estado(p)) !== 'recolhida', 'swipe p/ cima deveria reabrir a dock');
    // clique nos botões segue vivo (gesto não rouba o clique)
    await p.locator('[data-teste="dock-altura"]').click();
    await p.waitForTimeout(400);
    ok(['padrao', 'expandida'].includes(await estado(p)), 'clique no botão de altura parou de funcionar');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 740, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.mobile_v6': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst5-shell[data-mobile-v6]').count() === 0, 'flag OFF ainda marca [data-mobile-v6]');
    const antes = await estado(p);
    await swipe(p, -80);
    ok((await estado(p)) === antes, 'flag OFF: swipe não deveria mudar o estado');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[mobile-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[mobile-v6] FALHAS: nenhuma');
console.log('[mobile-v6] ERROS JS: nenhum');
