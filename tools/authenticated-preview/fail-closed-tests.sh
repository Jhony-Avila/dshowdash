#!/usr/bin/env bash
# fail-closed-tests.sh — prova que auditoria-auth.mjs ABORTA (exit!=0) em cada condicao insegura,
# ANTES de qualquer navegacao/auth. Nao usa storage-state real nem rede.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
AUD="$DIR/auditoria-auth.mjs"
CHROME="${CHROME_PATH:-/nao/existe/chrome}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
run() { # nome ; exit-esperado(!=0) ; env...
  local nome="$1"; shift
  ( env "$@" node "$AUD" >/dev/null 2>&1 ); local rc=$?
  if [ "$rc" -ne 0 ]; then echo "PASS  $nome (exit=$rc)"; PASS=$((PASS+1)); else echo "FAIL  $nome (exit=0, deveria abortar)"; FAIL=$((FAIL+1)); fi
}

# storage bom (perm 600) e config boa, para isolar cada falha
GOODSTATE="$TMP/state.json"; printf '{"cookies":[{"name":"s","value":"x","domain":"dshowdash.com.br","expires":%d}]}' "$(( $(date +%s) + 999999 ))" > "$GOODSTATE"; chmod 600 "$GOODSTATE"
GOODCFG="$TMP/cfg.json"; cat > "$GOODCFG" <<J
{"candidate":{"expectedSha":"c6318ccab12dd0d6f3425c5ab50c07879e2bdc72","expectedTree":"c2116dc0a5ff09f3d9a9c09e4b492822b81c6ade"},"allowlist":["dshowdash.com.br","127.0.0.1","localhost"],"scope":"full","avatarRoute":"/","avatarTriggers":["x"],"shell":{"main":["main"]},"viewports":["390x844"]}
J

# 1) AUDIT_CONFIG ausente
run "config-ausente"          AUDIT_CONFIG="$TMP/nao-existe.json" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$GOODSTATE" CHROME_PATH="$CHROME"
# 2) AUDIT_CONFIG json invalido
echo "{ nao json" > "$TMP/bad.json"
run "config-json-invalido"    AUDIT_CONFIG="$TMP/bad.json" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$GOODSTATE" CHROME_PATH="$CHROME"
# 3) expectedSha ausente no config
echo '{"allowlist":["dshowdash.com.br"],"shell":{"main":["main"]}}' > "$TMP/nosha.json"
run "sha-ausente"             AUDIT_CONFIG="$TMP/nosha.json" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$GOODSTATE" CHROME_PATH="$CHROME"
# 4) BASE_URL fora da allowlist
run "base-fora-allowlist"     AUDIT_CONFIG="$GOODCFG" BASE_URL="https://evil.example.com" STORAGE_STATE="$GOODSTATE" CHROME_PATH="$CHROME"
# 5) STORAGE_STATE ausente
run "storage-ausente"         AUDIT_CONFIG="$GOODCFG" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$TMP/nao.json" CHROME_PATH="$CHROME"
# 6) STORAGE_STATE permissao insegura (644)
BADPERM="$TMP/bad-perm.json"; cp "$GOODSTATE" "$BADPERM"; chmod 644 "$BADPERM"
run "storage-perm-insegura"   AUDIT_CONFIG="$GOODCFG" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$BADPERM" CHROME_PATH="$CHROME"
# 7) STORAGE_STATE vazio
EMPTY="$TMP/empty.json"; printf '{}' > "$EMPTY"; chmod 600 "$EMPTY"
run "storage-cookies-vazio"   AUDIT_CONFIG="$GOODCFG" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$EMPTY" CHROME_PATH="$CHROME"
# 8) cookies expirados
EXP="$TMP/exp.json"; printf '{"cookies":[{"name":"s","value":"x","domain":"dshowdash.com.br","expires":1000}]}' > "$EXP"; chmod 600 "$EXP"
run "storage-expirado"        AUDIT_CONFIG="$GOODCFG" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$EXP" CHROME_PATH="$CHROME"
# 9) CHROME_PATH inexistente (com tudo o mais valido)
run "chrome-ausente"          AUDIT_CONFIG="$GOODCFG" BASE_URL="https://dshowdash.com.br" STORAGE_STATE="$GOODSTATE" CHROME_PATH="/nao/existe/chrome"
# 10) env obrigatoria ausente (BASE_URL)
run "base-ausente"            AUDIT_CONFIG="$GOODCFG" STORAGE_STATE="$GOODSTATE" CHROME_PATH="$CHROME"

echo ""; echo "FAIL_CLOSED_TESTS: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && echo "FAIL_CLOSED=OK" || echo "FAIL_CLOSED=QUEBRADO"
exit "$FAIL"
