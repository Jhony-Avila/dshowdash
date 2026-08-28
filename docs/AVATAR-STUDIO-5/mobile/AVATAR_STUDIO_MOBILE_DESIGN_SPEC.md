# Avatar Studio — Design Spec Mobile (Track C)

## 1. Breakpoints (derivados do conteúdo)

| Constante | Valor | Racional |
|---|---|---|
| `MOBILE_MAX_W` | 768px | abaixo do tablet-portrait o grid de 5 col não cabe |
| `MOBILE_MAX_H` | 520px | celular em paisagem (altura baixa) |
| `MOBILE_MEDIA` | `(max-width:768px),(max-height:520px)` | estreito **ou** baixo |

Tablet em paisagem (1024×768) e desktop seguem no grid aprovado. Nada de
user-agent — só `matchMedia` reagindo a resize/orientação.

## 2. Matriz de viewports validada

320×568 · 360×800 · 375×667 · 390×844 · 414×896 (retrato) · 768×1024 (tablet) ·
844×390 · 667×375 (paisagem). Board `01_MOBILE_VIEWPORT_MATRIX.png`.

## 3. Layout mobile (retrato)

```
┌─────────────────────────────┐  header compacto (1 linha, ações roláveis)
├─────────────────────────────┤
│           PALCO 2D          │  sticky topo · clamp(200px, 42dvh, 52dvh)
│      (emoldurado, 1:1)      │
├─────────────────────────────┤
│  ‹ Rosto  Cabelo  Olhos  ›  │  trilho horizontal sticky (snap, fade)
├─────────────────────────────┤
│          CATÁLOGO           │  scroll próprio · grade 2 col
│        (rolável)            │
├─────────────────────────────┤
│        [ Salvar ]           │  barra fixa inferior (safe-area)
└─────────────────────────────┘
```

Ordem de leitura (flex `order`): palco (-1) → trilho (0) → catálogo (1). A barra
de salvar é `position: fixed` (não entra no fluxo).

## 4. Paisagem (altura ≤520px)

Palco `clamp(140px, 46dvh, 60dvh)`, header com padding-top reduzido, restante
igual. Nada de scroll horizontal de página.

## 5. Tokens de toque

| Elemento | Alvo | Observação |
|---|---|---|
| Botões/links/categorias | ≥44×44 | `min-width` **e** `min-height` |
| Ações do header | ≥40px | faixa rolável horizontal |
| Swatches de cor | 34px (visual) + alvo | `box-shadow` marca o ativo |
| Sliders | trilho 6px, thumb 26px, área 44px | `touch-action: pan-y` |
| Chips | ≥40px | `touch-action: manipulation` |

## 6. Ferramentas & diálogos

Ferramentas clássicas (Coleções/Conquistas/IA/Vitrine/Arquétipos/Títulos/
Presets/Foto/Histórico) → **full-screen sheet** (`role=dialog`, `aria-modal`,
cabeçalho sticky com título + fechar ≥44px, corpo com scroll único). Diálogos
pequenos (conflito/confirmação) → **bottom sheet** com cantos arredondados e
ações sticky.

## 7. Teclado & safe-area

Campos `font-size:16px` (iOS não dá zoom), `scroll-margin` para o browser rolar
o campo focado; `VisualViewport` publica `--avst-kb` e `data-avst-kb` — a barra
de salvar sai de cima do teclado. `env(safe-area-inset-*)` (fallback 0) no
header e na barra inferior.
