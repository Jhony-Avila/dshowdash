#!/usr/bin/env bash
# koala-build.sh — build do app React+Vite do Koala Docs.
# Opção A (aprovada): build PRÓPRIO, rebuild-all.sh INTOCADO.
# Reusa o toolchain de public/react/node_modules (vite+plugin-react+react) via symlink local
# — nada é instalado (sem npm install / sem rede). @created 2026-07-03
set -euo pipefail

ROOT="/var/www/dshowdash"
APP="$ROOT/public/koala"
SHARED_NM="$ROOT/public/react/node_modules"
VITE="$SHARED_NM/.bin/vite"

[ -d "$APP" ]  || { echo "ERRO: $APP nao existe (crie o app React primeiro)"; exit 1; }
[ -x "$VITE" ] || { echo "ERRO: vite nao encontrado em $VITE"; exit 1; }

# Reusa o node_modules do app react/ (mesma stack) via symlink local. find do check-all
# ignora */node_modules/*, e find nao segue symlink por padrao — seguro.
if [ ! -e "$APP/node_modules" ]; then
  ln -s ../react/node_modules "$APP/node_modules"
  echo "symlink criado: public/koala/node_modules -> ../react/node_modules"
fi

cd "$APP"
echo "==> vite build (base=/koala/) ..."
"$VITE" build
echo "==> OK: build gerado em public/koala/dist/"
