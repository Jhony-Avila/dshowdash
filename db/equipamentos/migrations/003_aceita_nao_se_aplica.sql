-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 003_aceita_nao_se_aplica — ATRIBUTOS-APP (04/11/2026; decisão 3.7 do Jhony + arquiteto). NÃO EXECUTAR na produção sem o
-- Jhony (criação/migração SÓ por scripts/setup/equipamentos-db-criar.sh, depois do dia B). ADITIVA; idempotente por eq_schema_migrations.
-- "Não se aplica" só resolve um obrigatório quando é válido para o atributo: eq_atributo.aceita_nao_se_aplica (1 = aceita; padrão 1 preserva o
-- comportamento anterior para todo atributo existente). O AtributosService recusa gravar 'nao_se_aplica' quando 0 (422 [estado]); a completude
-- trata linha legada 'nao_se_aplica' de atributo que deixou de aceitar como PENDENTE; o app esconde a opção no modal e a aba permite configurar.
-- Reverter (só validação/ensaio): sql/revert/003_aceita_nao_se_aplica.revert.sql (fora do glob NNN_*.sql do migrador).
-- =====================================================================================================================================
ALTER TABLE `eq_atributo`
  ADD COLUMN `aceita_nao_se_aplica` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '3.7: 1 = "não se aplica" é estado válido para este atributo' AFTER `precifica_ref`;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('003_aceita_nao_se_aplica', NULL);
