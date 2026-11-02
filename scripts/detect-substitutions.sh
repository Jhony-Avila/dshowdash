#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# detect-substitutions.sh — Detecta substituições incompletas
#   (versão viva em core/assets vs versão superada em components)
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: apenas analisa, NUNCA modifica arquivos.
# Uso:
#   bash /var/www/dshowdash/scripts/detect-substitutions.sh
#
# Referência: /claude/docs/MAPA-SUBSTITUICOES.md (5 casos baseline)
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

PUBLIC="/var/www/dshowdash/public"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Nomes genéricos a excluir (geram falso positivo)
EXCLUDE_PATTERN="^(utils|index|helpers|types|contracts|_shared|dist|styles|adapters|core|kernel|resources|docs|pages|slots|css|js|navigation|policies|runtime|services|validation|_entry)$"

# Casos conhecidos do MAPA-SUBSTITUICOES.md (para cross-check)
KNOWN_CASES="ui-orchestrator|theme-manager|telemetry|audit-trail"

FOUND=0
NEW_FOUND=0

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Detector de Substituições Incompletas"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  READ-ONLY: nenhum arquivo será modificado"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══ Função: contar importadores de um path ═══
# Retorna dois números separados por espaço: "estáticos dinâmicos"
count_importers() {
  local search_path="$1"
  local exclude_dir="$2"
  local static_count dynamic_count

  # Import estático: from '...path' ou from "...path"
  static_count=$(grep -rl "from.*['\"/]${search_path}" "$PUBLIC" --include="*.ts" 2>/dev/null \
    | grep -v "$exclude_dir" \
    | grep -v "node_modules" \
    | grep -v "/dist/" \
    | wc -l || true)

  # Import dinâmico: import('...path') ou import("...path")
  dynamic_count=$(grep -rl "import(['\"].*${search_path}" "$PUBLIC" --include="*.ts" 2>/dev/null \
    | grep -v "$exclude_dir" \
    | grep -v "node_modules" \
    | grep -v "/dist/" \
    | wc -l || true)

  echo "${static_count:-0} ${dynamic_count:-0}"
}

# ═══ Função: imprimir linha da tabela ═══
print_row() {
  local conceito="$1" imp_viva_s="$2" imp_viva_d="$3" imp_super_s="$4" imp_super_d="$5" status="$6"
  local status_color="$GREEN"
  if [ "$status" = "AMBAS EM USO" ]; then status_color="$YELLOW"; fi
  if [ "$status" = "ANOMALIA" ]; then status_color="$RED"; fi

  printf "  %-24s │ %3s+%s │ %3s+%s │ ${status_color}%-20s${NC}\n" \
    "$conceito" "$imp_viva_s" "$imp_viva_d" "$imp_super_s" "$imp_super_d" "$status"
}

# ═══ Função: classificar com base nas contagens ═══
classify() {
  local imp_viva_s="$1" imp_viva_d="$2" imp_super_s="$3" imp_super_d="$4"
  local total_viva=$((imp_viva_s + imp_viva_d))
  local total_super=$((imp_super_s + imp_super_d))

  if [ "$total_super" -eq 0 ] && [ "$total_viva" -gt 0 ]; then
    echo "PROVAVEL SUPERADA"
  elif [ "$total_super" -gt 0 ] && [ "$total_viva" -gt 0 ]; then
    echo "AMBAS EM USO"
  elif [ "$total_viva" -eq 0 ]; then
    echo "ANOMALIA"
  else
    echo "INVESTIGAR"
  fi
}

echo -e "${CYAN}▸ Vetor 1: Match exato (mesmo nome em core/assets E components)${NC}"
echo ""
printf "  ${BOLD}%-24s │ VIVA   │ SUPER  │ %-20s${NC}\n" "CONCEITO" "STATUS"
printf "  ${BOLD}%-24s │ est+din│ est+din│${NC}\n" ""
echo "  ────────────────────────┼────────┼────────┼─────────────────────"

# ═══ Scan 1: core/ vs components/ ═══
while IFS= read -r dir; do
  echo "$dir" | grep -qE "$EXCLUDE_PATTERN" && continue
  if [ -d "$PUBLIC/components/$dir" ]; then
    read -r vs vd <<< "$(count_importers "core/$dir" "$PUBLIC/core/$dir")"
    read -r ss sd <<< "$(count_importers "components/$dir" "$PUBLIC/components/$dir")"
    status=$(classify "$vs" "$vd" "$ss" "$sd")
    print_row "$dir" "$vs" "$vd" "$ss" "$sd" "$status"
    FOUND=$((FOUND + 1))
    echo "$dir" | grep -qE "$KNOWN_CASES" || NEW_FOUND=$((NEW_FOUND + 1))
  fi
