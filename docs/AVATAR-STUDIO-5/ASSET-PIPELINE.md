# ASSET PIPELINE — lifecycle, naming, manifest v2, gates, QA, publish, rollback (v1 · onda 1405 · MEGA_BRIEFING_01 Parte 11 §2562–§2882, §3044)

> Estende `pipeline-assets-3d.md` (mega 5 / megas 611–613: o pipeline técnico 3D existente — fonte imutável, meshopt/LOD0-1-2, gates de triângulos/texturas, hashes, manifest §517, thumbs determinísticos, licença como hard gate). Este documento **não substitui** aquele: acrescenta qualidade visual, compatibilidade, regressão e observabilidade ("tecnicamente válido ≠ pronto para produção", §2562).
> Quick start no §10. Ferramentas novas marcadas com a onda em que entram.

## 1. Estágios oficiais (§2564) ↔ ferramenta

| # | Estágio | Hoje | Onda |
|---|---|---|---|
| 1 | SOURCE (imutável, fora do público) | `storage/assets-3d-fonte/` + `LICENCAS.md` | — |
| 2 | INGEST (report, limites, URIs externas, licença) | `lerJsonDoGlb` valida magic; licença hard gate | report.json/diff 1406 · ingestão segura 1410 |
| 3 | NORMALIZATION (escala 1u=1m, eixo +Y up/+Z forward, pivot por categoria, transform freeze) | altura 0,8–3 m (aviso) | bounds/pivot 1406 |
| 4 | OPTIMIZATION (dedup/prune/weld/meshopt/webp) | `publicar-asset.mjs` | — |
| 5 | LOD (lod0/1/2 + gates + silhueta) | gates §631; `auditar-lods.mjs` (1409: 27 idênticos + 7 lod1=lod0, 22,4 MB redundantes → `evidencias/lods-3d.json`); validador: LODs sem decimação = aviso em production, **erro** em premium+ (`excecoes.lod` vira aviso); IoU silhueta lod0×lod2 ≥ 0,92 (`gerar-renders-homologacao.mjs`) | republicação com decimação ★ |
| 6 | TECH VALIDATION (schema, rig, morphs, texturas) | `validar-asset.mjs` | schema v2 1406 · texturas/morphs 1406/1421 |
| 7 | MATERIAL (família, mapas, naoTingir) | tint por canal | `FamiliasMaterial` + manifest `materiais` 1408 |
| 8 | FIT (socket/ancora/bounds/occupancy/hairMask/mascara) | `mascara` só nas bases (0 roupas declaram) | 1416/1423/1424 |
| 9 | VISUAL QA (ficha, evidências, status) | — | 1410 (`VISUAL-QA.md`) |
| 10 | GOLDEN REGRESSION (matriz de screenshots) | só bytes 2D | 1407 (`GOLDEN-TESTS.md`) |
| 11 | PUBLISH (gates por nível, dry-run, versões, registro §614) | `publicar-asset.mjs` + `gerar-registro-sql.mjs` | CLI/dry-run/gates 1410 |
| 12 | MONITOR (telemetria por asset, health) | 1409: eventos `asset_carregou/asset_falhou/lod_transicao/fallback_ativado/parte_*` (flag `as6.telemetria_assets`) + bloco "Assets 3D" no TelemetriaDev | health score no index.json (1410) |

## 2. Naming (decisão #166; §2571–§2575, §935–§938)

