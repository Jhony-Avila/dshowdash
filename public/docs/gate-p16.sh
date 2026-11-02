#!/bin/bash
# Gate P16 - Validação de Execution Governance
# Uso: bash gate-p16.sh

echo "=========================================="
echo "  P16 EXECUTION GOVERNANCE GATE"
echo "=========================================="
echo ""

ROOT="/var/www/dshowdash/public"
PASS=0
FAIL=0

# 1. eval() executável
EVAL_COUNT=$(grep -rn "eval(" $ROOT --include="*.js" | grep -v "node_modules" | grep -v "//" | grep -v "includes" | grep -v "'" | grep -v '"' | wc -l)
EVAL_COUNT=$(echo $EVAL_COUNT | xargs)
if [ "$EVAL_COUNT" = "0" ]; then
  echo "✅ eval() executável: 0"
  PASS=$((PASS+1))
else
  echo "❌ eval() executável: $EVAL_COUNT (esperado: 0)"
  FAIL=$((FAIL+1))
fi

# 2. window.Orchestrator assignments total
ORCH_TOTAL=$(grep -rn "window.Orchestrator =" $ROOT --include="*.js" | grep -v "node_modules" | wc -l)
ORCH_TOTAL=$(echo $ORCH_TOTAL | xargs)
if [ "$ORCH_TOTAL" = "1" ]; then
  echo "✅ window.Orchestrator= total: 1"
  PASS=$((PASS+1))
else
  echo "❌ window.Orchestrator= total: $ORCH_TOTAL (esperado: 1)"
  FAIL=$((FAIL+1))
fi

# 3. Domínio sem assignment
DOMAIN_FILE="$ROOT/domains/integracoes/panels/panel-orchestrator/index.js"
DOMAIN_ORCH=$(grep "window.Orchestrator =" "$DOMAIN_FILE" 2>/dev/null | wc -l)
DOMAIN_ORCH=$(echo $DOMAIN_ORCH | xargs)
if [ "$DOMAIN_ORCH" = "0" ]; then
  echo "✅ Domínio assignment: 0"
  PASS=$((PASS+1))
else
  echo "❌ Domínio assignment: $DOMAIN_ORCH (esperado: 0)"
  FAIL=$((FAIL+1))
fi

# 4. Legacy sem assignment
LEGACY_FILE="$ROOT/core/js/orchestrator/index.js"
LEGACY_ORCH=$(grep "window.Orchestrator =" "$LEGACY_FILE" 2>/dev/null | wc -l)
LEGACY_ORCH=$(echo $LEGACY_ORCH | xargs)
if [ "$LEGACY_ORCH" = "0" ]; then
  echo "✅ Legacy assignment: 0"
  PASS=$((PASS+1))
else
  echo "❌ Legacy assignment: $LEGACY_ORCH (esperado: 0)"
  FAIL=$((FAIL+1))
fi

# 5. Domínio não é symlink
DOMAIN_DIR="$ROOT/domains/integracoes/panels/panel-orchestrator"
if [ -d "$DOMAIN_DIR" ] && [ ! -L "$DOMAIN_DIR" ]; then
  echo "✅ Domínio tipo: directory"
  PASS=$((PASS+1))
else
  echo "❌ Domínio tipo: symlink ou não existe (esperado: directory)"
  FAIL=$((FAIL+1))
fi

echo ""
echo "=========================================="
echo "  RESULTADO: $PASS/5 passed"
echo "=========================================="

if [ "$FAIL" = "0" ]; then
  echo "P16 GATE PASSED!"
  exit 0
else
  echo "P16 GATE FAILED - $FAIL issues"
  exit 1
fi
