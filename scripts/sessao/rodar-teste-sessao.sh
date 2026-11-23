#!/usr/bin/env bash
# Roda os 6 casos de teste-sessao-renovacao.php contra <raiz> (padrão: este repositório), cada um num processo, com a pasta de sessões
# PHP ISOLADA (unshare -m + bind de uma pasta temporária sobre /var/lib/php/sessions — o host não muda). Banco: só ATRWEB_VAL_* (temporárias).
# Uso (root): ATRWEB_CRED=<ini de validação, 600> bash rodar-teste-sessao.sh [raiz]
set -euo pipefail
D=$(cd "$(dirname "$0")" && pwd); RAIZ=${1:-$(cd "$D/../.." && pwd)}
[ "$(id -u)" -eq 0 ] || { echo "precisa de root (unshare -m)"; exit 2; }
[ -f "${ATRWEB_CRED:-}" ] && [ "$(stat -c %a "$ATRWEB_CRED")" = 600 ] || { echo "recusado: ATRWEB_CRED ausente ou sem 600"; exit 2; }
S=$(mktemp -d /tmp/teste-sessao-XXXXXX); case "$S" in /tmp/teste-sessao-??????) ;; *) echo "mktemp inesperado"; exit 2;; esac
L=$(mktemp /tmp/teste-sessao-log-XXXXXX); case "$L" in /tmp/teste-sessao-log-??????) ;; *) echo "mktemp inesperado"; exit 2;; esac
falhou=0
for caso in ociosa revogada login renovacao logout revogar-tudo; do
  unshare -m --propagation private bash -c "mount --bind '$S' /var/lib/php/sessions && exec env ATRWEB_CRED='$ATRWEB_CRED' php -d error_log='$L' -d log_errors=1 -d display_errors=stderr '$D/teste-sessao-renovacao.php' '$RAIZ' '$caso'" || falhou=1
done
echo "sessões temporárias: $S · log do PHP: $L (mova para /backup se quiser guardar)"
[ $falhou = 0 ] && echo "SESSÃO RENOVAÇÃO: TODOS OS CASOS OK" || { echo "SESSÃO RENOVAÇÃO: HÁ FALHAS"; exit 1; }
