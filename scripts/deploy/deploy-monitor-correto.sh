#!/usr/bin/env bash
# deploy-monitor-correto.sh — decisão CORRETA de sucesso do deploy-as5 (decisão #67).
# ERRADO (falso-positivo): grep genérico por "ROLLBACK|FALHA|FAILED" — o deploy-as5.sh imprime
#   um bloco "ROLLBACK:" (a RECEITA de rollback disponível) em TODO deploy verde.
# CERTO: decidir pelo marcador final oficial DEPLOY_AS5_OK e, quando síncrono, pelo exit code do
#   próprio deploy-as5.sh; nunca por presença de palavras genéricas no meio do log.
# Uso: deploy_ok "<caminho-do-log>"  → rc 0 se DEPLOY_AS5_OK presente no log final; senão rc 1.
deploy_ok() {
  local log="$1"
  [ -s "$log" ] || return 1
  # marcador de sucesso oficial (linha própria, no fim do fluxo verde)
  grep -q '^\s*DEPLOY_AS5_OK\b' "$log" && return 0
  return 1
}
# Monitoramento por novo log após push (webhook): espera surgir um log novo E o marcador oficial.
esperar_deploy() {
  local logdir="${1:-/backup/deploy-logs}" antes="$2" timeout_s="${3:-180}"
  local t=0 novo
  while [ "$t" -lt "$timeout_s" ]; do
    novo="$(ls -1t "$logdir"/deploy-as5-*.log 2>/dev/null | head -1 || true)"
    if [ -n "$novo" ] && [ "$novo" != "$antes" ] && deploy_ok "$novo"; then
      echo "DEPLOY_OK_LOG=$novo"; return 0
    fi
    sleep 3; t=$((t+3))
  done
  echo "DEPLOY_TIMEOUT (sem DEPLOY_AS5_OK em ${timeout_s}s)"; return 1
}
