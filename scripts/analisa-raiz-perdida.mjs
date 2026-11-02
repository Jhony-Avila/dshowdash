#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// analisa-raiz-perdida.mjs — a receita do detector 7/7 se aplica a este alvo?
// @created 2026-07-30
// ═══════════════════════════════════════════════════════════════
//
// POR QUE ISTO EXISTE
// `detect-circular-build.sh` acha os alvos com build circular e imprime a
// receita: "criar _entry.ts que reexporta as FONTES". A receita pressupoe que
// as fontes ainda exportem a API publica do bundle.
//
// No `footer` NAO exportam. `getFooterInstance`, `FOOTER_VERSION`,
// `FOOTER_LOCAL_EVENTS` e `getGuardsResult` nao existem em arquivo-fonte
// nenhum do projeto — so dentro do `dist/footer.bundle.js` minificado. A raiz
// de composicao se perdeu quando o `index.ts` virou
// `export * from './dist/footer.bundle.js'`.
//
// Consequencia: nesses alvos, quebrar a circularidade nao e "reexportar", e
// REESCREVER a API publica a partir do bundle minificado. Custo e risco
// completamente diferentes — e num componente que esta em todas as telas.
//
// Este script separa os dois casos antes de alguem comecar o trabalho errado.
//
// USO
//   node scripts/analisa-raiz-perdida.mjs            # todos os alvos da baseline
//   node scripts/analisa-raiz-perdida.mjs footer     # um alvo
//
// SAIDA: por alvo, quantos exports do bundle NAO tem declaracao em fonte.
//   0 perdidos  -> a receita PODE se aplicar (ainda exige conferir semantica)
//   >0 perdidos -> a receita NAO basta; ha API que so existe no bundle
//
// ⚠️ LIMITE CONHECIDO: "existe em fonte" e casamento por NOME. Nome igual nao
// prova que e a mesma funcao — `mount`/`destroy`/`clear` colidem em dezenas de
// modulos. Por isso "0 perdidos" e condicao NECESSARIA, nao suficiente:
// confirme lendo o corpo antes de confiar. Ja "perdido" e conclusivo no outro
// sentido: se o nome nao existe em lugar nenhum, nao ha o que reexportar.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = '/var/www/dshowdash';
const PUB = path.join(ROOT, 'public');
const BASELINE = path.join(ROOT, 'scripts/.circular-build-baseline.txt');
const CONFIGS = ['vite.lote3bc.config.js', 'components/vite.components.config.js'];
const IGNORAR_DIR = new Set(['dist', 'node_modules', '.git', 'react']);

/** Indice global: nome exportado -> primeiro arquivo-fonte que o declara. */
function indexarExports() {
  const idx = new Map();
  const anda = (d, prof = 0) => {
    if (prof > 9) return;
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (IGNORAR_DIR.has(e.name)) continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) { anda(f, prof + 1); continue; }
      if (!/\.(ts|js)$/.test(e.name)) continue;
      let s;
      try { s = readFileSync(f, 'utf8'); } catch { continue; }
      // Comentario nao e codigo: um .md/.ts que DOCUMENTA o simbolo nao o exporta.
      s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
      const rel = f.slice(PUB.length + 1);
      const guarda = (n) => { if (n && !idx.has(n)) idx.set(n, rel); };
      for (const m of s.matchAll(
        /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g))
        guarda(m[1]);
      for (const m of s.matchAll(/\bexport\s*\{([^}]*)\}/g))
        for (const p of m[1].split(','))
          guarda((p.includes(' as ') ? p.split(' as ')[1] : p).trim());
    }
  };
  anda(PUB);
  return idx;
}

/** alvo -> {outDir, fileName} lido das DUAS configs de build. */
function lerAlvos() {
  const txt = CONFIGS.map((f) => readFileSync(path.join(PUB, f), 'utf8')).join('\n');
  const meta = {};
  for (const m of txt.matchAll(/'?([\w-]+)'?:\s*\{([\s\S]*?)\n {2}\}/g)) {
    const g = (k) => (m[2].match(new RegExp(`${k}:\\s*'([^']+)'`)) || [])[1];
    if (g('entry')) meta[m[1]] = { outDir: g('outDir'), fileName: g('fileName') };
  }
  return meta;
}

/** Nomes na lista `export { ... }` final do bundle. */
function exportsDoBundle(p) {
  const s = readFileSync(p, 'utf8');
  const m = [...s.matchAll(/export\s*\{([^}]*)\}\s*;?\s*$/g)].pop();
  if (!m) return [];
  return m[1].split(',').map((x) => x.trim()).filter(Boolean)
    .map((x) => (x.includes(' as ') ? x.split(' as ')[1] : x).trim())
    .filter((x) => x && x !== 'default');
}

// ─── execucao ───
const filtro = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const idx = indexarExports();
const meta = lerAlvos();
const alvos = readFileSync(BASELINE, 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#'))
  .filter((a) => !filtro.length || filtro.includes(a));

console.log(`\n▸ RAIZ DE COMPOSICAO — a receita do 7/7 se aplica?`);
console.log(`  indice: ${idx.size} nomes exportados por fontes (fora de dist/)\n`);
console.log('  alvo                     exports  perdidos  so-no-bundle (amostra)');
console.log('  ' + '─'.repeat(88));

const linhas = [];
for (const a of alvos) {
  const m = meta[a];
  if (!m) { linhas.push({ a, t: '?', p: '?', q: 'alvo sem entrada nas configs' }); continue; }
  const b = path.join(PUB, m.outDir, m.fileName);
  if (!existsSync(b)) { linhas.push({ a, t: '?', p: '?', q: 'bundle ausente' }); continue; }
  const exps = exportsDoBundle(b);
  if (!exps.length) { linhas.push({ a, t: 0, p: 0, q: 'sem lista de export legivel' }); continue; }
  const perdidos = exps.filter((e) => !idx.has(e));
  linhas.push({ a, t: exps.length, p: perdidos.length, q: perdidos.slice(0, 5).join(', ') });
}

linhas.sort((x, y) => (Number(y.p) || 0) - (Number(x.p) || 0));
for (const l of linhas)
  console.log(`  ${l.a.padEnd(24)} ${String(l.t).padStart(6)}  ${String(l.p).padStart(8)}  ${l.q}`);

const comPerda = linhas.filter((l) => typeof l.p === 'number' && l.p > 0);
console.log(`\n  ${comPerda.length} alvo(s) tem API que so existe no bundle — a receita NAO basta neles.`);
console.log(`  ${linhas.length - comPerda.length} alvo(s) sem perda aparente (condicao necessaria, nao suficiente).`);
console.log(`\n  Lembrete: casamento por NOME. Confirme lendo o corpo antes de confiar no "0".\n`);
process.exit(0);
