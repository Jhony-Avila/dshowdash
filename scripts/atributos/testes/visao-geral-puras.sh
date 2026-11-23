#!/usr/bin/env bash
# Visão geral V2 (ESQUERDA, 19/11): empacota visao-geral-puras.test.ts com o esbuild do Vite (node_modules do worktree) e roda no Node.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/visao-geral-puras.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/visao-geral-puras.mjs"
node "$SAIDA/visao-geral-puras.mjs"
