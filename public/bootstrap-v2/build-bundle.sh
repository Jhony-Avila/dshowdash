#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BUILD SCRIPT: bootstrap.bundle.js (Bootstrap-v2 via Vite)
# ═══════════════════════════════════════════════════════════════
# Usa o Vite instalado em /public/react/ como bundler para gerar
# um bundle único do bootstrap-v2 (205 arquivos → 1 bundle).
#
# Entry point: bootstrap-v2/loader/index.js
# Output:      bootstrap-v2/dist/bootstrap.bundle.js
# External:    /core/*, /components/*, /assets/*, /boot/*, /platform/*, /app/*, /modules/*
#
# Uso: bash build-bundle.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/vite.bundle.config.js"
OUTPUT="$SCRIPT_DIR/dist/bootstrap.bundle.js"
VITE_DIR="/var/www/dshowdash/public/react"

# Validar que o config existe
if [ ! -f "$CONFIG" ]; then
  echo "ERRO: Config não encontrado: $CONFIG"
  exit 1
fi

# Validar que o diretório do Vite existe
if [ ! -d "$VITE_DIR/node_modules" ]; then
  echo "ERRO: node_modules não encontrado em: $VITE_DIR"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "BUILD: bootstrap.bundle.js via Vite"
echo "═══════════════════════════════════════════════════════════════"
echo "  Config: $CONFIG"
echo "  Output: $OUTPUT"
echo ""

# Executar build via Vite (usando node_modules de /public/react/)
cd "$VITE_DIR"
npx vite build --config "$CONFIG"

echo ""

# Validação pós-build
if [ ! -f "$OUTPUT" ]; then
  echo "ERRO: Bundle não foi gerado: $OUTPUT"
  echo "Verificando conteúdo do dist/:"
  ls -la "$SCRIPT_DIR/dist/" 2>/dev/null || echo "  (diretório dist/ não existe)"
  exit 1
fi

# Post-processing: fix external paths
FIX_PATHS="/var/www/dshowdash/public/scripts/fix-bundle-paths.cjs"
if [ -f "$FIX_PATHS" ]; then
  node "$FIX_PATHS" "$OUTPUT"
fi

# Post-processing: redirect re-export paths to direct bundles (Lote 5)
DIRECT_IMPORTS="/var/www/dshowdash/public/scripts/bootstrap-direct-imports.cjs"
if [ -f "$DIRECT_IMPORTS" ]; then
  node "$DIRECT_IMPORTS" "$OUTPUT"
fi

LINES=$(wc -l < "$OUTPUT")
BYTES=$(wc -c < "$OUTPUT")
TIMESTAMP=$(date -Iseconds)

echo "═══════════════════════════════════════════════════════════════"
echo "BUILD COMPLETO: bootstrap.bundle.js"
echo "═══════════════════════════════════════════════════════════════"
echo "  Linhas:    $LINES"
echo "  Bytes:     $BYTES"
echo "  Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════"

# Validar sintaxe JS
if node --check "$OUTPUT" 2>&1; then
  echo "Syntax check: OK"
else
  echo "ALERTA: Syntax check falhou!"
  exit 1
fi

echo ""
echo "Bundle gerado com sucesso: $OUTPUT"
