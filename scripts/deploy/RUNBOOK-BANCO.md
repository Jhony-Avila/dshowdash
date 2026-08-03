# RUNBOOK — Migração AS5 do banco (as5_schema.sql) · reversível de ponta a ponta

**O que aplica:** `sql/avatar/as5_schema.sql` — 5 tabelas NOVAS e aditivas
(`avatar_profiles`, `avatar_states`, `avatar_state_versions`,
`avatar_asset_versions`, `avatar_asset_files`), todas `IF NOT EXISTS`.
**Nenhuma tabela existente é alterada** — impossível deixar o banco
inconsistente: ou a tabela nova é criada inteira, ou nada muda.
Senhas NUNCA passam pelo chat: todo prompt de senha é digitado no terminal.

---

## Passo 1 — Verificar acesso e permissões (só leitura, seguro)

```bash
cd /var/www/dshowdash && php -r 'require "config/db_connection.php"; $p=getConnection("DSHOWDASH"); echo "banco=", $p->query("SELECT DATABASE()")->fetchColumn(), "  usuario_app=", $p->query("SELECT CURRENT_USER()")->fetchColumn(), PHP_EOL;' && mysql -u root -p -e "SELECT CURRENT_USER(); SHOW GRANTS FOR CURRENT_USER();"
```

*(digite a senha root no prompt; se não lembrar, vá ao ANEXO A antes)*
Esperado: `GRANT ALL PRIVILEGES` (ou ao menos CREATE) para o root.

## Passo 2 — Backup completo ANTES (obrigatório)

```bash
cd /var/www/dshowdash && CARIMBO=$(date +%Y%m%d-%H%M%S) && DB=$(php -r 'require "config/db_connection.php"; echo getConnection("DSHOWDASH")->query("SELECT DATABASE()")->fetchColumn();') && mysqldump -u root -p --single-transaction --routines --triggers "$DB" | gzip > /backup/db-pre-migracao-$CARIMBO.sql.gz && ls -lh /backup/db-pre-migracao-$CARIMBO.sql.gz && echo BACKUP_OK
```

## Passo 3 — Aplicar a migração (runner oficial, só o arquivo AS5)

```bash
cd /var/www/dshowdash && read -s -p "senha root: " SENHA && echo && AVST_MIG_DSN="mysql:host=127.0.0.1;dbname=$(php -r 'require "config/db_connection.php"; echo getConnection("DSHOWDASH")->query("SELECT DATABASE()")->fetchColumn();');charset=utf8mb4" AVST_MIG_USER=root AVST_MIG_PASS="$SENHA" php scripts/avatar/aplicar-migracoes.php sql/avatar/as5_schema.sql && unset SENHA && echo MIGRACAO_OK
```

## Passo 4 — Validar o resultado

```bash
cd /var/www/dshowdash && php scripts/avatar/aplicar-migracoes.php --checar && mysql -u root -p -e "USE $(php -r 'require "config/db_connection.php"; echo getConnection("DSHOWDASH")->query("SELECT DATABASE()")->fetchColumn();'); SHOW TABLES LIKE 'avatar_%'; SELECT COUNT(*) linhas_states FROM avatar_states;"
```

Esperado: 22/22 tabelas no `--checar`; as 5 novas listadas; `linhas_states = 0`.
Depois disso, ligar a flag `as5.estado_api` no navegador ativa o espelho
§619 **sem novo deploy** (o código já está no ar pelo deploy-as5.sh).

## Passo 5 — ROLLBACK (só se necessário)

As tabelas novas nascem vazias; remover não toca em nada existente:

```bash
mysql -u root -p -e "USE $(cd /var/www/dshowdash && php -r 'require "config/db_connection.php"; echo getConnection("DSHOWDASH")->query("SELECT DATABASE()")->fetchColumn();'); DROP TABLE IF EXISTS avatar_asset_files, avatar_asset_versions, avatar_state_versions, avatar_states, avatar_profiles;" && echo ROLLBACK_SCHEMA_OK
```

Cenário extremo (não deve acontecer — nada existente é alterado): restaurar
o dump do Passo 2: `gunzip < /backup/db-pre-migracao-CARIMBO.sql.gz | mysql -u root -p NOME_DO_BANCO`.

---

## ANEXO A — Reset da senha root do MySQL/MariaDB (USE SOMENTE SE PRECISAR)

Reversível e sem tocar em dados; requer sudo. Downtime: ~30s de banco.

```bash
# 1) parar o serviço
sudo systemctl stop mariadb 2>/dev/null || sudo systemctl stop mysql
# 2) subir SEM grants (modo manutenção, socket local apenas)
sudo mysqld_safe --skip-grant-tables --skip-networking &
sleep 4
# 3) redefinir a senha (digite a NOVA no lugar de NOVASENHA — não cole no chat)
mysql -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'NOVASENHA'; FLUSH PRIVILEGES;"
# 4) derrubar o modo manutenção e voltar ao normal
sudo mysqladmin -u root -p shutdown
sudo systemctl start mariadb 2>/dev/null || sudo systemctl start mysql
# 5) testar
mysql -u root -p -e "SELECT 1;" && echo ROOT_OK
```

Guarde a nova senha no seu gerenciador de senhas. Depois volte ao Passo 1.

---

## ANEXO B — Chave da IA no servidor (nunca pelo chat)

```bash
cd /var/www/dshowdash && read -s -p "cole a ANTHROPIC_API_KEY (nova, gerada agora): " CH && echo && grep -q '^ANTHROPIC_API_KEY=' config/.env && sed -i "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$CH|" config/.env || printf '\nANTHROPIC_API_KEY=%s\nAVATAR_IA_PROVEDOR=anthropic\nAVATAR_IA_MODELO=claude-sonnet-4-5\n' "$CH" >> config/.env && unset CH && php -r 'require "api/avatar/ia/FabricaIA.php"; $d=FabricaIA::diagnostico(); echo "IA disponivel: ", $d["disponivel"]?"SIM":"NAO", " (", $d["provedor"], ")", PHP_EOL;'
```

Esperado: `IA disponivel: SIM (anthropic)`. Lembrete: **revogue a chave
antiga** no console da Anthropic (ela passou pelo chat em sessão anterior)
e rotacione também o GitHub PAT "claude-decision-engine".
