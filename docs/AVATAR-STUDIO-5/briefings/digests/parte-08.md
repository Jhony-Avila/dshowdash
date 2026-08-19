# Digest — MEGA_BRIEFING_01 · PARTE 8/12 (§1753–§2033)
## Iluminação cinematográfica, sombras, ambiente/HDRI, câmera, enquadramento, profundidade, pós-processamento, tone mapping e looks premium

Fonte: `docs/AVATAR-STUDIO-5/briefings/MEGA_BRIEFING_01.md` linhas 20161–22500. Código auditado em 2026-08-19 (main b0331d62).

---

## 1. Resumo executivo

A Parte 8 não pede um renderer novo: pede **direção cinematográfica consistente** sobre a infra que já existe (`Renderizador3d.ts`: ACESFilmic + exposição 0.6–1.6, `RoomEnvironment` via PMREM, shadow map PCFSoft 1024, `EffectComposer` + `UnrealBloomPass` sutil, captura determinística com supersampling). O que falta é **estrutura**: hoje há TRÊS vocabulários de luz desconexos (PoC `Cena3D.LUZES` estudio/dramatica/neon; palco do shell `Renderizador3d.definirLuz` estudio/quente/fria/neon; 2D `workspace/palco.ts LUZES_PALCO` neutra/quente/fria/dramatica), nenhum Lighting Registry, nenhum look com versão, parâmetros espalhados em `Cena3D.tsx`, `Renderizador3d.montar()`, `scripts/avatar/assets3d/gerar-thumbs-3d.mjs` (que nem usa tone mapping — thumb ≠ palco, ferindo §1880). Câmera: presets existem (`CAMERAS` por arquétipo na PoC; `definirCamera` retrato/corpo/orbita/cinematica + `enquadrar()` Box3 no shell; `ENQUADRAMENTOS`/`PRESETS_CAM6` no 2D), mas sem FOV por preset, sem limites polares no `OrbitControls` do shell (câmera atravessa o chão, §1838), sem framing bounds-aware para asas/pet, e o `Palco3d.tsx` **re-aplica `definirCamera` a cada mudança de `estado`** (reset constante, §1843). Sombras: real por tier + disco fake no econômico, mas mapSize fixo, bias fixo, shadow camera não segue o Box3, sem contato de cabelo/roupa. Pós: composer fixo (bloom 0.32/0.5/0.85 + vinheta) ou CSS filter; sem color grading, sem cadeia documentada, sem restauração do composer em context loss. Photo Studio: formatos 1:1/3:1/4:1/16:9 (faltam 4:5 e 9:16), grade/safe (falta regra dos terços), sem lentes nem look por preset. QA: testes são de CONTRATO (palco3d-v2/cine, pos3d-real, captura-quality); não há Golden Lighting, nem regressão visual 3D, nem matriz pele×look. Plano: 6 ondas (P8-A…P8-F), começando pela auditoria + Registry + Studio byte-idêntico + baseline de imagens, seguindo a ordem §2031 e o gate §2032.

---

## 2. Demandas agrupadas por tema

