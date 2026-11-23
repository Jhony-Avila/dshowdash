-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 013_sugestao_estados — Parte C (Sugestões: Ignorar, Devolver, Reabrir, sucessora por conteúdo novo) (23/11/2026,
-- ESQUERDA). ADITIVA: nenhuma coluna/tabela existente é renomeada ou removida; códigos de atributo intocados. PORTÃO: em produção só pelo
-- executor tools/db/equipamentos-migrar.php com o APLICAR do Jhony; validação = bases ATRWEB_VAL_T_*. ORDEM: 011 → 012 → 013 (a 013 não usa
-- nada da 012, mas o executor recusa lacuna; ver PROPOSTA-CONTRATO-SUGESTOES v2 §7.3).
-- estado: + 'ignorada' (pode voltar à fila) e 'substituida' (ignorada que ganhou sucessora com conteúdo novo); valores novos só no FIM.
-- decidido_por_id: titular estável (id do usuário do Dash) de quem decidiu; NULL nas decisões antigas.
-- substitui_id: a linha ANTERIOR da mesma identidade (fonte, tipo, produto, atributo) — índice ÚNICO: cada linha tem no máximo UMA sucessora;
--   a chave da sucessora é "<chave original>|r:<substitui_id>" (única por construção).
-- conteudo_hash (GERADA): sha256 do conteúdo canônico; acompanha sozinha qualquer revisão no lugar, inclusive feita por código antigo.
--   Representação inequívoca (DSHOW-105 A): cada campo vira 'N' (NULL) ou 'S<n>:<texto>' (n = caracteres) — sem separador ambíguo e com NULL
--   diferente de ''. valor_proposto decimal (^-?d+([.,]d+)?$ depois de TRIM) é NORMALIZADO: vírgula→ponto, sem zeros à direita da fração, sem
--   ponto final, sem zeros à esquerda ("2,50" = "2.500" = "2.5"; "007" = "7"); texto fica como está. Espelho: Cargas::hashConteudo.
-- pendente_identidade (GERADA) + UNIQUE: no máximo UMA pendente por identidade (NULL não conflita).
-- Reversão: 013_sugestao_estados.revert.sql (só validação; recusa com ignorada/substituida/sucessora).
-- =====================================================================================================================================
ALTER TABLE `eq_sugestao`
  MODIFY COLUMN `estado` ENUM('pendente','aceita','recusada','ignorada','substituida') NOT NULL DEFAULT 'pendente',
  ADD COLUMN `decidido_por_id` BIGINT NULL COMMENT 'id estável do usuário do Dash que decidiu (NULL = decisão anterior à 013)' AFTER `decidido_por`,
  ADD COLUMN `substitui_id` BIGINT UNSIGNED NULL COMMENT 'linha anterior da mesma identidade (conteúdo novo)' AFTER `evidencia`,
  ADD COLUMN `conteudo_hash` CHAR(64) AS (SHA2(CONCAT(IF(CAST(`atributo_alternativo_id` AS CHAR) IS NULL, 'N', CONCAT('S', CHAR_LENGTH(CAST(`atributo_alternativo_id` AS CHAR)), ':', CAST(`atributo_alternativo_id` AS CHAR))), IF((CASE WHEN `valor_proposto` IS NULL THEN NULL WHEN REPLACE(TRIM(`valor_proposto`), ',', '.') REGEXP '^-?[0-9]+([.][0-9]+)?$' THEN REGEXP_REPLACE(IF(LOCATE('.', REPLACE(TRIM(`valor_proposto`), ',', '.')) > 0, TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM REPLACE(TRIM(`valor_proposto`), ',', '.'))), REPLACE(TRIM(`valor_proposto`), ',', '.')), '^(-?)0+([0-9])', '$1$2') ELSE `valor_proposto` END) IS NULL, 'N', CONCAT('S', CHAR_LENGTH((CASE WHEN `valor_proposto` IS NULL THEN NULL WHEN REPLACE(TRIM(`valor_proposto`), ',', '.') REGEXP '^-?[0-9]+([.][0-9]+)?$' THEN REGEXP_REPLACE(IF(LOCATE('.', REPLACE(TRIM(`valor_proposto`), ',', '.')) > 0, TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM REPLACE(TRIM(`valor_proposto`), ',', '.'))), REPLACE(TRIM(`valor_proposto`), ',', '.')), '^(-?)0+([0-9])', '$1$2') ELSE `valor_proposto` END)), ':', (CASE WHEN `valor_proposto` IS NULL THEN NULL WHEN REPLACE(TRIM(`valor_proposto`), ',', '.') REGEXP '^-?[0-9]+([.][0-9]+)?$' THEN REGEXP_REPLACE(IF(LOCATE('.', REPLACE(TRIM(`valor_proposto`), ',', '.')) > 0, TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM REPLACE(TRIM(`valor_proposto`), ',', '.'))), REPLACE(TRIM(`valor_proposto`), ',', '.')), '^(-?)0+([0-9])', '$1$2') ELSE `valor_proposto` END))), IF(CAST(`opcao_id` AS CHAR) IS NULL, 'N', CONCAT('S', CHAR_LENGTH(CAST(`opcao_id` AS CHAR)), ':', CAST(`opcao_id` AS CHAR))), IF(CAST(`unidade_id` AS CHAR) IS NULL, 'N', CONCAT('S', CHAR_LENGTH(CAST(`unidade_id` AS CHAR)), ':', CAST(`unidade_id` AS CHAR)))), 256)) STORED COMMENT 'conteúdo canônico (gerado): campos com tamanho, NULL≠vazio, decimal normalizado' AFTER `substitui_id`,
  ADD COLUMN `pendente_identidade` VARCHAR(120) AS (IF(`estado` = 'pendente', CONCAT(`fonte`, '|', `tipo`, '|', `product_id`, '|', `atributo_id`), NULL)) STORED COMMENT 'no máximo 1 pendente por identidade' AFTER `conteudo_hash`,
  ADD UNIQUE KEY `uq_eq_sugestao_pendente` (`pendente_identidade`),
  ADD UNIQUE KEY `uq_eq_sugestao_sucessora` (`substitui_id`),
  ADD KEY `idx_eq_sugestao_pagina` (`estado`, `fonte`, `product_id`, `atributo_id`, `id`),
  ADD KEY `idx_eq_sugestao_hash` (`fonte`, `tipo`, `product_id`, `atributo_id`, `conteudo_hash`);
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('013_sugestao_estados', NULL);
