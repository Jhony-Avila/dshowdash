# Inventário visual — classificação KEEP / UPGRADE / REPLACE / DEV_ONLY / DEPRECATE por família (v1 · onda 1405 · MEGA_BRIEFING_01 §15, §61–§63, §159–§167, §1224, §2284.1)

> Números gerados por `node scripts/avatar/inventario-visual.mjs` → `docs/AVATAR-STUDIO-5/evidencias/inventario-visual.json` (determinístico; regerar a cada onda e revisar o diff). Classificação = curadoria (digests das Partes 1–10). Estado de partida `main b0331d62`.
> Semântica (§159–§167): **KEEP** = fica como está (Q1 Legacy ou Q2 Production), continua renderizando para sempre · **UPGRADE** = ganha **sucessor premium com ID novo** (`SUCESSOR_PREMIUM`), o original vira legado fora do destaque (nunca editado) · **REPLACE** = placeholder/prova técnica que será substituído por asset real (o ID/slot sobrevive) · **DEV_ONLY** = `qualidadeVisual: prototype`, visível só em modo Dev · **DEPRECATE** = oculto do catálogo, carregável para saves (nunca apagado). Nenhuma classificação muda bytes de avatar salvo.

## 1. Catálogo 2D — 393 itens, 13 categorias, 24 presets, 12 coleções

