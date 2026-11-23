-- bling-migracao-20261123-loja.sql — DSHOW-106 (2): guardar o identificador EXTERNO da loja (loja.id) em cada pedido.
-- Executor: Jhony, root do MySQL, na base BLING de produção, ANTES ou DEPOIS do código (o código funciona dos dois jeitos:
-- sem a coluna, simplesmente não grava). Só ADICIONA uma coluna anulável (MySQL 8: ALGORITHM=INSTANT, sem cópia da tabela).
-- Conferir antes:  SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='BLING' AND TABLE_NAME='bling_sales_orders' AND COLUMN_NAME='loja_bling_id';  -- 0
ALTER TABLE BLING.bling_sales_orders
  ADD COLUMN loja_bling_id VARCHAR(64) NULL COMMENT 'id EXTERNO da loja/canal no Bling (loja.id) — DSHOW-106' AFTER sales_channel_id,
  ALGORITHM = INSTANT;
-- Conferir depois: a mesma consulta → 1.
-- Reverter: NÃO é preciso — o código anterior ignora a coluna, então voltar o release do Dash basta e a coluna pode ficar.
-- (Regra "nada é apagado": nenhuma remoção de coluna é proposta.)
