-- ═══════════════════════════════════════════════════════════════
-- datatables_schema.sql — catálogo de infraestrutura de dados (Fase 1)
-- Banco: DSHOWDASH (local 127.0.0.1). 100% CREATE + seeds. Zero ALTER/DROP em tabela existente.
-- @version 1.0.0  @created 2026-07-20  @app DataTables
-- Cobre a FASE 1 (§45): ambientes, aplicações, servidores, conexões (credencial criptografada) e
-- catálogo descoberto (banco/tabela/campo/índice/FK). Monitoramento/alertas/qualidade = fases futuras.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── Ambientes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Ambiente (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    env_key      VARCHAR(30)  NOT NULL,                 -- prod|homolog|dev|test|backup|legado
    label        VARCHAR(60)  NOT NULL,
    color        VARCHAR(16)  NOT NULL DEFAULT '#6b7280',
    order_index  INT          NOT NULL DEFAULT 0,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_env_key (env_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Aplicações / Módulos (visão por aplicação) ──────────────────
CREATE TABLE IF NOT EXISTS DT_Aplicacao (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    app_key     VARCHAR(50)  NOT NULL,
    label       VARCHAR(80)  NOT NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_app_key (app_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DT_Modulo (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id BIGINT UNSIGNED NULL,
    mod_key        VARCHAR(60)  NOT NULL,
    label          VARCHAR(100) NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mod_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Servidores / VPSs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Servidor (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name               VARCHAR(120) NOT NULL,
    identifier         VARCHAR(80)  NOT NULL,           -- slug único
    hostname           VARCHAR(190) NULL,
    ip                 VARCHAR(64)  NULL,
    provider           VARCHAR(80)  NULL,               -- Hostinger, AWS, etc.
    server_type        VARCHAR(40)  NULL,               -- vps|dedicated|cloud|managed
    environment_id     BIGINT UNSIGNED NULL,
    notes              VARCHAR(500) NULL,
    monitoring_enabled TINYINT(1)   NOT NULL DEFAULT 1,
    status             VARCHAR(24)  NOT NULL DEFAULT 'untested',
    last_check_at      DATETIME     NULL,
    is_active          TINYINT(1)   NOT NULL DEFAULT 1,
    created_by         VARCHAR(100) NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_srv_identifier (identifier),
    KEY idx_srv_env (environment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Conexões (fonte monitorada). Credencial criptografada (AES-256-GCM). ─
CREATE TABLE IF NOT EXISTS DT_Conexao (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name               VARCHAR(120) NOT NULL,
    source_type        VARCHAR(24)  NOT NULL DEFAULT 'mysql',   -- mysql|api|file|queue|cache|...
    server_id          BIGINT UNSIGNED NULL,
    environment_id     BIGINT UNSIGNED NULL,
    application_id     BIGINT UNSIGNED NULL,
    module_id          BIGINT UNSIGNED NULL,
    host               VARCHAR(190) NOT NULL,
    port               INT          NOT NULL DEFAULT 3306,
    db_name            VARCHAR(190) NULL,                        -- NULL = inventariar TODOS os schemas do servidor
    username           VARCHAR(190) NULL,
    password_encrypted MEDIUMTEXT   NULL,                       -- ciphertext base64 (NUNCA volta ao front)
    ssl_enabled        TINYINT(1)   NOT NULL DEFAULT 0,
    extra_json         JSON         NULL,
    classification     VARCHAR(24)  NOT NULL DEFAULT 'active',  -- active|legacy|archived|disabled
    status             VARCHAR(24)  NOT NULL DEFAULT 'untested',-- online|unstable|slow|offline|untested|maintenance|credential_expired
    monitoring_enabled TINYINT(1)   NOT NULL DEFAULT 1,
    is_active          TINYINT(1)   NOT NULL DEFAULT 1,
    last_check_at      DATETIME     NULL,
    last_success_at    DATETIME     NULL,
    last_error         VARCHAR(1000) NULL,
    last_inventory_at  DATETIME     NULL,
    created_by         VARCHAR(100) NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_con_server (server_id),
    KEY idx_con_env (environment_id),
    KEY idx_con_app (application_id),
    KEY idx_con_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catálogo: Banco (= database/schema no MySQL) ────────────────
CREATE TABLE IF NOT EXISTS DT_Banco (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id     BIGINT UNSIGNED NOT NULL,
    server_id         BIGINT UNSIGNED NULL,
    environment_id    BIGINT UNSIGNED NULL,
    name              VARCHAR(190) NOT NULL,            -- nome do schema/database
    charset           VARCHAR(40)  NULL,
    collation         VARCHAR(64)  NULL,
    size_bytes        BIGINT UNSIGNED NULL,
    table_count       INT          NOT NULL DEFAULT 0,
    field_count       INT          NOT NULL DEFAULT 0,
    classification    VARCHAR(24)  NOT NULL DEFAULT 'active',  -- active|legacy|archived|disabled
    status            VARCHAR(24)  NOT NULL DEFAULT 'untested',
    is_present        TINYINT(1)   NOT NULL DEFAULT 1,         -- 0 = não encontrado no último inventário
    first_seen_at     DATETIME     NULL,
    last_seen_at      DATETIME     NULL,
    last_inventory_at DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_banco (connection_id, name),
    KEY idx_banco_env (environment_id),
    KEY idx_banco_present (is_present)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catálogo: Tabela ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Tabela (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    database_id       BIGINT UNSIGNED NOT NULL,
    name              VARCHAR(190) NOT NULL,
    table_type        VARCHAR(24)  NOT NULL DEFAULT 'BASE TABLE',  -- BASE TABLE | VIEW
    engine            VARCHAR(40)  NULL,
    collation         VARCHAR(64)  NULL,
    row_count_approx  BIGINT UNSIGNED NULL,
    size_bytes        BIGINT UNSIGNED NULL,
    data_length       BIGINT UNSIGNED NULL,
    index_length      BIGINT UNSIGNED NULL,
    table_comment     VARCHAR(500) NULL,
    create_time       DATETIME     NULL,
    update_time       DATETIME     NULL,
    field_count       INT          NOT NULL DEFAULT 0,
    index_count       INT          NOT NULL DEFAULT 0,
    fk_count          INT          NOT NULL DEFAULT 0,
    has_pk            TINYINT(1)   NOT NULL DEFAULT 0,
    classification    VARCHAR(24)  NOT NULL DEFAULT 'active',  -- active|legacy|temporary|critical|deprecated|migrating
    is_orphan         TINYINT(1)   NOT NULL DEFAULT 0,
    health_score      TINYINT UNSIGNED NULL,
    is_present        TINYINT(1)   NOT NULL DEFAULT 1,
    first_seen_at     DATETIME     NULL,
    last_seen_at      DATETIME     NULL,
    last_data_scan_at DATETIME     NULL,        -- rotação da fase de DADOS do quality (§25): menos-recente varre primeiro
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tabela (database_id, name),
    KEY idx_tab_present (is_present),
    KEY idx_tab_dscan (last_data_scan_at),
    KEY idx_tab_class (classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catálogo: Campo ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Campo (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_id          BIGINT UNSIGNED NOT NULL,
    name              VARCHAR(190) NOT NULL,
    ordinal           INT          NULL,
    data_type         VARCHAR(60)  NULL,               -- int, varchar, datetime...
    column_type       VARCHAR(255) NULL,               -- int(11) unsigned, varchar(190)...
    is_nullable       TINYINT(1)   NOT NULL DEFAULT 1,
    column_default    VARCHAR(255) NULL,
    char_length       BIGINT UNSIGNED NULL,
    numeric_precision INT          NULL,
    numeric_scale     INT          NULL,
    is_pk             TINYINT(1)   NOT NULL DEFAULT 0,
    is_fk             TINYINT(1)   NOT NULL DEFAULT 0,
    is_unique         TINYINT(1)   NOT NULL DEFAULT 0,
    is_indexed        TINYINT(1)   NOT NULL DEFAULT 0,
    is_auto_increment TINYINT(1)   NOT NULL DEFAULT 0,
    column_comment    VARCHAR(500) NULL,
    labels            JSON         NULL,               -- etiquetas automáticas (§20.1)
    sensitivity       VARCHAR(30)  NULL,               -- cpf|cnpj|email|... (§20.2) — só metadado
    is_present        TINYINT(1)   NOT NULL DEFAULT 1,
    first_seen_at     DATETIME     NULL,
    last_seen_at      DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_campo (table_id, name),
    KEY idx_campo_name (name),
    KEY idx_campo_sensitivity (sensitivity),
    KEY idx_campo_present (is_present)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catálogo: Índice ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Indice (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_id     BIGINT UNSIGNED NOT NULL,
    name         VARCHAR(190) NOT NULL,
    is_unique    TINYINT(1)   NOT NULL DEFAULT 0,
    index_type   VARCHAR(24)  NULL,                    -- BTREE|FULLTEXT|...
    columns_csv  VARCHAR(500) NULL,
    cardinality  BIGINT       NULL,
    is_present   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_indice (table_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Catálogo: Chave estrangeira ─────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Chave_Estrangeira (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_id        BIGINT UNSIGNED NOT NULL,
    constraint_name VARCHAR(190) NOT NULL,
    column_name     VARCHAR(190) NULL,
    ref_database    VARCHAR(190) NULL,
    ref_table       VARCHAR(190) NULL,
    ref_column      VARCHAR(190) NULL,
    on_update       VARCHAR(24)  NULL,
    on_delete       VARCHAR(24)  NULL,
    is_broken       TINYINT(1)   NOT NULL DEFAULT 0,
    is_present      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_fk (table_id, constraint_name, column_name),
    KEY idx_fk_ref (ref_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Log de inventário (descoberta) ──────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Inventario_Log (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id  BIGINT UNSIGNED NOT NULL,
    started_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at    DATETIME     NULL,
    status         VARCHAR(24)  NOT NULL DEFAULT 'running',  -- running|success|error
    databases_found INT         NOT NULL DEFAULT 0,
    tables_found    INT         NOT NULL DEFAULT 0,
    fields_found    INT         NOT NULL DEFAULT 0,
    duration_ms     INT         NULL,
    error           VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    KEY idx_invlog_conn (connection_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seeds: ambientes padrão ─────────────────────────────────────
INSERT INTO DT_Ambiente (env_key, label, color, order_index) VALUES
  ('prod',    'Produção',      '#ef4444', 1),
  ('homolog', 'Homologação',   '#eab308', 2),
  ('dev',     'Desenvolvimento','#3b82f6', 3),
  ('test',    'Teste',         '#8b5cf6', 4),
  ('backup',  'Backup',        '#22c55e', 5),
  ('legado',  'Legado',        '#6b7280', 6)
ON DUPLICATE KEY UPDATE label=VALUES(label), color=VALUES(color), order_index=VALUES(order_index);

-- Teardown (comentado — nunca destrutivo por padrão):
-- DROP TABLE IF EXISTS DT_Inventario_Log, DT_Chave_Estrangeira, DT_Indice, DT_Campo, DT_Tabela, DT_Banco, DT_Conexao, DT_Servidor, DT_Modulo, DT_Aplicacao, DT_Ambiente;
