-- ============================================================================
-- Painel Anúncios (Decision Engine) — histórico de conversas + feedback.
-- 100% ADITIVO: só CREATE TABLE IF NOT EXISTS. Idempotente (rodar 1x ou N).
-- @module anuncios.sql.schema
-- @created 2026-07-27
--
-- Filosofia (Fase 22 — aprendizado contínuo): cada resposta avaliada com
-- 👍/👎 vira evidência de onde a metodologia cobre bem ou tem lacunas.
-- ============================================================================

-- Conversas do consultor (uma por sessão de perguntas encadeadas).
CREATE TABLE IF NOT EXISTS anuncios_conversas (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,             -- app_users.id (dono)
  titulo     VARCHAR(200)    NOT NULL DEFAULT '',  -- 1ª pergunta truncada
  created_at DATETIME        NOT NULL,
  updated_at DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_anx_conv_user (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mensagens (turnos). role='assistant' carrega modo, fontes e feedback.
CREATE TABLE IF NOT EXISTS anuncios_mensagens (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversa_id      BIGINT UNSIGNED NOT NULL,
  role             ENUM('user','assistant') NOT NULL,
  content          MEDIUMTEXT      NOT NULL,        -- pergunta ou resposta ('' no modo recuperação)
  mode             VARCHAR(20)     NULL,            -- consultant | retrieval_only (assistant)
  units_json       JSON            NULL,            -- fontes citadas (assistant)
  feedback         TINYINT         NULL,            -- 1=👍  -1=👎  NULL=sem avaliação
  feedback_comment VARCHAR(500)    NULL,
  created_at       DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_anx_msg_conversa (conversa_id, id),
  CONSTRAINT fk_anx_msg_conversa FOREIGN KEY (conversa_id)
    REFERENCES anuncios_conversas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reversão (manual, se necessário) ──
-- DROP TABLE IF EXISTS anuncios_mensagens;
-- DROP TABLE IF EXISTS anuncios_conversas;
