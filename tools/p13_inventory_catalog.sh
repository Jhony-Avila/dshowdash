#!/bin/bash
# P13 - Inventário v1.2.0
set -e
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="/tmp/aaa_p13_inventory_${TIMESTAMP}"
PROJECT_ROOT="/var/www/dshowdash/public"
mkdir -p "$OUTPUT_DIR"
LOG_FILE="${OUTPUT_DIR}/run.log"

log() { echo "[$(date +"%H:%M:%S")] $1" | tee -a "$LOG_FILE"; }
log "=== P13 INVENTORY v1.2.0 ==="

# 1. ACTIONS
log "1. Actions..."
echo -e "actionId\tsourceFile\tline" > "${OUTPUT_DIR}/actions_catalog.tsv"
grep -rhoE "(navrail|header|footer|sidebar):[a-zA-Z0-9_:-]+" "$PROJECT_ROOT/components/main/domain/action-hub/" 2>/dev/null | sort -u | while read -r a; do echo -e "$a\taction-hub\t0"; done >> "${OUTPUT_DIR}/actions_catalog.tsv"
ACTIONS_COUNT=$(($(wc -l < "${OUTPUT_DIR}/actions_catalog.tsv") - 1))
log "Actions: $ACTIONS_COUNT"

# 2. BINDINGS
log "2. Bindings..."
echo -e "actionId\teffect\troute" > "${OUTPUT_DIR}/bindings_catalog.tsv"
grep -oE "^[[:space:]]*'[^']+'" "$PROJECT_ROOT/components/main/domain/action-hub/action-bindings.js" 2>/dev/null | tr -d "' " | while read -r b; do echo -e "$b\t\t"; done >> "${OUTPUT_DIR}/bindings_catalog.tsv"
BINDINGS_COUNT=$(($(wc -l < "${OUTPUT_DIR}/bindings_catalog.tsv") - 1))
log "Bindings: $BINDINGS_COUNT"

# 3. ROUTES
log "3. Routes..."
echo -e "route\tpanelId" > "${OUTPUT_DIR}/routes_catalog.tsv"
sed -n "/ROUTE_TO_PANEL = {/,/^};/p" "$PROJECT_ROOT/components/main/domain/manifest-controller.js" 2>/dev/null | grep -E "^\s*'" | grep -v "//" | sed -E "s/^\s*'([^']+)':\s*'([^']+)'.*/\1\t\2/" >> "${OUTPUT_DIR}/routes_catalog.tsv"
ROUTES_COUNT=$(($(wc -l < "${OUTPUT_DIR}/routes_catalog.tsv") - 1))
log "Routes: $ROUTES_COUNT"

# 4. PANELS
log "4. Panels..."
echo -e "panelId\tpath" > "${OUTPUT_DIR}/panels_catalog.tsv"
ls -d "$PROJECT_ROOT/components/panels"/*/ 2>/dev/null | while read -r p; do echo -e "$(basename "$p")\t$p"; done >> "${OUTPUT_DIR}/panels_catalog.tsv"
PANELS_COUNT=$(($(wc -l < "${OUTPUT_DIR}/panels_catalog.tsv") - 1))
log "Panels: $PANELS_COUNT"

# 5. GAPS
log "5. Gaps..."
cut -f1 "${OUTPUT_DIR}/actions_catalog.tsv" | tail -n+2 | sort -u > "${OUTPUT_DIR}/_a.tmp"
cut -f1 "${OUTPUT_DIR}/bindings_catalog.tsv" | tail -n+2 | sort -u > "${OUTPUT_DIR}/_b.tmp"
cut -f2 "${OUTPUT_DIR}/routes_catalog.tsv" | tail -n+2 | sort -u > "${OUTPUT_DIR}/_r.tmp"
cut -f1 "${OUTPUT_DIR}/panels_catalog.tsv" | tail -n+2 | sort -u > "${OUTPUT_DIR}/_p.tmp"

comm -23 "${OUTPUT_DIR}/_a.tmp" "${OUTPUT_DIR}/_b.tmp" > "${OUTPUT_DIR}/gaps_action_without_binding.txt" 2>/dev/null || true
comm -23 "${OUTPUT_DIR}/_b.tmp" "${OUTPUT_DIR}/_a.tmp" > "${OUTPUT_DIR}/gaps_binding_without_action.txt" 2>/dev/null || true
comm -23 "${OUTPUT_DIR}/_r.tmp" "${OUTPUT_DIR}/_p.tmp" > "${OUTPUT_DIR}/gaps_route_panel_missing.txt" 2>/dev/null || true
comm -23 "${OUTPUT_DIR}/_p.tmp" "${OUTPUT_DIR}/_r.tmp" > "${OUTPUT_DIR}/gaps_panels_without_routes.txt" 2>/dev/null || true
rm -f "${OUTPUT_DIR}"/_*.tmp

GAP1=$(wc -l < "${OUTPUT_DIR}/gaps_action_without_binding.txt" 2>/dev/null || echo 0)
GAP2=$(wc -l < "${OUTPUT_DIR}/gaps_binding_without_action.txt" 2>/dev/null || echo 0)
GAP3=$(wc -l < "${OUTPUT_DIR}/gaps_route_panel_missing.txt" 2>/dev/null || echo 0)
GAP4=$(wc -l < "${OUTPUT_DIR}/gaps_panels_without_routes.txt" 2>/dev/null || echo 0)

# 6. SUMMARY
cat > "${OUTPUT_DIR}/summary.json" << EOF
{"actions":$ACTIONS_COUNT,"bindings":$BINDINGS_COUNT,"routes":$ROUTES_COUNT,"panels":$PANELS_COUNT,"gaps":{"no_binding":$GAP1,"no_action":$GAP2,"panel_missing":$GAP3,"no_route":$GAP4}}
EOF

echo ""
echo "=== P13 SUMMARY ==="
echo "Actions: $ACTIONS_COUNT | Bindings: $BINDINGS_COUNT | Routes: $ROUTES_COUNT | Panels: $PANELS_COUNT"
echo "Gaps: no_binding=$GAP1 no_action=$GAP2 panel_missing=$GAP3 no_route=$GAP4"
echo ""
echo "OUTPUT: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
