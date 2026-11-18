-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 006_kit_produto — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- Kit aplicado DIRETO a um produto (além do escopo por categoria/subcategoria). Exclusão lógica + versão.
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 006_kit_produto.revert.sql (só validação).
-- =====================================================================================================================================
CREATE TABLE IF NOT EXISTS `eq_grupo_produto` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `grupo_id`      INT UNSIGNED    NOT NULL,
  `product_id`    BIGINT UNSIGNED NOT NULL COMMENT 'product_catalog.id (sem FK física: outro schema)',
  `origem`        ENUM('manual','importado','conciliacao') NOT NULL DEFAULT 'manual',
  `criado_por`    VARCHAR(100)    NULL,
  `criado_em`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_por` VARCHAR(100)   NULL,
  `atualizado_em` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `excluido_em`   DATETIME(3)     NULL,
  `versao`        INT UNSIGNED    NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_gp` (`grupo_id`, `product_id`),
  KEY `idx_eq_gp_produto` (`product_id`, `excluido_em`),
  CONSTRAINT `fk_eq_gp_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `eq_grupo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('006_kit_produto', NULL);
