#!/usr/bin/env bash
# rollback.sh — CANDIDATO P1-04 (NÃO INSTALADO, NÃO EXECUTADO)
# Volta o symlink servido para uma release já existente (nada é apagado nem reconstruído).
# Uso: rollback.sh [<dir-da-release> | --anterior] [--dry-run | --aplicar]   (padrão: --anterior --dry-run)
set -euo pipefail
ALVO="${1:---anterior}"; MODO="${2:---dry-run}"
BASE="${PUB_BASE:-/srv/dshow-releases/dash}"; RELS="${BASE}/releases"; HIST="${BASE}/historico.log"
SERVIDO="${PUB_SERVIDO:-/var/www/dshowdash}"
DRY=1; [ "${MODO}" = "--aplicar" ] && DRY=0
run() { if [ "${DRY}" -eq 1 ]; then printf '[dry-run] %s\n' "$*"; else "$@"; fi; }
[ "$(id -u)" -eq 0 ] || { echo "precisa de root"; exit 2; }
umask 077
# LOCK ÚNICO DE PUBLICAÇÃO (P1-04a, Etapa 5): biblioteca ao lado (no repositório: ../lock-publicacao.sh; instalado:
# /usr/local/lib/dshow/lock-publicacao.sh). Sem ela, recusa (falha fechada).
for _l in "${DSHOW_PUB_LOCK_LIB:-}" "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lock-publicacao.sh" /usr/local/lib/dshow/lock-publicacao.sh; do
  [ -n "${_l}" ] && [ -f "${_l}" ] && { source "${_l}"; break; }
done
declare -F dshow_pub_lock >/dev/null || { echo "recusado: lock-publicacao.sh não encontrado"; exit 2; }
dshow_pub_lock rollback-dash
ATUAL="$(readlink -f "${SERVIDO}")"
if [ "${ALVO}" = "--anterior" ]; then
  # última linha OK cuja release ≠ atual (coluna 4 = release publicada)
  ALVO="$(awk -F'\t' -v a="${ATUAL}" '$2=="OK" && $4!=a {r=$4} END{print r}' "${HIST}" 2>/dev/null || true)"
fi
case "${ALVO}" in "${RELS}"/*) ;; *) echo "alvo fora de ${RELS}: '${ALVO}'"; exit 2;; esac
[ -d "${ALVO}" ] && [ -f "${ALVO}/RELEASE_SHA" ] || { echo "release inválida: ${ALVO}"; exit 2; }
echo "rollback: ${ATUAL} -> ${ALVO} (SHA $(cat "${ALVO}/RELEASE_SHA"))"
run ln -sfn "${ALVO}" "${SERVIDO}.novo"
run mv -T "${SERVIDO}.novo" "${SERVIDO}"
run systemctl reload php8.3-fpm
run nginx -s reload
for u in / /api/health; do
  if [ "${DRY}" -eq 0 ]; then
    c=$(curl -sS -o /dev/null -m 20 -w '%{http_code}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br${u}" || echo 000)
    echo "smoke ${u} = ${c}"
  else echo "[dry-run] smoke ${u}"; fi
done
run bash -c "printf '%s\tROLLBACK\t%s\t%s\t%s\n' '$(date '+%F %T')' '$(cat "${ALVO}/RELEASE_SHA")' '${ALVO}' '${ATUAL}' >> '${HIST}'"
echo "purge do Cloudflare: rodar publicar-sha.sh só na etapa 8 ou o purge manual do README"
