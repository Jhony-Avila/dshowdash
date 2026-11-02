#!/bin/bash
# P14 WINDOW GOVERNANCE - MONITOR DE PROGRESSO (v2.0)
# Execute: bash /var/www/dshowdash/public/P14_MONITOR.sh

clear
echo "════════════════════════════════════════════════════════════════════"
echo "   📊 P14 WINDOW GOVERNANCE - MONITOR DE PROGRESSO v2.0"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════════════"
echo ""

ROOT="/var/www/dshowdash/public/components"
PANELS="$ROOT/panels"

count_violations() {
  grep -rn "window\.\(APP_CONFIG\|EventBus\|GlobalState\|SessionManager\|RouterGlobal\|TelemetryCore\)" "$1" 2>/dev/null | grep -v "_initPorts\|_ports\.\|typeof window\|\.bak\|\.md:" | wc -l
}

# AGENTE 01 - PANELS GRANDES
echo "🔵 AGENTE 01 - PANELS GRANDES"
echo "────────────────────────────────────────────────────────────────────"
TOTAL_A1=0
for comp in panel-user-management panel-10 panel-nav-admin; do
  if [ -d "$PANELS/$comp" ]; then
    v=$(count_violations "$PANELS/$comp")
    TOTAL_A1=$((TOTAL_A1 + v))
    if [ "$v" -eq 0 ]; then
      printf "  ✅ %-35s %3d\n" "$comp" "$v"
    else
      printf "  ⏳ %-35s %3d\n" "$comp" "$v"
    fi
  fi
done
echo "────────────────────────────────────────────────────────────────────"
printf "  SUBTOTAL AGENTE 01:                 %3d violações\n" "$TOTAL_A1"
echo ""

# AGENTE 02 - PANELS MÉDIOS-ALTOS
echo "🟢 AGENTE 02 - PANELS MÉDIOS-ALTOS"
echo "────────────────────────────────────────────────────────────────────"
TOTAL_A2=0
for comp in panel-04 panel-permissions-admin panel-05 panel-health-dashboard panel-18; do
  if [ -d "$PANELS/$comp" ]; then
    v=$(count_violations "$PANELS/$comp")
    TOTAL_A2=$((TOTAL_A2 + v))
    if [ "$v" -eq 0 ]; then
      printf "  ✅ %-35s %3d\n" "$comp" "$v"
    else
      printf "  ⏳ %-35s %3d\n" "$comp" "$v"
    fi
  fi
done
echo "────────────────────────────────────────────────────────────────────"
printf "  SUBTOTAL AGENTE 02:                 %3d violações\n" "$TOTAL_A2"
echo ""

# AGENTE 03 - PANELS MÉDIOS-BAIXOS
echo "🟡 AGENTE 03 - PANELS MÉDIOS-BAIXOS"
echo "────────────────────────────────────────────────────────────────────"
TOTAL_A3=0
for comp in panel-17 panel-14 panel-13 panel-orchestrator-manager panel-08 panel-06 panel-user-sessions panel-user-profile panel-16 panel-09 panel-navrail-admin panel-dashboard _example-refactored; do
  if [ -d "$PANELS/$comp" ]; then
    v=$(count_violations "$PANELS/$comp")
    TOTAL_A3=$((TOTAL_A3 + v))
    if [ "$v" -eq 0 ]; then
      printf "  ✅ %-35s %3d\n" "$comp" "$v"
    else
      printf "  ⏳ %-35s %3d\n" "$comp" "$v"
    fi
  fi
done
echo "────────────────────────────────────────────────────────────────────"
printf "  SUBTOTAL AGENTE 03:                 %3d violações\n" "$TOTAL_A3"
echo ""

# AGENTE 04 - PANEL-FOOTER-*
echo "🟠 AGENTE 04 - PANEL-FOOTER-*"
echo "────────────────────────────────────────────────────────────────────"
TOTAL_A4=0
for comp in panel-footer-activity panel-footer-api panel-footer-check panel-footer-clock panel-footer-copyright panel-footer-cpu panel-footer-database panel-footer-device-mic panel-footer-device-webcam panel-footer-disk panel-footer-docs panel-footer-file panel-footer-financial panel-footer-globe panel-footer-logo panel-footer-map-pin panel-footer-memory panel-footer-pipedrive panel-footer-registry panel-footer-server panel-footer-settings panel-footer-shield panel-footer-status panel-footer-status-mode panel-footer-support panel-footer-wifi; do
  if [ -d "$PANELS/$comp" ]; then
    v=$(count_violations "$PANELS/$comp")
    TOTAL_A4=$((TOTAL_A4 + v))
    if [ "$v" -eq 0 ]; then
      printf "  ✅ %-35s %3d\n" "$comp" "$v"
    else
      printf "  ⏳ %-35s %3d\n" "$comp" "$v"
    fi
  fi
