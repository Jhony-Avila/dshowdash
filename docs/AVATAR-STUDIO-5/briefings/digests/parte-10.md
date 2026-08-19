# Digest — MEGA_BRIEFING_01 · PARTE 10/12 — Modo Clássico 2D/2.5D Premium (§2288–§2561)

> Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 24756–26993.
> Código investigado: `public/components/panels/panel-avatar-studio/src/` (engine/render.ts, engine/base-api.ts, engine/cores.ts, engine/cor-hsl.ts, engine/params.ts, engine/sobrepecas.ts, engine/particulas.ts, engine/partes/*, components/AvatarSvg.tsx, components/GradeItens.tsx, workspace/vida.ts, components/PalcoCinema.tsx, domain/types.ts, domain/animacao.ts, services/AvatarCatalog.ts, services/MetadadosAssets.ts, services/ManifestCatalogo.ts, services/QualityManager.ts, nucleo/renderizador.ts, nucleo/flags.ts), `api/avatar/studio.php`, `api/avatar/SvgSanitizer.php`, `scripts/avatar/testes/golden-avatars.mjs`, `docs/AVATAR-STUDIO-6/golden-avatars.json`.

## 1. Resumo executivo

A Parte 10 manda transformar o Modo Clássico em **"Premium Stylized 2D/2.5D"** com identidade própria (silhueta + layering + shading + materialidade + profundidade + microanimação + composição), SEM reescrever o motor e SEM converter o catálogo inteiro: separar internamente *Classic Legacy* × *Classic Premium*, criar Golden Classic Male/Female (+ set C01–C06), e migrar por famílias de impacto (rosto → cabelo → olhos/boca → roupas → acessórios → fundos → auras → presets). Pede arquitetura de camadas formal (BACKGROUND … FRAME, com hair back/front, clothing base/outer, back accessories, aura back/front, shadow layers), rosto com biblioteca de formatos (oval/round/square/long/…), pele com tokens de shading calibrados por luminância, olhos com anatomia (sclera/iris/pupil/lids/catchlight), boca em camadas, expressões, barbas, cabelo em 6 camadas (back/main/fringe/shadow/highlight/strands), roupas que mudam silhueta real com tokens de material (cotton/denim/leather/metal/technical/satin) e canais primary/secondary/accent, acessórios com profundidade, fundos com modelo far/mid/floor/foreground/atmosphere + parallax + sombra de contato, looks Studio/Portrait/Hero/Neon, auras por família em 4 camadas, microanimações (blink não periódico, breathing, hair sway, reduced-motion), Photo Mode 2D expandido (framings, export alta resolução, transparente, toggles), paridade semântica com o 3D (asset lógico ⇒ representação classic + 3d, `rendererSupport`), pipeline/contrato de asset 2D, VisualQA com hard fails específicos, before/after obrigatório e rollout por flag. Gate final §2560: nenhuma migração massiva antes da aprovação de Golden Male + Female + Face + Hair + Clothing + Background + Aura + Photo.

**Estado real hoje:** o motor (`engine/render.ts`, 286 linhas) é determinístico, com `ORDEM_CAMADAS` fixa (roupa → roupa_sobre → emblema → boca → olhos → cabelo → 15 slots de acessório) + fundo/banner/aura/efeito(atrás|frente)/moldura; arte = 393 `ParteDef` em `engine/partes/*` (~9.900 linhas), estilo **flat + 1 gradiente linear/radial por peça + arco de brilho branco + sombras em `alfa(...)`**; zero `<filter>` na arte (1 em molduras), zero `<mask>`, 1 `<pattern>`; rosto = elipse/path único com `radialGradient` de pele; olhos = `olhoHumano()` (esclera+íris flat+pupila+1 catchlight); boca = 1–2 traços; cabelo = path único + `BRILHO`; roupas = `PATH_OMBROS` + detalhes. Vida (respiração, piscada 2,8–7s aleatória, balanço do cabelo, parallax 3 planos, olhar seguindo cursor) existe SÓ no modo palco (`workspace/vida.ts`, `PalcoCinema.tsx`) e nunca no SVG salvo. Byte-stability é executável (16 goldens sha256). A lacuna é quase toda de **linguagem visual e contratos** — a infra (wrappers §71, canais §73, flags, goldens, sanitizer PHP) já suporta o caminho proposto abaixo.

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Direção 2D premium / Legacy × Premium | 2288–2295, 2511–2517, 2556–2558 | Identidade "premium stylized 2D/2.5D"; níveis internos Legacy/Premium; Golden Classic Male/Female; Art Bible cap. Classic; anti-patterns; before/after | NÃO EXISTE. Arte atual é flat+1 gradiente (`engine/partes/bases.ts:defsPele`, `cabelos.ts:defsCabelo/BRILHO`, `roupas.ts:defsRoupa`). `docs/AVATAR-STUDIO-5/classico-aaa.md` trata só de LAYOUT | Art Bible Classic, conceito "acabamento premium", goldens visuais |
| Visual Quality Metadata 2D | 2292, 2526 | prototype/legacy/production/premium/hero por asset 2D; filtro dev | PARCIAL: `services/MetadadosAssets.ts` (autor/origem/licença/versão/tags) sem campo de qualidade; `ItemCatalogo` (`domain/types.ts`) sem `visualQuality` | campo derivado (registry em dados), filtro dev, "Vitrine não destaca Legacy" |
| Layer Architecture / z semântico | 2303–2312 | Camadas formais (BACKGROUND…FRAME), hair back/front, clothing base/outer, back accessories, aura back/front, shadow layers, cada asset declara camada | PARCIAL: `render.ts:ORDEM_CAMADAS` (lista fixa) + `fundo+banner+aura` + `ParteDef.atras` (só efeito) + `roupa_sobre` (§3393) + `acessorio_costas` (desenha no bloco de acessórios, NÃO atrás do corpo) | tabela semântica de z; `renderAtras` p/ cabelo/aura/acessório (costas de verdade); layer de sombra |
| Scaffold / viewport / presença | 2296–2302 | Scaffold mais flexível (cabeça/pescoço/ombros/torso/braços); avatar ocupa mais viewport; face focus por categoria | PARCIAL: `base-api.ts:G/PATH_OMBROS/PATH_PESCOCO` (rígidos); `partes/corpo.ts:corpoInteiro` (corpo único); foco por categoria em `shell/ShellStudio.tsx:ENQUADRAMENTOS` + `PRESETS_CAM6` (as6.viewport) e `GradeItens.tsx:FOCO_THUMB`; `envolverFigura` (tipo/postura/fino) | scaffold v2 (silhuetas por roupa/corpo) só em premium; nada a fazer em foco (já existe) |
| Rosto / pele | 2313–2326 | Face shape library (8 formatos), jawline/chin/cheeks, orelhas integradas, skin shading (base/side/highlight/under-chin/cheek tint), tokens de gradiente por tom calibrados por luminância | PARCIAL: 20 bases humanoides (`bases.ts`: classica, angular, redonda, coracao, quadrada, longa, marcada…) com paths distintos mas shading = 1 radialGradient + 1 sombra; `cores.ts:tinta()` deriva claro/escuro/profundo por mistura FIXA (0.32/0.28/0.52), sem calibração por luminância; `cor-hsl.ts` tem hex↔HSL | tokens de shading por luminância (`tintaPremium`), overlay de volume facial, bases premium |
| Olhos / sobrancelhas / nariz | 2327–2342 | Anatomia (sclera/iris/pupil/lids/highlight), iris gradient, catchlight variável, brows com volume, nariz com bridge/contour/nostril/highlight | PARCIAL: `olhos.ts:olhoHumano()` (íris flat `#4a3626`, 1 brilho, linha de pálpebra); sobrancelha = 1 stroke; nariz NÃO existe em nenhuma base (só sombra sob o queixo) | olhos premium (novo helper `olhoPremium`), nariz como overlay da base premium, brows com shape |
| Boca / expressões / barba | 2343–2354 | Boca em camadas (upper/lower/center/highlight); expressões neutral/smile/confident/serious/surprised/happy alterando olhos+brows+boca+cheeks; barbas com profundidade, stubble pattern, cor sincronizada | PARCIAL: 40 bocas (`bocas.ts`) a traço; expressões = combinação olhos+boca manual; barba = acessórios/`olhos`? (não há categoria barba 2D; 3D tem slot barba §425) | bocas premium, "expressão" como preset que toca olhos+boca (sem campo novo), barba 2D |
| Cabelo | 2355–2369 | 6 camadas (back/main/fringe/shadow/highlight/strands), silhuetas distintas, long hair atrás do pescoço, ponytail/bun/afro/curly, micro sway | PARCIAL: 50 cabelos (`cabelos.ts`) = 1–3 paths + `BRILHO`; `cab_longo` desenha as mechas "atrás" POR CIMA da roupa (ordem: roupa antes de cabelo); sway existe em `vida.ts` (rotate ±0.7°) | `renderAtras` p/ cabelos premium (massa traseira antes da base), famílias premium |
| Roupas / materiais / canais / outfits | 2370–2388 | Roupa altera silhueta; t-shirt/shirt/hoodie/jacket/blazer/pants/shoes com detalhes; tokens cotton/denim/leather/metal/technical/satin; canais primary/secondary/accent; camiseta×calça independentes; outfit presets com identidade semântica = 3D | PARCIAL: 30 roupas + 4 sobrepeças (`sobrepecas.ts`); canais §73 (`coresCamada`: pele/cabelo/roupa/destaque); `corpo.ts` pinta calça com `p.roupa` (calça NÃO tem cor própria); sem tokens de material; `PALETAS_ROUPA` §74 | tokens de material (registry), calça como canal/slot, roupas premium com silhueta, outfits |
| Acessórios premium | 2389–2404 | Glasses/crown/necklace/watch/backpack/wings/props/pet com profundidade; back layer real; paridade semântica (`classicRendererAsset`/`3dRendererAsset`), `rendererSupport: classic\|3d\|both`, UI avisa ausência | PARCIAL: 75 artes com 50 gradientes (`acessorios.ts`), slots finos #140 e corporais #154; 3D usa SLUGS de partes (`services/Partes3d.ts`) SEM mapa id2D↔slug3D; `nucleo/renderizador.ts:SLOTS_SO_3D/pendenciasPara` avisa pendências só no sentido 3D→2D | registry `ParidadeRenderer` (id lógico → {classic, 3d}), `rendererSupport`, acessórios premium |
| Fundos / profundidade / contato | 2405–2415 | Far/mid/floor/foreground/atmosphere; parallax sutil; floor; contact shadow; reflection; atmosferic depth; luz harmonizada | PARCIAL: 20 fundos (`fundos.ts`) = fragmento único; parallax de 3 planos (plano-fundo/personagem/frente) só no palco (`PalcoCinema.tsx`); `fun_estudio` tem elipse de chão; corpo inteiro tem sombra de contato (`corpo.ts`), busto NÃO | `renderPlanos` (palco) + sombra de contato premium + fundos premium |
| Looks / iluminação simulada | 2416–2428 | Studio/Portrait/Hero/Neon; overlay gradients, masks, rim paths, shadow filters; filter budget; reutilizar defs; filtros por material | NÃO EXISTE no 2D (3D tem presets de luz §163). `params.ts:aplicarParamsSvg` já aplica `filter="brightness() hue-rotate() drop-shadow()"` (CSS filter functions) em moldura/banner | "look" como campo de apresentação (foto/palco) ou overlay premium; budget de filtros |
| Auras / efeitos / molduras | 2429–2442 | Famílias de aura em 4 camadas (rear glow/main/particles/front accent), animação; efeitos por família; molduras com material e profundidade | PARCIAL: 15 auras SMIL (`auras.ts`), 24 efeitos + `particulas.ts` (10 tipos, tiers), 24 molduras (1 filtro); aura sempre ATRÁS (sem "front accent") | `renderFrente` p/ aura premium; famílias; molduras premium |
| Presets / coleções | 2443–2445, 2533 | Composições curadas (face/hair/outfit/acc/bg/aura/frame/look) | EXISTE: `AvatarCatalog.ts:PRESETS` (24), `COLECOES`, `ARQUETIPOS` | presets premium C01–C06 |
| Photo Mode 2D | 2446–2454, 2536–2540 | Framings full/bust/portrait/square/vertical; export alta res; transparente; toggles efeito/moldura/fundo; mesmo state do editor | PARCIAL: `engine/render-foto.ts` (perfil/header/banner/wallpaper), export 1920px §186.1 (`Foto.tsx`, workers v2), `as5.foto_entrada` leva avatar→foto; a foto recebe só assets de APRESENTAÇÃO por contrato (types.ts: "nunca roupa/corpo") | framings de avatar (bust/portrait/full) + PNG transparente + toggles no export do AVATAR (não só da foto) |
| Microanimações / idle | 2455–2463 | Microposes (neutral/hero/relaxed), breathing, blink não periódico, aura/companion movement, reduced-motion | EXISTE (palco): `vida.ts` (respirar 4,2s, cabelo, piscar 2,8–7s aleatório), `PalcoCinema.tsx` (olhar/parallax/reduced-motion), `postura` §118, SMIL nas auras; `domain/animacao.ts` = só contrato (registry vazio) | gaze offsets no shell novo; registrar idle no `ANIMACOES`; nada persiste |
| UX visual-first / layout | 2464–2472 | Thumbs, menos texto, cards maiores, grid responsivo, sidebar resize, scroll interno, dock inferior, mobile drawer | EXISTE: `as5.classico_aaa`, `as6.dock_inferior`, `as6.dock_fit`, `as6.thumb_item`, `as6.mobile_v6` | thumbs por categoria (face close-up etc.) já via `FOCO_THUMB`; só ajustes |
| Performance / 2.5D híbrido | 2473–2490 | Node budget, def reuse, memoization, asset-level render, blur control, raster fallback, texture overlays | PARCIAL: `AvatarSvg.tsx` memoiza por config; `QualityManager.ts` (eco/equilibrado/alto); `SvgSanitizer.php:MAX_BYTES=300000`; sem contador de nós/bytes por avatar em teste | teste de orçamento (bytes/nós/filtros por golden); tier ⇒ desliga filtros |
| Pipeline / contrato de asset 2D | 2491–2497 | id/category/layers/colors/materials/rendererSupport/visualQuality/preview/rarity/collection; registry declarativo; manifest; versioning | PARCIAL: `ItemCatalogo` (id/categoria/raridade/tema/usaCores/slot/requerBase…), `ManifestCatalogo.ts` (§267), `MetadadosAssets.ts` (versão), `VariantesAssets.ts` (registry em dados) | campos `camadas`, `materiais`, `rendererSupport`, `visualQuality` (derivados, não na arte) |
| VisualQA / goldens / hard fails | 2498–2510, 2515–2516 | Screenshots male/female × full/bust/face; QA de fundos/auras/materiais/molduras/responsivo; hard fails; score; set C01–C06 | PARCIAL: goldens sha256 (`golden-avatars.mjs`, 16 casos) provam byte-stability, não qualidade visual; `visual-851.mjs`, `classico-aaa.mjs` (layout) | golden CLASSIC screenshots (PNG) + before/after por categoria + checklist de hard fail |
| Rollout / fallback / flags | 2518–2535 | Legacy fallback; flag; não duplicar editor; migração progressiva; default avatar migra cedo; IDs estáveis; histórico reconstitui | EXISTE infra: `nucleo/flags.ts` (as5.*/as6.*), `validarConfig` omite neutros, `hashConfig` | flag `as6.classico_premium` + campo `acabamento` |

