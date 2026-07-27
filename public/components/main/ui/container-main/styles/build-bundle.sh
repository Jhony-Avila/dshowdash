#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BUILD SCRIPT: container-main.bundle.css
# ═══════════════════════════════════════════════════════════════
# Concatena os módulos CSS na ordem numérica → gera container-main.bundle.css
# Zero @import em produção. Ordem dos módulos determina cascade.
#
# Uso: bash build-bundle.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"
OUTPUT="$SCRIPT_DIR/../container-main.bundle.css"
TIMESTAMP=$(date -Iseconds)

# Validar que o diretório de módulos existe
if [ ! -d "$MODULES_DIR" ]; then
  echo "ERRO: Diretório de módulos não encontrado: $MODULES_DIR"
  exit 1
fi

# Listar módulos na ordem numérica
MODULES=$(find "$MODULES_DIR" -maxdepth 1 -name '[0-9][0-9]-*.css' | sort)
MODULE_COUNT=$(echo "$MODULES" | wc -l)

if [ "$MODULE_COUNT" -eq 0 ]; then
  echo "ERRO: Nenhum módulo encontrado em $MODULES_DIR"
  exit 1
fi

# Gerar lista de nomes dos módulos para o header
MODULE_NAMES=""
for f in $MODULES; do
  name=$(basename "$f" .css)
  if [ -z "$MODULE_NAMES" ]; then
    MODULE_NAMES="$name"
  else
    MODULE_NAMES="$MODULE_NAMES, $name"
  fi
done

# Escrever header do bundle
cat > "$OUTPUT" << EOF
/* Container-Main Styles Bundle — COMPILED (single request, zero CSS imports) */
/* @version 11.1.0-MODULAR-BUILD */
/* @description Modular build: $MODULE_COUNT modules concatenated in numeric order */
/* @build-timestamp: $TIMESTAMP */
/* @modules: $MODULE_NAMES */
EOF

# Linha em branco separando header do conteúdo
echo "" >> "$OUTPUT"

# Concatenar módulos na ordem numérica
for f in $MODULES; do
  cat "$f" >> "$OUTPUT"
done

# Validação pós-build
LINES=$(wc -l < "$OUTPUT")
BYTES=$(wc -c < "$OUTPUT")
IMPORTS=$(grep -c "@import" "$OUTPUT" 2>/dev/null || true)

echo "═══════════════════════════════════════════════════════"
echo "BUILD COMPLETO: container-main.bundle.css"
echo "═══════════════════════════════════════════════════════"
echo "  Módulos: $MODULE_COUNT"
echo "  Linhas:  $LINES"
echo "  Bytes:   $BYTES"
echo "  @import: $IMPORTS (deve ser 0)"
echo "  Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════"

if [ "$IMPORTS" -gt 0 ]; then
  echo "ALERTA: Bundle contém @import — verificar módulos!"
  grep -n "@import" "$OUTPUT"
  exit 1
fi

echo "Validação OK — zero @import no bundle."
