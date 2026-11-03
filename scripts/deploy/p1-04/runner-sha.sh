#!/usr/bin/env bash
# runner-sha.sh — CANDIDATO P1-04 (substitui /usr/local/bin/dshow-auto-deploy.sh; NÃO INSTALADO)
# Consome a fila do webhook e publica o SHA DO PEDIDO (não "o main do momento").
# Coalescência explícita: publica o pedido mais recente; os demais são MOVIDOS
# para fila/superados/ (nada é apagado). Interruptor: /etc/dshow-deploy/auto-deploy.off
# (root-only; o config/auto-deploy.off da árvore continua respeitado na transição).
set -u
FILA="${PUB_FILA:-/srv/dshow-shared/dash/storage/deploy-fila}"
OFF_ROOT=/etc/dshow-deploy/auto-deploy.off
OFF_ARVORE=/srv/dshow-shared/dash/config/auto-deploy.off
LOG=/backup/deploy-logs/auto-deploy.log
PUBLICAR=/usr/local/sbin/dshow-publicar-sha.sh
MODO="${1:---aplicar}"   # --dry-run para ensaio
[ -f "${OFF_ROOT}" ] && exit 0
[ -f "${OFF_ARVORE}" ] && exit 0
[ -d "${FILA}" ] || exit 0
umask 077
exec 9>/run/dshow-auto-deploy.lock
flock -n 9 || exit 0
# LOCK ÚNICO DE PUBLICAÇÃO (P1-04a, Etapa 5): biblioteca ao lado (no repositório: ../lock-publicacao.sh; instalado:
# /usr/local/lib/dshow/lock-publicacao.sh). Sem ela, recusa (falha fechada).
for _l in "${DSHOW_PUB_LOCK_LIB:-}" "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lock-publicacao.sh" /usr/local/lib/dshow/lock-publicacao.sh; do
  [ -n "${_l}" ] && [ -f "${_l}" ] && { source "${_l}"; break; }
done
declare -F dshow_pub_lock >/dev/null || { echo "recusado: lock-publicacao.sh não encontrado"; exit 2; }
DSHOW_PUB_LOCK_RETORNAR=1 dshow_pub_lock runner-sha >> "${LOG}" 2>&1 || { echo "[$(date '+%F %T')] lock de publicação ocupado — pedidos mantidos" >> "${LOG}"; exit 0; }
# pedido = arquivo pedido-<sha40> cujo conteúdo traz a linha repo=<owner/nome> gravada pelo webhook corrigido
ULTIMO="$(ls -1t "${FILA}"/pedido-* 2>/dev/null | head -1 || true)"
[ -n "${ULTIMO}" ] || exit 0
SHA="${ULTIMO##*/pedido-}"
[[ "${SHA}" =~ ^[0-9a-f]{40}$ ]] || { echo "[$(date '+%F %T')] pedido malformado: ${ULTIMO}" >> "${LOG}"; mkdir -p "${FILA}/invalidos"; mv -n "${ULTIMO}" "${FILA}/invalidos/"; exit 0; }
mkdir -p "${FILA}/superados" "${FILA}/processados"
for p in "${FILA}"/pedido-*; do [ "$p" = "${ULTIMO}" ] || mv -n "$p" "${FILA}/superados/"; done
mv -n "${ULTIMO}" "${FILA}/processados/"
echo "[$(date '+%F %T')] pedido sha=${SHA}" >> "${LOG}"
"${PUBLICAR}" "${SHA}" "${MODO}" >> "${LOG}" 2>&1
echo "[$(date '+%F %T')] publicar rc=$?" >> "${LOG}"
