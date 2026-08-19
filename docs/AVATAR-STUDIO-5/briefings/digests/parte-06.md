# Digest — MEGA_BRIEFING_01 · PARTE 6/12 (§1222–§1506)
## Acessórios, óculos, chapéus, joias, mochilas, asas, props, pets, companheiros, sockets, fit, clipping, materiais hero e substituição dos placeholders procedurais

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 15200–17987. Código auditado em `public/components/panels/panel-avatar-studio/src/` (abreviado `src/` abaixo), `api/avatar/studio.php`, `public/assets/avatars/3d/`, `scripts/avatar/testes/`.

---

## 1. Resumo executivo

A Parte 6 manda **preservar a lógica (IDs, slots/sockets, saves, regras) e elevar a arte** dos acessórios — de "itens equipáveis" para um ecossistema premium. Ponto de partida reconhecido pelo próprio briefing: o contrato de 14 sockets 3D (`src/poc3d/catalogo3d.ts:SOCKETS_3D`) é maduro, mas toda a leva 3D é **placeholder procedural** (`src/poc3d/Acessorios3D.tsx`: coroa = torus+cones, jetpack = box+cilindros, etc.). O briefing pede: (a) auditoria e classificação KEEP/UPGRADE/REPLACE/DEV_ONLY de cada item; (b) contrato de **fit** (occupancy profiles, spatial regions, regras declarativas requires/incompatibleWith/hides/replaces/occupies, grip/anchor/pivot em metadata); (c) **Golden Accessory Set** A01–A09 (óculos, coroa, colar, relógio, mochila, asas, cetro/prop, drone, pet) provando metal/vidro/emissivo/animação/secondary motion; (d) famílias de material e canais de cor (primary/secondary/metal/emissive); (e) câmera por categoria (óculos→rosto, mochila→costas, asas→corpo) e bounds camera-aware; (f) LOD/budget por classe (small/medium/hero/pet/companion); (g) elevação 2D (lentes, highlights, layering back/front); (h) validadores de pipeline (socket, fit, material, alpha, bone, LOD, thumbnail); (i) Visual QA por socket, stress test 9 itens, before/after; (j) UI: explicar conflitos, contador/remover-todos, badge de slot, inspect mode; (k) Art Bible capítulo acessórios. Gate (§1495/§1505): pelo menos um item Q3/Q4 por região (cabeça, face, pescoço, punho, costas, prop, companion, pet) antes de qualquer produção em massa. No código de HOJE a **infra 2D está adiantada** (75 artes SVG em 22 slots finos, registry de subcategorias em dados, conflitos por dados, variantes de cor sem persistência, Modo Item) e a **infra 3D é tripla e desconectada**: PoC (`Acessorios3D.tsx`, 9 itens `soc_*` em 7 sockets), palco do shell (`Renderizador3d.definirProp3d` só cabeça/rosto/pet aproximados) e assembler de partes GLB (`Assembler3d`/`Partes3d`, rebind no rig ubc-v1, **zero `parte_acessorio` publicada**). Nada de fit/occupancy/bounds/material families/LOD por classe existe para acessórios.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Inventário + classificação KEEP/UPGRADE/REPLACE/DEV_ONLY | 1224–1226, 1418–1421, 1503.1–2 | Auditoria item a item (2D e 3D); placeholders só em modo Dev (`visual_status=prototype`); produção não mostra placeholder como premium | NÃO EXISTE. 3D: `catalogo3d.ts:ITENS_SOCKET` (9 itens) sem campo de status; `Estudio3D.tsx` expõe os 9 sem filtro. 2D: `MetadadosAssets.ts:metadadosDe` deriva autor/licença/tags, mas sem `visualQuality` | Campo `visualQuality`/`visualStatus` em registry de dados + filtro Dev |
| Taxonomia por socket/subcategoria em dados | 1227–1228, 1463–1464, 1503.3 | Famílias HEAD/FACE/EARS/NECK/SHOULDERS/BACK/WAIST/WRISTS/HANDS/COMPANION/PET; adicionar acessório não exige componente React | EXISTE (2D): `workspace/acessorios.ts:SUBCATEGORIAS_ACESSORIO` (30 subcategorias, 8 regiões), `SUBCATEGORIA_POR_ASSET` (75 ids), `SlotAcessorio` (15 slots, `domain/types.ts:55`). PARCIAL (3D): `SOCKETS_3D` (14) sem ponte para `SlotAcessorio` | Falta mapa `SlotAcessorio ↔ Socket3D` (ex. `olhos↔eyes`, `orelha↔ears`, `pulso_e↔wrist_l`) e registry único por asset cobrindo os campos §1463 (socket, materialFamily, colorChannels, compatibility, occupancy, lod, animation, rendererSupport, license) |
| Multi-accessory + compatibilidade declarativa | 1229–1240, 1360–1362 | Equipar vários; regras requires/incompatibleWith/hides/replaces/occupies; occupancy profiles + spatial regions; L/R/pair em orelhas/punhos; two-handed; explicar conflito ("Asas substituem mochila") | PARCIAL: multi-equip por slot fino (`GradeItens.tsx:110-150`, flag `as6.acess_v2`); conflito por subcategoria (`subcategoriasConflitam`, `conflitaComSlots`); pares L/R só em slots corporais (`pulso_e/d`, `mao_e/d`, onda 1404); motor §617 `nucleo/contratos.ts:avaliarRegras` (exclusive_slot, conflicts_with, requires_asset, hide_body_region) existe mas NÃO é alimentado por `partes/acessorios.ts`; ícone ⚠ "Não combina com" (`GradeItens.tsx:1021`) e modal "Equipar e substituir" (`ShellStudio.tsx:1610`) | Occupancy/regions não existem; `orelha` é 1 slot (sem left/right/pair); sem `occupies` multi-slot; sem `hides`/`replaces`; explicação de conflito é genérica (não nomeia "asas substituem mochila") |
| Óculos (quality bar, fit, lentes, LOD, 2D) | 1245–1256, 1375, 1410 | Armação com espessura/ponte/hastes, lentes vidro/tinted/mirrored/holo, repousa em nariz/orelhas, adapta à face width, LOD0 em retrato; 2D com highlight/sombra/profundidade | 2D: 8 artes (`ace_oculos`, `_sol`, `_3d`, `_redondos`, `_gatinho`, `_pixel`, `ace_viseira_esporte`, `ace_monoculo`) com gradiente de lente e highlight simples. 3D: `Acessorios3D.tsx:Oculos` = 2 torus emissivos ciano (placeholder). Nenhum fit profile | Hero Glasses 3D (GLB CC0 ou procedural refinado) + `glassesFit` em metadata; 2D premium (wrapper, não editar arte) |
| Headwear (boné/chapéu/coroa/helmet/capuz × cabelo) | 1257–1267, 1397, 1411 | `headFit/hairMask/headScaleRange`; coroa Hero (metal premium, pedras); helmet fechado oculta cabelo; capuz com hair variant | 2D: ~20 artes de cabeça (`slot:'cabeca'`) renderizam ACIMA do cabelo (comentário `acessorios.ts:4`), sem máscara de cabelo. 3D: `Coroa` torus+5 cones; palco do shell aproxima `coroa|chapeu` (`Renderizador3d.ts:definirProp3d`); roupas GLB têm `mascara` §415.2 (`Assembler3d.ts:mascararBase`) — só para base, não cabelo | Hero Crown; `hairMask` por item usando a mesma infra de máscaras (estender `REGIOES_UBC` com região cabelo/cabelo-parte) |
| Joias (metal, gemas, colar × gola, brincos, relógio × manga) | 1268–1281, 1376, 1412 | Ouro ≠ #FFD700 (metalness/roughness/env); gemas transmissive/emissive; necklace fit; earrings L/R/pair + secondary motion; watch com caixa/vidro/mostrador | 2D: `ace_corrente`, `ace_colar_perolas`, `ace_brinco`, `ace_anel_sinete`, `ace_relogio_pulso`, `ace_pulseira_led`, `ace_medalha` (flat com highlight). 3D: `Colar` torus dourado + octaedro emissivo; `Materiais3d.ts` tem canais pele/cabelo/roupa/destaque + `TETO_EMISSIVO=2`, sem famílias metal/glass | Famílias de material; Hero Necklace/Watch; brinco 3D (socket `ears` sem conteúdo); watch em `wrist_l/r` (sockets sem conteúdo) |
| Mochila/jetpack/asas (fit, straps, bounds, câmera, VFX) | 1282–1305, 1400, 1413–1414 | Mochila presa com alças; jetpack composite+thrusters+emissive; asas Hero por família (angelic/mechanical/energy/…), silhueta, anchor, fold/open, bounds → câmera recua | 2D: `ace_mochila_jato`, `ace_asas_energia`, `ace_capa_heroica`, 3 bolsas — todos na camada `acessorio_costas` DEPOIS de roupa/cabelo (`render.ts:ORDEM_CAMADAS` linha 72) ⇒ sem layering traseiro real. 3D: `Jetpack` box+cilindros, `Asas` 3 boxes translúcidos; `Config3D.mochila` usa nó Backpack do aventureiro; `Renderizador3d.enquadrar('auto')` usa Box3 do personagem (acessórios 3D da PoC não entram) | Hero Backpack + Hero Wings; bounds declarados → `enquadrar`; camada 2D "atrás" para costas (nova camada `acessorio_costas_tras`, aditiva) |
| Props de mão (grip, anchor, pivot, orientação, two-handed, 2D) | 1241–1244, 1306–1310, 1380, 1415 | `grip:{hand,type}`, pivot/offset em metadata, convenção de eixos documentada, hand pose matching | 3D: `Cetro` em `hand_r` com `DESLOC/ROT` hardcoded em `Acessorios3D.tsx` (números mágicos); `hand_l` sem conteúdo. 2D: `ace_luva_couro`/`ace_anel_sinete` em `mao_e/d` (renderCorpo). Nenhuma pose de mão | Grip profiles em dados; mover `DESLOC/ROT/AJUSTE` para manifest do asset; Hero Prop; 2D prop que "encaixa" na mão do `partes/corpo.ts` (mãos em 72,206/168,206) |
| Companion e Pet (behavior, grounding, LOD, off-screen, câmera) | 1311–1332, 1403, 1416–1417 | Famílias drone/orb/robot/spirit/holo; hover/orbit/follow; collision com rosto/asas; pet com skeleton/anim/ground align; LOD0–2; throttling off-screen | 2D: 11 artes `slot:'companheiro'` (robôs/espíritos/gato) com `animateTransform` flutuante. 3D: `Drone` orbita em círculo fixo r=0.85 e `PetBit` em posição fixa (0.8,0,0.35) — sem collision, sem LOD, sem throttling; shell mapeia `equipment.pet` → prop 'pet' genérico | Hero Drone/Pet (GLB animado CC0 — ex. Quaternius animal pack já licenciado: `public/assets/avatars/3d/animal_pug.glb`); orbit com evitação; Quality Manager (`services/QualityManager.ts`) ainda não considera pet/companion |
| Famílias de material, canais de cor, emissive discipline, raridade | 1334–1352, 1498 | metal_polished/brushed, plastic_tech, rubber, leather, glass, crystal, energy, hologram, fabric; canais primary/secondary/metal/emissive; UI mostra só canais suportados; bloom com teto; raridade → detalhe/animação/VFX | 2D: `usaCores` (`roupa`/`destaque`) por arte + `VariantesAssets.ts` (variantes nomeadas sem persistência). 3D: `Canal3d` = 4 canais do 2D; `TETO_EMISSIVO`; sem famílias | Registry `materialFamily` + presets PBR por família (em `Materiais3d.ts`); canais `metal/emissive` só onde suportado |
| Coleções / smart equip / Vitrine | 1353–1359, 1422 | Coleções CYBER/ROYAL/ADVENTURE; preview antes de aplicar tudo; Vitrine prioriza Golden | PARCIAL: `services/Conjuntos.ts:CONJUNTOS` (roupa+1 acessório), `AvatarCatalog.ts:COLECOES` (col_cyber_nexus…), `Vitrine.tsx` seções server-side | Coleções de acessórios multi-slot com preview; Vitrine sem noção de "golden" |
| Thumbnails, preview, hover, câmera por categoria | 1363–1373, 1474, 1482–1485 | Modo isolado + mini preview equipado; hover aplica temporariamente; óculos→rosto, colar→busto, mochila→¾/back, asas→full, relógio→wrist; botão "Ver costas" | 2D: Modo Item baked (`components/modoItem.ts:FOCO_ITEM_ASSET` 75 ids + presets por subcategoria, flag `as6.thumb_item`); hover = Modo Aplicado; foco por categoria §39.19 em `GradeItens.tsx:50`. 3D: `CameraRig3D.tsx` presets corpo/busto/rosto/tresquartos; sem "costas" nem foco por subcategoria | Preset de câmera 3D por subcategoria + "Ver costas"; bounds por asset |
| Classic 2D — elevação | 1374–1383, 1502 | Lentes/sombra/frame depth; joias com gradiente; layering back/front; asas rear+front tips; halo procedural OK; pet sprite com motion | Arte existente plana-com-gradiente; halo `ace_aureola` procedural; layering traseiro inexistente | Upgrade via **wrappers/artes novas** (regra: nunca editar `partes/*`); ver §4 |
| Pipeline / validadores | 1384–1396, 1465–1467 | Socket/fit/bounds/oversize/material/alpha/bone/animation/LOD/thumbnail/preview validators; QA scenes por socket | PARCIAL: pipeline §487 valida tri/texturas/bones do rig (`docs/AVATAR-STUDIO-5/pipeline-assets-3d.md §6`, manifest §517 com `lods/hashes/licenca`); `Assembler3d.montarPersonagem` checa parte >1.5× base; nenhum validador de socket/fit/alpha/thumbnail | Estender manifest §517 com `socket/ancora/bounds/materialFamily`; validador no publicador (scripts/avatar/assets3d) |
| Visual QA, stress test, Golden Set, Before/After | 1397–1421, 1408–1417, 1468–1472 | Cenas HEAD_QA/FACE_QA/BACK_QA/WRIST_QA/HAND_QA/PET_QA; 9 itens simultâneos; 2 body types, cabelos, roupas, skin tones | Testes: `scripts/avatar/testes/sockets-3d.mjs` (7 sockets simultâneos × 3 rigs), `acessorios-v2.mjs`, `slots-corpo.mjs`, `variantes-thumb-item.mjs`, `golden-avatars.mjs` (sha256 SVG). Nenhum stress 9 itens nem QA por socket com variação de corpo/cabelo | Suíte QA por socket + stress + goldens visuais 3D (screenshot hash tolerante) |
| Performance: budget por classe, LOD, culling, atlas | 1432–1445, 1500 | small/medium/hero/pet/companion; LOD prioritário (óculos LOD0 em close-up); culling; throttling | `Personagens3d.lodPorQualidade` (tier→lod) global; `CacheNiveis.ts` LOD com gate; `Capacidade3d.ts` dica de tier; sem classe de acessório | Budgets por classe no manifest + no Quality Manager |
| UI: badge de slot, contador, quick remove, remover todos, tray, inspect | 1475–1486 | Contador de equipados, remover individual/todos, tray compacta, inspect (3D preview, material, lore, coleção, raridade) | `shell/Equipados.tsx` (lista por slot com remover/trocar/bloquear), hub `as6.acess_hub` com contagens, `DetalheAsset`/`PropriedadesAsset`; `escolherItem(null)` limpa todos os slots de acessório (`GradeItens.tsx:146`) | Botão explícito "Remover todos os acessórios" + contador no hub; inspect com material/lore |
| Photo Studio / pose integration | 1423–1431, 1491–1494 | Força LOD alto/sombras/AA na captura; compositing de transparentes; pet no frame; props sugerem poses | `Renderizador3d.capturar` (§506 restaura câmera), `Poses3d.ts` (poses salvas), foto3d flags | Captura não força LOD0 de acessórios; sem sugestão de pose por prop |
| Art Bible / docs | 1446–1452, 1503.24 | Capítulo acessórios: socket conventions, scale, pivots, fit, material families, anti-patterns | NÃO EXISTE (`docs/` sem ART-BIBLE.md; Parte 12 §3044 exige) | Criar seção acessórios no ART-BIBLE (dependência da Parte 12/P0) |

