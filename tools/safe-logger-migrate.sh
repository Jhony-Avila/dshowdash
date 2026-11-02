#!/bin/bash
# Safe Logger Migration - Fase 1 (v2)
# Migra arquivos que JÁ têm MODULE_ID

FILE="$1"
if [ -z "$FILE" ]; then
  exit 1
fi

# Verificar se tem MODULE_ID
if ! grep -q "const MODULE_ID" "$FILE"; then
  exit 0
fi

# Verificar se tem console.*
if ! grep -q "console\.\(log\|warn\|error\|debug\)" "$FILE"; then
  exit 0
fi

# Verificar se JÁ tem Logger import
HAS_LOGGER=$(grep -c "import { Logger }" "$FILE" || true)

# Verificar se JÁ tem delegação log
HAS_DELEGATION=$(grep -c "const log = {" "$FILE" || true)

# Se não tem Logger import, adicionar após última linha de import
if [ "$HAS_LOGGER" -eq 0 ]; then
  LAST_IMPORT=$(grep -n "^import " "$FILE" | tail -1 | cut -d: -f1)
  if [ -n "$LAST_IMPORT" ]; then
    sed -i "${LAST_IMPORT}a\\
import { Logger } from '/assets/js/core/logger-global/index.js';" "$FILE"
  fi
fi

# Se não tem delegação, adicionar após MODULE_ID (não VERSION)
if [ "$HAS_DELEGATION" -eq 0 ]; then
  MODULE_LINE=$(grep -n "const MODULE_ID" "$FILE" | head -1 | cut -d: -f1)
  if [ -n "$MODULE_LINE" ]; then
    sed -i "${MODULE_LINE}a\\
const log = { info: (msg, ctx = {}) => Logger.info(msg, { component: MODULE_ID, ...ctx }), warn: (msg, ctx = {}) => Logger.warn(msg, { component: MODULE_ID, ...ctx }), error: (msg, ctx = {}) => Logger.error(msg, { component: MODULE_ID, ...ctx }), debug: (msg, ctx = {}) => Logger.debug(msg, { component: MODULE_ID, ...ctx }) };" "$FILE"
  fi
fi

# Substituir console.* por log.*
sed -i 's/console\.log(/log.info(/g' "$FILE"
sed -i 's/console\.warn(/log.warn(/g' "$FILE"
sed -i 's/console\.error(/log.error(/g' "$FILE"
sed -i 's/console\.debug(/log.debug(/g' "$FILE"

# Validar sintaxe
if node --check "$FILE" 2>/dev/null; then
  printf "OK"
else
  printf "ERROR"
fi
