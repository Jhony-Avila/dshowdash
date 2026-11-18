-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 007_produto_atributo — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- Ajuste por produto: modo 'incluir' (atributo avulso), 'excluir' (exceção ao kit, com motivo) ou 'ajustar' (só unidade/posição de um
-- atributo que já vem de kit). Uma linha por (produto, atributo). Exclusão lógica + versão.
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 007_produto_atributo.revert.sql (só validação).
-- =====================================================================================================================================
CREATE TABLE IF NOT EXISTS `eq_produto_atributo` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`    BIGINT UNSIGNED NOT NULL,
  `atributo_id`   INT UNSIGNED    NOT NULL,
  `modo`          ENUM('incluir','excluir','ajustar') NOT NULL,
  `posicao`       SMALLINT UNSIGNED NULL,
  `unidade_id`    INT UNSIGNED    NULL COMMENT 'unidade definida para este produto (D3); vale também para atributo vindo de kit',
  `motivo`        VARCHAR(255)    NULL,
  `criado_por`    VARCHAR(100)    NULL,
  `criado_em`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_por` VARCHAR(100)   NULL,
  `atualizado_em` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `excluido_em`   DATETIME(3)     NULL,
  `versao`        INT UNSIGNED    NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_pa` (`product_id`, `atributo_id`),
  KEY `idx_eq_pa_atributo` (`atributo_id`),
  CONSTRAINT `fk_eq_pa_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_pa_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('007_produto_atributo', NULL);