done < <(ls -d "$PUBLIC/core"/*/ 2>/dev/null | sed 's|.*/core/||; s|/$||' | sort)

# ═══ Scan 2: assets/js/core/ vs components/ ═══
while IFS= read -r dir; do
  echo "$dir" | grep -qE "$EXCLUDE_PATTERN" && continue
  if [ -d "$PUBLIC/components/$dir" ]; then
    read -r vs vd <<< "$(count_importers "assets/js/core/$dir" "$PUBLIC/assets/js/core/$dir")"
    read -r ss sd <<< "$(count_importers "components/$dir" "$PUBLIC/components/$dir")"
    status=$(classify "$vs" "$vd" "$ss" "$sd")
    print_row "$dir" "$vs" "$vd" "$ss" "$sd" "$status"
    FOUND=$((FOUND + 1))
    echo "$dir" | grep -qE "$KNOWN_CASES" || NEW_FOUND=$((NEW_FOUND + 1))
  fi
done < <(ls -d "$PUBLIC/assets/js/core"/*/ 2>/dev/null | sed 's|.*/core/||; s|/$||' | sort)

echo ""
echo -e "${CYAN}▸ Vetor 2: Match por raiz (nomes similares, não idênticos)${NC}"
echo ""
printf "  ${BOLD}%-24s │ VIVA   │ SUPER  │ %-20s${NC}\n" "CONCEITO" "STATUS"
printf "  ${BOLD}%-24s │ est+din│ est+din│${NC}\n" ""
echo "  ────────────────────────┼────────┼────────┼─────────────────────"

# ═══ Scan 3: telemetry-core vs telemetry-kernel ═══
if [ -d "$PUBLIC/assets/js/core/telemetry-core" ] && [ -d "$PUBLIC/components/telemetry-kernel" ]; then
  read -r vs vd <<< "$(count_importers "telemetry-core" "$PUBLIC/assets/js/core/telemetry-core")"
  read -r ss sd <<< "$(count_importers "telemetry-kernel" "$PUBLIC/components/telemetry-kernel")"
  status=$(classify "$vs" "$vd" "$ss" "$sd")
  print_row "telemetry-*" "$vs" "$vd" "$ss" "$sd" "$status"
  FOUND=$((FOUND + 1))
fi

# ═══ Scan 4: audit-trail (3 entidades) ═══
if [ -d "$PUBLIC/components/audit-trail" ]; then
  read -r vs vd <<< "$(count_importers "audit-trail.events" "$PUBLIC/core/runtime/events/catalog")"
  read -r ss sd <<< "$(count_importers "components/audit-trail" "$PUBLIC/components/audit-trail")"
  status=$(classify "$vs" "$vd" "$ss" "$sd")
  print_row "audit-trail" "$vs" "$vd" "$ss" "$sd" "$status"
  FOUND=$((FOUND + 1))
fi

# ═══ Scan 5: container-main interno (versões -v2) ═══
CM_UTILS="$PUBLIC/components/main/ui/container-main/utils"
echo ""
echo -e "${CYAN}▸ Vetor 3: Substituições internas (container-main/utils)${NC}"
echo ""
printf "  ${BOLD}%-24s │  V2    │  V1    │ %-20s${NC}\n" "CONCEITO" "STATUS"
printf "  ${BOLD}%-24s │ est+din│ est+din│${NC}\n" ""
echo "  ────────────────────────┼────────┼────────┼─────────────────────"

while IFS= read -r v2; do
  base="${v2%-v2}"
  if [ -e "$CM_UTILS/$base.ts" ] || [ -d "$CM_UTILS/$base" ]; then
    read -r vs vd <<< "$(count_importers "$v2" "$CM_UTILS")"
    read -r ss sd <<< "$(count_importers "utils/$base[^-v]" "$CM_UTILS")"
    status=$(classify "$vs" "$vd" "$ss" "$sd")
    print_row "$base -> $v2" "$vs" "$vd" "$ss" "$sd" "$status"
    FOUND=$((FOUND + 1))
  fi
done < <(ls -d "$CM_UTILS"/*-v2* 2>/dev/null | sed 's|.*/||; s|\.ts$||; s|\.js$||' | sort -u)

# ═══ Resumo ═══
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESUMO"
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Candidatos encontrados: ${BOLD}$FOUND${NC}"
echo -e "  Casos conhecidos (baseline): ${GREEN}5${NC}"
echo -e "  Novos descobertos:           ${YELLOW}$NEW_FOUND${NC}"
echo ""
echo -e "  ${CYAN}Colunas:${NC}"
echo -e "    est = importadores via import estatico (from '...')"
echo -e "    din = importadores via import() dinamico"
echo -e "    VIVA/V2 = versao ativa   SUPER/V1 = versao candidata a superada"
echo ""
echo -e "  ${RED}${BOLD}ARMADILHA CONHECIDA (A8 da auditoria):${NC}"
echo -e "  ${RED}  import() dinamico pode esconder TANTO uso QUANTO desuso.${NC}"
echo -e "  ${RED}  '0+0 SUP' NAO prova morte — pode haver acionamento por${NC}"
echo -e "  ${RED}  registry, factory, banco, ou import() com path calculado.${NC}"
echo -e "  ${RED}  Este script detecta CANDIDATOS. Confirmacao requer${NC}"
echo -e "  ${RED}  verificacao manual. Ver MAPA-SUBSTITUICOES.md.${NC}"
echo "═══════════════════════════════════════════════════════════════"
