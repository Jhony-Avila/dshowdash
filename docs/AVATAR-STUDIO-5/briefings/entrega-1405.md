# Onda 1405 — Fase 0 P0: fundação documental + baseline Before + inventário (MEGA_BRIEFING_01)

> Entrega 2026-08-19. Mapa: claude/41 (decisões #155–#166). Sem mudança de código do painel (docs + scripts + 1 teste); goldens g01–g16 intactos por construção; suíte: subconjunto afetado verde (`docs-aaa.mjs` novo, `golden-avatars.mjs`), 140 testes anteriores inalterados (src intocado).

## Entregue (repo)

| Item | Arquivo | §§ |
|---|---|---|
| Art Bible v1 (direção "Dshow Premium Stylized" 3D + "Premium Stylized 2D/2.5D", 13 capítulos, anti-padrões, tokens, changelog WHY/WHAT/IMPACT) | `docs/AVATAR-STUDIO-5/ART-BIBLE.md` | §129–§130, §168–§172, §3044 |
| Visual QA (18 eixos, distâncias A–D, notas mínimas por nível, Hard/Soft Fail, estados, ficha JSON, checklists por categoria, fluxo, KPIs, dívida visual inicial) | `VISUAL-QA.md` | §4, §12, §32–§37, §65–§67, §2663–§2677 |
| Golden Tests (bytes × visuais × sets de conteúdo; contrato de captura; gates; ownership) | `GOLDEN-TESTS.md` | §24–§26, §35, §133–§140, §2678–§2705 |
| Performance Budgets (tiers ↔ QualityManager; bundle; assets 3D por classe (medir); cena worst-case; 2D; captura; robustez) | `PERFORMANCE-BUDGETS.md` | §28–§30, §147–§153, §2716–§2732, §2937–§2961 |
| Asset Pipeline (12 estágios ↔ ferramenta/onda; naming #166; manifest v2; gates por nível; QA/regressão/perf/telemetria; publish/rollback/canary; pipeline 2D; quick start) | `ASSET-PIPELINE.md` | Parte 11 |
| Renderer Architecture (mapa de camadas 2D/3D/compartilhado; fluxo de render; **auditoria de iluminação** — 3 vocabulários + thumbs sem ACES; "no undocumented magic"; contratos que não mudam; fallbacks) | `RENDERER-ARCHITECTURE.md` | §3044, §3050–§3052, §2030.1 |
| Inventário visual (KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE por família 2D e 3D + dívida por área) | `inventario-visual.md` + `evidencias/inventario-visual.json` (gerado por `scripts/avatar/inventario-visual.mjs`, determinístico) | §15, §61–§63, §159–§167 |
| Baseline Before (14 capturas: shell 2D rosto/busto/corpo/tela/dock + palco 3D × 8 personagens + tela; PNGs fora do git em `saida/baseline-before/<commit>/`; manifesto com sha256/bytes/viewport no git) | `scripts/avatar/baseline-visual/capturar-before.mjs` + `evidencias/baseline-before.json` | §64, §2888–§2890 |
| Briefing + 11 digests + mapa de execução no repo | `docs/AVATAR-STUDIO-5/briefings/` | — |
| Teste executável da fundação (docs exigidos + seções, briefing sha256, digests, decisões no mapa, inventário determinístico, baseline ≥10 capturas 2D+3D) | `scripts/avatar/testes/docs-aaa.mjs` (+ `rodar-todos.mjs`) | §2892–§2893 |

## Achados registrados (entram nas ondas seguintes)

- **27/34 assets 3D com lod0=lod1=lod2** (todos os cabelos UBC, 17 roupas Quaternius, `humano_casual/punk`, `androide`, `animal_pug`) e 7 com lod1=lod0 (bases UBC, `humano_aventureiro/terno`, botas ranger) — gate §631 nunca forçou decimação real → auditoria/republicação na 1409 (★ precisa de ok do Jhony: hashes/manifests mudam).
- 34/34 manifests sem `qualidadeVisual` (entra na 1406: `production` para publicados, `prototype` para `soc_*`).
- Três vocabulários de luz (shell `montar/definirLuz`, PoC `Cena3D.LUZES`, 2D `LUZES_PALCO`) + `gerar-thumbs-3d.mjs` sem ACES/env → `Looks3d.ts` na 1408.
- Skin tint não atinge `MI_Superhero_*` (UBC) → metadata `materiais` no manifest (1408).
- `Palco3d.tsx` reaplica câmera a cada estado → 1419.
- Premium Coverage inicial = 0 %; Visual QA aprovado = 0 %.
- Correção ao #166: sobrancelha usa `sbr_*` (`sob_` já é sobrepeça).

## Decisão operacional desta onda

- Flags da árvore #156 **não** entram em `flags.ts` antes de ter consumidor (evita flags mortas, §2918) — cada uma nasce na onda que a usa (1406+).
- Onda docs/tooling-only: suíte completa anterior (140/140, src intocado) permanece válida; rodados os testes afetados (`docs-aaa`, `golden-avatars`) + `inventario-visual` determinístico. A partir da 1406 (código), suíte completa em background antes de cada entrega, como sempre.

## Próxima: 1406 — qualidade visual como dado + manifest v2 + inventários executáveis (ver mapa claude/41).
