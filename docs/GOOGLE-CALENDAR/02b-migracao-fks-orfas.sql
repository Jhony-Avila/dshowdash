-- ═══════════════════════════════════════════════════════════════════════════
-- GCAL_DSHOW — migração 02b: estado operacional órfão
-- @created 2026-07-30
--
-- ACHADO QUE MOTIVOU ISTO
-- Depois que os scripts de teste da Fase 4 apagaram suas contas fictícias,
-- `gcal_sync_state` ficou com 16 linhas apontando para contas que não existem
-- mais. O CASCADE não disparou porque a tabela NUNCA teve FK.
--
-- O sintoma não foi lixo em disco — foi RESPOSTA ERRADA: o verificador de
-- go-live somou essas linhas e mostrou "✔ primeira sincronização concluída,
-- 5/16 calendários ok" num banco com ZERO contas conectadas. Um verde falso no
-- exato indicador que existe para dizer se é seguro ligar.
--
-- Pior cenário real, se não corrigido: uma conta futura poderia reaproveitar um
-- account_id e herdar o `sync_token_enc` de uma conta morta — o incremental
-- pediria o delta com token de outra agenda.
--
-- O QUE TEM FK E O QUE NÃO TEM — é decisão, não esquecimento
--   COM FK/CASCADE : estado operacional (sem a conta, não significa nada)
--   SEM FK         : audit_logs, sync_runs, sync_errors — histórico e perícia
--                    precisam SOBREVIVER à conta. Apagar auditoria junto com o
--                    objeto auditado anula o motivo de existir da auditoria.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Limpar o que já ficou órfão ──────────────────────────────────────────
DELETE s FROM gcal_sync_state s
  LEFT JOIN gcal_accounts a ON a.id = s.account_id WHERE a.id IS NULL;

DELETE w FROM gcal_watch_channels w
  LEFT JOIN gcal_accounts a ON a.id = w.account_id WHERE a.id IS NULL;

DELETE j FROM gcal_sync_jobs j
  LEFT JOIN gcal_accounts a ON a.id = j.account_id WHERE a.id IS NULL;

DELETE e FROM gcal_calendar_list_entries e
  LEFT JOIN gcal_accounts a ON a.id = e.account_id WHERE a.id IS NULL;

-- ── 2. Impedir que aconteça de novo ─────────────────────────────────────────
ALTER TABLE gcal_sync_state
  ADD CONSTRAINT fk_sync_acc FOREIGN KEY (account_id)
      REFERENCES gcal_accounts(id) ON DELETE CASCADE;

ALTER TABLE gcal_watch_channels
  ADD CONSTRAINT fk_watch_acc FOREIGN KEY (account_id)
      REFERENCES gcal_accounts(id) ON DELETE CASCADE;

ALTER TABLE gcal_sync_jobs
  ADD CONSTRAINT fk_job_acc FOREIGN KEY (account_id)
      REFERENCES gcal_accounts(id) ON DELETE CASCADE;

ALTER TABLE gcal_calendar_list_entries
  ADD CONSTRAINT fk_cle_acc FOREIGN KEY (account_id)
      REFERENCES gcal_accounts(id) ON DELETE CASCADE;

-- ── 3. Registrar por escrito a ausência deliberada ──────────────────────────
ALTER TABLE gcal_audit_logs
  COMMENT='before/after passam por GcalCrypto::scrub antes de gravar (§75.2). SEM FK para gcal_accounts DE PROPÓSITO: a auditoria tem de sobreviver à exclusão da conta auditada.';

ALTER TABLE gcal_sync_runs
  COMMENT='Histórico de execuções. SEM FK: perícia de incidente precisa das execuções de uma conta já removida.';

ALTER TABLE gcal_sync_errors
  COMMENT='Erros de sincronização. SEM FK: mesma razão de gcal_sync_runs.';
