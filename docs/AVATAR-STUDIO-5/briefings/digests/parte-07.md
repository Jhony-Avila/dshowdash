# Digest — MEGA_BRIEFING_01 · PARTE 7/12 (§1507–§1752)
## Materiais PBR, pele, tecidos, metais, vidro, emissive, shaders, texturas, normal/roughness/AO, color management e padrão físico-visual unificado

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 17988–20160. Código investigado: `src/services/Materiais3d.ts`, `Renderizador3d.ts`, `Assembler3d.ts`, `Personagens3d.ts`, `QualityManager.ts`, `Capacidade3d.ts`, `CacheNiveis.ts`, `poc3d/Cena3D.tsx`, `poc3d/Personagem3D.tsx`, `poc3d/Acessorios3D.tsx`, `poc3d/catalogo3d.ts`, `shell/Palco3d.tsx`, `engine/cores.ts`, `engine/cor-hsl.ts`, `engine/base-api.ts`, `engine/partes/*`, `services/VariantesAssets.ts`, `nucleo/flags.ts`, `scripts/avatar/assets3d/{publicar-asset,validar-asset,gerar-thumbs-3d}.mjs`, `scripts/avatar/testes/materiais3d.mjs`, `api/avatar/studio.php`, `docs/AVATAR-STUDIO-5/pipeline-assets-3d.md`.

---

## 1. Resumo executivo

