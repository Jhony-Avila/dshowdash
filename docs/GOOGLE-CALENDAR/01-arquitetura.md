# 01 — Arquitetura

> Módulo **Google Calendar** · escrito na Fase 1, implementado na Fase 2 (mock-first).
> Fonte do escopo: `docs/BRF_CALENDAR.md`. Achados que condicionam este desenho: [`00-fase0-investigacao.md`](00-fase0-investigacao.md).

---

## 1. Visão geral

```
Google Calendar API  (Fase 4+)
        ↓
GoogleOAuth  (Auth Code + PKCE S256, cURL, sem SDK)
        ↓
GcalReal ────┐
             ├──> GcalProvider (interface)  <── os controllers falam SÓ com isto
GcalMock ────┘
        ↓
controllers/  ──>  ApiResponse {ok, data, error, meta}
        ↓
nginx: ^/api/google-calendar(/.*)?$  →  index.php (PATH_INFO)
        ↓
src/services/  (ApiGoogleCalendarService implements GoogleCalendarService)
        ↓
telas React (14)  —  nenhuma tela conhece fetch
```

O switch mock ↔ real vive **no backend** (`GCAL_PROVIDER`), não no front. Assim as telas são
exercitadas contra as mesmas regras de permissão, privacidade e detecção de conflito que valerão em
produção; um mock só de front deixaria esses caminhos sem teste até a Fase 4.

## 2. Decisões que valem registrar

### 2.1. Fuso: banco em UTC, conversão só na borda 🔴

`mysql.time_zone_name` está **vazia** neste servidor (medido na Fase 0). Consequência:

```sql
CONVERT_TZ('2026-07-29 12:00:00','UTC','America/Sao_Paulo')  →  NULL
```

`NULL` não levanta erro: dentro de um `WHERE` de janela ele **remove o evento do resultado**. O usuário
vê a agenda mais vazia do que é e não há nada no log. Por isso:

1. o banco guarda **sempre UTC**;
2. a conversão acontece em `api/google-calendar/lib/Tz.php` (PHP) ou `src/lib/tz.ts` (browser);
3. **nenhuma query deste módulo pode conter `CONVERT_TZ`.**

O PHP fixa `date.timezone = America/Sao_Paulo`, e o §47.1 pede justamente não fixar São Paulo na
lógica — então todo cálculo passa por um fuso **explícito**, nunca pelo default do processo.

No front a conversão usa `Intl` nativo em vez de date-fns/Luxon: o projeto não tem lib de data, e o
`package.json` é **compartilhado** por todos os painéis React — engordar a raiz por formatação que o
browser já faz não se paga.

### 2.2. Roteamento: `#/panel-*`, nunca `#/integrations/*`

`resolvePanelPath()` em `panel-paths.js` tem fallback por convenção (`panel-X` →
`/components/panels/panel-X/index.js`), então `#/panel-google-calendar` resolve **ao vivo** e o módulo
não precisa ser registrado em lugar nenhum. `#/integrations/*` resolveria pelo `routes-integrations.js`,
que está **bundleado** em `app-router.bundle.js` e `main.bundle.js` — bundles de boot que não se rebuilda.

O botão do header foi repontado por **patch cirúrgico de 1 string** no
`header-components.bundle.js`, seguindo o precedente documentado no `sw.js` v9.3.80 (Ads), com as
fontes `panel-calendar/index.{js,ts}` sincronizadas.

### 2.3. Conflito é computado, nunca fixo

Conflitos, free/busy, KPIs e alertas derivam dos eventos em tempo de consulta. Se fossem fixos, mover um
evento na UI deixaria a central de conflitos contradizendo a agenda ao lado.

Regras implementadas (§23):

| Tipo | Quando | Severidade |
|---|---|---|
| `sobreposicao` | dois eventos opacos no mesmo horário | alta |
| `ausencia` | compromisso dentro de `outOfOffice` | alta |
| `recurso` | mesma sala reservada duas vezes | alta |
| `deslocamento` | < 15 min entre presenciais em locais diferentes | média |
| `foco` | reunião invade bloco `focusTime` | baixa |

Duas exclusões deliberadas:

- **`transparency: transparent` não gera conflito** (almoço, home office marcam disponibilidade, não ocupação);
- **calendário de recurso fica fora da agenda pessoal.** Reservar a sala *para* a reunião criaria dois
  blocos no mesmo horário e a central acusaria conflito onde não há. Medido: sem essa regra o dia-padrão
  do mock reportava 4 conflitos, sendo 2 falsos. Central que grita à toa é central que o usuário aprende
  a ignorar.

### 2.4. Privacidade aplicada no servidor (§75.1)

Em calendário com `access_role = freeBusyReader`, o backend **mantém o bloco** (senão a disponibilidade
mente) e apaga título, descrição, local, participantes, conferência e vínculos, marcando `redacted: true`.
A UI exibe "Ocupado" e um aviso. A regra é do servidor de propósito: filtro só no front vaza no DevTools.

### 2.5. Segredo nunca chega ao browser

`GcalCrypto` (AES-256-GCM, cópia de `OutlookCrypto`) cifra access token, refresh token, `code_verifier` e
o **`syncToken`** — que entra na lista porque autoriza ler o delta de uma agenda inteira. `scrub()` limpa
o payload antes de logar; o `sync_token` chega à UI como `********`.

## 3. Árvore de arquivos

```
api/google-calendar/
  index.php                   roteador PATH_INFO, 13 rotas
  _init.php                   requires, CORS, gcal_body/gcal_filtros/gcal_provider
  lib/
    Tz.php                    conversão de fuso (a regra do §2.1)
    GcalProvider.php          interface (contrato do §52)
    GcalMock.php              provedor mock, estado em $_SESSION
    GcalReal.php              provedor real — 503 com as pendências
    GcalCrypto.php            AES-256-GCM + mask/last4/scrub
    GoogleOAuth.php           Auth Code + PKCE S256 sobre cURL
  controllers/                Status Calendar Event FreeBusy Invitation
                              Conflict Alert Overview Sync Account

public/components/panels/panel-google-calendar/
  index.js                    adaptador vanilla (monta React no container-main)
  vite.config.ts tsconfig.json
  src/
    entry.tsx                 mountReact / unmountReact
    app/App.tsx               rota por hash, prefs, badges, composição
    shell/                    types (TELAS) · SubSidebar · HeaderInterno · Icone · ui
    lib/                      api.ts (envelope {ok,data,error}) · tz.ts
    services/                 types.ts (contrato §52) · index.ts (implementação)
    screens/                  Hoje Agenda Listas Calendarios Convites
                              Disponibilidade Conflitos Carga Admin
                              EventoDrawer NovoEvento Estados
    styles/                   tokens.css · base.css

scripts/gcal-smoke-all.{php,sh}          runner de regressão
tools/screenshot/proof-gcal-entradas.mjs prova de UI com clique real
```

## 4. Performance (§77)

| Medida | Efeito |
|---|---|
| `React.lazy` em Agenda e Carga | FullCalendar (207 kB) e ECharts saem do primeiro paint |
| Import seletivo do ECharts (`echarts/core` + BarChart + Grid + Tooltip + SVGRenderer) | 1.126 kB → **496 kB** |
| `manualChunks` separando react-vendor / vendor / fullcalendar / echarts | cache de longo prazo por chunk |
| Janela obrigatória em toda consulta, teto de 400 dias no backend | `?de=1970-01-01` não derruba o módulo |
| Teto de 2.000 eventos na grade, **com aviso visível** | sem truncamento silencioso |
| `staleTime` 20 s + `retry` que não repete 401/404/503 | menos ida-e-volta inútil |

Primeiro paint do módulo: `gcal` + `entry` + `vendor` + `react-vendor` ≈ 390 kB (~119 kB gzip).

## 5. O que ainda não existe (e por quê)

| Item | Motivo | Fase |
|---|---|---|
| Drag-and-drop, resize, clique na faixa vazia | `@fullcalendar/interaction` não instalado; mexe no `package.json` **raiz** | 3 |
| Visão de recursos em linha do tempo | `@fullcalendar/resource-*` é **licença comercial** — decisão do dono | 3 |
| Editor visual de recorrência | hoje há 6 presets; o editor livre depende de RRULE completo | 3 |
| Persistência, OAuth real, sync | sem Google Cloud, sem credencial, sem banco | 4–5 |
| Push (watch channels) | depende da Fase 4 | 5 |
| Pipedrive/Outlook/clientes ao vivo | os vínculos já trafegam no contrato (`links[]`), falta a fonte | 6 |
