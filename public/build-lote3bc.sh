#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BUILD SCRIPT: Lote 3B+C + Lote 4 + Lote 5 — Core / Assets / Modules via Vite
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/vite.lote3bc.config.js"
VITE_DIR="$SCRIPT_DIR/react"
FIX_PATHS="$SCRIPT_DIR/scripts/fix-bundle-paths.cjs"
HEADER_CSS_PATHS="$SCRIPT_DIR/scripts/header-css-bundle-paths.cjs"

if [ ! -f "$CONFIG" ]; then echo "ERRO: Config não encontrado: $CONFIG"; exit 1; fi
if [ ! -d "$VITE_DIR/node_modules" ]; then echo "ERRO: node_modules não encontrado em: $VITE_DIR"; exit 1; fi

TARGETS=(
  "core-runtime"
  "core-kernel"
  "event-bus"
  "asset-loader"
  "core-auth"
  "logger-global"
  "telemetry-core"
  "config-loader"
  "environment-manager"
  "global-state"
  "kernel-ui"
  "enterprise-loader"
  "api-client"
  "theme-manager"
  "theme-tokens-loader"
  "header-components"
)

BUNDLE_PATHS=(
  "core/runtime/dist/runtime.bundle.js"
  "core/kernel/dist/kernel.bundle.js"
  "core/js/event-bus/dist/event-bus.bundle.js"
  "core/js/asset-loader/dist/asset-loader.bundle.js"
  "core/auth/dist/auth.bundle.js"
  "assets/js/core/logger-global/dist/logger-global.bundle.js"
  "assets/js/core/telemetry-core/dist/telemetry-core.bundle.js"
  "assets/js/core/config-loader/dist/config-loader.bundle.js"
  "assets/js/core/environment-manager/dist/environment-manager.bundle.js"
  "modules/global-state/dist/global-state.bundle.js"
  "core/kernel/ui/dist/kernel-ui.bundle.js"
  "core/js/enterprise-loader/dist/enterprise-loader.bundle.js"
  "assets/js/core/api-client/dist/api-client.bundle.js"
  "assets/js/core/theme-manager/dist/theme-manager.bundle.js"
  "assets/js/core/theme-tokens-loader/dist/theme-tokens-loader.bundle.js"
  "components/header/components/dist/header-components.bundle.js"
)

ERRORS=0
echo "═══════════════════════════════════════════════════════════════"
echo "BUILD: Lote 3B+C + Lote 4 (${#TARGETS[@]} targets)"
echo "═══════════════════════════════════════════════════════════════"

for i in "${!TARGETS[@]}"; do
  TGT="${TARGETS[$i]}"
  BUNDLE="$SCRIPT_DIR/${BUNDLE_PATHS[$i]}"

  echo "───────────────────────────────────────────────────────────────"
  echo "  Building: $TGT"
  echo "───────────────────────────────────────────────────────────────"

  cd "$VITE_DIR"
  TARGET="$TGT" npx vite build --config "$CONFIG" 2>&1

  if [ ! -f "$BUNDLE" ]; then
    echo "  ERRO: Bundle não gerado: $BUNDLE"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Post-processing: fix paths
  if [ -f "$FIX_PATHS" ]; then
    node "$FIX_PATHS" "$BUNDLE"
  fi

  # Post-processing: header-components CSS bundle paths (Lote 6)
  if [ "$TGT" = "header-components" ] && [ -f "$HEADER_CSS_PATHS" ]; then
    node "$HEADER_CSS_PATHS" "$BUNDLE"
  fi

  LINES=$(wc -l < "$BUNDLE")
  BYTES=$(wc -c < "$BUNDLE")
  echo "  Resultado: $LINES linhas, $BYTES bytes"

  if node --check "$BUNDLE" 2>&1; then
    echo "  Syntax check: OK"
  else
    echo "  ERRO: Syntax check falhou!"
    ERRORS=$((ERRORS + 1))
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "RESUMO"
echo "═══════════════════════════════════════════════════════════════"
for i in "${!TARGETS[@]}"; do
  TGT="${TARGETS[$i]}"
  BUNDLE="$SCRIPT_DIR/${BUNDLE_PATHS[$i]}"
  if [ -f "$BUNDLE" ]; then
    LINES=$(wc -l < "$BUNDLE")
    BYTES=$(wc -c < "$BUNDLE")
    echo "  $TGT: $LINES linhas, $BYTES bytes"
  else
    echo "  $TGT: FALHOU"
  fi
done
echo ""
echo "  Erros: $ERRORS"
echo "═══════════════════════════════════════════════════════════════"

if [ "$ERRORS" -gt 0 ]; then echo "BUILD FALHOU."; exit 1; fi
echo "BUILD COMPLETO — ${#TARGETS[@]} bundles gerados."
