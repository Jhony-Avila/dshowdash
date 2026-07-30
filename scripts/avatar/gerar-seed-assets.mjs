// scripts/avatar/gerar-seed-assets.mjs — migração controlada do catálogo
// (Expansão, plano de 10 etapas — decisão oficial do banco).
// @created 2026-07-30
//
// Lê a FONTE DA VERDADE atual (AvatarCatalog.ts + poc3d/catalogo3d.ts) via
// esbuild e emite sql/avatar/catalogo_seed_assets.sql IDEMPOTENTE:
//   • avatar_assets (key = id estável do item; FKs resolvidas por subselect);
//   • avatar_asset_rules (requerBase → requires_species; incompativelCom);
//   • avatar_unlock_rules (bloqueadoPor 'conquista:x' / 'evento:x');
//   • avatar_collections + avatar_collection_items (coleções AS3);
//   • avatar_presets (presets de sistema).
// Rodar:  node scripts/avatar/gerar-seed-assets.mjs   (na raiz do repo)
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RAIZ = resolve(process.cwd());
const PAINEL = join(RAIZ, 'public/components/panels/panel-avatar-studio/src');
const SAIDA = join(RAIZ, 'sql/avatar/catalogo_seed_assets.sql');

// ── 1. extrai o catálogo executando o TS de verdade (sem cópia manual) ─────
const tmp = mkdtempSync(join(tmpdir(), 'avst-dump-'));
const entrada = join(tmp, 'dump.ts');
writeFileSync(entrada, `
import { PARTES, COLECOES, PRESETS, TITULOS, ARQUETIPOS } from '${PAINEL.replace(/\\/g, '/')}/services/AvatarCatalog';
import { VARIANTES_HUMANO, ANDROIDE, ANIMAL } from '${PAINEL.replace(/\\/g, '/')}/poc3d/catalogo3d';
export const dump = { PARTES, COLECOES, PRESETS, TITULOS, ARQUETIPOS, VARIANTES_HUMANO, ANDROIDE, ANIMAL };
`);
const alvo = join(tmp, 'dump.mjs');
await build({
  entryPoints: [entrada], bundle: true, platform: 'node', format: 'esm',
  outfile: alvo, logLevel: 'silent',
});
const { dump } = await import(pathToFileURL(alvo).href);

// ── 2. helpers SQL ──────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/'/g, "''");
const txt = (s) => (s === undefined || s === null || s === '' ? 'NULL' : `'${esc(s)}'`);
const catId = (k) => `(SELECT id FROM avatar_categories WHERE \`key\`='${esc(k)}')`;
const rarId = (k) => `(SELECT id FROM avatar_rarities WHERE \`key\`='${esc(k)}')`;
const bibId = (k) => `(SELECT id FROM avatar_libraries WHERE \`key\`='${esc(k)}')`;
const astId = (k) => `(SELECT id FROM avatar_assets WHERE \`key\`='${esc(k)}')`;

const L = [];
L.push(`-- ============================================================================
-- Avatar Studio — EXPANSÃO: seed de ASSETS gerado do catálogo TS.
-- GERADO por scripts/avatar/gerar-seed-assets.mjs — NÃO editar à mão.
-- Idempotente (ON DUPLICATE KEY UPDATE). @generated ${new Date().toISOString().slice(0, 10)}
-- ============================================================================`);

// ── 3. partes 2D (biblioteca dshow_svg, licença própria) ───────────────────
const ordemPorCategoria = new Map();
L.push('\n-- ── Partes 2D (motor SVG — biblioteca dshow_svg) ──');
for (const p of dump.PARTES) {
  const ordem = ordemPorCategoria.get(p.categoria) ?? 0;
  ordemPorCategoria.set(p.categoria, ordem + 1);
  // 'base' vive na categoria 'especie' da taxonomia nova
  const categoria = p.categoria === 'base' ? 'especie' : p.categoria;
  L.push(`INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, \`key\`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES (${catId(categoria)}, ${bibId('dshow_svg')}, ${rarId(p.raridade)}, 2,
  '${esc(p.id)}', ${txt(p.nome)}, ${txt(p.descricao)}, ${txt(p.lore)},
  'parte2d', 'published', '2d', '2d',
  ${p.raridade === 'exclusivo' ? 1 : 0}, ${p.bloqueadoPor ? 0 : 1}, ${ordem},
  ${txt(p.tema)}, JSON_OBJECT('usaCores', ${JSON.stringify(p.usaCores ?? null) === 'null' ? 'NULL' : `'${esc(JSON.stringify(p.usaCores))}'`},
    'piscar', ${p.piscar === false ? 'FALSE' : 'TRUE'},
    'slot', ${p.slot ? txt(p.slot) : 'NULL'}), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();`);
}

