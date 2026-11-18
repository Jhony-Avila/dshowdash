-- REVERSÃO da 006_kit_produto (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_grupo_produto`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('006_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '006_kit_produto';
