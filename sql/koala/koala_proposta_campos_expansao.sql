-- ============================================================================
-- Koala Docs — Expansão do Cadastro da Proposta (LOTE 2026-07-03)
-- 100% ADITIVO: apenas ADD COLUMN / CREATE TABLE. Nenhum DROP/RENAME/ALTER
-- destrutivo. Engine InnoDB + utf8mb4_0900_ai_ci (espelha koala_proposal_items).
-- Backup de estrutura ANTES em /backup/koala-proposta-campos-<ts>/.
-- Idempotente por construção onde o MySQL 8 permite (IF NOT EXISTS).
-- @module koala.sql.proposta_campos
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) koala_proposals — campos de conteúdo, desconto de proposta, total de
--    despesas e snapshot editável do vendedor.
-- ---------------------------------------------------------------------------
ALTER TABLE koala_proposals
  ADD COLUMN objective            TEXT          NULL AFTER project_name,
  ADD COLUMN need_context         TEXT          NULL AFTER objective,
  ADD COLUMN executive_summary    TEXT          NULL AFTER need_context,
  ADD COLUMN project_scope        TEXT          NULL AFTER executive_summary,
  ADD COLUMN commercial_notes     TEXT          NULL AFTER project_scope,
  ADD COLUMN proposal_discount_value   DECIMAL(14,2) NULL AFTER total_addition,
  ADD COLUMN proposal_discount_percent DECIMAL(5,2)  NULL AFTER proposal_discount_value,
  ADD COLUMN total_expenses       DECIMAL(14,2) NULL AFTER displacement_value,
  ADD COLUMN seller_name          VARCHAR(160)  NULL AFTER seller_user_id,
  ADD COLUMN seller_email         VARCHAR(255)  NULL AFTER seller_name,
  ADD COLUMN seller_phone         VARCHAR(40)   NULL AFTER seller_email;

-- ---------------------------------------------------------------------------
-- 2) koala_users — telefone do vendedor (fonte/default; editável na proposta).
-- ---------------------------------------------------------------------------
ALTER TABLE koala_users
  ADD COLUMN phone VARCHAR(40) NULL AFTER email;

-- ---------------------------------------------------------------------------
-- 3) koala_client_snapshot_contacts — contatos REPETÍVEIS do cliente,
--    presos ao snapshot (cópia local, editar NUNCA altera o ERP).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS koala_client_snapshot_contacts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  snapshot_id   BIGINT UNSIGNED NOT NULL,
  contact_name  VARCHAR(160)    NULL,
  contact_type  ENUM('phone','email') NOT NULL DEFAULT 'phone',
  contact_value VARCHAR(255)    NOT NULL,
  display_order INT             NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_snapcontact_snap (snapshot_id, display_order),
  CONSTRAINT fk_snapcontact_snap FOREIGN KEY (snapshot_id)
    REFERENCES koala_client_snapshots (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- 4) koala_proposal_expenses — Despesas Operacionais (espelho dos itens).
--    Mesma mecânica de cálculo (base/desconto/acréscimo/subtotal).
--    Rascunho = proposal_version_id IS NULL (igual aos itens).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS koala_proposal_expenses (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  proposal_id         BIGINT UNSIGNED NOT NULL,
  proposal_version_id BIGINT UNSIGNED NULL,
  description         VARCHAR(255)    NOT NULL,
  category_name       VARCHAR(120)    NULL,
  quantity            DECIMAL(14,3)   NOT NULL DEFAULT 1.000,
  unit_measure        VARCHAR(30)     NULL,
  unit_price          DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  discount_value      DECIMAL(14,2)   NULL,
  discount_percent    DECIMAL(5,2)    NULL,
  addition_value      DECIMAL(14,2)   NULL,
  addition_percent    DECIMAL(5,2)    NULL,
  subtotal            DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  observation         VARCHAR(255)    NULL,
  display_order       INT             NOT NULL DEFAULT 0,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pexp_prop (proposal_id, proposal_version_id, display_order),
  CONSTRAINT fk_pexp_prop FOREIGN KEY (proposal_id)
    REFERENCES koala_proposals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- TEARDOWN (revert manual — NÃO executar em produção; referência PNR):
--   ALTER TABLE koala_proposals
--     DROP COLUMN objective, DROP COLUMN need_context, DROP COLUMN executive_summary,
--     DROP COLUMN project_scope, DROP COLUMN commercial_notes,
--     DROP COLUMN proposal_discount_value, DROP COLUMN proposal_discount_percent,
--     DROP COLUMN total_expenses, DROP COLUMN seller_name, DROP COLUMN seller_email,
--     DROP COLUMN seller_phone;
--   ALTER TABLE koala_users DROP COLUMN phone;
--   DROP TABLE IF EXISTS koala_proposal_expenses;
--   DROP TABLE IF EXISTS koala_client_snapshot_contacts;
-- ============================================================================
