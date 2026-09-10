# AVST5 · Restauração do bottom-sheet mobile do Visual Composer (decisão #53)

## Contexto
Durante a auditoria final do mega "vestuário separado", a matriz de viewports acusou
overflow horizontal no mobile (320/360/390) com a flag `as6.vestuario_separado` ON. A
investigação (probe de layout + inspeção do CSS) provou que **não é um defeito do
vestuário**: é um bug **pré-existente** que afeta inclusive a flag OFF.

## Causa-raiz
A rodada "design overhaul" adicionou regras `.vc-root[data-vc] <el>` **sem `@media`**
(em `src/styles/visual-composer.css`, linhas ~352/367/368) que, por terem especificidade
`(0,3,0)` maior que as regras mobile originais (linhas ~115-144, seletores nus `(0,1,0)`),
**vazam o layout de desktop para o mobile**:

- `.vc-root[data-vc] .vc-corpo{grid-template-columns:64px minmax(0,1fr) 344px}` reimpõe no
  celular o grid de 3 colunas do desktop (64+344 = **408 fixos**);
- `.vc-root[data-vc] .vc-palco{padding:16px}` e
  `.vc-root[data-vc] .vc-palco-wrap{width:min(100%,78vh)}` — com `aspect-ratio:1/1`, força a
  coluna do palco em ~325px.

Com isso o conteúdo interno excedia a viewport (o `.vc-root{overflow:hidden}` mascarava
visualmente, mas o documento/elementos ultrapassavam a largura útil).

## Correção (CSS-only, mobile-only, reversível)
Reafirmar a **intenção mobile original** (bottom-sheet: trilho horizontal no topo, palco
dominante, painel como gaveta inferior com 3 detentes) dentro de `@media (max-width:768px)`
e `@media (max-width:768px) and (orientation:landscape)`, com a **mesma especificidade**
`.vc-root[data-vc]`, posicionada depois no arquivo — vencendo as regras do overhaul **apenas
no mobile**, **sem `!important`** e **sem mascarar** com `overflow-x:hidden`. Marcador
idempotente `VC-VEST-MOBILE`.

Principais reasserções (retrato): `.vc-corpo{grid-template-columns:1fr}`, trilho
`flex-direction:row; overflow-x:auto` (rolagem contida no componente), `.vc-palco{padding:8px 8px 0}`,
`.vc-palco-wrap{width:min(88vw,46vh)}`, `min-width:0` nos filhos de flex/grid, cabeçalho
compacto, alvos de toque ≥44px, `safe-area-inset-*`. Landscape restaura
`.vc-corpo{grid-template-columns:auto minmax(0,1fr)}`, trilho em coluna e
`.vc-palco-wrap{width:min(56vw,86vh)}`.

## Garantias
- **Desktop (≥769px) inalterado**: nenhuma regra fora de `@media` (verificado no build,
  fail-closed) e diff estrutural de rects no viewport 1280×900 = 0 entre o estado
  vestuário-sem-css e vestuário+css.
- **Flag OFF também corrigida**: o vazamento afetava a experiência clássica; a correção é
  no CSS do VC (independe da flag `as6.vestuario_separado`).
- Entregue em **commit separado** do vestuário, para revisão/reversão/transporte
  independentes. Sem push/deploy/rollout/flag nesta rodada.

## Rollback
`git checkout <base> -- public/components/panels/panel-avatar-studio/src/styles/visual-composer.css`
(ou remover o bloco entre os marcadores `VC-VEST-MOBILE`). Como é aditivo e mobile-only,
reverter não afeta o desktop nem dados salvos.