## 3. O que JÁ está coberto e prerequisitos

**Coberto (só referenciar):** motor determinístico + `uid` por hash (`render.ts:hashConfig`); wrappers genéricos §71 (`params.ts`) e canais §73 (`coresCamada`) como PRECEDENTE de "elevar sem tocar arte"; sobrepeças como precedente de wrapper (`sobrepecas.ts`); tipo corporal/postura/fino (`envolverFigura`); foco por categoria e presets de câmera (`ENQUADRAMENTOS`, `PRESETS_CAM6`, `FOCO_THUMB`, `modoItem.ts`); vida/idle/blink/parallax no palco; partículas determinísticas; Quality Manager; metadados/manifest/variantes em dados; goldens executáveis; SvgSanitizer PHP; export 1920px e workers de encode; presets/coleções/arquétipos.

**Prerequisitos de/para outras partes:** Parte 12 (P0) exige ART-BIBLE.md, GOLDEN-TESTS.md, VISUAL-QA.md antes de qualquer arte premium — o capítulo Classic (§2556) entra nesses docs. Parte 11 (pipeline/VisualQA/regressão visual) fornece o runner de screenshots que a onda de Golden Classic consome. Parte 10 fornece à Parte 11 o contrato de asset 2D (`camadas/materiais/rendererSupport/visualQuality`) e à paridade semântica (Partes 4–6, 3D) o registry `ParidadeRenderer`. Photo Mode (§2446–§2454) depende da Parte 7/Photo Studio v2 para framings comuns.

