# Avatar Studio — Relatório de Acessibilidade Mobile (Track C · Marco 7)

Verificado por `mobile-accessibility-smoke.mjs` + inspeção de código. Escopo: a
composição mobile (`data-mobile`). O motor e os componentes reusados de Track A
não foram alterados.

## 1. Resultado

| Critério (WCAG ref.) | Status | Evidência |
|---|---|---|
| Alvos de toque ≥44px (2.5.5) | ✅ | categorias, ações, fechar, save, sliders |
| Categoria ativa expõe estado (4.1.2) | ✅ | `aria-current="true"` em `.avst5-cat` ativa |
| Região de navegação rotulada (1.3.1) | ✅ | `<nav aria-label="Categorias">` |
| Zoom não desabilitado (1.4.4) | ✅ | viewport `width=device-width, initial-scale=1.0` |
| Diálogo acessível (4.1.2) | ✅ | `role="dialog"` + `aria-modal="true"` + `aria-label` |
| Fechar com nome acessível (4.1.2) | ✅ | `aria-label="Fechar"`, ≥44px |
| Todo botão visível tem nome (4.1.2) | ✅ | texto / `aria-label` / `title` — 0 sem nome |
| Movimento reduzido (2.3.3) | ✅ | `@media (prefers-reduced-motion: reduce)` |

## 2. Ajustes do Marco 7

- **`min-width:44px`** em `.avst5-cat` no trilho: rótulos curtos ("Boca",
  "Rosto") mediam 43px de largura; agora ≥44px nos dois eixos.
- **`<meta viewport>`** adicionada ao harness de teste, espelhando o produto —
  os alvos de toque passam a ser medidos na escala real do celular.
- **Trilho de categorias excluído** do `padding-bottom` da barra de salvar:
  a faixa media ~148px (comendo o palco); agora é uma faixa fina (~73px).

Nenhum foi *gambiarra*: cada um corrige um defeito real que um teste flagrou.

## 3. Já herdado dos Marcos 1-5 (confirmado, não recriado)

`touch-action: manipulation` (sem delay de 300ms), `@media (hover:none)` (não
depender de hover no toque), campos `font-size:16px` + `scroll-margin`, foco
rolando para a área visível via VisualViewport, `:focus-visible` global do
`estudio.css` (aplica também no mobile).

## 4. Fora de escopo (registrado para o Jhony)

- **Leitor de tela real** (VoiceOver/TalkBack) e **navegação por Switch** exigem
  device físico — validação humana (o harness headless não substitui).
- **Contraste AA** dos tokens de cor é herança do tema aprovado (Track A); não
  foi reavaliado aqui.
