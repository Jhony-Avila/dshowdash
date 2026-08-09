// testes/progressao-v3.mjs — lote 291–300 (§216/§222–§224/§548/§566/§568,
// flag as5.microinteracoes): progressão v3 + microinterações.
//   • §216: agrupamento "Por tipo" nas conquistas + chip do tipo no card
//   • §222–§223: XP por USO (contadores na fórmula aberta) + título de
//     nível + extrato transparente §634
//   • §224 v2: badges por tier (bronze/prata/ouro)
//   • P9: data-micro no shell (e AUSENTE com movimento reduzido)
//   • §548 v2: atalho A na folha; §568 v2: tour com o passo do poder
//   • rollback §651: flag off = nada disso aparece
// @version 1.0.0  @created 2026-08-05
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// Parte 1 — App CLÁSSICO (Conquistas/perfil vivem lá; flags padrão do abrir)
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    // contadores locais (§221) alimentam o XP por uso (§223)
    localStorage.setItem('dshow.avst5.contadores.v1', JSON.stringify({ poderes: 4, apresentacoes: 2, capturas: 3 }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);

  // ── perfil de progresso: título de nível + extrato + fórmula §223 ──
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p.waitForSelector('[data-teste="perfil-progresso"]', { timeout: 15000 });
  ok(await p.locator('[data-teste="titulo-nivel"]').count() === 1, 'título do nível ausente (§222)');
  ok(await p.locator('[data-teste="xp-extrato"]').count() === 1, 'extrato do XP ausente (§634)');
  const extrato = await p.locator('[data-teste="xp-extrato"]').textContent();
  ok((extrato ?? '').includes('Poderes ativados') && (extrato ?? '').includes('+12'),
    `XP por uso não entrou (4 poderes × 3 = +12): ${extrato}`);
  ok((extrato ?? '').includes('+10'), 'apresentações (2×5=+10) fora do extrato (§223)');
  const formula = await p.locator('.avst-perfil-formula').textContent();
  ok((formula ?? '').includes('uso real'), 'fórmula aberta não menciona o uso (§634)');

  // ── §216: agrupamento por tipo + chip no card ──
  ok(await p.locator('[data-teste="conq-tipo-chip"]').count() > 0, 'chip do tipo §216 ausente dos cards');
  const temOrdemTipos = await p.locator('[data-teste="conq-ordem"] button', { hasText: 'Por tipo' }).count();
  ok(temOrdemTipos === 1, 'opção "Por tipo (§216)" ausente');
  await p.locator('[data-teste="conq-ordem"] button', { hasText: 'Por tipo' }).click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="conq-tipo"]').count() >= 2, 'agrupamento §216 não rendeu grupos');
  await p.screenshot({ path: `${SAIDA}/progressao-v3-tipos.png` });

  // ── §224 v2: badge com tier legível ──
  const badges = await p.locator('.avst-perfil-badge').allTextContents();
  ok(badges.every((t) => /Bronze|Prata|Ouro/.test(t)) || badges.length === 0,
    `badges sem tier §224 v2: ${badges.join(' | ')}`);

} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

// Parte 2 — SHELL: data-micro (mega 296) + folha de atalhos §548 v2
const { navegador: bS, pagina: pS, erros: errosS } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(pS, 'avst-harness.html', 1200);
  ok(await pS.locator('.avst5-shell[data-micro]').count() === 1, 'data-micro ausente (mega 296)');
  await pS.keyboard.press('?');
  await pS.waitForSelector('[data-teste="atalhos"]', { timeout: 8000 });
  ok((await pS.locator('[data-teste="atalhos"]').textContent())?.includes('Ativar o poder'),
    'atalho A ausente da folha (§548 v2)');
} catch (e) {
  falhas.push(`exceção no shell: ${e.message}`);
}
await bS.close();

// tour na PRIMEIRA visita (storage sem a marca) — conta os passos
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
    localStorage.removeItem('dshow.avst5.tour.v1');
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1500);
  await p2.waitForSelector('[data-teste="tour"]', { timeout: 10000 });
  ok((await p2.locator('[data-teste="tour"] header em').textContent())?.includes('/6'),
    'tour deveria ter 6 passos com a flag ligada (§568 v2)');
  // navega até o último e confere o passo do poder
  for (let i = 0; i < 5; i += 1) {
    await p2.locator('[data-teste="tour-proximo"]').click();
    await p2.waitForTimeout(250);
  }
  ok((await p2.locator('[data-teste="tour"]').textContent())?.includes('Poderes por família'),
    'último passo do tour não é o do poder (§568 v2)');
} catch (e) {
  falhas.push(`exceção no tour: ${e.message}`);
}
await b2.close();

// rollback §651: flag off → clássico sem tipos/extrato/título
const { navegador: b3, pagina: p3, erros: erros3 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    // clássico (novo_shell off) COM a flag do lote desligada (§651)
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': false, 'as5.palco3d': false, 'as5.microinteracoes': false,
    }));
    localStorage.setItem('dshow.avst5.contadores.v1', JSON.stringify({ poderes: 4 }));
  },
});
try {
  await irParaHarness(p3, 'avst-harness.html', 1200);
  await p3.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p3.waitForSelector('[data-teste="perfil-progresso"]', { timeout: 15000 });
  ok(await p3.locator('[data-teste="titulo-nivel"]').count() === 0, 'flag off com título de nível (§651)');
  ok(await p3.locator('[data-teste="xp-extrato"]').count() === 0, 'flag off com extrato (§651)');
  ok(await p3.locator('[data-teste="conq-tipo-chip"]').count() === 0, 'flag off com chip de tipo (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('progressao-v3', falhas, [...erros, ...errosS, ...erros2, ...erros3]);
await b3.close();
process.exit(ok_ ? 0 : 1);
