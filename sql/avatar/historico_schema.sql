-- ============================================================================
-- Avatar Studio — 4.6 F1.2: metadados de apresentação das versões (§22).
-- 100% ADITIVO: só CREATE TABLE IF NOT EXISTS. Idempotente (rodar 1x ou N).
-- @module avatar.sql.historico_schema
-- @created 2026-07-30
--
-- Responsabilidade ÚNICA: nome e fixação das versões do histórico do usuário.
-- O ESTADO das versões continua em app_user_avatars (snapshot JSON versionado,
-- decisão #34) — esta tabela NUNCA guarda config, só apresentação.
-- Sem FK para app_user_avatars de propósito: desacopla do tipo exato da PK
-- da tabela legada; a limpeza de órfãos é feita pelo studio.php após a poda.
--
-- Regra de retenção (§22): guardamos as 100 versões mais recentes por
-- usuário; versões FIXADAS (is_pinned=1) e a ATIVA nunca são podadas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_version_meta (
  user_id    BIGINT UNSIGNED NOT NULL,                 -- app_users.id
  version_id BIGINT UNSIGNED NOT NULL,                 -- app_user_avatars.id
  label      VARCHAR(60)  NULL,                        -- nome dado pelo usuário
  is_pinned  TINYINT(1)   NOT NULL DEFAULT 0,          -- fixada = nunca podada
  created_at DATETIME     NOT NULL,
  updated_at DATETIME     NOT NULL,
  PRIMARY KEY (user_id, version_id),
  KEY idx_avvm_pin (user_id, is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
