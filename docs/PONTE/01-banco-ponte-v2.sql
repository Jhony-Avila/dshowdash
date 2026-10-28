-- Ponte v2 (Programa PARIDADE TOTAL, ADR-013) — W1 (2026-10-28). Banco DSHOWDASH. Executar como root do MySQL ANTES do deploy do código
-- (scripts/ops/ponte-v2-migracao.sh do app-dshow faz backup + revert.sql). Idempotente (IF NOT EXISTS / ON DUPLICATE KEY).
-- 1) idempotência da ponte: uma linha por (usuário, request_id); replay devolve resposta_json; status 0 = em andamento.
CREATE TABLE IF NOT EXISTS `app_ponte_ops` (
  `user_id`       INT UNSIGNED  NOT NULL,
  `request_id`    VARCHAR(64)   NOT NULL,
  `modulo`        VARCHAR(32)   NOT NULL,
  `acao`          VARCHAR(48)   NOT NULL,
  `corpo_hash`    CHAR(64)      NOT NULL,
  `status`        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `resposta_json` JSON          NULL,
  `criado_em`     DATETIME(3)   NOT NULL,
  `concluido_em`  DATETIME(3)   NULL,
  PRIMARY KEY (`user_id`, `request_id`),
  KEY `idx_ponte_ops_criado` (`criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ponte v2 do APP DSHOW: idempotência por request_id (ADR-013)';
-- 2) flags OFF (fail-closed): geral + por módulo/tipo. environment='all' (chamada por loopback pode não ter APP_ENV); rollout 100
--    porque a ponte resolve sem identidade de usuário (rollout < 100 = desligada). Ligar/desligar: scripts/deploy/global-flag-rollout.php.
INSERT INTO `app_feature_flags`
  (`flag_key`, `flag_name`, `description`, `is_enabled`, `rollout_percentage`, `payload_json`, `environment`, `starts_at`, `ends_at`, `created_at`, `updated_at`)
VALUES
  ('ponte.v2',                   'Ponte v2 (APP DSHOW)',             'Interruptor geral da ponte servidor-a-servidor v2 (api/ponte). OFF = endpoint inerte (404).',          0, 100, NULL, 'all', NULL, NULL, NOW(3), NOW(3)),
  ('ponte.alertas.escrita',      'Ponte v2 · alertas (escrita)',     'Reconhecer/resolver/silenciar alertas do DataTables pelo app (nível >= 80).',                       0, 100, NULL, 'all', NULL, NULL, NOW(3), NOW(3)),
  ('ponte.notificacoes.escrita', 'Ponte v2 · notificações (escrita)','Marcar lida/todas e excluir avisos (app_notifications) pelo app, só do próprio usuário.',          0, 100, NULL, 'all', NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `flag_key` = `flag_key`;
