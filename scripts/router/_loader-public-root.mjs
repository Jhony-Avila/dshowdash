// scripts/router/_loader-public-root.mjs — hook de resolução p/ rodar módulos do front em Node: especificadores
// absolutos do navegador ('/core/…', '/components/…') resolvem para public/<caminho> (document root do nginx).
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import { existsSync } from 'node:fs';
// 1º o public/ do worktree; 2º o document root servido (artefatos gitignored: core/runtime, dist/…) — só leitura
const ROOTS = [resolvePath(process.cwd(), 'public'), process.env.PUBLIC_FALLBACK || '/var/www/dshowdash/public'];
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('/') && !specifier.startsWith('//')) {
    const hit = ROOTS.map((r) => resolvePath(r, '.' + specifier)).find((f) => existsSync(f)) || resolvePath(ROOTS[0], '.' + specifier);
    return next(pathToFileURL(hit).href, context);
  }
  return next(specifier, context);
}
