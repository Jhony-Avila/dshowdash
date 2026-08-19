# Onda 1407 — Fase 0 P0: REGRESSÃO VISUAL por screenshots (MEGA_BRIEFING_01 §35, §64, §2678–§2705, §2793–§2801, §2972–§2976; decisão #158)

> Entrega 2026-08-19. Mapa: claude/41. Sem mudança de código do painel (src intocado): infra de testes + baseline. Goldens de bytes g01–g16 intactos (o refactor do `golden-avatars.mjs` para a fonte única `visual/golden-casos.ts` manteve os 16 hashes).

## Entregue

| # | Item | Arquivo | §§ |
|---|---|---|---|
| 1 | **Fonte única dos casos golden** (g01–g16) — `casosGolden()` consumida pelo `golden-avatars.mjs` (sha256 dos bytes) e pela regressão visual (PNG do MESMO SVG) | `scripts/avatar/testes/visual/golden-casos.ts`, `golden-avatars.mjs` (refactor, hashes idênticos) | §2678–§2685 |
| 2 | **Captura determinística**: viewport fixo, DPR 1, Chromium fixo, reduced-motion, **SMIL pausado em t=0 + Web Animations pausadas** antes de cada captura; SVG→PNG fora da UI (busto 480², corpo 480×800, foto 960w); ocupação de Modo Item por getBBox (animações congeladas); 3D via `toDataURL` com pose congelada só no instante da captura, `as5.quality3d_v2` OFF (sem DPR dinâmico → canvas fixo) e perfil `alto` fixo (sem tier adaptativo) | `scripts/avatar/testes/visual/captura.mjs` | §2697–§2705, §2973 |
| 3 | **Diff perceptual** (ΔE CIE76 em Lab, % de pixels > 6, ΔE médio, bbox, PNG de diff magenta) com `sharp` — zero lib nova; classes identico/expected/unexpected/needs_review; tolerâncias 2D 0,5 % · UI 1 % · 3D 2 % | `scripts/avatar/testes/visual/comparar-visual.mjs` + teste unitário `visual-diff.mjs` | §2690–§2694 |
| 4 | **Runner/teste** `regressao-visual.mjs`: matriz `svg_<g>` (16) · `item_<ace>` (75, métrica de ocupação §12 com exceções DECLARADAS: corporais = recorte da região §154; minúsculos = clamp 40) · `ui2d_{rosto,busto,corpo,dock}` · `3d_<slug>_{corpo,retrato}` (16); tripwire = `unexpected` em svg/ui2d/item; 3D = aviso; `--gravar`, `--aprovar <caso\|todos> --nota` (nota obrigatória), `--desde <commit>` (seleção "affected" por diff git), `--sem-3d`; relatório `saida/regressao-visual.json` | `scripts/avatar/testes/regressao-visual.mjs` | §2690–§2705, §2793, §2974–§2975 |
| 5 | **Baseline v1**: `docs/AVATAR-STUDIO-6/golden-visual.json` (111 casos: sha256/bytes/tamanho/métricas/tolerância/viewport/chromium/commit) no git; PNGs (36 arquivos, 4,4 MB) **fora do git** em `scripts/avatar/testes/saida/baseline-visual/` — tarball `baseline-visual-<commit>.tar.gz` entregue ao Jhony para `/backup/visual-baselines/<commit>/` | `docs/AVATAR-STUDIO-6/golden-visual.json` | §2691, #158 |
| 6 | Prova de determinismo: 2 execuções consecutivas → 36/36 PNGs byte-idênticos (2D, UI **e 3D**) + 75/75 ocupações iguais | — | §2705 |
| 7 | `GOLDEN-TESTS.md` §2 atualizado com o contrato real; `rodar-todos` += `visual-diff.mjs`, `regressao-visual.mjs` (≈5 min, 3D incluso) | docs | — |

## Achados/decisões operacionais

- Canvas 3D mudava de tamanho entre execuções (DPR dinâmico §483 reage ao FPS do headless) → para regressão, DPR dinâmico OFF e perfil fixo; produção não muda.
- Pose congelada (`p3d-pose`) = `pausar()` o laço: o canvas guarda o último quadro — por isso congela-se só na captura e retoma-se para trocar personagem/câmera (a 1ª tentativa capturou 16× o mesmo quadro).
- Itens fora da faixa 70–85 %: 7 corporais (recorte regional intencional) e brinco/piercing/anel (clamp do medidor) → exceções declaradas no JSON, nunca silenciosas.
- `--desde HEAD~1` na 1406 selecionou corretamente `3d, ui2d, item`.
- Suíte completa anterior (142/142) permanece válida (src intocado); rodados: golden-avatars, visual-diff, regressao-visual (2×), docs-aaa, qualidade-visual.

## Próxima: 1408 — laboratório 3D (Looks registry `estudio@1` byte-idêntico + portrait, overlays QA, cena de calibração, `FamiliasMaterial`, skin tint UBC por metadata, thumbs ACES+env, snapshot metrics, golden-iluminacao).
