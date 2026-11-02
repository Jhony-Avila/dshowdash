#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P10_consolidated_$(date +%Y%m%d_%H%M%S).log}"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

run_sub(){ 
  local name="$1" script="$2"
  if [ -x "$script" ]; then
    AAA_STRICT=1 "$script" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      ok "$name PASSOU"
    else
      bad "$name FALHOU"
    fi
  else
    bad "$name não encontrado"
  fi
}

main() {
  hr
  printf "VALIDAÇÃO P10 AAA CONSOLIDADA (com P10.4)\n"
  hr

  run_sub "P10.1 (UI Auditoria)" "$ROOT/tools/validate_P10_AAA_delivery.sh"
  run_sub "P10.2 (Persistência)" "$ROOT/tools/validate_P10_2_AAA_delivery.sh"
  run_sub "P10.3 (Observabilidade UI)" "$ROOT/tools/validate_P10_3_AAA_delivery.sh"
  run_sub "P10.4 (Observability Core)" "$ROOT/tools/validate_P10_4_AAA_delivery.sh"

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P10 AAA COMPLETO (todas subfases)\n"; else printf "❌ P10 AAA INCOMPLETO (falhas: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1
tail -n 60 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
