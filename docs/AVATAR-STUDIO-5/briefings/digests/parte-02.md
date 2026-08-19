# Digest — MEGA_BRIEFING_01 · PARTE 2/12 — Corpo, anatomia, proporções, silhueta, diversidade corporal, bases M/F e sistema de morphs (§184–§411)

> Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 4182–7245. Investigação de código em 2026-08-19 sobre o main (b0331d62). Nada foi implementado.

## 1. Resumo executivo

A Parte 2 quer que o corpo deixe de ser "suporte para roupas" e vire base visual premium por si só: anatomia estilizada convincente ("Premium Stylized Human"), bases masculina e feminina que NÃO sejam escala uma da outra, famílias corporais (HUMAN_M/HUMAN_F × standard/slim/athletic/broad|curvy/large), morphs semânticos (body_weight, body_muscle, shoulder_width, hip_width, waist_width…) com envelope homologado, presets curados, separação rígida Shape × Pose × Clothing Fit, body masking por região, QA de deformação (poses técnicas + stress), mãos/pescoço/ombros como critérios formais, LOD com paridade M/F e continuidade (skeleton/morph/material/socket/sombra), persistência versionada e byte-estável, Body API declarativa e fail-closed, e um Golden Body Acceptance Gate (§400) com 18 entregáveis (§408). Regra de ouro: §410 — não escalar roupas sobre corpo instável.

