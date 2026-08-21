// testes/docs-aaa.mjs — onda 1405 (MEGA_BRIEFING_01 §3044, §2892–§2893,
// §180): FUNDAÇÃO DOCUMENTAL da frente AAA como contrato executável.
//
// Node puro (sem navegador). Verifica:
//   A) os 6 docs exigidos (ART-BIBLE, VISUAL-QA, GOLDEN-TESTS,
//      PERFORMANCE-BUDGETS, ASSET-PIPELINE, RENDERER-ARCHITECTURE) existem,
//      citam o briefing e têm as seções-chave;
//   B) briefing + 11 digests + mapa de execução no repo; mapa registra as
//      decisões #155–#166 e o briefing tem o sha256 declarado;
//   C) inventário visual: JSON presente, coerente com o catálogo (393 itens
//      em 13 categorias, 8 personagens + 26 partes 3D) e o script regenera
//      byte a byte (determinístico);
//   D) baseline "Before": manifesto com ≥ 10 capturas 2D+3D e hashes.
// @version 1.0.0  @created 2026-08-19
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const DOCS = join(RAIZ, 'docs', 'AVATAR-STUDIO-5');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const ler = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// ── A) docs exigidos §3044 ──────────────────────────────────────────
const EXIGIDOS = {
  'ART-BIBLE.md': ['## 1. Tese e direção', '## 2. Escada de qualidade', '## 11. Anti-padrões globais', '## 13. Changelog'],
  'VISUAL-QA.md': ['## 1. Os 18 eixos', '## 3. Hard Fail', '## 4. Soft Fail', '## 5. Estados de QA', '## 7. Fluxo'],
  'GOLDEN-TESTS.md': ['## 1. Goldens de bytes', '## 2. Goldens visuais', '## 3. Golden Sets', '## 4. Gate supremo'],
  'PERFORMANCE-BUDGETS.md': ['## 1. Tiers', '## 2. Bundle', '## 3. Assets 3D', '## 4. Cena', '## 5. 2D Clássico'],
  'ASSET-PIPELINE.md': ['## 1. Estágios oficiais', '## 2. Naming', '## 3. Manifest v2', '## 4. Gates por nível', '## 10. Quick start'],
  'RENDERER-ARCHITECTURE.md': ['## 1. Mapa de camadas', '## 3. Auditoria de iluminação', '## 4. "No undocumented magic"', '## 5. Contratos que NÃO mudam'],
};
for (const [arq, secoes] of Object.entries(EXIGIDOS)) {
  const txt = ler(join(DOCS, arq));
  ok(txt.length > 2000, `${arq} ausente ou curto demais`);
  ok(/MEGA_BRIEFING_01/.test(txt), `${arq} não cita o MEGA_BRIEFING_01`);
  for (const s of secoes) ok(txt.includes(s), `${arq} sem a seção "${s}"`);
}
// regras invioláveis têm de aparecer no Art Bible (anti-padrões)
const artBible = ler(join(DOCS, 'ART-BIBLE.md'));
for (const termo of ['editar arte existente', 'avatar salvo', 'quality lock', 'licença'])
  ok(artBible.includes(termo), `ART-BIBLE sem o anti-padrão "${termo}"`);

