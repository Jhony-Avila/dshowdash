# ART_SOURCE_STATUS — Track B (§49)

> **ART STATUS = `BLOCKED_ON_ART_SOURCE`.** Não há `.svg` externo novo. Enquanto
> não houver arquivo real produzido visualmente (§33), o status não muda e nada
> de arte antiga é reapresentado como nova (§49). O diagnóstico já terminou
> (§50/§58) — não se gasta rodada reprovando de novo o que já é reprovado.

## Freeze das especificações (§32)
Os ART REQUESTS V4.2 são **SPEC BASE congelada**. Só mudam se um ilustrador
apontar incompatibilidade concreta — não se reescreve o mesmo pedido em V4.3.
Pacote (em `docs/AVATAR-STUDIO-5/art-requests/`):
`INDEX_V42_GOLDEN_SET · CHEAPNESS_TELLS_V42 · ART_REQUEST_{BODY,FACE,FACE_LIBRARY,
HAIR,HAND,SNEAKER,TSHIRT,HOODIE,BLAZER,PANTS,FULL_HERO}`.

## Ledger de assets
| Asset | Solicitado | Recebido | Aprovado (≥8) | Rejeitado | Integrado |
|---|---|---|---|---|---|
| FACE HERO MALE | ✅ (FACE_LIBRARY) | — | — | — | — |
| FACE HERO FEMALE | ✅ (FACE_LIBRARY) | — | — | — | — |
| HAND (neutral) | ✅ (HAND) | — | — | — | — |
| SNEAKER | ✅ (SNEAKER) | — | — | — | — |
| BODY MALE | ✅ (BODY / FULL_HERO) | — | — | — | — |
| BODY FEMALE | ✅ (BODY / FULL_HERO) | — | — | — | — |
| SHORT HAIR | ✅ (HAIR) | — | — | — | — |
| AFRO | ✅ (HAIR) | — | — | — | — |
| T-SHIRT | ✅ (TSHIRT) | — | — | — | — |
| HOODIE | ✅ (HOODIE) | — | — | — | — |
| BLAZER | ✅ (BLAZER) | — | — | — | — |
| PANTS | ✅ (PANTS) | — | — | — | — |

Recebidos: **0**. Aprovados: **0**. Integrados: **0**.

## Primeiro lote para o ilustrador — ART_BATCH_01 (§35/§36)
Validar a LINGUAGEM antes de pedir tudo. Entregar 5 primeiro:
1. **Male Face Hero**
2. **Female Face Hero**
3. **Neutral Hand**
4. **Sneaker**
5. **Male Body**

Cada um avaliado em: **BLACK · GRAYSCALE · FINAL · TARGET SIZE**. Barra:
**≥8/10 absoluto** — externo ≠ aprovado (§37). Se os 5 não atingirem o nível,
corrigir a Art Direction antes do resto. CHARACTER_IDENTITY_GATE reaplicado ao
Face depois (§39): `tools-golden/v42face.ts` mede (limiar ≈ 12).

## Regras de integração (§38)
Quando o SVG chegar: `importarHeroAsset` **integra, não redesenha**. Se o asset
não ficou bom, volta para arte — o engine não "conserta" arte ruim para salvar.
Nada de parametrização como substituto de authored art (§30).

## O que NÃO promover enquanto isso (§42)
Body/face/hand/footwear/roupa **atuais** continuam **REWORK** — não entram como
aprovados só porque o produto (Track A) avançou. Track A (produto) e Track B
(arte) são independentes (§52/§53): produto pode estar READY com arte BLOCKED.
