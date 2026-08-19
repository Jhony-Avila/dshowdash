# PERFORMANCE BUDGETS — orçamentos por cena, asset, tier e bundle (v1 · onda 1405 · MEGA_BRIEFING_01 §28–§30, §147–§153, §2716–§2732, §2937–§2961)

> Regra: **scene budget, não apenas asset budget** (§2946). Identidade visual não muda por tier (§28, §2939); o que degrada é, nesta ordem (§150, §1926–§1935, §2939): partículas → sombras (resolução → contato só) → pós (bloom/grading) → secondary motion → DPR → detalhe de textura/LOD → materiais avançados (physical/shader) → DOF nunca no editor.
> Números marcados **(medir)** são estimativas iniciais a consolidar na onda 1409 (`medir-perf-asset.mjs`, `budgets.json`, histórico `perf-assets.json`). Aceite dos thresholds como política = Jhony (lista "precisa do Jhony" #4).

## 1. Tiers (§2937–§2944) ↔ código existente

| Briefing | `QualityManager.perfil` | `tier3d` | Nota |
|---|---|---|---|
| AUTO | `auto` | adaptativo (§528: <30 fps desce, >55 sobe, histerese) | detecta capability (`Capacidade3d.ts`) e estabilidade |
| ECONOMY | `eco` | `economico` | preserva design; sem composer/bloom; contato fake; partículas mínimas; DPR baixo |
| STANDARD | `equilibrado` | `medio` | experiência principal |
| ULTRA | `alto` (+ perfis `ultra/cine` `as5.quality3d_v2`) | `alto` | sombras 2048, pós completo, physical materials |
| PHOTO (temporário) | captura (`as5.captura3d_v2`/`as5.foto3d`) | força `alto` + supersampling + LOD0 | restaura o tier anterior ao fim (§2944) |

Mapeamento é de rótulos: **não existe tier novo persistido** (decisão #161).

## 2. Bundle (gate de deploy — existente)

Fonte de verdade: `scripts/deploy/pesos-esperados.json` (KB por chunk; `deploy-as5.sh` aborta acima). Atual: entry 460 · catalogo-arte 345 · react-vendor 225 · vendor 40 · motor3d 1180 · Estudio3D 50 · Renderizador3d 42 · chunks lazy 4–15. Regras: crescimento = atualizar no MESMO commit com justificativa; assets (GLB/KTX2/HDRI/PNG) **nunca** no bundle JS (`bundle-assets.mjs`, onda 1409); rota de QA/inspector em chunk lazy próprio (`as6.qa_route`).

## 3. Assets 3D (gate técnico existente + budgets por classe a introduzir)

| Gate (existente) | lod0 | lod1 | lod2 |
|---|---|---|---|
| Triângulos (`validar-asset.mjs` §631) | 60 000 (teto abs. 70 000 com exceção) | 25 000 (30 000) | 8 000 (12 000) |
| Textura máx. (`publicar-asset.mjs`) | 2048 | 1024 | 512 |
| Emissive (`Materiais3d.TETO_EMISSIVO`) | 2 | 2 | 2 |

Budgets por **classe** (onda 1409 → `scripts/avatar/assets3d/budgets.json`; Hero com exceção justificada no manifest `excecoes.perf`) **(medir)**:

| Classe | tri lod0 | materiais | texturas lod0 | peso lod0 | draw calls | nota |
|---|---|---|---|---|---|---|
| base corporal | ≤ 30 000 | ≤ 6 | ≤ 2048² ×4 | ≤ 2,5 MB | ≤ 8 | rosto/mãos protegidos na decimação |
| rosto/olhos (se separado) | ≤ 8 000 | ≤ 3 | ≤ 1024² | ≤ 600 KB | ≤ 3 | LOD0 em retrato |
| cabelo | ≤ 12 000 | ≤ 3 | ≤ 1024² ×2 | ≤ 800 KB | ≤ 3 | alpha declarado |
| roupa (peça) | ≤ 10 000 | ≤ 3 | ≤ 1024² ×3 | ≤ 900 KB | ≤ 3 | máscara declarada |
| acessório small | ≤ 1 500 | ≤ 2 | ≤ 512² | ≤ 150 KB | ≤ 2 | óculos/brinco/anel/relógio |
| acessório medium | ≤ 4 000 | ≤ 3 | ≤ 1024² | ≤ 400 KB | ≤ 3 | chapéu/colar/cinto |
| acessório hero (costas/asas/prop) | ≤ 12 000 | ≤ 4 | ≤ 1024² ×2 | ≤ 600 KB | ≤ 4 | bounds declarados |
| pet | ≤ 15 000 | ≤ 3 | ≤ 1024² | ≤ 1,2 MB | ≤ 3 | com LOD1/2 e anim |
| companion (drone/orb) | ≤ 5 000 | ≤ 3 | ≤ 512² | ≤ 400 KB | ≤ 3 | emissive ≤ teto |
| cenário (por camada) | ≤ 20 000 | ≤ 6 | ≤ 1024² ×4 | ≤ 1,5 MB gzip total | ≤ 10 | procedural primeiro |

Regressão por asset (histórico): FPS −15% · load +40% · texture memory +50% → aviso no validador (§2804). Paths com `?v=<hash8>` (cache-busting) atrás de `as6.cache_bust_assets`.

## 4. Cena (worst-case oficial §2947) **(medir na 1409)**

Benchmark: cabelo longo + roupa em camadas + asas + óculos + relógio + prop + pet + aura + cenário.

| Tier | alvo FPS desktop / mobile | triângulos cena | draw calls | texture mem | luzes dinâmicas | partículas 3D | sombras |
|---|---|---|---|---|---|---|---|
| ECONOMY | ≥ 30 / ≥ 24 | ≤ 60 k | ≤ 40 | ≤ 64 MB | 1 (key) + 0 | ≤ 100 | contato fake |
| STANDARD | ≥ 60 / ≥ 30 | ≤ 150 k | ≤ 80 | ≤ 192 MB | key+fill (+rim) + 1 extra | ≤ 500 | 1024 PCFSoft |
| ULTRA | ≥ 60 / — | ≤ 300 k | ≤ 150 | ≤ 384 MB | + 2 extras | ≤ 1500 | 2048 + pós |

Métricas a registrar (§2950–§2955, `diagnostico()` + `PerfBaseline`): FPS, frame time, load time, first meaningful avatar render, avatar swap latency, camera response latency, UI responsiveness (`ORCAMENTO_MS`: troca-categoria 1200 ms · equipar 1500 ms — hardware fraco/headless; estourar = regressão).

## 5. 2D Clássico

- `SvgSanitizer.php MAX_BYTES = 300 000` (teto duro). Orçamento de avatar (onda 1411 `orcamento-2d.mjs`): busto ≤ 40 KB / ≤ 600 nós / ≤ 4 filtros; corpo inteiro ≤ 80 KB; foto conforme `render-foto`. Premium (6 camadas de cabelo + materiais) obrigatoriamente dentro — defs compartilhados por `uid`.
- Animações: WAAPI/SMIL só no palco; `prefers-reduced-motion` desliga; partículas por tier (`TierParticulas` economico/medio/alto/cinematico).
- Cards: `content-visibility` (§59.1); thumbs determinísticos (Modo Item).

## 6. Captura/Photo (§2943)

Durante `capturar()`: LOD0 + DPR alto + sombras ↑ + pós só na captura; determinística (mesmo estado → mesmo hash); restaurar tier/DPR/câmera ao terminar (teste de restauro). Export 2D 1920 px via workers.

## 7. Robustez (§2962–§2971)

Context loss: rehidratar avatar, materiais, LOD, environment, VFX, câmera e **composer** (onda 1420). Error boundaries por asset (cabelo falha → avatar continua, fallback). Telemetria: `asset_load_failed`, `texture_load_failed`, `renderer_context_lost/restored`, `shader_failed`, `fallback_used`, `quality_downgraded` (onda 1409, flag `as6.telemetria_assets`), com rate limiting e sem PII.

## 8. QA de performance (§2984)

Suíte: `orcamento.mjs` (existente), `perf-baseline.mjs` (existente), `medir-perf-asset.mjs` + `bundle-assets.mjs` (1409), worst-case por tier (1409/1424), Safari/iOS = Jhony. Hard fail de release: ECONOMY abaixo do alvo no worst-case; STANDARD com regressão >15% vs baseline sem justificativa.
