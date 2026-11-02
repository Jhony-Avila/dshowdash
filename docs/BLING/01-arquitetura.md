# 01 — Arquitetura do módulo Bling

> **Status:** decisões travadas em **2026-07-30** pelo dono. Documento vivo — atualizado a cada fase.
> **Pré-requisito lido:** [00-fase0-investigacao.md](00-fase0-investigacao.md). Este documento assume o retrato de terreno de lá.
> **Briefing de origem:** `docs/BRF_BLING.md`.

---

## 1. Decisões travadas (respondem ao §8 da Fase 0)

| # | Decisão | Escolha do dono | Consequência direta |
|---|---|---|---|
| 8.1 | Data grid | **TanStack Table + TanStack Virtual** | Zero dependência nova. Pivot/agrupamento são implementados no `DataGrid` compartilhado, não comprados. |
| 8.2 | Stack complementar (§68) | derivada de 8.1/8.4 | Entram apenas `zod` (validação de contorno) e o que já existe. Sem Zustand/RHF/Radix/shadcn/Framer nesta fase. |
| 8.3 | RBAC | **Nível na Fase 1, granular na Fase 6** | `requireAuth(50)` como o Pipedrive. `bling.*` em `app_user_trigger_permissions` só quando existir escrita. |
| 8.4 | Componentes React | **Extrair `_shared-react/` agora** | O Bling é o primeiro consumidor. Pipedrive/DataTables/GCal migram depois, um a um — não nesta entrega. |
| 8.5 | Credencial OAuth | **pendente do dono** | Não bloqueia: todo o módulo nasce em `BLING_PROVIDER=mock`. Go-live é troca de variável. |
| 8.6 | Escopo da 1ª entrega | **As 52 páginas do §10** | Exige arquitetura orientada a catálogo (§4). Não é viável escrever 52 telas à mão com coerência. |

### 1.1. O que a escolha "52 páginas" obriga

Entregar 52 telas escritas uma a uma produz divergência entre telas — o erro que já custou caro no módulo GA
(`google-analytics-fase0`, lição "coerência ENTRE TELAS"). A arquitetura abaixo responde a isso:

- **uma única fonte de verdade por tela** (`screens/catalog/`): cada tela declara KPIs, colunas, gráficos e filtros como dados;
- **um renderizador genérico de alta qualidade** que transforma essa declaração em tela de produção;
- **telas customizadas** apenas onde a declaração não dá conta (Visão Geral, Sankey, Conciliação, Rentabilidade, Necessidades de Compra, Simulador de preços, Sincronização);
- **um único gerador de mock coerente**: todas as 52 telas leem do mesmo grafo de dados, então os números batem entre telas por construção, não por revisão.

---

## 2. Princípios inegociáveis

1. O navegador **nunca** vê `client_secret`, `refresh_token` ou `access_token` (§4 do briefing).
2. Toda chamada ao Bling passa pelo backend do Dshow Dash (§4.1).
3. **O envelope é `{ok, data, error}`** — nunca `{success}`. Ver §7.8 da Fase 0: o widget atual está preso em `--` exatamente por esse erro, e a falha volta como HTTP 200. Todo `fetch` do módulo testa `j.ok`.
4. Backup em `/backup/` antes de alterar arquivo existente; `node --check` / `tsc --noEmit` antes de fechar.
5. DDL idempotente e aditivo (`CREATE TABLE IF NOT EXISTS`).
6. Nenhuma escrita no Bling antes da Fase 6 homologada.
7. `BLING` é um banco próprio com usuário próprio de privilégio mínimo — **não** usa o root do MySQL. Segue o precedente do `GCAL_DSHOW`/`gcal_app`, que foi o primeiro módulo a sair do root (`app-roda-como-mysql-root` continua sendo um passivo aberto do resto da aplicação, mas o Bling não o amplia).

---

## 3. Camadas

