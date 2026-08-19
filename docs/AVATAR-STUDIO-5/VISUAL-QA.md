# VISUAL QA — Quality Bar, matriz, Hard/Soft Fail, fluxo de aprovação (v1 · onda 1405 · MEGA_BRIEFING_01 §4, §12, §32–§37, §65–§67, §2663–§2677, §2977–§2985)

> Complementa `ART-BIBLE.md` (direção) e `GOLDEN-TESTS.md` (casos de referência). TechnicalQA + VisualQA = production-ready (§32–§33). Um asset tecnicamente correto **pode ser reprovado artisticamente**.
> Estados e campos viram DADO em `MetadadosAssets` (2D) e no manifest §517 v2 (3D) a partir da onda 1406 — nunca no `AvatarConfig`.

## 1. Os 18 eixos do Avatar Visual Quality Bar (§4)

1 Silhueta · 2 Proporção/anatomia · 3 Rosto (estrutura) · 4 Olhos · 5 Pele · 6 Cabelo · 7 Roupa (forma/construção) · 8 Materialidade · 9 Acessórios (fit/integração) · 10 Iluminação · 11 Sombras/contato · 12 Câmera/enquadramento · 13 Profundidade/fundo · 14 VFX (hierarquia) · 15 Coerência estilística (Art Bible) · 16 Close-up · 17 Movimento/idle · 18 Legibilidade em thumbnail.

Escala por eixo: 0–10. **Notas mínimas por nível** (§65): `production` ≥ 6 em todos e ≥ 7 em rosto/olhos/coerência · `premium` ≥ 8 em todos e ≥ 9 em rosto/olhos/close-up/integração/clipping/coerência · `hero` ≥ 9 em todos. Qualquer Hard Fail → `rejected` independentemente da nota.

## 2. Distâncias de avaliação (§12)

| Distância | O que se avalia | Câmera 3D / enquadramento 2D |
|---|---|---|
| A — Thumbnail | legibilidade, silhueta, cor dominante | thumb 128–256 px (Modo Item para acessórios) |
| B — Corpo inteiro | proporção, postura, roupa, grounding | preset `corpo` (FOV 32–34°) / corpo 240×400 |
| C — Busto/¾ | cabelo, rosto, acessórios de cabeça/pescoço | preset `busto`/`tresquartos` / busto 240×240 |
| D — Close-up | olhos, pele, boca, materiais, costuras | preset `rosto` (FOV 24°, 85 mm-eq.) / `PRESETS_CAM6.rosto` |

Testes complementares (§141–§146): silhouette (preto sobre branco), grayscale (valor sem cor), clay (material neutro), lighting-only, backlight (transparência/halo de cabelo), em movimento (3 frames de idle/wave, §37).

## 3. Hard Fail (→ REJECTED, bloqueia promoção a Q2+ e destaque; nunca bloqueia render de legado) (§66, §1921, §2505–§2506, §2676)

- Clipping evidente em pose neutra/idle (cabelo×cabeça, roupa×corpo, acessório×cabelo) · pés fora do chão · proporção fora do envelope do Art Bible.
- Rosto: artefato em close-up; olhos desalinhados com a base; sclera #FFFFFF puro; íris flat sem profundidade (premium+); skin tone só na cabeça.
- Cabelo: "capacete" (sem contato com a cabeça/sem silhueta); raiz flutuando; sob chapéu sem máscara quando declarada.
- Roupa: pintada no corpo (premium+); camisa atravessando blazer; silhueta idêntica entre peças "diferentes".
- Acessório: primitive mesh visível como final; fit fora do socket; bounds fora do frame no preset da categoria; conflito silencioso (item some sem aviso).
- Materiais: metalness intermediária generalizada; emissive acima do teto; bloom mascarando arte; textura faltando (branco/preto sem fallback).
- Luz/câmera: pele estourada/esmagada no look; câmera dentro do rosto/abaixo do chão; thumb ≠ palco (tone mapping/env divergentes).
- VFX: efeito cobrindo a elipse facial em portrait; loop com salto visível; tier econômico perde identidade da família.
- Pipeline: licença ausente; ID duplicado; thumb/preview ausentes; LOD que muda identidade; hash divergente.
- Regra de ouro: **qualquer mudança de bytes em avatar/foto salvos causada por código novo** (goldens g01–g16) é Hard Fail de engenharia — tripwire da suíte.

## 4. Soft Fail (→ `approved_with_notes`; libera só com issue + owner + severidade + prazo, §3082)

Highlight plástico; gradiente genérico; sombra de contato fraca; thumb com ocupação fora de 70–85%; pequena variação de tom entre tiers; catchlight fixo; transição de LOD perceptível; micro-clipping só em pose extrema; nome/descrição pobres; sem variante portrait-safe (aura).

## 5. Estados de QA (§2675) e ficha

`pending` → `approved` | `approved_with_notes` | `rework` | `rejected`. Ficha (JSON, um por asset/versão; salva fora do público em `storage/visual-qa/<id>/` e resumida no manifest `qa`):

