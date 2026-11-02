-- =====================================================================
-- ADS_DSHOW — DDL RASCUNHO / REVISÁVEL  (briefing §43)
-- =====================================================================
-- ⚠️ NÃO APLICAR AINDA. Documento de planejamento para revisão do dono/DBA.
-- Convenção do repo (fiel a sql/datatables_schema.sql / docs/PIPEDRIVE/02):
--   - 100% CREATE + seeds; zero ALTER/DROP em tabela existente.
--   - CREATE TABLE IF NOT EXISTS (reaplicável/idempotente).
--   - InnoDB, utf8mb4, utf8mb4_unicode_ci.
--   - Sem runner de migração: aplicação manual `mysql -h 127.0.0.1 -u <admin> -p ADS_DSHOW < ...`.
--   - Usuário MySQL dedicado ads_app (não-root), privilégio só neste schema.
-- Colunas técnicas padrão (§43) em toda entidade sincronizada:
--   resource_name, customer_id, is_removed, add_time, first_synced_at, last_synced_at,
--   source_updated_at, raw_payload, payload_hash, sync_version
-- ⚠️ CUSTO EM MICROS: a Google Ads API devolve dinheiro em micros (1 unidade = 1.000.000).
--    Guardamos *_micros como veio (BIGINT) E o normalizado (DECIMAL) p/ conveniência. Moeda por conta (§44.5).
-- ⚠️ HISTÓRICO NUNCA SOBRESCRITO (§43/§44.1): métricas em ads_metrics_* com dimensão de data.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ADS_DSHOW
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ADS_DSHOW;

