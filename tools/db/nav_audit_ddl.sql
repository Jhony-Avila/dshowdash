-- ============================================================================
-- NAVEGAÇÃO ENTERPRISE AAA - AUDITORIA DDL
-- Versão: 1.0.0
-- Data: 2024-12-14
-- ============================================================================

USE DSHOWDASH;

-- Tabela de Auditoria de Navegação
CREATE TABLE IF NOT EXISTS app_nav_audit_log (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type ENUM('action','route','binding','destination','resolution','menu') NOT NULL,
  entity_key VARCHAR(150) NOT NULL COMMENT 'action_key, route_clean, destination_key, etc',
  entity_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'ID da entidade (se aplicável)',
  revision_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'ID da revisão (binding_rev_id ou resolution_rev_id)',
  operation ENUM('insert','update','activate','deactivate','delete','seed','migrate','export','import') NOT NULL,
  old_value_json JSON DEFAULT NULL COMMENT 'Valor anterior (para updates)',
  new_value_json JSON DEFAULT NULL COMMENT 'Novo valor',
  checksum_sha256 CHAR(64) DEFAULT NULL,
  actor VARCHAR(100) NOT NULL DEFAULT 'system' COMMENT 'system|user|migration|seed',
  actor_detail VARCHAR(255) DEFAULT NULL COMMENT 'ID do usuário ou nome do script',
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  session_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  INDEX idx_entity_type (entity_type),
  INDEX idx_entity_key (entity_key),
  INDEX idx_operation (operation),
  INDEX idx_actor (actor),
  INDEX idx_created_at (created_at),
  INDEX idx_checksum (checksum_sha256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Registrar o seed inicial como auditoria
-- ============================================================================
INSERT INTO app_nav_audit_log (entity_type, entity_key, operation, actor, actor_detail, new_value_json)
SELECT 'action', action_key, 'seed', 'system', 'nav_seed.sql P1', 
  JSON_OBJECT('area', area, 'kind', kind)
FROM app_nav_action
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_audit_log 
  WHERE entity_type = 'action' AND entity_key = app_nav_action.action_key AND operation = 'seed'
);

INSERT INTO app_nav_audit_log (entity_type, entity_key, operation, actor, actor_detail, new_value_json)
SELECT 'destination', destination_key, 'seed', 'system', 'nav_seed.sql P1',
  JSON_OBJECT('type', destination_type, 'title', title)
FROM app_nav_destination
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_audit_log 
  WHERE entity_type = 'destination' AND entity_key = app_nav_destination.destination_key AND operation = 'seed'
);

INSERT INTO app_nav_audit_log (entity_type, entity_key, operation, actor, actor_detail, new_value_json)
SELECT 'route', route_clean, 'seed', 'system', 'nav_seed.sql P1',
  JSON_OBJECT('description', description)
FROM app_nav_route
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_audit_log 
  WHERE entity_type = 'route' AND entity_key = app_nav_route.route_clean AND operation = 'seed'
);

INSERT INTO app_nav_audit_log (entity_type, entity_key, entity_id, revision_id, operation, actor, actor_detail, checksum_sha256, new_value_json)
SELECT 'binding', a.action_key, br.action_id, br.binding_rev_id, 'activate', 'system', 'nav_seed.sql P1', br.checksum_sha256,
  JSON_OBJECT('effect', br.effect, 'params', br.params_json)
FROM app_nav_binding_active ba
JOIN app_nav_binding_revision br ON br.binding_rev_id = ba.binding_rev_id
JOIN app_nav_action a ON a.action_id = ba.action_id
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_audit_log 
  WHERE entity_type = 'binding' AND entity_key = a.action_key AND operation = 'activate'
);

INSERT INTO app_nav_audit_log (entity_type, entity_key, entity_id, revision_id, operation, actor, actor_detail, checksum_sha256, new_value_json)
SELECT 'resolution', r.route_clean, rr.route_id, rr.resolution_rev_id, 'activate', 'system', 'nav_seed.sql P1', rr.checksum_sha256,
  JSON_OBJECT('destination', d.destination_key, 'layout', rr.layout)
FROM app_nav_route_resolution_active ra
JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id = ra.resolution_rev_id
JOIN app_nav_route r ON r.route_id = ra.route_id
JOIN app_nav_destination d ON d.destination_id = rr.destination_id
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_audit_log 
  WHERE entity_type = 'resolution' AND entity_key = r.route_clean AND operation = 'activate'
);

-- FIM
