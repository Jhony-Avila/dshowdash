-- ═══════════════════════════════════════════════════════════════════════════
-- GCAL_DSHOW — schema do módulo Google Calendar
-- @version 1.0.0  @created 2026-07-29
--
-- ⚠️ NÃO EXECUTADO. Este arquivo é a PROPOSTA da Fase 4; o banco ainda não foi
--    provisionado (a Fase 2 é mock puro, em $_SESSION). Executar exige decisão
--    do dono/DBA — inclusive porque a aplicação hoje conecta no MySQL como
--    root, o que precisa ser resolvido ANTES de o módulo passar a escrever.
--
-- Molde: docs/PIPEDRIVE/02-banco-PIPE_DSHOW.sql (único módulo com persistência
-- real já exercitada neste projeto).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- REGRA INEGOCIÁVEL DE FUSO
-- Todo DATETIME aqui é UTC. Sem exceção. `mysql.time_zone_name` está VAZIA
-- neste servidor, então CONVERT_TZ por nome devolve NULL — e NULL num WHERE de
-- janela some com o evento sem erro nenhum no log. A conversão para o fuso do
-- usuário acontece em PHP (lib/Tz.php) ou no browser (src/lib/tz.ts).
-- NENHUMA query deste módulo pode conter CONVERT_TZ.
--
-- Exceção proposital: colunas `*_date` de evento de dia inteiro são DATE, não
-- DATETIME — dia inteiro não tem hora nem fuso (§48).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS GCAL_DSHOW
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE GCAL_DSHOW;

-- ── Contas e credenciais ────────────────────────────────────────────────────

CREATE TABLE gcal_accounts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NOT NULL           COMMENT 'app_users.id — isolamento por usuário',
  google_account_id VARCHAR(64)  NOT NULL              COMMENT 'sub do id_token; estável',
  email             VARCHAR(190) NOT NULL,
  display_name      VARCHAR(190) NULL,
  account_type      ENUM('workspace','personal') NOT NULL DEFAULT 'personal',
  organization      VARCHAR(190) NULL,
  is_default        TINYINT(1) NOT NULL DEFAULT 0,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  connection_status ENUM('connected','reauth_required','revoked','error') NOT NULL DEFAULT 'connected',
  scopes            VARCHAR(500) NOT NULL              COMMENT 'escopos REALMENTE concedidos, não os pedidos',
  last_sync_at      DATETIME NULL,
  last_success_at   DATETIME NULL,
  last_error_code   VARCHAR(64)  NULL,
  last_error_message VARCHAR(500) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  disconnected_at   DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_google (user_id, google_account_id),
  KEY ix_user (user_id, is_active)
) ENGINE=InnoDB
  COMMENT='Contas Google conectadas. NUNCA guarda token — ver gcal_oauth_tokens.';