| Tema | §§ | O que o briefing pede | Estado no código HOJE | Lacuna |
|---|---|---|---|---|
| Lighting System / Registry | 1756–1767, 2001–2006 | Presets oficiais Studio/Portrait/Hero/Dramatic/Neon/Soft/Product; definição central `LightingPreset{id,key,fill,rim,environment,exposure,background}`; versionados; sem hardcode em 20 componentes | **parcial** — `poc3d/Cena3D.tsx:LUZES` (3 presets, hemisphere+key+fill+point rim 'destaque'); `services/Renderizador3d.ts:definirLuz()` (4 presets só cor/intensidade); `Renderizador3d.montar()` luzes canônicas fixas (chave 0xffffff 2.6 · preencher 0x9db4ff 1.1 · ambiente 0.55); `definirRim()` pos fixa | Nenhum registry; 3 vocabulários; rim/ambiente/exposição/fundo independentes do preset; sem versão |
| Key/Fill/Rim, resposta de pele/metal/vidro | 1768–1774 | Rig real por look; rim mais forte em cabelo escuro com limite; pele não estoura em Hero/Neon | **parcial** — rim só via toggle "Aro" (`Palco3d.tsx` estado `rim`, flag as5.palco3d_v2); `Materiais3d.ts:TETO_EMISSIVO=2` | Sem regra de rim por cabelo; sem guarda de pele por look |
| Shadow System | 1775–1789 | Contact/foot/hair/clothing shadow; softness por look; resolução por tier; bias padronizado; AO sutil opcional; sem cascade | **parcial** — `Renderizador3d.atualizarSombras()` (real fora do econômico; fake = `chao` disco 0.34; `chaoSombra` ShadowMaterial 0.32; mapSize 1024 fixo; bias default; shadow cam near 0.5/far 12 fixos) | mapSize/bias por tier e look; shadow camera ajustada ao Box3; contato sempre (mesmo econ); sem AO |
| Ground / Platform / Stage identity | 1790–1795 | Chão ancora; materiais studio_matte/gloss/platform/grid; reflexo só em looks especiais | **parcial** — `definirFundo()` neutro/estudio/grade (`GridHelper`); PoC tem disco + aro `ringGeometry` na cor de destaque | Sem materiais de chão; sem plataforma no shell |
| Background layering / HDRI / Environment | 1796–1808 | Fundo separado do environment; HDRIs curados (license tracking, resolução); intensidade por preset; theme-aware | **parcial** — `cena.environment` = `RoomEnvironment` PMREM, `environmentIntensity` 0.55, `definirAmbiente()` 0–1.2; background = cor sólida | Sem HDRI real; sem gradiente/geometria de profundidade; intensidade não vem do look |
| Camera presets / FOV / framing | 1809–1830, 1846–1850 | Full/¾/Bust/Portrait/Face/Accessory/Back/Photo; FOV por preset (retrato ≈85mm); headroom/eye-line; bounds/accessory/morph-aware; near plane | **parcial** — PoC `catalogo3d.ts:CAMERAS` (4×3 arquétipos, fov 34); shell `definirCamera()` (retrato/corpo/orbita/cinematica sobre Box3, fov 32, near 0.01) + `enquadrar('auto'|'rosto')` com bone Head; 2D `ShellStudio.tsx:ENQUADRAMENTOS`+`PRESETS_CAM6` (as6.viewport), `PalcoCinema.tsx:CAMERA_BUSTO/CORPO` | Sem Face/Back/Accessory; FOV único; sem framing por socket (back/pet/companion); morph via `corpo3d` não entra no framing |
| Camera by category | 1818 | Hair→Bust, Eyes→Face, Mouth→FaceDetail, Clothing→¾, Shoes→Lower, Back→Back, Pet→Wide | **parcial** — só 2D (`ENQUADRAMENTOS` por categoria) | 3D não reage à categoria/slot ativo |
| Transições, orbit, limites, estado | 1831–1845, 1890, 1999 | Curtas, easing, interruptíveis; limites min/max/polar; não entrar no rosto nem no chão; bookmarks; não resetar câmera; zoom no rosto | **parcial** — PoC `CameraRig3D.tsx` lerp 0.09 + `OrbitControls` polar 0.15–π/2+0.08; shell `OrbitControls` min 0.6/max 8 **sem polar**; `Palco3d.tsx` useEffect reaplica `definirCamera` a cada `estado` | Reset constante; sem limites polares no shell; transição sem duração-alvo; sem bookmarks |
| DOF / motion blur / vinheta / bloom / CA / grain | 1851–1863 | DOF só Photo/Ultra, foco nos olhos; vinheta sutil; bloom só emissive/neon com threshold; sem CA/grain no editor | **parcial** — `definirPos()` composer (bloom 0.32/0.5/0.85 + vinheta shader 25%) ou CSS `saturate(1.12) contrast(1.05)`; foto 2D tem `vinheta`/`granulacao` em `render-foto.ts` | Bloom não por look; sem DOF; sem threshold por look |
| Color grading / tone / exposure / color space | 1864–1884 | LUTs leves por look preservando pele; ACES baseline; modos só Dev; exposure por look com clamp; sem auto-exposure; SRGB; thumb/preview/captura consistentes; alpha edge | **parcial** — ACES + `definirExposicao` (0.6–1.6) + `definirTonemapping` (aces/agx/neutro/reinhard **exposto ao usuário** no grupo Cinema); SRGB ok; `gerar-thumbs-3d.mjs` **sem tone mapping/environment** → thumb ≠ palco | Sem grading; tone modes devem ir p/ Dev; thumbs inconsistentes |
| Atmosfera / fog / parallax / intro | 1885–1893 | Fog só Hero/Fantasy; camadas de profundidade; câmera estável; intro curta opcional | **parcial** — PoC `<fog>` sempre; 2D parallax no `PalcoCinema`; showcase §174 = intro manual | Fog não condicionada a look no shell (não existe fog no shell) |
| Photo Studio cinematography | 1894–1916 | Lentes Portrait/Full/Fashion/WideHero/Profile/Close-up; guias (terços/centro/safe); aspect 1:1/4:5/16:9/9:16; câmera adapta ao aspect; luz por preset; captura alta com restore; determinística | **parcial** — `render-foto.ts:FORMATOS_FOTO` perfil/header/banner/wallpaper; `Foto.tsx` grade/safe/guias (as5.foto_canvas_pro); `escolher3d()` captura 960 superAmostra 2 (as5.foto3d); `capturar()` deterministica + camera + superAmostra (as5.captura3d_v2) | Sem 4:5/9:16; sem terços; sem lentes; sem look por preset; sem sombra alta na captura |
| Golden Lighting / matriz / scores | 1917–1925, 2007–2012, 2023–2024 | Renders padrão por look × golden avatars × materiais; hard/soft fails; screenshot automation; regressão de luz/câmera; snapshot metrics | **não existe** — testes são de contrato (`palco3d-v2.mjs`, `palco3d-cine.mjs`, `pos3d-real.mjs`, `captura-quality.mjs`); `golden-avatars.mjs` = hash SVG 2D | Baseline de imagem 3D + metadados |
| Quality tiers / degradação / histerese | 1926–1941, 1983–1996, 2014–2022 | Econ/Standard/Ultra com key sempre; shadow reduz primeiro; bloom desliga; DOF Photo/Ultra; histerese; bypass do composer; safe mode; seletor simples; Dev panel | **parcial** — tier adaptativo (<30/>55 fps), `passoDpr`, perfis Ultra/Cine (as5.quality3d_v2), `QualityManager.ts` auto/eco/equilibrado/alto (as6.quality), `Capacidade3d.ts`; composer só fora do econ; HUD as5.hud3d | Degradação não é por "pass"; Parte 12 pede AUTO/ECONOMY/STANDARD/ULTRA(+PHOTO) — mapear; sem toggles de pass Dev |
| Context loss / fallback | 1996–1997, 2015–2016 | Restaurar environment/composer/tone/sombras; nunca cena vazia | **parcial** — watchdog `aoPerderContexto/aoRestaurarContexto` reaplica estado | Composer/render targets não recriados; sem teste |
| Classic 2D equivalentes | 1950–1961 | Key/rim/contact shadow/ground/depth; Hero/Neon/Portrait 2D; mesma nomenclatura | **parcial** — `LUZES_PALCO` via CSS filter (`estudio.css` 1251–1253), hora/clima/fundos, `luzInt` (as5.palco_sensorial), `LUZ_POR_HORA` (as5.luz_contextual); contact shadow só no `PalcoCinema` (`.avst-cine-sombra`), novo shell só `drop-shadow` | Sem sombra de contato no shell novo; sem rim 2D; nomes divergem do 3D |
| Transições de look / preset completo | 1962–1969 | Fade, interpolação de luz, sem flash; preset cinematográfico = camera+lighting+env+background+post+pose | **parcial** — `Cenas3d.ts` snapshot (fundo/luz/camera/qualidade) sem interpolação; `Roteiros.ts` luz/fundo só no showcase | Sem interpolação; sem look completo versionado |
| Harmonia de cor / contraste automático | 1970–1979 | Não tudo roxo; ajustar fundo/rim, nunca o avatar | **não existe** | Helper opcional P2 |
| Art Bible / anti-patterns / Before-After | 2028–2031, 1947–1949 | Capítulo de luz/câmera/exposição/sombra/fundo/pós/foto; comparação mesmo avatar | **não existe** (Parte 12 exige ART-BIBLE.md) | Documento |

