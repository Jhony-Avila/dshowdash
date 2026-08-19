# ART BIBLE — Avatar Studio Dshow (v1 · onda 1405 · MEGA_BRIEFING_01 §129–§130, §168–§172, §3044)

> Versão: **dshow_v2 · 1.0** (2026-08-19). Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` (Partes 1–10) + digests. Toda mudança relevante registra WHY / WHAT / IMPACT no §12 deste documento (§171). Assets novos declaram `artBibleVersion` no manifest/metadados (Parte 11 §2816).
> Este documento define **direção**, não implementação. Regras de engenharia (flags, byte-stability, PHP espelhado, arte só adicionada) prevalecem sobre qualquer item aqui.

## 1. Tese e direção

1. **Problema** (§2): a arquitetura é mais sofisticada que o visual percebido — protótipo, low-poly simples, cartoon básico, pouca materialidade, pouca riqueza facial, pouca diferenciação entre personagens, baixo impacto em close-up. **Quantidade de combinações ≠ qualidade percebida** (§3).
2. **Direção 3D — "Dshow Premium Stylized"** (§5): estilizado premium / semi-realista, nunca fotorealismo, nunca low-poly genérico. Proporções próximas do humano com leve estilização (cabeça 1/7–1/7,5 do corpo no padrão; mãos/pés legíveis; ombros/quadril como assinatura de gênero, não escala).
3. **Direção 2D — "Premium Stylized 2D/2.5D Illustration"** (§22, §2288–§2295): identidade própria (shape design, camadas, shading controlado, materialidade, profundidade, contorno seletivo, parallax) — **não imitação do 3D**. Clássico e 3D são duas linguagens premium do mesmo produto (§3010, §3105).
4. **Hierarquia visual** (§57, §2035): rosto > silhueta > roupa > cabelo > acessórios > VFX > cenário. Nada cobre o rosto; aura/partícula/cenário são coadjuvantes.
5. **Regra de decisão** (§3106, §3108): não otimizar para quantidade; otimizar para **qualidade percebida sustentável em escala**. Conflito → 1 NÃO QUEBRAR · 2 ELEVAR · 3 VALIDAR · 4 ESCALAR.
6. **Testes perceptivos** (§3004–§3013): "sem o logo, parece um Character Creator premium?" · "o rosto aguenta close-up?" · "o cabelo é parte do personagem ou capacete?" · "a roupa é tecido ou pintura no corpo?" · "os acessórios são assets finais ou primitives?" · "a luz valoriza sem esconder?" · "Classic e 3D parecem o mesmo produto premium?" · "aguenta o tier econômico?" · "um asset novo entra sem mexer em 10 lugares?" · "3× catálogo sem 3× dívida visual?".

## 2. Escada de qualidade e Quality Bar (resumo; detalhe em `VISUAL-QA.md`)

| Nível | Nome | Significado | Onde aparece |
|---|---|---|---|
| Q0 | `prototype` | placeholder procedural / prova técnica | só Dev/QA (nunca destaque, nunca onboarding) |
| Q1 | `legacy` | arte anterior ao Art Bible; renderiza para saves, sai do destaque progressivamente | catálogo (sem destaque) |
| Q2 | `production` | aprovado no gate técnico + Visual QA mínimo; identidade coerente | catálogo padrão |
| Q3 | `premium` | Quality Bar completo (matriz §65 ≥ mínimos, zero Hard Fail) | destaque, Vitrine, coleções |
| Q4 | `hero` | referência do estilo (Golden); usado em onboarding/marketing/Vitrine | hero/golden |

Raridade ≠ qualidade (§14): um item `comum` pode ser Q3; um `lendário` Q1 não ganha destaque por ser raro. Traços básicos de rosto/pele/nariz/sobrancelha nascem `comum` (§644–§647).

## 3. Corpo (Parte 2)

- **Linguagem**: "Premium Stylized Human" — anatomia convincente com estilização leve; bases masculina e feminina com **silhuetas distintas** (não escala uma da outra); famílias HUMAN_M/HUMAN_F × standard/slim/athletic/broad|curvy/large via **morphs**, nunca "malha por sexo".
- **Proportion Sheet** (a medir pelo `corpo-benchmark.mjs`, onda 1409): altura em cabeças 7–7,5; largura de ombros M ≈ 2,2 cabeças / F ≈ 1,9; quadril F ≥ ombros×0,95; mãos ≈ rosto; pés ≈ antebraço. Extremos proibidos: cabeça > 1/6 do corpo (chibi), ombros > 2,8 cabeças (superhero caricato), pescoço "linha de montagem".
- **Shape ≠ Pose ≠ Clothing Fit**: postura não simula forma; roupa deforma com o corpo (morph/skinning), nunca `scale` da peça.
- **Postura**: peso distribuído, contrapposto sutil, respiração/micro-movimento; perfis neutral/confident/relaxed/heroic/elegant/energetic.
- **Mãos/pés**: sempre legíveis; pés no chão (grounding); props com grip profile.
- **2D**: corpo inteiro 240×400 é UM scaffold; corpo premium entra como scaffold v2 opt-in (acabamento premium), nunca editando `partes/corpo.ts`.

## 4. Rosto (Parte 3)

- **Rosto é sistema composto**: head shape + face shape + pele + olhos + sobrancelhas + nariz + boca + orelhas + barba + expressão + idade + microdetalhe. Diversidade vem da **geometria** (famílias oval/round/square/long/heart/angular/diamond/soft), não só da textura.
- **Olhos = prioridade máxima**: globo real (3D) / anatomia completa (2D: sclera quente ≠ #FFFFFF, íris em ≥2 tons + anel, pupila, pálpebras superior e inferior, 2 catchlights), cor de íris independente, blink natural (intervalo variável 2,5–6,5 s, 120–160 ms, double-blink ocasional), look-at sutil, eye contact em retrato.
- **Pele como sistema**: tom + roughness + micro-variação + tint regional (bochecha/nariz/orelha) + decals (sardas/pintas/cicatrizes/maquiagem) como camadas; paleta ampla e neutra, calibrada por luminância (pele escura mantém highlight; clara não estoura); skin tone é GLOBAL (hard fail se só na cabeça).
- **Boca**: volume (lábio superior/inferior/canto/highlight); sorriso envolve bochechas e olhos; barba é slot próprio (não boca).
- **Sobrancelhas**: sistema próprio (forma/espessura/posição/cor sincronizável), nunca "cozidas" em artes novas. **Nariz**: bridge/tip/width/nostril/highlight (2D: categoria `nariz`; 3D: morphs).
- **Expressão**: registry semântico (`face_smile`, `eye_blink_l`…) + presets neutral/smile/confident/surprised/serious/happy com intensidade; idle "neutral alive". **Idade**: young_adult/adult/mature preserva identidade. **Assimetria** sutil determinística.
- **Close-up é o gate absoluto** (§665): rosto reprovado em close-up não é aprovado.

## 5. Cabelo, barba, sobrancelhas (Parte 4)

- Cabelo = silhueta + volume + detalhe; famílias (short/medium/long/curly/afro/braids/ponytail/bun/undercut/fantasy) com **silhuetas distintas** (distinctiveness check humano).
- **3D**: hair cards com alpha (mask para rígidos, blend só onde precisa), shader próprio (`hair_soft/gloss/coarse/fantasy`), highlight direcional, AO controlado, root-to-tip sutil; fit com cabeça/morphs; `hairMask` por headwear (visible/masked/variant/hidden); secondary motion leve e amortecida (ponytail/longo), congelada no econômico; LOD sem pop (rosto = LOD0).
- **2D premium**: 6 camadas (back/main/fringe/shadow/highlight/strands), massa traseira **atrás** do pescoço/ombros (`renderAtras`), sombra do cabelo na testa, hairline ancorada na base, gradiente por mechas (nunca um arco de brilho branco uniforme), micro sway no palco.
- Cor: canal principal + canal secundário declarado por asset; barba/sobrancelha sincronizam por padrão e podem divergir.
- Anti-padrões: "capacete", cabelo flutuando, raiz sem contato, highlight plástico, silhuetas irmãs.

## 6. Roupas e calçados (Parte 5)

- Roupa comunica **FORMA + MATERIAL + CONSTRUÇÃO** — nunca "cor sobre o corpo". Famílias tops/bottoms/footwear × corte × material; outfit preset vs peça individual.
- Layer model: upper_base / upper_outer / lower / footwear / gloves / belt / shoulder / cape; compatibilidade declarada; camada externa oculta/comprime a interna; body/clothing masking por regiões semânticas.
- Quality bar por peça: gola/manga/costura/caimento (camiseta ≠ camisa ≠ hoodie ≠ jaqueta ≠ blazer); jeans = denim; tênis ≠ bloco; botas integradas à calça.
- Materiais: famílias (cotton/denim/wool/knit/leather/satin/silk/technical/rubber/plastic/metal/armor) com resposta distinta à luz; canais primary/secondary/accent/detail só onde suportado; padrões/decals/logos Dshow curados; teste de cor escura/branca/saturada/metálica.
- **2D premium**: silhueta própria por peça (ombros/mangas/cintura/comprimento mudam — `renderCorpoV2`), tokens de material (algodão/denim/couro/metal/técnico/cetim), calça independente da camiseta; identidade semântica cross-renderer.
- Anti-padrões: 20 camisetas iguais com cores diferentes; roupa "pintada"; camisa atravessando blazer; sapato-bloco.

## 7. Acessórios, props, pets, companions (Parte 6)

- Preservar lógica (IDs, slots/sockets, saves, regras); elevar a arte. Placeholders procedurais (`soc_*`) = `prototype` (Dev only), nunca Hero.
- Fit: occupancy profiles + spatial regions + regras declarativas requires/incompatibleWith/hides/replaces/occupies; conflito explicado ("Asas substituem Mochila"); L/R/par via variante.
- Quality bar por família: óculos (armação com espessura/ponte/hastes, lente vidro/tinted/mirrored, repousa em nariz/orelhas), headwear (fit + hairMask), joias (ouro ≠ #FFD700: metalness/roughness/env; gemas), mochila/jetpack/asas (alças/anchor/bounds → câmera recua), props (grip/pivot/orientação), companion (hover/orbit/evitação de rosto), pet (grounding/idle/LOD).
- Famílias de material: metal_polished/brushed, plastic_tech, rubber, leather, glass, crystal, energy, hologram, fabric; canais primary/secondary/metal/emissive só onde suportado; emissive com teto.
- **2D premium**: lentes/sombra/profundidade, joias com gradiente metálico, layering back/front real (costas atrás do corpo), pet com motion leve.
- Golden Accessory Set alvo: A01 óculos · A02 coroa · A03 colar · A04 relógio · A05 mochila · A06 asas · A07 prop · A08 drone · A09 pet (≥1 Q3/Q4 por região antes de escalar, §1495).

## 8. Materiais (Parte 7) — COR ≠ MATERIAL

- Registry central de **famílias** (`FamiliasMaterial.ts`): skin (3 tiers, mesma identidade), hair, cotton/denim/wool/knit/satin/silk/technical, leather (matte/polished/worn), rubber/plastic, metal_brushed/polished, gold/silver/bronze, glass (clear/frosted/tinted), crystal, hologram, energy, emissive. Asset = família + overrides; zero `roughness=0.37` solto em componentes.
- Tint multiplicativo preserva mapas; lista `naoTingir` (olhos, dentes, logos, metais nobres).
- Emissive disciplinado: teto por material, budget por asset/cena/raridade, bloom só em emissive relevante (nunca "bloom como solução", §3096).
- Texture Map Contract: BaseColor/Normal/Roughness/Metalness/AO/Emissive/Alpha, WebP por LOD, texel density, budget por categoria (rosto > acessório), color space sRGB ponta a ponta (palco = thumb = foto = export).
- PBR-safe colors: evitar #FFF/#000 puros no render; o hex salvo nunca é alterado.
- **2D**: tokens de acabamento (skin/cotton/leather/metal/glass/emissive) por `materiais2d.ts` — "um gradiente genérico para tudo" é anti-padrão.

## 9. Iluminação, câmera, pós (Parte 8)

- Lighting Registry (`Looks3d.ts`): **Studio** (neutro, benchmark e QA — v1 = valores atuais), **Portrait** (fill alto, rim suave, 85 mm-equivalente), **Hero** (key direcional + rim forte, fill baixo), **Dramatic**, **Neon** (luzes coloridas + bloom controlado), **Product**, **Soft**. Key sempre presente; rim mais forte em cabelo escuro com limite; pele nunca estoura.
- Sombras: contato sempre (todos os tiers), softness por look, resolução por tier, bias padronizado, sem cascade; chão ancora (studio_matte/gloss/platform/grid).
- Background ≠ environment; RoomEnvironment baseline; HDRI só curado e licenciado (fase 2).
- Câmera: presets Full/¾/Bust/Portrait/Face/Accessory/Back/Photo com FOV por preset (retrato/rosto ≈ 24° vertical, busto 28°, corpo 32–34°), headroom/eye-line, bounds/accessory/morph-aware, category-aware, limites (nunca abaixo do chão nem dentro do rosto), transições curtas e interrompíveis, **nunca resetar** ao editar.
- Pós: ACES baseline; cadeia Render → Bloom → ColorGrade (leve, protege pele) → Vignette → Output; DOF só Photo/Ultra com foco nos olhos; sem CA/grain no editor; tone mapping modes = Dev.
- Photo Studio: lentes Portrait/Full/Fashion/WideHero/Profile/Close-up; aspects 1:1/4:5/16:9/9:16; terços/centro/safe; captura alta determinística com restauro.
- **2D**: looks equivalentes (Studio/Portrait/Hero/Neon) por CSS/overlay, sombra de contato, rim seletivo, profundidade de fundo — mesma nomenclatura do 3D.

## 10. VFX, clima, hora, cenários, raridade (Parte 9)

- Aura Families (energy/fire/ice/electric/arcane/void/cosmic/solar/digital/royal/nature/shadow) com forma + movimento próprios (fogo ≠ "energia vermelha"), profundidade back/body/front, escala por bounds do personagem, intensidade/cor/multi-cor; variante portrait-safe.
- Power System separado (hand/body/ground/orbit/weapon/environment) com fases idle → activation → peak → deactivation sem reset visível.
- Particle Registry (spark/dust/snow/rain/embers/stars/pixels/magic/smoke/leaves) com presets/pool/tiers/culling/blend.
- Clima (clear/rain/snow/fog/storm/wind/embers) integra luz/piso/atmosfera; Hora (morning/day/golden/sunset/night/midnight) = luz + ambiente + fundo + exposure, não cor de fundo.
- Cenários em camadas fg/mid/bg/sky com contrato de câmera (portrait limpo, chão full-body, espaço lateral para pet), LOD, load assíncrono, dispose; 2D: far/mid/floor/fg/atmosfera + parallax + **sombra de contato obrigatória** (preview/foto).
- Raridade: Common minimal → Legendary hero (burst curto, 1ª vez), sem pilha automática; Presentation Director resolve composição e budget por tier.
- Anti-padrões: efeito cobrindo o rosto; tudo roxo; bloom para esconder arte; partícula como ruído.

## 11. Anti-padrões globais (§3096 + partes)

❌ aumentar quantidade antes do quality lock · ❌ reescrever arquitetura estável sem motivo · ❌ remover fallback cedo · ❌ tratar placeholder como final · ❌ bloom como solução · ❌ mesma geometria com muitas cores como "variedade" · ❌ quebrar saves/IDs · ❌ materiais arbitrários espalhados · ❌ duplicar lógica 2D/3D sem abstração semântica · ❌ ignorar mobile/performance · ❌ declarar concluído sem Visual QA · ❌ editar arte existente em `partes/*` · ❌ campo novo que muda o render de avatar salvo · ❌ asset sem licença registrada.

## 12. Tokens de arte (referência rápida; valores concretos vivem no código: `tokens.css`, `FamiliasMaterial.ts`, `Looks3d.ts`, `materiais2d.ts`)

| Token | Uso | Nota |
|---|---|---|
| `luz.key/fill/rim/ambiente` | rig por look | valores no registry, nunca literais em componentes |
| `material.<familia>` | roughness/metalness/normal/AO/emissive | asset declara família; override só justificado |
| `pele.<tom>.{base,claro,escuro,profundo}` | shading 2D calibrado por luminância | `tintaPremium()` |
| `cabelo.<camada>` | back/main/fringe/shadow/highlight/strands | 2D premium |
| `sombra.contato` | elipse/gradiente sob o personagem | sempre presente (preview/foto) |
| `camera.<preset>.fov` | retrato 24° · busto 28° · corpo 32–34° | `Camera3d.ts` |
| `emissive.teto` | 2 (TETO_EMISSIVO) | budget por raridade |
| `ocupacao.thumb` | 70–85% (alvo 78%) | Modo Item |

## 13. Changelog (WHY / WHAT / IMPACT)

- **1.0 (2026-08-19, onda 1405)** — WHY: MEGA_BRIEFING_01 institui direção "Dshow Premium Stylized" e Quality Bar. WHAT: documento criado com capítulos 1–12 consolidando Partes 1–10. IMPACT: nenhum no render; base para `VISUAL-QA.md`, `GOLDEN-TESTS.md` e para toda arte nova a partir da onda 1411. Decisões #155–#166 (mapa claude/41).
