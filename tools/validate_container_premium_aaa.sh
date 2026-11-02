#!/bin/bash
# Validador Container-Main Enterprise Premium AAA
# Verifica todos os critérios P0, P1, P2

CONTAINER_FILE="/var/www/dshowdash/public/components/main/adapters/ContainerAdapter.js"
ERRORS=0
WARNINGS=0

echo "=============================================="
echo "  CONTAINER-MAIN ENTERPRISE PREMIUM AAA"
echo "=============================================="
echo ""

if [ ! -f "$CONTAINER_FILE" ]; then
    echo "❌ ERRO CRÍTICO: ContainerAdapter.js não encontrado"
    exit 1
fi

# ==========================================
# P0: STATE MACHINE + INVARIANTES
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P0 — STATE MACHINE + INVARIANTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# P0.1: State enum
echo "📋 P0.1 - State enum canônico..."
STATES=$(grep -c "CREATING\|READY\|ACTIVE\|INACTIVE\|DESTROYED\|ORPHANED\|RECOVERING" "$CONTAINER_FILE" 2>/dev/null || true)
if [ "$STATES" -ge 10 ]; then
    echo "✅ State enum presente ($STATES ocorrências)"
else
    echo "❌ State enum incompleto"
    ERRORS=$((ERRORS + 1))
fi

# P0.2: Valid transitions
echo "📋 P0.2 - Transições válidas..."
if grep -q "VALID_TRANSITIONS" "$CONTAINER_FILE"; then
    echo "✅ VALID_TRANSITIONS definido"
else
    echo "❌ VALID_TRANSITIONS não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# P0.3: _transition function
echo "📋 P0.3 - Função _transition..."
if grep -q "_transition\|_canTransition" "$CONTAINER_FILE"; then
    echo "✅ Sistema de transição implementado"
else
    echo "❌ Sistema de transição não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# P0.4: Invariantes
echo "📋 P0.4 - Validação de invariantes..."
if grep -q "_validateInvariants\|invariant" "$CONTAINER_FILE"; then
    echo "✅ Validação de invariantes implementada"
else
    echo "❌ Validação de invariantes não encontrada"
    ERRORS=$((ERRORS + 1))
fi

# ==========================================
# P1: TRANSAÇÕES + AUTO-RECOVERY
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P1 — TRANSAÇÕES + AUTO-RECOVERY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# P1.1: Begin/Commit/Rollback
echo "📋 P1.1 - Sistema transacional..."
TRANS_BEGIN=$(grep -c "_beginTransaction" "$CONTAINER_FILE" 2>/dev/null || true)
TRANS_COMMIT=$(grep -c "_commit" "$CONTAINER_FILE" 2>/dev/null || true)
TRANS_ROLLBACK=$(grep -c "_rollback" "$CONTAINER_FILE" 2>/dev/null || true)
if [ "$TRANS_BEGIN" -ge 3 ] && [ "$TRANS_COMMIT" -ge 3 ] && [ "$TRANS_ROLLBACK" -ge 2 ]; then
    echo "✅ Transações (begin: $TRANS_BEGIN, commit: $TRANS_COMMIT, rollback: $TRANS_ROLLBACK)"
else
    echo "❌ Sistema transacional incompleto"
    ERRORS=$((ERRORS + 1))
fi

# P1.2: Auto-recovery
echo "📋 P1.2 - Auto-recovery..."
if grep -q "_autoRecover\|_attemptRepair\|_attemptRecreate" "$CONTAINER_FILE"; then
    echo "✅ Auto-recovery implementado"
else
    echo "❌ Auto-recovery não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# P1.3: Eventos de recovery
echo "📋 P1.3 - Eventos de recovery..."
if grep -q "container:repaired\|container:recreated\|container:rollback" "$CONTAINER_FILE"; then
    echo "✅ Eventos de recovery presentes"
else
    echo "⚠️  Eventos de recovery não encontrados"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# P2: DEGRADAÇÃO + BUDGET + OBSERVABILIDADE
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "P2 — DEGRADAÇÃO + BUDGET + OBSERVABILIDADE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# P2.1: Budget
echo "📋 P2.1 - Budget limits..."
if grep -q "BUDGET\|MAX_CONTAINERS\|MAX_LISTENERS" "$CONTAINER_FILE"; then
    echo "✅ Budget limits definidos"
else
    echo "❌ Budget não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# P2.2: Budget check
echo "📋 P2.2 - Budget check..."
if grep -q "_checkBudget" "$CONTAINER_FILE"; then
    echo "✅ Budget check implementado"
else
    echo "⚠️  Budget check não encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

# P2.3: Métricas
echo "📋 P2.3 - Métricas de observabilidade..."
if grep -q "_metrics\|totalCreated\|totalDestroyed\|totalRecoveries" "$CONTAINER_FILE"; then
    echo "✅ Métricas implementadas"
else
    echo "❌ Métricas não encontradas"
    ERRORS=$((ERRORS + 1))
fi

# P2.4: Transition history
echo "📋 P2.4 - Histórico de transições..."
if grep -q "_transitionHistory\|recentTransitions" "$CONTAINER_FILE"; then
    echo "✅ Histórico de transições presente"
else
    echo "⚠️  Histórico de transições não encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# HARDENING (mantido de PN)
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "HARDENING (PN mantido)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 XSS Prevention..."
if grep -q "_sanitize\|_validate\|textContent" "$CONTAINER_FILE"; then
    echo "✅ XSS prevention mantido"
else
    echo "❌ XSS prevention perdido"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 Teardown listeners..."
if grep -q "_teardownListeners\|_listeners" "$CONTAINER_FILE"; then
    echo "✅ Teardown de listeners mantido"
else
    echo "❌ Teardown de listeners perdido"
    ERRORS=$((ERRORS + 1))
fi

echo "📋 RAF token..."
if grep -q "generationToken\|creationToken" "$CONTAINER_FILE"; then
    echo "✅ RAF token mantido"
else
    echo "❌ RAF token perdido"
    ERRORS=$((ERRORS + 1))
fi

# ==========================================
# VERSÃO
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERSÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VERSION=$(grep "VERSION\s*=" "$CONTAINER_FILE" | head -1)
echo "📋 $VERSION"
if grep -q "PREMIUM-AAA\|4\." "$CONTAINER_FILE"; then
    echo "✅ Versão Premium confirmada"
else
    echo "⚠️  Versão Premium não confirmada no header"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# RESULTADO
# ==========================================
echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ CONTAINER PREMIUM AAA: PASSOU"
    [ $WARNINGS -gt 0 ] && echo "   ($WARNINGS avisos)"
else
    echo "❌ CONTAINER PREMIUM AAA: FALHOU ($ERRORS erros, $WARNINGS avisos)"
fi
echo "=============================================="

exit $ERRORS
