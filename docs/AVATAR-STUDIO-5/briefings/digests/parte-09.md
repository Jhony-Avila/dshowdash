# Digest — MEGA_BRIEFING_01 · PARTE 9/12 (§2034–§2287)
## VFX, auras, poderes, partículas, clima, hora do dia, cenários, backgrounds, profundidade, raridade e apresentação Hero

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 22501–24755. Código auditado em `public/components/panels/panel-avatar-studio/src/` (caminhos abaixo relativos a essa raiz, salvo indicação).

---

## 1. Resumo executivo

A Parte 9 manda transformar auras/efeitos/cenários de "overlays soltos" em uma **camada de direção artística integrada**, sem jamais tirar o protagonismo do rosto/silhueta (§2035). Pede: (a) **Aura Families** com linguagem própria de forma+movimento (fogo ≠ energia vermelha, §2047), profundidade back/body/front (§2048–§2053), normalização por bounds (§2054), intensidade/cor/multi-cor (§2055–§2058); (b) **Power System** separado de aura, com categorias hand/body/ground/orbit/weapon/environment e fases idle→activation→peak→deactivation sem reset visível (§2060–§2075); (c) **Particle Registry** com famílias/presets/pooling/tiers/culling/blend (§2076–§2106); (d) **Climate** (clear/rain/snow/fog/storm/wind/embers) integrado a luz/piso/atmosfera + vento global (§2107–§2120); (e) **Time of Day** como sistema de luz/fundo/exposure, não cor de fundo (§2121–§2132); (f) **Scenario Families** em camadas fg/mid/bg/sky, contrato de câmera, LOD, loading assíncrono e 6 Golden Scenarios 3D (§2133–§2185); (g) **2D layered backgrounds** com chão, contact shadow obrigatória e 6 Hero Backgrounds (§2162–§2172); (h) **Rarity Presentation** Common→Legendary sem "pilha automática" (§2186–§2200); (i) **Presentation Director** central (`AvatarPresentationState`, prioridades critical/primary/secondary/ambient, budget por tier, §2201–§2209); (j) integração Photo Studio (alpha, "incluir efeitos", portrait-safe, §2210–§2223); (k) UI/thumbnails animados lazy, undo/redo, presets e 6 Golden Presentation Presets (§2224–§2246); (l) QA + Hard Fails + scores + registries sem hardcode + Art Bible (§2247–§2283). Gate final §2286: 4 aura families + 3 power types + 4 climas + golden scenarios + rarity + tiers aprovados antes de escalar. O código HOJE tem uma base sólida mas **cosmética**: 15 auras/24 efeitos/20 fundos SVG SMIL tingidos só por `destaque`, biblioteca `engine/particulas.ts` determinística com 4 tiers, `PoderesFamilia.ts` (4 famílias por tema), hora/luz/clima do palco 2D via CSS `data-*`, 3D com `Poder3D` (THREE.Points), `Clima3D`, `definirAura3d` (torus), `definirParticulas3d`, bloom leve. Não existem: registries tipados (efeito/cenário/clima/hora), Presentation Director, fases de poder no 2D, profundidade de aura no 3D, cenários 3D com camadas, contact shadow 2D, equip reveal por raridade, nem budgets de VFX por tier.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Hierarquia visual / avatar protagonista | 2034–2035, 2259 | VFX nunca cobre rosto; hierarquia rosto>silhueta>roupa>acessório>aura>partícula>cenário | **Parcial** — `engine/render.ts` ORDEM_CAMADAS + planos `plano-fundo/plano-personagem/plano-frente`; efeitos têm `atras?: boolean` (`engine/base-api.ts:15`, 13 efeitos atrás) | Nenhuma verificação de "cobre rosto" (bounds vs. zona facial G.cabecaCy/Rx/Ry); sem Hard Fail automatizado |
| Aura Families (forma+movimento) | 2036–2047, 2056–2058 | 12 famílias (energy/fire/ice/electric/arcane/void/cosmic/solar/digital/royal/nature/shadow) com shape/color/motion/particle/depth/emissive/bloom/rarity scaling | **Parcial** — 15 auras em `engine/partes/auras.ts` (aur_neon, aur_plasma, aur_eletrica, aur_cristal, aur_dshow, aur_orbital, aur_gelo, aur_fenix, aur_solar, aur_sombria, aur_runica, aur_prisma, aur_vento, aur_estelar, aur_toxica) já com formas distintas; classificação 4 famílias em `services/PoderesFamilia.ts:familiaDoPoder` (originals/tecnologico/elemental/cosmico); params §71 intensidade/velocidade/raio em `engine/params.ts:PARAMS_POR_CATEGORIA.aura` | Sem `AuraFamily` tipada com os 8 atributos §2037; cor só via `destaque` (sem primary/secondary/core); 3D = torus único (`Renderizador3d.definirAura3d`) sem família |
| Aura depth / occlusion / bounds / scale | 2048–2054 | back/body/front layers, depth test, occlusion real, bounds p/ câmera, escala normalizada por altura/body bounds | **Não existe** no 3D (torus no chão, `depthWrite:false`); 2D tem só atrás/frente | Aura3D em 3 camadas com depthTest; `bounds` declarado por efeito; escala por Box3 do personagem (`Renderizador3d.enquadrar` já calcula Box3) |
| Emissive discipline / bloom | 2059, 2092–2095 | Teto de emissive; limitar luzes dinâmicas; cor não destrói pele | **Parcial** — `UnrealBloomPass(tam, 0.32, 0.5, 0.85)` em `Renderizador3d.definirPos` (§457); rim `definirRim` = 1 DirectionalLight; `Poder3D` = 1 PointLight | Sem budget de luzes; sem teto de emissive declarado; §2094 Hero Power Light não controlado por tier |
| Power System (categorias/fases/timing/pose) | 2060–2075 | Categorias hand/body/ground/orbit/weapon/environment; fases idle/activation/peak/deactivation; loop sem reset; pose sync opcional | **Parcial** — 3D: `poc3d/Poder3D.tsx` (fases inativo/carga/climax/dissipa, 420 pts, luz+aro chão) só na PoC `Estudio3D`; 2D: `ShellStudio` overlay `svgRoteiroFamilia` (§154) one-shot por família + `presentation.poderId` em `nucleo/contratos.ts:EstadoAvatar`; `PoseId` inclui `'poder'` (`domain/types.ts`) mas nunca produzida | Sem categoria de poder; 2D sem fases; 3D do shell (`shell/Palco3d.tsx`) não usa `Poder3D`; sem pose sync |
| Particle Registry / presets / tiers / pooling | 2076–2090, 2096–2106 | Famílias spark/dust/snow/rain/embers/stars/pixels/magic/smoke/leaves; presets (size/vel/life/opacity/spread/gravity/color); pooling; tiers; culling; additive vs alpha; atlas; noise lib | **Parcial** — 2D: `engine/particulas.ts:svgParticulas` (10 `TipoParticula`, 4 direções, `TierParticulas` economico/medio/alto/cinematico, determinístico); 3D: `Renderizador3d.definirParticulas3d` (36/90 pts por tier), `Clima3D` (Points ad hoc por clima) | Sem registry único 2D↔3D; sem gravity/spread; 3D sem pooling/culling/atlas; `PointsMaterial` básico (§2274 pede curadoria) |
| Climate System | 2107–2120, 2261 | clear/rain/snow/fog/storm/wind/embers; chuva integra luz+piso+atmosfera; fog respeita profundidade; vento global | **Parcial** — 2D: `workspace/palco.ts:CLIMAS_PALCO` (limpo/chuva/neve/nevoa) + `workspace/ClimaOverlay.tsx` SVG; sugestão Clima→Luz em `ComposicaoPalco.tsx` (§179); 3D: `poc3d/catalogo3d.ts:ClimaId` (limpo/chuva/neve/vagalumes) + `Clima3D.tsx`; PHP `studio.php:495` valida enum | Sem storm/wind/embers; sem wetness/ripple; fog 3D é `scene.fog` fixo (`Cena3D.tsx:202`); sem `ventoGlobal`; shell 3D não expõe clima |
| Time of Day | 2121–2132, 2257 | Presets Morning/Day/Golden/Sunset/Night/Midnight alterando luz+ambiente+fundo+exposure; transição suave | **Parcial** — 2D: `HORAS_PALCO` (dia/tarde/noite + amanhecer/por-do-sol/madrugada) via CSS `[data-hora]` overlay + `LUZ_POR_HORA` (as5.luz_contextual); 3D: `HoraId` estudio/dia/entardecer/noite em `Cena3D.tsx:HORAS` (PoC); `EstadoAvatar.environment.hora` | Hora 2D = gradiente `::after` (é "simple background color", §2129); sem exposure; shell 3D ignora hora; sem interpolação |
| Scenario Families 3D / Golden Scenarios | 2133–2161, 2173–2185, 2260 | 9 famílias; camadas fg/mid/bg/sky; contrato de câmera; portrait/full/wings/pet compat; LOD; load assíncrono; fade; dispose; S01–S06 | **Mínimo** — `Renderizador3d.definirFundo` (neutro/estudio/grade = cor + GridHelper); PoC `Cena3D` (vazio/grade/estrelas/dojo procedurais); `services/Cenas3d.ts:FUNDOS_3D` | Sem Scenario Registry, sem camadas, sem LOD/dispose por cenário, sem fade 3D; shell 3D não tem os cenários da PoC |
| 2D Backgrounds em camadas / chão / contact shadow / parallax | 2162–2172 | far/mid/floor/fg/atmosphere; parallax; blur far; luz do avatar combina com fundo; chão; contact shadow obrigatória; BG01–BG06 | **Parcial** — 20 fundos `engine/partes/fundos.ts` (viewBox único 240×240, tingidos por destaque); parallax pointer em `components/PalcoCinema.tsx:244` (3 planos); `propsCen.profundidade` = inset box-shadow (`ShellStudio.tsx:1238`); fundos do palco via CSS `[data-fundo]` (`styles/estudio.css:1230–1241, 2044–2079`) | Fundos SVG são 1 camada; sem chão nem contact shadow no 2D; sem blur far; parallax só no PalcoCinema (App clássico) |
| Rarity Presentation | 2186–2200, 2258 | Common minimal → Legendary Hero (burst/partículas/pose/câmera, curto, só 1ª vez); accents de material; não empilhar automaticamente | **Parcial** — `RARIDADES` (`AvatarCatalog.ts:195`, 7 níveis) + pips (`GradeItens.tsx:Pips`) + CSS peso por tier; celebração ao equipar ≥épico (`ShellStudio.tsx:612` MOVIMENTOS.brilho + `tocarEquipar`); `PalcoCinema` `.avst-celebra` lendário+; `molduraViva` pulso/energia/reativa por raridade (`ShellStudio.tsx:553`) | Sem "equip reveal 1ª vez" (sem memória por item); sem camada de raridade no 3D; sem regra anti-overload |
| Presentation Director / VFX priority / budget | 2201–2209 | `AvatarPresentationState` central; prioridades critical/primary/secondary/ambient; budget por tier; econômico mantém identidade | **Não existe** — estado está espalhado: `EstadoAvatar.presentation/environment` (contratos.ts) + useState do palco (`fundo/hora/luz/clima/propsCen` em ShellStudio) + `refCena3d` em Palco3d; `QualityManager` tier3d economico/medio/alto | Criar serviço `DiretorApresentacao` (nome pt) que resolve composição e budget |
| Photo Studio integração | 2210–2223 | Aura respeita alpha/bloom/frame; opção "incluir efeitos"; portrait-safe; dark aura + dark bg → sugerir rim | **Parcial** — `engine/render-foto.ts` renderiza aura/efeito com `camadasFoto` (oculta/opacidade/blend/plano); `Foto.tsx` `transparente3d`; `luzLocal` | Sem variante portrait-safe por aura; sem diretor sugerindo rim; "incluir efeitos" não é toggle único (é por camada — aceitável) |
| UI/Thumbnails/undo/presets | 2224–2240 | previews animados lazy (hover/selected); cards de cenário com profundidade; tabs p/ hora; undo/redo de aura/power/scenario/climate/time; presets Avatar+Look+Scenario+Aura; P01–P06 | **Parcial** — hover toca poder no card (`GradeItens.tsx:900` §155); `BarraCenas` presets {fundo,hora,luz,clima?} ≤6; hist. composição §185; `Cenas3d` ≤8; hora/clima já são radiogroups | Cenário/clima/hora NÃO entram no undo (useState + localStorage, fora do store de comandos); presets não juntam look+cena; sem Golden Presets |
| Registries sem hardcode | 2277–2281 | Effect/Scenario/Climate/Time registries com id/family/params/tiers/bounds/camera/materials | **Não existe** — listas `as const` em `workspace/palco.ts`, enums em `catalogo3d.ts`, `POR_ID` maps em `EfeitosFuncionais.ts`/`PoderesFamilia.ts` | Registry tipado + UI data-driven |
| QA / Hard Fail / scores / Art Bible | 2247–2264, 2282–2283 | Captura estática/loop/perf/alpha/câmera/pele/cabelo/material; Hard Fails; scores; capítulo Art Bible | **Parcial** — testes headless `scripts/avatar/testes/{palco-vivo,palco-v2,poderes-familia,efeitos-v2,clima-210,palco3d-cine}.mjs` + `golden-avatars.mjs` | Sem QA visual de VFX (frames/loops/overdraw); Art Bible não existe (dependência Parte 12 P0) |

