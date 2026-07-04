-- /sql/koala/koala_sections_catalog.sql
-- ADITIVO (CREATE-only): catálogo de SEÇÕES reutilizáveis + imagens por seção.
-- Motivo: koala_template_sections (F1) é amarrada a template_version_id (por-versão),
-- não serve como catálogo reutilizável; koala_media_library não tem section_id
-- (linká-la exigiria ALTER numa tabela F1). Duas tabelas novas, zero toque no existente.
-- @created 2026-07-03  @module koala.sections

-- ── koala_sections_catalog — blocos de construção reutilizáveis (capa, apresentação, itens…) ──
CREATE TABLE IF NOT EXISTS koala_sections_catalog (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  section_type VARCHAR(40) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_section_key (section_key),
  KEY ix_active (is_active), KEY ix_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── koala_section_images — galeria de imagens por seção ──
-- file_name/file_path são SEMPRE gerados por nós (nunca o filename do cliente).
CREATE TABLE IF NOT EXISTS koala_section_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NULL,
  file_name VARCHAR(200) NOT NULL,
  original_name VARCHAR(255) NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(40) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  width INT NULL, height INT NULL,
  display_order INT NOT NULL DEFAULT 0,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY ix_section (section_id), KEY ix_deleted (deleted_at),
  CONSTRAINT fk_secimg_section FOREIGN KEY (section_id) REFERENCES koala_sections_catalog(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Seed de seções iniciais (idempotente por section_key UNIQUE) ──
INSERT IGNORE INTO koala_sections_catalog (section_key, name, description, section_type, display_order) VALUES
  ('cover',        'Capa',          'Página inicial: título, cliente e data',        'cover',        1),
  ('presentation', 'Apresentação',  'Texto de apresentação da empresa/projeto',      'presentation', 2),
  ('items',        'Itens',         'Tabela de itens e valores',                     'items',        3),
  ('terms',        'Condições',     'Condições comerciais e de pagamento',           'terms',        4),
  ('closing',      'Encerramento',  'Fechamento e assinatura',                       'closing',      5);

-- ── TEARDOWN (revert manual) ──
-- DROP TABLE IF EXISTS koala_section_images;
-- DROP TABLE IF EXISTS koala_sections_catalog;
