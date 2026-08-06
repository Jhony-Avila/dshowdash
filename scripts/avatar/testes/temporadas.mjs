// testes/temporadas.mjs — lote 361–370 (§245/§248/§251/§252, flag
// as5.temporadas): temporadas/desafios/recordes/diário LOCAIS.
//   1. CONTRATO node: temporada derivada do mês (determinística);
//      desafios da semana determinísticos (mesma semana = mesmos 3, sem
//      duplicata); recorde nunca diminui.
//   2. UI (clássico, aba Conquistas): bloco da temporada + desafios com
//      progresso real dos contadores + recordes; rollback §651.
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

const dir = mkdtempSync(join(tmpdir(), 'avst-temp-'));
writeFileSync(join(dir, 'entrada.ts'), `
export { temporadaAtual, desafiosDaSemana, semanaIso } from '${PAINEL}/src/services/Temporadas';
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(dir, 'entrada.ts')}" --bundle --format=esm --platform=neutral ` +
  `--outfile="${join(dir, 'bundle.mjs')}"`, { stdio: 'inherit' });
try {
  // localStorage não existe em node — os serviços degradam p/ vazio (try/catch)
  const api = await import(pathToFileURL(join(dir, 'bundle.mjs')).href);
  ok(api.temporadaAtual(new Date('2026-02-10')).id === 'aurora', 'fev deveria ser Aurora (§248)');
  ok(api.temporadaAtual(new Date('2026-08-10')).id === 'neon', 'ago deveria ser Neon (§248)');
  ok(api.temporadaAtual(new Date('2026-11-10')).id === 'lenda', 'nov deveria ser Lenda (§248)');
  const d1 = api.desafiosDaSemana(new Date('2026-08-05'));
  const d2 = api.desafiosDaSemana(new Date('2026-08-06')); // mesma semana ISO
  ok(JSON.stringify(d1.map((x) => x.id)) === JSON.stringify(d2.map((x) => x.id)),
    'mesma semana deveria dar os MESMOS desafios (§251)');
  const d3 = api.desafiosDaSemana(new Date('2026-08-12')); // semana seguinte
  ok(JSON.stringify(d1.map((x) => x.id)) !== JSON.stringify(d3.map((x) => x.id)),
    'semana seguinte deveria trocar os desafios (§251)');
  ok(new Set(d1.map((x) => x.id)).size === d1.length, 'desafios duplicados na semana');
  ok(d1.every((x) => x.alvo > 0 && x.atual >= 0 && ['studio', 'colecao', 'social', 'dshow'].includes(x.tipo)),
    'shape dos desafios inválido (§216/§251)');
} catch (e) {
  falhas.push(`exceção no contrato: ${e.message}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// UI (clássico) — contadores semeados p/ progresso real
const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst5.contadores.v1', JSON.stringify({ poderes: 5, capturas: 1, apresentacoes: 2 }));
  },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p.waitForSelector('[data-teste="temporada"]', { timeout: 15000 });
  ok((await p.locator('[data-teste="temporada-nome"]').textContent())?.includes('Temporada'),
    'nome da temporada ausente (§248)');
  ok(await p.locator('[data-teste="desafio"]').count() === 3, 'esperava 3 desafios (§251)');
  ok(await p.locator('[data-teste="recordes"]').count() === 1, 'recordes ausentes (§252)');
  ok((await p.locator('[data-teste="recordes"]').textContent())?.includes('5'),
    'recorde de poderes (5) não refletiu os contadores');
  // recorde persiste e NUNCA diminui: zera contadores → recorde continua 5
  await p.evaluate(() => localStorage.setItem('dshow.avst5.contadores.v1', '{}'));
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Avatar')?.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p.waitForSelector('[data-teste="recordes"]', { timeout: 15000 });
  ok((await p.locator('[data-teste="recordes"]').textContent())?.includes('5'),
    'recorde diminuiu — viola §252/§634');
  await p.screenshot({ path: `${SAIDA}/temporadas.png` });
} catch (e) {
  falhas.push(`exceção na UI: ${e.message}`);
}
await b.close();

// rollback §651
const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
      'as5.novo_shell': false, 'as5.palco3d': false, 'as5.temporadas': false,
    }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Conquistas')?.click(); });
  await p2.waitForSelector('[data-teste="perfil-progresso"]', { timeout: 15000 });
  ok(await p2.locator('[data-teste="temporada"]').count() === 0, 'flag off com temporada (§651)');
} catch (e) {
  falhas.push(`exceção no rollback: ${e.message}`);
}

const ok_ = relatorio('temporadas', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