-- ---------------------------------------------------------------------
-- CREDENCIAL / CONTAS  (OAuth2 cifrado — inserido pela app · §6)
-- ---------------------------------------------------------------------
-- Grant OAuth (1 linha por conexão do usuário-dono do grant). Tokens cifrados AES-256-GCM (AdsCrypto).
CREATE TABLE IF NOT EXISTS ads_oauth_grants (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  app_user_id     BIGINT UNSIGNED NULL,             -- usuário do Dshow Dash que conectou
  google_email    VARCHAR(320) NULL,                -- e-mail Google do grant (exibição)
  oauth_refresh_cipher TEXT NULL,                   -- AES-256-GCM (envelope v1.<iv>.<tag>.<ct>); NUNCA texto puro
  oauth_access_cipher  TEXT NULL,                   -- efêmero
  oauth_expires_at DATETIME NULL,
  scopes          VARCHAR(512) NULL,                -- .../auth/adwords [+ analytics.readonly no GA4]
  login_customer_id VARCHAR(16) NULL,               -- MCC usado como login-customer-id
  status          ENUM('connected','invalid','expired','revoked','error') NOT NULL DEFAULT 'connected',
  last_validated_at DATETIME NULL,
  last_error      VARCHAR(512) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- state + code_verifier (PKCE) efêmero, consumido 1x (anti-CSRF/replay) — molde OAuthStateRepository do Outlook.
CREATE TABLE IF NOT EXISTS ads_oauth_states (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  state         CHAR(64) NOT NULL,
  code_verifier VARCHAR(256) NULL,
  app_user_id   BIGINT UNSIGNED NULL,
  return_to     VARCHAR(255) NULL,                  -- só rota interna (anti open-redirect)
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at   DATETIME NULL,
  UNIQUE KEY uq_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contas-cliente conectadas (as 2 iniciais; N no futuro — §6). Uma linha por customer.
CREATE TABLE IF NOT EXISTS ads_accounts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  grant_id        BIGINT UNSIGNED NULL,             -- FK lógica -> ads_oauth_grants
  customer_id     VARCHAR(16) NOT NULL,             -- ID Google Ads (só dígitos, sem hífen)
  descriptive_name VARCHAR(255) NULL,
  currency_code   CHAR(3) NULL,                     -- §6: moeda da conta
  time_zone       VARCHAR(64) NULL,                 -- §6: fuso da conta
  manager_customer_id VARCHAR(16) NULL,             -- MCC pai (login-customer-id)
  is_manager      TINYINT(1) NOT NULL DEFAULT 0,
  is_test_account TINYINT(1) NOT NULL DEFAULT 0,
  auto_tagging_enabled TINYINT(1) NULL,             -- relevante p/ GCLID (§18)
  status          ENUM('enabled','suspended','canceled','closed','not_configured','error') NOT NULL DEFAULT 'not_configured',
  is_favorite     TINYINT(1) NOT NULL DEFAULT 0,    -- §6: favoritar
  is_default      TINYINT(1) NOT NULL DEFAULT 0,    -- §6: conta padrão
  last_synced_at  DATETIME NULL,                    -- §6: último dado importado
  last_error      VARCHAR(512) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- ESTRUTURA DE CAMPANHAS  (recursos Google Ads · §11-§14)
-- ---------------------------------------------------------------------
-- Orçamento é recurso SEPARADO na API (campaign_budget) — §24.
CREATE TABLE IF NOT EXISTS ads_budgets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  budget_id       BIGINT UNSIGNED NOT NULL,         -- campaign_budget.id
  resource_name   VARCHAR(255) NULL,
  name            VARCHAR(255) NULL,
  amount_micros   BIGINT NULL,                      -- orçamento diário em micros
  amount          DECIMAL(18,2) NULL,               -- normalizado
  delivery_method VARCHAR(32) NULL,                 -- STANDARD / ACCELERATED
  is_shared       TINYINT(1) NULL,
  period          VARCHAR(16) NULL,                 -- DAILY
  is_removed      TINYINT(1) NOT NULL DEFAULT 0,
  raw_payload     JSON NULL, payload_hash CHAR(64) NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget (customer_id, budget_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_campaigns (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  campaign_id     BIGINT UNSIGNED NOT NULL,
  resource_name   VARCHAR(255) NULL,
  name            VARCHAR(512) NULL,
  status          ENUM('ENABLED','PAUSED','REMOVED','UNKNOWN') NULL,        -- §11.1
  serving_status  VARCHAR(32) NULL,                 -- SERVING / LIMITED (limitada p/ orçamento §11.2)
  advertising_channel_type VARCHAR(32) NULL,        -- SEARCH/DISPLAY/PMAX/VIDEO/SHOPPING (§11.1 tipo)
  advertising_channel_sub_type VARCHAR(32) NULL,
  bidding_strategy_type VARCHAR(48) NULL,           -- §11.1 estratégia de lance
  budget_id       BIGINT UNSIGNED NULL,             -- -> ads_budgets
  optimization_score DECIMAL(5,4) NULL,             -- §11.1 índice de otimização (0..1)
  campaign_objective VARCHAR(64) NULL,              -- §11.1 objetivo
  start_date      DATE NULL,                        -- §11.1 data de início
  end_date        DATE NULL,
  labels          JSON NULL,
  -- classificação calculada por nós (§11.2) — preenchida no sync/analytics:
  health_class    ENUM('excellent','healthy','attention','critical','no_data',
                       'budget_limited','wasting','scale_opportunity') NULL,
  is_removed      TINYINT(1) NOT NULL DEFAULT 0,
  add_time        DATETIME NULL,
  source_updated_at DATETIME NULL,                  -- change_status.last_change_date_time
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  raw_payload     JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_campaign (customer_id, campaign_id),
  KEY ix_status (status), KEY ix_channel (advertising_channel_type), KEY ix_health (health_class)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_ad_groups (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  ad_group_id     BIGINT UNSIGNED NOT NULL,
  campaign_id     BIGINT UNSIGNED NOT NULL,
  resource_name   VARCHAR(255) NULL,
  name            VARCHAR(512) NULL,
  status          ENUM('ENABLED','PAUSED','REMOVED','UNKNOWN') NULL,
  type            VARCHAR(48) NULL,
  cpc_bid_micros  BIGINT NULL, cpc_bid DECIMAL(18,2) NULL,
  -- calculados (§12): aderência semântica, canibalização, oportunidade de divisão
  semantic_fit    DECIMAL(5,2) NULL,
  cannibalization_flag TINYINT(1) NOT NULL DEFAULT 0,
  split_opportunity TINYINT(1) NOT NULL DEFAULT 0,
  is_removed      TINYINT(1) NOT NULL DEFAULT 0,
  source_updated_at DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  raw_payload     JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_adgroup (customer_id, ad_group_id),
  KEY ix_campaign (campaign_id), KEY ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_ads (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  ad_id           BIGINT UNSIGNED NOT NULL,         -- ad_group_ad.ad.id
  ad_group_id     BIGINT UNSIGNED NOT NULL,
  campaign_id     BIGINT UNSIGNED NULL,
  resource_name   VARCHAR(255) NULL,
  status          ENUM('ENABLED','PAUSED','REMOVED','UNKNOWN') NULL,
  ad_type         VARCHAR(48) NULL,                 -- RESPONSIVE_SEARCH_AD, etc. (§13.1)
  ad_strength     VARCHAR(16) NULL,                 -- §13.1 força do anúncio
  final_urls      JSON NULL,                        -- §13.1 URL final
  display_path    VARCHAR(128) NULL,                -- §13.1 caminho de exibição
  headlines       JSON NULL,                        -- §13.1 títulos (array de assets)
  descriptions    JSON NULL,                        -- §13.1 descrições
  approval_status VARCHAR(32) NULL,                 -- §13.1 aprovação
  policy_topics   JSON NULL,                        -- §13.1 motivos de reprovação
  is_removed      TINYINT(1) NOT NULL DEFAULT 0,
  source_updated_at DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  raw_payload     JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_ad (customer_id, ad_id),
  KEY ix_adgroup (ad_group_id), KEY ix_status (status), KEY ix_approval (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recursos de anúncio / extensões (assets — §43 "recursos de anúncios")
CREATE TABLE IF NOT EXISTS ads_assets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  asset_id        BIGINT UNSIGNED NOT NULL,
  resource_name   VARCHAR(255) NULL,
  type            VARCHAR(48) NULL,                 -- SITELINK/CALLOUT/IMAGE/CALL/...
  name            VARCHAR(255) NULL,
  text_content    VARCHAR(1024) NULL,
  raw_payload     JSON NULL, is_removed TINYINT(1) NOT NULL DEFAULT 0,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asset (customer_id, asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_keywords (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  criterion_id    BIGINT UNSIGNED NOT NULL,         -- ad_group_criterion.criterion_id
  ad_group_id     BIGINT UNSIGNED NOT NULL,
  campaign_id     BIGINT UNSIGNED NULL,
  resource_name   VARCHAR(255) NULL,
  keyword_text    VARCHAR(512) NULL,                -- §14.1
  match_type      ENUM('EXACT','PHRASE','BROAD','UNKNOWN') NULL,  -- §14.1 tipo de correspondência
  status          ENUM('ENABLED','PAUSED','REMOVED','UNKNOWN') NULL,
  is_negative     TINYINT(1) NOT NULL DEFAULT 0,    -- palavra negativa (§15.1)
  quality_score   TINYINT NULL,                     -- §14.1 Quality Score (1..10)
  qs_ad_relevance VARCHAR(24) NULL,                 -- §14.1 relevância do anúncio
  qs_landing_page VARCHAR(24) NULL,                 -- §14.1 experiência na página
  qs_expected_ctr VARCHAR(24) NULL,                 -- §14.1 CTR esperado
  final_urls      JSON NULL,
  -- classificação calculada (§14.2):
  kw_class        ENUM('profitable','promising','low_volume','expensive','low_quality',
                       'no_conversion','wasting','bad_intent','page_issue','ad_issue',
                       'pause_candidate','expand_candidate') NULL,
  is_removed      TINYINT(1) NOT NULL DEFAULT 0,
  source_updated_at DATETIME NULL,
  first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  raw_payload     JSON NULL, payload_hash CHAR(64) NULL, sync_version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_kw (customer_id, criterion_id),
  KEY ix_adgroup (ad_group_id), KEY ix_neg (is_negative), KEY ix_class (kw_class)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Termos de pesquisa (search_term_view) — §15. Alto volume; particionável por data no futuro.
CREATE TABLE IF NOT EXISTS ads_search_terms (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  search_term     VARCHAR(512) NOT NULL,
  ad_group_id     BIGINT UNSIGNED NULL,
  campaign_id     BIGINT UNSIGNED NULL,
  matched_keyword VARCHAR(512) NULL,
  match_type      VARCHAR(16) NULL,
  status          VARCHAR(24) NULL,                 -- ADDED / EXCLUDED / NONE
  -- classificação calculada (§15): relevante/irrelevante/desperdício/comercial/informacional/concorrente...
  term_class      VARCHAR(32) NULL,
  segment_date    DATE NULL,                        -- termos vêm segmentados por data no relatório
  raw_payload     JSON NULL,
  last_synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_term (customer_id, ad_group_id, search_term, segment_date),
  KEY ix_class (term_class), KEY ix_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Públicos (§22), Localizações (§20), Dispositivos (§19) — critérios/dimensões
CREATE TABLE IF NOT EXISTS ads_audiences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id VARCHAR(16) NOT NULL,
  criterion_id BIGINT UNSIGNED NULL, campaign_id BIGINT UNSIGNED NULL, ad_group_id BIGINT UNSIGNED NULL,
  audience_type VARCHAR(48) NULL, name VARCHAR(255) NULL, funnel_stage VARCHAR(32) NULL, size_estimate BIGINT NULL,
  raw_payload JSON NULL, is_removed TINYINT(1) NOT NULL DEFAULT 0,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_landing_pages (      -- §16 (landing_page_view + join GA4)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id VARCHAR(16) NOT NULL,
  url_hash CHAR(64) NOT NULL, final_url VARCHAR(2048) NULL, expanded_url VARCHAR(2048) NULL,
  campaign_id BIGINT UNSIGNED NULL,
  -- Core Web Vitals / desempenho (§16.1) — origem: GA4/PageSpeed (Fase 2)
  speed_score DECIMAL(5,2) NULL, cwv_lcp DECIMAL(8,2) NULL, cwv_cls DECIMAL(6,3) NULL, cwv_inp INT NULL,
  mobile_score DECIMAL(5,2) NULL, desktop_score DECIMAL(5,2) NULL,
  match_intent_flag TINYINT(1) NULL,                -- §16.3 correspondência intenção/promessa
  raw_payload JSON NULL,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lp (customer_id, url_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_conversion_actions ( -- §23
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id VARCHAR(16) NOT NULL,
  conversion_action_id BIGINT UNSIGNED NOT NULL, resource_name VARCHAR(255) NULL,
  name VARCHAR(255) NULL, category VARCHAR(48) NULL, type VARCHAR(48) NULL, status VARCHAR(24) NULL,
  counting_type VARCHAR(24) NULL, attribution_model VARCHAR(48) NULL, click_through_window_days INT NULL,
  value_settings JSON NULL, origin VARCHAR(48) NULL,  -- WEBSITE/CALL/APP/UPLOAD (§23)
  tracking_quality VARCHAR(24) NULL,                  -- §23 qualidade do rastreamento (calculado)
  raw_payload JSON NULL, is_removed TINYINT(1) NOT NULL DEFAULT 0,
  last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conv (customer_id, conversion_action_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- MÉTRICAS  (§43: dimensão de data preservada, nunca sobrescritas · §7/§8/§21)
-- ---------------------------------------------------------------------
-- Métrica diária genérica por (entidade + data [+ segmento opcional]). Custo em micros + normalizado.
-- entity: account|campaign|ad_group|ad|keyword|search_term|landing_page|conversion_action|audience|location|device
-- segment: none|device|network|day_of_week|hour|geo|conversion_action|... (segments.* do GAQL)
CREATE TABLE IF NOT EXISTS ads_metrics_daily (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id     VARCHAR(16) NOT NULL,
  entity          VARCHAR(24) NOT NULL,
  entity_id       VARCHAR(96) NOT NULL,             -- id do recurso (ou hash, p/ search_term/landing_page)
  metric_date     DATE NOT NULL,
  segment         VARCHAR(24) NOT NULL DEFAULT 'none',
  segment_value   VARCHAR(96) NULL,                 -- ex.: MOBILE, SEARCH, MONDAY, hora 14, geo id
  impressions     BIGINT NULL,
  clicks          BIGINT NULL,
  cost_micros     BIGINT NULL,                      -- como veio da API
  cost            DECIMAL(18,2) NULL,               -- normalizado (÷1e6, moeda da conta)
  conversions     DECIMAL(18,2) NULL,
  conversions_value DECIMAL(18,2) NULL,
  all_conversions DECIMAL(18,2) NULL,
  ctr             DECIMAL(9,6) NULL,
  average_cpc     DECIMAL(18,2) NULL,
  average_cpm     DECIMAL(18,2) NULL,
  search_impression_share DECIMAL(7,4) NULL,        -- parcela de impressões (§7.1)
  -- desdobramentos de conversão úteis (§7.1): leads/ligações/formulários/whatsapp vêm por conversion_action
  computed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_m (customer_id, entity, entity_id, metric_date, segment, segment_value),
  KEY ix_date (metric_date), KEY ix_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Métrica horária (§21: matriz dia×hora, custo/conversão por faixa horária)
CREATE TABLE IF NOT EXISTS ads_metrics_hourly (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(16) NOT NULL, entity VARCHAR(24) NOT NULL, entity_id VARCHAR(96) NOT NULL,
  metric_date DATE NOT NULL, hour_of_day TINYINT NOT NULL,   -- 0..23 (segments.hour)
  impressions BIGINT NULL, clicks BIGINT NULL, cost_micros BIGINT NULL, cost DECIMAL(18,2) NULL,
  conversions DECIMAL(18,2) NULL, conversions_value DECIMAL(18,2) NULL,
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mh (customer_id, entity, entity_id, metric_date, hour_of_day),
  KEY ix_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SINCRONIZAÇÃO / FILAS / OBSERVABILIDADE  (§40 — interno, fora do painel)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ads_sync_cursors (       -- marca-d'água por (conta, entidade)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(16) NOT NULL, entity VARCHAR(32) NOT NULL,
  last_metric_date DATE NULL,                        -- última data já materializada (relatórios)
  last_change_read_at DATETIME NULL,                 -- último change_event/change_status lido
  last_full_sync_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity (customer_id, entity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_sync_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_type ENUM('initial','structure','metrics','changes','recommendations','metrics_calc','export','report','mutate') NOT NULL,
  customer_id VARCHAR(16) NULL, entity VARCHAR(32) NULL, params_json JSON NULL, priority INT NOT NULL DEFAULT 5,
  status ENUM('pending','running','done','error','dead') NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0, next_attempt_at DATETIME NULL, last_error VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, processed_at DATETIME NULL,
  KEY ix_status (status, next_attempt_at), KEY ix_type (job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_sync_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  run_type VARCHAR(32) NOT NULL, customer_id VARCHAR(16) NULL, entity VARCHAR(32) NULL,
  started_at DATETIME NULL, finished_at DATETIME NULL,
  processed INT DEFAULT 0, created INT DEFAULT 0, updated INT DEFAULT 0, skipped INT DEFAULT 0,
  marked_removed INT DEFAULT 0, errors INT DEFAULT 0, api_calls INT DEFAULT 0, operations INT DEFAULT 0,
  status VARCHAR(32) NULL, KEY ix_entity (customer_id, entity, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_api_requests (       -- observabilidade (SEM tokens/headers de auth!)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  correlation_id CHAR(36) NULL, customer_id VARCHAR(16) NULL, method VARCHAR(8) NULL,
  endpoint VARCHAR(255) NULL, entity VARCHAR(32) NULL, gaql_hash CHAR(64) NULL,
  http_status INT NULL, api_error_code VARCHAR(64) NULL, duration_ms INT NULL,
  operations INT NULL, returned_count INT NULL, attempt INT DEFAULT 1,
  result ENUM('ok','error') NULL, error_message VARCHAR(512) NULL, job_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_created (created_at), KEY ix_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_sync_errors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, run_id BIGINT UNSIGNED NULL,
  customer_id VARCHAR(16) NULL, entity VARCHAR(32) NULL, external_id VARCHAR(96) NULL,
  error_code VARCHAR(64) NULL, message VARCHAR(1024) NULL, retryable TINYINT(1) DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- OPERAÇÃO / AUDITORIA / ROLLBACK  (§32, §34)
-- ---------------------------------------------------------------------
-- Log de TODA alteração (§34): quem/quando/conta/objeto/antes/depois/origem/aprovação/retorno.
CREATE TABLE IF NOT EXISTS ads_change_log (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  app_user_id     BIGINT UNSIGNED NULL,             -- §44.1 toda alteração vinculada a usuário
  customer_id     VARCHAR(16) NULL,
  object_type     VARCHAR(32) NULL,                 -- campaign/ad_group/ad/keyword/budget/negative
  object_id       VARCHAR(96) NULL,
  action          VARCHAR(48) NULL,                 -- pause/enable/set_budget/set_bid/add_negative/create/remove
  field           VARCHAR(64) NULL,
  old_value       VARCHAR(1024) NULL,               -- §34: valor anterior (base do rollback §34.2)
  new_value       VARCHAR(1024) NULL,
  origin          ENUM('manual','ai_suggestion','bulk','automation','import','external_detected') NULL,  -- §34.1
  justification   VARCHAR(1024) NULL,               -- §32.2 exclusões exigem justificativa
  approval_id     BIGINT UNSIGNED NULL,             -- -> ads_approvals
  exec_status     ENUM('pending','applied','failed','rolled_back') NOT NULL DEFAULT 'pending',
  api_response    JSON NULL,                        -- §34 retorno da integração
  correlation_id  CHAR(36) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at      DATETIME NULL,
  KEY ix_object (object_type, object_id), KEY ix_user (app_user_id), KEY ix_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fluxo de aprovação (§26.4, §33): sugestão/alteração revisada antes de publicar.
CREATE TABLE IF NOT EXISTS ads_approvals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  requested_by BIGINT UNSIGNED NULL, reviewed_by BIGINT UNSIGNED NULL,
  kind ENUM('mutate','ai_recommendation','bulk','negative') NOT NULL,
  payload_json JSON NULL,                            -- operações propostas (validate_only já rodado)
  impact_json JSON NULL,                             -- §32.5 impacto estimado do preview
  status ENUM('pending','approved','rejected','applied','failed') NOT NULL DEFAULT 'pending',
  note VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, decided_at DATETIME NULL,
  KEY ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- IA / RECOMENDAÇÕES / ALERTAS  (§26, §27)
-- ---------------------------------------------------------------------
-- Recomendações: nativas do Google (recommendation resource) + geradas pela nossa IA.
CREATE TABLE IF NOT EXISTS ads_recommendations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id VARCHAR(16) NOT NULL,
  source ENUM('google','ai') NOT NULL,              -- nativa vs LLM própria
  resource_name VARCHAR(255) NULL,                  -- se google
  rec_type VARCHAR(64) NULL,                         -- KEYWORD/CAMPAIGN_BUDGET/TEXT_AD/... ou tipo interno
  title VARCHAR(512) NULL,                           -- §26.2
  problem VARCHAR(1024) NULL,                        -- §26.2 problema identificado
  impact_json JSON NULL,                             -- §26.2 impacto estimado
  priority ENUM('critical','high','medium','low','info') NULL,   -- §26.3
  confidence DECIMAL(5,2) NULL,                      -- §26.2 nível de confiança
  data_used JSON NULL,                               -- §26.2 dados utilizados
  justification TEXT NULL,                           -- §26.2 justificativa (explicável)
  recommended_action JSON NULL,                      -- §26.2 ação recomendada (vira operations de mutate)
  risks VARCHAR(1024) NULL,                          -- §26.2 riscos
  affected_json JSON NULL,                           -- §26.2 campanhas afetadas
  applicable TINYINT(1) NOT NULL DEFAULT 1,          -- §26.2 possibilidade de aplicação
  needs_approval TINYINT(1) NOT NULL DEFAULT 1,      -- §26.2/§26.4 nunca aplica sozinha
  state ENUM('open','applied','dismissed','expired') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, decided_at DATETIME NULL,
  KEY ix_state (customer_id, state), KEY ix_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_alert_rules (        -- §27.1
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, rule_key VARCHAR(64) NOT NULL,
  name VARCHAR(255) NULL, is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  customer_id VARCHAR(16) NULL, campaign_id BIGINT UNSIGNED NULL,   -- escopo (§27.1)
  metric VARCHAR(48) NULL, condition_op VARCHAR(16) NULL, threshold_pct DECIMAL(9,4) NULL,
  min_value DECIMAL(18,4) NULL, window_days INT NULL,
  severity ENUM('info','warning','critical') DEFAULT 'warning',
  recipients_json JSON NULL, channel VARCHAR(32) NULL, cooldown_minutes INT DEFAULT 60,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rule (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_alert_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, rule_key VARCHAR(64) NOT NULL,
  customer_id VARCHAR(16) NULL, entity VARCHAR(32) NULL, entity_id VARCHAR(96) NULL,
  severity ENUM('info','warning','critical') DEFAULT 'warning', dedup_key VARCHAR(160) NULL,
  state ENUM('open','resolved') NOT NULL DEFAULT 'open', message VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at DATETIME NULL,
  UNIQUE KEY uq_dedup (dedup_key), KEY ix_rule (rule_key, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- CRUZAMENTO CRM/ERP · FORECAST · PREFERÊNCIAS · EXPORT · DASHBOARDS  (§18, §39, §29, §28, §30.4, §37)
-- ---------------------------------------------------------------------
-- Vínculo Ads -> CRM (Pipedrive/PIPE_DSHOW) e ERP por GCLID/UTM/CNPJ (§18). Só consulta cruzada.
CREATE TABLE IF NOT EXISTS ads_entity_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  gclid VARCHAR(255) NULL, utm_campaign VARCHAR(255) NULL, utm_source VARCHAR(128) NULL, utm_medium VARCHAR(128) NULL,
  ads_campaign_id BIGINT UNSIGNED NULL, ads_keyword_id BIGINT UNSIGNED NULL, ads_search_term VARCHAR(512) NULL,
  crm_system VARCHAR(24) NULL,                       -- 'pipedrive'
  crm_entity VARCHAR(32) NULL, crm_id VARCHAR(64) NULL,   -- lead/deal em PIPE_DSHOW
  erp_entity VARCHAR(32) NULL, erp_id VARCHAR(64) NULL,
  stage VARCHAR(32) NULL,                            -- lead|opportunity|proposal|won (§18 funil)
  revenue DECIMAL(18,2) NULL,                        -- §18.2 receita confirmada (separada de conversion value §44.8)
  match_type ENUM('gclid','utm','exact','probable','manual') NULL, confidence DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, last_validated_at DATETIME NULL,
  KEY ix_gclid (gclid), KEY ix_campaign (ads_campaign_id), KEY ix_crm (crm_entity, crm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_forecasts (          -- §39 (previsão como estimativa)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, customer_id VARCHAR(16) NULL,
  scope VARCHAR(32) NULL, scope_id VARCHAR(64) NULL, metric_key VARCHAR(48) NOT NULL,
  period_start DATE NULL, period_end DATE NULL,
  point_estimate DECIMAL(20,4) NULL, low_estimate DECIMAL(20,4) NULL, high_estimate DECIMAL(20,4) NULL,
  confidence DECIMAL(5,2) NULL, method VARCHAR(48) NULL, basis_json JSON NULL,   -- §39 base histórica/fatores
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_scope (customer_id, scope, scope_id, metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_user_preferences (   -- §29 (colunas/densidade/views por usuário) + filtros globais (§5.3)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, app_user_id BIGINT UNSIGNED NOT NULL,
  screen_key VARCHAR(64) NOT NULL, prefs_json JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_us (app_user_id, screen_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_saved_views (        -- §29 filtros/visualizações salvas + §37 favoritos
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, app_user_id BIGINT UNSIGNED NOT NULL,
  screen_key VARCHAR(64) NOT NULL, name VARCHAR(128) NOT NULL, filters_json JSON NULL, columns_json JSON NULL,
  is_favorite TINYINT(1) NOT NULL DEFAULT 0, is_shared TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_user (app_user_id, screen_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_dashboards (         -- §30.4 dashboards personalizáveis
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, app_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL, is_default TINYINT(1) NOT NULL DEFAULT 0, layout_json JSON NULL,
  is_shared TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_user (app_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_export_jobs (        -- §28 (PDF/Excel/CSV/PPTX por fila)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, app_user_id BIGINT UNSIGNED NULL,
  screen_key VARCHAR(64) NULL, format ENUM('csv','xlsx','pdf','pptx','json') NULL, params_json JSON NULL,
  status ENUM('pending','running','done','error') NOT NULL DEFAULT 'pending',
  file_path VARCHAR(512) NULL, expires_at DATETIME NULL, error VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at DATETIME NULL, KEY ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ads_report_schedules (   -- §28 (agendamento/envio por e-mail)
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, report_key VARCHAR(64) NOT NULL,
  app_user_id BIGINT UNSIGNED NULL, frequency ENUM('daily','weekly','monthly','quarterly','custom') NULL,
  cron_expr VARCHAR(64) NULL, format ENUM('csv','xlsx','pdf','pptx','json') NULL,
  recipients_json JSON NULL, filters_json JSON NULL, is_enabled TINYINT(1) DEFAULT 1,
  last_run_at DATETIME NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_report (report_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FIM DO RASCUNHO. Revisar índices/tipos/particionamento (ads_metrics_* e ads_search_terms crescem muito)
-- com o DBA antes de aplicar. Considerar PARTITION BY RANGE(metric_date) nas tabelas de métrica.
