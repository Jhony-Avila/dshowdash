#!/usr/bin/env bash
# Empacota ficha-v3-puras.test.ts com o esbuild que já vem com o Vite (node_modules do worktree) e roda no Node. Saída temporária fora do repo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/ficha-v3-puras.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/ficha-v3-puras.mjs"
node "$SAIDA/ficha-v3-puras.mjs"
