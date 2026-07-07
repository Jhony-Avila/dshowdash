-- Koala — vínculo template↔proposta: DDL ADITIVO. koala_proposals.template_id JÁ EXISTE (nullable).
-- Aqui só: índice (perf) + backfill do default explícito (NULL rendeva como Generico via fallback;
-- passa a apontar explicitamente pro Generico — render IDÊNTICO, provado por md5). Nada destrutivo.
-- Backup de estrutura ANTES em /backup/koala-template-proposta-<ts>/db/.

ALTER TABLE koala_proposals ADD INDEX ix_template (template_id);

UPDATE koala_proposals
   SET template_id = (SELECT id FROM koala_templates WHERE is_default = 1 AND status = 'published' AND deleted_at IS NULL ORDER BY id LIMIT 1)
 WHERE template_id IS NULL;

-- Reversão (aditivo): ALTER TABLE koala_proposals DROP INDEX ix_template;  (o backfill é benigno: aponta pro default)
