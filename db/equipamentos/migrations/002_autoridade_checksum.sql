-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 002_autoridade_checksum — Etapa 8 (02/11/2026; briefing §2.4 e §3.2). NÃO EXECUTAR na produção sem o Jhony
-- (criação/migração SÓ por scripts/setup/equipamentos-db-criar.sh, depois do corte). Idempotente por eq_schema_migrations.
-- (1) eq_schema_migrations.checksum: sha256 de cada migração (MOD-015).
-- (2) D3.6 — autoridade por atributo: 'local' (padrão) ou 'precifica' (o valor vale da ficha do Precifica; o local não é editável);
--     precifica_ref = "<família>.<campo>" da ficha do app (produtos.md v1.1, specs.ts FAMILIES), único.
-- =====================================================================================================================================
ALTER TABLE `eq_schema_migrations` ADD COLUMN `checksum` CHAR(64) NULL AFTER `version`;
ALTER TABLE `eq_atributo`
  ADD COLUMN `autoridade` ENUM('local','precifica') NOT NULL DEFAULT 'local' AFTER `ativo`,
  ADD COLUMN `precifica_ref` VARCHAR(64) NULL COMMENT 'família.campo da ficha do Precifica (ex.: led_module.pitch)' AFTER `autoridade`,
  ADD UNIQUE KEY `uq_eq_atributo_precifica_ref` (`precifica_ref`);
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('002_autoridade_checksum', NULL);
