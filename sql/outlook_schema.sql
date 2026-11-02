-- =====================================================================
-- OUTLOOK_DSHOW — DDL RASCUNHO / REVISÁVEL  (briefing Integração Outlook §28)
-- =====================================================================
-- ⚠️ NÃO APLICAR AINDA. Documento de planejamento para revisão do dono/DBA.
-- Convenção do repo (fiel a sql/pipedrive_schema.sql / sql/datatables_schema.sql):
--   - 100% CREATE + seeds; zero ALTER/DROP em tabela existente.
--   - CREATE TABLE IF NOT EXISTS (reaplicável/idempotente).
--   - InnoDB, utf8mb4, utf8mb4_unicode_ci.
--   - Sem runner de migração: aplicação manual
--       mysql -h 127.0.0.1 -u <admin> -p OUTLOOK_DSHOW < sql/outlook_schema.sql
--   - Usuário da aplicação: dedicado NÃO-root (outlook_app), GRANT só neste schema.
--
-- PRINCÍPIO DE PRIVACIDADE (§18, §26): o Dshow Dash NÃO copia o corpo dos e-mails.
--   Guardamos só: contas, tokens cifrados, estados de sync, assinaturas, preferências,
--   agendamentos, modelos, métricas agregadas e logs técnicos. Os conteúdos ficam
--   na Microsoft e são buscados sob demanda via Microsoft Graph.
--
-- FASE 0 usa apenas: outlook_accounts, outlook_oauth_states, outlook_technical_logs.
--   As demais tabelas ficam aqui como planejamento das Fases 1-3.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS OUTLOOK_DSHOW
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE OUTLOOK_DSHOW;

-- =====================================================================
-- FASE 0 — FUNDAÇÃO (autenticação, tokens, logs)
-- =====================================================================

