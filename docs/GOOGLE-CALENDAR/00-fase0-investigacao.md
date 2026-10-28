# 00 — Fase 0: Investigação (relatório)

> Módulo **Google Calendar** · Briefing-fonte: `docs/BRF_CALENDAR.md` (2.807 linhas, salvo 2026-07-29 19:45)
> Levantamento **só-leitura** executado em 2026-07-29. Nenhum arquivo de aplicação foi alterado.
> Atende §4 (investigação obrigatória), §5 (entregável) e §83 (critérios de aceite da investigação) do briefing.

---

## 1. Veredito em uma linha

Existe **andaime de entrada** para "Calendário" (botão no header → rota → painel → endpoint), mas ele termina num
**stub que sempre responde `not_configured`**. Não há projeto Google Cloud, OAuth, escopos, tokens, tabelas nem
sincronização. **≈97% do briefing é greenfield.** Em compensação, a **biblioteca de calendário já está instalada e
em produção** (FullCalendar 6.1.21, usado na tela Agenda do Pipedrive), e o padrão de módulo mock-first
(Outlook/Ads) mais o padrão de sync real (Pipedrive) dão molde pronto para as fases 2 e 4-5.

---

## 2. O que JÁ existe (cadeia completa, ponta a ponta)

A cadeia abaixo **está viva hoje** e foi percorrida arquivo a arquivo:

| # | Camada | Artefato | Estado |
|---|--------|----------|--------|
| 1 | Header | `public/components/header/components/panel-calendar/` (`index.js` servido, `index.ts` fonte) | **Ativo.** Botão renderiza `<button class="header-panel-trigger panel-calendar-trigger">` com ícone `/assets/icons/system/header/calendar.svg` e `data-uarps-trigger="trigger:header:open-panel-calendar"` |
| 2 | Manifesto do header | `public/components/header/components/manifest.json:46` | `"panel-calendar": { version 8.1.0, status: "active", rendersInContainer: true }` |
| 3 | Rota | `public/components/router/registry/definitions/routes-integrations.js:16` | `"/integrations/calendar" → panel-integration-calendar`, tags `["calendar","google"]` |
| 4 | Painel | `public/components/panels/panel-integration-calendar/` (48 arquivos, 316 KB) | **Andaime genérico**, não módulo |
| 5 | Endpoint | `api/status/calendar.php` (47 linhas) | **Stub**: `$isConfigured = false;` hardcoded → sempre `not_configured` |

### 2.1. O painel existente não é um calendário

`panel-integration-calendar/index.ts:145` renderiza **uma única linha**:

```
<span class="integration-icon">📅</span><span class="integration-label">Calendar</span>
<span class="integration-value" data-metric="events">--</span><span class="integration-indicator">
```

É um **chip de status**, não uma tela. Os 48 arquivos são o boilerplate padrão do gerador de andaimes — a prova é
que `panel-integration-google-drive`, `panel-integration-chatgpt` e `panel-integration-asaas` têm **exatamente 48
arquivos cada**, mesma árvore (`accessibility/ api/ core/ state/ telemetry/ ui/ utils/`). Não há lógica de negócio
de calendário em nenhum deles.

`CONFIG` aponta para `/api/status/calendar.php` com `refreshInterval: 120000`.

### 2.2. FullCalendar já está instalado e em produção — este é o maior reúso disponível

`package.json` **raiz** (⚠️ as deps de todos os painéis React vivem na raiz, não por painel):

```
"@fullcalendar/core": "^6.1.21",  "@fullcalendar/react": "^6.1.21",
"@fullcalendar/daygrid": "^6.1.21", "@fullcalendar/timegrid": "^6.1.21"
```

Consumidor real: `public/components/panels/panel-pipedrive/src/screens/Agenda.tsx` (105 linhas) — já resolve, **em
produção**, quatro dos problemas que o briefing pede nas §13/§14:

- locale `pt-br` importado de `@fullcalendar/core/locales/pt-br`;
- `datesSet` → refetch só da **janela visível** (não carrega histórico inteiro — atende §77);
- carga por paginação com **teto explícito** (`TETO = 3000`) e aviso de truncamento na UI (atende §72 "sem cap silencioso");
- `React.lazy` — o FullCalendar só é baixado por quem abre a agenda.

