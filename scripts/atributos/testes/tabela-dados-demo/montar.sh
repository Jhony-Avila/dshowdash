#!/usr/bin/env bash
# Monta a página de demonstração (só teste) em <saída>: demo.js + demo.css + index.html. esbuild do Vite; sem dependência nova.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../../.." && pwd)"
SAIDA="${1:?uso: montar.sh <pasta de saída>}"
mkdir -p "$SAIDA"
"$RAIZ/node_modules/.bin/esbuild" "$RAIZ/scripts/atributos/testes/tabela-dados-demo/demo.tsx" --bundle --format=iife --jsx=automatic --log-level=warning \
  --define:process.env.NODE_ENV='"production"' --outfile="$SAIDA/demo.js"
cat > "$SAIDA/index.html" <<'HTML'
<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><title>TabelaDados demo</title><link rel="stylesheet" href="demo.css"></head>
<body class="theme-light" style="margin:0"><div id="raiz"></div><script src="demo.js"></script></body></html>
HTML
echo "DEMO_OK $SAIDA"