---

## 3. O que JÁ está coberto e prerequisitos

**Coberto (referenciar, não refazer):**
- Biblioteca determinística de partículas 2D com tiers e reduced-motion: `engine/particulas.ts` (§156) — base do Particle Registry 2D.
- Classificação de famílias/categorias: `services/PoderesFamilia.ts`, `services/EfeitosFuncionais.ts` (flags `as5.poderes_familia`, `as5.efeitos_v2`).
- Parâmetros neutros omitidos (§71): `engine/params.ts` + `validarConfig` — padrão a seguir para qualquer campo novo de aura (cor secundária, intensidade tier).
- Camadas da foto (oculta/opacidade/blend/plano/ordem): `engine/render-foto.ts`, flags `as6.foto_camadas`.
- Palco 2D: fundos/horas/luzes/climas/propsCenario/presets/histórico (`workspace/palco.ts`, `ComposicaoPalco.tsx`, `BarraCenas.tsx`, `ClimaOverlay.tsx`), Clima→Luz e Coleção→Cenário (§179).
- 3D: rim, partículas, aura-anel, tone mapping, bloom leve, vinheta (`Renderizador3d.ts` §444–§458, flags `as5.palco3d_v2`/`as5.palco3d_cine`); PoC Palco Vivo (`Cena3D`/`Clima3D`/`Poder3D`) com hora/clima/cenário persistidos em `Config3D` e validados em `studio.php:492–495`.
- Raridade: `RARIDADES`, pips, peso CSS, celebração ≥épico, som §584, moldura viva §167.
- Estado semântico: `EstadoAvatar.presentation.poderId` + `environment{cenario,iluminacao,hora,clima}` (`nucleo/contratos.ts`) — esqueleto natural do `AvatarPresentationState`.

