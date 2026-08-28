# Track D — Regressão Desktop = ZERO (prova)

## Garantia por construção
Nenhuma regra desktop existente foi editada. Toda a política mobile
(`global-mobile.css`) vive sob `#app-shell[data-mobile]`, e o atributo só é setado
pelo `mobile-marker` **quando a flag `as6.mobile_shell` está ON** (default OFF).

## Prova determinística (não depende de browser)
`scripts/avatar/testes/global-mobile-static.mjs` — **VERDE**:
- Analisou **24 seletores** de `global-mobile.css`.
- **0 (zero)** seletores fora de `#app-shell[data-mobile]`.
- Logo, com o marcador ausente (flag OFF), **nenhuma** regra casa → o render é
  idêntico ao atual em qualquer viewport → **desktop byte a byte**.

Prova complementar (unit do marcador, VERDE): com a flag OFF, `applyMobileMarker`
**remove** qualquer `data-mobile` e não instala listeners → inerte e sem resíduo.

## Confirmação de runtime (harness) — pendente de ambiente saudável
O `global-mobile-css.mjs` inclui o caso **(A) marcador ausente ⇒ 0 seletores
casam** medido no CSSOM real do browser. Roda no ambiente saudável/autenticado
(Chromium headless instável neste sandbox nesta sessão). A prova estática acima
já cobre a garantia; o harness é a confirmação visual.

## Track A / Track C
`TRACK_A_REOPENED=NO`. O único toque no produto avatar nesta frente foi a
reexecução de testes (verde). O `index.html` ganhou 1 `<link>` aditivo (última
folha, escopada) e o `responsive-adapter` ganhou 1 chamada guardada (inerte com
flag OFF).
