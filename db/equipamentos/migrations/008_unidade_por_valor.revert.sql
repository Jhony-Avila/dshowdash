-- REVERSÃO da 008_unidade_por_valor (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_atributo_unidade`;
ALTER TABLE `eq_unidade` DROP COLUMN `fator_base`;
ALTER TABLE `eq_valor` DROP FOREIGN KEY `fk_eq_valor_unidade`;
ALTER TABLE `eq_valor` DROP KEY `fk_eq_valor_unidade`, DROP COLUMN `unidade_id`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('008_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '008_unidade_por_valor';
