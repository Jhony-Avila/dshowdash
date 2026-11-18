#!/usr/bin/env bash
# Empacota front-puras.test.ts com o esbuild que já vem com o Vite (node_modules do worktree) e roda no Node. Saída temporária fora do repo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/front-puras.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/front-puras.mjs"
node "$SAIDA/front-puras.mjs"
