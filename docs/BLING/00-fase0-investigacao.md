# 00 — Fase 0: Investigação (relatório)

> Executada em **2026-07-29** no `srv920234.hstgr.cloud`, projeto `/var/www/dshowdash`, branch `feat/pipedrive-modulo-completo`.
> **Read-only. Nenhum arquivo do projeto foi alterado, nenhum DDL foi executado.**
> Objetivo (briefing §3.1, §5 e §6): mapear o terreno real **antes** de qualquer código.

---

## 1. Resumo executivo (o que você precisa saber em 30 segundos)

| Pergunta | Resposta |
|---|---|
| Existe integração Bling funcionando? | **Não.** Zero linhas de código que falam com a API do Bling. |
| Existem dados do Bling no banco? | **Não.** Nenhuma tabela, em nenhum dos 7 bancos acessíveis. |
| Existe o banco `BLING`? | **Sim — e está vazio (0 tabelas).** Shell criado e nunca usado. |
| Existe credencial? | **Não.** Nenhuma chave `BLING_*` no `.env` nem no `.env.example`. |
| Existem scripts/cron/webhooks? | **Não.** Nenhum job, nenhuma fila, nenhum log. |
| O que existe, então? | **Andaimes de UI**: ícone no header, botão no header, item na sidebar (desligado), painel de status, rota, 2 SVGs, registros de navegação no banco. |
| Quanto do briefing é greenfield? | **≈ 97%.** |
| Há bloqueadores? | **Sim, 3** — ver §7. Todos resolvíveis, nenhum impede começar. |

**Conclusão:** o Bling está hoje exatamente onde o Pipedrive estava em 2026-07-21 — casca de entrada pronta, motor inexistente. A boa notícia é que o Pipedrive já percorreu esse caminho inteiro e deixou um molde arquitetural comprovado em produção (`api/pipedrive/` + `PIPE_DSHOW` + `panel-pipedrive`). **O módulo Bling deve ser construído clonando esse molde, não inventando um novo.**

---

## 2. Ambiente confirmado

| Item | Valor |
|---|---|
| Servidor | `srv920234.hstgr.cloud`, Ubuntu, kernel 6.8.0-134 |
| Web | nginx 1.24.0 (Ubuntu) |
| PHP | 8.3.6 (NTS) via php-fpm |
| MySQL | 8.0.46 |
| Redis | presente (`config/redis.php` / `RedisHelper`), exige AUTH |
| Camada de banco | `config/db_connection.php` → `DatabaseManager::getConnection('<ALIAS>')`, pool estático, `.env` lido por `loadEnv()` própria |
| Front-end | Shell vanilla ES6 + painéis React 19 montados por adaptador (sem iframe) |
| Build | Vite 7.3.1, `npm run build`, saída em `dist/` por painel |
| Backups | `/backup/` (559 entradas, ativo) — PNR em vigor |

---

## 3. Diagrama da arquitetura ATUAL do Bling

```
                       ┌──────────────────────────────────────────┐
                       │  HEADER                                  │
   [ícone bling.svg] ──┤  panel-bling/index.js  v8.8.0-ES6        │
                       │  onClick → navigateToRoute('#/integrations/bling')
                       └──────────────────────────────────────────┘
                                         │
                       ┌─────────────────┴────────────────────────┐
                       │  SIDEBAR                                 │
   [item 'bling'] ─────┤  items.manifest.ts → route '#/bling'     │
   (icon 'box')        │  ui_nav_items.is_visible = 0  ← DESLIGADO│
                       └──────────────────────────────────────────┘
                                         │
                       ┌─────────────────┴────────────────────────┐
                       │  ROUTER  (3 fontes DIVERGENTES)          │
                       │  routes-integrations.ts:                 │
                       │    '/bling'              → panel-08      │  ← alertas
                       │    '/integrations/bling' → panel-integration-bling
                       │  panel-paths.js:                        │
                       │    'bling'               → panel-04      │  ← incidentes
                       │  app_nav_route_resolution_active (BD):   │
                       │    route 'bling'         → panel-04      │
                       └──────────────────────────────────────────┘
                                         │
                       ┌─────────────────┴────────────────────────┐
                       │  PAINEL panel-integration-bling          │
                       │  v9.3.0-P2-ENTERPRISE — 48 arquivos      │
                       │  monitor de status, polling 120s         │
                       │  (NÃO é o módulo de gestão)              │
                       └──────────────────────────────────────────┘
                                         │  fetch
                       ┌─────────────────┴────────────────────────┐
                       │  api/status/bling.php  v3.2.0            │
                       │  $isConfigured = false;   ← HARDCODED    │
                       │  → { status: 'not_configured' }          │
                       └──────────────────────────────────────────┘
                                         │
                                    ╳ nada além daqui ╳

   API do Bling  ─── ✗ não existe client
   OAuth 2.0     ─── ✗ não existe
   Banco BLING   ─── ⬜ existe, VAZIO (0 tabelas)
   Sync/filas    ─── ✗ não existe
   Webhooks      ─── ✗ não existe
```

