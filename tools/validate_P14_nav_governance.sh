#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P14_gov_$(date +%Y%m%d_%H%M%S).log}"
FAIL=0

# Função para executar MySQL
# Credencial EXTERNA obrigatória (P1-01, Etapa 5): arquivo de opções do cliente MySQL, 0600, fora do repositório.
# SEM fallback: sem DSHOW_MYSQL_CNF legível o script não roda. Formato: tools/db/mysql-cliente.cnf.example
if [ -z "${DSHOW_MYSQL_CNF:-}" ] || [ ! -r "${DSHOW_MYSQL_CNF}" ]; then
  echo "recusado: defina DSHOW_MYSQL_CNF com um arquivo de opções do cliente MySQL legível (ver tools/db/mysql-cliente.cnf.example)" >&2
  exit 2
fi

run_mysql() {
  mysql --defaults-extra-file="$DSHOW_MYSQL_CNF" DSHOWDASH -N -s -e "$1" 2>/dev/null
}

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
warn(){ printf "⚠️  %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P14 — Governança de Navegação\n"
  hr

  sec "Tabelas de Governança"
  TABLES=$(run_mysql "SHOW TABLES LIKE 'app_nav_%';" | wc -l)
  [ "$TABLES" -ge 9 ] && ok "Tabelas nav existem ($TABLES)" || bad "Tabelas nav insuficientes ($TABLES)"
  
  AUDIT_EXISTS=$(run_mysql "SHOW TABLES LIKE 'app_nav_audit_log';" | wc -l)
  [ "$AUDIT_EXISTS" -eq 1 ] && ok "Tabela audit_log existe" || bad "Tabela audit_log AUSENTE"

  sec "Revisão Ativa Única (Bindings)"
  ORPHAN_BINDINGS=$(run_mysql "
    SELECT COUNT(*) FROM app_nav_binding_active ba
    LEFT JOIN app_nav_binding_revision br ON br.binding_rev_id = ba.binding_rev_id
    WHERE br.binding_rev_id IS NULL;
  ")
  
  if [ "$ORPHAN_BINDINGS" = "0" ]; then
    ok "Nenhum binding ativo órfão"
  elif [ -z "$ORPHAN_BINDINGS" ]; then
    bad "Erro ao verificar bindings órfãos"
  else
    bad "Bindings ativos órfãos: $ORPHAN_BINDINGS"
  fi

  sec "Revisão Ativa Única (Resolutions)"
  ORPHAN_RESOLUTIONS=$(run_mysql "
    SELECT COUNT(*) FROM app_nav_route_resolution_active ra
    LEFT JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id = ra.resolution_rev_id
    WHERE rr.resolution_rev_id IS NULL;
  ")
  
  if [ "$ORPHAN_RESOLUTIONS" = "0" ]; then
    ok "Nenhuma resolution ativa órfã"
  elif [ -z "$ORPHAN_RESOLUTIONS" ]; then
    bad "Erro ao verificar resolutions órfãs"
  else
    bad "Resolutions ativas órfãs: $ORPHAN_RESOLUTIONS"
  fi

  sec "Integridade FK (Actions → Bindings)"
  ACTIONS_WITHOUT_BINDING=$(run_mysql "
    SELECT COUNT(*) FROM app_nav_action a
    LEFT JOIN app_nav_binding_active ba ON ba.action_id = a.action_id
    WHERE ba.action_id IS NULL;
  ")
  
  if [ "$ACTIONS_WITHOUT_BINDING" = "0" ]; then
    ok "Todas as ações têm binding ativo"
  elif [ -z "$ACTIONS_WITHOUT_BINDING" ]; then
    warn "Erro ao verificar ações"
  else
    warn "Ações sem binding ativo: $ACTIONS_WITHOUT_BINDING"
  fi

  sec "Integridade FK (Routes → Resolutions)"
  ROUTES_WITHOUT_RESOLUTION=$(run_mysql "
    SELECT COUNT(*) FROM app_nav_route r
    LEFT JOIN app_nav_route_resolution_active ra ON ra.route_id = r.route_id
    WHERE ra.route_id IS NULL;
  ")
  
  if [ "$ROUTES_WITHOUT_RESOLUTION" = "0" ]; then
    ok "Todas as rotas têm resolution ativa"
  elif [ -z "$ROUTES_WITHOUT_RESOLUTION" ]; then
    warn "Erro ao verificar rotas"
  else
    warn "Rotas sem resolution ativa: $ROUTES_WITHOUT_RESOLUTION (aliases ou rotas especiais)"
  fi

  sec "Checksums Consistentes"
  NULL_CHECKSUMS=$(run_mysql "
    SELECT COUNT(*) FROM app_nav_binding_revision WHERE checksum_sha256 IS NULL OR checksum_sha256 = '';
  ")
  
  if [ "$NULL_CHECKSUMS" = "0" ]; then
    ok "Todos os binding revisions têm checksum"
  elif [ -z "$NULL_CHECKSUMS" ]; then
    bad "Erro ao verificar checksums"
  else
    bad "Binding revisions sem checksum: $NULL_CHECKSUMS"
  fi

  sec "Auditoria"
  AUDIT_COUNT=$(run_mysql "SELECT COUNT(*) FROM app_nav_audit_log;" || echo "0")
  [ -n "$AUDIT_COUNT" ] && [ "$AUDIT_COUNT" -gt 0 ] 2>/dev/null && ok "Audit log tem $AUDIT_COUNT registros" || bad "Audit log vazio ou erro"

  AUDIT_SEED=$(run_mysql "SELECT COUNT(*) FROM app_nav_audit_log WHERE operation = 'seed';")
  [ -n "$AUDIT_SEED" ] && [ "$AUDIT_SEED" -gt 0 ] 2>/dev/null && ok "Seed auditado ($AUDIT_SEED registros)" || warn "Seed não auditado"

  AUDIT_ACTIVATE=$(run_mysql "SELECT COUNT(*) FROM app_nav_audit_log WHERE operation = 'activate';")
  [ -n "$AUDIT_ACTIVATE" ] && [ "$AUDIT_ACTIVATE" -gt 0 ] 2>/dev/null && ok "Ativações auditadas ($AUDIT_ACTIVATE registros)" || warn "Ativações não auditadas"

  sec "Resumo de Contagens"
  printf "   Actions: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_action;')"
  printf "   Destinations: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_destination;')"
  printf "   Routes: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_route;')"
  printf "   Binding Revisions: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_binding_revision;')"
  printf "   Binding Active: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_binding_active;')"
  printf "   Resolution Revisions: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_route_resolution_revision;')"
  printf "   Resolution Active: %s\n" "$(run_mysql 'SELECT COUNT(*) FROM app_nav_route_resolution_active;')"
  printf "   Audit Log: %s\n" "$AUDIT_COUNT"

  hr
  if [ "$FAIL" -eq 0 ]; then 
    printf "✅ P14 GOVERNANÇA VALIDADA\n"
    printf "   Sistema com auditoria, integridade e rastreabilidade\n"
  else 
    printf "❌ P14 FALHOU (erros: %s)\n" "$FAIL"
  fi
  hr
}

main >"$OUT" 2>&1
tail -n 80 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