**Prerequisitos de/para outras partes:**
- Depende da Parte 12 P0 (Art Bible, Quality Bar, tiers AUTO/ECONOMY/STANDARD/ULTRA, perf budgets, regressão visual) e da Parte de iluminação/câmera (P1 "LIGHTING/CAMERA") — hora do dia e Scenario Lighting Profile precisam do rig de luz definido lá.
- Depende de Materiais (MATERIAL SYSTEM) para wetness §2110 e rarity material accents §2198.
- Fornece para a Parte 10 (Clássico 2D premium): 2D layered backgrounds, contact shadow, parallax — a Parte 9 define a estratégia; a 10 executa a linguagem vetorial.
- Fornece para Photo Studio (P1): portrait-safe de aura, toggle de efeitos.

---

## 4. Conflitos/risco com regras invioláveis e contorno

| Risco | Regra | Contorno |
|---|---|---|
| "Redesenhar" auras/fundos existentes para ter profundidade/família | Nunca editar arte em `engine/partes/*` | Só ADICIONAR: novos ids (`aur_v2_*`, `fun_v2_*`) ou **wrappers** (ex.: `envolverAuraFamilia()` que injeta camada back/front em `<g>` ao redor do `render()` existente, ativado só por flag). Auras antigas mantêm bytes. |
| Cor secundária/core da aura, intensidade por tier, variante portrait-safe | Byte-stability | Campo novo em `params` (§71) com padrão omitido; `render-foto` ignora quando ausente; golden 16 precisa passar inalterado. |
| Hora/clima/cenário entrarem no undo e no preset | Byte-stability do avatar salvo | Ambiente continua FORA do `AvatarConfig` (é `environment` do `EstadoAvatar`/palco); undo via comando próprio no store sem tocar no hash do avatar. |
| Contact shadow 2D "obrigatória" | Byte-stability | Sombra só no `opcoes.palco` (preview) e na foto sob flag + `camadasFoto` opt-in; nunca no SVG publicado legado. |
| Novos enums de clima/hora/cenário 3D persistidos em `Config3D` | PHP espelhado | Estender `$enum` em `api/avatar/studio.php:492–495` no mesmo commit; front `validarConfig3d` fail-closed. |
| GPU particles / shaders custom / atlas de texturas | Bundle, licenças | Sem lib nova (sem `three-nebula`/`postprocessing`); shaders próprios em `services/Shaders3d.ts`; texturas procedurais (canvas) ou CC0 declaradas em `manifest-assets.json`. |
| Luzes dinâmicas por poder/aura | Performance baseline | Budget no Diretor: máx 1 luz extra (§2094) e 0 no econômico; `PerfBaseline.ts` mede. |
| Tudo atrás de flag | §651 | Uma flag por onda: `as6.vfx_v2` (guarda-chuva), filhas `as6.aura_familias`, `as6.poder_fases`, `as6.clima_v2`, `as6.hora_v2`, `as6.cenario_3d_v2`, `as6.fundo_camadas`, `as6.raridade_reveal`, `as6.diretor_apresentacao`, dependentes de `as5.palco3d` onde 3D. |

