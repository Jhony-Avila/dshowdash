#!/usr/bin/env bash
# scripts/header/build-mobile-header-v2.sh — transpila a FONTE TS do módulo standalone
# components/header/mobile-v2 para o irmão index.js shipado (1:1, sem minify, auditável).
# Uso (da raiz do repo ou de qualquer worktree): bash scripts/header/build-mobile-header-v2.sh
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$RAIZ/public/components/header/mobile-v2/index.ts"
OUT="$RAIZ/public/components/header/mobile-v2/index.js"
ESBUILD=""
for c in "$RAIZ/node_modules/.bin/esbuild" "$RAIZ/public/react/node_modules/.bin/esbuild" "/var/www/dshowdash/node_modules/.bin/esbuild"; do
  [ -x "$c" ] && ESBUILD="$c" && break
done
[ -n "$ESBUILD" ] || { echo "esbuild não encontrado" >&2; exit 2; }
"$ESBUILD" "$SRC" --format=esm --target=es2020 --outfile="$OUT" --log-level=warning --legal-comments=inline
node --check "$OUT"
echo "BUILD_MH2_OK $(sha256sum "$OUT" | cut -c1-16) $OUT"
