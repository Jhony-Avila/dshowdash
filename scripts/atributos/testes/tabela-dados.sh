#!/usr/bin/env bash
# TabelaDados (18/11): empacota tabela-dados.test.ts com o esbuild que já vem com o Vite (node_modules do worktree) e roda no Node.
# Molde do front-puras.sh. Saída temporária fora do repo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
SAIDA="$(mktemp -d)"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/tabela-dados.test.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$SAIDA/tabela-dados.mjs"
node "$SAIDA/tabela-dados.mjs"
# compat da linha expansível (§31.4): renderiza a TabelaDados no servidor (react-dom/server); o .css importado vira vazio
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/tabela-dados-compat.test.tsx" --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --log-level=warning --outfile="$SAIDA/tabela-dados-compat.cjs"
node "$SAIDA/tabela-dados-compat.cjs"
