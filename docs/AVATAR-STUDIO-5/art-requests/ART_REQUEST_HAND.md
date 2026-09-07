# ART REQUEST — NEUTRAL HAND (P0 BLOCKER) · V4.1

> **Status:** ART SOURCE REQUIRED. A mão atual lê como **garra/pente/dedos
> pontudos** (§6). Não refinar o desenho atual — **REDRAW** via pipeline autorado.
> Entregar `HAND_NEUTRAL_AUTHORED_V1.svg` e iterar visualmente.

## Objetivo
Mão neutra relaxada que, em **SILHUETA PRETA**, leia imediatamente como MÃO —
sem nenhuma linha interna necessária para entender a forma. Se parecer garra:
REWORK.

## Canvas / uso
Autorar isolada num quadro próprio (ex.: 200×200), origem 0,0, punho na base.
Frame lógico: a mão é consumida no slot `mao_e/mao_d` (corpo 240×400) e no card
`hands_close`. Fornecer também a versão espelhável (o motor espelha por lado).

## Construção obrigatória (§6)
`WRIST TRANSITION → PALM MASS → THENAR (base do polegar) → INTEGRATED THUMB
(wedge, não graveto) → INDEX → GROUPED MIDDLE/RING → LITTLE FINGER`.
- Dedos com **taper natural** (afinam para a ponta arredondada), **comprimentos
  DIFERENTES** (médio > indicador ≈ anelar > mínimo), base agrupada (dedos juntos,
  separados só nas pontas).
- Polegar **integrado** à massa da palma pelo thenar (não colado do lado).
- Palma com massa (não plana); leve arqueamento; punho conecta ao antebraço.

## Camadas / canais
- `data-hero-layer`: `base` (silhueta da mão), `mid` (sombra entre dedos/palma),
  `light` (dorso/nós), `detail` (vincos discretos), `occlusion` (vãos entre dedos).
- `data-channel="pele"` na base e massas (customização de tom).
- `<g data-hero="anchors">`: `punho, base_polegar, base_indicador, base_minimo,
  ponta_medio`.

## Aceitação (§6, §27, §30)
- **BLACK SILHOUETTE = mão** reconhecível sem linha interna.
- NÃO pode ler como garra/pente/leque.
- Dedos não idênticos; polegar integrado; palma com massa.
- ≥8 ou continua ART SOURCE REQUIRED.

## Referências
Mãos estilizadas relaxadas de character creators / mão neutra "A-pose" de game
rigs estilizados. Não copiar arte de terceiros.

## Export
SVG, curvas, sem texto/raster, `data-*` presentes, placeholder de cor (pele).
