# V4.3 TRACK A — FINAL REPORT & FREEZE

> **Status: `TRACK_A_READY_FOR_HUMAN_REVIEW`.** Track A (PRODUTO — o "2D único"
> real) está fechado e congelado. Track B (ARTE) permanece
> `BLOCKED_ON_ART_SOURCE`. Os dois são independentes (§52/§53): o produto pode
> estar READY com a arte BLOCKED. Nada aqui aprova ARTE.

Decisão associada: **#68** (GOLDEN V4.3 FINAL). Base: `origin/golden/art-wip`.
Produção (`origin/main`) **intocada** — tudo atrás de flag `as6.single_2d`
(default OFF).

## 1. O que Track A entregou (produto 2D único)

| Frente | Antes | Agora (single_2d ON) |
|---|---|---|
| Experiência 2D | duas (shell + "modo clássico" paralelo) | **uma** — o shell absorve as ferramentas clássicas |
| Troca de modo | botão exposto na experiência principal | removido da experiência principal (§1/§36/§58) |
| 9 ferramentas clássicas | tela separada | abrem **dentro** do shell (`Ferramentas2D.tsx`, overlay) |
| Navegação | plana | agrupada `criar` / `perfil` (§11) com subrótulos |
| Category Focus | 2 mecanismos concorrentes (dock fit-to-view × número mágico do calçado) | **fonte única** `focoDe`/`FOCO_FINO` (§5/§7-10) |

### 1.1 Category Focus — a correção de fundo (§7-10)
O foco por categoria tinha **duas fontes de verdade** brigando: o modo dock
(fit-to-view) desligava o zoom fino, e o calçado focava por um `scale(1.6)` /
`84%` mágico. Ambos foram removidos. Todo o foco automático (single_2d ON) agora
deriva de **`focoDe(categoria, slot)` → `FOCO_FINO`** — a mesma fonte única que
o card usa. Calçados derivam de `FOCO_FINO.pes`, sem número mágico.

Prova **semântica** (não string de viewBox): `testes/v43-category-focus.mjs` lê a
CÂMERA REAL aplicada no browser (transform + transform-origin do `.avst5-zoom`,
medidos contra a altura de LAYOUT) e afirma:

| Categoria | Render | zoom | centroY | Critério (§9) |
|---|---|---|---|---|
| Rosto | busto | 1.515 | 0.35 | cabeça enquadrada ✓ |
| Olhos | busto | 1.786 | 0.40 | amplia **mais** que Rosto ✓ |
| Cabelo | busto | 1.25 | 0.27 | cabeça enquadrada ✓ |
| Roupa | corpo | — | 0.44 | torso ✓ |
| Calçados | corpo | 1.563 | **0.909** | pés dominam (≥0.78 e > Roupa+0.1) ✓ |

## 2. Definition of Done (Part 5) — verificação

| DoD | Estado |
|---|---|
| Category Focus V4.3 semanticamente verde | ✅ `v43-category-focus.mjs` verde |
| Calçados realmente focam os pés (fonte única) | ✅ centroY 0.909, deriva de `FOCO_FINO.pes` |
| Ferramentas clássicas absorvidas no shell | ✅ `Ferramentas2D.tsx` (renomeado de `FerramentasClassicas`) |
| PRODUCT E2E (entry→edit→tools→SAVE sem sair do shell) | ✅ `v43-single2d-flow.mjs` |
| COMPATIBILITY E2E (avatar legado abre/renderiza/salva) | ✅ `v43-legacy-compat.mjs` |
| Navegação agrupada (§11) | ✅ `taxonomia.ts` + `TrilhoCategorias.tsx` |
| Comentários obsoletos atualizados | ✅ `taxonomia.ts`, `DetalheAsset.tsx` |
| Byte-stability produção (flag OFF) | ✅ toda mudança gated em `as6.single_2d` (default OFF) |
| Suíte verde | ✅ (ver §4) |

### 2.1 PRODUCT vs COMPAT E2E (§13) — separação
São **testes distintos** com responsabilidades distintas, e assim permanecem na
suíte: `v43-single2d-flow.mjs` prova o **fluxo de produto** (criar/editar/salvar
no shell único); `v43-legacy-compat.mjs` prova **compatibilidade/rollback** (um
avatar salvo antes abre, renderiza e volta a salvar no shell único, sem
regressão de bytes). Um cobre "o novo caminho funciona"; o outro, "o caminho
antigo não quebrou".

## 3. FREEZE de Track A
As responsabilidades de PRODUTO do 2D único estão **congeladas** nesta base. A
partir daqui, mudança no comportamento de produto exige nova decisão numerada.
O motor de enquadramento (`engine/enquadramento.ts`) e o de importação de arte
(`engine/heroAssetImport.ts`) são a **fonte única** — não se cria mecanismo
paralelo de foco nem parser paralelo de arte.

## 4. Verificação (headless)
`node scripts/avatar/testes/rodar-todos.mjs` — suíte completa. Testes novos/tocados
verdes individualmente: `v43-category-focus`, `art-intake`, `v43-single2d-flow`,
`v43-single2d-parity`, `v42-single2d`, `v43-legacy-compat`, `enquadramento`,
`footwear`, `dock-fit`, `corpo-preview`, `dock-inferior`, `regressao-layout`,
`viewport-as6`. TSC do painel: `TSC_EXIT=0`.

## 5. O que NÃO foi feito (fronteira de autonomia)
Nada de merge em `main`, deploy, rollout, `--gravar`, ou aprovação de Gate A —
isso é do Jhony. A **validação visual e de sessão autenticada** é do Jhony.
A **nota da arte** é do Jhony (Track B segue BLOCKED).
