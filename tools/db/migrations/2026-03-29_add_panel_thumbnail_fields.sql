-- ============================================================
-- Migration: Adicionar campos de thumbnail e metadados em panel_registry
-- + Criar tabela panel_screenshots
-- Data: 2026-03-29
-- Versao: 1.0.0
-- Executado: 2026-03-29 (via Claude Agent)
-- ============================================================

-- 1. Campos de thumbnail
ALTER TABLE panel_registry
  ADD COLUMN thumbnail_path VARCHAR(500) DEFAULT NULL
    COMMENT 'Caminho relativo ao storage do ultimo screenshot'
    AFTER icon,
  ADD COLUMN thumbnail_updated_at DATETIME DEFAULT NULL
    COMMENT 'Timestamp da ultima captura de screenshot'
    AFTER thumbnail_path;

-- 2. Campos de metadados
ALTER TABLE panel_registry
  ADD COLUMN tags JSON DEFAULT NULL
    COMMENT 'Tags JSON array para classificacao flexivel'
    AFTER category;

ALTER TABLE panel_registry
  ADD COLUMN version VARCHAR(20) DEFAULT '1.0.0'
    COMMENT 'Versao semantica do painel'
    AFTER tags;

ALTER TABLE panel_registry
  ADD COLUMN author VARCHAR(100) DEFAULT NULL
    COMMENT 'Autor ou responsavel pelo painel'
    AFTER version;

-- 3. Tabela panel_screenshots
CREATE TABLE IF NOT EXISTS panel_screenshots (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  panel_id        VARCHAR(100) NOT NULL
    COMMENT 'FK para panel_registry.panel_id',
  screenshot_path VARCHAR(500) NOT NULL
    COMMENT 'Caminho relativo ao storage',
  captured_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    COMMENT 'Timestamp exato da captura',
  width           INT UNSIGNED NOT NULL DEFAULT 1920
    COMMENT 'Largura em pixels da captura',
  height          INT UNSIGNED NOT NULL DEFAULT 1080
    COMMENT 'Altura em pixels da captura',
  file_size       INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Tamanho do arquivo em bytes',
  format          VARCHAR(10) NOT NULL DEFAULT 'webp'
    COMMENT 'Formato da imagem (webp, png, jpg)',
  status          ENUM('success','error','pending') NOT NULL DEFAULT 'success'
    COMMENT 'Status da captura',
  error_message   TEXT DEFAULT NULL
    COMMENT 'Mensagem de erro se status=error',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_panel_id (panel_id),
  INDEX idx_captured_at (captured_at),
  INDEX idx_panel_captured (panel_id, captured_at DESC),

  CONSTRAINT fk_screenshot_panel
    FOREIGN KEY (panel_id) REFERENCES panel_registry(panel_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historico de screenshots dos paineis';
