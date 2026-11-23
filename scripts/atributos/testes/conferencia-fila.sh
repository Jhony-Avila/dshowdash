#!/usr/bin/env bash
# CONFERÊNCIA V2 (ESQUERDA, 23/11): empacota conferencia-fila.test.ts com o esbuild do Vite (node_modules do worktree) e roda no Node. Molde do conferencia-lote.sh.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
case "$SAIDA" in /tmp/tmp.*) ;; *) echo "mktemp inesperado: $SAIDA"; exit 2 ;; esac
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/conferencia-fila.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/conferencia-fila.mjs"
node "$SAIDA/conferencia-fila.mjs"
