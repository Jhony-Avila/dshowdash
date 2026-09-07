# ART_INTAKE_SAMPLE_REPORT — o gate técnico em ação

> **AUTOMATED TECHNICAL GATE ≠ ART QUALITY GATE.** Este documento mostra o que o
> `art-intake.mjs` faz e o que ele **não** faz. Ele não julga arte, não dá nota,
> não aprova. Os únicos veredictos que ele emite são **`TECHNICAL_FAIL`** e
> **`TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW`**. A nota da arte (≥8,
> aprovar/reprovar, Gate A) é **exclusivamente do Jhony**.

Decisão: **#68** (GOLDEN V4.3 FINAL, Track B). Enquanto
`ART STATUS = BLOCKED_ON_ART_SOURCE` não há `.svg` de artista; o gate é provado
sobre **fixtures técnicas** (`scripts/avatar/art-intake/fixtures/`).

## O que o gate faz (orquestração, sem pipeline novo)
Para cada par `<nome>.svg` + `<nome>.json` (manifesto):

1. **SEGURANÇA P0** (`art-intake/validador-svg.mjs`) — rejeita `<script>`,
   `<foreignObject>`, `<image>`/raster, `on*` handlers, `javascript:`, `href`/
   `url()` externos, `@import`/fonte externa, elementos fora do allowlist.
   Permite `url(#id)` e `href="#id"` internos.
2. **CONTRATO** (`art-intake/validador-contrato.mjs`) — viewBox 240×240 (busto)/
   240×400 (corpo) casando o `frame`; fundo transparente; ids únicos;
   `data-hero-layer`/`data-channel`/`data-tone`/`data-material` de vocabulário
   fechado; âncoras mínimas por família (rosto→olhos+boca; corpo→ombro+cintura;
   roupa→gola+barra; calçado→tornozelo+solado; …).
3. **MOTOR REAL** (`art-intake/resolver.mjs` → `engine/heroAssetImport.ts`) — o
   MESMO importador da produção. Sem parser paralelo, sem mock. Confere os
   invariantes técnicos: determinismo (2× = mesmos bytes), a paleta muda o
   render (customizável §24), nenhum `data-*` de autoria vaza, e as curvas `d=`
   autoradas ficam **intactas** (o motor integra, não redesenha, §5).
4. **RENDERS p/ o olho humano** — `FINAL` (paleta A) · `TARGET` (tamanho de
   card) · `BLACK` (silhueta) · `GRAYSCALE` (valor) · `APPLIED` (paleta B,
   recolor). Reusa `testes/visual/captura.mjs` + `sharp`.

Se qualquer passo 1–3 falha → **`TECHNICAL_FAIL`**, com arquivo/elemento/
problema/como-corrigir, e **nada é renderizado** (não se conserta arte em
silêncio, §30/§38).

## Amostra PASS (fixtures válidas)
`node scripts/avatar/art-intake.mjs` sobre `fixtures/validos/`:

| asset | família | status | motor real |
|---|---|---|---|
| blazer | roupa | `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW` | usaCores=[roupa,destaque]; hooks atrás/sombra/frente/corpoV2; determinístico; paleta muda; sem data-* |
| face_male | rosto | `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW` | usaCores=[pele,cabelo,destaque]; âncoras coroa/testa/olhoE/olhoD/boca |
| face_female | rosto | `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW` | idem; distinta do male (ver identity) |

Cada PASS gera um strip de 5 painéis (`<asset>_INTAKE.png`) — **evidência**, não
nota. **PASS técnico não é aprovação de arte**: o Jhony julga FINAL/TARGET/BLACK/
GRAYSCALE/APPLIED a olho.

### CHARACTER IDENTITY (anti sibling-syndrome, §39)
`scripts/avatar/art-intake/identity.mjs` (caminho **rastreado**, não mais o
scratch efêmero `tools-golden/v42face.ts`) reusa `comparar-visual.mjs` (ΔE
CIE76 + % de pixels diferentes) para medir DISTINTIVIDADE dos rostos PASS:

| par | % diferente | ΔE médio | veredito técnico |
|---|---|---|---|
| face_female × face_male | 26.27% | 7.6 | distintos (≥ 12% ⇒ não é candidato a sibling) |

De novo: número, não nota. Pares abaixo do limiar viram **candidatos a sibling**
para o olho humano — a decisão MERGE/VARIANT/REWORK é do Jhony.

## Amostra FAIL (fixture inválida — o gate barrando)
`node scripts/avatar/art-intake.mjs fixtures/invalidos/` sobre `blazer_ruim.svg`
(um SVG hostil de propósito) → **`TECHNICAL_FAIL`, 8 violações, zero render**:

| gate | elemento | problema |
|---|---|---|
| SECURITY_P0 | `<script>` | execução de código |
| SECURITY_P0 | `<image>` | raster (arte é vetor) |
| SECURITY_P0 | `<image href>` | recurso externo (`https://…`) |
| CONTRACT | `<rect> fundo` | retângulo opaco cobrindo o canvas |
| CONTRACT | `data-hero-layer="hipernova"` | camada desconhecida |
| CONTRACT | `data-channel="uranio"` | canal desconhecido |
| CONTRACT | `id="g1"` | id duplicado |
| CONTRACT | `data-anchor` | âncora "barra" ausente (família roupa) |

Cada linha traz o **como-corrigir**. O motor **não rodou** — arte quebrada volta
para a origem, não é "consertada" pelo engine.

## Cobertura de teste
`scripts/avatar/testes/art-intake.mjs` (na suíte, `rodar-todos.mjs`): válido→PASS;
`<script>`/`<foreignObject>`/`<image>`/href externo/`on*`/`javascript:`/`url()`
externo → FAIL; viewBox errado/fundo opaco/id duplicado/layer/canal desconhecido/
âncora ausente → FAIL; determinismo 2×; paleta muda render; curva `d=` intacta;
sem vazamento de `data-*`; e o veto ao vocabulário de status (nunca
`ART_APPROVED`/`GATE_A_APPROVED`/`8-10-APPROVED`).

## Como o artista usa
Molde: `docs/AVATAR-STUDIO-5/V4_HERO_ASSET_TEMPLATE.svg`. Entrega um `.svg` +
`.json`; roda-se `art-intake.mjs`; se `TECHNICAL_FAIL`, corrige pelo relatório;
se `TECHNICAL_PASS_AWAITING_HUMAN_ART_REVIEW`, o strip vai ao Jhony para a nota
de arte.
