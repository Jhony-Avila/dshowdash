#!/usr/bin/env bash
set -u

ROOT="/var/www/dshowdash"
DOMAIN_DIR="$ROOT/public/components/main/domain"
PORTS_DIR="$ROOT/public/components/main/ports"
ADAPTERS_DIR="$ROOT/public/components/main/adapters"
UI_DIR="$ROOT/public/components/main/ui/container-main"

_fail=0

_hr() { printf "\n================================================================================\n"; }
_ok() { printf "✅ %s\n" "$1"; }
_bad() { printf "❌ %s\n" "$1"; _fail=$((_fail+1)); }

_require_file() { if [ -f "$1" ]; then _ok "Arquivo existe: $(basename "$1")"; else _bad "Arquivo AUSENTE: $1"; fi; }
_require_dir() { if [ -d "$1" ]; then _ok "Diretório existe: $1"; else _bad "Diretório AUSENTE: $1"; fi; }

_hr
printf "CONTAINER P1 AAA VALIDATOR\n"
printf "Root: %s\n" "$ROOT"
_hr

# 1) ContainerPort existe
printf "1) CONTAINER PORT\n\n"
CP="$PORTS_DIR/ContainerPort.js"
_require_file "$CP"

# 2) ContainerAdapter existe (em adapters/container/)
_hr
printf "2) CONTAINER ADAPTER\n\n"
CA_DIR="$ADAPTERS_DIR/container"
CA="$CA_DIR/adapter.js"
_require_dir "$CA_DIR"
_require_file "$CA"

# 3) Domain controllers existem
_hr
printf "3) DOMAIN CONTROLLERS\n\n"
_require_file "$DOMAIN_DIR/multi-container-orchestrator.js"
_require_file "$DOMAIN_DIR/panel-lifecycle-controller.js"
_require_file "$DOMAIN_DIR/orchestrator-controller.js"
_require_file "$DOMAIN_DIR/layout-controller.js"

# 4) ContainerPort/Adapter APIs básicas (verifica em ambos)
_hr
printf "4) CONTAINER APIs — Port ou Adapter\n\n"
for method in "getContainer" "getOrCreate" "get" "list" "destroy"; do
  if grep -qE "$method\s*[=(]" "$CP" 2>/dev/null; then
    _ok "ContainerPort expõe: $method"
  elif grep -RqE "$method\s*[=(]" "$CA_DIR" 2>/dev/null; then
    _ok "ContainerAdapter expõe: $method"
  else
    _bad "Container NÃO expõe método: $method"
  fi
done

# 5) ContainerAdapter APIs P2
_hr
printf "5) CONTAINER ADAPTER — APIs P2\n\n"
ca_methods="$(grep -RIn --include="*.js" -E "setDock|getDock|setLayoutPolicy|getLayoutPolicy|snapshot|restore|activate|deactivate|bringToFront|setPolicy|getPolicy" "$CA_DIR" 2>/dev/null | head -5 || true)"
if [ -n "$ca_methods" ]; then
  _ok "ContainerAdapter contém APIs P2"
else
  _bad "ContainerAdapter não contém APIs P2"
fi

# 6) Eventos CONTAINER_EVENTS
_hr
printf "6) EVENTOS — CONTAINER_EVENTS\n\n"
ev_hits="$(grep -RIn --include="*.js" -E "CONTAINER_EVENTS\." "$DOMAIN_DIR" 2>/dev/null | head -5 || true)"
if [ -n "$ev_hits" ]; then
  _ok "Domain emite CONTAINER_EVENTS"
else
  _bad "Domain não emite CONTAINER_EVENTS"
fi

# 7) UI container-main
_hr
printf "7) UI CONTAINER-MAIN\n\n"
_require_dir "$UI_DIR"
_require_file "$UI_DIR/template.js"
_require_dir "$UI_DIR/styles"

STYLES_DIR="$UI_DIR/styles"
for css in "_base.css" "_states.css" "_variants.css" "_responsive.css"; do
  if [ -f "$STYLES_DIR/$css" ]; then
    _ok "CSS existe: $css"
  else
    _bad "CSS ausente: $css"
  fi
done

# 8) Anti-regressão: Domain não gera HTML
_hr
printf "8) ANTI-REGRESSÃO — Domain não gera HTML\n\n"
html_hits="$(grep -RIn --include="*.js" -E "createElement|innerHTML" "$DOMAIN_DIR" 2>/dev/null | grep -v "// " | head -5 || true)"
if [ -z "$html_hits" ]; then
  _ok "Domain não gera HTML diretamente"
else
  _bad "Domain gera HTML (violação)"
  printf "%s\n" "$html_hits" | sed 's/^/   • /'
fi

_hr
printf "RESULTADO\n"
_hr
if [ "$_fail" -eq 0 ]; then
  printf "✅ PASSOU — Container P1 AAA OK\n"
  exit 0
else
  printf "❌ FALHOU — total de violações: %s\n" "$_fail"
  exit 1
fi
