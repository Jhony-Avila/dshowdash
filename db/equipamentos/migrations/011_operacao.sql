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
-- P1 (18/11, parecer externo) — ADITIVO à 011 ainda não aplicada em produção: TENTATIVA dona da chave e DESFECHO POR ITEM dos lotes.
-- eq_operacao.tentativa: token da tentativa que detém a chave (gravado na reserva/reabertura); o COMMIT de cada gravação confere, sob
--   trava, que a operação ainda é desta tentativa (retomada após 5 min nunca reabre uma tentativa viva). NULL = linha anterior a este ajuste.
-- eq_operacao_item: um desfecho por item de rota multi-item (sugestoes_lote): 'pendente' na abertura e o desfecho final gravado NA MESMA
--   transação da gravação do item. Reenvio da mesma chave retoma só os pendentes; conferir_gravacao mostra o estado por item.
-- eq_operacao.recibo_texto: o recibo EXATO (texto JSON) gravado na MESMA transação da escrita; resposta, reenvio e conferir_gravacao
--   devolvem este mesmo texto (a coluna JSON `recibo` reordena chaves e fica para consulta).
ALTER TABLE `eq_operacao`
  ADD COLUMN `tentativa` CHAR(32) NULL COMMENT 'token da tentativa dona da chave (P1-2)' AFTER `estado`,
  ADD COLUMN `recibo_texto` MEDIUMTEXT NULL COMMENT 'recibo exato em texto (DSHOW-093 A)' AFTER `recibo`;
CREATE TABLE IF NOT EXISTS `eq_operacao_item` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chave`         VARCHAR(64)     NOT NULL COMMENT 'eq_operacao.chave',
  `item`          VARCHAR(64)     NOT NULL COMMENT 'identificador do item na rota (ex.: id da sugestão)',
  `posicao`       INT UNSIGNED    NOT NULL COMMENT 'ordem do item no pedido',
  `desfecho`      VARCHAR(16)     NOT NULL DEFAULT 'pendente' COMMENT 'pendente | aceita | ignorada | falha',
  `detalhe`       JSON            NULL,
  `criado_em`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_operacao_item` (`chave`, `item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE `eq_pedido_massa`
  ADD COLUMN `titular_id` BIGINT NULL COMMENT 'id estável do titular (DSHOW-086); NULL = recibo anterior à 011' AFTER `usuario`;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('011_operacao', NULL);
