-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 005_kits — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- Kit (nome de tela do eq_grupo, decisão A2): descrição, ordem, aplica_a_todos; por item: destaque (A4), importância (A3), unidade do kit;
-- importância padrão no dicionário (semeada pela carga a partir do legado_meta).
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 005_kits.revert.sql (só validação).
-- =====================================================================================================================================
ALTER TABLE `eq_grupo`
  ADD COLUMN `descricao` VARCHAR(500) NULL AFTER `nome`,
  ADD COLUMN `ordem` INT NOT NULL DEFAULT 0 AFTER `descricao`,
  ADD COLUMN `aplica_a_todos` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = vale para todos os produtos do catálogo' AFTER `ordem`;
ALTER TABLE `eq_grupo_atributo`
  ADD COLUMN `destaque` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'A4: até 4 por kit (regra no serviço)' AFTER `visivel`,
  ADD COLUMN `importancia` ENUM('obrigatorio','importante','basico','complementar','opcional','sem_importancia') NULL AFTER `destaque`,
  ADD COLUMN `unidade_id` INT UNSIGNED NULL COMMENT 'unidade definida no kit (D3)' AFTER `importancia`,
  ADD CONSTRAINT `fk_eq_ga_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE `eq_atributo`
  ADD COLUMN `importancia_padrao` ENUM('obrigatorio','importante','basico','complementar','opcional','sem_importancia') NULL AFTER `aceita_nao_se_aplica`;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('005_kits', NULL);
