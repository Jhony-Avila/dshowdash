#!/usr/bin/env bash
# rollback-corte.sh — desfaz o corte: devolve a árvore original (diretório) no lugar do symlink, com o estado de volta.
# Uso: rollback-corte.sh --compartilhado <dir> [--servicos sim|nao] [--dry-run|--aplicar]
# Lê <compartilhado>/.corte. Nada é apagado: o symlink e o interruptor criados pelo corte vão para <ANT>.desfeito-<ts>/.
#
# A3 (Etapa 10, 03/11/2026) — ESCRITAS DEPOIS DO CORTE. Além dos caminhos de estado que existiam no corte (PRESENTES), devolve:
#   E1. estado da lista ÚNICA que NÃO existia no corte e foi criado depois no compartilhado → entra no MESMO rename atômico;
#   E2. entradas CRIADAS dentro da release depois do corte (fora da lista de estado; ex.: um .cache novo) → MOVIDAS (rename,
#       dono/modo/ACL preservados) para o mesmo caminho na árvore restaurada; se a árvore já tiver o caminho (conflito), vão para
#       <DES>/conflitos/<caminho> e o rollback avisa (nunca sobrescreve, nunca duplica);
#   E3. arquivos da release ALTERADOS depois do corte (sha ≠ SHA256SUMS) → só relatório + CÓPIA em <DES>/release-modificados/
#       (a árvore restaurada fica com a sua versão; código não é estado).
# Base de E2: <compartilhado>/.corte.release-lista (gravada pelo corte). Sem ela (corte antigo), usa SHA256SUMS da release + pais +
# symlinks atuais (aviso: symlink novo dentro da release não é detectável nesse modo).
# Prazo: rollback do CORTE só até 24 h depois do corte (RUNBOOK v4 §5). Depois, só rollback de release.
set -euo pipefail
. "${DSHOW_ESTADO_LIB:-$(dirname "$(readlink -f "$0")")/estado-compartilhado.sh}"
SH= SERV=nao DRY=1
while [ $# -gt 0 ]; do case "$1" in --compartilhado) SH=$2; shift;; --servicos) SERV=$2; shift;; --aplicar) DRY=0;; --dry-run) DRY=1;; *) echo "arg? $1"; exit 2;; esac; shift; done
[ "$(id -u)" -eq 0 ] || exit 2; [ -f "$SH/.corte" ] || { echo "sem $SH/.corte"; exit 2; }
LISTA_REL=
# shellcheck disable=SC1090
. "$SH/.corte"
if [ "$SERV" = sim ] && [ "$VIVO" != /var/www/dshowdash ]; then echo "--servicos sim só para a raiz real"; exit 2; fi
[ -L "$VIVO" ] || { echo "$VIVO não é symlink (nada a desfazer)"; exit 3; }
[ -d "$ANT" ] && ! [ -L "$ANT" ] || { echo "árvore guardada ausente: $ANT"; exit 2; }
[ -d "$REL" ] || { echo "release ausente: $REL"; exit 2; }
for p in "${PRESENTES[@]}"; do [ -e "$SH/$p" ] || [ -L "$SH/$p" ] || { echo "estado ausente no compartilhado: $p"; exit 2; }; [ -e "$ANT/$p" ] && { echo "árvore guardada já tem $p"; exit 2; }; done
# E1 — estado criado DEPOIS do corte no compartilhado (não estava em PRESENTES)
EXTRA=(); for p in "${ESTADO[@]}"; do
  case " ${PRESENTES[*]} " in *" $p "*) continue;; esac
  if [ -e "$SH/$p" ] || [ -L "$SH/$p" ]; then [ -e "$ANT/$p" ] && { echo "árvore guardada já tem $p (estado novo no compartilhado)"; exit 2; }; EXTRA+=("$p"); fi
