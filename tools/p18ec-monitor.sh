#!/bin/bash

# P18EC FASE 6 - MONITOR DE PROGRESSO
# Execução: bash /var/www/dshowdash/p18ec-monitor.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'

BASE="/var/www/dshowdash/public"

clear

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    P18EC FASE 6 - MONITOR DE PROGRESSO                        ║"
echo "║                         $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

count_pending() {
    grep -rl "emit(['\"][a-z]" $1 --include="*.js" 2>/dev/null | grep -v "_EVENTS" | grep -v "runtime/events" | wc -l
}

count_occurrences() {
    grep -roh "emit(['\"][a-z]" $1 --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l
}

calc_percent() {
    if [ $2 -eq 0 ]; then
        echo "100"
    else
        echo $(( ($2 - $1) * 100 / $2 ))
    fi
}

progress_bar() {
    local percent=$1
    local width=30
    local filled=$(( percent * width / 100 ))
    local empty=$(( width - filled ))
    printf "["
    printf "%${filled}s" | tr ' ' '#'
    printf "%${empty}s" | tr ' ' '-'
    printf "] %3d%%" $percent
}

echo ""
echo -e "${WHITE}${BOLD}=== AGENTE 01 - TELEMETRY ===${NC}"
echo -e "${GRAY}Escopo: telemetry/tracker.js (163 arquivos)${NC}"
echo ""

A1_PEND=$(find $BASE/components -name "tracker.js" -path "*/telemetry/*" -exec grep -l "emit(['\"][a-z]" {} \; 2>/dev/null | grep -v "_EVENTS" | wc -l)
A1_TOTAL=163
A1_DONE=$((A1_TOTAL - A1_PEND))
A1_PCT=$(calc_percent $A1_PEND $A1_TOTAL)

echo -e "  ${PURPLE}Arquivos:${NC}  ${GREEN}$A1_DONE migrados${NC} / ${RED}$A1_PEND pendentes${NC} / ${WHITE}$A1_TOTAL total${NC}"
echo -e "  ${PURPLE}Progresso:${NC} $(progress_bar $A1_PCT)"
echo ""

echo -e "${WHITE}${BOLD}=== AGENTE 02 - CORE CRITICAL ===${NC}"
echo -e "${GRAY}Escopo: main/ + sidebar/ + table-engine/ (97 arquivos)${NC}"
echo ""

A2_MAIN=$(count_pending "$BASE/components/main/")
A2_SIDEBAR=$(count_pending "$BASE/components/sidebar/")
A2_TABLE=$(count_pending "$BASE/components/table-engine/")
A2_PEND=$((A2_MAIN + A2_SIDEBAR + A2_TABLE))
A2_TOTAL=97
A2_DONE=$((A2_TOTAL - A2_PEND))
A2_PCT=$(calc_percent $A2_PEND $A2_TOTAL)

A2_OCC_MAIN=$(count_occurrences "$BASE/components/main/")
A2_OCC_SIDEBAR=$(count_occurrences "$BASE/components/sidebar/")
A2_OCC_TABLE=$(count_occurrences "$BASE/components/table-engine/")

echo -e "  ${PURPLE}Arquivos:${NC}  ${GREEN}$A2_DONE migrados${NC} / ${RED}$A2_PEND pendentes${NC} / ${WHITE}$A2_TOTAL total${NC}"
echo -e "  ${PURPLE}Progresso:${NC} $(progress_bar $A2_PCT)"
echo -e "  ${GRAY}  main/:        $A2_MAIN arq ($A2_OCC_MAIN emit)${NC}"
echo -e "  ${GRAY}  sidebar/:     $A2_SIDEBAR arq ($A2_OCC_SIDEBAR emit)${NC}"
echo -e "  ${GRAY}  table-engine/: $A2_TABLE arq ($A2_OCC_TABLE emit)${NC}"
echo ""

echo -e "${WHITE}${BOLD}=== AGENTE 03 - UI COMPONENTS ===${NC}"
echo -e "${GRAY}Escopo: header/ + footer/ + nav-rail/ (147 arquivos)${NC}"
echo ""