---

## 4. Inventário do que JÁ existe

### 4.1. Front-end

| Peça | Caminho | Estado | Observação |
|---|---|---|---|
| Ícone do header | `public/assets/icons/system/header/bling.svg` | ✅ existe | há também `bling-logo.svg` |
| Botão do header | `public/components/header/components/panel-bling/` (48 arquivos, v8.8.0-ES6) | ✅ funcional | **navega internamente** para `#/integrations/bling` via `navigateToRoute` — correto por §8.1 |
| Export do botão | `public/components/header/components/index.ts` → `PanelBlingComponent` | ✅ registrado | |
| Item da sidebar | `public/components/sidebar/registry/items.manifest.ts:49` | ⚠️ existe no fallback estático | `{ id:'bling', sectionId:'operacional', route:'#/bling', icon:'box', priority:2 }` |
| Item da sidebar (BD) | `ui_nav_items` id 7 `sidebar.bling` | ❌ **DESLIGADO** | `is_visible=0`, `is_active=0`, aponta `panel_id='panel-integration-bling'` |
| Item "Dash Bling" (BD) | `ui_nav_items` id 175 `sidebar.dash.bling` | ⚠️ ativo mas vazio | `#/dash/bling` → `panel-stub-dev` |
| Botão do nav-rail | `public/components/nav-rail/components/` | ❌ **não existe** | há `pipedrive/`, não há `bling/` |
| Ícone do footer | `public/components/footer/components/icons/` | ❌ não existe entrada `bling` | existe `box` genérico |
| Painel de status | `public/components/panels/panel-integration-bling/` (48 arquivos, v9.3.0-P2) | ✅ existe | monitor de conexão com circuit-breaker, polling 120s, telemetria — **não** é o módulo de gestão |
| Rotas | `public/components/router/registry/definitions/routes-integrations.ts:30,39` | ⚠️ 2 rotas, 1 quebrada | ver §7.1 |
| Painel React de gestão | — | ❌ **não existe** | as 52 páginas do §10 são construção nova |

### 4.2. Backend

| Peça | Caminho | Estado |
|---|---|---|
| Endpoint de status | `api/status/bling.php` v3.2.0 (43 linhas) | ⚠️ **stub**: `$isConfigured = false` hardcoded → sempre `not_configured` |
| Módulo `api/bling/` | — | ❌ não existe |
| Client da API Bling | — | ❌ não existe |
| OAuth 2.0 / tokens | — | ❌ não existe |
| Webhooks | — | ❌ não existe |
| Filas / retry / DLQ | — | ❌ não existe |
| Rate limiting Bling | — | ❌ não existe |
| Location nginx `/api/bling` | `/etc/nginx/sites-enabled/dshowdash.com.br` | ❌ não existe (o do Pipedrive está na linha 300) |

### 4.3. Banco de dados

Varredura em **todos os bancos alcançáveis** com as credenciais do `.env`:

| Banco | Tabelas | Tabelas com "bling" |
|---|---|---|
| `DSHOWDASH` | 151 | **0** |
| `INTEGRACAO` | 101 | **0** |
| `DSHOW_PROD` | 159 | **0** |
| `PIPE_DSHOW` | 41 | **0** |
| **`BLING`** | **0** | **— banco existe e está VAZIO** |
| `MERCADOLIVRE` | 0 | vazio |
| `PIPEDRIVE` (antigo) | 0 | vazio |
| `ASAAS` | 0 | vazio |
| `DSHOW_ESTOQUE`, `DSHOW_FISCAL`, `DSHOW_COMPRAS`, `DSHOW_PRODUTOS`, `DSHOW_LOGISTICA`, `DSHOW_FINANCEIRO`, `DSHOW_INTEGRACOES` | 0 cada | **todos vazios** — shells nomeados por domínio, nunca populados |

