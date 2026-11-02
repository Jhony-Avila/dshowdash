#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P10_4_AAA_$(date +%Y%m%d_%H%M%S).log}"
OBS_DIR="$ROOT/public/components/main/domain/observability"
PANEL_DIR="$ROOT/public/components/panels/panel-observability"
MAIN_ENGINE="$ROOT/public/components/main/domain/main-engine.js"
MAIN_INDEX="$ROOT/public/components/main/index.js"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P10.4 AAA — Observability Core (+ HOTFIX DI)\n"
  hr

  sec "Estrutura Domain"
  [ -d "$OBS_DIR" ] && ok "domain/observability existe" || bad "domain/observability AUSENTE"
  [ -f "$OBS_DIR/observability-controller.js" ] && ok "observability-controller.js existe" || bad "observability-controller.js AUSENTE"
  [ -f "$OBS_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

  sec "Sintaxe"
  node --check "$OBS_DIR/observability-controller.js" 2>/dev/null && ok "controller sintaxe OK" || bad "controller ERRO sintaxe"
  node --check "$OBS_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js ERRO sintaxe"

  sec "Handshake - Escuta requests"
  grep -q "observability:metrics-request" "$OBS_DIR/observability-controller.js" && ok "Escuta metrics-request" || bad "Não escuta metrics-request"
  grep -q "observability:health-request" "$OBS_DIR/observability-controller.js" && ok "Escuta health-request" || bad "Não escuta health-request"

  sec "Handshake - Emite responses"
  grep -q "observability:metrics" "$OBS_DIR/observability-controller.js" && ok "Emite metrics" || bad "Não emite metrics"
  grep -q "observability:health" "$OBS_DIR/observability-controller.js" && ok "Emite health" || bad "Não emite health"

  sec "AAA - Domain sem DOM/Router"
  if grep -qE "document\.|window\.|globalThis\.|RouterGlobal|location\.hash|querySelector|createElement|innerHTML" "$OBS_DIR"/*.js 2>/dev/null; then
    bad "Domain toca DOM/Router (PROIBIDO)"
  else
    ok "Domain sem DOM/Router"
  fi

  sec "AAA - Domain sem TIMERS"
  if grep -qE "setTimeout|setInterval" "$OBS_DIR"/*.js 2>/dev/null; then
    bad "Domain usa TIMERS (PROIBIDO)"
  else
    ok "Domain sem timers"
  fi

  sec "HOTFIX DI - setModule/setActionHub"
  grep -q "setModule" "$OBS_DIR/observability-controller.js" && ok "Controller tem setModule()" || bad "Controller sem setModule()"
  grep -q "setActionHub" "$MAIN_ENGINE" 2>/dev/null && ok "MainEngine tem setActionHub()" || bad "MainEngine sem setActionHub()"
  grep -q "setActionHub" "$MAIN_INDEX" 2>/dev/null && ok "main/index.js chama setActionHub()" || bad "main/index.js não chama setActionHub()"

  sec "Panel read-only"
  if [ -d "$PANEL_DIR" ]; then
    if grep -qE "RouterGlobal|location\.hash" "$PANEL_DIR/index.js" 2>/dev/null; then
      bad "Panel usa navegação (PROIBIDO)"
    else
      ok "Panel read-only"
    fi
  else
    bad "Panel não existe"
  fi

  sec "Versão"
  grep -q "P10.4" "$OBS_DIR/index.js" && ok "Versão P10.4" || bad "Versão P10.4 ausente"

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P10.4 AAA PASSOU\n"; else printf "❌ P10.4 AAA FALHOU (erros: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1
tail -n 100 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
