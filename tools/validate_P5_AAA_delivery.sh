#!/usr/bin/env bash
set -u
ROOT="/var/www/dshowdash"
FAIL=0
ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

printf "\n=== VALIDAÇÃO P5 AAA ===\n"
HUB_DIR="$ROOT/public/components/main/domain/action-hub"

# Arquivos
[ -f "$HUB_DIR/action-executor.js" ] && ok "action-executor.js existe" || bad "action-executor.js AUSENTE"
[ -f "$HUB_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

# Sintaxe
node --check "$HUB_DIR/action-executor.js" 2>/dev/null && ok "action-executor.js sintaxe OK" || bad "action-executor.js sintaxe ERRO"
node --check "$HUB_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js sintaxe ERRO"

# Executor
grep -q "execute" "$HUB_DIR/action-executor.js" && ok "Executor tem execute()" || bad "Executor sem execute()"
grep -q "ports" "$HUB_DIR/action-executor.js" && ok "Executor usa ports" || bad "Executor não usa ports"
grep -q "healthCheck" "$HUB_DIR/action-executor.js" && ok "Executor tem healthCheck()" || bad "Executor sem healthCheck()"

# ActionHub usa executor
grep -q "executor.execute" "$HUB_DIR/index.js" && ok "ActionHub chama executor.execute()" || bad "ActionHub não chama executor"
grep -q "action:completed" "$HUB_DIR/index.js" && ok "Emite action:completed" || bad "Não emite action:completed"
grep -q "action:error" "$HUB_DIR/index.js" && ok "Emite action:error" || bad "Não emite action:error"

# Passividade DOM
if grep -qE "document\.|window\.|querySelector|innerHTML|classList\." "$HUB_DIR/action-executor.js"; then
  bad "Executor toca DOM (PROIBIDO)"
else
  ok "Executor sem DOM"
fi
if grep -qE "RouterGlobal\.|window\.location" "$HUB_DIR/action-executor.js"; then
  bad "Executor usa Router direto (PROIBIDO)"
else
  ok "Executor não usa Router direto"
fi

# Versão P5
grep -q "P5-AAA" "$HUB_DIR/index.js" && ok "Versão P5-AAA presente" || bad "Versão P5-AAA ausente"

printf "\n=== RESULTADO ===\n"
[ "$FAIL" -eq 0 ] && printf "✅ P5 AAA PASSOU\n" || printf "❌ P5 AAA FALHOU (erros: %s)\n" "$FAIL"
exit $FAIL