```
┌──────────────────────────────────────────────────────────────────┐
│ NAVEGADOR                                                        │
│                                                                  │
│  app-shell (header + sidebar, vanilla)                           │
│    └─ #/panel-bling/<grupo>/<tela>                               │
│         └─ panel-bling/index.js  (adaptador vanilla, sem iframe) │
│              └─ dist/  bundle React 19 + TS                      │
│                   ├─ shell/      sub-sidebar, header interno     │
│                   ├─ screens/    52 telas (catálogo + custom)    │
│                   ├─ viz/        D3 + ECharts                    │
│                   └─ services/   BlingService (contrato §48)     │
└───────────────────────────────┬──────────────────────────────────┘
                                │  fetch same-origin, cookie de sessão
                                │  SEMPRE envelope {ok, data, error}
┌───────────────────────────────▼──────────────────────────────────┐
│ BACKEND — api/bling/index.php (roteador PATH_INFO)               │
│                                                                  │
│   controllers/   uma classe por recurso                          │
│        │                                                         │
│   BlingProvider  ←── BLING_PROVIDER = mock | bling               │
│        ├─ BlingMock   gerador coerente (Fase 2)                  │
│        └─ BlingReal   BlingClient + VersionAdapter (Fase 5)      │
│        │                                                         │
│   BlingProviderBase   cálculo compartilhado: mock e banco        │
│                       calculam do MESMO jeito                    │
│        │                                                         │
│   repositories/BlingRepository  →  banco BLING (usuário bling_app)│
└───────────────────────────────┬──────────────────────────────────┘
                                │  OAuth 2.0 + REST (Fase 4/5)
                                ▼
                          API Bling v3
```

### 3.1. Por que `BlingProviderBase` (lição do GCal)

No Google Calendar, mock e banco **calculavam diferente**, e isso só apareceu na homologação.
A correção foi um `GcalProviderBase` com a regra de cálculo única, herdada pelos dois provedores.
O Bling nasce assim: `BlingMock` e `BlingReal` **produzem linhas**; quem **agrega, deriva KPI e classifica situação** é a base. Trocar o provedor não pode mudar um número.

### 3.2. Por que o front-end não sabe qual provedor está ativo

Todo endpoint devolve, no `meta`, `{provider: 'mock'|'bling', simulado: bool, ultima_sync}`. O front-end usa isso **só** para exibir a tarja do §59 ("Ambiente de demonstração"). Nenhuma tela tem ramo condicional por provedor — é isso que garante o §72 ("a API real substitui os mocks sem reconstrução").

---

## 4. Front-end: arquitetura de catálogo

```
public/components/panels/panel-bling/
├── index.js                 adaptador vanilla (molde: panel-google-calendar/index.js)
├── vite.config.ts           build → dist/  (base /components/panels/panel-bling/dist/)
└── src/
    ├── app/                 App.tsx, rotas, providers
    ├── shell/               SubSidebar (52 itens/9 grupos), HeaderInterno, tarja mock
    ├── screens/
    │   ├── catalog/         52 declarações (uma por tela)  ← fonte de verdade
    │   ├── generic/         renderizador de declaração
    │   └── custom/          telas que a declaração não cobre
    ├── viz/                 D3 (Sankey, matriz, rede, waterfall) + ECharts
    ├── services/            BlingService, ApiBlingService, tipos
    └── styles/              tokens --bl-*, light/dark
```

### 4.1. A declaração de uma tela

```ts
export const pedidosVenda: ScreenSpec = {
  id: 'pedidos-venda',
  grupo: 'vendas',
  titulo: 'Pedidos de Venda',
  icone: 'ShoppingCart',
  recurso: 'sales-orders',          // → GET /api/bling/sales-orders
  kpis:   ['pedidos', 'faturamento', 'ticket_medio', 'aguardando_faturamento'],
  graficos: [
    { tipo: 'linha-tempo', metricas: ['pedidos', 'faturamento'], eixoDuplo: true },
    { tipo: 'funil',       etapas: 'situacao' },
  ],
  grid: {
    colunas: [ /* número, ID Bling, situação, data, cliente, ... (§20.1) */ ],
    agrupavelPor: ['situacao', 'canal', 'vendedor'],
    totalizadores: ['total', 'desconto', 'frete'],
  },
  filtros: ['periodo', 'situacao', 'canal', 'vendedor', 'busca'],
  drilldown: { de: 'kpi:aguardando_faturamento', para: 'grid', filtro: { situacao: 'aprovado', nota: null } },
};
```