No código HOJE: o 3D real (`services/Renderizador3d.ts` + `Assembler3d.ts`) já tem rig canônico ubc-v1 de 65 bones (`Partes3d.BONES_UBC_V1`, `scripts/avatar/assets3d/rig-ubc-v1.json`), duas bases UBC (`base_superhero_m/f`, LOD0/1/2, CC0), rebind de partes, body masking real por bones (`REGIOES_UBC`/`mascararBase`), sockets (14 no contrato `SOCKETS_3D`), vida procedural (respiração §440), progressivo lod2-primeiro, reaplicação de corpo após troca/LOD (`aplicarCorpo3d`). Porém "morph" corporal é só ESCALA uniforme do objeto raiz (tabela `CORPOS_3D` = mesma tabela §102 do 2D + `fino` largura/altura) — não existe morph target, não existe família corporal, não existe base feminina não-superhero, o personagem 3D padrão ainda é `humano_casual` (Quaternius modular, rig próprio), e não há QA de deformação/screenshots de corpo automatizados. No 2D o corpo inteiro é UM scaffold (`engine/partes/corpo.ts` 240×400) sem gênero/família, com wrapper de escala (`envolverFigura`). A Parte 2 é quase inteiramente 3D e depende de assets novos (bases premium) que o repo não tem e não pode gerar em runtime (§381).

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Linguagem corporal / Proportion Sheet / Art Bible corporal | §185–§186, §206, §342–§346 | Régua "Premium Stylized Human", intervalos cabeça/corpo, folha de proporções M/F com landmarks, style envelope | Não existe. Só `docs/AVATAR-STUDIO-5/classico-aaa.md` (2D) e `pipeline-assets-3d.md` (técnico) | Doc ART-BIBLE (Parte 12) com capítulo corpo + Proportion Sheet |
| Auditoria visual das bases atuais (clay + silhouette pass) | §188–§190, §304–§306 | Render M/F frente/perfil/costas/¾/busto, material neutro, silhueta, FOV neutro de QA | Parcial: `Renderizador3d.capturar()` existe; `Palco3d.tsx` gera 8 ângulos (`definirCamera` azimute i·π/4, linhas 579/932) para contact-sheet; não há material clay nem modo silhueta; câmeras `CAMERAS` em `poc3d/catalogo3d.ts` (corpo/busto/rosto/¾) | Modo clay/silhueta no renderer + script de benchmark screenshots |
| Bases M/F premium (Golden Male/Female) e não-scaling | §187, §191–§193, §320–§325, §400–§406 | Base masculina e feminina neutras, versáteis, mesma linguagem; provar com/sem roupa, full/¾/busto, em movimento | Parcial: `public/assets/avatars/3d/personagens/base_superhero_m` (14.318 tri lod0) e `base_superhero_f` (15.060) — superhero, não "neutras"; default do palco é `humano_casual` (`Personagens3d.personagemParaBase`) | Obter/produzir bases neutras (asset externo CC0 ou comissionado); promover UBC a default |
| Body Families (HUMAN_M/F × variantes) | §194, §229, §287–§288, §291, §317, §407 | Arquitetura não pode presumir "sexo → uma malha"; metadados bodyFamily/morphSupport/clothingCompatibility/heightRange | Não existe campo de família. Manifest §517 (`Personagens3d.ManifestPersonagem3d`) tem `rig`, `familia` (=complexidade economico/padrao/premium, outro sentido), `mascara` | Campo `corpo: { familia, variante, morphSupport, heightRange }` no manifest + `validar-asset.mjs` |
| Morphs semânticos, envelope, presets, layering | §195–§203, §255–§266, §384–§389 | Registry central (body_weight, body_muscle, shoulder_width, hip_width, waist_width), envelope homologado, presets dentro do envelope, clamps, mapping por asset no manifest, GPU morph targets | Parcial: `Renderizador3d.definirCorpo3d()/aplicarCorpo3d()` = escala XZ/Y com clamps (0.88–1.15 / 0.9–1.07); tabela `CORPOS_3D` (esbelto/atletico/robusto/compacto); `EstadoAvatar.body.morfos: Record<string,number>` existe mas só carrega morfos faciais do androide (`adaptadores.deLegado3d`); Assembler passo 4 declara "base sem morph targets". GLBs UBC não trazem shape keys | Registry de morphs, schema `body.v2`, mapping manifest, aplicação por `morphTargetInfluences` quando asset tiver; bone-scaling para comprimento (§262) |
| Shape ≠ Pose ≠ Clothing Fit | §198–§199, §231 | Não simular postura com deformação; roupa deve deformar com corpo, não `scale*=1.2` | Parcial: postura 2D é rotate de wrapper (`POSTURAS_FIG`); 3D postura não existe; escala raiz veste conjunto junto (ok por compartilhar esqueleto) mas É scaling de roupa (exatamente o que §231 critica, embora uniforme) | Morphs reais na base + correspondência nas roupas |
| Altura visual vs normalização | §204–§205 | Não usar scaleY; distribuir por pernas/torso/pescoço/cabeça; separar `alturaAlvo` da altura do usuário | PoC: `Personagem3D.normalizar()` com `alturaAlvo`; Renderizador3d não normaliza; `fino.altura` é scaleY puro (0.9–1.07) | Bone scaling por segmento (thigh/calf/spine/neck) atrás de flag |
| Cabeça/pescoço/ombros/clavícula/cotovelos/joelhos/mãos/pés | §206–§220, §245–§249 | Head scale controlado, pescoço sem "linha de montagem", skinning que preserva volume, mãos legíveis, rig de dedos, foot grounding | Rig tem dedos (4 falanges × 5 × 2 em `BONES_UBC_V1`); mãos do UBC são reais; sem head scale; sem grounding (chão em y=0.01, personagem sem offset por bbox) | Auditoria + grounding por bbox/foot bone + head scale com envelope |
| Objetos na mão / Grip Profiles | §217–§218 | Sockets hand_l/r homologados com props; perfil de pegada | `SOCKETS_3D` inclui hand_l/hand_r; `Acessorios3D.tsx` ancora `soc_cetro` em hand_r (PoC); `Renderizador3d` props só em cabeca/rosto/pet | Mapear sockets de mão no renderer real + pose de mão por grip (clipe/pose de dedos) |
| Postura / contrapposto / respiração / idle / Posture Profiles | §222–§228, §289 | Pose neutra com peso, assimetria sutil, respiração sutil, perfis neutral/confident/relaxed/heroic/elegant/energetic | Parcial: `Renderizador3d.definirVida()` (respiração Spine + peito/ombros UBC, linhas ~1318–1333); clipes UAL (Idle_Neutral, Idle_Loop); 2D `postura` (5 enums). Nenhum perfil de postura 3D | Posture profiles 3D = escolha de idle + offsets aditivos de bones, espelhando enum 2D |
| Body masking / Region Masks / Clothing Compatibility Tier | §229–§236 | Regiões torso_upper… foot_r; `bodyCompatibility: universal/family_specific/body_specific`; espessura/offset de roupa | Existe: `Assembler3d.REGIOES_UBC` (torso/bracos/maos/pernas/pes/cabeca — 6 regiões, mais grossas que as 12 do §233) + `mascararBase` + `manifest.mascara`; regra `hide_body_region` em `nucleo/contratos.ts`. Sem tier de compatibilidade | Refinar regiões (upper/lower, l/r) sem quebrar manifests atuais; campo `bodyCompatibility` no manifest de partes |
| Deformation Test Suite / Stress Poses / Weight painting / corretivos | §238–§244, §303, §326–§328 | Poses A–H, stress poses, score corporal, hard/soft fail, corrective morphs | Não existe. Há clipes UAL publicados (`public/assets/avatars/3d/animacoes`) e `poseNoTempo(clipe, tempo)` p/ congelar frame; `Poses3d.ts` salva clipe+tempo em localStorage | Script `scripts/avatar/testes/corpo-deformacao.mjs` (poses canônicas = clipe+tempo) + screenshots + score |
| Sockets shoulders/back/waist/wrist + perfis | §248–§254 | Back profiles (small/medium/large/winged), ocupação do slot costas formalizada, wristScaleProfile | Contrato `SOCKETS_3D` + regras `exclusive_slot/conflicts_with` em contratos.ts; `workspace/acessorios.ts` (2D). Nada de ocupação volumétrica | Metadado `ocupacao` por item de costas + regra declarativa |
| Persistência / schema versionado / migração / byte-stability | §267–§270, §373 | `body.version`, defaults compatíveis, mesmo config → mesmo shape | Existe a filosofia: `AvatarCatalog.validarConfig` omite neutro (corpo/corpoFino/postura); `studio.php` espelha (linhas 178–206); `EstadoAvatar.body` com `tipo/postura/fino` opcionais; `SCHEMA_VERSION_ATUAL=1`; `nucleo/migracoes.ts` | Extender com `body.morfos` semânticos + `familia` omitidos quando neutros; PHP espelhado |
| LOD corporal, paridade M/F, continuidade | §271–§276, §333–§334, §358–§366 | LOD não muda proporção; paridade; protected regions na decimação; crossfade; morph/socket/sombra contínuos | Existe: LOD por tier (`lodPorQualidade`), gate §631 (`validar-asset.mjs` 60k/25k/8k), `publicar-asset.mjs` simplify meshopt, progressivo lod2-primeiro (`progressivoAtivo`), `aplicarCorpo3d`/`aplicarTinta`/`aplicarProps` reaplicados após troca. lod1 dos UBC = lod0 (14.318 = 14.318 — simplify não reduziu) | Protected regions no simplify; teste de silhueta LOD0 vs LOD2; paridade M/F documentada |
| Normals/tangents/UV/texel/skin continuity | §277–§286 | Normals suaves, seams discretas, pele não-plástica (wrap/roughness), sem "máscara" rosto/corpo | Parcial: `Materiais3d.ts` canal `pele` por nome de material; `aplicarPipelineCores`; teto emissivo. Sem tuning de pele | Perfil de material de pele (Parte 5/materiais) |
| Body API / Body State / validação fail-closed | §367–§372, §374–§378 | `setBodyPreset/setBodyMorph/setBodyFamily/resetBody`; store central; clamp; preset/família inexistente → fallback; não recalcular por render | Parcial: `definirCorpo3d` (renderer) + `EstadoAvatar.body` (store central `nucleo/estado.ts`, undo/redo grátis); `validarConfig3d` fail-closed (poc) | Serviço `services/Corpo3d.ts` (registry+clamp+presets) chamado pelo Palco3d; testes unitários |
| UI de corpo (cards, silhouette thumbs, hover, reset parcial, randomize, lock) | §308–§316, §390–§399 | Preview full-body ao abrir Corpo, sliders suaves, cards visuais, reset só do corpo, random ponderado | Parcial: `workspace/PainelCatalogo.tsx` chips Médio/Esbelto/Atlético/Robusto/Compacto + sliders fino (linhas 264–333); `as6.corpo_preview` liga preview 240×400 no 2D | Cards com silhueta (2D/3D), transição de morph, body lock no Photo Studio |
| Default character/pose/lighting/camera | §353–§357 | Avatar padrão premium primeiro | Default 3D = `humano_casual`; UBC só via override | Trocar default p/ golden base (flag) |
| Quality metadata (prototype/legacy/production/premium/hero) e Q2 mínimo | §319, §350–§352 | Classificar bases; nenhuma base ≤Q0 visível | Não existe no manifest; `MetadadosAssets.ts` tem tags 2D | Campo `visualQuality` no manifest + filtro de destaque |
| Performance dos morphs | §376–§381, §405 | Sem recalcular por frame; GPU morph targets; nada de remodelar no browser | `definirCorpo3d` curto-circuita por JSON igual; escala é barata | Manter ao migrar p/ morph targets |