---

## 3. Já coberto × prerequisito

**Coberto (referenciar, não refazer):** ACES + SRGB + exposição clampada (`Renderizador3d.montar/definirExposicao`); environment procedural (`RoomEnvironment`, `definirAmbiente`); shadow real por tier (`atualizarSombras`); composer bloom+vinheta (`definirPos`, flag as5.pos3d_real) com bypass CSS e sem nada no econômico (§177.1 = §1995); captura determinística/transparente/supersampling/câmera própria/restauro de tamanho (`capturar`, as5.captura3d_v2, as5.foto3d); tier adaptativo com histerese + DPR dinâmico suave (`passoDpr`, as5.quality3d_v2); Quality Manager central (as6.quality); watchdog de contexto; presets de câmera por arquétipo (PoC) e `enquadrar()` por Box3/bone Head; câmera 2D por categoria (`ENQUADRAMENTOS`) + presets manuais (as6.viewport); Photo Studio com grade/safe/guias/formatos wide; cenas salvas (`Cenas3d`), roteiros; 2D luz/hora/clima/fundos.

**Prerequisito de outras partes:** o Lighting Registry + Studio neutro é o QA de todas as partes de conteúdo (Parte 4–7 golden body/face/hair/outfits; §2027 "QA continua usando Studio neutro"); Golden Lighting + snapshot metrics alimentam a Parte 12 (GOLDEN-TESTS.md, VISUAL-QA.md); câmera bounds/accessory-aware depende do Assembler/sockets (Parte 7) e é pré-requisito da Parte 9 (VFX/cenários — §2025 "background expansion depois"); captura alta é pré-requisito de Vitrine/Hero (Parte 10/11).

