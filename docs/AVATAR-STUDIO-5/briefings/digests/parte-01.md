# Digest — MEGA_BRIEFING_01 · PARTE 1/12 (§2–§183)
## Visão, direção artística, Quality Bar e reestruturação do padrão visual

> Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 1–4181. Código auditado em `public/components/panels/panel-avatar-studio/src/` (commit `aa494d53`, onda 1404). Digest analítico — nada implementado.

## 1. Resumo executivo

1. A Parte 1 é a **tese** da frente AAA: a arquitetura (catálogo, 2D/3D, materiais, sockets, LOD, pipeline) é mais sofisticada que o que o usuário vê; o trabalho agora é converter engenharia em **qualidade artística percebida** (§2–§3), sem reconstruir sistemas maduros (§7).
2. Direção: **3D estilizado premium / semi-realista** (§5), nunca fotorealismo; o Clássico 2D vira **Premium Stylized 2D/2.5D** com identidade própria (§22), não imitação do 3D.
3. Institui o **Avatar Visual Quality Bar** (18 eixos §4, matriz de notas mínimas §65, Hard/Soft Fail §66–§67) como parte do Definition of Done; asset tecnicamente correto pode ser reprovado artisticamente.
4. Cria a **Escada de Qualidade** Q0 Prototype → Q1 Legacy → Q2 Production → Q3 Premium → Q4 Hero (§13/§62/§68) e exige que vire **dado no catálogo** (`visualQuality`, `visualQaStatus`, `visualVersion` §69) após auditoria dos contratos existentes; raridade ≠ qualidade (§14).
5. Processo: TechnicalQA + **VisualQA** = production-ready (§32–§33); renders de homologação padronizados (§34), Visual Regression Set (§35), clipping QA (§36), avaliação em movimento (§37), 4 distâncias A/B/C/D (§12), testes silhouette/grayscale/clay/lighting-only/backlight (§141–§146).
6. **Golden Avatars** (M, F, +2 variantes; pele clara/média/escura; cabelo claro/escuro; emissive; transparência — §25, §134–§140) são o benchmark e o **gate** (§26, §183): nenhuma produção em massa antes de GOLDEN M + GOLDEN F aprovados + Quality Bar documentado.
7. Apresentação: looks curados Studio/Hero/Neon/Portrait (§48–§51), Studio como benchmark neutro, cenário `visual_calibration` (§107), color checker (§108), exposição curada (§109), sombras de contato (§56), fundo neutro premium (§112), chão integrado (§113), níveis de ambiente 0–3 (§114).
8. Materiais: `COR != MATERIAL` (§41), Material Families (§42) com defaults de roughness/metalness/normal/AO/emissive, `metal/brilho` continua só como controle simplificado (§46–§47), tokens de arte (§120–§121).
9. Compatibilidade: IDs/saves/presets/sockets preservados (§27), versão visual independente da identidade lógica (§70–§71), flag `avatar.visual_v2` ou equivalente (§72) sem fork da aplicação (§73), inventário KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE por famílias (§159–§160), successor mapping sem falsificar escolha do usuário (§163–§167).
10. DoD da Parte 1 (§180): 15 entregáveis documentais/estruturais; prioridade §178: Quality Bar → Art Bible → Golden Humans → Lighting → Materials → Face/Hair → Clothing → Accessory Hero Set → VFX → escala.

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Art Bible + anti-patterns + versionamento | §129–§130, §168–§172 | `docs/.../ART-BIBLE.md` com estilo, proporções, materiais, cabelo, pele, roupas, luz, câmera, VFX, raridades, coleções, quality bar, exemplos, anti-patterns; registrar WHY/WHAT/IMPACT; `visualLanguage: 'dshow_v2'` | **Não existe**. Parcial: `docs/AVATAR-STUDIO-6/tokens-semanticos.md` (tokens de UI), `docs/AVATAR-STUDIO-5/classico-aaa.md` (layout do clássico), `docs/AVATAR-STUDIO-5/pipeline-assets-3d.md` | Documento inteiro; campo `visualLanguage` inexistente |
| Quality Bar formal, matriz, Hard/Soft Fail | §4, §12, §65–§67, §84 | 18 eixos; 4 distâncias A–D; matriz com notas mínimas (rosto/olhos/close-up/integração/clipping/coerência/premium ≥9); lista de Hard Fail → REJECTED | **Não existe** como doc nem como dado. `docs/AVATAR-STUDIO-5/homologacao-onda-611.md` tem uma tabela de homologação 3D ad hoc (clipping aceitável, hair cards opacos) | Doc VISUAL-QA/QUALITY-BAR + schema de ficha de avaliação |
| Escada de qualidade como dado no catálogo | §13, §62, §68–§69, §161, §170 | `visualQuality: prototype|legacy|production|premium|hero`, `visualQaStatus`, `visualVersion`, `legacyVisual`; placeholders nunca em destaque | **Não existe** nenhum dos campos (grep vazio). Existe: `ItemCatalogo` (`domain/types.ts:80`) com `raridade`, `biblioteca`, `novo`; `services/MetadadosAssets.ts:metadadosDe()` deriva autor/origem/licença/**versao**/tags (wrapper puro, flag `as6.meta_assets`); manifests 3D têm `familia: economico|padrao|premium` (`services/Partes3d.ts:44`, `Personagens3d.ts:ManifestPersonagem3d.familia`) e `versao` | Adicionar ao wrapper `MetadadosAssets` (2D) e ao manifest §517 (3D) um eixo `qualidadeVisual` + `statusQaVisual`; **não** ao `AvatarConfig` |
| Separar gate técnico × gate artístico (VisualQA no pipeline) | §32–§33, §131 | TechnicalQA + VisualQA = ProductionReady; estados pending/approved/approved_with_notes/rework/rejected com responsável/versão/data/screenshots | **Parcial**: gate técnico existe (`scripts/avatar/assets3d/validar-asset.mjs`: arquivos, manifest §517, hashes, triângulos 60k/25k/8k, texturas 2048/1024/512, bones, licença §511, UV). `services/PipelineAsset.ts` é pipeline de **foto** do usuário (não de asset 3D). `services/ValidadorIA.ts` valida sugestões de IA (IDs), não arte | Campo `qaVisual` no manifest + `validar-asset.mjs` exigindo `qaVisual.status` para `familia: premium`; doc VISUAL-QA.md |
| Renders de homologação padronizados + Visual Regression Set | §34–§35, §64, §99–§101 | 7 enquadramentos por personagem; frente/perfil/costas/close p/ cabelo; golden_*.png; Before/After com mesma câmera/pose/luz | **Parcial**: `scripts/avatar/assets3d/gerar-thumbs-3d.mjs` gera thumb 128 + preview 512 determinísticos (câmera/luz canônicas §508) — só 1 ângulo; `scripts/avatar/testes/golden-avatars.mjs` + `docs/AVATAR-STUDIO-6/golden-avatars.json` = 16 goldens de **SVG 2D por sha256** (byte-stability), não imagens 3D; `Renderizador3d.capturar()` com `deterministica: true` e supersampling §506 | Script `gerar-renders-homologacao.mjs` (N ângulos por tipo) + baseline de PNG 3D com tolerância perceptual |
| Clipping QA / Compatibility Matrix / Fit Profiles | §36, §74–§77 | Matriz ROSTO×CABELO, CABELO×CHAPÉU, CORPO×ROUPA…; `fitProfile {region, volume, clearance, compatibleBodyFamilies}`; nunca scale arbitrário | **Parcial**: `services/Assembler3d.ts` passo 13 valida máscaras §415.2 (faces da base ocultas) e escala; 2D tem `requerBase`/`incompativelCom` (`types.ts:102–104`) e registry de conflitos em `workspace/acessorios.ts` | Sem detecção geométrica de interpenetração; sem `fitProfile`; matriz de compatibilidade por amostragem inexistente |
| Golden Avatars (gate) | §24–§26, §133–§140, §177, §183 | 4 humanos (M/F ×2), pele clara/média/escura, cabelo claro+escuro, emissive, transparência, 1 cabelo "solução futura"; depois Golden Android/Animal | **Não existe** como conceito de conteúdo. Existem bases UBC `base_superhero_m/f` (CC0, rig ubc-v1, `public/assets/avatars/3d/personagens/`), 6 cabelos + 22 partes de roupa CC0 em `partes/` (todos `familia: economico`); "golden avatars" atual = configs 2D para hash | Definir 4 configs canônicas (2D+3D), doc GOLDEN-TESTS.md, renders de referência; **arte nova premium depende de assets externos/licença** |
| Inventário do legado (KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE) e placeholders procedurais | §15, §61–§63, §159–§162 | Classificar por famílias; `ITENS_SOCKET` procedurais viram DEV-ONLY/REPLACE preservando socket/ID | **Não existe**. Procedurais confirmados: `poc3d/catalogo3d.ts:ITENS_SOCKET` (9 itens "geometria pura"), `Renderizador3d.construirProp()` (props cabeca/rosto/pet), cenários `vazio|grade|estrelas|dojo` procedurais, `GridHelper` | Tabela de inventário por família + campo `qualidadeVisual: 'prototype'` nesses itens |
| Material Families / COR≠MATERIAL / UI simplificada | §20, §41–§47, §122 | Famílias skin_soft…hair com defaults roughness/metalness/normal/AO/emissive; `metal/brilho` só como controle de usuário; presets por coleção | **Parcial**: `services/Materiais3d.ts` = pipeline de **cor** por canal (`aplicarPipelineCores`, `TETO_EMISSIVO=2`, dedupe de instâncias); `poc3d/catalogo3d.ts:Config3D.material {metal, brilho}` + PHP `api/avatar/studio.php:485` espelha `metal/brilho`; `MeshStandardMaterial` dos GLB com mapas | Sem registry de famílias de material; sem aplicação por família; Parte 5 aprofunda |
| Iluminação/looks/calibração/exposição/tone mapping | §21, §48–§56, §107–§112 | Looks Studio/Hero/Neon/Portrait; cenário `visual_calibration`; color checker; exposição curada por look; ACES preservado + testes anti-estouro; sombra de contato; fundo neutro premium | **Parcial**: duas taxonomias de luz coexistem — `catalogo3d.ts:IluminacaoId = estudio|dramatica|neon` (PoC R3F `poc3d/Cena3D.tsx`) e `Renderizador3d.definirLuz('estudio'|'quente'|'fria'|'neon')` (shell `shell/Palco3d.tsx:877`); `definirExposicao` clamp 0.6–1.6; `definirTonemapping` aces/agx/neutro/reinhard; `RoomEnvironment` PMREM intensidade 0.55; `definirRim`; sombras reais por tier (`atualizarSombras`); fundo = cor sólida (`definirFundo` neutro/estudio/grade) | Sem look "Hero/Portrait"; sem cena de calibração; sem color checker; fundo sem gradiente/profundidade; sem chão de contato dedicado; sem teste de exposição |
| Bloom/pós controlado | §9, §52 | Bloom só em emissive/neon; não mascarar arte | **Existe**: `Renderizador3d.definirPos()` com `UnrealBloomPass(0.32,0.5,0.85)` + vinheta, nunca no econômico (flag `as5.pos3d_real`) | Bloom é global (threshold 0.85) — não seletivo por emissive; OK como baseline |
| Câmera / Face Focus / lente retrato 85 mm / viewport | §11, §90–§93 | Camera Quality Pass (FOV, distância, headroom); retrato ≈ 85 mm; avatar protagonista | **Parcial**: `catalogo3d.ts:CAMERAS` (corpo/busto/rosto/tresquartos por arquétipo); `Renderizador3d.enquadrar('auto'|'rosto')` por Box3/bone Head; FOV fixo 34 (`poc3d/Estudio3D.tsx:215`); 2D: `PalcoCinema` CAMERA_BUSTO/CORPO, `as6.viewport` presets | FOV não muda por preset (rosto usa mesmo FOV); sem pass de câmera documentado |
| LOD por importância, histerese, LODs idênticos | §31, §94–§96, §148–§151 | LOD por screen coverage + modo câmera + importância; não chamar atenção; auditar lod0=lod1=lod2 | **Parcial**: `services/Personagens3d.ts:lodPorQualidade()` só por tier; `services/CacheNiveis.ts`; `as5.progressivo3d` (LOD por tela §462, lod2-primeiro); DPR dinâmico `passoDpr()`; `QualityManager.ts` perfis auto/eco/equilibrado/alto. **Confirmado §96**: `humano_casual/modelo.lod{0,1,2}.glb` = 582 116 bytes cada; `cab_longo` 2906 tri nos 3 LODs; `base_superhero_m` lod0=lod1=14 318 tri | LOD contextual por parte (rosto/cabelo LOD0 no modo rosto) inexistente; auditoria de LODs idênticos pendente |
| Thumbnails/preview/Asset Inspector/Visual Dev Mode/overlays | §98–§105 | Thumb vende o asset; preview maior; inspector técnico (tri, LOD, materiais, licença, QA); overlays wireframe/normals/clay/silhouette | **Parcial**: thumbs 3D 128 px webp ~1.9 KB (`humano_casual/thumb.webp`) + preview 512; 2D `as6.thumb_item` (Modo Item); `poc3d/Hud3D.tsx` (fps/tri/drawCalls) flag `as5.hud3d`; `shell/TelemetriaDev.tsx`; `workspace/Inspector.tsx` + `inspectorSchema.ts` (identidade/props/cores/compat — voltado ao usuário); `Renderizador3d.diagnostico()`; CMS RO lista licenças (`api/avatar/cms.php`) | Sem overlays de QA (clay/silhouette/normals); sem inspector técnico de asset (LOD atual, materiais, texturas, QA status); thumbs 3D só 1 ângulo |
| Modo Clássico Premium Stylized 2D | §22 | Identidade 2D própria: shape design, gradientes, luz/sombra, highlights, profundidade, contorno seletivo, parallax | **Parcial**: motor `engine/render.ts` (ORDEM_CAMADAS, busto 240×240, corpo 240×400) com 266 gradientes na arte, `particulas.ts`, `sobrepecas.ts`, `cor-hsl.ts`; layout AAA `as5.classico_aaa` (`docs/AVATAR-STUDIO-5/classico-aaa.md`); vida §119 | Sem camada de "look 2D" (luz/sombra/rim) parametrizada sobre a arte; Parte 8/9 aprofundam; **arte existente em partes/* é intocável** |
| Feature flag visual_v2 sem fork | §72–§73 | Flag única para a nova geração; rollout/rollback/A-B | **Existe infra**: `nucleo/flags.ts:PADROES` + `DEPENDENCIAS_FLAGS` (rollback transitivo); já existe `as6.visual_v2` (elevação de **UI** do clássico, lote 871–880) — nome colide conceitualmente | Criar `as6.avatar_visual_v2` (pai) e filhas `as6.material_v2`, `as6.luz_v2`, `as6.classico_premium`, `as6.foto_v2` — adaptar §2917 |
| Performance/quality tiers previsíveis/captura boost | §28–§30, §147–§153 | Identidade não muda por tier; ordem de degradação; captura com boost temporário | **Existe**: `QualityManager.ts` (as6.quality), `Capacidade3d.ts`, `PerfBaseline.ts` (`ORCAMENTO_MS`), `as5.quality3d_v2` (ultra/cine, DPR), `as5.captura3d_v2` (LOD alto + supersampling), gates §631 no validador | Falta PERFORMANCE-BUDGETS.md formal + Quality Budget por categoria (§30); ordem de degradação (§150) não codificada |
| Compatibilidade de saves / versão visual / successor mapping | §27, §70–§71, §163–§167 | Identidade lógica estável; representação V1/V2 com rollback; `legacyAssetId → successorAssetId` só quando seguro | **Parcial**: `nucleo/migracoes.ts` (migrações de storage, mapa de sucessores "nasce aqui"), `as6.estado_vnext` (schema), manifest `versao`; `MetadadosAssets.VERSOES` (curadoria 1.1) | Sem `representacaoVisual`/`successor` no catálogo; política documentada de upgrade vs novo asset |
| Hierarquia visual, raridade moderada, Hero Assets, Vitrine premium | §57–§61, §156 | Rosto > silhueta > roupa > cabelo > acessórios > VFX > cenário; Vitrine só Hero/Golden | `components/Vitrine.tsx`, `MinhaVitrine.tsx`, `Colecoes.tsx` (hero de coleção); nenhum filtro por qualidade visual | Depende do campo `qualidadeVisual` para filtrar destaque |
| KPIs e Visual Debt | §157–§158 | % production-ready, % premium, clipping rate, regression rate, tempo de aprovação; `visualDebt` por área | **Não existe**. `services/Telemetria.ts`, `analytics_local` medem uso, não qualidade | Relatório `node scripts/avatar/qa-visual/relatorio.mjs` derivado dos manifests/metadados |
| Idle vivo, pose neutra, Hero Pose, pose retrato | §85–§89 | Respiração/piscada/olhar; pose Hero curada; pose de retrato | **Parcial**: `definirVida`, `Animacoes3d.ts` (máquina §433, pacotes UAL), `Poses3d.ts` (clipe+tempo), `as6.vida_shell` 2D; `alvoOlhar` | Sem pose Hero/Retrato canônicas nomeadas; Parte 7 aprofunda |

## 3. O que JÁ está coberto e prerequisitos de outras partes

**Já coberto (referenciar, não refazer):** renderer com `SRGBColorSpace`/ACES/`RoomEnvironment`/`EffectComposer`+`UnrealBloomPass` (`services/Renderizador3d.ts:222–265, 723`); gate técnico §631 com triângulos/texturas/hash/licença/bones/UV (`scripts/avatar/assets3d/validar-asset.mjs`, `publicar-asset.mjs`); thumbs determinísticos (`gerar-thumbs-3d.mjs`); metadados de proveniência/licença/tags (`services/MetadadosAssets.ts`); Material Manager de cor por canal com teto emissivo (`services/Materiais3d.ts`); Quality Manager central e tiers (`services/QualityManager.ts`, `as5.quality3d_v2`, `as5.progressivo3d`); captura com supersampling (`as5.captura3d_v2`, `capturar()` §506); flags com dependências e rollback transitivo (`nucleo/flags.ts`); goldens 2D executáveis (`golden-avatars.mjs`); tokens semânticos de UI (`styles/tokens.css`); layout AAA do clássico (`classico-aaa.md`); licenças CC0 rastreadas (`public/assets/avatars/3d/LICENCAS.md`, `catalogo3d.ts:Licenca`).

**Prerequisito para outras partes:** o campo de qualidade visual + status de QA (tema 3/4) é pré-requisito das Partes 2–9 (corpo, rosto, cabelo, roupas, acessórios, materiais, luz, clássico) e da Parte 12 (plano executivo: ART BIBLE → QUALITY BAR → GOLDEN *). O cenário de calibração + renders padronizados (temas 5/10) são pré-requisitos de qualquer Golden Body/Face/Hair. A flag-pai `avatar_visual_v2` (tema 15) é pré-requisito de todo asset novo. O inventário KEEP/UPGRADE/REPLACE (tema 8) alimenta a priorização de todas as partes.

## 4. Conflitos/risco com regras invioláveis e contorno

| Risco | Regra | Contorno |
|---|---|---|
| `visualQuality`/`visualQaStatus` no catálogo poderiam sugerir campo no `AvatarConfig` | Byte-stability / PHP espelhado | Metadado de **catálogo** (wrapper `MetadadosAssets` + manifest §517), nunca em `AvatarConfig`; zero serialização → sem PHP. Se um dia persistir preferência (ex.: "ocultar legado"), campo neutro OMITIDO + validação em `studio.php` |
| "Substituição visual reversível" (§71) e "Premium 2D" (§22) tentam **melhorar arte existente** | Nunca editar `engine/partes/*` | Representação V2 = **arte nova** (`partes/<id>_v2.ts` ou wrapper com look 2D por cima do SVG atual); o id lógico aponta para V1/V2 via registry sob flag; rollback = flag off |
| Golden Avatars 3D premium exigem **assets externos** (corpos/rostos/cabelos) | Só licença clara (CC0 etc.); nunca pedir tokens/assets ao Jhony pelo chat | Levantar candidatos CC0/CC-BY com comprovante no manifest §511; tudo que for compra/contratação de arte vai para "precisa do Jhony" |
| Nova flag `avatar_visual_v2` colide com `as6.visual_v2` existente (UI) | Flags as5/as6 | Nome distinto `as6.avatar_visual_v2` (pai) + árvore em `DEPENDENCIAS_FLAGS`; não renomear a existente |
| Overlays de QA (normals/clay/wireframe), color checker, cena de calibração adicionam código ao renderer | Sem libs pesadas; bundle | Usar `MeshNormalMaterial`/`MeshStandardMaterial` cinza/`wireframe=true` do próprio three (zero dependência); módulo `services/QaVisual3d.ts` carregado lazy só com flag dev `as6.qa_visual` |
| Visual Regression de PNG 3D é não determinística entre GPUs | Suíte verde obrigatória | Baseline só no caminho SwiftShader headless (mesmo de `gerar-thumbs-3d.mjs`) com tolerância perceptual (ex.: diff ≤1% pixels); falha = aviso, não tripwire, até estabilizar |
| Tone mapping/exposição por look mudam render do **palco**, não do avatar salvo | Byte-stability | Looks são apresentação (não persistem no `AvatarConfig`); Foto salva já carrega seus próprios parâmetros (`ProjetosFoto`) — looks novos só por flag e com `foto.look` novo OMITIDO quando padrão |
| Hard Fail automático (§66) poderia bloquear catálogo atual em produção | "não remover fallback / não apagar legado" | Q1 Legacy é sempre aceito para render; Hard Fail só bloqueia **promoção** a Q3/Q4 e uso em destaque |

## 5. Proposta de ONDAS

### P1-A — Fundação documental do Quality Bar (P0 · esforço M · sem dependências)
Objetivo: cumprir DoD §180 itens 1, 3, 4, 5, 9, 10, 11, 13, 14, 15 em docs.
1. `docs/AVATAR-STUDIO-5/ART-BIBLE.md` v1 (§129–§130, §169–§172): direção "Dshow Premium Stylized", anti-patterns, tokens de arte §120–§121 como tabela. Sem código. Teste: lint de existência no `rodar-todos`.
2. `docs/AVATAR-STUDIO-5/VISUAL-QA.md` (§4, §12, §32–§33, §65–§67): 18 eixos, distâncias A–D, matriz, Hard/Soft Fail, estados de QA, ficha JSON de avaliação.
3. `docs/AVATAR-STUDIO-5/GOLDEN-TESTS.md` (§25–§26, §35, §133–§140): estratégia dos 4 Golden Humans, requisitos de cobertura (pele/cabelo/emissive/transparência), gate §183.
4. `docs/AVATAR-STUDIO-5/PERFORMANCE-BUDGETS.md` (§28–§30, §147–§153): Quality Budget por categoria, ordem de degradação §150, realtime vs capture.
5. `docs/AVATAR-STUDIO-5/ASSET-PIPELINE.md` estendendo `pipeline-assets-3d.md` com gate artístico (§32), renders de homologação (§34), representação V1/V2 (§70–§71).
6. Diagnóstico visual consolidado + **baseline Before** (§64, §180.1/.12): capturar renders atuais dos 8 personagens publicados em 4 distâncias via `gerar-thumbs-3d.mjs` estendido (`--angulos`) para `docs/AVATAR-STUDIO-5/evidencias/before/`.
7. Inventário KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE por família (§159–§160): cabelos SVG, sockets procedurais `ITENS_SOCKET`, UBC base, partes ranger/peasant, cenários procedurais.
8. Plano de rollout + arquitetura de compatibilidade (§27, §72–§73, §162–§167): árvore de flags proposta, política upgrade-vs-novo-asset (§167), successor mapping.
9. Registrar decisões #155+ (flag-pai, nome dos campos, tolerância de regressão) nos docs do projeto.
10. Atualizar `auditoria-lacunas.md` com as lacunas desta parte.

### P1-B — Qualidade visual como DADO (P0 · esforço M · depende de P1-A itens 2/7)
Flag: `as6.avatar_visual_v2` (pai, default ON só para leitura de metadados; nada muda de render).
1. `services/MetadadosAssets.ts`: `qualidadeVisual: 'prototype'|'legacy'|'production'|'premium'|'hero'` + `statusQaVisual` + `versaoVisual` derivados (padrão `production`; mapa de curadoria `QUALIDADE_VISUAL` por id/família) (§62, §68–§69). Teste: `meta-assets.mjs` cobre 100% do catálogo com valor válido; goldens intocados.
2. Manifest §517 (3D): campos opcionais `qualidadeVisual`, `qaVisual {status, versao, data, notas}`, `representacao {versao, anterior?}` em `Personagens3d.ts`/`Partes3d.ts` + `validar-asset.mjs` (aviso se ausente; erro se `familia: premium` sem `qaVisual.status='approved'`). Teste: `pipeline3d.test.mjs`.
3. `poc3d/catalogo3d.ts:ITENS_SOCKET` e props procedurais marcados `prototype` (§15, §61–§63) via mapa (não altera render).
4. `Vitrine.tsx`/`Colecoes.tsx`/destaques: filtro "só ≥ production em destaque; nunca prototype" sob a flag (§60, §156, §161). Teste: unitário do filtro.
5. `shell/DetalheAsset.tsx`/`workspace/Inspector.tsx`: grupo "Qualidade (dev)" visível só com `as5.hud3d`/modo dev (§102–§103).
6. Script `scripts/avatar/qa-visual/relatorio.mjs`: KPIs §157 (% por nível, % QA aprovado) a partir de metadados/manifests → `docs/AVATAR-STUDIO-5/evidencias/kpi-visual.json`.
7. `visualDebt` inicial por área em `VISUAL-QA.md` (§158) preenchido pelo inventário.
8. CMS RO (`api/avatar/cms.php`, flag `as6.cms_ro2`): coluna qualidade visual (GET-only). PHP sem escrita → sem validação espelhada nova.
9. Teste de regressão: `golden-avatars.mjs` inalterado (prova byte-stability).
10. Documentar decisão de nomenclatura PT (`qualidadeVisual`) coerente com o código.

### P1-C — Laboratório visual 3D: calibração, looks, overlays (P0/P1 · esforço G · depende de P1-A)
Flag: `as6.qa_visual` (dev, OFF) + `as6.luz_v2` (looks, OFF até validação visual do Jhony).
1. Cenário `visual_calibration` em `Renderizador3d` (§107): fundo neutro 18%, chão neutro, key/fill/rim fixos, exposição 1.0, sem bloom/partículas/clima — método `definirLaboratorio(on)`.
2. Color checker opcional (§108): 6 esferas (branco/preto/cinza 18%/metal/pele ref/emissive) geradas em código.
3. Overlays QA (§105, §141–§144): `definirOverlay('nenhum'|'clay'|'normals'|'wireframe'|'silhueta'|'grayscale')` trocando material temporariamente (restauração exata via userData, padrão de `Materiais3d`).
4. Looks curados `studio|hero|neon|portrait` (§48–§51) unificando `IluminacaoId` e `definirLuz` (mapa de compatibilidade para `Cenas3d.LUZES_3D` — valores antigos continuam válidos); exposição curada por look (§109).
5. Fundo neutro premium (§112): gradiente radial procedural + vinheta sutil como textura de fundo (sem download); chão de contato (§113) com sombra suave; avaliar `ContactShadows`-like simples.
6. Preset de câmera retrato com FOV ≈ 85 mm equivalente (§91) — `definirCamera` ganha `fov` opcional; 'rosto' usa FOV menor.
7. Teste de exposição/tone mapping (§53): captura headless do color checker, assert pele não estoura/preto não esmaga (limiares de luminância).
8. HUD dev (`poc3d/Hud3D.tsx`/`TelemetriaDev.tsx`): LOD atual por parte, materiais, texturas, overlay ativo (§104).
9. Teste: `qa-visual-3d.mjs` (headless) — overlays aplicam e restauram materiais byte a byte (hash de cores/props).
10. Evidência Before/After dos looks no mesmo enquadramento (§64).

### P1-D — Renders de homologação + Visual Regression Set 3D (P0 · esforço M · depende de P1-C)
1. `scripts/avatar/assets3d/gerar-renders-homologacao.mjs`: por tipo (personagem 7 ângulos, cabelo 4, roupa 4, acessório 3) com laboratório §107 (§34).
2. Baseline PNG em `docs/AVATAR-STUDIO-5/evidencias/golden-3d/` para as bases atuais (SwiftShader, tolerância perceptual) (§35).
3. `scripts/avatar/testes/regressao-visual-3d.mjs`: compara com tolerância; `--gravar` segue doutrina #83.
4. Auditoria de LODs idênticos (§96): script `auditar-lods.mjs` (triângulos/hashes/tamanho) → relatório; republicar os que forem iguais via `publicar-asset.mjs` (lod1/lod2 com simplify real).
5. Clipping QA semiautomático (§36): amostragem de pares cabelo×cabeça, roupa×corpo por bounding boxes + raycast em headless → relatório (sem bloquear).
6. Teste em movimento (§37): renders em 3 frames do Idle/Wave dos pacotes UAL.
7. Silhouette/grayscale/backlight test (§141–§146) como variantes do script.
8. Thumbs 3D (§98–§101): revisar resolução (256 px) e framing por categoria em `gerar-thumbs-3d.mjs`; preview hover já existe (512).
9. Documentar em GOLDEN-TESTS.md os casos e limiares.
10. Integrar ao `rodar-todos.mjs` como etapa opcional (`--visual`).

### P1-E — Golden Humans (conteúdo) (P0 · esforço G · depende de P1-B/C/D + **assets externos**)
1. Definir 4 configs Golden (2D e 3D) em `docs/AVATAR-STUDIO-5/golden-humans.json` (§25, §134–§138).
2. Levantar e publicar (CC0 comprovado) corpos/rostos/cabelo premium candidatos via `publicar-asset.mjs` com `qualidadeVisual: premium`, `qaVisual.pending` (§140 cabelo futuro).
3. Material Families v1 (§42–§43): `services/FamiliasMaterial.ts` registry (skin_soft, cotton, denim, leather, metal_brushed, metal_polished, glass, emissive, hair) aplicado por nome/`userData.familia` sob `as6.material_v2` — Parte 5 aprofunda.
4. Pose Hero e pose Retrato nomeadas em `Poses3d`/pacote UAL (§88–§89).
5. Avaliação na matriz §65 (ficha JSON) + Before/After; Hard Fail verificado.
6. Golden M + F aprovados pelo Jhony = gate §183 liberado (registrar decisão).
7–10. Golden Android/Animal (§177) — adiar para onda posterior.

### P1-F — Classic Premium Stylized 2D (P1 · esforço G · depende de ART-BIBLE; Partes 8/9 detalham)
Flag `as6.classico_premium` (OFF). Camada de look 2D (luz/sombra/rim/contorno seletivo) como **filtros/overlays SVG por cima** da arte existente, sem tocar `partes/*`; goldens 2D provam byte-stability com flag off; nova série de goldens com flag on.

## 6. Perguntas bloqueantes vs. decisões tomadas

**Bloqueantes (precisam do Jhony):**
1. **Arte premium externa**: os Golden Humans exigem corpos/rostos/cabelos acima do farm UBC/Quaternius CC0 atual. Aceita-se apenas CC0/CC-BY com comprovante, ou haverá **contratação/compra** de arte (custo)? Sem isso, P1-E fica limitado a re-iluminar/re-materializar o UBC.
2. **Aprovação visual dos Golden M/F** (§183) é humana e do Jhony — gate não automatizável.
3. **Tolerância da regressão visual 3D** pode ser instável entre ambientes (SwiftShader vs produção) — aceitar como "aviso" e não tripwire até estabilizar?
4. Storage de evidências (PNG before/after/golden) no repo privado: tamanho cresce (~MBs por onda). Aceitar em `docs/.../evidencias/` ou mover para `/backup`/storage fora do git?

**Resolvidas sozinho (decisões propostas a registrar #155+):**
- Campos em PT coerentes com o código (`qualidadeVisual`, `statusQaVisual`, `versaoVisual`) no wrapper `MetadadosAssets` e manifest §517 — **nunca** no `AvatarConfig` (zero PHP).
- Flag-pai `as6.avatar_visual_v2` (não reutilizar `as6.visual_v2`, que é UI); filhas `as6.qa_visual` (dev, OFF), `as6.luz_v2`, `as6.material_v2`, `as6.classico_premium`, `as6.foto_v2` (OFF até validação visual).
- Unificar `IluminacaoId` (estudio/dramatica/neon) e `definirLuz` (estudio/quente/fria/neon) em looks `studio|hero|neon|portrait` com mapa de compatibilidade — valores antigos continuam válidos em `Cenas3d`/`validarConfig3d`.
- Hard Fail bloqueia **promoção** (Q3/Q4, destaque), nunca render de legado.
- Overlays QA usam materiais nativos do three (zero dependência nova).
- Ordem de execução: P1-A → P1-B → P1-C → P1-D → P1-E (gate) → P1-F; produção em massa (ondas 1405+) **suspensa** até §183.

## 7. Métricas / Acceptance da Parte 1

- Docs existem e são referenciados: ART-BIBLE.md, VISUAL-QA.md, GOLDEN-TESTS.md, PERFORMANCE-BUDGETS.md, ASSET-PIPELINE.md (DoD §180 itens 3–4, 9–11, 14–15).
- 100% dos itens do catálogo 2D e 100% dos manifests 3D publicados têm `qualidadeVisual` válido; `ITENS_SOCKET` marcados `prototype`; nenhum `prototype` aparece em Vitrine/destaque com a flag ligada (teste automatizado).
- `golden-avatars.mjs` (16 goldens 2D) continua idêntico após P1-B/C/D — prova de byte-stability.
- `validar-asset.mjs` recusa `familia: premium` sem `qaVisual.status = approved`.
- Baseline Before capturada (8 personagens × 4 distâncias) e Golden-3D PNG baseline + `regressao-visual-3d.mjs` rodando headless.
- Auditoria de LODs idênticos publicada; nenhum asset com lod0=lod1=lod2 sem exceção declarada no manifest.
- Laboratório `visual_calibration` + 5 overlays + 4 looks disponíveis sob flag; teste de exposição (pele não estoura/preto não esmaga) verde.
- Inventário KEEP/UPGRADE/REPLACE/DEV_ONLY/DEPRECATE por família publicado; KPIs §157 gerados (`kpi-visual.json`).
- Gate §183: Golden M + Golden F com ficha da matriz §65 preenchida (todas ≥ mínimo, zero Hard Fail) e aprovação registrada do Jhony antes de qualquer onda de população.