> ⚠️ **Achado relevante:** existem ~40 bancos `DSHOW_*` criados por domínio de negócio e **todos vazios**. Não confundir com fonte de dados. O ERP real da empresa é `DSHOW_PROD`.

**Registros de navegação encontrados no `DSHOWDASH`:**

| Tabela | Registro | Observação |
|---|---|---|
| `app_nav_action` | id 31 `header:bling-link`, `kind='external'` | seed de 2025-12-14 |
| `app_nav_binding_revision` | id 31 → `effect='EXTERNAL_LINK'`, `params={"url":"https://www.bling.com.br"}` | ⚠️ **contradiz o §8.1**; o código atual **não** usa esse binding (navega interno) — divergência dado×código |
| `app_nav_destination` | id 4 `panel-04` "Bling"; id 32 `panel-integration-bling` "Bling" | dois destinos para o mesmo nome |
| `app_nav_route` | id 6 `bling` → `#/bling`; id 181 `dash/bling` | |
| `app_nav_route_resolution_active` | route 6 → rev 13 → destino **`panel-04`** | resolve para o painel de incidentes |
| `panel_registry` | id 4 `panel-04` "Tabela de Incidentes" (desc: "…(Bling)"); id 35 `panel-integration-bling` | |
| `app_user_trigger_permissions` | id 948: user 492 → `trigger:sidebar:bling` = allow | um único usuário liberado |
| `config/uarps_triggers.json` | `sidebar:bling`, `header:bling-link`, `panel-bling` | 3 triggers UARPS registrados |
| `app_permissions` | **`cap:bling:view` NÃO EXISTE** | a tabela tem 27 chaves, todas no formato `dominio.acao` — ver §7.2 |

### 4.4. Scripts, jobs, filas, logs

| Item | Estado |
|---|---|
| Script de sync Bling | ❌ não existe (`scripts/` só tem `pipedrive-sync.php`, koala, datatables) |
| Cron Bling | ❌ `crontab -l | grep -i bling` → vazio; `/etc/cron.d/` tem `pipedrive`, `datatables`, `koala-expire`, não `bling` |
| Logs Bling | ❌ `logs/` e `storage/logs/` não têm nenhum arquivo Bling |
| Scripts Python | ❌ só `tools/logger-migration.py` e `tools/add-module-id.py` — nada de integração |
| Locks | `storage/locks/` usado pelo Pipedrive; nada de Bling |

### 4.5. Dependências já instaladas (§68 — quase tudo já está lá)

O `package.json` **já contém** o essencial do briefing:

✅ `react@19.2.4`, `react-dom`, `typescript@5.9.3`, `vite@7.3.1`
✅ `echarts@6.1.0` (§53)
✅ `d3-sankey`, `d3-force`, `d3-hierarchy`, `d3-scale`, `d3-zoom`, `d3-drag`, `d3-geo`, `d3-chord`, `d3-shape`, `d3-array`, `d3-selection`, `d3-scale-chromatic` (§52 — **inclusive Sankey, exigido em §18 e §35**)
✅ `@tanstack/react-query` (§68), `@tanstack/react-table`, `@tanstack/react-virtual` (§51 alternativa)
✅ `lucide-react@1.25.0` (§58)
✅ `@floating-ui/react`, `clsx`, `react-grid-layout`, `topojson-client`

❌ **Ausentes:** `ag-grid` (§51 recomendação), `zustand`, `zod`, `react-hook-form`, `radix-ui`, `shadcn/ui`, `framer-motion`, `date-fns`.

---

## 5. Molde comprovado: como o Pipedrive resolveu isso

O módulo Pipedrive foi ao ar em 2026-07-21 e é o **padrão de referência**. Estrutura a replicar:

