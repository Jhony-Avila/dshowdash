#!/bin/bash
# Validador Container-Main Boot
# Verifica que host + slots + container primário são criados no boot

MAIN_INDEX="/var/www/dshowdash/public/components/main/index.js"
CONTAINER_ADAPTER="/var/www/dshowdash/public/components/main/adapters/ContainerAdapter.js"
ERRORS=0

echo "=============================================="
echo "  VALIDADOR CONTAINER-MAIN BOOT"
echo "=============================================="
echo ""

# P0: Verificar bootstrap no main/index.js
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P0 — BOOT OBRIGATÓRIO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 P0.1 - Função _bootstrapPrimaryContainer..."
if grep -q "_bootstrapPrimaryContainer" "$MAIN_INDEX"; then
    echo "✅ _bootstrapPrimaryContainer existe"
else
    echo "❌ _bootstrapPrimaryContainer não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 P0.2 - Chamada do bootstrap no init..."
if grep -q "_bootstrapPrimaryContainer()" "$MAIN_INDEX"; then
    echo "✅ Bootstrap é chamado no init"
else
    echo "❌ Bootstrap não é chamado"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 P0.3 - Criação do container 'primary'..."
if grep -q "id: 'primary'" "$MAIN_INDEX"; then
    echo "✅ Container 'primary' é criado"
else
    echo "❌ Container 'primary' não é criado"
    ERRORS=$((ERRORS + 1))
fi

# P1: Verificar dock slots no adapter
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P1 — DOCK SLOTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 P1.1 - Função _ensureDockSlots no adapter..."
if grep -q "_ensureDockSlots" "$CONTAINER_ADAPTER"; then
    echo "✅ _ensureDockSlots existe"
else
    echo "❌ _ensureDockSlots não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 P1.2 - Criação dos 3 slots..."
SLOT_COUNT=$(grep -c "data-dock-slot" "$CONTAINER_ADAPTER" 2>/dev/null || echo "0")
if [ "$SLOT_COUNT" -ge 5 ]; then
    echo "✅ Slots definidos ($SLOT_COUNT referências)"
else
    echo "❌ Slots insuficientes ($SLOT_COUNT referências)"
    ERRORS=$((ERRORS + 1))
fi

# P2: Placeholder
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P2 — PLACEHOLDER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 P2.1 - Função _createPlaceholder..."
if grep -q "_createPlaceholder" "$MAIN_INDEX"; then
    echo "✅ _createPlaceholder existe"
else
    echo "❌ _createPlaceholder não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 P2.2 - Placeholder com mensagem..."
if grep -q "Selecione um módulo" "$MAIN_INDEX"; then
    echo "✅ Placeholder tem mensagem orientativa"
else
    echo "⚠️  Placeholder sem mensagem padrão"
fi

# Versão
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERSÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VERSION=$(grep "VERSION\s*=" "$MAIN_INDEX" | head -1)
echo "📋 $VERSION"

echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ CONTAINER-MAIN BOOT: PASSOU"
else
    echo "❌ CONTAINER-MAIN BOOT: FALHOU ($ERRORS erros)"
fi
echo "=============================================="

exit $ERRORS
