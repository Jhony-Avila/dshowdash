-- REVERSÃO da 013_sugestao_estados (SÓ em banco ATRWEB_VAL_* / ensaio). Na produção, só com o Jhony (e NÃO faz parte do rollback de código).
-- RECUSA (erro 3819, nada muda) se houver linha 'ignorada'/'substituida' ou sucessora (substitui_id): o CHECK é validado contra TODAS as
-- linhas ao ser criado, independentemente do sql_mode da sessão (o MODIFY do ENUM sozinho, fora do modo estrito, trocaria o valor por '').
ALTER TABLE `eq_sugestao` ADD CONSTRAINT `chk_eq_sugestao_revert_013` CHECK (`estado` IN ('pendente', 'aceita', 'recusada') AND `substitui_id` IS NULL);
ALTER TABLE `eq_sugestao` DROP CHECK `chk_eq_sugestao_revert_013`;
ALTER TABLE `eq_sugestao` MODIFY COLUMN `estado` ENUM('pendente','aceita','recusada') NOT NULL DEFAULT 'pendente';
ALTER TABLE `eq_sugestao` DROP INDEX `idx_eq_sugestao_hash`, DROP INDEX `idx_eq_sugestao_pagina`, DROP INDEX `uq_eq_sugestao_sucessora`, DROP INDEX `uq_eq_sugestao_pendente`,
  DROP COLUMN `pendente_identidade`, DROP COLUMN `conteudo_hash`, DROP COLUMN `substitui_id`, DROP COLUMN `decidido_por_id`;
UPDATE `eq_schema_migrations` SET `version` = CONCAT('013_revertida_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')) WHERE `version` = '013_sugestao_estados';
