-- ═══════════════════════════════════════════════════════════════
-- Usuário READ-ONLY para o ERP (DSHOW_PROD + INTEGRACAO)
-- ═══════════════════════════════════════════════════════════════
-- CONTEXTO: hoje a aplicação DShowDash lê o ERP (host displaysolutions.com.br)
-- usando o usuário PRIVILEGIADO 'Jhony'. As auditorias (score 6.7/10) apontaram
-- isso como risco. Este script cria um usuário SÓ-LEITURA para a app usar.
--
-- APLICAR: rodar como root/admin NO SERVIDOR DO ERP (displaysolutions.com.br:3306),
-- NÃO no DSHOWDASH local. Depois trocar as credenciais no .env da app (ver rodapé).
--
-- ⚠️ ANTES DE RODAR:
--   1) Trocar 'TROCAR_POR_SENHA_FORTE' por uma senha forte (>= 20 chars, aleatória).
--   2) Trocar 'IP_DO_SERVIDOR_DSHOWDASH' pelo IP público de saída do servidor da app
--      (srv920234 / dshowdash.com.br). Restringir o host é mais seguro que '%'.
--      Se o IP for dinâmico, usar '%' TEMPORARIAMENTE e restringir depois.
-- ═══════════════════════════════════════════════════════════════

-- Criar o usuário read-only (host restrito ao servidor da app)
CREATE USER IF NOT EXISTS 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH'
  IDENTIFIED BY 'TROCAR_POR_SENHA_FORTE';

-- Conceder SOMENTE SELECT nos bancos que a app lê
GRANT SELECT ON `DSHOW_PROD`.* TO 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';
GRANT SELECT ON `INTEGRACAO`.* TO 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';

-- (Opcional) Se a app também EXECUTA procedures no INTEGRACAO, conceder EXECUTE:
-- GRANT EXECUTE ON `INTEGRACAO`.* TO 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';

FLUSH PRIVILEGES;

-- Conferir o que foi concedido:
SHOW GRANTS FOR 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';

-- ═══════════════════════════════════════════════════════════════
-- DEPOIS DE CRIAR — no servidor da APP (DShowDash), editar /var/www/dshowdash/.env:
--   DB_DSHOW_PROD_USER=dshow_ro
--   DB_DSHOW_PROD_PASS=<a senha forte definida acima>
--   DB_INTEGRACAO_USER=dshow_ro
--   DB_INTEGRACAO_PASS=<a senha forte definida acima>
-- e recarregar o PHP: sudo systemctl reload php8.3-fpm
-- Validar: abrir um painel que lê o ERP (ex.: Compras > Requisições) e conferir
-- que os dados carregam; nenhuma tela de escrita deve funcionar contra o ERP.
-- ═══════════════════════════════════════════════════════════════