```
api/pipedrive/                          →  api/bling/
├── index.php          roteador PATH_INFO, 30 rotas, webhook ANTES do SessionGate
├── _init.php          requires + CorsPolicy + helpers de body/query + gate de acesso
├── lib/
│   ├── PipeCrypto.php          cifra credencial no banco
│   └── PipedriveClient.php     client HTTP + paginação + rate-limit
├── repositories/      Account, Sync, Queue, Metrics, Analytics, Health
├── services/          Auth, Sync, Queue, Reconcile
└── controllers/       Auth, Status, Sync, Query, Webhook, Metrics, Analytics, Health

public/components/panels/panel-pipedrive/  →  panel-bling/
├── index.js           adaptador vanilla; lê feature flag; injeta CSS escopado 1×; monta React
├── vite.config.ts     build próprio do painel
└── src/
    ├── entry.tsx, app/App.tsx
    ├── lib/api.ts, format.ts
    ├── screens/       (28 telas)
    ├── viz/           EChart.tsx, echarts-core.ts, ChartCard.tsx, tema.ts, opts.ts
    ├── shell/types.ts
    └── styles/tokens.css

nginx:  location ~ ^/api/bling(/.*)?$  →  api/bling/index.php  (PATH_INFO)
cron:   /etc/cron.d/bling  com flock por modo em storage/locks/
docs:   docs/BLING/  (este diretório)
```

**Padrões do repo que o Bling deve herdar:**
- Resposta HTTP via `ApiResponse::buildSuccess()` / `ApiResponse::error()`
- Cache via `RedisHelper::serveIfCached()` / `cacheAndReturn()`
- Sessão via `SessionGate::start()` + `AuthHelpers::requireCsrfForWrite()`
- Gate de acesso por **nível** (`AuthHelpers::requireAuth(50)`) — padrão atual
- Receptor de webhook **antes** do SessionGate (o Bling não tem sessão)
- Fila com backoff e dead-letter (molde: `pipe_sync_jobs` / `pipe_sync_errors`)
- Componentes React: **não existe biblioteca compartilhada** — cada painel tem os seus (ver §7.3)

---

## 6. Divergências entre o briefing e a realidade

| Briefing assume | Realidade encontrada | Impacto |
|---|---|---|
| §3.1 "investigar integrações/scripts/tabelas Bling existentes" | **Não existe nada.** Greenfield. | Fase 1 vira inventário de andaimes, não de migração |
| §5.3 "localizar tabelas, IDs externos, payloads" | Nenhuma tabela. Banco `BLING` vazio. | O DDL do §50 é criação, não migração |
| §5.4 "mapear watermark, última execução, falhas" | Nenhum script existe | Nada a mapear |
| §51 "biblioteca recomendada: **AG Grid**" | **Não instalado.** O repo usa `@tanstack/react-table` + `@tanstack/react-virtual` (listados como alternativa no próprio §51) | Decisão pendente — ver §8.1 |
| §68 stack: Zustand, Zod, RHF, Radix, shadcn, Framer Motion, date-fns | **Nenhum instalado.** Painéis atuais usam React state + TanStack Query | Decisão pendente — ver §8.2 |
| §68 "avaliar microfrontend se o shell não for React" | O shell **não é React**, mas o problema já está resolvido: adaptador vanilla monta React no `container-main` **sem iframe** | Sem ação — usar o molde existente |
| §8.1 "não redirecionar para o site externo" | O **código** já navega interno ✅, mas o **banco** tem binding `EXTERNAL_LINK → bling.com.br` | Limpar o binding legado |
| §9.1 "criar grupo *Gestão e ERP*" | A sidebar tem 3 seções fixas: `main`, `operacional`, `admin`. Bling já está em `operacional`. | Criar seção nova exige mexer em `SECTIONS` + `ui_nav_items` — avaliar custo/benefício |
| §13 "múltiplas contas e unidades" | Nada existe; o Pipedrive modelou 1 conta | Modelar multi-conta desde o DDL (barato agora, caro depois) |
| §61 "8 perfis de permissão (Diretoria, Comercial, Compras…)" | `app_permissions` tem **27 chaves** genéricas; nenhum perfil por área existe | Grande lacuna — ver §7.2 |
| Ícone da sidebar | Briefing §58 sugere Lucide `Package`/`Boxes` | Item atual usa `icon:'box'` do registry interno, não Lucide | Alinhar |

---

## 7. Problemas e bloqueadores encontrados

### 7.1. 🔴 CRÍTICO — A rota `/bling` aponta para o painel errado, em 3 lugares diferentes

