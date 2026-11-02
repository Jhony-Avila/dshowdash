#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P10_AAA_$(date +%Y%m%d_%H%M%S).log}"
PANEL_DIR="$ROOT/public/components/panels/panel-audit-trail"
AUDIT_DIR="$ROOT/public/components/main/domain/audit"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P10.1 AAA — UI Auditoria\n"
  hr

  sec "Estrutura"
  [ -d "$PANEL_DIR" ] && ok "panel-audit-trail existe" || bad "panel-audit-trail AUSENTE"
  [ -d "$AUDIT_DIR" ] && ok "audit domain existe" || bad "audit domain AUSENTE"

  sec "Sintaxe"
  node --check "$PANEL_DIR/index.js" 2>/dev/null && ok "panel index.js OK" || bad "panel index.js ERRO"
  node --check "$AUDIT_DIR/index.js" 2>/dev/null && ok "audit index.js OK" || bad "audit index.js ERRO"

  sec "Handshake"
  grep -q "audit:dump-request" "$AUDIT_DIR/index.js" && ok "Domain escuta dump-request" || bad "Domain não escuta dump-request"
  grep -q "audit:dump" "$AUDIT_DIR/index.js" && ok "Domain emite dump" || bad "Domain não emite dump"
  grep -q "audit:dump-request" "$PANEL_DIR/index.js" && ok "Panel solicita dump" || bad "Panel não solicita dump"
  grep -q "audit:dump" "$PANEL_DIR/index.js" && ok "Panel escuta dump" || bad "Panel não escuta dump"

  sec "Eventos live"
  grep -q "audit:recorded" "$PANEL_DIR/index.js" && ok "Panel trata recorded" || bad "Panel não trata recorded"
  grep -q "replay:" "$PANEL_DIR/index.js" && ok "Panel trata replay:*" || bad "Panel não trata replay:*"

  sec "Read-only"
  if grep -qE "RouterGlobal|location\.hash" "$PANEL_DIR/index.js" 2>/dev/null; then
    bad "Panel usa navegação (PROIBIDO)"
  else
    ok "Panel read-only"
  fi

  sec "AAA - Domain sem DOM"
  if grep -qE "document\.|window\.|globalThis\.|RouterGlobal|location\.hash|querySelector|createElement|innerHTML" "$AUDIT_DIR"/*.js 2>/dev/null; then
    bad "Domain toca DOM (PROIBIDO)"
  else
    ok "Domain limpo"
  fi

  sec "AAA - Domain sem TIMERS (CRÍTICO)"
  if grep -qE "setTimeout|setInterval" "$AUDIT_DIR"/*.js 2>/dev/null; then
    bad "Domain usa TIMERS (PROIBIDO AAA)"
  else
    ok "Domain sem timers"
  fi

  sec "Versão"
  grep -q "P10" "$AUDIT_DIR/index.js" && ok "Audit P10" || bad "Audit sem P10"
  grep -q "P10" "$PANEL_DIR/index.js" && ok "Panel P10" || bad "Panel sem P10"

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P10 AAA PASSOU\n"; else printf "❌ P10 AAA FALHOU (erros: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1
tail -n 120 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