## 3. O que JÁ está coberto e prerequisitos de outras partes

Já coberto (referenciar, não refazer): rig canônico 65 bones e validador (§216/§292/§383 → `rig-ubc-v1.json`, `validar-asset.mjs`, `Assembler3d` passo 2); rebind de partes no esqueleto da base (§231 "shared skeleton/skinning"); body masking por bones (§232 — estender `REGIOES_UBC`, não criar sistema paralelo, como o próprio §232 manda); gate de triângulos/texturas e publicação LOD0/1/2 (§272/§274); progressivo lod2-primeiro e reaplicação de corpo/tinta/props após LOD (§359/§363–§365); vida procedural (§224); persistência byte-estável de `corpo/corpoFino/postura` 2D+PHP (§267–§270 filosofia); store central com undo/redo (§311/§368); sockets no contrato (§217/§248/§252/§253); capture multi-ângulo no Palco3d (§329 parcial).

Prerequisitos que a Parte 2 fornece a outras: Golden Body (M/F) é pré-requisito explícito da ordem §3107 (GOLDEN BODY antes de FACE/HAIR/OUTFITS/ACCESSORIES) — Partes 3 (rosto: integração cabeça/pescoço §208/§245/§283), 4 (cabelo: colliders §301), 5 (roupas: tiers §230, espessura §235, Body Masking), 6 (acessórios: perfis de costas/pulso §250–§254), 7/8 (animação: grip §218, posture profiles §226, IK §221), 9 (LOD/perf: continuidade §360–§366), 12 (Art Bible/QA/Golden tests). Depende de: Parte 1 (escala Q0–Q4 §319; Art Bible), Parte 12 (flags as6.*, tiers, docs GOLDEN-TESTS/VISUAL-QA).