**Não há `@fullcalendar/interaction`** instalado → drag-and-drop e resize (§14, §60) exigem adicionar esse plugin.
`@fullcalendar/list` e `@fullcalendar/resource-*` também ausentes (§13 lista/recursos). Os plugins `resource-*` são
**licença comercial (Premium)** — decisão do dono antes da Fase 3.

### 2.3. Stack instalada × stack pedida no §81

| Pedido no §81 | Instalado? | Observação |
|---|---|---|
| React 19 + TypeScript | ✅ | `react ^19.2.4`, `typescript ^5.9.3` |
| FullCalendar | ✅ | 6.1.21 (faltam plugins interaction/list) |
| D3.js | ✅ | modular: `d3-array/scale/shape/selection/zoom/drag/force/hierarchy/sankey/chord/geo` |
| Apache ECharts | ✅ | `echarts ^6.1.0` |
| TanStack Query | ✅ | `^5.101.3` |
| TanStack Virtual | ✅ | `^3.14.7` |
| Lucide Icons | ✅ | `lucide-react ^1.25.0` |
| **AG Grid** | ❌ | projeto usa `@tanstack/react-table ^8.21.3`; o DataGrid v2 do `panel-datatables` já é o padrão da casa |
| **Zustand** | ❌ | painéis React usam estado local + TanStack Query |
| **React Hook Form + Zod** | ❌ | formulários hoje são controlados à mão |
| **Radix UI / shadcn** | ❌ | há `@floating-ui/react ^0.27.20` para popover/tooltip |
| **date-fns / Luxon** | ❌ | **nenhuma lib de data instalada** — ver §4.1, é o risco nº 1 |
| **Framer Motion** | ❌ | animações são CSS |
| **SDK oficial do Google (backend)** | ❌ | **não há `composer.json` nem `vendor/` no servidor** |

### 2.4. Roteamento: existe caminho seguro e existe armadilha

- `#/panel-X` resolve por `public/components/main/adapters/panel-loader/panel-paths.js` — **ao vivo**, e com
  **fallback por convenção**: `resolvePanelPath()` cai em `` `/components/panels/${panelId}/index.js` `` quando o id
  casa `^panel-(.+)$`. É assim que `panel-outlook`, `panel-datatables` e `panel-transito-sp` funcionam **sem
  aparecer no mapa**. → **Criar `panel-google-calendar` não exige tocar em `panel-paths`.**
- `#/integrations/*` resolve pelo `routes-integrations.js`, que está **bundleado** em `app-router.bundle.js` e
  `main.bundle.js`. Mexer ali obriga rebuild de bundles de boot — proibido pela lição registrada.

**Drift medido** entre fonte e servido:

```
panel-paths.js  → 196 linhas, root:root,      mtime 2026-07-28 05:40   (SERVIDO)
panel-paths.ts  → 239 linhas, www-data,       mtime 2026-03-23 10:52   (STALE há 4 meses)
chaves só no .js: "adwords", "panel-ads"
```

O `.js` foi editado à mão quando o módulo Ads entrou; o `.ts` nunca acompanhou. **O `.ts` não é a fonte da verdade
de roteamento.** (Relacionado ao passivo já conhecido de `.js` órfão / política TypeScript.)

### 2.5. Navegação: a fonte real é `ui_nav_items`

Duas tabelas competem e é fácil errar:

| Tabela | Linhas | Papel real |
|---|---|---|
| `DSHOWDASH.sidebar_items` | 29 | **Legada.** Não contém Outlook, Ads, DataTables, Transito. Aponta `google-ads → panel-integration-adwords`, painel que **não existe** |
| `DSHOWDASH.ui_nav_items` | 210 | **Fonte viva.** Contém todos os módulos novos |

Grupo onde os módulos integrados realmente moram — `sidebar.grp-favoritos`:

```
 3  sidebar.koala-docs      #/koala                  koala-docs
 4  sidebar.transito        #/panel-transito-sp      panel-transito-sp
 5  sidebar.datatables      #/panel-datatables       panel-datatables
 6  sidebar.outlook         #/panel-outlook          panel-outlook
 7  sidebar.ads             #/panel-ads              panel-ads
 8  sidebar.metaads         #/panel-metaads          panel-metaads
 9  sidebar.anuncios        #/panel-anuncios         panel-anuncios
10  sidebar.pipedrive       #/panel-pipedrive        panel-pipedrive   (min_level 50)
11  sidebar.avatar-studio   #/panel-avatar-studio    panel-avatar-studio
```

