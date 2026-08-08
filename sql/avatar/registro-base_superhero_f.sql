-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'base_superhero_f' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'rosto'/'cc0_quaternius'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES) + RESOLUÇÃO da
-- taxonomia (id NULL aqui = chave errada; pare ANTES do INSERT falhar)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'base_superhero_f';
SELECT
  (SELECT id FROM avatar_categories WHERE `key` = 'rosto') AS categoria_id,
  (SELECT id FROM avatar_libraries  WHERE `key` = 'cc0_quaternius') AS biblioteca_id,
  (SELECT id FROM avatar_rarities   WHERE `key` = 'comum')  AS raridade_id;

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer,
   created_at, updated_at)
SELECT c.id, b.id, r.id, 'base_superhero_f', 'base_superhero_f', 'Personagem 3D (ubc-standard-v1)',
       'glb', 'published', '/assets/avatars/3d/personagens/base_superhero_f/thumb.webp', '/assets/avatars/3d/personagens/base_superhero_f/preview.webp', '2d,3d', '3d',
       '2026-08-07 00:00:00', '2026-08-07 00:00:00'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'rosto' AND b.`key` = 'cc0_quaternius' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'base_superhero_f');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'base_superhero_f');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"base_superhero_f","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:4530931fd18caa9e150002ad67025bf4c8f7beb67c5b0fa01801c5663aa84ec6","lod1":"sha256:a2a8f5c66a574025d485e29d1d882ddc12078e5bcb39efff187d1963df874bd2","lod2":"sha256:5d1695bc97993b124731ab5834814cb80ec58d6b58355d95842419c25b9c0cee"},"triangulos":{"lod0":15060,"lod1":15060,"lod2":7196},"animacoes":[],"licenca":{"tipo":"CC0","fonte":"ubc-standard-v1","comprovante":"storage/assets-3d-fonte/ubc-standard-v1/extraido/Universal Base Characters[Standard]/License_Standard.txt"},"origem":"ubc-standard-v1","fonte_original":"Superhero_Female_FullBody.gltf","criado_em":"2026-08-07"}', '4530931fd18caa9e', 'aprovado')
ON DUPLICATE KEY UPDATE
  metadata_json = VALUES(metadata_json),
  checksum      = VALUES(checksum),
  status        = VALUES(status);

SET @versao_id = (SELECT id FROM avatar_asset_versions
                  WHERE asset_id = @asset_id AND version = 1);

-- 4. arquivos da versão (§615) — troca completa, nunca acumula lixo
DELETE FROM avatar_asset_files WHERE asset_version_id = @versao_id;
INSERT INTO avatar_asset_files
  (asset_version_id, file_role, renderer, quality_tier, format, url, file_size, checksum, metadata_json)
VALUES
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/base_superhero_f/modelo.lod0.glb', 1553492, '4530931fd18caa9e150002ad67025bf4c8f7beb67c5b0fa01801c5663aa84ec6', JSON_OBJECT('lod', 'lod0', 'triangulos', 15060)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/base_superhero_f/modelo.lod1.glb', 961112, 'a2a8f5c66a574025d485e29d1d882ddc12078e5bcb39efff187d1963df874bd2', JSON_OBJECT('lod', 'lod1', 'triangulos', 15060)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/base_superhero_f/modelo.lod2.glb', 436348, '5d1695bc97993b124731ab5834814cb80ec58d6b58355d95842419c25b9c0cee', JSON_OBJECT('lod', 'lod2', 'triangulos', 7196)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/base_superhero_f/thumb.webp', 2166, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/base_superhero_f/preview.webp', 8852, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'base_superhero_f')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
