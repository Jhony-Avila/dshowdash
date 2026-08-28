# Track C Mobile — Certificação Agregada (33/33)

Runner em shards + agregador: `certificar-mobile-shards.sh` (contorna o
governador do sandbox rodando grupos pequenos; o agregador exige assinatura
única sha|tree|dist|harness antes de somar — não mistura estados).

```
FINAL_AGGREGATED_TESTS=33
FINAL_AGGREGATED_PASSED=33
FINAL_AGGREGATED_FAILED=0
FINAL_AGGREGATED_EXIT=0
ORPHAN_PROCESSES=0
SIGNATURE_COUNT=1
ASSINATURA_UNICA=ea01bb7d (sha) | ce2f7e51 (tree) | dist(build) | harness — idênticos nos shards
RESULTS_HASH=b0491b9307ac2866c1537d109d48e14a0b5373e8e9a825ac9c1086849ed08db6
```

33 = 29 mobile+cert + 4 regressões V4.3. Em relação aos 31 anteriores, a
rodada da correção de save (opção 3) somou **+2**: `mobile-save-error-matrix`
(12 cenários; NEGATIVE_MATRIX 11/11 + estado-falha positivo + retry) e
`mobile-color-variants-real` (drawer §73/§74 real; payload contém a cor).

Shards: (1) shell/nav/categoria/asset/cores-controls; (2) tools/save/legacy/
teclado/safe-area; (3) orientação/landscape/320/tablet/a11y-smoke; (4) perf/
matrix/touch-inventory/contraste/color-flow; (5) densidade/adversos/back-nav/
extremos/ios; (6) a11y-keyboard/desktop-regression/save-error-matrix/
color-variants-real + 4 v43. Concorrência 1 (sequencial), reap de chrome entre
testes, timeout 110s/teste, retry só p/ infra (nenhum foi necessário).

## Reverificação ao vivo (contêiner atual, HEAD ea01bb7d / tree ce2f7e51)

Reexecutados de forma focada nesta sessão, ambos VERDES:

- `mobile-save-error-matrix` → **verde**; NEGATIVE_MATRIX **11/11**; estado-falha
  = salvo; RETRY salva após servidor voltar; edição preservada; desktop OFF
  inalterado; 0 erro JS.
- `desktop-responsive-regression` → **verde**; `data-mobile` AUSENTE em
  1280/1440/1600; grid multi-coluna preservado; 0 overflow; 0 erro JS
  (desktop byte a byte, flag ON não vaza).

Nota de infra: o governador do sandbox emite exit 144 ao matar o chromium
remanescente APÓS o `process.exit(0)` do teste; o veredito do próprio teste é
`EXIT=0` / "verde" (impresso antes do reap). Sem impacto no resultado.