---

## 5. Proposta de ONDAS

Ordem segue §2285 (audit → aura → partículas → poder → clima → hora → cenários → raridade → diretor → foto → clássico → QA). Esforço P/M/G. Prioridade conforme Parte 12: VFX/SCENARIOS vem DEPOIS de Classic Premium/Photo Studio (P1 tardio); só P9-A é P0 (auditoria/registry/contratos).

### P9-A — Auditoria + Registries + Diretor (P0, base de tudo)
Objetivo: inventário e contratos sem mudar render.
1. §2284.1 Auditoria dos efeitos atuais: tabela 15 auras/24 efeitos/20 fundos/24 molduras × família/plano/cor/tema → `docs/AVATAR-STUDIO-5/vfx-auditoria.md`. (P)
2. §2277 `services/RegistroEfeitos.ts`: `EfeitoDef{id,familia,categoria,params,tiers,bounds,camera:'full'|'portrait-safe'}` derivado dos `ParteDef` existentes (sem tocar arte). Teste: todo `aur_/efe_` tem entrada. (M)
3. §2278–2280 `services/RegistroCena.ts`: registries de cenário/clima/hora unificando `workspace/palco.ts` e `poc3d/catalogo3d.ts` (ids 2D↔3D mapeados). (M)
4. §2201–2203 `services/DiretorApresentacao.ts`: `EstadoApresentacao` = `EstadoAvatar.presentation+environment` + `{raridadeAtiva, tier}`; função pura `resolverComposicao()` → lista de camadas com prioridade critical/primary/secondary/ambient. Flag `as6.diretor_apresentacao` (inicialmente só leitura/telemetria). (M)
5. §2206 `VFX_BUDGET` por tier (partículas, camadas transparentes, luzes, shader) em `services/QualityManager.ts`. (P)
6. §2236 Undo/redo de fundo/hora/luz/clima: comando `mudarAmbiente` no store (fora do AvatarConfig). Flag `as6.ambiente_undo`. Teste: palco-apresentacao.mjs estendido. (M)
7. §2035/2259 Verificador `cobreRosto(svg)` headless: bounds do efeito × elipse facial (`G`) → Hard Fail em script `scripts/avatar/testes/vfx-hardfail.mjs`. (M)
8. §2282 Esqueleto do capítulo VFX do Art Bible (depende do ART-BIBLE.md da Parte 12). (P)
Dependências: Parte 12 P0. Prioridade **P0**.

