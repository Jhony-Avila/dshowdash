#!/usr/bin/env bash
# scripts/shell/build-profile-redirect.sh — transpila a FONTE TS do shim components/router/profile-redirect
# para o irmão index.js shipado (1:1, sem minify, auditável). Nunca editar o .js à mão.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$RAIZ/public/components/router/profile-redirect/index.ts"
OUT="$RAIZ/public/components/router/profile-redirect/index.js"
ESBUILD=""
for c in "$RAIZ/node_modules/.bin/esbuild" "$RAIZ/public/react/node_modules/.bin/esbuild" "/var/www/dshowdash/public/react/node_modules/.bin/esbuild" "/var/www/dshowdash/node_modules/.bin/esbuild"; do
  [ -x "$c" ] && ESBUILD="$c" && break
done
[ -n "$ESBUILD" ] || { echo "esbuild não encontrado" >&2; exit 2; }
"$ESBUILD" "$SRC" --format=esm --target=es2020 --outfile="$OUT" --log-level=warning --legal-comments=inline
node --check "$OUT"
echo "BUILD_PROFILE_REDIRECT_OK $(sha256sum "$OUT" | cut -c1-16) $OUT"