done
# E2 — entradas novas na release (só as de topo: um diretório novo leva o conteúdo junto)
novos_na_release(){ local base
  if [ -n "$LISTA_REL" ] && [ -f "$LISTA_REL" ]; then base=$LISTA_REL
  else base=$(mktemp); { sed -n 's#^[0-9a-f]\{64\}  \./##p' "$REL/SHA256SUMS" | python3 -I -c '
import sys,os
s=set()
for l in sys.stdin:
    p=l.rstrip("\n"); s.add(p); d=os.path.dirname(p)
    while d: s.add(d); d=os.path.dirname(d)
print("\n".join(s))'; ( cd "$REL" && find . -mindepth 1 -type l -printf '%P\n' ); echo SHA256SUMS; } | LC_ALL=C sort -u > "$base"
    echo "AVISO: sem lista do corte; base = SHA256SUMS + pais + symlinks atuais" >&2; fi
  ( cd "$REL" && find . -mindepth 1 -printf '%P\n' ) | LC_ALL=C sort | LC_ALL=C comm -23 - "$base" | python3 -I -c '
import sys
top=[]
for p in sys.stdin.read().split("\n"):
    if p and not any(p.startswith(t+"/") for t in top): top.append(p)
print("\n".join(top))' | sed '/^$/d'
  [ "$base" = "$LISTA_REL" ] || rm -f -- "$base"; }   # rm só do temporário criado aqui (mktemp)
mapfile -t NOVOS < <(novos_na_release)
if [ $DRY -eq 1 ]; then
  echo "[dry-run] devolver ${#PRESENTES[@]} caminhos de $SH para $ANT; estado criado depois do corte: ${#EXTRA[@]} (${EXTRA[*]:-}); entradas novas na release: ${#NOVOS[@]}; trocar $VIVO (symlink) <-> $ANT; serviços=$SERV"
  for n in "${NOVOS[@]}"; do echo "  novo na release: $n"; done; exit 0; fi
DES="$ANT.desfeito-$(date +%Y%m%d-%H%M%S)"; mkdir -m 0700 "$DES"
# pais dos caminhos de E1 na árvore guardada (dono/modo do pai equivalente do compartilhado)
for p in "${EXTRA[@]}"; do d=$(dirname "$p"); [ "$d" = . ] || [ -d "$ANT/$d" ] || { mkdir -p "$ANT/$d"; chmod --reference="$SH/$d" "$ANT/$d"; chown --reference="$SH/$d" "$ANT/$d"; }; done
T0=$(ms)
mv -T "$ANT" "$VIVO.volta"
ARGS=(); for p in "${PRESENTES[@]}" "${EXTRA[@]}"; do ARGS+=("$SH/$p" "$VIVO.volta/$p"); done
T1=$(ms)
JAN=$(mover_e_trocar "$VIVO.volta" "$VIVO" "${ARGS[@]}")   # $VIVO = diretório original; $VIVO.volta = symlink
T2=$(ms); T3=$T2
mv -T "$VIVO.volta" "$DES/symlink-do-corte"
[ "${OFF_CRIADO:-0}" = 1 ] && [ -e "$VIVO/config/auto-deploy.off" ] && mv "$VIVO/config/auto-deploy.off" "$DES/auto-deploy.off"
mv "$SH/.corte" "$DES/corte.estado"; if [ -n "$LISTA_REL" ] && [ -f "$LISTA_REL" ]; then mv "$LISTA_REL" "$DES/corte.release-lista"; fi
T4=$(ms)
if [ "$SERV" = sim ]; then systemctl reload php8.3-fpm; nginx -s reload; fi
T5=$(ms)
# E2 depois do reload: nada mais é servido da release; devolve o que foi criado nela
NV=0 NC=0; : > "$DES/novos-na-release.txt"
for n in "${NOVOS[@]}"; do
  [ -e "$REL/$n" ] || [ -L "$REL/$n" ] || continue
  if [ -e "$VIVO/$n" ] || [ -L "$VIVO/$n" ]; then
    mkdir -p "$DES/conflitos/$(dirname "$n")"; mv -T "$REL/$n" "$DES/conflitos/$n"; NC=$((NC+1)); printf 'CONFLITO\t%s\n' "$n" >> "$DES/novos-na-release.txt"
  else
    d=$(dirname "$n"); [ "$d" = . ] || [ -d "$VIVO/$d" ] || { mkdir -p "$VIVO/$d"; chmod --reference="$REL/$d" "$VIVO/$d"; chown --reference="$REL/$d" "$VIVO/$d"; }
    mv -T "$REL/$n" "$VIVO/$n"; NV=$((NV+1)); printf 'DEVOLVIDO\t%s\n' "$n" >> "$DES/novos-na-release.txt"
  fi
done
# E3 — arquivos da release alterados depois do corte (só relatório + cópia)
NM=0; if [ -f "$REL/SHA256SUMS" ]; then
  while IFS= read -r f; do [ -n "$f" ] || continue; mkdir -p "$DES/release-modificados/$(dirname "$f")"; cp -a "$REL/$f" "$DES/release-modificados/$f"; NM=$((NM+1)); done < <(
    cd "$REL" && grep -v '  \./SHA256SUMS$' SHA256SUMS | nice -n 19 sha256sum -c --quiet 2>/dev/null | sed -n 's#^\./\(.*\): FAILED$#\1#p'); fi
T6=$(ms)
echo "ROLLBACK_OK $VIVO = diretório | devolver árvore $(dt $T0 $T1) ms | mover+trocar (processo) $(dt $T1 $T2) ms | JANELA ${JAN} | arrumação $(dt $T3 $T4) ms | serviços $(dt $T4 $T5) ms | pós (E2/E3) $(dt $T5 $T6) ms | total $(dt $T0 $T6) ms | estado criado depois ${#EXTRA[@]} | novos na release devolvidos $NV conflitos $NC | release modificados $NM | guardados em $DES"
[ $NC -eq 0 ] || { echo "ATENÇÃO: $NC conflito(s) — ver $DES/novos-na-release.txt e $DES/conflitos/"; exit 4; }
