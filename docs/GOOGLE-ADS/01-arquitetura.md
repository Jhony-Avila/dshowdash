# 01 — Arquitetura

## 1. Fluxo de dados (briefing §42)

```
Google Ads API (GAQL / mutate)     GA4 (Data API)      Pipedrive (PIPE_DSHOW)     ERP (DSHOW_PROD/INTEGRACAO)
   │  (só o backend chama; nunca o navegador — §41)          │                          │
   ▼                                                          ▼                          ▼
GoogleAdsClient (PHP)  ── OAuth2 Bearer + developer-token + login-customer-id · GAQL · retry/backoff
   │        │                            └── ADS_PROVIDER=mock ──► AdsMock (fixtures em $_SESSION)   ← modo de testes
   ▼        ▼
Camada de sincronização  ── carga inicial · incremental (relatórios por data) · change_event/change_status (sem webhooks)
   ▼
Filas (ads_sync_jobs/runs)  ── backoff exponencial + jitter · rate-limit por operações
   ▼
Banco ADS_DSHOW  (réplica normalizada + métricas com dimensão de data + raw_payload JSON · custo em micros→normalizado)
   ▼
Camada analítica  ── KPIs/Big Numbers · classificações · desperdícios · forecast · alertas
   ▼
Camada de IA  ── diagnósticos/recomendações explicáveis (recommendation nativa + LLM) — NUNCA publica sem aprovação (§26.4)
   ▼
APIs internas  /api/ads/*  (envelope {ok,data,error} · Redis cache)
   ▼
Painel React  panel-ads  (21 telas · DataGrid · ApexCharts principal · D3 p/ especiais)
```

**Invariantes (briefing §41, §44):**
- O navegador **nunca** fala com o Google Ads/GA4 nem vê tokens.
- A UI lê **prioritariamente o banco local** (resiliência à indisponibilidade externa — §40 só mostra mensagens funcionais).
- Toda API interna valida sessão + permissão do módulo — ocultar botão no front não basta (§41).
- **Histórico nunca é sobrescrito** (§43/§44.1): métricas preservam a dimensão de data para comparações.
- Toda **escrita** (§44.1/§44.2) é vinculada a usuário, registrada em `ads_change_log`, e passa por preview (`validate_only`) + confirmação (§32).

## 2. Abstração de provider (`mock` / `google`) — mock-first

Espelha o padrão do Outlook. Uma flag `ADS_PROVIDER` decide a origem dos dados **no backend**, transparente para o front:

- `ADS_PROVIDER=mock` (**default nesta fase**): `ads_is_mock()` → `AdsMockController::route()` responde tudo com **fixtures determinísticas** (estado por `$_SESSION`), **sem** Google API, **sem** OAuth, **sem** banco. Curto-circuito isolado em `index.php` **antes** da conexão de banco (molde Outlook).
- `ADS_PROVIDER=google`: controllers reais → services → `GoogleAdsClient` → Google Ads API; persistência em `ADS_DSHOW`.
- **Selo visual** "🧪 Modo de testes" na nav do painel quando `status.provider==='mock'` (molde Outlook).
- Os caminhos reais ficam **escritos e intocados** pelo curto-circuito do mock — permite construir 100% da UI e validar lógica antes do provisionamento-dono.

## 3. Autenticação e credencial (Google Ads API)

Diferente do Pipedrive (token simples). A Google Ads API exige **três** coisas por chamada real:

1. **OAuth 2.0 access token** (header `Authorization: Bearer <access_token>`) — obtido por fluxo OAuth (Web server, PKCE recomendado), com **refresh token** para renovar. Escopo: `https://www.googleapis.com/auth/adwords`.
2. **`developer-token: <token>`** — pertence a uma conta **MCC/manager**, aprovado pelo Google (Test/Basic/Standard). **Provisionamento-dono.**
3. **`login-customer-id: <MCC id>`** — quando se acessa contas-cliente através do MCC.

