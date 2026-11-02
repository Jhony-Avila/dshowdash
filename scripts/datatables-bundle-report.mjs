// scripts/datatables-bundle-report.mjs — relatorio REAL de bundle (§ Fase 1).
// @version 1.0.0  @created 2026-07-20
// Mede o que e servido: tamanho bruto e gzip por chunk, separando carga INICIAL
// de carga SOB DEMANDA. Estimativa nao decide arquitetura; medicao decide.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const DIST = '/var/www/dshowdash/public/components/panels/panel-datatables/dist';
const mf = JSON.parse(readFileSync(join(DIST, '.vite/manifest.json'), 'utf8'));

function listar(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '.vite') out.push(...listar(p)); }
    else out.push(p);
  }
  return out;
}

const arquivos = listar(DIST).filter((f) => /\.(js|css)$/.test(f));
const info = arquivos.map((f) => {
  const buf = readFileSync(f);
  return { nome: relative(DIST, f), bruto: buf.length, gz: gzipSync(buf).length };
});

// Fecho transitivo do entry = carga INICIAL.
const chaveEntry = Object.keys(mf).find((k) => k.endsWith('src/entry.tsx'));
const inicial = new Set();
(function visitar(k) {
  if (!k || inicial.has(k)) return;
  inicial.add(k);
  const r = mf[k]; if (!r) return;
  (r.imports || []).forEach(visitar);
})(chaveEntry);

const arquivosIniciais = new Set();
for (const k of inicial) {
  const r = mf[k]; if (!r) continue;
  if (r.file) arquivosIniciais.add(r.file);
  (r.css || []).forEach((c) => arquivosIniciais.add(c));
}

const noInicial = info.filter((i) => arquivosIniciais.has(i.nome));
const sobDemanda = info.filter((i) => !arquivosIniciais.has(i.nome));
const soma = (l, c) => l.reduce((a, x) => a + x[c], 0);
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' kB';

console.log('═'.repeat(64));
console.log('  DATATABLES — RELATÓRIO DE BUNDLE (medido)');
console.log('═'.repeat(64));

console.log('\n── CARGA INICIAL (baixada ao abrir o painel) ──');
noInicial.sort((a, b) => b.gz - a.gz)
  .forEach((i) => console.log(`  ${kb(i.bruto)} │ ${kb(i.gz)} gz │ ${i.nome}`));
console.log(`  ${'─'.repeat(52)}`);
console.log(`  ${kb(soma(noInicial, 'bruto'))} │ ${kb(soma(noInicial, 'gz'))} gz │ TOTAL INICIAL`);

console.log('\n── SOB DEMANDA (só quando a rota é aberta) ──');
if (!sobDemanda.length) console.log('  (nenhum)');
sobDemanda.sort((a, b) => b.gz - a.gz)
  .forEach((i) => console.log(`  ${kb(i.bruto)} │ ${kb(i.gz)} gz │ ${i.nome}`));
if (sobDemanda.length) {
  console.log(`  ${'─'.repeat(52)}`);
  console.log(`  ${kb(soma(sobDemanda, 'bruto'))} │ ${kb(soma(sobDemanda, 'gz'))} gz │ TOTAL LAZY`);
}

console.log('\n── DEPENDÊNCIAS MAIS PESADAS ──');
const pesados = info.filter((i) => /vendor/.test(i.nome)).sort((a, b) => b.gz - a.gz);
pesados.forEach((i) => {
  const pct = ((i.gz / soma(info, 'gz')) * 100).toFixed(0);
  console.log(`  ${kb(i.gz)} gz  (${pct.padStart(2)}% do total)  ${i.nome}`);
});

const META = 150 * 1024;
const gzInicial = soma(noInicial, 'gz');
console.log('\n── VEREDITO ──');
console.log(`  meta da Fase 1 : ${kb(META)} gz (carga inicial)`);
console.log(`  medido         : ${kb(gzInicial)} gz`);
console.log(`  situação       : ${gzInicial <= META ? 'DENTRO da meta' : 'ACIMA da meta'} `
          + `(${((gzInicial / META) * 100).toFixed(0)}%)`);
console.log('\n  Ainda não entraram: TanStack Table, ECharts e React Flow —');
console.log('  todos previstos como carga SOB DEMANDA, não inicial.');
console.log('═'.repeat(64));
