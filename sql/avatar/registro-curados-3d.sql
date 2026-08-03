-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'androide' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'androide';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'androide', 'androide', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/androide/thumb.webp', '/assets/avatars/3d/personagens/androide/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'androide');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'androide');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"androide","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf","lod1":"sha256:8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf","lod2":"sha256:8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf"},"triangulos":{"lod0":3237,"lod1":3237,"lod2":3237},"animacoes":["Dance","Death","Idle","Jump","No","Punch","Running","Sitting","Standing","ThumbsUp","Walking","WalkJump","Wave","Yes"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"androide.glb","criado_em":"2026-08-03"}', '8375797e00aec7d8', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/androide/modelo.lod0.glb', 325792, '8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf', JSON_OBJECT('lod', 'lod0', 'triangulos', 3237)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/androide/modelo.lod1.glb', 325792, '8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf', JSON_OBJECT('lod', 'lod1', 'triangulos', 3237)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/androide/modelo.lod2.glb', 325792, '8375797e00aec7d8e72a86407f3017c97411c4e915d75f4fc357f0c183ad73cf', JSON_OBJECT('lod', 'lod2', 'triangulos', 3237)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/androide/thumb.webp', 3278, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/androide/preview.webp', 15814, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'androide')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'animal_pug' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'animal_pug';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'animal_pug', 'animal_pug', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/animal_pug/thumb.webp', '/assets/avatars/3d/personagens/animal_pug/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'animal_pug');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'animal_pug');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"animal_pug","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1","lod1":"sha256:df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1","lod2":"sha256:df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1"},"triangulos":{"lod0":2124,"lod1":2124,"lod2":2124},"animacoes":["Idle","Jump","Punch","Roll","Victory","Walk"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"animal_pug.glb","criado_em":"2026-08-03"}', 'df853146f137a09e', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/animal_pug/modelo.lod0.glb', 271608, 'df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1', JSON_OBJECT('lod', 'lod0', 'triangulos', 2124)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/animal_pug/modelo.lod1.glb', 271608, 'df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1', JSON_OBJECT('lod', 'lod1', 'triangulos', 2124)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/animal_pug/modelo.lod2.glb', 271608, 'df853146f137a09e85570b93468c39d498119a9850a7adc90edbf2bc3ad209e1', JSON_OBJECT('lod', 'lod2', 'triangulos', 2124)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/animal_pug/thumb.webp', 2120, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/animal_pug/preview.webp', 9090, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'animal_pug')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'humano_aventureiro' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'humano_aventureiro';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'humano_aventureiro', 'humano_aventureiro', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/humano_aventureiro/thumb.webp', '/assets/avatars/3d/personagens/humano_aventureiro/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'humano_aventureiro');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'humano_aventureiro');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"humano_aventureiro","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:6541df9f50e9e0e16173b9fdf0caa5b16989ed07683ab08afc26a25e83866c8a","lod1":"sha256:6541df9f50e9e0e16173b9fdf0caa5b16989ed07683ab08afc26a25e83866c8a","lod2":"sha256:14a82545399f33696827a1fde1c84d965ffa807abacbe711e5559eaff9873dd7"},"triangulos":{"lod0":10202,"lod1":10202,"lod2":9997},"excecoes":{"lod2":"fonte resiste a simplify (flat-shaded; 10202→9997, 2.0%) — aceito até o teto absoluto 12000"},"animacoes":["Idle","Idle_Neutral","Punch_Right","Roll","Walk","Wave"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"humano_aventureiro.glb","criado_em":"2026-08-03"}', '6541df9f50e9e0e1', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/humano_aventureiro/modelo.lod0.glb', 808880, '6541df9f50e9e0e16173b9fdf0caa5b16989ed07683ab08afc26a25e83866c8a', JSON_OBJECT('lod', 'lod0', 'triangulos', 10202)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/humano_aventureiro/modelo.lod1.glb', 808880, '6541df9f50e9e0e16173b9fdf0caa5b16989ed07683ab08afc26a25e83866c8a', JSON_OBJECT('lod', 'lod1', 'triangulos', 10202)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/humano_aventureiro/modelo.lod2.glb', 798384, '14a82545399f33696827a1fde1c84d965ffa807abacbe711e5559eaff9873dd7', JSON_OBJECT('lod', 'lod2', 'triangulos', 9997)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_aventureiro/thumb.webp', 1952, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_aventureiro/preview.webp', 9690, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'humano_aventureiro')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'humano_casual' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'humano_casual';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'humano_casual', 'humano_casual', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/humano_casual/thumb.webp', '/assets/avatars/3d/personagens/humano_casual/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'humano_casual');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'humano_casual');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"humano_casual","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99","lod1":"sha256:286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99","lod2":"sha256:286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99"},"triangulos":{"lod0":6206,"lod1":6206,"lod2":6206},"animacoes":["Idle","Idle_Neutral","Punch_Right","Roll","Walk","Wave"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"humano_casual.glb","criado_em":"2026-08-03"}', '286b63e3ecc044ea', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/humano_casual/modelo.lod0.glb', 582116, '286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99', JSON_OBJECT('lod', 'lod0', 'triangulos', 6206)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/humano_casual/modelo.lod1.glb', 582116, '286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99', JSON_OBJECT('lod', 'lod1', 'triangulos', 6206)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/humano_casual/modelo.lod2.glb', 582116, '286b63e3ecc044eaae36a4a9851480d9daea4389044e14ab9f78894aad030a99', JSON_OBJECT('lod', 'lod2', 'triangulos', 6206)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_casual/thumb.webp', 1894, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_casual/preview.webp', 8878, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'humano_casual')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'humano_punk' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'humano_punk';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'humano_punk', 'humano_punk', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/humano_punk/thumb.webp', '/assets/avatars/3d/personagens/humano_punk/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'humano_punk');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'humano_punk');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"humano_punk","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2","lod1":"sha256:60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2","lod2":"sha256:60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2"},"triangulos":{"lod0":5500,"lod1":5500,"lod2":5500},"animacoes":["Idle","Idle_Neutral","Punch_Right","Roll","Walk","Wave"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"humano_punk.glb","criado_em":"2026-08-03"}', '60c231d028592a9d', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/humano_punk/modelo.lod0.glb', 545484, '60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2', JSON_OBJECT('lod', 'lod0', 'triangulos', 5500)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/humano_punk/modelo.lod1.glb', 545484, '60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2', JSON_OBJECT('lod', 'lod1', 'triangulos', 5500)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/humano_punk/modelo.lod2.glb', 545484, '60c231d028592a9d8cb14312529497615ded059ea0c445ca24ba3b2fe87462d2', JSON_OBJECT('lod', 'lod2', 'triangulos', 5500)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_punk/thumb.webp', 1980, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_punk/preview.webp', 8904, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'humano_punk')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
-- ══════════════════════════════════════════════════════════════
-- REGISTRO §614 · asset 3D 'humano_terno' · gerado por gerar-registro-sql.mjs
-- Idempotente e transacional; sem NOW() (created_at = DEFAULT do banco).
-- Pré-requisito: taxonomia com as chaves 'base'/'dshow_3d'/'comum'.
-- ══════════════════════════════════════════════════════════════
START TRANSACTION;

