#!/usr/bin/env bash
# ============================================================================
# NAV DRY-RUN — Simulação de mudança de navegação
# Versão: 1.0.0
# Uso: ./nav_dryrun.sh <tipo> <key> <novo_valor>
# Exemplos:
#   ./nav_dryrun.sh route docs panel-docs
#   ./nav_dryrun.sh binding navrail:home "#/dashboard"
# ============================================================================
set -u

TYPE="${1:-}"
KEY="${2:-}"
NEW_VALUE="${3:-}"

# Credencial EXTERNA obrigatória (P1-01, Etapa 5): arquivo de opções do cliente MySQL, 0600, fora do repositório.
# SEM fallback: sem DSHOW_MYSQL_CNF legível o script não roda. Formato: tools/db/mysql-cliente.cnf.example
if [ -z "${DSHOW_MYSQL_CNF:-}" ] || [ ! -r "${DSHOW_MYSQL_CNF}" ]; then
  echo "recusado: defina DSHOW_MYSQL_CNF com um arquivo de opções do cliente MySQL legível (ver tools/db/mysql-cliente.cnf.example)" >&2
  exit 2
fi

run_mysql() {
  mysql --defaults-extra-file="$DSHOW_MYSQL_CNF" DSHOWDASH -N -s -e "$1" 2>/dev/null
}

hr() { printf "\n%s\n" "========================================"; }

show_help() {
  cat << HELP
NAV DRY-RUN — Simulação de mudança (não grava nada)

USO:
  $0 route <route_clean> <new_destination_key>
  $0 binding <action_key> <new_route>
  $0 show routes
  $0 show bindings
  $0 show destinations

EXEMPLOS:
  $0 route docs panel-docs
  $0 binding navrail:home "#/dashboard"
  $0 show routes

HELP
}

show_routes() {
  hr
  printf "ROTAS ATIVAS (route → destination)\n"
  hr
  run_mysql "
    SELECT CONCAT(r.route_clean, ' → ', d.destination_key) 
    FROM app_nav_route_resolution_active ra
    JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id = ra.resolution_rev_id
    JOIN app_nav_route r ON r.route_id = ra.route_id
    JOIN app_nav_destination d ON d.destination_id = rr.destination_id
    ORDER BY r.route_clean;
  "
}

show_bindings() {
  hr
  printf "BINDINGS ATIVOS (action → effect)\n"
  hr
  run_mysql "
    SELECT CONCAT(a.action_key, ' → ', br.effect, ' ', IFNULL(br.params_json,'{}'))
    FROM app_nav_binding_active ba
    JOIN app_nav_binding_revision br ON br.binding_rev_id = ba.binding_rev_id
    JOIN app_nav_action a ON a.action_id = ba.action_id
    ORDER BY a.action_key
    LIMIT 30;
  "
  printf "\n... (mostrando 30 primeiros)\n"
}

show_destinations() {
  hr
  printf "DESTINOS DISPONÍVEIS\n"
  hr
  run_mysql "SELECT destination_key FROM app_nav_destination ORDER BY destination_key;"
}

simulate_route_change() {
  local route_clean="$1"
  local new_dest="$2"
  
  hr
  printf "🔍 SIMULAÇÃO: Mudança de Rota\n"
  hr
  
  # Verificar se rota existe
  local route_id=$(run_mysql "SELECT route_id FROM app_nav_route WHERE route_clean = '$route_clean';")
  if [ -z "$route_id" ]; then
    printf "❌ ERRO: Rota '%s' não existe\n" "$route_clean"
    return 1
  fi
  
  # Buscar destino atual
  local current=$(run_mysql "
    SELECT d.destination_key
    FROM app_nav_route_resolution_active ra
    JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id = ra.resolution_rev_id
    JOIN app_nav_destination d ON d.destination_id = rr.destination_id
    WHERE ra.route_id = $route_id;
  ")
  
  # Verificar se novo destino existe
  local new_dest_id=$(run_mysql "SELECT destination_id FROM app_nav_destination WHERE destination_key = '$new_dest';")
  if [ -z "$new_dest_id" ]; then
    printf "❌ ERRO: Destino '%s' não existe\n" "$new_dest"
    printf "\nDestinos disponíveis:\n"
    run_mysql "SELECT destination_key FROM app_nav_destination ORDER BY destination_key;"
    return 1
  fi
  
  # Calcular checksum
  local checksum=$(printf "%s->%s-v2-dryrun" "$route_clean" "$new_dest" | sha256sum | cut -d' ' -f1)
  
  hr
  printf "📋 WOULD CHANGE:\n"
  hr
  printf "   Route: %s\n" "$route_clean"
  printf "   FROM:  %s\n" "${current:-<sem resolução>}"
  printf "   TO:    %s\n" "$new_dest"
  printf "\n"
  printf "📦 Nova Revisão (não gravada):\n"
  printf "   route_id: %s\n" "$route_id"
  printf "   destination_id: %s\n" "$new_dest_id"
  printf "   checksum: %s\n" "$checksum"
  printf "   layout: default\n"
  hr
  printf "⚠️  NENHUMA ALTERAÇÃO FOI FEITA (dry-run)\n"
  hr
}

simulate_binding_change() {
  local action_key="$1"
  local new_route="$2"
  
  hr
  printf "🔍 SIMULAÇÃO: Mudança de Binding\n"
  hr
  
  # Verificar se ação existe
  local action_id=$(run_mysql "SELECT action_id FROM app_nav_action WHERE action_key = '$action_key';")
  if [ -z "$action_id" ]; then
    printf "❌ ERRO: Ação '%s' não existe\n" "$action_key"
    return 1
  fi
  
  # Buscar binding atual
  local current=$(run_mysql "
    SELECT CONCAT(br.effect, ' ', IFNULL(br.params_json,'{}'))
    FROM app_nav_binding_active ba
    JOIN app_nav_binding_revision br ON br.binding_rev_id = ba.binding_rev_id
    WHERE ba.action_id = $action_id;
  ")
  
  # Calcular checksum
  local checksum=$(printf "%s-NAVIGATE-%s-v2-dryrun" "$action_key" "$new_route" | sha256sum | cut -d' ' -f1)
  
  hr
  printf "📋 WOULD CHANGE:\n"
  hr
  printf "   Action: %s\n" "$action_key"
  printf "   FROM:   %s\n" "${current:-<sem binding>}"
  printf "   TO:     NAVIGATE {\"route\":\"$new_route\"}\n"
  printf "\n"
  printf "📦 Nova Revisão (não gravada):\n"
  printf "   action_id: %s\n" "$action_id"
  printf "   effect: NAVIGATE\n"
  printf "   params: {\"route\":\"$new_route\"}\n"
  printf "   checksum: %s\n" "$checksum"
  hr
  printf "⚠️  NENHUMA ALTERAÇÃO FOI FEITA (dry-run)\n"
  hr
}

# Main
case "$TYPE" in
  route)
    [ -z "$KEY" ] || [ -z "$NEW_VALUE" ] && { show_help; exit 1; }
    simulate_route_change "$KEY" "$NEW_VALUE"
    ;;
  binding)
    [ -z "$KEY" ] || [ -z "$NEW_VALUE" ] && { show_help; exit 1; }
    simulate_binding_change "$KEY" "$NEW_VALUE"
    ;;
  show)
    case "$KEY" in
      routes) show_routes ;;
      bindings) show_bindings ;;
      destinations) show_destinations ;;
      *) show_help ;;
    esac
    ;;
  *)
    show_help
    ;;
esac
