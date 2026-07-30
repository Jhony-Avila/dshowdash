-- ============================================================================
-- Avatar Studio — EXPANSÃO: catálogo genérico normalizado (Trilha A).
-- 100% ADITIVO: só CREATE TABLE IF NOT EXISTS. Idempotente (rodar 1x ou N).
-- @module avatar.sql.catalogo_schema
-- @created 2026-07-30
--
-- Decisão oficial (briefing Expansão + respostas do Jhony):
--   • tabelas por RESPONSABILIDADE DE DOMÍNIO, nunca por categoria visual;
--   • categoria nova = INSERT (zero DDL);
--   • catálogo sai do bundle TS (migração controlada, feature flag);
--   • ESTADO equipado do usuário permanece snapshot JSON versionado —
--     a tabela app_user_avatars EXISTENTE já cumpre a seção 11 da spec
--     (determinismo/histórico/restauração/409). NÃO criamos
--     avatar_user_versions duplicada: reuso > duplicação (princípio nº 2/3
--     do projeto). Colunas de previews derivados entram lá quando a
--     Camada 2 3D for persistida.
-- ============================================================================

-- ── 7. Licenças e proveniência (referenciada por bibliotecas e assets) ─────
CREATE TABLE IF NOT EXISTS avatar_licenses (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(120)  NOT NULL,            -- ex.: "CC0 1.0 Universal"
  license_type          VARCHAR(40)   NOT NULL,            -- cc0 | cc-by | proprietaria | comercial
  source_url            VARCHAR(500)  NULL,
  commercial_use        TINYINT(1)    NOT NULL DEFAULT 0,
  modification_allowed  TINYINT(1)    NOT NULL DEFAULT 0,
  redistribution_allowed TINYINT(1)   NOT NULL DEFAULT 0,
  attribution_required  TINYINT(1)    NOT NULL DEFAULT 0,
  attribution_text      VARCHAR(500)  NULL,
  restrictions          TEXT          NULL,
  proof_document_url    VARCHAR(500)  NULL,                -- ex.: LICENCAS.md / License.txt
  reviewed_by           BIGINT UNSIGNED NULL,              -- app_users.id
  reviewed_at           DATETIME      NULL,
  created_at            DATETIME      NOT NULL,
  updated_at            DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_avlic_tipo (license_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Bibliotecas de origem ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_libraries (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`            VARCHAR(60)   NOT NULL,                 -- dshow_svg | dshow_3d | cc0_retrabalhada…
  name             VARCHAR(120)  NOT NULL,
  provider         VARCHAR(120)  NULL,                     -- Dshow | Quaternius | three.js…
  description      TEXT          NULL,
  art_style        VARCHAR(80)   NULL,                     -- vetorial | realismo estilizado…
  default_renderer ENUM('2d','3d') NOT NULL DEFAULT '3d',
  license_id       BIGINT UNSIGNED NULL,
  version          VARCHAR(20)   NOT NULL DEFAULT '1.0.0',
  status           ENUM('draft','review','published','deprecated','retired','blocked')
                   NOT NULL DEFAULT 'published',
  is_internal      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at       DATETIME      NOT NULL,
  updated_at       DATETIME      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avbib_key (`key`),
  KEY idx_avbib_status (status),
  CONSTRAINT fk_avbib_licenca FOREIGN KEY (license_id)
    REFERENCES avatar_licenses (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. Raridades (sai do hardcode do front) ────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_rarities (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(30)   NOT NULL,                     -- comum…exclusivo
  name         VARCHAR(60)   NOT NULL,
  level        TINYINT UNSIGNED NOT NULL,                  -- 0..6 (peso visual/sonoro)
  color_token  VARCHAR(20)   NOT NULL,                     -- hex
  border_token VARCHAR(40)   NULL,
  effect_key   VARCHAR(40)   NULL,                         -- shimmer | glow…
  sound_key    VARCHAR(40)   NULL,
  sort_order   INT           NOT NULL DEFAULT 0,
  metadata     JSON          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avrar_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 1/2. Taxonomia: grupos da navegação e categorias como DADOS ───────────
CREATE TABLE IF NOT EXISTS avatar_category_groups (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`            VARCHAR(60)   NOT NULL,                 -- identidade | corpo | vestuario…
  name             VARCHAR(120)  NOT NULL,
  description      VARCHAR(500)  NULL,
  icon             VARCHAR(60)   NULL,                     -- nome do ícone (lucide)
  sort_order       INT           NOT NULL DEFAULT 0,
  is_active        TINYINT(1)    NOT NULL DEFAULT 1,
  is_collapsible   TINYINT(1)    NOT NULL DEFAULT 1,
  default_expanded TINYINT(1)    NOT NULL DEFAULT 0,
  created_at       DATETIME      NOT NULL,
  updated_at       DATETIME      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avgrp_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS avatar_categories (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id               BIGINT UNSIGNED NOT NULL,
  parent_category_id     BIGINT UNSIGNED NULL,             -- subcategorias futuras
  `key`                  VARCHAR(60)   NOT NULL,           -- cabelo | barba | companion…
  name                   VARCHAR(120)  NOT NULL,
  description            VARCHAR(500)  NULL,
  icon                   VARCHAR(60)   NULL,
  slot_key               VARCHAR(60)   NULL,               -- slot no Config (camadas.cabelo…)
  category_type          ENUM('asset','morph','color','material','animation','scene',
                              'personality','preset','system') NOT NULL DEFAULT 'asset',
  selection_mode         ENUM('single','multiple','parameter','composite')
                         NOT NULL DEFAULT 'single',
  sort_order             INT         NOT NULL DEFAULT 0,
  is_active              TINYINT(1)  NOT NULL DEFAULT 1,
  is_required            TINYINT(1)  NOT NULL DEFAULT 0,
  supports_search        TINYINT(1)  NOT NULL DEFAULT 1,
  supports_filters       TINYINT(1)  NOT NULL DEFAULT 1,
  supports_colors        TINYINT(1)  NOT NULL DEFAULT 0,
  supports_materials     TINYINT(1)  NOT NULL DEFAULT 0,
  supports_morphs        TINYINT(1)  NOT NULL DEFAULT 0,
  supports_randomization TINYINT(1)  NOT NULL DEFAULT 1,
  supports_favorites     TINYINT(1)  NOT NULL DEFAULT 1,
  supported_renderers    SET('2d','3d') NOT NULL DEFAULT '3d',
  ui_config              JSON        NULL,                 -- editor especializado (morph/material…)
  metadata_schema        JSON        NULL,                 -- JSON Schema dos metadados dos assets
  created_at             DATETIME    NOT NULL,
  updated_at             DATETIME    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avcat_key (`key`),
  KEY idx_avcat_grupo (group_id, sort_order),
  CONSTRAINT fk_avcat_grupo FOREIGN KEY (group_id)
    REFERENCES avatar_category_groups (id) ON DELETE CASCADE,
  CONSTRAINT fk_avcat_pai FOREIGN KEY (parent_category_id)
    REFERENCES avatar_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. Coleções ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_collections (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`       VARCHAR(60)   NOT NULL,
  name        VARCHAR(120)  NOT NULL,
  description VARCHAR(500)  NULL,
  lore        TEXT          NULL,
  cover_url   VARCHAR(500)  NULL,
  trailer_url VARCHAR(500)  NULL,
  rarity_id   BIGINT UNSIGNED NULL,
  theme       VARCHAR(60)   NULL,
  status      ENUM('draft','review','published','deprecated','retired','blocked')
              NOT NULL DEFAULT 'published',
  starts_at   DATETIME      NULL,                          -- coleções temporárias/eventos
  ends_at     DATETIME      NULL,
  is_limited  TINYINT(1)    NOT NULL DEFAULT 0,
  is_featured TINYINT(1)    NOT NULL DEFAULT 0,
  metadata    JSON          NULL,
  created_at  DATETIME      NOT NULL,
  updated_at  DATETIME      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avcol_key (`key`),
  KEY idx_avcol_status (status, is_featured),
  CONSTRAINT fk_avcol_raridade FOREIGN KEY (rarity_id)
    REFERENCES avatar_rarities (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Catálogo central de assets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_assets (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id         BIGINT UNSIGNED NOT NULL,
  library_id          BIGINT UNSIGNED NOT NULL,
  collection_id       BIGINT UNSIGNED NULL,
  rarity_id           BIGINT UNSIGNED NOT NULL,
  license_id          BIGINT UNSIGNED NULL,                -- herda da biblioteca quando NULL
  `key`               VARCHAR(80)   NOT NULL,              -- id estável (bas_classica, cab_moicano…)
  name                VARCHAR(120)  NOT NULL,
  short_description   VARCHAR(255)  NULL,
  description         TEXT          NULL,
  lore                TEXT          NULL,
  asset_type          VARCHAR(40)   NOT NULL DEFAULT 'parte', -- parte | glb | morph | cena | anim…
  status              ENUM('draft','review','published','deprecated','retired','blocked')
                      NOT NULL DEFAULT 'published',
  thumbnail_url       VARCHAR(500)  NULL,
  preview_url         VARCHAR(500)  NULL,
  supported_renderers SET('2d','3d') NOT NULL DEFAULT '2d',
  default_renderer    ENUM('2d','3d') NOT NULL DEFAULT '2d',
  fallback_strategy   ENUM('render_derivado','thumbnail','versao_simplificada',
                           'item_equivalente','aviso') NULL,
  fallback_asset_id   BIGINT UNSIGNED NULL,
  is_active           TINYINT(1)  NOT NULL DEFAULT 1,
  is_featured         TINYINT(1)  NOT NULL DEFAULT 0,
  is_exclusive        TINYINT(1)  NOT NULL DEFAULT 0,
  is_limited          TINYINT(1)  NOT NULL DEFAULT 0,
  is_premium          TINYINT(1)  NOT NULL DEFAULT 0,
  is_randomizable     TINYINT(1)  NOT NULL DEFAULT 1,
  sort_order          INT         NOT NULL DEFAULT 0,
  tags                VARCHAR(500) NULL,                   -- "cyber,neon,tecnologia" (FULLTEXT)
  metadata            JSON        NULL,                    -- GLB/LOD/sockets/morphs/anims (validado
                                                           -- pelo metadata_schema da categoria)
  version             VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  published_at        DATETIME    NULL,
  retired_at          DATETIME    NULL,
  created_at          DATETIME    NOT NULL,
  updated_at          DATETIME    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avast_key (`key`),
  KEY idx_avast_categoria (category_id, status, sort_order),
  KEY idx_avast_biblioteca (library_id, status),
  KEY idx_avast_colecao (collection_id),
  KEY idx_avast_raridade (rarity_id),
  KEY idx_avast_status (status, published_at),
  FULLTEXT KEY ft_avast_busca (name, short_description, lore, tags),
  CONSTRAINT fk_avast_categoria FOREIGN KEY (category_id)
    REFERENCES avatar_categories (id) ON DELETE CASCADE,
  CONSTRAINT fk_avast_biblioteca FOREIGN KEY (library_id)
    REFERENCES avatar_libraries (id) ON DELETE RESTRICT,
  CONSTRAINT fk_avast_colecao FOREIGN KEY (collection_id)
    REFERENCES avatar_collections (id) ON DELETE SET NULL,
  CONSTRAINT fk_avast_raridade FOREIGN KEY (rarity_id)
    REFERENCES avatar_rarities (id) ON DELETE RESTRICT,
  CONSTRAINT fk_avast_licenca FOREIGN KEY (license_id)
    REFERENCES avatar_licenses (id) ON DELETE SET NULL,
  CONSTRAINT fk_avast_fallback FOREIGN KEY (fallback_asset_id)
    REFERENCES avatar_assets (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS avatar_collection_items (
  collection_id              BIGINT UNSIGNED NOT NULL,
  asset_id                   BIGINT UNSIGNED NOT NULL,
  sort_order                 INT        NOT NULL DEFAULT 0,
  is_required_for_completion TINYINT(1) NOT NULL DEFAULT 1,
  completion_weight          INT        NOT NULL DEFAULT 1,
  PRIMARY KEY (collection_id, asset_id),
  CONSTRAINT fk_avcit_colecao FOREIGN KEY (collection_id)
    REFERENCES avatar_collections (id) ON DELETE CASCADE,
  CONSTRAINT fk_avcit_asset FOREIGN KEY (asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. Regras declarativas (o MESMO motor serve 2D e 3D) ───────────────────
CREATE TABLE IF NOT EXISTS avatar_asset_rules (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_asset_id BIGINT UNSIGNED NOT NULL,
  rule_type       ENUM('requires','incompatible_with','hides','replaces','allows_only',
                       'requires_species','requires_archetype','requires_slot','excludes_slot',
                       'locks_color','changes_material','triggers_effect','requires_renderer')
                  NOT NULL,
  target_type     ENUM('asset','category','slot','species','archetype','renderer') NOT NULL,
  target_id       BIGINT UNSIGNED NULL,                    -- quando alvo é asset/categoria
  target_key      VARCHAR(80)  NULL,                       -- quando alvo é slot/espécie/renderer
  `condition`     JSON         NULL,
  priority        INT          NOT NULL DEFAULT 0,
  message         VARCHAR(255) NULL,                       -- explicação p/ a UI (nunca falha muda)
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  metadata        JSON         NULL,
  PRIMARY KEY (id),
  KEY idx_avreg_origem (source_asset_id, rule_type, is_active),
  CONSTRAINT fk_avreg_origem FOREIGN KEY (source_asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. Desbloqueios (como se obtém) + o que cada usuário destravou ─────────
CREATE TABLE IF NOT EXISTS avatar_unlock_rules (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id       BIGINT UNSIGNED NOT NULL,
  unlock_type    ENUM('default','level','achievement','event','season','campaign',
                      'collection','admin','role','purchase','invitation','special')
                 NOT NULL DEFAULT 'default',
  reference_type VARCHAR(40)  NULL,                        -- conquista | evento | colecao…
  reference_id   VARCHAR(80)  NULL,                        -- id da referência (ex.: primeiro_avatar)
  required_value INT          NULL,                        -- nível/quantidade exigida
  starts_at      DATETIME     NULL,
  ends_at        DATETIME     NULL,
  priority       INT          NOT NULL DEFAULT 0,
  metadata       JSON         NULL,
  PRIMARY KEY (id),
  KEY idx_avdes_asset (asset_id, unlock_type),
  CONSTRAINT fk_avdes_asset FOREIGN KEY (asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS avatar_user_unlocks (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,                    -- app_users.id
  asset_id    BIGINT UNSIGNED NOT NULL,
  source_type VARCHAR(40)  NOT NULL DEFAULT 'default',
  source_id   VARCHAR(80)  NULL,
  unlocked_at DATETIME     NOT NULL,
  expires_at  DATETIME     NULL,
  granted_by  BIGINT UNSIGNED NULL,                        -- admin (quando manual)
  metadata    JSON         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avudes (user_id, asset_id),
  KEY idx_avudes_user (user_id, unlocked_at),
  CONSTRAINT fk_avudes_asset FOREIGN KEY (asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. Inventário e favoritos (favoritos migram do localStorage) ───────────
CREATE TABLE IF NOT EXISTS avatar_user_inventory (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  asset_id    BIGINT UNSIGNED NOT NULL,
  acquired_at DATETIME     NOT NULL,
  source_type VARCHAR(40)  NOT NULL DEFAULT 'uso',
  source_id   VARCHAR(80)  NULL,
  quantity    INT          NOT NULL DEFAULT 1,
  expires_at  DATETIME     NULL,
  status      ENUM('ativo','expirado','revogado') NOT NULL DEFAULT 'ativo',
  metadata    JSON         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avinv (user_id, asset_id),
  KEY idx_avinv_user (user_id, status),
  CONSTRAINT fk_avinv_asset FOREIGN KEY (asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS avatar_user_favorites (
  user_id    BIGINT UNSIGNED NOT NULL,
  asset_id   BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, asset_id),
  CONSTRAINT fk_avfav_asset FOREIGN KEY (asset_id)
    REFERENCES avatar_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 10. Presets (snapshots de combinação, aplicação total ou parcial) ─────
CREATE TABLE IF NOT EXISTS avatar_presets (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(60)   NOT NULL,
  name          VARCHAR(120)  NOT NULL,
  description   VARCHAR(500)  NULL,
  library_id    BIGINT UNSIGNED NULL,
  collection_id BIGINT UNSIGNED NULL,
  rarity_id     BIGINT UNSIGNED NULL,
  thumbnail_url VARCHAR(500)  NULL,
  is_system     TINYINT(1)    NOT NULL DEFAULT 1,
  is_public     TINYINT(1)    NOT NULL DEFAULT 1,
  created_by    BIGINT UNSIGNED NULL,
  configuration JSON          NOT NULL,                    -- snapshot válido de combinação
  apply_scope   SET('tudo','aparencia','roupa','cenario','apresentacao','poder')
                NOT NULL DEFAULT 'tudo',
  version       VARCHAR(20)   NOT NULL DEFAULT '1.0.0',
  created_at    DATETIME      NOT NULL,
  updated_at    DATETIME      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avpre_key (`key`),
  CONSTRAINT fk_avpre_biblioteca FOREIGN KEY (library_id)
    REFERENCES avatar_libraries (id) ON DELETE SET NULL,
  CONSTRAINT fk_avpre_colecao FOREIGN KEY (collection_id)
    REFERENCES avatar_collections (id) ON DELETE SET NULL,
  CONSTRAINT fk_avpre_raridade FOREIGN KEY (rarity_id)
    REFERENCES avatar_rarities (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 16. Versionamento global do catálogo (ETag/cache/invalidação) ──────────
CREATE TABLE IF NOT EXISTS avatar_catalog_meta (
  id            TINYINT UNSIGNED NOT NULL,                 -- linha única (id=1)
  version       INT UNSIGNED NOT NULL DEFAULT 1,           -- ++ a cada publicação
  published_by  BIGINT UNSIGNED NULL,
  published_at  DATETIME     NOT NULL,
  notes         VARCHAR(500) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 21. Auditoria ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatar_catalog_audit (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NULL,
  action         VARCHAR(40)  NOT NULL,                    -- criar|alterar|publicar|retirar|regra|
                                                           -- desbloqueio_manual|migracao|restauracao
  entity_type    VARCHAR(40)  NOT NULL,
  entity_id      VARCHAR(80)  NOT NULL,
  previous_value JSON         NULL,
  new_value      JSON         NULL,
  ip             VARCHAR(45)  NULL,
  correlation_id VARCHAR(64)  NULL,
  created_at     DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_avaud_entidade (entity_type, entity_id),
  KEY idx_avaud_quando (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reversão (manual, se necessário — ordem inversa das FKs) ──
-- DROP TABLE IF EXISTS avatar_catalog_audit, avatar_catalog_meta, avatar_presets,
--   avatar_user_favorites, avatar_user_inventory, avatar_user_unlocks,
--   avatar_unlock_rules, avatar_asset_rules, avatar_collection_items,
--   avatar_assets, avatar_collections, avatar_categories, avatar_category_groups,
--   avatar_rarities, avatar_libraries, avatar_licenses;
