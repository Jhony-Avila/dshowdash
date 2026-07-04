#!/bin/bash
# scripts/koala-smoke-all.sh — RUNNER DE REGRESSÃO oficial do Koala Docs (consolidação 2026-07-04).
# Roda: (1) engine PHP determinístico (pricing/line-tx/admin-allow/integridade/R6),
#       (2) teste do gate de lockout do último admin (caminho que dá exit),
#       (3) health HTTP no origin (bypassa Cloudflare).
# Exit 0 = tudo PASS. Uso: bash scripts/koala-smoke-all.sh
set -uo pipefail
ROOT=/var/www/dshowdash
FAIL=0

echo "═══════════════════════════════════════════════════════"
echo "  KOALA SMOKE ALL — regressão"
echo "═══════════════════════════════════════════════════════"

php "$ROOT/scripts/koala-smoke-all.php" || FAIL=1

echo
echo "== admin-lockout (block path — espera 422) =="
OUT=$(php -r '$_SERVER["REQUEST_METHOD"]="CLI"; require "/var/www/dshowdash/api/koala/_init.php";
  $pdo=getConnection("DSHOWDASH");
  (new AuthKoalaService($pdo))->provisionAndGet(75,"jhony","jhony@dshow.com.br");
  (new UserAdminService($pdo))->updateRole(1,"seller");' 2>/dev/null)
if echo "$OUT" | grep -q 'VALIDATION_ERROR' && echo "$OUT" | grep -q 'administrador'; then
  echo "  [PASS] único admin -> 422 bloqueado"
else
  echo "  [FAIL] não bloqueou (out: $OUT)"; FAIL=1
fi

echo
echo "== health HTTP (origin, bypassa CF) =="
check() {
  local code path exp
  path="$1"; exp="$2"
  code=$(curl -s -o /dev/null -w '%{http_code}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br$path")
  if [ "$code" = "$exp" ]; then echo "  [PASS] $path = $code"; else echo "  [FAIL] $path = $code (esperado $exp)"; FAIL=1; fi
}
check "/" 200
check "/koala/" 200
check "/api/koala/users/me" 401

echo
echo "═══════════════════════════════════════════════════════"
if [ "$FAIL" = "0" ]; then echo "  RESULTADO GERAL: PASS"; else echo "  RESULTADO GERAL: FALHA"; fi
echo "═══════════════════════════════════════════════════════"
exit $FAIL
