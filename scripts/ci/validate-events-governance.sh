#!/bin/bash
# P18 Events Governance Validator
# @version 1.0.0
# Executa validações para garantir que nenhum contrato paralelo de eventos seja criado

set -e

COMPONENTS_DIR="/var/www/dshowdash/public/components"
CORE_EVENTS_DIR="/var/www/dshowdash/public/core/runtime/events"
EXIT_CODE=0

printf "═══════════════════════════════════════════════════════════════\n"
printf "  P18 EVENTS GOVERNANCE VALIDATOR v1.0.0\n"
printf "═══════════════════════════════════════════════════════════════\n\n"

# Regra 1: Proibido export const EVENTS fora do core
printf "📋 Regra 1: Verificando 'export const EVENTS' fora do core...\n"
EVENTS_VIOLATIONS=$(grep -rn "export const EVENTS\s*=" "$COMPONENTS_DIR" --include="*.js" 2>/dev/null | grep -v "LOCAL_" | grep -v "UI_ACTIONS" | grep -v "MFE_ACTIONS" || true)
if [ -n "$EVENTS_VIOLATIONS" ]; then
    printf "❌ FALHA: Encontradas definições de EVENTS fora do core:\n"
    printf "%s\n" "$EVENTS_VIOLATIONS"
    EXIT_CODE=1
else
    printf "✅ OK: Nenhuma definição de EVENTS fora do core\n"
fi

# Regra 2: Proibido export const INTENTS fora do core
printf "\n📋 Regra 2: Verificando 'export const INTENTS' fora do core...\n"
INTENTS_VIOLATIONS=$(grep -rn "export const INTENTS\s*=" "$COMPONENTS_DIR" --include="*.js" 2>/dev/null | grep -v "INTENT_REGISTRY" || true)
if [ -n "$INTENTS_VIOLATIONS" ]; then
    printf "❌ FALHA: Encontradas definições de INTENTS fora do core:\n"
    printf "%s\n" "$INTENTS_VIOLATIONS"
    EXIT_CODE=1
else
    printf "✅ OK: Nenhuma definição de INTENTS fora do core\n"
fi

# Regra 3: Proibido arquivos events-contracts*.js em components
printf "\n📋 Regra 3: Verificando arquivos events-contracts*.js...\n"
EVENTS_CONTRACTS=$(find "$COMPONENTS_DIR" -name "*events-contracts*" -type f 2>/dev/null || true)
if [ -n "$EVENTS_CONTRACTS" ]; then
    printf "❌ FALHA: Encontrados arquivos events-contracts:\n"
    printf "%s\n" "$EVENTS_CONTRACTS"
    EXIT_CODE=1
else
    printf "✅ OK: Nenhum arquivo events-contracts em components\n"
fi

# Regra 4: Proibido deep imports do catálogo
printf "\n📋 Regra 4: Verificando deep imports do catálogo...\n"
DEEP_IMPORTS=$(grep -rn "from.*catalog/.*\.events" "$COMPONENTS_DIR" --include="*.js" 2>/dev/null || true)
if [ -n "$DEEP_IMPORTS" ]; then
    printf "❌ FALHA: Encontrados deep imports do catálogo:\n"
    printf "%s\n" "$DEEP_IMPORTS"
    EXIT_CODE=1
else
    printf "✅ OK: Nenhum deep import do catálogo\n"
fi

# Regra 5: Imports devem usar apenas index.js
printf "\n📋 Regra 5: Verificando imports que não usam index.js...\n"
BAD_IMPORTS=$(grep -rn "from.*/core/runtime/events/" "$COMPONENTS_DIR" --include="*.js" 2>/dev/null | grep -v "index.js" || true)
if [ -n "$BAD_IMPORTS" ]; then
    printf "❌ FALHA: Imports devem usar /core/runtime/events/index.js:\n"
    printf "%s\n" "$BAD_IMPORTS"
    EXIT_CODE=1
else
    printf "✅ OK: Todos imports usam index.js\n"
fi

# Resultado final
printf "\n═══════════════════════════════════════════════════════════════\n"
if [ $EXIT_CODE -eq 0 ]; then
    printf "✅ VALIDAÇÃO APROVADA - Governança de eventos OK\n"
else
    printf "❌ VALIDAÇÃO REPROVADA - Corrija as violações acima\n"
fi
printf "═══════════════════════════════════════════════════════════════\n"

exit $EXIT_CODE
