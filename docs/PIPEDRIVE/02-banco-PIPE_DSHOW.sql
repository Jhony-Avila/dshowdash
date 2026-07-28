-- =====================================================================
-- PIPE_DSHOW — DDL RASCUNHO / REVISÁVEL  (briefing §24)
-- =====================================================================
-- ⚠️ NÃO APLICAR AINDA. Documento de planejamento para revisão do dono/DBA.
-- Convenção do repo (fiel a sql/datatables_schema.sql):
--   - 100% CREATE + seeds; zero ALTER/DROP em tabela existente.
--   - CREATE TABLE IF NOT EXISTS (reaplicável/idempotente).
--   - InnoDB, utf8mb4, utf8mb4_unicode_ci.
--   - Alterações aditivas futuras via procedure guardada por information_schema
--     (padrão dt_disc_add_col de sql/datatables_schema_discovery.sql).
--   - Sem runner de migração: aplicação manual `mysql -h 127.0.0.1 -u <admin> -p PIPE_DSHOW < ...`.
-- Colunas técnicas padrão (§24.3) em toda entidade sincronizada:
--   pipedrive_id, company_id, is_deleted, is_active, add_time, update_time,
--   first_synced_at, last_synced_at, source_updated_at, raw_payload, payload_hash, sync_version
-- raw_payload = JSON bruto da API (§24.4): auditoria/reprocessamento sem nova chamada.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS PIPE_DSHOW
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PIPE_DSHOW;

