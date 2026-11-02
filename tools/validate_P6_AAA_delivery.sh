#!/usr/bin/env bash
set -u
ROOT="/var/www/dshowdash"
FAIL=0
ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

printf "\n=== VALIDAÇÃO P6 AAA ===\n"
HUB_DIR="$ROOT/public/components/main/domain/action-hub"

# Arquivos obrigatórios
[ -f "$HUB_DIR/action-bindings.js" ] && ok "action-bindings.js existe" || bad "action-bindings.js AUSENTE"
[ -f "$HUB_DIR/action-telemetry.js" ] && ok "action-telemetry.js existe" || bad "action-telemetry.js AUSENTE"
[ -f "$HUB_DIR/action-executor.js" ] && ok "action-executor.js existe" || bad "action-executor.js AUSENTE"
[ -f "$HUB_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

# Sintaxe
node --check "$HUB_DIR/action-bindings.js" 2>/dev/null && ok "action-bindings.js sintaxe OK" || bad "action-bindings.js sintaxe ERRO"
node --check "$HUB_DIR/action-telemetry.js" 2>/dev/null && ok "action-telemetry.js sintaxe OK" || bad "action-telemetry.js sintaxe ERRO"
node --check "$HUB_DIR/action-executor.js" 2>/dev/null && ok "action-executor.js sintaxe OK" || bad "action-executor.js sintaxe ERRO"
node --check "$HUB_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js sintaxe ERRO"

# Bindings
grep -q "ACTION_BINDINGS" "$HUB_DIR/action-bindings.js" && ok "ACTION_BINDINGS presente" || bad "ACTION_BINDINGS ausente"
grep -q "effect.*NAVIGATE" "$HUB_DIR/action-bindings.js" && ok "Bindings tem NAVIGATE" || bad "Bindings sem NAVIGATE"

# Telemetry
grep -q "action:execute:start" "$HUB_DIR/action-telemetry.js" && ok "Telemetria emite start" || bad "Telemetria sem start"
grep -q "action:execute:success" "$HUB_DIR/action-telemetry.js" && ok "Telemetria emite success" || bad "Telemetria sem success"
grep -q "action:execute:error" "$HUB_DIR/action-telemetry.js" && ok "Telemetria emite error" || bad "Telemetria sem error"

# Executor usa bindings
grep -q "getBinding" "$HUB_DIR/action-executor.js" && ok "Executor usa getBinding" || bad "Executor não usa bindings"
grep -q "ports" "$HUB_DIR/action-executor.js" && ok "Executor usa ports" || bad "Executor não usa ports"

# Hub eventos
grep -q "action:received" "$HUB_DIR/index.js" && ok "Hub emite action:received" || bad "Hub não emite received"
grep -q "action:dispatching" "$HUB_DIR/index.js" && ok "Hub emite action:dispatching" || bad "Hub não emite dispatching"
grep -q "action:completed" "$HUB_DIR/index.js" && ok "Hub emite action:completed" || bad "Hub não emite completed"

# Passividade DOM
if grep -qE "document\.|window\.|querySelector|innerHTML|classList\.|RouterGlobal\." "$HUB_DIR/action-executor.js" "$HUB_DIR/index.js" "$HUB_DIR/action-bindings.js" "$HUB_DIR/action-telemetry.js" 2>/dev/null; then
  bad "Domain toca DOM/RouterGlobal (PROIBIDO)"
else
  ok "Domain sem DOM/RouterGlobal"
fi

# Versão P6
grep -q "P6-AAA" "$HUB_DIR/index.js" && ok "Versão P6-AAA presente" || bad "Versão P6-AAA ausente"

printf "\n=== RESULTADO ===\n"
[ "$FAIL" -eq 0 ] && printf "✅ P6 AAA PASSOU\n" || printf "❌ P6 AAA FALHOU (erros: %s)\n" "$FAIL"
exit $FAIL
