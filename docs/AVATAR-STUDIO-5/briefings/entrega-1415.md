# Onda 1415 — Roupas premium, materiais 2D, calça independente e Golden Outfits (MEGA_BRIEFING_01 P10-D, P5-B, P5-C; decisões #191–#195)

> Entrega 2026-08-21. Mapa: claude/41. Flag nova: `as6.roupa_premium` (OFF, filha de `as6.classico_premium`). OFF = byte a byte (regressão visual 111/111, goldens g01–g16 e os 24 casos premium anteriores — exceto p01/p02-corpo, regravados pelo scaffold v2, ver #195).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **Canal `secundario`** (#191): `CanalCor = SlotCor \| 'secundario'` — cor global OPCIONAL (`cores.secundario`, só persiste quando escolhida; espelho PHP opcional) + canal §73 por peça (só quem declara em `usaCores`); fallback determinístico `secundarioPadraoDe(roupa)`; `Paleta.secundario?` só entra quando presente (paleta de configs antigos com as MESMAS chaves) | `domain/types.ts`, `engine/cores.ts`, `AvatarCatalog.ts`, `api/avatar/studio.php` | #191 |
| 2 | **Camada `roupa_inferior`** (`rin_*` #166): categoria nova (sidebar "Calça", gated), z=8 (atrás da roupa — a barra cobre o cós), PHP `$categorias`, `SLOTS_EQUIPAMENTO`; busto NÃO desenha (render vazio, contrato #154), arte no `renderCorpo` | `camadas.ts`, `AvatarCatalog.ts`, `contratos.ts`, `studio.php` | #191 |
| 3 | **`ParteDef.renderCorpoV2`** (#192): silhueta PRÓPRIA da peça no corpo inteiro, pintada por cima do torso do scaffold (o `corpoInteiro` continua intocado) — consumido SÓ com `opcoes.premium` no lugar do `renderCorpo` | `base-api.ts`, `render.ts` | #192 |
| 4 | **Scaffold v2 premium** (`corpoPremium`): sombreamento de estúdio no corpo inteiro (key alto-esquerda, oclusão lateral, core shadow, meia-luz nas pernas) — SÓ com `acabamento` premium; muda os goldens `-corpo` premium (#195) | `engine/partes/premium/corpo.ts` | P10-D |
| 5 | **8 roupas `rou_px_*` novas**: camiseta, camisa, hoodie, blazer (com `renderCorpoV2`), polo, colete, sobretudo, gala — todas com tokens de material (`materiais2d`) e `materialToken` declarado; camisa/hoodie/blazer/colete/sobretudo/gala usam o canal `secundario` (forros) | `engine/partes/premium/vestuario.ts` | P5-B |
| 6 | **2 sobrepeças `sob_px_*`**: cardigã (tricô aberto) e capa (com `renderAtras` — massa de tecido atrás da figura) | idem | §3393 |
| 7 | **3 roupas inferiores `rin_*`**: jeans (denim + costura), social (vinco de alfaiataria), jogger (faixa + punho) — corpo inteiro apenas | idem | P5-C |
| 8 | **3 calçados premium** no slot `pes`: `ace_px_tenis`/`ace_px_social`/`ace_px_bota` (couro/técnico, região dos sapatos do scaffold) + `FOCO_ITEM_ASSET` | idem, `modoItem.ts` | #154 |
| 9 | **Variantes de cor das roupas clássicas** (#193): 29 `rou_*` ganham 3 variantes curadas cada (87 presets) no `VARIANTES_POR_ASSET` — canais ⊆ `usaCores`, NUNCA `pele` (cor de pele não é look); zero persistência nova (§73 de sempre) | `services/VariantesAssets.ts` | #150, #193 |
| 10 | **Golden Outfits O01–O06** (#194): `Conjunto` ganha campos ADITIVOS `roupaSobre`/`roupaInferior`/`calcado`/`acabamento`; `aplicarConjunto` veste o look completo e marca `acabamento: 'premium'`; `conjuntosAtivos()` esconde os premium sem `as6.roupa_premium` | `services/Conjuntos.ts`, `GradeItens.tsx` | §72.1, #194 |
| 11 | **UI adaptativa**: canais roupa/destaque/**secundário** por peça (secundário só com a flag), sobrepeça/inferior entram em `CAMADAS_COM_CANAIS` (gated premium), **swatch de material** (`data-teste="chip-material"`, nomes PT) | `PropriedadesAsset.tsx` | P5-B |
| 12 | **Testes**: seção [I] (30+ asserts: contagens/naming, secundário global+canal, byte-stability, renderCorpoV2/scaffold v2 só premium, rin_ busto vazio, calçado no corpo, registry de variantes íntegro, outfits gated, **cor extrema** #000/#fff nas peças novas) + goldens **p09–p11** (outfits no corpo inteiro) — baseline 24→27; `orcamento-2d` 75→86 casos (0 erros); `docs-aaa` 17 categorias; `pesos-esperados` entry 490 / catalogo-arte 405 | `golden-classic.mjs`, `orcamento-2d.mjs`, `docs-aaa.mjs`, `pesos-esperados.json` | #83 |

## Decisões (registro #45)

- **#191** O canal `secundario` NÃO vira slot global obrigatório (isso mudaria a serialização de TODO avatar salvo — §619): é cor global OPCIONAL (`cores.secundario`, omitida por padrão) + canal §73 nas peças que declaram; o efetivo deriva de `secundarioPadraoDe(roupa)` quando ninguém escolheu. Flag `as6.roupa_premium` (filha de `classico_premium`) gate a categoria Calça, outfits premium e UI de secundário/material.
- **#192** `renderCorpoV2` SUBSTITUI o `renderCorpo` da peça no modo premium (silhueta própria por cima do scaffold) — o `corpoInteiro` não muda nunca; peça sem o hook usa o caminho de sempre.
- **#193** Variantes de cor jamais tocam `pele` — cor de pele é identidade, não look; teste do registry proíbe.
- **#194** Outfits são `Conjunto` estendido com campos aditivos (zero schema novo persistido — o que persiste são as camadas de sempre); aplicar um outfit premium marca `acabamento: 'premium'` no config (o render continua atrás da flag §651).
- **#195** O scaffold v2 (`corpoPremium`) muda TODO golden `-corpo` premium (p01/p02 regravados no mesmo commit, doutrina #83) — mudança deliberada do trilho premium, invisível no clássico (regressão 111/111 verde).

## Precisa do Jhony (não bloqueia)

- Validação visual: console `as6.roupa_premium` (+ pais) → aplicar os outfits O01–O06 no corpo inteiro, trocar canal secundário nos forros, conferir os 3 calçados; veredito no gate da 1418.

## Próxima: 1416 — Acessórios premium (mapa claude/41).
