# 00 — Fase 0: Investigação (relatório)

> Executada em 2026-07-21 no `srv920234`, projeto `/var/www/dshowdash`. Read-only.
> Objetivo (briefing §47 Fase 0 e §24.1): localizar integração/banco/scripts antigos, credenciais, versão da API, e mapear o terreno **antes** de qualquer código.

## 1. O que JÁ existe no repositório (apenas andaimes de entrada)

O projeto **antecipou** a entrada visual do Pipedrive, mas **não há integração real**. Inventário:

| Peça | Caminho | Estado |
|---|---|---|
| Ícone do header | `public/assets/icons/system/header/pipedrive.svg` | ✅ existe |
| Botão do header | `public/components/header/components/panel-pipedrive/` | ✅ módulo completo (state/polling/circuit-breaker/telemetry) que consulta `api/status/pipedrive.php` |
| Botão da sidebar | `public/components/nav-rail/components/pipedrive/index.js` | ✅ gerado por `createButtonExports("pipedrive")` |
| Ícone do footer | `public/components/footer/components/icons/pipedrive/` | ✅ existe |
| Painel de status | `public/components/panels/panel-integration-pipedrive/` **v9.3.0-P2-ENTERPRISE** | ✅ existe — mas é **monitor de status da conexão** (polling 120s), **não** o módulo analítico |
| Backend de status | `api/status/pipedrive.php` **v3.2.0** | ✅ existe — **stub**: `$isConfigured = false` hardcoded, retorna `not_configured`, com `TODO` para "integração real" |

**Conclusão:** o que foi feito antes é o *indicador de status no header* (consistente com briefing §7.4/§7.5). O módulo **Pipedrive Analytics** propriamente dito (§8 em diante) é **construção nova**.

### 1.1. Roteamento atual dos botões (importante)
`public/components/main/adapters/panel-loader/panel-paths.js` mapeia hoje:
```
"pipedrive":       "panel-18"     (linha ~85)
"panel-pipedrive": "panel-18"     (linha ~100)
```
Ou seja, **os botões pipedrive abrem o `panel-18` genérico (stub)**. Para o novo módulo, repontar esses aliases para `/components/panels/panel-pipedrive/index.js` e registrar a rota — **sem tocar `extractPanelId`** (o dono vetou mexer nesse ponto do shell).

## 2. O que NÃO existe (≈95% do briefing é greenfield)

- ❌ Banco `PIPE_DSHOW` e as tabelas `pipe_*` — nenhuma existe.
- ❌ Client da API Pipedrive, token/OAuth. **O `.env` não tem nenhuma chave `PIPE*`/`PIPEDRIVE*`** (chaves atuais: `DB_DSHOWDASH_*`, `DB_INTEGRACAO_*`, `DB_DSHOW_PROD_*`, `SCREENSHOT_*`, `TOMTOM_*`, `DATATABLES_CRYPTO_KEY`).
- ❌ Camada de sincronização, filas, webhooks, controle de rate-limit.
- ❌ As 17 telas analíticas (Visão Geral, Negócios, Pessoas, Leads…).
- ❌ Cruzamento com ERP, exportações, relatórios agendados.
- ❌ **Nenhuma integração/banco/script Pipedrive antigo** — `grep -rli pipedrive` no backend só acha `api/status/pipedrive.php`. `backup/` está vazio.

## 3. Divergências entre o briefing e a realidade (para o plano não herdar suposições falsas)

| Briefing assume | Realidade encontrada |
|---|---|
| §24.1 "investigar bancos/scripts/integrações antigas" | **Não há nada antigo.** Greenfield limpo. |
| §17 "mostrar TODOS os e-mails, não só de negócios" | ⚠️ **Bloqueio de API:** um único token de API só lê a Mailbox do **dono do token** (ver 04 §7). Requer decisão de escopo. |
| "memória: backup Python cron" | **Não existe** cron de backup no repo; só utilitários `tools/*.py`. |
| "memória: `chown www-data:www-data dist` após build" | **Não está em script versionado** — é passo **manual**. Risco: `vite build` como root deixa `dist/` inservível por www-data. |
| "memória: permissões `datatables.*` (ids 23-27)" | O código do DataTables **não** gate por chaves `datatables.*` — usa `requireAuth()` puro; nav é gated por `level:NN`. Não herdar dependência de chaves de escopo. |
| §48 "migrações reversíveis" | O repo **não tem** scripts up/down. Reversibilidade praticada = DDL **idempotente e aditivo** (`CREATE TABLE IF NOT EXISTS` + `ALTER` guardado por `information_schema`). Decisão a tomar (05 §Decisões). |
| Biblioteca React compartilhada entre painéis | **Não existe.** DataGrid/Grafico/PageHeader/MetricCard/EmptyState vivem **dentro** de `panel-datatables/src/components`. |

## 4. Versão da API a usar (resumo — detalhe em 04)

- **v1 descontinuada em 01/01/2026** — mas só o subconjunto que já tem equivalente v2 (Deals, Persons, Organizations, Products, Pipelines, Stages, Activities, Search). "This does not affect the entire API v1 platform."
- **Ainda v1 (sem v2):** Users, Notes, Mail/Mailbox, Leads (CRUD), Teams (legacyTeams), Activity Types, Webhooks (versionamento próprio, v2 default).
- **Regra do plano:** priorizar `/api/v2/` e usar v1 só onde a v2 não cobre.

## 5. Ambiente confirmado

- Servidor **nginx + php8.3-fpm** (PHP 8.3.6). MySQL local em `127.0.0.1`.
- Camada de banco: `config/db_connection.php` → `DatabaseManager` (pool estático, `getConnection('DSHOWDASH')`). `.env` lido por `loadEnv()` própria.
- Redis presente (`config/redis.php` / `RedisHelper`).
- Cripto AES-256-GCM já existe: `api/datatables/lib/Crypto.php` → `DtCrypto` (reutilizável para o token).
- Padrão de módulo backend roteado: `api/datatables/index.php` + `_init.php` (molde a copiar).
- Padrão de módulo React: `public/components/panels/panel-datatables/` (molde a copiar).
- Feature flags: `app_feature_flags` + `app_user_feature_flags` + `FeatureFlagResolver`.
- RBAC: **UARPS** (roles/level + triggers/regions), `api/permissions/`.

## 6. Checklist Fase 0 (§47) — status

- [x] Localizar integração antiga → **não há** (só stub de status).
- [x] Localizar banco/scripts antigos → **não há**; `backup/` vazio.
- [x] Identificar versão da API → v2 prioritária; v1 residual (04).
- [x] Mapear endpoints → 04.
- [x] Verificar acesso a e-mails → ⚠️ limitado ao dono do token (04 §7) — **decisão do dono**.
- [x] Verificar campos personalizados → hash de 40 chars, aninhados em `custom_fields` na v2 (04 §9).
- [x] Verificar webhooks → v2 default, Basic Auth, sem HMAC (03/04).
- [ ] Validar credencial real → **pendente**: depende do token que você vai inserir pela app.
- [ ] Consultar volume de dados → **pendente**: só após conectar (dimensiona a carga inicial vs plano/orçamento de tokens).
- [ ] Relacionamentos com ERP → **pendente**: investigar campos comuns (CNPJ/CPF/e-mail/ID) — Fase 4.
