#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# detect-orphan-js.sh — Detecta .js ORFAO (sem .ts irmao) em producao
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: apenas analisa, NUNCA modifica arquivos.
# Operacionaliza a POLITICA-TYPESCRIPT.md.
# Complementa (nao duplica) RASTREABILIDADE-BUILD.md.
#
# Classifica todo .js sem .ts irmao em 3 baldes:
#   bundle-dist      -> artefato de build (/dist/ ou *.bundle.js)
#   excecao-conhecida-> .js legitimo por design (test/config/vendor/sw/generated)
#   orfao-suspeito   -> NAO casa nenhuma excecao = investigar (fonte .js manual?)
#
# Baseline 2026-06-01: 10 excecao-conhecida, 0 orfao-suspeito.
#
# Uso:
#   bash /var/www/dshowdash/scripts/detect-orphan-js.sh          # tabela
#   bash /var/www/dshowdash/scripts/detect-orphan-js.sh --strict # exit 1 se houver suspeito
#
# Nota (armadilha A8): este detector olha SO existencia de .ts irmao.
#   NAO mede uso. import() dinamico nao afeta (a questao e FONTE, nao USO).
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

PUBLIC="/var/www/dshowdash/public"
ALLOWLIST="/var/www/dshowdash/scripts/.orphan-js-allowlist.txt"
STRICT=0
[ "${1:-}" = "--strict" ] && STRICT=1

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ═══ Classificador (apenas por PATH — nunca le conteudo) ═══
# Ecoa: "BUNDLE-DIST" | "<CATEGORIA-EXCECAO>" | "SUSPEITO"
classify() {
  local p="$1"
  case "$p" in
    */dist/*|*.bundle.js)                                   echo "BUNDLE-DIST" ;;
    *.test.js|*.spec.js|*/__tests__/*|*/tests/*)            echo "TEST" ;;
    */vite.*.js|*.config.js)                                echo "BUILD-CONFIG" ;;
    */libs/*|*/lib/*|*/vendor/*|*.min.js|*third-party*|*polyfill*) echo "VENDOR/LIB" ;;
    */sw.js|*service-worker.js|*.worker.js)                 echo "SERVICE-WORKER" ;;
    *-generated.js)                                         echo "GENERATED" ;;
    *)                                                      echo "SUSPEITO" ;;
  esac
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Detector de .js ORFAO (sem .ts irmao)"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  READ-ONLY: nenhum arquivo sera modificado"
echo "═══════════════════════════════════════════════════════════════"

# ═══ Coleta: todo .js (excl node_modules) sem .ts irmao ═══
TMP_ORPH="$(mktemp)"
trap 'rm -f "$TMP_ORPH"' EXIT

find "$PUBLIC" -type f -name '*.js' ! -path '*/node_modules/*' 2>/dev/null \
  | while IFS= read -r js; do
      [ -f "${js%.js}.ts" ] || printf '%s\n' "$js"
    done | sort > "$TMP_ORPH"

TOTAL_JS=$(find "$PUBLIC" -type f -name '*.js' ! -path '*/node_modules/*' 2>/dev/null | wc -l)
TOTAL_TS=$(find "$PUBLIC" -type f -name '*.ts' ! -name '*.d.ts' ! -path '*/node_modules/*' 2>/dev/null | wc -l)
TOTAL_ORPH=$(wc -l < "$TMP_ORPH")

# ═══ Classifica e separa ═══
SUSP="$(mktemp)"; EXC="$(mktemp)"; BND="$(mktemp)"
trap 'rm -f "$TMP_ORPH" "$SUSP" "$EXC" "$BND"' EXIT
while IFS= read -r p; do
  [ -n "$p" ] || continue
  cat=$(classify "$p")
  rel="${p#$PUBLIC/}"
  # Fonte .js manual JA REGISTRADA com evidencia (POLITICA-TYPESCRIPT.md sec.4).
  # Lista de caminhos EXATOS, de proposito: um .js novo continua caindo em SUSPEITO.
  if [ "$cat" = "SUSPEITO" ] && [ -f "$ALLOWLIST" ] \
     && grep -qxF "$rel" "$ALLOWLIST" 2>/dev/null; then
    cat="FONTE-JS-REGISTRADA"
  fi
  case "$cat" in
    BUNDLE-DIST) printf '%s\t%s\n' "$cat" "$rel" >> "$BND" ;;
    SUSPEITO)    printf '%s\t%s\n' "$cat" "$rel" >> "$SUSP" ;;
    *)           printf '%s\t%s\n' "$cat" "$rel" >> "$EXC" ;;
  esac
done < "$TMP_ORPH"

N_SUSP=$(wc -l < "$SUSP"); N_EXC=$(wc -l < "$EXC"); N_BND=$(wc -l < "$BND")

# ═══ Relatorio ═══
echo ""
echo -e "${CYAN}▸ Contexto${NC}"
printf "  .js (excl node_modules): %s   |   .ts: %s   |   .js orfaos: %s\n" \
  "$TOTAL_JS" "$TOTAL_TS" "$TOTAL_ORPH"

echo ""
echo -e "${CYAN}▸ excecao-conhecida (.js legitimo por design) — ${N_EXC}${NC}"
if [ "$N_EXC" -gt 0 ]; then
  sort "$EXC" | while IFS=$'\t' read -r c r; do
    printf "  ${GREEN}%-15s${NC} %s\n" "$c" "$r"
  done
fi

echo ""
echo -e "${CYAN}▸ bundle-dist (artefato de build) — ${N_BND}${NC}"
if [ "$N_BND" -gt 0 ]; then
  sort "$BND" | while IFS=$'\t' read -r c r; do
    printf "  ${YELLOW}%-15s${NC} %s\n" "$c" "$r"
  done
fi

echo ""
if [ "$N_SUSP" -gt 0 ]; then
  echo -e "${RED}${BOLD}▸ orfao-suspeito (.js SEM .ts e SEM excecao) — ${N_SUSP}${NC}"
  echo -e "  ${RED}Investigar: pode ser FONTE .js MANUAL (excecao a registrar no${NC}"
  echo -e "  ${RED}RASTREABILIDADE) ou divida a migrar. NAO editar sem investigar.${NC}"
  sort "$SUSP" | while IFS=$'\t' read -r c r; do
    printf "  ${RED}%-15s${NC} %s\n" "$c" "$r"
  done
else
  echo -e "${GREEN}${BOLD}▸ orfao-suspeito — 0  (premissa RASTREABILIDADE mantida)${NC}"
fi

# ═══ Resumo ═══
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESUMO"
echo "═══════════════════════════════════════════════════════════════"
printf "  excecao-conhecida : %s\n" "$N_EXC"
printf "  bundle-dist       : %s\n" "$N_BND"
printf "  orfao-suspeito    : %s\n" "$N_SUSP"
echo ""
echo -e "  ${BOLD}Regra:${NC} suspeito > 0 = achado a investigar (ver POLITICA-TYPESCRIPT.md sec.4)."
echo -e "  Esperado no baseline 2026-06-01: ${GREEN}0 suspeitos${NC}."
echo "═══════════════════════════════════════════════════════════════"

if [ "$STRICT" -eq 1 ] && [ "$N_SUSP" -gt 0 ]; then
  exit 1
fi
exit 0
