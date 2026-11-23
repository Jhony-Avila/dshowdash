-- REVERSÃO da 012_kit_prioridade (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony (e NÃO faz parte do rollback de código).
ALTER TABLE `eq_grupo` DROP COLUMN `prioridade`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('012_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '012_kit_prioridade';
