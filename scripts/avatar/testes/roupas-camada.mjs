// testes/roupas-camada.mjs — lote 551–560 (§72.1/§72.3/§74, flag
// as5.roupas_camada): CONJUNTOS.
//   • aplicar conjunto troca roupa + acessório + paleta DE UMA VEZ
//   • §72.3: slot bloqueado é PRESERVADO (aplicação parcial) e o anúncio
//     aria-live conta o que substituiu/preservou
//   • rollback §651
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
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Roupa'))?.click(); });
  await p.waitForTimeout(600);
  ok(await p.locator('[data-teste="conjuntos"]').count() === 1, 'linha de conjuntos ausente (§72.1)');
  // aplica o conjunto GAMER → roupa + headset + paleta cyber num clique
  await p.evaluate(() => document.querySelector('[data-teste="conjunto-cj_gamer"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(600);
  const svg = await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');
  ok(svg.includes('4cd9e8'), 'paleta do conjunto não aplicou (§74)');
  // §72.3: BLOQUEIA o slot da roupa → outro conjunto preserva a roupa
  await p.evaluate(() => localStorage.setItem('dshow.avst5.bloqueios.v1', JSON.stringify(['roupa'])));
  await p.evaluate(() => document.querySelector('[data-teste="conjunto-cj_gala"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(600);
  const anuncio = await p.evaluate(() => document.querySelector('.avst5-anuncio')?.textContent ?? '');
  ok(anuncio.includes('preservou'), `anúncio §72.3 não citou a preservação: "${anuncio}"`);
  await p.screenshot({ path: `${SAIDA}/roupas-camada.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.roupas_camada': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Roupa'))?.click(); });
  await p2.waitForTimeout(600);
  ok(await p2.locator('[data-teste="conjuntos"]').count() === 0, 'flag off com conjuntos (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('roupas-camada', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
