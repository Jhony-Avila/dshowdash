#!/usr/bin/env bash
# smoke.sh — teste de integração dos endpoints /api/traffic/* na origem (bypass Cloudflare).
# Uso: bash api/traffic/tests/smoke.sh   @version 1.0.0
set -uo pipefail
BASE="https://dshowdash.com.br"
R=(--resolve dshowdash.com.br:443:127.0.0.1 -sk)
fail=0
check() { # $1=nome $2=url $3=jq-ish grep
  local body; body=$(curl "${R[@]}" "$BASE$2")
  if echo "$body" | grep -q '"ok":true' && echo "$body" | grep -q "$3"; then
    echo "  ✓ $1"
  else
    echo "  ✗ $1 — resposta: $(echo "$body" | head -c 200)"; fail=1
  fi
}
echo "── smoke /api/traffic ──"
check "summary"        "/api/traffic/summary.php"              '"trafficIndex"'
check "dashboard"      "/api/traffic/dashboard.php"            '"summary"'
check "flow"           "/api/traffic/flow.php"                 '"flow"'
check "incidents"      "/api/traffic/incidents.php"            '"incidents"'
check "incidents+filtro" "/api/traffic/incidents.php?type=accident" '"counts"'
check "health"         "/api/traffic/health.php"               '"providerHealth"'
# cache: 2ª chamada deve ser HIT
xc=$(curl "${R[@]}" -D - "$BASE/api/traffic/summary.php" -o /dev/null 2>/dev/null | grep -i x-cache | tail -1)
echo "  · $xc"
echo ""
[ "$fail" -eq 0 ] && echo "✓ SMOKE OK" || echo "✗ SMOKE FALHOU"
exit $fail
