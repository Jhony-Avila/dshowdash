-- ═══════════════════════════════════════════════════════════════
-- datatables_schema_f2f5.sql — monitoramento, qualidade e alertas (Fases 2 a 5)
-- Banco: DSHOWDASH (local 127.0.0.1). 100% CREATE + seeds. Zero ALTER/DROP em tabela existente.
-- @version 1.0.0  @created 2026-07-20  @app DataTables
-- Complementa datatables_schema.sql (Fase 1). Cobre:
--   §14/15 verificacao e disponibilidade, §16 metricas, §24/25 qualidade e score,
--   §26/28 alertas com deduplicacao e silencio, §27 manutencao, §34/35 fontes nao-MySQL.
-- Retencao (§41): verificacoes detalhadas sao efemeras; disponibilidade vem das
-- agregacoes horaria/diaria, que sobrevivem 90 dias.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- FASE 2 — MONITORAMENTO
-- ═══════════════════════════════════════════════════════════════

-- ── Tabela tecnica EXCLUSIVA do teste de gravacao (§14.3) ───────
-- Regra inviolavel do briefing: o teste de escrita NUNCA toca tabela de negocio.
-- Esta tabela e criada PELO DataTables dentro do banco monitorado quando ha
-- permissao. Aqui fica so a definicao de referencia usada pelo servico.
CREATE TABLE IF NOT EXISTS DT_Write_Probe (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    probe_uuid VARCHAR(36)  NOT NULL,
    probe_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    origin     VARCHAR(64)  NULL,
    PRIMARY KEY (id),
    KEY idx_probe_uuid (probe_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Resultado da ultima verificacao por conexao (§13) ───────────
CREATE TABLE IF NOT EXISTS DT_Status_Atual (
    connection_id    BIGINT UNSIGNED NOT NULL,
    status           VARCHAR(24)  NOT NULL DEFAULT 'untested',
    since            DATETIME     NULL,              -- desde quando neste status (§12 duracao)
    latency_ms       INT          NULL,
    step_failed      VARCHAR(40)  NULL,              -- host|connect|auth|select_db|read|write
    read_ok          TINYINT(1)   NULL,
    write_ok         TINYINT(1)   NULL,              -- NULL = nao aplicavel (banco read-only)
    write_supported  TINYINT(1)   NOT NULL DEFAULT 1,
    last_error       VARCHAR(1000) NULL,
    last_error_code  VARCHAR(24)  NULL,
    checked_at       DATETIME     NULL,
    consecutive_fail INT          NOT NULL DEFAULT 0,
    flap_count_1h    INT          NOT NULL DEFAULT 0, -- alternancia -> 'unstable' (§13.2)
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (connection_id),
    KEY idx_sa_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Agregacao HORARIA (§41) — base do calculo de disponibilidade ─
CREATE TABLE IF NOT EXISTS DT_Verificacao_Hora (
    connection_id  BIGINT UNSIGNED NOT NULL,
    bucket_hour    DATETIME     NOT NULL,           -- truncado na hora
    checks_total   INT          NOT NULL DEFAULT 0,
    checks_ok      INT          NOT NULL DEFAULT 0,
    checks_slow    INT          NOT NULL DEFAULT 0,
    checks_fail    INT          NOT NULL DEFAULT 0,
    maint_total    INT          NOT NULL DEFAULT 0, -- em manutencao: nao conta como falha (§15.1)
    latency_avg_ms INT          NULL,
    latency_max_ms INT          NULL,
    PRIMARY KEY (connection_id, bucket_hour),
    KEY idx_vh_bucket (bucket_hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Agregacao DIARIA — sustenta 30 e 90 dias sem inchar ─────────
CREATE TABLE IF NOT EXISTS DT_Verificacao_Dia (
    connection_id  BIGINT UNSIGNED NOT NULL,
    bucket_day     DATE         NOT NULL,
    checks_total   INT          NOT NULL DEFAULT 0,
    checks_ok      INT          NOT NULL DEFAULT 0,
    checks_slow    INT          NOT NULL DEFAULT 0,
    checks_fail    INT          NOT NULL DEFAULT 0,
    maint_total    INT          NOT NULL DEFAULT 0,
    latency_avg_ms INT          NULL,
    latency_max_ms INT          NULL,
    PRIMARY KEY (connection_id, bucket_day),
    KEY idx_vd_bucket (bucket_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Interrupcoes (§15.2) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Interrupcao (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id  BIGINT UNSIGNED NOT NULL,
    started_at     DATETIME     NOT NULL,
    ended_at       DATETIME     NULL,               -- NULL = ainda em curso
    duration_sec   INT          NULL,
    status         VARCHAR(24)  NOT NULL,           -- offline|credential_expired|unstable
    reason         VARCHAR(255) NULL,
    last_error     VARCHAR(1000) NULL,
    is_planned     TINYINT(1)   NOT NULL DEFAULT 0, -- manutencao != indisponibilidade (§27.2)
    recovered      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_int_conn (connection_id, started_at),
    KEY idx_int_open (connection_id, ended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Manutencao planejada (§27) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Manutencao (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    target_type    VARCHAR(24)  NOT NULL,           -- connection|server|database
    target_id      BIGINT UNSIGNED NOT NULL,
    started_at     DATETIME     NOT NULL,
    expected_end   DATETIME     NULL,
    ended_at       DATETIME     NULL,
    reason         VARCHAR(500) NULL,
    created_by     VARCHAR(100) NULL,
    suppress_alerts TINYINT(1)  NOT NULL DEFAULT 1,
    notes          VARCHAR(500) NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mnt_target (target_type, target_id, ended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Metricas do banco (§16) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Metrica_Banco (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    database_id    BIGINT UNSIGNED NOT NULL,
    captured_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    size_bytes     BIGINT UNSIGNED NULL,
    table_count    INT          NULL,
    connections    INT          NULL,
    threads_running INT         NULL,
    slow_queries   BIGINT UNSIGNED NULL,
    deadlocks      BIGINT UNSIGNED NULL,
    uptime_sec     BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    KEY idx_mb_db (database_id, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Metricas da tabela — base de crescimento anormal (§18.4) ────
CREATE TABLE IF NOT EXISTS DT_Metrica_Tabela (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_id       BIGINT UNSIGNED NOT NULL,
    captured_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    size_bytes     BIGINT UNSIGNED NULL,
    row_count_approx BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    KEY idx_mt_tab (table_id, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Limites configuraveis por conexao (§16.2) ───────────────────
CREATE TABLE IF NOT EXISTS DT_Limite (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id  BIGINT UNSIGNED NULL,            -- NULL = default global
    metric_key     VARCHAR(60)  NOT NULL,           -- latency_ms|connections|disk_pct|growth_pct...
    warn_value     DECIMAL(18,4) NULL,
    critical_value DECIMAL(18,4) NULL,
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_limite (connection_id, metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- FASE 4 — QUALIDADE E INTEGRIDADE
-- ═══════════════════════════════════════════════════════════════

-- ── Catalogo de regras de qualidade (§24) ───────────────────────
CREATE TABLE IF NOT EXISTS DT_Regra_Sistema (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_key      VARCHAR(60)  NOT NULL,
    label         VARCHAR(120) NOT NULL,
    description   VARCHAR(500) NULL,
    dimension     VARCHAR(30)  NOT NULL,            -- qualidade|integridade|seguranca|metadados
    default_severity VARCHAR(16) NOT NULL DEFAULT 'atencao',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    is_costly     TINYINT(1)   NOT NULL DEFAULT 0,  -- exige janela configurada (§33)
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_regra (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Problemas encontrados (§24.1) ───────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Problema_Qualidade (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_id     BIGINT UNSIGNED NOT NULL,
    -- 0 = problema de NIVEL DE TABELA (nao de campo). NAO usar NULL aqui: em
    -- indice UNIQUE do MySQL, NULL nunca colide com NULL, entao cada execucao
    -- inseriria uma linha nova em vez de atualizar - a tabela cresceria sem fim.
    field_id     BIGINT UNSIGNED NOT NULL DEFAULT 0,
    rule_key     VARCHAR(60)  NOT NULL,
    severity     VARCHAR(16)  NOT NULL DEFAULT 'atencao',  -- informativo|atencao|critico
    metric_value DECIMAL(18,4) NULL,                       -- ex.: 80.00 (% de nulos)
    sample_size  BIGINT UNSIGNED NULL,                     -- amostragem usada (§33)
    detail       VARCHAR(1000) NULL,
    is_open      TINYINT(1)   NOT NULL DEFAULT 1,
    first_seen_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at   DATETIME    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_problema (table_id, field_id, rule_key),
    KEY idx_pq_open (is_open, severity),
    KEY idx_pq_table (table_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Score de saude da tabela (§25) ──────────────────────────────
CREATE TABLE IF NOT EXISTS DT_Score_Tabela (
    table_id        BIGINT UNSIGNED NOT NULL,
    score           TINYINT UNSIGNED NULL,          -- 0..100
    classification  VARCHAR(20)  NOT NULL DEFAULT 'nao_avaliado',
    pts_disponibilidade TINYINT UNSIGNED NULL,      -- 20
    pts_performance     TINYINT UNSIGNED NULL,      -- 15
    pts_qualidade       TINYINT UNSIGNED NULL,      -- 30
    pts_metadados       TINYINT UNSIGNED NULL,      -- 10
    pts_seguranca       TINYINT UNSIGNED NULL,      -- 10
    pts_dependencias    TINYINT UNSIGNED NULL,      -- 15
    computed_at     DATETIME     NULL,
    PRIMARY KEY (table_id),
    KEY idx_score_class (classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- FASE 3 — ALERTAS
-- ═══════════════════════════════════════════════════════════════

-- ── Alerta = INCIDENTE deduplicado (§26.5) ──────────────────────
-- fingerprint garante 1 linha por problema ativo; repeticoes incrementam contador.
CREATE TABLE IF NOT EXISTS DT_Alerta (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fingerprint   VARCHAR(190) NOT NULL,            -- hash(tipo+alvo) - chave da deduplicacao
    alert_type    VARCHAR(60)  NOT NULL,            -- db_offline|slow|cred_expired|new_table|fk_broken...
    severity      VARCHAR(16)  NOT NULL DEFAULT 'atencao',
    target_type   VARCHAR(24)  NOT NULL,            -- connection|database|table|field|server
    target_id     BIGINT UNSIGNED NULL,
    connection_id BIGINT UNSIGNED NULL,
    title         VARCHAR(200) NOT NULL,
    message       VARCHAR(1000) NULL,
    status        VARCHAR(16)  NOT NULL DEFAULT 'active',  -- active|acknowledged|resolved
    occurrences   INT          NOT NULL DEFAULT 1,
    first_seen_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME   NULL,
    acknowledged_by VARCHAR(100) NULL,
    resolved_at   DATETIME     NULL,
    notified_at   DATETIME     NULL,                -- ultimo envio externo bem-sucedido
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Unicidade PARCIAL: so pode existir UM alerta ativo por fingerprint, mas
    -- quantos resolvidos forem necessarios (o mesmo problema pode voltar N vezes).
    -- MySQL nao tem indice parcial; a coluna gerada vira NULL fora de 'active' e
    -- NULLs nao colidem em UNIQUE. UNIQUE(fingerprint,status) seria ERRADO:
    -- barraria a segunda resolucao do mesmo incidente.
    active_fp     VARCHAR(190) GENERATED ALWAYS AS
                    (CASE WHEN status = 'active' THEN fingerprint ELSE NULL END) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_alerta_active (active_fp),
    KEY idx_al_fp (fingerprint),
    KEY idx_al_status (status, severity),
    KEY idx_al_conn (connection_id),
    KEY idx_al_last (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Ocorrencias individuais (historico do incidente) ────────────
CREATE TABLE IF NOT EXISTS DT_Alerta_Ocorrencia (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    alert_id    BIGINT UNSIGNED NOT NULL,
    occurred_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detail      VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    KEY idx_ao_alert (alert_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Regras de alerta por conexao (§26.7) ────────────────────────
CREATE TABLE IF NOT EXISTS DT_Regra_Alerta (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id BIGINT UNSIGNED NULL,             -- NULL = regra global
    alert_type    VARCHAR(60)  NOT NULL,
    severity      VARCHAR(16)  NOT NULL DEFAULT 'atencao',
    is_enabled    TINYINT(1)   NOT NULL DEFAULT 1,
    threshold_json JSON        NULL,
    channels_json JSON         NULL,                -- ["app","email","slack"]
    recipients    VARCHAR(500) NULL,
    min_interval_sec INT       NOT NULL DEFAULT 3600, -- anti-flood do envio externo
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_regra_alerta (connection_id, alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Canais de entrega (§26.4) ───────────────────────────────────
-- config_json guarda endpoint/destinatario; SEGREDO vai cifrado em secret_encrypted.
CREATE TABLE IF NOT EXISTS DT_Canal_Alerta (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    channel_key   VARCHAR(40)  NOT NULL,            -- app|email|slack|whatsapp|webhook
    label         VARCHAR(100) NOT NULL,
    config_json   JSON         NULL,
    secret_encrypted MEDIUMTEXT NULL,               -- NUNCA volta ao front
    is_enabled    TINYINT(1)   NOT NULL DEFAULT 0,  -- nasce DESLIGADO ate ter credencial
    last_ok_at    DATETIME     NULL,
    last_error    VARCHAR(1000) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_canal (channel_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Janelas de silencio (§26.6) ─────────────────────────────────
-- Silencia o ENVIO externo; o alerta continua sendo registrado internamente.
CREATE TABLE IF NOT EXISTS DT_Silencio_Alerta (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id BIGINT UNSIGNED NULL,             -- NULL = todas
    alert_type    VARCHAR(60)  NULL,                -- NULL = todos os tipos
    starts_at     DATETIME     NULL,                -- NULL+NULL = recorrente diario
    ends_at       DATETIME     NULL,
    daily_from    TIME         NULL,                -- janela recorrente (ex.: 22:00)
    daily_to      TIME         NULL,                -- ... ate 06:00
    reason        VARCHAR(255) NULL,
    created_by    VARCHAR(100) NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sil_conn (connection_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- FASE 5 — FONTES NAO-MySQL (APIs, arquivos, filas, caches)
-- ═══════════════════════════════════════════════════════════════

-- Reaproveita DT_Conexao (source_type='api'|'file'|'queue'|'cache'). Aqui ficam
-- so os atributos que nao cabem no cadastro generico.
CREATE TABLE IF NOT EXISTS DT_Fonte_Externa (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    connection_id  BIGINT UNSIGNED NOT NULL,
    endpoint       VARCHAR(500) NULL,
    http_method    VARCHAR(10)  NOT NULL DEFAULT 'GET',
    auth_type      VARCHAR(30)  NULL,               -- none|bearer|basic|apikey|oauth2
    expected_status INT         NOT NULL DEFAULT 200,
    expected_json_path VARCHAR(190) NULL,           -- valida retorno esperado (§34.2)
    timeout_sec    INT          NOT NULL DEFAULT 10,
    file_format    VARCHAR(20)  NULL,               -- csv|xlsx|gsheet|json
    file_location  VARCHAR(500) NULL,
    file_size_bytes BIGINT UNSIGNED NULL,
    last_status_code INT        NULL,
    last_response_ms INT        NULL,
    last_ok_at     DATETIME     NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_fonte_conn (connection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- SEEDS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO DT_Regra_Sistema (rule_key, label, description, dimension, default_severity, is_costly) VALUES
 ('null_excess',     'Excesso de valores nulos',   'Campo com percentual de nulos acima do limite',        'qualidade',   'atencao',  1),
 ('required_empty',  'Obrigatorio vazio',          'Campo NOT NULL logico com valores vazios',             'qualidade',   'critico',  1),
 ('duplicate_key',   'Duplicidade',                'Valores repetidos em campo com indice unico esperado', 'qualidade',   'critico',  1),
 ('invalid_date',    'Data invalida',              'Datas zeradas, futuras ou anteriores ao plausivel',    'qualidade',   'atencao',  1),
 ('out_of_pattern',  'Valor fora do padrao',       'Nao adere ao formato esperado (CPF, CNPJ, email)',     'qualidade',   'atencao',  1),
 ('fk_broken',       'Chave estrangeira quebrada', 'Referencia para tabela ou campo inexistente',          'integridade', 'critico',  0),
 ('fk_orphan_rows',  'Registros orfaos',           'Linhas sem correspondencia na tabela referenciada',    'integridade', 'critico',  1),
 ('table_orphan',    'Tabela orfa',                'Sem FK propria e nao referenciada por ninguem',        'integridade', 'informativo', 0),
 ('excess_deps',     'Dependencias excessivas',    'Quantidade de referencias acima do limite',            'integridade', 'atencao',  0),
 ('no_pk',           'Sem chave primaria',         'Tabela base sem chave primaria',                       'integridade', 'atencao',  0),
 ('no_comment',      'Sem comentario',             'Tabela sem documentacao no proprio banco',             'metadados',   'informativo', 0),
 ('sensitive_plain', 'Sensivel sem protecao',      'Campo sensivel aparentemente sem hash/cifra',          'seguranca',   'atencao',  0),
 ('abnormal_growth', 'Crescimento anormal',        'Crescimento acima do limite configurado',              'qualidade',   'atencao',  0)
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description),
    dimension=VALUES(dimension), default_severity=VALUES(default_severity), is_costly=VALUES(is_costly);

-- Canais: todos nascem DESLIGADOS. 'app' e o unico que funciona sem credencial.
INSERT INTO DT_Canal_Alerta (channel_key, label, is_enabled) VALUES
 ('app',      'Notificacao no aplicativo', 1),
 ('email',    'E-mail (SMTP)',             0),
 ('slack',    'Slack (webhook)',           0),
 ('whatsapp', 'WhatsApp (API)',            0),
 ('webhook',  'Webhook generico',          0)
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- Limites default globais (connection_id NULL)
INSERT INTO DT_Limite (connection_id, metric_key, warn_value, critical_value) VALUES
 (NULL, 'latency_ms',    1500,  5000),
 (NULL, 'disk_pct',        80,    90),
 (NULL, 'connections',    100,   200),
 (NULL, 'growth_pct_7d',   50,   200),
 (NULL, 'null_pct',        30,    80),
 (NULL, 'table_deps',      15,    30)
ON DUPLICATE KEY UPDATE warn_value=VALUES(warn_value), critical_value=VALUES(critical_value);

-- Teardown (comentado — nunca destrutivo por padrao):
-- DROP TABLE IF EXISTS DT_Fonte_Externa, DT_Silencio_Alerta, DT_Canal_Alerta, DT_Regra_Alerta,
--   DT_Alerta_Ocorrencia, DT_Alerta, DT_Score_Tabela, DT_Problema_Qualidade, DT_Regra_Sistema,
--   DT_Limite, DT_Metrica_Tabela, DT_Metrica_Banco, DT_Manutencao, DT_Interrupcao,
--   DT_Verificacao_Dia, DT_Verificacao_Hora, DT_Status_Atual, DT_Write_Probe;
