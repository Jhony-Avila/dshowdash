# Módulo de Trânsito — São Paulo (DShowDash)

Monitoramento de trânsito de SP: indicador no header + painel no `container-main`, com backend
proxy (TomTom/mock) + cache Redis. Arquitetura de microfrontend **aditiva** (não toca no shell).

## Componentes

| Camada | Caminho | Papel |
|---|---|---|
| Indicador header | `public/components/traffic-monitor/header-indicator.js` | Auto-injeta botão no `.header-right` (padrão theme-toggle), polling de `/api/traffic/summary.php`, clique → navega |
| Painel (main) | `public/components/panels/panel-transito-sp/index.js` + `panel.css` | `mount/unmount` por convenção (PanelPort). Cabeçalho + cards + mapa Leaflet + listas |
| Mapa | `public/assets/js/libs/leaflet/` (self-hosted) | Leaflet 1.9.4 + markercluster 1.5.3. Base CARTO (light/dark), fluxo em polylines próprias, ocorrências clusterizadas |
| Backend | `api/traffic/` | Endpoints, provider (interface), normalização, cálculo do índice, cache |

Fluxo: `header-indicator → navigateToRoute('#/panel-transito-sp') → nav.intent → container-main
→ import /components/panels/panel-transito-sp/index.js → mount()`.

## Endpoints (`/api/traffic/`)

- `GET summary.php` — resumo leve p/ o header (índice, nível, km, ocorrências, closures, trend, stale).
- `GET dashboard.php` — payload completo (summary + flow[] + incidents[] + metadata).
- `GET flow.php` — segmentos de fluxo (GeoJSON próprio) p/ o mapa.
- `GET incidents.php[?type=accident|closure|roadworks|congestion|hazard|other]` — ocorrências + contagens.
- `GET health.php` — status do provedor e do cache.

Contrato: `{ ok, data, error, meta }` (ApiResponse). Header `X-Cache: HIT|MISS`.

## Provedor (troca sem reescrever)

Interface `providers/TrafficProvider.php` (`getTrafficFlow`, `getIncidents`, `name`, `health`).
Implementações: `MockTrafficProvider` (fixtures SP, ativo sem chave) e `TomTomTrafficProvider`.
Seleção: `providers/ProviderFactory.php` via env **`TRAFFIC_PROVIDER=mock|tomtom`** (default: `tomtom`
se houver `TOMTOM_TRAFFIC_API_KEY`, senão `mock`). Adicionar `HereTrafficProvider` = 1 classe nova + 1 case.

## Chave da API (segurança)

- `.env`: `TOMTOM_TRAFFIC_API_KEY=...` — **só no backend**, nunca no frontend. Lida via `getenv()`
  após incluir `config/db_connection.php` (que roda `loadEnv`).
- O frontend só consome os nossos endpoints internos; a URL da TomTom é montada server-side.

## Índice geral de trânsito (0–100) — fórmula

Documentado em `calc/TrafficIndex.php`. Por segmento:
```
congestion   = clamp(1 - currentSpeed/freeFlowSpeed, 0..1)
segmentScore = congestion * 100
```
Cidade (média ponderada pela extensão) + penalidade de ocorrências (com teto):
```
cityBaseScore   = Σ(segmentScore * len) / Σ(len)
incidentPenalty = min(maxPenalty, closures*wC + severeAccidents*wA + majorWorks*wW)
trafficIndex    = min(100, cityBaseScore + incidentPenalty)
```
Pesos/thresholds em `config.php` → `index` e `levels` (0–34 normal, 35–69 moderado, 70–100 intenso).
**Calibrar com dados reais antes de considerar definitivo.**

- **Km de lentidão:** soma da extensão de segmentos com `currentSpeed < freeFlow * 0.65` (ou closure),
  com **dedup por id**. Apresentado como *estimativa* — nunca como dado oficial da CET.
- **Comparação:** 1ª versão usa o **fluxo livre** da via como referência (não há histórico). Campo
  `comparisonBasis: "free-flow"`. Com a tabela de histórico (opcional) pode virar média histórica.

## Cache (Redis, prefixo `traffic:`)

Payload único cacheado (`TrafficService`) compartilhado por todos os endpoints → **1 chamada externa
por janela**, não por usuário. TTL curto (60s, config). Fallback **stale** (30 min) quando o provedor
falha: serve o último dado bom com `metadata.stale=true`. Resposta parcial suportada (flow OU incidents).

