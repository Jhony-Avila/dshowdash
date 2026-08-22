# Onda 1421 — Famílias de material aplicadas + texture pipeline (MEGA_BRIEFING_01 Parte 7 P7-C..F, P4-E; decisões #208–#209)

> Entrega 2026-08-22 — terceira onda da Fase 2. **Sem flag nova**: tudo consome as flags existentes `as6.material_v2` (aplicação de famílias — OFF) e `as6.qa_visual` (cena de calibração — OFF); rollback = desligar (registrado em #208). OFF = pipeline de materiais anterior byte a byte (teste [B1]).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **Tiers de família** (#208): `paramsFamiliaPorTier(fam, tier)` — fonte única: econômico = padrao + `economico` SEM extras físicos (transmission/sheen/clearcoat/anisotropy) e SEM normalScale ("material por LOD"); médio = padrao; alto = padrao + ultra. **Skin em 3 tiers** (§1521) com deltas travados por `DELTA_MAX_TIER` (proxy de dado do "ΔE entre tiers"; ΔE visual fica no gate ★) | `services/FamiliasMaterial.ts` | P7-C |
| 2 | **Hair**: alpha policy `mask` aplicada de verdade (alphaTest 0.5, transparent=false), **anisotropy SÓ no ultra** (0.35/0.45 — MeshPhysicalMaterial), tier econômico próprio | `FamiliasMaterial.ts`, `Materiais3d.ts` | P4-E |
| 3 | **naoTingir herdado da FAMÍLIA**: olhos/dentes/gold/silver/bronze bloqueiam o tint do canal mesmo sem `naoTingir` no manifest | `Materiais3d.ts` | §1516 |
| 4 | **Metais PBR-safe** (§1549): `ALBEDO_METAL` aplicado no pipeline de cores (`userData.albedoForcado` — ouro nunca é #FFD700 no render; hex salvo intocado) + **clamp `corPbrSegura`** na cor do canal SÓ para famílias pele/metal (a cópia clampada morre no render) | `Materiais3d.ts` | §1631–§1634 |
| 5 | **Vidro/cristal/holograma/energia**: transmission/ior/thickness/sheen/clearcoat aplicados **apenas quando o material é MeshPhysicalMaterial** (GLTF via KHR_materials_* — nunca troca a classe do material); hologram/energy = **fallback emissivo em todos os tiers** + blend/opacity 0.85 (ShaderMaterial custom registrado p/ onda com assets) | `Materiais3d.ts` | P7-D |
| 6 | **Budget emissivo por RARIDADE** (§1636): `TETO_EMISSIVO_POR_RARIDADE` (comum 1.2 → mítico 2.0, monotônico, ≤ teto global §418.2) + `tetoEmissivo()`; `aplicarFamilias` recebe a raridade do manifest; **bloom seletivo** = teto por raridade × limiar alto dos looks (1420) — sem pass novo | `FamiliasMaterial.ts`, `Materiais3d.ts`, `Renderizador3d.ts` | P7-F |
| 7 | **GOLDEN_MATERIAIS M01–M12** (§1751): 12 casos família×tier com params esperados como snapshot LITERAL (registry mudou sem decisão ⇒ teste quebra, #83) + **cena de calibração** `montarCenaMateriais()`/`cenaMateriaisInfo()` no renderer (12 esferas MeshPhysicalMaterial pelo MESMO pipeline; gate `as6.qa_visual` no caller) | `FamiliasMaterial.ts`, `Renderizador3d.ts` | P7-B |
| 8 | **`validar-texturas.mjs`** (#209, NOVO — node puro): valida os 110 GLBs publicados — parse GLB + headers PNG/JPEG/**WEBP**; ERROS: E1 mesma imagem como cor sRGB E dado linear, E2 fator PBR fora de [0,1], E3 textura > 2× teto; AVISOS: A1 acima do teto da categoria (`TEXTURA_MAX` personagem/cenário 2048, parte/prop 1024), A2 não-POT, A3 meio-metal sem mapa, A4 BLEND sem baseColor; relatório em `evidencias/texturas-3d.json`. **Resultado real: 0 erros · 81 avisos A1** (partes com texturas 2048 — republicação = conteúdo, lista do Jhony) | `scripts/avatar/assets3d/validar-texturas.mjs` | P7-E |
| 9 | **Manifests superhero** declaram `familia` (skin/eyes/hair) nos materiais — metadado opt-in consumido SÓ com `as6.material_v2`; validador §487 segue aprovando | `base_superhero_m/f/manifest.json` | #165a |
| 10 | **Teste `materiais-familias.mjs`** (suíte 152→**153**): [A] tiers/golden/raridade/albedo/alpha/anisotropy/clamp + validador (parsers sintéticos, E1/E2 num glTF sintético, catálogo real sem erros, manifests coerentes com o registry) + [B] navegador (B1 OFF zero familia; B2 ON: 12 esferas batendo o golden, ouro com albedo físico e naoTingir, retomada de famílias pós context loss, zero erros JS) | `scripts/avatar/testes/materiais-familias.mjs`, `rodar-todos.mjs` | #83 |

## Decisões (registro #45)

- **#208** Famílias por TIER viram função pura de dado (`paramsFamiliaPorTier`) com skin/hair em 3 tiers e deltas travados; naoTingir/albedo/alpha/extras físicos aplicados pelo pipeline central (idempotente, `pbrOriginal` restaurável); teto emissivo por raridade ≤ teto global; holograma/energia ficam no fallback emissivo até haver onda de shader com assets (Ultra). Nada disso muda render sem `as6.material_v2` (OFF) — nenhuma flag nova.
- **#209** Texture pipeline = validador próprio node-puro (`validar-texturas.mjs`) com `TEXTURA_MAX` por categoria e erros/avisos nomeados; **achado registrado: 81 texturas de partes em 2048 px (teto 1024)** — republicar as partes com texturas reduzidas muda hashes em produção ⇒ item da lista "precisa do Jhony" (como #165b). Aplicar famílias aos UBC em produção (ligar `as6.material_v2`) só após before/after aprovado ★.

## Precisa do Jhony (não bloqueia)

- Before/after visual das famílias: console `as6.material_v2` (+ `as6.qa_visual` → `__avst3d.montarCenaMateriais('alto')` p/ as 12 esferas) → aprovar → ligar em produção.
- Republicação das 81 texturas de partes acima do teto (validador aponta; muda hashes — commit próprio autorizado).

## Próxima: 1422 — Body API, registry de morphs, persistência v2, QA de deformação (mapa claude/41).
