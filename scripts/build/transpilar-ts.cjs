// transpilar-ts.cjs — passo esbuild da receita (P1-01, Etapa 3). Para cada <arquivo>.js da lista,
// transpila o <arquivo>.ts irmão com o esbuild de public/react (0.21.5): loader=ts, format=esm,
// target=es2022, SEM bundle. Reproduz byte a byte os 624 .js servidos (prova: Etapa 3, Bloco 1.4).
// Uso: node scripts/build/transpilar-ts.cjs <RAIZ> [lista=docs/P1-01/transpile.lst]
'use strict';
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(process.argv[2] || '');
if (!process.argv[2] || RAIZ === '/var/www/dshowdash') { console.error('uso: transpilar-ts.cjs <RAIZ de um clone> — nunca a produção'); process.exit(2); }
const lista = process.argv[3] || path.join(RAIZ, 'docs/P1-01/transpile.lst');
const esbuild = require(path.join(RAIZ, 'public/react/node_modules/esbuild'));
if (esbuild.version !== '0.21.5') { console.error('esbuild inesperado: ' + esbuild.version + ' (a receita exige 0.21.5)'); process.exit(3); }
let n = 0, falhas = 0;
for (const rel of fs.readFileSync(lista, 'utf8').split('\n').filter(Boolean)) {
  const ts = path.join(RAIZ, rel.replace(/\.js$/, '.ts')), js = path.join(RAIZ, rel);
  if (!fs.existsSync(ts)) { console.error('sem .ts: ' + rel); falhas++; continue; }
  const out = esbuild.transformSync(fs.readFileSync(ts, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022', sourcefile: ts }).code;
  fs.writeFileSync(js, out); n++;
}
console.log('transpilados: ' + n + ' · falhas: ' + falhas);
process.exit(falhas ? 1 : 0);
