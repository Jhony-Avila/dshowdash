#!/usr/bin/env bash
# gerar-bootstrap-bundle.sh — ROXO (CIMA), 27/11 (CACHE-MENU-P1 · BOOT-CRITICAL). Gera bootstrap-v2/dist/bootstrap.bundle.js A PARTIR DO FONTE (vite
# oficial, bootstrap-v2/vite.bundle.config.js) e aplica a tabela FIXA de imports do bundle servido (bootstrap-v2/servido/mapa-imports-dist.json:
# 28 caminhos '…/index.js' → '…/dist/*.bundle.js', extraídos de servido × reconstruído na P149). Prova: P149 + tabela = servido byte a byte.
# Uso: gerar-bootstrap-bundle.sh <raiz-do-repo> <saida.js>   (NODE_MODULES_DE=<public/react/node_modules> se a raiz não tiver)
set -euo pipefail
RAIZ=$(cd "$1" && pwd); SAIDA=$2; TMP=$(mktemp -d)
mkdir -p "$TMP/public"; ( cd "$RAIZ/public" && tar --exclude='./react/node_modules' --exclude='./node_modules' -cf - . ) | ( cd "$TMP/public" && tar -xf - )
NM=${NODE_MODULES_DE:-$RAIZ/public/react/node_modules}; ln -s "$NM" "$TMP/public/react/node_modules"
( cd "$TMP/public" && VITE_BOOTSTRAP_ROOT="$TMP/public" react/node_modules/.bin/vite build --config bootstrap-v2/vite.bundle.config.js > "$TMP/vite.log" 2>&1 ) || { tail -5 "$TMP/vite.log"; exit 3; }
node -e '
const fs=require("fs"); const [arq, mapa, saida]=process.argv.slice(1); let s=fs.readFileSync(arq,"utf8"); const m=JSON.parse(fs.readFileSync(mapa,"utf8")); let n=0;
for (const [de, para] of Object.entries(m)) { const a="\""+de+"\"", b="\""+para+"\""; n+=s.split(a).length-1; s=s.split(a).join(b); }
fs.writeFileSync(saida,s); console.error("imports reescritos: "+n);' "$TMP/public/bootstrap-v2/dist/bootstrap.bundle.js" "$RAIZ/public/bootstrap-v2/servido/mapa-imports-dist.json" "$SAIDA"
rm "$TMP/public/react/node_modules"; mv "$TMP" "/backup/roxo/bootstrap-build-$(date +%H%M%S)"
echo "bootstrap.bundle.js gerado: $SAIDA ($(sha256sum "$SAIDA" | cut -c1-16))"
