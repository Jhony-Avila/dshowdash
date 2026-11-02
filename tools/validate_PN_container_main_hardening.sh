#!/bin/bash
# Validador PN - Container-Main Hardening AAA
# Verifica hardening de segurança no ContainerAdapter

CONTAINER_FILE="/var/www/dshowdash/public/components/main/adapters/ContainerAdapter.js"
ERRORS=0
WARNINGS=0

echo "=============================================="
echo "  VALIDADOR PN - CONTAINER-MAIN HARDENING"
echo "=============================================="
echo ""

if [ ! -f "$CONTAINER_FILE" ]; then
    echo "❌ ERRO CRÍTICO: ContainerAdapter.js não encontrado"
    exit 1
fi

# P1.1: Verificar XSS prevention (não usar innerHTML com dados dinâmicos)
echo "📋 P1.1 - XSS Prevention..."
INNERHTML_COUNT=$(grep -c "innerHTML" "$CONTAINER_FILE" 2>/dev/null || true)
TEXTCONTENT_COUNT=$(grep -c "textContent" "$CONTAINER_FILE" 2>/dev/null || true)
SANITIZE_COUNT=$(grep -c "_sanitize\|_validate" "$CONTAINER_FILE" 2>/dev/null || true)

if [ "$INNERHTML_COUNT" -eq 0 ]; then
    echo "✅ Nenhum innerHTML encontrado (excelente)"
elif [ "$SANITIZE_COUNT" -gt 0 ] && [ "$TEXTCONTENT_COUNT" -gt "$INNERHTML_COUNT" ]; then
    echo "✅ innerHTML presente mas com sanitização ($SANITIZE_COUNT funções)"
else
    echo "❌ innerHTML sem sanitização adequada"
    ERRORS=$((ERRORS + 1))
fi

# P1.2: Verificar teardown de listeners
echo ""
echo "📋 P1.2 - Teardown de Listeners..."
if grep -q "_listeners" "$CONTAINER_FILE" && grep -q "_teardownListeners\|removeEventListener" "$CONTAINER_FILE"; then
    echo "✅ Registry de listeners com teardown encontrado"
else
    echo "❌ Teardown de listeners não implementado"
    ERRORS=$((ERRORS + 1))
fi

# P1.3: Verificar RAF reentrância (token de geração)
echo ""
echo "📋 P1.3 - RAF Reentrância..."
if grep -q "_generationToken\|generationToken\|creationToken" "$CONTAINER_FILE"; then
    echo "✅ Token de geração para RAF encontrado"
else
    echo "❌ Token de geração não implementado"
    ERRORS=$((ERRORS + 1))
fi

# P1.4: Verificar orphan detection
echo ""
echo "📋 P1.4 - Orphan Detection..."
if grep -q "orphan\|isConnected" "$CONTAINER_FILE"; then
    echo "✅ Orphan detection implementado"
else
    echo "❌ Orphan detection não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Verificar versão PN
echo ""
echo "📋 Versão PN..."
if grep -q "PN-AAA\|PN Hardening\|PN HARDENING" "$CONTAINER_FILE"; then
    VERSION=$(grep "VERSION\s*=" "$CONTAINER_FILE" | head -1)
    echo "✅ Versão PN confirmada: $VERSION"
else
    echo "⚠️  AVISO: Versão PN não confirmada"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar healthCheck robusto
echo ""
echo "📋 healthCheck robusto..."
if grep -q "healthCheck" "$CONTAINER_FILE" && grep -q "DEGRADED\|UNHEALTHY" "$CONTAINER_FILE"; then
    echo "✅ healthCheck com estados de degradação"
else
    echo "⚠️  AVISO: healthCheck básico"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ VALIDAÇÃO PN CONTAINER HARDENING: PASSOU"
    [ $WARNINGS -gt 0 ] && echo "   ($WARNINGS avisos)"
else
    echo "❌ VALIDAÇÃO PN CONTAINER HARDENING: FALHOU ($ERRORS erros)"
fi
echo "=============================================="

exit $ERRORS
