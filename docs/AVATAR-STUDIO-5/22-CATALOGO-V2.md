# AVST5 · Catálogo visual V2 do Visual Composer (decisão #54)

## Objetivo
Transformar o catálogo do painel direito do VC em galeria visual: preview grande com
enquadramento por conteúdo, grid confortável de 2 colunas, fundo translúcido (sem bloco
branco), estado equipado inequívoco e favorito fora da geometria. Rodada de apresentação —
sem alterar semântica de asset nem formato salvo.

## Arquitetura (REUSO — fonte única)
O enquadramento do thumbnail reusa a fonte única já existente e testada:
`focoItemDe(assetId, categoria)` (`components/modoItem.ts`) → `FOCO_ITEM_ASSET` (medido por
asset) → `FOCO_ITEM_SUBCATEGORIA` → **`FOCO_CARD_CATEGORIA`** (`engine/enquadramento.ts`) → full.
O VisualComposer passou a chamar
`svgItemIsolado(it.id, { foco: focoItemDe(it.id, cat), premium: flag('as6.classico_premium'), faceV2: flag('as6.face_v2') })`
nas duas grades (catálogo e passos guiados). **Nenhum enquadramento hardcoded no VC** — a
tentativa inicial (`focoRecorteCatalogo`, #54 rascunho) foi descartada por duplicar a fonte.
Teste de contrato (`catalogo-contrato.mjs`, no `rodar-todos`) falha se o VC voltar a chamar
`svgItemIsolado(it.id)` cru ou introduzir foco hardcoded.

## Flag (§651)
`as6.catalogo_v2` (default **OFF**). OFF = catálogo clássico **byte-a-byte** (o atributo
`data-catalogo-v2` não é emitido; o thumbnail volta a `svgItemIsolado(it.id)` cru; nenhum CSS
novo alcança o caminho antigo — todo o CSS é escopado em `.vc-root[data-catalogo-v2]`).
Identidade comprovada por diff de DOM normalizado + hash de screenshot da grade (commit2 vs
commit3, flag OFF). Rollback = desligar a flag.

## UI (flag ON)
Grid 2-col (3-col só em `[data-grade="compacto"]`), card translúcido, thumb com halo radial
discreto (sem branco sólido, sem alterar a cor da peça), equipado = halo roxo + check no canto
superior esquerdo + etiqueta "Em uso" + `aria-selected`, favorito no canto superior direito
(fora do asset), estados hover/foco/selecionado/equipado/bloqueado, nome secundário, card
inteiro clicável, alvos ≥44px, estado vazio. Mobile herda a restauração #53 (2-col, sem
overflow, bottom sheet).

## Aceite
GRID_DEFAULT_COLUMNS=2 · WHITE_PREVIEW_BLOCKS=NO · CONTENT_BOUNDS_PREVIEW=PASS ·
MIN_OCCUPANCY≥55% (amostra medida) · CLIPPED_ASSETS=0 · EQUIPPED/FAVORITE/ARIA/KEYBOARD PASS ·
OVERFLOW=0 · CONSOLE/PAGE/FAILED=0 · FLAG_OFF_IDENTITY PASS · suíte completa verde (flag OFF) ·
DESKTOP_REGRESSION=0. Se um preset canônico causar clipping/ocupação baixa, corrige-se na
FONTE (`FOCO_CARD_CATEGORIA` ou override medido `FOCO_ITEM_ASSET`), nunca no VC.

## Métrica de ocupação/clipping (auditoria — decisão #55)
A auditoria de ocupação (`catalogo-occ.mjs`, ferramenta — não vai ao commit) mede clipping pela
**fração da bbox do asset que fica fora da janela** (o quanto foi de fato cortado), não por
"qualquer pixel além da borda". Um CLIP-defeito exige: não ser região-crop intencional
(`occLin<100`) **e** ter parte significativa (>12% da bbox) fora do viewBox. Overflow pequeno
(≤12%) de uma feature decorativa na borda — p.ex. o coque de `cabelo/cab_coque`, que ultrapassa
levemente o crop canônico `cabelo` (`58 30 124 110`) enquanto preenche ~79% linear / ~57% de
área — é enquadramento aceitável, não corte, e o preset canônico §12 (compartilhado com
GradeItens/DetalheAsset/Coleções) permanece intacto. Seed de vestuário `ace_tenis_futuro` recebeu
override medido em `FOCO_ITEM_ASSET` (`60 290 120 120`, região dos pés) por cair no canvas cheio —
correção na FONTE, beneficia todos os consumidores.

## Correção de regressão do commit 1 + gate honesto de suíte (decisão #56)
A suíte completa (`rodar-todos`), rodada pela 1ª vez no worktree, expôs 2 coisas: (a) 44 vermelhos
de **ambiente** — o worktree novo não herda `node_modules` (gitignored) e os testes que compilam TS
via `esbuild` falhavam; corrigido linkando `node_modules` do repo no worktree antes da suíte; (b) a
`golden-classic` acusava 37 `GOLDEN PREMIUM MUDOU (doutrina #83)` **pré-existentes no `origin/main`**
(drift de hash neste ambiente headless) + **2 subfalhas NOVAS do commit 1**: `[I]` (`itensDe('roupa_inferior')`
não-vazio com flag OFF) e `[J]` (`ace_tenis_futuro` sem ficha no registry). Ambas são §651: as peças
SEED (`rin_shorts`/`rin_futurista`/`ace_tenis_futuro`) vazavam no catálogo CLÁSSICO. Correção **na fonte**,
dentro do commit 1: `itensDe` passa a gatear os `VESTUARIO_SEED_IDS` pela flag `as6.vestuario_separado`
(itemPorId segue resolvendo — rollback esconde UI, nunca descarta dado); e `ace_tenis_futuro` ganha ficha
em `AcessoriosRegistry.ts` (espelha `ace_tenis_neon`). Gate de entrega passa a ser **regressão-zero**:
verde total não é exigível neste ambiente (golden premium/3D/evidência não-determinística já falham no
main), então o portão é `SUITE_REGRESSION=PASS` = nenhum vermelho NOVO vs baseline `origin/main` **e**
`golden-classic` sem `[I]/[J]`.

## Commit
Commit 3 (separado, sem squash): `VisualComposer.tsx` (reuso do foco), `flags.ts` (flag),
`visual-composer.css` (bloco `VC-CATALOGO-V2` escopado), `catalogo-contrato.mjs` +
registro no `rodar-todos`. Sem push/deploy/rollout/flag real.

## Rodada corretiva (decisão #57)
Pós-auditoria humana: (a) gate de ocupação era rotulado GE_55 mas testava <40 — corrigido p/ fail-closed@55 REAL sobre ocupação VISÍVEL (paint dentro do viewBox); bocas finas (boc_neutra/determinada) receberam override MEDIDO em FOCO_ITEM_ASSET (preset único não serve 24px e 36px juntos). (b) Métrica de clipping reescrita: mede paint visível e CLASSIFICA por item (recorte intencional de região/corpo-inteiro vs corte destrutivo) — sem clip=0 por decreto. (c) Touch lot-scope: favorito com área efetiva 44×44 real (ícone 26 via ::before, rodapé reservado sob [data-catalogo-v2], zero sobreposição com asset/check), stopPropagation, auditor de hit-test real (elementFromPoint + disparo + isolamento fav↔card). Débito app-wide documentado em AVATAR_STUDIO_TOUCH_DEBT.md (não mascarado). (d) manifest-assets.json regenerado (itens do seed). Commit 4 em cima do C3, sem reescrever 1-3.