---

## 3. O que JÁ está coberto e prerequisitos

**Coberto (referenciar, não refazer):**
- Contrato de sockets 3D fechado ponta a ponta: `SOCKETS_3D` (14) · `Config3D.sockets` · `validarConfig3d` (pares item×socket) · PHP `studio.php:461-478` (`$socketsValidos`) · `contratos.ts:SLOTS_EQUIPAMENTO` (união 2D+3D) · teste `sockets-3d.mjs`.
- Slots finos 2D e corporais (15 `SlotAcessorio`), camadas aditivas em `render.ts:ORDEM_CAMADAS`, espelho PHP `studio.php:134-141`, registry de subcategorias/regiões em dados, conflitos por dados, Modo Item, variantes de cor sem persistência — ondas 1301–1404 (decisões #140–#154).
- Ancoragem agnóstica de rig (`Acessorios3D.tsx:Ancora` — matriz local = ossoMundo⁻¹·desejada) e rebind de partes GLB no rig ubc-v1 (`Assembler3d.religarParte`) + body masking §415.2 (`mascararBase`/`REGIOES_UBC`). A Parte 6 deve **reutilizar** esses dois caminhos, não criar um terceiro.
- Material Manager com canais e teto emissivo (`Materiais3d.ts`), pipeline de publicação com manifest §517, licenças CC0 documentadas (`public/assets/avatars/3d/LICENCAS.md`), motor de regras §617 (`avaliarRegras`).

**Prerequisitos de/para outras partes:**
- Depende da Parte 12 (P0): Art Bible, Quality Bar/Visual Score, goldens visuais 3D, flags `as6.*` da onda AAA, tiers.
- Depende da Parte 2 (corpo/mãos: grip profiles, hand pose), Parte 4 (cabelo: hair mask/under-hat variant), Parte 7 (materiais PBR: famílias metal/glass/crystal/hologram — a Parte 6 só CONSOME), Parte 8/9 (iluminação/câmera: presets por categoria, auto-framing por bounds).
- Fornece para: Photo Studio (captura com acessórios), Vitrine (Golden Set), Parte 12 (GOLDEN ACCESSORIES é etapa 8 da ordem §3107).

---

## 4. Conflitos/risco com regras invioláveis e contorno

1. **Byte-stability × layering 2D traseiro (§1377/§1378).** Mover `acessorio_costas` para antes de `roupa` mudaria SVGs salvos. Contorno: nova camada aditiva `acessorio_costas_tras` (ou campo `ParteDef.atrasCorpo?: ParteRender` só lido por artes NOVAS); ausente = fragmento vazio = byte a byte; goldens `golden-avatars.mjs` provam.
2. **Nunca editar arte em `partes/*` × "2D glasses upgrade" (§1375–§1376).** Contorno: artes novas `ace_*_premium`/versão v2 com id novo OU wrapper de pós-processo opt-in por flag (`as6.acess_2d_premium`) que envolve o fragmento em `<g filter>`/sombra — e só para itens equipados APÓS a flag? Não: wrapper mudaria render de salvos. Decisão: **só arte nova com id novo**; a antiga vira `visualStatus:'legacy'` oculta no catálogo (sem deprecar: saves continuam renderizando).
3. **Flags.** Tudo atrás de `as6.acess_fit` (contrato fit/occupancy), `as6.acess_hero3d` (assets Hero GLB por socket), `as6.acess_2d_premium`, `as6.acess_cam` (câmera por categoria), `as6.acess_qa` (só testes). Dependências em `DEPENDENCIAS_FLAGS`: `as6.acess_hero3d → as5.palco3d`, `as6.acess_fit → as6.acess_v2`.
4. **PHP espelhado.** Campos novos persistidos: nenhum previsto nas ondas A–C (fit/occupancy/material são metadados de catálogo, não de avatar). Se `Config3D.sockets` ganhar `eyes/ears/wrist_*/hand_l`, o PHP já aceita os 14 (regex de id — conferir `studio.php:466`). Orelha L/R/par (§1236) **não** vira slot novo: modelar como variante do asset (`ace_brinco_par`) ou sub-propriedade em `params` §71 (já aceito como opcional) — evita bump de schema.
5. **Licenças/assets externos.** Hero GLBs só CC0 com comprovante no manifest §517 + `LICENCAS.md` (decisão #28). Risco: não existe pack CC0 de óculos/relógio/coroa de qualidade AAA garantido; alternativa = **procedural refinado** (geometria gerada com bevel/lathe/extrude + materiais PBR) mantendo "zero download", aceitável pelo §1225–§1226 se não parecer primitive mesh.
6. **Bundle/peso.** GLB por acessório ≤ 150 KB lod0 (gate novo na classe small/medium), hero ≤ 600 KB, pet ≤ 1.2 MB com LOD1/2 — carregamento lazy via `CacheAssets3d`; nada entra no bundle JS.
7. **TS fonte de verdade / sem lib pesada.** Sem physics engine para "jewelry physics" (§1277): secondary motion via spring simples em `useFrame`.
8. **Três implementações 3D paralelas** (PoC `Acessorios3D`, shell `definirProp3d`, assembler GLB) = risco de duplicar lógica (proibido §3096). Contorno: uma **única tabela de âncoras por socket** (dados) consumida pelos três; PoC e `definirProp3d` passam a ler do registry; `ITENS_SOCKET` migra para o mesmo registry.

---

## 5. Proposta de ONDAS

**P6-A — Auditoria + contrato de fit/occupancy (P0 · esforço M · dep.: Parte 12 Quality Bar)**
Objetivo: cumprir §1504 passos 1–2 sem tocar arte.
1. Inventário 2D (75 `ace_*`) + 3D (9 `soc_*`) com classificação KEEP/UPGRADE/REPLACE/DEV_ONLY — §1224, §1503.1–2 — `docs/AVATAR-STUDIO-5/acessorios-inventario.md` (gerado por script `scripts/avatar/inventario-acessorios.mjs`); sem flag; teste: script roda na suíte e falha se id sem classificação.
2. Registry unificado `src/workspace/acessoriosRegistry.ts` (dados): `visualStatus`, `materialFamily`, `colorChannels`, `occupancy{region,size,zones}`, `fitProfile`, `bounds`, `classe` (small/medium/hero/pet/companion), `rendererSupport` — §1231–§1232, §1463 — flag `as6.acess_fit`; teste unitário: todo `ace_*`/`soc_*` tem entrada.
3. Mapa `SlotAcessorio ↔ Socket3D` (`olhos↔eyes`, `orelha↔ears`, `pulso_e↔wrist_l`, …) em `domain/types.ts`/registry — §1227 — mesma flag; teste: bijeção cobre 14 sockets.
4. Regras declarativas `requires/incompatibleWith/hides/replaces/occupies` alimentando `avaliarRegras` §617 e `subcategoriasConflitam` — §1233–§1240 — `as6.acess_fit`; teste `acessorios-fit.mjs`: asas × mochila, óculos × máscara, capacete fechado hides cabelo.
5. Explicação de conflito nomeada ("Asas substituem Mochila") no modal `ShellStudio.tsx:1610` e card ⚠ — §1360–§1361 — `as6.acess_fit`; teste headless de texto.
6. Spatial regions + occupancy para os 75 itens 2D (curadoria em dados) — §1231 — idem.
7. Brinco L/R/par e punho L/R/both via variante de asset (sem slot novo) — §1236–§1239 — decisão registrada; PHP intocado.
8. Filtro Dev: `visualStatus:'prototype'` só aparece com `?dev` — §1419–§1421 — `as6.acess_fit`.
9. Contador de acessórios + "Remover todos" + badge de slot no hub/Equipados — §1475–§1479 — `as6.acess_hub` (extensão); teste `acessorios-v2.mjs`.
10. Docs: `docs/AVATAR-STUDIO-5/acessorios-contrato.md` (socket conventions, eixos +Y up/+Z forward, pivot = grip point, escala em metros) — §1244, §1447–§1450.

**P6-B — Âncoras em dados + Hero 3D cabeça/face/pescoço (P1 · esforço G · dep.: P6-A, Parte 7 materiais, Parte 4 hair mask)**
1. Mover `DESLOC/ROT/AJUSTE/OSSOS` de `Acessorios3D.tsx` para o registry (manifest por asset) e fazer `definirProp3d` e a PoC lerem a mesma tabela — §1243, §3096 — `as6.acess_hero3d`; teste `sockets-3d.mjs` byte-igual nas capturas com flag off.
2. Manifest §517 estendido: `socket`, `ancora{offset,rot,escala}`, `bounds`, `materialFamily`, `classe`, `lods` — §1385–§1389 — validador em `scripts/avatar/assets3d` (publicador) — teste node.
3. Hero Glasses A01 (GLB CC0 ou procedural refinado com lathe/extrude, lente `MeshPhysicalMaterial transmission`, fit por largura da cabeça via Box3 do osso Head) — §1245–§1255, §1410 — `as6.acess_hero3d`; golden visual 3D `FACE_QA`.
4. Hero Crown A02 (metal PBR, gemas emissivas ≤ `TETO_EMISSIVO`) + `hairMask` via `mascararBase` estendido para a parte de cabelo — §1261–§1262, §1411 — idem; `HEAD_QA`.
5. Hero Necklace A03 (fit pelo pescoço/torso; regra `hides` vs gola) — §1273–§1274, §1412 — `NECK_QA`.
6. Famílias de material (presets PBR `metal_polished/brushed/plastic_tech/glass/crystal/energy/hologram/leather/fabric`) em `Materiais3d.ts` + canais `metal/emissive` opcionais — §1334–§1342 — `as6.acess_hero3d`; teste unit de preset.
7. Brinco 3D em `ears` (socket hoje vazio) — §1236, §1275 — idem.
8. Câmera por categoria (óculos→rosto, colar→busto) em `CameraRig3D`/`Renderizador3d.enquadrar` — §1367 — `as6.acess_cam`.
9. Before/After coroa/óculos/colar (capturas lado a lado no relatório) — §1418.
10. Visual Score por item (Design/Fit/Material/Integration…) registrado no inventário — §1455.

**P6-C — Hero costas/punho/mão + bounds/câmera (P1 · esforço G · dep.: P6-B, Parte 2 grip, Parte 8 câmera)**
1. Hero Backpack A05 com alças e fit por body family — §1282–§1288, §1413 — `as6.acess_hero3d`; `BACK_QA`.
2. Hero Wings A06 (família energy procedural refinada OU angelic GLB CC0; fold/open; anchor plausível) — §1293–§1302, §1414.
3. Bounds declarados → `enquadrar()` considera acessórios (Box3 da união) + auto-framing suave ao equipar asas + botão "Ver costas" — §1303–§1305, §1368–§1369 — `as6.acess_cam`.
4. Jetpack UPGRADE (composite 70/metal 20/emissive 10, idle pulse) — §1289–§1292, §1340.
5. Hero Watch A04 em `wrist_l/r` + regra manga longa (`hides` parcial) — §1278–§1280 — `WRIST_QA`.
6. Hero Prop A07 (cetro/staff) com `grip profile` e anchor em metadata; `hand_l`; two-handed `occupies` — §1241–§1244, §1306–§1309, §1415 — `HAND_QA`.
7. LOD por classe + prioridade context-aware (óculos LOD0 em close-up, mochila LOD2) via `CacheNiveis`/`lodPorQualidade` com override por classe — §1432–§1438.
8. Culling/throttling de acessórios fora do frustum — §1439–§1441.
9. Presets de coleção multi-acessório (CYBER/ROYAL/ADVENTURE) com preview antes de aplicar — §1353–§1359 — `as6.acess_colecoes`.
10. Before/After mochila/jetpack/asas/cetro.

**P6-D — Companion + Pet (P1 · esforço G · dep.: P6-B, Quality Manager)**
1. Hero Drone A08 (GLB CC0 ou procedural refinado; rotores/hover; orbit com evitação de rosto/asas por bounds) — §1311–§1318, §1416.
2. Hero Pet A09 (candidato: reaproveitar `animal_pug.glb` CC0 já licenciado com idle/walk; ground align; escala coerente) — §1319–§1328, §1417.
3. Throttling off-screen e LOD0–2 para pet/companion; classe no Quality Manager — §1329–§1332, §1435–§1436.
4. Camera awareness (companion recua em close-up) — §1316.
5. Pet/companion no Photo Studio (entram no frame; captura força LOD0) — §1423–§1429.
6. Pose integration opcional (staff→hero_staff_pose, olhar para pet) — §1491–§1494 — `as6.acess_poses`.
7. Stress test 9 itens (coroa+óculos+brinco+colar+relógio+asas+cetro+drone+pet) com FPS/drawcalls e indicador `minimal/balanced/heavy` — §1404–§1406 — teste `acessorios-stress.mjs`.
8. PET_QA/COMPANION_QA scenes.
9. Before/After drone/pet.
10. Gate §1495: checklist Q3/Q4 por região no relatório.

**P6-E — Clássico 2D premium + QA/Docs (P1/P2 · esforço M · dep.: P6-A; pode correr em paralelo a B–D)**
1. Camada aditiva `acessorio_costas_tras` (ou `ParteDef.renderAtras`) para asas/mochila/capa com parte traseira — §1377–§1378 — `as6.acess_2d_premium`; goldens 16 intocados + golden novo.
2. Artes 2D novas premium (id novo): óculos com lente/sombra/profundidade, joias com gradiente metálico, asas rear+front tips — §1375–§1376, §1378 — idem; `medir-foco-item.mjs` no mesmo commit (doutrina #83).
3. Props 2D encaixando na mão (`renderCorpo`, coordenadas de `partes/corpo.ts`) — §1380.
4. Pet/companion 2D com motion leve/parallax — §1381–§1382.
5. Mapeamento semântico cross-renderer (mesmo id conceitual 2D↔3D no registry) — §1383.
6. Suíte Visual QA por socket (HEAD/FACE/NECK/BACK/WRIST/HAND/PET) × 2 bodies × 3 cabelos × 3 roupas × 3 skin tones — §1397–§1403, §1466–§1472 — `scripts/avatar/testes/acessorios-qa.mjs` (background ~15 min).
7. Validadores de pipeline: alpha (óculos/visor/holo), thumbnail obrigatório, preview para hero — §1390–§1396.
8. Art Bible capítulo acessórios + anti-patterns — §1446–§1452 (doc).
9. Plano de escala pós-gate (variantes de material ≠ asset novo) — §1457–§1462.
10. Vitrine prioriza Golden Accessories (seção server-side `vitrine.php`) — §1422 — precisa do Jhony para SQL? Não: seção calculada no front com flag.

---

## 6. Perguntas bloqueantes × decisões tomadas

**Realmente bloqueantes (precisam do Jhony):**
1. **Assets Hero 3D**: não há pack CC0 garantido para óculos/relógio/coroa/drone com qualidade AAA. Aceita-se "procedural refinado" (sem download) como Hero, ou o Jhony vai fornecer/comprar GLBs (licença comercial ≠ CC0 ⇒ fora da regra atual)? Sem resposta, as ondas B–D assumem procedural refinado.
2. **Pet Hero**: reutilizar `animal_pug.glb` (Quaternius CC0, já licenciado) como A09 é aceitável, ou o pet deve ser distinto do arquétipo "animal"?
3. **Custo de suíte**: Visual QA por socket (~200 capturas) + stress test aumentam a suíte para >25 min; rodar só em `--completo`? (decisão de orçamento de CI).
4. **Vitrine server-side**: priorizar Golden requer mudança em `api/avatar/vitrine.php`/banco? Se sim, é RUNBOOK-BANCO (fora do git) — pular e registrar.

**Resolvidas sozinho (registrar como decisões #155+):**
- Orelha/punho L/R/par NÃO viram slots novos: variante de asset/params §71 (zero PHP, zero schema bump).
- Layering 2D traseiro = camada aditiva nova, nunca reordenar `ORDEM_CAMADAS`.
- Upgrade 2D = arte com id novo; arte antiga fica renderizável para saves e some do catálogo (`visualStatus:'legacy'`).
- Uma única tabela de âncoras por socket (dados) alimenta PoC, shell e assembler — elimina triplicação.
- Placeholders `soc_*` permanecem como `prototype` (Dev only), não são apagados (§1419).
- Ordem de execução segue §1504 (audit → contrato → glasses → headwear → jewelry → back → props → companion → pet → materiais → LOD → 2D → QA), mas P6-E (2D/QA) corre em paralelo por não depender de GLB.

---

## 7. Métricas / Acceptance da Parte 6

- Inventário 100% classificado (75 `ace_*` + 9 `soc_*`), script falha se item sem classe/`visualStatus`.
- Registry cobre os 11 campos §1463 para todo item; teste unitário verde.
- Gate §1495: ≥1 item Q3/Q4 por região (cabeça, face, pescoço, punho, costas, prop, companion, pet), com Visual Score §1455 ≥ 8 em Fit/Material/Integration registrado.
- `sockets-3d.mjs` + `acessorios-v2.mjs` + `slots-corpo.mjs` + `golden-avatars.mjs` (16 sha256) verdes com flags ON e OFF (byte-stability).
- Stress test 9 itens: ≥ 30 FPS no tier equilibrado no harness headless; sem clipping evidente nas capturas BACK/FACE/HAND.
- Câmera: equipar asas/mochila enquadra sem cortar (Box3 da união dentro do frustum); "Ver costas" funcional.
- Pipeline: publicador rejeita manifest sem `socket/ancora/bounds/thumbnail`; alpha validator para óculos/visor.
- Conflitos: 100% das substituições exibem mensagem nomeada; nenhum item some silenciosamente.
- Docs: inventário, contrato de sockets/pivots/escala, capítulo Art Bible, before/after por Hero.
- Nenhuma mudança em `api/avatar/studio.php` exigida pelas ondas A–E (ou, se houver, espelho + teste).
