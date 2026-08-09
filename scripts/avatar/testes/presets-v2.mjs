// testes/presets-v2.mjs — lote 341–350 (§200–§205, flag as5.presets_v2):
// presets v2 no SHELL (aba Presets): inteligente §205 vira preset de
// verdade; atualizar §202 sobe a versão e cria snapshot §204; card rico
// §201 mostra vN; snapshot aplica o config anterior; rollback §651.
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p.waitForSelector('.avst5-presets', { timeout: 8000 });

  // §205: preset inteligente
  ok(await p.locator('[data-teste="preset-inteligente"]').count() === 1, 'botão §205 ausente');
  await p.locator('[data-teste="preset-inteligente"]').click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="preset"]').count() >= 1, 'preset inteligente não foi criado (§205)');
  ok((await p.locator('.avst5-presets-lista').textContent())?.includes('Inteligente'),
    'preset §205 sem o nome esperado');

  // §202: atualizar → v2 no card; §204: snapshot aparece
  await p.locator('[data-teste="preset-atualizar"]').first().click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="preset-versao"]').count() >= 1, 'versão §202 não apareceu no card');
  ok((await p.locator('[data-teste="preset-versao"]').first().textContent())?.includes('v2'),
    'atualizar não subiu para v2');
  ok(await p.locator('[data-teste="preset-snapshot"]').count() >= 1, 'snapshot §204 ausente');
  await p.locator('[data-teste="preset-snapshot"]').first().click();
  await p.waitForTimeout(400);
  const bruto = await p.evaluate(() => localStorage.getItem('dshow.avst5.presets.v1') ?? '[]');
  ok(bruto.includes('"versao":2') && bruto.includes('"historico"'), 'versão/histórico não persistiram');
  await p.screenshot({ path: `${SAIDA}/presets-v2.png` });
} catch (e) {
  falhas.push(`exceção: ${e.message}`);
}
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.presets_v2': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p2.waitForSelector('.avst5-presets', { timeout: 8000 });
  ok(await p2.locator('[data-teste="preset-inteligente"]').count() === 0, 'flag off com §205 (§651)');
  ok(await p2.locator('[data-teste="preset-atualizar"]').count() === 0, 'flag off com atualizar (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('presets-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
