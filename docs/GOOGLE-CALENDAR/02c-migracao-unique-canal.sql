-- ═══════════════════════════════════════════════════════════════════════════
-- GCAL_DSHOW — migração 02c: a UNIQUE de canal ativo faz o oposto do que diz
-- @created 2026-07-30
--
-- A CHAVE
--   UNIQUE KEY uq_cal_ativo (account_id, calendar_id, stopped_at)
--
-- A INTENÇÃO era "um canal ativo por calendário". Ela NÃO faz isso e ainda
-- quebra o que deveria funcionar:
--
-- 1. NÃO IMPEDE O QUE DEVERIA. Canal ativo tem `stopped_at IS NULL`, e em MySQL
--    dois NULLs nunca colidem numa chave única. Ou seja: N canais ativos para o
--    mesmo calendário passam sem reclamação — exatamente o caso que a chave
--    existia para barrar.
--
-- 2. IMPEDE O QUE DEVERIA FUNCIONAR. `stopped_at` é DATETIME (resolução de
--    segundo). Parar dois canais do mesmo calendário no MESMO SEGUNDO viola a
--    chave. Foi o que aconteceu na suíte da Fase 5: a renovação abriu o canal
--    novo e, ao parar o antigo, levou
--        1062 Duplicate entry '26-ag@dshow.com.br-2026-07-30 06:37:42'
--    Em produção isso apareceria na renovação horária, com um canal órfão
--    ficando "ativo" para sempre e o push duplicando notificações.
--
-- CORREÇÃO
-- A unicidade de canal ativo é responsabilidade do CÓDIGO (GcalWatchService
-- abre o novo e para o antigo, nessa ordem, e `canaisAtivosDe()` devolve LISTA
-- justamente porque o banco não garante). Aqui fica só o índice de consulta.
--
-- Lição: chave única sobre coluna anulável não é restrição — é armadilha. Ela
-- silencia no caso que importa e grita no caso banal.
-- ═══════════════════════════════════════════════════════════════════════════

-- A ORDEM É OBRIGATÓRIA: criar o substituto ANTES de derrubar o original.
-- `uq_cal_ativo` começa em `account_id` e é o índice que sustenta a FK
-- `fk_watch_acc` (criada na migração 02b). Dropar primeiro devolve
--   1553 Cannot drop index 'uq_cal_ativo': needed in a foreign key constraint
-- Com o novo índice já no lugar, a FK passa a se apoiar nele e o drop libera.
ALTER TABLE gcal_watch_channels
  ADD INDEX ix_cal_ativo (account_id, calendar_id, stopped_at);

ALTER TABLE gcal_watch_channels DROP INDEX uq_cal_ativo;

ALTER TABLE gcal_watch_channels
  COMMENT='Um canal ativo por calendário é garantido pelo CÓDIGO (GcalWatchService), NÃO por chave única: stopped_at é anulável e NULLs nunca colidem em UNIQUE no MySQL. Ver migração 02c.';
