#!/usr/bin/env node
// assets3d/gerar-registro-sql.mjs — REGISTRO no asset registry (AS5 · §614).
// @version 1.0.0  @created 2026-08-03
//
// Do manifest VALIDADO de uma pasta publicada, gera SQL IDEMPOTENTE e
// TRANSACIONAL para o runner do servidor:
//   1. conferência do asset em avatar_assets (por `key`);
//   2. cria o asset SE ausente (subselects por key de categoria/
//      biblioteca/raridade — chaves inexistentes = 0 linhas = o próprio
//      SELECT final acusa; nada órfão entra);
//   3. upsert em avatar_asset_versions (uq asset_id+version, metadata_json
//      = manifest inteiro, checksum = 16 hex do lod0, status parametrizável);
//   4. arquivos da versão em avatar_asset_files (remove+insere: 3 modelos
//      glb com quality_tier alto/medio/economico + thumbnail + preview,
//      renderer '3d', sha256 hex e file_size reais);
//   5. verificação final com contagens esperadas.
// DETERMINÍSTICO: sem NOW() — created_at fica com o DEFAULT do banco;
// mesma pasta → mesmo SQL (snapshot-testável).
//
// Uso: node scripts/avatar/assets3d/gerar-registro-sql.mjs <pasta-publicada>
//   [--categoria base] [--biblioteca dshow_3d] [--raridade comum]
//   [--status aprovado|publicado] [--saida arquivo.sql]
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { validarAsset } from './validar-asset.mjs';

const BASE_URL = '/assets/avatars/3d/personagens';
const TIER_POR_LOD = { lod0: 'alto', lod1: 'medio', lod2: 'economico' };

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : padrao;
}

const sq = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

/** Gera o SQL e devolve a string. Exportado p/ o teste (snapshot). */
export function gerarRegistroSql(pastaPublicada, opcoes = {}) {
  const {
    categoria = 'base', biblioteca = 'dshow_3d', raridade = 'comum',
    status = 'aprovado', exigirValido = true,
  } = opcoes;
  const pasta = resolve(pastaPublicada);
  if (exigirValido) {
    const r = validarAsset(pasta);
    if (!r.aprovado) throw new Error(`pasta reprovada no §487 — registre só assets válidos:\n  ${r.erros.join('\n  ')}`);
  }
  const manifest = JSON.parse(readFileSync(join(pasta, 'manifest.json'), 'utf8'));
  const id = manifest.id;
  const url = (arq) => `${BASE_URL}/${id}/${arq}`;
  const hex = (lod) => String(manifest.hashes[lod]).replace(/^sha256:/, '');
  const peso = (arq) => statSync(join(pasta, arq)).size;
  const statusVersao = status === 'publicado' ? 'publicado' : 'aprovado';

  const linhasModelo = ['lod0', 'lod1', 'lod2'].map((lod) => {
    const arq = manifest.lods[lod];
    return `  (@versao_id, 'model', '3d', ${sq(TIER_POR_LOD[lod])}, 'glb', ${sq(url(arq))}, ${peso(arq)}, ${sq(hex(lod))}, JSON_OBJECT('lod', ${sq(lod)}, 'triangulos', ${manifest.triangulos?.[lod] ?? 0}))`;
  });
  const linhasImagem = [
    `  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', ${sq(url('thumb.webp'))}, ${peso('thumb.webp')}, NULL, JSON_OBJECT('lado', 128))`,
    `  (@versao_id, 'preview', '3d', 'alto', 'webp', ${sq(url('preview.webp'))}, ${peso('preview.webp')}, NULL, JSON_OBJECT('lado', 512))`,
  ];

  return `-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D ${sq(id)} · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves ${sq(categoria)}/${sq(biblioteca)}/${sq(raridade)}.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, \`key\`, name, status FROM avatar_assets WHERE \`key\` = ${sq(id)};

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, \`key\`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, ${sq(id)}, ${sq(manifest.nome ?? id)}, ${sq(`Personagem 3D (${manifest.origem})`)},
       'glb', 'published', ${sq(url('thumb.webp'))}, ${sq(url('preview.webp'))}, '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.\`key\` = ${sq(categoria)} AND b.\`key\` = ${sq(biblioteca)} AND r.\`key\` = ${sq(raridade)}
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.\`key\` = ${sq(id)});

SET @asset_id = (SELECT id FROM avatar_assets WHERE \`key\` = ${sq(id)});

-- 3. versão ${manifest.versao} (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, ${Number(manifest.versao) || 1}, ${sq(JSON.stringify(manifest))}, ${sq(hex('lod0').slice(0, 16))}, ${sq(statusVersao)})
ON DUPLICATE KEY UPDATE
  metadata_json = VALUES(metadata_json),
  checksum      = VALUES(checksum),
  status        = VALUES(status);

SET @versao_id = (SELECT id FROM avatar_asset_versions
                  WHERE asset_id = @asset_id AND version = ${Number(manifest.versao) || 1});

-- 4. arquivos da versão (§615) — troca completa, nunca acumula lixo
DELETE FROM avatar_asset_files WHERE asset_version_id = @versao_id;
INSERT INTO avatar_asset_files
  (asset_version_id, file_role, renderer, quality_tier, format, url, file_size, checksum, metadata_json)
VALUES
${[...linhasModelo, ...linhasImagem].join(',\n')};

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE \`key\` = ${sq(id)})                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
`;
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const pasta = process.argv[2];
  if (!pasta || pasta.startsWith('--')) {
    console.error('uso: gerar-registro-sql.mjs <pasta-publicada> [--categoria k --biblioteca k --raridade k --status aprovado|publicado --saida arquivo.sql]');
    process.exit(2);
  }
  try {
    const sql = gerarRegistroSql(pasta, {
      categoria: argumento('categoria', 'base'),
      biblioteca: argumento('biblioteca', 'dshow_3d'),
      raridade: argumento('raridade', 'comum'),
      status: argumento('status', 'aprovado'),
    });
    const saida = argumento('saida', null);
    if (saida) { writeFileSync(resolve(saida), sql); console.log(`SQL_OK ${saida}`); }
    else process.stdout.write(sql);
  } catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }
}
