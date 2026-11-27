-- Volta do item A: NUNCA apaga. A tabela de operações é renomeada (o histórico fica); as colunas novas da auditoria FICAM (nulas, o código
-- antigo não as lê). Se já houver uma cópia __volta_uarps_escrita (volta anterior), o RENAME falha e nada muda.
RENAME TABLE app_uarps_operacoes TO app_uarps_operacoes__volta_uarps_escrita;