O renderizador genérico entrega, a partir disso: skeleton, estado vazio, estado de erro com correlation ID, tarja de mock, KPIs com sparkline/comparação/drill-down, gráficos com tooltip/zoom/exportação, grid virtualizado com todos os recursos do §51, cross-filter e persistência de preferências. **Uma correção no renderizador conserta as 52 telas.**

### 4.2. Telas customizadas (não cabem na declaração)

| Tela | Por quê |
|---|---|
| Visão Geral (§14–§19) | KPIs + saúde + "Exige atenção" + evolução + Sankey empresarial + mapa de relacionamento |
| Central Operacional | fila de trabalho, não relatório |
| Estoque (§24.3) | matriz D3 giro × margem com quadrantes interativos |
| Depósitos (§25) | fluxo D3 de transferências entre depósitos |
| Preços (§26.2) | simulador com entrada do usuário |
| Necessidades de Compra (§28) | motor de recomendação |
| Central fiscal (§31) | funil com perdas por etapa |
| Fluxo de caixa (§34) e Sankey financeiro (§35) | projeção + fluxo de valor |
| Conciliação (§36) | associação manual, ações em lote |
| Rentabilidade (§40) | waterfall + matriz + Pareto |
| Sincronização (§47) | página técnica: cursores, watermark, retry, DLQ |

As demais 41 telas saem do catálogo.

---

## 5. `_shared-react/` (decisão 8.4)

Novo pacote em `public/components/_shared-react/`, consumido por alias `@shared` no Vite de cada painel.

Primeiros componentes extraídos (os que o Bling precisa e que hoje estão duplicados 3×):
`DataGrid` (TanStack Table + Virtual), `FilterBar`, `PageHeader`, `KpiCard`, `Drawer`, `Tabs`, `Timeline`, `EmptyState`, `ErrorState`, `Skeleton`, `Badge`, `Toolbar`, `ExportMenu`, `ThemeTokens`.

**Regra de não-regressão:** os módulos que já estão no ar (Pipedrive, DataTables, GCal) **não são tocados** nesta entrega. Eles continuam com sua cópia local até serem migrados um a um, com aceite próprio. Extrair ≠ migrar.

---

## 6. Backend: `api/bling/`

```
api/bling/
├── index.php                roteador PATH_INFO (molde: api/google-calendar/index.php)
├── _init.php                requires, CORS, helpers
├── lib/
│   ├── BlingProvider.php        escolhe mock|bling por env
│   ├── BlingProviderBase.php    cálculo único (KPIs, situações, agregações)
│   ├── BlingMock.php            gerador coerente e determinístico
│   ├── BlingReal.php            usa BlingClient + repositório
│   ├── BlingClient.php          HTTP, paginação, rate-limit, backoff  (Fase 4)
│   ├── BlingVersionAdapter.php  isola mudanças da API v3            (§49)
│   ├── BlingNormalizer.php      payload Bling → modelo interno
│   ├── BlingOAuth.php           authorize/callback/refresh          (Fase 4)
│   ├── BlingCrypto.php          AES-256-GCM para tokens em repouso
│   └── BlingSituacoes.php       tradução de códigos de situação
├── repositories/BlingRepository.php
├── services/  BlingAuthService · BlingSyncService · BlingQueueService · BlingWebhookService
└── controllers/  um por recurso (Overview, SalesOrder, Product, Inventory, Warehouse,
                  Price, PurchaseOrder, Supplier, Invoice, Financial, Shipment, Contact,
                  Channel, Profitability, AbcCurve, Insight, Report, Alert, Sync,
                  Webhook, Log, Audit, Config, Status, Header)
```

