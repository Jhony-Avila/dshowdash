#!/usr/bin/env bash
# logs010-sonda.sh (AZUL/ESQUERDA, 28/11 · GPT-LOGS-010, candidato a P0: "conta desativada continua com sessão válida?")
# Homologação AMARELO (porta P, banco ATRWEB_VAL_DASH_P), P155 materializada, SÓ contas fictícias. Conta-alvo = equipe 990050 (2 sessões);
# admin = Dono 990075 (concessão temporária gate:admin:users, desativada no fim). Para cada cenário: estado da conta, estado das sessões no banco
# (só ids/is_active), horário da alteração, HTTP + decisão de autenticação (check.php), API de leitura, API de escrita (PUT do próprio perfil com
# CSRF válido), renovação (refresh.php) e a camada que negou. NUNCA imprime token, cookie, CSRF ou corpo; o laudo leva só status, códigos e ids.
#   bash logs010-sonda.sh <porta 8121|8120>
set -uo pipefail
P=${1:?porta}; BASE=http://127.0.0.1:$P; DB=ATRWEB_VAL_DASH_$P; INI=/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini
[ "$(curl -s -m 5 $BASE/__db)" = "$DB" ] || { echo "RECUSADO: /__db ≠ $DB"; exit 2; }
O=$(cd "$(dirname "$0")" && pwd)/resultado-$P-$(date +%Y%m%d-%H%M%S); mkdir -p "$O"; J=$(mktemp -d -p /srv/dshow-work); M="$O/MATRIZ.md"
ALVO=990201; DONO=990075   # alvo = perfil fictício "alvo" do AMARELO (nível 50, ativo)
q() { mysql --defaults-extra-file="$INI" -N -B "$DB" -e "$1"; }
GID=$(q "INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, granted_by) VALUES ($DONO, 'gate:admin:users', 'allow', 'massa logs010 azul', $DONO); SELECT LAST_INSERT_ID()")
ST0=$(q "SELECT CONCAT(status, '|', IFNULL(deleted_at, '')) FROM app_users WHERE id = $ALVO")
voltar() { q "UPDATE app_users SET status = 'active', deleted_at = NULL WHERE id = $ALVO; UPDATE app_user_trigger_permissions SET deleted_at = NOW() WHERE id = $GID AND deleted_at IS NULL"; rm -rf "$J"; }
trap voltar EXIT
entrar() { curl -s -o /dev/null -c "$J/$1" -b "$J/$1" "$BASE/__entrar?perfil=$2&ir=/"; }
csrf() { curl -s -b "$J/$1" "$BASE/api/auth/check.php" | python3 -I -c 'import json,sys
try: d=json.load(sys.stdin); x=d.get("data") or {}; print(x.get("csrf_token") or (x.get("session") or {}).get("csrf_token") or "")
except Exception: print("")'; }
cod() { python3 -I -c 'import json,sys
try: d=json.load(open(sys.argv[1]))
except Exception: print("nao-json"); sys.exit()
if not isinstance(d,dict): print("-"); sys.exit()
e=d.get("error"); e=e.get("code") if isinstance(e,dict) else e
x=d.get("data") if isinstance(d.get("data"),dict) else {}
print(e if isinstance(e,str) else ("ok" + (":auth=" + str(x.get("authenticated")) if "authenticated" in x else "")))' "$1"; }
sessoes() { q "SELECT GROUP_CONCAT(CONCAT('s', id, ':', is_active, IF(expires_at > NOW(), '', '(vencida)')) ORDER BY id) FROM app_user_sessions WHERE user_id = $ALVO AND deleted_at IS NULL" 2>/dev/null; }
chamar() { # rótulo-sessão método url [corpo]
  local s=$1 m=$2 u=$3 b=${4:-} t; local a=(-s -m 15 -o "$J/r" -w '%{http_code}' -b "$J/$s" -c "$J/$s" -X "$m" -H 'Accept: application/json')
  if [ "$m" != GET ]; then t=$(csrf "$s"); a+=(-H "X-CSRF-Token: $t" -H 'Content-Type: application/json' --data "$b"); fi
  local h; h=$(curl "${a[@]}" "$BASE$u"); echo "$h $(cod "$J/r")"; }
linha() { echo "| $1 | $2 | $3 | $4 | $5 | $6 | $7 | $8 |" >> "$M"; }
{ echo "# GPT-LOGS-010 · matriz · porta $P · banco \`$DB\` · $(date '+%d/%m %H:%M')"
  echo "**Servido:** $(tail -1 /srv/dshow-modularizacao/atributos-web/validacao/amarelo/$P/montagens.txt 2>/dev/null | cut -c1-90) · conta-alvo 990201 (fictícia, perfil alvo) · admin 990075 (fictício) · estado inicial da conta: \`$ST0\`"
  echo; echo "| cenário | ação (horário) | estado da conta | sessões no banco | check.php (sessão 1 / 2) | leitura uarps my-permissions (1 / 2) | escrita PUT perfil (1) · renovação refresh (2) | camada que negou / P0? |"; echo "|---|---|---|---|---|---|---|---|"; } > "$M"
P0=0
cenario() { # nome rótulo-ação comando-admin(json ou "SQL:...")
  local nome=$1 rot=$2 acao=$3 t
  q "UPDATE app_users SET status = 'active', deleted_at = NULL WHERE id = $ALVO"
  entrar a1 alvo; entrar a2 alvo; entrar adm dono
  local base1 base2; base1=$(chamar a1 GET /api/auth/check.php); base2=$(chamar a2 GET /api/auth/check.php)
  t=$(date '+%H:%M:%S')
  case "$acao" in
    PUT:*)    r=$(chamar adm PUT "/api/admin/users/index.php?id=$ALVO" "${acao#PUT:}");;
    BULK:*)   r=$(chamar adm POST "/api/admin/users/index.php?action=bulk-update-status" "${acao#BULK:}");;
    DELETE)   r=$(chamar adm DELETE "/api/admin/users/index.php?id=$ALVO" '{}');;
    NADA)     r="—";;
  esac
  sleep 1
  local est; est=$(q "SELECT CONCAT(status, IF(deleted_at IS NULL, '', ' · excluída')) FROM app_users WHERE id = $ALVO")
  local c1 c2 l1 l2 w1 r2
  c1=$(chamar a1 GET /api/auth/check.php); c2=$(chamar a2 GET /api/auth/check.php)
  l1=$(chamar a1 GET "/api/permissions/uarps.php?action=my-permissions"); l2=$(chamar a2 GET "/api/permissions/uarps.php?action=my-permissions")
  w1=$(chamar a1 PUT /api/user/profile.php '{"nome_resumido":"Equipe logs010"}'); r2=$(chamar a2 POST /api/auth/refresh.php '{}')
  local veredito="—"
  if [ "$acao" != NADA ] && [[ "$est" != active* ]]; then
    if [[ $l1 == 200* || $l2 == 200* || $w1 == 200* ]]; then veredito="**⛔ P0** (dado/escrita depois da desativação confirmada)"; P0=1
    elif [[ $c1 == 200*auth=True* || $c2 == 200*auth=True* || $r2 == 200* ]]; then veredito="sessão ainda VÁLIDA (check/refresh), APIs negaram"
    else veredito="negado"; fi
  fi
  linha "$nome" "$rot ($t) → admin: $r" "$est" "$(sessoes)" "$c1 / $c2 (antes: ${base1%% *}/${base2%% *})" "$l1 / $l2" "$w1 · $r2" "$veredito"
}
cenario "(a) baseline ativa, 2 sessões" "nenhuma" NADA
cenario "(b) desativação individual" "PUT status=disabled" 'PUT:{"status":"disabled"}'
cenario "(c) desativação em massa" "bulk-update-status disabled" 'BULK:{"user_ids":[990201],"status":"disabled"}'
cenario "(d) bloqueio administrativo" "bulk-update-status locked" 'BULK:{"user_ids":[990201],"status":"locked"}'
cenario "(e) exclusão lógica" "DELETE" DELETE
# (i) LOGS-021: o admin aciona terminate-session e terminate-user-sessions de uma conta com 2 sessões → as sessões continuam válidas?
q "UPDATE app_users SET status = 'active', deleted_at = NULL WHERE id = $ALVO"; entrar i1 alvo; entrar i2 alvo; entrar adm dono
SID=$(q "SELECT id FROM app_user_sessions WHERE user_id = $ALVO AND is_active = 1 ORDER BY id DESC LIMIT 1")
ti1=$(chamar adm POST "/api/admin/users/index.php?action=terminate-session" "{\"session_id\":$SID,\"user_id\":$ALVO}"); ti2=$(chamar adm POST "/api/admin/users/index.php?action=terminate-user-sessions" "{\"user_id\":$ALVO}")
grep -q NOT_IMPLEMENTED "$J/r" && ni="corpo: NOT_IMPLEMENTED" || ni="corpo sem NOT_IMPLEMENTED"
sleep 1; ic1=$(chamar i1 GET /api/auth/check.php); ic2=$(chamar i2 GET /api/auth/check.php); il1=$(chamar i1 GET "/api/permissions/uarps.php?action=my-permissions")
linha "(i) LOGS-021 terminate" "terminate-session(s$SID) → $ti1 · terminate-user-sessions → $ti2 ($ni)" "$(q "SELECT status FROM app_users WHERE id = $ALVO")" "$(sessoes)" "$ic1 / $ic2" "$il1" "—" "$( [[ $il1 == 200* ]] && echo 'admin recebeu 200 e as sessões CONTINUAM válidas (nada foi encerrado)' || echo 'sessões encerradas')"
# (h) reativação: desativa, confirma, reativa → as sessões ANTIGAS voltam?
q "UPDATE app_users SET status = 'active', deleted_at = NULL WHERE id = $ALVO"; entrar h1 alvo; entrar adm dono
rd=$(chamar adm PUT "/api/admin/users/index.php?id=$ALVO" '{"status":"disabled"}'); sleep 1; hd=$(chamar h1 GET "/api/permissions/uarps.php?action=my-permissions")
ra=$(chamar adm PUT "/api/admin/users/index.php?id=$ALVO" '{"status":"active"}'); sleep 1; hr=$(chamar h1 GET "/api/permissions/uarps.php?action=my-permissions"); hc=$(chamar h1 GET /api/auth/check.php)
linha "(h) reativação" "PUT disabled → $rd · PUT active → $ra" "$(q "SELECT status FROM app_users WHERE id = $ALVO")" "$(sessoes)" "$hc" "desativada: $hd · reativada: $hr" "—" "$( [[ $hr == 200* ]] && echo 'sessão ANTIGA volta a funcionar depois da reativação' || echo 'sessão antiga não volta')"
{ echo; echo "**(f)** está nas colunas de leitura/escrita de b–e (APIs protegidas chamadas DEPOIS da desativação confirmada no banco, com CSRF válido). **(g)** é a coluna \`refresh\`."
  echo; echo "**Resultado:** $( [ $P0 = 1 ] && echo '⛔ **P0 LOGS-010 CONFIRMADO**: dado protegido obtido ou escrita concluída com a conta já desativada/bloqueada/excluída' || echo 'sem P0 nesta matriz')"; } >> "$M"
cat "$M"; [ $P0 = 0 ]
