-- ═══════════════════════════════════════════════════════════════════════════
-- `dshowdash_app` — tirar a conexão principal do root do MySQL
-- @created 2026-07-30
--
-- O PROBLEMA
-- `DB_DSHOWDASH_USER=root`, com `ALL PRIVILEGES ON *.* WITH GRANT OPTION` mais
-- `SUPER`, `FILE`, `CREATE USER` e `SHUTDOWN`. Qualquer SQL injection em
-- qualquer endpoint tinha privilégio total no servidor — inclusive `FILE`, que
-- lê e escreve arquivos do disco.
--
-- É o "CRITICAL" da auditoria de 2026-04-30, ainda vivo em 2026-07-30.
--
-- O ESCOPO É MENOR DO QUE PARECIA
-- Medido: das 7 conexões do `db_connection.php`, **só a DSHOWDASH usa root**.
-- As outras já têm usuário dedicado (`dshow_ro`, `gcal_app`, `pipe_app`,
-- `bling_app`). Prececente: `gcal_app`, criado em 2026-07-30 para o módulo
-- Google Calendar — o primeiro do projeto sem root.
--
-- PRIVILÉGIO MEDIDO, NÃO CHUTADO
-- Varredura do `api/` inteiro:
--   SELECT 745 · UPDATE 252 · DELETE 173 · INSERT 146   → DML é necessário
--   CREATE/DROP TABLE .... 4 ocorrências, TODAS sondas que testam se DDL é
--                          RECUSADO (bling `__probe_ddl`, datatables probe) ou
--                          string de mensagem. Nenhuma precisa de DDL de verdade.
--   ALTER / TRUNCATE / LOCK / CALL ... zero ocorrências reais.
--   information_schema ..... só em comentário; consulta nenhuma.
-- Acesso cruzado de schema pela conexão DSHOWDASH: **um só** —
--   `api/ui/context-messages.php` → `SELECT ... FROM DSHOWDASH_HOME.ui_context_messages`
--
-- Por isso: DML no DSHOWDASH, SELECT no DSHOWDASH_HOME, e nada mais.
-- Sem DDL, sem GRANT, sem SUPER, sem FILE, sem alcance a outros schemas.
-- ═══════════════════════════════════════════════════════════════════════════

-- Trocar <SENHA> por uma senha forte gerada na hora (openssl rand -base64 24).
CREATE USER IF NOT EXISTS 'dshowdash_app'@'127.0.0.1' IDENTIFIED BY '<SENHA>';

-- Base da aplicação: leitura e escrita, nada de estrutura.
GRANT SELECT, INSERT, UPDATE, DELETE ON `DSHOWDASH`.* TO 'dshowdash_app'@'127.0.0.1';

-- Único acesso cruzado que o código faz por esta conexão, e é só leitura.
GRANT SELECT ON `DSHOWDASH_HOME`.* TO 'dshowdash_app'@'127.0.0.1';

FLUSH PRIVILEGES;

-- ── O QUE ESTE USUÁRIO NÃO PODE (é o ponto) ────────────────────────────────
-- CREATE / DROP / ALTER ....... DDL é operação de deploy, não de runtime
-- GRANT / CREATE USER ......... não escala privilégio
-- FILE ........................ não lê nem escreve arquivo do servidor
-- SUPER / SHUTDOWN / PROCESS .. não mexe no servidor nem vê query alheia
-- outros schemas .............. INTEGRACAO, DSHOW_PROD, PIPE_DSHOW, GCAL_DSHOW
--                               continuam com as credenciais próprias deles
--
-- ── DEPOIS DE VIRAR O .env ─────────────────────────────────────────────────
-- Rotacionar a senha do root: ela esteve em TEXTO PURO dentro do webroot
-- (`api/ui/context-messages.php`, corrigido em 2026-07-27) e deve ser tratada
-- como comprometida.
--
-- Rollback: `DB_DSHOWDASH_USER=root` + a senha antiga no `.env`. Backup em
-- /backup/.env.bak-pre-dshowdash-app-*

-- ═══════════════════════════════════════════════════════════════════════════
-- APLICADO EM 2026-07-30 — a app NÃO roda mais como root
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROVA (19 checks): tudo que o app precisa funciona; tudo que o root permitia
-- está bloqueado.
--   PODE ...... SELECT/INSERT/UPDATE/DELETE em DSHOWDASH · SELECT em
--               DSHOWDASH_HOME · SHOW COLUMNS · SHOW TABLE STATUS ·
--               transação · information_schema (filtrado)
--   NÃO PODE .. CREATE/DROP/ALTER/TRUNCATE · GRANT · CREATE USER · FILE
--               (LOAD_FILE) · ler INTEGRACAO/PIPE_DSHOW/GCAL_DSHOW · escrever
--               em DSHOWDASH_HOME · ver processo alheio
--
-- VERIFICADO NO AR: login real (grava sessão), 5 endpoints de sessão em 200,
-- 17 endpoints de status em 200, boot com 127 itens de sidebar, zero pageerror,
-- zero 5xx, e as suítes do Calendar/XLSX/homologação passando.
--
-- ⚠️ EFEITO COLATERAL ENCONTRADO E CORRIGIDO
-- O `detect-schema-drift.php` varria "todos os schemas visíveis" usando a
-- conexão DSHOWDASH — e funcionava **porque ela era root**. Sem a onisciência,
-- passou a acusar 75 tabelas `bling_*` como inexistentes (falso positivo).
-- A correção NÃO foi devolver privilégio: foi declarar as conexões de verdade
-- (`GCAL_DSHOW` e `BLING`, que já tinham credencial própria no `.env`).
-- Lição: ferramenta que depende de privilégio excessivo esconde a própria
-- lacuna — o privilégio a menos é que revelou o que faltava declarar.
--
-- ── O QUE FALTA (é do dono/DBA) ────────────────────────────────────────────
-- 🔑 ROTACIONAR A SENHA DO ROOT. Ela esteve em texto puro dentro do webroot e
--    deve ser tratada como comprometida. Agora que a app não a usa mais, a
--    rotação não derruba o site — mas confira antes quem mais a utiliza
--    (backups em /opt/dshow_secure/, .my.cnf, scripts de DBA).
--
-- Rollback (se algo aparecer depois): repor `DB_DSHOWDASH_USER=root` e a senha
-- antiga a partir de /backup/.env.bak-pre-dshowdash-app-20260730-150359
