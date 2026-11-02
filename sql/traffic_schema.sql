-- ═══════════════════════════════════════════════════════════════
-- traffic_schema.sql — histórico de snapshots do índice de trânsito (SP)
-- Banco: DSHOWDASH (local 127.0.0.1). 100% CREATE. Zero ALTER/DROP em tabela existente.
-- @version 1.0.0  @created 2026-07-20
-- OPCIONAL / FUTURO: a v1 do módulo NÃO depende desta tabela (o painel funciona só com
-- provider+cache). Aplicar manualmente quando quiser acumular histórico p/ análise/comparação.
-- Escrita sugerida: um snapshot resumido a cada 10-15 min (cron), via getConnection('DSHOWDASH').
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS traffic_summary_history (
    id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider                 VARCHAR(20)     NOT NULL DEFAULT 'mock',
    city                     VARCHAR(40)     NOT NULL DEFAULT 'sao-paulo',
    traffic_index            TINYINT UNSIGNED NULL,
    traffic_level            VARCHAR(16)     NULL,
    estimated_congestion_km  DECIMAL(7,1)    NULL,
    average_current_speed    DECIMAL(6,1)    NULL,
    average_free_flow_speed  DECIMAL(6,1)    NULL,
    speed_reduction_pct      DECIMAL(5,1)    NULL,
    active_incidents         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    accidents                SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    closures                 SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    roadworks                SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    comparison_pct           DECIMAL(5,1)    NULL,
    trend                    VARCHAR(12)     NULL,
    collected_at             DATETIME        NOT NULL,
    created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_city_collected (city, collected_at),
    KEY idx_collected (collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teardown (comentado — nunca destrutivo por padrão):
-- DROP TABLE IF EXISTS traffic_summary_history;
