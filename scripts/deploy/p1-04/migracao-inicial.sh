#!/usr/bin/env bash
# migracao-inicial.sh — corte único: árvore viva (diretório) -> symlink para a release 1. Etapa 6 (raiz por parâmetro).
# Uso: migracao-inicial.sh --raiz <dir-vivo> --release <dir-release> --compartilhado <dir> --guardar <dir-backup-novo>
#        [--servicos sim|nao] [--dry-run|--aplicar]
# Nada é apagado: a árvore viva (sem o estado) vai INTEIRA para --guardar; o estado é MOVIDO (rename) para o compartilhado.
# Grava <compartilhado>/.corte (dados para o rollback-corte.sh) e os tempos de cada passo.
set -euo pipefail
. "${DSHOW_ESTADO_LIB:-$(dirname "$(readlink -f "$0")")/estado-compartilhado.sh}"
VIVO= REL= SH= ANT= SERV=nao DRY=1
while [ $# -gt 0 ]; do case "$1" in --raiz) VIVO=$2; shift;; --release) REL=$2; shift;; --compartilhado) SH=$2; shift;; --guardar) ANT=$2; shift;;
  --servicos) SERV=$2; shift;; --aplicar) DRY=0;; --dry-run) DRY=1;; *) echo "arg? $1"; exit 2;; esac; shift; done
[ -n "$VIVO" ] && [ -n "$REL" ] && [ -n "$SH" ] && [ -n "$ANT" ] || { echo "uso: ver cabeçalho"; exit 2; }
[ "$(id -u)" -eq 0 ] || { echo "precisa de root"; exit 2; }
if [ "$SERV" = sim ] && [ "$VIVO" != /var/www/dshowdash ]; then echo "--servicos sim só para a raiz real"; exit 2; fi
[ -L "$VIVO" ] && { echo "$VIVO já é symlink — corte já feito"; exit 3; }
[ -d "$VIVO" ] || { echo "$VIVO não é diretório"; exit 2; }
[ -f "$REL/RELEASE_SHA" ] || { echo "release inválida: $REL"; exit 2; }
[ -e "$ANT" ] && { echo "$ANT já existe"; exit 2; }
mkdir -p "$SH"; mesmo_fs "$VIVO" "$SH" && mesmo_fs "$VIVO" "$(dirname "$ANT")" || { echo "raiz, compartilhado e backup precisam estar no MESMO sistema de arquivos (rename)"; exit 2; }
for p in "${ESTADO[@]}"; do [ -e "$SH/$p" ] || [ -L "$SH/$p" ] && { echo "compartilhado já tem $p (corte anterior não revertido?)"; exit 2; }; done
for p in "${ESTADO[@]}"; do [ -L "$REL/$p" ] && [ "$(readlink "$REL/$p")" = "$SH/$p" ] || { echo "release sem o symlink de estado $p -> $SH/$p (rodar ligar_estado)"; exit 2; }; done
PRESENTES=(); for p in "${ESTADO[@]}"; do [ -e "$VIVO/$p" ] || [ -L "$VIVO/$p" ] && PRESENTES+=("$p"); done
echo "estado presente na árvore: ${#PRESENTES[@]}/${#ESTADO[@]} (${PRESENTES[*]})"
if [ $DRY -eq 1 ]; then echo "[dry-run] interruptor, mover ${#PRESENTES[@]} caminhos para $SH, trocar $VIVO <-> symlink $REL, guardar em $ANT, serviços=$SERV"; exit 0; fi
T0=$(ms); OFF=0
[ -e "$VIVO/config/auto-deploy.off" ] || { touch "$VIVO/config/auto-deploy.off"; OFF=1; }
T1=$(ms)
for p in "${PRESENTES[@]}"; do d=$(dirname "$p"); [ "$d" = . ] || { mkdir -p "$SH/$d"; chmod --reference="$VIVO/$d" "$SH/$d"; chown --reference="$VIVO/$d" "$SH/$d"; }; done
# A3 (Etapa 10, 03/11): lista das entradas da release ANTES do corte → o rollback acha o que foi CRIADO dentro da release depois
# (ex.: um .cache novo fora da lista de estado) e devolve à árvore restaurada. Fora da janela (antes do T2).
find "$REL" -mindepth 1 -printf '%P\n' | LC_ALL=C sort > "$SH/.corte.release-lista"; chmod 600 "$SH/.corte.release-lista"
ln -sfn "$REL" "$VIVO.corte-novo"
ARGS=(); for p in "${PRESENTES[@]}"; do ARGS+=("$VIVO/$p" "$SH/$p"); done
T2=$(ms)                                    # JANELA medida dentro do processo (estado sai -> troca atômica)
JAN=$(mover_e_trocar "$VIVO.corte-novo" "$VIVO" "${ARGS[@]}")   # $VIVO = symlink, $VIVO.corte-novo = árvore antiga
T3=$(ms); T4=$T3
mv -T "$VIVO.corte-novo" "$ANT"
T5=$(ms)
{ echo "VIVO=$VIVO"; echo "REL=$REL"; echo "SH=$SH"; echo "ANT=$ANT"; echo "OFF_CRIADO=$OFF"; printf 'PRESENTES=('; printf '%q ' "${PRESENTES[@]}"; echo ')'; echo "LISTA_REL=$SH/.corte.release-lista"; echo "QUANDO='$(date '+%F %T')'"; } > "$SH/.corte"; chmod 600 "$SH/.corte"
if [ "$SERV" = sim ]; then systemctl reload php8.3-fpm; nginx -s reload; fi
T6=$(ms)
echo "CORTE_OK raiz=$VIVO -> $(readlink "$VIVO") | interruptor $(dt $T0 $T1) ms | preparo $(dt $T1 $T2) ms | mover+trocar (processo) $(dt $T2 $T3) ms | JANELA ${JAN} | guardar $(dt $T4 $T5) ms | serviços $(dt $T5 $T6) ms | total $(dt $T0 $T6) ms"