Três fontes de verdade discordam sobre o que `#/bling` deve abrir:

| Fonte | Destino | O que é |
|---|---|---|
| `routes-integrations.ts:30` | `panel-08` | **Alertas Recentes** (`sync_job_alerts`) |
| `panel-paths.js:66` | `panel-04` | **Tabela de Incidentes** |
| `app_nav_route_resolution_active` (BD) | `panel-04` | **Tabela de Incidentes** |

Ou seja: **hoje, clicar em "Bling" na sidebar abre um painel de incidentes do sistema.** Nenhum dos três aponta para nada de Bling.

O botão do **header** está correto (`#/integrations/bling` → `panel-integration-bling`).

→ **Ação:** ao criar `panel-bling`, repontar as três fontes para ele, de forma coordenada. Precedente: o Pipedrive fez exatamente isso (`panel-paths.js:86` → `panel-pipedrive`).

### 7.2. 🔴 CRÍTICO — `cap:bling:view` não existe; o modelo de permissões do §61 não tem onde encostar

- A rota `/bling` exige `permissions: ['cap:bling:view']` com `guardPolicy: PERMISSIONS`.
- `app_permissions` tem **27 chaves**, todas no formato `dominio.acao` (`system.access`, `panels.view`, `datatables.view`…). **Nenhuma chave `cap:*` existe.**
- O `PermissionsArrayGuard` só bloqueia quando `context.permissionsMode !== 'allow-all'`; hoje o modo default é `allow-all`, então **o guard passa por bypass** e nada quebra — mas é uma bomba-relógio: no dia que o modo mudar, o Bling fica inacessível para todos.
- Os 8 perfis do §61 (Diretoria, Comercial, Compras, Financeiro, Fiscal, Logística, Somente leitura) **não têm nenhuma representação** no banco.

→ **Ação:** decidir entre (a) gate por nível `AuthHelpers::requireAuth(50)` como o Pipedrive fez, ou (b) criar o domínio `bling` em `app_permission_domains` + chaves `bling.*` em `app_permissions`. Recomendação em §8.3.

### 7.3. 🟠 ALTO — Não existe biblioteca de componentes React compartilhada

`DataGrid`, `PageHeader`, `MetricCard`, `EmptyState`, `ChartCard` vivem **dentro** de `panel-datatables/src/components` e foram **duplicados** em `panel-pipedrive/src`. O Bling seria a **terceira** cópia.

O briefing pede 52 páginas com grids, KPIs e gráficos — a duplicação sai cara. Esta é a mesma decisão pendente #2 do Pipedrive (`docs/PIPEDRIVE/README.md`), que na época foi resolvida por duplicação.

→ **Ação:** decisão do dono — ver §8.4.

### 7.4. ~~🟠 ALTO — Bug em `panel-integration-bling/index.ts:97`~~ → **FALSO POSITIVO** (re-medido em 2026-07-30)

> **Retificação (2026-07-30).** Este item estava errado. Medição direta no arquivo:
>
> ```
> index.ts:96  export const mount = (container: any, config: any) => {
>                const i = new IntegrationBlingComponent({ container, config }); ...
> index.js:173   const i = new IntegrationBlingComponent({ container, config });
> ```
>
> O `container: any` que aparece na linha é a **anotação de tipo do parâmetro** de `mount`, que é legítima. O construtor sempre recebeu `{ container, config }` — o valor certo. Não há `ReferenceError` possível, e o `.js` gerado confirma.
>
> A leitura original confundiu a assinatura da função com o argumento do construtor. **Nada foi alterado por conta deste item.**

**Lição registrada:** a auditoria de um arquivo denso, com muitas declarações numa linha só, precisa de leitura ancorada no trecho exato — não em citação reconstruída. O §7.8 abaixo, achado na mesma varredura, foi confirmado por resposta HTTP real antes de virar tarefa; este não foi.

### 7.5. 🟡 MÉDIO — Binding `EXTERNAL_LINK` legado no banco contradiz o §8.1

`app_nav_binding_revision` id 31 declara `effect='EXTERNAL_LINK'` para `https://www.bling.com.br`. O componente do header **ignora** esse binding e navega internamente, mas o dado sujo permanece e pode ser aplicado por qualquer consumidor do UARPS.

