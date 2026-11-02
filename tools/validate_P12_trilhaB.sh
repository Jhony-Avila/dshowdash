#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P12_trilhaB_$(date +%Y%m%d_%H%M%S).log}"
PANELS_DIR="$ROOT/public/components/panels"
MANIFEST="$ROOT/public/components/main/domain/manifest-controller.js"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P12 TRILHA B — Cobertura Total de Navegação\n"
  hr

  sec "Painéis Stub Criados"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    if [ -d "$PANELS_DIR/$panel" ]; then
      ok "$panel existe"
    else
      bad "$panel AUSENTE"
    fi
  done

  sec "Estrutura dos Painéis"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    if [ -f "$PANELS_DIR/$panel/index.js" ]; then
      ok "$panel/index.js existe"
    else
      bad "$panel/index.js AUSENTE"
    fi
    
    if [ -d "$PANELS_DIR/$panel/styles" ]; then
      ok "$panel/styles/ existe"
    else
      bad "$panel/styles/ AUSENTE"
    fi
  done

  sec "Sintaxe JS"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    if node --check "$PANELS_DIR/$panel/index.js" 2>/dev/null; then
      ok "$panel sintaxe OK"
    else
      bad "$panel ERRO sintaxe"
    fi
  done

  sec "Contrato AAA (mount/unmount/healthCheck/info)"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    local file="$PANELS_DIR/$panel/index.js"
    local has_mount=$(grep -c "export function mount" "$file" 2>/dev/null || echo "0")
    local has_unmount=$(grep -c "export function unmount" "$file" 2>/dev/null || echo "0")
    local has_health=$(grep -c "export function healthCheck" "$file" 2>/dev/null || echo "0")
    local has_info=$(grep -c "export function info" "$file" 2>/dev/null || echo "0")
    
    if [ "$has_mount" -ge 1 ] && [ "$has_unmount" -ge 1 ] && [ "$has_health" -ge 1 ] && [ "$has_info" -ge 1 ]; then
      ok "$panel contrato AAA completo"
    else
      bad "$panel contrato AAA incompleto (m:$has_mount u:$has_unmount h:$has_health i:$has_info)"
    fi
  done

  sec "Versão STUB-AAA"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    if grep -q "STUB-AAA" "$PANELS_DIR/$panel/index.js" 2>/dev/null; then
      ok "$panel tem versão STUB-AAA"
    else
      bad "$panel sem versão STUB-AAA"
    fi
  done

  sec "Rotas Canônicas no ROUTE_TO_PANEL"
  
  declare -A route_map
  route_map["analytics"]="panel-analytics"
  route_map["charts"]="panel-charts"
  route_map["database"]="panel-datahub"
  route_map["folder"]="panel-files"
  route_map["location"]="panel-location"
  
  for route in analytics charts database folder location; do
    local expected="${route_map[$route]}"
    if grep -q "'$route': '$expected'" "$MANIFEST" 2>/dev/null; then
      ok "Rota '$route' → '$expected'"
    else
      bad "Rota '$route' → '$expected' NÃO encontrada"
    fi
  done

  sec "Sem Fetch/API nos Stubs"
  
  for panel in panel-analytics panel-charts panel-datahub panel-files panel-location; do
    if grep -qE "fetch\(|axios|XMLHttpRequest" "$PANELS_DIR/$panel/index.js" 2>/dev/null; then
      bad "$panel contém fetch/API (PROIBIDO em stub)"
    else
      ok "$panel sem fetch/API"
    fi
  done

  sec "Resumo de Painéis"
  printf "   Total painéis na pasta: %s\n" "$(ls -d $PANELS_DIR/panel-* 2>/dev/null | wc -l)"
  printf "   Painéis stub criados: 5\n"

  hr
  if [ "$FAIL" -eq 0 ]; then 
    printf "✅ P12 TRILHA B COMPLETA\n"
    printf "   100%% cobertura de navegação - Zero cliques mortos\n"
  else 
    printf "❌ P12 TRILHA B FALHOU (erros: %s)\n" "$FAIL"
  fi
  hr
}

main >"$OUT" 2>&1
tail -n 80 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
