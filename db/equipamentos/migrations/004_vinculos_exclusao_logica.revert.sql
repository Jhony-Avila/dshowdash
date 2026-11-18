-- REVERSÃO da 004_vinculos_exclusao_logica (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
ALTER TABLE `eq_grupo_atributo` DROP KEY `idx_eq_ga_vivo`, DROP COLUMN `atualizado_em`, DROP COLUMN `atualizado_por`, DROP COLUMN `excluido_em`, DROP COLUMN `versao`;
ALTER TABLE `eq_grupo_escopo` DROP KEY `idx_eq_ge_escopo_vivo`, DROP COLUMN `atualizado_em`, DROP COLUMN `atualizado_por`, DROP COLUMN `excluido_em`, DROP COLUMN `versao`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('004_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '004_vinculos_exclusao_logica';
