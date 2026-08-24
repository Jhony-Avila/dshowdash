# GOLDEN V4.2 — VISUAL PRODUCT CHECKPOINT

> Base validada pelo Jhony: `d8ba53bc`. Esta rodada responde ao briefing
> **GOLDEN V4.2 — ONE 2D / VISUAL CONVERGENCE** (60 seções). Dois eixos
> co-iguais (§60): **produto** (2D único) e **arte** (personagem premium).

## STATUS FINAL (§57)
- **PRODUTO — SINGLE 2D CONVERGENCE: DELIVERED.** A troca de modo ("Modo
  clássico"/"Voltar ao modo clássico") sai da experiência principal; um único 2D.
- **ARTE — `V4.2 — BLOCKED_ON_ART_SOURCE` (§57-B).** Nenhum Hero crítico do
  Golden Set atinge 8/10 absoluto por autoria em código (§28). Pedidos de arte
  prontos para ilustrador entregues (`art-requests/`). Não há terceira opção
  (§57): não entreguei "mais infra com arte 6/10" nem fingi aprovação (§27).

## Eixo PRODUTO — o que mudou (decisão #64)
Flag interna **`as6.single_2d`** (default **OFF** → produção byte-idêntica; §5/§55).
Com ON, na experiência principal:
- **BarraTopo**: botão "Modo clássico" **escondido** (§36).
- **Paleta (Ctrl+K)**: comando "Voltar ao modo clássico" **escondido** (§36).
- **Compat/QA** (§37): ambos reaparecem **só** sob `as6.qa_route` (rótulo "Compat
  clássico (QA)"), nunca na experiência comum.
- **Segurança**: o error-boundary de recuperação ("Voltar agora") **permanece
  sempre** (§2).
- Puro conditional render — **sem campo serializado novo, sem mirror PHP**,
  save/load intocado (§58). Depende de `as5.novo_shell` (só faz sentido no shell).
- Prova E2E no browser real: `v42-single2d.mjs` (na suíte) + board
  `16_V42_SINGLE_2D_FLOW.png` (ON = troca ausente; OFF = presente; QA = compat).

Presentation também provada (engenharia que já funciona, não é arte):
`15_V42_CATEGORY_FOCUS.png` (o que edito domina o viewport — §33/§34) e
`14_V42_ASSET_CARDS.png` (card=asset · stage=asset no personagem — §35).
**Gap honesto conhecido:** categoria Calçados ainda não reenquadra nos pés
(§34) — `ENQUADRAMENTOS` não tem preset de footwear; deixado como item de
produto (sem arte de calçado, aproximar da cunha triangular não ajuda).

## Eixo ARTE — scorecard absoluto (§50/§51) — nota 8 = produto profissional
| Hero | Nota | Verdicto (§40) |
|---|---|---|
| BODY | 5/10 | ART SOURCE REQUIRED |
| FACE | 4/10 | ART SOURCE REQUIRED |
| HAIR | 3/10 | ART SOURCE REQUIRED |
| HAND | 3/10 | ART SOURCE REQUIRED |
| FOOTWEAR | 2/10 | ART SOURCE REQUIRED |
| T-SHIRT | 4/10 | ART SOURCE REQUIRED |
| HOODIE | 4/10 | ART SOURCE REQUIRED |
| BLAZER | 4/10 | ART SOURCE REQUIRED |
| FULL CHARACTER | 4/10 | BLOCKED (montagem) |
| PRESENTATION | 7/10 | (produto — não é arte) |

Diagnóstico e defeitos em `art-requests/CHEAPNESS_TELLS_V42.md`. Evidência real
nos boards (color/grayscale/black/target size). Por que ART SOURCE e não mais
hand-code: `art-requests/INDEX_V42_GOLDEN_SET.md` (§27/§28/§59).

## Pacote de arte entregue (a consequência — §39/§40)
`art-requests/`: INDEX_V42_GOLDEN_SET · CHEAPNESS_TELLS_V42 · ART_REQUEST_{BODY,
FACE,HAIR,HAND,SNEAKER,TSHIRT,HOODIE,BLAZER,PANTS,FULL_HERO}. Cada pedido:
canvas/frame · âncoras · massas · camadas (`data-hero-layer`) · canais · material
· `fitClass` · silhouette target · black/grayscale/target-size test · refs ·
export. O pipeline `HeroAsset2D`/`importarHeroAsset` já consome esse formato —
**arte entra sem código novo** (só arquivo + manifesto).

## Complemento — FACE REVOLUTION / CHARACTER IDENTITY LOCK
Briefing complementar: a face não tem identidade suficiente — **SIBLING SYNDROME**
(muitos IDs, uma pessoa). Determinação: **FACE = ART SOURCE REQUIRED (§47)**,
provada objetivamente e com pedido de arte completo.
- **CHARACTER_IDENTITY_GATE (métrica):** mean pixel diff (0..255) entre pares,
  limiar de identidade ≈ 12. Medido na arte ATUAL: `IDENTITY_12 = 1.2` ·
  `grayscale = 1.2` · `BALD = 5.1` · `FACE_SHAPES_BLACK = 8.2` → **todos abaixo
  do limiar = REPROVA**. Ferramenta repetível: `tools-golden/v42face.ts`.
- **Boards de face:** `00_V42_FACE_MASTER` · `02_V42_FACE_SHAPES_BLACK` ·
  `12_V42_FACE_IDENTITY_12` · `13_..._GRAYSCALE` · `14_..._BALD`.
- **Pedido:** `art-requests/ART_REQUEST_FACE_LIBRARY.md` — linguagem por volumes
  (§13), Golden set 4 heads/4 eyes/4 brows/4 noses/4 mouths/2 ears/3 cheeks/3
  jaw-chin (§27), 2 hero faces (§40), testes de aceite (identity gate, remove
  color/hair/features, target size, no-label). **AUTHORED ART, não param (§39).**
- **Não construído nesta rodada (honestidade §39/§8):** reclassificação de
  taxonomia (SARDAS→pele; ANDROIDE/HOLOGRAMA→special) e editing-visibility
  (§11/§12) — engenharia que não melhora o rosto enquanto a arte é o gargalo;
  especificados no pedido para quando a arte existir.

## Boards (§52) — 00–16 completos
`00_V42_MASTER` (scorecard+status) · `01_V32_V42_GENERATION_COMPARE` ·
`02_V42_FULL_MALE` · `03_V42_FULL_FEMALE` · `04_V42_BODY_PROFILES` ·
`05_V42_BODY_BLACK` · `06_V42_FACE_MF` · `07_V42_HAND` · `08_V42_SNEAKER` ·
`09_V42_HAIR` · `10_V42_TSHIRT` · `11_V42_HOODIE` · `12_V42_BLAZER` ·
`13_V42_OUTFIT_FIT` · `14_V42_ASSET_CARDS` · `15_V42_CATEGORY_FOCUS` ·
`16_V42_SINGLE_2D_FLOW`. Entregues ao Jhony no chat.

## Regime respeitado (§55)
Sem deploy · sem main · sem rollout · sem `--gravar` · flags visuais OFF em
produção. `main=bf655221` IMUTÁVEL. Entrega por colar em `golden/art-wip`.

## Precisa do Jhony
(1) **ART SOURCE** para o Golden Set (§41) seguindo `art-requests/` — o pipeline
os veste sem código novo. (2) Veredito visual quando a arte existir (Gate A).
(3) Flip de `as6.single_2d` em produção quando aprovar a convergência (rollback =
desligar a flag). (4) `--gravar` dos goldens premium é passo humano pós-approval.
