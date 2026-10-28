# Módulo Google Calendar — documentação

**Fonte do escopo:** `docs/BRF_CALENDAR.md` (mega briefing do dono, 2.807 linhas).
Este diretório contém o desdobramento técnico. O briefing manda; onde a realidade do
repositório diverge dele, a divergência está registrada e justificada — nunca aplicada em silêncio.

## Estado atual

| Fase | Documento | Estado |
|---|---|---|
| 0 — Investigação | [`00-fase0-investigacao.md`](00-fase0-investigacao.md) | ✅ 2026-07-29 |
| 1 — Arquitetura | [`01-arquitetura.md`](01-arquitetura.md) | ✅ |
| 1 — Banco | [`02-banco-GCAL_DSHOW.sql`](02-banco-GCAL_DSHOW.sql) | ✅ escrito · ⚠️ **NÃO executado** (Fase 4) |
| 1 — Sincronização e filas | [`03-sincronizacao-e-filas.md`](03-sincronizacao-e-filas.md) | ✅ |
| 1 — Endpoints | [`04-endpoints-api.md`](04-endpoints-api.md) | ✅ implementado e no ar |
| 1 — Plano de fases | [`05-plano-fases.md`](05-plano-fases.md) | ✅ |
| **2 — Base visual e mocks** | — | ✅ **NO AR** · 14 telas · `GCAL_PROVIDER=mock` |
| **3 — UX avançada** | — | ✅ **NO AR** · drag/resize/seleção · otimista com rollback · heatmap D3 · popover do header · widget na home · atalhos · mobile |
| **7 — Analytics** | — | ✅ **NO AR** · 11 relatórios · CSV + impressão/PDF · Sankey · rede D3 |
| **6 — Integrações internas** | — | ✅ **NO AR** · vínculo com Pipedrive e Koala **reais** · ficha lateral |
| **8 — Homologação** | [`06-homologacao.md`](06-homologacao.md) | ✅ **homologado** · 0 falha · 3.516 textos medidos |
| **4 — Backend real** | — | ◑ banco + OAuth + sync **prontos e testados**; falta credencial Google |
| 5 | — | ⏳ ver `05-plano-fases.md` |

## Como abrir

Sidebar → **Favoritos → Google Calendar**, ou o ícone de calendário no header.
Rota: `#/panel-google-calendar`. Tudo o que aparece é **simulado** (faixa amarela no topo avisa).

## Como verificar

```bash
bash scripts/gcal-smoke-all.sh     # tudo: suítes, homologação, HTTP, sintaxe e 4 provas de UI
node tools/screenshot/proof-gcal-fase3.mjs   # interação real: drag, criação, atalhos, heatmap, mobile
php  scripts/gcal-homologacao.php            # segurança, privacidade, fusos, recorrência
node tools/screenshot/proof-gcal-homologacao.mjs  # contraste WCAG e a11y nos 2 temas
node tools/screenshot/proof-gcal-fase6.mjs   # vínculos com o CRM real
node tools/screenshot/proof-gcal-fase7.mjs   # relatórios, CSV, impressão, Sankey e rede
```

## Resumo da Fase 0

Existia **andaime de entrada** (botão no header → `#/integrations/calendar` → `panel-integration-calendar` →
`api/status/calendar.php`) que terminava num stub respondendo sempre `not_configured`.
Sem Google Cloud, sem OAuth, sem escopos, sem tokens, sem tabelas, sem sync. **≈97% greenfield.**

Reúso aproveitado: **FullCalendar 6.1.21** já instalado e em produção (`panel-pipedrive/src/screens/Agenda.tsx`),
molde de OAuth PKCE + AES-256-GCM do Outlook, molde de sincronização real do Pipedrive.

## Leia antes de escrever qualquer código

Do relatório da Fase 0, os pontos que mudam decisão:

- **§2.4** — `#/panel-X` resolve por convenção no `panel-paths.js` ao vivo; `#/integrations/*` cai em bundle de boot
  que **não se rebuilda**. O módulo novo usa `#/panel-google-calendar`.
- **§2.5** — a sidebar real é `ui_nav_items` (210 linhas), **não** `sidebar_items` (29, legada).
- **§4.1** 🔴 — `CONVERT_TZ` por nome devolve **NULL** neste MySQL (tabelas de fuso vazias). Num calendário isso é
  evento sumindo da grade, sem erro no log. Banco em UTC, conversão só na borda.
- **§4.3/§4.4** — editar arquivo em `api/` ou no header derruba owner+ACL e devolve 500; refazer
  `chown www-data:www-data` + `chmod 640` + `setfacl` depois de cada edição.
- **§4.5** — `api/` está no `.gitignore`; backup em `/backup/` é a única rede.
- **§9** — 6 pendências que dependem exclusivamente do dono, entre elas o grupo da sidebar e o FullCalendar Premium.
