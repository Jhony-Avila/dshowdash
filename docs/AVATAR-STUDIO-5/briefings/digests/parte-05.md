# Digest — MEGA_BRIEFING_01 · PARTE 5/12 (§952–§1221)
## Roupas, calças, camisetas, jaquetas, calçados, camadas, tecidos, materiais, deformação, fit corporal, cores independentes e sistema de outfits premium

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 12683–15199. Código auditado em `public/components/panels/panel-avatar-studio/src/` (abreviado `src/`), `public/assets/avatars/3d/`, `scripts/avatar/`, `api/avatar/studio.php`.

---

## 1. Resumo executivo

1. A Parte 5 exige que a roupa deixe de ser "cor sobre geometria" e passe a comunicar FORMA + MATERIAL + CONSTRUÇÃO (§953), com catálogo organizado em famílias (tops/bottoms/footwear §955), três dimensões independentes (categoria × corte × material §954) e dois níveis de edição: outfit preset e peça individual (§956–§958).
2. Pede um modelo formal de slots/camadas (upper_base/upper_outer/lower/footwear/gloves/belt/shoulder/cape §959), layering com compatibilidade, espessura e compressão da camada interna (§960–§964), body masking e clothing masking por regiões semânticas (§965–§967).
3. Fit corporal: roupas acompanham morphs de peso/músculo/ombro/cintura/quadril com envelope homologado e metadados de compatibilidade (§968–§976); rig compartilhado UBC preservado (§969).
4. Quality bars por peça (camiseta, camisa, hoodie, jaqueta, blazer, casaco, armadura, calças, jeans, tênis, sapato, bota §977–§992), tuck/sleeve/collar/boot systems (§993–§998).
5. Sistema de materiais: famílias (cotton…armor_composite §1000), slots internos multi-material com teto de draw calls (§1008–§1012), canais de cor primary/secondary/accent/detail com UI adaptativa (§1013–§1020), compatibilidade material×peça (§1021–§1024), texturas (roughness/normal/AO/albedo neutro §1025–§1029), costuras/botões/zíperes/decals/logos Dshow/padrões (§1030–§1049).
6. Drape, dobras, morphs corretivos, cloth sim opcional para capas/casacos, tiers de física (§1050–§1059); peças periféricas (ombreiras, luvas, pulso, cinto) e matriz de compatibilidade visual/engine (§1060–§1072).
7. Clássico 2D: abandonar peça plana — silhueta, mangas, cintura, comprimento, tokens de material 2D, identidade semântica cross-renderer (§1073–§1084).
8. UX: preview de outfit/peça, câmera auto-foco por tipo de peça, swatches de material, before/after, favoritos, save look, presets versionados, default outfit premium (§1085–§1096), Golden Outfit Set O01–O06 em M+F com cobertura de materiais e testes de cor escura/branca/saturada/metálica (§1097–§1106).
9. LOD de roupa por categoria, budgets de textura/material/draw call/triângulo documentados por contexto, transições sem "corpo nu", QA estática/animação/morph/layering/material/LOD/performance com Hard/Soft Fail e Visual Score (§1107–§1134, §1194–§1206).
10. Distinção real entre peças (base garment + variant, nada de 20 camisetas iguais §1135–§1141), raridade ≠ qualidade mínima (§1142–§1153), manifest/CMS de roupa com proveniência e status visual (§1154–§1162), randomização inteligente, undo/redo, Photo Studio com controle de outfit e framing por bounds (§1163–§1193), Art Bible + anti-patterns, gate Golden Outfit antes de escalar (§1207–§1221).

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Famílias/taxonomia de roupa | 954–955, 1137–1141 | Tops/bottoms/footwear; categoria × corte × material; base garment + variant | **Parcial.** 2D: uma única categoria `roupa` (30 itens `rou_*` em `src/engine/partes/roupas.ts`, campo `tema` livre com 15 valores) + `roupa_sobre` (4 wrappers `sob_*` em `src/engine/sobrepecas.ts`) + calçados como ACESSÓRIO slot `pes` (`workspace/acessorios.ts` subcat `calcados`, 1 arte `ace_tenis_neon`). Taxonomia v2 `workspace/taxonomia.ts` grupo `vestuario` = Roupa/Sobrepeça/Calçados. 3D: `tipo: parte_roupa` sem subtipo (`services/Partes3d.ts:categoriaDaParte`). `VariantesAssets.ts` (`VARIANTES_POR_ASSET`) só cobre acessórios — zero variantes para `rou_*`. | Não há família/corte/material como metadado; não há conceito bottoms/footwear no 2D nem no 3D; variantes de cor de roupa inexistentes. |
| Outfit preset vs peça | 956–958, 1093–1096, 1181 | Presets curados (Executivo…Dshow), peça continua editável, favoritos/save look/presets versionados/default premium | **Parcial.** `services/Conjuntos.ts` (`CONJUNTOS`, 5 itens, `aplicarConjunto` com bloqueios §72.3, flag `as5.roupas_camada`); `PresetsPessoais.ts` (snapshot completo do config, localStorage); `PALETAS_ROUPA` em `AvatarCatalog.ts`. | Conjuntos são roupa+acessórios+paleta sem peças inferior/calçado; sem versionamento de preset; default (`CONFIG_PADRAO`) não é "outfit premium". |
| Slots/camadas (layer model) | 959–964, 1070–1072, 1075 | upper_base/upper_outer/lower/footwear/gloves/belt/shoulder/cape; exclusividade; espessura; compressão interna; Hard Fail de camisa atravessando blazer | **Parcial.** 2D: `ORDEM_CAMADAS` em `src/engine/render.ts` (`roupa` → `roupa_sobre` → … → slots corporais `acessorio_pernas/pes/cintura/pulso_e/d/mao_e/d` da onda 1404, flag `as6.slots_corpo`); `incompativelCom` (usado pelas sobrepeças); `renderCorpo` no corpo inteiro. 3D: `Assembler3d.ts` anexa N partes categoria `roupa` sem ordem/slot; `Palco3d.tsx` escolhe look `ranger|peasant` por prefixo de slug e veste TODAS as peças do gênero (`rou3d_<look>_<m|f>_{corpo,bracos,pernas,botas,capuz,ombreira}`). | Não existe slot `lower`/`footwear`/`gloves`/`belt`/`cape` como CAMADA de roupa (calçado está em acessório); sem matriz de compatibilidade de camadas; sem espessura/compressão. |
| Body masking / clothing masking | 965–967, 1064–1067 | Máscaras por região semântica; peça externa oculta regiões da interna; manga × pulseira | **Parcial (3D)** — `Assembler3d.ts:REGIOES_UBC` + `mascararBase` (§415.2, faces da base por bones), `ParteMontavel.mascara`, `publicar-asset.mjs --mascara`; teste `scripts/avatar/testes/roupas3d.mjs`. **Nenhum dos 20 manifests `rou3d_*` publicados declara `mascara`** (`grep mascara partes/*/manifest.json` = 0). 2D: não há masking (sobrepeça é aditiva). | Máscaras não populadas nos assets; não existe clothing-masking (peça×peça) nem regras manga/pulso. |
| Fit corporal / morphs | 968–976, 1054, 1066, 1126, 1213 | Roupa acompanha weight/muscle/shoulder/waist/hips; envelope; morph bake vs runtime; metadata bodyFamilies/morphEnvelope | **Parcial/mínimo.** 2D: wrapper `envolverFigura` (`TIPOS_CORPO`, `corpoFino` §102/§102.2) escala a figura inteira. 3D: `Renderizador3d.definirCorpo3d` escala `personagem.scale` (XZ/Y) — roupas acompanham porque compartilham esqueleto pós-rebind (`religarParte`). | Não há morph targets reais, envelope por peça nem metadados de compatibilidade corporal; "scaling uniforme" é exatamente o que §968 diz não bastar. |
| Quality bars por peça | 977–992, 1143 | Gola/manga/costura/caimento; jeans=denim; tênis≠bloco; botas integradas à calça | **Não existe como sistema.** Arte 2D atual: busto = `PATH_OMBROS` + gradiente `defsRoupa` + detalhes; corpo inteiro = `corpoInteiro()` (`src/engine/partes/corpo.ts`) scaffold único (calça e sapatos FIXOS no scaffold, cor da paleta) + `renderCorpo` aditivo (§1077 descreve precisamente isto). 3D: GLBs CC0 Quaternius fantasy (peasant/ranger) com `familia: economico`, LODs com triângulos idênticos lod0=lod1=lod2 (ex. `rou3d_ranger_m_corpo` 4606/4606/4606). | Sem quality bar/checklist executável; arte 2D não altera silhueta; 3D sem peças premium. |
| Tuck/sleeve/collar/hood/boot | 993–998, 1168–1169 | Variantes de manga/tuck; gola × barba/cabelo; calça × bota | **Não existe.** Só `incompativelCom` genérico e, no 3D, capuz ranger como parte separada. | Regras e variantes inexistentes. |
| Material system (famílias, multi-material, compat, UI) | 999–1024, 1090–1091, 1211 | Famílias cotton…metal; slots internos; teto de draw calls; material fixo + cor p/ comuns; UI simplificada; swatches | **Parcial (3D, só cor).** `services/Materiais3d.ts` (`aplicarPipelineCores`, `canalDoMaterial`, `TETO_EMISSIVO`, flag `as5.materiais3d`) — recoloração multiplicativa por canal §73, sem noção de família/roughness/normal. `QualityManager.ts`/`as6.quality` (tiers). 2D: `Tinta` (base/claro/escuro/profundo) em `cores.ts` — sem token de material. | Sem famílias de material, sem presets por asset, sem UI de material, sem swatches, sem validação de compat. |
| Canais de cor independentes | 1013–1019, 1100–1102 | primary/secondary/accent/detail; UI adaptativa; testes preto/branco/saturado | **Parcial.** 2D: `usaCores` por item (`roupa`,`destaque`,`pele`) + `coresCamada` §73 (`AvatarCatalog.validarConfig` filtra canais ⊆ usaCores; `render.ts:paletaDa`) + paletas §74 + variantes onda 1401 (`VariantesAssets.ts`, flag `as6.variantes`); PHP espelha `coresCamada` (`studio.php` ~L129–156). 3D: `Canal3d` = mesmos 4 canais. | Só 2 canais efetivos de roupa (`roupa`,`destaque`); sem `secondary`/`sole`; sem variantes para `rou_*`; sem testes de cor extrema. |
| Costuras/botões/zíper/decal/logo/pattern | 1030–1049, 1081 | Decals, logos Dshow sofisticados, padrões (solid/stripe/plaid/camo), pattern masks, UV/texel | **Parcial (2D só via arte fixa).** Flanela xadrez (`rou_flanela`), listras no jersey = hardcoded na arte; emblema 2D (`emblema` em `ORDEM_CAMADAS`, mapeado no peito no corpo inteiro). 3D: passo `emblemas` do assembler é "n/a (§421.1, lote 681+)". | Sem sistema de pattern/decal 2D ou 3D. |
| Drape/dobras/cloth sim/secondary motion | 1050–1059, 1205–1206 | Dobras hierárquicas, morphs corretivos, física simples p/ capa/casaco com tier | **Não existe.** `Animacoes3d.ts`/`Poses3d.ts` só clipes; sem bones de capa. | Inteiro. |
| Compat matrix / outfit engine / smart random | 1061–1072, 1171–1175 | Matriz shirt×blazer etc.; random respeita layers/tema; harmonia de cor | **Parcial.** `incompativelCom`/`requerBase` em `validarConfig`; `aleatorio()` em `AvatarCatalog.ts` (modos completo/cores/categoria/favoritos) respeita bloqueios; `ConselheiroEstilo.ts` (harmonia §235). | Sem matriz de camadas, sem tema-coerência para outfits. |
| Clássico 2D premium | 1073–1084, 1217 | Silhueta/mangas/cintura/comprimento mudam; tokens de material 2D; identidade cross-renderer | **Não existe** (regra: `renderCorpo` aditivo sobre scaffold único; `base-api.ts` comenta "sem isto a roupa só muda a COR do corpo"). | Precisa de NOVO contrato de arte (sem tocar a existente). |
| Preview/câmera/UX | 1085–1092, 1177–1180, 1185–1193 | Cards corpo inteiro; auto-foco por peça; before/after; equip states; undo/redo; framing por bounds | **Parcial.** Modo Item (`components/modoItem.ts:focoItemDe`, medido por `scripts/avatar/medir-foco-item.mjs`); `CameraRig3D` (poc3d); `shell/Equipados.tsx`, `DetalheAsset.tsx`. Undo/redo: verificar `nucleo/estado*.ts` (não auditado em profundidade). | Auto-foco por tipo de peça (pants → full body, shoes → pés) não existe; sem bounds-aware framing. |
| Golden Outfit/Footwear Set + testes de cor | 1097–1106, 1163–1167, 1209–1216 | O01–O06 em M+F; cobertura de materiais; before/after; skin tones | **Parcial.** Goldens 2D byte-stability (`docs/AVATAR-STUDIO-6/golden-avatars.json`, 16 casos, g05-canais-roupa/g03-sobrepeca/g09-corpo-inteiro). Bases 3D `base_superhero_m/f`. | Não há golden VISUAL de outfit nem footwear set. |
| LOD, budgets, loading | 1107–1123, 1194–1204 | LOD por categoria, texturas 2048/1024/512 por LOD (já no pipeline), budgets documentados, prefetch, sem corpo nu | **Parcial.** `publicar-asset.mjs` (simplify meshopt, `TEXTURA_MAX`), `validar-asset.mjs` (gate §631, `medidas.materiais`), `CacheNiveis.ts`, `as5.progressivo3d` (lod2-primeiro), `PerfBaseline.ts`. | Roupas publicadas não têm LOD real (tri iguais); sem budget por categoria (draw calls/material count); "não piscar corpo nu" não verificado. |
| Manifest/CMS/proveniência/status visual | 1154–1162 | Manifest por peça com category/layer/compat/materials/channels/LOD/thumb/license/QA/status | **Parcial.** Manifest §517 (`Personagens3d.ts:ManifestPersonagem3d`: lods, hashes, triangulos, licenca, mascara, familia); `MetadadosAssets.ts`; `LICENCAS.md`. | Faltam layer/compat/materiais/canais/status visual. |
| Photo Studio | 1104–1106, 1182–1192 | Material/pose/drape/luz; LOD alto na captura; foco torso/calças/pés | **Parcial.** `Renderizador3d.capturar` (§508 determinística) usa `tierEfetivo()` — não força lod0; `render-foto.ts` 2D NUNCA recebe roupa (por design). | Captura não força LOD alto; sem foco por peça. |
| Documentação/Art Bible | 1207–1208, 1218 | Art Bible com cuts/materials/folds/stitches/layers/fit/channels; anti-patterns; 22 deliverables | **Não existe** ART-BIBLE.md (docs atuais: `classico-aaa.md`, `pipeline-assets-3d.md`). | Inteiro (depende da Parte 12 P0). |

