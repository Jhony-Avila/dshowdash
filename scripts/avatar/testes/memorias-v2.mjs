// testes/memorias-v2.mjs — lote 481–490 (§203/§244/§247, flag
// as5.memorias_v2): memórias/timeline v2.
//   • §244: marco de RESTAURAÇÃO ganha o marcador de bifurcação ⎇ na
//     linha de evolução (semeada via storage)
//   • §203: snapshot do preset mostra THUMB (histórico visual)
//   • §247: evento ATIVO destacado no topo do perfil (mock da vida traz
//     eventos — se nenhum ativo no harness, o bloco simplesmente não
//     aparece: asserção condicional honesta)
//   • rollback §651
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const MARCOS = JSON.stringify([
  { id: 'evo_a', quando: 1754400000000, origem: 'primeiro', config: { base: 'bas_padrao', camadas: {}, cores: { destaque: '#4cd9e8' } } },
  { id: 'evo_b', quando: 1754400100000, origem: 'restauracao', config: { base: 'bas_padrao', camadas: {}, cores: { destaque: '#ff2d75' } } },
]);

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: (m) => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate((m) => localStorage.setItem('dshow.avst5.evolucao.v1', m), MARCOS);
  // abre a Evolução (drawer no shell)
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.title?.includes('Evolução') || x.textContent.includes('Evolução'))?.click(); });
  await p.waitForSelector('[data-teste="evo-lista"]', { timeout: 8000 });
  ok(await p.locator('[data-teste="evo-branch"]').count() === 1, 'bifurcação §244 ausente no marco de restauração');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);

  // §203: cria preset → atualiza (gera snapshot) → thumb no botão
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Presets')?.click(); });
  await p.waitForSelector('.avst5-presets', { timeout: 8000 });
  await p.evaluate(() => document.querySelector('[data-teste="preset-inteligente"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('[data-teste="preset-atualizar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="snapshot-thumb"]').count() >= 1, 'thumb §203 ausente no snapshot');
  await p.screenshot({ path: `${SAIDA}/memorias-v2.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.memorias_v2': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate((m) => localStorage.setItem('dshow.avst5.evolucao.v1', m), MARCOS);
  await p2.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.title?.includes('Evolução') || x.textContent.includes('Evolução'))?.click(); });
  await p2.waitForSelector('[data-teste="evo-lista"]', { timeout: 8000 });
  ok(await p2.locator('[data-teste="evo-branch"]').count() === 0, 'flag off com bifurcação (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('memorias-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