→ O slot natural do Google Calendar é **`order_index = 12` em `sidebar.grp-favoritos`**, uma linha nova, sem
renumerar ninguém. Ver divergência §5.2 sobre o grupo "Comunicação e Produtividade" pedido no §7.1.

**Header não é DB-driven**: `SELECT ... WHERE display_context LIKE '%header%'` em `ui_nav_items` retorna **0 linhas**.
O botão do header é código (§2 item 1).

### 2.6. Molde de módulo React dentro do shell

`panel-outlook/index.js` (169 linhas) é o adaptador vanilla que o PanelPort importa e que monta React **dentro do
container-main, sem iframe**. Ele espelha `panel-pipedrive/index.js`. Padrão a copiar integralmente:

- lê o manifest do build com `cache:'no-store'` (fonte da verdade do entry hasheado);
- injeta o CSS do módulo **uma vez** e nunca remove — escopado ao root `[data-ol-react-root]` com tokens `--ol-*`;
- consulta feature flag antes de montar: `/api/feature-flags/?action=check&flag=panel_outlook_enabled`, com timeout
  de 4 s e fallback para `{ react_routes: ['*'] }`.

⚠️ A flag `panel_outlook_enabled` **não existe** em `app_feature_flags` (15 linhas, listadas; só
`panel_datatables_react_enabled` segue esse padrão) — o Outlook vive de fallback. Para o Calendar, criar a flag
`panel_google_calendar_enabled` de verdade.

### 2.7. Molde de OAuth + cifra (backend) — pronto e reaproveitável

`api/outlook/lib/GraphOAuth.php` (231 linhas) implementa **Authorization Code + PKCE S256** à mão sobre cURL:
`newCodeVerifier()`, `codeChallenge()`, `authorizeUrl(state, challenge)`, `exchangeCode(code, verifier)`,
`refresh(refreshToken)`. `state` e `verifier` são persistidos por `repositories/OAuthStateRepository.php`.

`api/outlook/lib/OutlookCrypto.php` (145 linhas): **AES-256-GCM** (`openssl_encrypt`, tag 16 bytes), chave de
`OUTLOOK_CRYPTO_KEY`, mais `mask()`, `last4()` e **`scrub(array $row)`** — utilitário que remove segredos antes de
logar. Atende §75.2/§78 sem reescrever nada. `api/ads/lib/AdsCrypto.php` é o mesmo padrão.

Extensões PHP disponíveis: `openssl`, `curl`, `sodium`, `mbstring`, `json`. PHP 8.3.6, nginx + php8.3-fpm.

### 2.8. Molde de sincronização real: só o Pipedrive tem

`PIPE_DSHOW` (41 tabelas) é o **único** módulo com persistência de verdade. As tabelas que interessam como molde
direto para §49-§51:

```
pipe_sync_cursors     9      ← equivale ao sync_token do Google
pipe_sync_runs     7.641     ← histórico de execuções
pipe_sync_jobs     3.597     ← fila
pipe_sync_errors       0
pipe_webhook_events 4.260    ← equivale ao watch channel do Google
pipe_api_requests  9.941     ← rate limiting / observabilidade
pipe_entity_links      0     ← equivale a google_calendar_event_links (§57)
```

Documentação de referência já escrita: `docs/PIPEDRIVE/03-sincronizacao-e-filas.md`, `02-banco-PIPE_DSHOW.sql`.
Script: `scripts/pipedrive-sync.php`. Infra de jobs existente em `/opt/dshow_secure/jobs/`
(`job_supervisor.php`, `retry_failed_jobs.php`, `auto_recovery.php`, todos em cron `*/15`–`*/30`).

### 2.9. Outros pontos de entrada exigidos pelo §6

| Ponto | Onde | Estado |
|---|---|---|
| Widget na home (§36) | `panel-dashboard/src/app/App.tsx` | React, **usa `react-grid-layout`** → o widget de agenda entra como item do grid. Componentes-vizinhos: `Clima.tsx`, `Hero.tsx`, `GChart.tsx` |
| Busca global / Ctrl+K (§42) | `public/components/sidebar/features/command-palette.js` | Exporta **`registerCommand`** — é aqui que se registram os comandos, e não numa paleta nova |
| Notificações (§26.1) | `DSHOWDASH.app_notifications` (580) + `app_notification_rules` (0) + `api/notifications/`, `api/notification-rules/` | Existe, regras vazias |
| Permissões (§74) | `app_permission_domains` (12) × `app_permission_actions` (10) | Precisa **novo domínio `calendar`**; o mais recente foi `datatables` (id 12, 2026-07-20) — há precedente exato |
| Auditoria (§76) | `app_audit_log`, `app_audit_trail`, `app_uarps_audit_log` (1.528) | Existe |