### 3.1. Armazenamento (tabela `ads_accounts`, ver 02)
- **1 linha por conta-cliente conectada** (as 2 iniciais; N no futuro): `customer_id`, `descriptive_name`, `currency_code`, `time_zone`, `manager_customer_id` (MCC), `is_manager`, `status`, `last_synced_at`, etc.
- **Credencial OAuth cifrada em repouso** com **`AdsCrypto`** (AES-256-GCM, chave `ADS_CRYPTO_KEY`, molde `DtCrypto`, envelope `v1.<iv>.<tag>.<ct>`): `oauth_refresh_cipher`, `oauth_access_cipher` (efêmero), `oauth_expires_at`. O **refresh token** e o **developer token** **nunca** vão ao front nem ao log (`scrub()`).
- **Developer token** vive no `.env` (`GOOGLE_ADS_DEVELOPER_TOKEN`) — é credencial de app, não de usuário. `client_id`/`client_secret` OAuth também no `.env`.
- **Fallback `.env`:** `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (MCC) para bootstrap/CLI. Prioridade: banco > env.

### 3.2. Fluxo de conexão (tela Configurações §5.1.21) + endpoints
| Ação na tela | Endpoint | O que faz |
|---|---|---|
| "Conectar Google" | `POST /api/ads/auth/connect` | Gera URL OAuth (state+PKCE), retorna `{authorize_url}`. |
| Callback OAuth | `GET /api/ads/auth/callback` | Troca `code`→tokens, cifra e grava, chama `listAccessibleCustomers`. **Precede o gate CSRF** (molde Outlook). |
| "Escolher contas" | `POST /api/ads/accounts/select` | Grava as 2 contas escolhidas em `ads_accounts`, dispara carga inicial (fila). |
| "Reconectar" | `POST /api/ads/accounts/{id}/reconnect` | Refaz o OAuth para renovar o grant. |
| "Desconectar" | `DELETE /api/ads/accounts/{id}` | Zera tokens da conta. |
| Ver status | `GET /api/ads/status` | Contas, moeda/fuso, estado da credencial, última sync, indicador do header. |

Todos exigem sessão; escritas exigem **CSRF** (`AuthHelpers::requireCsrfForWrite()`), exceto o callback OAuth. Tokens só trafegam **server-side**, sobre HTTPS, e são **mascarados** em qualquer log.

## 4. `GoogleAdsClient` (PHP)

`api/ads/lib/GoogleAdsClient.php` — responsabilidades:
- **Transporte:** REST/JSON da Google Ads API (`https://googleads.googleapis.com/<version>/customers/{customer_id}/googleAds:searchStream`) — evita dependência gRPC/PHP pesada. **[VALIDAR versão e endpoint]**.
- **Headers:** `Authorization: Bearer`, `developer-token`, `login-customer-id`. Renova access token via refresh (auto) ao expirar/401; detecta `invalid_grant`.
- **Leitura por GAQL:** método `search($customerId, $gaql)` (paginado por `next_page_token`) e `searchStream()` para relatórios grandes. Mapa de queries por recurso em 04.
- **Escrita por mutate:** método `mutate($customerId, $service, $operations, $validateOnly)` — sempre expõe `validate_only` para o preview (§32).
- **Normalização:** `cost_micros`→decimal (÷1e6) respeitando a **moeda da conta** (§44.5); timestamps→UTC; `metrics.ctr`/`conversions` diretos.
- **Rate-limit (04 §4):** conta **operações** por chamada, lê erros `RESOURCE_EXHAUSTED`/`RateExceededError`, aplica backoff exponencial + jitter; persiste consumo em `ads_api_requests` (**sem** tokens/headers de auth).
- **Retry:** só transitórios (5xx/`UNAVAILABLE`/timeout/quota); **não** repetir `AUTHENTICATION_ERROR`/`AUTHORIZATION_ERROR`/`INVALID_ARGUMENT`. **Correlation ID** por chamada.

## 5. Banco ADS_DSHOW (integração à camada existente)

Adicionar o **6º banco** em `config/db_connection.php`, dentro de `DatabaseManager::initConfigs()`:
```php
'ADS_DSHOW' => [
  'host'     => getenv('DB_ADS_DSHOW_HOST') ?: '127.0.0.1',
  'username' => getenv('DB_ADS_DSHOW_USER') ?: '',
  'password' => getenv('DB_ADS_DSHOW_PASS') ?: '',
  'dbname'   => getenv('DB_ADS_DSHOW_NAME') ?: 'ADS_DSHOW',
  'port'     => (int)(getenv('DB_ADS_DSHOW_PORT') ?: 3306),
],
```
+ chaves `DB_ADS_DSHOW_*` no `.env` e `.env.example`. Uso: `getConnection('ADS_DSHOW')`. **Usuário MySQL dedicado** (`ads_app`, não-root) com privilégio só nesse schema (lição de segurança da auditoria).

Estrutura completa em [02-banco-ADS_DSHOW.sql](02-banco-ADS_DSHOW.sql). Padrão por entidade (§43): `resource_name, customer_id, is_removed, add_time, first_synced_at, last_synced_at, raw_payload (JSON), payload_hash, sync_version`. **Métricas** vivem em tabelas próprias com **dimensão de data** (`ads_metrics_daily`/`ads_metrics_hourly`) — nunca sobrescritas (§43/§44.1). Custo **sempre normalizado** (a partir de micros).

## 6. APIs internas (backend do módulo)

