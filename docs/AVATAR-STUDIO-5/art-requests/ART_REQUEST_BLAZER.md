# ART REQUEST — BLAZER HERO AUTHORED V2 (P0 BLOCKER) · V4.1

> **Status:** ART SOURCE REQUIRED. O blazer atual (`rou_hx_blazer` é só
> REFERENCE/PIPELINE PROOF, não ≥8 — §11) e o `rou_px_blazer` procedural têm
> **ombro retangular, largura excessiva, sleeve slab, lapela gráfica, corpo boxy,
> pouca relação com tórax humano** (§9). **O problema não é fit** — é GARMENT ART.
> O fit engine ADAPTA, não INVENTA a alfaiataria (§14). Entregar
> `BLAZER_HERO_AUTHORED_V2.svg`.

## Objetivo
Blazer com alfaiataria de verdade que veste o corpo humano — não uma caixa com
mangas.

## Canvas / uso
Frame **corpo (240×400)**, sobre a anatomia STANDARD (âncoras em ART_REQUEST_BODY).
Consumido como `renderCorpoV2` premium; o fit engine (`silhuetaFit`) só ajusta
anchor/torso width/shoulder/sleeve/deformação controlada — a IDENTIDADE é o asset.

## Silhueta / construção (§10)
Silhueta: `natural shoulder → armhole → chest → waist suppression → front quarters`.
Construção (todas visíveis): `collar · gorge · lapel roll · lapel edge · breast
pocket · button stance · sleeve · cuff · lower pocket · front opening`.
- Ombro NATURAL (não reto/quadrado); manga com queda e cotovelo (não slab);
  lapela com ROLO (volume), não gráfica plana; cintura levemente suprimida;
  front quarters abrindo no quadril.
- **Não usar detalhe para esconder silhueta ruim** (§10).

## Camadas / canais / material
- `data-hero-layer`: `base` (corpo do blazer), `mid` (dobras/sombra do caimento),
  `light` (crista da lapela/ombro), `detail` (lapela edge, botões, pockets,
  costura), `occlusion` (gola sobre o peito), `front` (brilho fino).
- `data-channel="roupa"` no corpo; `data-channel="destaque"` na lapela/forro.
- `data-material="wool"` no corpo.
- `fitClass`: `STRUCTURED`.
- `<g data-hero="anchors">`: `gola, ombroL, ombroR, cintura, bainha`.

## Aceitação (§9, §11, §27, §30)
- Lê como blazer alfaiatado (ombro natural, lapela com rolo, cintura), não caixa.
- Silhueta boa SEM depender de detalhe.
- ≥8. Quando existir, **substituir/depreciar** `rou_hx_blazer` (referência) — não
  promover a referência (§11).

## Referências
Alfaiataria estilizada de character creators premium; blazer masculino/feminino
estilizado 2.5D. Não copiar arte de terceiros.

## Export
SVG, curvas, sem texto/raster, `data-*` presentes, placeholders de cor.