### P9-B — Aura Families 2D/3D + Golden Aura Set (P1)
1. §2036–2047 `AuraFamilia` (energy/fire/ice/electric/arcane/void/cosmic/digital/royal/nature/shadow/solar) com 8 atributos §2037 em `RegistroEfeitos`; mapear 15 auras existentes. (P)
2. §2265 Golden Aura Set: 4 auras NOVAS `aur_v2_energia/fogo/gelo/digital` em `engine/partes/auras.ts` (só adição), usando `svgParticulas` + camadas back/front. Golden visual dedicado. Flag `as6.aura_familias`. (G)
3. §2055–2058 params novos `corSecundaria`/`nucleo` (omitidos quando neutros) em `engine/params.ts` + PHP. (M)
4. §2048–2053 3D: `definirAura3d(cor, familia)` em 3 camadas (back additive, body rim, front sparks com `depthTest:true`), bounds exportados p/ `enquadrar()`. Flag filha de `as5.palco3d`. (G)
5. §2054 escala por Box3 do personagem (não por avatar). (P)
6. §2059/2092 teto emissive + 0/1 luz por tier. (P)
7. §2218 variante `portrait-safe` (render alternativo por `variantes.portrait` do `ParteDef` — campo NOVO, opcional). (M)
8. Teste: `golden-avatars.mjs` inalterado + `aura-familias.mjs` (bytes determinísticos por tier). (M)
Dependências: P9-A. Prioridade **P1**.

