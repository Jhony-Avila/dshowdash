# GOLDEN TESTS — goldens de byte-stability, goldens visuais e Golden Sets (v1 · onda 1405 · MEGA_BRIEFING_01 §24–§26, §35, §133–§140, §2678–§2705, §2972–§2976, §3079)

> Dois conceitos distintos que o briefing junta sob "golden":
> **(a) Goldens de BYTES** (já existem): `scripts/avatar/testes/golden-avatars.mjs` — 16 configs canônicas (g01–g16) cujo SVG serializado tem sha256 gravado em `docs/AVATAR-STUDIO-6/golden-avatars.json`. Provam a regra inviolável "avatar salvo nunca muda de render". **Tripwire**: qualquer diff = STOP.
> **(b) Goldens VISUAIS** (novos, onda 1407+): matriz de screenshots determinísticos (2D e 3D) comparados por diff perceptual com tolerância, baseline versionada fora do git (PNG) + `golden-visual.json` (hashes/métricas) no git. 2D = tripwire; 3D headless = aviso até estabilizar (decisão #158).
> **(c) Golden SETS de conteúdo** (Golden Male/Female, Faces, Hair, Outfits, Accessories, Materials, Lighting, Classic, Scenarios, Presets): os assets/configs de referência que definem o padrão e são o **gate** antes de qualquer produção em massa (§26, §183, §3095).

## 1. Goldens de bytes (existentes — intocáveis)

| id | caso | âncora de |
|---|---|---|
| g01 | padrão (`CONFIG_PADRAO`) | default congelado (decisão #159) |
| g02 | chapéu + cabelo | ordem cabelo→acessorio_cabeca (máscara nunca retroativa) |
| g03 | sobrepeça | `roupa_sobre` |
| g05 | canais de roupa | `coresCamada` §73 |
| g06 | tipo corporal | `envolverFigura` |
| g09 | corpo inteiro | scaffold 240×400 + `renderCorpo` |
| g16 | corpo+postura+fino | wrappers |
| … | (16 no total — ver `golden-avatars.json`) | |

Regras: novos campos/camadas = goldens **novos** (p01+, g17+) gravados no mesmo commit com `--gravar` e diff revisado (doutrina #83); os 16 nunca são regravados por causa de feature nova. Comparações de byte-stability usam `uid: 'fixo'` (o `uid` deriva de `hashConfig`).

## 2. Goldens visuais (onda 1407) — contrato de captura

- Viewport 1440×900, DPR 1, `prefers-reduced-motion: reduce`, relógio congelado (`page.clock`), `requestAnimationFrame` determinístico, seed fixa de partículas (`as6.seed_determinista`), Chromium fixo (`PW_CHROME`), SwiftShader para WebGL.
- Matriz 2D: 16 goldens × {busto, palco, corpo, foto} + 6 looks de palco (clima/luz/hora) + Modo Item por acessório (ocupação 70–85%).
- Matriz 3D: 8 personagens publicados × {front, ¾, profile} × LOD{0,1,2}, pose idle congelada; cabelos/roupas modulares sobre `base_superhero_m/f`; looks estudio/portrait (+hero/neon após 1420).
- Nome: `<caso>_<angulo>[_lod].png` (ex.: `g01-padrao_busto.png`, `base_superhero_m_34_lod1.png`).
- Diff: `comparar-visual.mjs` (sharp, raw RGB, ΔE por pixel, % acima do limiar + bbox); tolerância por caso em `golden-visual.json`; classificação `expected | unexpected | needs_review` (humano decide `needs_review`).
- Baseline: PNGs em `scripts/avatar/testes/saida/baseline-visual/` (gitignored) + cópia `/backup/visual-baselines/<commit>/` (servidor, passo opcional do deploy); no git só `docs/AVATAR-STUDIO-6/golden-visual.json` (sha256 + métricas + viewport + chrome build + notas de aprovação).
- Aprovação: `--aprovar <caso>` regrava e exige nota; nunca automático (§2975).
- Seleção "affected" (§2793): `rodar-visual.mjs --desde <commit>` mapeia diff git → matriz (engine/render.ts → tudo 2D; poc3d/services 3D → tudo 3D; partes/<cat> → só a categoria).

## 3. Golden Sets de conteúdo (gates)

| Set | Conteúdo | Gate (§) | Onda | Status |
|---|---|---|---|---|
| Golden Classic M/F | `pre_golden_m/f` + C01–C06 (rosto/cabelo/roupa/acessório/fundo/aura/moldura/look) | §2560 | 1412–1418 | pendente |
| Golden Faces | M01/M02/F01/F02 distintos + Skin Calibration light/medium/dark | §701–§708 | 1412/1414 (2D) · ⛔ 3D | pendente |
| Golden Hair Set | H01–H06 + B01–B03 (barba) | §897 | 1413 (2D) · ⛔ 3D | pendente |
| Golden Outfits | O01–O06 em M+F + footwear | §1220 | 1415 (2D) · 1424 (3D limitado) · ⛔ premium 3D | pendente |
| Golden Accessories | A01–A09 (≥1 Q3/Q4 por região) | §1495 | 1416 (2D) · 1423–1424 (3D procedural) | pendente |
| Golden Materials | M01–M12 na cena de calibração | §1751 | 1408/1421 | pendente |
| Golden Lighting | Studio/Portrait/Hero/Neon/Product × goldens × 3 câmeras | §2032 | 1408/1420 | pendente |
| Golden Body M/F 3D | bases neutras com morphs + variantes | §400/§183 | ⛔ assets (precisa do Jhony) | bloqueado |
| Golden Scenarios | S01–S06 | §2286 | 1426 (procedurais) · ⛔ Urban/Royal/Nature | pendente |
| Golden Presets | P01–P06 (avatar+look+cena+aura) | §2246 | 1426 | pendente |

**Golden Avatar Matrix** (§3079) a cobrir pelos sets: Male · Female · Light/Medium/Dark skin · Short/Long hair · Premium outfit · Hero accessory · Aura · Pet.

## 4. Gate supremo (§183, §2893, §3094–§3095)

Nenhuma produção em massa (população/3×) antes de: Art Bible aprovada · Quality Bar implementado · Golden M/F (Classic; 3D quando houver assets) aprovados · Visual QA operacional · regressão visual operacional · flags/rollback comprovados · 1ª leva premium em produção. Registro da aprovação = decisão numerada no projeto.

## 5. Ownership

Evidências/fichas/regressão: agente (regime #45). Veredito visual e aprovação de goldens: **Jhony** (sempre). Baseline só muda com aprovação registrada.
