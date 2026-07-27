#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BUILD SCRIPT: Componentes JS via Vite (Lote 1 + Lote 2 + Lote 3A + Lote 4 + Lote 6)
# ═══════════════════════════════════════════════════════════════
# Bundla todos os componentes em sequência.
# Cada componente gera 1 bundle em seu diretório dist/.
#
# Lote 1: preloader, session-manager, error-boundary
# Lote 2: context-provider, security, toast, _shared (2 bundles)
# Lote 3A: feature-flags, login-modal
# Lote 4: app-shell, header, layout-manager
# Lote 6: sidebar
#
# Uso: bash build-components.sh          (todos)
#      bash build-components.sh lote2    (apenas Lote 2)
#      bash build-components.sh lote3a   (apenas Lote 3A)
#      bash build-components.sh lote4    (apenas Lote 4)
#      bash build-components.sh lote6    (apenas Lote 6)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/vite.components.config.js"
VITE_DIR="/var/www/dshowdash/public/react"
FIX_PATHS="/var/www/dshowdash/public/scripts/fix-bundle-paths.cjs"

# Validações
if [ ! -f "$CONFIG" ]; then
  echo "ERRO: Config não encontrado: $CONFIG"
  exit 1
fi

if [ ! -d "$VITE_DIR/node_modules" ]; then
  echo "ERRO: node_modules não encontrado em: $VITE_DIR"
  exit 1
fi

# Componentes por lote
LOTE1_COMPONENTS=("preloader" "session-manager" "error-boundary")
LOTE1_BUNDLES=(
  "preloader/dist/preloader.bundle.js"
  "session-manager/dist/session-manager.bundle.js"
  "error-boundary/dist/error-boundary.bundle.js"
)

LOTE2_COMPONENTS=("context-provider" "security" "toast" "_shared-integration" "_shared-ui-feedback")
LOTE2_BUNDLES=(
  "context-provider/dist/context-provider.bundle.js"
  "security/csrf-token-manager/dist/csrf-token-manager.bundle.js"
  "toast/service/dist/toast-service.bundle.js"
  "_shared/permissions/dist/integration.bundle.js"
  "_shared/permissions/dist/ui-feedback.bundle.js"
)

LOTE3A_COMPONENTS=("feature-flags" "login-modal")
LOTE3A_BUNDLES=(
  "feature-flags/dist/feature-flags.bundle.js"
  "login-modal/dist/login-modal.bundle.js"
)

LOTE4_COMPONENTS=("app-shell" "header" "layout-manager")
LOTE4_BUNDLES=(
  "app-shell/dist/app-shell.bundle.js"
  "header/dist/header.bundle.js"
  "layout-manager/dist/layout-manager.bundle.js"
)

LOTE6_COMPONENTS=("sidebar")
LOTE6_BUNDLES=(
  "sidebar/dist/sidebar.bundle.js"
)

LOTE7_COMPONENTS=("nav-rail" "footer")
LOTE7_BUNDLES=(
  "nav-rail/dist/nav-rail.bundle.js"
  "footer/dist/footer.bundle.js"
)

# Selecionar lote
if [ "${1:-all}" = "lote2" ]; then
  COMPONENTS=("${LOTE2_COMPONENTS[@]}")
  BUNDLES=("${LOTE2_BUNDLES[@]}")
  LABEL="Lote 2"
elif [ "${1:-all}" = "lote3a" ]; then
  COMPONENTS=("${LOTE3A_COMPONENTS[@]}")
  BUNDLES=("${LOTE3A_BUNDLES[@]}")
  LABEL="Lote 3A"
elif [ "${1:-all}" = "lote4" ]; then
  COMPONENTS=("${LOTE4_COMPONENTS[@]}")
  BUNDLES=("${LOTE4_BUNDLES[@]}")
  LABEL="Lote 4"
elif [ "${1:-all}" = "lote6" ]; then
  COMPONENTS=("${LOTE6_COMPONENTS[@]}")
  BUNDLES=("${LOTE6_BUNDLES[@]}")
  LABEL="Lote 6"
elif [ "${1:-all}" = "lote7" ]; then
  COMPONENTS=("${LOTE7_COMPONENTS[@]}")
  BUNDLES=("${LOTE7_BUNDLES[@]}")
  LABEL="Lote 7"
else
  COMPONENTS=("${LOTE1_COMPONENTS[@]}" "${LOTE2_COMPONENTS[@]}" "${LOTE3A_COMPONENTS[@]}" "${LOTE4_COMPONENTS[@]}" "${LOTE6_COMPONENTS[@]}" "${LOTE7_COMPONENTS[@]}")
  BUNDLES=("${LOTE1_BUNDLES[@]}" "${LOTE2_BUNDLES[@]}" "${LOTE3A_BUNDLES[@]}" "${LOTE4_BUNDLES[@]}" "${LOTE6_BUNDLES[@]}" "${LOTE7_BUNDLES[@]}")
  LABEL="Lote 1 + Lote 2 + Lote 3A + Lote 4 + Lote 6 + Lote 7"
fi

TIMESTAMP=$(date -Iseconds)
ERRORS=0

echo "═══════════════════════════════════════════════════════════════"
echo "BUILD: Componentes JS via Vite ($LABEL)"
echo "═══════════════════════════════════════════════════════════════"
echo "  Config: $CONFIG"
echo "  Componentes: ${#COMPONENTS[@]}"
echo "  Timestamp: $TIMESTAMP"
echo ""

for i in "${!COMPONENTS[@]}"; do
  COMP="${COMPONENTS[$i]}"
  BUNDLE="$SCRIPT_DIR/${BUNDLES[$i]}"

  echo "───────────────────────────────────────────────────────────────"
  echo "  Building: $COMP"
  echo "───────────────────────────────────────────────────────────────"

  cd "$VITE_DIR"
  COMPONENT="$COMP" npx vite build --config "$CONFIG"

  echo ""

  # Validação pós-build
  if [ ! -f "$BUNDLE" ]; then
    echo "  ERRO: Bundle não gerado: $BUNDLE"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Post-processing: fix paths
  if [ -f "$FIX_PATHS" ]; then
    node "$FIX_PATHS" "$BUNDLE"
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
echo "RESUMO ($LABEL)"
echo "═══════════════════════════════════════════════════════════════"

for i in "${!COMPONENTS[@]}"; do
  COMP="${COMPONENTS[$i]}"
  BUNDLE="$SCRIPT_DIR/${BUNDLES[$i]}"
  if [ -f "$BUNDLE" ]; then
    LINES=$(wc -l < "$BUNDLE")
    BYTES=$(wc -c < "$BUNDLE")
    echo "  $COMP: $LINES linhas, $BYTES bytes"
  else
    echo "  $COMP: FALHOU"
  fi
done

echo ""
echo "  Erros: $ERRORS"
echo "═══════════════════════════════════════════════════════════════"

if [ "$ERRORS" -gt 0 ]; then
  echo "BUILD FALHOU com $ERRORS erro(s)."
  exit 1
fi

echo "BUILD COMPLETO — ${#COMPONENTS[@]} bundles gerados com sucesso."
