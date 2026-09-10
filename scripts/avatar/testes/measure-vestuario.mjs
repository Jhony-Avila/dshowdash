// testes/measure-vestuario.mjs — AUDITORIA GEOMÉTRICA (node, sem DOM) do vestuário.
// Mede a extensão vertical REAL do renderCorpo de cada peça no canvas de corpo
// (240×400) para classificar superior × conjunto pela REGIÃO efetivamente coberta
// (decisão do Jhony: geometria, nunca nome). Também mede distinção entre modelos e
// clipping do seed. Saída: JSON em argv[2].
//
// Uso: node measure-vestuario.mjs /tmp/cat_probe.mjs /tmp/vest-geo.json
import { writeFileSync } from 'node:fs';

const catPath = process.argv[2];
const outPath = process.argv[3] || '/tmp/vest-geo.json';
const C = await import(catPath);
const PARTES = C.PARTES || (C.default && C.default.PARTES);
const itemPorId = C.itemPorId || (C.default && C.default.itemPorId);

// Regiões do corpo (240×400): cintura≈250, coxa≈250-300, joelho≈300, canela≈330, pé≈340-380.
const Y_CINTURA = 250, Y_PE = 336;

// Paleta falsa completa (só cores; as funções de arte só interpolam strings).
const tom = (b) => ({ claro: '#a9b2c6', base: b, profundo: '#3b4252', escuro: '#2b303b', brilho: '#c9d2e6' });
const PAL = {
  pele: { claro: '#f0c090', base: '#e0ac69', escuro: '#b07a4e', profundo: '#8a5a35' },
  cabelo: tom('#6b4a2a'), roupa: tom('#5b6b8a'), destaque: { claro: '#9a7cff', base: '#7c5cff', profundo: '#5a3cdf', escuro: '#42308f', brilho: '#b9a7ff' },
  secundario: tom('#7a2d3c'), iris: '#4c9de8', barba: '#3d2b1f', sobrancelha: '#3d2b1f', labios: '#a05050',
};

// ── Parser de coordenadas Y de um atributo path `d` (abs + rel) ──────────
function extentY(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  let minY = Infinity, maxY = -Infinity;
  const num = () => parseFloat(toks[i++]);
  const mark = (y) => { if (isFinite(y)) { if (y < minY) minY = y; if (y > maxY) maxY = y; } };
  while (i < toks.length) {
    const t = toks[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++; } // novo comando
    const rel = cmd === cmd.toLowerCase();
    const C_ = cmd.toUpperCase();
    if (C_ === 'M' || C_ === 'L' || C_ === 'T') { const x = num(), y = num(); cx = rel ? cx + x : x; cy = rel ? cy + y : y; if (C_ === 'M') { sx = cx; sy = cy; } mark(cy); }
    else if (C_ === 'H') { const x = num(); cx = rel ? cx + x : x; }
    else if (C_ === 'V') { const y = num(); cy = rel ? cy + y : y; mark(cy); }
    else if (C_ === 'C') { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num(); mark(rel ? cy + y1 : y1); mark(rel ? cy + y2 : y2); cx = rel ? cx + x : x; cy = rel ? cy + y : y; mark(cy); }
    else if (C_ === 'S' || C_ === 'Q') { const x1 = num(), y1 = num(), x = num(), y = num(); mark(rel ? cy + y1 : y1); cx = rel ? cx + x : x; cy = rel ? cy + y : y; mark(cy); }
    else if (C_ === 'A') { num(); num(); num(); num(); num(); const x = num(), y = num(); cx = rel ? cx + x : x; cy = rel ? cy + y : y; mark(cy); }
    else if (C_ === 'Z') { cx = sx; cy = sy; }
    else { i++; } // desconhecido: avança
  }
  return { minY, maxY };
}