CREATE TABLE gcal_oauth_tokens (
  account_id        BIGINT UNSIGNED NOT NULL,
  access_token_enc  TEXT NOT NULL      COMMENT 'AES-256-GCM (GcalCrypto), envelope v1.<iv>.<tag>.<ct>',
  refresh_token_enc TEXT NULL          COMMENT 'idem. O refresh do Google normalmente NÃO retorna este campo: preservar o valor anterior quando ausente, senão a conta desconecta em silêncio',
  expires_at        DATETIME NOT NULL,
  token_type        VARCHAR(32) NOT NULL DEFAULT 'Bearer',
  rotated_at        DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  CONSTRAINT fk_tok_acc FOREIGN KEY (account_id) REFERENCES gcal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Tabela separada para que um SELECT * em conta jamais traga segredo.';

CREATE TABLE gcal_oauth_states (
  state             CHAR(64) NOT NULL           COMMENT 'aleatório, consumido UMA vez',
  user_id           BIGINT UNSIGNED NOT NULL,
  code_verifier_enc TEXT NOT NULL               COMMENT 'PKCE, cifrado',
  redirect_after    VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        DATETIME NOT NULL           COMMENT 'TTL curto (10 min)',
  consumed_at       DATETIME NULL,
  PRIMARY KEY (state),
  KEY ix_exp (expires_at)
) ENGINE=InnoDB;

-- ── Calendários ─────────────────────────────────────────────────────────────

CREATE TABLE gcal_calendars (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  calendar_id   VARCHAR(255) NOT NULL       COMMENT 'ID do Google (normalmente um e-mail) — §58',
  summary       VARCHAR(255) NOT NULL,
  description   TEXT NULL,
  time_zone     VARCHAR(64)  NOT NULL DEFAULT 'America/Sao_Paulo',
  color_id      VARCHAR(16)  NULL,
  color_hex     CHAR(7)      NULL,
  access_role   ENUM('owner','writer','reader','freeBusyReader') NOT NULL,
  is_primary    TINYINT(1) NOT NULL DEFAULT 0,
  kind          ENUM('personal','team','resource','holiday','other') NOT NULL DEFAULT 'other',
  capacity      SMALLINT UNSIGNED NULL      COMMENT 'só recurso (§29.2)',
  resource_location VARCHAR(190) NULL,
  etag          VARCHAR(190) NULL,
  deleted       TINYINT(1) NOT NULL DEFAULT 0,
  synced_at     DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_acc_cal (account_id, calendar_id),
  CONSTRAINT fk_cal_acc FOREIGN KEY (account_id) REFERENCES gcal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_calendar_list_entries (
  account_id  BIGINT UNSIGNED NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  selected    TINYINT(1) NOT NULL DEFAULT 1,
  favorite    TINYINT(1) NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  color_override CHAR(7) NULL     COMMENT 'cor local do usuário (§70)',
  PRIMARY KEY (account_id, calendar_id)
) ENGINE=InnoDB;

-- ── Eventos ─────────────────────────────────────────────────────────────────

CREATE TABLE gcal_events (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id          BIGINT UNSIGNED NOT NULL,
  calendar_id         VARCHAR(255) NOT NULL,
  event_id            VARCHAR(255) NOT NULL      COMMENT 'ID do Google — §58, jamais reescrito',
  ical_uid            VARCHAR(255) NULL,
  recurring_event_id  VARCHAR(255) NULL          COMMENT 'ID da série, quando é instância',
  original_start_utc  DATETIME NULL              COMMENT 'instância movida: início original',
  status              ENUM('confirmed','tentative','cancelled') NOT NULL DEFAULT 'confirmed',
  summary             VARCHAR(500) NULL,
  description         MEDIUMTEXT NULL,
  location            VARCHAR(500) NULL,

  -- Dia inteiro NÃO é evento de 24 h (§48): usa as colunas DATE, e as UTC ficam NULL.
  all_day             TINYINT(1) NOT NULL DEFAULT 0,
  start_utc           DATETIME NULL,
  end_utc             DATETIME NULL,
  start_date          DATE NULL,
  end_date            DATE NULL                  COMMENT 'exclusivo, como no Google',
  event_time_zone     VARCHAR(64) NULL,

  transparency        ENUM('opaque','transparent') NOT NULL DEFAULT 'opaque',
  visibility          ENUM('default','public','private','confidential') NOT NULL DEFAULT 'default',
  event_type          ENUM('default','focusTime','outOfOffice','workingLocation','birthday','fromGmail') NOT NULL DEFAULT 'default',  -- 02d (28/10/2026): +fromGmail
  organizer_email     VARCHAR(190) NULL,
  organizer_name      VARCHAR(190) NULL,
  organizer_self      TINYINT(1) NOT NULL DEFAULT 0,
  my_response         ENUM('accepted','declined','tentative','needsAction') NULL,
  color_id            VARCHAR(16) NULL,
  etag                VARCHAR(190) NULL,
  sequence            INT UNSIGNED NOT NULL DEFAULT 0,
  html_link           VARCHAR(500) NULL,
  google_created      DATETIME NULL,
  google_updated      DATETIME NULL,
  synced_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted             TINYINT(1) NOT NULL DEFAULT 0,
  payload_hash        CHAR(40) NULL   COMMENT 'sha1 do payload normalizado: pula UPDATE quando nada mudou',
  raw_payload         JSON NULL       COMMENT 'resposta crua, para reprocessar sem nova chamada à API',

  PRIMARY KEY (id),
  UNIQUE KEY uq_acc_cal_evt (account_id, calendar_id, event_id),
  -- Índice da consulta quente: janela por calendário. A ordem das colunas
  -- importa (igualdade antes de faixa), senão o range não usa o índice.
  KEY ix_janela (account_id, calendar_id, start_utc, end_utc),
  KEY ix_janela_dia (account_id, calendar_id, start_date),
  KEY ix_serie (recurring_event_id),
  KEY ix_uid (ical_uid),
  KEY ix_updated (account_id, google_updated),
  CONSTRAINT fk_evt_acc FOREIGN KEY (account_id) REFERENCES gcal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_event_attendees (
  event_pk      BIGINT UNSIGNED NOT NULL,
  email         VARCHAR(190) NOT NULL,
  display_name  VARCHAR(190) NULL,
  response      ENUM('accepted','declined','tentative','needsAction') NOT NULL DEFAULT 'needsAction',
  optional      TINYINT(1) NOT NULL DEFAULT 0,
  is_organizer  TINYINT(1) NOT NULL DEFAULT 0,
  is_self       TINYINT(1) NOT NULL DEFAULT 0,
  is_resource   TINYINT(1) NOT NULL DEFAULT 0,
  comment       VARCHAR(500) NULL,
  PRIMARY KEY (event_pk, email),
  KEY ix_email (email, response),
  CONSTRAINT fk_att_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_event_reminders (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_pk  BIGINT UNSIGNED NOT NULL,
  method    ENUM('popup','email') NOT NULL,
  minutes   INT NOT NULL,
  PRIMARY KEY (id),
  KEY ix_evt (event_pk),
  CONSTRAINT fk_rem_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_event_recurrence (
  event_pk   BIGINT UNSIGNED NOT NULL,
  rrule      VARCHAR(500) NOT NULL,
  rdate      TEXT NULL,
  exdate     TEXT NULL,
  human      VARCHAR(255) NULL   COMMENT 'texto pt-BR pré-renderizado para a UI',
  PRIMARY KEY (event_pk),
  CONSTRAINT fk_rec_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_event_conferences (
  event_pk    BIGINT UNSIGNED NOT NULL,
  platform    VARCHAR(48) NOT NULL,
  uri         VARCHAR(500) NOT NULL,
  meeting_code VARCHAR(64) NULL,
  phone       VARCHAR(64) NULL,
  pin_enc     TEXT NULL    COMMENT 'cifrado: PIN é credencial de acesso à sala (§24.2)',
  PRIMARY KEY (event_pk),
  CONSTRAINT fk_conf_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gcal_event_attachments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_pk   BIGINT UNSIGNED NOT NULL,
  file_id    VARCHAR(190) NULL,
  file_url   VARCHAR(500) NOT NULL,
  title      VARCHAR(255) NULL,
  mime_type  VARCHAR(128) NULL,
  PRIMARY KEY (id),
  KEY ix_evt (event_pk),
  CONSTRAINT fk_anx_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Vínculos internos (§57) ─────────────────────────────────────────────────

CREATE TABLE gcal_event_links (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_pk     BIGINT UNSIGNED NOT NULL,
  entity_type  VARCHAR(48) NOT NULL   COMMENT 'pipedrive_deal|cliente|fornecedor|proposta|pedido|projeto|colaborador|email',
  entity_id    VARCHAR(64) NOT NULL,
  relation_type VARCHAR(48) NOT NULL DEFAULT 'reuniao',
  label_cache  VARCHAR(255) NULL      COMMENT 'rótulo no momento do vínculo: a UI ainda mostra algo se a entidade sumir',
  created_by   BIGINT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_link (event_pk, entity_type, entity_id, relation_type),
  KEY ix_entidade (entity_type, entity_id),
  CONSTRAINT fk_lnk_evt FOREIGN KEY (event_pk) REFERENCES gcal_events(id) ON DELETE CASCADE
) ENGINE=InnoDB
  COMMENT='Tabela genérica em vez de FK por módulo: o alvo mora em OUTRO banco (PIPE_DSHOW, DSHOW_PROD), então FK real seria impossível.';

-- ── Disponibilidade ─────────────────────────────────────────────────────────

CREATE TABLE gcal_freebusy_cache (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject     VARCHAR(190) NOT NULL   COMMENT 'e-mail da pessoa ou do recurso',
  window_from DATETIME NOT NULL,
  window_to   DATETIME NOT NULL,
  busy_json   JSON NOT NULL           COMMENT 'apenas intervalos, sem detalhe (§22)',
  fetched_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_janela (subject, window_from, window_to),
  KEY ix_exp (expires_at)
) ENGINE=InnoDB;

-- ── Sincronização (§49, §50, §51) ───────────────────────────────────────────

CREATE TABLE gcal_sync_state (
  account_id     BIGINT UNSIGNED NOT NULL,
  calendar_id    VARCHAR(255) NOT NULL,
  sync_token_enc TEXT NULL       COMMENT 'cifrado: autoriza ler o delta da agenda inteira',
  status         ENUM('ok','stale','error','full_resync_required') NOT NULL DEFAULT 'ok',
  last_sync_at   DATETIME NULL,
  next_sync_at   DATETIME NULL,
  last_duration_ms INT UNSIGNED NULL,
  processed      INT UNSIGNED NOT NULL DEFAULT 0,
  attempt        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  window_from    DATE NULL      COMMENT 'janela da carga inicial (§49.1)',
  window_to      DATE NULL,
  PRIMARY KEY (account_id, calendar_id),
  KEY ix_prox (next_sync_at, status)
) ENGINE=InnoDB;

CREATE TABLE gcal_watch_channels (
  channel_id   CHAR(36) NOT NULL,
  account_id   BIGINT UNSIGNED NOT NULL,
  calendar_id  VARCHAR(255) NOT NULL,
  resource_id  VARCHAR(190) NOT NULL,
  token_enc    TEXT NULL       COMMENT 'clientToken devolvido no header — cifrado',
  expiration   DATETIME NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stopped_at   DATETIME NULL,
  PRIMARY KEY (channel_id),
  UNIQUE KEY uq_cal_ativo (account_id, calendar_id, stopped_at),
  KEY ix_expira (expiration, stopped_at)
) ENGINE=InnoDB;

CREATE TABLE gcal_sync_jobs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id  BIGINT UNSIGNED NOT NULL,
  calendar_id VARCHAR(255) NULL,
  kind        ENUM('full','incremental','watch_renew','reconcile') NOT NULL,
  status      ENUM('pending','running','done','failed','dead') NOT NULL DEFAULT 'pending',
  priority    TINYINT NOT NULL DEFAULT 5,
  attempts    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  run_after   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at  DATETIME NULL,
  finished_at DATETIME NULL,
  payload     JSON NULL,
  last_error  VARCHAR(500) NULL,
  PRIMARY KEY (id),
  KEY ix_fila (status, run_after, priority)
) ENGINE=InnoDB;

CREATE TABLE gcal_sync_runs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id  BIGINT UNSIGNED NOT NULL,
  calendar_id VARCHAR(255) NULL,
  kind        VARCHAR(24) NOT NULL,
  started_at  DATETIME NOT NULL,
  finished_at DATETIME NULL,
  duration_ms INT UNSIGNED NULL,
  processed   INT UNSIGNED NOT NULL DEFAULT 0,
  created_n   INT UNSIGNED NOT NULL DEFAULT 0,
  updated_n   INT UNSIGNED NOT NULL DEFAULT 0,
  deleted_n   INT UNSIGNED NOT NULL DEFAULT 0,
  errors_n    INT UNSIGNED NOT NULL DEFAULT 0,
  correlation_id CHAR(26) NULL,
  PRIMARY KEY (id),
  KEY ix_acc (account_id, started_at)
) ENGINE=InnoDB;

CREATE TABLE gcal_sync_errors (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id      BIGINT UNSIGNED NULL,
  account_id  BIGINT UNSIGNED NOT NULL,
  calendar_id VARCHAR(255) NULL,
  event_id    VARCHAR(255) NULL,
  http_status SMALLINT UNSIGNED NULL,
  error_code  VARCHAR(64) NULL,
  message     VARCHAR(500) NULL   COMMENT 'mensagem CURTA: nunca descrição de evento nem e-mail desnecessário (§75.2)',
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  correlation_id CHAR(26) NULL,
  PRIMARY KEY (id),
  KEY ix_acc (account_id, occurred_at)
) ENGINE=InnoDB;

-- ── Alertas e auditoria ─────────────────────────────────────────────────────

CREATE TABLE gcal_alerts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  categoria   ENUM('agenda','organizacao','tecnico') NOT NULL,
  severidade  ENUM('alta','media','baixa') NOT NULL,
  titulo      VARCHAR(190) NOT NULL,
  mensagem    VARCHAR(500) NOT NULL,
  ref_type    VARCHAR(32) NULL,
  ref_id      VARCHAR(190) NULL,
  dedup_key   CHAR(40) NOT NULL   COMMENT 'sha1(categoria+ref): impede o mesmo alerta N vezes (§26.2)',
  cooldown_until DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dedup (user_id, dedup_key, resolved_at),
  KEY ix_user (user_id, resolved_at, severidade)
) ENGINE=InnoDB;

CREATE TABLE gcal_audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  account_id  BIGINT UNSIGNED NULL,
  calendar_id VARCHAR(255) NULL,
  event_id    VARCHAR(255) NULL,
  action      VARCHAR(48) NOT NULL  COMMENT 'create|update|delete|respond|connect|disconnect|export|permission',
  before_json JSON NULL,
  after_json  JSON NULL,
  result      ENUM('ok','error','denied') NOT NULL DEFAULT 'ok',
  ip          VARCHAR(45) NULL,
  origin      VARCHAR(48) NULL,
  correlation_id CHAR(26) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_user (user_id, created_at),
  KEY ix_evt (calendar_id, event_id)
) ENGINE=InnoDB
  COMMENT='before/after passam por GcalCrypto::scrub antes de gravar (§75.2).';

-- ═══════════════════════════════════════════════════════════════════════════
-- USUÁRIO DA APLICAÇÃO — o módulo NÃO deve conectar como root.
-- Ajustar a senha e executar junto do provisionamento (Fase 4).
-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE USER 'gcal_app'@'127.0.0.1' IDENTIFIED BY '<TROCAR>';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON GCAL_DSHOW.* TO 'gcal_app'@'127.0.0.1';
-- -- sem DROP, sem CREATE, sem GRANT: DDL é operação de deploy, não de runtime.
-- FLUSH PRIVILEGES;