### P9-C — Particle Registry + Power System (P1)
1. §2077–2078 `RegistroParticulas`: famílias spark/dust/snow/rain/embers/stars/pixels/magic/smoke/leaves com presets (size/vel/life/opacity/spread/gravity/cor) sobre `engine/particulas.ts` (adicionar `gravidade`/`dispersao` opcionais sem mudar saída padrão). (M)
2. §2080–2085 3D: `services/Particulas3d.ts` com pool único (1 BufferGeometry reutilizada), culling por bounds, densidade por tier; `Clima3D`/`definirParticulas3d` migram para ele. (G)
3. §2096–2098 blend por família (additive energia/sparks; alpha smoke/fog). (P)
4. §2060–2061 `CategoriaPoder` hand/body/ground/orbit/weapon/environment em `PoderesFamilia.ts`. (P)
5. §2068–2072 2D: máquina de fases idle→ativação→pico→dissipação no overlay de poder do `ShellStudio` (hoje one-shot), loops contínuos. Flag `as6.poder_fases`. (M)
6. §2068 3D: levar `Poder3D` da PoC para `Renderizador3d.definirPoder(fase, familia)` (shell real). (G)
7. §2073–2075 pose sync sugerida (não obrigatória) via `Poses3d`. (P)
8. §2265 Golden Powers: Power Hand / Ground / Orbit. (M)
9. Teste `poderes-familia.mjs` estendido (fases, sem reset visível = mesma seed). (P)
Dependências: P9-A/B. Prioridade **P1**.