| Família (categoria) | Qtd | Estado visual hoje | Classificação | Sucessor previsto (onda) | Nota |
|---|---|---|---|---|---|
| Bases humanas (`bas_*`, 21) + espécies (15) | 36 | path único + gradiente radial de pele + 1 sombra; orelhas elipse; **sem nariz**; skin variants (`bas_sardas`, `bas_gotico`) classificadas como base | humanas: **UPGRADE** (Q1→ sucessoras `bas_px_*` 8 famílias) · espécies/androide: **KEEP** (Q2, identidade Dshow) | 1412 | raridade de bases humanas não muda (progressão depende); novas nascem `comum` |
| Olhos (`olh_*`) | 40 | `olhoHumano()`: sclera `#fdfdfa`, íris fixa `#4a3626`, 1 catchlight, sobrancelha cozida | **UPGRADE** (→ `olh_px_*` 8–10 shapes sem sobrancelha, íris por `coresFace.iris`) | 1412 | 41 legados seguem (alguns temáticos cyber/heterocromia = KEEP Q2) |
| Bocas (`boc_*`) | 40 | traço 1–2 paths; mistura boca × barba × props (`boc_barba/cavanhaque/bigode`, máscara, palito) | bocas: **UPGRADE** (→ `boc_px_*`) · barbas em boca: **KEEP** como legado (`FaceFamilies` marca "prop"; barba vira categoria `brb_*`) | 1412 / 1414 | |
| Cabelos (`cab_*`) | 50 | camada única + `BRILHO` arco branco; `cab_longo` desenha mechas traseiras por cima da roupa; `cab_grisalho` cor fixa | **UPGRADE** (→ `cab_px_*` H01–H06 com `renderAtras`, 6 camadas); VFX (`cab_flamejante/fibra_otica/holo_gradiente`): **KEEP** Q2 | 1413 | |
| Roupas (`rou_*`) | 30 | busto `PATH_OMBROS` + gradiente + detalhes; corpo inteiro = scaffold único (roupa só muda a cor) | **UPGRADE** (→ `rou_px_*` com `renderCorpoV2` + material tokens + variantes para as 30) | 1415 | `rou_flanela`/`rou_jersey` (padrões hardcoded) KEEP Q2 |
| Sobrepeças (`sob_*`) | 4 | wrappers aditivos | **KEEP** Q2 (+ jaqueta/blazer premium como `roupa_sobre` novo) | 1415 | |
| Acessórios (`ace_*`) | 75 | flat + gradiente + highlight; 22 slots finos/corporais; Modo Item medido (75/75); layering traseiro inexistente | **KEEP** Q2 para as ondas 1401–1404 (já no padrão de thumb/variantes) · **UPGRADE** seletivo: óculos (8), joias (7), costas (6), companheiros (11) → `ace_px_*` | 1416 | 7 artes-prova corporais (1404): KEEP como Q2 até população premium (P2) |
| Fundos (`fun_*`) | 20 | fragmento único 240×240 tingido por destaque; `fun_estudio` tem chão | **UPGRADE** (→ `fun_px_*` BG01–BG06 com `renderPlanos`) | 1417 | |
| Molduras (`mol_*`) | 24 | 1 filtro; algumas cobrem demais | **KEEP** Q2 (+4 premium metal/glass/neon) | 1417 | teste de área coberta |
| Efeitos (`efe_*`) | 24 | SMIL + partículas determinísticas; 13 `atras` | **KEEP** Q2 (famílias no `RegistroEfeitos`) | 1417/1425 | |
| Auras (`aur_*`) | 15 | SMIL, sempre atrás, cor só `destaque` | **KEEP** Q2 + **UPGRADE** seletivo (→ `aur_px_*` energia/fogo/gelo/digital com rear/main/front) | 1417 | |
| Banners (`ban_*`) / Emblemas (`emb_*`) | 15 / 20 | apresentação/foto | **KEEP** Q2 | — | fora do escopo visual desta frente |
| Presets (24) / Coleções (12) / Arquétipos | — | composições | **KEEP**; novos C01–C06/O01–O06/P01–P06 | 1412–1426 | `CONFIG_PADRAO` congelado (#159) |

Observações 2D: nenhum item é DEV_ONLY/DEPRECATE hoje; `sob_` já é prefixo de sobrepeça → sobrancelha usa `sbr_*` (correção ao #166).

## 2. Assets 3D publicados — 8 personagens, 26 partes

| Família | Itens | Estado | Classificação | Nota |
|---|---|---|---|---|
| Bases UBC (CC0, rig ubc-v1) | `base_superhero_m` (14 318 tri lod0; lod1 = lod0), `base_superhero_f` (lod1 = lod0) | únicas bases full-body reais; "superhero", não neutras; **0 morph targets**; materiais `MI_Superhero_*` não tingem como pele (#165a) | **KEEP** Q2 (production) → candidatas a Golden v1 "production" até haver bases neutras ⛔ | republicar com LOD real + `materiais` no manifest (1408/1409 ★) |
| Quaternius legados (`humano_casual/aventureiro/punk/terno`, `androide`, `animal_pug`) | 6 | modulares, rig próprio; `humano_casual/punk`, `androide`, `animal_pug` com **LODs idênticos**; `humano_casual` é o default 3D | **KEEP** Q1/Q2 (saves dependem; `MAPA_BASE_3D`); `animal_pug` candidato a Pet Hero A09 (1424 ★); default 3D → golden base atrás de flag (1426 ★) | |
| Cabelos UBC (`cab_barba, cab_coque, cab_longo, cab_raspado, cab_raspado_f, cab_repartido`) | 6 | hair cards opacos; `familia: economico`; **LODs idênticos** (ex. `cab_longo` 2906×3); material genérico | **KEEP** Q2 + família de material (1421) + LOD real (1409 ★); premium ⛔ assets | `cab_barba` naming mantido |
| Roupas Quaternius (`rou3d_peasant_*` 8, `rou3d_ranger_*` 12) | 20 | fantasy; `familia: economico`; 17 com **LODs idênticos**; **nenhuma declara `mascara`** | **KEEP** Q2 + `mascara` (1424) + LOD real ★ + famílias de material (1421); premium Executive/Urban ⛔ | |
| Placeholders procedurais (`poc3d/catalogo3d.ts ITENS_SOCKET`, 9: óculos torus, coroa torus+cones, colar, jetpack, asas boxes, cetro, drone, pet bit…) | 9 | geometria pura; só na PoC `Estudio3D` | **DEV_ONLY** (`prototype`) → **REPLACE** por Hero procedural refinado/GLB (1423–1424) preservando socket/ID | nunca em destaque (§1419–§1421) |
| Props do palco do shell (`Renderizador3d.construirProp`: cabeça/rosto/pet aproximados) | 3 | geometria aproximada | **REPLACE** (âncoras em dados + Hero) | 1423 |
| Cenários procedurais (`vazio/grade/estrelas/dojo` PoC; `neutro/estudio/grade` shell) | 7 | cor sólida/grid/estrelas | **KEEP** `estudio/neutro` como Studio v1 (QA); demais **UPGRADE** (S01–S06, 1426) | |
| Animações UAL (básico + extra) | pacotes | clipes reais | **KEEP** | |

Achados quantitativos (de `inventario-visual.json`): **27/34** assets 3D com lod0=lod1=lod2 (auditoria #165b — gate §631 nunca forçou decimação real); 7 com lod1=lod0; **34/34 sem `qualidadeVisual`** (entra na 1406 com padrão `production` para publicados e `prototype` para `soc_*`).

## 3. Resumo da dívida visual por área (alimenta `VISUAL-QA.md` §9 e o KPI de burn-down)

| Área | UPGRADE | REPLACE/DEV_ONLY | KEEP | Gate para virar "premium coverage" |
|---|---|---|---|---|
| Rosto 2D (bases/olhos/bocas) | 21+40+37 | — | 15+3+3 | Golden Classic M/F + Golden Faces (§2560/§701) |
| Cabelo 2D | 47 | — | 3 | Golden Hair H01–H06 (§897) |
| Roupas 2D | 30 | — | 4 | Golden Outfits O01–O06 (§1220) |
| Acessórios 2D | ~32 seletivos | — | ~43 | ≥1 Q3/Q4 por região (§1495) |
| Fundos/auras/molduras 2D | 20+4+0 | — | 11+24+24+15+20 | BG01–BG06 / auras v2 (§2286) |
| 3D (todas as famílias) | 0 (⛔ assets) | 9 + 3 | 34 | Golden Body/Face/Hair/Outfit 3D ⛔ |

Premium Coverage % inicial = **0 %** (nenhum item `premium`/`hero`); Production-ready (Q2) ≈ 100 % do publicado (gate técnico), Visual QA aprovado = 0 % (fluxo nasce na 1410).
