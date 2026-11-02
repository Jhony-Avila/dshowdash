# Lista de revisão de segredos (P1-01) — arquivos FORA do Git até revisão

Só caminho e nome do padrão com contagem; nenhum valor foi lido para a saída.

| Arquivo | Categoria | Padrões (contagem) |
|---|---|---|
| `.claude/settings.local.json` | config local de agente (revisar) | — (não aberto) |
| `.env` | caminho sensível (não aberto) | — (não aberto) |
| `.env.example` | caminho sensível (não aberto) | — (não aberto) |
| `api/auth/services/AuthService.php` | php | senha_literal=1 |
| `config/.htaccess` | caminho sensível (não aberto) | — (não aberto) |
| `config/avatar_admin.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/db_connection.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/decision_engine.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/ponte-app.key` | caminho sensível (não aberto) | — (não aberto) |
| `config/redis.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/timezone.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/uarps.php` | caminho sensível (não aberto) | — (não aberto) |
| `config/uarps_inventory_header.json` | caminho sensível (não aberto) | — (não aberto) |
| `config/uarps_regions.json` | caminho sensível (não aberto) | — (não aberto) |
| `config/uarps_triggers.json` | caminho sensível (não aberto) | — (não aberto) |
| `config/webhook-secret.txt` | caminho sensível (não aberto) | — (não aberto) |
| `docs/BLING/02-banco-BLING.sql` | SQL/migração | identified_by=2 |
| `docs/OUTLOOK/FASE-0.md` | docs | identified_by=1 |
| `docs/SEGURANCA/dshowdash_app-privilegio-minimo.sql` | SQL/migração | identified_by=1 |
| `docs/dba/HANDOFF-DBA-2026-07-17.md` | docs | identified_by=1 |
| `docs/dba/create-readonly-dshow-prod.sql` | SQL/migração | identified_by=1 |
| `public/assets/avatars/secret-agent.svg` | caminho sensível (não aberto) | — (não aberto) |
| `public/bootstrap-v2/phases/phase-2-auth.ts` | ts | senha_literal=1 |
| `public/core/runtime/events/catalog/system.events.ts` | ts | senha_literal=1 |
| `public/modules/global-state/api/contracts.ts` | ts | senha_literal=1 |
| `public/platform/pages/login-mfe/events/contracts.ts` | ts | senha_literal=1 |
| `scripts/datatables-smoke-all.php` | php | senha_literal=2 |
| `scripts/rebuild-all.sh` | sh | cli_senha=1 |
| `tests/api-navigation-test.php` | php | senha_literal=1 |
| `tools/db/nav_dryrun.sh` | sh | cli_senha=1 |
| `tools/screenshot/.env` | caminho sensível (não aberto) | — (não aberto) |
| `tools/screenshot/valida-bling-fase4.mjs` | mjs | token_literal=1 |
| `tools/screenshot/valida-dt-admin.mjs` | mjs | prefixo_token=1 |
| `tools/validate_P14_nav_governance.sh` | sh | cli_senha=1 |
