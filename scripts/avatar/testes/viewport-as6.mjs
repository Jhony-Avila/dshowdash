// testes/viewport-as6.mjs — lote 781–790 (AS6 §52/§84, flag
// as6.viewport): presets MANUAIS de câmera no palco 2D.
//   A) flag ON: chips Auto/Rosto/Busto/Corpo na viewport; Rosto muda o
//      transform do .avst5-zoom vs o auto; Corpo = quadro cheio;
//      preferência PERSISTE (reload mantém o preset §84);
//   B) rollback §651: flag OFF = sem chips e transform automático
//      byte a byte igual ao de sempre.
// @version 1.0.0  @created 2026-08-08
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const FLAGS_ON = { 'as5.novo_shell': true };

const transformDoZoom = (p) => p.evaluate(() => document.querySelector('.avst5-zoom')?.getAttribute('style') ?? '');

// ── A) flag ON (padrão) ─────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="cam6-chips"]').count() === 1, 'chips de câmera ausentes com a flag ON');
    const auto = await transformDoZoom(p);
    await p.locator('[data-teste="cam6-rosto"]').click();
    await p.waitForTimeout(250);
    const rosto = await transformDoZoom(p);
    ok(rosto !== auto, 'preset Rosto não mudou o transform do zoom (§52)');
    ok(await p.locator('[data-teste="cam6-rosto"]').getAttribute('aria-pressed') === 'true', 'chip Rosto sem aria-pressed');
    await p.locator('[data-teste="cam6-corpo"]').click();
    await p.waitForTimeout(250);
    const corpo = await transformDoZoom(p);
    ok(/scale\(1\)/.test(corpo), `Corpo deveria ser quadro cheio scale(1) (visto: ${corpo.slice(0, 80)})`);
    // §84: persiste — recarregar mantém o preset
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="cam6-corpo"]').getAttribute('aria-pressed') === 'true',
      'preset de câmera não persistiu no reload (§84)');
    await p.screenshot({ path: `${SAIDA}/viewport-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.viewport': false }));
      localStorage.setItem('dshow.avst6.cam.v1', 'rosto'); // preset salvo NÃO pode vazar com a flag off
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="cam6-chips"]').count() === 0, 'flag OFF mas os chips apareceram (§651)');
    const t = await transformDoZoom(p);
    ok(t.includes('transform'), 'zoom automático sumiu com a flag OFF');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS viewport-as6:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('viewport-as6 OK');
