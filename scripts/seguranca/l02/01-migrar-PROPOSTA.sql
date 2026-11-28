-- L02 (LOGS-009/011) · PROPOSTA AZUL 28/11 · NÃO APLICAR antes do aceite e do portão do VERMELHO (executor: Jhony). Rodar DEPOIS do código no ar
-- (o código lê a referência E o id cru durante a transição; antes do código, esta troca desconectaria todo mundo).
-- Troca o id cru (= cookie) pela referência 'h1:' + sha256 em todas as linhas ainda cruas. Idempotente (só linhas sem 'h1:').
-- O id do PHP só tem [A-Za-z0-9,-], então nenhuma linha crua começa com 'h1:'.
UPDATE app_user_sessions SET session_token = CONCAT('h1:', SHA2(session_token, 256)) WHERE session_token NOT LIKE 'h1:%';
-- conferência (esperado 0): SELECT COUNT(*) FROM app_user_sessions WHERE session_token NOT LIKE 'h1:%';
-- volta: não há (o hash não é reversível); o efeito de voltar o CÓDIGO sem esta linha é desconectar quem entrou depois (login de novo).
