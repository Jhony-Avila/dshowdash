// _ts.mjs — Track D onda 3.2 (#D-m33): importa um módulo .ts em QUALQUER Node ≥18,
// transpilando com esbuild em tempo de teste (loader ts, só type-strip). Remove a
// dependência de `--experimental-strip-types` (que só existe no Node 22+ e falhou no
// servidor Node 20). Resolve esbuild por env/node_modules/fallback.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function loadEsbuild() {
  const tentativas = [
    process.env.ESBUILD_PATH,
    'esbuild',
    new URL('../../../node_modules/esbuild/lib/main.js', import.meta.url).href,
    new URL('../../../public/react/node_modules/esbuild/lib/main.js', import.meta.url).href,
    '/tmp/testdeps/node_modules/esbuild/lib/main.js',
  ].filter(Boolean);
  for (const t of tentativas) { try { const m = await import(t); return m.default || m; } catch { /* próxima */ } }
  return null;
}

/** Transpila `srcCode` (TS) → JS e devolve o caminho de um .js temporário.
 *  Se `srcCode` não for passado, lê de `fileUrl`. Mantém o basename p/ imports relativos. */
export async function transpileTsToTemp(fileUrl, srcCode) {
  const esbuild = await loadEsbuild();
  const abs = fileURLToPath(fileUrl);
  const code = srcCode != null ? srcCode : readFileSync(abs, 'utf8');
  if (!esbuild) {
    // sem esbuild: tenta type-strip nativo (Node 22+); senão, falha explícita.
    throw new Error('esbuild não encontrado (instale: npm i esbuild, ou defina ESBUILD_PATH). Necessário para rodar testes .ts em Node < 22.');
  }
  const out = await esbuild.transform(code, { loader: 'ts', format: 'esm', target: 'es2020', sourcemap: false });
  const dir = mkdtempSync(join(tmpdir(), 'ts-'));
  const tmp = join(dir, basename(abs).replace(/\.ts$/, '') + '.mjs');
  writeFileSync(tmp, out.code);
  return tmp;
}

/** Importa um módulo .ts (por URL) de forma portátil (qualquer Node ≥18). */
export async function importTs(fileUrl, srcCode) {
  const tmp = await transpileTsToTemp(fileUrl, srcCode);
  return import(pathToFileURL(tmp).href);
}
