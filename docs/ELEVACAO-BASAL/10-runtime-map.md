# Elevação Basal — 10 · Runtime Map (M2)

> O que o navegador realmente carrega e de onde vem. Fonte primária:
> `evidencias/baseline-servidor-2026-08-10.md` §2–§3 (hashes lá; aqui, interpretação).

## 1. Números consolidados do boot

| Métrica | Valor |
|---|---|
| Deps js/css diretas do `public/index.html` | 74 |
| — ignoradas pelo Git | 55 (74%) |
| — rastreadas | 19 |
| Deps servidas de `dist/` (bundles) | 49 |
| Dists totais no servidor | 63 |
| Dists DEFASADOS (fonte mais nova que artefato) | **34** |
| Dists "ok?" (sem defasagem por timestamp) | 29 |

## 2. Grafo de boot × governança × frescor

Cadeia crítica de boot (ordem do index.html), todas IGNORED e quase todas DEFASADAS:

| Bundle | Git | Frescor |
|---|---|---|
| `/bootstrap-v2/dist/bootstrap.bundle.js` | IGNORED | DEFASADO |
| `/core/runtime/dist/runtime.bundle.js` | IGNORED | DEFASADO |
| `/core/runtime/events/catalog/dist/events-catalog.bundle.js` | IGNORED | DEFASADO |
| `/core/js/event-bus/dist/event-bus.bundle.js` | IGNORED | DEFASADO |
| `/components/session-manager/dist/session-manager.bundle.js` | IGNORED | DEFASADO |
| `/core/auth/dist/auth.bundle.js` | IGNORED | DEFASADO |
| `/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js` | IGNORED | DEFASADO |
| `/core/kernel/dist/kernel.bundle.js` | IGNORED | DEFASADO |
| `/components/app-shell/dist/app-shell.bundle.js` | IGNORED | DEFASADO |
| `/components/header/dist/header.bundle.js` | IGNORED | DEFASADO |
| `/components/sidebar/dist/sidebar.bundle.js` | IGNORED | DEFASADO |
| `/components/footer/dist/footer.bundle.js` | IGNORED | DEFASADO |
| `/components/main/dist/main.bundle.js` | IGNORED | ok? |
| `/app/router/dist/app-router.bundle.js` | IGNORED | DEFASADO |
| `/modules/global-state/dist/global-state.bundle.js` | IGNORED | ok? |
| `/platform/runtime/dist/platform-runtime.bundle.js` | IGNORED | ok? |
| `/platform/shell/dist/platform-shell.bundle.js` | IGNORED | ok? |

Confirmação empírica da tese do briefing: **a defasagem está concentrada nas fundações**
(bootstrap, runtime, event-bus, auth, sessão, kernel, shell, header/sidebar/footer, router).
Os painéis novos (ads, avatar-studio, pipedrive, datatables, GA, gcal etc.) estão "ok?".

## 3. Deps rastreadas (as 19 governadas)

CSS de estilos de componentes (app-shell, sidebar.bundle.css, preloader, router, main
tokens/container, panel-nav-admin, ticker, modal-manager, gcal-popover) e JS standalone
recentes (avatar-sync, gcal-header-popover, currency-panel, traffic-monitor,
world-clock-map, panel-dashboard/index.js, header initial-route — ver hashes na evidência).
Padrão: **o que é novo nasce governado; o basal segue ignorado** (ratifica BASAL-001).

## 4. Árvores físico × rastreado (servidor)

| Árvore | Físicos | Rastreados | Classe (doc 04) |
|---|---|---|---|
| `api/` | 560 | 118 | ACTIVE_SOURCE parcial + ACTIVE_UNGOVERNED (~442) |
| `public/app/` | 32 | 0 | ACTIVE_UNGOVERNED (runtime sombra) |
| `public/bootstrap-v2/` | 415 | 0 | ACTIVE_UNGOVERNED |
| `public/core/` | 477 | 0 | ACTIVE_UNGOVERNED |
| `public/platform/` | 112 | 0 | ACTIVE_UNGOVERNED |
| `public/modules/` | 36 | 0 | ACTIVE_UNGOVERNED |
| `public/react/` | 7 | 0 | LEGACY_CANDIDATE (dist "ok?", papel a confirmar) |

## 5. `public/api`

Symlink confirmado: `public/api -> /var/www/dshowdash/api` (www-data, nov/2025).
Classe: `COMPATIBILITY_LAYER`. Nota: o Nginx roteia `/api/*` majoritariamente por
`alias /var/www/dshowdash/api/...` direto (sem passar pelo symlink) — o consumo real do
symlink precisa ser medido antes de qualquer plano de remoção (ADR-008).

## 5b. ACHADO CRÍTICO (Onda 3) — runtime importa fontes `.ts` por ESM

A sondagem M1b (`evidencias/m1b-sondagem-2026-08-10.md`) provou que o runtime **não é
totalmente empacotado**: `bootstrap-v2/` é servido como árvore ESM crua e importa fontes
`.ts` literalmente:

```text
31 arquivos .js em public/bootstrap-v2/**  → import { … } from ".../contracts/health-contract.ts"
public/core/runtime/_entry.js:83-84        → import ".../events/catalog/_entry.ts" e ".../enterprise/strict-mode.ts"
```

Consequências:
1. **BASAL-004 tem raiz mais profunda que "arquivos só existem no disco":** o navegador
   busca esses `.ts` porque o JS os importa. O Nginx serve `.ts` com MIME de JS hoje.
2. **Bloquear `.ts/.tsx` quebraria o boot** — por isso o portão P1 corretamente adiou (§11).
   O pré-requisito é empacotar `bootstrap-v2/` e `core/runtime/` (ou reescrever os imports
   para os artefatos compilados) — trabalho de M5/M6.
3. Os bundles `*/dist/*.bundle.js` do index podem ser **entrypoints parciais ou defasados**
   convivendo com a árvore ESma crua — o que o navegador realmente executa precisa de prova
   de rede (aba Network autenticada, validação do Jhony) no M2.
4. P2 limpou o alarme das permissions: `integration.bundle.js` e `ui-feedback.bundle.js`
   **não** contêm `.ts` — o `keepExternal` no `vite.components.config.js` está obsoleto
   (candidato a limpeza P2/M4, sem urgência).

Reframe do roadmap: **a blindagem `.ts` do M1 fica atrelada ao build canônico (M5/M6)**;
o M1 fecha os P0 que não dependem disso (`.patch`, vhost órfão, e — com decisão — MySQL/phpMyAdmin).

## 6. Implicações imediatas

1. Qualquer mudança nas fundações hoje NÃO chega ao runtime sem rebuild manual dos dists ignorados (BASAL-006).
2. Os 34 dists defasados não devem ser reconstruídos em massa — ordem do grafo de boot (doc 01 §4) e só após M4/M5.
3. Rollback do estado atual: hashes sha256 de todos os 74 artefatos ativos preservados na evidência.