nginx ganha um bloco `location ~ ^/api/bling(/.*)?$` idêntico ao do Google Calendar,
**antes** do genérico de diretório e do catch-all `.php` (a ordem importa).

### 6.1. Rate limit (§44)

O limite do Bling é por conta e vale para o conjunto das requisições. `BlingClient` implementa
balde de tokens por conta + fila com prioridade (webhook > interativo > carga) + backoff exponencial
com jitter + `Retry-After`. O consumo fica visível na tela de Sincronização.

### 6.2. Webhooks (§46)

`POST /api/bling/webhooks` responde rápido: valida assinatura, grava bruto em `bling_webhook_events`,
enfileira e retorna 200. O processamento é assíncrono e **idempotente por `(evento, id_externo, hash)`**.
Webhook não substitui reconciliação — o cron de reconciliação continua sendo a rede de segurança.

---

## 7. Banco `BLING`

O schema **já existe e está vazio** (medido em 2026-07-30). Usuário `bling_app` com privilégio mínimo
(`SELECT, INSERT, UPDATE, DELETE` em `BLING.*`; sem DDL em runtime, sem `GRANT`, sem `FILE`).

DDL completo em `02-banco-BLING.sql` (~34 tabelas do §50). Regras que vieram de erro real:

- **FK desde o primeiro dia.** No GCal, a ausência de FK em `gcal_sync_state` produziu 16 linhas órfãs que faziam a tela dizer "✔ sincronizado" com zero contas conectadas — um verde falso. Aqui, toda tabela de domínio referencia `bling_accounts(id)` com FK. Exceções deliberadas e documentadas: `bling_audit_logs`, `bling_sync_errors`, `bling_webhook_events` e `bling_raw_payloads` — precisam sobreviver à remoção da conta para permitir investigação.
- **Campos comuns** em toda tabela de domínio (§50): `id`, `bling_id`, `account_id`, `business_unit_id`, `situacao`, `payload_hash`, `versao`, `criado_externo_em`, `atualizado_externo_em`, `sincronizado_em`, `deletado_em`, `origem`.
- **Índice único** `(account_id, bling_id)` em toda tabela de domínio — é o que torna a sincronização idempotente.
- **Datas em UTC** na coluna, conversão na borda. `CONVERT_TZ` por **nome** de fuso devolve NULL neste servidor (tabelas de fuso não carregadas) — usar offset.

---

## 8. Fases e o que cada uma entrega

| Fase | Entrega | Estado |
|---|---|---|
| 0 | Investigação | ✅ 2026-07-29, revisada 2026-07-30 |
| 1 | Decisões + arquitetura | ✅ este documento |
| 2 | `_shared-react/`, shell, sub-sidebar, 52 telas, `BlingMock`, `api/bling/` mock-first, sidebar, header, rotas | 🔜 em execução |
| 3 | D3 + ECharts em profundidade, cross-filter, drill-down | 🔜 |
| 4 | Banco `BLING`, OAuth, jobs, filas, webhooks, cache, logs | 🔜 |
| 5 | Integração real, reconciliação, homologação, troca do provedor | 🔜 credencial do dono |
| 6 | Operações de escrita | 🔜 após homologação |

---

## 9. Riscos assumidos com a escolha das 52 telas

| Risco | Mitigação |
|---|---|
| Divergência entre telas | catálogo único + gerador de mock único: os números batem por construção |
| Volume de revisão do dono | tela de aceite listando as 52 com status, para revisão em bloco |
| Telas rasas passando por prontas | cada tela declara `profundidade: 'completa' \| 'estrutural'`; a tarja mostra qual é qual — sem "pronto" que não é |
| Bundle grande | code splitting por grupo (9 chunks), lazy por rota. `import()` **não** garante lazy-load: medir o chunk no build, não confiar na sintaxe |
| Regressão em módulo no ar | `_shared-react/` é aditivo; nenhum painel existente é tocado nesta entrega |
