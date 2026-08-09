// testes/nav-dock.mjs — lote 1151–1160 (decisão #117, flag
// as6.nav_dock): a dock 100% operável por TECLADO (AS6 Parte 6).
//   A) flag ON: B foca o 1º card navegável; setas movem o foco (roving)
//      e o trilho ACOMPANHA; PageDown pagina; D cicla a altura; a folha
//      de atalhos ganha o grupo "Dock de assets".
//   B) rollback §651: flag OFF = sem B/D/PgDn; setas seguem funcionando
//      (roving da a11y-v2 continua) e a folha volta a 3 grupos.
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
    // B foca o 1º card
    await p.keyboard.press('b');
    await p.waitForTimeout(300);
    const focado = await p.evaluate(() => document.activeElement?.classList.contains('avst-card'));
    ok(focado === true, 'tecla B deveria focar um card da dock');
    // setas movem o foco e o trilho rola atrás
    const s0 = await p.evaluate(() => document.querySelector('.avst5-painel .avst-grade')?.scrollLeft ?? -1);
    for (let i = 0; i < 8; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120); }
    await p.waitForTimeout(600);
    const s1 = await p.evaluate(() => document.querySelector('.avst5-painel .avst-grade')?.scrollLeft ?? -1);
    ok(s1 > s0 + 100, `trilho deveria acompanhar o foco (${s0}→${s1})`);
    // PageDown pagina
    await p.keyboard.press('PageDown');
    await p.waitForTimeout(700);
    const s2 = await p.evaluate(() => document.querySelector('.avst5-painel .avst-grade')?.scrollLeft ?? -1);
    ok(s2 > s1 + 200, `PageDown deveria paginar o trilho (${s1}→${s2})`);
    // D cicla a altura
    const h0 = (await p.locator('.avst5-painel').boundingBox()).height;
    await p.keyboard.press('d');
    await p.waitForTimeout(600);
    const h1 = (await p.locator('.avst5-painel').boundingBox()).height;
    ok(Math.abs(h1 - h0) > 40, `tecla D deveria ciclar a altura (${h0}→${h1})`);
    // folha de atalhos ganha o grupo
    await p.keyboard.press('Escape');
    await p.keyboard.press('?');
    await p.waitForTimeout(400);
    const folha = await p.evaluate(() => document.body.textContent?.includes('Dock de assets'));
    ok(folha === true, 'folha de atalhos sem o grupo "Dock de assets"');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.nav_dock': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.keyboard.press('b');
    await p.waitForTimeout(300);
    ok((await p.evaluate(() => document.activeElement?.classList.contains('avst-card'))) !== true,
      'flag OFF: B não deveria focar card');
    const h0 = (await p.locator('.avst5-painel').boundingBox()).height;
    await p.keyboard.press('d');
    await p.waitForTimeout(500);
    ok(Math.abs(((await p.locator('.avst5-painel').boundingBox()).height) - h0) < 4,
      'flag OFF: D não deveria ciclar a altura');
    await p.keyboard.press('?');
    await p.waitForTimeout(400);
    ok((await p.evaluate(() => document.body.textContent?.includes('Dock de assets'))) !== true,
      'flag OFF: folha não deveria ter o grupo da dock');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[nav-dock] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[nav-dock] FALHAS: nenhuma');
console.log('[nav-dock] ERROS JS: nenhum');
