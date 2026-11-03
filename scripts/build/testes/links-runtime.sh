#!/usr/bin/env bash
# Corte (Etapa 9): links simbólicos de RUNTIME que existem na produção e precisam estar na release (o montador não os cria).
#   public/api                         -> ../api     (a raiz servida é public/; na produção era absoluto -> /var/www/dshowdash/api)
#   api/modules/panels/painel-12       -> panel-12   (o painel 12 chama /api/modules/panels/painel-12/api.php — config.json do painel)
#   api/telemetry/collect.php          -> existe (alvo index.php; absoluto até a 2c, relativo depois)
# Uso: links-runtime.sh [--ref <commit>]   (padrão HEAD). Autoteste: --ref main-candidato (d9f9accf) tem de REPROVAR.
set -uo pipefail
cd "$(dirname "$0")/../../.."
REF=HEAD; [ "${1:-}" = --ref ] && REF="${2:?ref}"
F=0
alvo(){ git ls-tree "$REF" -- "$1" | awk '$1=="120000"{print $3}' | xargs -r git cat-file -p; }
for par in "public/api|../api" "api/modules/panels/painel-12|panel-12" "api/telemetry/collect.php|*"; do
  p=${par%%|*}; esp=${par#*|}; t=$(alvo "$p")
  if [ -z "$t" ]; then echo "[ERRO] $REF: link de runtime ausente: $p"; F=1
  elif [ "$esp" != "*" ] && [ "$t" != "$esp" ]; then echo "[ERRO] $REF: $p -> $t (esperado $esp)"; F=1
  else echo "[OK]   $REF: $p -> $t"; fi
done
exit $F
