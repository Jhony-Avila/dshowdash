-- sql/avatar/as5_schema.sql — AS5 F1: modelo de dados novo (Parte 10 §610–§615).
-- @version 1.0.0  @created 2026-07-31
-- ADITIVO por decisão da auditoria F0: cria AO LADO das tabelas atuais
-- (app_user_avatars segue funcionando); backfill e leitura dual chegam nas
-- fases seguintes atrás de feature flag. Idempotente (IF NOT EXISTS).
-- ATENÇÃO OPERACIONAL: CREATE exige usuário com privilégio (root) — o
-- dshowdash_app roda só os SEEDS. Aplicar com o passo root documentado.

-- §610 — identidade do avatar (1 usuário poderá ter N avatares no futuro)
CREATE TABLE IF NOT EXISTS avatar_profiles (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id              BIGINT UNSIGNED NOT NULL,
  name                 VARCHAR(80)  NOT NULL DEFAULT 'Meu avatar',
  slug                 VARCHAR(96)  NULL,
  active_state_id      BIGINT UNSIGNED NULL,
  published_version_id BIGINT UNSIGNED NULL,
  preferred_renderer   ENUM('2d','3d','foto') NOT NULL DEFAULT '2d',
  visibility           ENUM('private','team','public') NOT NULL DEFAULT 'team',
  status               ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at           TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_avp_user (user_id, status),
  UNIQUE KEY uq_avp_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §611 — estado editável atual (JSON com contrato: schema_version + checksum)
CREATE TABLE IF NOT EXISTS avatar_states (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  avatar_profile_id  BIGINT UNSIGNED NOT NULL,
  schema_version     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  identity_json      JSON NULL,
  body_json          JSON NULL,
  appearance_json    JSON NULL,
  equipment_json     JSON NULL,
  presentation_json  JSON NULL,
  environment_json   JSON NULL,
  animation_json     JSON NULL,
  renderer_json      JSON NULL,
  checksum           VARCHAR(16) NOT NULL DEFAULT '',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_avs_profile (avatar_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §612 — versões imutáveis (snapshot completo + origem + publicação)
CREATE TABLE IF NOT EXISTS avatar_state_versions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  avatar_profile_id   BIGINT UNSIGNED NOT NULL,
  state_snapshot_json JSON NOT NULL,
  schema_version      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  version_number      INT UNSIGNED NOT NULL,
  change_summary      VARCHAR(160) NULL,
  created_by          BIGINT UNSIGNED NULL,
  source              ENUM('manual','autosave','preset','ia','migracao','restauracao','publicacao','evento') NOT NULL DEFAULT 'manual',
  is_published        TINYINT(1) NOT NULL DEFAULT 0,
  checksum            VARCHAR(16) NOT NULL DEFAULT '',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avsv (avatar_profile_id, version_number),
  KEY idx_avsv_pub (avatar_profile_id, is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §614 — versões de asset (metadados/compatibilidade/fallback POR VERSÃO)
CREATE TABLE IF NOT EXISTS avatar_asset_versions (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id               BIGINT UNSIGNED NOT NULL,
  version                INT UNSIGNED NOT NULL DEFAULT 1,
  metadata_json          JSON NULL,
  compatibility_json     JSON NULL,
  properties_schema_json JSON NULL,
  renderer_support_json  JSON NULL,
  fallback_json          JSON NULL,
  checksum               VARCHAR(16) NOT NULL DEFAULT '',
  status                 ENUM('rascunho','revisao','aprovado','publicado','depreciado') NOT NULL DEFAULT 'publicado',
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at           TIMESTAMP NULL,
  deprecated_at          TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aav (asset_id, version),
  KEY idx_aav_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §615 — arquivos por versão de asset (papéis/qualidade/renderer)
CREATE TABLE IF NOT EXISTS avatar_asset_files (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_version_id BIGINT UNSIGNED NOT NULL,
  file_role        ENUM('thumbnail','preview','source','model','texture','animation','fallback','poster','banner','mask','audio','lod') NOT NULL,
  renderer         ENUM('2d','3d','foto','todos') NOT NULL DEFAULT 'todos',
  quality_tier     ENUM('economico','medio','alto') NOT NULL DEFAULT 'alto',
  format           VARCHAR(16) NOT NULL DEFAULT '',
  url              VARCHAR(512) NULL,
  storage_key      VARCHAR(256) NULL,
  width            INT UNSIGNED NULL,
  height           INT UNSIGNED NULL,
  file_size        INT UNSIGNED NULL,
  checksum         VARCHAR(64) NULL,
  compression      VARCHAR(24) NULL,
  metadata_json    JSON NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aaf_versao (asset_version_id, file_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
