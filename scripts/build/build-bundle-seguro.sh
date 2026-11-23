#!/usr/bin/env bash
# build-bundle-seguro.sh — regra do Jhony (23/11, depois do incidente das 19:58): NENHUM vite build de bundle roda sem
#   (a) a raiz apontada EXPLICITAMENTE para uma árvore de teste e (b) guarda que ABORTA se o destino estiver em /srv/dshow-releases ou /var/www;
#   + a release SERVIDA conferida contra o SHA256SUMS ANTES e DEPOIS; + prova de que o arquivo de saída DA ÁRVORE foi reescrito.
# Uso: build-bundle-seguro.sh <árvore-public> lote3bc|component <nome> <saída relativa ao public>
#   ex.: build-bundle-seguro.sh /srv/dshow-work/build/X/public lote3bc header-components components/header/components/dist/header-components.bundle.js
set -euo pipefail
ARV=${1:?árvore public}; TIPO=${2:?lote3bc|component}; NOME=${3:?nome}; SAIDA=${4:?saída relativa}
ARV=$(realpath -e "$ARV")
case "$ARV/" in /srv/dshow-releases/*|/var/www/*) echo "⛔ ABORTADO: árvore $ARV é release/produção"; exit 3;; esac
[ "$(realpath -m "$ARV/$SAIDA")" = "$ARV/$SAIDA" ] || { echo "⛔ ABORTADO: saída com symlink/..: $SAIDA"; exit 3; }
case "$(realpath -m "$ARV/$SAIDA")" in /srv/dshow-releases/*|/var/www/*) echo "⛔ ABORTADO: destino em release/produção"; exit 3;; esac
# nenhum symlink no caminho da árvore até a saída apontando para fora dela
d=$(dirname "$ARV/$SAIDA"); while [ "$d" != "$ARV" ] && [ "$d" != / ]; do [ -L "$d" ] && { echo "⛔ ABORTADO: symlink no caminho ($d)"; exit 3; }; d=$(dirname "$d"); done
SERV=$(readlink -f /var/www/dshowdash)
conferir() { (cd "$SERV" && grep -E "  \./public/" SHA256SUMS | sha256sum -c --quiet >/dev/null 2>&1) && echo "ok" || echo "DIVERGENTE"; }
[ "$(conferir)" = ok ] || { echo "⛔ ABORTADO: a servida JÁ diverge do SHA256SUMS antes do build"; exit 3; }
case "$TIPO" in
  lote3bc) CFG="$ARV/vite.lote3bc.config.js"; VAR=LOTE3BC_ROOT; SEL=TARGET ;;
  component) CFG="$ARV/components/vite.components.config.js"; VAR=VITE_COMPONENTS_ROOT; SEL=COMPONENT ;;
  *) echo "tipo inválido"; exit 2 ;;
esac
[ -f "$CFG" ] || { echo "⛔ config ausente: $CFG"; exit 3; }
grep -q "process.env.$VAR" "$CFG" || { echo "⛔ a config não lê $VAR: não há como apontar a raiz"; exit 3; }
VITE="$ARV/react/node_modules/.bin/vite"; [ -x "$VITE" ] || { echo "⛔ vite ausente em $VITE"; exit 3; }
antes=$(stat -c %Y "$ARV/$SAIDA" 2>/dev/null || echo 0); sleep 1
(cd "$ARV" && env -u LOTE3BC_ROOT -u VITE_COMPONENTS_ROOT "$VAR=$ARV" "$SEL=$NOME" nice -n 10 "$VITE" build --config "$CFG")
depois=$(stat -c %Y "$ARV/$SAIDA" 2>/dev/null || echo 0)
r=$(conferir); [ "$r" = ok ] || { echo "⛔⛔ A SERVIDA DIVERGE DO SHA256SUMS DEPOIS DO BUILD — avisar o Jhony"; exit 4; }
[ "$depois" -gt "$antes" ] || { echo "⛔ a saída da ÁRVORE não foi reescrita ($SAIDA) — o build escreveu em outro lugar?"; exit 3; }
echo "✅ $NOME: saída reescrita na árvore ($SAIDA) · servida conferida ANTES e DEPOIS (= SHA256SUMS) · sha256 $(sha256sum "$ARV/$SAIDA" | cut -c1-16)"
