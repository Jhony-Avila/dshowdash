# 01 — Arquitetura

## 1. Fluxo de dados (briefing §25)

```
Pipedrive (API v2/v1)
   │  (só o backend chama; nunca o navegador — briefing §25.2)
   ▼
PipedriveClient (PHP)  ── x-api-token / OAuth · cursor · custo-de-token · retry
   ▼
Camada de sincronização  ── carga inicial · incremental (updated_since) · webhooks
   ▼
Filas (pipe_sync_jobs/runs)  ── backoff exponencial + jitter
   ▼
Banco PIPE_DSHOW  (réplica normalizada + raw_payload JSON)
   ▼
APIs internas  /api/pipedrive/*  (envelope {ok,data,error} · Redis cache)
   ▼
Módulo React  panel-pipedrive  (17 telas · DataGrid · ECharts)
```

**Invariantes (briefing §25.2, §45.1):**
- O navegador **nunca** fala com o Pipedrive nem vê o token.
- A UI lê **prioritariamente o banco local** (resiliência a indisponibilidade externa — §53).
- Toda API interna valida sessão + permissão do módulo (§45.2) — ocultar botão no front não basta.

## 2. Credencial DINÂMICA pela aplicação (decisão do dono)

O dono inserirá o token **pela própria app** (não editando `.env`). Modelo:

### 2.1. Armazenamento
- Tabela **`pipe_accounts`** (ver 02) guarda **1 linha por conexão**: método (`token`|`oauth`), `company_id`, `company_name`, `company_domain`, `api_domain`, `token_cipher`, `token_last4`, `scopes`, `connected_user_id/name`, `status`, `last_validated_at`, `last_error`.
- **Token cifrado em repouso** com AES-256-GCM reutilizando o padrão `DtCrypto` (`api/datatables/lib/Crypto.php`): envelope `v1.<ivB64>.<tagB64>.<ctB64>`. O texto puro **nunca** é persistido, logado nem devolvido ao front (só `token_last4` para exibição).
  - Decisão menor: reusar `DtCrypto` (chave `DATATABLES_CRYPTO_KEY` existente) **ou** clonar como `PipeCrypto` lendo `PIPEDRIVE_CRYPTO_KEY`. Recomendo **`PipeCrypto` com chave própria** (isolamento de segredo por módulo). `DtCrypto::scrub()` já mascara a chave `token` em logs — replicar.
- **Fallback `.env`:** se não houver linha ativa em `pipe_accounts`, o backend lê `PIPEDRIVE_API_TOKEN` do `.env` (bootstrap/CLI). Prioridade: banco > env.

### 2.2. Tela Configurações (React, aba §8.17) + endpoints
Fluxo "colar token → validar → salvar", tudo no backend:

| Ação na tela | Endpoint | O que faz |
|---|---|---|
| Colar token e "Testar" | `POST /api/pipedrive/auth/validate` | Chama `GET /v1/users/me` com o token informado; **não** salva. Retorna empresa/usuário conectados ou o erro. |
| "Salvar/Conectar" | `POST /api/pipedrive/auth/connect` | Valida via `/users/me`, cifra e grava em `pipe_accounts`, dispara carga inicial (fila). Retorna só dados mascarados. |
| "Reconectar/Trocar" | `POST /api/pipedrive/auth/reconnect` | Substitui a credencial sem downtime; revalida. |
| Ver status | `GET /api/pipedrive/status` | Empresa, usuário, `status` (§26.3), última validação, último erro, indicador do header (§7.5). |

- Todos exigem **admin** + **CSRF** (`AuthHelpers::requireCsrfForWrite()`), aceitam o token **só via corpo POST sobre HTTPS** (nunca query string), e **mascaram** o token em qualquer log (`scrub`).
- Estados de status (§26.3): `não configurado` · `conectado` · `credencial inválida` · `autenticação expirada` · `permissão insuficiente` · `em teste` · `erro`.

