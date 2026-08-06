// testes/a11y-v2.mjs — lote 491–500 (§297, flag as5.a11y_v2): navegação
// por setas na grade (roving tabindex + Home/End) + foco visível.
//   • 1º card tabindex=0, demais -1; ArrowRight move o FOCO e o roving;
//     End vai ao último; indisponíveis (§60.9) ficam fora do circuito
//   • data-a11y presente (CSS de foco engatilha)
//   • rollback §651: cards sem tabindex gerenciado
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Boca'))?.click(); });
  await p.waitForTimeout(700);
  ok(await p.locator('.avst-grade[data-a11y]').count() >= 1, 'data-a11y ausente (§297)');
  const roving = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst-grade .avst-card:not([data-indisponivel])')];
    return { t0: cards[0]?.tabIndex, t1: cards[1]?.tabIndex, n: cards.length };
  });
  ok(roving.t0 === 0 && roving.t1 === -1, `roving tabindex errado (${roving.t0}/${roving.t1})`);
  // foca o 1º e navega com as setas
  await p.evaluate(() => document.querySelector('.avst-grade .avst-card')?.focus());
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(200);
  const aposDireita = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst-grade .avst-card:not([data-indisponivel])')];
    return { focado: cards.indexOf(document.activeElement), t: document.activeElement?.tabIndex };
  });
  ok(aposDireita.focado === 1 && aposDireita.t === 0, `ArrowRight não moveu o roving (${JSON.stringify(aposDireita)})`);
  await p.keyboard.press('End');
  await p.waitForTimeout(200);
  const aposEnd = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst-grade .avst-card:not([data-indisponivel])')];
    return cards.indexOf(document.activeElement) === cards.length - 1;
  });
  ok(aposEnd, 'End não foi ao último card');
  await p.keyboard.press('Home');
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst-grade .avst-card:not([data-indisponivel])')];
    return cards.indexOf(document.activeElement) === 0;
  }), 'Home não voltou ao primeiro');
  await p.screenshot({ path: `${SAIDA}/a11y-v2.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.a11y_v2': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Boca'))?.click(); });
  await p2.waitForTimeout(700);
  ok(await p2.locator('.avst-grade[data-a11y]').count() === 0, 'flag off com data-a11y (§651)');
  const par = await p2.evaluate(() => {
    const cards = [...document.querySelectorAll('.avst-grade .avst-card')];
    return { t0: cards[0]?.tabIndex, t1: cards[1]?.tabIndex };
  });
  ok(par.t1 === 0 || par.t1 === undefined, `flag off deveria manter todos focáveis sem roving (${JSON.stringify(par)})`);
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('a11y-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
