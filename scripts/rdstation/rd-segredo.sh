#!/usr/bin/env bash
# =====================================================================================================================================
# scripts/rdstation/rd-segredo.sh — GUARDA do Client ID/Secret do app privado "Dash DSHOW" do RD Station Marketing · VINHO (ACIMA_ESQUERDA) 26/11
# Padrão do scripts/asaas/asaas-chaves.sh. Executor: Jhony, root, terminal com TTY (ssh -t). NENHUM agente gera, recebe ou vê o segredo.
#
#   sem argumento   SIMULAÇÃO: mostra pasta, dono e o que já existe (só nomes e permissões; nunca o conteúdo). Não pede nada.
#   --executar      pede o Client ID e o Client Secret com `read -s` (sem eco; o Secret DUAS vezes, têm de ser iguais), grava:
#                     <config>/rdstation/client_id, client_secret  (0600)  e  cripto.key (32 bytes aleatórios, base64; só se ainda não existir)
#                   pasta 0700, dono = usuário do php-fpm (www-data). Arquivo já existente → MOVIDO para /backup/_restrito/<ts>-rdstation/
#                   (com revert-all.sh). Trocar o Client ID/Secret NÃO apaga a conexão (token.enc); trocar a cripto.key invalida o token
#                   (aí é só "Conectar" de novo) — por isso a cripto.key só é criada uma vez.
#   --listar        só nomes, dono e permissão dos arquivos da pasta.
#   [--dash-config /srv/dshow-shared/dash/config] [--dash-user www-data]
# Os valores nunca passam por argumento, eval, log, histórico ou saída: ficam em variáveis locais (nunca exportadas) e vão ao arquivo pelo
# builtin printf. `set -x` é desligado à força.
# =====================================================================================================================================
set -euo pipefail
set +x
umask 077
unset HISTFILE 2>/dev/null || true
unset RD_ID RD_S1 RD_S2 2>/dev/null || true
DASH_CONFIG="/srv/dshow-shared/dash/config"; DASH_USER="www-data"; MODO=simular
while [ $# -gt 0 ]; do case "$1" in
  --executar) MODO=executar;; --listar) MODO=listar;;
  --dash-config) DASH_CONFIG="${2:?}"; shift;; --dash-user) DASH_USER="${2:?}"; shift;;
  *) echo "[ERRO] argumento desconhecido: $1"; exit 2;; esac; shift; done
RE='^[A-Za-z0-9._~-]{8,200}$'
D="$DASH_CONFIG/rdstation"
[ "$(id -u)" = 0 ] || [ "${RD_SEGREDO_TESTE:-}" = 1 ] || { echo "[ERRO] rode como root"; exit 2; }
if [ "${RD_SEGREDO_TESTE:-}" = 1 ]; then case "$DASH_CONFIG" in /srv/dshow-work/*) ;; *) echo "[ERRO] modo de teste só com pasta em /srv/dshow-work"; exit 2;; esac; fi
[ -d "$DASH_CONFIG" ] && [ ! -L "$DASH_CONFIG" ] || { echo "[ERRO] config do Dash ausente: $DASH_CONFIG"; exit 2; }
id "$DASH_USER" >/dev/null 2>&1 || { echo "[ERRO] usuário do php-fpm inexistente: $DASH_USER"; exit 2; }
listar() { if [ -d "$D" ]; then stat -c '  %A %U %n' "$D"; for f in client_id client_secret cripto.key token.enc estado.json; do [ -e "$D/$f" ] && stat -c '  %A %U %n' "$D/$f" || echo "  (ausente) $D/$f"; done; else echo "  (pasta ainda não existe) $D"; fi; }
echo "== RD Station · segredos do app \"Dash DSHOW\" · $MODO · pasta $D · dono $DASH_USER"
listar
[ "$MODO" = executar ] || { [ "$MODO" = simular ] && echo "(simulação: nada pedido, nada gravado — use --executar)"; exit 0; }
[ -t 0 ] || { echo "[ERRO] precisa de terminal (ssh -t)"; exit 2; }

IFS= read -r -s -p "Client ID do app Dash DSHOW (não aparece): " RD_ID; echo
IFS= read -r -s -p "Client Secret (não aparece): " RD_S1; echo
IFS= read -r -s -p "Client Secret de novo: " RD_S2; echo
[[ "$RD_ID" =~ $RE ]] || { unset RD_ID RD_S1 RD_S2; echo "[ERRO] Client ID com formato inesperado (8–200 caracteres A-Z a-z 0-9 . _ ~ -). Nada gravado."; exit 3; }
[[ "$RD_S1" =~ $RE ]] || { unset RD_ID RD_S1 RD_S2; echo "[ERRO] Client Secret com formato inesperado. Nada gravado."; exit 3; }
[ "$RD_S1" = "$RD_S2" ] || { unset RD_ID RD_S1 RD_S2; echo "[ERRO] os dois Client Secret não são iguais. Nada gravado."; exit 3; }
unset RD_S2
echo "Client ID: ${#RD_ID} caracteres · Client Secret: ${#RD_S1} caracteres"
read -r -p "Gravar? (digite SIM) " OK; [ "$OK" = SIM ] || { unset RD_ID RD_S1; echo "Cancelado. Nada gravado."; exit 0; }

TS=$(date +%Y%m%d-%H%M%S); BK=""
mkdir -p "$D"; chmod 700 "$D"; chown "$DASH_USER": "$D"
for f in client_id client_secret; do
  if [ -e "$D/$f" ]; then
    [ -n "$BK" ] || { BK=$( [ "${RD_SEGREDO_TESTE:-}" = 1 ] && echo "$DASH_CONFIG/../bk-$TS-rdstation" || echo "/backup/_restrito/$TS-rdstation" ); mkdir -p "$BK"; chmod 700 "$BK"; }
    mv "$D/$f" "$BK/$f"
  fi
done
grava() { local t; t=$(mktemp "$D/.$1.XXXXXX"); printf '%s\n' "$2" > "$t"; chmod 600 "$t"; chown "$DASH_USER": "$t"; mv -f "$t" "$D/$1"; }
grava client_id "$RD_ID"; grava client_secret "$RD_S1"; unset RD_ID RD_S1
if [ ! -e "$D/cripto.key" ]; then grava cripto.key "$(head -c 32 /dev/urandom | base64 -w0)"; echo "cripto.key criada (32 bytes)"; else echo "cripto.key mantida (a conexão existente continua valendo)"; fi
if [ -n "$BK" ]; then
  printf '#!/usr/bin/env bash\n# volta do rd-segredo.sh (%s): devolve o client_id/client_secret anteriores\nset -eu\nfor f in client_id client_secret; do [ -e "%s/$f" ] && install -m 600 -o %s -g %s "%s/$f" "%s/$f"; done\necho "[OK] client_id/client_secret anteriores devolvidos"\n' \
    "$TS" "$BK" "$DASH_USER" "$DASH_USER" "$BK" "$D" > "$BK/revert-all.sh"; chmod 700 "$BK/revert-all.sh"; echo "anteriores guardados em $BK (volta: bash $BK/revert-all.sh)"
fi
listar
echo "[OK] segredos gravados. Próximo passo: no Dash, Integrações → RD Station → \"Conectar\" (logado como administrador do RD)."
