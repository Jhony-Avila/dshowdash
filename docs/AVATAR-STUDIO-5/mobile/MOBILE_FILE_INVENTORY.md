# Track C Mobile — Inventário de Arquivos

Diff `ba4bf4d3..HEAD` (candidato colado `31caaf8e` + testes de certificação locais `24094365`). Status: A=novo, M=modificado.

## Produto (fonte mobile) — modificações mínimas e escopadas

| Status | Arquivo | Papel |
|---|---|---|
| M | src/nucleo/flags.ts | +as6.mobile_studio (default OFF) + dependência |
| A | src/workspace/mobileStudio.ts | useMobileStudio() + useTecladoVirtual() |
| M | src/shell/ShellStudio.tsx | aplica data-mobile na raiz do shell |
| A | src/styles/mobile.css | todo CSS mobile, escopado em .avst5-shell[data-mobile] |
| M | src/app/App.tsx | import de styles/mobile.css |

## Infra de teste / harness

| Status | Arquivo |
|---|---|
| M | scripts/avatar/gerar-harness.mjs |
| A | scripts/avatar/testes/desktop-responsive-regression.mjs |
| A | scripts/avatar/testes/gerar-boards-mobile.mjs |
| A | scripts/avatar/testes/mobile-accessibility-smoke.mjs |
| A | scripts/avatar/testes/mobile-asset-selection.mjs |
| A | scripts/avatar/testes/mobile-category-flow.mjs |
| A | scripts/avatar/testes/mobile-color-controls.mjs |
| A | scripts/avatar/testes/mobile-keyboard-viewport.mjs |
| A | scripts/avatar/testes/mobile-landscape.mjs |
| A | scripts/avatar/testes/mobile-legacy-compat.mjs |
| A | scripts/avatar/testes/mobile-orientation-change.mjs |
| A | scripts/avatar/testes/mobile-performance-smoke.mjs |
| A | scripts/avatar/testes/mobile-safe-area.mjs |
| A | scripts/avatar/testes/mobile-save-flow.mjs |
| A | scripts/avatar/testes/mobile-shell-layout.mjs |
| A | scripts/avatar/testes/mobile-small-screen-320.mjs |
| A | scripts/avatar/testes/mobile-tablet-layout.mjs |
| A | scripts/avatar/testes/mobile-tools-overlays.mjs |
| A | scripts/avatar/testes/mobile-touch-navigation.mjs |
| A | scripts/avatar/testes/mobile-viewport-matrix.mjs |
| A | scripts/avatar/testes/rodar-mobile.mjs |
| M | scripts/avatar/testes/rodar-todos.mjs |

## Documentação (docs/AVATAR-STUDIO-5/mobile/)

| Status | Arquivo |
|---|---|
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_ACCESSIBILITY_REPORT.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_AUDIT.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_BROWSER_CHECKLIST.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_DESIGN_SPEC.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_DESKTOP_REGRESSION_REPORT.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_FINAL_REPORT.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_PERFORMANCE_REPORT.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_RESPONSIVE_ARCHITECTURE.md |
| A | docs/AVATAR-STUDIO-5/mobile/AVATAR_STUDIO_MOBILE_TEST_MATRIX.md |

## Hashes SHA-256 (fonte Track C, no HEAD local)

```
b874666fb93b99d1df70e3dca1653fbebc15f3d74ab53ef6303088b8bae54fb6  src/nucleo/flags.ts
d0ae562085c3b2a621259a2af9aac7eb865faf7df43aca94d21ff230f398c6dc  src/workspace/mobileStudio.ts
e31699532e23b91c4dbb9b4439b934ed79f50dfdd542d3bbffa7f83c1c9e2a1e  src/shell/ShellStudio.tsx
1f611aa99afb2828ee8d2cf195cb50a787b943ca27c748620fa84b9e447d3bb9  src/styles/mobile.css
8547c6b8460c925fd20fec21e9c2f9cb0fbd66753a92e2665db60ca76b5096bd  src/app/App.tsx
```

## Boards de certificação (OUTPKG, fora do git)

15 PNGs 01_MOBILE_VIEWPORT_MATRIX … 15_MOBILE_FINAL_PRODUCT_FLOW gerados por `gerar-boards-mobile-cert.mjs`.

## Verificação de intocados (diff vazio)

motor/render/partes/domain e api/avatar: **sem alterações** no diff ba4bf4d3..HEAD.