### 2.3. Preparação para OAuth 2.0 (§26.1)
O `PipedriveClient` recebe a base URL e o cabeçalho de auth por **estratégia** (`TokenAuth` vs `OAuthAuth`), então trocar de token para OAuth é adicionar uma estratégia + tabela de tokens OAuth (`access/refresh/expires/api_domain`) — sem reescrever o client. OAuth **obriga** usar o `api_domain` retornado na troca do token como base (04 §2).

## 3. Client Pipedrive (PHP)

`api/pipedrive/lib/PipedriveClient.php` — responsabilidades:
- **Base URL:** `https://api.pipedrive.com` (token) ou `https://{company}.pipedrive.com` a partir do `api_domain` (OAuth).
- **Auth:** header `x-api-token: <token>` (v2 **não** aceita `?api_token=` — 04 §2).
- **Versionamento por entidade:** método `v2(path)` / `v1(path)`; o mapa de qual usar vem de 04 §1.
- **Paginação por cursor (v2):** itera `additional_data.next_cursor` até `null`, `limit=500` (04 §3). Para v1 (Leads/Notes/Mail/Users): `start`/`limit` + `more_items_in_collection`.
- **Governança de rate-limit por CUSTO (04 §4):** contabiliza custo por chamada (lista=20, single=2, search=40), lê `x-ratelimit-remaining`/`x-ratelimit-reset`/`x-daily-requests-left`, pausa perto de 0, e em **HTTP 429** faz backoff exponencial + jitter (não há `Retry-After` — calcular). Persiste consumo em `pipe_api_requests`.
- **Timeout + retry:** timeouts curtos, retry só em erros transitórios (5xx/timeout/429); **não** repetir 401/403/404/422 (§30.2).
- **Correlation ID** por chamada, para rastrear no log (§33.2).
- **Segurança de log:** nunca logar token/headers de auth (`scrub`); nunca duplicar conteúdo de e-mail em log técnico (§33.3).

## 4. Banco PIPE_DSHOW (integração à camada existente)

Adicionar o **4º banco** em `config/db_connection.php`, dentro de `DatabaseManager::initConfigs()`:
```php
'PIPE_DSHOW' => [
  'host' => getenv('DB_PIPE_DSHOW_HOST') ?: '127.0.0.1',
  'username' => getenv('DB_PIPE_DSHOW_USER') ?: '',
  'password' => getenv('DB_PIPE_DSHOW_PASS') ?: '',
  'dbname'   => getenv('DB_PIPE_DSHOW_NAME') ?: 'PIPE_DSHOW',
  'port'     => (int)(getenv('DB_PIPE_DSHOW_PORT') ?: 3306),
],
```
+ chaves `DB_PIPE_DSHOW_*` no `.env` e `.env.example`. Uso: `getConnection('PIPE_DSHOW')`. `healthCheck()` já cobre a nova conexão automaticamente. **Usuário MySQL dedicado** com privilégio só nesse schema (não reusar root — lição de segurança da auditoria).

Estrutura completa em [02-banco-PIPE_DSHOW.sql](02-banco-PIPE_DSHOW.sql). Colunas técnicas por entidade (§24.3): `pipedrive_id, company_id, is_deleted, is_active, add_time, update_time, first_synced_at, last_synced_at, source_updated_at, raw_payload (JSON), payload_hash, sync_version`. O **`raw_payload`** guarda o JSON bruto (§24.4) para auditoria/reprocessamento sem nova chamada; não substitui a estrutura normalizada.

## 5. APIs internas (backend do módulo)

