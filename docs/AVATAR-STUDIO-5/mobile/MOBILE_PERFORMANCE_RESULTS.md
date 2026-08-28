# Track C Mobile — Resultados de Performance/Estabilidade (reprodutível)

Benchmark: `perf-bench` (12 repetições, 2 de warmup, 390×844, flag ON,
Playwright/Chromium headless em sandbox cloud). Estatística por métrica.
Estabilidade: `mobile-performance-smoke`.

## 1. Tempos (ms) — mediana / p95 / min / max, 12 reps + 2 warmup

| Métrica | mediana | p95 | min | max |
|---|---|---|---|---|
| shell utilizável (goto→__pronto) | 190 | 236 | 170 | 236 |
| troca de categoria | 69 | 97 | 58 | 97 |
| abertura de ferramenta | 31 | 43 | 22 | 43 |

Ambiente: headless não é fiel a FPS de device; estes números medem o custo de
interação da composição, reprodutíveis pelo benchmark. FPS de scroll/3G/bateria
= validação de device real (kit).

## 2. Estabilidade (10 ciclos abrir/fechar ferramenta + trocar categoria)

| Métrica | início | fim | Δ |
|---|---|---|---|
| heap JS | 12.2 MB | 12.2 MB | 0 (sem leak) |
| nós DOM | 4049 | 3097 | −952 (sem crescimento) |
| erros JS | — | — | 0 |
| listeners | pareados no cleanup (mobileStudio.ts) | | sem acúmulo |

## 3. Bundle e o aviso de chunk-size

| Chunk | bruto | gzip | Dono |
|---|---|---|---|
| `motor3d.js` | 1039 KB | 286 KB | **engine 3D (Three.js) — Track A** |
| `entry.js` | 503 KB | 156 KB | app (Track A) + Track C (~1.3KB) |
| `catalogo-arte.js` | 454 KB | 102 KB | catálogo (Track A) |
| CSS bundle | 184 KB | 31 KB | inclui mobile.css (~5 KB gzip) |

**Aviso "Some chunks are larger than 600 kB":** disparado pelo `motor3d.js`
(1 MB, engine 3D), **pré-existente e alheio ao Track C**. Contribuição do
Track C: **~1.3 KB JS** (`mobileStudio.ts` + hooks) no `entry` + **~5 KB gzip
CSS** (`mobile.css`) no bundle de estilo. Delta pequeno e justificado (só
layout); **nenhuma otimização artificial** foi feita. O Track C **não criou nem
agravou** o aviso.
