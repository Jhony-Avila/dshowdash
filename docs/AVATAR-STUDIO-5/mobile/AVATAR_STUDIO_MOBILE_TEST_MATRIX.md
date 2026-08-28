# Avatar Studio — Matriz de Testes Mobile (Track C)

Runner focado: `node scripts/avatar/testes/rodar-mobile.mjs` (14 E2E mobile + 4
regressões V4.3, **sem** disparar a suíte inteira). Os 14 mobile também estão
registrados em `rodar-todos.mjs` para o run completo futuro.

## 1. E2E da composição mobile (flag as6.mobile_studio ON)

| # | Teste | Marco | O que prova |
|---|---|---|---|
| 1 | `mobile-shell-layout` | M1/M2 | grid→stack, palco visível, sem overflow horizontal |
| 2 | `mobile-touch-navigation` | M2 | trilho horizontal fino (h≤80), troca por toque |
| 3 | `mobile-category-flow` | M2 | cada categoria essencial alcançável, palco reenquadra |
| 4 | `mobile-tools-overlays` | M3 | ferramenta = sheet full-screen, `aria-modal`, scroll único, fecha |
| 5 | `mobile-asset-selection` | M4 | grade de assets por toque |
| 6 | `mobile-color-controls` | M4 | swatches/sliders com alvo de toque (quando presentes) |
| 7 | `mobile-save-flow` | M5 | barra de salvar fixa inferior + POST real ao estado |
| 8 | `mobile-safe-area` | M5 | `env(safe-area-inset-*)` respeitada no header/barra |
| 9 | `mobile-orientation-change` | M5 | retrato↔paisagem sem quebrar layout |
| 10 | `mobile-landscape` | M5 | paisagem (altura baixa) cabe, palco menor |
| 11 | `mobile-keyboard-viewport` | M5 | VisualViewport: barra sai do teclado, campo 16px |
| 12 | `mobile-legacy-compat` | M6 | avatar legado (camadas) abre/renderiza/salva no mobile |
| 13 | `mobile-accessibility-smoke` | M7 | alvos ≥44, aria-current, zoom livre, reduced-motion, nomes |
| 14 | `mobile-performance-smoke` | M8 | sem vazamento de DOM, churn de resize, palco limitado |

## 2. Regressão do desktop aprovado (flag OFF — Track A / V4.3)

| Teste | Prova |
|---|---|
| `v43-single2d-parity` | ferramentas clássicas abrem DENTRO do shell único |
| `v43-single2d-flow` | fluxo entry→edit→tools→SAVE sem sair do shell |
| `v43-legacy-compat` | avatar legado abre/renderiza/salva no shell único |
| `v43-category-focus` | Calçados deriva de FOCO_FINO.pes (fonte única) |

Rodam com a flag `as6.mobile_studio` **ausente** → `data-mobile` nunca é aplicado
→ CSS mobile inerte → desktop byte a byte.

## 3. Resultado consolidado

```
MOBILE: 14/14 · REGRESSÃO V4.3: 4/4
TOTAL: 18/18 verdes · TRACK_A_DESKTOP_REGRESSION=ZERO
```

## 4. Infra (caminhos importam)

1. `npx vite build` **dentro** de `public/components/panels/panel-avatar-studio/`
2. `node scripts/avatar/gerar-harness.mjs avatar` **da raiz** do repo
3. `python3 -m http.server 8901` de `public/`
4. `PW_CHROME=$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)`

O harness passou a incluir `<meta name="viewport">` do produto (M7) para que os
testes mobile reproduzam fielmente a escala do celular.
