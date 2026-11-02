#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P10_3_AAA_$(date +%Y%m%d_%H%M%S).log}"
PANEL_DIR="$ROOT/public/components/panels/panel-observability"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P10.3 AAA — Observabilidade\n"
  hr

  sec "Estrutura"
  [ -d "$PANEL_DIR" ] && ok "panel-observability existe" || bad "panel-observability AUSENTE"
  [ -f "$PANEL_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"
  [ -f "$PANEL_DIR/manifest.json" ] && ok "manifest.json existe" || bad "manifest.json AUSENTE"

  sec "Sintaxe"
  node --check "$PANEL_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js ERRO"

  sec "Funcionalidades"
  grep -q "action:accepted" "$PANEL_DIR/index.js" && ok "Escuta action:accepted" || bad "Não escuta action:accepted"
  grep -q "action:rejected" "$PANEL_DIR/index.js" && ok "Escuta action:rejected" || bad "Não escuta action:rejected"
  grep -q "action:error" "$PANEL_DIR/index.js" && ok "Escuta action:error" || bad "Não escuta action:error"
  grep -q "replay:completed" "$PANEL_DIR/index.js" && ok "Escuta replay:completed" || bad "Não escuta replay:completed"
  grep -q "snapshot:saved" "$PANEL_DIR/index.js" && ok "Escuta snapshot:saved" || bad "Não escuta snapshot:saved"
  grep -q "observability:metrics" "$PANEL_DIR/index.js" && ok "Escuta observability:metrics" || bad "Não escuta observability:metrics"
  grep -q "observability:health" "$PANEL_DIR/index.js" && ok "Escuta observability:health" || bad "Não escuta observability:health"

  sec "Read-only"
  if grep -qE "RouterGlobal|location\.hash" "$PANEL_DIR/index.js" 2>/dev/null; then
    bad "Panel usa navegação (PROIBIDO)"
  else
    ok "Panel read-only"
  fi

  sec "Versão"
  grep -q "P10.3-AAA" "$PANEL_DIR/index.js" && ok "Versão P10.3-AAA" || bad "Versão ausente"

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P10.3 AAA PASSOU\n"; else printf "❌ P10.3 AAA FALHOU (erros: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1 || true
tail -n 80 "$OUT"
printf "LOG: %s\n" "$OUT"
return 0 2>/dev/null || true
true
