#!/usr/bin/env bash
# gerar-sidebar-bundle.sh — ROXO (CIMA), 27/11 (INTEGRADO-01 · item 8). Gera components/sidebar/dist/sidebar.bundle.js A PARTIR DO FONTE, preservando o
# comportamento SERVIDO: o modelo de RECUO da Sidebar (registry/items.manifest.ts) servido difere do fonte em 4 rotas (correções de 09/2026 que nunca
# rodaram: Bling, Google Ads, Google Drive, Pipedrive — as mesmas do B01). A cópia servida (registry/servido/items.manifest.ts.servido) entra SÓ neste build.
# Uso: gerar-sidebar-bundle.sh <raiz-do-repo-com-node_modules-em-public/react> <saida.js>
set -euo pipefail
RAIZ=$(cd "$1" && pwd); SAIDA=$2; TMP=$(mktemp -d)
mkdir -p "$TMP/public"; ( cd "$RAIZ/public" && tar --exclude='./react/node_modules' --exclude='./node_modules' -cf - . ) | ( cd "$TMP/public" && tar -xf - )
NM=${NODE_MODULES_DE:-$RAIZ/public/react/node_modules}; ln -s "$NM" "$TMP/public/react/node_modules"
cp "$RAIZ/public/components/sidebar/registry/servido/items.manifest.ts.servido" "$TMP/public/components/sidebar/registry/items.manifest.ts"
cp "$RAIZ/public/components/sidebar/registry/servido/items.manifest.js.servido" "$TMP/public/components/sidebar/registry/items.manifest.js"
( cd "$TMP/public" && VITE_COMPONENTS_ROOT="$TMP/public" COMPONENT=sidebar react/node_modules/.bin/vite build --config components/vite.components.config.js > "$TMP/vite.log" 2>&1 ) || { tail -5 "$TMP/vite.log"; exit 3; }
cp "$TMP/public/components/sidebar/dist/sidebar.bundle.js" "$SAIDA"; rm "$TMP/public/react/node_modules"; mv "$TMP" "/backup/roxo/sidebar-build-$(date +%H%M%S)"
echo "sidebar.bundle.js gerado: $SAIDA ($(sha256sum "$SAIDA" | cut -c1-16))"