-- ---------------------------------------------------------------------
-- outlook_accounts (§28.1) — contas Microsoft conectadas por usuário.
--   Multi-conta: um user_id do Dshow Dash pode conectar N contas Microsoft.
--   Tokens (access + refresh) SEMPRE cifrados em repouso (OutlookCrypto,
--   AES-256-GCM). O texto puro NUNCA é persistido, logado nem devolvido ao front.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outlook_accounts (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id                 BIGINT UNSIGNED NOT NULL,          -- dono no Dshow Dash (escopo de acesso)
  provider                ENUM('microsoft') NOT NULL DEFAULT 'microsoft',
  microsoft_account_id    VARCHAR(255) NULL,                 -- oid/sub do id_token (identidade estável)
  tenant_id               VARCHAR(255) NULL,                 -- tid do id_token (organizational | 'consumers' p/ conta pessoal)
  email                   VARCHAR(320) NULL,                 -- userPrincipalName / mail
  display_name            VARCHAR(255) NULL,
  account_type            ENUM('work','personal','shared','unknown') NOT NULL DEFAULT 'unknown',
  is_default              TINYINT(1) NOT NULL DEFAULT 0,     -- conta padrão de envio do usuário
  is_active               TINYINT(1) NOT NULL DEFAULT 1,     -- 0 = desconectada (linha inerte)
  connection_status       ENUM('connected','needs_auth','revoked','expired','error','disconnected')
                            NOT NULL DEFAULT 'connected',
  scopes                  VARCHAR(1024) NULL,                -- scopes efetivamente concedidos
  token_encrypted         TEXT NULL,                         -- access_token cifrado (envelope v1.<iv>.<tag>.<ct>)
  refresh_token_encrypted TEXT NULL,                         -- refresh_token cifrado
  token_expires_at        DATETIME NULL,                     -- expiração do access_token (UTC)
  last_sync_at            DATETIME NULL,
  last_success_at         DATETIME NULL,
  last_error_code         VARCHAR(64) NULL,
  last_error_message      VARCHAR(512) NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  disconnected_at         DATETIME NULL,
  UNIQUE KEY uq_user_msaccount (user_id, microsoft_account_id),
  KEY idx_user_active (user_id, is_active),
  KEY idx_status (connection_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- outlook_oauth_states — estado efêmero do fluxo OAuth (Authorization Code + PKCE).
--   NÃO está no §28: é operacional. Guarda o par (state, code_verifier) por poucos
--   minutos para: (a) proteger o callback contra CSRF/replay (state opaco), e
--   (b) completar a troca PKCE. O code_verifier é cifrado em repouso.
--   Linhas expiram (expires_at) e são consumidas 1x (used_at).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outlook_oauth_states (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  state                 CHAR(64) NOT NULL,                   -- token opaco (hex) devolvido pela Microsoft
  user_id               BIGINT UNSIGNED NOT NULL,            -- quem iniciou o fluxo
  code_verifier_cipher  TEXT NOT NULL,                       -- PKCE verifier cifrado
  redirect_uri          VARCHAR(512) NOT NULL,               -- redirect_uri exato usado no authorize
  return_to             VARCHAR(512) NULL,                   -- rota SPA p/ retornar após o callback
  purpose               ENUM('connect','reconnect') NOT NULL DEFAULT 'connect',
  reconnect_account_id  BIGINT UNSIGNED NULL,                -- alvo, quando purpose='reconnect'
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at            DATETIME NOT NULL,                   -- ~10 min
  used_at               DATETIME NULL,
  UNIQUE KEY uq_state (state),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- outlook_technical_logs (§28.10) — logs técnicos mínimos p/ segurança/diagnóstico.
--   §26.3: registra conexão/desconexão/falha OAuth/falha sync/falha envio/webhook/upload.
--   NUNCA registra corpo, assunto, remetente, destinatários ou anexos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outlook_technical_logs (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NULL,
  outlook_account_id BIGINT UNSIGNED NULL,
  event_type         VARCHAR(64) NOT NULL,                  -- account.connect | account.disconnect | oauth.fail | sync.fail | send.fail | webhook.error | upload.error | token.refresh
  severity           ENUM('info','warning','error') NOT NULL DEFAULT 'info',
  request_reference  CHAR(32) NULL,                         -- correlation id (sem PII)
  error_code         VARCHAR(64) NULL,
  message            VARCHAR(512) NULL,
  metadata_json      JSON NULL,                             -- metadados NÃO sensíveis (status HTTP, endpoint, etc.)
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_account (outlook_account_id),
  KEY idx_event (event_type),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- FASES 1-3 — ORGANIZAÇÃO, SYNC, DASHBOARD (planejamento — não usado na Fase 0)
-- =====================================================================

-- outlook_account_mailboxes (§28.2) — caixas acessíveis por conta (própria + compartilhadas)
CREATE TABLE IF NOT EXISTS outlook_account_mailboxes (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  outlook_account_id BIGINT UNSIGNED NOT NULL,
  mailbox_id         VARCHAR(255) NULL,
  mailbox_email      VARCHAR(320) NULL,
  display_name       VARCHAR(255) NULL,
  mailbox_type       ENUM('primary','shared','delegated') NOT NULL DEFAULT 'primary',
  can_read           TINYINT(1) NOT NULL DEFAULT 0,
  can_write          TINYINT(1) NOT NULL DEFAULT 0,
  can_send_as        TINYINT(1) NOT NULL DEFAULT 0,
  can_send_on_behalf TINYINT(1) NOT NULL DEFAULT 0,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_account_mailbox (outlook_account_id, mailbox_id),
  KEY idx_account (outlook_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_sync_states (§28.3) — watermark de delta por conta/caixa/pasta
CREATE TABLE IF NOT EXISTS outlook_sync_states (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  outlook_account_id BIGINT UNSIGNED NOT NULL,
  mailbox_id         VARCHAR(255) NULL,
  folder_id          VARCHAR(255) NULL,
  delta_link_cipher  TEXT NULL,                             -- deltaLink cifrado (contém tokens de sync)
  next_link_cipher   TEXT NULL,
  last_delta_at      DATETIME NULL,
  last_full_check_at DATETIME NULL,
  sync_status        ENUM('idle','running','error') NOT NULL DEFAULT 'idle',
  retry_count        INT NOT NULL DEFAULT 0,
  last_error         VARCHAR(512) NULL,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_scope (outlook_account_id, mailbox_id, folder_id),
  KEY idx_account (outlook_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_subscriptions (§28.4) — assinaturas de notificação do Graph
CREATE TABLE IF NOT EXISTS outlook_subscriptions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  outlook_account_id  BIGINT UNSIGNED NOT NULL,
  resource            VARCHAR(512) NOT NULL,
  subscription_id     VARCHAR(255) NULL,
  client_state_cipher TEXT NULL,
  expires_at          DATETIME NULL,
  status              ENUM('active','expired','removed','error') NOT NULL DEFAULT 'active',
  last_notification_at DATETIME NULL,
  last_renewal_at     DATETIME NULL,
  last_error          VARCHAR(512) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subscription (subscription_id),
  KEY idx_account (outlook_account_id),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_scheduled_messages (§28.5) — agendamento de envio
CREATE TABLE IF NOT EXISTS outlook_scheduled_messages (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NOT NULL,
  outlook_account_id BIGINT UNSIGNED NOT NULL,
  mailbox_id         VARCHAR(255) NULL,
  draft_message_id   VARCHAR(255) NULL,
  scheduled_at_utc   DATETIME NOT NULL,
  user_timezone      VARCHAR(64) NULL,
  status             ENUM('scheduled','processing','sent','cancelled','failed','needs_auth')
                       NOT NULL DEFAULT 'scheduled',
  attempt_count      INT NOT NULL DEFAULT 0,
  last_attempt_at    DATETIME NULL,
  sent_at            DATETIME NULL,
  cancelled_at       DATETIME NULL,
  last_error         VARCHAR(512) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_due (status, scheduled_at_utc),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_templates (§28.6) — modelos de e-mail
CREATE TABLE IF NOT EXISTS outlook_templates (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL,
  name                VARCHAR(255) NOT NULL,
  category            VARCHAR(128) NULL,
  subject_template    VARCHAR(998) NULL,
  body_html           MEDIUMTEXT NULL,
  body_text           MEDIUMTEXT NULL,
  dynamic_fields_json JSON NULL,
  is_favorite         TINYINT(1) NOT NULL DEFAULT 0,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME NULL,
  KEY idx_user (user_id),
  KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_user_preferences (§28.7) — preferências de UI por usuário
CREATE TABLE IF NOT EXISTS outlook_user_preferences (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id               BIGINT UNSIGNED NOT NULL,
  default_account_id    BIGINT UNSIGNED NULL,
  layout_mode           VARCHAR(32) NULL,       -- three-col | two-col | list
  reading_pane_position VARCHAR(16) NULL,       -- right | bottom | off
  density               VARCHAR(16) NULL,       -- compact | comfortable
  conversation_view     TINYINT(1) NOT NULL DEFAULT 1,
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  toast_enabled         TINYINT(1) NOT NULL DEFAULT 1,
  badge_enabled         TINYINT(1) NOT NULL DEFAULT 1,
  refresh_interval      INT NOT NULL DEFAULT 60,
  dashboard_period      VARCHAR(32) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_daily_metrics (§28.8) — métricas agregadas diárias (badge/dashboard)
CREATE TABLE IF NOT EXISTS outlook_daily_metrics (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id                  BIGINT UNSIGNED NOT NULL,
  outlook_account_id       BIGINT UNSIGNED NOT NULL,
  metric_date              DATE NOT NULL,
  received_count           INT NOT NULL DEFAULT 0,
  sent_count               INT NOT NULL DEFAULT 0,
  unread_count             INT NOT NULL DEFAULT 0,
  important_count          INT NOT NULL DEFAULT 0,
  attachment_count         INT NOT NULL DEFAULT 0,
  reply_count              INT NOT NULL DEFAULT 0,
  average_response_seconds INT NULL,
  calculated_at            DATETIME NULL,
  UNIQUE KEY uq_metric (user_id, outlook_account_id, metric_date),
  KEY idx_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- outlook_mass_send_jobs (§28.9) — envio em massa (Fase 3)
CREATE TABLE IF NOT EXISTS outlook_mass_send_jobs (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NOT NULL,
  outlook_account_id BIGINT UNSIGNED NOT NULL,
  subject            VARCHAR(998) NULL,
  draft_message_id   VARCHAR(255) NULL,
  recipient_count    INT NOT NULL DEFAULT 0,
  processed_count    INT NOT NULL DEFAULT 0,
  success_count      INT NOT NULL DEFAULT 0,
  failure_count      INT NOT NULL DEFAULT 0,
  status             ENUM('queued','processing','done','failed','cancelled') NOT NULL DEFAULT 'queued',
  started_at         DATETIME NULL,
  finished_at        DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- FIM DO RASCUNHO — revisar antes de aplicar.
-- =====================================================================
