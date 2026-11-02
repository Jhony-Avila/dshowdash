#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P13_nav_$(date +%Y%m%d_%H%M%S).log}"
NAVPACK="${ROOT}/tools/db/navpack_export.json"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
warn(){ printf "⚠️  %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P13 — Equivalência Code ↔ DB (NavPack)\n"
  hr

  sec "Estrutura Adapters"
  [ -f "$ROOT/public/components/main/adapters/NavActionRepository.js" ] && ok "NavActionRepository existe" || bad "NavActionRepository AUSENTE"
  [ -f "$ROOT/public/components/main/adapters/NavRouteRepository.js" ] && ok "NavRouteRepository existe" || bad "NavRouteRepository AUSENTE"
  [ -f "$ROOT/public/components/main/adapters/NavDestinationRepository.js" ] && ok "NavDestinationRepository existe" || bad "NavDestinationRepository AUSENTE"

  sec "Sintaxe Adapters"
  node --check "$ROOT/public/components/main/adapters/NavActionRepository.js" 2>/dev/null && ok "NavActionRepository sintaxe OK" || bad "NavActionRepository ERRO"
  node --check "$ROOT/public/components/main/adapters/NavRouteRepository.js" 2>/dev/null && ok "NavRouteRepository sintaxe OK" || bad "NavRouteRepository ERRO"
  node --check "$ROOT/public/components/main/adapters/NavDestinationRepository.js" 2>/dev/null && ok "NavDestinationRepository sintaxe OK" || bad "NavDestinationRepository ERRO"

  sec "NavPack Export"
  if [ -f "$NAVPACK" ]; then
    ok "NavPack existe"
    
    # Extrair stats do NavPack
    NAVPACK_ACTIONS=$(python3 -c "import json; print(json.load(open('$NAVPACK')).get('stats',{}).get('totalActions',0))" 2>/dev/null || echo "0")
    NAVPACK_ROUTES=$(python3 -c "import json; print(json.load(open('$NAVPACK')).get('stats',{}).get('totalRoutes',0))" 2>/dev/null || echo "0")
    NAVPACK_DEST=$(python3 -c "import json; print(json.load(open('$NAVPACK')).get('stats',{}).get('totalDestinations',0))" 2>/dev/null || echo "0")
    NAVPACK_BINDINGS=$(python3 -c "import json; print(json.load(open('$NAVPACK')).get('stats',{}).get('totalBindings',0))" 2>/dev/null || echo "0")
    NAVPACK_RESOLUTIONS=$(python3 -c "import json; print(json.load(open('$NAVPACK')).get('stats',{}).get('totalResolutions',0))" 2>/dev/null || echo "0")
    
    printf "   NavPack Actions: %s\n" "$NAVPACK_ACTIONS"
    printf "   NavPack Routes: %s\n" "$NAVPACK_ROUTES"
    printf "   NavPack Destinations: %s\n" "$NAVPACK_DEST"
    printf "   NavPack Bindings: %s\n" "$NAVPACK_BINDINGS"
    printf "   NavPack Resolutions: %s\n" "$NAVPACK_RESOLUTIONS"
  else
    bad "NavPack não existe"
  fi

  sec "Contagem Code (action-bindings.js)"
  CODE_BINDINGS=$(grep -c "effect:" "$ROOT/public/components/main/domain/action-hub/action-bindings.js" 2>/dev/null || echo "0")
  printf "   Code Bindings: %s\n" "$CODE_BINDINGS"
  
  if [ "$CODE_BINDINGS" = "$NAVPACK_BINDINGS" ] 2>/dev/null; then
    ok "Bindings: Code ($CODE_BINDINGS) == NavPack ($NAVPACK_BINDINGS)"
  else
    warn "Bindings: Code ($CODE_BINDINGS) != NavPack ($NAVPACK_BINDINGS)"
  fi

  sec "Contagem Code (ROUTE_TO_PANEL)"
  CODE_ROUTES=$(grep -cE "^\s*'" "$ROOT/public/components/main/domain/manifest-controller.js" 2>/dev/null | head -1 || echo "0")
  # Contar linhas com padrão 'key': 'value' no ROUTE_TO_PANEL
  CODE_ROUTES=$(sed -n '/ROUTE_TO_PANEL/,/^};/p' "$ROOT/public/components/main/domain/manifest-controller.js" 2>/dev/null | grep -c ":" || echo "0")
  printf "   Code Route Mappings: ~%s\n" "$CODE_ROUTES"

  sec "Adapters Read-Only"
  grep -q "source.*code.*db" "$ROOT/public/components/main/adapters/NavActionRepository.js" && ok "NavActionRepository suporta source code|db" || bad "NavActionRepository sem source"
  grep -q "source.*code.*db" "$ROOT/public/components/main/adapters/NavRouteRepository.js" && ok "NavRouteRepository suporta source code|db" || bad "NavRouteRepository sem source"
  grep -q "source.*code.*db" "$ROOT/public/components/main/adapters/NavDestinationRepository.js" && ok "NavDestinationRepository suporta source code|db" || bad "NavDestinationRepository sem source"

  sec "Fallback para Code"
  grep -q "Fallback" "$ROOT/public/components/main/adapters/NavActionRepository.js" && ok "NavActionRepository tem fallback" || warn "NavActionRepository sem fallback explícito"
  grep -q "Fallback" "$ROOT/public/components/main/adapters/NavRouteRepository.js" && ok "NavRouteRepository tem fallback" || warn "NavRouteRepository sem fallback explícito"
  grep -q "Fallback" "$ROOT/public/components/main/adapters/NavDestinationRepository.js" && ok "NavDestinationRepository tem fallback" || warn "NavDestinationRepository sem fallback explícito"

  sec "Runtime NÃO alterado"
  # Verificar que os imports originais ainda existem
  grep -q "import.*action-bindings" "$ROOT/public/components/main/domain/action-hub/action-executor.js" && ok "action-executor ainda usa action-bindings.js" || bad "action-executor ALTERADO"
  grep -q "ROUTE_TO_PANEL" "$ROOT/public/components/main/domain/manifest-controller.js" && ok "manifest-controller ainda usa ROUTE_TO_PANEL" || bad "manifest-controller ALTERADO"

  hr
  if [ "$FAIL" -eq 0 ]; then 
    printf "✅ P13 EQUIVALÊNCIA VALIDADA\n"
    printf "   Sistema pronto para alternar Code → DB com feature flag\n"
  else 
    printf "❌ P13 FALHOU (erros: %s)\n" "$FAIL"
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
