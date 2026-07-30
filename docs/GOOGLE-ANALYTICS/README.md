# Módulo Google Analytics (GA4) — documentação

Briefing-fonte: **MEGA BRIEFING COMPLETO — MÓDULO GOOGLE ANALYTICS** (84 seções), recebido em
2026-07-29.

## Estado

**Fase 0 (investigação)**: executada, e deliberadamente **NÃO fechada** — 7 dos 10 critérios da §80
atendidos, 3 bloqueados por falta de credencial GA4.

**Fase 1 (módulo no mock)**: **NO AR** em `GA_PROVIDER=mock` — backend, painel React, sidebar, flag.

**Fase 2 (D3)**: **NO AR** — Sankey de aquisição, árvore de jornada com abandono, mapa do Brasil e
treemap de canais.

**§32**: **NO AR** — conciliação de leads com o CRM **real** (Pipedrive). Primeira ponta real.

**Fase 3**: **NO AR** — insights com z-score e regressão linear, Diretoria e exportação CSV.

Total: **18 rotas** e **30 telas com dados**.
Verificação de tudo: `bash scripts/ga-smoke-all.sh` (29 checagens) + prova de UI com **139**.

## Documentos

| Doc | Conteúdo |
|---|---|
| [`00-fase0-investigacao.md`](00-fase0-investigacao.md) | Entregável da seção 6: inventário da coleta, infra, banco, front-end, integrações, 11 riscos, plano de fases ajustado, 9 decisões do dono e o status item a item da seção 80 |
| [`01-fase1-mock.md`](01-fase1-mock.md) | O que está no ar, as 2 decisões de desenho do mock, o bug de coerência que a medição pegou, o reúso sem instalar nada, as traps respeitadas e o que a fase deixou de fora |
| [`03-fase3-inteligencia.md`](03-fase3-inteligencia.md) | Insights com estatística (z-score, regressão), Diretoria, exportação CSV, os 2 bugs que só apareceram ao criar cenários para exercitar as regras, e as 2 falhas da própria prova |
| [`02-fase2-d3.md`](02-fase2-d3.md) | Os 4 gráficos D3, por que foram escritos aqui e não importados do Ads, a regressão de chunk que a medição pegou (`import()` dinâmico **não** garante lazy-load), as decisões de leitura de cada gráfico e as 2 correções de honestidade na UI |

## O que já se sabe, em 6 linhas

- **A coleta existe, fora deste servidor**: `dshow.com.br` tem **`GTM-M8KJKVV`** e GA4
  **`G-WGDR8WJ7G8`** — mas a tag vive dentro de `app.min.js`, não no HTML.
- 🔴 **`UA-945670-1` ainda dispara 4 tags** no container (Universal Analytics morreu em 2023).
- 🔴 **Zero eventos de e-commerce** → as seções 33, 34 e 35 do briefing não têm base hoje.
- 🔴 **4 eventos grafados `scrool_*`** em vez de `scroll_*`.
- ✅ **A plataforma é a melhor do projeto**: 9 gráficos D3 prontos (Sankey, mapa, treemap, coorte,
  grafo), ECharts 6, `EntityGrid` de 837 linhas, molde de 22 telas no `panel-ads`, `GoogleOAuth`
  (PKCE) e `GcalCrypto` (AES-GCM) já escritos.
- 🔴 **Fase 4 bloqueada**: nenhuma credencial Google preenchida, sem composer, sem `gcloud`/`bq`.

## Antes de escrever código, ler no doc 00

- §5.4 — as traps herdadas: envelope `{ok,...}` (**nunca** `success`), tema por `html[data-theme]`,
  `CONVERT_TZ` por nome = NULL, zona morta do app-shell (312 px), `chown` após build e após editar `api/`.
- §6.1 — o grupo **"Marketing e Aquisição" não existe**; hoje tudo mora em `sidebar.grp-favoritos`.
- §7.1 — o módulo de **Ads já espera** a mesma propriedade GA4; uma decisão destrava os dois.
- §10 — as **9 decisões** que precisam do dono, sendo a primeira a credencial.
