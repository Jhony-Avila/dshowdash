#!/usr/bin/env bash
# L02 · PROPOSTA AZUL 28/11 · roda no PORTÃO DA MIGRAÇÃO (executor: Jhony, root), depois do código no ar. NADA é apagado:
# os backups de sessão ANTIGOS (nome = id cru da sessão, sess_<id>.bak) são MOVIDOS para /backup; os novos (sess_h1_<sha256>.bak) ficam.
# Simulação por padrão; mover de verdade só com CONFIRMA="MOVER BACKUPS L02". Não lista nomes (o nome É o id): só contagens.
set -euo pipefail
ORIG=/var/lib/php/sessions/backup; DEST=/backup/dash/$(date +%Y%m%d-%H%M%S)-l02-backups-sessao
[ -d "$ORIG" ] || { echo "sem pasta de backup: nada a fazer"; exit 0; }
mapfile -t ANTIGOS < <(find "$ORIG" -maxdepth 1 -type f -name 'sess_*.bak' ! -name 'sess_h1_*.bak')
echo "backups antigos (id cru no nome): ${#ANTIGOS[@]} · novos (sess_h1_): $(find "$ORIG" -maxdepth 1 -type f -name 'sess_h1_*.bak' | wc -l)"
[ "${CONFIRMA:-}" = "MOVER BACKUPS L02" ] || { echo "SIMULAÇÃO (nada movido). Para mover: CONFIRMA=\"MOVER BACKUPS L02\""; exit 0; }
umask 077; mkdir -p "$DEST"; chmod 700 "$DEST"
for f in "${ANTIGOS[@]}"; do mv -n -- "$f" "$DEST/"; done
echo "movidos: $(find "$DEST" -type f | wc -l) → $DEST (0700) · restantes antigos na origem: $(find "$ORIG" -maxdepth 1 -type f -name 'sess_*.bak' ! -name 'sess_h1_*.bak' | wc -l) (esperado 0)"
echo "volta (1 linha): mv -n $DEST/* $ORIG/"
