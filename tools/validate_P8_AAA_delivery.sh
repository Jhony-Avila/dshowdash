#!/usr/bin/env bash
set -u
ROOT="/var/www/dshowdash"
FAIL=0
ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

printf "\n=== VALIDAÇÃO P8 AAA ===\n"
PERS_DIR="$ROOT/public/components/main/domain/persistence"

# Sintaxe
node --check "$PERS_DIR/persistence-port.js" 2>/dev/null && ok "persistence-port.js sintaxe OK" || bad "persistence-port.js sintaxe ERRO"
node --check "$PERS_DIR/persistence-adapter.js" 2>/dev/null && ok "persistence-adapter.js sintaxe OK" || bad "persistence-adapter.js sintaxe ERRO"
node --check "$PERS_DIR/rehydration-controller.js" 2>/dev/null && ok "rehydration-controller.js sintaxe OK" || bad "rehydration-controller.js sintaxe ERRO"
node --check "$PERS_DIR/snapshot-manager.js" 2>/dev/null && ok "snapshot-manager.js sintaxe OK" || bad "snapshot-manager.js sintaxe ERRO"
node --check "$PERS_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js sintaxe ERRO"

# Schema Version
grep -q "SCHEMA_VERSION" "$PERS_DIR/persistence-port.js" && ok "SCHEMA_VERSION definido" || bad "SCHEMA_VERSION ausente"
grep -q "schemaVersion" "$PERS_DIR/persistence-adapter.js" && ok "Adapter usa schemaVersion" || bad "Adapter não usa schemaVersion"
grep -q "schemaVersion" "$PERS_DIR/snapshot-manager.js" && ok "Manager usa schemaVersion" || bad "Manager não usa schemaVersion"

# TTL / Expiração
grep -q "TTL" "$PERS_DIR/persistence-port.js" && ok "TTL definido" || bad "TTL ausente"
grep -q "isExpired" "$PERS_DIR/persistence-port.js" && ok "isExpired() existe" || bad "isExpired() ausente"
grep -q "expired" "$PERS_DIR/persistence-adapter.js" && ok "Adapter verifica expiração" || bad "Adapter não verifica expiração"
grep -q "snapshot:expired" "$PERS_DIR/persistence-adapter.js" && ok "Emite snapshot:expired" || bad "Não emite snapshot:expired"

# Checksum / Integridade
grep -q "generateChecksum" "$PERS_DIR/persistence-port.js" && ok "generateChecksum() existe" || bad "generateChecksum() ausente"
grep -q "validateChecksum" "$PERS_DIR/persistence-port.js" && ok "validateChecksum() existe" || bad "validateChecksum() ausente"
grep -q "checksum" "$PERS_DIR/persistence-adapter.js" && ok "Adapter usa checksum" || bad "Adapter não usa checksum"
grep -q "snapshot:integrity:failed" "$PERS_DIR/persistence-adapter.js" && ok "Emite snapshot:integrity:failed" || bad "Não emite integrity:failed"

# Compatibilidade de Schema
grep -q "isSchemaCompatible" "$PERS_DIR/persistence-port.js" && ok "isSchemaCompatible() existe" || bad "isSchemaCompatible() ausente"
grep -q "snapshot:invalid" "$PERS_DIR/persistence-adapter.js" && ok "Emite snapshot:invalid" || bad "Não emite snapshot:invalid"

# Telemetria canônica
grep -q "persistence:saved" "$PERS_DIR/persistence-adapter.js" && ok "Emite persistence:saved" || bad "Não emite persistence:saved"
grep -q "persistence:loaded" "$PERS_DIR/persistence-adapter.js" && ok "Emite persistence:loaded" || bad "Não emite persistence:loaded"
grep -q "persistence:cleared" "$PERS_DIR/persistence-adapter.js" && ok "Emite persistence:cleared" || bad "Não emite persistence:cleared"
grep -q "snapshot:created" "$PERS_DIR/snapshot-manager.js" && ok "Emite snapshot:created" || bad "Não emite snapshot:created"
grep -q "rehydration:started" "$PERS_DIR/rehydration-controller.js" && ok "Emite rehydration:started" || bad "Não emite rehydration:started"
grep -q "rehydration:completed" "$PERS_DIR/rehydration-controller.js" && ok "Emite rehydration:completed" || bad "Não emite rehydration:completed"
grep -q "rehydration:error" "$PERS_DIR/rehydration-controller.js" && ok "Emite rehydration:error" || bad "Não emite rehydration:error"

# Passividade DOM
if grep -qE "document\.|querySelector|innerHTML|classList\.|RouterGlobal\." "$PERS_DIR"/*.js 2>/dev/null; then
  bad "Domain toca DOM/RouterGlobal (PROIBIDO)"
else
  ok "Domain sem DOM/RouterGlobal"
fi

# Versão P8
grep -q "P8-AAA" "$PERS_DIR/index.js" && ok "Versão P8-AAA presente" || bad "Versão P8-AAA ausente"

# P6 e P7 continuam passando
printf "\n--- Verificando P6/P7 ---\n"
if /var/www/dshowdash/tools/validate_P6_AAA_delivery.sh >/dev/null 2>&1; then ok "P6 AAA continua passando"; else bad "P6 AAA regrediu"; fi
if /var/www/dshowdash/tools/validate_P7_AAA_delivery.sh >/dev/null 2>&1; then ok "P7 AAA continua passando"; else bad "P7 AAA regrediu"; fi

printf "\n=== RESULTADO ===\n"
[ "$FAIL" -eq 0 ] && printf "✅ P8 AAA PASSOU\n" || printf "❌ P8 AAA FALHOU (erros: %s)\n" "$FAIL"
exit $FAIL
