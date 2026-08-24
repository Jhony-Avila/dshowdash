# ART REQUEST — FACE HERO AUTHORED V1 (M/F) · V4.2

> **Status:** ART SOURCE REQUIRED (§21/§40/§57-B). O rosto atual tem **olhos de
> boneca, nariz-símbolo, orelhas circulares e features flutuando sobre um oval**
> (nota 4/10 — ver `06_V42_FACE_MF.png`). Não é decoração que resolve: é
> **estrutura** (§22). Entregar `FACE_HERO_MALE_V1.svg` e `FACE_HERO_FEMALE_V1.svg`.

## Objetivo
Cabeça estruturada de character creator premium — não features sobre oval.

## Canvas / uso
Frame **cabeça (240×240)**. Consumido como `base` premium (bas_px_*) + camadas
faciais (olhos/nariz/boca/sobrancelha/orelha). Close do stage usa foco
`52 26 132 132`. A base define a MASSA craniana; as partes assentam nela.

## Construção obrigatória (§21) — por massas, não por linhas
`cranium · temple · brow ridge · eye sockets · cheeks (zygomatic) · midface ·
jaw · chin · ears`. Depois: eyes/nose/mouth **assentados nas órbitas/planos**,
não colados no oval.
- **Olhos:** pálpebra sup./inf. com espessura, canto interno/externo, íris
  parcialmente coberta pela pálpebra (não círculo pleno = "boneca").
- **Nariz:** ponte + dorso + ponta + asas com plano de luz/sombra (não um traço).
- **Orelhas:** hélice/anti-hélice/lóbulo (não círculo).
- **Boca:** lábio sup./inf. com volume e vermilion; canto real.
- **M vs F:** M = mandíbula mais larga, brow ridge mais forte, pescoço mais
  grosso; F = midface mais suave, queixo menor, maçã do rosto mais alta.

## Camadas / canais / material
- `data-hero-layer`: `base` (massa/planos do crânio), `mid` (sombra de socket/
  bochecha/mandíbula), `light` (testa/maçã/dorso do nariz), `detail` (linha de
  cílios, sulco naso-labial discreto), `occlusion` (sob o queixo/orelha).
- `data-channel="pele"`; olhos/lábio podem usar `destaque`.
- `data-material="skin"`.
- `<g data-hero="anchors">`: `topo, olhoL, olhoR, nariz, boca, queixo, orelhaL, orelhaR`.

## Aceitação (§21/§22/§27/§30) — evitar CHEAPNESS_TELLS_V42
- Lê como cabeça com planos (não oval + adesivos). BLACK: silhueta de cabeça
  com maçã/mandíbula/orelha (não círculo). GRAYSCALE premium. ≥8 ou ART SOURCE.

## Referências / export
Character creators premium estilizados 2.5D (não copiar arte de terceiros).
SVG, curvas, sem raster/texto, `data-*` presentes, placeholders de cor.
