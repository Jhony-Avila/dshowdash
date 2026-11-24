-- bling-migracao-20261124-itens-lidos.sql — "ausência ≠ zero" nos pedidos e compras do Bling (ACIMA_DIREITA, 24/11/2026; decisão do Jhony: opção B). SÓ ADITIVA.
-- Executor: Jhony, root do MySQL, base BLING de produção, pelo portão do pacote (que faz a pré-checagem abaixo). O código funciona SEM a coluna:
-- sem ela, todo pedido/compra é tratado como "itens desconhecidos" (subtotal, custo, itens e margem = null → a tela mostra "—").
-- Por quê: subtotal, custo_total e qtd_itens (pedidos) e qtd_itens, qtd_total (compras) são NOT NULL DEFAULT 0 e a LISTAGEM do Bling nunca traz
-- itens → todos ficaram 0 desde a 1ª carga. Em vez de reescrever essas colunas e os dados (opção A, rejeitada), uma coluna NOVA diz se os itens
-- foram lidos de uma fonte COMPLETA (o detalhe do pedido). NULL = nunca lidos → os zeros antigos deixam de ser lidos. Nenhuma linha é alterada.
-- PRÉ-CHECAGEM (o portão para se divergir):
--   SELECT COUNT(*) FROM BLING.bling_sales_order_items;                     -- esperado 0 (se > 0: esses pedidos também passam a "—" até o detalhe)
--   SHOW CREATE TABLE BLING.bling_sales_orders;  SHOW CREATE TABLE BLING.bling_purchase_orders;   -- conferir as colunas e que itens_lidos_em NÃO existe
--   SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='BLING' AND COLUMN_NAME='itens_lidos_em'
--      AND TABLE_NAME IN ('bling_sales_orders','bling_purchase_orders');   -- 0
ALTER TABLE BLING.bling_sales_orders
  ADD COLUMN itens_lidos_em DATETIME NULL COMMENT 'UTC — NULL = itens nunca lidos de fonte completa (detalhe) → subtotal/custo/qtd desconhecidos — 20261124' AFTER qtd_itens,
  ALGORITHM = INSTANT;
ALTER TABLE BLING.bling_purchase_orders
  ADD COLUMN itens_lidos_em DATETIME NULL COMMENT 'UTC — NULL = itens nunca lidos de fonte completa (detalhe) → qtd_itens/qtd_total desconhecidos — 20261124' AFTER qtd_recebida,
  ALGORITHM = INSTANT;
-- Conferir depois: a consulta de information_schema acima → 2.
-- Reverter: NÃO é preciso — o código anterior ignora a coluna; voltar a release do Dash basta (nada é apagado).