A3_HEADER=$(grep -rl "emit(['\"][a-z]" $BASE/components/header/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | grep -v "telemetry/tracker" | wc -l)
A3_FOOTER=$(grep -rl "emit(['\"][a-z]" $BASE/components/footer/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | grep -v "telemetry/tracker" | wc -l)
A3_NAVRAIL=$(grep -rl "emit(['\"][a-z]" $BASE/components/nav-rail/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | grep -v "telemetry/tracker" | wc -l)
A3_PEND=$((A3_HEADER + A3_FOOTER + A3_NAVRAIL))
A3_TOTAL=147
A3_DONE=$((A3_TOTAL - A3_PEND))
A3_PCT=$(calc_percent $A3_PEND $A3_TOTAL)

A3_OCC_HEADER=$(grep -roh "emit(['\"][a-z]" $BASE/components/header/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A3_OCC_FOOTER=$(grep -roh "emit(['\"][a-z]" $BASE/components/footer/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A3_OCC_NAVRAIL=$(grep -roh "emit(['\"][a-z]" $BASE/components/nav-rail/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)

echo -e "  ${PURPLE}Arquivos:${NC}  ${GREEN}$A3_DONE migrados${NC} / ${RED}$A3_PEND pendentes${NC} / ${WHITE}$A3_TOTAL total${NC}"
echo -e "  ${PURPLE}Progresso:${NC} $(progress_bar $A3_PCT)"
echo -e "  ${GRAY}  header/:   $A3_HEADER arq ($A3_OCC_HEADER emit)${NC}"
echo -e "  ${GRAY}  footer/:   $A3_FOOTER arq ($A3_OCC_FOOTER emit)${NC}"
echo -e "  ${GRAY}  nav-rail/: $A3_NAVRAIL arq ($A3_OCC_NAVRAIL emit)${NC}"
echo ""

echo -e "${WHITE}${BOLD}=== AGENTE 04 - PANELS + DIVERSOS ===${NC}"
echo -e "${GRAY}Escopo: panels aux + overlay + cards + diversos (140 arquivos)${NC}"
echo ""

A4_PANELS_CORE=$(grep -rl "emit(['\"][a-z]" $BASE/components/panels/*/core/*.js 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_PANELS_UI=$(grep -rl "emit(['\"][a-z]" $BASE/components/panels/*/ui/*.js 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_OVERLAY=$(grep -rl "emit(['\"][a-z]" $BASE/components/overlay-layer/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | grep -v "telemetry/tracker" | wc -l)
A4_CARDS=$(grep -rl "emit(['\"][a-z]" $BASE/components/cards/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_DEVICE=$(grep -rl "emit(['\"][a-z]" $BASE/components/device-manager/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_SAVED=$(grep -rl "emit(['\"][a-z]" $BASE/components/saved-views-manager/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_LOGIN=$(grep -rl "emit(['\"][a-z]" $BASE/components/login-modal/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)
A4_PRELOADER=$(grep -rl "emit(['\"][a-z]" $BASE/components/preloader/ --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)

A4_PEND=$((A4_PANELS_CORE + A4_PANELS_UI + A4_OVERLAY + A4_CARDS + A4_DEVICE + A4_SAVED + A4_LOGIN + A4_PRELOADER))
A4_TOTAL=140
A4_DONE=$((A4_TOTAL - A4_PEND))
if [ $A4_DONE -lt 0 ]; then A4_DONE=0; fi
A4_PCT=$(calc_percent $A4_PEND $A4_TOTAL)

echo -e "  ${PURPLE}Arquivos:${NC}  ${GREEN}$A4_DONE migrados${NC} / ${RED}$A4_PEND pendentes${NC} / ${WHITE}$A4_TOTAL total${NC}"
echo -e "  ${PURPLE}Progresso:${NC} $(progress_bar $A4_PCT)"
echo -e "  ${GRAY}  panels/core:     $A4_PANELS_CORE arq${NC}"
echo -e "  ${GRAY}  panels/ui:       $A4_PANELS_UI arq${NC}"
echo -e "  ${GRAY}  overlay-layer/:  $A4_OVERLAY arq${NC}"
echo -e "  ${GRAY}  cards/:          $A4_CARDS arq${NC}"
echo -e "  ${GRAY}  device-manager/: $A4_DEVICE arq${NC}"
echo -e "  ${GRAY}  saved-views/:    $A4_SAVED arq${NC}"
echo -e "  ${GRAY}  login-modal/:    $A4_LOGIN arq${NC}"
echo -e "  ${GRAY}  preloader/:      $A4_PRELOADER arq${NC}"
echo ""

TOTAL_PEND=$((A1_PEND + A2_PEND + A3_PEND + A4_PEND))
TOTAL_FILES=$((A1_TOTAL + A2_TOTAL + A3_TOTAL + A4_TOTAL))
TOTAL_DONE=$((TOTAL_FILES - TOTAL_PEND))
TOTAL_PCT=$(calc_percent $TOTAL_PEND $TOTAL_FILES)

REAL_EMIT=$(grep -roh "emit(['\"][a-z]" $BASE --include="*.js" 2>/dev/null | grep -v "_EVENTS" | wc -l)

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                              RESUMO GERAL                                     ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${WHITE}${BOLD}PROGRESSO TOTAL:${NC}"
echo -e "  $(progress_bar $TOTAL_PCT)"
echo -e "  ${GREEN}$TOTAL_DONE migrados${NC} | ${RED}$TOTAL_PEND pendentes${NC} | ${WHITE}$TOTAL_FILES total${NC}"
echo ""
echo -e "  ${WHITE}${BOLD}emit() RESTANTES:${NC} ${YELLOW}$REAL_EMIT${NC}"
echo ""

echo -e "${CYAN}+==============+============+============+============+=================+${NC}"
printf "${CYAN}|${NC} %-12s ${CYAN}|${NC} %-10s ${CYAN}|${NC} %-10s ${CYAN}|${NC} %-10s ${CYAN}|${NC} %-15s ${CYAN}|${NC}\n" "AGENTE" "MIGRADOS" "PENDENTES" "TOTAL" "STATUS"
echo -e "${CYAN}+==============+============+============+============+=================+${NC}"

get_status() {
    if [ $1 -eq 0 ]; then echo -e "${GREEN}COMPLETO${NC}"
    elif [ $1 -eq $2 ]; then echo -e "${GRAY}AGUARDANDO${NC}"
    else echo -e "${YELLOW}PROGRESSO${NC}"
    fi
}

printf "${CYAN}|${NC} ${PURPLE}%-12s${NC} ${CYAN}|${NC} ${GREEN}%-10s${NC} ${CYAN}|${NC} ${RED}%-10s${NC} ${CYAN}|${NC} ${WHITE}%-10s${NC} ${CYAN}|${NC} %-15b ${CYAN}|${NC}\n" "AGENTE 01" "$A1_DONE" "$A1_PEND" "$A1_TOTAL" "$(get_status $A1_PEND $A1_TOTAL)"
printf "${CYAN}|${NC} ${PURPLE}%-12s${NC} ${CYAN}|${NC} ${GREEN}%-10s${NC} ${CYAN}|${NC} ${RED}%-10s${NC} ${CYAN}|${NC} ${WHITE}%-10s${NC} ${CYAN}|${NC} %-15b ${CYAN}|${NC}\n" "AGENTE 02" "$A2_DONE" "$A2_PEND" "$A2_TOTAL" "$(get_status $A2_PEND $A2_TOTAL)"
printf "${CYAN}|${NC} ${PURPLE}%-12s${NC} ${CYAN}|${NC} ${GREEN}%-10s${NC} ${CYAN}|${NC} ${RED}%-10s${NC} ${CYAN}|${NC} ${WHITE}%-10s${NC} ${CYAN}|${NC} %-15b ${CYAN}|${NC}\n" "AGENTE 03" "$A3_DONE" "$A3_PEND" "$A3_TOTAL" "$(get_status $A3_PEND $A3_TOTAL)"
printf "${CYAN}|${NC} ${PURPLE}%-12s${NC} ${CYAN}|${NC} ${GREEN}%-10s${NC} ${CYAN}|${NC} ${RED}%-10s${NC} ${CYAN}|${NC} ${WHITE}%-10s${NC} ${CYAN}|${NC} %-15b ${CYAN}|${NC}\n" "AGENTE 04" "$A4_DONE" "$A4_PEND" "$A4_TOTAL" "$(get_status $A4_PEND $A4_TOTAL)"
echo -e "${CYAN}+==============+============+============+============+=================+${NC}"

echo ""
echo -e "${GRAY}Atualizado: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${GRAY}Executar:   bash /var/www/dshowdash/p18ec-monitor.sh${NC}"
echo -e "${GRAY}Watch:      watch -c -n 30 'bash /var/www/dshowdash/p18ec-monitor.sh'${NC}"
echo ""
