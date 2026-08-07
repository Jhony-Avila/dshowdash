-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'base_superhero_m' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'rosto'/'cc0_quaternius'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES) + RESOLUÇÃO da
-- taxonomia (id NULL aqui = chave errada; pare ANTES do INSERT falhar)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'base_superhero_m';
SELECT
  (SELECT id FROM avatar_categories WHERE `key` = 'rosto') AS categoria_id,
  (SELECT id FROM avatar_libraries  WHERE `key` = 'cc0_quaternius') AS biblioteca_id,
  (SELECT id FROM avatar_rarities   WHERE `key` = 'comum')  AS raridade_id;

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer,
   created_at, updated_at)
SELECT c.id, b.id, r.id, 'base_superhero_m', 'base_superhero_m', 'Personagem 3D (ubc-standard-v1)',
       'glb', 'published', '/assets/avatars/3d/personagens/base_superhero_m/thumb.webp', '/assets/avatars/3d/personagens/base_superhero_m/preview.webp', '2d,3d', '3d',
       '2026-08-07 00:00:00', '2026-08-07 00:00:00'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'rosto' AND b.`key` = 'cc0_quaternius' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'base_superhero_m');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'base_superhero_m');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"base_superhero_m","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:c1c4ed4b028522cf6e02a70e2ab16da42c10c3a71a09b80ed92d77e74962c864","lod1":"sha256:501f60da543f4536fee95ac9a9b832672f1233a49cedb964283b50790a5c5de1","lod2":"sha256:99d81c595bc339572b74143dac4ab1620477f9092889f9b2c4be2a2d927182e1"},"triangulos":{"lod0":14318,"lod1":14318,"lod2":7198},"animacoes":[],"licenca":{"tipo":"CC0","fonte":"ubc-standard-v1","comprovante":"storage/assets-3d-fonte/ubc-standard-v1/extraido/Universal Base Characters[Standard]/License_Standard.txt"},"origem":"ubc-standard-v1","fonte_original":"Superhero_Male_FullBody.gltf","criado_em":"2026-08-07"}', 'c1c4ed4b028522cf', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/base_superhero_m/modelo.lod0.glb', 1435628, 'c1c4ed4b028522cf6e02a70e2ab16da42c10c3a71a09b80ed92d77e74962c864', JSON_OBJECT('lod', 'lod0', 'triangulos', 14318)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/base_superhero_m/modelo.lod1.glb', 905100, '501f60da543f4536fee95ac9a9b832672f1233a49cedb964283b50790a5c5de1', JSON_OBJECT('lod', 'lod1', 'triangulos', 14318)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/base_superhero_m/modelo.lod2.glb', 430848, '99d81c595bc339572b74143dac4ab1620477f9092889f9b2c4be2a2d927182e1', JSON_OBJECT('lod', 'lod2', 'triangulos', 7198)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/base_superhero_m/thumb.webp', 2210, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/base_superhero_m/preview.webp', 9638, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'base_superhero_m')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