1. A Parte 7 não pede infra nova de PBR — pede **organizar, padronizar e elevar** o que já existe (§1507): MeshStandardMaterial + 7 mapas, sRGB, ACES, RoomEnvironment e bloom já estão no `Renderizador3d`.
2. Regra estrutural: **COLOR != MATERIAL** (§1508). Hoje o 3D tem só canais de cor (`Canal3d` = pele/cabelo/roupa/destaque) e um par `material.{metal,brilho}` da PoC; não há conceito de *família de material*.
3. Deliverable central: **Material Family Registry** (§1509–§1512, §1597) — famílias (skin, hair, cotton, denim, leather, satin, metal_brushed, gold, glass, crystal, hologram, energy, emissive…) com defaults centralizados; asset = família + overrides; nada de `roughness=0.37` espalhado (hoje `poc3d/Acessorios3D.tsx` tem ~15 valores hardcoded).
4. Classes próprias para **pele** (§1519–§1530, tiers econômico/standard/premium, mesma identidade em todos), **cabelo** (§1531–§1536), **tecidos** (§1537–§1545), **couro/borracha/plástico** (§1541–§1548), **metais** (§1549–§1556: ouro ≠ amarelo), **vidro/cristal/holograma/energia** (§1557–§1566) e **emissive com teto e budget de bloom** (§1567–§1571).
5. **Texture Map Contract** (§1572–§1605): stack BaseColor/Normal/Roughness/Metalness/AO/Emissive/Alpha, packing ORM opcional, WebP por LOD (já existe no publicador), KTX2 futuro, texel density, tiling, material instances, dedupe/cache/clone/dispose (já parcialmente em `Materiais3d.ts`).
6. **Environment + Color Management** (§1606–§1635): RoomEnvironment como baseline, HDRIs curados (licença rastreada), sRGB ponta a ponta (thumbs/foto/export coerentes com o viewport), ACES baseline, exposure presets curados, PBR-safe colors (sem #FFF/#000 puros).
7. **UX de material** (§1644–§1657): transições suaves, preview no hover, undo/redo, presets amigáveis (Fosco/Tecido/Couro/Metálico/Brilhante/Tecnológico), UI contextual por tipo de asset, zero jargão.
8. **Dev tooling + QA** (§1658–§1685): material inspector, debug views (Albedo/Normal/Roughness/Metalness/AO/Emissive/UV/Lighting Only), cena de calibração, Golden Material Set M01–M12, hard/soft fail, before/after, regressão visual com revisão humana.
9. **Perf/tiers/robustez** (§1686–§1714): budgets de textura/shader/overdraw/material count; tiers Econômico/Standard/Ultra sem mudar identidade; fallback material; context loss; missing-texture fallback; telemetria de erro; validação de mapas no publicador.
10. **2D Clássico** (§1722–§1735): materialidade por tokens de estilo (skin/cotton/leather/metal/glass/emissive) sem "um gradiente genérico para tudo"; coerência 2D↔3D; **Photo Studio** (§1736–§1744): material não muda na foto, só luz; export transparente preservando vidro/cabelo/emissive. Gate final §1751: REGISTRY+SKIN+HAIR+FABRIC+METAL+GLASS+COLOR MGMT+VISUAL QA antes de escalar.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Auditoria de materiais atuais | 1507, 1749.1 | Inventário do uso real de PBR/maps/env/bloom antes de mexer | **Parcial**: `validar-asset.mjs` mede `medidas.materiais`, texturas por LOD e UV (§487); sem relatório de famílias/roughness/metalness por asset | Script de auditoria que lê os GLB publicados e lista materiais, mapas presentes, faixas roughness/metalness, emissive, alpha |
| Material Family Registry | 1509–1512, 1597–1599, 1678–1681 | Registry central de famílias (id, metalness, roughness, emissiveIntensity, opacity, normalScale, envIntensity), versão por família, asset = família + overrides | **Não existe**. `Materiais3d.ts` só tem `Canal3d` (cor) e `TETO_EMISSIVO=2`; PoC `catalogo3d.ts:Config3D.material={metal,brilho}` (persistido, PHP `studio.php:485`); `Acessorios3D.tsx` hardcoda metalness/roughness | Criar `services/FamiliasMaterial.ts` (registry em dados + `aplicarFamilia(material, familia, overrides)`); metadata de família no manifest da parte (`Partes3d.ts`) e no `PipelineAsset/MetadadosAssets` |
| Color ≠ material / tint preservando textura | 1508, 1513–1516, 1671, 1672 | Tint multiplicativo que preserva map/normal/roughness; não tingir olhos/metais/logos; byte-stability sem customização | **Existe**: `aplicarPipelineCores` (multiplicativo, `userData.corOriginal`, idempotente, flag `as5.materiais3d`); teste `testes/materiais3d.mjs`. **Parcial**: `Assembler3d.ts` passo 5 usa `color.copy()` (não multiplica) para pele por nome; nenhuma lista de "não tingir" | Lista de exclusão (`userData.naoTingir` / família `eyes`/`logo`), unificar passo 5 do assembler no pipeline multiplicativo |
| Canais semânticos expandidos / metadata explícita | 1517–1518 | Canais internos skin/hair/fabric_primary/fabric_secondary/metal/glass/emissive/detail; metadata > nome de material | **Parcial**: `canalDoMaterial` = marca `userData.canal3d` (por categoria, `marcarCanal`) > regex do nome (hair/skin). Só 4 canais | Mapear canais internos ricos → 4 canais públicos §73 (sem tocar persistência); canal por material no manifest |
| Skin material (tiers, regional variation, SSS-lite) | 1519–1530, 1738 | Classe própria, roughness baseline, specular sutil, micro-normal, AO leve, SSS-lite no premium, mesmo tom em todos os tiers, calibrar com Golden Faces | **Não existe**: pele é só `color` multiplicada em materiais nomeados "skin" | Família `skin` com 3 tiers (econômico = standard ajustado; premium = `MeshPhysicalMaterial`/sheen ou shader leve); regional variation via mapa (asset novo) ou vertex tint |
| Hair material (anisotropia, alpha, root/tip) | 1531–1536, 1642 | Família própria, specular direcional, alpha por asset, preservar root/tip | **Parcial**: cabelos UBC publicados (`partes/cab_*`), tint por canal; sem família/alpha policy | Família `hair`; `alphaTest`/`transparent` decidido pelo manifest; anisotropy só no tier Ultra (`MeshPhysicalMaterial.anisotropy`) |
| Tecidos/couro/borracha/plástico | 1537–1548 | cotton/denim/wool/knit/leather(3 variantes)/satin/silk/technical/rubber/plastic_matte/plastic_gloss com resposta distinta | **Não existe** | Defaults no registry + detail/tiling maps opcionais (assets novos CC0) |
| Metais | 1549–1556, 1635, 1641 | Metalness real, brushed/polished, gold/silver/bronze não-cinza/amarelo, painted metal, armor composite | **Parcial**: `Acessorios3D.tsx` usa metalness 0.55–0.9 hardcoded; `Cena3D.tsx` cenário procedural | Famílias metal_* no registry + `Acessorios3D` consumindo registry |
| Vidro/cristal/holograma/energia | 1557–1566, 1643, 1668 | Glass clear/frosted/tinted, fallback transparente no eco, crystal (transmission+emissive+env), hologram (fresnel/scanline), energy shader (core/edge/flow/noise) | **Não existe**. Único shader custom = vinheta no composer (`Renderizador3d.ts:~727`); `Poder3D.tsx` usa MeshBasicMaterial | `MeshPhysicalMaterial` (transmission) no Standard/Ultra; `ShaderMaterial` energia/holograma só no Ultra com fallback Standard emissivo |
| Emissive discipline / bloom budget | 1567–1571, 1669, 1709 | Teto formal de emissive, bloom só no emissive relevante, budget por asset/cena/raridade, VFX ≠ material | **Parcial**: `TETO_EMISSIVO=2` grampeado no pipeline; `UnrealBloomPass(…, 0.32, 0.5, 0.85)` threshold 0.85 (flag `as5.pos3d_real`, nunca no econômico) | Budget por raridade/cena; bloom seletivo (layers/selective bloom) ou threshold por look; emissive map validation no publicador |
| Map stack / texture contract / packing | 1572–1582, 1701–1710 | 7 mapas opcionais, packing ORM se houver ganho, validação de mapas (size, alpha, color space, normal convention, roughness range, metalness ~0/1, AO strength) | **Parcial**: `publicar-asset.mjs` (textureCompress WebP, `TEXTURA_MAX` 2048/1024/512) e `validar-asset.mjs` (maior textura por LOD, UV §487, "≤4 mapas" no doc) | Validador de mapas por função (glTF já empacota ORM: `metallicRoughnessTexture`+`occlusionTexture`); contrato documentado; naming só como fallback |
| Compressão/resolução/texel/mipmaps/anisotropy | 1583–1596, 1711–1714 | Preservar WebP/LOD, KTX2 futuro, budget por categoria (face > acessório), texel density, tiling, mipmaps, anisotropic filtering criterioso | **Parcial**: WebP por LOD existe; `pipeline-assets-3d.md §6` menciona KTX2 futuro; sem budget por categoria nem anisotropy | `TEXTURA_MAX` por categoria; `texture.anisotropy` por tier; KTX2 registrado como futuro |
| Instances/dedupe/clone/dispose | 1597–1605 | Material instances, cache, clone só p/ customização, restore, sem leaks, dispose de texturas | **Existe**: `materiaisDe` dedupe, `userData.corOriginal`, `descartarMateriais` (7 mapas + material); `Personagem3D.tsx:instanciar` clona por instância (PoC) | Cache de famílias compiladas; checar leak quando família troca em runtime |
| Environment / HDRI / IBL | 1606–1621 | RoomEnvironment baseline, HDRIs curados (studio_soft/contrast/industrial/night_neon), licença, PMREM, intensidade por look, material sobrevive a várias luzes | **Parcial**: `Renderizador3d.montar` PMREM+RoomEnvironment, `environmentIntensity=0.55`, `definirAmbiente(0–1.2)` (flag `as5.palco3d_v2`) | HDRIs (assets externos — ver §6), intensidade por preset de luz; depende da Parte 8 |
| Color management ponta a ponta | 1622–1627, 1742 | sRGB coerente em viewport, thumbs, Photo Studio, export; data maps lineares | **Parcial**: `Renderizador3d` sRGB+ACES; `gerar-thumbs-3d.mjs` define sRGB mas **sem toneMapping/environment** (thumb ≠ viewport); GLTFLoader já marca data maps lineares | Alinhar thumbs ao viewport (ACES + env); contrato documentado; teste que compara histograma thumb×viewport |
| ACES/exposure presets/PBR-safe colors | 1628–1638 | ACES baseline, presets de exposição curados, sem exposição por asset, evitar #FFF/#000, guidelines de cores metálicas | **Parcial**: `definirExposicao` clamp 0.6–1.6 (slider livre), `definirTonemapping` (aces/agx/neutro/reinhard); sem guideline de cor | Presets nomeados; `corPbrSegura()` (clamp de luminância) aplicada só em famílias metal/pele — NÃO nos hex salvos |
| Rim response | 1639–1643 | Pele suave, metal forte, cabelo essencial, vidro ajuda | **Parcial**: rim light §452 no `Palco3d` (flag `as5.palco3d_v2`) | Resposta vem das famílias (roughness/metalness) — sem trabalho extra além do registry |
| Transições/preview/undo | 1644–1649 | Lerp curto de cor/roughness, hover preview, histórico | **Parcial**: `as5.undo_redo` (cores já entram); sem lerp de material | Lerp opcional no `aplicarPipelineCores` (tier ≠ eco) |
| Presets e UI contextual | 1650–1657 | Presets Fosco/Tecido/Couro/Metálico/Brilhante/Tecnológico; só controles compatíveis; sem jargão | **Parcial**: PoC `Estudio3D.tsx:364` sliders metal/brilho (não no shell novo); `VariantesAssets.ts` = presets de COR sem persistência nova | Presets de material = família nomeada; seletor no `DetalheAsset/PropriedadesAsset` (flag) |
| Material inspector + debug views | 1658–1664 | Inspector dev (família, mapas, res, rough/metal, draw calls) e views Albedo/Normal/Roughness/Metalness/AO/Emissive/UV/Lighting Only | **Parcial**: `diagnostico()` (fps, tier, triângulos, drawCalls) + HUD `as5.hud3d` | `Renderizador3d.definirDebugView(modo)` via `scene.overrideMaterial`/material swap; só dev |
| Material QA / hard-soft fail / Golden Material Set | 1665–1677, 1682–1685, 1745–1746 | M01–M12 na mesma luz/câmera, before/after, QA em Studio/Hero/Neon/Portrait, threshold + revisão humana | **Não existe** para material; existem goldens 2D (`golden-avatars.mjs`, 16) e `captura-quality.mjs` | Cena de calibração headless (`scripts/avatar/assets3d/golden-materiais.mjs`) gerando PNGs canônicos + hash/SSIM tolerante |
| Performance budgets + tiers | 1686–1694 | Medir texture memory, shader complexity, overdraw, material count; tiers eco/standard/ultra | **Parcial**: `QualityManager.qualidade()` (eco/equilibrado/alto → tier3d), `Capacidade3d`, LOD por tier (`lodPorQualidade`), `renderer.info` | `diagnostico()` + `renderer.info.memory.textures`/`programs.length`; tier → nível de família (eco = standard material; ultra = physical/shader) |
| Fallback/context loss/missing texture/telemetria | 1695–1700 | Fallback previsível, restore pós context loss, nunca branco/preto sem explicação, eventos de erro | **Parcial**: watchdog `aoRestaurarContexto` reaplica estado; telemetria `p3d_*` existe, sem eventos de material | `onError` do loader → cor do manifest; eventos `p3d_material_erro` |
| Coleções → famílias | 1715–1721 | Cyber/Royal/Urban/Sport apontam para famílias, sem shader por coleção | **Não existe** | Campo `familia` por asset no manifest (dados) |
| 2D Clássico — materialidade | 1722–1735 | Tokens de material 2D (skin/cotton/leather/metal/glass/emissive) via gradiente/highlight/rim/glow; Golden Material Classic; coerência com 3D | **Parcial**: `engine/cores.ts:tinta()` (base/claro/escuro/profundo) único para tudo = "gradiente genérico"; partes desenham gradientes à mão (`acessorios.ts` 100×) | `engine/materiais2d.ts` com presets de acabamento (novas `<defs>` helpers) usados SÓ por artes novas/wrappers |
| Photo Studio | 1736–1744 | Alto LOD/textura/env na captura, portrait skin, product shot, presets de luz material-aware, material inalterado, export transparente premultiplied | **Parcial**: `Palco3d.capturar3d` força tier `alto` + supersampling (`as5.captura3d_v2`), `capturar({transparente})` oculta chão/grade | Presets de luz por material (Parte 8); teste de alpha premultiplicado em bordas de vidro/cabelo |
| Art Bible / anti-patterns / docs | 1747–1748, 1749.21 | Capítulo de materiais + anti-patterns | **Não existe** (`ART-BIBLE.md` não existe em docs/) | `docs/AVATAR-STUDIO-6/ART-BIBLE.md` cap. Materiais (coordenado com Parte 12) |

---

## 3. O que JÁ está coberto e o que é pré-requisito

**Já coberto (referenciar, não refazer):**
- Pipeline único de cor multiplicativo, restauração exata, dedupe, dispose de material+texturas, teto emissivo — `services/Materiais3d.ts` (flag `as5.materiais3d`, teste `materiais3d.mjs`).
- Renderer: sRGB output, ACES, exposure clamp, tone mapping alternativo, PMREM RoomEnvironment, environmentIntensity, bloom sutil + vinheta (`as5.pos3d_real`), sombras por tier, watchdog de contexto, DPR dinâmico — `services/Renderizador3d.ts`.
- Texturas WebP redimensionadas por LOD e validador de teto — `scripts/avatar/assets3d/publicar-asset.mjs`, `validar-asset.mjs`.
- Qualidade: `QualityManager.ts` (as6.quality), `Capacidade3d.ts`, `lodPorQualidade`, captura em tier alto (`as5.captura3d_v2`).
- Licenças rastreadas em `public/assets/avatars/3d/LICENCAS.md` (decisão #28).

**Pré-requisito desta parte para outras:** registry de famílias e debug views alimentam a Parte 8 (luz/HDRI/looks — §1606–§1621 é compartilhado), o Golden Material Set alimenta os Golden Body/Face/Hair/Outfits (Parte 12 ordem §3107: MATERIAL SYSTEM vem depois dos goldens de geometria, mas o REGISTRY é P0 foundation), e o Color Space Contract condiciona Photo Studio/export (Parte 9/10) e thumbs 3D.

**Esta parte depende de:** Art Bible/Quality Bar (Parte 12 P0), Golden Faces (calibrar skin §1530), iluminação (Parte 8) para validar "material sobrevive a várias luzes" (§1621).

---

## 4. Conflitos/risco com regras invioláveis

| Regra | Risco | Contorno |
|---|---|---|
| Byte-stability (render salvo nunca muda) | Aplicar famílias a assets já publicados muda o render de avatares salvos (§1680 reconhece) | Família só aplicada quando (a) manifest do asset declara `familia` (assets novos/versionados) OU (b) flag `as6.material_v2` ligada **e** asset em lista de opt-in versionada (`familiaV2: true`); default = material do GLB intocado; goldens de material capturados antes/depois; nenhum campo novo de estado persistido no MVP (família vem do ASSET, não do save) |
| Campo persistido novo ⇒ PHP espelhado | Preset de material escolhido pelo usuário (Fosco/Metálico) seria estado novo | Fase 1: sem persistência (família do asset); se virar escolha do usuário, campo `materialPreset` opcional omitido quando neutro + espelho em `studio.php` (padrão `AjustesFoto`) |
| Nunca editar arte em `engine/partes/*` | Materialidade 2D (§1722–§1735) tenta "enriquecer" artes existentes | Só helpers novos (`engine/materiais2d.ts`) consumidos por artes NOVAS e wrappers; artes existentes byte a byte |
| Flags `as5.*/as6.*` desligáveis | Registry precisa fail-safe | `as6.material_v2` (registry+famílias), `as6.material_debug` (views/inspector, dev), `as6.material_2d` (tokens 2D), `as6.material_photo`; off = comportamento atual byte a byte |
| Licenças claras | HDRIs curados, detail maps/tiling textures, texturas de pele | Só Poly Haven/ambientCG (CC0) com registro em `LICENCAS.md` antes do commit; sem asset externo até aprovação (ver §6) |
| Bundle/libs pesadas | `MeshPhysicalMaterial`/shaders custom aumentam compile time; KTX2 exige transcoder (basis) | Physical só em Standard/Ultra; KTX2 fica FUTURO (§1584); sem lib nova — tudo three core |
| TypeScript fonte de verdade; `.js` irmão | — | Padrão da casa |
| Cor ≠ estado: PBR-safe colors (§1631–§1634) | Clampar hex salvos quebraria byte-stability | Clamp só no caminho de render 3D de famílias metal/pele (`corPbrSegura`), nunca normaliza o hex persistido; 2D intocado |

---

## 5. Proposta de ondas

### P7-A — Fundação: auditoria + Material Family Registry (P0 · esforço M)
Dependências: nenhuma (abre a Parte 7); alinhado a Parte 12 "MATERIAL SYSTEM"/flags.
1. Script `scripts/avatar/assets3d/auditar-materiais.mjs` — lista por GLB publicado: materiais, mapas, roughness/metalness/emissive/alpha, "≤4 mapas" (§1507, §1749.1). Teste: `testes/materiais-audit.mjs` gera JSON determinístico.
2. `services/FamiliasMaterial.ts` — registry em dados `FAMILIAS_MATERIAL` (§1509–§1511) com `versao`, `aplicarFamilia()`, `familiaDe(material)`; flag `as6.material_v2`.
3. Manifest de parte/personagem ganha `materiais?: Record<nomeMaterial,{familia,overrides?}>` (`Partes3d.ts`, `Personagens3d.ts`, `publicar-asset.mjs --materiais`) (§1512, §1518, §1703). Byte-stability: sem campo = intocado.
4. `Materiais3d.aplicarPipelineCores` passa a chamar `aplicarFamilia` ANTES do tint, respeitando `naoTingir` (§1514–§1516). Unificar passo 5 do `Assembler3d` (pele) no pipeline multiplicativo.
5. `Acessorios3D.tsx` e `Cena3D.tsx` (PoC) trocam valores hardcoded por `FAMILIAS_MATERIAL.gold/metal_brushed/…` (§1510) — só se render idêntico (mesmos valores).
6. Canais internos ricos → 4 canais §73 (`canalPublico()`), sem persistência nova (§1517).
7. `docs/AVATAR-STUDIO-6/ART-BIBLE.md` cap. Materiais v0 + anti-patterns (§1747–§1748).
8. Teste `testes/familias-material.mjs`: idempotência, restore, flag off = byte a byte, auditoria ok.

### P7-B — Golden Material Set + cena de calibração + debug views (P0 · esforço M)
Dependências: P7-A; luz neutra de estúdio (Parte 8 pode refinar depois).
1. `scripts/avatar/assets3d/golden-materiais.mjs` — cena headless (esferas + cabeça UBC + amostras) com luz/câmera canônica (§1613–§1616, §1675) gerando M01–M12 (§1674) em PNG + hash/SSIM tolerante (§1684–§1685). Flag de build, não runtime.
2. `Renderizador3d.definirDebugView('albedo'|'normal'|'roughness'|'metalness'|'ao'|'emissive'|'uv'|'luz')` via `scene.overrideMaterial`/swap (§1659–§1664), flag `as6.material_debug` (dev, default OFF como `as5.hud3d`).
3. `diagnostico()` += `texturas`, `programas`, `materiais`, `transparentes` (§1686–§1690) → HUD.
4. Inspector dev no `Palco3d` (família/mapas/res/rough/metal/drawCalls) (§1658).
5. Alinhar `gerar-thumbs-3d.mjs` ao viewport (ACES + RoomEnvironment) (§1625); teste compara thumb×captura.
6. Doc `docs/AVATAR-STUDIO-6/COLOR-SPACE-CONTRACT.md` + `TEXTURE-MAP-CONTRACT.md` (§1572–§1580, §1622–§1624, §1702–§1705; ou capítulos do ART-BIBLE).
7. Telemetria `p3d_material_erro` (missing map/decode/shader) (§1700) + fallback cor do manifest (§1698–§1699).
8. Testes: `testes/material-debug.mjs` (views trocam e voltam sem vazar), `testes/golden-materiais.mjs`.

### P7-C — Skin + Hair (P1 · esforço G)
Dependências: P7-A/B; Golden Faces (Parte 3/12) para calibrar.
1. Família `skin` 3 tiers (§1519–§1529): eco = Standard (roughness ~0.55, normalScale baixo); standard = + micro-normal/AO leve; premium = `MeshPhysicalMaterial` com sheen/`specularIntensity` (SSS-lite §1526). Tier vem de `QualityManager`/`tierEfetivo()`.
2. Mesmo tom em todos os tiers: teste de ΔE médio entre capturas por tier < limiar (§1529).
3. Família `hair`: alpha policy por manifest (`alphaTest`/`transparent`/`depthWrite`), anisotropy só Ultra (§1531–§1536), rim (§1642).
4. Não tingir olhos/dentes (`naoTingir` por nome/manifest) (§1516).
5. Golden M01–M03 + hair na cena de calibração; QA em Studio/Hero/Neon/Portrait (§1665).
6. Context-loss: teste reaplica famílias após `webglcontextrestored` (§1696–§1697) em `testes/retomada-3d.mjs`.

### P7-D — Fabrics, Leather, Rubber/Plastic, Metals (P1 · esforço M)
Dependências: P7-A/B.
1. Defaults cotton/denim/wool/knit/satin/silk/technical/rubber/plastic_matte/plastic_gloss (§1537–§1548).
2. leather_matte/polished/worn (§1541–§1542).
3. metal_brushed/polished, gold/silver/bronze com cores PBR-safe (`corPbrSegura`) (§1549–§1554, §1631–§1635); painted metal = família + tint (§1555).
4. Detail/tiling maps opcionais só com assets CC0 registrados (§1592–§1595) — pula se sem assets (ver §6).
5. Goldens M04–M09; hard-fail checks (§1672) automatizados onde mensurável (roughness média, metalness bimodal §1707).
6. Coleções → famílias em dados (`familiaPadraoPorColecao`) (§1715–§1721).

### P7-E — Glass, Crystal, Hologram, Energy, Emissive discipline (P1 · esforço G)
Dependências: P7-A/B; bloom (as5.pos3d_real) e Parte 8 para looks.
1. `glass_clear/frosted/tinted` via `MeshPhysicalMaterial.transmission` no Standard/Ultra; eco = `transparent+opacity` (§1557–§1562).
2. `crystal` (transmission + emissive + env) (§1563).
3. `hologram`/`energy` como `ShaderMaterial` leve (fresnel/scanline/flow/noise) só Ultra; fallback emissive Standard (§1564–§1566, §1695).
4. Emissive budget por raridade/cena (`orcamentoEmissivo`) + bloom seletivo (layer/threshold por look) (§1567–§1571).
5. Validação de emissive/alpha maps no publicador (§1709–§1710).
6. Goldens M10–M12; teste "bloom não vaza em superfícies normais" (luminância média fora do emissive).

### P7-F — Texture pipeline, LOD material strategy, perf budgets (P1 · esforço M)
Dependências: P7-A.
1. `validar-asset.mjs`: mapas por função, color space, normal convention, roughness range, metalness ~0/1, AO strength, alpha (§1701–§1710).
2. `TEXTURA_MAX` por categoria (face > acessório pequeno) (§1586–§1588).
3. `texture.anisotropy` por tier + mipmaps garantidos (§1712–§1714).
4. Material por LOD: famílias simplificadas no lod2 sem mudar identidade (§1670, §1672 "muda radicalmente entre LODs").
5. `PerfBaseline`/`diagnostico`: texture memory, programs, overdraw aproximado (§1686–§1690) com budgets em `docs/AVATAR-STUDIO-6/PERFORMANCE-BUDGETS.md` (Parte 12).
6. KTX2 registrado como futuro (§1584) — sem implementação.

### P7-G — UX de material + 2D Clássico + Photo Studio (P1/P2 · esforço M)
Dependências: P7-A/C/D; Parte 8 (presets de luz); Parte 9/10 (foto).
1. Presets amigáveis Fosco/Tecido/Couro/Metálico/Brilhante/Tecnológico no `DetalheAsset/PropriedadesAsset`, UI contextual por tipo (§1650–§1657), flag `as6.material_ui`; SEM persistência na fase 1 (preview); se persistir → campo opcional omitido + PHP.
2. Lerp curto de cor/roughness (tier ≠ eco) + hover preview + undo (§1644–§1649).
3. `engine/materiais2d.ts` — tokens de acabamento 2D (skin/cotton/leather/metal/glass/emissive) como helpers de `<defs>` para artes NOVAS/wrappers (§1722–§1731), flag `as6.material_2d`; Golden Material Classic (§1735) via harness.
4. Photo: presets de luz material-aware (metal showcase/skin portrait/fabric studio) (§1740); material inalterado na foto (§1741); teste alpha premultiplicado em bordas de vidro/cabelo (§1743–§1744).
5. Before/After pack (§1676–§1677) + Visual QA checklist `docs/AVATAR-STUDIO-6/VISUAL-QA.md` cap. materiais (§1749.22).

Resumo: 7 ondas (P7-A..G), ~45 tarefas; P0 = A, B; P1 = C, D, E, F; P1/P2 = G.

---

## 6. Perguntas bloqueantes × decisões tomadas

**Bloqueantes (precisam do Jhony):**
1. **HDRIs curados (§1608–§1610)** — baixar 3–4 HDRIs CC0 (Poly Haven) ≈ 1–3 MB cada no `public/`: aprovar custo de peso/licença e registro em `LICENCAS.md`? Sem aprovação, P7-B/E seguem só com RoomEnvironment.
2. **Texturas de detalhe/tiling (tecido, couro, metal escovado) e mapa de variação regional de pele** — assets externos CC0 (ambientCG/Poly Haven) ou gerados proceduralmente no pipeline? Se externos: aprovar origem; se procedurais: sem bloqueio.
3. **Persistência de preset de material escolhido pelo usuário** — aceitar campo novo opcional (`materialPreset`) no estado + PHP, ou manter material 100% derivado do asset? (Fase 1 segue sem persistência.)
4. **Aplicar famílias v2 aos assets UBC já publicados** (muda render em produção de avatares salvos — §1680): aprovar após Golden before/after, ou só assets novos/versionados?

**Resolvidas sozinho (registrar como decisões #):**
- Família de material vem do ASSET (manifest), não do estado salvo → byte-stability preservada; estado não ganha campo.
- Tiers de material seguem `QualityManager`/`tierEfetivo()` existentes (eco/medio/alto ↔ Econômico/Standard/Ultra do briefing) — sem novo sistema de tier.
- Debug views/inspector ficam em flag dev default OFF (padrão `as5.hud3d`).
- `MeshPhysicalMaterial` permitido (three core, sem lib nova); `ShaderMaterial` custom só hologram/energy no Ultra com fallback.
- KTX2/UDIM não entram (§1584, §1591).
- PBR-safe color clamp aplicado só no caminho de render 3D de famílias metal/pele; hex salvo nunca é alterado.
- Thumbs 3D passam a usar ACES+env (mudança de thumb, não de avatar salvo — thumbs são derivados regeneráveis).
- 2D: nenhum gradiente existente muda; tokens só para artes novas/wrappers.

---

## 7. Métricas / Acceptance da Parte 7

- `FAMILIAS_MATERIAL` existe com ≥ 20 famílias versionadas; zero `metalness=`/`roughness=` literal fora do registry em `src/` (grep na suíte).
- Flag `as6.material_v2` OFF ⇒ 16 goldens 2D + capturas 3D de referência byte a byte iguais (`golden-avatars.mjs`, `captura-quality.mjs`).
- Golden Material Set M01–M12 gerado headless na mesma luz/câmera, com hashes/SSIM no repo (`docs/AVATAR-STUDIO-6/golden-materiais.json`); regressão visual roda em `rodar-todos.mjs`.
- Skin: ΔE médio entre tiers eco/standard/premium < limiar definido (mesma identidade §1529); 3 tons × 4 luzes sem hard-fail (§1665, §1672).
- Cor customizada preserva `map/normalMap/roughnessMap` (teste existente estendido) — 0 materiais com mapa perdido após tint.
- Emissive: nenhum material acima de `TETO_EMISSIVO`; bloom não altera luminância média de superfícies não-emissivas > tolerância.
- Color management: thumb 3D × captura do viewport com histograma dentro de tolerância; data maps lineares (checado no validador).
- Publicador reprova mapas fora do contrato (tamanho/LOD/alpha/normal/roughness/metalness) — teste `pipeline3d.test.mjs` ampliado.
- Context loss: famílias e texturas reaplicadas após `webglcontextrestored` (teste `retomada-3d.mjs`).
- Perf: `diagnostico()` reporta texturas/programas/materiais; budgets documentados e verdes no tier médio (60 fps desktop / 30 mobile mantidos).
- Docs entregues: ART-BIBLE (cap. materiais + anti-patterns), contratos de mapas e color space, VISUAL-QA materiais; QA Score §1745 preenchido ≥ 8/10 em todos os eixos na validação do Jhony.
- Gate §1751 aprovado (REGISTRY+SKIN+HAIR+FABRIC+METAL+GLASS+COLOR MGMT+VISUAL QA) antes de qualquer escala de biblioteca premium.
