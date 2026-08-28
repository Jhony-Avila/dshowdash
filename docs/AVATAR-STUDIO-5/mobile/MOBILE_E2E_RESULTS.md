# Track C Mobile — Resultados E2E

Runner: `node scripts/avatar/testes/rodar-mobile.mjs` (18 mobile+cert + 4
regressões V4.3). **22/22 verdes.** Não dispara a suíte completa.

## E2E mobile (flag as6.mobile_studio ON) — 18/18 ✅

| Teste | Cobre |
|---|---|
| `mobile-shell-layout` | reflow grid→stack, palco visível, sem overflow |
| `mobile-touch-navigation` | trilho horizontal fino (h≤80), troca por toque |
| `mobile-category-flow` | Rosto/Olhos/Cabelo/Roupa/Calçados alcançáveis, palco reenquadra |
| `mobile-asset-selection` | grade de assets por toque |
| `mobile-color-controls` | swatches/sliders com alvo de toque |
| `mobile-tools-overlays` | ferramenta = full-screen sheet, aria-modal, scroll único, fecha |
| `mobile-save-flow` | barra fixa inferior + POST estado.php, pendente→salvo |
| `mobile-legacy-compat` | avatar legado (camadas) abre/renderiza/salva |
| `mobile-keyboard-viewport` | VisualViewport: barra sai do teclado, campo 16px |
| `mobile-safe-area` | env(safe-area-inset-*) header/barra |
| `mobile-orientation-change` | retrato↔paisagem sem quebrar |
| `mobile-landscape` | paisagem (altura baixa) cabe |
| `mobile-small-screen-320` | pior caso 320×568 |
| `mobile-tablet-layout` | fronteira 768/1024 |
| `mobile-accessibility-smoke` | alvos ≥44, aria, zoom livre, reduced-motion |
| `mobile-performance-smoke` | sem vazamento, churn de resize, palco limitado |
| `mobile-viewport-matrix` | 14 viewports + varredura 300→1600 |
| `desktop-responsive-regression` | flag ON não vaza p/ desktop (1280/1440/1600) |

## Regressões V4.3 (flag OFF) — 4/4 ✅

| Teste | Prova |
|---|---|
| `v43-single2d-parity` | ferramentas clássicas abrem no shell único |
| `v43-single2d-flow` | fluxo entry→edit→tools→SAVE sem sair do shell |
| `v43-legacy-compat` | avatar legado no shell único |
| `v43-category-focus` | Calçados deriva de FOCO_FINO.pes |

## Fluxo funcional completo (entry→save)

Coberto pela combinação: entrada + shell (`mobile-shell-layout`), navegação de
categorias Rosto→Olhos→Cabelo→Roupa→Calçados (`mobile-category-flow`), seleção de
asset (`mobile-asset-selection`), cor/variante (`mobile-color-controls`), abrir/
fechar ferramentas (`mobile-tools-overlays`), salvar + confirmação
(`mobile-save-flow`). Repetido para: avatar novo, avatar legado
(`mobile-legacy-compat`), tela mínima (320), típica (390), paisagem, tablet,
desktop (flag OFF/ON). **Nenhum fluxo sai do 2D único** nem reintroduz "Modo
clássico" (garantido pelas provas `v43-single2d-*`).