---

## 4. Conflitos/risco com as regras invioláveis

| Regra | Risco | Contorno |
|---|---|---|
| Byte-stability | `Config3D.iluminacao/camera` são PERSISTIDOS (`catalogo3d.ts:validarConfig3d` + `api/avatar/studio.php:avst_validar_config3d`). Trocar o significado de 'estudio' muda render de config salva; thumbs regeneradas mudam imagens do catálogo | Look `estudio` v1 = valores ATUAIS byte-idênticos (luzes canônicas) — Studio "novo" entra como `estudio_v2`/id novo; enum PHP só CRESCE; captura guarda `look.version` nos metadados (§2001–2003); thumbs: regenerar em commit próprio e declarado (são imagens de catálogo, não avatar salvo) |
| Arte em partes/* | 2D rim/contact shadow poderiam tentar editar SVGs | Só wrappers: overlay SVG/CSS no palco (`.avst5-palco`), nunca em `engine/partes/*`; golden-avatars (hash SVG) deve seguir verde |
| Flags | Muitas flags 3D já existem (as5.palco3d_v2/_cine/pos3d_real/quality3d_v2) | Novas: `as6.looks` (registry+aplicarLook), `as6.camera_v2`, `as6.sombras_v2`, `as6.pos_v2` (grading/cadeia), `as6.foto_lentes`, `as6.classico_luz`, `as6.dev_iluminacao` (debug). Todas filhas de as5.palco3d onde 3D (tabela de pais em `flags.ts`) |
| PHP espelhado | Novos valores de `iluminacao`/`camera` no Config3D; foto com `formato` novo (4:5/9:16) se persistir | Estender enums em `avst_validar_config3d`; formatos de foto são locais (projetos em localStorage) — confirmar em `ProjetosFoto.ts` antes |
| Licenças/bundle | HDRI (.hdr/.exr) = peso + licença; LUT 3D .cube = asset | Fase 1 SEM HDRI (RoomEnvironment já cobre §1805); LUT como shader paramétrico (sem textura); HDRI só com Poly Haven CC0 1k (~300 KB) e aprovação do gate de peso — pergunta bloqueante |
| Sem libs novas | SSAO/DOF (`SSAOPass`/`BokehPass`) vêm do three/examples (já dependência) | OK sem lib nova; custo = pass; manter Photo/Ultra only e atrás de flag |
| Determinismo | Bloom/DOF dependem de resolução; SwiftShader ≠ GPU real | Goldens de imagem com tolerância perceptual + snapshot de MÉTRICAS (exposição/fov/pos/luzes) exato; imagem só em viewport fixo (§2011) |

---

## 5. Proposta de ondas

### P8-A — Auditoria + Lighting Registry + Studio/Portrait + baseline (P0/P1, esforço M)
Objetivo: uma fonte de verdade de looks, sem mudar um pixel do que existe; infra de golden de luz.
1. Auditoria do lighting atual (§2030.1): doc curto em `docs/AVATAR-STUDIO-5/` listando luzes/valores por caminho (Cena3D, montar(), definirLuz, thumbs, CSS 2D). Flag: n/a.
2. `services/Looks3d.ts` (§1765–1767, §2004): `interface Look{id,versao,key,fill,rim?,ambiente,exposicao,fundo,sombra,pos,cameraSugerida}` + `LOOKS` com `estudio` v1 = valores canônicos atuais; `Renderizador3d.aplicarLook(id)` chama definirLuz/Rim/Ambiente/Exposicao/Fundo. Flag `as6.looks`. Teste: `looks3d.mjs` — `aplicarLook('estudio')` deixa luzes idênticas ao montar() (contrato).
3. Look **Portrait** (§1759, §1825): fill mais alto, rim suave, câmera `retrato`, exposição 1.05. Teste de contrato + entrada no golden.
4. Unificar vocabulário (§1960): `definirLuz` e `LUZES_PALCO` 2D mapeiam para ids do registry (aliases `quente→soft`, `dramatica→dramatic`) sem mudar CSS/valores. Teste: mapa bijetivo.
5. Mover chips de tone mapping (aces/agx/neutro/reinhard) para `as6.dev_iluminacao` (§1872); usuário vê só look + exposição. Rollback: flag off = UI atual.
6. Thumbs consistentes (§1880): `gerar-thumbs-3d.mjs` ganha ACES + RoomEnvironment 0.55 (mesmos valores do look estudio); regenerar thumbs em commit próprio. Teste `assets3d.test.mjs` confere metadados `look:'estudio@1'` no manifest.
7. **Golden Lighting infra** (§1917–1920, §2007–2011): `scripts/avatar/testes/golden-iluminacao.mjs` — renderiza manequim + golden avatars (quando houver) × looks em viewport fixo 512, salva PNG em `docs/AVATAR-STUDIO-6/golden-iluminacao/` + `golden-iluminacao.json` com métricas (§2010: exposição, fov, pos, env, luzes); compara com tolerância; `--gravar` regenera (doutrina #83).
8. Snapshot metrics API: `Renderizador3d.diagnostico()` ganha `look, exposicao, fov, cameraPos, luzes[]` (§2010). Teste no golden.
9. Before/After (§1947): página do harness `avst-harness.html?comparar=estudio,portrait` lado a lado mesmo avatar — validação visual do Jhony.
Dependências: nenhuma. Prioridade P0 (baseline/registry) + P1 (Portrait).

### P8-B — Câmera v2 (P1, esforço G)
Flag `as6.camera_v2` (filha de as5.palco3d).
1. `services/Camera3d.ts`: presets `corpo|tresquartos|busto|retrato|rosto_detalhe|costas|acessorio|foto` com `fovVertical` (retrato/rosto 24°, busto 28°, corpo 32–34°), `headroom`, `eyeLine` (§1810–1825); `definirCamera` aceita `preset` e resolve por Box3 + bone Head (reusa `enquadrar`). Teste: matriz male/female/tall/wide via `definirCorpo3d` — cabeça e pés dentro do frame (§1846).
2. Bounds/accessory-aware (§1826–1830): Box3 inclui `props3d` (pet/companion) e partes montadas; socket `back` equipado → preset `costas` amplia. Teste com `definirProp3d('pet')`.
3. Category-aware no shell (§1818): `Palco3d` recebe categoria ativa → preset (cabelo→busto, olhos/boca→rosto, roupa→¾, back→costas, pet→corpo wide). Teste UI harness.
4. Não resetar câmera (§1842–1843): efeito em `Palco3d.tsx` só chama `definirCamera` quando `personagem`/`cameraModo` mudam (não a cada `estado`); órbita manual preservada ao equipar. Teste: equipar item não altera `camera.position`.
5. Limites (§1836–1838): `OrbitControls` do shell com `minPolarAngle/maxPolarAngle` (chão) e `minDistance` por preset (rosto ≥0.35); near 0.05 em close-up (§1848). Teste de contrato.
6. Transição curta e interrompível (§1831–1834): lerp com duração-alvo 300 ms e cancel em `onStart` (igual `CameraRig3D`). Teste: posição converge < 400 ms; drag interrompe.
7. Bookmarks (§1841): 4 chips Full/Bust/Face/Back no palco; estado local (não persiste no avatar, §1999). Teste UI.
8. PoC `CameraRig3D`/`catalogo3d.CAMERAS` passam a ler de `Camera3d.ts` (fallback aos valores atuais se flag off) — zero mudança de render salvo.
9. Câmera 2D: adicionar `rosto_detalhe` e `costas` ao `PRESETS_CAM6`? — só se houver arte de costas (não há): registrar como lacuna; manter mapa de nomes compartilhado (§1959).
Dependências: P8-A (registry, golden). Prioridade P1.

### P8-C — Sombras, chão, ambiente (P1, esforço M)
Flag `as6.sombras_v2`.
1. Shadow por tier (§1782, §1931): mapSize 512/1024/2048 (econ/médio/alto-ultra), `shadow.camera` ajustada ao Box3 do personagem (+props), bias/normalBias padronizados no look (§1785). Teste: contrato lê `shadow.mapSize` por tier; golden.
2. Contact shadow sempre (§1776–1777, §1929): disco fake vira gradiente radial procedural (CanvasTexture) e coexiste com sombra real em baixa opacidade; nunca ausente. Teste: no econômico `chao.visible`.
3. Softness por look (§1781): `radius`/PCFSoft no Studio, mais definida no Hero.
4. Chão/plataforma (§1790–1794): `definirChao('studio_matte'|'studio_gloss'|'platform'|'grid')`; gloss com `MeshStandardMaterial` roughness 0.35 + env (sem reflexo planar). Teste de contrato.
5. Background ≠ environment (§1806): `definirFundo` aceita gradiente (CanvasTexture 2 cores) além de cor; environment continua RoomEnvironment; intensidade vem do look (§1807).
6. Hair/clothing shadow (§1779–1780): garantir `castShadow` nas partes do Assembler (`montarPersonagem`) e props; teste no `assembler.mjs`.
7. Estratégia HDRI (§1802–1805): documentar decisão — fase 1 sem HDRI; preparar `definirEnvironment(url|null)` com PMREM de `RGBELoader` atrás da flag, assets só após aprovação.
8. Fog só fora do Studio (§1886–1887) — no shell não existe fog: adicionar `fog` opcional por look (Hero) com cor = fundo.
Dependências: P8-A. Prioridade P1.

### P8-D — Hero/Dramatic/Neon/Product + pós v2 + color grading + Dev (P1, esforço G)
Flags `as6.looks` (novos ids) + `as6.pos_v2` + `as6.dev_iluminacao`.
1. Looks Hero/Dramatic/Neon/Product/Soft (§1760–1764): entradas no registry (key direcional + rim forte / fill baixo / luzes coloridas + bloom / iluminação de produto / amigável). Enum PHP `iluminacao` ESTENDIDO (hero, dramatica já existe, neon existe, produto, suave, retrato). Teste de contrato + golden por look.
2. Cadeia de pós documentada (§1993): Render → (AO opcional, desligado) → Bloom → ColorGrade → Vignette → Output em `definirPos`; bloom strength/threshold por look (§1859–1861) — neon 0.5/0.75, studio 0 (bypass).
3. Color grading (§1864–1870): `ShaderPass` paramétrico (saturation/contrast/lift-gamma-gain leves) por look, com proteção de pele (clamp de saturação em matiz 15–50°). Teste: pixel de pele de referência varia < Δ tolerância entre studio e hero.
4. Exposição por look (§1873) dentro do clamp existente; slider do usuário multiplica.
5. Composer em context loss (§1997): recriar `EffectComposer` e `setSize` em `aoRestaurarContexto`; teste forçando `WEBGL_lose_context`.
6. Safe mode (§2016): falha no composer → `composerReal=false` já; adicionar telemetria `p3d_pos_fallback`.
7. Dev panel (§1939–1946, §2019): sob `as6.dev_iluminacao` — toggles de pass, `DirectionalLightHelper`/`CameraHelper` da sombra, leitura de exposição/tone/DPR/LOD/FPS (reusa HUD as5.hud3d).
8. Degradação por pass (§1926–1935): econ = sem bloom/grading, shadow 512; padrão = tudo sutil; ultra = 2048 + pós completo; DOF fora. Mapear perfis Parte 12 (AUTO/ECONOMY/STANDARD/ULTRA) ↔ `QualityManager` (auto/eco/equilibrado/alto) — só rótulos.
Dependências: P8-A, P8-C. Prioridade P1.

### P8-E — Photo Studio cinematography (P1, esforço M)
Flag `as6.foto_lentes`.
1. Lentes (§1895–1900): `LENTES_FOTO` Portrait/Full/Fashion/WideHero/Profile/Close-up → `OpcoesCaptura.camera` + fov (via P8-B). Teste `foto-lentes.mjs`.
2. Aspect ratios 4:5 e 9:16 (§1903–1906) em `FORMATOS_FOTO` (render-foto) — câmera adapta (§1904) recalculando framing por aspect, não cortando. Verificar persistência de `formato` (ProjetosFoto) → validação.
3. Guias: regra dos terços + centro (§1901) ao lado de grade/safe existentes.
4. Look por lente (§1910): cada lente sugere look (Portrait→portrait, WideHero→hero).
5. Captura alta (§1911–1915): durante `capturar` com `superAmostra`, elevar shadow mapSize e ligar pós só na captura; restaurar tier/DPR (já) — teste de restauro.
6. Determinismo (§1916): teste compara hash de duas capturas seguidas (mesmo estado/look/câmera) no SwiftShader.
7. DOF (§1851–1855): avaliar `BokehPass` só em captura Ultra/Photo com foco no bone Head — **P2**, só se custo aceitável; registrar decisão.
8. Persistência de câmera da foto (§2000) no projeto de foto (local).
Dependências: P8-B, P8-D. Prioridade P1 (DOF P2).

### P8-F — Classic 2D, transições, Art Bible, gate (P1, esforço M)
Flags `as6.classico_luz`.
1. Contact shadow 2D no shell novo (§1953–1954): elipse radial sob o avatar em `.avst5-palco` (wrapper, não em partes/*). golden-avatars segue igual (é fora do SVG).
2. Looks 2D (§1950–1958): CSS vars por look (`[data-look]`) reusando filtros de `LUZES_PALCO`; Hero = contraste + fundo profundo; Neon = glow seletivo (drop-shadow colorido); Portrait = busto + vinheta leve. Teste `classico-luz.mjs` lê computed style.
3. Rim 2D (§1952): overlay SVG de silhueta via `feMorphology` sobre o avatar como camada irmã (não edita artes). Validar com golden.
4. Background depth 2D (§1955): 2 camadas de gradiente + blur em fundos existentes (só CSS).
5. Transições (§1962–1967): 3D interpola luzes/exposição ≤300 ms no `laço` ao trocar look; 2D `transition` de filter/background; sincronizar câmera sugerida do look.
6. Preset cinematográfico completo (§1968–1969): `Cenas3d` v2 ganha `look` + `versao` + `camera preset` (sanitizado, default = legado).
7. Art Bible capítulo (§2028–2029): `docs/AVATAR-STUDIO-5/ART-BIBLE.md` seção "Iluminação/Câmera/Exposição/Sombras/Fundo/Pós/Foto" + anti-patterns + scores §1923–1925 como checklist.
8. Gate §2032: só após goldens Studio+Portrait+Hero+Câmera+Sombras+color mgmt aprovados pelo Jhony abre-se a Parte 9 (cenários/VFX).
Dependências: P8-A…E. Prioridade P1 (Art Bible é P0 segundo Parte 12).

---

## 6. Perguntas bloqueantes × decisões tomadas

**Bloqueantes (precisa do Jhony):**
1. HDRI reais (§1802–1804): autorizar adicionar 2–4 HDR CC0 (Poly Haven, 1k, ~300 KB cada) ao bundle público? Gate de peso do deploy e licença rastreada em `LICENCAS.md`. Sem resposta: fase 1 segue só com RoomEnvironment.
2. Regenerar thumbs 3D publicadas (P8-A.6) muda imagens do catálogo em `public/assets/avatars/3d/personagens/*` — confirmar que pode ir em commit próprio (não é avatar salvo).
3. Aprovação visual dos looks (Studio/Portrait/Hero) e do before/after — sempre do Jhony; define o gate §2032.
4. Safari/Mobile Safari (§2012–2013): só o Jhony tem dispositivo; suíte roda Chromium/SwiftShader.

**Resolvidas sozinho (registrar como decisões numeradas na implementação):**
- ACES continua baseline (§1871); modos de tone mapping viram Dev-only (atrás de flag, UI atual volta com flag off).
- Look `estudio` v1 = valores canônicos atuais byte-idênticos; novos looks = ids novos; enum PHP só cresce; `look@versao` vai nos metadados de captura.
- Sem SSAO/CSM no editor (§1786–1788); DOF só P2 em captura Ultra/Photo.
- LUT = shader paramétrico (sem textura externa); bloom strength/threshold por look, nunca por asset.
- Câmera não persiste no avatar (§1999); bookmarks/estado são locais; foto guarda câmera no projeto.
- Ids internos pt-BR (padrão do repo) com aliases para a nomenclatura do briefing.
- Tiers: rótulos Parte 12 mapeiam 1:1 no `QualityManager` existente; sem tier novo.

---

## 7. Métricas / Acceptance da Parte 8

- `Looks3d.ts` é a única fonte de parâmetros de luz (grep: nenhum `DirectionalLight(` com valores literais fora do registry/montar canônico); `aplicarLook('estudio')` == luzes canônicas (teste verde).
- Golden Lighting: PNG + JSON de métricas para ≥5 looks × (manequim + goldens disponíveis) × 3 câmeras; `golden-iluminacao.mjs` verde; regenerar exige `--gravar` e diff revisado.
- Matriz §1920 (pele clara/escura × studio/hero; metal/vidro × product; cabelo escuro × portrait) sem hard fail §1921 — checklist no Art Bible, validação visual do Jhony.
- Câmera: matriz §1846 (male/female/tall/wide/pet/wings) com cabeça e pés no frame; equipar item não move a câmera; câmera nunca abaixo do chão (polar) nem dentro do rosto (minDistance).
- Sombras: contato presente em todos os tiers; mapSize por tier verificado; sem acne/peter-panning nos goldens.
- Pós: econômico renderiza sem composer; context loss recria composer (teste); pele varia < Δ tolerância entre looks.
- Thumb × palco × captura: mesmo look `estudio@1` → diferença perceptual < tolerância.
- Foto: lentes e 4:5/9:16 funcionais; duas capturas iguais → mesmo hash; tier/DPR restaurados após captura.
- Byte-stability: `golden-avatars.mjs` (16 casos) verde; Config3D salvo antes da onda renderiza igual com todas as flags novas OFF e ON (look estudio).
- Suíte completa `rodar-todos.mjs` verde; flags novas desligáveis individualmente; PHP espelhado para enums novos.
