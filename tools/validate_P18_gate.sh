#!/bin/bash
# ══════════════════════════════════════════════════════════════
# P18 GATE — Diagnóstico Event-Context Only
# @version 2.0.0-ENTERPRISE
# @purpose Medir apenas violações reais do P18 (event-context)
# @rule Não reportar ruído (CSS, MODULE_ID, logs, etc.)
# @location /var/www/dshowdash/tools/validate_P18_gate.sh
# ══════════════════════════════════════════════════════════════

VERSION="2.0.0-ENTERPRISE"
ROOT="/var/www/dshowdash/public"
OUTPUT_DIR="/var/www/dshowdash/logs/p18"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

# ══════════════════════════════════════════════════════════════
# FUNÇÕES DE COLETA EVENT-CONTEXT
# ══════════════════════════════════════════════════════════════

get_eventbus_emit() {
    grep -rn "\.emit\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/"
}

get_eventbus_on() {
    grep -rn "\.on\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/"
}

get_custom_event() {
    grep -rn "new CustomEvent\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/"
}

get_add_event_listener() {
    grep -rn "addEventListener\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/"
}

# ══════════════════════════════════════════════════════════════
# FUNÇÕES DE CLASSIFICAÇÃO (P18EC-REVIEWED vs LEGACY)
# ══════════════════════════════════════════════════════════════

classify_custom_events() {
    local results="$1"
    local reviewed=0
    local legacy=0
    local legacy_files=""
    
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        local file=$(printf "%s" "$line" | cut -d: -f1)
        if grep -q "P18EC-REVIEWED\|P18EC\|TELEMETRY_INTENTS\|BOOT_EVENTS\|UI_EVENTS\|PANEL_EVENTS" "$file" 2>/dev/null; then
            ((reviewed++))
        else
            ((legacy++))
            legacy_files="$legacy_files$line\n"
        fi
    done <<< "$results"
    
    printf "%d|%d|%b" "$reviewed" "$legacy" "$legacy_files"
}

# ══════════════════════════════════════════════════════════════
# FUNÇÕES DE ADOÇÃO P18
# ══════════════════════════════════════════════════════════════

count_events_adoption() {
    grep -r "EVENTS\.[A-Z_]\+\.[A-Z_]\+" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" | wc -l
}

count_intents_adoption() {
    grep -r "_INTENTS\.[A-Z_]\+" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" | wc -l
}

count_core_imports() {
    grep -r "from '/core/runtime/events" "$ROOT" --include="*.js" 2>/dev/null \
    | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" | wc -l
}

# ══════════════════════════════════════════════════════════════
# EXTRAÇÃO DE TOP EVENTOS
# ══════════════════════════════════════════════════════════════

extract_event_names() {
    {
        grep -ohP "(?<=\.emit\s*\(\s*['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$ROOT" --include="*.js" -r 2>/dev/null
        grep -ohP "(?<=\.on\s*\(\s*['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$ROOT" --include="*.js" -r 2>/dev/null
        grep -ohP "(?<=CustomEvent\s*\(\s*['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$ROOT" --include="*.js" -r 2>/dev/null
        grep -ohP "(?<=addEventListener\s*\(\s*['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$ROOT" --include="*.js" -r 2>/dev/null
    } | grep -v node_modules | grep -v backup
}

# ══════════════════════════════════════════════════════════════
# EXECUÇÃO PRINCIPAL
# ══════════════════════════════════════════════════════════════

printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}${BOLD}   P18 GATE — Diagnóstico Event-Context Only${NC}\n"
printf "${CYAN}${BOLD}   Version: ${VERSION}${NC}\n"
printf "${CYAN}${BOLD}   Timestamp: ${TIMESTAMP}${NC}\n"
printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n\n"

# ══════════════════════════════════════════════════════════════
# COLETA DE DADOS
# ══════════════════════════════════════════════════════════════

printf "${BLUE}[1/5] Coletando EVENT-CONTEXT...${NC}\n"

EMIT_RESULTS=$(get_eventbus_emit)
ON_RESULTS=$(get_eventbus_on)
CUSTOM_EVENT_RESULTS=$(get_custom_event)
ADD_LISTENER_RESULTS=$(get_add_event_listener)

