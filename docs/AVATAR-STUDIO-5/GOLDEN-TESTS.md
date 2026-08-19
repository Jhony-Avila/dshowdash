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

## 2. Goldens visuais (onda 1407 ✅) — contrato de captura

Implementação: `scripts/avatar/testes/regressao-visual.mjs` (runner/teste na suíte) + `visual/captura.mjs` (determinismo) + `visual/comparar-visual.mjs` (diff perceptual ΔE CIE76 via `sharp`) + `visual/golden-casos.ts` (definição ÚNICA dos 16 casos, compartilhada com `golden-avatars.mjs`).

- Determinismo: viewport 1440×900 (2D/UI) e 1500×940 (3D), DPR 1, Chromium fixo (`PW_CHROME`), `prefers-reduced-motion: reduce`, **SMIL pausado em t=0 + Web Animations pausadas** antes de cada captura; SVG do motor renderizado fora da UI (documento mínimo, fundo `#0b0d14`, busto 480², corpo 480×800, foto 960w); 3D via `canvas.toDataURL` com double-RAF e pose congelada (`p3d-pose`).
- Matriz v1: `svg_<gNN>` (16 goldens de bytes como imagem) · `item_<ace_*>` (ocupação do Modo Item — métrica, faixa §12 0,70–0,85, exceções declaradas: corporais = recorte da região no corpo §154; minúsculos = clamp 40 do medidor) · `ui2d_{rosto,busto,corpo,dock}` (shell novo, config padrão) · `3d_<slug>_{corpo,retrato}` (8 personagens publicados). Próximos: ¾/profile/LOD e looks (1408/1409/1419), goldens Classic p01+ (1411+).
- Nome do caso = `<grupo>_<id>_<variante>`; diff: % de pixels com ΔE > 6, ΔE médio, bbox da mudança, PNG de diff (magenta) em `saida/visual-diff/`; tolerâncias padrão 2D 0,5 % · UI 1,0 % · 3D 2,0 % (por caso em `golden-visual.json`).
- Classes: `identico` (sha igual) · `expected` (≤ tolerância) · `unexpected` · `needs_review` (baseline PNG ausente/tamanho diferente — humano decide) · `novo`. **Tripwire** = `unexpected` em `svg_/ui2d_/item_`; 3D `unexpected` e `needs_review` = aviso (decisão #158).
- Baseline: `docs/AVATAR-STUDIO-6/golden-visual.json` no git (sha256 + bytes + tamanho + métricas + tolerância + nota + viewport/chromium/commit); PNGs em `scripts/avatar/testes/saida/baseline-visual/` (gitignored) + cópia `/backup/visual-baselines/<commit>/` no servidor (passo manual até o deploy copiar). Aprovação: `--aprovar <caso|todos> --nota "motivo"` (nota obrigatória, §2695/§2975); `--gravar` só na 1ª baseline. Nunca automático.
- Seleção "affected" (§2793): `--desde <commit>` mapeia o diff git → grupos (`engine/render|partes|AvatarCatalog` → svg+item+ui2d; `modoItem|acessorios|VariantesAssets` → item; `shell|components|workspace|styles` → ui2d; `poc3d|Renderizador3d|Assembler3d|…|assets/3d` → 3d; mudança no próprio runner → tudo). `--sem-3d` pula o palco.

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
