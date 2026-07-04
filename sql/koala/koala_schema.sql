-- ═══════════════════════════════════════════════════════════════
-- Koala Docs — Schema F1 (Fundação)
-- Banco: DSHOWDASH (local 127.0.0.1). 100% CREATE + seeds. Zero ALTER/DROP em tabela existente.
-- Gerado 2026-07-03. Ref: /claude/docs/KOALA-DOCS-ARQUITETURA.md
-- Errata aplicada: koala_users.system_user_id = INT UNSIGNED (match app_users.id int unsigned).
-- Teardown (revert) no fim do arquivo, comentado.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. koala_users (FK → app_users.id) ──
CREATE TABLE koala_users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  system_user_id INT UNSIGNED NOT NULL,
  name           VARCHAR(160) NULL,
  email          VARCHAR(255) NULL,
  role           ENUM('seller','manager','admin') NOT NULL DEFAULT 'seller',
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sysuser (system_user_id),
  CONSTRAINT fk_koala_user_sys FOREIGN KEY (system_user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. koala_currencies ──
CREATE TABLE koala_currencies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code CHAR(3) NOT NULL, symbol VARCHAR(8) NOT NULL, name VARCHAR(60) NOT NULL,
  decimal_places TINYINT NOT NULL DEFAULT 2,
  is_default TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. koala_item_categories ──
CREATE TABLE koala_item_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL, slug VARCHAR(140) NOT NULL, description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. koala_items_catalog (bi-moeda) ──
CREATE TABLE koala_items_catalog (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(60) NULL, name VARCHAR(200) NOT NULL, description TEXT NULL,
  category_id BIGINT UNSIGNED NULL, unit_measure VARCHAR(30) NULL,
  default_unit_price_brl DECIMAL(14,2) NULL, default_unit_price_usd DECIMAL(14,2) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL, KEY ix_cat (category_id),
  CONSTRAINT fk_item_cat FOREIGN KEY (category_id) REFERENCES koala_item_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. koala_commercial_terms ──
CREATE TABLE koala_commercial_terms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL, description VARCHAR(255) NULL, content TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. koala_payment_methods ──
CREATE TABLE koala_payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL, description VARCHAR(255) NULL,
  payment_type ENUM('cash','installment','bank_transfer','boleto','pix','custom') NOT NULL DEFAULT 'custom',
  installments_quantity INT NULL, down_payment_percent DECIMAL(5,2) NULL,
  down_payment_value DECIMAL(14,2) NULL, first_due_days INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. koala_templates ──
CREATE TABLE koala_templates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL, slug VARCHAR(180) NOT NULL, description VARCHAR(255) NULL,
  segment VARCHAR(40) NULL,
  status ENUM('draft','published','inactive') NOT NULL DEFAULT 'draft',
  orientation ENUM('portrait','landscape') NOT NULL DEFAULT 'portrait',
  page_format VARCHAR(12) NOT NULL DEFAULT 'A4',
  is_default TINYINT(1) NOT NULL DEFAULT 0, current_version_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL, UNIQUE KEY uq_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. koala_template_versions (LAYOUT: structure_json) ──
CREATE TABLE koala_template_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL, version_number INT NOT NULL,
  structure_json JSON NOT NULL,
  editable_fields_json JSON NULL, fixed_assets_json JSON NULL, dynamic_fields_json JSON NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tpl_ver (template_id, version_number),
  CONSTRAINT fk_tplver_tpl FOREIGN KEY (template_id) REFERENCES koala_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. koala_template_sections ──
CREATE TABLE koala_template_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL, template_version_id BIGINT UNSIGNED NOT NULL,
  section_key VARCHAR(60) NOT NULL, section_name VARCHAR(120) NOT NULL,
  section_type VARCHAR(40) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  is_required TINYINT(1) NOT NULL DEFAULT 0, is_visible TINYINT(1) NOT NULL DEFAULT 1,
  config_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_tplver (template_version_id),
  CONSTRAINT fk_sec_tplver FOREIGN KEY (template_version_id) REFERENCES koala_template_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 10. koala_template_components ──
CREATE TABLE koala_template_components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL, template_version_id BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL, component_key VARCHAR(60) NOT NULL,
  component_type VARCHAR(40) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  content_json JSON NULL, style_json JSON NULL, bindings_json JSON NULL,
  is_editable_by_seller TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_section (section_id),
  CONSTRAINT fk_comp_sec FOREIGN KEY (section_id) REFERENCES koala_template_sections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 11. koala_client_snapshots ──
CREATE TABLE koala_client_snapshots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  external_client_id BIGINT UNSIGNED NULL, external_budget_id BIGINT UNSIGNED NULL,
  client_name VARCHAR(255) NULL, trade_name VARCHAR(255) NULL, legal_name VARCHAR(255) NULL,
  document_type ENUM('CPF','CNPJ') NULL, document_number VARCHAR(20) NULL,
  state_registration VARCHAR(30) NULL, internal_client_code VARCHAR(40) NULL,
  logo_url VARCHAR(255) NULL, address VARCHAR(255) NULL, address_number VARCHAR(20) NULL,
  address_complement VARCHAR(120) NULL, district VARCHAR(120) NULL, city VARCHAR(120) NULL,
  state VARCHAR(60) NULL, postal_code VARCHAR(12) NULL,
  contact_name VARCHAR(160) NULL, contact_position VARCHAR(120) NULL,
  contact_email VARCHAR(255) NULL, contact_phone VARCHAR(40) NULL,
  raw_external_data_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_ext_client (external_client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 12. koala_proposals ──
CREATE TABLE koala_proposals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proposal_number VARCHAR(16) NOT NULL, budget_number VARCHAR(40) NULL,
  template_id BIGINT UNSIGNED NULL, template_version_id BIGINT UNSIGNED NULL,
  current_version_id BIGINT UNSIGNED NULL,
  seller_user_id BIGINT UNSIGNED NOT NULL, client_snapshot_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NULL, project_name VARCHAR(255) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  status ENUM('draft','generated','sent','viewed','expired','won','lost','canceled','user_deleted') NOT NULL DEFAULT 'draft',
  proposal_date DATE NULL, valid_until DATE NULL, approval_deadline DATE NULL,
  public_slug VARCHAR(64) NULL, public_url VARCHAR(255) NULL, pdf_path VARCHAR(255) NULL,
  total_gross DECIMAL(14,2) NULL, total_discount DECIMAL(14,2) NULL, total_addition DECIMAL(14,2) NULL,
  freight_value DECIMAL(14,2) NULL, installation_value DECIMAL(14,2) NULL, displacement_value DECIMAL(14,2) NULL,
  total_net DECIMAL(14,2) NULL, total_final DECIMAL(14,2) NULL,
  deleted_by_seller TINYINT(1) NOT NULL DEFAULT 0, created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_number (proposal_number), UNIQUE KEY uq_slug (public_slug),
  KEY ix_seller (seller_user_id), KEY ix_status (status), KEY ix_deleted (deleted_at),
  CONSTRAINT fk_prop_seller FOREIGN KEY (seller_user_id) REFERENCES koala_users(id),
  CONSTRAINT fk_prop_client FOREIGN KEY (client_snapshot_id) REFERENCES koala_client_snapshots(id),
  CONSTRAINT fk_prop_curr FOREIGN KEY (currency) REFERENCES koala_currencies(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 13. koala_proposal_versions ──
CREATE TABLE koala_proposal_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT UNSIGNED NOT NULL, version_number INT NOT NULL,
  template_id BIGINT UNSIGNED NULL, template_version_id BIGINT UNSIGNED NULL,
  snapshot_json JSON NOT NULL, totals_json JSON NULL, pdf_path VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored_from_version_id BIGINT UNSIGNED NULL,
  UNIQUE KEY uq_prop_ver (proposal_id, version_number), KEY ix_prop (proposal_id),
  CONSTRAINT fk_ver_prop FOREIGN KEY (proposal_id) REFERENCES koala_proposals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 14. koala_proposal_items ──
CREATE TABLE koala_proposal_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT UNSIGNED NOT NULL, proposal_version_id BIGINT UNSIGNED NULL,
  catalog_item_id BIGINT UNSIGNED NULL, description VARCHAR(255) NOT NULL,
  category_name VARCHAR(120) NULL, quantity DECIMAL(14,3) NOT NULL DEFAULT 1,
  unit_measure VARCHAR(30) NULL, unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_value DECIMAL(14,2) NULL, discount_percent DECIMAL(5,2) NULL,
  addition_value DECIMAL(14,2) NULL, addition_percent DECIMAL(5,2) NULL,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0, observation VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_prop (proposal_id),
  CONSTRAINT fk_pitem_prop FOREIGN KEY (proposal_id) REFERENCES koala_proposals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 15. koala_proposal_payment_terms ──
CREATE TABLE koala_proposal_payment_terms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT UNSIGNED NOT NULL, payment_method_id BIGINT UNSIGNED NULL,
  commercial_term_id BIGINT UNSIGNED NULL, down_payment_value DECIMAL(14,2) NULL,
  installments_quantity INT NULL, installment_value DECIMAL(14,2) NULL,
  first_due_date DATE NULL, free_observations TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_prop (proposal_id),
  CONSTRAINT fk_ppt_prop FOREIGN KEY (proposal_id) REFERENCES koala_proposals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 16. koala_media_library ──
CREATE TABLE koala_media_library (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NULL, description VARCHAR(255) NULL,
  file_path VARCHAR(255) NOT NULL, file_url VARCHAR(255) NULL, file_type VARCHAR(40) NULL,
  segment VARCHAR(40) NULL, template_id BIGINT UNSIGNED NULL, tags_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL, KEY ix_segment (segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 17. koala_logs ──
CREATE TABLE koala_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL, proposal_id BIGINT UNSIGNED NULL,
  proposal_version_id BIGINT UNSIGNED NULL, template_id BIGINT UNSIGNED NULL,
  action VARCHAR(40) NOT NULL, entity_type VARCHAR(40) NULL, entity_id BIGINT UNSIGNED NULL,
  field_name VARCHAR(80) NULL, old_value TEXT NULL, new_value TEXT NULL,
  metadata_json JSON NULL, ip_address VARCHAR(45) NULL, user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_prop (proposal_id), KEY ix_action (action), KEY ix_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 18. koala_public_views ──
CREATE TABLE koala_public_views (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT UNSIGNED NOT NULL, proposal_version_id BIGINT UNSIGNED NULL,
  public_slug VARCHAR(64) NULL, ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL, referrer VARCHAR(255) NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_prop (proposal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 19. koala_sequence (numeração atômica) ──
CREATE TABLE koala_sequence (
  seq_year SMALLINT NOT NULL PRIMARY KEY, last_number INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- SEEDS
-- ═══════════════════════════════════════════════════════════════

-- Moedas: BRL default + USD
INSERT INTO koala_currencies (code, symbol, name, decimal_places, is_default, is_active) VALUES
  ('BRL', 'R$',  'Real',  2, 1, 1),
  ('USD', 'US$', 'Dolar', 2, 0, 1);

-- Usuario admin inicial (jhony) via ponte system_user_id
INSERT INTO koala_users (system_user_id, name, email, role, is_active)
SELECT id, username, email, 'admin', 1 FROM app_users WHERE email = 'jhony@dshow.com.br' LIMIT 1;

-- Template GENERICO tecnico (segment generic, default publicado)
INSERT INTO koala_templates (name, slug, description, segment, status, orientation, page_format, is_default, created_by)
VALUES ('Generico', 'generic', 'Template padrao inicial (tecnico) para propostas comerciais.', 'generic', 'published', 'portrait', 'A4', 1, NULL);
SET @tpl_id = LAST_INSERT_ID();

INSERT INTO koala_template_versions (template_id, version_number, structure_json, editable_fields_json, dynamic_fields_json, status)
VALUES (@tpl_id, 1,
  '{"template_key":"generic","segment":"generic","orientation":"portrait","page_format":"A4","pages":[{"key":"cover","sections":[{"section_key":"cover","section_type":"cover","components":[{"component_key":"title","component_type":"title","content_json":{"text":"{{TituloProposta}}"},"bindings_json":{"text":"proposal.title"},"style_json":{"fontSize":"32px","align":"center"},"is_editable_by_seller":true},{"component_key":"client_name","component_type":"text","content_json":{"text":"{{NomeCliente}}"},"bindings_json":{"text":"client.client_name"},"is_editable_by_seller":false},{"component_key":"proposal_date","component_type":"text","content_json":{"text":"{{DataProposta}}"},"bindings_json":{"text":"proposal.proposal_date"},"is_editable_by_seller":false}]}]},{"key":"items","sections":[{"section_key":"financial_summary","section_type":"financial_summary","components":[{"component_key":"items_table","component_type":"price_table","bindings_json":{"rows":"proposal.items","total":"proposal.total_final"},"is_editable_by_seller":true},{"component_key":"seller","component_type":"text","content_json":{"text":"{{NomeVendedor}}"},"bindings_json":{"text":"seller.name"},"is_editable_by_seller":false}]}]}],"placeholders":["{{TituloProposta}}","{{NomeCliente}}","{{RazaoSocial}}","{{ValorTotal}}","{{DataProposta}}","{{NomeVendedor}}"]}',
  '{"editable":["proposal.title","proposal.items"]}',
  '{"TituloProposta":"proposal.title","NomeCliente":"client.client_name","RazaoSocial":"client.legal_name","ValorTotal":"proposal.total_final","DataProposta":"proposal.proposal_date","NomeVendedor":"seller.name"}',
  'published');
SET @ver_id = LAST_INSERT_ID();

UPDATE koala_templates SET current_version_id = @ver_id WHERE id = @tpl_id;

-- Secoes do template generico
INSERT INTO koala_template_sections (template_id, template_version_id, section_key, section_name, section_type, display_order, is_required, is_visible)
VALUES (@tpl_id, @ver_id, 'cover', 'Capa', 'cover', 1, 1, 1);
SET @sec_cover = LAST_INSERT_ID();
INSERT INTO koala_template_sections (template_id, template_version_id, section_key, section_name, section_type, display_order, is_required, is_visible)
VALUES (@tpl_id, @ver_id, 'financial_summary', 'Composicao Financeira', 'financial_summary', 2, 1, 1);
SET @sec_fin = LAST_INSERT_ID();

-- Componentes: capa
INSERT INTO koala_template_components (template_id, template_version_id, section_id, component_key, component_type, display_order, content_json, bindings_json, style_json, is_editable_by_seller) VALUES
  (@tpl_id, @ver_id, @sec_cover, 'title',        'title', 1, '{"text":"{{TituloProposta}}"}', '{"text":"proposal.title"}', '{"fontSize":"32px","align":"center"}', 1),
  (@tpl_id, @ver_id, @sec_cover, 'client_name',  'text',  2, '{"text":"{{NomeCliente}}"}',    '{"text":"client.client_name"}', NULL, 0),
  (@tpl_id, @ver_id, @sec_cover, 'proposal_date','text',  3, '{"text":"{{DataProposta}}"}',   '{"text":"proposal.proposal_date"}', NULL, 0);
-- Componentes: financeiro
INSERT INTO koala_template_components (template_id, template_version_id, section_id, component_key, component_type, display_order, bindings_json, is_editable_by_seller) VALUES
  (@tpl_id, @ver_id, @sec_fin, 'items_table', 'price_table', 1, '{"rows":"proposal.items","total":"proposal.total_final"}', 1),
  (@tpl_id, @ver_id, @sec_fin, 'seller',      'text',        2, '{"text":"seller.name"}', 0);

-- ═══════════════════════════════════════════════════════════════
-- TEARDOWN (revert do CREATE — "backup" do schema). Rodar SÓ para desfazer a F1.
-- Ordem inversa das FKs. Descomentar para executar.
-- ═══════════════════════════════════════════════════════════════
-- SET FOREIGN_KEY_CHECKS=0;
-- DROP TABLE IF EXISTS koala_public_views, koala_logs, koala_media_library,
--   koala_proposal_payment_terms, koala_proposal_items, koala_proposal_versions,
--   koala_proposals, koala_client_snapshots, koala_template_components,
--   koala_template_sections, koala_template_versions, koala_templates,
--   koala_payment_methods, koala_commercial_terms, koala_items_catalog,
--   koala_item_categories, koala_currencies, koala_users, koala_sequence;
-- SET FOREIGN_KEY_CHECKS=1;
