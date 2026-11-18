-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 008_unidade_por_valor — ATRIBUTOS-WEB (missão 18/11/2026). ADITIVA (nenhuma coluna/tabela existente é renomeada ou removida).
-- D3: unidade selecionável por valor. eq_valor.unidade_id (NULL = unidade efetiva herdada); fator para a unidade base da grandeza;
-- unidades permitidas além da regra da grandeza (A8).
-- Aplicada SÓ pelo executor tools/db/equipamentos-migrar.php (checksum sha256). Reversão: 008_unidade_por_valor.revert.sql (só validação).
-- =====================================================================================================================================
ALTER TABLE `eq_valor`
  ADD COLUMN `unidade_id` INT UNSIGNED NULL COMMENT 'unidade do valor (D3); NULL = efetiva (produto → kit → padrão)' AFTER `valor_data`,
  ADD CONSTRAINT `fk_eq_valor_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE `eq_unidade`
  ADD COLUMN `fator_base` DECIMAL(30,12) NULL COMMENT 'valor × fator = valor na unidade base da grandeza (base tem fator 1); NULL = sem conversão' AFTER `grandeza`;
CREATE TABLE IF NOT EXISTS `eq_atributo_unidade` (
  `atributo_id`  INT UNSIGNED    NOT NULL,
  `unidade_id`   INT UNSIGNED    NOT NULL,
  `criado_por`   VARCHAR(100)    NULL,
  `criado_em`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `excluido_em`  DATETIME(3)     NULL,
  PRIMARY KEY (`atributo_id`, `unidade_id`),
  CONSTRAINT `fk_eq_au_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_au_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('008_unidade_por_valor', NULL);
