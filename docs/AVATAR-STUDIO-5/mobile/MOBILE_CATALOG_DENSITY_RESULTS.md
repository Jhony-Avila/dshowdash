# Track C Mobile — Densidade do Catálogo (Marco 11)

Problema (board 04 original): abas+filtros+busca do catálogo consumiam ~155px,
empurrando os assets abaixo da dobra. 0 cards significativos em 360×640.

## Solução (só layout, data-mobile)

- Cabeçalho do catálogo compacto: linhas de chips que QUEBRAVAM (`.avst5-abas`,
  `.avst6-dockchips`, `.avst5-chips`, `.avst-ft-chips`) viram UMA faixa
  horizontal rolável (achável por scroll, alvo ≥44 mantido); padding reduzido.
  Cabeçalho 155→57px.
- Palco menor: `clamp(180px,36dvh,44dvh)`; `clamp(150px,28dvh,34dvh)` em telas
  <680px de altura (retrato).
- Trilho de categorias travado em faixa fina (≤60px) — o min-width dos alvos de
  toque + stretch tinha esticado os grupos.

## Resultado (mobile-catalog-density.mjs)

```
ASSETS_VISIBLE_ABOVE_FOLD=YES  (≥1 linha significativa em 360×640, 390×844, 430×932)
BUSCA_ACESSIVEL=YES  FILTROS_ENCONTRAVEIS=YES  ALVOS>=44=YES
OVERFLOW=NONE  ESTADO_PRESERVADO=YES (categoria/filtro após abrir/recolher)
DESKTOP=INTOCADO
```

Board `17_MOBILE_CATALOG_DENSITY_BEFORE_AFTER`.
