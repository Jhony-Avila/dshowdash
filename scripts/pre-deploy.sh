#!/bin/bash
# pre-deploy.sh — Bloqueia deploy se houver erros TypeScript
# Uso: bash /var/www/dshowdash/scripts/pre-deploy.sh

set -uo pipefail

PROJECT_DIR="/var/www/dshowdash"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "=== Pre-deploy: Validacao TypeScript ==="

cd "$PROJECT_DIR"

TSC_EXIT=0
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
    echo -e "${RED}DEPLOY BLOQUEADO: Erros TypeScript encontrados${NC}"
    echo ""
    echo "$TSC_OUTPUT"
    echo ""
    echo -e "${RED}Corrija os erros acima antes de fazer deploy.${NC}"
    exit 1
fi

echo -e "${GREEN}TypeScript OK — nenhum erro encontrado. Deploy liberado.${NC}"
exit 0