## 4. Conflitos/risco com regras invioláveis e contorno

- Byte-stability: qualquer morph/família nova tem que ser OMITIDA quando neutra (mesma regra de `corpoFino`); `body.morfos` semânticos só persistem ≠0; novo default de personagem 3D (golden base) NÃO pode mudar avatares salvos que hoje resolvem `humano_casual` → manter `MAPA_BASE_3D` e só trocar default atrás de flag com migração explícita (estado vNext). Goldens 2D g06/g09/g16 (corpo/postura/fino, corpo inteiro) continuam âncoras; adicionar goldens 3D (hash de captura ou métricas de bbox/silhueta, não pixels brutos).
- Arte em `engine/partes/*`: o 2D tem UM `corpoInteiro`; famílias corporais 2D só por wrappers novos (`corpoInteiroV2` em arquivo novo, selecionado por flag) — nunca editar `corpo.ts`. Proposta: Parte 2 no 2D fica restrita a thumbs/cards de silhueta e reuso do wrapper; a anatomia premium é 3D.
- Flags: `as5.morfos3d` já existe (escala); morphs reais entram como `as6.corpo_morphs` (ou `as6.avatar_body_v2` conforme §2917 adaptado), `as6.corpo_familias`, `as6.corpo_default_golden`, `as6.corpo_grounding`, `as6.corpo_qa` — todas desligáveis, off = escala atual byte a byte.
- PHP espelhado: `body.morfos` hoje é aceito no PHP só como morfos faciais do poc (studio.php ~458); novo schema `body.v2` (familia, preset, morfos semânticos com clamps) precisa de espelho com os MESMOS envelopes. Envelope numérico deve viver em JSON compartilhado (ex. `docs/AVATAR-STUDIO-6/envelope-corpo.json` gerado → TS e lido pelo teste PHP) para não divergir.
- Licenças/assets: bases neutras M/F premium com morph targets NÃO existem no repo; UBC Standard (CC0) tem só Superhero M/F publicados; criar malha nova no browser é proibido (§381). Caminho: (a) procurar no storage UBC outras FullBody CC0; (b) gerar morphs offline via pipeline (Blender headless/gltf-transform) a partir da base UBC — só se ferramenta e licença permitirem; (c) comissionar arte. Qualquer asset novo passa por `publicar-asset.mjs` + `LICENCAS.md`.
- Bundle/peso: morph targets multiplicam o GLB (cada target ≈ posições+normais); precisa entrar no gate §631 (motor3d ≤1180KB não é afetado; assets sim) — limitar a ≤5 targets na base lod0, sem targets em lod2 ou com targets esparsos; medir.
- Não duplicar lógica 2D/3D (§3096): tabela `CORPOS_3D` já está DUPLICADA de `TIPOS_CORPO` (render.ts) — consolidar em fonte única semântica (registry de presets corporais) ao introduzir o registry de morphs.
- Sem libs pesadas novas: IK (§221) e physics (§297) só com solução própria leve ou adiadas; three já traz `CCDIKSolver` no examples (sem lib extra) se for necessário.

