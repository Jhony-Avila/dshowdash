# Digest — MEGA_BRIEFING_01 · PARTE 3/12 (§412–§712)
## Rosto, cabeça, pele, olhos, nariz, boca, sobrancelhas, expressões, idade visual e diversidade facial

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 7246–10405. Código investigado em `public/components/panels/panel-avatar-studio/src/` (caminhos abaixo relativos a essa pasta, salvo indicação).

---

## 1. Resumo executivo

1. O rosto passa a ser **a região de maior prioridade visual** (§412) e deixa de ser "um asset" para virar **sistema composto** (§413): head shape + face shape + skin + eyes + brows + nose + mouth + ears + facial hair + expression + age + microdetail.
2. Diversidade tem de vir da **geometria** (§414), organizada em **Face/Nose/Mouth/Brow Families** (§415, §449, §453, §477) e **morphs semânticos** com envelope homologado (§422, §426, §450, §454, §479).
3. Antes de escalar: **Golden Face Set** (4 rostos M01/M02/F01/F02 claramente distintos, ≥3 tons de pele — §418–§419, §666, §702) e **Skin Calibration Set** light/medium/dark (§503). Regra de escala §667/§711: QUALITY → GOLDEN → PIPELINE → 3X+.
4. **Olhos são prioridade máxima** (§427–§447): globo real, íris com profundidade, sclera não-branca, pálpebras, catchlight que segue o light rig, blink natural, look-at sutil, eye contact em retrato.
5. **Pele vira sistema** (§496–§519): tom + roughness + micro-variação + tint regional + decals (sardas/pintas/cicatrizes/maquiagem como layers), paleta ampla e neutra, skin tone global (hard fail se só na cabeça — §549–§550), materiais de pele identificados por metadata (§695–§697).
6. **Expressões de rosto inteiro** (§457–§469): registry semântico de morphs (`face_smile`, `eye_blink_l`… — §462), naming independente do GLB (§463–§464), blend combinável (§465), presets neutral/smile/confident/surprised/serious/happy (§458), intensidade (§468), idle = "neutral alive" (§459).
7. **Idade visual** em estágios young_adult/adult/mature, mesma identidade + progressão (§562–§574); **assimetria sutil** embutida nos presets (§579–§584); personalidade por expressão/pose, não anatomia (§575–§578).
8. **Face LOD** com identidade preservada (§520–§529), topologia/rig leve (§530–§533), câmera com focus mode por categoria, bookmarks, zoom e reset (§537–§542), UI visual-first em duas camadas SIMPLE/ADVANCED com tabs (§543–§548, §641, §673–§676).
9. **2D clássico tem elevação própria**: face shapes reais, shading/gradiente controlado, olhos com sclera/íris/pupila/highlight/pálpebra, nariz com volume, mais bocas/sobrancelhas, oclusão e camadas de profundidade — "premium illustration, não fake 3D" (§620–§632); identidade 2D↔3D via mapping `face_id/hair_id/skin_id` (§633–§638).
10. Gate de aceite (§701–§708): 4 goldens não-irmãos, 3 tons OK em Studio e Hero, olhos vivos, neutral+smile+serious, close-up sem artefato (gate absoluto §665), FPS OK, trocar cabelo/barba/óculos não quebra a face. 20 deliverables (§709) e ordem §710: AUDIT → HEAD/FACE BASE → EYES → SKIN → BROWS/NOSE/MOUTH → EXPRESSIONS → BEARD FIT → AGE → LOD → 2D → VISUAL QA.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Auditoria facial + Face Families + base neutra | §412–§417, §420–§421, §709.1–2 | Rosto como sistema composto; famílias estruturais (oval/round/square/long/heart/angular…); head shape separado de face shape; skin variant ≠ new face | **Parcial (2D)**: `engine/partes/bases.ts:BASES` (21 bases humanas: `bas_classica`, `bas_angular`, `bas_redonda`, `bas_coracao`, `bas_quadrada`, `bas_longa`, `bas_diamante`, `bas_triangular`, `bas_bochechudo`, `bas_veterano`, `bas_juvenil`, `bas_madura`…) + `partes/especies.ts` (16 espécies). Base desenha pescoço+cabeça+orelhas+gradiente de pele (`defsPele`, `rimLight`). **3D**: bases UBC `base_superhero_m/f` (rig ubc-v1, meshes `Face`/`Eyes`/`Eyebrows`, **0 morph targets**) + Quaternius `humano_*` (`poc3d/catalogo3d.ts:VARIANTES_HUMANO`); nenhuma taxonomia de "face family" | Não há conceito de family/metadata facial; `bas_sardas`, `bas_gotico` são "skin variants" classificadas como bases; 3D sem head/face shape independentes |
| Golden Face Set + Skin Calibration + Before/After | §418–§419, §503, §594–§598, §660–§661, §666, §701–§703 | 4 rostos hero distintos; 3 tons light/medium/dark; renders Studio/Portrait/Hero/Neon; screenshots front/¾/perfil/close-up | **Parcial**: goldens 2D byte-stability executáveis (`scripts/avatar/testes/golden-avatars.mjs` → `docs/AVATAR-STUDIO-6/golden-avatars.json`, g01–g16) são de **regressão de bytes**, não de qualidade facial. Captura 3D com LOD alto + supersampling existe (`as5.captura3d_v2`, `as5.foto3d`). Nenhum "golden face" visual | Falta conjunto de referência, matriz câmera×luz e relatório before/after |
| Morph facial modular + envelope | §422–§426, §432–§438, §450, §454, §479, §484 | `face_width`, `jaw_width`, `eye_open`, `nose_width`, `mouth_width`… com limites homologados; UI com poucos sliders/presets | **Parcial (2D)**: `engine/params.ts:PARAMS_POR_CATEGORIA` só `olhos.escala` (0.8–1.2) e `boca.escala` (0.8–1.2) via wrapper `<g transform>` em `CENTRO_ESCALA`; presets §105 em `workspace/PainelCatalogo.tsx` (suave/marcante/expressivo). **3D**: `Renderizador3d.ts` aplica morfos **estruturais de corpo** por escala (`as5.morfos3d`); `Assembler3d.ts` passo 4 registra "base sem morph targets" | Sem morphs faciais reais em nenhum renderer; sem registry/envelope; 2D só escala |
| Olhos (globo, íris, sclera, pálpebras, shape/spacing/height/tilt, catchlight, eye shader, especiais) | §427–§442, §526, §602–§604, §668 | Olho premium com globo real no 3D; íris com profundidade; sclera não-#FFFFFF; catchlight segue luz; cor da íris separada; shape families; LOD cuidadoso | **Parcial**: 2D `partes/olhos.ts:OLHOS` (41 itens; `olhoHumano()` = esclera `#fdfdfa` + íris fixa `IRIS='#4a3626'` + pupila + 1 highlight fixo + traço de pálpebra; sobrancelha embutida no item). **Cor da íris NÃO é canal** (`SlotCor` = pele/cabelo/roupa/destaque; `olh_heterocromia` é exceção autoral). 3D: UBC tem mesh `Eyes` com material `MI_Eyes`, sem tratamento específico (`Materiais3d.canalDoMaterial` só reconhece hair/beard/skin) | Sem canal/param de cor de íris; sem eye shapes paramétricos; sem eye shader/catchlight dinâmico; sem eye LOD explícito |
| Blink / look-at / eye contact | §443–§447, §578 | Piscada com intervalo variável e natural; micro olhar sutil; retrato olha para câmera | **Existe (parcial)**: 2D pálpebras `data-anim="palpebras"` em `engine/render.ts` (modo palco) + WAAPI em `components/PalcoCinema.tsx` e `workspace/vida.ts` (intervalo 2.8–7 s, `as6.vida_shell`); flag `piscar` por item. 3D: olhar segue cursor `Animacoes3d.ts:alvoOlhar/OLHAR_MAX` (§439) no head bone; vida procedural (respiração/micro-cabeça) em `Renderizador3d.ts` (`vida`); **sem blink 3D** (nenhum morph/mesh de pálpebra) | Blink 3D inexistente; look-at 3D é de cabeça, não de olho; sem "eye contact toggle" em retrato |
| Nariz | §448–§451, §627, §671 | Nariz como estrutura (bridge/tip/width/length); families; categoria explícita a avaliar | **Não existe**: nenhuma categoria `nariz` em `domain/types.ts:CategoriaId`, `AvatarCatalog.ts:CATEGORIAS`, `ORDEM_CAMADAS`; bases 2D não desenham nariz; 3D vem baked na mesh | Categoria nova (2D) + morphs (3D) |
| Boca, dentes, visemes | §452–§456, §470–§474, §626, §669 | Boca com volume/lábios/corners; mouth morphs; smile envolve bochechas/olhos; dentes integrados; arquitetura p/ visemes | **Parcial (2D)**: `partes/bocas.ts:BOCAS` (40 itens, traços + sombra `p.pele.escuro`; vários são props temáticos — bigode, barba, cavanhaque, máscara, palito, neon — misturados com expressões). 3D: boca baked, sem morphs | Mistura boca×barba×props na mesma categoria; sem mouth morphs; sem dentes 3D; sem contrato viseme |
| Sobrancelhas / cílios | §475–§482, §628, §670 | Brows como sistema separado do cabelo (cor independente), families, volume, morph/position, animação; cílios opcionais | **Não existe como categoria**: sobrancelha é parte do item de olhos (`olhos.ts:sobrancelha()` usa `p.cabelo.escuro`; forma varia só por inclinação 0/±1/±2). 3D: mesh `Eyebrows` nas bases UBC mapeada ao canal `cabelo` em `catalogo3d.ts:slots` | Sem categoria/canal/morph de sobrancelha; cor sempre acoplada ao cabelo |
| Orelhas / earrings | §483–§485, §529, §611, §672 | Ear morphs; pontos de referência estáveis p/ brincos | Orelhas desenhadas na base 2D (elipses fixas em `G.orelhaY`); slot `acessorio_orelha` existe (#140, `workspace/acessorios.ts`). 3D: socket `ears` no contrato | Sem variação de orelha |
| Facial hair (barba) fit | §486–§495, §528, §606, §708 | Barbas detalhadas; seguir mandíbula; cor independente com sync; densidade; fit profiles; colisão com bigode/expressão; LOD | **Parcial**: 2D barbas estão em `bocas.ts` (`boc_bigode`, `boc_barba`, `boc_cavanhaque`) — **conflitam com expressão** (slot único). 3D: `Partes3d.ts` tipo `parte_barba` (`cab_barba`, flag `as5.cabelo3d`), canal `cabelo` via `Materiais3d.canalDaCategoria` | Barba não é slot próprio no 2D; cor não independente; sem fit profiles |
| Pele como sistema | §496–§519, §549–§552, §572, §585–§590, §692–§697 | Tom + roughness + micro-variação + tint regional; paleta ampla neutra; skin global em todas as regiões; decals; skin material identificado | **Parcial**: 2D `AvatarCatalog.ts:CORES_SUGERIDAS.pele` = **8 hex** (6 humanos + 2 fantasia), ordem clara→escuro; `engine/cores.ts:tinta()` deriva claro/escuro/profundo; gradiente radial em `bases.ts:defsPele`; Color Studio HSL (`as6.color_studio`). 3D: `Materiais3d.aplicarPipelineCores` tinge canal `pele` **só por nome** (`/skin|pele/`); `Assembler3d.ts` idem. **Achado**: materiais das bases UBC chamam-se `MI_Superhero_Male/Female` → pele **não tinge** (pendência "base não nomeia material de pele") — viola §549/§550/§696 | Paleta curta e hierárquica; sem roughness/tint/decals; identificação de pele por metadata inexistente (manifest §517 não declara materiais de pele) |
| Expressões (registry, presets, intensidade, microexpressão, personalidade) | §457–§469, §534–§536, §575–§578, §651, §705 | Registry semântico `face_smile`…; blend combinável; presets; intensidade; neutral alive; head pose separado | **Parcial**: 2D expressão = **troca de asset** (`shell/ShellStudio.tsx:PERSONALIDADES` §117 e `EMOTES` §120 = combos olhos+boca); `domain/animacao.ts:AssetAnimacao` tipo `'expressao'` é só contrato com `ANIMACOES=[]`. 3D: só androide (`catalogo3d.ts:MORFOS_ANDROIDE` Angry/Surprised/Sad, `Config3D.morfos`); máquina `Animacoes3d.MaquinaAnimacao` (estados idle/pose/emote…) | Sem registry humano; sem blend; expressão 2D não é campo (é asset) — difícil "intensidade"; 3D humano sem morphs |
| Idade visual + assimetria | §562–§574, §579–§584 | Estágios young_adult/adult/mature; mesma identidade; age morphs sutis; assimetria embutida | **Não existe como parâmetro**: idade é asset (`bas_juvenil`, `bas_veterano`, `bas_madura`, `olh_cansado`); Modo Item/consultor não tratam idade | Campo/estágio inexistente; sem age morphs |
| Face LOD / topologia / rig | §520–§533, §707 | Identidade igual entre LOD0/1/2; eye/brow/beard/ears LOD; rig leve (morphs > bones) | **Parcial**: LOD por tier `Personagens3d.lodPorQualidade` (lod0/1/2, gate `pipeline-assets-3d.md` 60k/25k/8k tri); LOD por tela `as5.progressivo3d`; `QualityManager.ts`. Sem critério facial (lod1 do superhero = lod0 em triângulos; lod2 meshopt cego à face) | Sem preservação explícita de olhos/rosto na decimação; sem teste de identidade entre LODs |
| Câmera/focus mode/bookmarks | §537–§542, §546 | Aproximar por categoria (rosto→olhos→boca), transições suaves, bookmarks face/eyes/mouth/brows/beard, zoom manual, reset | **Existe (parcial)**: 2D `ShellStudio.tsx:ENQUADRAMENTOS` (base/cabelo/olhos/boca/acessorio…) + presets manuais `PRESETS_CAM6` rosto/busto/corpo (`as6.viewport`); `workspace/contexto.ts` ("câmera no rosto"). 3D: `Renderizador3d.enquadrar('rosto'|'auto')`, `CameraRig3D` presets corpo/busto/rosto/tresquartos, `as5.palco3d_cine` | Sem bookmarks eyes/mouth/brows/beard no 3D; sem hover ¾; "reduzir head movement ao editar rosto" (§537) não existe |
| UI facial (tabs, visual-first, thumbs maiores, hover ¾, preview temporário, skin tone no topo, presets completos, randomize homologado, favoritos/recentes, undo) | §543–§548, §553–§558, §639–§647, §673–§681 | Cards visuais grandes, tabs shape/skin/eyes/mouth/brows, preset LOOK FACE, weighted random, busca/filtros, sem rarity em traços básicos | **Parcial**: taxonomia v2 `workspace/taxonomia.ts` (Personagem: Rosto/Cabelo/Olhos/Boca); prévia no hover (`GradeItens.tsx` "Prévia"); Modo Item thumbs (`as6.thumb_item`); `aleatorio/aleatorioInteligente` (`AvatarCatalog.ts`) sem envelope facial; favoritos/recentes (`FavoritosCategorias.ts`, `Recentes.ts`); undo/redo (`as5.undo_redo`); cores no topo? Color Studio na seção Cores | Sem tabs faciais (skin/brows/nose), sem preset de rosto completo, sem randomize facial homologado; raridade aplicada a bases (`bas_angular` é "incomum" — fere §647) |
| Photo Studio face controls | §648–§657 | Expression/gaze/head angle/portrait lighting; eye contact toggle; head angle presets; LOD0 + AA na captura; DoF nunca nos olhos | **Parcial**: captura 3D alta (`as5.captura3d_v2`, `as5.foto3d` com pose Idle UAL); câmera 3D 'rosto'/'tresquartos'; luz contextual 2D (`as5.luz_contextual`); **sem** controles de expressão/olhar/ângulo no Photo Studio | Controles faciais da foto inexistentes |
| Pipeline/QA facial/metadata/licença | §658–§665, §682–§700 | Testes: morph existe, eye meshes, materiais, LOD, bounds; metadata `faceFamily/genderAffinity/visualQuality/morphSupport/skinSupport/rendererSupport/lodSupport`; resolução por manifest; texture budget | **Parcial**: `scripts/avatar/assets3d/validar-asset.mjs` + `publicar-asset.mjs` (gltf-transform/meshopt, gate de tri/textura); manifest §517 (`Personagens3d.ts:ManifestPersonagem3d`) sem campos faciais; `MetadadosAssets.ts` (autor/origem/licença/tags) sem campos faciais; `ManifestCatalogo.ts`; progressivo/IndexedDB (`as5.progressivo3d`) | Sem validações faciais; sem metadata facial; sem priorização face>eyes>hair no loading |
| Coerência 2D↔3D / identity mapping | §633–§638 | `face_id/hair_id/skin_id` entre renderers; UI indica compatibilidade | **Parcial**: `Personagens3d.ts:MAPA_BASE_3D` (base 2D → personagem 3D, só espécies/androide; humanos → `humano_casual`); `Materiais3d` usa o MESMO vocabulário de canais §73; `nucleo/estado-vnext.ts` capability registry (`suportaMorfos`) | Mapping facial semântico inexistente; nenhum indicador "3D-only/Classic-only" no card |

---

## 3. Já coberto (referenciar) e prerequisitos

**Já coberto / reaproveitável:**
- Blink 2D e vida (PalcoCinema/vida.ts, `as6.vida_shell`) — revisar timing §443, não recriar.
- Olhar 3D §439 (`Animacoes3d.alvoOlhar`) e máquina de estados §433 — base para look-at ocular e para "expressão como estado".
- Material Manager `Materiais3d.ts` (§695 manda **preservar** a abordagem rigorosa de não chutar pele).
- Câmera contextual 2D/3D (R2 `ENQUADRAMENTOS`, `as6.viewport`, `enquadrar('rosto')`) — estender, não reescrever.
- Params §71 (`engine/params.ts`) — framework de wrapper pronto para morphs 2D "leves" (escala/deslocamento por feição) sem tocar arte.
- Goldens de bytes (g01–g16) — rede de segurança obrigatória para qualquer onda desta parte.
- Pipeline gltf-transform (`publicar-asset.mjs`/`validar-asset.mjs`) — lugar natural das validações §658.
- Taxonomia v2 (`taxonomia.ts`) — já tem "Personagem: Rosto/Cabelo/Olhos/Boca"; novas principais (Sobrancelhas/Nariz/Pele/Expressão) entram como dado.

**Prerequisito de outras partes:** Parte 4 (cabelo/barba: hairline §607–§611, brow volume §478, beard fit §491–§495), Parte 5+ (materiais/iluminação: portrait light rig §591–§593, skin light response §590), Photo Studio (§648–§657), LOD/performance (§686–§691), Art Bible (§709.20). A Parte 3 depende da Parte 12 (P0: Art Bible, Quality Bar, Golden/Visual QA, regressão visual) e da Parte 2 (golden body — a face neutra herda a base UBC).

---

## 4. Conflitos/risco com regras invioláveis e contorno

| Risco | Contorno |
|---|---|
| **Byte-stability**: qualquer campo facial novo (`expressao`, `idade`, `morfosFace`, `cores.iris`, `cores.sobrancelha`) muda o JSON | Campo NOVO opcional, neutro = **omitido** em `validarConfig` (mesmo padrão de `corpoFino`/`params`); render sem o campo = fragmento idêntico; goldens g01–g16 + novos goldens "gNN-face-*" gravados no mesmo commit. Cor de íris/sobrancelha como canal novo em `SlotCor` exige cuidado: `cores` é `Record<SlotCor,string>` obrigatório no PHP (`studio.php` exige os 4) — preferir **`coresFace?: {iris?, sobrancelha?, labios?}` opcional** em vez de ampliar `SlotCor`. |
| **Nunca editar arte em partes/***: olhos/bocas/bases atuais têm íris fixa, sclera `#fdfdfa`, sobrancelha embutida | Artes NOVAS (`olh2_*`, `boc2_*`, `bas2_*`, `nar_*`, `sob_*`) em arquivos novos (`partes/olhos-v2.ts`, `partes/narizes.ts`, `partes/sobrancelhas.ts`); íris paramétrica só nas artes novas (recebem `Paleta` estendida); artes antigas seguem como "clássico legado". Sobrancelha separada: itens de olhos v2 **sem** sobrancelha + categoria `sobrancelha`; os 41 olhos legados continuam com a sua. |
| **Flags**: tudo atrás de `as6.face_v2` (guarda-chuva) + filhas (`as6.face_olhos`, `as6.face_pele`, `as6.face_expressao`, `as6.face_3d_morphs`, `as6.face_2d_nariz_sobrancelha`), com pais em `DEPENDENCIAS` de `nucleo/flags.ts`; nomes do §2917 (`avatar_visual_v2`) adaptados ao padrão as6.* | Categorias novas **ocultas** sem flag (precedente `roupa_sobre`: `categoriasAtivas()` filtra, `validarConfig` aceita sempre — forward-compat). |
| **PHP espelhado**: novas chaves de `camadas` (`nariz`, `sobrancelha`, `barba`) e campos (`expressao`, `idade`, `coresFace`) | Espelhar em `api/avatar/studio.php` (`$categorias`, enums fechados, clamps). |
| **Licenças/assets 3D**: morph targets faciais NÃO existem nos GLBs CC0 atuais (UBC Standard, Quaternius); criar exige DCC (Blender) ou pacote novo | Só assets CC0/licença clara; registrar proveniência no manifest §517 (`licenca`). Morphs autorados internamente em Blender → documentar ferramenta no manifest (pipeline §73). Sem morph, fallback = expressão por **troca de textura de olhos/boca + escala de bones (Head/neck)** — nunca "pintar material errado" (§697). |
| **Bundle/perf**: eye shader, normal maps faciais, texturas 2K | Só no tier `alto`/captura (QualityManager); texture budget facial explícito no manifest; sem libs novas (usar `MeshPhysicalMaterial`/onBeforeCompile). |
| **Raridade em traços básicos** (§644–§647) vs catálogo atual (`bas_angular` incomum, `bas_androide` épico) | Não mudar raridade de itens existentes (progressão/coleções dependem); itens novos de rosto/pele/nariz/sobrancelha nascem `comum`; registrar decisão. |
| **Skin tint 3D não atinge bases UBC** (`MI_Superhero_*`) — hard fail §550/§697 latente | Corrigir por **metadata no manifest** (`materiais: { pele: ['MI_Superhero_Male'], olhos: ['MI_Eyes'], sobrancelhas: ['MI_Hair_1'] }`) lido por `Materiais3d.canalDoMaterial` — nunca regex mais agressiva (§418/§695). |

---

## 5. Proposta de ONDAS

Prioridade conforme Parte 12: **P0** (foundation/quality lock) → **P1** (premium core) → **P2** (scale). Ordem interna = §710.

### P3-A — Auditoria facial + Face Families + metadata + skin material fix (P0, esforço M)
Objetivo: §709.1–2, §698, §695–§697 — mapa do que existe e contratos de dados, zero mudança visual.
1. Auditoria facial 2D/3D (§412, §709.1): doc `docs/AVATAR-STUDIO-6/face-audit.md` com inventário (21 bases, 41 olhos, 40 bocas, UBC meshes/materiais) e matriz "é face / é skin variant / é prop" (§420). Flag: n/a (doc). Teste: script `scripts/avatar/testes/face-inventario.mjs` que conta e falha se item de olhos/boca sem classificação.
2. `services/FaceFamilies.ts` (§415, §449, §453, §477): registry em dados `familiaDe(itemId)` para base/olhos/boca (oval/round/square/long/heart/angular…; eye round/almond/narrow…; mouth wide/thin/full…). Sem flag (dado puro). Teste unitário de cobertura 100% dos ids.
3. Metadata facial §698 em `MetadadosAssets.ts` (campos `faceFamily`, `genderAffinity`, `morphSupport`, `skinSupport`, `rendererSupport`, `lodSupport`) — derivação determinística. Teste: snapshot.
4. Manifest §517 v2: campo opcional `materiais` (pele/olhos/sobrancelhas/dentes) em `Personagens3d.ts:ManifestPersonagem3d` + `Materiais3d.canalDoMaterial` lê marca de manifest antes do regex (§696). Regenerar `manifest.json` de `base_superhero_m/f` com `materiais.pele=['MI_Superhero_*']`. Flag `as6.face_skin_meta`. Teste: `assembler.mjs` passa a exigir "N material(is) de pele" nas bases UBC.
5. Mapeamento de identidade §634: `services/IdentidadeFace.ts` (`face_id/skin_id/hair_id` 2D↔3D) estendendo `MAPA_BASE_3D`; card indica `rendererSupport` (§635). Flag `as6.face_v2`. Teste unitário.
6. Decisão registrada: nariz/sobrancelha/barba como categorias novas (2D) — schema e PHP preparados (aceitação incondicional, UI oculta). Espelho `studio.php` `$categorias` += `nariz`, `sobrancelha`, `barba`. Goldens g01–g16 intactos.
7. Quality Bar facial (§664): tabela de score por critério em `docs/AVATAR-STUDIO-6/face-quality-bar.md` + lista Hard/Soft Fail (§662–§663).
Dependências: Parte 12 (Art Bible/Quality Bar); Parte 2 (golden body).

### P3-B — Golden Face Set + Skin Calibration + renders de referência (P0, esforço G)
Objetivo: §418–§419, §503, §594–§598, §660–§661, §666.
1. Definir 4 Golden Faces (M01/M02/F01/F02) como **configs canônicos** 2D (`docs/AVATAR-STUDIO-6/golden-faces.json`) com ≥3 tons de pele e famílias distintas; 3D = UBC m/f × 2 receitas de cabelo/barba/cor. Teste: novos goldens `g17–g20-face-*` em `golden-avatars.mjs`.
2. Skin Calibration Set light/medium/dark (§503): 3 hex canônicos + tabela de `tinta()` derivada; teste de contraste mínimo entre claro/escuro/profundo (§500–§502).
3. Script `scripts/avatar/face-goldens.mjs`: renderiza cada golden em front_neutral/front_smile/34/profile/eyes_closeup/mouth_closeup/skin_studio/skin_hero (§660) via harness Playwright (2D: palco + presets cam; 3D: `enquadrar('rosto')`, câmeras `rosto`/`tresquartos`, luzes `estudio`/`hero`/`neon`) → `storage/face-goldens/<data>/` (fora do público). Flag: dev-only.
4. Before/After (§661): o mesmo script guarda baseline "antes" uma vez; doc de comparação.
5. Teste de identidade entre LODs (§523–§524): para cada golden 3D, renderizar lod0/lod1/lod2 mesma câmera e medir diferença perceptual (hash/SSIM simples em canvas) com limiar; falha = tripwire.
6. Checklist humano (§595–§597, §659): template de validação visual do Jhony (front/side/¾/close/smile/blink/head turn).
Dependências: P3-A; Parte 12 regressão visual.

### P3-C — Olhos premium 2D + íris/sclera/catchlight + blink/look-at revisados (P1, esforço G)
Objetivo: §427–§447, §625, §668, §704.
1. `partes/olhos-v2.ts` (arte NOVA, ids `olh2_*`): 8–10 eye shapes (round/almond/narrow/large/small/tilted up/down) com sclera quente (`#f6f1ea`), íris em 2 tons + anel + pupila + 2 highlights, pálpebra superior/inferior; **sem sobrancelha** (vai p/ P3-D). Flag `as6.face_olhos`. Golden novo.
2. Cor de íris (§429): `AvatarConfig.coresFace?.iris` (hex; ausente = cor autoral do item) + `engine/cores.ts:Paleta.iris?` só consumida por artes v2; `validarConfig` + `studio.php`. Paleta curada (castanho/mel/verde/azul/cinza + especiais de coleção). Teste: ausente ⇒ bytes iguais.
3. Params de olhos v2 (§435–§438): `PARAMS_POR_CATEGORIA.olhos` ganha `espacamento` (-4…+4 px), `altura` (-3…+3), `inclinacao` (-6…+6°) via wrappers transform por olho (grupos `data-olho="e|d"` nas artes v2); legado segue só `escala`. Clamps = envelope (§426). Teste de clamp/omissão.
4. Catchlight que segue a luz (§439–§440): no palco 2D, `luz_contextual` (`as5.luz_contextual`) move o highlight via CSS var em grupo `data-anim="catchlight"` (apresentação, nunca no SVG salvo). Flag `as6.face_olhos`.
5. Blink revisado (§443–§444): `workspace/vida.ts` intervalo variável 2.5–6.5 s, duração 120–160 ms, double-blink ocasional, dessincronizado da respiração; pálpebra v2 como forma (não elipse) p/ artes v2. Teste: movimento reduzido desliga.
6. Look-at 2D sutil (§445–§447): grupo `data-anim="olhos"` já existe — micro-offset ±1.5 px com retorno ao centro; "olhar para câmera" em retrato/foto (toggle §649) = offset 0. Flag `as6.face_olhos`.
7. Cards de olhos maiores/visual-first (§543–§545) na dock: tamanho `g` para categorias faciais via `DockAssets`. Flag `as6.face_v2`.
Dependências: P3-A/B; Color Studio.

### P3-D — Sobrancelhas + nariz + boca v2 + barba como slot (2D) (P1, esforço G)
Objetivo: §448–§456, §475–§482, §486–§495, §626–§628, §669–§671.
1. Categoria `sobrancelha` (`CategoriaId`, `CATEGORIAS`, `ORDEM_CAMADAS` após `olhos`, `taxonomia.ts` principal "Sobrancelhas"): `partes/sobrancelhas.ts` com 10–12 families (grossa/fina/reta/arqueada/curta/longa/natural/estilizada), cor = `coresFace.sobrancelha ?? cabelo.escuro` (§476). Flag `as6.face_2d_v2`; PHP. Teste: golden legado sem a camada = bytes iguais.
2. Params sobrancelha (§479): `altura`, `angulo`, `espacamento` (wrappers). Clamps homologados.
3. Categoria `nariz` (§448–§451, §671): `partes/narizes.ts` 8 families (narrow/wide/short/long/straight/soft/defined/button) com bridge+tip+narina em 2 tons de pele; ordem após `boca`, antes de `olhos`; opcional ("nenhum" = legado). Flag idem; PHP.
4. `partes/bocas-v2.ts` (`boc2_*`): 8–10 bocas com lábio superior/inferior, canto, volume, cor integrada ao tom de pele (§506) + `coresFace.labios` opcional (§507); expressão separada de morfologia: item = forma; `expressao` (P3-E) modula. Flag idem.
5. Barba como slot próprio 2D (§486–§489): categoria `barba` (`partes/barbas.ts`, 8 estilos: rala/curta/cheia/desenhada/bigode/cavanhaque/longa/especial) desenhada **após boca e antes de olhos**, cor `coresFace.barba ?? cabelo`; os 3 itens legados em `bocas.ts` seguem (sem quebrar saves) mas `FaceFamilies` marca-os como "prop". Flag `as6.face_barba`; PHP.
6. Beard fit 2D (§491–§494): barbas desenham por base family (máscara/clip por `requerBase`? não — usar `variantes` por family via `FaceFamilies`): 2 variantes de largura (narrow/broad) escolhidas pelo `familiaDe(base)`. Teste: cada barba × cada base humana renderiza sem sair do viewBox (bounds medidos `medir-foco-item.mjs`).
7. Mouth/nose params leves (`largura` wrapper scaleX ±10%) — envelope.
8. Occlusão 2D (§630): cabelos v2 futuros respeitam máscara do rosto (clipPath da base exposto como `defs` id `${uid}rosto`) — só infraestrutura nesta onda (nenhuma arte existente muda).
Dependências: P3-C; Parte 4 (barbas premium 3D).

### P3-E — Expressões (registry, presets, intensidade) + idade + assimetria — 2D e contrato 3D (P1, esforço G)
Objetivo: §457–§469, §534–§536, §562–§584, §705.
1. `domain/expressoes.ts`: **Human Facial Morph Registry** semântico (§462) — ids `face_smile`, `face_frown`, `face_surprise`, `face_angry`, `eye_blink_l/r`, `brow_raise_l/r`, `brow_furrow`, `mouth_open`, `mouth_corner_l/r`, `cheek_raise`… com tipo/limites; sem acoplamento a nomes de GLB (§463–§464).
2. Presets de expressão (§458, §467): `neutral`, `smile`, `confident`, `surprised`, `serious`, `happy` = mapas morph→peso (§465) + `intensidade` 0.3–1 (§468) + restrições de combinação (§466). `AvatarConfig.expressao?: { preset, intensidade }` — `neutral`/1 omitidos; PHP espelhado. Flag `as6.face_expressao`.
3. Aplicação 2D por **wrappers** sobre grupos `data-olho`, `data-sobrancelha`, `data-boca` das artes v2 (rotate/translate/scale curtos) — artes legadas: expressão não se aplica (continua via EMOTES/PERSONALIDADES). Teste: goldens legados intactos; golden novo `g-face-smile`.
4. Idle "neutral alive" (§459–§460) e Face Idle Profiles (§577–§578): perfis neutral/confident/friendly/serious em `workspace/vida.ts` (micro canto de boca, micro-olhar), respeitando reduced-motion.
5. Idade visual (§562–§574): `AvatarConfig.idade?: 'young_adult'|'adult'|'mature'` (adult omitido) → 2D: wrappers sutis (sombra sob olhos via overlay novo `partes/idade.ts`, linhas finas, cheek volume ≈ scale 0.98/1.02 na região); nunca troca base; separado de expressão (§574). PHP enum fechado. Teste de progressão (§566): mesmo config × 3 idades = 3 goldens.
6. Assimetria sutil (§579–§584): embutida nos presets v2 (offset ≤1 px num lado) — sem slider; determinística por hash do config (`hashConfig`) para não variar entre renders.
7. 3D (contrato): `services/ExpressoesFace3d.ts` mapeia registry → `morphTargetDictionary` via manifest `morphs: { face_smile: 'Smile' }` (§463); quando base sem morph (todas hoje), fallback = **sem expressão** (nunca pintar errado). Teste unitário com GLB sintético de morph (fixture JSON). Depende de P3-F para ter asset.
8. Expression presets no Photo Studio (§648, §651) — reutiliza `expressao` em `ProjetosFoto` snapshot (Photo = fora do avatar salvo). Flag `as6.face_foto`.
Dependências: P3-C/D (artes v2 com grupos nomeados); Parte 12 flags.

### P3-F — Face 3D premium: head/face base, olhos reais, morphs, skin material (P1, esforço G — assets externos)
Objetivo: §416, §421–§426, §428–§433, §441, §496, §515–§517, §530–§533, §585–§589.
1. Decisão de base facial 3D (§416): (a) autorar morphs faciais nas bases UBC m/f em Blender (shape keys semânticas; licença CC0 permite) ou (b) adotar pacote CC0 com blendshapes (ex.: avaliar RPM-like CC0 / Quaternius com morphs, se existir). **Pergunta bloqueante** (ver §6).
2. Pipeline: `publicar-asset.mjs` preserva morph targets (gltf-transform `simplify` com `targets`), `validar-asset.mjs` checa presença dos morphs do registry e meshes `Eyes`/`Teeth` (§658). Manifest §517 `morphs`/`materiais`/`lodSupport`.
3. Eye material (§441): `Materiais3d.ts` perfil `olhos` (MeshPhysicalMaterial: clearcoat baixo, roughness 0.15, envMap) aplicado só a materiais marcados `olhos` no manifest; cor da íris = `coresFace.iris` multiplicativa em textura de íris (§693). Flag `as6.face_3d`.
4. Skin material (§515–§517, §585–§589): roughness/specular calibrados por Skin Calibration Set; normal map sutil só no tier alto; AO facial limitado. Tint preserva textura (§694) — já multiplicativo.
5. Blink 3D (§443–§444) via `eye_blink_l/r` quando existirem; look-at ocular (§445) rotação de mesh `Eyes` ±4° + cabeça §439; eye contact em retrato (§447, §649).
6. Expressões 3D (registry P3-E) na máquina §433 (estado `emote`/`pose`) e no `as5.foto3d`.
7. Face LOD (§520–§529): lod1/lod2 com decimação que protege `Eyes`/`Face` (gltf-transform `simplify` por mesh com ratio diferenciado); eye LOD nunca perde highlight antes de lod2. Teste §524.
8. Camera bookmarks 3D (§540–§542): `Renderizador3d.enquadrar('olhos'|'boca'|'sobrancelhas'|'barba')` + reset; reduzir vida/olhar ao editar rosto (§537); hover ¾ (§546) opcional.
Dependências: Parte 2 (golden body), Parte 4 (hairline), Parte 5 (luz/portrait rig §591–§593), P3-A manifest.

### P3-G — UX facial duas camadas + Photo Studio + QA automação (P1→P2, esforço M)
1. Tabs faciais (§641): Rosto / Pele / Olhos / Sobrancelhas / Nariz / Boca / Barba / Expressão / Idade como principais da taxonomia v2 (dados); Skin Tone no topo (§548).
2. Preset "LOOK FACE" (§553–§555): `services/PresetsFace.ts` (head+olhos+sobrancelha+nariz+boca+pele) — aplicar = `validarConfig` merge; Randomize Face homologado (§556–§557) com pesos por family.
3. Advanced Face Editor (§674–§676) no Inspector (`as6.inspector`) — só params/morphs acima; SIMPLE = presets.
4. Photo Studio (§648–§657): expression/gaze/head angle presets (Frontal/¾ esq/¾ dir/Perfil) + portrait lighting; captura força LOD0 + AA; DoF nunca nos olhos (focus target = olhos).
5. QA automação (§658): testes `face-qa.mjs` (morph existe, eye meshes, materiais marcados, bounds 2D das feições dentro da cabeça, clipping = hard fail).
6. Favoritos/recentes/busca/filtros para categorias faciais (reuso).
7. Performance (§686–§689): texture budget facial no manifest + gate em `validar-asset.mjs`.

### P3-H — Escala 3x+ (P2, só após gate §701)
Triplicar famílias de rosto/olhos/boca/sobrancelha/nariz; cores de íris estilizadas; decals (sardas/pintas/cicatrizes/maquiagem como layers §508–§514, categoria `marca_facial` reutilizando slot `rosto-marcas`); fantasy ears/cyber eyes como premium (§645); mapping 2D↔3D completo.

---

## 6. Perguntas bloqueantes × dúvidas resolvidas

**Bloqueantes (precisam do Jhony):**
1. **Assets 3D com morph targets faciais**: nenhuma base atual (UBC Standard m/f, Quaternius) tem shape keys. Opções: (a) autorar em Blender internamente (horas de DCC, fora do git até publicar; quem faz?); (b) comprar/baixar pacote com blendshapes — exige licença clara. Sem isso, P3-F fica em contrato. Qual caminho e orçamento?
2. **Olhos reais 3D (globo/íris textura)**: a textura de íris/olhos do UBC (`MI_Eyes`, 7 imagens) pode ser modificada/redistribuída? (CC0 sim, confirmar no `License_Standard.txt` já arquivado em `storage/assets-3d-fonte/`.)
3. **Storage de renders de golden/before-after** (imagens PNG, dezenas de MB): ficar em `storage/face-goldens/` no servidor (fora do público) ou em artefato externo? Nada vai para o repo.
4. **Limiar de aceite visual** do Golden Face Set (§701–§706) é veredito humano do Jhony — agendar validação visual antes de P3-C+ escalar.

**Resolvidas sozinho (decisões a registrar, numeração #155+ a confirmar no status):**
- Cor de íris/sobrancelha/lábios/barba = objeto opcional `coresFace` (não novo `SlotCor`), para não quebrar o contrato PHP dos 4 canais obrigatórios.
- Sobrancelha, nariz e barba viram **categorias novas 2D**, artes novas; itens legados (olhos com sobrancelha, `boc_barba` etc.) permanecem intocados — coexistência, sem migração de saves.
- Expressão e idade = **campos opcionais** aplicados só às artes v2 por wrappers; artes legadas seguem com EMOTES/PERSONALIDADES (troca de asset).
- Raridade dos itens faciais novos = `comum` (§644–§647); raridade dos existentes não muda.
- Skin tint nas bases UBC corrigido por **metadata de manifest**, não por regex (§695 preserva rigor do Material Manager).
- Fallback 3D sem morph = sem expressão (nunca geometria/material errado).
- Nomes de flags: `as6.face_v2` (guarda-chuva) + filhas, em vez de `avatar_visual_v2` do §2917.

---

## 7. Métricas / Acceptance da Parte 3

- **Byte-stability**: goldens g01–g16 inalterados em todas as ondas; novos goldens `g-face-*` gravados no mesmo commit (doutrina #83); suíte `rodar-todos.mjs` verde.
- **Diversidade (§702)**: 4 Golden Faces com `familiaDe()` distintas em base, olhos, boca, sobrancelha, nariz; ≥3 tons de pele do Calibration Set; veredito humano "não parecem irmãos".
- **Pele (§703, §550)**: 3 tons renderizam em Studio e Hero sem estouro/perda de volume; 3D: `aplicarPipelineCores` tinge 100% dos materiais marcados `pele` nas bases UBC (teste `assembler.mjs` deixa de registrar a pendência "não nomeia material de pele").
- **Olhos (§704)**: sclera ≠ #FFFFFF; íris com ≥2 tons + highlight; cor de íris por `coresFace.iris`; blink com intervalo variável (teste mede ≥3 intervalos distintos); look-at amplitude ≤ limites; eye contact em retrato.
- **Expressão (§705)**: neutral/smile/serious funcionam em 2D v2 (goldens) e, quando houver morph, em 3D (teste unitário registry→dictionary); intensidade omitida = bytes iguais.
- **Close-up (§706, §665)**: screenshots `eyes_closeup`/`mouth_closeup` sem artefato (checklist humano) + QA automático de bounds/clipping verde.
- **LOD (§523–§524)**: identidade mantida lod0→lod2 (métrica perceptual abaixo do limiar) para cada golden 3D.
- **Performance (§707)**: close-up 3D no tier alto dentro do baseline `PerfBaseline.ts` (sem queda >15% de FPS vs busto); texture budget facial respeitado no `validar-asset.mjs`.
- **Modularidade (§708)**: matriz cabelo×barba×óculos × 4 goldens renderiza sem clipping (teste de bounds 2D; inspeção 3D).
- **Deliverables §709** (20 itens) rastreados em `docs/AVATAR-STUDIO-6/face-audit.md` + Art Bible; cada onda fecha os seus e atualiza `04-status-do-projeto`.
