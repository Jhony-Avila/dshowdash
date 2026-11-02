#!/usr/bin/env bash
set -u

ROOT="/var/www/dshowdash"
TOOLS_DIR="$ROOT/tools"
OUT="/tmp/validate_P2_AAA_delivery_$(date +%Y%m%d_%H%M%S).log"
FAIL=0

hr(){ printf "\n================================================================================\n"; }
sec(){ printf "\n-------------------- %s --------------------\n" "$1"; }
ok(){ printf "✅ %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }
note(){ printf "ℹ️  %s\n" "$1"; }

main(){
  hr
  printf "VALIDAÇÃO DE ENTREGA — P2 AAA (CLAUDE)\n"
  printf "Root: %s\n" "$ROOT"
  printf "Log:  %s\n" "$OUT"
  hr

  sec "[1] VALIDADORES AAA (BASE)"
  if bash "$TOOLS_DIR/validate_p1_aaa.sh" >/dev/null 2>&1; then ok "validate_p1_aaa.sh PASSOU"; else bad "validate_p1_aaa.sh FALHOU"; fi
  if bash "$TOOLS_DIR/validate_container_p1_aaa.sh" >/dev/null 2>&1; then ok "validate_container_p1_aaa.sh PASSOU"; else bad "validate_container_p1_aaa.sh FALHOU"; fi

  sec "[2] ANTI-REGRESSÃO — imports hardcoded /components/panels/<rota>/index.js"
  bad_imports="$(grep -RIn --include="*.js" -E "/components/panels/(geral|automacoes|clientes|admin/usuarios|admin/permissoes|preferencias)/index\\.js" \
    "$ROOT/public/components/main" "$ROOT/public/components/sidebar" "$ROOT/public/components/nav-rail" 2>/dev/null || true)"
  if [ -n "$bad_imports" ]; then
    bad "Encontrado import hardcoded inválido"
    printf "%s\n" "$bad_imports" | head -n 120 | sed 's/^/   • /'
  else
    ok "Sem imports hardcoded inválidos"
  fi

  # 3) MainEngine: listener e navigate devem resolver rota
  # P1-HEX: Aceita padrões alternativos (listeners.js com getRouteByIdOrPath)
  sec "[3] MAIN-ENGINE — ROUTE → PANELID (resolução de rotas)"
  ME="$ROOT/public/components/main/domain/main-engine/index.js"
  ME_LISTENERS="$ROOT/public/components/main/domain/main-engine/listeners.js"
  
  # Verifica se tem listener de rotas (no main-engine ou em listeners.js)
  if grep -nE "_setupRouterListener|setupAllListeners|ROUTER_EVENTS" "$ME" >/dev/null 2>&1; then
    ok "main-engine tem router listener setup"
  elif grep -nE "setupAllListeners|ROUTER_EVENTS\.ROUTE_CHANGED" "$ME_LISTENERS" >/dev/null 2>&1; then
    ok "listeners.js tem router listener setup (padrão modular)"
  else
    bad "Nenhum listener de rotas encontrado"
  fi
  
  # Verifica se resolve rota para panelId (resolveRoute ou getRouteByIdOrPath)
  if grep -nE "resolveRoute\\(|getRouteByIdOrPath\\(" "$ME" "$ME_LISTENERS" >/dev/null 2>&1; then
    ok "Resolução de rotas implementada (resolveRoute ou getRouteByIdOrPath)"
  else
    bad "Nenhuma resolução de rotas encontrada"
  fi

  # 4) Manifest ou Router helpers
  sec "[4] ROUTE MAPPING — Manifest ou Router Helpers"
  MC="$ROOT/public/components/main/domain/manifest-controller.js"
  RH="$ROOT/public/components/router/registry/helpers.js"
  
  route_mapping_found=false
  
  if [ -f "$MC" ]; then
    ok "manifest-controller.js existe"
    m_hits="$(grep -nE "ROUTE_TO_PANEL|DEFAULT_PANEL|resolveRoute\\(" "$MC" 2>/dev/null | head -n 10 || true)"
    if [ -n "$m_hits" ]; then
      ok "Manifest contém route mapping"
      route_mapping_found=true
    fi
  fi
  
  if [ -f "$RH" ]; then
    ok "router/registry/helpers.js existe"
    rh_hits="$(grep -nE "getRouteByIdOrPath|ROUTES|routeRegistry" "$RH" 2>/dev/null | head -n 10 || true)"
    if [ -n "$rh_hits" ]; then
      ok "Router helpers contém route mapping"
      route_mapping_found=true
    fi
  fi
  
  if [ "$route_mapping_found" = false ]; then
    bad "Nenhum route mapping encontrado"
  fi

  sec "[5] CONTAINER P2 — API (dock/layoutPolicy/snapshot/restore)"
  CA="$ROOT/public/components/main/adapters/container/adapter.js"
  CA_DIR="$ROOT/public/components/main/adapters/container"
  CP="$ROOT/public/components/main/ports/ContainerPort.js"

  if [ -f "$CA" ]; then ok "ContainerAdapter existe"; else bad "ContainerAdapter ausente"; fi
  if [ -f "$CP" ]; then ok "ContainerPort.js existe"; else bad "ContainerPort.js ausente"; fi

  ca_api="$(grep -RIn --include="*.js" -E "DOCK_SLOTS|LAYOUT_MODE|setDock|getDock|setLayoutPolicy|getLayoutPolicy|snapshot|restore|bringToFront|activate|deactivate|setPolicy|getPolicy" "$CA_DIR" 2>/dev/null | head -n 5 || true)"
  if [ -n "$ca_api" ]; then ok "ContainerAdapter contém APIs P2"; else bad "ContainerAdapter não contém APIs P2"; fi

  cp_api="$(grep -nE "setDock|getDock|setLayoutPolicy|getLayoutPolicy|snapshot|restore|setPolicy|getPolicy|activate|deactivate|bringToFront|list" "$CP" 2>/dev/null | head -n 5 || true)"
  if [ -n "$cp_api" ]; then ok "ContainerPort expõe APIs P2"; else note "ContainerPort básico (APIs P2 no Adapter)"; fi

  sec "[6] EVENTOS P2 — container:* emitidos"
  ev_hits="$(grep -RIn --include="*.js" -E "CONTAINER_EVENTS\.|'container:" "$ROOT/public/components/main/domain" 2>/dev/null | head -n 5 || true)"
  if [ -n "$ev_hits" ]; then ok "Eventos container:* emitidos em domain"; else bad "Eventos container:* não encontrados"; fi

  sec "[7] UI/CSS — dock slots / active / z-index"
  UI_DIR="$ROOT/public/components/main/ui/container-main"
  if [ -d "$UI_DIR" ]; then
    ok "UI container-main existe"
    css_hits="$(grep -RIn --include="*.css" -E "dsd-dock-slot|dsd-container--active|z-index" "$UI_DIR" 2>/dev/null | head -n 5 || true)"
    if [ -n "$css_hits" ]; then ok "CSS contém padrões docking/active"; else note "CSS docking pode estar em outro arquivo"; fi
  else
    bad "UI container-main ausente"
  fi

  sec "[8] TRIGGERS — Sidebar/NavRail geram rota"
  sb_hits="$(grep -RIn --include="*.js" -E "RouterGlobal|location\\.hash" "$ROOT/public/components/sidebar" 2>/dev/null | head -n 5 || true)"
  nr_hits="$(grep -RIn --include="*.js" -E "navrail:open-panel|RouterGlobal" "$ROOT/public/components/nav-rail" 2>/dev/null | head -n 5 || true)"
  if [ -n "$sb_hits" ]; then ok "Sidebar usa RouterGlobal/hash"; else bad "Sidebar não usa RouterGlobal/hash"; fi
  if [ -n "$nr_hits" ]; then ok "NavRail usa open-panel → RouterGlobal"; else bad "NavRail não usa RouterGlobal"; fi

  hr
  if [ "$FAIL" -eq 0 ]; then
    printf "✅ RESULTADO FINAL: PASSOU — P2 AAA entregue e validado.\n"
  else
    printf "❌ RESULTADO FINAL: FALHOU — violações=%s\n" "$FAIL"
  fi
  hr
  return "$FAIL"
}

main
exit $?
