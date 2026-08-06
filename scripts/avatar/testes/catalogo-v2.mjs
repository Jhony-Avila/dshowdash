// testes/catalogo-v2.mjs — lote 391–400 (§61/§75/§88/§92/§94, flag
// as5.catalogo_v2): polish do catálogo no SHELL.
//   • §88 recentes: equipar um item → chip "Recentes" aparece na
//     categoria e re-equipa num clique (ordem de recência persistida)
//   • §92 v2: busca sem resultado → botão "Limpar filtros e busca"
//   • §61/§75: [data-catv2] presente (CSS de raridade/sheen engatilha)
//   • rollback §651: nada disso com a flag off
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  ok(await p.locator('[data-catv2]').count() >= 1, 'data-catv2 ausente (§61/§75)');

  // §88: equipa um item → recentes aparecem
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(600);
  ok(await p.locator('[data-teste="recentes"]').count() === 0, 'recentes não podiam existir antes do 1º uso');
  await p.evaluate(() => {
    const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((c) => !c.className.includes('avst-card-nenhum') && !c.className.includes('avst-card-bloqueado'));
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="recentes"]').count() === 1, 'recentes §88 não apareceram após equipar');
  ok(await p.locator('[data-teste="recente-chip"]').count() >= 1, 'chip recente ausente');
  const persist = await p.evaluate(() => localStorage.getItem('dshow.avst5.recentes.v1') ?? '[]');
  ok(JSON.parse(persist).length >= 1, 'recência não persistiu (§94)');
  // re-equipar pelo chip não explode
  await p.evaluate(() => document.querySelector('[data-teste="recente-chip"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);

  // §92 v2: busca impossível → botão de limpar
  await p.locator('input[aria-label="Buscar itens"]').fill('zzz-nada-existe');
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="vazio-limpar"]').count() === 1, 'ação de limpar §92 ausente');
  await p.evaluate(() => document.querySelector('[data-teste="vazio-limpar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await p.locator('.avst5-painel .avst-card').count() > 1, 'limpar não devolveu a grade');
  await p.screenshot({ path: `${SAIDA}/catalogo-v2.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as5.catalogo_v2': false,
    }));
    localStorage.setItem('dshow.avst5.recentes.v1', JSON.stringify(['cab_moicano']));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  ok(await p2.locator('[data-catv2]').count() === 0, 'flag off com data-catv2 (§651)');
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p2.waitForTimeout(600);
  ok(await p2.locator('[data-teste="recentes"]').count() === 0, 'flag off com recentes (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('catalogo-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
