# Track D — Matriz de Testes

## O que foi validado NESTE ambiente (determinístico)
| Teste | Tipo | Resultado |
|---|---|---|
| `global-mobile-static.mjs` | estático (puro node) | **VERDE** — 24/24 seletores exigem `#app-shell[data-mobile]` (flag OFF = desktop byte a byte) + 7 correções de causa-raiz presentes |
| unit do `mobile-marker` | node (`--experimental-strip-types`) | **VERDE** — largura+altura; paisagem baixa = mobile; flag default OFF ⇒ sem atributo; ON via override ⇒ marca; OFF limpa resíduo |
| `index.ts` (wiring do marcador) | type-strip | **OK** (sintaxe válida) |
| Track C (avatar) reexecutado | headless | **VERDE** — `mobile-save-error-matrix` (11/11 + estado positivo + retry) e `desktop-responsive-regression` (data-mobile ausente 1280/1440/1600) |

## O que exige ambiente saudável / sessão autenticada (PENDENTE — do Jhony)
| Teste | Bloqueio |
|---|---|
| `global-mobile-css.mjs` (harness isolado: overflow, geometria do drawer, alvos 44px, reduced-motion em 320/360/390/430) | Chromium headless instável neste sandbox nesta sessão (governor mata o launch). Harness + teste ENTREGUES para rodar em ambiente saudável |
| Navegação por módulo (14 rotas) | sessão autenticada (auth/CSRF) — do Jhony |
| Matriz de 16 viewports ao vivo no shell real | sessão autenticada + browser |
| Comportamento JS do drawer (Escape/foco/inert), controles do ticker, unificação de registro, menu "Mais" | próxima onda (mudanças de TS compartilhado; validação ao vivo) |

## Matriz de viewports (a rodar no harness/autenticado)
`320×568 · 360×640 · 375×667 · 390×844 · 393×873 · 412×915 · 430×932 ·
667×375 landscape · 844×390 landscape · 768×1024 tablet · 1024×768 tablet ·
1280×720 · 1440×900 · 1600×1000 · 390×844 light · 390×844 reduced-motion`

## Critérios mínimos (alvo)
```ini
DOCUMENT_HORIZONTAL_OVERFLOW=0      # esperado (header contido; guarda 100vw)
MOBILE_VISIBLE_TARGETS_BELOW_44=0   # esperado (min 44 em header/nav/footer)
SIDEBAR_ZERO_RECT_AFTER_OPEN=0      # esperado (drawer min(86vw,320px))
SIDEBAR_HIDDEN_BELOW_500=0          # corrigido (neutraliza display:none)
EMPTY_BOTTOM_NAV_CASES=0            # já populada (MOBILE_ITEMS)
DESKTOP_REGRESSION=ZERO             # PROVADO estaticamente (0 seletor sem marcador)
TRACK_A_REOPENED=NO                 # NO
```
As linhas marcadas "esperado" são confirmadas pela presença/escopo das regras
(prova estática) e ficam com verificação de runtime no harness/autenticado.
