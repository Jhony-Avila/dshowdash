# Dívida de acessibilidade — alvos de toque <44×44 (fora do escopo deste lote)

Registro (NÃO é aceite) da dívida pré-existente de touch-target do Avatar Studio, para
priorização em lote dedicado. O commit 4 deste candidato corrige **apenas** os controles
introduzidos/alterados pelo lote (favorito do Catálogo V2, card, alça da sheet, categorias/slots
novos); o restante abaixo já existia no `origin/main` pristino (`[mob before] touchBad=49`) e
**não** é regressão deste lote.

## Por que "97" agora e "49/43/14/2" antes
Números diferentes = métricas diferentes, não pioras:
- **49** — `origin/main` pristino, contagem RAW (por ocorrência) no pior viewport, catálogo clássico (flag OFF), grade com menos cards renderizados.
- **43** — candidato pós-CSS mobile, RAW pior viewport, também flag OFF.
- **97** — candidato com **flags ON** (vestuário separado + catálogo V2): a grade renderiza o catálogo completo, e cada card soma 1 favorito (22×22) → dezenas de ocorrências do MESMO seletor `.vc-fav`. É contagem RAW (por ocorrência × viewport), não componentes únicos.
- **14 / 2** — auditorias com critério/DOM mais estreitos (`vc-vest-audit` mede um subconjunto em 3 viewports).

A partir de agora o relatório separa quatro números para evitar essa confusão:
`RAW_TOUCH_FAILURES`, `UNIQUE_TOUCH_FAILURES`, `LOT_SCOPE_TOUCH_FAILURES`, `PREEXISTING_OUT_OF_SCOPE_TOUCH_FAILURES`.

## Componentes fora do escopo (a corrigir em lote de acessibilidade dedicado)
Ordem recomendada (frequência de uso × risco):

1. **Ações primárias da barra** — `.vc-acao` (40×35), `.vc-salvar` (40 alt). Alta frequência. Baixo risco de colisão. Bump min-height/hit para 44.
2. **Voltar / fechar / recolher** — `.vc-recolhe` (36×36), `.vc-onboard-x`, fechar de sheets (`.vc-sheet-cab button` já 44 ok). Média frequência.
3. **Navegação principal / abas** — `.vc-catnav button`, abas Catálogo/Favoritos/Atual (~34 alt). Média.
4. **Toolbar / modo** — `.vc-modo-op` (40×35, 2D/3D), `.vc-reframe`, `.vc-icone-nav`, `.vc-filtro-btn` (34 alt). Média.
5. **Trilho** — `.vc-cat` desktop 48×48 (ok ≥44); mobile 56/52 (ok). Sem dívida relevante.
6. **Controles 3D** — `.vc3d-cam-btn` (32 alt) e toolbar do Palco 3D / QA Studio. Fora do 2D deste lote.
7. **Ações secundárias** — subtabs `.vc-sub` (34 alt), chips.

Para cada um: técnica preferida = ampliar a **área efetiva** (padding transparente / pseudo-elemento / wrapper) mantendo o ícone visual, com verificação por hit-test real (mesmo auditor `vc-touch-hit.mjs`), sem aumentar densidade onde não for necessário. Impacto visual esperado: mínimo (área, não ícone).

## Não mascarar
Este documento registra a dívida; não a marca como resolvida e não altera o auditor para ignorá-la.
O gate do lote é `LOT_SCOPE_TOUCH_FAILURES=0` + `NEW_OUT_OF_SCOPE_TOUCH_FAILURES=0`; o número pré-existente é reportado explicitamente, não zerado por conveniência.
