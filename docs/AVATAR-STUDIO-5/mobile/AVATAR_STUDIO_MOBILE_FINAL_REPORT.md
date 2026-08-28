# Avatar Studio — Relatório Final Mobile (Track C)

**Frente:** Avatar Studio Mobile Adaptation (Track C)
**Base:** `origin/golden/art-wip @ ba4bf4d3` (Track A congelado/aprovado)
**Branch:** `mobile/studio-adaptation` (isolada, commits locais)
**Flag mestre:** `as6.mobile_studio` (default **OFF**)
**Veredito:** `READY_FOR_HUMAN_REVIEW`

## 1. O que foi entregue

Uma composição **responsiva** completa do Avatar Studio para celular/tablet-
retrato, ativada por flag e escopada por atributo — o desktop aprovado segue
byte a byte. Não é um app separado: é o **mesmo** shell, store, motor e save,
com o **layout** refluído quando o viewport é estreito/baixo.

## 2. Marcos (todos verdes, commit local por marco)

| Marco | Commit | Entrega |
|---|---|---|
| M1 | `31e9b700` | fundação responsiva + flag `as6.mobile_studio` |
| M2 | `6bed7e1b` | shell/palco/navegação/catálogo — header compacto + trilho |
| M3 | `bad7f9f3` | ferramentas/overlays como full-screen sheets + bottom dialogs |
| M4 | `28cfa932` | controles de edição, cores e assets por toque |
| M5 | `3e94c7ca` | save fixo + teclado (VisualViewport) + safe-area + orientação |
| M6 | `e09b3995` | compatibilidade legada + correção de empilhamento save/catálogo |
| M7 | `53a1a892` | acessibilidade + alvos de toque + faixa de categorias fina |
| M8 | `f5d1d829` | desempenho e estabilidade (perf/stability smoke) |
| M9 | `86764592` | E2E mobile + regressões V4.3 — runner focado |
| M10 | *(este)* | boards, documentação e auditoria final |

## 3. Testes

```
node scripts/avatar/testes/rodar-mobile.mjs
→ MOBILE: 14/14 · REGRESSÃO V4.3: 4/4 · TOTAL: 18/18 verdes
→ TRACK_A_DESKTOP_REGRESSION=ZERO
```

Os 14 E2E mobile estão registrados em `rodar-todos.mjs` para o run completo
futuro do Jhony. Detalhe em `AVATAR_STUDIO_MOBILE_TEST_MATRIX.md`.

## 4. Bugs reais encontrados e corrigidos (não fabricados)

1. **Empilhamento save/catálogo (M6):** o catálogo interceptava o clique na
   barra de salvar fixa. Flagrado por `mobile-legacy-compat`. Fix de z-index.
2. **Faixa de categorias gigante (M7):** o trilho horizontal media ~148px
   (comendo o palco) por herdar o `padding-bottom` de folga da barra de salvar.
   Flagrado por `mobile-touch-navigation` após o harness ganhar `<meta viewport>`.
   Fix: excluir o trilho dessa regra.
3. **Alvo de toque curto (M7):** categorias de rótulo curto mediam 43px de
   largura. Fix: `min-width:44px`.

## 5. Documentação (docs/AVATAR-STUDIO-5/mobile/)

`AUDIT` · `DESIGN_SPEC` · `RESPONSIVE_ARCHITECTURE` · `TEST_MATRIX` ·
`ACCESSIBILITY_REPORT` · `PERFORMANCE_REPORT` · `BROWSER_CHECKLIST` ·
`DESKTOP_REGRESSION_REPORT` · `FINAL_REPORT` (este).

## 6. Boards de evidência (15)

Gerados por `scripts/avatar/testes/gerar-boards-mobile.mjs` em `OUTPKG`
(default `/tmp/mobile/pkg`, fora do git — entram no pacote de entrega):
`01_MOBILE_VIEWPORT_MATRIX` … `15_MOBILE_FINAL_PRODUCT_FLOW`.

## 7. Precisa do Jhony (não autônomo)

- **Validação visual e de sessão autenticada** em device real (iOS/Android):
  leitor de tela, teclado físico, notch em paisagem, salvar autenticado.
- **Decisão de rollout:** push/merge/deploy e gravação de goldens **não** foram
  feitos (travas abaixo). A branch está pronta para revisão.

## 8. Estado final (travas respeitadas)

```
MAIN_TOUCHED=NO   PUSH=NO   MERGE=NO   DEPLOY=NO   ROLLOUT=NO
GOLDENS_RECORDED=NO   FULL_SUITE_RUN=NO   TRACK_A_DESKTOP_REGRESSION=ZERO
TRACK_A_REOPENED=NO   V44_STARTED=NO
BRANCH=mobile/studio-adaptation   FLAG=as6.mobile_studio(OFF)
VEREDITO=READY_FOR_HUMAN_REVIEW
```
