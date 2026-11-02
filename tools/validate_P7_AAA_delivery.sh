#!/usr/bin/env bash
set -u
ROOT="/var/www/dshowdash"
FAIL=0
ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

printf "\n=== VALIDAÇÃO P7 AAA ===\n"
PERS_DIR="$ROOT/public/components/main/domain/persistence"

# Arquivos obrigatórios
[ -f "$PERS_DIR/persistence-port.js" ] && ok "persistence-port.js existe" || bad "persistence-port.js AUSENTE"
[ -f "$PERS_DIR/persistence-adapter.js" ] && ok "persistence-adapter.js existe" || bad "persistence-adapter.js AUSENTE"
[ -f "$PERS_DIR/rehydration-controller.js" ] && ok "rehydration-controller.js existe" || bad "rehydration-controller.js AUSENTE"
[ -f "$PERS_DIR/snapshot-manager.js" ] && ok "snapshot-manager.js existe" || bad "snapshot-manager.js AUSENTE"
[ -f "$PERS_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

# Sintaxe
node --check "$PERS_DIR/persistence-port.js" 2>/dev/null && ok "persistence-port.js sintaxe OK" || bad "persistence-port.js sintaxe ERRO"
node --check "$PERS_DIR/persistence-adapter.js" 2>/dev/null && ok "persistence-adapter.js sintaxe OK" || bad "persistence-adapter.js sintaxe ERRO"
node --check "$PERS_DIR/rehydration-controller.js" 2>/dev/null && ok "rehydration-controller.js sintaxe OK" || bad "rehydration-controller.js sintaxe ERRO"
node --check "$PERS_DIR/snapshot-manager.js" 2>/dev/null && ok "snapshot-manager.js sintaxe OK" || bad "snapshot-manager.js sintaxe ERRO"
node --check "$PERS_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js sintaxe ERRO"

# Port contract
grep -q "save" "$PERS_DIR/persistence-port.js" && ok "Port tem save()" || bad "Port sem save()"
grep -q "load" "$PERS_DIR/persistence-port.js" && ok "Port tem load()" || bad "Port sem load()"
grep -q "clear" "$PERS_DIR/persistence-port.js" && ok "Port tem clear()" || bad "Port sem clear()"
grep -q "healthCheck" "$PERS_DIR/persistence-port.js" && ok "Port tem healthCheck()" || bad "Port sem healthCheck()"

# Adapter
grep -q "localStorage" "$PERS_DIR/persistence-adapter.js" && ok "Adapter usa localStorage" || bad "Adapter sem localStorage"
grep -q "persistence:saved" "$PERS_DIR/persistence-adapter.js" && ok "Adapter emite persistence:saved" || bad "Adapter não emite saved"
grep -q "persistence:loaded" "$PERS_DIR/persistence-adapter.js" && ok "Adapter emite persistence:loaded" || bad "Adapter não emite loaded"

# Rehydration
grep -q "rehydration:started" "$PERS_DIR/rehydration-controller.js" && ok "Rehydration emite started" || bad "Rehydration sem started"
grep -q "rehydration:completed" "$PERS_DIR/rehydration-controller.js" && ok "Rehydration emite completed" || bad "Rehydration sem completed"
grep -q "rehydration:error" "$PERS_DIR/rehydration-controller.js" && ok "Rehydration emite error" || bad "Rehydration sem error"
grep -q "restore" "$PERS_DIR/rehydration-controller.js" && ok "Rehydration tem restore()" || bad "Rehydration sem restore()"

# Snapshot Manager
grep -q "createSnapshot" "$PERS_DIR/snapshot-manager.js" && ok "Manager tem createSnapshot()" || bad "Manager sem createSnapshot()"
grep -q "container:created" "$PERS_DIR/snapshot-manager.js" && ok "Manager escuta container:created" || bad "Manager não escuta created"
grep -q "container:destroyed" "$PERS_DIR/snapshot-manager.js" && ok "Manager escuta container:destroyed" || bad "Manager não escuta destroyed"

# Passividade DOM (exceto localStorage que é necessário)
if grep -qE "document\.|querySelector|innerHTML|classList\.|RouterGlobal\." "$PERS_DIR"/*.js 2>/dev/null; then
  bad "Domain toca DOM/RouterGlobal (PROIBIDO)"
else
  ok "Domain sem DOM/RouterGlobal"
fi

# P6 ainda passa
printf "\n--- Verificando P6 ---\n"
if /var/www/dshowdash/tools/validate_P6_AAA_delivery.sh >/dev/null 2>&1; then
  ok "P6 AAA continua passando"
else
  bad "P6 AAA regrediu"
fi

printf "\n=== RESULTADO ===\n"
[ "$FAIL" -eq 0 ] && printf "✅ P7 AAA PASSOU\n" || printf "❌ P7 AAA FALHOU (erros: %s)\n" "$FAIL"
exit $FAIL
