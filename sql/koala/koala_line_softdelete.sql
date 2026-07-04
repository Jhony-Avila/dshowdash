-- ============================================================================
-- Koala Docs — soft-delete das linhas de Itens e Despesas Operacionais (R5).
-- 100% ADITIVO: só ADD COLUMN. Idempotente por natureza (rodar 1x).
-- Linhas de rascunho passam a ser removidas por deleted_at (não DELETE físico).
-- @module koala.sql.line_softdelete
-- ============================================================================
ALTER TABLE koala_proposal_items
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER display_order,
  ADD KEY idx_pitem_deleted (proposal_id, proposal_version_id, deleted_at);

ALTER TABLE koala_proposal_expenses
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER display_order,
  ADD KEY idx_pexp_deleted (proposal_id, proposal_version_id, deleted_at);

-- TEARDOWN (revert manual):
--   ALTER TABLE koala_proposal_items   DROP KEY idx_pitem_deleted, DROP COLUMN deleted_at;
--   ALTER TABLE koala_proposal_expenses DROP KEY idx_pexp_deleted, DROP COLUMN deleted_at;
