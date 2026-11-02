#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P9_AAA_$(date +%Y%m%d_%H%M%S).log}"
AUDIT_DIR="$ROOT/public/components/main/domain/audit"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P9 AAA — Audit/Timeline/Replay\n"
  hr

  sec "Arquivos"
  [ -f "$AUDIT_DIR/audit-log.js" ] && ok "audit-log.js existe" || bad "audit-log.js AUSENTE"
  [ -f "$AUDIT_DIR/timeline-controller.js" ] && ok "timeline-controller.js existe" || bad "timeline-controller.js AUSENTE"
  [ -f "$AUDIT_DIR/replay-controller.js" ] && ok "replay-controller.js existe" || bad "replay-controller.js AUSENTE"
  [ -f "$AUDIT_DIR/index.js" ] && ok "index.js existe" || bad "index.js AUSENTE"

  sec "Sintaxe"
  node --check "$AUDIT_DIR/audit-log.js" 2>/dev/null && ok "audit-log.js OK" || bad "audit-log.js ERRO"
  node --check "$AUDIT_DIR/timeline-controller.js" 2>/dev/null && ok "timeline-controller.js OK" || bad "timeline-controller.js ERRO"
  node --check "$AUDIT_DIR/replay-controller.js" 2>/dev/null && ok "replay-controller.js OK" || bad "replay-controller.js ERRO"
  node --check "$AUDIT_DIR/index.js" 2>/dev/null && ok "index.js OK" || bad "index.js ERRO"

  sec "API"
  grep -q "record" "$AUDIT_DIR/audit-log.js" && ok "AuditLog.record()" || bad "AuditLog sem record()"
  grep -q "append" "$AUDIT_DIR/timeline-controller.js" && ok "Timeline.append()" || bad "Timeline sem append()"
  grep -q "replay" "$AUDIT_DIR/replay-controller.js" && ok "Replay.replay()" || bad "Replay sem replay()"
  grep -q "dryRun" "$AUDIT_DIR/replay-controller.js" && ok "Replay.dryRun" || bad "Replay sem dryRun"

  sec "AAA - Sem DOM/Router"
  if grep -qE "document\.|window\.|globalThis\.|RouterGlobal|location\.hash|querySelector|createElement|innerHTML" "$AUDIT_DIR"/*.js 2>/dev/null; then
    bad "Domain toca DOM/Router (PROIBIDO)"
  else
    ok "Domain sem DOM/Router"
  fi

  sec "AAA - Sem TIMERS (CRÍTICO)"
  if grep -qE "setTimeout|setInterval" "$AUDIT_DIR"/*.js 2>/dev/null; then
    bad "Domain usa TIMERS (PROIBIDO AAA)"
  else
    ok "Domain sem timers"
  fi

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P9 AAA PASSOU\n"; else printf "❌ P9 AAA FALHOU (erros: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1
tail -n 100 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
