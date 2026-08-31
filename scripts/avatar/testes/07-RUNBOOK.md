# 07-trackd-wave3-server-gate.sh — RUNBOOK (infra de auditoria)

Executor server-side da golden preview autenticada. VIVE em `infra/trackd-audit`
(ref de infraestrutura) e AUDITA o PRODUTO CONGELADO externo, sem tocar nele.

## Contrato (env)
PW_CHROME, BACKEND_URL, AUDIT_STORAGE_STATE, CANDIDATE_REF=origin/golden/art-wip,
EXPECTED_COMMIT=dd0f00eca357ee6811c7c6ca2a14c85b542eb666,
EXPECTED_TREE=5ba31bbd5e526714b0bf110ffd3878d410e54755.
DRYRUN=1 prova a maquinaria sem credencial. Não assume que HEAD do executor é o candidato.

## O que faz
preflight (identidade+ambiente) -> git archive do produto congelado -> build canonico no preview
-> proxy 127.0.0.1 (/api -> BACKEND_URL) -> identidade servida (sha256 de global-mobile.css + index +
manifest; marcador ausente na main) -> auth por AUDIT_STORAGE_STATE (copia 600, nunca lida/impressa)
-> provas main/OFF + golden/OFF + golden/ON + boards 390x844/844x390/1280x720 + DOM -> pacote sem segredos.

## Aborta se
candidato remoto != dd0f00ec; tree != 5ba31bbd; hashes servidos divergem; marcador ausente; preview
serve main/outro checkout; storage-state inseguro (modo != 600 / dono errado); tentativa de reusar dist de producao.

## 10-gate x 07-gate (responsabilidades)
- 10-trackd-authenticated-final-gate.sh: autenticado por LOGIN interativo, pinado a dd0f00ec. NAO alterado.
- 07-trackd-wave3-server-gate.sh: autenticado por AUDIT_STORAGE_STATE, versionado aqui, tambem pinado a dd0f00ec.
Mesmo candidato congelado, caminhos distintos; nao intercambiaveis sem criterio.

## NUNCA
main/merge/push/deploy/rollout/flip real de flag; segredo em log/git/pacote; mutacao de producao.