## 5. Proposta de ONDAS

Prioridade segundo Parte 12: P0 = baseline/QA/contratos; P1 = golden body premium; P2 = escala. Esforço P/M/G.

### P2-A — Baseline e auditoria corporal (P0, esforço M, sem deps externas)
1. §188–§190/§306: modo "clay" e "silhueta" no `Renderizador3d` (material neutro uniforme / MeshBasic preto sobre fundo branco), flag `as6.corpo_qa`; teste de que off = render idêntico.
2. §329/§343: script `scripts/avatar/testes/corpo-benchmark.mjs` — captura M/F (superhero_m/f) × {front, side, 34, back, busto} × {clay, silhueta, vestido} → `saida/corpo/*.png` + JSON de bbox/landmarks (altura do Head, largura ombros via bones clavicle_l/r, pelvis, hand size) = "Proportion Sheet" mensurável.
3. §188 entregável 1: `docs/AVATAR-STUDIO-6/auditoria-corpo.md` com achados por região (cabeça/pescoço/ombros/mãos/pés/joelhos) — escrito a partir das capturas (validação visual final do Jhony).
4. §304–§306: FOV neutro de QA fixado no script (mesma câmera p/ todos os corpos); registrar em baselines.md.
5. §319/§350: campo `visualQuality` (prototype|legacy|production|premium|hero) no manifest §517 (opcional; ausente = legacy) + `validar-asset.mjs` aceita; índice expõe; nada muda no render.
6. §317–§318: campo `corpo` no manifest de base (`familia`, `variante`, `morphSupport[]`, `alturaM`) — só leitura; `Personagens3d.ManifestPersonagem3d` tipado.
7. §333–§334: teste de silhueta LOD0 vs LOD2 (IoU da máscara de silhueta ≥ 0,97) nas duas bases UBC; registra que lod1==lod0 hoje.
8. §220: `as6.corpo_grounding` — após carregar, offset Y = −bbox.min.y (ou foot bone) para pés tocarem y=0; off = posição atual.
9. Docs: seção "Corpo" em ART-BIBLE.md (Parte 12) com linguagem §186 e extremos proibidos; lista de dívida visual (§408 item 18).
10. Testes unitários do manifest novo + goldens 2D inalterados (suíte verde).