// ── B) briefing, digests, mapa ──────────────────────────────────────
const BRF = join(DOCS, 'briefings', 'MEGA_BRIEFING_01.md');
ok(existsSync(BRF), 'briefing MEGA_BRIEFING_01.md ausente do repo');
if (existsSync(BRF)) {
  const sha = createHash('sha256').update(readFileSync(BRF)).digest('hex');
  ok(sha === '2ac6b77033659299ad69229823105ad1f8a6616141c10171e2afec0b233b50f6', `sha256 do briefing divergente (${sha.slice(0, 12)})`);
  const linhas = readFileSync(BRF, 'utf8').split('\n').length;
  ok(linhas >= 31_000, `briefing com ${linhas} linhas (esperado ~31.980)`);
}
const digests = existsSync(join(DOCS, 'briefings', 'digests')) ? readdirSync(join(DOCS, 'briefings', 'digests')).filter((f) => /^parte-\d\d\.md$/.test(f)) : [];
ok(digests.length === 11, `esperava 11 digests, achei ${digests.length}`);
for (const d of digests) {
  const t = ler(join(DOCS, 'briefings', 'digests', d));
  for (const s of ['## 1.', '## 2.', '## 5.', '## 6.', '## 7.']) ok(t.includes(s), `${d} sem a seção ${s}`);
}
const mapa = ler(join(DOCS, 'briefings', 'MAPA-EXECUCAO-MEGA-BRIEFING-01.md'));
ok(mapa.length > 5000, 'mapa de execução ausente');
for (let n = 155; n <= 166; n += 1) ok(mapa.includes(`#${n}`), `mapa sem a decisão #${n}`);
for (const onda of ['1405', '1406', '1407', '1408', '1409', '1410', '1411', '1418', '1428'])
  ok(mapa.includes(`**${onda}`), `mapa sem a onda ${onda}`);
ok(mapa.includes('precisa do Jhony'), 'mapa sem a lista "precisa do Jhony"');

// ── C) inventário visual (determinístico) ───────────────────────────
const INV = join(DOCS, 'evidencias', 'inventario-visual.json');
ok(existsSync(INV), 'inventario-visual.json ausente');
if (existsSync(INV)) {
  const antes = readFileSync(INV, 'utf8');
  const inv = JSON.parse(antes);
  ok(inv.catalogo2d.total >= 393, `catálogo 2D com ${inv.catalogo2d.total} itens (< 393)`);
  // onda 1414 (#162): 13 → 16 (+ barba, sobrancelha, nariz)
  ok(inv.catalogo2d.categorias.length === 17, `esperava 17 categorias, achei ${inv.catalogo2d.categorias.length}`);
  ok(inv.assets3d.personagens.total === 8 && inv.assets3d.partes.total === 26, 'contagem de assets 3D divergente (8 personagens + 26 partes)');
  ok(inv.catalogo2d.porCategoria.acessorio.semFoco.length === 0, `acessórios sem FOCO_ITEM_ASSET: ${inv.catalogo2d.porCategoria.acessorio.semFoco.join(', ')}`);
  // achado #165b registrado: LODs idênticos existem (auditoria da 1409 vai zerar)
  ok(Array.isArray(inv.assets3d.lodsIdenticos), 'inventário sem a lista de LODs idênticos');
  execSync('node scripts/avatar/inventario-visual.mjs --json', { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
  const depois = readFileSync(INV, 'utf8');
  ok(antes === depois, 'inventario-visual.mjs não é determinístico (ou o JSON commitado está desatualizado — regerar)');
  const md = ler(join(DOCS, 'inventario-visual.md'));
  ok(/KEEP/.test(md) && /UPGRADE/.test(md) && /DEV_ONLY/.test(md), 'inventario-visual.md sem classificação KEEP/UPGRADE/DEV_ONLY');
}

// ── D) baseline Before ──────────────────────────────────────────────
const BASE = join(DOCS, 'evidencias', 'baseline-before.json');
ok(existsSync(BASE), 'baseline-before.json ausente');
if (existsSync(BASE)) {
  const b = JSON.parse(readFileSync(BASE, 'utf8'));
  ok(b.capturas.length >= 10, `baseline Before com ${b.capturas.length} capturas (< 10)`);
  ok(b.capturas.some((c) => c.renderer === '2d') && b.capturas.some((c) => c.renderer === '3d'), 'baseline sem 2D ou sem 3D');
  ok(b.capturas.every((c) => /^[0-9a-f]{64}$/.test(c.sha256) && c.bytes > 1000), 'captura sem sha256/bytes válidos');
  ok(b.reducedMotion === true && b.viewport2d.width === 1440, 'baseline sem viewport/reduced-motion declarados');
}

console.log('[docs-aaa] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
