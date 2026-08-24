# ART REQUEST — HOODIE HERO AUTHORED V1 · V4.1

> **Status:** ART SOURCE REQUIRED. O hoodie atual ficou **muito boxy** e o fit
> engine não resolve isso — é GARMENT ART (§12). Entregar
> `HOODIE_HERO_AUTHORED_V1.svg`.

## Objetivo
Hoodie com queda e gravidade crível — não um quadrado com mangas.

## Canvas / uso
Frame **corpo (240×400)**, anatomia STANDARD. Consumido como `renderCorpoV2`
premium; fit engine adapta (não inventa).

## Silhueta / construção (§12)
`dropped shoulder · natural sleeve · loose torso · rib hem (recolhe) · hood
FISICAMENTE conectado (não flutuando atrás) · cuff · believable gravity`.
- Ombro caído; manga natural (não slab); torso solto com drape; barra em rib que
  RECOLHE; capuz preso ao decote com volume atrás do pescoço; punho em rib.

## Camadas / canais / material
- `data-hero-layer`: `base` (massa do hoodie), `mid` (drape/dobras), `light`
  (realce), `detail` (bolso canguru, cordão, costura do capuz/rib), `occlusion`
  (sombra do capuz no decote).
- `data-channel="roupa"` no corpo; `data-channel="destaque"` no cordão/detalhe.
- `data-material="cotton"` (ou fleece via `wool`).
- `fitClass`: `OVERSIZED`.
- `<g data-hero="anchors">`: `capuz, ombroL, ombroR, cintura, barra`.

## Aceitação (§12, §27, §30)
- Lê como hoodie com gravidade (ombro caído, capuz conectado, rib hem) — não caixa.
- ≥8 ou ART SOURCE REQUIRED.

## Referências
Hoodies estilizados de character creators; streetwear 2.5D. Não copiar arte de
terceiros.

## Export
SVG, curvas, sem texto/raster, `data-*` presentes, placeholders de cor.
