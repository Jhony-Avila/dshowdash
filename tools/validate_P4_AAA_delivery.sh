#!/usr/bin/env bash
set -u
ROOT="/var/www/dshowdash"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

printf "\n=== VALIDAÇÃO P4 AAA ===\n"

HUB_DIR="$ROOT/public/components/main/domain/action-hub"

# Arquivos obrigatórios
[ -f "$HUB_DIR/action-contracts.js" ] && ok "action-contracts.js existe" || bad "action-contracts.js AUSENTE"
[ -f "$HUB_DIR/action-registry.js" ] && ok "action-registry.js existe" || bad "action-registry.js AUSENTE"
[ -f "$HUB_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

# Sintaxe
node --check "$HUB_DIR/action-contracts.js" 2>/dev/null && ok "action-contracts.js sintaxe OK" || bad "action-contracts.js sintaxe ERRO"
node --check "$HUB_DIR/action-registry.js" 2>/dev/null && ok "action-registry.js sintaxe OK" || bad "action-registry.js sintaxe ERRO"
node --check "$HUB_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js sintaxe ERRO"

# Contrato
grep -q "ACTION_KINDS" "$HUB_DIR/action-contracts.js" && ok "ACTION_KINDS presente" || bad "ACTION_KINDS ausente"
grep -q "validateAction" "$HUB_DIR/action-contracts.js" && ok "validateAction presente" || bad "validateAction ausente"

# Registry
grep -q "registerAction" "$HUB_DIR/action-registry.js" && ok "registerAction presente" || bad "registerAction ausente"
grep -q "healthCheck" "$HUB_DIR/action-registry.js" && ok "healthCheck presente" || bad "healthCheck ausente"

# ActionHub passivo
grep -q "ui:action" "$HUB_DIR/index.js" && ok "Escuta ui:action" || bad "Não escuta ui:action"
grep -q "action:accepted" "$HUB_DIR/index.js" && ok "Emite action:accepted" || bad "Não emite action:accepted"
grep -q "action:rejected" "$HUB_DIR/index.js" && ok "Emite action:rejected" || bad "Não emite action:rejected"
grep -q "action:unknown" "$HUB_DIR/index.js" && ok "Emite action:unknown" || bad "Não emite action:unknown"

# Passividade (não deve ter)
if grep -qE "RouterGlobal\.navigate|window\.location|Main\.navigate" "$HUB_DIR/index.js"; then
  bad "ActionHub executa navegação (PROIBIDO)"
else
  ok "ActionHub é PASSIVO (não navega)"
fi

if grep -qE "document\.|window\.|querySelector" "$HUB_DIR/index.js"; then
  bad "ActionHub toca DOM (PROIBIDO)"
else
  ok "ActionHub sem DOM"
fi

printf "\n=== RESULTADO ===\n"
[ "$FAIL" -eq 0 ] && printf "✅ P4 AAA PASSOU\n" || printf "❌ P4 AAA FALHOU (erros: %s)\n" "$FAIL"
exit $FAIL
