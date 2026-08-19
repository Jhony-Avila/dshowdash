# Digest — MEGA_BRIEFING_01 · PARTE 4/12 (§713–§951)
## Cabelos, barbas, sobrancelhas avançadas, hair cards, shaders, volume, movimento, fit com chapéus e close-up

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 10406–12682. Código auditado em 2026-08-19 (main b0331d62).

## 1. Resumo executivo

A Parte 4 exige que cabelo/barba/sobrancelha deixem de parecer "acessório colado" e virem identidade do personagem: silhueta + volume + detalhe (§715), famílias reais (§719/§720), hair shader próprio (§729–§735), sistema de cor unificado hair/brow/beard com sync (§843–§849), fit com cabeça/morphs (§741–§747), compatibilidade com headwear por máscara de regiões (§759–§770), LOD sem pop (§775–§780), budget/validator/QA próprios (§781, §878–§896) e equivalente 2D premium no Clássico (§864–§877). Gate §897/§950: nenhuma produção em massa antes do Golden Hair Set + headwear fit + close-up + LOD + hair material aprovados; DoD §949 lista 20 entregas.
Estado do código: o 2D tem **50 cabelos** em `engine/partes/cabelos.ts` (camada única `cabelo`, gradiente 3 stops + arco de brilho fixo `BRILHO`, sem camada traseira, sem sombra na testa), **barba vive dentro da categoria `boca`** (`boc_barba`, `boc_cavanhaque`, `boc_bigode` — exclusiva com a expressão da boca) e **sobrancelha está "cozida" em cada item de olhos** (`sobrancelha()` em `engine/partes/olhos.ts`, espessura fixa 4.4, cor `p.cabelo.escuro`). O 3D tem **6 partes UBC CC0** (`cab_barba, cab_coque, cab_longo, cab_raspado, cab_raspado_f, cab_repartido`), família `economico`, hair cards opacos (homologação §491), LODs nominais (mesma contagem de triângulos nos 3 níveis), material genérico recolorido multiplicativamente pelo canal `cabelo` (`Materiais3d.ts`), sem física (decisão #66), sem máscara por chapéu, seleção local não persistida e sem mapeamento 2D↔3D. Não existe tier de qualidade, família de cabelo, fitProfile, hairMask, colorChannels nem validador específico.
Conclusão: a parte é quase toda lacuna estrutural, mas a fundação (canais §73/`coresCamada`, `params` §71, `renderCorpo` como precedente de render alternativo, manifest §517 extensível, assembler com passos `cabelo`/`barba`, Material Manager central, goldens executáveis) permite entregar por ondas sem quebrar byte-stability.

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Auditoria + classificação KEEP/UPGRADE/REPLACE/DEV_ONLY + tier de qualidade | 723, 771, 863, 939–943, 949.1–2 | Inventariar cabelos 2D/3D, classificar, tier prototype→hero; legacy fora do destaque; default Q3/Q4 | Não existe. `services/MetadadosAssets.ts:MetadadosAsset` tem autor/origem/licença/versão/tags (sem tier). `manifest.familia` (economico/padrao/premium) só em 3D (`Partes3d.ts:EntradaIndiceParte.familia`). Padrão `CONFIG_PADRAO.camadas.cabelo='cab_curto'` (`AvatarCatalog.ts:332`) | Registry de qualidade/classificação por id (dados), badge interno, critério de destaque |
| Hair families / tags / coverage matrix / distinctiveness | 718–720, 857, 899–904 | Famílias (short…fantasy), tags de busca, matriz mínima de cobertura, checar similaridade | Só `tema` livre e `raridade` no `ParteDef`; busca por tags via `MetadadosAssets.tags` (derivadas) | Registry `familia` por cabelo/barba/brow; matriz de cobertura como teste; silhouette/similarity sheet |
| Silhouette/Clay test, Hero + Golden Hair Set, Before/After | 715–717, 772–773, 897, 944–945 | H01–H06 de referência; clay/silhueta/backlight; gate antes de escalar | Goldens 2D só byte-stability (`scripts/avatar/testes/golden-avatars.mjs`, g01–g16, todos com `cab_curto`); thumbs 3D via `scripts/avatar/assets3d/gerar-thumbs-3d.mjs` | Script de contact-sheet (preto sobre branco), set H01–H06 2D e 3D, captura before/after |
| Hair cards / alpha / transparência / padding | 722–728, 777, 780, 884, 889–891 | Inventariar cards, alphaTest vs blend por asset, sorting/halo/backlight, hard fails | `homologacao-onda-611.md` §491 registra "hair cards opacos do pack"; `validar-asset.mjs` não checa alphaMode/materiais; Three material padrão do GLTFLoader | Regras de alpha no manifest + validator; teste backlight/transparência; nenhum asset com cards reais ainda |
| Hair shader / material family / anisotropia / root-to-tip | 729–735, 783, 787, 819, 836, 862 | `hair_soft/gloss/coarse/fantasy`, roughness/specular curados, highlight direcional, AO controlado | `Materiais3d.ts:aplicarPipelineCores` só multiplica `color`, grampeia emissivo (`TETO_EMISSIVO`); `canalDoMaterial` por nome (`hair|beard`) — um canal para cabelo+barba (`canalDaCategoria`) | Família de material em dados + aplicação no passo `materiais` do `Assembler3d.ts`; sem anisotropia (não bloqueante) |
| Sistema de cor unificado hair/brow/beard + sync + dual-tone + presets | 736–740, 784–786, 820–823, 837–838, 843–849 | `hairColor/browColor/beardColor` com sync; root/tip/secondary só se o asset suportar; swatches; cor no topo do painel | 2D: slot global `cores.cabelo` (`engine/cores.ts:tinta`) e override por camada `coresCamada.boca.cabelo`/`coresCamada.olhos.cabelo` (§73, `AvatarCatalog.ts:441`) — sync/independente JÁ é expressável sem campo novo; `cab_grisalho` usa cor fixa `#d8dde8`; Color Studio `engine/cor-hsl.ts` (as6.color_studio); `VariantesAssets.ts` não tem `cab_*`. 3D: canal único `cabelo` | UX "Cor principal / Sincronizar barba / sobrancelha" (UI sobre coresCamada); presets de cor de cabelo; canal secundário = `destaque` declarado só em cabelos novos (`usaCores:['cabelo','destaque']`); 3D: regex `hair_secondary`→destaque |
| Hairline / head fit / fitProfile / pivot / offsets centralizados | 741–747, 802–804, 814–817, 841 | Compatibilidade com head families/scale, sem offset mágico, fitProfile em metadata | 2D: `requerBase: HUMANOIDES` (lista em `cabelos.ts:21`) e `params.cabelo.escala` 0.9–1.12 em (120,78) (`engine/params.ts`); 3D: rig único ubc-v1 (`Partes3d.ts:BONES_UBC_V1`), morfos por escala `as5.morfos3d` | fitProfile no manifest; teste de envelope (escala/tipo corporal × cabelo); 3D hoje só 1 cabeça UBC |
| Hair × headwear (máscara por regiões, under-hat, estado resolvido) | 759–770, 892, 947 | `hairMask:['top']` no chapéu; modos full/compressed/hidden_top/…; resolver no motor de regras | `render.ts:ORDEM_CAMADAS`: `cabelo` antes de `acessorio_cabeca` (chapéu por cima), SEM máscara; nenhum `incompativelCom` cabelo×chapéu; 24 itens `slot:'cabeca'` em `acessorios.ts`; 3D: `Assembler3d.ts:mascararBase` só base×roupa (`REGIOES_UBC`), capuz ranger sem `mascara` | Motor de regras `resolverCabelo()` em dados; 2D via clipPath/wrapper opt-in; 3D mascarar cabelo por bandas da cabeça |
| Rig / secondary motion / physics tier / colliders | 748–758, 798, 811, 829 | Movimento sutil amortecido em longos/ponytail; tier; fallback estático | 2D: idle `data-anim="cabelo"` rotate ±0.7° (`workspace/vida.ts`, `PalcoCinema.tsx`); 3D: rígido (decisão #66), sem spring bones; `QualityManager`/`as6.quality` tiers economico/medio/alto (`nucleo/contratos.ts:QualidadeTier`) | Spring simples por bone (ponytail/longo) atrás de flag + tier; colisão ombro só teste visual |
| LOD / budget / draw calls / perf worst-case | 775–782, 923–926 | LOD0 rosto, LOD1/2 corpo; budget por cabelo; cenário pesado | `lodPorQualidade` (`Personagens3d.ts:29`), `as5.progressivo3d` (LOD por tela), `CacheNiveis.ts`; manifests de cabelo com `triangulos` IGUAIS nos 3 LODs (ex.: `cab_longo` 2906/2906/2906); `Hud3D.tsx` lê `gl.info`; `PerfBaseline.ts` | LOD real (decimação), budget no validator, teste worst-case automatizado |
| Barba como slot próprio, famílias, fit, morph binding | 805–831, 880, 882, 893, 896, 900 | stubble…styled; barba não é boca; cor sync/independente; máscara/cachecol/gola | 2D: barba = item de `boca` (exclui sorriso); 3D: slot próprio já existe (`as5.cabelo3d`, `Palco3d.tsx:215`, passo `barba` do assembler) | Categoria 2D `barba` (camada nova, PHP), artes novas, regras com `acessorio_rosto`/`pescoco` |
| Sobrancelhas premium | 832–842, 874, 883, 894, 901 | geometry/cards, direção, espessura real, sync/override, presets distintos | Cozidas nos olhos (`olhos.ts:sobrancelha`), cor independente possível via `coresCamada.olhos.cabelo`; 3D: inexistente (embutida na base UBC) | Categoria/overlay de sobrancelha 2D; 3D só com base premium |
| Classic 2D premium (camadas back/main/fringe/highlights/strands, sombra, gradiente, hairline) | 864–877 | Shapes ricos, camada traseira, sombra do cabelo na testa, strands, cross-renderer opcional | Camada única; `cab_longo` desenha mechas laterais na própria camada (por cima da roupa); `defsCabelo` gradiente linear único; sem sombra; `ParteDef.renderCorpo` é precedente de render alternativo (`engine/base-api.ts`) | `renderTras` (antes da base) só em cabelos novos; artes `cab2_*`/wrappers; mapa lógico 2D↔3D em dados |
| Pipeline / validator / naming / versioning / licença | 878–880, 931–938 | Validador de cabelo (materiais, alpha, draw calls, bones, LOD, bounds); ids técnicos estáveis | `validar-asset.mjs` (tri §631, textura, bones, hash, licença, UV); `publicar-asset.mjs` (familia, mascara); ids `cab_*`/`rou3d_*`; `LICENCAS.md` + `manifest.licenca` | Regras específicas de cabelo/barba; campos novos no manifest; pasta de partes tem prefixo `cab_` para barba (`cab_barba`) — naming a corrigir só em assets novos |
| Thumbnails / preview / UX de cabelo (foco, back preview, hover, zoom, compare, prefetch, loading) | 850–856, 914–922 | Câmera busto ¾, costas, hover aplica, não resetar zoom, focus mode, motion freeze, sem cabeça careca piscando | `ShellStudio.tsx:ENQUADRAMENTOS.cabelo=[38,6,164,164]` (R2) + `Cam6` rosto/busto/corpo; thumbs 2D por `GradeItens.tsx:FOCO_THUMB`; `modoItem.ts` sem `cab_`; 3D: `Renderizador3d.definirPartes3d` RECARREGA o personagem inteiro (`carregarPersonagem`) ao trocar parte; `CacheAssets3d.ts` (IndexedDB) existe | Hair focus mode, back preview, freeze, troca sem flash, prefetch no hover |
| Presets / quick style / coleções / VFX só em hero | 859–861, 905–913 | Preset cabelo+cor+sobrancelha+barba; Executivo/Casual/Street/Cyber | `PresetsPessoais.ts` (snapshot completo), `PresetsShell.tsx`; coleções em `AvatarCatalog.ts:COLECOES`; cabelos VFX já existem (`cab_flamejante`, `cab_fibra_otica`, `cab_holo_gradiente`) | Quick styles de cabelo em dados (aplicam camadas+coresCamada) |
| Art Bible / anti-patterns / QA checklists / scores | 881–888, 895–896, 946–948 | Checklists visuais, scores, anti-patterns documentados | Nada específico de cabelo em `docs/` (há `classico-aaa.md`, `pipeline-assets-3d.md`) | Seção cabelo do ART-BIBLE.md e VISUAL-QA.md (docs exigidos pela Parte 12) |

## 3. Já coberto (referenciar) e pré-requisitos

Coberto/base reutilizável: canais §73 (`coresCamada`) resolvem sync/override de cor de barba e sobrancelha **sem campo novo**; `params.cabelo.escala` (volume) §71; `requerBase`/`incompativelCom` (§35) para regras; `renderCorpo` como padrão de "render alternativo por ParteDef" (reaproveitar para `renderTras`); manifest §517 + `validar-asset.mjs`/`publicar-asset.mjs` extensíveis; `Assembler3d.ts` já tem passos `cabelo`/`barba`/`materiais`/`clipping` e `mascararBase` (técnica reaproveitável para mascarar cabelo por bones/bandas); `Materiais3d.ts` central (um lugar para a família de material); `lodPorQualidade` + `as5.progressivo3d` + `CacheAssets3d`; idle 2D do cabelo (`vida.ts`); tiers `as6.quality`; `MetadadosAssets.ts` como wrapper de dados sem tocar arte; goldens executáveis.
Pré-requisitos de outras partes: Parte 1 (tiers prototype→hero, Art Bible, Quality Bar) define o vocabulário do registry de qualidade; Parte 3 (rosto/head shapes/morphs) define head families para `fitProfile`; Parte 12 manda GOLDEN HAIR depois de GOLDEN FACE e antes de OUTFITS; Parte 6 (acessórios) precisa do `hairMask` nos chapéus; Parte 8/9 (materiais/iluminação) consomem a família `hair_*`; Photo Studio (§914) depende de LOD0/captura `as5.captura3d_v2`.

## 4. Conflitos/risco com as regras invioláveis e contorno

1. **Byte-stability × máscara cabelo×chapéu (2D)**: aplicar clipPath automaticamente quando há `acessorio_cabeca` mudaria o render de avatares salvos (goldens g02). Contorno: o comportamento sob chapéu só dispara por (a) metadados declarados em itens NOVOS (cabelos `cab2_*`/chapéus novos com `hairMask`) ou (b) param opt-in `params.cabelo.encaixe` (0 = neutro, omitido pelo `sanitizarParams`). Itens legados nunca mudam.
2. **Byte-stability × 2D premium**: camadas novas (`renderTras`, sombra na testa) só existem em cabelos novos; cabelos legados intocados; `ORDEM_CAMADAS` ganha no máximo categorias novas (`barba`, `sobrancelha`) cujo fragmento ausente = '' (mesmo padrão de `roupa_sobre`/slots 1404).
3. **Arte em partes/* intocável**: `cab_grisalho` com cor fixa, brilho `BRILHO` uniforme e sobrancelhas cozidas NÃO podem ser corrigidos; solução = artes novas (KEEP legado, UPGRADE = sucessor com id novo §937–§938) ou wrappers (sobrancelha overlay que cobre o traço 4.4 em y≈87–96).
4. **Flags**: tudo sob `as6.cabelo_premium` (UI/catálogo), `as6.barba_slot`, `as6.brow_slot`, `as6.hair_fit`, `as6.hair_material`, `as6.hair_motion`; filhas de `as5.cabelo3d`/`as5.assembler3d` em `DEPENDENCIAS_FLAGS`. Config salvo com item de flag desligada segue renderizando (precedente `as6.creator_v6`).
5. **PHP espelhado**: categoria nova (`barba`, `sobrancelha`) exige entrada em `$categorias` de `api/avatar/studio.php:133`; param/canal novo passa pelo `params`/`coresCamada` (observação: `studio.php` hoje NÃO serializa `params`/`coresCamada` — lacuna pré-existente, registrar, não resolver aqui).
6. **Licenças/assets externos**: cabelos 3D premium (cards com alpha, ponytail riggado) não existem no farm CC0 atual; qualquer pack novo passa por `LICENCAS.md` + `manifest.licenca.comprovante` (§933–§934) — bloqueante (seção 6).
7. **Bundle/libs**: sem lib de física; spring bones = implementação própria mínima (≤150 linhas) atrás de flag e tier; anisotropia só via `MeshPhysicalMaterial` nativo do Three (sem lib).
8. **Naming**: `cab_barba` (3D) viola §935; não renomear (quebra hash/cache) — novos assets seguem `hair_*/beard_*/brow_*` ou `cab3d_*/brb3d_*` conforme decisão numerada.

## 5. Proposta de ondas

### P4-A — Auditoria, classificação e metadados de cabelo (P0, esforço M, sem dependência)
Objetivo: cumprir DoD §949.1–2 e §771/§899–§903 só com dados/docs/scripts.
1. Inventário 2D (50 `cab_*`, 3 `boc_*` de barba, brows cozidas) + 3D (6 partes) em `docs/AVATAR-STUDIO-5/auditoria-cabelos.md` com KEEP/UPGRADE/REPLACE/DEV_ONLY (§723/§949).
2. `services/FamiliasCabelo.ts` (novo, dados): `familia`, `tierQualidade` (prototype…hero §771), `tags` §857, `compatChapeu` padrão por id; exposto via `MetadadosAssets.ts` (flag `as6.meta_hair`; off = metadados anteriores byte a byte).
3. Matriz de cobertura §899–§901 como teste (`scripts/avatar/testes/cabelo-cobertura.mjs`): falha se família obrigatória sem item ≥ production.
4. Silhouette sheet: script `scripts/avatar/testes/cabelo-silhueta.mjs` renderiza cada cabelo preto sobre branco (`renderAvatar` com paleta forçada) → PNG contact-sheet em `saida/` para revisão humana (§717).
5. Golden Hair Set H01–H06 §773 escolhido entre existentes (candidatos: `cab_curto`, `cab_ondas_curtas`, `cab_longo`, `cab_coque`, `cab_afro`, `cab_cyber`) + B01–B03 + captura before/after §944–§945 (`scripts/avatar/testes/golden-avatars.mjs` ganha casos g17–g22 "hair set", byte-stability).
6. Legacy badge interno (§940) no drawer/CMS RO (`as6.cms_ro`), destaque promocional filtra `tierQualidade<production` (§863).
7. Seção "Cabelo" do ART-BIBLE.md + anti-patterns §946–§948 + checklists §881–§883 em VISUAL-QA.md (docs exigidos Parte 12).
8. Decisão numerada de naming (§935–§938) para assets novos.
Acceptance: suíte verde; cobertura-teste; sheet gerado; docs.

### P4-B — Hair validator, manifest v2 e pipeline (P0, esforço M, depende de P4-A)
1. Manifest §517 ganha campos opcionais: `familiaCabelo`, `qualidade`, `fitProfile` (§744), `hairMask`/`regioesCabelo` (§763), `colorChannels` (§848), `alpha` (`opaque|mask|blend` por material §725), `budget` (§781); `publicar-asset.mjs` aceita flags; `Partes3d.ts:EntradaIndiceParte` espelha (tudo opcional, leitor tolerante).
2. `validar-asset.mjs`: regras de cabelo/barba (§879–§880) — nº materiais ≤ 3, draw calls estimados, alphaMode declarado coerente com o GLB, bounds relativos ao bone `Head`, LODs com contagem estritamente decrescente (hoje iguais → aviso, erro para `qualidade≥production`).
3. LOD real para os 6 cabelos atuais via gltf-transform simplify no `publicar-asset.mjs` (republicação = hash novo, manifest novo; cache §478 invalida sozinho).
4. `gerar-thumbs-3d.mjs`: câmera busto ¾ para `parte_cabelo` + thumb de costas (`thumb-costas.webp`) §851–§852.
5. Teste worst-case §924 (`cabelo-worst.mjs`: longo+barba+capuz ranger+partículas) medindo `gl.info`/tempo de carga → registra em `baselines.md`.
6. Teste de backlight/transparência §884/§889 (captura com rim light `as5.palco3d_v2` em fundo claro/escuro) como evidência visual (não gate automático).
Flag: pipeline é tooling (sem flag); leitura de campos novos fail-safe. Acceptance: validator reprova fixture com alpha incoerente; LODs decrescentes; thumbs novas.

### P4-C — Sistema de cor unificado + presets (P1, esforço P/M, sem dependência)
1. UI topo da categoria Cabelo (§844–§845): "Cor principal" (= `cores.cabelo`), toggles "Sincronizar barba/sobrancelha" que escrevem/limpam `coresCamada.boca.cabelo` e `coresCamada.olhos.cabelo` (nada novo persiste) — `components/Cores.tsx`/Inspector `as6.inspector`; flag `as6.cor_cabelo`.
2. Swatches de cabelo §736/§846 em dados (`services/VariantesAssets.ts` ou `PaletasCabelo.ts`): preto, castanhos, loiros, ruivos, grisalhos, branco, fantasy; variante ativa derivada (padrão onda 1401).
3. Canal secundário §739/§847: cabelos NOVOS declaram `usaCores:['cabelo','destaque']`; UI só mostra canal declarado (§849 — já é o comportamento do §73).
4. 3D: `Materiais3d.ts:canalDoMaterial` reconhece `hair_secondary|beard` → canais distintos (`barba` opcional mapeado para `cabelo` quando sync).
5. Quick styles §911–§912 (Executivo/Casual/Street/Cyber) como presets de dados aplicando `camadas.cabelo/boca` + coresCamada; teste de que aplicar = validarConfig idempotente.
Acceptance: goldens intactos; teste UI sync on/off; PHP inalterado (só coresCamada).

### P4-D — Headwear × cabelo: motor de regras + máscaras (P1, esforço G, depende de P4-B e Parte 6)
1. `services/CompatCabelo.ts`: `resolverEstadoCabelo(cabelo, chapeu)` → `visible|masked|variant|hidden` (§769) a partir de `hairMask` do chapéu e `compatChapeu` do cabelo (§760); único ponto de decisão (§770).
2. 2D: wrapper de máscara por regiões (clipPath top/front/sides/back em coordenadas `G` do `base-api.ts`) aplicado em `render.ts` SÓ quando item novo declara ou `params.cabelo.encaixe≠0` (novo param; `sanitizarParams` omite neutro; PHP mirror se `params` passar a ser serializado).
3. 2D: `under_hat_variant` via `ParteDef.variantes` (já existe em `base-api.ts` para poses) — nova chave `sobChapeu`.
4. 3D: `Assembler3d.ts` novo passo dentro de `clipping`: mascarar cabelo por bandas de altura relativas ao bone `Head` (reuso da técnica `mascararBase` com `indexOriginal`), restaurável; capuzes ranger ganham `hairMask:['top','back']` no manifest.
5. Regras declaradas cabelo×costas/pescoço (§757–§758) via `incompativelCom`/conflitos do registry `workspace/acessorios.ts`.
6. Testes: `cabelo-chapeu.mjs` (2D: cabelos legados + chapéu = SVG idêntico ao golden; cabelo novo + chapéu = região top ausente; 3D: faces ocultas > 0 com capuz).
Flag `as6.hair_fit`. Acceptance: goldens intactos; hard-fail §892 coberto para Golden Set.

### P4-E — Hair material family + LOD/qualidade 3D (P1, esforço M, depende de P4-B; Parte 8)
1. `Materiais3d.ts`: `FAMILIAS_MATERIAL_CABELO = {hair_soft, hair_gloss, hair_coarse, hair_fantasy}` (roughness/metalness/envMapIntensity/sheen via `MeshPhysicalMaterial` quando disponível); aplicação no passo `materiais` do assembler conforme `manifest.material` (flag `as6.hair_material`; off = material do GLB).
2. Root-to-tip §735 leve: gradiente por `vertexColors`/`onBeforeCompile` só em assets com `colorChannels` (P2 se custo alto).
3. AlphaTest/alphaBlend por material conforme manifest `alpha` (§725), `premultipliedAlpha` consistente (§727).
4. Hair LOD por enquadramento: rosto=LOD0 sempre (§775) integrando `as5.progressivo3d`/`Cam6`.
5. Testes: `materiais3d.mjs` ganha caso família; captura dark/blonde/white §885–§887 como evidências.
Acceptance: sem flag = bytes do frame anteriores; com flag = família aplicada e emissivo ≤ `TETO_EMISSIVO`.

### P4-F — Barba e sobrancelha como slots próprios (2D) (P1, esforço G, depende de P4-A; Parte 3)
1. Categoria `barba` (CategoriaId/CamadaId/`ORDEM_CAMADAS` antes de `boca`; PHP `$categorias`; taxonomia v2 `workspace/taxonomia.ts`; `CONFIG_PADRAO` sem barba) — flag `as6.barba_slot`; `boc_barba/boc_cavanhaque/boc_bigode` viram LEGACY (KEEP, fora do destaque), migração opcional via `nucleo/migracoes.ts` NÃO automática (byte-stability).
2. Artes novas de barba (famílias §807: stubble como pattern sutil §873, short, full, goatee, mustache ×3 §830, long) com `usaCores:['cabelo']`, sombra de contato §818/§872, variação por base (`requerBase`).
3. Categoria `sobrancelha` (overlay sobre o traço cozido; famílias §901) — flag `as6.brow_slot`; cor via `coresCamada.sobrancelha.cabelo`.
4. Regras barba × `acessorio_rosto` (máscara) / `pescoco` (cachecol) via `incompativelCom`/registry (§825–§827).
5. Goldens g23+ (barba nova, sobrancelha nova, combinação com sorriso) + PHP teste de aceitação das categorias.
Acceptance: avatar antigo idêntico; sorriso + barba possível.

### P4-G — Classic 2D premium hair (Golden Hair Set 2D) (P1, esforço G, depende de P4-A/P4-C)
1. `ParteDef.renderTras?` (pintado ANTES da base no `render.ts`, só quando definido) para cabelo traseiro §866.
2. 6 cabelos novos `cab2_*` (H01–H06) com silhueta rica, gradiente por mechas, strands §870, sombra na testa §868, hairline §871, highlights controlados §867, canal `destaque` opcional; thumbs em `modoItem.ts`; famílias/tier=premium.
3. Cross-renderer map §876 em dados (`cab2_longo`↔`cab_longo` 3D) usado só para sugestão/thumb.
4. Goldens para cada cabelo novo + reaproveitar silhouette sheet de P4-A para aprovação.
Flag `as6.cabelo_premium` (visibilidade no catálogo). Acceptance: Jhony aprova set visual (gate §897); goldens.

### P4-H — UX de cabelo: foco, preview, loading, motion (P1, esforço M, depende de P4-B)
1. Hair/Beard/Brow Focus Mode §915–§917: `ENQUADRAMENTOS` já cobre 2D; 3D ganha preset de câmera busto + rotação habilitada + luz neutra ao entrar na categoria.
2. Não resetar zoom ao trocar cabelo §855 (auditar `ShellStudio.tsx` Cam6 — manter `cam` entre trocas).
3. Back preview §852: botão "costas" (3D gira 180°; 2D mostra `renderTras` se houver).
4. Troca sem flash §920: `Renderizador3d.definirPartes3d` passa a montar a nova parte e só então trocar (hoje recarrega o personagem inteiro) + prefetch no hover via `CacheAssets3d.buscarComCache` (§921–§922).
5. Motion freeze §918–§919 (toggle que pausa idle `vida.ts`/mixer; respeita `prefers-reduced-motion`).
6. Hair compare §856 (opcional, dois previews lado a lado reaproveitando `Vitrine`/comparação §231).
Flag `as6.hair_ux`. Acceptance: teste headless de zoom persistente e ausência de frame "careca" (frames intermediários iguais ao anterior).

### P4-I — Assets 3D premium + secondary motion (P1/P2, esforço G, BLOQUEADA por licença/assets — seção 6)
1. Curadoria de pack CC0 de cabelo com cards/alpha e ponytail; pipeline source→QA §931; adaptação Dshow §932.
2. Spring bones simples (ponytail/longo/barba longa) atrás de `as6.hair_motion` + tier (`economico` congela §752); fallback estático §753.
3. Golden Hair Set 3D H01–H06 substituindo/complementando os 6 UBC; validator P4-B como gate.

### P4-J — Escala 3× (P2, só após gate §950)
Produção por famílias (matriz §899–§901), distinctiveness check humano, coleções §905–§910 sem virar tudo fantasia.

## 6. Perguntas bloqueantes × decisões tomadas

Bloqueantes (precisam do Jhony):
1. **Assets 3D premium**: não há pack CC0 de cabelo com cards/alpha/ponytail no farm; autorizar busca/curadoria de novo pack (licença verificada conforme `LICENCAS.md`) ou aceitar que a Parte 4 3D fique em "KEEP econômico + material family" até haver assets.
2. **Republicar os 6 cabelos UBC com LOD real** muda hashes/manifests publicados (irreversível no sentido de cache/CDN; backup via `/backup` do servidor) — ok?
3. **Gate visual §897**: aprovação do Golden Hair Set (2D e 3D) é validação visual do Jhony — sem ela P4-G/P4-I não escalam.
4. **Naming §935** para assets novos (`cab2_*` vs `hair_*`): preferência de prefixo (impacta ids persistidos para sempre).

Resolvidas sozinho (decisões a numerar):
- Cor de barba/sobrancelha: reutilizar `coresCamada` (§73) em vez de novos slots `barba`/`sobrancelha` em `cores` — zero schema, PHP intocado.
- Canal secundário de cabelo = `destaque` declarado por asset (não novo `SlotCor`).
- Máscara cabelo×chapéu nunca retroativa: só itens novos/param opt-in.
- Barba legacy dentro de `boca` permanece (KEEP), sem migração automática.
- Anisotropia/physics fora do caminho crítico (§732/§755); spring bones próprio, sem lib.
- `cab_barba` não renomeado.

## 7. Métricas / acceptance da parte

- Auditoria publicada com 100% dos cabelos/barbas classificados e com família+tier (teste de cobertura verde).
- Golden Hair Set H01–H06 (2D) + Golden Beard Set aprovados visualmente; goldens byte-stability g17+ verdes; g01–g16 inalterados.
- `validar-asset.mjs` reprova fixtures: alpha incoerente, >3 materiais, LODs não decrescentes, bounds fora da cabeça.
- Teste cabelo×chapéu: legado idêntico; novo com `hairMask` sem região top; 3D faces ocultas > 0 com capuz.
- Frame 3D sem flag de material = bytes anteriores; com flag família aplicada.
- Worst-case §924 dentro do budget registrado em `baselines.md` (tri/draw calls/tempo de carga) sem pop de LOD (§926) no teste de aproximação.
- UX: zoom não reseta ao trocar cabelo; nenhum frame "careca" na troca 3D; sync de cor barba/sobrancelha funciona e não persiste nada novo.
- Docs: ART-BIBLE (cabelo), VISUAL-QA (checklists §881–§883), auditoria-cabelos, decisões numeradas; suíte completa verde antes de cada entrega.
