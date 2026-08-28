# Track C Mobile — Resultados da Matriz de Viewports

Teste: `mobile-viewport-matrix.mjs` (flag `as6.mobile_studio` ON). Critério por
viewport: composição correta (mobile ≤768w ou ≤520h; desktop no resto), **sem
overflow horizontal**, palco útil visível dentro da largura, nada essencial fora
da tela, zero erro JS.

## Matriz fixa (14/14 ✅)

| Viewport | Classe | Composição | Overflow | Palco | Veredito |
|---|---|---|---|---|---|
| 320×568 | mobile | stack | não | visível | ✅ |
| 360×640 | mobile | stack | não | visível | ✅ |
| 375×667 | mobile | stack | não | visível | ✅ |
| 390×844 | mobile | stack | não | visível | ✅ |
| 393×873 | mobile | stack | não | visível | ✅ |
| 412×915 | mobile | stack | não | visível | ✅ |
| 430×932 | mobile | stack | não | visível | ✅ |
| 667×375 | mobile (baixo) | stack | não | visível | ✅ |
| 844×390 | mobile (baixo) | stack | não | visível | ✅ |
| 768×1024 | mobile (fronteira) | stack | não | visível | ✅ |
| 1024×768 | desktop | grid 5col | não | visível | ✅ |
| 1280×720 | desktop | grid 5col | não | visível | ✅ |
| 1440×900 | desktop | grid 5col | não | visível | ✅ |
| 1600×1000 | desktop | grid 5col | não | visível | ✅ |

## Varredura progressiva 300→1600 (passo 20)

`sem overflow em nenhuma largura` — nenhum ponto de quebra intermediário entre
300 e 1600px. A transição mobile↔desktop ocorre exatamente em 768px (largura)
sem faixa de layout degradado.

## Fronteira (mobile-tablet-layout)

- **768×1024** → mobile (stack). ✅
- **1024×768** → desktop (grid; largura 1024 > 768 e altura 768 > 520). ✅

Confirma a decisão por conteúdo (breakpoint), sem user-agent.

## Menor viewport (mobile-small-screen-320)

320×568: sem overflow, palco útil visível, categorias alcançáveis ≥44px,
catálogo com scroll próprio, troca por toque funcional. ✅