---

## 3. O que NÃO existe (confirmado por busca exaustiva)

**Zero ocorrências reais** de "google calendar" / "gcal" no repositório. A varredura acusou 6 arquivos, todos
**falsos positivos**: `gCalculationService` (15×), `gCallback` (12×), `gCalls` (6×).

| Item do briefing | Situação |
|---|---|
| Projeto Google Cloud, Client ID, redirect URI | **Não existe.** Único par OAuth do Google no `.env` é `GOOGLE_ADS_OAUTH_CLIENT_ID` / `_SECRET`, **ambos vazios** |
| Calendar API habilitada / escopos concedidos | **Não existe.** Nenhum escopo Google documentado em lugar nenhum |
| Login com Google / SSO / Workspace | **Não existe.** `api/auth/` é login local (`login.php`, `refresh.php`, cookie `DSHOWSESS`, CSRF) — nenhuma menção a google/oauth/sso |
| Service account | **Não existe** |
| Tokens armazenados | **Não existe** |
| Tabelas de calendário/evento/participante/token | **Zero.** Consulta em `information_schema` por `calendar|calend|agenda|event|google|oauth|token|attendee|meeting|schedul` retornou, fora `performance_schema`, apenas: `app_color_tokens_*`, `app_telemetry_events`, `app_user_security_events`, `pipe_alert_events`, `pipe_report_schedules`, `pipe_webhook_events` — **nenhuma pertinente** |
| Banco do módulo | Schemas existentes: `DSHOWDASH` (151), `PIPE_DSHOW` (41), `DSHOW_MEDIA` (5), `DSHOWDASH_HOME` (2). **`OUTLOOK_DSHOW` e `ADS_DSHOW` nem sequer foram criados** — Outlook e Ads são mock puro, sem uma linha persistida |
| Jobs/webhooks de calendário | **Não existe** |
| SDK Google PHP | **Não existe** — sem `composer.json`, sem `vendor/` em todo o servidor |
| date-fns / Luxon / Temporal | **Não instalados** |

---

## 4. Riscos e achados (com prova)

### 4.1. 🔴 CRÍTICO — MySQL não sabe converter fuso por nome

As tabelas de timezone do MySQL **não estão populadas**:

```sql
SELECT COUNT(*) FROM mysql.time_zone_name;              →  0
SELECT @@global.time_zone, @@session.time_zone;         →  SYSTEM, SYSTEM
SELECT CONVERT_TZ('2026-07-29 12:00:00','UTC','America/Sao_Paulo');  →  NULL
SELECT CONVERT_TZ('2026-07-29 12:00:00','+00:00','-03:00');          →  2026-07-29 09:00:00
```

**Por que isto é grave num módulo de agenda e não foi grave até hoje:** `CONVERT_TZ` por nome não dá erro — devolve
`NULL`. Num `WHERE` de janela de agenda, `NULL` **não é falso ruidoso, é evento sumido da grade**. O usuário vê uma
agenda mais vazia do que a real e não há nada no log. Os módulos atuais não tropeçaram nisso porque nenhum
converte fuso; um calendário converte o tempo todo.

O contorno por offset numérico (`'-03:00'`) funciona, mas **é cego a horário de verão** — o que colide direto com
§47.1 ("horário de verão") e §47.2 (exibição dupla São Paulo × Shenzhen).

**Encaminhamento (decisão do dono/DBA):** ou popular as tabelas (`mysql_tzinfo_to_sql`, exige acesso administrativo
ao MySQL) ou **fazer toda conversão de fuso em PHP/JS e nunca em SQL** — gravando sempre UTC no banco e convertendo
na borda. A segunda opção é a que não depende de ninguém e é a recomendada.

Complemento: PHP está fixado em `date.timezone = America/Sao_Paulo` — o §47.1 pede explicitamente "evitar valores
fixos de São Paulo na lógica", então o fuso precisa vir do usuário/calendário, nunca do default do processo.