### P2-B — Body State/API, registry de morphs e persistência v2 (P0→P1, esforço M, dep: P2-A item 6)
1. §386–§389: `services/Corpo3d.ts` — registry `MORPHS_CORPO` (body_weight, body_muscle, shoulder_width, hip_width, waist_width, leg_length, arm_length), envelope por morph (§265, valores iniciais conservadores, refinados por QA), presets (§202: neutro/slim/athletic/broad/soft) dentro do envelope (§266), `clamp()`, `presetParaMorfos()`. Fonte única substituindo `CORPOS_3D` + `TIPOS_CORPO` duplicados (mapa de compatibilidade: esbelto→slim etc.).
2. §367–§368: API declarativa no estado central (`nucleo/estado.ts` ações `corpo/definirPreset`, `corpo/definirMorfo`, `corpo/definirFamilia`, `corpo/resetar`) — preset = uma entrada de histórico (§312); reset parcial (§396).
3. §268–§270: schema `body.v2` em `EstadoAvatar.body` (`familia?`, `preset?`, `morfos` semânticos) — campos omitidos quando neutros; `nucleo/migracoes.ts` mapeia `tipo`→`preset` (sem alterar render: o renderer converte preset→escala antiga quando o asset não tem morph targets).
4. §369–§372: validação fail-closed (`validarConfig`/EstadoService) + PHP espelhado em `api/avatar/studio.php` com mesmos clamps (envelope em JSON compartilhado).
5. §374: testes unitários — defaults, clamps, presets, serialização (neutro omitido), migração, preset inexistente → neutro, família inexistente → padrão.
6. §379/§388: `Renderizador3d.aplicarCorpo3d()` v2 — se a base tem `morphTargetDictionary` com nomes mapeados no manifest (`morphs: {body_weight: 'ShapeKey…'}`), aplica influências; senão fallback escala atual (flag `as6.corpo_morphs`; off = comportamento atual).
7. §262/§204: bone scaling por segmento para `leg_length/arm_length/altura` (thigh/calf, upperarm/lowerarm, spine) com clamps, flag `as6.corpo_bone_scale`; sockets de mão/punho seguem os bones (§261).
8. §376–§378: curto-circuito por igualdade (já existe) + aplicação no próximo frame (sem reload de GLB); teste de que mover slider não recarrega.
9. §390–§393: cards com thumb de silhueta (captura clay 2D/3D) no painel Corpo; hover preview temporário; §309 interpolação curta (lerp de influências).
10. §399: body lock no Photo Studio (ignorar mudanças de corpo enquanto troca look) — flag.

