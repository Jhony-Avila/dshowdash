-- Pré-checagem (só leitura; só números). Aplicar se: colunas = 0 e operacoes = 0. Já aplicado: colunas = 4, índice = 1, operacoes = 1.
SELECT (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'app_uarps_audit_log' AND column_name IN ('operacao_id','origem','antes_json','depois_json')) AS colunas_novas,
       (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'app_uarps_audit_log' AND index_name = 'ix_uarps_audit_operacao' AND seq_in_index = 1) AS indice,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'app_uarps_operacoes') AS operacoes,
       (SELECT COUNT(*) FROM app_uarps_audit_log) AS eventos_existentes;
