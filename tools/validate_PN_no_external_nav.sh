#!/bin/bash
# Validador PN - No External Navigation
# Verifica que nenhum arquivo usa navegação externa real

MAIN_DIR="/var/www/dshowdash/public/components/main"
ERRORS=0

echo "=============================================="
echo "  VALIDADOR PN - NO EXTERNAL NAVIGATION"
echo "=============================================="
echo ""

# 1. Verificar window.open (excluindo comentários)
echo "📋 1. Verificando window.open..."
WINDOW_OPEN=$(grep -rn "window\.open" "$MAIN_DIR" --include="*.js" 2>/dev/null | grep -v "\.bak" | grep -v "^.*//.*window\.open" || true)
if [ -n "$WINDOW_OPEN" ]; then
    echo "❌ ERRO: window.open encontrado:"
    echo "$WINDOW_OPEN"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhum window.open em código ativo"
fi

# 2. Verificar location.href (excluindo comentários)
echo ""
echo "📋 2. Verificando location.href..."
LOCATION_HREF=$(grep -rn "location\.href\s*=" "$MAIN_DIR" --include="*.js" 2>/dev/null | grep -v "\.bak" | grep -v "^.*//.*location\.href" || true)
if [ -n "$LOCATION_HREF" ]; then
    echo "❌ ERRO: location.href encontrado:"
    echo "$LOCATION_HREF"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhum location.href em código ativo"
fi

# 3. Verificar target="_blank" (excluindo comentários)
echo ""
echo "📋 3. Verificando target=\"_blank\"..."
TARGET_BLANK=$(grep -rn 'target.*_blank' "$MAIN_DIR" --include="*.js" 2>/dev/null | grep -v "\.bak" | grep -v "^.*//.*target" || true)
if [ -n "$TARGET_BLANK" ]; then
    echo "❌ ERRO: target=_blank encontrado:"
    echo "$TARGET_BLANK"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Nenhum target=_blank em código ativo"
fi

# 4. Verificar que EXTERNAL_LINK não faz navegação real
echo ""
echo "📋 4. Verificando executor EXTERNAL_LINK..."
EXECUTOR_FILE="$MAIN_DIR/domain/action-hub/action-executor.js"
if [ -f "$EXECUTOR_FILE" ]; then
    if grep -q "_doNavigate.*route" "$EXECUTOR_FILE" && grep -q "externalBlocked" "$EXECUTOR_FILE"; then
        echo "✅ EXTERNAL_LINK usa navegação interna"
    else
        echo "❌ ERRO: EXTERNAL_LINK pode estar usando navegação externa"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "PN-AAA\|PN Hardening\|PN HARDENING" "$EXECUTOR_FILE"; then
        echo "✅ Versão PN-AAA confirmada"
    else
        echo "⚠️  AVISO: Versão PN não confirmada no header"
    fi
else
    echo "❌ ERRO: Arquivo executor não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ VALIDAÇÃO PN NO EXTERNAL NAV: PASSOU"
else
    echo "❌ VALIDAÇÃO PN NO EXTERNAL NAV: FALHOU ($ERRORS erros)"
fi
echo "=============================================="

exit $ERRORS
