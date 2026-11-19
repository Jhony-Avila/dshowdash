-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 011_operacao — "FOI SALVO OU NÃO" (18/11/2026, ESQUERDA). ADITIVA (nenhuma coluna/tabela existente é renomeada ou
-- removida). PORTÃO: em produção só pelo executor tools/db/equipamentos-migrar.php com o APLICAR do Jhony; validação = bases ATRWEB_VAL_T_*.
-- eq_operacao: um RECIBO por chave de operação (Idempotency): titular por identidade ESTÁVEL (id do usuário do Dash), rota, assinatura
--   do pedido e desfecho. O estado vira 'aplicada' DENTRO da mesma transação que grava (gancho antes do COMMIT do repositório): um recibo
--   'aplicada' nunca existe sem a gravação, e a gravação nunca fica sem o recibo. Nada é apagado (retenção documentada no contrato).
-- eq_pedido_massa.titular_id: titular estável do recibo da massa (DSHOW-086); NULL nos recibos antigos (cai no `usuario`).
-- Reversão: 011_operacao.revert.sql (só validação).
-- =====================================================================================================================================
CREATE TABLE IF NOT EXISTS `eq_operacao` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chave`         VARCHAR(64)     NOT NULL COMMENT 'chave de operação enviada pela tela (X-Chave-Operacao ou chave_operacao)',
  `titular_id`    BIGINT          NOT NULL COMMENT 'id estável do usuário do Dash que criou a operação',
  `titular`       VARCHAR(100)    NOT NULL COMMENT 'e-mail/identificação do momento (só exibição/auditoria)',
  `rota`          VARCHAR(40)     NOT NULL,
  `assinatura`    CHAR(64)        NOT NULL COMMENT 'sha256 da rota + corpo canônico (sem a chave)',
  `estado`        VARCHAR(16)     NOT NULL DEFAULT 'em_andamento' COMMENT 'em_andamento | aplicada | sem_mudanca | recusada | conflito | falhou',
  `recibo`        JSON            NULL,
  `erro`          JSON            NULL,
  `tentativas`    INT UNSIGNED    NOT NULL DEFAULT 1,
  `criado_em`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `concluido_em`  DATETIME(3)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_operacao_chave` (`chave`),
  KEY `ix_eq_operacao_titular` (`titular_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE `eq_pedido_massa`
  ADD COLUMN `titular_id` BIGINT NULL COMMENT 'id estável do titular (DSHOW-086); NULL = recibo anterior à 011' AFTER `usuario`;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('011_operacao', NULL);