// ── 4. assets 3D da PoC (metadados de GLB + licença CC0) ───────────────────
L.push('\n-- ── Assets 3D da PoC (GLB Meshopt — licenças CC0 rastreadas) ──');
const glbs = [
  ...Object.values(dump.VARIANTES_HUMANO).map((m) => ({ m, cat: 'roupa', bib: 'cc0_quaternius', chave: `glb_humano_${m.id}` })),
  { m: dump.ANDROIDE, cat: 'especie', bib: 'cc0_threejs', chave: 'glb_androide' },
  { m: dump.ANIMAL, cat: 'especie', bib: 'cc0_quaternius', chave: 'glb_animal_pug' },
];
for (const { m, cat, bib, chave } of glbs) {
  L.push(`INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, \`key\`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES (${catId(cat)}, ${bibId(bib)}, ${rarId('raro')}, 1,
  '${esc(chave)}', ${txt(m.licenca.base)}, ${txt(`Base 3D retrabalhada (${m.licenca.autor})`)},
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', ${txt(m.arquivo)}, 'alturaAlvo', ${m.alturaAlvo},
    'prefixo', ${txt(m.prefixo ?? null)}, 'anims', '${esc(JSON.stringify(m.anims))}',
    'slots', '${esc(JSON.stringify(m.slots))}', 'fonte', ${txt(m.licenca.fonte)}),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();`);
}

// ── 4b. títulos (Expansão §27 — dados puros, categoria 'titulo') ───────────
L.push('\n-- ── Títulos (Expansão §27) ──');
for (const [i, t] of (dump.TITULOS ?? []).entries()) {
  L.push(`INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, \`key\`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES (${catId('titulo')}, ${bibId('dshow_svg')}, ${rarId(t.raridade)}, 2,
  '${esc(t.id)}', ${txt(t.nome)}, ${txt(t.lore)}, 'titulo', 'published',
  '2d,3d', '2d', ${t.raridade === 'exclusivo' ? 1 : 0}, 0, ${i}, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();`);
}

// ── 4c. arquétipos (Expansão §1 — kits de identidade) ──────────────────────
L.push('\n-- ── Arquétipos (Expansão §1) ──');
for (const [i, a] of (dump.ARQUETIPOS ?? []).entries()) {
  L.push(`INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, \`key\`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES (${catId('arquetipo')}, ${bibId('dshow_svg')}, ${rarId(a.raridade)}, 2,
  '${esc(a.id)}', ${txt(a.nome)}, ${txt(a.papel)}, 'arquetipo', 'published',
  '2d,3d', '2d', 0, ${i}, 'arquetipo',
  '${esc(JSON.stringify({ base: a.base, camadas: a.camadas, cores: a.cores, titulo: a.titulo ?? null }))}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();`);
}

