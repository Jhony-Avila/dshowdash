# Onda 1406 — Fase 0 P0: qualidade visual como DADO + manifest v2 + KPI (MEGA_BRIEFING_01 §68–§69, §161, §1419–§1421, §2576–§2590, §3035–§3040; decisão #157)

> Entrega 2026-08-19. Mapa: claude/41. Flag-pai da frente AAA nasce aqui: `as6.avatar_visual_v2` (**OFF** — muda UI visível; liga após validação visual do Jhony). Goldens g01–g16 intactos; suíte completa em background antes da entrega.

## Entregue

| # | Item | Arquivos | §§ |
|---|---|---|---|
| 1 | **Registry de qualidade visual** em dados: escada Q0–Q4 (`prototype\|legacy\|production\|premium\|hero`), `statusQaVisual`, `versaoVisual`, `ehDestacavel()` (nunca prototype; legado com sucessor não destaca), `atingeNivel()`, `coberturaQualidade()`, `SUCESSOR_PREMIUM` (vazio até 1411+); curadoria por id/prefixo (`soc_*`/`prop_*` = prototype; `<pfx>_px_*` = premium); padrão do publicado = `production` | `src/services/QualidadeVisual.ts` | §13, §62, §68–§69, §161, §3022 |
| 2 | `MetadadosAssets.metadadosDe()` expõe `qualidadeVisual/statusQaVisual/versaoVisual`; tag `#<nível>` só com a flag | `src/services/MetadadosAssets.ts` | §69, §227 |
| 3 | Drawer do shell: linha "Qualidade: Produção · QA pendente · visual v1.0" (`det-qualidade`) com a flag | `src/shell/DetalheAsset.tsx` | §102–§103 |
| 4 | PoC Estúdio 3D: placeholders `prototype` (`ITENS_SOCKET`) escondidos com a flag (exceto modo Dev `as5.hud3d` ou item já equipado) | `src/poc3d/Estudio3D.tsx` | §1419–§1421, §3031 |
| 5 | Flag-pai `as6.avatar_visual_v2` (OFF) | `src/nucleo/flags.ts` | §2917–§2920, #156 |
| 6 | Ponte semântica `SOCKET_3D_POR_SLOT` (15 slots finos ↔ 14 sockets; `slotPorSocket3d`, `SOCKETS_SEM_SLOT_2D`) | `src/workspace/acessorios.ts` | §1227–§1228 |
| 7 | **Manifest §517 v2**: `schema-manifest-v2.json` (formato próprio sem lib: tipos/enums/obrigatórios/`premium`/naming #166) + `validarSchemaV2()` no validador (desconhecido = aviso; enum/tipo = erro; premium exige `qaVisual/bounds/materiais/artBibleVersion`; premium com QA pendente avisa o gate §2677; naming só para v2; `deprecated` sem `successorId` avisa); `medidas.schemaVersion` | `scripts/avatar/assets3d/schema-manifest-v2.json`, `validar-asset.mjs` | §2576–§2590, §2583, §2589 |
| 8 | `migrar-manifest-v2.mjs` (aditivo, idempotente) → **34/34 manifests** carimbados: `schemaVersion 2`, `qualidadeVisual production`, `qaVisual {pending}`, `visibility production`, `renderers ['3d']`, `deprecated false` (GLBs/hashes intocados) | `scripts/avatar/assets3d/migrar-manifest-v2.mjs`, `public/assets/avatars/3d/**/manifest.json` | §2576 |
| 9 | `gerar-indice-3d.mjs` propaga `qualidadeVisual/visibility/deprecated/successorId` + **ID duplicado = fail**; `index.json` (personagens/partes) regenerados; tipos `ManifestPersonagem3d`/`EntradaIndice3d`/`EntradaIndiceParte` | `scripts/avatar/assets3d/gerar-indice-3d.mjs`, `src/services/Personagens3d.ts`, `Partes3d.ts` | §2585, §2759–§2764 |
| 10 | **KPI**: `relatorio.mjs` → `docs/AVATAR-STUDIO-5/evidencias/kpi-visual.json` (Premium Coverage % 2D/3D, cobertura por nível × categoria/tipo, QA %, Quality Coverage Matrix, visual debt por área) — determinístico | `scripts/avatar/qa-visual/relatorio.mjs` | §157, §3035–§3040 |
| 11 | Teste `qualidade-visual.mjs` (A: cobertura 100 %, prototypes, metadados, slot↔socket, schema v2 nos 34 + 6 fixtures, ids únicos entre pastas, index propagado, KPI determinístico; B: drawer/PoC com flag ON e OFF) + `rodar-todos` | `scripts/avatar/testes/qualidade-visual.mjs` | — |

## Estado dos KPIs (ponto zero)

Premium Coverage: **0 %** (2D 393 itens · 3D 34) · production-ready 100 % · Visual QA aprovado 0 % · placeholders PoC 9/9 prototype.

## Movido (sem dados mortos — cada registry nasce na onda que o consome)

`FaceFamilies` → 1412 · `FamiliasCabelo` → 1413 · `Vestuario` → 1415 · `acessoriosRegistry` (occupancy/fit/classe) → 1416 · coluna de qualidade no CMS RO → QaStudio (1410).

## Observações

- Validador segue aprovando os 34 assets (manifests v2 sem avisos de desconhecido/naming); `animal_pug` mantém aviso pré-existente de altura (57342 m — unidade da fonte) → entra na normalização (1409).
- `flag()` em Node (sem localStorage) resolve para o padrão → derivações em dados são testáveis sem navegador.
- Gate de peso: entry 446/460 KB, DetalheAsset 13/15 KB, Estudio3D 38/50 KB — sem atualização de `pesos-esperados.json`.

## Próxima: 1407 — regressão visual (matriz de screenshots 2D+3D, captura determinística, diff perceptual, `golden-visual.json`, `--aprovar`, affected).
