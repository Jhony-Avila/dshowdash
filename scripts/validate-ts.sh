#!/bin/bash
# validate-ts.sh — Roda tsc --noEmit e salva resultado em log com timestamp
# Uso: bash /var/www/dshowdash/scripts/validate-ts.sh

set -euo pipefail

PROJECT_DIR="/var/www/dshowdash"
LOG_FILE="/var/www/dshowdash/logs/tsc.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

echo "========================================" > "$LOG_FILE"
echo "[$TIMESTAMP] Iniciando validacao TypeScript" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

cd "$PROJECT_DIR"

if npx tsc --noEmit >> "$LOG_FILE" 2>&1; then
    echo "[$TIMESTAMP] RESULTADO: OK — nenhum erro encontrado" >> "$LOG_FILE"
    EXIT_CODE=0
else
    EXIT_CODE=$?
    echo "[$TIMESTAMP] RESULTADO: FALHA — erros de tipo encontrados (exit code: $EXIT_CODE)" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
exit $EXIT_CODE
