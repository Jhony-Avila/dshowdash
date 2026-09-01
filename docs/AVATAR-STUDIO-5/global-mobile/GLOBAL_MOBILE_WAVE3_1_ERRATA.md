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
    EXECUTOR_SHA256 = 18d11dd6512a45291183da1f5adafe70526c122d7244e85e3a2a725d84df312b

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

## Correcao 2026-09-01 (v4) — proxy alcanca backend + relatorio robusto
(1) proxy: NODE_TLS_REJECT_UNAUTHORIZED=0 nos processos de preview (o fetch do Node ao backend
loopback https://127.0.0.1 tem cert self-signed; sem isso /api virava 502 e o app ficava preso em
"initializing"). Padrao do 10-gate (rejectUnauthorized:false); NAO enfraquece atributo de cookie.
(2) secao de relatorio/gate/pacote passa a rodar com set +e + exit code explicito (evita landmine de
"[ ] && ..." sob set -e que abortava antes do GATE). Novo sha acima.

## v5 — Opção 2: instrumentação redigida (3 pontos) + parser JSON real (infra/trackd-audit)
- EXECUTOR_SHA256: 8ff20c87609d596b7e75abafb22323a63d081a42d66ced5b6e55bd2e6c601abd
- SELFTEST_SHA256: 246ff0bd81a8c06160d428f13f3a55c81baa28acd1411b2d259a626a08bb0865
- RUN_INFRA_STATUS=PASS
- RUN_AUTH_STATUS=FAILED
- RUN_VISUAL_STATUS=INCONCLUSIVE
- BOARDS_CLASS=UNAUTHENTICATED_DIAGNOSTIC
- BOARDS_USED_FOR_APPROVAL=NO
- Telemetria REDIGIDA (booleanos/classes) em 3 pontos de observação independentes: (1/3) storage de origem, (2/3) browser->proxy local, (3/3) proxy->backend; não derivada de variável única.
- Classificação determinística da causa de auth: Casos A (cookie ausente do storage), B (não chega ao proxy — escopo/Secure/transporte), C (chega ao proxy, não encaminhado), D (encaminhado + backend authenticated=false => sessão inválida/expirada), E (autenticado).
- FINAL_EXIT permanece 6 enquanto a sessão real falhar; pacote/boards diagnósticos NÃO convertem o resultado global em sucesso.
- AUTH_CAUSE conclusivo (Caso A-E) é fixado pela execução Opção 2 e registrado no GATE-07 da run (campos RUN_*/BOARDS_* espelhados).
- Segredos NUNCA em evidência: nome do cookie de sessão mantido interno; expõe apenas presença booleana.
