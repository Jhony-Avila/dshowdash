// testes/luz-contextual.mjs — lote 471–480 (§164.2/§165, flag
// as5.luz_contextual): luz contextual.
//   • §165 AUTO: ligar Auto + trocar a hora muda data-luz sozinho
//     (tarde→quente, madrugada→fria); escolher preset manual DESLIGA o
//     Auto; persiste
//   • §164.2: data-luzctx presente (CSS combinado engatilha)
//   • rollback §651: sem chip Auto, sem data-luzctx
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.locator('button[title="Modo Studio (apresentação)"]').click();
  await p.waitForTimeout(500);
  ok(await p.locator('.avst5-viewport[data-luzctx]').count() === 1, 'data-luzctx ausente (§164.2)');
  ok(await p.locator('[data-teste="luz-auto"]').count() === 1, 'chip Auto ausente (§165)');

  // liga o AUTO e troca a hora → a luz segue
  await p.evaluate(() => document.querySelector('[data-teste="luz-auto"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(300);
  const trocarHora = (rotulo) => p.evaluate((r) => {
    const grupo = document.querySelector('[data-teste="horas-2d"]') ?? document;
    [...grupo.querySelectorAll('button')].find((x) => x.textContent.trim() === r)?.click();
  }, rotulo);
  await trocarHora('Tarde');
  await p.waitForTimeout(300);
  ok(await p.locator('.avst5-viewport[data-luz="quente"]').count() === 1, 'Auto: tarde deveria dar quente (§165)');
  await trocarHora('Madrugada');
  await p.waitForTimeout(300);
  ok(await p.locator('.avst5-viewport[data-luz="fria"]').count() === 1, 'Auto: madrugada deveria dar fria (§165)');
  ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.palco.luzauto.v1')) === '1', 'Auto não persistiu');

  // preset MANUAL desliga o Auto
  await p.evaluate(() => {
    const grupo = document.querySelector('[aria-label*="Ilumina"]') ?? document;
    [...grupo.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Neutra')?.click();
  });
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="luz-auto"][aria-checked="false"]').count() === 1, 'manual não desligou o Auto (§165)');
  await p.screenshot({ path: `${SAIDA}/luz-contextual.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.luz_contextual': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.locator('button[title="Modo Studio (apresentação)"]').click();
  await p2.waitForTimeout(500);
  ok(await p2.locator('[data-teste="luz-auto"]').count() === 0, 'flag off com Auto (§651)');
  ok(await p2.locator('.avst5-viewport[data-luzctx]').count() === 0, 'flag off com data-luzctx (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('luz-contextual', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
