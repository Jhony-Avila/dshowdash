# Track C Mobile — Controles de Cor

Teste: `mobile-color-flow.mjs` (390×844, flag ON).

## Onde a cor existe

- **Variantes de cor §73/§74**: no `DetalheAsset` (drawer), para assets com
  canais de cor (`usaCores`). Aberto via botão **Detalhes** após equipar.
- **Swatches/sliders**: em `PropriedadesAsset`/`Cores` (Inspector).

## O que foi provado no harness (verde)

| Passo | Resultado |
|---|---|
| categoria → equipar asset → palco atualiza | ✓ (svg 5000→4360) |
| edição deixa estado pendente | ✓ |
| caminho de cor acessível (botão Detalhes) | ✓ presente após equipar |
| swatch mobile ≥ alvo de toque | ✓ 44px (min-width do fix) + touch-action manipulation |
| slider mobile ≥ alvo de toque | ✓ 44px de altura |
| salvar persiste a edição | ✓ sem erro, pendente→salvo |

## Limitação de dados (honesta) — não é defeito do mobile

As **variantes de cor** só materializam para assets com canais (`usaCores`). O
catálogo-**mock** do harness não expõe esses canais (`canais=null`), então o
fluxo completo:

```
abrir categoria → asset com cor → abrir controle → alterar cor →
palco atualiza → pendente → salvar → payload contém a alteração
```

exige **dados de asset reais** (sessão autenticada) — é item do
`MOBILE_REAL_DEVICE_TEST_KIT`, não uma falha da composição mobile. O que o mobile
garante (loop de edição+render, acesso ao controle, tamanho/estilo dos controles,
persistência) está verde. Asset **sem** canal de cor simplesmente não oferece
variantes (comportamento correto).