### P2-C — QA de deformação, clipping, compatibilidade corpo×roupa (P0, esforço M, dep: P2-A)
1. §238: `scripts/avatar/testes/corpo-deformacao.mjs` — poses A–H como (clipe UAL, tempo) via `poseNoTempo`; captura M/F × poses × {nu, vestido peasant/ranger}.
2. §239: stress poses (braço elevado, cruzando torso, joelho flexionado, cabeça inclinada, mão no rosto) a partir dos clipes disponíveis; documentar os que não existem.
3. §326–§328: score corporal automático mínimo (bbox estável, faces ocultas por máscara, pendências do assembler = 0, sem NaN em bones, silhueta LOD) + lista de hard fails; relatório em `saida/corpo/relatorio.json`.
4. §230: campo `bodyCompatibility` (universal|family_specific|body_specific) no manifest de partes; assembler reporta pendência quando roupa não é compatível com a família da base.
5. §233: refinar `REGIOES_UBC` para sub-regiões (torso_upper/lower, arm_upper/lower l/r, leg_upper/lower l/r) mantendo aliases antigos (torso = união) — manifests atuais continuam válidos.
6. §246: neck rotation test (yaw/pitch/roll no bone neck_01/Head) com cabelo longo e capuz, capturas.
7. §325: combinação extrema válida (base_superhero_m + ranger corpo + capuz + pose wave) como teste fixo.
8. §263–§264: teste de layering (slim+tall+broad) dentro do envelope; modo Dev alerta fora do envelope (`Telemetria`).
9. §360–§366: teste de continuidade na troca de LOD (pose/morph/tinta/props/sombra preservados) — estender `progressivo3d.mjs`.
10. Doc VISUAL-QA.md (Parte 12) seção corpo.

### P2-D — Golden Male / Golden Female premium (P1, esforço G, dep: assets externos — ver §6)
1. §320–§321: selecionar/produzir bases neutras M e F (CC0 ou comissionadas), com morph targets semânticos; publicar via `publicar-asset.mjs` (LOD0/1/2 dentro do gate), `LICENCAS.md`, manifest com `corpo.familia=human_m|human_f`, `visualQuality=premium`.
2. §322: ≥1 variante por família (male broad, female athletic) — preferencialmente morph, não malha nova.
3. §275–§276: protected regions na simplificação (face/mãos/ombros) em `publicar-asset.mjs` (gltf-transform simplify por primitive com ratio diferenciado) — só se a malha tiver primitives separadas; senão documentar.
4. §277–§283: checklist de normals/UV/seams no `validar-asset.mjs` (avisos, não erros).
5. §208/§245: auditoria de pescoço/integração cabeça (com Parte 3).
6. §353–§357: default 3D = golden base + idle neutro + câmera corpo + luz estúdio, flag `as6.corpo_default_golden`; `MAPA_BASE_3D` preservado para saves.
7. §323–§324: goldens 3D nu/vestido (hash de métricas + capturas de referência).
8. §273: paridade de LOD M/F medida (tri por LOD, silhueta).
9. §400: gate de aceitação documentado em GOLDEN-TESTS.md.
10. Atualizar mapa de lacunas/status.

### P2-E — Postura, mãos, sockets corporais e perfis (P1, esforço M, dep: P2-B)
1. §226: posture profiles 3D (neutral/confident/relaxed/heroic/elegant/energetic) = idle UAL + offsets aditivos no `Renderizador3d` (como a vida §440), espelhando enum `postura` 2D; flag `as6.corpo_postura3d`.
2. §222–§223: contrapposto sutil no neutro (offset pelvis/spine) dentro do perfil.
3. §217–§218: sockets hand_l/hand_r/wrist/waist/shoulders no renderer real (hoje só cabeca/rosto/pet) + `grip` no item (none/cylindrical/pinch/flat) → pose de dedos por clipe/quaternions fixos.
4. §250–§251: `ocupacao` de costas (small/medium/large/winged) + regra declarativa em `contratos.ts` (novo `rule: 'back_occupancy'`).
5. §254: `wristScaleProfile` por família no registry (sem valores mágicos).
6. §207: head scale com envelope (bone Head) testado com cabelo/chapéu/óculos.
7. §215: hand LOD — prioridade de detalhe (não simplificar região de mãos no lod1).
8. §314–§316: randomize corporal ponderado dentro do envelope + compatibilidade de roupa.
9. §395/§398: antes/depois e copiar body settings (dev/QA).
10. Testes.