- 2D (catálogo SVG): prefixo por categoria — `bas_` `olh_` `boc_` `cab_` `rou_` `sob_` `ace_` `aur_` `efe_` `fun_` `mol_` `ban_` `emb_`; **premium** = `<prefixo>_px_<nome>` (`cab_px_longo`); categorias novas = `brb_` (barba), `sbr_` (sobrancelha — `sob_` já é sobrepeça), `nar_` (nariz), `rin_` (roupa_inferior).
- 3D (pastas/manifests): `base_<nome>` `cab3d_<nome>` `brb3d_<nome>` `rou3d_<nome>` `ace3d_<nome>` `cen3d_<nome>` `pet3d_<nome>` `vfx3d_<nome>`; os existentes (`cab_barba`, `rou3d_ranger_*`, `humano_casual`) **não mudam**.
- ID = identidade lógica estável; nome de marketing vive em `NOMES_AMIGAVEIS`/i18n; versão (`versao`) separada do ID; `successorId` aponta sucessor sem re-slotar saves.
- Regras: snake_case ASCII; bones nunca renomeados (GLTFLoader sanitiza); ID duplicado entre pastas = fail (1406).

## 3. Manifest v2 (§2576–§2590; validado por JSON-schema em `scripts/avatar/assets3d/schema-manifest-v2.json`, onda 1406)

Campos do §517 v1 permanecem obrigatórios (`id, tipo, versao, rig, lods, hashes, triangulos, licenca, origem`). Novos (opcionais; obrigatórios a partir de `qualidadeVisual: premium`):

```json
{
  "schemaVersion": 2,
  "qualidadeVisual": "production",            // prototype|legacy|production|premium|hero
  "qaVisual": { "status": "approved", "reviewer": "jhony", "data": "2026-08-2X", "versao": "1.0", "notas": "…", "evidencias": [] },
  "artBibleVersion": "1.0",
  "visibility": "production",                  // internal|dev|production|hero
  "deprecated": false, "successorId": null,
  "renderers": ["3d"],                         // rendererSupport
  "bounds": { "min": [0,0,0], "max": [0,0,0], "raio": 0 },
  "pivot": "pes", "eixos": "+Y up, +Z forward", "escalaMetros": 1,
  "materiais": { "MI_Superhero_Male": { "familia": "skin", "overrides": {} }, "MI_Eyes": { "familia": "eyes", "naoTingir": true } },
  "corpo": { "familia": "human_m", "variante": "standard", "morphSupport": [], "alturaM": 1.8 },
  "morphs": { "face_smile": "Smile" },
  "socket": "head", "ancora": { "offset": [0,0,0], "rot": [0,0,0], "escala": 1 }, "classe": "small",
  "mascara": ["torso"], "hairMask": ["top"], "fitProfile": {}, "alpha": "opaque",
  "excecoes": { "triangulos": "…", "perf": "…" },
  "pipelineVersion": "2", "toolVersions": { "gltf-transform": "x", "sharp": "y" },
  "look": "estudio@1"
}
```

Política: unknown field → warn; campo crítico inválido → fail; thumb/preview obrigatórios; ID/versão duplicados → fail; manifest 3D não é estado de usuário (fora do `AvatarConfig`, sem PHP).

## 4. Gates por nível (§2748–§2752, onda 1410)

| Nível | Exige |
|---|---|
| technical | schema válido · licença · hashes · triângulos/texturas · rig/bones · thumb/preview · naming |
| premium | technical + `qaVisual.status = approved` + famílias de material declaradas + bounds/fit + regressão visual sem `unexpected` |
| hero | premium + perf dentro do budget da classe (`PERFORMANCE-BUDGETS.md`) + preview/turntable + golden dedicado |

Implementado na onda 1410: `publicar-asset.mjs`/`cli.mjs publish` recusam premium/hero sem `qaVisual.status ∈ {approved, approved_with_notes}` (gate §2677); `--override --motivo "<texto>"` é aceito e **logado** em `storage/visual-qa/overrides.log` (auditável). Ingestão segura §2748 (`validarFonteSegura`): fonte ≤ 200 MB, magic GLB v2, **URI externa recusada** (imagens/buffers fora do binário). Versões **sempre preservadas** (`cli.mjs publish` → snapshot completo em `storage/assets-3d-versoes/<id>/vN/`; `cli.mjs rollback [--para vN]` restaura byte a byte + regenera índice). Canary §2759: `cli.mjs publish --visibility internal`.