---

## 3. Já coberto (referenciar) e prerequisitos

**Já coberto — referenciar, não refazer:**
- Canais de cor §73/§74 + variantes (onda 1401) + PHP espelhado: `AvatarCatalog.validarConfig`, `render.ts:paletaDa`, `VariantesAssets.ts`, `studio.php`.
- Sobrepeça `roupa_sobre` (decisão #95, `as6.creator_v6`, schema v2, goldens g03/g16).
- Slots corporais (onda 1404, `as6.slots_corpo`) — já dá "lugar" para calçado/cinto/luvas/pulso no corpo inteiro.
- Body masking 3D (mecanismo `mascararBase` + `--mascara` no publicador) e rebind no rig ubc-v1 (§969 "preservar").
- Material Manager 3D (recoloração por canal, dedup, teto emissivo) e Quality Manager (tiers).
- Pipeline de assets 3D com gates de textura/triângulos por LOD e licenças CC0 (`LICENCAS.md`).
- Conjuntos §72.1/§72.3 e presets pessoais como base do "save look".

**Prerequisitos de outras partes:**
- Parte 12 P0 (Art Bible, Quality Bar, regressão visual, golden tests) é pré-condição para qualquer arte nova desta parte.
- Parte 2 (corpo/body families/morphs) → fit corporal §968–§976; sem morph targets de corpo não há fit de roupa.
- Parte 4 (cabelo) → capuz/gola × cabelo (§996–§998, §1168).
- Parte 6 (acessórios/sockets) → cape socket, ombreiras, luvas × pulso, framing accessory-aware (§1059–§1065, §1193).
- Parte 7/8 (iluminação/câmera/Photo Studio) → material preview, fabric highlight, auto-foco (§1087–§1091, §1182–§1192).
- Esta parte é prerequisito da Parte 6 (layer model + masking) e da escala 3x (P2).

---

## 4. Conflitos/risco com as regras invioláveis e contorno

| Risco | Regra | Contorno |
|---|---|---|
| §1078 pede roupa 2D que mude silhueta/ombros/pernas — hoje o scaffold é único em `corpoInteiro()` | Nunca editar arte em `partes/*`; byte-stability | Novo contrato OPCIONAL no `ParteDef` (ex. `renderCorpoV2`/`silhueta`) usado SÓ quando flag `as6.roupa_premium` ligada e o item declara; itens antigos sem o campo renderizam byte a byte; goldens g09/g16 guardam. Nunca alterar `corpoInteiro` — envolver/condicionar por item novo. |
| Novos campos persistidos (ex. `material`, `roupaInferior`, `calcado`) | Campo neutro OMITIDO; PHP espelhado | Seguir padrão `coresCamada`: `validarConfig` omite quando vazio/padrão; espelhar em `studio.php` na mesma onda; migração só carimba versão (padrão `estado-vnext.ts` v1→v2). Preferir DERIVAR (material fixo por asset em registry de dados) a persistir. |
| Calçado hoje é ACESSÓRIO slot `pes` (onda 1404) e o briefing quer `footwear` como camada de roupa | Nunca quebrar saves/IDs (§3096) | Não re-slotar: manter `acessorio_pes` como slot físico e expor "Calçados" na taxonomia como família de vestuário (já é assim em `taxonomia.ts`). Se surgir camada `calcado` própria, aceitar ambas na leitura. |
| 3D: look de roupa em `Palco3d` é estado efêmero (`useState roupa3d`), não persistido e desacoplado do `camadas.roupa` 2D | Identidade semântica cross-renderer §1083; byte-stability | Criar mapa DERIVADO item 2D → slugs 3D (registry de dados, ex. `services/Roupas3d.ts`), sem campo novo; flag `as6.roupas3d_v2`. |
| Assets 3D premium: geometria/texturas com licença clara | Licenças CC0; sem segredos | Hoje só Quaternius CC0 (fantasy). Peças "Executive/Casual/Urban/Sport/Cyber" não existem em CC0 conhecido — ou autorar internamente, ou Jhony aprova fonte/compra (bloqueante §6). |
| Normal/roughness maps e multi-material aumentam bundle/memória | Sem libs pesadas; gates §631 | Texturas fora do bundle (assets estáticos), KTX2 quando §465 existir; teto de materiais por peça no `validar-asset.mjs` (`medidas.materiais` já é medido — virar gate). |
| Cloth sim / physics | Bundle + performance | Não adotar lib de física; se fizer, bones simples + spring procedural próprio sob `as6.cloth_motion`, desligado em econômico. |
| Pattern/decal 2D via `<pattern>` SVG muda bytes do SVG salvo se aplicado a item antigo | Byte-stability | Pattern só em itens NOVOS ou por campo novo omitido quando `solid`. |
| §1096 default outfit premium muda `CONFIG_PADRAO` | Avatares salvos nunca mudam | Só alterar o PADRÃO para NOVOS avatares (config sem camadas); saves existentes têm `roupa` explícita. Verificar `AvatarService` não re-hidrata padrão em saves antigos. |

---

## 5. Proposta de ONDAS

### P5-A — Auditoria + Layer Model + Manifest de vestuário (P0, esforço M)
Objetivo: deliverables 1–5, 13–15 (§1218) sem arte nova; fundação de dados.
1. Auditoria do vestuário (30 `rou_*`, 4 `sob_*`, 20 `rou3d_*`, 3 acessórios corporais) com classificação KEEP/UPGRADE/REPLACE/DEV_ONLY — doc `docs/AVATAR-STUDIO-6/auditoria-vestuario.md` (§1218.1–2).
2. Registry `services/Vestuario.ts` (dados): família (`top/bottom/footwear/outer/...`), corte, material fixo, camada, `cobre[]`/`oculta[]`, canais expostos — por id existente (§954–§955, §959, §973, §1155). Flag `as6.vestuario_meta`. Teste: registry ⊆ catálogo, canais ⊆ `usaCores`.
3. Matriz de compatibilidade de camadas (`compativelCom`/exclusividade por slot, §961, §1067–§1071) consumida por `validarConfig` via `incompativelCom` derivado. Teste unitário da matriz.
4. Documentar budgets por categoria de roupa (tri/texturas/materiais/draw calls) em `docs/AVATAR-STUDIO-6/PERFORMANCE-BUDGETS.md` (§1112–§1113, §1195–§1200) e transformar `medidas.materiais` em gate no `validar-asset.mjs`.
5. Mapa item 2D → slugs 3D (ranger/peasant) e remoção do acoplamento por prefixo em `Palco3d.tsx` (derivado, sem persistência) — flag `as6.roupas3d_v2` (§1083).
6. Popular `mascara` nos 20 manifests `rou3d_*` (corpo→torso/bracos; pernas→pernas; botas→pes) via `publicar-asset.mjs --mascara`; estender `roupas3d.mjs` (§965).
7. Art Bible seção Vestuário + anti-patterns (§1207–§1208) — depende de ART-BIBLE.md da Parte 12.
Dependências: Parte 12 P0. Testes: suíte verde + goldens byte a byte.

### P5-B — Canais de cor premium + variantes de roupa + material tokens 2D (P1, esforço M)
1. Variantes de cor para os 30 `rou_*` em `VARIANTES_POR_ASSET` (§1013, §1136) — zero persistência. Teste `variantes-thumb-item.mjs` estendido.
2. Canal `secundario` (`SlotCor`) para peças novas — omitido quando ausente; `validarConfig` + `studio.php` espelhado; `paletaDe` com default = roupa (§1014–§1017). Flag `as6.canais_v2`. Golden novo g-canais-v2 + goldens antigos intocados.
3. Tokens de material 2D em `cores.ts`/`cor-hsl.ts` (`tintaMaterial(hex, 'algodao'|'couro'|'cetim'|'tecnico'|'metal')` — curvas de claro/escuro/brilho) usados SÓ por arte nova (§1080–§1082).
4. UI de canais adaptativa em `DetalheAsset`/`Cores.tsx` (Principal/Secundária/Detalhes) + swatch de material (§1019–§1020, §1091).
5. Testes de cor extrema (preto/branco/saturado) como casos headless com limiar de contraste mínimo do gradiente (§1100–§1102).
Dependências: P5-A.

### P5-C — Golden Garments 2D (Clássico Premium) (P1, esforço G)
1. Contrato `ParteDef.renderCorpoV2` (silhueta completa: torso+mangas+cintura; substitui o scaffold de torso quando presente) sob flag `as6.roupa_premium`; `render.ts` usa só se flag && item declara (§1078–§1079). Golden g09/g16 intocados + golden novo.
2–6. Cinco peças golden novas (IDs novos `rou_*_v2`): camiseta, camisa, hoodie, blazer, jaqueta com quality bar §977–§981 (costura, gola, volume, material token). Cada uma com variantes e `renderCorpoV2`.
7. Calças como camada nova OPCIONAL `roupa_inferior` (schema v3, omitido = scaffold atual) — 3 peças (jeans/social/jogger §984–§987). PHP espelhado.
8. Golden Footwear 2D: 3 calçados no slot `acessorio_pes` existente (tênis/social/bota §989–§992) — usar infra 1404.
9. Default outfit premium só para config novo (§1096); Conjuntos O01–O06 (§1097) mapeados em `CONJUNTOS`.
Dependências: P5-A/B, Art Bible. Testes: goldens + `medir-foco-item` para Modo Item.

### P5-D — Roupas 3D premium: layer/slot + fit + materiais (P1, esforço G)
1. Slots 3D (`upper_base/upper_outer/lower/footwear/...`) no `ReceitaMontagem`/`ParteMontavel` com ordem determinística e exclusividade (§959–§961). Flag `as6.roupas3d_v2`.
2. Clothing masking peça×peça via `oculta[]` do manifest (§966) reutilizando `mascararBase` sobre a PARTE interna.
3. Famílias de material no `Materiais3d.ts` (`FAMILIAS_MATERIAL`: roughness/metalness/normalScale padrão; `aplicarFamilia`) e compat por asset (§1000–§1012, §1021–§1023). Teste unitário idempotência.
4. LOD real nas roupas publicadas (re-publicar com simplify efetivo; verificar tri lod1<lod0) + transições sem "corpo nu" (manter peça anterior até carregar, §1115, §1120).
5. Golden Outfit 3D: 5 outfits (Executive/Casual/Urban/Sport/Cyber) em `base_superhero_m/f` — **bloqueado por assets** (ver §6).
6. Captura Photo Studio força lod0 quando tier ≥ médio (§1183); framing por bounds (§1190–§1192) no `CameraRig3D`.
7. Fit: registrar `morphEnvelope` no manifest e degradar (ocultar/alertar) fora do envelope; morph real depende da Parte 2.
Dependências: Parte 2 (morphs), Parte 6 (sockets), Parte 7 (luz).

### P5-E — Outfit engine, UX e QA (P1/P2, esforço M)
1. Smart random por tema respeitando camadas (§1171–§1173) em `aleatorio()`.
2. Auto-foco de câmera por família (upper→busto, bottoms/shoes→corpo/pés) no palco 2D/3D (§1087–§1089) com transição suave.
3. Before/after de outfit e equip states (§1092, §1179); undo/redo por troca de peça (verificar `nucleo/estado`).
4. QA headless de roupa: screenshots padronizados por golden (frente/¾/idle/wave) + Visual Score manual (§1124–§1134, §1163–§1165).
5. Decal/pattern 2D (`<pattern>` só em itens novos; emblema como decal) e logos Dshow curados (§1034–§1045).
Prioridade P2 para 4–5 até quality lock.

---

## 6. Perguntas bloqueantes vs decisões tomadas

**Bloqueantes (precisam do Jhony):**
1. Fonte de geometria 3D premium (Executive/Casual/Urban/Sport/Cyber): não há pack CC0 conhecido além de Quaternius (fantasy/UBC). Opções: (a) autorar internamente (custo alto), (b) comprar/licenciar pack comercial (licença precisa permitir redistribuição em web app), (c) limitar Golden 3D ao que existe (peasant/ranger) e elevar via materiais. Decisão e eventual custo são do Jhony.
2. Normal/roughness maps e texturas: geração interna (procedural) ou compra de texturas PBR (licença CC0 ex. ambientCG é viável — confirmar aceite).
3. Mudança de `CONFIG_PADRAO` (default outfit premium) afeta onboarding/identidade Dshow — validar visualmente.
4. Schema v3 (`roupa_inferior`/`calcado` como camada) toca tabela `avatar_state_versions`/PHP — migração no servidor é passo root (RUNBOOK-BANCO).

**Resolvidas sozinho (registrar como decisão numerada na onda):**
- Calçado permanece em `acessorio_pes` (não re-slotar; taxonomia já apresenta como Vestuário).
- Material por peça é FIXO em registry de dados (§1023) — não persiste; só peças novas terão seleção.
- Silhueta 2D premium via contrato novo opcional (`renderCorpoV2`), nunca editando `corpoInteiro`/arte existente.
- Mapa 2D→3D é derivado (sem campo); look 3D deixa de ser estado efêmero.
- Cloth sim fora de escopo (procedural simples, se houver, em onda posterior).

---

## 7. Métricas / Acceptance

- Suíte `node scripts/avatar/testes/rodar-todos.mjs` verde; 16 goldens 2D byte a byte; goldens novos para cada campo/contrato novo.
- Registry de vestuário cobre 100% dos `rou_*`/`sob_*`/`rou3d_*`; matriz de camadas com teste unitário; nenhum par inválido equipável via `validarConfig`.
- 100% dos manifests `rou3d_*` com `mascara`; `roupas3d.mjs` verifica faces ocultas > 0 ao vestir corpo/pernas/botas.
- LOD real: tri(lod1) < tri(lod0) e tri(lod2) ≤ 8k em toda roupa publicada; gate de materiais por peça ativo no `validar-asset.mjs`.
- Variantes em todos os `rou_*`; canal `secundario` omitido quando ausente (teste de serialização); PHP rejeita hex inválido.
- 5 golden garments 2D + 3 calças + 3 calçados com `renderCorpoV2`, silhueta perceptivelmente diferente (teste de bbox/área por peça via `medir-foco-item`) e material token aplicado.
- Golden Outfit 3D (quando assets existirem) em M+F: sem clipping em idle/wave/walk (QA visual do Jhony), captura lod0, framing sem cortar casaco.
- Docs: auditoria-vestuario.md, PERFORMANCE-BUDGETS.md (seção roupa), Art Bible seção vestuário + anti-patterns; decisões numeradas registradas.
- Gate §1220: Golden outfits + fit + material + layering + LOD + classic equivalent aprovados antes de qualquer população (>3 peças/família).