### P2-F — Corretivos, IK e física (P2, esforço G, adiado até golden aprovado)
Corrective morphs (§243–§244), twist bones (§295), IK de pés/mãos (§221), secondary bones/physics (§296–§300) — só com ganho visual claro e assets que os suportem. Não bloqueiam o gate §400.

## 6. Perguntas bloqueantes × decisões tomadas

Bloqueantes (precisam do Jhony):
1. Assets: existem outras FullBody CC0 em `storage/assets-3d-fonte/ubc-standard-v1/` (fora do git) além de Superhero_Male/Female? Há orçamento/intenção de comissionar bases M/F neutras com morph targets, ou aceitamos UBC superhero como golden v1 "production" (Q2) e adiamos "premium" (Q3)?
2. Ferramenta offline para gerar morph targets (Blender headless no servidor/no pipeline?) — instalar Blender é mudança de infra fora do git.
3. Direção de arte: o Jhony aprova a linguagem "Premium Stylized Human" do §186 como régua oficial e quais extremos (cabeça/ombros) — a Proportion Sheet precisa de validação visual dele.
4. Trocar o personagem 3D default de `humano_casual` para golden base muda a primeira impressão de todos os usuários (§353) — decisão de produto mesmo atrás de flag.

Decisões tomadas sozinho (registrar como #155+ quando executar):
- Parte 2 no 2D limita-se a cards/thumbs/silhueta e reuso do wrapper existente; anatomia premium é assunto 3D (o 2D Clássico tem seu caminho na Parte 11/"Classic Premium").
- Morphs sem asset: arquitetura (registry/schema/API/PHP) entra antes dos assets, com fallback para a escala atual — flag off = byte a byte.
- `CORPOS_3D`/`TIPOS_CORPO` viram fonte única no registry, preservando os números atuais (byte-stability dos goldens g06/g09).
- Regiões §233 entram como refinamento com aliases, não substituição.
- Goldens 3D serão métricas + capturas de referência (não comparação pixel a pixel obrigatória), dado o não-determinismo de GPU headless.
- IK/física/corretivos ficam em P2-F, fora do gate §400.

## 7. Métricas / Acceptance da Parte 2

- `corpo-benchmark.mjs` gera capturas M/F × 5 ângulos × 3 modos (clay/silhueta/vestido) e JSON de proporções; rodando na suíte (`rodar-todos.mjs`) verde.
- `corpo-deformacao.mjs`: poses A–H + stress em M/F, nu e vestido, sem hard fail (§327) — 0 pendências do assembler, IoU silhueta LOD0/LOD2 ≥ 0,97, pés no chão (|min.y| < 1 cm).
- Registry de morphs com envelope; 100% dos presets dentro do envelope (teste); clamps espelhados TS/PHP (teste compara o JSON de envelope dos dois lados).
- Persistência: estado sem corpo neutro serializa idêntico ao de hoje (goldens 2D 16/16 + estado vNext); migração `tipo→preset` reversível; PHP aceita/rejeita os mesmos valores.
- Flags `as6.corpo_*` desligadas ⇒ render e JSON byte a byte iguais ao main atual.
- Golden gate §400: uma base M e uma F com `visualQuality ≥ production`, ≥1 variante por família, roupa (peasant/ranger) e animação (UAL) funcionando, LOD0/1/2 com paridade, capturas comparativas arquivadas, QA de clipping/deformação verde, docs (auditoria, Proportion Sheet, ART-BIBLE corpo, VISUAL-QA corpo, GOLDEN-TESTS corpo, dívida visual) publicados.
- Performance: mover slider de morph não recarrega GLB, custo por frame sem regressão no `PerfBaseline` (ORCAMENTO_MS), motor3d ≤ gate 1180KB.
