#!/usr/bin/env bash
# DSHOW-105 (DIREITA, 23/11): empacota conferencia-lote.test.ts com o esbuild que já vem com o Vite (node_modules do worktree) e roda no Node.
# Molde do front-puras.sh. Saída temporária fora do repo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/conferencia-lote.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/conferencia-lote.mjs"
node "$SAIDA/conferencia-lote.mjs"