```json
{
  "assetId": "cab_px_longo", "versao": "1.0", "artBibleVersion": "1.0",
  "status": "approved_with_notes", "reviewer": "jhony", "data": "2026-08-2X",
  "notas": { "silhueta": 9, "proporcao": 8, "rosto": null, "olhos": null, "pele": null, "cabelo": 9, "roupa": null,
             "materialidade": 8, "acessorios": null, "iluminacao": 8, "sombras": 8, "camera": 9, "profundidade": 8,
             "vfx": null, "coerencia": 9, "closeup": 8, "movimento": 8, "thumbnail": 9 },
  "hardFails": [], "softFails": ["highlight levemente plástico no tier eco"],
  "evidencias": ["cab_px_longo_v1_front.png", "cab_px_longo_v1_34.png", "cab_px_longo_v1_profile.png", "cab_px_longo_v1_closeup.png"],
  "observacoes": "…"
}
```

`null` = eixo não se aplica ao tipo do asset.

## 6. Checklists por categoria (resumo; detalhe por parte nos digests)

- **Corpo** (§238–§244, §400): parado/animado/vestido/LOD/câmeras; poses A–H + stress; pés no chão; silhueta LOD0≈LOD2 (IoU ≥ 0,97); pendências do assembler = 0.
- **Rosto** (§595–§597, §701–§708): front/¾/perfil/close-up; neutral+smile+serious; blink; 3 tons de pele em Studio e Hero; trocar cabelo/barba/óculos não quebra a face; 4 goldens "não parecem irmãos".
- **Cabelo** (§881–§883, §897): silhueta/clay/backlight; hairline; fit com cabeça; headwear (visible/masked/variant/hidden); LOD sem pop; dark/blonde/white.
- **Roupa** (§1124–§1134, §1220): estática/animação/morph/layering/material/LOD/perf; preto/branco/saturado/metálico; sem "corpo nu" na transição.
- **Acessório** (§1397–§1406, §1495): cenas HEAD/FACE/NECK/BACK/WRIST/HAND/PET_QA; 2 bodies × 3 cabelos × 3 roupas × 3 peles; stress 9 itens; câmera por categoria.
- **Material** (§1665–§1677): M01–M12 na mesma luz/câmera; Studio/Hero/Neon/Portrait; roughness média/metalness bimodal; emissive ≤ teto.
- **Luz/câmera** (§1917–§1925): matriz pele clara/escura × studio/hero; metal/vidro × product; cabelo escuro × portrait; cabeça e pés no frame (male/female/tall/wide/pet/wings).
- **VFX/cenário** (§2247–§2258): claro/escuro × 3 câmeras × 3 peles; loop; overdraw/FPS; `cobreRosto()`.
- **Classic 2D** (§2498–§2510): male/female × full/bust/face legado vs premium; orçamento bytes/nós/filtros; sanitizer sem `SVG_*_PROIBIDO`; export não perde asset.
- **UX/funcional/mobile/a11y/legado** (§2979–§2985): equip/remove/multi/undo/redo/save/history/photo/vitrine; scroll/foco/sidebar/tabs/thumbs/loading; responsivo; teclado/foco/reduced-motion/contraste/labels; modo anterior intacto com flags OFF.

## 7. Fluxo (§34, §2974–§2976, §3055)

1. Gate técnico (`validar-asset.mjs` / lint 2D / suíte) verde.
2. Renders de homologação padronizados (`gerar-renders-homologacao.mjs`, onda 1409) + regressão visual (`regressao-visual.mjs`, onda 1407).
3. Ficha preenchida (auto: hard fails mensuráveis; humano: notas) → estado.
4. **Aprovação humana do Jhony** para premium/hero e para todo Golden (gates §183, §400, §701, §897, §1220, §1495, §1751, §2032, §2286, §2560).
5. Baseline só muda após aprovação (`--aprovar` + nota no mesmo commit, doutrina #83). Nunca atualizar baseline automaticamente.
6. Owner: Jhony (veredito visual) + agente (evidências, fichas, regressão). `approved_with_notes` gera issue rastreada no `visualDebt` (§158).

## 8. KPIs (§157, §3037–§3038)

`Premium Coverage %` (principal) · % production-ready por categoria · Visual QA pass rate · clipping defect rate · Golden regression failure rate · runtime asset error rate · tempo médio de aprovação · Visual debt burn-down por área (`kpi-visual.json`, onda 1406).

## 9. Visual Debt inicial (preenchido na onda 1405 pelo `inventario-visual.md`)

| Área | Dívida | Nota |
|---|---|---|
| Corpo 3D | alta | só UBC superhero; morph = escala; LODs idênticos |
| Rosto 2D/3D | alta | olhos/íris fixos, sobrancelha cozida, sem nariz; 3D sem morphs |
| Cabelo | alta | 2D camada única; 3D 6 partes econômicas, cards opacos |
| Roupas | alta | 2D scaffold único (roupa só muda a cor do corpo); 3D peasant/ranger |
| Acessórios | média (2D) / alta (3D) | 2D 75 artes flat+gradiente; 3D 9 placeholders procedurais |
| Materiais | alta | sem famílias; só tint por canal |
| Luz/câmera | média | infra boa; sem registry/looks/golden; reset de câmera |
| VFX/cenários | média | base cosmética sólida; sem registries/diretor/profundidade |
| Classic 2D | alta | flat + 1 gradiente + brilho branco; sem layering/sombra/material |
| Pipeline/QA | média | gate técnico bom; zero regressão visual/Visual QA |
