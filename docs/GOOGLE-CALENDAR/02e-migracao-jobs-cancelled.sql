-- 02e — gcal_sync_jobs.status ganha 'cancelled' (Q-V9.6 do APP DSHOW, 2026-10-29)
--
-- POR QUÊ: um job `dead` por calendário apagado no Google (notFound) não tem conserto — mas também
-- não deve ficar para sempre em "aguardando análise" no log do cron. A manutenção (GcalManutencaoService)
-- marca o calendário como apagado e FECHA o job como `cancelled`, guardando o erro original em last_error.
-- Nada é apagado: a fila deixa de ser um cemitério de `dead` sem distinguir "tratado" de "pendente".
--
-- COMO: acrescentar valor NO FIM de um ENUM é só metadado (ALGORITHM=INSTANT) — sem reconstruir a tabela,
-- sem travar a fila (mesma técnica da 02d). Executor: scripts/ops/gcal-migracao-02e.sh do app-dshow
-- (root do MySQL, backup do DDL + revert.sql), ANTES do deploy do código. O código tolera a ausência da
-- migração (tratarMortos devolve `erro` e o cron segue), mas sem ela nenhum `dead` é fechado.
ALTER TABLE gcal_sync_jobs
  MODIFY status ENUM('pending','running','done','failed','dead','cancelled') NOT NULL DEFAULT 'pending',
  ALGORITHM=INSTANT;

-- Reversão (só se não houver linha 'cancelled'; se houver, a 1ª linha as devolve a 'dead'):
--   UPDATE gcal_sync_jobs SET status='dead' WHERE status='cancelled';
--   ALTER TABLE gcal_sync_jobs MODIFY status ENUM('pending','running','done','failed','dead') NOT NULL DEFAULT 'pending', ALGORITHM=INSTANT;
