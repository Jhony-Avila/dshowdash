# scripts/deploy/lock-publicacao.sh — LOCK ÚNICO DE PUBLICAÇÃO (P1-04a, Fase 1 · Etapa 5, 02/11/2026). Para `source`.
# TODOS os publicadores do servidor usam O MESMO arquivo e O MESMO protocolo:
#   Dash: deploy-as5.sh, auto-deploy-runner.sh, p1-04/publicar-sha.sh, p1-04/runner-sha.sh;
#   APP DSHOW: scripts/deploy.sh e scripts/ops/_entrega-base.sh (cópia idêntica: scripts/ops/_lock-publicacao.sh);
#   validação: /srv/dshow-validacao/bin/publicar-validacao.sh.
# Protocolo: flock NÃO bloqueante no fd 8 de /run/dshow-publicacao.lock (/run: só root escreve — /run/lock e /tmp são
# graváveis por todos e permitiriam a um usuário local segurar o lock). Aberto SEM truncar (quem perde não apaga a
# identificação de quem segura). Reentrante para o MESMO dono: o fd 8 é herdado (runner → deploy-as5) e o dono é
# exportado em DSHOW_PUB_LOCK_DONO. Ocupado → mensagem com o dono atual e saída 75 (EX_TEMPFAIL), sem tocar em nada.
# DSHOW_PUB_LOCK_RETORNAR=1 → ocupado devolve 75 (em vez de sair), para quem precisa registrar e manter o pedido.
# Ensaio: DSHOW_PUB_ENSAIO_LOCK=<segundos> [DSHOW_PUB_ENSAIO_LOCK_EM=<quem>] → com o lock (obtido ou herdado), o
# publicador escolhido (padrão: qualquer um) espera e sai 0 ANTES de qualquer ação. Só para ensaio.
DSHOW_PUB_LOCK="${DSHOW_PUB_LOCK:-/run/dshow-publicacao.lock}"
dshow_pub_lock() {
  local quem="${1:?quem}"
  if [ -n "${DSHOW_PUB_LOCK_DONO:-}" ] && [ -e "/proc/$$/fd/8" ] && [ "/proc/$$/fd/8" -ef "$DSHOW_PUB_LOCK" ]; then
    echo "lock de publicação herdado de ${DSHOW_PUB_LOCK_DONO} (${quem})"; _dshow_pub_ensaio "$quem"; return 0
  fi
  case "$(dirname "$DSHOW_PUB_LOCK")" in /run|/run/*) ;; *) echo "recusado: o lock de publicação tem de ficar em /run" >&2; exit 2;; esac
  [ -L "$DSHOW_PUB_LOCK" ] && { echo "recusado: o lock de publicação é um symlink" >&2; exit 2; }
  (umask 077; : >> "$DSHOW_PUB_LOCK")
  exec 8>>"$DSHOW_PUB_LOCK"
  if ! flock -n 8; then
    echo "❌ outra publicação em andamento — $(tr -d '\n' < "$DSHOW_PUB_LOCK" | head -c 300)" >&2
    if [ -n "${DSHOW_PUB_LOCK_RETORNAR:-}" ]; then exec 8>&-; return 75; fi
    exit 75
  fi
  : > "$DSHOW_PUB_LOCK"; printf '%s pid=%s desde=%s\n' "$quem" "$$" "$(date -Is)" >&8
  export DSHOW_PUB_LOCK_DONO="$quem"
  echo "lock de publicação obtido por ${quem}"
  _dshow_pub_ensaio "$quem"
}
_dshow_pub_ensaio() {
  [ -n "${DSHOW_PUB_ENSAIO_LOCK:-}" ] || return 0
  case "${DSHOW_PUB_ENSAIO_LOCK_EM:-$1}" in "$1") ;; *) return 0;; esac
  echo "ENSAIO_LOCK $1 com o lock em $(date +%T.%N | cut -c1-12)"; sleep "${DSHOW_PUB_ENSAIO_LOCK}"; exit 0
}
