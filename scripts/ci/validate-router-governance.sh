#!/bin/bash
# Router Governance Validator
# @version 1.0.0
# @date 2025-01-24
# Validates that only RouterGlobal emits ROUTE_CHANGED

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PUBLIC_DIR="/var/www/dshowdash/public"
ROUTER_DIR="/var/www/dshowdash/public/app/router"

echo "========================================"
echo "  ROUTER GOVERNANCE VALIDATOR"
echo "========================================"
echo ""

VIOLATIONS=$(find "$PUBLIC_DIR" -type f -name "*.js" \
  ! -path "$ROUTER_DIR/*" \
  -exec grep -l 'emit(ROUTER_EVENTS.ROUTE_CHANGED' {} \; 2>/dev/null)

if [ -z "$VIOLATIONS" ]; then
  echo -e "${GREEN}[PASS]${NC} Zero emissores externos de ROUTE_CHANGED"
  EXTERNAL_COUNT=0
else
  echo -e "${RED}[FAIL]${NC} Emissores ilegais encontrados:"
  echo "$VIOLATIONS" | while read -r file; do
    echo -e "  ${RED}✗${NC} $file"
  done
  EXTERNAL_COUNT=$(echo "$VIOLATIONS" | wc -l)
fi

ROUTER_COUNT=$(grep -c 'emit(ROUTER_EVENTS.ROUTE_CHANGED' "$ROUTER_DIR/index.js" "$ROUTER_DIR/navigation.js" 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')

echo ""
echo "----------------------------------------"
echo "  RESUMO"
echo "----------------------------------------"
echo "  Emissores externos (proibido): $EXTERNAL_COUNT"
echo "  Emissores RouterGlobal (ok):   $ROUTER_COUNT"
echo "----------------------------------------"

if [ "$EXTERNAL_COUNT" -eq 0 ] && [ "$ROUTER_COUNT" -ge 3 ]; then
  echo -e "${GREEN}[OK]${NC} Router Governance COMPLIANT"
  exit 0
else
  echo -e "${RED}[ERROR]${NC} Router Governance VIOLATION"
  exit 1
fi
