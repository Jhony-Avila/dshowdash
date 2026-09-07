# ART REQUEST — PANTS HERO AUTHORED V1 · V4.2

> **Status:** ART SOURCE REQUIRED (§24/§41/§40/§57-B). Não existe peça inferior
> autoral premium (`roupa_inferior` premium vazio) — a perna hoje é a base do
> corpo (pernas-tubo). Entregar `PANTS_HERO_V1.svg` para o Golden Set (§41).

## Objetivo
Calça com caimento e construção — não perna pintada.

## Canvas / uso
Frame **corpo (240×400)**, camada `roupa_inferior` (z abaixo de `roupa`),
anatomia STANDARD. Consumida como hook de corpo premium; o fit engine adapta
quadril/coxa/joelho (não inventa). `fitClass: REGULAR`.

## Construção / silhueta (§24)
- Cós na cintura, quadril com volume, coxa que afunila até o joelho, break do
  tecido no tornozelo (não tubo reto). Vinco frontal opcional.
- Dobras no joelho e virilha (drape), bolso lateral discreto.
- Barra com espessura; deixa o tornozelo/pé (calçado) aparecer.

## Camadas / canais / material
- `data-hero-layer`: `base` (massa da calça por perna), `mid` (dobras joelho/
  virilha), `light` (crista da coxa), `detail` (cós, costura lateral, bolso),
  `occlusion` (entre as pernas / atrás do joelho).
- `data-channel="roupa"` (usar canal próprio p/ não herdar cor do torso).
- `data-material="denim"` (ou `wool` p/ social).
- `<g data-hero="anchors">`: `cintura, quadrilL, quadrilR, joelhoL, joelhoR, barraL, barraR`.

## Aceitação (§24/§27/§30) — evitar pernas-tubo (CHEAPNESS_TELLS_V42)
- BLACK: duas pernas com coxa/joelho/afunilamento (não tubos). Deixa o calçado
  ler. GRAYSCALE premium. ≥8 ou ART SOURCE.

## Referências / export
Calças estilizadas 2.5D de character creators (não copiar terceiros).
SVG, curvas, sem raster/texto, `data-*`, placeholders de cor.