### P9-D — Clima + Hora do dia reais (P1)
1. §2108 climas novos: `tempestade`, `vento`, `brasas` (2D `ClimaOverlay` + registry); 3D `ClimaId` + PHP enum. Flag `as6.clima_v2`. (M)
2. §2109–2111 chuva integrada: luz fria automática (já §179), piso molhado (reflexo sutil no plano do palco 3D), atmosfera. (M)
3. §2114 fog 3D com profundidade (`FogExp2` por cenário, nunca sobre o rosto). (P)
4. §2115–2117 storm: flash controlado (exposure clamp). (M)
5. §2118–2119 `ventoGlobal` compartilhado (partículas + cabelo secundário simplificado §2120). (M)
6. §2122–2128 presets Manhã/Dia/Golden/Pôr-do-sol/Noite/Meia-noite: mapear os 6 de `HORAS_PALCO`; 3D aplica key/rim/ambiente/exposure em `Renderizador3d.definirHora()`. Flag `as6.hora_v2`. (G)
7. §2130 interpolação suave de hora (lerp de luz). (P)
8. §2230 UI: hora em tabs/cards (já radiogroup; só visual). (P)
9. Testes: `clima-210.mjs` + novo `hora-v2.mjs`; golden 3D byte a byte. (M)
Dependências: Parte LIGHTING/CAMERA. Prioridade **P1**.

### P9-E — Golden Scenarios 3D + 2D Hero Backgrounds (P1 tardio)
1. §2134 Scenario Families + registry com `lightingProfile`, `cameraContract`, `bounds`, `lod`. (M)
2. §2173 S01–S06 (Studio/Tech/Urban/Royal/Nature/Cosmic) em camadas fg/mid/bg/sky, 100% procedurais ou CC0 declarados; shell 3D recebe os cenários (hoje só neutro/estudio/grade). Flag `as6.cenario_3d_v2`. (G)
3. §2178–2185 loading assíncrono, placeholder neutro, fade, cache ≤2, `dispose()` obrigatório. (M)
4. §2152–2156 contrato de câmera (portrait área limpa, chão full-body, espaço lateral pet). Teste headless por preset de câmera. (M)
5. §2163–2169 2D: `fun_v2_*` BG01–BG06 com camadas far/mid/floor/fg/atmosfera via wrapper `envolverFundoCamadas()` + **contact shadow** no palco (`opcoes.palco`) e na foto (opt-in `camadasFoto.sombra`). Flag `as6.fundo_camadas`. (G)
6. §2164–2165 parallax do `PalcoCinema` portado ao `ShellStudio` (3 planos já existem no SVG) + blur far. (M)
7. §2174–2177 LOD de cenário por tier. (P)
8. Testes: golden 16 intocado; `cenarios-v2.mjs` (render 2D determinístico; 3D dispose sem leak). (M)
Dependências: P9-A/D, Material System. Prioridade **P1**.

### P9-F — Raridade + Presets Hero + Photo + QA (P1/P2)
1. §2186–2196 `services/RaridadeApresentacao.ts`: camadas por nível; equip reveal 1ª vez (memória local `dshow.avst6.reveal.v1`), duração ≤1.2s, nunca repete. Flag `as6.raridade_reveal`. (M)
2. §2200/2205 regra anti-overload no Diretor (máx N camadas VFX; ambient cai primeiro). (P)
3. §2237–2246 presets Avatar+Look+Cena+Aura (`PresetsPessoais` + `BarraCenas` unificados) + Golden P01–P06. (M)
4. §2211–2217 Photo: toggle "Incluir efeitos" (atalho sobre `camadasFoto`), aura portrait-safe, sugestão de rim quando aura escura + fundo escuro (sem recolorir §2223). (M)
5. §2224–2227 thumbnails animados lazy (hover/selected — já existe p/ poder; estender a cenário/clima). (P)
6. §2247–2258 QA visual: `vfx-qa.mjs` captura frames (claro/escuro, 3 câmeras, 3 peles) + FPS/drawCalls via `diagnostico()`. (G)
7. §2263–2264 scores no doc de QA; §2284.18 Before/After. (P)
8. §2269/2286 plano de escala pós-gate. (P)
Dependências: P9-B..E. Prioridade **P1** (1–4), **P2** (5–8).

