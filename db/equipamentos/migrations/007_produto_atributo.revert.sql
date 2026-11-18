-- REVERSÃO da 007_produto_atributo (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_produto_atributo`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('007_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '007_produto_atributo';