### 4.2. 🔴 CRÍTICO — herdado — a aplicação conecta no MySQL como `root`

`DB_DSHOWDASH_USER=root`, com `ALL PRIVILEGES *.*`. Um módulo de calendário **amplia a superfície**: passa a
receber input externo (títulos, descrições, e-mails de participantes vindos do Google) e a fazer escrita. Qualquer
injeção num endpoint novo vira comprometimento total do servidor. Já registrado como pendência do dono/DBA; **entra
como pré-requisito da Fase 4**, não da Fase 2 (mock não escreve no banco).

### 4.3. 🟠 O botão do header aponta para a rota da armadilha

Hoje: header → `#/integrations/calendar` → registry **bundleado**. Se o módulo novo virar `panel-google-calendar`,
repontar o botão para `#/panel-google-calendar` é **uma linha em `panel-calendar/index.js`** (`PANEL_CONFIG.route`)
e **não exige rebuild de bundle** — a rota `#/panel-*` resolve pelo `panel-paths.js` ao vivo. Fazer o contrário
(cadastrar no `routes-integrations.js`) obrigaria a rebuildar `app-router.bundle.js` e `main.bundle.js`, que estão
na lista de bundles de boot que não se rebuilda.

⚠️ Editar `index.js` no header exige refazer owner/ACL depois
(`chown www-data:www-data`, `chmod 640`, `setfacl -m u:agent_0{1,2,3}:rwx`).

### 4.4. 🟠 Editar arquivos em `api/` derruba a ACL e devolve 500 no módulo inteiro

Já aconteceu duas vezes (Pipedrive, Ads). Vale para **todo** arquivo novo em `api/google-calendar/`.

### 4.5. 🟠 `api/` está no `.gitignore`

Todo o backend do módulo novo ficará **fora do versionamento**. Backup manual em `/backup/` antes de cada etapa é
obrigatório (regra do projeto), e é a única rede de proteção que existe para essa árvore.

### 4.6. 🟡 Plugins FullCalendar de recursos são pagos

`@fullcalendar/resource-timegrid` / `resource-timeline`, exigidos pelo §13 ("recursos", "linha do tempo", "equipe")
e §29 (salas/veículos/equipamentos), são **FullCalendar Premium (licença comercial)**. Alternativas: construir a
visão de recursos em D3 (já instalado, e o §39/§65 já pedem D3 para heatmap e rede) ou adquirir a licença.
**Decisão do dono antes da Fase 3.**

### 4.7. 🟡 Três sessões Claude ativas neste servidor

`ps aux | grep -c "[c]laude"` → **3**. Nenhum arquivo do projeto foi tocado nos últimos 30 min, então esta
investigação seguiu. Antes de **escrever** código nas fases seguintes, repetir a checagem — duas sessões já pegaram
a mesma fase do Pipedrive e quase se sobrescreveram.

---

## 5. Divergências entre o briefing e a realidade (para o plano não herdar suposição falsa)

### 5.1. "Seguir o mesmo padrão do Google Analytics, Meta Ads, Bling, E-commerce" (§1)

Desses, o que existe de fato: **Pipedrive** (18 telas, LIVE, com banco), **Outlook** (6 abas, mock), **Ads** (22
telas, mock), **Meta Ads** e **Mercado Livre** (painéis presentes). **Google Analytics não existe como módulo** —
`BRF_ANALYTICS.md` é briefing, e `panel-analytics` não tem par de backend. Não há "padrão E-commerce". O padrão real
a espelhar é **Outlook/Ads para a Fase 2 (mock) e Pipedrive para as Fases 4-5 (real)**.

### 5.2. Grupo "Comunicação e Produtividade" na sidebar (§7.1)

O briefing sugere criar esse grupo com Outlook + Google Calendar. A realidade é que **todos** os módulos integrados
vivem em `sidebar.grp-favoritos` (Outlook, Ads, Meta Ads, Pipedrive, DataTables, Trânsito…). Criar o grupo novo
implica **mover o Outlook para fora de Favoritos** — mudança visível na navegação de todos os usuários, que o §7.1
pede para "avaliar sem prejudicar a organização atual".

**Recomendação:** Fase 2 entra em `grp-favoritos` `order_index 12` (custo zero, reversível por `UPDATE`). A
reorganização em grupo próprio fica como item separado de aceite do dono, junto do Outlook.