## 4. Conflitos/risco com as regras invioláveis e contorno

1. **Byte-stability × "elevar o visual".** Qualquer overlay/sombra/gradiente novo aplicado a IDs existentes muda o SVG salvo. Contorno: (a) campo novo `acabamento?: 'premium'` no `AvatarConfig` — ausente = legado = byte a byte (igual `corpo`/`postura`); (b) artes premium = **IDs NOVOS** em arquivos NOVOS (`engine/partes/premium/*.ts` ou `engine/premium/`), nunca edição em `partes/*`; (c) mapa de sucessor `SUCESSOR_PREMIUM: Record<idLegado, idPremium>` em dados (Vitrine/dev/onboarding), nunca re-slot automático de avatar salvo; (d) `CONFIG_PADRAO` NÃO muda (g01 depende dele) — novo `configInicial()` escolhe o padrão premium só para avatares NOVOS sob flag; (e) goldens g01–g16 intocados + goldens novos p01+ para o premium.
2. **Nunca editar arte em partes/*.** Hair back, aura front, sombra de contato, nariz, shading de pele = **wrappers por cima** (pós-processamento em `render.ts` guiado por `G`/geometria) ou `ParteDef` premium em arquivo novo com campos opcionais novos (`renderAtras`, `renderFrente`, `renderPlanos`). O briefing §2290/§2520 concorda ("engine existente + novo padrão").
3. **SvgSanitizer PHP (whitelist).** Hoje só permite `filter/feGaussianBlur`, `pattern`, `clipPath`, gradientes; **NÃO** permite `mask`, `feOffset/feMerge/feColorMatrix/feFlood/feComposite/feDropShadow`, `use`, `style`, `mix-blend-mode`, `class`. Ou a linguagem premium se restringe a isso (inner shading = clipPath + gradiente; contact shadow = elipse com feGaussianBlur; rim = path duplicado com stroke — exatamente o que §2425–§2427 preferem), ou se estende a whitelist (decisão numerada, teste de sanitizer espelhado). Recomendo **restringir na onda 1** e só estender com `mask`+`feOffset/feMerge/feFlood/feComposite` se necessário.
4. **Budget de bytes/nós.** `MAX_BYTES=300000` no PHP; premium com 6 camadas de cabelo + materiais pode multiplicar nós. Contorno: teste de orçamento por golden (bytes ≤ 40 KB busto / ≤ 80 KB corpo, nós ≤ 600, filtros ≤ 4) e defs compartilhados por `uid` (§2424/§2475).
5. **Flags.** Tudo atrás de `as6.classico_premium` (pai) + filhas por família (`as6.cp_rosto`, `as6.cp_cabelo`, `as6.cp_roupa`, `as6.cp_fundo`, `as6.cp_aura`, `as6.cp_foto`), com dependências declaradas em `nucleo/flags.ts` (como `as5.assembler3d`). Flag off ⇒ campo `acabamento` segue ACEITO na leitura (forward-compat, doutrina #141) mas o render ignora e a UI esconde.
6. **PHP espelhado.** `acabamento` (enum fechado `['premium']`) em `api/avatar/studio.php` + eventuais `camadas` novas (ex.: `barba`, `calca`) na lista `$categorias`.
7. **Licenças/bundle.** Arte vetorial é autoral (dshow) — sem risco; texturas raster (§2487 noise/denim) só se geradas proceduralmente (`<pattern>`) ou CC0 declarado em `MetadadosAssets`. Sem libs novas (SVG puro + WAAPI já usados).
8. **Paridade semântica × "não duplicar identidade".** Não criar "Óculos 2D 01": o ID lógico já é o do catálogo 2D; o 3D mapeia por registry (id → slug de `Partes3d`). Nunca persistir o slug 3D no config.

## 5. Proposta de ONDAS

**P10-A — Fundação Classic Premium (P0, esforço M, dep: Parte 12 Art Bible/Quality Bar)**
1. §2288–§2291/§2556–§2558 — `docs/AVATAR-STUDIO-5/ART-BIBLE.md` cap. "Classic Premium" (silhueta, layering, shading tokens, materiais, sombras, anti-patterns). Sem código.
2. §2518–§2520/§2535 — campo `acabamento?: 'premium'` em `domain/types.ts`, `validarConfig` (omitido quando ausente), `api/avatar/studio.php`, `nucleo/contratos.ts`; flag `as6.classico_premium` + filhas em `nucleo/flags.ts`. Teste: goldens g01–g16 inalterados; teste unitário "acabamento ausente ⇒ JSON idêntico".
3. §2303–§2306 — tabela semântica `CAMADAS_Z` em `engine/camadas.ts` (BACKGROUND…FRAME) da qual `ORDEM_CAMADAS` é DERIVADA; teste: sequência derivada === lista atual (byte a byte).
4. §2307/§2309/§2311/§2312 — campos opcionais `renderAtras?`, `renderFrente?`, `renderSombra?` em `base-api.ts:ParteDef`; `render.ts` pinta `renderAtras` de cabelo/acessório_costas/aura antes da base e `renderFrente` de aura após o personagem — só quando a arte declara (legado não declara ⇒ byte a byte). Golden novo p01 com item de teste.
5. §2292/§2403/§2492 — `services/QualidadeVisual.ts` (registry em dados: `visualQuality` legacy/production/premium/hero por id, `rendererSupport` classic/3d/both, `camadas`, `materiais`) + filtro dev `Legacy/Premium/Hero` (§2526) no inspector. Teste: 100% dos ids classificados.
6. §2321–§2325 — `engine/cores.ts:tintaPremium(hex)` calibrada por luminância via `cor-hsl.ts` (pele escura mantém highlight; clara não estoura) — função NOVA, `tinta()` intocada. Teste tabela de 8 tons.
7. §2473–§2482 — `scripts/avatar/testes/orcamento-2d.mjs`: bytes/nós/filtros por golden (legado e premium); falha acima do orçamento.
8. §2499/§2515 — `scripts/avatar/testes/golden-classic.mjs`: screenshots PNG male/female × full/bust/face (legado vs premium lado a lado) em `docs/AVATAR-STUDIO-6/golden-classic/`. Dep: runner da Parte 11.
9. §2412 — sombra de contato premium no busto (elipse + feGaussianBlur sob `PATH_OMBROS`) e `look` Studio como overlay opt-in sob `acabamento`. Golden p02.
10. Decisão numerada + `04-status-do-projeto`.

**P10-B — Golden Classic: rosto, olhos, boca (P1, esforço G, dep: P10-A)**
1. §2313–§2320 — 8 bases premium `bas_px_*` em `engine/partes/premium/bases.ts` (oval/round/square/long/angular/soft/broad/narrow) com jawline/chin/cheeks/orelhas integradas, nariz (§2340–§2342) e shading (§2321) usando `tintaPremium`; `requerBase` dos cabelos via lista exportada (sem editar `HUMANOIDES`: nova lista `HUMANOIDES_PREMIUM` consumida pelos cabelos premium; cabelos legados ganham compatibilidade por `services/` (compat em dados), não por edição da arte). Flag `as6.cp_rosto`.
2. §2327–§2332 — helper `olhoPremium()` (esclera gradiente, íris radial, pupila, pálpebras, 2 catchlights) + 8 olhos `olh_px_*`; §2337–§2339 brows com shape; variação de catchlight por look.
3. §2343–§2347 — 8 bocas `boc_px_*` (upper/lower/center/highlight) + "expressões" como presets que equipam olhos+boca premium (sem campo novo).
4. §2350–§2354 — barba 2D: 6 itens premium em slot `acessorio_rosto`? NÃO — nova categoria `barba` (camada nova, PHP espelhado) com cor sincronizada ao `cabelo` e `coresCamada` para dessincronizar.
5. §2294–§2295 — Golden Classic Male/Female (presets `pre_golden_m/f`) + C01/C02; before/after.
6. Goldens p03–p06; orçamento; screenshots.

**P10-C — Cabelo premium + layering real (P1, esforço G, dep: P10-A)**
1. §2355–§2366 — 10 cabelos `cab_px_*` com `renderAtras` (massa traseira atrás do pescoço/ombros), main/fringe/shadow/highlight/strands; long/ponytail/bun/afro/curly. Flag `as6.cp_cabelo`.
2. §2367–§2369 — sway já existe (`vida.ts`); só garantir grupo `data-anim="cabelo-atras"` no palco.
3. §2361 — raiz casando com a testa das bases premium (ancoragem em `G`).
4. Goldens p07–p08; screenshots hair legacy vs premium.

**P10-D — Roupas, materiais, calça independente, outfits (P1, esforço G, dep: P10-A)**
1. §2379–§2384 — `engine/materiais2d.ts`: tokens cotton/denim/leather/metal/technical/satin (gradiente + highlight + `<pattern>` determinístico) consumidos pelas artes premium. Flag `as6.cp_roupa`.
2. §2370–§2378 — 8 roupas `rou_px_*` com silhueta própria (path próprio em vez de `PATH_OMBROS`) + `renderCorpo` premium; jaqueta/blazer como `roupa_sobre` premium.
3. §2385–§2386 — canal `calca` (novo `SlotCor`? NÃO — manter 4 slots; calça vira camada `calca` com `coresCamada` roupa/destaque; `corpo.ts` intocado — roupa premium de corpo desenha a calça por `renderCorpo` por cima). PHP espelhado.
4. §2387–§2388 — outfits presets com id lógico compartilhado com o 3D (`ParidadeRenderer`).
5. §2296 — scaffold v2 de corpo inteiro (`partes/premium/corpo.ts`) selecionado só com `acabamento` premium.
6. Goldens p09–p11; Material QA (§2502).

**P10-E — Acessórios premium + paridade semântica (P1, esforço M, dep: P10-A, Partes 4–6)**
1. §2401–§2404 — `services/ParidadeRenderer.ts` (id lógico → {classic: id2D, tresD: slug}, `rendererSupport`) + aviso na UI quando falta equivalente (reuso de `pendenciasPara`).
2. §2389–§2398 — 10 acessórios premium (óculos com lente/highlight, coroa back/front, colar, mochila/asas com `renderAtras` real).
3. §2399–§2400 — compat rules espelhadas do 3D (`incompativelCom` em dados).
4. Goldens p12; thumbs Modo Item (`modoItem.ts`) medidos.

**P10-F — Fundos em profundidade, looks, auras, molduras (P1, esforço G, dep: P10-A)**
1. §2405–§2415 — `renderPlanos?` (far/mid/floor/foreground/atmosphere) em fundos premium, consumido SÓ no palco (parallax por plano em `PalcoCinema`/`vida.ts`); SVG salvo recebe o fragmento achatado. Flag `as6.cp_fundo`.
2. §2416–§2428 — looks Studio/Portrait/Hero/Neon como overlay de apresentação (palco/foto), não persistidos no avatar; budget de filtros por tier do `QualityManager`.
3. §2429–§2436 — 6 auras premium (fire/digital/arcane/ice/…) com rear glow + main + partículas (`particulas.ts`) + `renderFrente`. Flag `as6.cp_aura`.
4. §2437–§2442 — 4 molduras premium (metal/glass/neon) com profundidade e "não sufocar" (teste de área coberta).
5. Goldens p13–p15; Background/Aura/Frame QA.

**P10-G — Photo Mode 2D, Vitrine, thumbnails, rollout (P1/P2, esforço M, dep: P10-B..F)**
1. §2446–§2454 — export do AVATAR (não só foto): framings full/bust/portrait/square/vertical, PNG/WebP alta res, fundo transparente, toggles efeito/moldura/fundo (opções de `renderAvatar` de apresentação; nunca no salvo). Flag `as6.cp_foto`.
2. §2536–§2540 — garantir que a foto usa o MESMO config (já é assim via `as5.foto_entrada`); overrides só câmera/fundo/look/pose.
3. §2541–§2549 — Vitrine não destaca Legacy (`SUCESSOR_PREMIUM`); thumbs por categoria (face close-up/hair busto/clothing full/bg wide).
4. §2443–§2445/§2509 — presets C03–C06 + coleção "Classic Premium".
5. §2522–§2523 — `configInicial()` premium para avatares novos (CONFIG_PADRAO intocado).
6. §2559–§2560 — checklist DoD + gate; screenshots finais; decisão de rollout (flag ON).

Prioridade segundo Parte 12: P10-A = P0 (foundation/golden/contratos); B–F = P1 (Classic Premium core, após GOLDEN BODY/FACE/HAIR/OUTFITS do 3D na ordem §3107 ou em paralelo por ser motor distinto); G = P1 (Photo/Vitrine) com escala (§2529–§2533 triplicar) = P2, só após o gate §2560.

## 6. Perguntas bloqueantes × dúvidas resolvidas

**Bloqueantes (precisam do Jhony):**
1. Aprovação VISUAL do Golden Classic Male/Female e das primeiras famílias (gate §2560) — sempre do Jhony.
2. Extensão da whitelist do `SvgSanitizer.php` (`mask`, `feOffset/feMerge/feFlood/feComposite`) — mudança de superfície de segurança do SVG publicado; proponho NÃO estender na onda 1; se a arte exigir, decisão explícita.
3. Texturas raster (noise/denim WebP) — só com origem CC0 declarada; proponho procedural (`<pattern>`) e não precisar de asset externo.

**Resolvidas sozinho (decisões propostas p/ registro #155+):**
- Premium = campo `acabamento:'premium'` opt-in + IDs novos em arquivos novos; legado nunca muda de render (byte-stability literal).
- Hair back/aura front/sombra via campos opcionais novos do `ParteDef` (`renderAtras/renderFrente/renderSombra/renderPlanos`) — `atras` de efeito fica como está.
- `CONFIG_PADRAO` congelado; `configInicial()` decide premium p/ novos.
- Paridade semântica por registry em dados, id lógico = id 2D; 3D mapeia por slug; nada novo persiste.
- Looks (Studio/Portrait/Hero/Neon) são apresentação (palco/foto), não campo do avatar.
- Barba e calça entram como CAMADAS novas (PHP espelhado) em vez de novos `SlotCor`.
- Flags: pai `as6.classico_premium` + filhas por família com dependência declarada.

## 7. Métricas / Acceptance

- Goldens g01–g16: sha256 inalterados em TODAS as ondas (byte-stability).
- Goldens premium p01–p15 versionados; `orcamento-2d.mjs` verde (busto ≤ 40 KB/≤ 600 nós/≤ 4 filtros; corpo ≤ 80 KB).
- `golden-classic.mjs` gera male/female × full/bust/face legado vs premium; before/after por categoria (Face/Hair/Clothing/Background/Aura) em `docs/AVATAR-STUDIO-6/golden-classic/`.
- Hard fails §2505/§2506 checados por teste: ordem de camadas derivada === tabela; cabelo `renderAtras` atrás da base; roupa premium altera silhueta (bbox difere de `PATH_OMBROS`); canais funcionam; olhos alinhados em `G`; moldura cobre < X% do personagem; asset não some no export.
- 100% dos ids com `visualQuality` e `rendererSupport`; filtro dev funcional.
- PHP: `acabamento`/camadas novas espelhadas; teste de sanitizer com SVG premium passa sem `SVG_*_PROIBIDO`.
- Flags off ⇒ UI/render idênticos ao de hoje (teste de rollback por família).
- `prefers-reduced-motion` respeitado (já em PalcoCinema/vida.ts); `vida.ts` ganha parâmetro/checagem documentada.
- Suíte completa `rodar-todos.mjs` verde; DoD §2559 (20 itens) com evidência em doc antes de ligar `as6.classico_premium` em produção.
