# Avatar Studio — Arquitetura Responsiva Mobile (Track C)

## 1. Princípio: uma decisão, um atributo

Toda a composição mobile pende de **uma** condição, avaliada num só lugar:

```
composição mobile ATIVA  ⇔  flag('as6.mobile_studio') === true
                          ∧  viewport estreito/baixo (matchMedia)
```

Quando ativa, `ShellStudio` põe `data-mobile="1"` na raiz `.avst5-shell`. **Todo**
o `mobile.css` é escopado em `.avst5-shell[data-mobile]`. Sem o atributo — que é
o caso do desktop e o caso da flag OFF — **nenhuma** regra do arquivo aplica.
Consequência: o desktop aprovado é byte a byte, e o rollback é desligar a flag.

## 2. Peças

| Arquivo | Papel |
|---|---|
| `src/nucleo/flags.ts` | `as6.mobile_studio: false` em PADROES; dependência `['as5.novo_shell']` |
| `src/workspace/mobileStudio.ts` | `useMobileStudio()` (matchMedia) + `useTecladoVirtual()` (VisualViewport) |
| `src/shell/ShellStudio.tsx` | chama os hooks; aplica `data-mobile` na raiz |
| `src/app/App.tsx` | importa `styles/mobile.css` |
| `src/styles/mobile.css` | **único** arquivo de layout mobile, todo escopado |

## 3. Fluxo da flag (herda o sistema existente)

`flag()` resolve por PADROES → `localStorage['dshow.avst.flags.v1']` → remotas.
`as6.mobile_studio` depende de `as5.novo_shell` (DEPENDENCIAS_FLAGS): só vale se
o shell novo estiver ligado. Desconhecida = OFF. Os testes semeiam a flag via
`localStorage` no `init` do contexto.

## 4. `useMobileStudio()`

`useState(medirEstreito)` + `useEffect` com listeners `change` (matchMedia),
`resize` e `orientationchange`. Retorna `flag('as6.mobile_studio') && estreito`.
Reversível em runtime: girar o device ou redimensionar a janela liga/desliga a
composição sem recriar store nem motor.

## 5. `useTecladoVirtual(ativo)`

No-op se inativo ou sem `VisualViewport`. Enquanto ativo: mede
`innerHeight − vv.height − vv.offsetTop`, publica `--avst-kb` no `<html>` e marca
`data-avst-kb` quando o teclado passa de 80px. O CSS usa isso para deslocar a
barra de salvar (`translateY(140%)`) e liberar o campo.

## 6. Técnicas de CSS (sem tocar lógica)

- Grid → flex coluna via `grid-template-columns:none` + `flex-direction:column`.
- `order` reposiciona palco/trilho/catálogo sem mexer no DOM.
- `100dvh/svh` com fallback `100vh`; `@supports (height:100dvh)`.
- `env(safe-area-inset-*)` com fallback 0 (nunca quebra fora de iOS).
- Trilho horizontal: `overflow-x:auto` + `scroll-snap` + máscara de fade.
- Barra de salvar `position:fixed` + z-index acima do catálogo (z:0).
- Zero `!important` em cascata; zero duplicação de store/motor/save.

## 7. Empilhamento (z-index) — mobile

| Camada | z-index | Nota |
|---|---|---|
| Barra de salvar (fixed) | 60 | sempre clicável |
| Palco/viewport (sticky) | 6 | contém a barra no DOM |
| Trilho de categorias (sticky) | 2 | gruda abaixo do palco |
| Catálogo (painel) | 0 | não cobre a barra fixa |

Bug corrigido no Marco 6: o catálogo (z herdado) interceptava o clique na barra
de salvar. Fix: viewport 2→6, salvar 40→60, painel `z-index:0` explícito. Prova:
`mobile-legacy-compat` + `mobile-save-flow`.