# Contagens seguras
if [ -z "$EMIT_RESULTS" ]; then EMIT_COUNT=0; else EMIT_COUNT=$(printf "%s\n" "$EMIT_RESULTS" | wc -l); fi
if [ -z "$ON_RESULTS" ]; then ON_COUNT=0; else ON_COUNT=$(printf "%s\n" "$ON_RESULTS" | wc -l); fi
if [ -z "$CUSTOM_EVENT_RESULTS" ]; then CUSTOM_EVENT_COUNT=0; else CUSTOM_EVENT_COUNT=$(printf "%s\n" "$CUSTOM_EVENT_RESULTS" | wc -l); fi
if [ -z "$ADD_LISTENER_RESULTS" ]; then ADD_LISTENER_COUNT=0; else ADD_LISTENER_COUNT=$(printf "%s\n" "$ADD_LISTENER_RESULTS" | wc -l); fi

printf "${BLUE}[2/5] Classificando P18EC-REVIEWED vs LEGACY...${NC}\n"

# Classificar CustomEvents
CE_CLASSIFICATION=$(classify_custom_events "$CUSTOM_EVENT_RESULTS")
CE_REVIEWED=$(printf "%s" "$CE_CLASSIFICATION" | cut -d'|' -f1)
CE_LEGACY=$(printf "%s" "$CE_CLASSIFICATION" | cut -d'|' -f2)

printf "${BLUE}[3/5] Coletando adoção P18...${NC}\n"

EVENTS_ADOPTION=$(count_events_adoption)
INTENTS_ADOPTION=$(count_intents_adoption)
CORE_IMPORTS=$(count_core_imports)

printf "${BLUE}[4/5] Extraindo top eventos...${NC}\n"

TOP_EVENTS=$(extract_event_names | sort | uniq -c | sort -rn | head -15)

printf "${BLUE}[5/5] Gerando relatório...${NC}\n\n"

# ══════════════════════════════════════════════════════════════
# KPI PRINCIPAL — EVENT-CONTEXT (Briefing Gargalo 04)
# ══════════════════════════════════════════════════════════════

TOTAL_EVENT_CONTEXT=$((EMIT_COUNT + ON_COUNT + CUSTOM_EVENT_COUNT + ADD_LISTENER_COUNT))
TOTAL_LEGACY_REAL=$((EMIT_COUNT + ON_COUNT + CE_LEGACY))

printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}${BOLD}   KPI PRINCIPAL — EVENT-CONTEXT (Bloqueador P18)${NC}\n"
printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n\n"

printf "${YELLOW}EventBus Legacy (P0 — zerar):${NC}\n"
printf "  emit('x:y'):             %d\n" "$EMIT_COUNT"
printf "  on('x:y'):               %d\n" "$ON_COUNT"

printf "\n${YELLOW}DOM Events:${NC}\n"
printf "  CustomEvent('x:y'):      %d total\n" "$CUSTOM_EVENT_COUNT"
printf "    ├─ P18EC-REVIEWED:     %d ${GREEN}✓${NC}\n" "$CE_REVIEWED"
printf "    └─ Legacy (migrar):    %d\n" "$CE_LEGACY"
printf "  addEventListener('x:y'): %d (listeners de bridge)\n" "$ADD_LISTENER_COUNT"

printf "\n${BOLD}TOTAL EVENT-CONTEXT:       %d${NC}\n" "$TOTAL_EVENT_CONTEXT"
printf "${RED}${BOLD}LEGACY REAL (bloqueia):    %d${NC}\n\n" "$TOTAL_LEGACY_REAL"

# ══════════════════════════════════════════════════════════════
# ADOÇÃO P18
# ══════════════════════════════════════════════════════════════

printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}   ADOÇÃO P18 (já migrado)${NC}\n"
printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n\n"

printf "  EVENTS.X.Y:              %d\n" "$EVENTS_ADOPTION"
printf "  *_INTENTS.*:             %d\n" "$INTENTS_ADOPTION"
printf "  Core imports:            %d\n\n" "$CORE_IMPORTS"

# ══════════════════════════════════════════════════════════════
# STATUS FINAL
# ══════════════════════════════════════════════════════════════

printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}   STATUS P18${NC}\n"
printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n\n"

if [ "$TOTAL_LEGACY_REAL" -eq 0 ]; then
    printf "${GREEN}${BOLD}✅ P18 COMPLIANT — Zero legacy real${NC}\n\n"
    STATUS="COMPLIANT"
elif [ "$TOTAL_LEGACY_REAL" -lt 5 ]; then
    printf "${YELLOW}${BOLD}🟡 QUASE COMPLIANT — Poucos legacy restantes (%d)${NC}\n\n" "$TOTAL_LEGACY_REAL"
    STATUS="ALMOST_COMPLIANT"
else
    printf "${RED}${BOLD}🔴 NÃO COMPLIANT — Migração necessária (%d legacy)${NC}\n\n" "$TOTAL_LEGACY_REAL"
    STATUS="NON_COMPLIANT"
fi