done
echo "────────────────────────────────────────────────────────────────────"
printf "  SUBTOTAL AGENTE 04:                 %3d violações\n" "$TOTAL_A4"
echo ""

# AGENTE 05 - FOOTER + INTEGRATIONS/STATUS
echo "🔴 AGENTE 05 - FOOTER + INTEGRATIONS/STATUS"
echo "────────────────────────────────────────────────────────────────────"
TOTAL_A5=0

# Footer
v=$(count_violations "$ROOT/footer")
TOTAL_A5=$((TOTAL_A5 + v))
if [ "$v" -eq 0 ]; then
  printf "  ✅ %-35s %3d\n" "footer" "$v"
else
  printf "  ⏳ %-35s %3d\n" "footer" "$v"
fi

# Panels integration e status
for comp in panel-integration-adwords panel-integration-alfinete panel-integration-asaas panel-integration-bling panel-integration-calendar panel-integration-chatgpt panel-integration-google-drive panel-integration-loja-integrada panel-integration-mercado-livre panel-integration-pipedrive panel-status-currency-btc panel-status-currency-usd-brl panel-status-currency-usd-cny panel-status-email-integration panel-status-instagram-messenger panel-status-weather-sp panel-status-wechat-integration panel-status-whatsapp-integration panel-account-security panel-analytics panel-cards panel-charts panel-code panel-datahub panel-files panel-location painel-cards; do
  if [ -d "$PANELS/$comp" ]; then
    v=$(count_violations "$PANELS/$comp")
    TOTAL_A5=$((TOTAL_A5 + v))
    if [ "$v" -eq 0 ]; then
      printf "  ✅ %-35s %3d\n" "$comp" "$v"
    else
      printf "  ⏳ %-35s %3d\n" "$comp" "$v"
    fi
  fi
done
echo "────────────────────────────────────────────────────────────────────"
printf "  SUBTOTAL AGENTE 05:                 %3d violações\n" "$TOTAL_A5"
echo ""

# JÁ 100% COMPLIANT (tarefas anteriores)
echo "✅ JÁ 100% P14 COMPLIANT (missões anteriores)"
echo "────────────────────────────────────────────────────────────────────"
COMPLIANT_COUNT=0
for comp in main login-modal app-shell session-manager icon-registry table-engine pages panels-v2 security-policies-manager dev-tools toast layout-engine ui-orchestrator carousel animacoes audit-trail saved-views-manager notification-rules-client device-manager permission-audit-client security-events-client notification-manager charts accessibility-manager cache-manager error-boundary security performance-monitor network-monitor modal-manager-global theme-manager sw-controller router feature-flags analytics-manager permissions-guard layout-manager ticker context-provider _shared nav-rail preloader overlay-layer cards sidebar header; do
  if [ -d "$ROOT/$comp" ]; then
    v=$(count_violations "$ROOT/$comp")
    if [ "$v" -eq 0 ]; then
      COMPLIANT_COUNT=$((COMPLIANT_COUNT + 1))
    fi
  fi
done
printf "  ✅ %d componentes com 0 violações\n" "$COMPLIANT_COUNT"
echo ""

# RESUMO FINAL
TOTAL=$((TOTAL_A1 + TOTAL_A2 + TOTAL_A3 + TOTAL_A4 + TOTAL_A5))
INICIAL=1243

echo "════════════════════════════════════════════════════════════════════"
echo "   📈 RESUMO GERAL"
echo "════════════════════════════════════════════════════════════════════"
printf "   Violações iniciais:    %4d\n" "$INICIAL"
printf "   Violações atuais:      %4d\n" "$TOTAL"
printf "   Corrigidas:            %4d\n" "$((INICIAL - TOTAL))"
if [ "$INICIAL" -gt 0 ]; then
  PERCENT=$((100 - (TOTAL * 100 / INICIAL)))
else
  PERCENT=100
fi
printf "   Progresso:             %3d%%\n" "$PERCENT"
echo ""
echo "   📊 POR AGENTE:"
printf "   AGENTE 01 (Grandes):      %3d\n" "$TOTAL_A1"
printf "   AGENTE 02 (Médios-Altos): %3d\n" "$TOTAL_A2"
printf "   AGENTE 03 (Médios-Baixos):%3d\n" "$TOTAL_A3"
printf "   AGENTE 04 (Footer-*):     %3d\n" "$TOTAL_A4"
printf "   AGENTE 05 (Integrations): %3d\n" "$TOTAL_A5"
echo "════════════════════════════════════════════════════════════════════"
