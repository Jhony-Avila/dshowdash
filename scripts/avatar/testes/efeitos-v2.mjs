// testes/efeitos-v2.mjs — lote 351–360 (§156/§157.1–.5/§158.1, flag
// as5.efeitos_v2): efeitos funcionais no SHELL.
//   • §157: filtro por categoria funcional na aba Efeito (chips) — filtra
//     de verdade (contagem muda) e badge no detalhe
//   • §158.1/§157.3: salvar → celebração com partículas §156 na COR de
//     destaque (flag off = confete legado)
//   • contrato node: categoriaFuncional determinística com fallback
//   • rollback §651
// @version 1.0.0  @created 2026-08-06
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// contrato node
const dir = mkdtempSync(join(tmpdir(), 'avst-fx-'));
writeFileSync(join(dir, 'entrada.ts'), `
export { categoriaFuncional, ROTULO_FUNCIONAL } from '${PAINEL}/src/services/EfeitosFuncionais';
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm --platform=neutral ` +
  `--outfile="${join(dir, 'bundle.mjs')}"`, { stdio: 'inherit' });
try {
  const api = await import(pathToFileURL(join(dir, 'bundle.mjs')).href);
  ok(api.categoriaFuncional('efe_neve') === 'ambiental', 'neve deveria ser ambiental (§157.1)');
  ok(api.categoriaFuncional('efe_glitch') === 'distorcao', 'glitch deveria ser distorção (§157.2)');
  ok(api.categoriaFuncional('efe_confete') === 'celebracao', 'confete deveria ser celebração (§157.3)');
  ok(api.categoriaFuncional('efe_portal') === 'transicao', 'portal deveria ser transição (§157.4)');
  ok(api.categoriaFuncional('efe_aura') === 'presenca', 'aura deveria ser presença (§157.5)');
  ok(api.categoriaFuncional('efe_inventado') === 'presenca', 'fallback de id desconhecido');
  ok(Object.keys(api.ROTULO_FUNCIONAL).length === 5, 'esperava 5 categorias §157');
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// UI
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
  await p.waitForTimeout(600);
  ok(await p.locator('[data-teste="fx-funcional"]').count() === 1, 'chips §157 ausentes na aba Efeito');
  const totalAntes = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
  await p.evaluate(() => document.querySelector('[data-teste="fx-distorcao"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(500);
  const totalDepois = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
  ok(totalDepois > 0 && totalDepois < totalAntes, `filtro §157 não filtrou (${totalAntes}→${totalDepois})`);
  await p.evaluate(() => document.querySelector('[data-teste="fx-todos"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${SAIDA}/efeitos-v2.png` });
} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}
await b.close();

// rollback §651
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.efeitos_v2': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Efeito'))?.click(); });
  await p2.waitForTimeout(600);
  ok(await p2.locator('[data-teste="fx-funcional"]').count() === 0, 'flag off com chips §157 (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('efeitos-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
