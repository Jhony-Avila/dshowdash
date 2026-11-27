// parte de tela do teste do lote 2: formatters REAIS dos cards 02, 03, 04, 08, 10 sobre a saída do registro (argumento: arquivo JSON)
import { readFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { cheio, vazio } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const fmt = { '02': 'formatPercent', '03': 'formatScore', '04': 'formatHour', '08': 'formatDecimal', '10': 'formatPercent' };
const esperado = { '02': '50%', '04': '10:00', '10': '51.0%' };
const erros = [];
for (const c of Object.keys(fmt)) {
  const m = await import(pathToFileURL(`${RAIZ}/public/components/cards/card-${c}/utils/formatters.js`).href);
  const ver = (d) => m[fmt[c]](Object.values(m.parseApiData({ ok: true, data: d }))[0]);
  const a = ver(cheio[c]); const b = ver(vazio[c]);
  if (esperado[c] && a !== esperado[c]) erros.push(`${c} cheio: ${a}`);
  if (a === '--' || /^0([.,]0)?%?$/.test(String(a))) erros.push(`${c} cheio sem número: ${a}`);
  if (b !== '--') erros.push(`${c} vazio: ${b}`);
}
console.log(erros.length ? erros.join(' | ') : 'OK');
