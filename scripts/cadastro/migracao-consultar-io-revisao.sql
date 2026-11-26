-- migracao-consultar-io-revisao.sql — C1 · fila genérica de revisão cadastral (VINHO/ACIMA_ESQUERDA, 26/11/2026). SÓ ADITIVA, no schema consultar_io (base da DSHOW).
-- 4 tabelas NOVAS; nenhuma tabela existente é alterada (o histórico pipedrive_* de outubro fica só leitura). Backup do consultar_io antes (dump automático + o do portão).
-- Volta: DROP TABLE das 4 (só depois de exportar o conteúdo, se houver decisão gravada).
CREATE TABLE IF NOT EXISTS `consultar_io`.`revisao_lote` (
  `id` VARCHAR(32) NOT NULL, `regras_versao` VARCHAR(20) NOT NULL, `gerado_em` DATETIME NOT NULL, `filas` VARCHAR(120) NOT NULL,
  `completa` TINYINT(1) NOT NULL, `fontes_json` JSON NOT NULL, `resumo_json` JSON NOT NULL, `operador` INT NULL, PRIMARY KEY (`id`), KEY `ix_gerado` (`gerado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `consultar_io`.`revisao_linha` (
  `lote_id` VARCHAR(32) NOT NULL, `linha_id` VARCHAR(24) NOT NULL, `fila` VARCHAR(32) NOT NULL, `org_id` BIGINT UNSIGNED NOT NULL, `cnpj` CHAR(14) NULL,
  `campo` VARCHAR(8) NOT NULL, `classificacao` VARCHAR(40) NOT NULL, `pre_selecionada` TINYINT(1) NOT NULL, `evidencia_versao` CHAR(40) NOT NULL,
  `ultimo_ganho` DATETIME NULL, `linha_json` JSON NOT NULL, PRIMARY KEY (`lote_id`, `linha_id`), KEY `ix_ev` (`evidencia_versao`), KEY `ix_org` (`org_id`, `campo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `consultar_io`.`revisao_decisao` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `lote_id` VARCHAR(32) NOT NULL, `linha_id` VARCHAR(24) NOT NULL, `evidencia_versao` CHAR(40) NOT NULL,
  `decisao` VARCHAR(10) NOT NULL, `grafia` VARCHAR(255) NULL, `origem` VARCHAR(20) NULL, `operador` INT NOT NULL, `em` DATETIME NOT NULL, `expirada` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`), KEY `ix_linha` (`lote_id`, `linha_id`), KEY `ix_ev` (`evidencia_versao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `consultar_io`.`revisao_execucao` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `op_id` VARCHAR(32) NOT NULL, `lote_id` VARCHAR(32) NOT NULL, `linha_id` VARCHAR(24) NOT NULL, `org_id` BIGINT UNSIGNED NOT NULL,
  `campo` VARCHAR(8) NOT NULL, `estado` VARCHAR(48) NOT NULL, `motivo` VARCHAR(255) NULL, `antes` TEXT NULL, `depois` TEXT NULL, `em` DATETIME NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_intencao` (`op_id`, `linha_id`), KEY `ix_lote` (`lote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