-- ---------------------------------------------------------------------
-- CREDENCIAL / CONTA  (token dinâmico cifrado — inserido pela app)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipe_accounts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  auth_method     ENUM('token','oauth') NOT NULL DEFAULT 'token',
  company_id      BIGINT UNSIGNED NULL,          -- de /v1/users/me
  company_name    VARCHAR(255) NULL,
  company_domain  VARCHAR(255) NULL,             -- {company}.pipedrive.com
  api_domain      VARCHAR(255) NULL,             -- OAuth: base obrigatória
  token_cipher    TEXT NULL,                     -- AES-256-GCM (envelope v1.<iv>.<tag>.<ct>); NUNCA texto puro
  token_last4     CHAR(4) NULL,                  -- só para exibição
  oauth_refresh_cipher TEXT NULL,                -- futuro (OAuth)
  oauth_expires_at DATETIME NULL,
  scopes          VARCHAR(512) NULL,
  connected_user_id   BIGINT UNSIGNED NULL,
  connected_user_name VARCHAR(255) NULL,
  status          ENUM('not_configured','connected','invalid','expired','insufficient_scope','testing','error')
                    NOT NULL DEFAULT 'not_configured',
  last_validated_at DATETIME NULL,
  last_error      VARCHAR(512) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- ENTIDADES CORE  (v2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipe_deals (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id    BIGINT UNSIGNED NOT NULL,
  company_id      BIGINT UNSIGNED NULL,
  title           VARCHAR(512) NULL,
  value           DECIMAL(18,2) NULL,
  currency        CHAR(3) NULL,
  value_converted DECIMAL(18,2) NULL,            -- §12.2 valor convertido (regra cambial interna)
  status          ENUM('open','won','lost','deleted') NULL,
  pipeline_id     BIGINT UNSIGNED NULL,
  stage_id        BIGINT UNSIGNED NULL,
  person_id       BIGINT UNSIGNED NULL,
  org_id          BIGINT UNSIGNED NULL,
  owner_id        BIGINT UNSIGNED NULL,          -- v2: user_id -> owner_id
  creator_user_id BIGINT UNSIGNED NULL,
  origin          VARCHAR(128) NULL,
  label_ids       VARCHAR(255) NULL,
  probability     DECIMAL(5,2) NULL,
  expected_close_date DATE NULL,
  won_time        DATETIME NULL,
  lost_time       DATETIME NULL,
  lost_reason     VARCHAR(512) NULL,
  stage_change_time DATETIME NULL,               -- base p/ "tempo na etapa"
  next_activity_date DATETIME NULL,
  last_activity_date DATETIME NULL,
  activities_count INT NULL,
  activities_overdue_count INT NULL,
  notes_count     INT NULL,
  emails_count    INT NULL,
  -- indicadores calculados (§12.2) — preenchidos no sync/métricas, não pela API:
  is_stalled      TINYINT(1) NOT NULL DEFAULT 0, -- negócio parado (config por etapa)
  no_activity     TINYINT(1) NOT NULL DEFAULT 0,
  close_overdue   TINYINT(1) NOT NULL DEFAULT 0,
  possible_dup    TINYINT(1) NOT NULL DEFAULT 0,
  custom_fields   JSON NULL,                     -- v2: objeto aninhado custom_fields
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  add_time        DATETIME NULL,
  update_time     DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_updated_at DATETIME NULL,               -- marca-d'água (update_time da API)
  raw_payload     JSON NULL,
  payload_hash    CHAR(64) NULL,
  sync_version    INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pd (pipedrive_id),
  KEY ix_status (status), KEY ix_stage (stage_id), KEY ix_owner (owner_id),
  KEY ix_update (source_updated_at), KEY ix_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico do negócio (§12.8 timeline) — origem: webhooks (previous/current) + flow, quando disponível
CREATE TABLE IF NOT EXISTS pipe_deal_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  deal_pd_id   BIGINT UNSIGNED NOT NULL,
  field        VARCHAR(128) NULL,                -- stage_id, owner_id, value, status...
  old_value    VARCHAR(512) NULL,
  new_value    VARCHAR(512) NULL,
  change_time  DATETIME NULL,
  source       ENUM('webhook','flow','reconcile') NULL,
  raw_payload  JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_deal (deal_pd_id), KEY ix_time (change_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_deal_products (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id BIGINT UNSIGNED NULL,
  deal_pd_id   BIGINT UNSIGNED NOT NULL,
  product_pd_id BIGINT UNSIGNED NULL,
  item_price   DECIMAL(18,2) NULL,
  quantity     DECIMAL(18,3) NULL,
  discount     DECIMAL(18,2) NULL,
  tax          DECIMAL(18,2) NULL,
  sum          DECIMAL(18,2) NULL,
  comments     VARCHAR(512) NULL,
  order_nr     INT NULL,
  add_time     DATETIME NULL,
  raw_payload  JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_deal (deal_pd_id), KEY ix_prod (product_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_persons (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id BIGINT UNSIGNED NOT NULL,
  company_id   BIGINT UNSIGNED NULL,
  name         VARCHAR(255) NULL,
  org_id       BIGINT UNSIGNED NULL,
  job_title    VARCHAR(255) NULL,
  owner_id     BIGINT UNSIGNED NULL,
  creator_user_id BIGINT UNSIGNED NULL,
  label_ids    VARCHAR(255) NULL,
  primary_email VARCHAR(320) NULL,
  primary_phone VARCHAR(64) NULL,
  email_norm   VARCHAR(320) NULL,                -- normalizado p/ dedup (§13.4)
  phone_norm   VARCHAR(64) NULL,
  possible_dup TINYINT(1) NOT NULL DEFAULT 0,
  custom_fields JSON NULL,
  is_deleted   TINYINT(1) NOT NULL DEFAULT 0,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  add_time     DATETIME NULL, update_time DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_updated_at DATETIME NULL, raw_payload JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_email (email_norm), KEY ix_phone (phone_norm), KEY ix_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- pessoa tem N e-mails / N telefones (§13.2)
CREATE TABLE IF NOT EXISTS pipe_person_emails (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  person_pd_id BIGINT UNSIGNED NOT NULL, value VARCHAR(320) NULL, label VARCHAR(64) NULL, is_primary TINYINT(1) DEFAULT 0,
  KEY ix_person (person_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_person_phones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  person_pd_id BIGINT UNSIGNED NOT NULL, value VARCHAR(64) NULL, label VARCHAR(64) NULL, is_primary TINYINT(1) DEFAULT 0,
  KEY ix_person (person_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id BIGINT UNSIGNED NOT NULL, company_id BIGINT UNSIGNED NULL,
  name VARCHAR(255) NULL, address VARCHAR(512) NULL,
  city VARCHAR(128) NULL, state VARCHAR(128) NULL, country VARCHAR(128) NULL, postal_code VARCHAR(32) NULL,
  owner_id BIGINT UNSIGNED NULL, creator_user_id BIGINT UNSIGNED NULL, label_ids VARCHAR(255) NULL,
  name_norm VARCHAR(255) NULL, cnpj VARCHAR(20) NULL, email_domain VARCHAR(255) NULL, possible_dup TINYINT(1) DEFAULT 0,
  custom_fields JSON NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1,
  add_time DATETIME NULL, update_time DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_updated_at DATETIME NULL, raw_payload JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_name (name_norm), KEY ix_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LEADS (v1)
CREATE TABLE IF NOT EXISTS pipe_leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id VARCHAR(64) NOT NULL,             -- leads usam UUID
  company_id BIGINT UNSIGNED NULL,
  title VARCHAR(512) NULL, person_id BIGINT UNSIGNED NULL, org_id BIGINT UNSIGNED NULL,
  owner_id BIGINT UNSIGNED NULL, creator_user_id BIGINT UNSIGNED NULL, origin VARCHAR(128) NULL, label_ids VARCHAR(255) NULL,
  value DECIMAL(18,2) NULL, currency CHAR(3) NULL,
  is_archived TINYINT(1) DEFAULT 0, archive_time DATETIME NULL,
  next_activity_date DATETIME NULL, last_activity_date DATETIME NULL,
  seen TINYINT(1) NULL,                          -- was_seen
  converted_deal_id BIGINT UNSIGNED NULL,
  custom_fields JSON NULL,                       -- herda dealFields (não há leadFields)
  is_deleted TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1,
  add_time DATETIME NULL, update_time DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_updated_at DATETIME NULL, raw_payload JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_archived (is_archived), KEY ix_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipedrive_id BIGINT UNSIGNED NOT NULL, company_id BIGINT UNSIGNED NULL,
  subject VARCHAR(512) NULL, type VARCHAR(64) NULL, status VARCHAR(32) NULL,
  owner_id BIGINT UNSIGNED NULL, creator_user_id BIGINT UNSIGNED NULL,
  due_date DATE NULL, due_time TIME NULL, duration VARCHAR(16) NULL,
  done TINYINT(1) NULL, marked_done_time DATETIME NULL, is_overdue TINYINT(1) DEFAULT 0,
  location VARCHAR(512) NULL, note TEXT NULL,
  deal_pd_id BIGINT UNSIGNED NULL, person_pd_id BIGINT UNSIGNED NULL, org_pd_id BIGINT UNSIGNED NULL,
  custom_fields JSON NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1,
  add_time DATETIME NULL, update_time DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  source_updated_at DATETIME NULL, raw_payload JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_deal (deal_pd_id), KEY ix_due (due_date), KEY ix_done (done)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_activity_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NULL, key_string VARCHAR(64) NULL, icon_key VARCHAR(64) NULL, color VARCHAR(16) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, raw_payload JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- E-MAILS (v1 Mailbox) — ⚠️ ver 04 §7: só a caixa do dono do token, salvo grants por usuário
CREATE TABLE IF NOT EXISTS pipe_emails (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  thread_id BIGINT UNSIGNED NULL, subject VARCHAR(1024) NULL, snippet VARCHAR(1024) NULL,
  from_addr VARCHAR(320) NULL, direction ENUM('inbound','outbound') NULL, status VARCHAR(32) NULL,
  body_sanitized MEDIUMTEXT NULL,                -- HTML já sanitizado (§17.3/§45.3)
  deal_pd_id BIGINT UNSIGNED NULL, person_pd_id BIGINT UNSIGNED NULL, org_pd_id BIGINT UNSIGNED NULL, user_pd_id BIGINT UNSIGNED NULL,
  message_time DATETIME NULL, synced_from_user_id BIGINT UNSIGNED NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0, raw_payload JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_thread (thread_id), KEY ix_deal (deal_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_email_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email_pd_id BIGINT UNSIGNED NOT NULL, role ENUM('to','cc','bcc') NULL, email VARCHAR(320) NULL, name VARCHAR(255) NULL,
  KEY ix_email (email_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  content_sanitized MEDIUMTEXT NULL,             -- HTML sanitizado (§18.2)
  user_id BIGINT UNSIGNED NULL,
  deal_pd_id BIGINT UNSIGNED NULL, person_pd_id BIGINT UNSIGNED NULL, org_pd_id BIGINT UNSIGNED NULL, lead_pd_id VARCHAR(64) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0, add_time DATETIME NULL, update_time DATETIME NULL,
  raw_payload JSON NULL, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_deal (deal_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_note_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NULL,
  note_pd_id BIGINT UNSIGNED NOT NULL, content MEDIUMTEXT NULL, user_id BIGINT UNSIGNED NULL, add_time DATETIME NULL,
  raw_payload JSON NULL, KEY ix_note (note_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipe_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(512) NULL, code VARCHAR(128) NULL, category VARCHAR(128) NULL, description TEXT NULL,
  unit VARCHAR(64) NULL, tax DECIMAL(10,2) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, owner_id BIGINT UNSIGNED NULL,
  custom_fields JSON NULL, is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  add_time DATETIME NULL, update_time DATETIME NULL,
  raw_payload JSON NULL, payload_hash CHAR(64) NULL, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_product_prices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, product_pd_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(18,2) NULL, currency CHAR(3) NULL, cost DECIMAL(18,2) NULL, KEY ix_prod (product_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS / TEAMS (v1)
CREATE TABLE IF NOT EXISTS pipe_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL, company_id BIGINT UNSIGNED NULL,
  name VARCHAR(255) NULL, email VARCHAR(320) NULL, phone VARCHAR(64) NULL, role_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, lang VARCHAR(16) NULL, timezone VARCHAR(64) NULL,
  icon_url VARCHAR(512) NULL, last_login DATETIME NULL, add_time DATETIME NULL, modified DATETIME NULL,
  raw_payload JSON NULL, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_teams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NULL, manager_id BIGINT UNSIGNED NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
  raw_payload JSON NULL, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_team_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  team_pd_id BIGINT UNSIGNED NOT NULL, user_pd_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_tu (team_pd_id, user_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FUNIS / ETAPAS (v2)
CREATE TABLE IF NOT EXISTS pipe_pipelines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NULL, order_nr INT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
  add_time DATETIME NULL, update_time DATETIME NULL, raw_payload JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_stages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NOT NULL,
  pipeline_pd_id BIGINT UNSIGNED NULL, name VARCHAR(255) NULL, order_nr INT NULL,
  deal_probability DECIMAL(5,2) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
  add_time DATETIME NULL, update_time DATETIME NULL, raw_payload JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pd (pipedrive_id), KEY ix_pipe (pipeline_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Config "negócio parado" por etapa (§21.3) — só local, não altera Pipedrive
CREATE TABLE IF NOT EXISTS pipe_stage_stale_config (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  stage_pd_id BIGINT UNSIGNED NOT NULL, stale_days INT NOT NULL DEFAULT 7,
  updated_by BIGINT UNSIGNED NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stage (stage_pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CAMPOS PERSONALIZADOS (metadados — §22)
CREATE TABLE IF NOT EXISTS pipe_custom_fields (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, pipedrive_id BIGINT UNSIGNED NULL,
  entity ENUM('deal','person','organization','product','activity') NOT NULL,
  field_key CHAR(40) NOT NULL,                   -- hash de 40 chars
  name VARCHAR(255) NULL, field_type VARCHAR(64) NULL, order_nr INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1, add_time DATETIME NULL, update_time DATETIME NULL,
  raw_payload JSON NULL, last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_field (entity, field_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_custom_field_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  field_id BIGINT UNSIGNED NOT NULL, option_id BIGINT UNSIGNED NOT NULL, label VARCHAR(512) NULL,
  UNIQUE KEY uq_opt (field_id, option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- valores desnormalizados (opcional; a fonte é o custom_fields JSON de cada entidade)
CREATE TABLE IF NOT EXISTS pipe_entity_custom_values (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(32) NOT NULL, entity_pd_id BIGINT UNSIGNED NOT NULL, field_key CHAR(40) NOT NULL,
  value_text TEXT NULL, value_num DECIMAL(18,4) NULL, value_date DATETIME NULL,
  KEY ix_ent (entity, entity_pd_id), KEY ix_field (field_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SINCRONIZAÇÃO / FILAS / OBSERVABILIDADE  (§27-§34)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipe_sync_cursors (          -- marca-d'água por entidade
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(32) NOT NULL, watermark_update_time DATETIME NULL, last_cursor VARCHAR(512) NULL,
  last_full_sync_at DATETIME NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity (entity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_sync_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_type ENUM('initial','incremental','webhook','reconcile','metrics','export','report') NOT NULL,
  entity VARCHAR(32) NULL, external_id VARCHAR(64) NULL, priority INT NOT NULL DEFAULT 5,
  status ENUM('pending','running','done','error','dead') NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0, next_attempt_at DATETIME NULL, last_error VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, processed_at DATETIME NULL,
  KEY ix_status (status, next_attempt_at), KEY ix_type (job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_sync_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  run_type VARCHAR(32) NOT NULL, entity VARCHAR(32) NULL, started_at DATETIME NULL, finished_at DATETIME NULL,
  processed INT DEFAULT 0, created INT DEFAULT 0, updated INT DEFAULT 0, skipped INT DEFAULT 0,
  marked_deleted INT DEFAULT 0, errors INT DEFAULT 0, api_calls INT DEFAULT 0, token_cost INT DEFAULT 0,
  status VARCHAR(32) NULL, KEY ix_entity (entity, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_sync_errors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  run_id BIGINT UNSIGNED NULL, entity VARCHAR(32) NULL, external_id VARCHAR(64) NULL,
  error_code VARCHAR(64) NULL, message VARCHAR(1024) NULL, retryable TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_api_requests (          -- §33.2 (sem token/headers de auth!)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  correlation_id CHAR(36) NULL, method VARCHAR(8) NULL, endpoint VARCHAR(255) NULL, entity VARCHAR(32) NULL,
  http_status INT NULL, duration_ms INT NULL, token_cost INT NULL, returned_count INT NULL,
  ratelimit_remaining INT NULL, daily_requests_left INT NULL, attempt INT DEFAULT 1,
  result ENUM('ok','error') NULL, error_message VARCHAR(512) NULL, job_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_created (created_at), KEY ix_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  webhook_id BIGINT UNSIGNED NULL, event_action VARCHAR(32) NULL, event_object VARCHAR(32) NULL,
  object_id VARCHAR(64) NULL, company_id BIGINT UNSIGNED NULL, event_time DATETIME NULL,
  status ENUM('received','processed','error','duplicate') NOT NULL DEFAULT 'received',
  dedup_key VARCHAR(128) NULL, raw_payload JSON NULL, received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL, UNIQUE KEY uq_dedup (dedup_key), KEY ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- ALERTAS / MÉTRICAS / VÍNCULOS ERP / PREFERÊNCIAS / EXPORT  (§35, §36, §23.2, §37)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipe_alert_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, rule_key VARCHAR(64) NOT NULL,
  name VARCHAR(255) NULL, is_enabled TINYINT(1) NOT NULL DEFAULT 1, severity ENUM('info','warning','critical') DEFAULT 'warning',
  threshold_json JSON NULL, cooldown_minutes INT DEFAULT 60, quiet_json JSON NULL,
  pipelines_json JSON NULL, stages_json JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rule (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_alert_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, rule_key VARCHAR(64) NOT NULL,
  entity VARCHAR(32) NULL, entity_pd_id VARCHAR(64) NULL, severity ENUM('info','warning','critical') DEFAULT 'warning',
  dedup_key VARCHAR(160) NULL, state ENUM('open','resolved') NOT NULL DEFAULT 'open',
  message VARCHAR(512) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at DATETIME NULL,
  UNIQUE KEY uq_dedup (dedup_key), KEY ix_rule (rule_key, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_entity_links (           -- cruzamento ERP (§36.3)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pipe_entity VARCHAR(32) NOT NULL, pipe_id VARCHAR(64) NOT NULL,
  erp_entity VARCHAR(32) NOT NULL, erp_id VARCHAR(64) NOT NULL,
  match_type ENUM('exact','probable','possible','manual','divergent') NOT NULL,
  rule VARCHAR(128) NULL, confidence DECIMAL(5,2) NULL, status ENUM('active','rejected') DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_validated_at DATETIME NULL,
  KEY ix_pipe (pipe_entity, pipe_id), KEY ix_erp (erp_entity, erp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_user_preferences (       -- §23.2 (colunas/densidade por usuário)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
  screen_key VARCHAR(64) NOT NULL, prefs_json JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_us (user_id, screen_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_export_jobs (            -- §37.4
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NULL,
  screen_key VARCHAR(64) NULL, format ENUM('csv','xlsx','pdf','json') NULL, params_json JSON NULL,
  status ENUM('pending','running','done','error') NOT NULL DEFAULT 'pending',
  file_path VARCHAR(512) NULL, expires_at DATETIME NULL, error VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at DATETIME NULL, KEY ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_report_schedules (       -- §38
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, report_key VARCHAR(64) NOT NULL,
  frequency ENUM('daily','weekly','monthly','quarterly','custom') NULL, cron_expr VARCHAR(64) NULL,
  format ENUM('csv','xlsx','pdf','json') NULL, recipients_json JSON NULL, is_enabled TINYINT(1) DEFAULT 1,
  last_run_at DATETIME NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_report (report_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_metrics_daily (          -- agregações pré-calculadas (§32)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, metric_date DATE NOT NULL,
  dimension VARCHAR(64) NULL, dimension_id VARCHAR(64) NULL, metric_key VARCHAR(64) NOT NULL,
  metric_value DECIMAL(20,4) NULL, computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_m (metric_date, dimension, dimension_id, metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS pipe_metrics_hourly (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, metric_hour DATETIME NOT NULL,
  metric_key VARCHAR(64) NOT NULL, metric_value DECIMAL(20,4) NULL,
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_m (metric_hour, metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FIM DO RASCUNHO. Revisar índices/tipos com o DBA antes de aplicar.
