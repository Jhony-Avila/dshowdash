#!/bin/bash
# receita-release.sh — monta a árvore de release do Dash a partir de UM clone limpo (P1-01, Etapa 3).
# Uso: scripts/build/receita-release.sh <RAIZ do clone>   (rodar como usuário de build sem privilégio, env -i)
# Regras: nunca sobre /var/www/dshowdash; clone limpo; sem segredo; "o arquivo versionado vence"
# (depois dos builds, os arquivos rastreados são restaurados do Git — chunks antigos e manifestos ajustados).
set -euo pipefail
RAIZ="$(cd "${1:?uso: receita-release.sh <RAIZ>}" && pwd)"
[ "$RAIZ" != /var/www/dshowdash ] || { echo "recusado: a receita nunca roda na produção"; exit 2; }
[ -z "$(git -C "$RAIZ" status --porcelain --untracked-files=no)" ] || { echo "recusado: clone com arquivos rastreados alterados"; exit 2; }
NI=(nice -n 19 ionice -c3); VITE="$RAIZ/public/react/node_modules/.bin/vite"
passo(){ echo "— $*"; }
passo "1 npm ci (raiz e public/react)"
(cd "$RAIZ" && "${NI[@]}" npm ci --no-audit --no-fund)
(cd "$RAIZ/public/react" && "${NI[@]}" npm ci --no-audit --no-fund)
passo "2 transpilação .ts → .js (esbuild 0.21.5, es2022, sem bundle)"
"${NI[@]}" node "$RAIZ/scripts/build/transpilar-ts.cjs" "$RAIZ"
passo "2b pares .ts/.js versionados em sincronia (o .js é o que o navegador carrega)"
"${NI[@]}" node "$RAIZ/scripts/build/conferir-pares-ts-js.cjs" "$RAIZ"
passo "3 painéis (vite.config.ts de cada um)"
for p in dashboard avatar-studio ads anuncios bling datatables google-analytics google-calendar mercadolivre metaads outlook pipedrive relogio-mundial; do
  (cd "$RAIZ/public/components/panels/panel-$p" && "${NI[@]}" npx --no-install vite build --logLevel warn)
done
passo "4 public/react"
(cd "$RAIZ/public/react" && "${NI[@]}" npx --no-install vite build --logLevel warn)
passo "5 componentes reproduzíveis (main, header) com VITE_COMPONENTS_ROOT do clone"
for c in main header; do
  (cd "$RAIZ/public/components" && VITE_COMPONENTS_ROOT="$RAIZ/public" COMPONENT=$c "${NI[@]}" "$VITE" build --config "$RAIZ/public/components/vite.components.config.js" --logLevel warn)
done
passo "6 o arquivo versionado vence: restaura os rastreados que o build apagou ou alterou"
git -C "$RAIZ" checkout -- .
[ -z "$(git -C "$RAIZ" status --porcelain --untracked-files=no)" ] || { echo "ERRO: rastreados ainda diferentes após restaurar"; exit 1; }
passo "7 conferências"
node --check "$RAIZ/public/components/main/dist/main.bundle.js"
echo "[OK] release montada em $RAIZ (bootstrap-v2 e os bundles do login: versionados sem receita; motor do avatar: receita própria)"
