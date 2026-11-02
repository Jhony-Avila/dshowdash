#!/bin/bash
# P18-TELEMETRY Monitor - Progresso por Agente
# Versão: 1.0.0

clear

ROOT="/var/www/dshowdash/public/components"

# Função para contar arquivos com telemetry.track() hardcoded
count_pending() {
    grep -rl "telemetry.track(['\"]" $@ --include="*.js" 2>/dev/null | wc -l
}

# AGENTE 01: Panels 01-07
A1_TOTAL=9
A1_DIRS="$ROOT/panels/panel-01 $ROOT/panels/panel-02 $ROOT/panels/panel-03 $ROOT/panels/panel-06 $ROOT/panels/panel-07"
A1_PENDING=$(count_pending $A1_DIRS)
A1_MIGRATED=$((A1_TOTAL - A1_PENDING))
A1_PCT=$((A1_MIGRATED * 100 / A1_TOTAL))

# AGENTE 02: Panels 09-14
A2_TOTAL=11
A2_DIRS="$ROOT/panels/panel-09 $ROOT/panels/panel-10 $ROOT/panels/panel-11 $ROOT/panels/panel-12 $ROOT/panels/panel-13 $ROOT/panels/panel-14"
A2_PENDING=$(count_pending $A2_DIRS)
A2_MIGRATED=$((A2_TOTAL - A2_PENDING))
A2_PCT=$((A2_MIGRATED * 100 / A2_TOTAL))

# AGENTE 03: Panels 15-19
A3_TOTAL=13
A3_DIRS="$ROOT/panels/panel-15 $ROOT/panels/panel-16 $ROOT/panels/panel-17 $ROOT/panels/panel-18 $ROOT/panels/panel-19"
A3_PENDING=$(count_pending $A3_DIRS)
A3_MIGRATED=$((A3_TOTAL - A3_PENDING))
A3_PCT=$((A3_MIGRATED * 100 / A3_TOTAL))

# AGENTE 04: Especiais + Main + Table
A4_TOTAL=8
A4_DIRS="$ROOT/panels/panel-dashboard $ROOT/panels/panel-feature-flags-admin $ROOT/panels/panel-orchestrator $ROOT/panels/panel-orchestrator-manager $ROOT/main $ROOT/table-engine"
A4_PENDING=$(count_pending $A4_DIRS)
A4_MIGRATED=$((A4_TOTAL - A4_PENDING))
A4_PCT=$((A4_MIGRATED * 100 / A4_TOTAL))

# AGENTE 05: Header + Sidebar + Diversos
A5_TOTAL=18
A5_DIRS="$ROOT/header $ROOT/sidebar $ROOT/login-modal $ROOT/preloader $ROOT/security-policies-manager $ROOT/ticker $ROOT/ui-orchestrator"
A5_PENDING=$(count_pending $A5_DIRS)
A5_MIGRATED=$((A5_TOTAL - A5_PENDING))
A5_PCT=$((A5_MIGRATED * 100 / A5_TOTAL))

# TOTAIS
TOTAL_FILES=$((A1_TOTAL + A2_TOTAL + A3_TOTAL + A4_TOTAL + A5_TOTAL))
TOTAL_PENDING=$((A1_PENDING + A2_PENDING + A3_PENDING + A4_PENDING + A5_PENDING))
TOTAL_MIGRATED=$((TOTAL_FILES - TOTAL_PENDING))
TOTAL_PCT=$((TOTAL_MIGRATED * 100 / TOTAL_FILES))

# Função para barra de progresso
progress_bar() {
    local pct=$1
    local width=20
    local filled=$((pct * width / 100))
    local empty=$((width - filled))
    printf "["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "]"
}

# OUTPUT
printf "\n"
printf "═══════════════════════════════════════════════════════════════════════\n"
printf "           P18-TELEMETRY - MONITOR DE PROGRESSO POR AGENTE\n"
printf "═══════════════════════════════════════════════════════════════════════\n"
printf "\n"
printf "┌─────────┬────────────────────────┬──────────┬──────────┬───────┬───────────────────────┐\n"
printf "│ AGENTE  │ ESCOPO                 │ MIGRADOS │ PENDENTE │  %%    │ PROGRESSO             │\n"
printf "├─────────┼────────────────────────┼──────────┼──────────┼───────┼───────────────────────┤\n"
printf "│ AG-01   │ Panels 01-07           │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $A1_MIGRATED $A1_TOTAL $A1_PENDING $A1_PCT "$(progress_bar $A1_PCT)"
printf "│ AG-02   │ Panels 09-14           │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $A2_MIGRATED $A2_TOTAL $A2_PENDING $A2_PCT "$(progress_bar $A2_PCT)"
printf "│ AG-03   │ Panels 15-19           │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $A3_MIGRATED $A3_TOTAL $A3_PENDING $A3_PCT "$(progress_bar $A3_PCT)"
printf "│ AG-04   │ Especiais+Main+Table   │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $A4_MIGRATED $A4_TOTAL $A4_PENDING $A4_PCT "$(progress_bar $A4_PCT)"
printf "│ AG-05   │ Header+Sidebar+Outros  │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $A5_MIGRATED $A5_TOTAL $A5_PENDING $A5_PCT "$(progress_bar $A5_PCT)"
printf "├─────────┼────────────────────────┼──────────┼──────────┼───────┼───────────────────────┤\n"
printf "│ TOTAL   │ TODOS OS AGENTES       │ %3d/%-3d  │ %3d      │ %3d%%  │ %s │\n" $TOTAL_MIGRATED $TOTAL_FILES $TOTAL_PENDING $TOTAL_PCT "$(progress_bar $TOTAL_PCT)"
printf "└─────────┴────────────────────────┴──────────┴──────────┴───────┴───────────────────────┘\n"
printf "\n"

if [ $TOTAL_PCT -eq 100 ]; then
    printf "  ✅ MIGRAÇÃO P18-TELEMETRY COMPLETA!\n"
else
    printf "  ⏳ Migração em andamento...\n"
fi

printf "\n"
printf "═══════════════════════════════════════════════════════════════════════\n"
printf "  Atualizado: $(date '+%Y-%m-%d %H:%M:%S')\n"
printf "  Comando: /var/www/dshowdash/p18-telemetry-monitor.sh\n"
printf "═══════════════════════════════════════════════════════════════════════\n"
printf "\n"