### 5.3. "SDK oficial do Google no backend" (§81)

Não há composer no projeto. As duas saídas: (a) REST + cURL à mão, exatamente como `GraphOAuth.php` faz hoje com a
Microsoft — consistente, zero infra nova; (b) introduzir composer + `google/apiclient`, o que traz autoloader,
`vendor/` e uma superfície de dependências que o projeto nunca teve. **Recomendação: (a)**, pelo mesmo motivo que o
Outlook foi feito assim.

### 5.4. "AG Grid" (§81)

O padrão da casa é `@tanstack/react-table` + o DataGrid v2 do `panel-datatables`, que já entrega virtualização,
colunas fixadas, agrupamento, views salvas e densidade — quase toda a lista do §41.2. Introduzir AG Grid
(licenciamento próprio para os recursos enterprise pedidos) duplicaria o componente de grade do produto.
**Recomendação: reusar o DataGrid v2.**

### 5.5. Sobre eventos "Foco / Fora do escritório / Local de trabalho" (§25)

O próprio briefing já ressalva a dependência de conta. Vale registrar explicitamente: `focusTime`, `outOfOffice` e
`workingLocation` **só existem no calendário primário** e, em parte, apenas para contas Workspace — não são criáveis
em calendário secundário nem em conta pessoal gratuita. Planejar a UI para **degradar** (mostrar como bloqueio
comum) em vez de assumir suporte.

---

## 6. Arquitetura proposta

### 6.1. Front-end

```
public/components/panels/panel-google-calendar/
  index.js                    ← adaptador vanilla (cópia estrutural de panel-outlook/index.js)
  vite.config.ts  tsconfig.json
  src/
    entry.tsx
    app/App.tsx               ← TelaId + TELAS (fonte da verdade das telas, como no Pipedrive)
    shell/                    ← sub-sidebar 240/72 px, header interno, tipos
    screens/                  ← Hoje · Visão Geral · Agenda(dia/semana/mês/lista) · Disponibilidade
                                 Conflitos · Convites · Calendários · Recursos · Equipe
                                 Relatórios · Sincronização · Contas · Configurações
    lib/api.ts                ← apiGet/apiPost com CSRF (padrão do panel-pipedrive)
    services/
      types.ts                ← contrato GoogleCalendarService (§52), 1:1 com o briefing
      mock.ts                 ← MockGoogleCalendarService
      api.ts                  ← ApiGoogleCalendarService
    styles/                   ← tokens --gc-*, escopado a [data-gc-react-root]
```

- Rota: `#/panel-google-calendar` (fallback por convenção — **não tocar em `panel-paths`**).
- Sidebar: `INSERT` em `ui_nav_items` (`sidebar.google-calendar`, parent `sidebar.grp-favoritos`, order 12).
- Header: `PANEL_CONFIG.route` de `panel-calendar/index.js` repontado (1 linha) + estados do ícone (§8.3).
- Ctrl+K: `registerCommand` na paleta da **sidebar** (a de `container-main` não está montada — red herring).
- Home: widget novo no grid `react-grid-layout` do `panel-dashboard`.
- Persistência de UI: `dshow.google-calendar.sidebar.collapsed` (§11.3).
- **Fuso: toda conversão em JS na borda; banco só UTC.** Sem lib de data instalada, a escolha entre `Intl` nativo
  (zero dependência, suficiente para `timeZone` + `DateTimeFormat`) e adicionar `date-fns-tz`/Luxon é decisão da
  Fase 2 — recomendo `Intl` nativo + helpers próprios, para não engordar o bundle raiz compartilhado.

### 6.2. Backend

```
api/google-calendar/
  index.php  _init.php        ← switch GCAL_PROVIDER=mock|google (padrão ads_is_mock())
  lib/  GcalCrypto.php        ← AES-256-GCM + mask/last4/scrub  (cópia de OutlookCrypto)
        GoogleOAuth.php       ← Auth Code + PKCE S256 sobre cURL (molde GraphOAuth)
        GoogleCalendarClient.php
        GcalMock.php
        Normalizer.php
  controllers/ AuthController StatusController CalendarController EventController
               FreeBusyController InvitationController ConflictController
               SyncController WebhookController
  repositories/ AccountRepository OAuthStateRepository EventRepository
                SyncStateRepository WatchChannelRepository LogRepository
```

