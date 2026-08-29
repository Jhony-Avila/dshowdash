# Track D — Onda 3 (validação autenticada, regressão diferencial, hardening)

Branch `mobile/global-shell-wave-3` a partir de `origin/golden/art-wip@973027ed` (tree `cf8fe35a`).
`main bf655221` intocada. Tudo atrás de `as6.mobile_shell` (default OFF).

## Gates fechados DETERMINISTICAMENTE nesta sessão (sem browser/auth)

| Gate | Resultado |
|---|---|
| **1 · Regressão diferencial D-m15 (flag OFF)** | **FECHADO.** `D-m22` isola o fix: com `as6.mobile_shell` OFF o `setup-coordinator` usa as chamadas legadas → **byte a byte com a baseline A (742c55e1)**; o fix vale só no modo autorizado (ON). Prova `coordinator-flag-off-diff.mjs` (handler REAL em jsdom): FLAG_OFF `engine.setMobile` NÃO dispara + overlay NÃO fecha (== A); ON mantém o fix. `FLAG_OFF_BEHAVIOR_DIFF=0` por construção. |
| **7 · 2 avisos do registro → 0** | **FECHADO.** `D-m24`: allowlist EXPLÍCITA e documentada (sobreposição de 4 destinos = mesma rota em 2 superfícies, intencional; divergência admin = KNOWN/legada, reconciliação canônica = router registry). Guard: overlap fora da allowlist = aviso, rota divergente no mesmo id = ERRO. `NAV_REGISTRY_ERRORS=0 WARNINGS=0`. |
| Prova estática (30 seletores) | VERDE — 0 fora do marcador (desktop byte a byte). |
| Wiring proof | VERDE (fix gated). |
| Comportamento (mobile-shell-behavior) | VERDE — 25 asserts jsdom (header Mais, drawer, ticker, 20 ciclos). |
| A11y + estabilidade (D-m25) | VERDE — 17 asserts jsdom (aria, landmarks únicos, 0 IDs dup, 40 ciclos sem órfão, 0 leak de nós no teardown). |

## Pendente — depende EXCLUSIVAMENTE da sessão autenticada do Jhony

Este sandbox **não tem** fonte segura de auth (`AUDIT_STORAGE_STATE`/`STORAGE_STATE`/
`BASE_URL`/`auth.json` ausentes; só há tokens de infra do GitHub/Claude, que **nunca**
devem ser usados no dashboard). Por isso os gates autenticados de PRODUTO ficam com você
— **não fabriquei nenhum resultado autenticado**. O runner `global-mobile-authenticated.mjs`
está validado (sintaxe, imports, seletores conferem com o shell/enhancer real).

### Comando único (rode na sua máquina, com o candidato Track D servido)
1. Capture o storage state autenticado UMA vez (fora do Git), por exemplo com um login manual salvo:
   `npx playwright open --save-storage="$HOME/.dshow-auth.json" https://dshowdash.com.br`  (faça login, feche)
2. Rode a matriz autenticada (rotas + viewports + boards), com a flag só no navegador de teste:
```
BASE_URL="https://dshowdash.com.br" \
STORAGE_STATE="$HOME/.dshow-auth.json" \
PW_CHROME="$(command -v chromium || echo /opt/pw-browsers/chromium/chrome)" \
OUTBOARDS="$HOME/trackd-w3-boards" \
node scripts/avatar/testes/global-mobile-authenticated.mjs --boards
```
Segredos ficam só em env/arquivo restrito, nunca no Git nem nos logs. Apague `~/.dshow-auth.json` ao final.
Resultado em `~/trackd-w3-boards/resultado.json` + screenshots por rota/viewport.

## Regressão desktop (prioridade)
O `D-m22` garante que o caminho **flag OFF** é byte a byte com a baseline A — então a
regressão desktop com a flag OFF está **provada deterministicamente** (não só estática).
A validação visual autenticada com a flag ON (para exercitar o modo mobile real) segue no
runner acima.

## Commits (onda 3)
`D-m22` coordinator-flag-off-isolation · `D-m24` nav-registry-reconciliation ·
`D-m25` accessibility-stability-hardening · `D-m27` wave-3 docs. (D-m21/23/26 não foram
necessários: não houve bug autenticado a corrigir aqui, e os boards dependem da sessão
autenticada — gerados pelo runner.)

## Colar
`06-colar-wave-3.sh` PRONTO (dry-run TREE_IDENTICAL) — só `golden/art-wip`, nunca `main`,
com rollback impresso. Como o gate autenticado de PRODUTO não pôde rodar aqui, **decida
aplicar após a validação autenticada** (o colar roda os determinísticos no servidor antes
do push). As correções desta onda (D-m22/24) são desktop-safe por construção.

## Invioláveis honrados
`MERGE_MAIN=NO · PUSH_MAIN=NO · DEPLOY=NO · ROLLOUT=NO · REAL_FLAG_FLIP=NO ·
FLAG_DEFAULT_CHANGE=NO · TRACK_A_REOPEN=NO · DESKTOP_SAVE_CHANGE=NO · FULL_SUITE=NO ·
GOLDENS_RECORDED=NO · FORCE_PUSH=NO · DESTRUCTIVE_RESET=NO · HAND_EDIT_BUNDLES=NO ·
FABRICATED_AUTH_RESULTS=NO`.