→ **Ação:** revisar/desativar o binding ao ativar o módulo.

### 7.6. 🟡 MÉDIO — Item da sidebar desligado no banco

`ui_nav_items.sidebar.bling` está com `is_visible=0` e `is_active=0`. O fallback estático (`items.manifest.ts`) mostra o item, o banco esconde. Comportamento depende de qual fonte vence em runtime.

→ **Ação:** ligar de forma consciente, junto com o repontamento da rota (§7.1).

### 7.7. 🟢 BAIXO — `api/status/bling.php` tem código morto

`$isConfigured = false;` seguido de `if ($isConfigured)` — o bloco `true` é inalcançável. Foi um placeholder deixado pela remoção do mock (comentário "P2.1 FIX"). Deve ser substituído por consulta real ao estado da credencial quando o módulo existir.

### 7.8. 🟠 ALTO — Envelope errado: o widget testa `j.success`, a API devolve `{ok}` (achado 2026-07-30, PROVADO AO VIVO)

> Achado da 2ª varredura (2026-07-30). **Não estava na 1ª rodada** e é mais grave que o §7.7, porque não é código morto: é código que roda, falha e não avisa.

`panel-integration-bling/index.ts:85` (e a linha equivalente do `.js` gerado):

```ts
const j = await r.json();
if (j.success && j.data) { ... this._updateDisplay(); }   // ← nunca entra
```

Mas `api/status/bling.php` monta a resposta com `ApiResponse::buildSuccess()`, que em `api/_helpers/ApiResponse.php:156-168` produz **`{ok, data, error}`** — nunca `success`.

Prova ao vivo (origin, contornando o Cloudflare):

```
$ curl -sk --resolve dshowdash.com.br:443:127.0.0.1 https://dshowdash.com.br/api/status/bling.php
{"ok":true,"data":{"status":"not_configured","configured":false,
 "message":"Integracao Bling nao configurada","integration":"bling",
 "timestamp":"2026-07-30 03:34:29"},"error":null}
HTTP 200
```

Consequência: o fetch retorna **200**, o `catch` não dispara, `_metrics.errorCount` fica em 0 — e o display fica preso em `--` para sempre. A falha se apresenta como sucesso. É exatamente o padrão que travou a telemetria por 15 dias (`telemetria-csrf-e-bundles-core-circulares`) e que hoje prende **17 painéis** em placeholder (`ts-expect-error-mascarou-bug-runtime`).

→ **Ação:** trocar `j.success` por `j.ok` no `.ts` **e** regerar o `.js` (o `.js` é o arquivo servido — corrigir só o `.ts` não muda nada em produção). Corrigir junto com o §7.4, que está no mesmo arquivo. **O novo módulo Bling deve nascer lendo `{ok}`** — o envelope do projeto é `{ok, data, error}`, nunca `{success}`.

---

## 8. Decisões que dependem de você (bloqueiam o design, não a investigação)

### 8.1. Data grid: AG Grid (§51 recomendação) ou TanStack Table (padrão da casa)?

| | AG Grid | TanStack Table + Virtual |
|---|---|---|
| Briefing | recomendação principal §51 | listado como alternativa §51 |
| Já instalado | ❌ não | ✅ sim, e em uso em 2 painéis |
| Pivot, agrupamento nativo, column menu | ✅ nativo | ⚠️ manual |
| Licença | Enterprise é paga (pivot/agrupamento estão no Enterprise) | MIT |
| Consistência visual com o resto do Dash | ⚠️ novo look | ✅ já alinhado |

**Recomendação:** TanStack Table + TanStack Virtual, salvo se você quiser pagar a licença Enterprise do AG Grid pelos recursos de pivot/agrupamento do §51.

### 8.2. Stack complementar: adotar Zustand/Zod/RHF/Radix (§68) ou seguir o padrão atual?

O padrão atual dos painéis React é: React state local + TanStack Query, sem store global, sem validação de schema. Adotar 6 libs novas por causa do Bling cria divergência com os outros painéis.

**Recomendação:** adotar **apenas `zod`** (validação das respostas da API do Bling é genuinamente valiosa dado que a API muda com frequência — §49) e dispensar o resto nesta fase.

### 8.3. RBAC: nível (`requireAuth(50)`) ou chaves `bling.*`?

