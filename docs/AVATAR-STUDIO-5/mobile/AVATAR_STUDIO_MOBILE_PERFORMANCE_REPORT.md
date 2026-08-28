# Avatar Studio — Relatório de Desempenho/Estabilidade Mobile (Track C · Marco 8)

Verificado por `mobile-performance-smoke.mjs`. Headless não é fiel a FPS de
device, então o smoke mede **estabilidade verificável**, não benchmark de GPU.

## 1. Resultado

| Verificação | Status | Medição |
|---|---|---|
| Laço de interação sem vazamento de DOM | ✅ | categorias 2× + ferramenta 3×; Δnós dentro do orçamento |
| Overlay não sobra ao fim do laço | ✅ | `.avst5-ferr-modal` ausente |
| Churn de resize/orientação sem lançar | ✅ | 6 viewports em sequência, 0 erro JS |
| `data-mobile` alterna corretamente | ✅ | mobile em 375×667, off em 1280×900 |
| Sem overflow horizontal após churn | ✅ | `scrollWidth ≤ innerWidth` |
| Palco 2D com nós limitados | ✅ | 96 nós SVG (< 4000, sem cena duplicada) |
| Zero erro JS no percurso | ✅ | — |

## 2. Por que a composição é barata

- **Só layout**: nenhuma cópia de store/motor/save. A troca mobile↔desktop não
  recria estado — muda apenas o atributo `data-mobile` e o CSS que aplica.
- **Palco 2D** (produto único), não WebGL: sem custo de GPU/LOD no celular.
- **Sticky/fixed** em vez de JS de scroll; `overscroll-behavior: contain` evita
  reflow de página; `touch-action` remove o delay de 300ms.
- **VisualViewport** com evento nativo (sem `setTimeout` em polling) para o
  teclado — listener adicionado só quando a composição mobile está ativa e
  removido no cleanup.

## 3. Orçamentos herdados

Os budgets de asset/render 2D do produto (ver `PERFORMANCE-BUDGETS.md`) não
mudam: os mesmos SVGs, o mesmo motor. A adaptação mobile não adiciona assets nem
re-serializa nada.

## 4. Fora de escopo (validação humana)

FPS real de scroll, tempo de interação em 3G e consumo de bateria exigem device
físico e são item da validação final do Jhony. O smoke garante ausência de
regressão estrutural (vazamento, overflow, erro), não performance de campo.
