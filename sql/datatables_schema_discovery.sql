-- ═══════════════════════════════════════════════════════════════
-- datatables_schema_discovery.sql — Auditoria de descoberta e reconciliação (Fase MVP)
-- Banco: DSHOWDASH (local 127.0.0.1). 100% CREATE IF NOT EXISTS. Zero ALTER/DROP.
-- @version 1.0.0  @created 2026-07-21  @app DataTables
-- Cobre o brief "Auditoria profunda de fontes e bancos não identificados":
--   camadas MySQL (§7.3), Configuração (§7.4) e Reconciliação (§7.10) + matriz (§10).
-- SEGURANÇA (§24): nenhuma senha é armazenada. Usuário sempre MASCARADO.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── Execução da descoberta (§29/§30) ────────────────────────────
-- Uma linha por rodada de auditoria. Guarda contadores agregados no stats_json.
CREATE TABLE IF NOT EXISTS DT_Discovery_Run (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    status                VARCHAR(24)  NOT NULL DEFAULT 'running',   -- running|completed|completed_with_alerts|failed
    triggered_by          VARCHAR(100) NULL,
    hosts_probed          INT          NOT NULL DEFAULT 0,
    hosts_failed          INT          NOT NULL DEFAULT 0,
    databases_found       INT          NOT NULL DEFAULT 0,           -- bancos de aplicação acessíveis
    databases_catalogued  INT          NOT NULL DEFAULT 0,
    databases_pending     INT          NOT NULL DEFAULT 0,           -- não catalogados + sem permissão + referenciados
    stats_json            JSON         NULL,
    error                 VARCHAR(1000) NULL,
    started_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at           DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Banco descoberto e reconciliado (§8/§10/§11.2) ──────────────
-- Identidade = servidor+porta+banco (§17). UNIQUE(db_key) → upsert entre rodadas,
-- preservando first_seen_at/last_seen_at (§22, histórico de aparecimento/desaparecimento).
CREATE TABLE IF NOT EXISTS DT_Discovered_Database (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    run_id               BIGINT UNSIGNED NOT NULL,
    db_key               VARCHAR(300) NOT NULL,                      -- host:port/nome normalizado
    name                 VARCHAR(190) NOT NULL,
    host                 VARCHAR(190) NULL,
    port                 INT          NULL,
    server_context       VARCHAR(120) NULL,                         -- servidor lógico (§18)
    environment          VARCHAR(60)  NULL,
    situation            VARCHAR(40)  NOT NULL,                      -- §8: encontrado_acessivel|vazio|sistema|sem_permissao|referenciado_nao_encontrado|...
    confidence           VARCHAR(10)  NOT NULL DEFAULT 'media',      -- §9: alta|media|baixa
    is_accessible        TINYINT(1)   NOT NULL DEFAULT 0,
    is_system            TINYINT(1)   NOT NULL DEFAULT 0,
    is_empty             TINYINT(1)   NOT NULL DEFAULT 0,
    catalogued           TINYINT(1)   NOT NULL DEFAULT 0,
    catalog_database_id  BIGINT UNSIGNED NULL,                       -- link p/ DT_Banco quando catalogado
    table_count          INT          NULL,
    size_bytes           BIGINT UNSIGNED NULL,
    application          VARCHAR(120) NULL,
    seen_mysql           TINYINT(1)   NOT NULL DEFAULT 0,
    seen_config          TINYINT(1)   NOT NULL DEFAULT 0,
    seen_known           TINYINT(1)   NOT NULL DEFAULT 0,
    seen_catalog         TINYINT(1)   NOT NULL DEFAULT 0,
    -- Camadas 5-9 (§7.5–§7.9): origem por filesystem/host, reconciliada por NOME.
    seen_code            TINYINT(1)   NOT NULL DEFAULT 0,            -- §7.5 código-fonte
    seen_cron            TINYINT(1)   NOT NULL DEFAULT 0,            -- §7.6 crons/rotinas
    seen_container       TINYINT(1)   NOT NULL DEFAULT 0,            -- §7.7 containers/compose
    seen_log             TINYINT(1)   NOT NULL DEFAULT 0,            -- §7.8 logs
    seen_backup          TINYINT(1)   NOT NULL DEFAULT 0,            -- §7.9 backups
    -- Presença/identidade entre rodadas (§22 histórico, §19/§20 instância).
    is_present           TINYINT(1)   NOT NULL DEFAULT 1,            -- 0 = não veio na última rodada (sumiu)
    disappeared_at       DATETIME     NULL,                          -- quando deixou de ser encontrado (§8.5)
    server_uuid          VARCHAR(64)  NULL,                          -- @@server_uuid do host (assinatura §19/§20)
    reason               VARCHAR(300) NULL,                          -- motivo da pendência (§11.2)
    -- Classificação MANUAL (§11.4): sobrevive às rodadas (o upsert de persist() NÃO toca nestas).
    user_status          VARCHAR(24)  NULL,                          -- legado|falso_positivo|ignorado|NULL
    user_note            VARCHAR(500) NULL,                          -- observação da equipe
    user_updated_by      VARCHAR(100) NULL,
    user_updated_at      DATETIME     NULL,
    first_seen_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_db_key (db_key),
    KEY idx_situation (situation),
    KEY idx_user_status (user_status),
    KEY idx_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Evidência bruta (§5/§12) ────────────────────────────────────
-- Uma linha por (fonte × banco). Reconstruída a cada rodada (reflete o estado atual).
-- NUNCA guarda senha; usuário sempre mascarado (§24).
CREATE TABLE IF NOT EXISTS DT_Discovery_Evidence (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    run_id           BIGINT UNSIGNED NOT NULL,
    db_key           VARCHAR(300) NOT NULL,
    db_name          VARCHAR(190) NULL,
    source_type      VARCHAR(24)  NOT NULL,                          -- mysql|config|known_list|catalog|code|cron|container|log|backup
    host             VARCHAR(190) NULL,
    port             INT          NULL,
    username_masked  VARCHAR(120) NULL,                              -- mascarado
    detail           VARCHAR(500) NULL,                              -- caminho do arquivo / resumo do grant / nota
    confidence       VARCHAR(10)  NOT NULL DEFAULT 'media',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_dbkey (db_key),
    KEY idx_run (run_id),
    KEY idx_source (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- Migração aditiva (2026-07-21) — Camadas 5-9 em instalações já existentes.
-- MySQL 8.0 NÃO tem "ADD COLUMN IF NOT EXISTS" (isso é MariaDB) → procedure guardada
-- por information_schema. Idempotente: nada faz se a coluna já existe (fresh install
-- já a tem via CREATE acima). Reexecutável sem erro.
-- ═══════════════════════════════════════════════════════════════
DROP PROCEDURE IF EXISTS dt_disc_add_col;
DELIMITER //
CREATE PROCEDURE dt_disc_add_col(IN col VARCHAR(64), IN ddl VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DT_Discovered_Database' AND COLUMN_NAME = col
    ) THEN
        SET @s = CONCAT('ALTER TABLE DT_Discovered_Database ADD COLUMN ', ddl);
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END //
DELIMITER ;
CALL dt_disc_add_col('seen_code',      'seen_code TINYINT(1) NOT NULL DEFAULT 0 AFTER seen_catalog');
CALL dt_disc_add_col('seen_cron',      'seen_cron TINYINT(1) NOT NULL DEFAULT 0 AFTER seen_code');
CALL dt_disc_add_col('seen_container', 'seen_container TINYINT(1) NOT NULL DEFAULT 0 AFTER seen_cron');
CALL dt_disc_add_col('seen_log',       'seen_log TINYINT(1) NOT NULL DEFAULT 0 AFTER seen_container');
CALL dt_disc_add_col('seen_backup',    'seen_backup TINYINT(1) NOT NULL DEFAULT 0 AFTER seen_log');
-- Refinos 2026-07-21: presença entre rodadas (§22/§8.5) + assinatura de instância (§19/§20).
CALL dt_disc_add_col('is_present',     'is_present TINYINT(1) NOT NULL DEFAULT 1 AFTER seen_backup');
CALL dt_disc_add_col('disappeared_at', 'disappeared_at DATETIME NULL AFTER is_present');
CALL dt_disc_add_col('server_uuid',    'server_uuid VARCHAR(64) NULL AFTER disappeared_at');
DROP PROCEDURE IF EXISTS dt_disc_add_col;
