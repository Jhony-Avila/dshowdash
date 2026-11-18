#!/bin/bash
# AUDITORIA-PERMISSOES (18/11/2026) — função comum para SCRIPTS DE PORTÃO que mexem em permissão.
# Uso (dentro do script do portão, ANTES de montar o SQL):
#   source /srv/dshow-releases/dash/releases/<sha>/scripts/deploy/portao-auditoria-permissao.sh   (ou do clone)
#   SQL="START TRANSACTION; <mudanças>; $(auditoria_permissao_sql PORTAO OPERACAO ACAO CHAVE TIPO ID "$ANTES_JSON" "$DEPOIS_JSON" "$BACKUP" "$MOTIVO") COMMIT;"
#   mysql --defaults-extra-file=/root/.app-dshow-mysql-root.cnf DSHOWDASH -e "$SQL"
# A linha vai NA MESMA transação da mudança: se a auditoria falhar, o COMMIT não acontece.
#   ACAO  = allowed | denied | elevated | revoked (enum da tabela; a operação exata vai em context_json.operacao)
#   autor = "portão <PORTAO> + Jhony" · origem = "portao:<PORTAO>" · user_id = NULL (não é sessão de tela) · ip = 'servidor'
_sql_txt() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/''/g"; }   # escapa para literal SQL
auditoria_permissao_sql() {
  local portao=$1 op=$2 acao=$3 chave=$4 tipo=$5 id=$6 antes=${7:-null} depois=${8:-null} backup=${9:-} motivo=${10:-}
  case "$acao" in allowed|denied|elevated|revoked) ;; *) echo "auditoria_permissao_sql: acao inválida '$acao'" >&2; return 1;; esac
  python3 -c 'import json,sys; [json.loads(x) for x in sys.argv[1:3]]' "$antes" "$depois" || { echo "auditoria_permissao_sql: antes/depois não são JSON" >&2; return 1; }
  local ctx; ctx=$(python3 -c 'import json,sys; a=sys.argv; print(json.dumps({"operacao":a[1],"origem":"portao:"+a[2],"autor":"portão "+a[2]+" + Jhony","antes":json.loads(a[3]),"depois":json.loads(a[4]),"backup":a[5] or None,"motivo":a[6] or None}, ensure_ascii=False))' "$op" "$portao" "$antes" "$depois" "$backup" "$motivo")
  printf "INSERT INTO app_permission_audit_log (user_id, permission_key, action, resource_type, resource_id, context_json, ip_address, user_agent, ip_user, created_at) VALUES (NULL, '%s', '%s', '%s', '%s', '%s', 'servidor', 'portao:%s', 'servidor', NOW(3));" \
    "$(_sql_txt "${chave:0:100}")" "$acao" "$(_sql_txt "${tipo:0:50}")" "$(_sql_txt "${id:0:100}")" "$(_sql_txt "$ctx")" "$(_sql_txt "$portao")"
}