function medirSvg(svg) {
  const ds = [...svg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
  // também <rect y=.. height=..>, <ellipse cy=.. ry=..>, <circle cy=.. r=..>
  let minY = Infinity, maxY = -Infinity;
  for (const d of ds) { const e = extentY(d); if (e.maxY > maxY) maxY = e.maxY; if (e.minY < minY) minY = e.minY; }
  for (const m of svg.matchAll(/<rect\b[^>]*\by="(-?\d*\.?\d+)"[^>]*\bheight="(-?\d*\.?\d+)"/g)) { const y = +m[1], h = +m[2]; if (y < minY) minY = y; if (y + h > maxY) maxY = y + h; }
  for (const m of svg.matchAll(/<(?:ellipse|circle)\b[^>]*\bcy="(-?\d*\.?\d+)"[^>]*\br(?:y)?="(-?\d*\.?\d+)"/g)) { const cy = +m[1], r = +m[2]; if (cy - r < minY) minY = cy - r; if (cy + r > maxY) maxY = cy + r; }
  return { minY: isFinite(minY) ? +minY.toFixed(1) : null, maxY: isFinite(maxY) ? +maxY.toFixed(1) : null };
}

function renderCorpoDe(item) {
  if (!item || typeof item.renderCorpo !== 'function') return null;
  try { return item.renderCorpo(PAL, 'u'); } catch (e) { return `__ERRO__ ${e.message}`; }
}

// ── Classificação de roupa (superior) por cobertura ─────────────────────
const roupa = PARTES.filter((x) => x.categoria === 'roupa' && !/_hx_/.test(x.id));
const tabela = [];
const conjuntos = [];
for (const it of roupa) {
  const svg = renderCorpoDe(it);
  let cobertura = 'sem renderCorpo', maxY = null, decisao = 'superior', just = '';
  if (svg == null) { cobertura = 'sem renderCorpo (só busto)'; decisao = 'superior'; just = 'não desenha no corpo'; }
  else if (svg.startsWith('__ERRO__')) { cobertura = svg; decisao = 'superior'; just = 'erro ao medir → mantém superior (fail-safe)'; }
  else {
    const g = medirSvg(svg); maxY = g.maxY;
    if (maxY != null && maxY >= Y_PE) { cobertura = `desce até ~${maxY} (pés)`; decisao = 'conjunto'; just = 'renderCorpo cobre até os pés → ocupa inferior'; }
    else if (maxY != null && maxY >= Y_CINTURA) { cobertura = `desce até ~${maxY} (coxa/perna)`; decisao = 'conjunto'; just = 'renderCorpo cobre coxa/perna → conflita com calça'; }
    else { cobertura = `até ~${maxY ?? '?'} (tronco)`; decisao = 'superior'; just = 'só tronco/quadril'; }
  }
  if (decisao === 'conjunto') conjuntos.push(it.id);
  tabela.push({ id: it.id, nome: it.nome, maxY, cobertura, decisao, just });
}

// ── Distinção + clipping do seed e das peças inferiores/calçados ────────
function bboxDe(id) { const svg = renderCorpoDe(itemPorId(id)); return svg && !svg.startsWith('__ERRO__') ? medirSvg(svg) : null; }
const calcas = PARTES.filter((x) => x.categoria === 'roupa_inferior').map((x) => ({ id: x.id, nome: x.nome, bbox: bboxDe(x.id), seed: /rin_shorts|rin_futurista/.test(x.id) }));
const calcados = PARTES.filter((x) => x.categoria === 'acessorio' && x.slot === 'pes').map((x) => ({ id: x.id, nome: x.nome, bbox: bboxDe(x.id), seed: /ace_tenis_futuro/.test(x.id) }));

// distinção: strings de renderCorpo não podem ser quase idênticas entre modelos
function distintos(arr) {
  const svgs = arr.map((x) => (renderCorpoDe(itemPorId(x.id)) || '').replace(/u/g, ''));
  const dup = [];
  for (let a = 0; a < svgs.length; a++) for (let b = a + 1; b < svgs.length; b++) {
    const sa = svgs[a], sb = svgs[b];
    if (sa && sb && sa === sb) dup.push([arr[a].id, arr[b].id]);
  }
  return dup;
}
const out = {
  limiar: { Y_CINTURA, Y_PE },
  conjuntos, tabela,
  calcas, calcados,
  calcas_duplicadas: distintos(calcas),
  calcados_duplicados: distintos(calcados),
  contagem: { roupa: roupa.length, conjuntos: conjuntos.length, calcas: calcas.length, calcados: calcados.length },
};
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('[geo] conjuntos=' + JSON.stringify(conjuntos));
console.log('[geo] tabela:');
for (const r of tabela) console.log(`   ${r.id.padEnd(20)} maxY=${String(r.maxY).padStart(6)} → ${r.decisao.toUpperCase().padEnd(9)} (${r.cobertura})`);
console.log('[geo] calcas: ' + calcas.map((c) => `${c.id}[${c.bbox ? c.bbox.minY + '-' + c.bbox.maxY : '?'}]`).join(', '));
console.log('[geo] calcados: ' + calcados.map((c) => `${c.id}[${c.bbox ? c.bbox.minY + '-' + c.bbox.maxY : '?'}]`).join(', '));
console.log('[geo] duplicadas calcas=' + JSON.stringify(out.calcas_duplicadas) + ' calcados=' + JSON.stringify(out.calcados_duplicados));
console.log('[geo] OUT=' + outPath);
