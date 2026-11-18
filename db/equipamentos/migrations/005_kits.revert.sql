-- REVERSÃO da 005_kits (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
ALTER TABLE `eq_atributo` DROP COLUMN `importancia_padrao`;
ALTER TABLE `eq_grupo_atributo` DROP FOREIGN KEY `fk_eq_ga_unidade`;
ALTER TABLE `eq_grupo_atributo` DROP KEY `fk_eq_ga_unidade`, DROP COLUMN `unidade_id`, DROP COLUMN `importancia`, DROP COLUMN `destaque`;
ALTER TABLE `eq_grupo` DROP COLUMN `aplica_a_todos`, DROP COLUMN `ordem`, DROP COLUMN `descricao`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('005_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '005_kits';
