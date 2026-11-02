// conferir-pares-ts-js.cjs — receita (P1-01, Etapa 3): todo par .ts/.js VERSIONADO fora de dist/ tem de ser a transpilação
// exata do .ts (esbuild 0.21.5, loader=ts, format=esm, target=es2022, sourcefile = caminho do .ts). Exceções: os pares mantidos
// à mão listados em docs/P1-01/pares-ts-js-manuais.lst. Falha (exit 1) se alguém mudou o .ts sem regenerar o .js, ou vice-versa.
// Uso: node scripts/build/conferir-pares-ts-js.cjs <RAIZ>
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const RAIZ = path.resolve(process.argv[2] || '');
if (!process.argv[2] || RAIZ === '/var/www/dshowdash') { console.error('uso: conferir-pares-ts-js.cjs <RAIZ de um clone>'); process.exit(2); }
const es = require(path.join(RAIZ, 'public/react/node_modules/esbuild'));
const manuais = new Set(fs.readFileSync(path.join(RAIZ, 'docs/P1-01/pares-ts-js-manuais.lst'), 'utf8').split('\n').filter(Boolean));
const rastreados = cp.execFileSync('git', ['-C', RAIZ, '-c', 'core.quotepath=off', 'ls-files', 'public'], { maxBuffer: 64 << 20 }).toString().split('\n');
const set = new Set(rastreados); let ok = 0; const ruins = [];
for (const js of rastreados) {
  if (!js.endsWith('.js') || js.includes('/dist/') || manuais.has(js)) continue;
  const ts = js.slice(0, -3) + '.ts'; if (!set.has(ts)) continue;
  const out = es.transformSync(fs.readFileSync(path.join(RAIZ, ts), 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022', sourcefile: ts }).code;
  if (out === fs.readFileSync(path.join(RAIZ, js), 'utf8')) ok++; else ruins.push(js);
}
for (const r of ruins.slice(0, 20)) console.error('fora de sincronia: ' + r);
console.log(`pares .ts/.js conferidos: ${ok} em sincronia · ${ruins.length} fora · ${manuais.size} manuais (exceção)`);
process.exit(ruins.length ? 1 : 0);