O §61 pede 8 perfis por área. Nenhum existe. Criar 8 perfis × ~6 ações = ~48 chaves novas é um projeto em si.

**Recomendação:** **fase 1** com gate por nível (igual ao Pipedrive, entrega rápida e segura); **fase 6** (operações de escrita) com chaves `bling.*` granulares, quando houver o que proteger de verdade.

### 8.4. Componentes React: extrair pacote compartilhado ou triplicar?

**Recomendação:** extrair `public/components/panels/_shared-react/` agora. O Bling tem 52 páginas — é o momento em que a duplicação deixa de compensar. Custo estimado: 1 dia. Alternativa: duplicar e pagar juros.

### 8.5. Credencial: OAuth 2.0 completo ou token inserido pela app?

O Bling v3 usa **OAuth 2.0 obrigatoriamente** (client_id/client_secret + authorization_code + refresh_token), diferente do Pipedrive que aceitava API token simples. Isso significa que o `AuthService` do Bling é **mais complexo** que o do Pipedrive: precisa de callback público, storage de `state`, e renovação automática de token.

**Precisa de você:** cadastrar o aplicativo no painel de desenvolvedor do Bling e informar `client_id`, `client_secret` e a URL de callback a registrar.

### 8.6. Escopo da primeira entrega

O §10 lista **52 páginas**. Entregar as 52 com mocks antes de qualquer dado real é meses de trabalho jogado numa aposta.

**Recomendação:** primeira entrega = shell + sub-sidebar + **6 páginas** (Visão Geral, Pedidos de Venda, Produtos, Estoque, Notas Fiscais, Sincronização), com o `MockBlingService` do §48 já implementando a interface completa. As outras 46 entram depois que a integração real provar o modelo de dados.

---

## 9. Oportunidades de reaproveitamento (o que NÃO precisa ser feito do zero)

| Peça | Reaproveitar de | Economia |
|---|---|---|
| Roteador PATH_INFO do backend | `api/pipedrive/index.php` | alta |
| Bootstrap `_init.php` (CORS, body, query, gate) | `api/pipedrive/_init.php` | alta |
| Cifra de credencial | `api/pipedrive/lib/PipeCrypto.php` | alta |
| Fila + backoff + dead-letter | `api/pipedrive/services/QueueService.php` | **muito alta** |
| Reconciliação periódica | `api/pipedrive/services/ReconcileService.php` | alta |
| Adaptador vanilla→React sem iframe | `panel-pipedrive/index.js` | **muito alta** |
| Wrapper ECharts + tema + opts | `panel-pipedrive/src/viz/` | alta |
| Tokens CSS do painel | `panel-pipedrive/src/styles/tokens.css` | média |
| Padrão de cron com flock | `/etc/cron.d/pipedrive` | alta |
| Location nginx PATH_INFO | `/etc/nginx/sites-enabled/dshowdash.com.br:300` | alta |
| Estrutura de docs por fases | `docs/PIPEDRIVE/` | alta |
| Ícone e botão do header Bling | já existem, funcionais | total |
| Banco `BLING` | já criado, vazio, pronto para o DDL | total |

---

## 10. Riscos

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Limite de requisições da API do Bling por conta (§44) estoura na carga inicial | alta | alto | fila com orçamento, backoff, carga inicial paginada e noturna |
| R2 | OAuth exige callback público + app cadastrado; sem isso nada funciona | alta | bloqueante | resolver §8.5 **antes** da Fase 4 |
| R3 | Breaking changes na API do Bling (§30 menciona changelog ativo) | média | alto | Version Adapter do §49 obrigatório, não opcional |
| R4 | 52 páginas com mocks viram trabalho perdido se o modelo real divergir | alta | alto | §8.6 — entregar 6 páginas primeiro |
| R5 | Triplicação de componentes React | alta | médio | §8.4 |
| R6 | Repontar `/bling` quebra quem usa o painel de incidentes por esse atalho | baixa | médio | verificar analytics de uso antes; manter `#/incidentes` como rota canônica do panel-04 |
| R7 | `permissionsMode` sair de `allow-all` e travar o módulo (§7.2) | baixa | alto | criar as permissões corretamente na Fase 1 |
| R8 | `vite build` rodado como root deixa `dist/` inservível para www-data | média | médio | `chown www-data:www-data dist` pós-build (mesmo risco já documentado no Pipedrive) |
| R9 | Dados fiscais e pessoais (§62 LGPD) trafegando sem mascaramento | média | alto | mascaramento no repositório, não no front |

