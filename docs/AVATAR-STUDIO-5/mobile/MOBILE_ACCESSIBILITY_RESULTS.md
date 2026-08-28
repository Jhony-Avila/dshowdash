# Track C Mobile — Resultados de Acessibilidade

Teste: `mobile-accessibility-smoke.mjs` + inspeção de código. Escopo: composição
mobile (`data-mobile`). Motor e componentes reusados de Track A não alterados.

## Automatizado (✅)

| Critério (WCAG) | Status | Evidência |
|---|---|---|
| Alvos de toque ≥44×44 (2.5.5) | ✅ | categorias 44, salvar 44, fechar 44, sliders 44 |
| Categoria ativa expõe estado (4.1.2) | ✅ | `aria-current="true"` em `.avst5-cat` ativa |
| Navegação rotulada (1.3.1) | ✅ | `<nav aria-label="Categorias">` |
| Zoom não desabilitado (1.4.4) | ✅ | viewport `width=device-width, initial-scale=1.0` |
| Diálogo acessível (4.1.2) | ✅ | `role="dialog"` + `aria-modal="true"` + `aria-label` |
| Fechar nomeado (4.1.2) | ✅ | `aria-label="Fechar"`, ≥44px |
| Todo botão visível com nome | ✅ | 0 botões sem nome |
| Movimento reduzido (2.3.3) | ✅ | `@media (prefers-reduced-motion: reduce)` |
| Independência de hover | ✅ | `@media (hover:none)` + `:hover{transform:none}` |

## Medição de alvos (390×844, flag ON)

| Elemento | Menor dimensão | OK |
|---|---|---|
| Categorias (trilho) | 44px (min-width+min-height) | ✅ |
| Ações do header | 40px | ✅ (faixa rolável) |
| Botão salvar | 44px | ✅ |
| Fechar da ferramenta | 44px | ✅ |

## Pendente de device real (humano)

- **Leitor de tela** real (VoiceOver/TalkBack): ordem de leitura, anúncios de
  troca de categoria, foco em diálogo.
- **Navegação por Switch / teclado externo** em iOS/Android.
- **Contraste AA** dos tokens: herança do tema aprovado (Track A), não
  reavaliado nesta rodada.
- **Zoom 200% / texto ampliado** em Safari/Chrome mobile reais.

Ver checklist em `MOBILE_REAL_DEVICE_TEST_KIT.md`.
