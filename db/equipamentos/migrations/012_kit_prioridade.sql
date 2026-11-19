-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 012_kit_prioridade — P1 "precedência de kit independente do nome" (18/11/2026, ESQUERDA). ADITIVA (nenhuma
-- coluna/tabela existente é renomeada ou removida). PORTÃO: em produção só pelo executor tools/db/equipamentos-migrar.php com o APLICAR do
-- Jhony; validação = bases ATRWEB_VAL_T_*. Dependência SÓ DE ORDEM: a 011_operacao (outro ramo) vem antes; a 012 não usa nada da 011.
-- Hoje (Aplicabilidade::kits, DSHOW-035 #1) a precedência entre kits — qual kit define grupo, posição, importância e a unidade do item
-- de kit na cascata D3 — é a posição de (nome, id) no ORDER BY do MySQL (colação utf8mb4_0900_ai_ci de eq_grupo.nome): renomear um kit
-- mudava a ficha. A 012 cria eq_grupo.prioridade (menor = vence) e a preenche com EXATAMENTE essa posição (ROW_NUMBER sobre o mesmo
-- ORDER BY nome, id, de 1 a N, contando também kits inativos, como o código). Daí em diante o nome não decide mais nada.
-- NULL de propósito (não NOT NULL): o código anterior (rollback de código sem reverter a coluna) insere kit sem prioridade e não pode
-- quebrar; o código novo trata NULL como "fim da fila, na ordem antiga (nome, id)". O UPDATE só preenche NULL (repetível) e não muda
-- versao nem atualizado_em (nenhuma tela ganha conflito por causa da migração). Sem índice: eq_grupo tem dezenas de linhas e é lida inteira.
-- Reversão: 012_kit_prioridade.revert.sql (só validação).
-- =====================================================================================================================================
ALTER TABLE `eq_grupo`
  ADD COLUMN `prioridade` INT UNSIGNED NULL COMMENT 'precedência do kit na ficha (menor vence, desempate id), NULL = fim da fila na ordem (nome, id)' AFTER `ordem`;
UPDATE `eq_grupo` g JOIN (SELECT `id`, ROW_NUMBER() OVER (ORDER BY `nome`, `id`) AS `rn` FROM `eq_grupo`) r ON r.`id` = g.`id`
   SET g.`prioridade` = r.`rn`, g.`atualizado_em` = g.`atualizado_em` WHERE g.`prioridade` IS NULL;
INSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('012_kit_prioridade', NULL);
