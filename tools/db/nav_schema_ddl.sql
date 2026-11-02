-- ============================================================================
-- NAVEGAÇÃO ENTERPRISE AAA - DDL COMPLETO
-- Versão: 1.0.0
-- Data: 2024-12-13
-- Schema: DSHOWDASH
-- ============================================================================

USE DSHOWDASH;

-- 1. AÇÕES
CREATE TABLE IF NOT EXISTS app_nav_action (
  action_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action_key VARCHAR(100) NOT NULL,
  area VARCHAR(50) NOT NULL,
  kind VARCHAR(50) NOT NULL DEFAULT 'navigation',
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_id),
  UNIQUE KEY uk_action_key (action_key),
  INDEX idx_area (area),
  INDEX idx_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BINDING REVISION
CREATE TABLE IF NOT EXISTS app_nav_binding_revision (
  binding_rev_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action_id BIGINT UNSIGNED NOT NULL,
  effect VARCHAR(50) NOT NULL,
  params_json JSON DEFAULT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  revision_note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system',
  PRIMARY KEY (binding_rev_id),
  UNIQUE KEY uk_checksum (checksum_sha256),
  INDEX idx_action_id (action_id),
  CONSTRAINT fk_binding_action FOREIGN KEY (action_id) 
    REFERENCES app_nav_action (action_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BINDING ACTIVE
CREATE TABLE IF NOT EXISTS app_nav_binding_active (
  action_id BIGINT UNSIGNED NOT NULL,
  binding_rev_id BIGINT UNSIGNED NOT NULL,
  activated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_by VARCHAR(100) DEFAULT 'system',
  PRIMARY KEY (action_id),
  CONSTRAINT fk_active_action FOREIGN KEY (action_id) 
    REFERENCES app_nav_action (action_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_active_revision FOREIGN KEY (binding_rev_id) 
    REFERENCES app_nav_binding_revision (binding_rev_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DESTINOS
CREATE TABLE IF NOT EXISTS app_nav_destination (
  destination_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_key VARCHAR(100) NOT NULL,
  destination_type VARCHAR(50) NOT NULL DEFAULT 'panel',
  title VARCHAR(150) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (destination_id),
  UNIQUE KEY uk_destination_key (destination_key),
  INDEX idx_type (destination_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROTAS
CREATE TABLE IF NOT EXISTS app_nav_route (
  route_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_clean VARCHAR(150) NOT NULL,
  route_hash VARCHAR(150) GENERATED ALWAYS AS (CONCAT('#/', route_clean)) STORED,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id),
  UNIQUE KEY uk_route_clean (route_clean),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ALIASES DE ROTA
CREATE TABLE IF NOT EXISTS app_nav_route_alias (
  alias_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_id BIGINT UNSIGNED NOT NULL,
  alias_clean VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alias_id),
  UNIQUE KEY uk_alias_clean (alias_clean),
  INDEX idx_route_id (route_id),
  CONSTRAINT fk_alias_route FOREIGN KEY (route_id) 
    REFERENCES app_nav_route (route_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ROUTE RESOLUTION REVISION
CREATE TABLE IF NOT EXISTS app_nav_route_resolution_revision (
  resolution_rev_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_id BIGINT UNSIGNED NOT NULL,
  destination_id BIGINT UNSIGNED NOT NULL,
  layout VARCHAR(50) DEFAULT 'default',
  min_level INT UNSIGNED DEFAULT 0,
  capabilities_json JSON DEFAULT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  revision_note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system',
  PRIMARY KEY (resolution_rev_id),
  UNIQUE KEY uk_checksum (checksum_sha256),
  INDEX idx_route_id (route_id),
  INDEX idx_destination_id (destination_id),
  CONSTRAINT fk_resolution_route FOREIGN KEY (route_id) 
    REFERENCES app_nav_route (route_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_resolution_destination FOREIGN KEY (destination_id) 
    REFERENCES app_nav_destination (destination_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ROUTE RESOLUTION ACTIVE
CREATE TABLE IF NOT EXISTS app_nav_route_resolution_active (
  route_id BIGINT UNSIGNED NOT NULL,
  resolution_rev_id BIGINT UNSIGNED NOT NULL,
  activated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_by VARCHAR(100) DEFAULT 'system',
  PRIMARY KEY (route_id),
  CONSTRAINT fk_res_active_route FOREIGN KEY (route_id) 
    REFERENCES app_nav_route (route_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_active_revision FOREIGN KEY (resolution_rev_id) 
    REFERENCES app_nav_route_resolution_revision (resolution_rev_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ITENS DE MENU
CREATE TABLE IF NOT EXISTS app_nav_item (
  item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_key VARCHAR(100) NOT NULL,
  source_catalog VARCHAR(50) NOT NULL,
  parent_item_id BIGINT UNSIGNED DEFAULT NULL,
  route_id BIGINT UNSIGNED DEFAULT NULL,
  action_id BIGINT UNSIGNED DEFAULT NULL,
  label VARCHAR(150) NOT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  min_level INT UNSIGNED DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  metadata_json JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  UNIQUE KEY uk_item_key (item_key),
  INDEX idx_source (source_catalog),
  INDEX idx_parent (parent_item_id),
  INDEX idx_route (route_id),
  INDEX idx_action (action_id),
  INDEX idx_sort (sort_order),
  CONSTRAINT fk_item_parent FOREIGN KEY (parent_item_id) 
    REFERENCES app_nav_item (item_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_item_route FOREIGN KEY (route_id) 
    REFERENCES app_nav_route (route_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_item_action FOREIGN KEY (action_id) 
    REFERENCES app_nav_action (action_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FIM DO DDL
