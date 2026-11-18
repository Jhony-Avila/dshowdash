-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 010_pedido_massa — ATRIBUTOS-WEB (pós-missão 18/11/2026, risco residual 1). ADITIVA (nenhuma coluna/tabela
-- existente é renomeada ou removida).
-- Pedidos de aplicação EM MASSA: uma linha por chave de idempotência, com ÍNDICE ÚNICO. A linha é inserida na MESMA transação que grava
-- os vínculos: dois envios simultâneos com a mesma chave ficam em fila no índice (InnoDB) e só um aplica; o outro recebe "repetido"
-- (mesma assinatura) ou 409 (assinatura diferente). Nada é apagado.
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 010_pedido_massa.revert.sql (só validação).
-- =====================================================================================================================================
CREATE TABLE IF NOT EXISTS `eq_pedido_massa` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chave`         VARCHAR(64)     NOT NULL COMMENT 'chave de idempotência enviada pela tela (gerada na prévia)',
  `assinatura`    CHAR(64)        NOT NULL COMMENT 'sha256 do pedido normalizado (produtos, kits, inclusões, exclusões)',
  `usuario`       VARCHAR(100)    NOT NULL,
  `produtos`      INT UNSIGNED    NOT NULL DEFAULT 0,
  `resultado`     JSON            NULL COMMENT 'contagens gravadas + resumo da prévia (devolvido no "repetido")',
  `criado_em`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `concluido_em`  DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_pedido_massa_chave` (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('010_pedido_massa', NULL);
