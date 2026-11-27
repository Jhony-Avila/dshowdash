// parte de tela do teste do lote 1: roda os formatters REAIS dos cards sobre a saída do registro (argumento: arquivo JSON)
import { readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const s = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const fmt = { '05': 'formatNumber', '06': 'formatNumber', '07': 'formatNumber', '09': 'formatNumber', '11': 'formatDuration' };
const esperado = { '05': '2', '06': '1', '07': '6', '09': '5', '11': '46s' };
const erros = [];
for (const c of Object.keys(fmt)) {
  const m = await import(pathToFileURL(`${RAIZ}/public/components/cards/card-${c}/utils/formatters.js`).href);
  const v = m[fmt[c]](Object.values(m.parseApiData({ ok: true, data: s[c] }))[0]);
  if (v !== esperado[c]) erros.push(`${c}: ${v}`);
}
const m11 = await import(pathToFileURL(`${RAIZ}/public/components/cards/card-11/utils/formatters.js`).href);
const v11 = m11.formatDuration(m11.parseApiData({ ok: true, data: s['11v'] }).averageTime);
if (v11 !== '--') erros.push(`11 sem base: ${v11}`);
console.log(erros.length ? erros.join(' | ') : 'OK');
