#!/bin/bash
# Adiciona MODULE_ID e VERSION baseado no path

FILE="$1"
if [ -z "$FILE" ]; then
  exit 1
fi

# Verificar se já tem MODULE_ID
if grep -q "const MODULE_ID" "$FILE"; then
  exit 0
fi

# Extrair MODULE_ID do path
# /var/www/dshowdash/public/components/cards/card-02/index.js -> card-02
# /var/www/dshowdash/public/components/panels/panel-12/ui/table.js -> panel-12-table
RELPATH=$(printf "%s" "$FILE" | sed 's|.*/components/||')
DIRNAME=$(dirname "$RELPATH")
BASENAME=$(basename "$FILE" .js)

# Construir MODULE_ID
if [ "$BASENAME" = "index" ]; then
  # Usar apenas o diretório pai
  MODULE_ID=$(printf "%s" "$DIRNAME" | tr '/' '-')
else
  # Usar diretório + nome do arquivo
  MODULE_ID=$(printf "%s-%s" "$DIRNAME" "$BASENAME" | tr '/' '-')
fi

# Limpar MODULE_ID (remover prefixos desnecessários)
MODULE_ID=$(printf "%s" "$MODULE_ID" | sed 's/^-//' | sed 's/-$//')

# Encontrar onde inserir (após 'use strict' ou após comentários iniciais)
if grep -q "'use strict'" "$FILE"; then
  # Inserir após 'use strict'
  sed -i "/'use strict';/a\\
const MODULE_ID = '${MODULE_ID}';\\
const VERSION = '1.0.0-ENTERPRISE';" "$FILE"
elif grep -q '"use strict"' "$FILE"; then
  sed -i '/"use strict";/a\
const MODULE_ID = '"'${MODULE_ID}'"';\
const VERSION = '"'"'1.0.0-ENTERPRISE'"'"';' "$FILE"
else
  # Inserir no início (após comentários)
  FIRST_CODE=$(grep -n "^[^/]" "$FILE" | head -1 | cut -d: -f1)
  if [ -n "$FIRST_CODE" ] && [ "$FIRST_CODE" -gt 1 ]; then
    sed -i "${FIRST_CODE}i\\
const MODULE_ID = '${MODULE_ID}';\\
const VERSION = '1.0.0-ENTERPRISE';" "$FILE"
  else
    sed -i "1i\\
const MODULE_ID = '${MODULE_ID}';\\
const VERSION = '1.0.0-ENTERPRISE';" "$FILE"
  fi
fi

# Validar sintaxe
if node --check "$FILE" 2>/dev/null; then
  printf "OK"
else
  printf "ERROR"
fi
