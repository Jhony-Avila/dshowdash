-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 004_vinculos_exclusao_logica — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- ATR-M1: vínculos de kit (itens e escopos) com exclusão lógica + versão; o repositório grava só o que mudou e preserva legado_id.
-- Leituras passam a filtrar `excluido_em IS NULL` (o app também: CONTRATO-APP.md).
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 004_vinculos_exclusao_logica.revert.sql (só validação).
-- =====================================================================================================================================
ALTER TABLE `eq_grupo_atributo`
  ADD COLUMN `versao` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `legado_id`,
  ADD COLUMN `excluido_em` DATETIME(3) NULL AFTER `versao`,
  ADD COLUMN `atualizado_por` VARCHAR(100) NULL AFTER `excluido_em`,
  ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER `atualizado_por`,
  ADD KEY `idx_eq_ga_vivo` (`grupo_id`, `excluido_em`);
ALTER TABLE `eq_grupo_escopo`
  ADD COLUMN `versao` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `subcategoria`,
  ADD COLUMN `excluido_em` DATETIME(3) NULL AFTER `versao`,
  ADD COLUMN `atualizado_por` VARCHAR(100) NULL AFTER `excluido_em`,
  ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER `atualizado_por`,
  ADD KEY `idx_eq_ge_escopo_vivo` (`categoria`, `subcategoria`, `excluido_em`);
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('004_vinculos_exclusao_logica', NULL);
