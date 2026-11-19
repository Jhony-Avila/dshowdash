-- REVERSÃO da 011_operacao (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony.
DROP TABLE `eq_operacao_item`;
DROP TABLE `eq_operacao`;
ALTER TABLE `eq_pedido_massa` DROP COLUMN `titular_id`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('011_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '011_operacao';