---

## 11. Lacunas do briefing que precisam ser fechadas no design

1. **§13 multi-conta**: quantas contas Bling a Dshow tem? Matriz + filiais? Isso muda o DDL (chave `account_id` em todas as tabelas) e é caro de retrofitar.
2. **§26 custos e margem**: o Bling não expõe composição contábil completa. O briefing já reconhece isso ("identificar como estimativas") — precisa ficar explícito na UI.
3. **§36 conciliação bancária**: exige fonte bancária além do Bling. Existe? Asaas (banco `ASAAS` vazio) sugere que foi cogitado.
4. **§38 canais de venda**: o `DSHOW_PROD` tem `Produtos_Mercado_Livre` (160 linhas) — há um vínculo ML pré-existente a considerar no cruzamento.
5. **§45 automações com escrita**: escopo perigoso. Deve ficar 100% fora das Fases 1–5.

---

## 12. Proposta de arquitetura futura (resumo — detalhamento em `01-arquitetura.md`)

```
   Bling API v3 (REST, OAuth 2.0)
            │
   ┌────────▼─────────┐
   │ BlingApiClient   │  HTTP, retry, backoff, orçamento de requisições
   ├──────────────────┤
   │ VersionAdapter   │  isola breaking changes da API (§49)
   ├──────────────────┤
   │ Normalizer       │  situações, enums, moeda, datas → modelo interno
   ├──────────────────┤
   │ Repositories     │  persistência em BLING (bling_*), idempotente, com hash
   └────────┬─────────┘
            │
   ┌────────▼─────────┐        ┌──────────────────┐
   │ api/bling/       │◄───────│ scripts/bling-   │  cron: drain-queue 1min,
   │ index.php        │        │ sync.php         │  incremental 15min,
   │ (PATH_INFO)      │        └──────────────────┘  reconcile diário
   └────────┬─────────┘
            │  ApiResponse + RedisHelper
   ┌────────▼─────────────────────────────────────┐
   │ panel-bling (React 19)                       │
   │  sub-sidebar 240/72px · header interno       │
   │  TanStack Query · ECharts · D3 Sankey        │
   │  BlingService (interface §48)                │
   │    ├─ MockBlingService   (fase 2)            │
   │    └─ ApiBlingService    (fase 5)            │
   └──────────────────────────────────────────────┘

   Webhook Bling ──► POST /api/bling/webhook (antes do SessionGate)
                     → valida → registra → 200 rápido → fila → processa
```

Banco `BLING` (já existe, vazio) recebe as ~34 tabelas do §50, com os campos comuns obrigatórios: `id`, `bling_id`, `account_id`, `business_unit_id`, `situacao`, `payload_json`, `payload_hash`, `api_version`, `created_at_external`, `updated_at_external`, `synced_at`, `deleted_at`, `origem`.

---

## 13. O que fazer a seguir

Este relatório fecha a **Fase 1 (Auditoria)** do §69 e libera o desenho. Ordem sugerida:

1. **Você decide** os 6 pontos do §8 (principalmente 8.5 — OAuth — que é bloqueante para a Fase 4).
2. Eu escrevo `01-arquitetura.md`, `02-banco-BLING.sql` (DDL revisável, **não aplicado**), `03-sincronizacao-e-filas.md`, `04-endpoints-api-v3.md`, `05-plano-fases.md`.
3. Só então começa código.

**Correções pontuais que posso fazer em paralelo, sem depender de decisão** (todas com backup em `/backup/` conforme PNR):
- `panel-integration-bling/index.ts:97` — o `container: any` (§7.4)
- Auditar o mesmo bug nos demais `panel-integration-*`

---

*Relatório produzido em 2026-07-29. Verificações executadas: `find`/`grep` no repo, `SHOW DATABASES`/`SHOW TABLES`/`information_schema` em 7 bancos, `crontab -l`, `/etc/cron.d/`, `/etc/nginx/sites-enabled/`, leitura de `.env` (chaves, sem valores), inspeção de `app_nav_*`, `app_permissions`, `app_feature_flags`, `ui_nav_items`, `panel_registry`.*