`.env` novo (todos vazios até o go-live):
`GCAL_PROVIDER=mock`, `GCAL_CRYPTO_KEY`, `GOOGLE_CALENDAR_OAUTH_CLIENT_ID/_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`,
`DB_GCAL_DSHOW_*`.

Banco `GCAL_DSHOW` — as 20 entidades do §56 são adequadas; a modelagem detalhada vai para `02-banco-GCAL_DSHOW.sql`,
espelhando `docs/PIPEDRIVE/02-banco-PIPE_DSHOW.sql`. IDs externos preservados conforme §58
(`event_id`, `calendar_id`, `iCalUID`, `recurringEventId`, `originalStartTime`, `etag`, `sequence`).

### 6.3. Escopos OAuth (§31) — mínimo por fase

| Fase | Escopo | Justificativa |
|---|---|---|
| 2 (mock) | nenhum | sem chamada ao Google |
| 4 (leitura) | `calendar.readonly` + `calendar.freebusy` | atende §13, §15, §22, §24, §38 |
| 6 (escrita) | `calendar.events` | só para quem autorizar criar/editar |
| — | `calendar` (integral) | **evitar**; só se um fluxo administrativo provar necessidade |

---

## 7. Plano de fases (ajustado à realidade medida)

| Fase | Escopo | Bloqueio |
|---|---|---|
| **0** | Este relatório | — |
| **1** | Docs 01-arquitetura, 02-banco, 03-sync, 04-endpoints, 05-plano | aceite deste relatório |
| **2** | Sidebar + header repontado + shell + sub-sidebar + telas com `MockGoogleCalendarService` | **decisão do dono: §5.2 grupo da sidebar** |
| **3** | Drag-and-drop, recorrência, conflitos, fusos, responsivo, a11y | **decisão do dono: §4.6 FullCalendar Premium** |
| **4** | OAuth real, `GCAL_DSHOW`, API interna, cache, auditoria | **§4.2 MySQL root** e **§4.1 timezone** resolvidos |
| **5** | Watch channels, webhook, sync tokens, renovação, reconciliação | Fase 4 |
| **6** | Pipedrive, Outlook, clientes, home, notificações | Fase 5 |
| **7** | D3 (heatmap §39, fluxo §40) + ECharts (§66) + relatórios | Fase 6 |
| **8** | Homologação: segurança, privacidade, performance, a11y, fusos, recorrência, multi-conta, light/dark | — |

---

## 8. Checklist §83 — critérios de aceite da investigação

| Critério | Status |
|---|---|
| Projeto Google Cloud identificado | ✅ **inexistente** — precisa ser criado (pendência do dono) |
| APIs e credenciais mapeadas | ✅ nenhuma credencial de Calendar; as de Ads existem vazias |
| Escopos documentados | ✅ estratégia por fase na §6.3 |
| Componentes existentes catalogados | ✅ §2 — cadeia de 5 camadas, ponto a ponto |
| Tabelas identificadas | ✅ §3 — zero tabelas pertinentes; molde em `PIPE_DSHOW` |
| Integrações relacionadas mapeadas | ✅ Outlook, Ads, Pipedrive, home, Ctrl+K, notificações, permissões |
| Riscos descritos | ✅ §4 — 7 achados, 2 críticos, ambos com prova executada |
| Arquitetura futura aprovada | ⏳ **pendente do dono** |

---

## 9. Pendências que dependem exclusivamente do dono

1. **Aceite deste relatório** e da arquitetura da §6.
2. **§5.2** — Google Calendar em `grp-favoritos` (recomendado) ou criar "Comunicação e Produtividade" movendo o Outlook.
3. **§4.6** — FullCalendar Premium para visões de recurso/timeline, ou construir em D3.
4. **§4.1** — popular as tabelas de fuso do MySQL (via DBA) ou aceitar a regra "conversão só na borda, banco em UTC".
5. **§4.2** — plano de saída do MySQL `root` antes da Fase 4.
6. **Go-live (Fase 4+)** — criar projeto no Google Cloud, habilitar a Calendar API, gerar OAuth Client ID/Secret,
   registrar o redirect URI e definir a tela de consentimento.

---

*Fase 0 concluída em 2026-07-29. Nenhum arquivo de aplicação foi criado ou alterado nesta fase.*
