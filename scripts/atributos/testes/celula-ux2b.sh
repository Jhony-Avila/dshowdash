#!/usr/bin/env bash
# UX-2b (DIREITA, 19/11): empacota celula-ux2b.test.ts com o esbuild que já vem com o Vite (node_modules do worktree) e roda no Node.
# Molde do front-puras.sh. Saída temporária fora do repo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/celula-ux2b.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/celula-ux2b.mjs"
node "$SAIDA/celula-ux2b.mjs"