-- 1. conferência (o operador vê o que existe ANTES)
SELECT id, `key`, name, status FROM avatar_assets WHERE `key` = 'humano_terno';

-- 2. asset base SE ausente (subselects por key — chave errada insere 0)
INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, `key`, name, short_description,
   asset_type, status, thumbnail_url, preview_url, supported_renderers, default_renderer)
SELECT c.id, b.id, r.id, 'humano_terno', 'humano_terno', 'Personagem 3D (as4-curados)',
       'glb', 'published', '/assets/avatars/3d/personagens/humano_terno/thumb.webp', '/assets/avatars/3d/personagens/humano_terno/preview.webp', '2d,3d', '3d'
FROM avatar_categories c, avatar_libraries b, avatar_rarities r
WHERE c.`key` = 'base' AND b.`key` = 'dshow_3d' AND r.`key` = 'comum'
  AND NOT EXISTS (SELECT 1 FROM avatar_assets a WHERE a.`key` = 'humano_terno');

SET @asset_id = (SELECT id FROM avatar_assets WHERE `key` = 'humano_terno');

-- 3. versão 1 (uq asset_id+version → re-rodar ATUALIZA)
INSERT INTO avatar_asset_versions (asset_id, version, metadata_json, checksum, status)
VALUES (@asset_id, 1, '{"id":"humano_terno","tipo":"personagem_base","versao":1,"rig":"ubc-v1","lods":{"lod0":"modelo.lod0.glb","lod1":"modelo.lod1.glb","lod2":"modelo.lod2.glb"},"hashes":{"lod0":"sha256:21aa2221b6c19ef94f6aa58f756be5eeaed23f04ca7707b3e1a1116c5bb5e42d","lod1":"sha256:21aa2221b6c19ef94f6aa58f756be5eeaed23f04ca7707b3e1a1116c5bb5e42d","lod2":"sha256:b3e622f2fc8f1b457d7fadff091ec9db7b6c2c8e16780681948055c7fd4ccbe6"},"triangulos":{"lod0":7674,"lod1":7674,"lod2":7542},"animacoes":["Idle","Idle_Neutral","Punch_Right","Roll","Walk","Wave"],"licenca":{"tipo":"CC0","fonte":"as4-curados","comprovante":"public/assets/avatars/3d/LICENCAS.md"},"origem":"as4-curados","fonte_original":"humano_terno.glb","criado_em":"2026-08-03"}', '21aa2221b6c19ef9', 'aprovado')
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
  (@versao_id, 'model', '3d', 'alto', 'glb', '/assets/avatars/3d/personagens/humano_terno/modelo.lod0.glb', 672804, '21aa2221b6c19ef94f6aa58f756be5eeaed23f04ca7707b3e1a1116c5bb5e42d', JSON_OBJECT('lod', 'lod0', 'triangulos', 7674)),
  (@versao_id, 'model', '3d', 'medio', 'glb', '/assets/avatars/3d/personagens/humano_terno/modelo.lod1.glb', 672804, '21aa2221b6c19ef94f6aa58f756be5eeaed23f04ca7707b3e1a1116c5bb5e42d', JSON_OBJECT('lod', 'lod1', 'triangulos', 7674)),
  (@versao_id, 'model', '3d', 'economico', 'glb', '/assets/avatars/3d/personagens/humano_terno/modelo.lod2.glb', 665244, 'b3e622f2fc8f1b457d7fadff091ec9db7b6c2c8e16780681948055c7fd4ccbe6', JSON_OBJECT('lod', 'lod2', 'triangulos', 7542)),
  (@versao_id, 'thumbnail', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_terno/thumb.webp', 1582, NULL, JSON_OBJECT('lado', 128)),
  (@versao_id, 'preview', '3d', 'alto', 'webp', '/assets/avatars/3d/personagens/humano_terno/preview.webp', 7140, NULL, JSON_OBJECT('lado', 512));

COMMIT;

-- 5. verificação (esperado: asset=1 · versao=1 · arquivos=5)
SELECT
  (SELECT COUNT(*) FROM avatar_assets WHERE `key` = 'humano_terno')                        AS asset,
  (SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = @asset_id)              AS versoes,
  (SELECT COUNT(*) FROM avatar_asset_files    WHERE asset_version_id = @versao_id)     AS arquivos;
