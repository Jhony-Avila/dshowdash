// testes/i18n-catalogo.mjs — lote 511–520 (§296): i18n do CATÁLOGO.
//   • PT canônico intocado (abas/busca/ordenar em PT por padrão)
//   • EN: abas viram All/Equipped/Favorites/New/Locked; busca e ordenar
//     traduzem; chips §157 traduzem
//   • rollback: as5.i18n off força PT mesmo com EN salvo
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
  const abas = () => p.evaluate(() => [...document.querySelectorAll('.avst5-abas button')].map((x) => x.textContent.trim()).join(','));
  ok((await abas()).startsWith('Todos,Equipados,Favoritos'), `PT canônico das abas mudou: ${await abas()}`);
  // EN ao vivo
  await p.locator('[data-teste="idioma-toggle"]').click();
  await p.waitForTimeout(400);
  ok((await abas()).startsWith('All,Equipped,Favorites'), `abas não traduziram: ${await abas()}`);
  ok(await p.evaluate(() => document.querySelector('input[type="search"]')?.placeholder.includes('Search')),
    'busca não traduziu');
  // ordenar
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
  await p.waitForTimeout(500);
  ok((await p.locator('[data-teste="fx-funcional"]').textContent())?.includes('Distortion'),
    'chips §157 não traduziram');
  await p.screenshot({ path: `${SAIDA}/i18n-catalogo.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.i18n': false }));
    localStorage.setItem('dshow.avst5.idioma.v1', 'en');
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  const abas2 = await p2.evaluate(() => [...document.querySelectorAll('.avst5-abas button')].map((x) => x.textContent.trim()).join(','));
  ok(abas2.startsWith('Todos,Equipados'), `flag off deveria forçar PT (§651): ${abas2}`);
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('i18n-catalogo', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
