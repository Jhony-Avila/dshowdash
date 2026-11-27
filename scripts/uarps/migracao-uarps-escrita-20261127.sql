-- UARPS · saneamento, item A (AZUL, 27/11/2026) · DSHOWDASH · SÓ ADITIVA · roda 2× sem efeito.
-- (1) app_uarps_audit_log ganha 4 colunas NULAS (operacao_id, origem, antes_json, depois_json) + índice por operação: o evento passa a ter
--     chave, alvo, ator, operação, antes e depois (estado, vencimento, motivo), origem e instante. Linhas antigas ficam com NULL.
-- (2) app_uarps_operacoes: uma linha por operação administrativa (PK = id de operação) → idempotência (mesmo id + mesmo pedido = mesmo
--     resultado; outro pedido = 409) e serialização de duas requisições simultâneas com o mesmo id.
-- ENUM entity_type NÃO muda: o reset passa a gravar um evento por regra removida (gatilho/região).
-- Volta: migracao-uarps-escrita-20261127-volta.sql (RENAME da tabela nova; as colunas novas ficam — nulas, sem efeito no código antigo).
SET @db := DATABASE();
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = 'app_uarps_audit_log' AND column_name = 'operacao_id') = 0,
  'ALTER TABLE app_uarps_audit_log ADD COLUMN operacao_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER created_at, ADD COLUMN origem VARCHAR(16) NULL AFTER operacao_id, ADD COLUMN antes_json JSON NULL AFTER origem, ADD COLUMN depois_json JSON NULL AFTER antes_json, ALGORITHM=INSTANT',
  'SELECT ''colunas já existem'' AS info');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;
SET @s := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'app_uarps_audit_log' AND index_name = 'ix_uarps_audit_operacao') = 0,
  'ALTER TABLE app_uarps_audit_log ADD INDEX ix_uarps_audit_operacao (operacao_id), ALGORITHM=INPLACE, LOCK=NONE',
  'SELECT ''índice já existe'' AS info');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;
CREATE TABLE IF NOT EXISTS app_uarps_operacoes (
  operacao_id    VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  tipo           VARCHAR(32) NOT NULL,
  ator           INT UNSIGNED NOT NULL,
  alvo           INT UNSIGNED NOT NULL,
  digest         CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'sha256 do pedido canônico (tipo, alvo, conteúdo)',
  resultado_json JSON NULL COMMENT 'NULL só durante a transação; depois do COMMIT sempre preenchido',
  criado_em      DATETIME(3) NOT NULL,
  PRIMARY KEY (operacao_id),
  KEY ix_uarps_operacoes_alvo (alvo, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