Copiar o molde roteado do Pipedrive: `api/ads/index.php` + `api/ads/_init.php`.
- `_init.php`: `require_once` de `CorsPolicy`, `SessionGate`, `ApiResponse`, `AuthHelpers`, `config/db_connection.php` e libs/services; `CorsPolicy::setupApiEndpoint([...])`; helpers `ads_body()/ads_query()/ads_require_access()/ads_is_mock()`.
- `index.php`: curto-circuito do mock → `SessionGate::start()` → `ads_require_access()` (auth + permissão) → `AuthHelpers::requireCsrfForWrite()` → roteia por `PATH_INFO`.
- **nginx:** adicionar `^/api/ads(/.*)?$ → index.php` (espelhar `datatables`/`pipedrive`; editar `sites-ENABLED`).
- **Envelope:** `{ ok, data, error, meta? }` (`ApiResponse`), cache via `RedisHelper::serveIfCached()/cacheAndReturn()` (TTLs §7). Nenhuma rota de consulta recebe ou devolve credencial externa.
- Lista de rotas em [04 §Internas](04-endpoints-api.md#apis-internas-46).

## 7. Módulo React (`panel-ads`)

Clonar `public/components/panels/panel-datatables/`:
- `vite.config.ts` dedicado: `base:'/components/panels/panel-ads/dist/'`, `outDir` local, `manifest:true`, `format:'es'`, `preserveEntrySignatures:'strict'`, `manualChunks` separando `react-vendor`, `apexcharts` e `d3` (lazy).
- Adaptador vanilla `index.js`: lê `dist/.vite/manifest.json` com `{cache:'no-store'}`, injeta CSS **uma vez** escopado a `[data-ads-react-root]`, `import()` do bundle → `mountReact()` num `<div data-ads-react-root>` filho do `contentEl` (herda `data-theme` e tokens do shell).
- **Roteamento por segmentos** (`src/shell/routing.ts`): `HASH_BASE='#/panel-ads'`, rota `#/panel-ads/<area>/<sub>[/id]?filtros`. `GRUPOS` = as 21 áreas do §5.1. Filtros globais (§5.3: conta, período, período comparativo, campanha, status, dispositivo, etc.) **persistem** entre telas (§44.13) — guardados no hash + `ads_user_preferences`.
- **Registro no shell:** `createPanelRoute("panel-ads","Ads Intelligence",{aliases:["#/panel-ads"], permissions:[...]})` em `router/registry/definitions/routes-dashboard.js`; repontar `panel-paths.js` (`"google-ads"`/`"adwords"` → o novo `index.js`).
- **Tokens/tema (§30.1):** `--ads-*` escopados a `[data-ads-react-root]`; dark default + light + seguir SO + persistência; hooks leem desse root, **não** do `<html>` (armadilha conhecida do DataTables — tema por classe `theme-light` no boot).
- **Bibliotecas visuais (§31):** **ApexCharts = principal** (linha/área/barra/combinado/heatmap/sparkline em cards); **Chart.js** só para gráficos leves; **D3** só para especiais (funil §16, relações campanha, mapas §20). "Definir uma principal, demais só em casos específicos" (§31).
- **Componentes reutilizáveis (§29):** `DataGrid<T>` (clonar `panel-datatables/src/components/grid/DataGrid.tsx` — filtros/multi-sort/colunas fixas/resize/reorder/agrupamento/subtotais/seleção-massa/exportação/views salvas/formatação condicional §29.1-29.2), `Grafico`, `PageHeader`, `BigNumberCard` (§7.2: valor+período anterior+variação+seta+mini-gráfico+tooltip+origem+atualização), `FilterBar` (§5.3), `Estados` (Skeleton/EmptyState §30.3), `CommandPalette` (busca global §36). **Decisão (05):** promover a `_shared` ou duplicar.
- **Personalização (§30.4):** widgets movíveis/redimensionáveis/ocultáveis, múltiplos dashboards, layout salvo/restaurado (`ads_dashboards`/`ads_widgets`).
- **Build:** `npx vite build --config public/components/panels/panel-ads/vite.config.ts` → **`chown -R www-data:www-data public/components/panels/panel-ads`** (passo manual obrigatório, senão não monta). Bundle hasheado + manifest `no-store` → **mudança só de bundle não precisa bump de SW**; bump só ao mudar arquivo de **URL fixa** (`index.js`).

## 8. Controle de acesso (§33, §41)

- **Flag** `panel_ads_enabled`: `is_enabled=1, rollout_percentage=0` + override em `app_user_feature_flags` para o dono (piloto). Kill-switch = `is_enabled=0`.
- **RBAC (UARPS):** perfis do §33 (Administrador/Gestor/Analista/Visualizador). Duas vias (decisão em 05): (a) `permissions:["level:NN"]` na rota + gate UARPS no backend (padrão vigente); (b) seed de chaves `ads.view`/`ads.manage`/`ads.publish` em `app_permissions` (mais granular, casa melhor com os 4 perfis do §33). **O gate real é no backend** de `api/ads/*`.
- **Escrita/publicação (§32/§33):** operações `mutate` exigem perfil ≥ Gestor + CSRF + confirmação; exclusões (§32.2) exigem confirmação reforçada + justificativa + auditoria; **sem exclusão em lote** sem confirmação adicional.

## 8. Cache e atualização (§40, §39)

- Redis para Big Numbers/gráficos/dashboards/status do header, invalidado após cada lote de sync relevante. TTLs sugeridos: status/alertas 30s, Big Numbers 60s, gráficos 2–5 min, config 600s.
- UI mostra só **mensagens funcionais** (§40: "dados atualizados", "sincronização em andamento", "falha de conexão", "dados temporariamente indisponíveis") — **nada** de métricas técnicas de API/quota/fila no painel principal.
- Ao atualizar tabelas: "aviso de novos dados" sem reposicionar linhas; preservar aba/paginação/ordenação/scroll/registro aberto (§39/§44.14).
- Período atual sempre sinalizado como "ainda pode sofrer atualização" (§44.15).
