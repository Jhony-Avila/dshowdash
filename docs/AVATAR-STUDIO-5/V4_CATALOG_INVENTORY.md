# V4 CATALOG INVENTORY (§9)

> Registry REAL (`AvatarCatalog.PARTES`, base `dc14cd3f`), não suposição.
> Fonte: dump `tools-golden/inv.ts`. `_px_` = arte premium autoral (naming).
> `premium (acabamento)` ⊇ `_px_`: nariz/sobrancelha/barba são `acabamento:'premium'`
> sem o naming `_px_` (por isso aparecem com px=0 mas legacy=0).

## Totais
- **495 itens · 17 categorias · 73 `_px_`.**
- A biblioteca que o 2D Premium/V4 realmente expõe é a `_px_` + faciais premium
  (nariz/sobrancelha/barba). O resto (~422) é LEGACY (compatibilidade/saves).

## Tabela por categoria (ordenada por volume)
| Categoria | grupo | total | `_px_` | legacy | material | corpoV2 (silhueta própria) | veredito distinção (§11) |
|---|---|--:|--:|--:|--:|--:|---|
| acessorio | corpo | 88 | 13 | 75 | 13 | 0 | REDRAW premium (§45 auditar; muitos quase-iguais → MERGE/REMOVE_FROM_MAIN) |
| cabelo | rosto | 60 | 10 | 50 | 0 | 0 | REDRAW `_px_` (§33-36); legacy → LEGACY_ONLY |
| olhos | rosto | 48 | 8 | 40 | 0 | 0 | REDRAW `_px_` (§25 profundidade real); legacy → LEGACY_ONLY |
| boca | rosto | 48 | 8 | 40 | 0 | 0 | REDRAW `_px_` (§28 estrutura); legacy → LEGACY_ONLY |
| base | rosto | 44 | 8 | 36 | 0 | 0 | REDRAW `_px_` (§21 face structure); legacy → LEGACY_ONLY |
| roupa | corpo | 40 | 10 | 30 | 8 | 4 | REDRAW hero (§39-42); 4 golden têm silhueta própria (tee/hoodie/blazer/sobretudo) |
| moldura | cena | 28 | 4 | 24 | 0 | 0 | cosmético; MAIN curar poucos |
| fundo | cena | 26 | 6 | 20 | 0 | 0 | §48 poucos memoráveis; resto LEGACY/ALL |
| efeito | cena | 24 | 0 | 24 | 0 | 0 | LEGACY_ONLY (nenhum premium) |
| emblema | cena | 20 | 0 | 20 | 0 | 0 | LEGACY_ONLY |
| aura | cena | 19 | 4 | 15 | 0 | 0 | cosmético |
| banner | cena | 15 | 0 | 15 | 0 | 0 | LEGACY_ONLY |
| sobrancelha | rosto | 10 | 0 (10 premium) | 0 | 0 | 0 | REDRAW massa de pelos (§26) |
| nariz | rosto | 8 | 0 (8 premium) | 0 | 0 | 0 | KEEP arquitetura fonte-única (§27), REDRAW visual |
| barba | rosto | 8 | 0 (8 premium) | 0 | 0 | 0 | REDRAW growth-map (§37-38) |
| roupa_sobre | corpo | 6 | 2 | 4 | 2 | 0 | avaliar utilidade |
| roupa_inferior | corpo | 3 | 0 (3 premium) | 0 | 3 | 0 | KEEP (calças) |

## Leitura para o V4 (§10 variedade ≠ contagem)
- **Variedade real hoje é BAIXA** onde importa: os `_px_` de cada categoria
  facial (8 base, 8 olhos, 8 boca, 8 nariz, 10 sobrancelha) foram construídos
  pelo MESMO método (parametrização), então muitos são "variação de linha
  interna" — falham o teste §97/§98 (parecem irmãos). **Precisam de REDRAW por
  arquétipo, não mais IDs pelo mesmo molde.**
- **Roupa**: só 4 das 40 têm silhueta própria (corpoV2). As outras 36 mudam só
  a cor do torso → §99 falha (identidade por cor/linha). REDRAW hero + expandir
  por construção distinta.
- **Acessório (88)**: maior categoria, provável excesso de quase-duplicatas
  (§45). Auditar por família (eyewear/neck/head/wrist…) e MERGE/REMOVE_FROM_MAIN.
- **Cosméticos (moldura/fundo/efeito/emblema/aura/banner = 132 itens)**: não são
  foco de qualidade de personagem; curar poucos no MAIN, resto em ALL/Avançado.

## Distinction Gate — metodologia p/ Fase 2 (§11)
Para cada categoria crítica, comparar em **PURE BLACK / GRAYSCALE / FINAL** e
classificar KEEP / VARIANT / MERGE / REDRAW / LEGACY_ONLY / REMOVE_FROM_MAIN_GRID.
Regra: se dois parecem iguais em preto → VARIANT; se DEVERIAM diferir → REDRAW.
O olho humano decide (§62), não similaridade matemática.

## Recomendação de curadoria (§76-77) — MAIN vs ALL vs LEGACY
- **MAIN** (curado, o que o novo usuário vê): só os HERO V4 aprovados + `_px_`
  que sobreviverem ao distinction gate. Meta de diversidade (§49): body 5+,
  face archetype 8+, eyes 8+, brows 6+, noses 7+, mouths 7+, hair 12+, beard 6+,
  top 15+, outerwear 8+, glasses 5+, headwear 5+, accessories 10+, background 8+.
- **ALL / LEGACY** (Avançado): os 422 legacy + `_px_` rebaixados. Nunca lado a
  lado com o MAIN no fluxo padrão (§76 — não destruir a percepção Premium).

## Regra absoluta (§83)
NO CATALOG SCALE até V4 HERO LOCK. Este inventário é para DECIDIR o que redesenhar
e o que aposentar — não para criar mais itens agora.
