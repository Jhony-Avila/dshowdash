# ERRATA — GLOBAL_MOBILE_WAVE3_1_REPORT (auditoria de infraestrutura)
Data: 2026-08-31

## Achado
O relatorio `GLOBAL_MOBILE_WAVE3_1_REPORT.md`, versionado no PRODUTO CONGELADO
`origin/golden/art-wip@dd0f00ec`, afirma que o executor `07-trackd-wave3-server-gate.sh`
foi "Entregue". A auditoria constatou que o artefato NAO existia em nenhum ref nem no
servidor: o commit `172b33b0` adicionou apenas o markdown. O relatorio original
documentava um artefato AUSENTE.

## Correcao (sem tocar na golden)
O produto permanece CONGELADO em `dd0f00ec` (tree `5ba31bbd5e526714b0bf110ffd3878d410e54755`);
NAO alteramos aquele relatorio nem a golden. O executor foi criado e versionado em ref SEPARADO
de infraestrutura de auditoria.

    PRODUCT_REF     = origin/golden/art-wip@dd0f00ec  (FROZEN, tree 5ba31bbd5e526714b0bf110ffd3878d410e54755)
    AUDIT_TOOL_REF  = infra/trackd-audit@<sha do commit — ver: git rev-parse infra/trackd-audit>
    EXECUTOR_PATH   = scripts/avatar/testes/07-trackd-wave3-server-gate.sh   (nesta branch de infra)
    EXECUTOR_SHA256 = 517e7d8fb4bd5ce3e3b8a1eae50497f03dab7dcdb33db9bfea8a98af954ba9b5

O executor NAO pertence a arvore do produto congelado. Ele VIVE no ref de infra e AUDITA o
candidato externo `dd0f00ec` (via git archive), abortando se o candidato remoto deixar de apontar
para `dd0f00ec` / tree `5ba31bbd`, se hashes servidos divergirem, se o marcador faltar, se o preview
servir main, ou se o storage-state estiver inseguro.

## Responsabilidades (10-gate x 07-gate)
- `10-trackd-authenticated-final-gate.sh`: autenticado por LOGIN interativo, pinado a `dd0f00ec`. NAO alterado nesta rodada.
- `07-trackd-wave3-server-gate.sh`: autenticado por `AUDIT_STORAGE_STATE`, versionado em `infra/trackd-audit`, tambem pinado a `dd0f00ec`.
Os dois auditam o MESMO candidato congelado por caminhos distintos; nao sao intercambiaveis sem criterio.

## Auto-validacao do 07 (2026-08-31, sem credencial)
BASH_SYNTAX=OK · DRY_RUN=PASS (served-identity CONFIRMED, MARKER_IN_MAIN=NO) · FAIL_CLOSED_WRONG_SHA=PASS ·
FAIL_CLOSED_WRONG_HASH=PASS · CLEANUP_TEST=PASS · PRODUCTION_SIDE_EFFECTS=NONE.
PENDENTE (nao comprovado por dry-run): AUTH_SESSION_REAL, GOLDEN_REAL_ROUTE, FLAG_OFF/ON_REAL, BOARDS_REAL.

## Correcao 2026-08-31 (v2)
gate07-proofs.mjs: corrigido argumento de page.evaluate (era `surfaces=SURFACES`, atribuicao a
variavel nao declarada em modulo ESM -> ReferenceError "surfaces is not defined", que abortava as
provas antes de gerar boards). Agora passa `SURFACES` direto. Novo EXECUTOR_SHA256 acima.
Identidade servida e freeze do produto permanecem inalterados.

## Correcao 2026-08-31 (v3) — auth por reescopo seguro + gate real
gate07-proofs.mjs: (1) reescopo do storage-state numa copia (dominio dos cookies da app -> host-only
127.0.0.1; origem do localStorage -> origem exata da preview), PRESERVANDO Secure/httpOnly/SameSite e
DESCARTANDO cookies de terceiros; (2) gate de AUTENTICACAO REAL por multiplos sinais (HTTP ok, sem
formulario de login, shell autenticado, body[data-state]=authenticated, app-shell ready, sessao/painel
presentes) que ABORTA (exit 6) antes da matriz se a sessao nao autenticar; (3) exit codes distintos
(0 ok, 3 identidade, 4 storage, 5 reescopo, 6 auth real, 7 matriz). AUTH_SESSION agora reflete
autenticacao real, nao "arquivo copiado". Original nunca alterado (hash antes/depois). Novo sha acima.
