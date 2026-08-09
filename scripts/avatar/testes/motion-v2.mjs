// testes/motion-v2.mjs — lote 1131–1140 (decisão #115, flag
// as6.motion_v2): aceites §568 da Parte 7 AS6.
//   A) flag ON: altura da dock TRANSICIONA (não corta seco); trocar de
//      categoria assenta a biblioteca com fade curto ([data-troca]);
//      keyframe novo registrado (paridade é do tokens-as6).
//   B) reduced-motion: [data-motion-v2] nem aparece (§297).
//   C) rollback §651: flag OFF = sem transição/atributos, byte a byte.
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
    ok(await p.locator('.avst5-shell[data-motion-v2]').count() === 1, 'shell sem [data-motion-v2] com a flag ON');
    const trans = await p.locator('.avst5-painel').evaluate((el) => getComputedStyle(el).transitionProperty);
    ok(trans.includes('height'), `dock sem transição de altura (§568): ${trans}`);
    // altura muda SUAVE: logo após o clique ainda está no meio do caminho
    const h0 = (await p.locator('.avst5-painel').boundingBox()).height;
    await p.locator('[data-teste="dock-altura"]').click();
    await p.waitForTimeout(40); // easing t-ease-suave dispara rápido — amostra CEDO
    const hMeio = (await p.locator('.avst5-painel').boundingBox()).height;
    await p.waitForTimeout(500);
    const h1 = (await p.locator('.avst5-painel').boundingBox()).height;
    ok(h1 > h0 + 60, `expandida não cresceu (${h0}→${h1})`);
    ok(hMeio > h0 - 2 && hMeio < h1 - 6, `altura deveria transicionar (meio=${hMeio}, de ${h0} a ${h1})`);
    // troca de categoria pulsa [data-troca] e depois limpa
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
    await p.waitForTimeout(60);
    ok(await p.locator('.avst5-painel-scroll[data-troca]').count() === 1, 'troca de categoria não marcou [data-troca]');
    await p.waitForTimeout(400);
    ok(await p.locator('.avst5-painel-scroll[data-troca]').count() === 0, '[data-troca] não limpou após a animação');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) reduced-motion (§297) ────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst5-shell[data-motion-v2]').count() === 0, 'reduced-motion deveria desligar o motion v2 (§297)');
  } catch (e) { falhas.push(`exceção (B): ${e.message}`); }
  await b.close();
}

// ── C) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.motion_v2': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst5-shell[data-motion-v2]').count() === 0, 'flag OFF ainda marca [data-motion-v2]');
    const trans = await p.locator('.avst5-painel').evaluate((el) => getComputedStyle(el).transitionProperty);
    ok(!trans.includes('height'), `flag OFF ainda transiciona altura: ${trans}`);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
    await p.waitForTimeout(60);
    ok(await p.locator('.avst5-painel-scroll[data-troca]').count() === 0, 'flag OFF ainda pulsa [data-troca]');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[motion-v2] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[motion-v2] FALHAS: nenhuma');
console.log('[motion-v2] ERROS JS: nenhum');
