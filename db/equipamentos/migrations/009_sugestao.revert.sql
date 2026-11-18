-- REVERSÃO da 009_sugestao (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_sugestao`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('009_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '009_sugestao';
