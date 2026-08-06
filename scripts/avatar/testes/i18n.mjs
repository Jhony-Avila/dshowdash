// testes/i18n.mjs — lote 411–420 (§296, flag as5.i18n): fundação i18n.
//   • PT canônico: padrão idêntico ao de sempre (Apresentar em PT)
//   • toggle EN → superfícies do topo trocam AO VIVO (sem reload) e a
//     preferência persiste; voltar a PT restaura
//   • rollback §651: flag off = sem seletor e t() devolve PT
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
  // padrão PT intocado
  ok(await p.locator('button', { hasText: 'Apresentar' }).count() >= 1, 'PT canônico sumiu');
  ok(await p.locator('[data-teste="idioma-toggle"]').count() === 1, 'seletor de idioma ausente (§296)');
  // EN ao vivo
  await p.locator('[data-teste="idioma-toggle"]').click();
  await p.waitForTimeout(400);
  ok(await p.locator('button', { hasText: 'Present' }).count() >= 1, 'EN não aplicou ao vivo (§296)');
  ok(await p.evaluate(() => localStorage.getItem('dshow.avst5.idioma.v1')) === 'en', 'idioma não persistiu');
  // reload mantém EN
  await irParaHarness(p, 'avst-harness.html', 1200);
  ok(await p.locator('button', { hasText: 'Present' }).count() >= 1, 'EN não sobreviveu ao reload');
  // volta a PT
  await p.locator('[data-teste="idioma-toggle"]').click();
  await p.waitForTimeout(400);
  ok(await p.locator('button', { hasText: 'Apresentar' }).count() >= 1, 'voltar a PT falhou');
  await p.screenshot({ path: `${SAIDA}/i18n.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.i18n': false }));
    localStorage.setItem('dshow.avst5.idioma.v1', 'en'); // mesmo com EN salvo…
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  ok(await p2.locator('[data-teste="idioma-toggle"]').count() === 0, 'flag off com seletor (§651)');
  ok(await p2.locator('button', { hasText: 'Apresentar' }).count() >= 1, 'flag off deveria forçar PT (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('i18n', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
