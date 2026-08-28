# Track C Mobile — Certificação Agregada (31/31)

Runner em shards + agregador: `certificar-mobile-shards.sh` (contorna o
governador do sandbox rodando grupos pequenos; o agregador exige assinatura
única sha|tree|dist|harness antes de somar — não mistura estados).

```
FINAL_AGGREGATED_TESTS=31
FINAL_AGGREGATED_PASSED=31
FINAL_AGGREGATED_FAILED=0
FINAL_AGGREGATED_EXIT=0
ORPHAN_PROCESSES=0
ASSINATURA_UNICA=66ddf2fd... (sha|tree|dist(build)|harness idênticos nos 6 shards)
RESULTS_HASH=e59848db564...
```

31 = 27 mobile+cert + 4 regressões V4.3. Shards: (1) shell/nav/categoria/asset/
cores-controls; (2) tools/save/legacy/teclado/safe-area; (3) orientação/
landscape/320/tablet/a11y-smoke; (4) perf/matrix/touch-inventory/contraste/
color-flow; (5) densidade/adversos/back-nav/extremos/ios; (6) a11y-keyboard/
desktop-regression + 4 v43. Concorrência 1 (sequencial), reap de chrome entre
testes, timeout 110s/teste, retry só p/ infra (nenhum foi necessário).
