-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 009_sugestao — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- Sugestões (legado 2025, nome do produto, Precifica) e conferência: nunca viram valor sem decisão humana. Idempotente pela `chave`.
-- atributo_alternativo_id: casos em que o destino é decisão (D5: Profundidade × Comprimento dos cabos).
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 009_sugestao.revert.sql (só validação).
-- =====================================================================================================================================
CREATE TABLE IF NOT EXISTS `eq_sugestao` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chave`           VARCHAR(190)    NOT NULL COMMENT 'idempotência: fonte|produto|atributo|origem',
  `product_id`      BIGINT UNSIGNED NOT NULL,
  `atributo_id`     INT UNSIGNED    NOT NULL,
  `atributo_alternativo_id` INT UNSIGNED NULL,
  `fonte`           ENUM('legado_2025','nome_produto','precifica') NOT NULL,
  `tipo`            ENUM('valor','conferencia') NOT NULL DEFAULT 'valor',
  `valor_proposto`  VARCHAR(500)    NULL,
  `opcao_id`        INT UNSIGNED    NULL,
  `unidade_id`      INT UNSIGNED    NULL,
  `confianca`       ENUM('alta','media','baixa') NOT NULL DEFAULT 'media',
  `evidencia`       VARCHAR(500)    NULL,
  `estado`          ENUM('pendente','aceita','recusada') NOT NULL DEFAULT 'pendente',
  `decidido_por`    VARCHAR(100)    NULL,
  `decidido_em`     DATETIME(3)     NULL,
  `motivo`          VARCHAR(255)    NULL,
  `lote_id`         INT UNSIGNED    NULL,
  `versao`          INT UNSIGNED    NOT NULL DEFAULT 1,
  `criado_em`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_sugestao_chave` (`chave`),
  KEY `idx_eq_sugestao_produto` (`product_id`, `estado`),
  KEY `idx_eq_sugestao_fila` (`estado`, `fonte`, `tipo`),
  CONSTRAINT `fk_eq_sug_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_sug_alt` FOREIGN KEY (`atributo_alternativo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_sug_opcao` FOREIGN KEY (`opcao_id`) REFERENCES `eq_opcao` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_sug_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_sug_lote` FOREIGN KEY (`lote_id`) REFERENCES `eq_importacao_lote` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('009_sugestao', NULL);
