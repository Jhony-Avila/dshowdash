-- ═══════════════════════════════════════════════════════════════════════════
-- GCAL_DSHOW — migração 02d: `gcal_events.event_type` aceita `fromGmail`
-- @created 2026-10-28
--
-- O QUE ACONTECEU (dados reais, 28/10/2026, 1ª sincronização após o go-live)
--   A API do Google devolve eventos com eventType = 'fromGmail' (criados pelo Gmail a
--   partir de e-mails de voos, hotéis e reservas). O ENUM só tinha
--   ('default','focusTime','outOfOffice','workingLocation','birthday'); com
--   sql_mode STRICT_TRANS_TABLES o INSERT falha com
--     SQLSTATE[01000]: Warning: 1265 Data truncated for column 'event_type' at row 1
--   e, como o lote era gravado numa transação sem tratamento por evento, UM evento
--   derrubava a sincronização do calendário INTEIRO (8 de 9 calendários "em dia",
--   o principal em ERRO).
--
-- A CORREÇÃO TEM DUAS CAMADAS (esta é a do banco):
--   (a) banco: ENUM ampliado com 'fromGmail' — a lista oficial da API hoje é
--       default, outOfOffice, focusTime, workingLocation, fromGmail, birthday.
--       Por que ENUM e não VARCHAR: acrescentar valor NO FIM de um ENUM que continua
--       cabendo em 1 byte é ALGORITHM=INSTANT no MySQL 8.0 (só metadado: sem
--       reconstruir a tabela, sem travar, reversível); VARCHAR(32) exigiria
--       reconstruir gcal_events (ALGORITHM=INPLACE/COPY), perderia a validação no banco
--       e não mudaria o fato de que o código precisa saber a lista (o normalizador).
--   (b) código (GcalNormalizer::tipoEvento + GcalSyncService::gravar por SAVEPOINT):
--       tipo desconhecido vira 'default' com aviso no log; evento recusado pelo banco é
--       registrado em gcal_sync_errors e NÃO derruba o calendário.
--
-- ORDEM OBRIGATÓRIA: esta migração ANTES do deploy do código (o código novo grava
-- 'fromGmail'; se o ENUM ainda não o tiver, o evento cai no tratamento por evento e é
-- ignorado — não derruba nada, mas não entra).
--
-- EXECUÇÃO: scripts/ops/gcal-migracao-02d.sh (app-dshow) — como root do MySQL (o
-- usuário do módulo não tem DDL), com dump do DDL antes e revert gerado.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE gcal_events
  MODIFY event_type ENUM('default','focusTime','outOfOffice','workingLocation','birthday','fromGmail')
         NOT NULL DEFAULT 'default',
  ALGORITHM=INSTANT;

-- Conferência:
--   SELECT COLUMN_TYPE FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA='GCAL_DSHOW' AND TABLE_NAME='gcal_events' AND COLUMN_NAME='event_type';
--   → enum('default','focusTime','outOfOffice','workingLocation','birthday','fromGmail')
--
-- REVERSÃO (só se NÃO houver linha com event_type='fromGmail'; se houver, antes:
--   UPDATE gcal_events SET event_type='default' WHERE event_type='fromGmail';):
--   ALTER TABLE gcal_events
--     MODIFY event_type ENUM('default','focusTime','outOfOffice','workingLocation','birthday')
--            NOT NULL DEFAULT 'default', ALGORITHM=INSTANT;
