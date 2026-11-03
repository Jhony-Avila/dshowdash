#!/usr/bin/env bash
# =====================================================================
# scripts/deploy/auto-deploy-runner.sh — RUNNER do AUTO-DEPLOY (decisão #47)
#
# O webhook (api/deploy/webhook.php) apenas ENFILEIRA pedidos; este runner
# — instalado como root em /usr/local/bin/dshow-auto-deploy.sh e disparado
# por /etc/cron.d/dshow-auto-deploy (1/min) — CONSOME a fila e roda o
# deploy blindado. flock garante 1 deploy por vez; log em /backup.
#
# INSTALAÇÃO (root, uma vez):
#   cp scripts/deploy/auto-deploy-runner.sh /usr/local/bin/dshow-auto-deploy.sh
#   chmod 755 /usr/local/bin/dshow-auto-deploy.sh
#   printf '* * * * * root /usr/local/bin/dshow-auto-deploy.sh\n' \
#     > /etc/cron.d/dshow-auto-deploy
# INTERRUPTOR: touch config/auto-deploy.off desliga · rm religa.
# =====================================================================
set -u
RAIZ="${RUNNER_RAIZ:-/var/www/dshowdash}"   # override só para ensaio
FILA="$RAIZ/storage/deploy-fila"
LOG="${RUNNER_LOG:-/backup/deploy-logs/auto-deploy.log}"
[ -f "$RAIZ/config/auto-deploy.off" ] && exit 0
[ -d "$FILA" ] || exit 0
PEDIDO=$(ls -1 "$FILA" 2>/dev/null | head -1)
[ -n "$PEDIDO" ] || exit 0
# lock em diretório RESTRITO A ROOT (não /tmp world-writable): impede que um
# usuário local não privilegiado segure o lock e bloqueie o deploy em silêncio,
# ou aponte um symlink p/ truncar arquivo de root (CWE-377/CWE-59). /run é
# tmpfs root:root 755; fallback /var/lock se /run não existir.
LOCK_DIR=/run; [ -d /run ] || LOCK_DIR=/var/lock
umask 077
exec 9>"$LOCK_DIR/dshow-auto-deploy.lock"
flock -n 9 || exit 0
# LOCK ÚNICO DE PUBLICAÇÃO (P1-04a, Etapa 5): obtido ANTES de consumir o pedido — ocupado → o pedido fica para o próximo
# minuto. O deploy-as5 chamado abaixo herda o fd 8 (reentrante, mesmo dono).
# shellcheck source=lock-publicacao.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lock-publicacao.sh"
DSHOW_PUB_LOCK_RETORNAR=1 dshow_pub_lock auto-deploy-runner >> "$LOG" 2>&1 || { echo "[$(date '+%F %T')] lock de publicação ocupado — pedido $PEDIDO mantido" >> "$LOG"; exit 0; }
echo "[$(date '+%F %T')] pedido=$PEDIDO" >> "$LOG"
rm -f "$FILA"/pedido-*
cd "$RAIZ" && bash scripts/deploy/deploy-as5.sh >> "$LOG" 2>&1
echo "[$(date '+%F %T')] deploy rc=$?" >> "$LOG"