---

## 6. Perguntas bloqueantes vs. decisões tomadas

**Bloqueantes (precisam do Jhony):**
1. **Assets de cenário 3D**: S03 Urban/S04 Royal/S05 Nature exigem geometria/texturas além do procedural; só CC0 declarado em `manifest-assets.json` — aprovar fonte (Poly Haven/Kenney) e peso máximo por cenário (sugestão ≤1,5 MB gzip)? Sem resposta: entregar procedurais.
2. **Texturas de partículas/atlas** (§2100–§2102): gerar proceduralmente em canvas (zero asset) ou aceitar atlas CC0? Decisão de bundle/peso.
3. **Som de raridade/equip reveal** (§2187 "sound futuro"): reutilizar `services/Som.ts` existente ou adiar? Irreversível = nada; mas é escopo.
4. **Custo de QA visual** (§2249 GPU cost/overdraw): o harness headless não mede GPU real; aceitar FPS/drawCalls como proxy ou ter uma máquina de referência?

**Resolvido sozinho (decisões a numerar #155+):**
- Famílias de aura do briefing (12) coexistem com as 4 famílias de PODER do §153 (`PoderesFamilia.ts`): família de poder = eixo temático; família de aura = eixo visual. Não renomear as 4 existentes.
- Ambiente (cenário/hora/luz/clima) continua fora do `AvatarConfig` persistido; entra no undo via comando próprio; presets locais.
- Contact shadow 2D só em preview/foto opt-in (byte-stability).
- Nomes em português para serviços novos (`DiretorApresentacao`, `RegistroEfeitos`), flags `as6.*` seguindo o padrão da casa; `avatar_vfx_v2` do §2917 vira `as6.vfx_v2`.
- GPU particles/shader-based (§2082/2103): NÃO na primeira entrega; `THREE.Points` com pool + curadoria visual.
- Tiers: mapear ECONOMY/STANDARD/ULTRA do briefing aos `economico/medio/alto` existentes (+`cinematico` só partículas 2D); sem novo enum persistido.

---

## 7. Métricas / Acceptance da parte

- Gate §2286: 4 aura families (energia/fogo/gelo/digital) + 3 power types (hand/ground/orbit) + 4 climas (limpo/chuva/neve/névoa reais) + 6 golden scenarios + rarity presentation + tiers — todos com flag, teste headless e captura before/after.
- `golden-avatars.mjs` (16) e suíte completa (`rodar-todos.mjs`, hoje 140 testes) verdes em cada onda; nenhuma alteração de bytes em auras/efeitos/fundos existentes (diff vazio em `engine/partes/*` exceto adições ao fim dos arrays).
- `vfx-hardfail.mjs`: 0 efeitos cobrindo a elipse facial em portrait; loop sem salto (mesma seed → mesmo SVG); tier econômico mantém identidade (mesma família, ≥35% densidade).
- Perf: econômico ≤1 luz extra e ≤100 partículas 3D; standard ≤2 luzes, ≤500; drawCalls do `diagnostico()` não sobe >15% vs `baselines.md`; bundle do painel +≤40 KB gzip por onda.
- Registries: 100% dos `aur_*/efe_*/fun_*` e enums de clima/hora/cenário resolvidos por `RegistroEfeitos`/`RegistroCena` (teste de cobertura), UI sem listas hardcoded novas.
- Diretor: `resolverComposicao()` determinístico (snapshot test por estado); ambient é a 1ª camada removida ao baixar tier.
- PHP: enums novos de clima/hora/cenário espelhados em `studio.php` (teste de round-trip).
- Docs: `vfx-auditoria.md`, capítulo VFX do Art Bible, scores §2263/§2264 preenchidos por golden, decisões numeradas registradas.