## Limites da API (TomTom) — LIVE desde 2026-07-20

Provider **tomtom ATIVO** (`TRAFFIC_PROVIDER=tomtom`, chave no `.env`). Dados reais de SP validados.

⚠️ **Orçamento de chamadas:** cada refresh do payload compartilhado = **~13 chamadas** = 12 Flow Segment
(uma por via em `providers/fixtures/sp-roads.php`) + 1 Incident Details (bbox, ~500 ocorrências).
Com **TTL 300s** e cache **compartilhado server-side** (o nº de usuários NÃO multiplica): ~12h de uso
contínuo ≈ **1.900 chamadas/dia** (< 2.500 do free tier típico). Alavancas p/ ajustar: `cache.ttl_*`
(↑ reduz chamadas) e o nº de vias monitoradas (↓ reduz o custo de flow). **Recomendado:** confirmar o
limite exato do seu plano e configurar um teto de consumo no painel da TomTom (evitar cobrança).

**Notas de integração TomTom (aprendidas na ativação):**
- `language=pt-PT` (a API **rejeita `pt-BR`** com HTTP 400).
- Ocorrências: `roadNumbers` vem vazio em vias urbanas → usamos `from` como nome da via.
- `iconCategory`: 6=congestionamento, 7/8=interdição, 9=obra, 1=acidente. `magnitudeOfDelay` 4 (fechado)
  mapeado como `high` (não `critical`) p/ não inflar a severidade.
- Geometria de ocorrência reduzida a 1 **ponto** (marcador) e polylines de fluxo amostradas a ≤48 pontos
  → payload do dashboard ~250KB mesmo com ~500 ocorrências.
- Km de lentidão soma a extensão dos incidentes de congestionamento (cat 6, têm `length`).

## Mapa

Leaflet self-hosted (sem CDN — CSP report-only permite `img-src https:`, mas os JS/CSS são locais).
Base **CARTO** `light_all`/`dark_all` (troca com o tema via `data-theme`, atribuição obrigatória).
Fluxo desenhado por nós (polylines por `congestionLevel`) → **não consome cota de tiles da TomTom**.
Sem busca de endereço, sem origem/destino.

## Eventos de integração

- Navegação: `navigateToRoute('#/panel-transito-sp')` → emite `NAV_INTENTS.NAVIGATE` (`"nav.intent"`).
- Convenção de painel: rota `#/panel-*` resolve `panelId` automaticamente (sem DB/manifest).

## Testes

- Unit (cálculos): `php api/traffic/tests/run.php` (26 asserts).
- Integração (endpoints): `bash api/traffic/tests/smoke.sh`.
- Frontend: harness Playwright `tools/screenshot/valida-transito.mjs` (indicador + painel, dark/light).

## Tema (frontend)

Painel usa tokens `--transit-*` → variáveis globais (`--bg-*`, `--text-*`, `--border-color`,
`--accent-*`) com fallback; cores de nível invertem por `[data-theme]`. Sem sistema de tema próprio.

## Cache-bust / Service Worker

Assets do módulo estão no `networkFirst` + `bustBundle` (`isTransit`) do `sw.js` (v9.3.34) → sempre
frescos, sem armadilha SWR. Em updates futuros de `header-indicator.js`/`panel.css`, bumpar o `?v=`
e a versão do SW (disciplina do projeto).

## Rollback

Módulo 100% aditivo. Para desativar sem remover:
1. **Backend:** `TRAFFIC_PROVIDER` irrelevante; para “desligar”, remover/renomear `api/traffic/` (os
   endpoints somem; o painel mostra estado de erro — não quebra o resto do app).
2. **Header:** remover a linha `<script ... traffic-monitor/header-indicator.js>` do `public/index.html`
   (o indicador some; nada mais é afetado).
3. **Painel:** sem o indicador, a rota `#/panel-transito-sp` deixa de ser acionada.
Backups desta entrega em `/backup/traffic-monitor-20260720/` (index.html, sw.js) — os demais arquivos
são novos (basta removê-los). Nenhum arquivo existente foi sobrescrito além de `index.html` (1 linha
aditiva) e `sw.js` (regra aditiva + bump).
