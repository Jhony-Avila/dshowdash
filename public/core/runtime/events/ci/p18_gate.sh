#!/bin/bash
# P18EC - Regression Gate Script
# @version 4.0.0-P18EC
# @changelog v4.0.0 - Briefing Gargalo 04 100%

BASE_PATH="/var/www/dshowdash/public"
EVENTS_CORE="$BASE_PATH/core/runtime/events"
OUTPUT_DIR="/var/www/dshowdash/logs/p18"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/p18-gate-$TIMESTAMP.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

ERRORS=0
WARNINGS=0

echo "════════════════════════════════════════════════════════════"
echo "  P18EC - Regression Gate v4.0.0 | $(date)"
echo "════════════════════════════════════════════════════════════"

# P0.1 - Deep Imports
echo ""
echo "=== P0.1: Deep Imports Check ==="
DEEP_CATALOG=$(grep -r "from '/core/runtime/events/catalog" "$BASE_PATH/components" "$BASE_PATH/modules" "$BASE_PATH/domains" "$BASE_PATH/assets/js" "$BASE_PATH/app" --include="*.js" 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
DEEP_PAYLOADS=$(grep -r "from '/core/runtime/events/payloads" "$BASE_PATH/components" "$BASE_PATH/modules" "$BASE_PATH/domains" "$BASE_PATH/assets/js" "$BASE_PATH/app" --include="*.js" 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
DEEP_VALIDATE=$(grep -r "from '/core/runtime/events/validate.js'" "$BASE_PATH/components" "$BASE_PATH/modules" "$BASE_PATH/domains" "$BASE_PATH/assets/js" "$BASE_PATH/app" --include="*.js" 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
DEEP_NAMESPACES=$(grep -r "from '/core/runtime/events/namespaces.js'" "$BASE_PATH/components" "$BASE_PATH/modules" "$BASE_PATH/domains" "$BASE_PATH/assets/js" "$BASE_PATH/app" --include="*.js" 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
TOTAL_DEEP=$((DEEP_CATALOG + DEEP_PAYLOADS + DEEP_VALIDATE + DEEP_NAMESPACES))
[ "$TOTAL_DEEP" -gt 0 ] && echo -e "${RED}❌ FAIL: $TOTAL_DEEP deep imports${NC}" && ERRORS=$((ERRORS + 1)) || echo -e "${GREEN}✅ PASS: Zero deep imports${NC}"

# P0.2 - Index Central
echo ""
echo "=== P0.2: Adoção do Index Central ==="
INDEX_IMPORTS=$(grep -r "from '/core/runtime/events/index.js'" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
echo -e "${GREEN}✅ INFO: $INDEX_IMPORTS imports do index central${NC}"

# P0.3 - Bridges Paralelos
echo ""
echo "=== P0.3: Bridges Paralelos ==="
PARALLEL=$(find "$BASE_PATH" -name "*events-contracts.js" -type f 2>/dev/null | grep -v "$EVENTS_CORE" | wc -l)
[ "$PARALLEL" -gt 0 ] && echo -e "${RED}❌ FAIL: $PARALLEL bridges paralelos${NC}" && ERRORS=$((ERRORS + 1)) || echo -e "${GREEN}✅ PASS: Zero bridges paralelos${NC}"

# P0.4 - EVENT-CONTEXT Legacy (KPI Bloqueador)
echo ""
echo "=== P0.4: EVENT-CONTEXT Legacy (KPI Bloqueador) ==="
grep -rn "\.emit\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" > "$TMP_DIR/emit.txt"
grep -rn "\.on\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" > "$TMP_DIR/on.txt"
grep -rn "new CustomEvent\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" > "$TMP_DIR/ce.txt"
grep -rn "addEventListener\s*(\s*['\"][a-zA-Z0-9_-]\+:[a-zA-Z0-9_:-]\+['\"]" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "\.min\.js" | grep -v "/backup/" > "$TMP_DIR/al.txt"

EMIT_COUNT=$([ -s "$TMP_DIR/emit.txt" ] && wc -l < "$TMP_DIR/emit.txt" || echo 0)
ON_COUNT=$([ -s "$TMP_DIR/on.txt" ] && wc -l < "$TMP_DIR/on.txt" || echo 0)
CE_COUNT=$([ -s "$TMP_DIR/ce.txt" ] && wc -l < "$TMP_DIR/ce.txt" || echo 0)
AL_COUNT=$([ -s "$TMP_DIR/al.txt" ] && wc -l < "$TMP_DIR/al.txt" || echo 0)

CE_REVIEWED=0
if [ -s "$TMP_DIR/ce.txt" ]; then
  while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    grep -q "P18EC" "$file" 2>/dev/null && CE_REVIEWED=$((CE_REVIEWED + 1))
  done < "$TMP_DIR/ce.txt"
fi
CE_LEGACY=$((CE_COUNT - CE_REVIEWED))
LEGACY_REAL=$((EMIT_COUNT + CE_LEGACY))

echo "   emit('x:y'):          $EMIT_COUNT"
echo "   on('x:y'):            $ON_COUNT (locais)"
echo "   CustomEvent('x:y'):   $CE_COUNT (reviewed: $CE_REVIEWED, legacy: $CE_LEGACY)"
echo "   addEventListener:     $AL_COUNT (bridges)"
echo "   LEGACY REAL:          $LEGACY_REAL"

[ "$LEGACY_REAL" -eq 0 ] && echo -e "${GREEN}✅ PASS: Zero legacy real${NC}" || { [ "$LEGACY_REAL" -lt 5 ] && echo -e "${YELLOW}⚠️ WARNING: $LEGACY_REAL legacy${NC}" && WARNINGS=$((WARNINGS + 1)) || { echo -e "${RED}❌ FAIL: $LEGACY_REAL legacy${NC}" && ERRORS=$((ERRORS + 1)); }; }

# P0.5 - Estrutura Core
echo ""
echo "=== P0.5: Estrutura Core ==="
MISSING=0
for F in "$EVENTS_CORE/index.js" "$EVENTS_CORE/namespaces.js" "$EVENTS_CORE/validate.js"; do
  [ ! -f "$F" ] && MISSING=$((MISSING + 1)) && echo -e "${RED}❌ MISSING: $F${NC}"
done
[ "$MISSING" -eq 0 ] && echo -e "${GREEN}✅ PASS: Estrutura core completa${NC}" || ERRORS=$((ERRORS + 1))

# P0.6 - Métricas de Adoção
echo ""
echo "=== P0.6: Métricas de Adoção ==="
INTENTS=$(grep -r "_INTENTS\." "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v backup | wc -l)
CORE_IMP=$(grep -r "from '/core/runtime/events" "$BASE_PATH" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v backup | wc -l)
echo "   *_INTENTS.*:    $INTENTS"
echo "   Core imports:   $CORE_IMP"
echo -e "${GREEN}✅ INFO: Adoption metrics collected${NC}"

# P1 - Top 15 Eventos
echo ""
echo "=== P1: Top 15 Eventos (Event-Context) ==="
{
  grep -oP "(?<=['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$TMP_DIR/emit.txt" 2>/dev/null
  grep -oP "(?<=['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$TMP_DIR/on.txt" 2>/dev/null
  grep -oP "(?<=['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$TMP_DIR/ce.txt" 2>/dev/null
  grep -oP "(?<=['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" "$TMP_DIR/al.txt" 2>/dev/null
} | sort | uniq -c | sort -rn | head -15

# P2.1 - Top 15 Arquivos
echo ""
echo "=== P2.1: Top 15 Arquivos (Event-Context) ==="
{
  cut -d: -f1 "$TMP_DIR/emit.txt" 2>/dev/null
  cut -d: -f1 "$TMP_DIR/on.txt" 2>/dev/null
  cut -d: -f1 "$TMP_DIR/ce.txt" 2>/dev/null
  cut -d: -f1 "$TMP_DIR/al.txt" 2>/dev/null
} | sed "s|$BASE_PATH||" | sort | uniq -c | sort -rn | head -15

# P2.2 - Lista Detalhada Legacy
echo ""
echo "=== P2.2: Lista Detalhada (Legacy Real) ==="
if [ -s "$TMP_DIR/emit.txt" ]; then
  echo "   [EventBus emit]"
  head -10 "$TMP_DIR/emit.txt" | while read line; do
    f=$(echo "$line" | cut -d: -f1 | sed "s|$BASE_PATH||")
    n=$(echo "$line" | cut -d: -f2)
    e=$(echo "$line" | grep -oP "(?<=['\"])[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+(?=['\"])" | head -1)
    echo "   $f:$n -> $e"
  done
fi
[ "$EMIT_COUNT" -eq 0 ] && [ "$CE_LEGACY" -eq 0 ] && echo -e "   ${GREEN}(nenhum legacy real)${NC}"

# Classificação
echo ""
echo "=== Classificação ==="
echo "   P18EC-REVIEWED: panel:refresh, container:*, tab:*, toast:show"
echo "   Bridges DOM: auth:ready, appshell:ready, components:ready"
echo "   Locais: state:change, quality:change"

# Resumo
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  RESUMO: Erros=$ERRORS | Avisos=$WARNINGS"
echo "════════════════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ P18 GATE: FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ P18 GATE: PASSED${NC}"
  exit 0
fi
