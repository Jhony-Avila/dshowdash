#!/usr/bin/env bash
# publicar-release.sh — publica o Dash pelo FLUXO OFICIAL comprovado (17–18/11: 7 releases): montador + pré-checagens + troca.
# Substitui o publicar-sha.sh (passo 3/8 defasado: build por git archive + laço próprio; a receita oficial exige clone).
# Uso: publicar-release.sh <branch-ja-em-main> [--aplicar]      (padrão: simulação; não monta, não troca)
# Pré: push guardado feito (guardar-push-main.sh). Nunca apaga release. Reverter: dshow-rollback-dash.sh <release-anterior> --aplicar
set -euo pipefail
BR="${1:?branch}"; AP=0; [ "${2:-}" = --aplicar ] && AP=1
REPO=${MONTAR_REPO:-/srv/dshow-work/dia-a/clone-entrega}; RELS=/srv/dshow-releases/dash/releases; SERV=/var/www/dshowdash
SHA=$(git -C "$REPO" rev-parse --verify "$BR^{commit}"); NOVA="$RELS/$SHA"; ANT=$(readlink -f "$SERV")
git -C "$REPO" fetch -q origin main 2>/dev/null || true
git -C "$REPO" merge-base --is-ancestor "$SHA" origin/main || { echo "recusado: $SHA não está na main (fazer o push guardado antes)"; exit 2; }
echo "$BR" | grep -qE '^[0-9a-f]{7,40}$' && { echo "recusado: passe o NOME do ramo (o montador não aceita SHA puro)"; exit 2; }
git -C "$REPO" merge-base --is-ancestor "$(basename "$ANT")" "$SHA" || { echo "recusado: $SHA não descende da release servida $(basename "$ANT") (seria regressão)"; exit 2; }
echo "publicar $BR = $SHA · atual $(basename "$ANT")"
[ -d "$NOVA" ] && { echo "recusado: $NOVA já existe"; exit 2; }
if [ $AP = 0 ]; then
  echo "[simulação] 1 montar: LIGAR_ESTADO=/srv/dshow-shared/dash MONTAR_REPO=$REPO /usr/local/sbin/dshow-montar-release.sh $BR $NOVA"
  echo "[simulação] 2 pré-checagens: diff -rq vs $ANT (só os arquivos do diff git), php -l como www-data, symlinks iguais, leitura_runtime"
  echo "[simulação] 3 troca: /usr/local/sbin/dshow-rollback-dash.sh $NOVA --aplicar"
  echo "[simulação] 4 health / e /api/health = 200 · reverter: /usr/local/sbin/dshow-rollback-dash.sh $ANT --aplicar"
  echo "arquivos que mudam (git diff $(basename "$ANT")..$SHA):"; git -C "$REPO" diff --name-only "$(basename "$ANT")" "$SHA" | sed 's/^/  /'
  exit 0
fi
LIGAR_ESTADO=/srv/dshow-shared/dash MONTAR_REPO="$REPO" /usr/local/sbin/dshow-montar-release.sh "$BR" "$NOVA"
# pré-checagens (iguais às do dia): só os arquivos do diff git podem diferir; php -l como www-data; symlinks iguais
mapfile -t MUD < <(git -C "$REPO" diff --name-only "$(basename "$ANT")" "$SHA")
DIF=$(diff -rq --no-dereference -x RELEASE_SHA -x RELEASE_MANIFEST -x SHA256SUMS "$ANT" "$NOVA" | sed "s#$ANT/##;s#$NOVA/##" | grep -o -E '^(Files|Only in) [^ ]+' | awk '{print $2}' | sort -u)
for f in $DIF; do printf '%s\n' "${MUD[@]}" | grep -qx "$f" || printf '%s\n' "${MUD[@]}" | grep -q "^public/api/${f#public/api/}" || { echo "⛔ diferença fora do diff git: $f"; exit 3; }; done
for f in "${MUD[@]}"; do case "$f" in *.php) [ -f "$NOVA/$f" ] && runuser -u www-data -- php -l "$NOVA/$f" >/dev/null || { echo "⛔ php -l: $f"; exit 3; };; esac; done
diff <(cd "$ANT" && find . -maxdepth 3 -type l -printf '%p -> %l\n' | sort) <(cd "$NOVA" && find . -maxdepth 3 -type l -printf '%p -> %l\n' | sort) >/dev/null || { echo "⛔ symlinks diferentes"; exit 3; }
source /usr/local/lib/dshow/leitura-runtime.sh; leitura_runtime "$NOVA" || { echo "⛔ www-data não lê $NOVA"; exit 3; }
/usr/local/sbin/dshow-rollback-dash.sh "$NOVA" --aplicar
for p in / /api/health; do c=$(curl -s -o /dev/null -w '%{http_code}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br$p"); echo "health $p $c"; [ "$c" = 200 ] || { echo "⛔ health $p=$c → revertendo"; /usr/local/sbin/dshow-rollback-dash.sh "$ANT" --aplicar; exit 4; }; done
echo "✅ publicado $SHA · reverter: /usr/local/sbin/dshow-rollback-dash.sh $ANT --aplicar"
