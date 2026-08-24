# ART REQUEST — HAIR HERO AUTHORED V1 (SHORT + AFRO) · V4.2

> **Status:** ART SOURCE REQUIRED (§23/§40/§57-B). O cabelo atual: short = entrada
> rala; afro = **massa preta chapada** (não volume/textura). Nota 3/10 — ver
> `09_V42_HAIR.png`. Entregar **apenas** `HAIR_SHORT_HERO_V1.svg` e
> `HAIR_AFRO_HERO_V1.svg`. Os dois ≥8 **antes** de qualquer expansão (§23/§42).

## Objetivo
Cabelo autoral que para de parecer capacete/touca/massa/círculos (§23).

## Canvas / uso
Frame **cabeça (240×240)**, assenta sobre a massa craniana do FACE HERO. Foco de
edição `38 6 164 164`. Precisa vestir o crânio (nasce na linha do couro, não
flutua) e ter recorte que lê no BLACK.

## Construção (§23)
- **SHORT:** linha do couro real (têmpora/nuca), volume no topo, mechas com
  direção (não capacete). Costeleta/contorno da orelha.
- **AFRO:** volume esférico com **textura** (blocos de mecha, borda irregular
  que lê no BLACK) — **não** bolas empilhadas nem massa lisa. Silhueta com
  micro-recorte, brilho difuso (não gradient chapado).
- Ambos: raiz mais escura, meios/pontas com value; **não** fingir volume só com
  gradient (CHEAPNESS_TELLS_V42).

## Camadas / canais / material
- `data-hero-layer`: `base` (massa/silhueta), `mid` (mechas internas/sombra),
  `light` (brilho de topo), `detail` (fios de borda/contorno), `occlusion`
  (sombra do cabelo na testa/orelha).
- `data-channel="cabelo"`; brilho pode usar `destaque`.
- `data-material="hair"`.
- `<g data-hero="anchors">`: `topo, testa, orelhaL, orelhaR, nuca`.

## Aceitação (§23/§27/§30)
- BLACK: silhueta lê como "short" e como "afro texturizado" (não círculo/massa).
  GRAYSCALE premium. ≥8 ou ART SOURCE. **Sem expandir** para outros cortes antes.

## Referências / export
Cabelos estilizados de character creators premium; afro 2.5D com textura real.
SVG, curvas, sem raster/texto, `data-*`, placeholders de cor.
