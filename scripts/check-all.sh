#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# check-all.sh — Guarda-chuva dos 6 detectores read-only (DShowDash)
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: so ORQUESTRA. Nao reimplementa nem modifica nada.
# Roda, em sequencia, os 6 detectores que ja existem em scripts/ e
# imprime um resumo de 1 linha por detector no fim.
#
# NAO reimplementa logica de detector nenhum. Se um detector mudar,
# este guarda-chuva NAO precisa mudar.
#
# ─ QUANDO RODAR ─────────────────────────────────────────────────
#   * ANTES de um saneamento grande (remover/mover modulos, dedup):
#     fotografa o estado pra comparar depois.
#   * DEPOIS de adicionar painel/subsistema novo: pega substituicao
#     incompleta, .js orfao e evento sem par recem-introduzidos.
#   * PERIODICAMENTE (rotina): pega regressao silenciosa. O exit code
#     do --strict (orphan) torna "saiu 0 = nada novo" confiavel.
#
# ─ DETECTORES (forma de chamada fixada) ─────────────────────────
#   1 detect-substitutions.sh            (simples)
#   2 detect-orphan-js.sh    --strict    -> exit 1 = orfao suspeito (baseline=0)
#   3 inventory-eventbus.sh              (simples; corte em 30, use --full a mao)
#   4 map-dependencies.sh                (simples)
#   5 detect-cachebust-drift.sh          -> exit 1 = bundle mudou sem bumpar ?v=
#   6 detect-schema-drift.sh             -> exit 1 = SQL cita tabela/coluna inexistente
#     (passivo conhecido congelado em .schema-drift-baseline.txt; achado novo = regressao)
#   7 detect-circular-build.sh           -> exit 1 = alvo de build novo alimentando-se
#     do proprio dist (correcao na fonte nao chega ao browser). 17 alvos no baseline.
#
# ─ EXIT CODE DO GUARDA-CHUVA (p/ cron/CI futuro) ────────────────
#   0 = tudo OK       (todos executaram e sairam 0)
#   1 = houve ACHADO  (orphan --strict saiu 1 = regressao real)
#   2 = houve ERRO    (algum detector crashou) — tem PRIORIDADE sobre 1
#
# Uso: bash /var/www/dshowdash/scripts/check-all.sh
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPTS="/var/www/dshowdash/scripts"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

SUMMARY=""        # resumo acumulado (1 linha por detector)
FINAL_RC=0

# bump_final <rc> — ERRO(2) > ACHADO(1) > OK(0)
bump_final() {
  local rc="$1"
  [ "$rc" -gt "$FINAL_RC" ] && FINAL_RC="$rc"
  return 0
}

# run_simple <titulo> <script> — exit!=0 = ERRO (esses detectores saem 0 por design)
run_simple() {
  local titulo="$1" script="$2" rc
  echo ""
  echo -e "${CYAN}${BOLD}═══ $titulo ═══${NC}"
  if [ ! -f "$SCRIPTS/$script" ]; then
    echo -e "${RED}  (nao encontrado: $SCRIPTS/$script)${NC}"
    SUMMARY="${SUMMARY}  ${RED}ERRO${NC}   $titulo (arquivo nao encontrado)\n"
    bump_final 2; return 0
  fi
  bash "$SCRIPTS/$script"; rc=$?
  if [ "$rc" -eq 0 ]; then
    SUMMARY="${SUMMARY}  ${GREEN}OK${NC}     $titulo\n"
  else
    SUMMARY="${SUMMARY}  ${RED}ERRO${NC}   $titulo (exit $rc)\n"
    bump_final 2
  fi
  return 0
}

# run_strict <titulo> <script> — exit 0=OK, 1=ACHADO, outro=ERRO
run_strict() {
  local titulo="$1" script="$2" rc
  echo ""
  echo -e "${CYAN}${BOLD}═══ $titulo ═══${NC}"
  if [ ! -f "$SCRIPTS/$script" ]; then
    echo -e "${RED}  (nao encontrado: $SCRIPTS/$script)${NC}"
    SUMMARY="${SUMMARY}  ${RED}ERRO${NC}   $titulo (arquivo nao encontrado)\n"
    bump_final 2; return 0
  fi
  bash "$SCRIPTS/$script" --strict; rc=$?
  if [ "$rc" -eq 0 ]; then
    SUMMARY="${SUMMARY}  ${GREEN}OK${NC}     $titulo\n"
  elif [ "$rc" -eq 1 ]; then
    SUMMARY="${SUMMARY}  ${YELLOW}ACHADO${NC} $titulo (exit 1 do --strict: orfao suspeito > baseline 0)\n"
    bump_final 1
  else
    SUMMARY="${SUMMARY}  ${RED}ERRO${NC}   $titulo (exit $rc)\n"
    bump_final 2
  fi
  return 0
}

echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — check-all: guarda-chuva dos 6 detectores read-only"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  READ-ONLY: so orquestra; nenhum arquivo de producao e tocado"
echo "═══════════════════════════════════════════════════════════════"

run_simple "DETECTOR 1/7: substituicoes incompletas"  "detect-substitutions.sh"
run_strict "DETECTOR 2/7: .js orfao (--strict)"        "detect-orphan-js.sh"
run_simple "DETECTOR 3/7: inventario EventBus"         "inventory-eventbus.sh"
run_simple "DETECTOR 4/7: mapa de dependencias"        "map-dependencies.sh"
run_strict "DETECTOR 5/7: drift de cache-bust (?v=)"   "detect-cachebust-drift.sh"
run_strict "DETECTOR 6/7: drift de schema (SQL x banco)" "detect-schema-drift.sh"
run_strict "DETECTOR 7/7: cadeia de build circular"    "detect-circular-build.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${BOLD}RESUMO — 1 linha por detector${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo -e "$SUMMARY"
echo "  Legenda: OK=executou e saiu 0 | ACHADO=orfao suspeito (regressao) | ERRO=crashou"
echo "  Exit code final: $FINAL_RC  (0=tudo OK, 1=achado, 2=erro)"
echo "═══════════════════════════════════════════════════════════════"

exit "$FINAL_RC"