## 5. Visual QA e evidências (§2663–§2677) — ver `VISUAL-QA.md`

Onda 1410: **ficha executável** `ficha-qa.mjs criar|status|ver` — status machine §2675 (`pending → approved | approved_with_notes | rework | rejected`, `rework → pending`; approved* terminal na versão), checklist de eixos POR CATEGORIA (não-aplicáveis = null), aprovar exige todos os eixos avaliados + 0 hard fails + evidências; `approved_with_notes` exige issue com texto+owner+severidade+prazo (§3082). Ficha completa em `storage/visual-qa/<id>/ficha-vN.json` (fora do git); RESUMO espelhado no manifest `qaVisual`. Evidências padronizadas: `gerar-evidencias.mjs <pasta>` (matriz de renders por categoria → `storage/visual-qa/<id>/evidencias/`, anexadas à ficha). Rota visual no shell: **QaStudio** (`as6.qa_route`, chunk lazy) — LOD forçado, looks, overlays, calibração, screenshot 1-click, inspector técnico (manifest/health §2735/renderer.info), debug de materiais (`as6.material_debug`). Quem aprova é o Jhony.

`gerar-evidencias.mjs <pasta>` → `storage/visual-qa/<id>/<id>_vNN_{front,34,profile,back,closeup}.png` (fora do público); ficha JSON; status no manifest; checklist por categoria; hard fails automáticos consolidados no validador.

## 6. Regressão e goldens (§2678–§2705) — ver `GOLDEN-TESTS.md`

Baseline PNG fora do git + `golden-visual.json`; diff perceptual; aprovação humana; affected-assets; silhueta LOD IoU.

## 7. Performance e telemetria (§2716–§2742) — ver `PERFORMANCE-BUDGETS.md`

Onda 1409: `medir-perf-asset.mjs [<pasta>|--json|--render]` (estático/determinístico; `--render` acrescenta draw calls reais via renders) → `evidencias/perf-assets.json`; `budgets.json` por classe (`tipo` ou `tipo:perfClasse`); regressão histórica +40 % bytes / +50 % VRAM; eventos `asset_carregou/asset_falhou/lod_transicao/fallback_ativado/parte_*` com `slug/lod/ms/motivo` (sem URL/PII, rate limit por slug) — flag `as6.telemetria_assets`; health score no `index.json` (só QaStudio, 1410). Homologação: `gerar-renders-homologacao.mjs <pasta> [--angulos front,34,profile,back] [--modos normal,clay,silhueta,wireframe] [--lods 0,1,2]` → PNGs + `metricas.json` (IoU por LOD, landmarks do rig, drawCalls/triângulos); `corpo-benchmark.mjs` (bases: clay/silhueta front+profile + landmarks vs faixas por estilo → `evidencias/corpo-benchmark.json`, 8/8 dentro da faixa calibrada); `gerar-thumbs-3d.mjs --tipo <tipo>` regenera thumbs por tipo (★). Validador de cabelo/roupa: ≤ 3 materiais, BLEND exige `alpha: 'blend'` no manifest, MASK/BLEND sem baseColorTexture = alpha sem mapa (aviso production / erro premium+).

## 8. Publish, rollback, deprecação, canary (§2743–§2767)

- `cli.mjs validate|build|qa|publish|rollback|report` (wrapper dos 7 scripts existentes; zero duplicação).
- `publish --dry-run`: arquivos, diff de manifest, status QA, gates.
- Versões anteriores preservadas (`<pasta>/_v<N>/` ou `/backup`); `rollback <id> <versao>`; cache invalida por hash.
- `visibility: internal` + `as6.assets_internos` = canary; `deprecated: true` = oculto do catálogo, **carregável** (saves nunca quebram); GC nunca automático; usage report via `registry.php` (leitura).
- Flag por bloco (nunca por asset individual) — `as6.*`.

## 9. Pipeline 2D (§2781–§2792, onda 1427)

