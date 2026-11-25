-- bling-migracao-20261123-situacao.sql — PORTÃO BLING SITUAÇÃO (ACIMA_DIREITA, 23/11/2026). SÓ ADITIVA.
-- Executor: Jhony, root do MySQL, base BLING de produção, ANTES da releitura (o código funciona sem ela: sem a coluna, não grava).
-- 1) coluna NOVA com o id real da situação (situacao.id). O campo antigo situacao_bling (situacao.valor) fica COMO ESTÁ.
-- 2) tabela NOVA com a lista de situações do módulo de vendas (id e nome), para o Jhony dizer quais são "finalizado".
-- Conferir antes:  SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='BLING' AND TABLE_NAME='bling_sales_orders' AND COLUMN_NAME='situacao_bling_id';  -- 0
--                  SELECT COUNT(*) FROM information_schema.TABLES  WHERE TABLE_SCHEMA='BLING' AND TABLE_NAME='bling_situacoes';  -- 0
ALTER TABLE BLING.bling_sales_orders
  ADD COLUMN situacao_bling_id VARCHAR(20) NULL COMMENT 'id REAL da situação no Bling (situacao.id) — portão BLING SITUAÇÃO 20261123' AFTER situacao_bling,
  ALGORITHM = INSTANT;
CREATE TABLE IF NOT EXISTS BLING.bling_situacoes (
  account_id   BIGINT UNSIGNED NOT NULL,
  modulo_id    VARCHAR(20) NOT NULL,
  modulo_nome  VARCHAR(80) NULL,
  situacao_id  VARCHAR(20) NOT NULL,
  nome         VARCHAR(120) NOT NULL,
  id_herdado   VARCHAR(20) NULL,
  cor          VARCHAR(16) NULL,
  lido_em      DATETIME NOT NULL COMMENT 'UTC',
  PRIMARY KEY (account_id, situacao_id),
  KEY ix_modulo (account_id, modulo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='situações do módulo de vendas do Bling (portão BLING SITUAÇÃO)';
-- Conferir depois: as duas consultas acima → 1.
-- Reverter: NÃO é preciso — o código anterior ignora a coluna e a tabela; voltar a release do Dash basta (nada é apagado).
