-- Koala Docs — F5 (versionamento/logs) + F4 (link público): DDL 100% ADITIVO.
-- Backup de estrutura ANTES em /backup/koala-f5-f4-<ts>/db/estrutura-ANTES.sql. Só ADD COLUMN / CREATE.
-- Reversão (manual, se necessário): ver bloco comentado no fim.

-- Versões: marco (trigger) + hash p/ dirty-detection (regerar sem mudança não duplica).
ALTER TABLE koala_proposal_versions
  ADD COLUMN trigger_event VARCHAR(32) NULL AFTER version_number,
  ADD COLUMN snapshot_hash CHAR(64) NULL AFTER snapshot_json;

-- Proposta: ponteiro da versão PÚBLICA congelada + carimbos de publicação/revogação.
ALTER TABLE koala_proposals
  ADD COLUMN published_version_id BIGINT UNSIGNED NULL AFTER current_version_id,
  ADD COLUMN published_at DATETIME NULL AFTER public_url,
  ADD COLUMN public_revoked_at DATETIME NULL AFTER published_at;

-- Rate-limit simples por IP (bucket de 60s) para a porta pública SEM login (/p/{slug}).
CREATE TABLE IF NOT EXISTS koala_rate_limit (
  ip     VARCHAR(45)  NOT NULL,
  bucket INT UNSIGNED NOT NULL,
  hits   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, bucket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reversão (aditivo; rodar só se precisar desfazer) ──
-- ALTER TABLE koala_proposal_versions DROP COLUMN trigger_event, DROP COLUMN snapshot_hash;
-- ALTER TABLE koala_proposals DROP COLUMN published_version_id, DROP COLUMN published_at, DROP COLUMN public_revoked_at;
-- DROP TABLE IF EXISTS koala_rate_limit;
