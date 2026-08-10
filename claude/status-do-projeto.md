# Status do Projeto — Avatar Studio (no repo)

> Fonte viva: docs do projeto Claude "Avatar Studio" (04-status-do-projeto).
> Última atualização: **2026-08-09 — MARCO 1220: onda 1121–1220 completa no código** (decisões #113–#123). Em produção: 1111 (DEPLOY_1111_OK).

## Onda 1121–1220 (fechada — decisão #113, mapa no doc 24)

- 1121–1130 tour v2 do layout novo (`as6.tour_v6` #114) · 1131–1140
  motion v2 aceites §568 (`as6.motion_v2` #115) · 1141–1150 Light Mode
  real §578 (`as6.light_v6` #116) · 1151–1160 dock por teclado
  (`as6.nav_dock` #117) · 1161–1170 workers fase 2 export
  (`as6.workers_v2` #118) · 1171–1180 baseline de runtime
  (`as6.perf_baseline` #119) · 1181–1190 CMS RO fase 2 (`as6.cms_ro2`
  #120) · 1191–1200 IA apply parcial (`as6.ia_apply` #121) · 1201–1210
  Universal Avatar Component (`as6.contextos_v6` #122) · 1211–1220
  fechamento (#123).
- Suíte: **130 arquivos; 129/130 na rodada completa** (dock-mag flake
  de carga, verde isolado; VERMELHOS: agora é impresso pelo runner).

## Onda 1111 (entregue — DEPLOY_1111_OK)

- **#112 `as6.dock_inferior`**: shell novo com a estrutura do clássico
  AAA — nav esquerda, preview central com fit-to-view, biblioteca em
  dock horizontal inferior (reuso .avst-trilho + DockAssets), alturas
  compacta/padrão/expandida, toolbar "Cenário", drawer de propriedades,
  bugfix de contraste do tema claro (rampa --as6-* light), QA: eco ×
  stacking do editor 3D + criacao-fina; runner imprime VERMELHOS.
- Suíte: **121/121 verdes** (novo: dock-inferior.mjs; 82 legados fixam
  a flag off = fallback §651).

## Marco atual

- **1110 megas**: mega onda 911–1110 COMPLETA (20 lotes; mapa: doc 22 do
  projeto Claude; decisões #93–#111 em claude/decisoes.md).
- Bloco A (911–1000, DEPLOY_1000_OK em produção): componentização 3b
  (#93) · Inspector contextual (`as6.inspector` #94) · vestuário
  multi-peça (`as6.creator_v6` #95) · dock mag/momentum (`as6.dock_mag`
  #96) · Context Engine (`as6.contexto` #97) · diff no salvar
  (`as6.diff_v6` #98) · Photo Project v2 (`as6.foto_projeto` #99) ·
  Layer System foto (`as6.foto_camadas` #100) · QA (#101).
- Bloco B (1001–1110, 11 commits temáticos):
  1001–1010 golden avatars com baseline sha256 versionada (#102) ·
  1011–1020 virtualização real da grade (`as6.virtual` #103) ·
  1021–1030 Quality Manager central (`as6.quality` #104) · 1031–1040
  touch + drag&drop ao palco (`as6.touch` #105) · 1041–1050 Prompt
  Registry IA versionado em dado (`as6.ia_registry` #106) · 1051–1060
  derivados com reflow (`as6.derivados` #107) · 1061–1070 CMS
  read-only (`as6.cms_ro` #108) · 1071–1080 vida do avatar no shell
  (`as6.vida_shell` #109) · 1081–1090 a11y v3 + i18n (#110) ·
  1091–1100 worker pool (`as6.workers` #111) · 1101–1110 QA/fechamento
  (pan da dock vence drag nativo; testes sem corrida de tempo).
- Suíte: **121 testes** (novos no bloco B: golden-avatars, virtual-as6,
  quality-as6, touch-as6, ia-registry, derivados, cms-ro, vida-shell,
  workers-as6) — verde completa antes da entrega DEPLOY_1110_OK.
- Rollback por feature = desligar a flag `as5.*`/`as6.*` (§651).
- Próximo: validação visual do Jhony (roteiros no doc de validação da
  onda no projeto Claude) → depois, próxima onda a partir do mega 1111
  (candidatos: plano AS6 doc 21 / mapa de lacunas doc 05).

## Validação visual

Pendente do Jhony ao FIM da onda 911–1110 (pedido dele) — roteiros de
1 min por flag consolidados no doc **23-validacao-onda-911-1110** do
projeto Claude.
