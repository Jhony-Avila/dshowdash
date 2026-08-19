# Digest — MEGA_BRIEFING_01 · PARTE 11/12 (§2562–§2882)
## Pipeline de produção de assets, manifests, LOD, validação, Visual QA, golden tests, regressão visual, performance, telemetria e ferramentas internas

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 26994–29657. Código auditado em `main b0331d62`.

---

## 1. Resumo executivo

1. A Parte 11 NÃO pede um pipeline novo: reconhece o que existe (validação GLB, LOD0/1/2, gates de triângulos 60k/25k/8k, texturas por LOD, meshopt, hashes, manifests, scripts de publicação) e manda AMPLIAR com quatro eixos: **qualidade visual, compatibilidade, regressão e observabilidade** (§2562–§2563: "tecnicamente válido ≠ pronto para produção").
2. Pipeline oficial por estágios (§2564): SOURCE → INGEST → NORMALIZATION → OPTIMIZATION → LOD → TECH VALIDATION → MATERIAL → FIT → VISUAL QA → GOLDEN REGRESSION → PUBLISH → MONITOR. Hoje temos SOURCE/OPTIMIZATION/LOD/TECH/PUBLISH (scripts `scripts/avatar/assets3d/*`); faltam MATERIAL/FIT/VISUAL QA/GOLDEN REGRESSION formais e MONITOR fechado em loop.
3. Manifest como fonte de verdade com **schema versionado** (§2576–§2590): hoje o manifest 3D §517 é validado por lista de campos (`validar-asset.mjs:CAMPOS_MANIFEST`) sem `schemaVersion`, sem `visualQuality`, sem `qa`, sem `sockets/compatibilidade`, sem `previews` declarados, sem política de unknown fields.
4. Validações a ampliar (§2591–§2655): asset report + diff entre versões, normalização (escala/eixo/pivot por categoria), bounds, rig hierarchy, morphs, texturas (colorspace/POT/alpha/normal-flat/hash/dedupe). Existem hoje: triângulos, textura máx por LOD, bones canônicos por rig, UV, altura, materiais>8 (avisos).
5. Thumbnail/preview pipeline (§2656–§2662): existe `gerar-thumbs-3d.mjs` (câmera canônica, 128/512 webp); falta câmera POR CATEGORIA e turntable.
6. **Visual QA + Golden Tests + Regressão visual** (§2663–§2715): a maior lacuna. Temos byte-stability 2D (`golden-avatars.mjs`, 16 sha256 de SVG) e baseline de GEOMETRIA do shell (`regressao-layout.mjs`), mas NENHUMA matriz de screenshots de render com diff e aprovação, nem para 2D nem para 3D, nem rota/ferramenta de QA.
7. Performance (§2716–§2732): existe gate de PESO de bundle (deploy), `PerfBaseline.ts` (interações), `orcamento.mjs`, QualityManager/tier adaptativo; falta custo POR ASSET (load/decode/draw calls/texture memory) com budget por classe e histórico.
8. Telemetria (§2733–§2742): existe `Telemetria.ts` (ring buffer local, ~100 eventos avst:*, inclui `p3d_contexto`, `3d_degradou`, `p3d_retry`, `p3d_capacidade`); falta taxonomia de falhas por asset (load/texture/shader), contexto de erro (assetId/version/renderer/tier) e error-rate por asset.
9. CLI/publish gates/rollback/deprecation/visibility (§2743–§2767) e catálogo em escala (§2768–§2780): scripts existem isolados; falta CLI único com `--dry-run`, gates por nível (technical/premium/hero), `deprecated/successorId/visibility` no manifest e versões anteriores preservadas.
10. Pipeline 2D formal (§2781–§2792), CI por estágios com "affected assets" (§2793–§2801), dashboard de qualidade (§2806–§2815), templates/DCC (§2820–§2834), ingestão de terceiros segura (§2835–§2846), reprodutibilidade (§2847–§2855), docs (§2871–§2879). DoD §2880 tem 24 itens; gate §2881: sem pipeline+VisualQA+goldens+perf gates+rollback, não escalar catálogo.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Pipeline por estágios + source/runtime | 2562–2568, 2596–2606 | 12 estágios; /source imutável; SOURCE→WORKING→RUNTIME; normalização (escala 1u=1m, eixo, pivot por categoria) | EXISTE parcial: `docs/AVATAR-STUDIO-5/pipeline-assets-3d.md` (storage/assets-3d-fonte fora do público; public/assets/avatars/3d servido); `publicar-asset.mjs` (dedup/prune/weld/simplify meshopt/textureCompress webp); `validar-asset.mjs` checa altura 0,8–3m (aviso) | Sem estágio WORKING; sem pivot/eixo/forward documentados ou checados por categoria; sem transform freeze |
| Licença hard gate, ID estável, naming, versão | 2569–2575 | Sem licença sem publicação; assetId ≠ nome marketing; naming por categoria; assetVersion separado | EXISTE: `validarAsset` exige `licenca.tipo+comprovante` (erro) e id snake_case; manifest tem `versao`; `NOMES_AMIGAVEIS` em `gerar-indice-3d.mjs`; 2D: `MetadadosAssets.ts:metadadosDe` (autor/origem/licença/versão derivados, flag as6.meta_assets) | Naming convention formal por categoria (prefixos 2D `ace_/cab_/rou_`, 3D `base_/cab_/rou3d_` existem de fato, não documentados como regra); versão não gera path/hash distinto |
| Manifest schema versionado + validação | 2576–2590, 2776–2780 | schemaVersion; campos ID/versão/categoria/renderer/LOD/materiais/sockets/compat/visualQuality/licença/paths/previews/QA; unknown→warn, críticos→fail; dup ID/versão fail; thumb/preview obrigatórios | PARCIAL: `CAMPOS_MANIFEST` (id,tipo,versao,rig,lods,hashes,licenca,origem) + `ARQUIVOS_OBRIGATORIOS` (thumb/preview webp); `manifest-assets.json` 2D+3D determinístico (`gerar-manifest.mjs`, `manifest.test.mjs`); `ManifestCatalogo.ts` (as5.fundacoes_v2) manifest por categoria 2D; `registry.php`/`avatar_asset_versions` no banco | Sem `schemaVersion`; sem JSON-schema; sem `visualQuality/qa/sockets/compatibilidade/renderers/previews/bounds/deprecated/successorId/visibility`; sem checagem de ID duplicado entre pastas; unknown fields não tratados |
| Ingest report + diff versões | 2591–2595, 2607–2611 | Report automático (meshes/tri/materiais/texturas/bones/morphs/anims); histórico por versão; diff (+18% tri) com alerta | PARCIAL: `validarAsset` mede tri/materiais/UV/altura/maior textura e emite `relatorioDeValidacao` humano/JSON; `manifest.triangulos` por LOD | Sem bounds/morph/anim count no report; sem arquivo de report versionado; sem diff entre versões |
| Rig / morph / animação | 2612–2624 | Hierarchy, required/optional bones, socket refs, rig ID canônico, morph names/range, clips vs rig | PARCIAL: `rig-ubc-v1.json` lista canônica exata; bones ASCII; `publicar-animacoes.mjs` (UAL slim); `Sockets`/`Acessorios3D` no runtime | Sem validação de hierarquia, morph targets, range, clips×rig no validador |
| LOD gates + silhueta | 2625–2636 | Manter LOD0/1/2 + gates; gate por categoria; diff de silhueta LOD0/1/2 (fail se grande); landmarks face/hair/roupa | EXISTE: `LIMITES_TRIANGULOS/TETO_ABSOLUTO` + exceções auditáveis no manifest; runtime `Personagens3d.ts:lodPorQualidade`, `Renderizador3d.ts:lodDesejado` progressivo lod2-primeiro | Gates iguais p/ todas as categorias (cabelo=brinco); zero comparação visual de LOD |
| Texture pipeline | 2637–2655 | Classificação de mapas, colorspace, POT, aspect, max res, alpha real, normal/roughness flat, hash, dedupe, lib compartilhada | PARCIAL: resize+webp por LOD (`TEXTURA_MAX`), medição de dimensão (`maiorTexturaDoGlb`), `dedup()` gltf-transform | Sem classificação/colorspace/POT/alpha/flat-map/hash de textura no validador |
| Thumbnail/preview/turntable | 2656–2662 | Câmera por categoria, ambiente neutro, resolução por categoria, turntable 0/90/180/270 | EXISTE: `gerar-thumbs-3d.mjs` (§508 câmera/luz canônicas, 128/512 webp, SwiftShader); 2D: `modoItem.ts:FOCO_ITEM_ASSET` + `medir-foco-item.mjs` (onda 1401) | Sem câmera por categoria 3D (cabelo vs roupa vs pet); sem turntable/preview Hero |
| Visual QA por categoria + evidência + status | 2663–2677 | Checklists por categoria; screenshots nomeados `assetId_v03_front.png`; metadata reviewer/date/status; status pending/approved/approved_with_notes/rework/rejected; hard fails automáticos | NÃO EXISTE (apenas `avatar_asset_versions.status` no banco e `CmsRo.tsx` read-only) | Tudo: checklist, evidência, campo `qa` no manifest, status machine |
| Golden Tests (cenas oficiais, matriz por categoria) | 2678–2689 | Golden Male/Female, skin tones, hair, body types, looks, cenários; matriz por categoria (óculos, jaqueta, asas) | PARCIAL (2D): `golden-avatars.mjs` 16 casos sha256 (docs/AVATAR-STUDIO-6/golden-avatars.json) = byte-stability de SERIALIZAÇÃO, não imagem; 3D: nada | Sem cenas golden como IMAGEM; sem matriz por categoria; nada 3D |
| Regressão visual (screenshots, diff, aprovação) | 2690–2705 | Baseline versionada por release; pixel diff + perceptual; human review; categorias expected/unexpected/needs_review; viewport/DPR/renderer/tempo/seed fixos | PARCIAL: `regressao-layout.mjs` (assinatura de GEOMETRIA 2px, baseline-layout.json); ~115 testes salvam screenshots em `testes/saida/` (não comparados); `navegador.mjs` fixa viewport; Chromium fixo (PW_CHROME) | Sem matriz de screenshots, sem diff, sem baseline de imagem, sem fluxo de aprovação, sem seed fixa de partículas, sem congelar animação |
| Rota/ferramenta de QA + Asset Inspector | 2706–2715 | Rota interna `/avatar-studio/qa`; trocar body/câmera/look/LOD/wireframe; inspector (ID/versão/quality/LOD/tri/mat/tex/draw calls/bones/morphs/socket/licença/QA); screenshot 1-click; busca por ID; filtros status/quality | PARCIAL: `shell/DetalheAsset.tsx` + `PropriedadesAsset.tsx` (as6.inspector, schema-driven de edição, não técnico); `TelemetriaDev.tsx` (as5.telemetria_painel); `CmsRo.tsx` (as6.cms_ro); harness `gerar-harness.mjs` | Sem rota de QA, sem inspector TÉCNICO (tri/draw calls/tex mem/bones), sem wireframe/LOD forçado |
| Performance por asset + budgets | 2716–2732 | load/decode/first render/tri/draw calls/tex mem/FPS por golden asset; budget por classe; Hero exception registrada; regressão ±; lazy-load; cache/hash paths | PARCIAL: gate de peso de chunks (`deploy-as5.sh` + `pesos-esperados.json`, `smoke-dist.mjs`), `PerfBaseline.ts` (interações, as6.perf_baseline), `QualityManager.ts`/`Capacidade3d.ts`/tier adaptativo, `CacheNiveis.ts` (mem+IDB com hash do LOD), GLB lazy por manifest, `orcamento.mjs` | Sem métricas por asset; sem budget por classe; sem histórico; paths não versionados por hash (só hash no manifest → cache-busting depende de versão) |
| Telemetria de assets | 2733–2742 | Falhas de load/textura/contexto/shader, FPS tier, LOD transitions, fallback; catálogo (selected/equipped/load time); contexto assetId/version/renderer/tier; error rate por asset; health score | PARCIAL: `Telemetria.ts` ring buffer local (100 ev), eventos `p3d_contexto`, `3d_degradou`, `p3d_retry`, `p3d_capacidade`, `equipou`, `p3d_personagem`; `Log.ts:lerCriticos`; `analytics-local.mjs` | Sem evento de falha de asset com `assetId/versao`; sem load time por asset; sem agregação/erro-rate (tudo local à aba); sem health score |
| CLI + dry-run + publish gates + override | 2743–2752 | `avatar-assets validate/build/qa/publish`; `--dry-run` com diff de manifest; gates technical/premium(visual)/hero(perf+preview+golden); override explícito logado | PARCIAL: 7 scripts separados (`publicar-asset`, `validar-asset`, `gerar-thumbs-3d`, `gerar-indice-3d`, `gerar-registro-sql`, `publicar-animacoes`, `gerar-manequim`); `--sem-validar` existe (é um "force" silencioso) | Sem CLI unificada, sem dry-run, sem gates por nível, `--sem-validar` sem log |
| Rollback, canary, visibility, deprecation, GC | 2753–2767 | Versões anteriores de manifest+binário; flag por asset; `visibility: internal/dev/production/hero`; `deprecated/successorId`; não apagar com saves dependentes; usage report | PARCIAL: `/backup` (deploy) e `avatar_asset_versions`; flags globais as5/as6 | Sem pasta versionada por asset; sem campos visibility/deprecated; sem usage report |
| Catálogo em escala | 2768–2775 | Índice (categoria/sub/raridade/coleção/quality/renderer/tags), thumbs lazy, grid virtualizado, preservar seleção | EXISTE em grande parte: `registry.php` paginado; `as6.virtual` (GradeItens virtualizado); `busca-v2`, `temTag`; thumbs lazy | Falta `visualQuality` como campo indexável |
| Pipeline 2D formal | 2781–2792 | SVG syntax/IDs/defs/filters/size; visual QA 2D; performance (nós/filtros); sanitizer; IDs únicos/prefixo; golden screenshots 2D | PARCIAL: `api/avatar/SvgSanitizer.php` (whitelist fail-closed, saída do motor); `golden-avatars.mjs` (hash); `manifest.test.mjs`; `medir-foco-item.mjs` | Sem lint de partes/* (IDs duplicados, filtros, tamanho), sem contagem de nós, sem screenshots 2D |
| CI por estágios + affected assets | 2793–2805 | lint/unit/schema/technical/build/visual/performance; rodar só matriz afetada; thresholds por métrica | PARCIAL: `rodar-todos.mjs` (140 testes seq., ~15 min), webhook deploy (decisão #47) com gate peso+smoke | Sem seleção por diff; sem stage visual/perf; thresholds só de peso |
| Dashboard de qualidade + KPI | 2806–2815 | Cards (total/production/premium/hero/pending/rework/legacy), visual debt por categoria, throughput, rejection reasons, KPI %Premium Approved | NÃO EXISTE (CmsRo mostra status do banco) | Tudo (depende de campos qa/visualQuality) |
| Art Bible version, templates, DCC | 2816–2834 | `artBibleVersion` por asset; templates hair/clothing/accessory/vfx/scenario; presets export; pre-export validator | NÃO EXISTE | Depende da Parte 1 (Art Bible) |
| Ingestão de terceiros + segurança | 2835–2846 | License check → curadoria → cleanup → materiais Dshow → fit → LOD → QA; GLB como input não confiável; size limit; bloquear URIs externas; SVG sem script | PARCIAL: `lerJsonDoGlb` valida magic/versão; `publicar-asset` só lê de `storage/`; LICENCAS.md; SvgSanitizer p/ export | Sem limite de tamanho na ingestão, sem bloqueio de `uri:` externas em imagens/buffers, sem checklist de "pack identity removal" |
| Reprodutibilidade + logs legíveis | 2847–2855 | same source+pipeline = same output; versões de ferramentas no manifest; build logs; FAIL resumido + log detalhado | PARCIAL: hashes sha256; thumbs determinísticos; `relatorioDeValidacao` curto | Sem `pipelineVersion/toolVersions` no manifest; sem log persistido de publicação |
| Agent workflow, batches, rollback trigger | 2856–2870 | Listar arquivos/migração/fallback; before/after; batches pequenos (golden → 20 → 50); observar telemetria; rollback trigger por threshold | PARCIAL: regime decisão #45 (relatórios), deploy blindado com rollback impresso | Sem threshold de erro → rollback definido |
| Documentação | 2871–2879 | ASSET-PIPELINE.md, VISUAL-QA.md, GOLDEN-TESTS.md, PERFORMANCE-BUDGETS.md, quick start 1 página | PARCIAL: `pipeline-assets-3d.md`, `baselines.md`, `runbook-operacao.md` | Faltam os 4 docs nomeados (§3044 Parte 12) + quick start |

---

## 3. Já coberto × prerequisito

**Já coberto (referenciar, não refazer):**
- Source imutável em `storage/assets-3d-fonte/` + runtime em `public/assets/avatars/3d/{personagens,partes,animacoes}` (§2566–§2568).
- Otimização meshopt + LOD0/1/2 + gates de triângulo/textura com exceção auditável (`publicar-asset.mjs`, `validar-asset.mjs`) (§2625–§2627, §2637, §2642).
- Hashes sha256 por LOD no manifest + `CacheNiveis` (IDB) + cache do GLB por hash no `Renderizador3d` (§2653, §2728–§2731, §2850).
- Thumbs/previews determinísticos (`gerar-thumbs-3d.mjs`) (§2656, §2658).
- Byte-stability executável 2D (`golden-avatars.mjs`) e regressão de geometria do shell (`regressao-layout.mjs`) — base do "golden".
- Gate de peso de bundle + smoke + backup duplo no deploy (`deploy-as5.sh`, `pesos-esperados.json`, `smoke-dist.mjs`) (§2723–§2725).
- Telemetria local sem PII (`Telemetria.ts`), QualityManager/tiers, Capacidade3d, PerfBaseline (§2733, §2736).
- Registry no banco (`registry.php`, `avatar_asset_versions`) + CMS read-only.
- SvgSanitizer fail-closed (§2785–§2787) para SVG vindo do cliente.
- Virtualização/paginação/busca/tags (§2768–§2775).

**Prerequisito de outras partes:** Parte 1/2 (Art Bible, Quality Bar → `artBibleVersion`, `visualQuality`), Parte 3–7 (golden body/face/hair/outfits/accessories usam a matriz daqui), Parte 8 (materiais → material validation), Parte 9 (luz/câmera → golden looks), Parte 12 (flags/rollout/docs). Esta parte é **P0 foundation** na ordem §3107 ("PIPELINE/QA" vem antes de ROLLOUT e SCALE); Visual QA + goldens devem existir ANTES de qualquer onda "premium" entrar.

---

## 4. Conflitos/risco com as regras invioláveis

| Risco | Regra | Contorno |
|---|---|---|
| Baseline de screenshots = binários PNG no git | "sem peso novo injustificado"; repo cresce a cada release | Guardar baselines FORA do git por padrão (servidor `/backup/visual-baselines/<release>/` ou `storage/visual-qa/`), versionar no git apenas `golden-visual.json` (sha256 + métricas por caso + viewport/DPR/chrome). Só diffs "unexpected" geram PNG anexado ao relatório. |
| Diff por pixel dá falso-positivo (AA, SwiftShader) | §2693 | Métrica perceptual simples em node via `sharp` (já dependência: raw buffers → % pixels com ΔE>limiar + bbox da mudança); tolerância por caso; classificação expected/unexpected/needs_review exige humano. Nenhuma lib nova. |
| Campos novos no manifest 3D (qa, visualQuality, renderers, schemaVersion) | Byte-stability / validação PHP espelhada | Manifest 3D não é estado de usuário — não entra na serialização do avatar. Campos novos OPCIONAIS no validador (warning), obrigatórios só para `visualQuality >= premium`. Se algum campo subir p/ `avatar_asset_versions.metadata_json`, o `registry.php` só lê — nada novo em `studio.php`. |
| Pipeline 2D "lint de partes/*" | Nunca editar arte em partes/* | Lint é SOMENTE leitura/relatório; correções (prefixar IDs) viram wrapper ou entram só em artes NOVAS. |
| Rota de QA / inspector técnico no bundle | Gate de peso + flags | Chunk lazy próprio (`QaStudio`) atrás de `as6.qa_route` (padrão OFF); `pesos-esperados.json` ganha entrada no mesmo commit. |
| Telemetria por asset com contexto | Sem PII | Só `assetId/versao/renderer/tier/browser-família`; continua ring buffer local; envio ao servidor só se já existir endpoint (hoje não existe — registrar como "precisa do Jhony" se quiser agregação). |
| Deprecação/GC de assets | Saves antigos nunca quebram | `deprecated: true` = oculto do catálogo, carregável; GC nunca automático; `/backup` para binários movidos. |
| Ingestão de terceiros | Licença clara | Hard gate já existe (licença erro); acrescentar `LICENCAS.md` como índice e bloquear URIs externas no GLB. |
| Mudança de gate por categoria (cabelo vs brinco) | Exceções auditáveis já existem | Gate por `tipo` do manifest com fallback aos valores atuais — assets publicados continuam válidos (sem regressão). |

---

## 5. Proposta de ONDAS

### P11-A — Manifest schema v2 + validador ampliado (P0, esforço M)
Objetivo: manifest como fonte de verdade versionada e política de falhas explícita. Dep.: nenhuma.
1. §2576–§2581 `schemaVersion: 2` + JSON-schema em `scripts/avatar/assets3d/schema-manifest-v2.json`; `validar-asset.mjs` valida (unknown=warn, críticos=fail). Teste: `assets3d.test.mjs` ganha casos.
2. §2585–§2586 dup ID/versão entre pastas (`gerar-indice-3d.mjs` falha). Teste node.
3. §2571–§2575 + §2612–§2614 naming convention documentada + regex por tipo (`base_/cab_/rou3d_/ace3d_/vfx_`); lint 2D de prefixos (`ace_/cab_/rou_`...) só-leitura.
4. §2607–§2609 bounds (bbox/sphere) no manifest, oversized/tiny warning por tipo.
5. §2591–§2595 `report.json` por versão (meshes/tri/mat/tex/bones/morphs/anims) + diff vs versão anterior com aviso (+X% tri).
6. §2620–§2624 morphs: nomes/contagem/range no validador (fail range inválido).
7. §2615–§2619 rig: hierarquia + required/optional por `rig-<id>.json`; clips × rig em `publicar-animacoes`.
8. §2643–§2652 texturas: classificação por slot, POT/aspect, alpha real vs material, hash por textura, normal flat (heurística variância).
9. §2759–§2764 campos `visibility`, `deprecated`, `successorId`, `visualQuality` (legacy/production/premium/hero) + `artBibleVersion` opcional; `index.json` propaga; front filtra `visibility!=production` sem flag (`as6.assets_internos`).
10. §2847–§2849 `pipelineVersion` + `toolVersions` no manifest; testes `pipeline3d.test.mjs` atualizados.
Flags: não há runtime exceto item 9 (`as6.assets_internos`). Golden: `manifest.test.mjs` continua determinístico.

### P11-B — Matriz de screenshots + regressão visual (P0, esforço G)
Objetivo: fechar a lacuna principal — "VISUAL golden" além da byte-stability. Dep.: nenhuma (2D) / assets 3D já publicados.
1. §2697–§2705 `scripts/avatar/testes/visual/captura.mjs`: helper determinístico (viewport 1440×900 fixo, DPR 1, `prefers-reduced-motion`, congelar `requestAnimationFrame`/tempo via `page.clock`, seed fixa de partículas — expor `window.__avstSeed` atrás de `as6.seed_determinista`).
2. §2678–§2685 matriz golden 2D: os 16 casos de `golden-avatars.mjs` renderizados como PNG (busto/palco/corpo/foto) + 6 looks do palco (clima/luz); ids `g01-padrao-busto_front.png`.
3. §2678–§2689 matriz golden 3D (WebGL SwiftShader, `abrirAba3d`): 8 personagens × {front, ¾, profile} × LOD{0,1,2} em pose idle congelada; cabelos/roupas modulares em `base_superhero_m/f`.
4. §2690–§2694 `comparar-visual.mjs`: diff perceptual com `sharp` (raw RGB, ΔE por pixel, % acima do limiar + bbox); saída `regressao-visual.json` com `expected/unexpected/needs_review`.
5. §2691 baseline versionada: `docs/AVATAR-STUDIO-6/golden-visual.json` (sha256+métrica por caso, viewport, chrome build) no git; PNGs em `scripts/avatar/testes/saida/baseline-visual/` (gitignored) e cópia no servidor em `/backup/visual-baselines/<commit>/` via passo opcional do deploy.
6. §2695–§2696 fluxo de aprovação: `--aprovar <caso>` regrava + exige nota em `golden-visual.json.notas[caso]` (doutrina #83: diff no mesmo commit).
7. §2630–§2636 diff de silhueta LOD0→LOD1→LOD2 (máscara alpha do render por LOD, IoU < 0,92 = fail) como parte do `validar-asset.mjs --visual`.
8. §2792 goldens 2D por ITEM: thumbnail de cada acessório em Modo Item (`FOCO_ITEM_ASSET`) → ocupação 70–85% medida (reusa `medir-foco-item.mjs`).
9. §2793–§2801 seleção "affected": `rodar-visual.mjs --desde <commit>` mapeia diff git → matriz (engine/render.ts → tudo 2D; poc3d/services 3D → tudo 3D; partes/<cat> → só categoria).
10. Entrada no `rodar-todos.mjs` (`regressao-visual.mjs`) + doc `GOLDEN-TESTS.md`.
Flags: `as6.seed_determinista` (OFF em produção; só muda aleatoriedade de partículas quando ON). Teste/golden: o próprio.

### P11-C — Visual QA stage + rota de QA + inspector técnico (P0/P1, esforço G)
Dep.: P11-A (campos qa/visualQuality), P11-B (captura).
1. §2663–§2675 checklist por categoria em `docs/AVATAR-STUDIO-5/VISUAL-QA.md` + bloco `qa: {status, reviewer, date, notes, version, evidencias[]}` no manifest (status enum §2675).
2. §2672–§2673 `gerar-evidencias.mjs <pasta>`: `assetId_vNN_{front,34,profile,back}.png` em `storage/visual-qa/<id>/` (fora do público).
3. §2676 hard fails automáticos consolidados no validador (socket ausente, textura ausente, gate, material inválido, thumb ausente, rig).
4. §2706–§2707 rota interna: harness `avst-qa.html` gerado por `gerar-harness.mjs qa` + chunk lazy `shell/QaStudio.tsx` atrás de `as6.qa_route` (trocar body/câmera/look/LOD forçado/wireframe/screenshot 1-click).
5. §2708–§2709 inspector técnico: painel em `QaStudio` lendo manifest + `Renderizador3d` (`renderer.info`: draw calls/triângulos/texturas/geometrias, bones, morphs, LOD atual, hash, licença, QA).
6. §2710–§2712 screenshot por ângulo + relatório JSON + notas locais (IDB via `CacheNiveis`).
7. §2713–§2715 busca por ID e filtros status/quality no `CmsRo.tsx` (já lê o banco) — reaproveitar.
8. §2657–§2662 câmera de thumb POR TIPO em `gerar-thumbs-3d.mjs` (cabelo=busto, roupa=¾, pet=wide) + `--turntable` 4 ângulos p/ `visualQuality>=premium`.
9. §2677 gate: `publicar-asset` recusa `visualQuality>=premium` com `qa.status != approved` (salvo `--override` logado, §2751).
10. Teste `qa-route.mjs` (flag ON/OFF) + `pesos-esperados.json` atualizado.

### P11-D — Performance por asset + budgets + telemetria de asset (P0, esforço M)
Dep.: P11-A.
1. §2716–§2717 `medir-perf-asset.mjs <pasta>`: load/decode/first-render/tri/draw calls/tex memory (`renderer.info.memory`) por LOD em Chromium headless; grava `perf.json` na pasta.
2. §2718–§2721 budgets por classe em `scripts/avatar/assets3d/budgets.json` (face/hair/clothing/small acc/hero acc/pet/scenario); Hero exceção com `justificativa` no manifest (`excecoes.perf`).
3. §2802–§2805 histórico em `docs/AVATAR-STUDIO-5/perf-assets.json` (determinístico sem timestamps) + thresholds (FPS −15%, load +40%, texmem +50%) no `validar-asset`.
4. §2734 eventos novos em `Telemetria.ts`: `asset_falhou` (tipo load/texture/shader, assetId, versao, renderer, tier), `lod_transicao`, `fallback_ativado` — emitidos de `Renderizador3d.gltfDe`/`aoPerderContexto`.
5. §2735 `asset_carregou` (assetId, ms, lod) + `equipou` ganha `assetId` (já tem categoria).
6. §2737–§2738 `TelemetriaDev.tsx`: agregação local error-rate por asset (ring buffer) + export JSON.
7. §2741 health score derivado (tech/visual/perf/erro) em `gerar-indice-3d.mjs` → `index.json` (campo `saude`), exibido só no QaStudio.
8. §2727–§2732 path versionado: `urlDoLod` aceita `?v=<hash8>` atrás de `as6.cache_bust_assets` (cache-busting por hash sem mover arquivo).
9. §2723 teste `bundle-assets.mjs`: nenhum `.glb/.ktx2` importado estaticamente no bundle (grep em dist).
10. Doc `PERFORMANCE-BUDGETS.md`.
Flags: `as6.telemetria_assets`, `as6.cache_bust_assets`.

### P11-E — CLI unificada, dry-run, gates, rollback, batches (P1, esforço M)
Dep.: P11-A/C/D.
1. §2743–§2744 `scripts/avatar/assets3d/cli.mjs` (`validate|build|qa|publish|rollback|report`) wrapper sobre scripts existentes (zero duplicação).
2. §2745–§2747 `publish --dry-run`: arquivos, diff de manifest, status QA, gates.
3. §2748–§2752 gates por nível (technical/premium/hero) + `--override --motivo` logado em `storage/assets-3d-fonte/_publicacoes.log`; remover semântica silenciosa de `--sem-validar`.
4. §2753–§2756 versões anteriores preservadas: `public/assets/avatars/3d/<tipo>/<id>/_v<N>/` (ou move p/ `/backup`), `cli rollback <id> <versao>`.
5. §2757–§2758 canary: `visibility: internal` + `as6.assets_internos`.
6. §2766–§2767 usage report via `registry.php` (contar saves por asset em `avatar_*`) — só leitura.
7. §2835–§2846 ingestão segura: limite de tamanho, bloqueio de `uri:` externas, malformed → fail, checklist pack-identity no `VISUAL-QA.md`.
8. §2853–§2855 log de build por publicação + saída resumida `FAIL: id — motivo`.
9. §2863–§2869 política de batches e rollback trigger em `runbook-operacao.md` (erro de load > X% → desligar flag/rollback).
10. Doc `ASSET-PIPELINE.md` (lifecycle/naming/manifest/LOD/texturas/rig/QA/publish/rollback) + quick start §2878.

### P11-F — Pipeline 2D formal + dashboard de qualidade + templates (P1/P2, esforço M)
Dep.: P11-A/B; Art Bible (Parte 1).
1. §2782 lint 2D só-leitura `lint-partes-2d.mjs`: IDs duplicados entre artes, filtros não suportados, tamanho, nós.
2. §2784 custo 2D: contagem de nós/filtros/animações por item → `manifest-assets.json` (campo `custo2d`).
3. §2788–§2790 prefixo de IDs só para artes NOVAS (wrapper em `engine/render.ts` atrás de `as6.svg_ids_prefixo`).
4. §2806–§2812 dashboard em `QaStudio` (cards, debt por categoria, throughput, motivos de rejeição) lendo `index.json` + `manifest-assets.json`.
5. §2816–§2819 `artBibleVersion` obrigatório p/ `visualQuality>=premium`.
6. §2820–§2825 templates de manifest por tipo em `scripts/avatar/assets3d/templates/`.
7. §2826–§2833 presets Blender (doc) — opcional.
8. Teste `pipeline2d.test.mjs` + `baselines.md` ganha seção visual/perf.

---

## 6. Perguntas bloqueantes × decisões tomadas

**Bloqueantes (precisam do Jhony):**
1. Onde guardar os PNGs de baseline visual e evidências de QA no servidor: proposta `/backup/visual-baselines/` (regra de backup) ou `storage/visual-qa/` (não servido). Precisa de confirmação de caminho/espaço em disco (matriz 3D pode chegar a centenas de MB por release).
2. Agregação de telemetria de assets no servidor (error-rate real): exige endpoint novo + tabela — ação fora do git/irreversível em banco; sem isso fica local à aba (ainda útil em QA).
3. Se alguma matriz golden 3D exigir GPU real (SwiftShader é lento e difere de GPU), a validação visual fina continua sendo do Jhony.
4. Budgets numéricos por classe (§2718) e thresholds (§2804) — proponho valores iniciais derivados dos assets atuais; precisa de aceite como política.

**Resolvidas sozinho:**
- Diff perceptual com `sharp` (já dependência) em vez de pixelmatch/ssim novos.
- Baseline de imagem fora do git; JSON de hashes/métricas no git (mesma doutrina #83 dos goldens).
- Manifest v2 retrocompatível: campos novos opcionais, obrigatórios só a partir de `visualQuality>=premium`.
- Gate por categoria com fallback aos gates atuais (nenhum asset publicado regride).
- Rota de QA como harness + chunk lazy com flag OFF (não expõe em produção).
- Não criar CLI "nova": wrapper sobre os 7 scripts existentes (§2744).

---

## 7. Métricas / Acceptance da parte

- `validar-asset.mjs` reprova: schema inválido, ID duplicado, licença ausente, morph range inválido, textura fora de POT/colorspace, silhueta LOD com IoU < limiar — cada caso com teste em `assets3d.test.mjs`.
- `golden-visual.json` versionado com ≥ 16 casos 2D + ≥ 24 casos 3D (8 personagens × 3 ângulos) × LOD; `regressao-visual.mjs` verde na suíte e marca `unexpected` quando `engine/render.ts` ou `poc3d/*` muda sem `--aprovar`.
- Todo asset `visualQuality>=premium` tem `qa.status=approved`, 3+ evidências e `perf.json` dentro do budget (ou exceção justificada).
- `cli.mjs publish --dry-run` mostra diff de manifest e gates; `--override` aparece no log.
- Eventos `asset_falhou/asset_carregou/lod_transicao` visíveis no `TelemetriaDev` com `assetId/versao`.
- Docs `ASSET-PIPELINE.md`, `VISUAL-QA.md`, `GOLDEN-TESTS.md`, `PERFORMANCE-BUDGETS.md` existentes e linkados; `baselines.md` com seção visual.
- Suíte `rodar-todos.mjs` verde; `pesos-esperados.json` sem estouro; deploy por webhook sem alteração de rota.
- DoD §2880: 24 itens marcados com referência a arquivo/teste; gate §2881 satisfeito ANTES da onda de escala (P2).
