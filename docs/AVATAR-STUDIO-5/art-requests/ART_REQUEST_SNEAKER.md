# ART REQUEST — AUTHORED SNEAKER HERO (P0 BLOCKER) · V4.1

> **Status:** ART SOURCE REQUIRED. O calçado atual parece **slipper pontudo**
> (§7). A engenharia de footwear (`pontosPe`, `fatorSpreadCalcado`,
> `FOOTWEAR_ZONES`) é boa mas **não é arte de footwear**. Entregar **UM** sneaker
> 8+ antes de escalar (§8) — não quatro calçados 5/10.

## Objetivo
Um tênis que, no close (e em preto), leia **imediatamente como SNEAKER**.

## Canvas / uso
Autorar em perfil (side view), quadro ~260×160, e a versão frontal para o corpo
inteiro (slot `pes`, corpo 240×400 — âncora do pé via `engine/footwear.pontosPe`).
O motor ancora/escala pelo perfil (`fatorSpreadCalcado`) — o asset é a IDENTIDADE.

## Zonas obrigatórias (fonte: engine/footwear `FOOTWEAR_ZONES`, §7)
`HEEL · HEEL COUNTER · COLLAR · UPPER (vamp) · TONGUE · LACE REGION · TOE BOX ·
MIDSOLE · OUTSOLE`. Cada zona tem de aparecer na construção.
- Silhueta: salto baixo, entressola visível (faixa clara), toe box arredondado
  (não bico), colarinho do tornozelo com padding, cadarço com ilhoses e língua.

## Camadas / canais / material
- `data-hero-layer`: `base` (cabedal), `mid` (dobras/sombra), `light` (realce do
  toe/entressola), `detail` (cadarço, costura, ilhoses), `shadow` (contato).
- `data-channel="roupa"` no CABEDAL (cor principal), `data-channel="destaque"` no
  CADARÇO/detalhe.
- `data-material="technical"` (ou `leather`) no cabedal; `sola/entressola` valor
  fixo escuro/claro.
- `<g data-hero="anchors">`: `tornozelo, calcanhar, biqueira, sola`.

## Aceitação (§7, §27, §30)
- CLOSE lê imediatamente como **sneaker** (não slipper).
- Zonas distinguíveis; toe box arredondado; entressola presente.
- ≥8 ou ART SOURCE REQUIRED. **NÃO escalar** para dress/loafer/boot/high-top até
  este bater 8 (§8).

## Referências
Sneakers estilizados de character creators / ícones de tênis 2.5D premium. Não
copiar marca/modelo real nem arte de terceiros.

## Export
SVG, curvas, sem texto/raster, `data-*` presentes, placeholders de cor.