// ── 5. regras declarativas (mesmo motor p/ 2D e 3D) ────────────────────────
L.push('\n-- ── Regras: requerBase → requires_species · incompativelCom ──');
for (const p of dump.PARTES) {
  if (Array.isArray(p.requerBase) && p.requerBase.length) {
    L.push(`INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, \`condition\`, message, is_active)
SELECT ${astId(p.id)}, 'requires_species', 'species', NULL,
  '${esc(JSON.stringify({ qualquer_de: p.requerBase }))}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = ${astId(p.id)} AND r.rule_type = 'requires_species');`);
    // a LISTA de espécies evolui (Onda 1 somou 6 rostos) — refresca a condição
    // das regras já existentes; idempotente (UPDATE para o mesmo valor é no-op)
    L.push(`UPDATE avatar_asset_rules SET \`condition\` =
  '${esc(JSON.stringify({ qualquer_de: p.requerBase }))}'
WHERE source_asset_id = ${astId(p.id)} AND rule_type = 'requires_species';`);
  }
  if (Array.isArray(p.incompativelCom) && p.incompativelCom.length) {
    for (const alvo2 of p.incompativelCom) {
      L.push(`INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_id, message, is_active)
SELECT ${astId(p.id)}, 'incompatible_with', 'asset', ${astId(alvo2)},
  'Estas peças não podem ser usadas juntas.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = ${astId(p.id)} AND r.rule_type = 'incompatible_with'
    AND r.target_id = ${astId(alvo2)});`);
    }
  }
}

// ── 6. desbloqueios (bloqueadoPor → unlock_rules) ──────────────────────────
L.push('\n-- ── Desbloqueios: conquista:x / evento:x ──');
for (const p of dump.PARTES) {
  if (!p.bloqueadoPor) continue;
  const [tipo, ref] = String(p.bloqueadoPor).split(':');
  const unlock = tipo === 'evento' ? 'event' : 'achievement';
  L.push(`INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT ${astId(p.id)}, '${unlock}', '${esc(tipo)}', ${txt(ref)}, 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = ${astId(p.id)} AND u.unlock_type = '${unlock}');`);
}

// ── 7. coleções + itens ─────────────────────────────────────────────────────
L.push('\n-- ── Coleções (AS3 F2c) ──');
for (const c of dump.COLECOES) {
  L.push(`INSERT INTO avatar_collections
  (\`key\`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('${esc(c.id)}', ${txt(c.nome)}, ${txt(c.descricao)}, ${rarId(c.raridade)},
  'published', JSON_OBJECT('cores', '${esc(JSON.stringify(c.cores ?? null))}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();`);
  c.itens.forEach((item, i) => {
    L.push(`INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE \`key\`='${esc(c.id)}'), ${astId(item)}, ${i});`);
  });
}

// ── 8. presets de sistema ───────────────────────────────────────────────────
L.push('\n-- ── Presets de sistema ──');
for (const pr of dump.PRESETS) {
  L.push(`INSERT INTO avatar_presets
  (\`key\`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('${esc(pr.id)}', ${txt(pr.nome)}, ${txt(pr.descricao ?? null)},
  ${pr.raridade ? rarId(pr.raridade) : 'NULL'}, 1, 1,
  '${esc(JSON.stringify(pr))}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();`);
}

L.push(`\n-- publica nova versão do catálogo (invalidação de cache/ETag)
UPDATE avatar_catalog_meta SET version = version + 1, published_at = NOW(),
  notes = 'Seed de assets migrado do catálogo TS' WHERE id = 1;`);

writeFileSync(SAIDA, L.join('\n\n') + '\n');

// ── dump p/ HOMOLOGAÇÃO (etapa 8): comparar-catalogo.php confere TS × banco ─
const dumpJson = {};
for (const p of dump.PARTES) {
  dumpJson[p.id] = { categoria: p.categoria === 'base' ? 'especie' : p.categoria, raridade: p.raridade, nome: p.nome };
}
for (const t of dump.TITULOS ?? []) dumpJson[t.id] = { categoria: 'titulo', raridade: t.raridade, nome: t.nome };
for (const a of dump.ARQUETIPOS ?? []) dumpJson[a.id] = { categoria: 'arquetipo', raridade: a.raridade, nome: a.nome };
writeFileSync(join(RAIZ, 'sql/avatar/catalogo_dump.json'), JSON.stringify(dumpJson, null, 1) + '\n');

const partes = dump.PARTES.length;
console.log(`ok: ${SAIDA} (+catalogo_dump.json p/ homologação)`);
console.log(`partes 2D: ${partes} · GLBs: ${glbs.length} · coleções: ${dump.COLECOES.length} · presets: ${dump.PRESETS.length}`);
