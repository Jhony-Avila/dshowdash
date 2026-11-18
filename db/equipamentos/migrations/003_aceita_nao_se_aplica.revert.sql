-- REVERSÃO da 003 (SÓ em banco *_VALIDACAO / ensaio; na produção a decisão é do Jhony). Antes de rodar: guardar os valores da coluna
-- (SELECT id, aceita_nao_se_aplica FROM eq_atributo WHERE aceita_nao_se_aplica = 0) — o ensaio guarda em /backup/app-dshow/<ts>-atributos-app-003/.
ALTER TABLE `eq_atributo` DROP COLUMN `aceita_nao_se_aplica`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('003_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '003_aceita_nao_se_aplica';
