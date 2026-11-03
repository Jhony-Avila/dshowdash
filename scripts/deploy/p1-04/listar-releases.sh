#!/usr/bin/env bash
# listar-releases.sh — CANDIDATO P1-04. Retenção SEM apagar: só lista e sugere.
# Mover uma release antiga = decisão humana: mv -n <release> /backup/_restrito/<ts>-releases-dash/
set -euo pipefail
BASE="${PUB_BASE:-/srv/dshow-releases/dash}"; RELS="${BASE}/releases"
ATUAL="$(readlink -f "${PUB_SERVIDO:-/var/www/dshowdash}" 2>/dev/null || echo -)"
printf '%-60s %8s %s\n' RELEASE TAMANHO ESTADO
for r in "${RELS}"/*/; do
  r="${r%/}"; [ -d "$r" ] || continue
  e="-"; [ "$r" = "${ATUAL}" ] && e="ATUAL"
  printf '%-60s %8s %s\n' "${r##*/}" "$(du -sh "$r" 2>/dev/null | cut -f1)" "$e"
done
echo "sugestão: manter as 5 mais recentes + a ATUAL; mover as demais para /backup/_restrito/ (manual)."