Arte SVG autoral em `engine/partes/*` (existente intocável; novas em `partes/premium/*` e categorias novas); contrato de asset 2D = `ItemCatalogo` + registries em dados (`QualidadeVisual.ts`, `VariantesAssets.ts`, `MetadadosAssets.ts`, subcategorias); lint só-leitura (`lint-partes-2d.mjs`: IDs duplicados, filtros fora da whitelist do `SvgSanitizer.php`, tamanho, nós); `custo2d` no `manifest-assets.json`; thumbs Modo Item medidos (`medir-foco-item.mjs`) no mesmo commit da arte; goldens de bytes + visuais.

## 10. Quick start (1 página)

```bash
# 3D — publicar um asset (já existe)
node scripts/avatar/assets3d/publicar-asset.mjs --fonte storage/assets-3d-fonte/<pack>/<arquivo>.glb \
  --saida public/assets/avatars/3d/<tipo>/<id> --id <id> --data $(date +%F) [--mascara torso,bracos] [--materiais …]
node scripts/avatar/assets3d/gerar-thumbs-3d.mjs public/assets/avatars/3d/<tipo>/<id>
node scripts/avatar/assets3d/validar-asset.mjs public/assets/avatars/3d/<tipo>/<id>
node scripts/avatar/assets3d/medir-perf-asset.mjs public/assets/avatars/3d/<tipo>/<id>      # 1409: orçamento da classe
node scripts/avatar/assets3d/gerar-renders-homologacao.mjs public/assets/avatars/3d/<tipo>/<id>  # 1409: renders + IoU + landmarks
node scripts/avatar/assets3d/gerar-indice-3d.mjs
node scripts/avatar/assets3d/auditar-lods.mjs && node scripts/avatar/assets3d/medir-perf-asset.mjs   # 1409: evidências (o diff é o relatório)

# 1410 — CLI única (wrapper; --dry-run em tudo)
node scripts/avatar/assets3d/cli.mjs validate public/assets/avatars/3d/<tipo>/<id>
node scripts/avatar/assets3d/cli.mjs qa public/assets/avatars/3d/<tipo>/<id> criar        # ficha pending
node scripts/avatar/assets3d/gerar-evidencias.mjs public/assets/avatars/3d/<tipo>/<id>    # renders → ficha
node scripts/avatar/assets3d/ficha-qa.mjs status <pasta> approved --reviewer jhony --data AAAA-MM-DD --nota silhueta=9 …
node scripts/avatar/assets3d/cli.mjs publish <pasta> [--visibility internal] [--dry-run]  # snapshot + gate §2677 + índice
node scripts/avatar/assets3d/cli.mjs rollback <pasta> [--para vN]
node scripts/avatar/assets3d/cli.mjs report <pasta>                                       # validador+perf+LODs+health+ficha
node scripts/avatar/assets3d/corpo-deformacao.mjs <base> [--pacote …/animacoes/ual_basico] # poses A–H + 3 frames §432
node scripts/avatar/assets3d/clipping-qa.mjs [--so <peça>]                                # raycast bind pose §415.2
# (onda 1410) node scripts/avatar/assets3d/cli.mjs publish <pasta> --dry-run

# 2D — arte nova (ondas 1411+)
#  1. ParteDef em engine/partes/premium/<categoria>.ts (id <prefixo>_px_<nome>), raridade comum p/ traços básicos
#  2. registries em dados: subcategoria/slot, QualidadeVisual, VariantesAssets, MetadadosAssets
#  3. node scripts/avatar/medir-foco-item.mjs <id> → FOCO_ITEM_ASSET (mesmo commit)
#  4. golden novo (pNN) + orcamento-2d.mjs + regressão visual
#  5. suíte completa verde → commit temático citando §§ → colar-NNNN.txt / webhook
```

Regras que prevalecem: arte existente nunca editada · avatar salvo nunca muda · flag por bloco · PHP espelhado para estado novo · licença registrada · deploy pelo script.
