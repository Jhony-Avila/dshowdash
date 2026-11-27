// teste-cards-integracao-value.mjs — MIG-001 INTEGRACAO (VINHO, 27/11): os cards 04–11 leem `value` (formatters.js da tela). Antes a API não mandava
// `value` → a tela mostrava SEMPRE 0 (05–11) ou "--" (04). Prova com os formatters REAIS da tela: sem `value` = 0 (o defeito); com o número = o número;
// com null (média sem base) = "--", nunca 0. E cada api.php dos cards 04–11 passa a enviar `value`.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let ok = 0; const falhas = [];
const ck = (n, c, i = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas.push(n); console.log('FALHA ' + n + (i ? ' · ' + i : '')); } };
const cards = { '05': ['formatNumber', 'count', 'completed', 7], '06': ['formatNumber', 'count', 'failed', 3], '07': ['formatNumber', 'running', 'active', 12],
  '08': ['formatDecimal', 'averagePerHour', 'average_per_hour', 4.5], '09': ['formatNumber', 'count', 'total', 40], '10': ['formatPercent', 'performanceScore', 'performance_score', 87],
  '11': ['formatDuration', 'averageTime', 'average_time', 75] };
for (const [c, [fmt, , campo, v]] of Object.entries(cards)) {
  const m = await import(pathToFileURL(`${RAIZ}/public/components/cards/card-${c}/utils/formatters.js`).href);
  const show = (payload) => { const p = m.parseApiData(payload); return m[fmt](Object.values(p)[0]); };
  const antes = show({ ok: true, data: { [campo]: v } });          // a resposta ANTIGA (sem value)
  const depois = show({ ok: true, data: { value: v, [campo]: v } });
  const nulo = show({ ok: true, data: { value: null, [campo]: null } });
  ck(`card-${c}: antes mostrava ${JSON.stringify(antes)} (o defeito); agora mostra ${JSON.stringify(depois)}; sem base mostra ${JSON.stringify(nulo)}`,
    /^0(\.0)?%?s?$|^0,0$/.test(String(antes)) && depois !== antes && nulo === '--', JSON.stringify({ antes, depois, nulo }));
}
const m4 = await import(pathToFileURL(`${RAIZ}/public/components/cards/card-04/utils/formatters.js`).href);
const fmt4 = Object.keys(m4).find((k) => k.startsWith('format'));
ck('card-04: antes "--" (lia details/value, a API mandava peak_hour solto); agora a hora do pico; sem dado "--"',
  m4[fmt4](m4.parseApiData({ data: { peak_hour: '14:00' } }).peakHour) === '--' && m4[fmt4](m4.parseApiData({ data: { value: '14:00', details: { peak_hour: '14:00' } } }).peakHour) === '14:00'
  && m4[fmt4](m4.parseApiData({ data: { value: null, details: { peak_hour: null } } }).peakHour) === '--');
for (const c of ['04', '05', '06', '07', '08', '09', '10', '11']) {
  const php = readFileSync(`${RAIZ}/api/modules/cards/card-${c}/api.php`, 'utf8');
  ck(`card-${c}/api.php envia 'value'`, php.includes("'value' =>"));
}
const p10 = readFileSync(`${RAIZ}/api/modules/cards/card-10/api.php`, 'utf8'); const p11 = readFileSync(`${RAIZ}/api/modules/cards/card-11/api.php`, 'utf8');
ck('cards 10 e 11: média sem base (AVG NULL) vira null, não 0', p10.includes("$score = $semBase ? null") && p11.includes("'value' => $semBase ? null"));
console.log(`teste-cards-integracao-value: ${ok} ok, ${falhas.length} falha(s)`); process.exit(falhas.length ? 1 : 0);
