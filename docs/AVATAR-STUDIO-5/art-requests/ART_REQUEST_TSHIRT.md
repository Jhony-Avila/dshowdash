# ART REQUEST — T-SHIRT HERO AUTHORED V1 · V4.2

> **Status:** ART SOURCE REQUIRED (§24/§40/§57-B). A camiseta atual = **cor de
> torso sobre busto**, sem construção (nota 4/10). Roupa precisa fazer o usuário
> sentir que **veste um personagem** (§24), não que troca a cor do tronco.
> Entregar `TSHIRT_HERO_V1.svg`.

## Objetivo
Camiseta com construção e caimento crível — peça de moda, não retângulo colorido.

## Canvas / uso
Frame **corpo (240×400)**, anatomia STANDARD (âncoras em ART_REQUEST_BODY).
Consumida como `renderCorpoV2` premium; o fit engine ADAPTA ao corpo (não
inventa a peça — §14). `fitClass: REGULAR`.

## Construção / silhueta (§24)
`construction · silhouette · fit · drape · material · detail`.
- Gola (ribbed neckline) com espessura, ombro que cai natural, manga curta com
  bainha, corpo com leve drape (não plano), barra reta com micro-ondulação.
- Dobras onde o tecido junta (axila, cintura) — **não** linhas decorativas soltas.

## Camadas / canais / material
- `data-hero-layer`: `base` (massa da peça), `mid` (dobras/sombra), `light`
  (crista de ombro/peito), `detail` (costura de gola/manga/barra), `occlusion`
  (sombra sob a manga/gola).
- `data-channel="roupa"`; estampa/gola pode usar `destaque`.
- `data-material="cotton"`.
- `<g data-hero="anchors">`: `gola, ombroL, ombroR, cintura, barra`.

## Aceitação (§24/§27/§30) — evitar CHEAPNESS_TELLS_V42
- Lê como camiseta vestida (gola, manga, drape), não caixa/cor de torso.
  BLACK lê a peça. GRAYSCALE premium. ≥8 ou ART SOURCE.

## Referências / export
Streetwear estilizado 2.5D de character creators (não copiar terceiros).
SVG, curvas, sem raster/texto, `data-*`, placeholders de cor.
