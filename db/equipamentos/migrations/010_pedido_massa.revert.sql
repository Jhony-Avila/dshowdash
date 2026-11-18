-- REVERSÃO da 010_pedido_massa (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_pedido_massa`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('010_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '010_pedido_massa';