# ══════════════════════════════════════════════════════════════
# TOP EVENTOS LEGACY
# ══════════════════════════════════════════════════════════════

printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}   TOP 15 EVENTOS (por frequência)${NC}\n"
printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n\n"

if [ -n "$TOP_EVENTS" ]; then
    printf "%s\n\n" "$TOP_EVENTS"
else
    printf "${GREEN}Nenhum evento legacy encontrado!${NC}\n\n"
fi

# ══════════════════════════════════════════════════════════════
# CLASSIFICAÇÃO P18 (Briefing Gargalo 04)
# ══════════════════════════════════════════════════════════════

printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}   CLASSIFICAÇÃO DE EVENTOS${NC}\n"
printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n\n"

printf "${GREEN}✅ P18EC-REVIEWED (DOM intencional — não migrar):${NC}\n"
printf "   panel:refresh (bubbles para container-main)\n"
printf "   container:* / tab:* / split:* (DOM interno)\n"
printf "   toast:show (bubbles para container)\n\n"

printf "${YELLOW}🔵 Bridges DOM (manter até EventBus 100%%):${NC}\n"
printf "   auth:ready, appshell:ready, components:ready\n"
printf "   Listeners em auto-init.js, component-adapter.js\n\n"

printf "${RED}🔴 Legacy real (P0 — zerar):${NC}\n"
printf "   emit('x:y'), on('x:y') fora do core\n\n"

# ══════════════════════════════════════════════════════════════
# DETALHES (se houver legacy)
# ══════════════════════════════════════════════════════════════

if [ "$EMIT_COUNT" -gt 0 ] || [ "$ON_COUNT" -gt 0 ]; then
    printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"
    printf "${CYAN}   DETALHES LEGACY (P0)${NC}\n"
    printf "${CYAN}══════════════════════════════════════════════════════════════${NC}\n\n"

    if [ "$EMIT_COUNT" -gt 0 ]; then
        printf "${YELLOW}── emit('x:y') ──${NC}\n"
        printf "%s\n\n" "$EMIT_RESULTS"
    fi

    if [ "$ON_COUNT" -gt 0 ]; then
        printf "${YELLOW}── on('x:y') ──${NC}\n"
        printf "%s\n\n" "$ON_RESULTS"
    fi
fi

# ══════════════════════════════════════════════════════════════
# SALVAR RELATÓRIO
# ══════════════════════════════════════════════════════════════

REPORT_FILE="$OUTPUT_DIR/p18-report-$TIMESTAMP.txt"

{
    printf "P18 GATE REPORT — %s\n" "$TIMESTAMP"
    printf "Version: %s\n" "$VERSION"
    printf "Status: %s\n\n" "$STATUS"
    printf "KPI EVENT-CONTEXT:\n"
    printf "  emit('x:y'): %d\n" "$EMIT_COUNT"
    printf "  on('x:y'): %d\n" "$ON_COUNT"
    printf "  CustomEvent (total): %d\n" "$CUSTOM_EVENT_COUNT"
    printf "  CustomEvent (P18EC-REVIEWED): %d\n" "$CE_REVIEWED"
    printf "  CustomEvent (legacy): %d\n" "$CE_LEGACY"
    printf "  addEventListener: %d\n" "$ADD_LISTENER_COUNT"
    printf "  TOTAL EVENT-CONTEXT: %d\n" "$TOTAL_EVENT_CONTEXT"
    printf "  LEGACY REAL: %d\n\n" "$TOTAL_LEGACY_REAL"
    printf "ADOPTION:\n"
    printf "  EVENTS.X.Y: %d\n" "$EVENTS_ADOPTION"
    printf "  *_INTENTS.*: %d\n" "$INTENTS_ADOPTION"
    printf "  Core imports: %d\n\n" "$CORE_IMPORTS"
    printf "TOP EVENTS:\n%s\n\n" "$TOP_EVENTS"
    printf "DETAILS:\n"
    printf "emit:\n%s\n\n" "$EMIT_RESULTS"
    printf "on:\n%s\n\n" "$ON_RESULTS"
} > "$REPORT_FILE"

printf "${GREEN}📄 Relatório salvo: %s${NC}\n\n" "$REPORT_FILE"

printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n"
printf "${CYAN}${BOLD}   FIM DO DIAGNÓSTICO P18${NC}\n"
printf "${CYAN}${BOLD}══════════════════════════════════════════════════════════════${NC}\n"

# Exit code baseado no status
case "$STATUS" in
    "COMPLIANT") exit 0 ;;
    "ALMOST_COMPLIANT") exit 0 ;;
    "NON_COMPLIANT") exit 1 ;;
esac