Copiar o molde roteado do DataTables: `api/pipedrive/index.php` + `api/pipedrive/_init.php`.
- `_init.php`: `require_once` de `CorsPolicy`, `SessionGate`, `ApiResponse`, `AuthHelpers`, `config/db_connection.php` e as libs/services do módulo; `CorsPolicy::setupApiEndpoint([...])`; helpers `pipe_body()/pipe_query()/pipe_require_access()`.
- `index.php`: `SessionGate::start()` → `pipe_require_access()` (auth + permissão do módulo) → `AuthHelpers::requireCsrfForWrite()` → roteia por `PATH_INFO`.
- **nginx:** adicionar regra `^/api/pipedrive(/.*)?$ → index.php` (espelhar a de `datatables`). Editar `sites-ENABLED` (lição do repo).
- **Envelope:** `{ ok, data, error, meta? }` (`ApiResponse`), cache via `RedisHelper::serveIfCached()/cacheAndReturn()` (TTLs em §31: dashboard 60s, config 600s, métricas 120s).
- Lista de rotas em [04 §Internas](04-endpoints-api-v2.md#apis-internas-46) (mapeando o §46 do briefing). Nenhuma rota de consulta recebe ou devolve credencial externa.

## 6. Módulo React (`panel-pipedrive`)

Clonar `public/components/panels/panel-datatables/`:
- `vite.config.ts` dedicado: `base:'/components/panels/panel-pipedrive/dist/'`, `outDir` local, `manifest:true`, `format:'es'`, `preserveEntrySignatures:'strict'`, `manualChunks` separando `react-vendor` e `echarts` (lazy).
- Adaptador vanilla `index.js`: `mount(contentEl,config)` lê `dist/.vite/manifest.json` com `{cache:'no-store'}`, injeta CSS **uma vez** escopado a `[data-pp-react-root]`, e `import()` do bundle → `mountReact()`. Cria `createRoot` num `<div data-pp-react-root>` filho do `contentEl` (mesmo documento → herda `data-theme` e tokens do shell).
- **Roteamento por segmentos** (`src/shell/routing.ts`): `HASH_BASE='#/panel-pipedrive'`, rota `#/panel-pipedrive/<grupo>/<tela>[/id]?filtros`. `GRUPOS` = as 17 áreas do §8. Botões voltar/avançar do navegador (§8) via hash.
- **Registro no shell** (para `extractPanelId` casar sub-paths **sem alterá-lo**): adicionar em `public/components/router/registry/definitions/routes-dashboard.js` um `createPanelRoute("panel-pipedrive","Pipedrive Analytics",{aliases:["#/panel-pipedrive"], permissions:[...]})`; e repontar `panel-paths.js` (`"pipedrive"`/`"panel-pipedrive"` → o novo `index.js`).
- **Tokens/tema:** `--pp-*` escopados a `[data-pp-react-root]`; hooks `useShellTokens` leem desse root (não do `<html>`) — armadilha conhecida do DataTables.
- **Componentes reutilizáveis:** `DataGrid<T>` (TanStack Table + virtual), `Grafico` (ECharts lazy, theme-aware), `PageHeader`, `MetricCard`, `FilterBar`, `Estados` (Skeleton/EmptyState), `CommandPalette`. **Decisão (05):** promovê-los a um pacote `_shared` React ou duplicar de `panel-datatables`.
- **Build:** `npx vite build --config public/components/panels/panel-pipedrive/vite.config.ts` **como www-data** (ou `chown -R www-data:www-data dist` depois — passo manual obrigatório, senão o painel não monta). SW (`public/sw.js`) versiona por bump de `CACHE_NAME` + `bustBundle`.

## 7. Controle de acesso (§7.3)

- **Flag** `panel_pipedrive_enabled`: `is_enabled=1, rollout_percentage=0` + override em `app_user_feature_flags` para o usuário-piloto (dono). Kill-switch = `is_enabled=0` (desativação imediata — §48).
- **RBAC (UARPS):** restringir a admin/diretor/gestor comercial. Duas vias (decisão em 05): (a) `permissions:["level:50"]` na rota + `UARPSGate::enforceTrigger($uid,'trigger:panel:pipedrive')` no backend (padrão atual); (b) seed de chaves `pipedrive.view`/`pipedrive.manage` em `app_permissions` + `app_role_permissions` (mais granular). **O gate real é no backend** de `api/pipedrive/*`, não só na nav.

## 8. Cache e atualização (§31, §39)

- Redis para Big Numbers/gráficos/funis/config/tooltip do header (§31), invalidado após cada lote de sync relevante.
- UI: status/alertas 30s, Big Numbers 60s, gráficos 2–5min, tabelas com "aviso de novos dados" sem reposicionar linhas (§39). Preservar aba/paginação/ordenação/scroll/registro aberto ao atualizar.
