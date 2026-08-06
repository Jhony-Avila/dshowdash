// testes/foto-entrada.mjs — lote 531–540 (§321.1–.2, flag as5.foto_entrada)
//   • 'Usar meu avatar' entra no funil de recorte SEM upload; Estilizar
//     rende o preview normal (§321.1)
//   • 'De um preset…' idem via preset salvo (§321.2) — semeado no storage
//   • rollback §651: sem os controles novos
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const PRESET = JSON.stringify([{
  id: 'pp_teste', nome: 'Look Teste', tags: [], favorito: false,
  criadoEm: '2026-08-06T00:00:00.000Z', renderizador: '2d',
  config: { base: 'bas_padrao', camadas: {}, cores: { destaque: '#ff2d75' } },
}]);

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: (pz) => { localStorage.setItem('dshow.avst5.presets.v1', pz); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate((pz) => localStorage.setItem('dshow.avst5.presets.v1', pz), PRESET);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);

  // §321.1: avatar atual vira a foto
  ok(await p.locator('[data-teste="foto-do-avatar"]').count() === 1, 'botão Usar meu avatar ausente (§321.1)');
  await p.locator('[data-teste="foto-do-avatar"]').click();
  await p.waitForTimeout(800);
  ok(await p.locator('button', { hasText: 'Estilizar' }).count() >= 1, 'recorte não abriu a partir do avatar');
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(600);
  ok(await p.locator('.avst-ft-preview svg').count() === 1, 'estilização não rendeu a partir do avatar');
  await p.locator('button', { hasText: 'Cancelar' }).click();
  await p.waitForTimeout(400);

  // §321.2: preset → foto (recarrega a aba p/ o select ler os presets)
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Avatar')?.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="foto-de-preset"]').count() === 1, 'select de preset ausente (§321.2)');
  await p.locator('[data-teste="foto-de-preset"]').selectOption('pp_teste');
  await p.waitForTimeout(800);
  ok(await p.locator('button', { hasText: 'Estilizar' }).count() >= 1, 'recorte não abriu a partir do preset');
  await p.screenshot({ path: `${SAIDA}/foto-entrada.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': false, 'as5.palco3d': false, 'as5.foto_entrada': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p2.waitForTimeout(500);
  ok(await p2.locator('[data-teste="foto-do-avatar"]').count() === 0, 'flag off com Usar meu avatar (§651)');
  ok(await p2.locator('[data-teste="foto-de-preset"]').count() === 0, 'flag off com preset (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('foto-entrada', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
