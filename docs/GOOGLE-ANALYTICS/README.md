# Módulo Google Analytics (GA4) — documentação

Briefing-fonte: **MEGA BRIEFING COMPLETO — MÓDULO GOOGLE ANALYTICS** (84 seções), recebido em
2026-07-29.

## Estado

**Fase 0 (investigação) executada — e deliberadamente NÃO fechada.** 7 dos 10 critérios de aceite da
seção 80 estão atendidos; **3 estão bloqueados pela mesma causa**: não existe credencial GA4 neste
ambiente. Nenhuma linha do módulo foi escrita (a seção 4.1 do briefing manda investigar primeiro).

## Documentos

| Doc | Conteúdo |
|---|---|
| [`00-fase0-investigacao.md`](00-fase0-investigacao.md) | Entregável da seção 6: inventário da coleta, infra, banco, front-end, integrações, 11 riscos, plano de fases ajustado, 9 decisões do dono e o status item a item da seção 80 |

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
