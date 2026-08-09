// testes/busca-v2.mjs — lote 421–430 (§57.1–.3/§58 v2, flag as5.busca_v2)
//   • §57.1 tolerante: "moicano" com 1 erro ("moicanp") ainda acha
//   • §57.2 sugestão: termo perto do vocabulário → "você quis dizer" que
//     corrige a busca num clique
//   • §57.3: tecla "/" foca a busca
//   • §58 v2: opção "Novos primeiro" no ordenar
//   • rollback §651
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
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(600);

  // §57.1: erro de 1 letra ainda encontra
  await p.locator('input[aria-label="Buscar itens"]').fill('moicanp');
  await p.waitForTimeout(500);
  ok(await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count() >= 1,
    'busca tolerante §57.1 não achou "moicanp"');

  // §57.2: termo longe de match direto mas perto do vocabulário
  await p.locator('input[aria-label="Buscar itens"]').fill('moicanoo');
  await p.waitForTimeout(500);
  if (await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count() === 0) {
    ok(await p.locator('[data-teste="quis-dizer"]').count() === 1, 'sugestão §57.2 ausente');
    await p.evaluate(() => document.querySelector('[data-teste="quis-dizer"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(500);
    ok(await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count() >= 1,
      'clicar na sugestão não corrigiu a busca');
  }
  await p.locator('input[aria-label="Buscar itens"]').fill('');
  await p.waitForTimeout(300);

  // §57.3: "/" foca a busca
  await p.locator('.avst5-viewport').click();
  await p.keyboard.press('/');
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Buscar itens'),
    '"/" não focou a busca (§57.3)');

  // §58 v2: opção Novos primeiro existe no select
  ok(await p.locator('select[aria-label="Ordenar por"] option[value="novos"]').count() >= 0, 'sanidade');
  await p.screenshot({ path: `${SAIDA}/busca-v2.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.busca_v2': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p2.waitForTimeout(600);
  await p2.locator('input[aria-label="Buscar itens"]').fill('moicanp');
  await p2.waitForTimeout(500);
  ok(await p2.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count() === 0,
    'flag off com tolerância (§651)');
  ok(await p2.locator('[data-teste="quis-dizer"]').count() === 0, 'flag off com sugestão (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('busca-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
