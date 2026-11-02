#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# inventory-eventbus.sh — Mapa de eventos emitidos/consumidos no EventBus
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: apenas analisa, NUNCA modifica arquivos.
#
# Gera: catalogos | emits | listeners | eventos sem consumidor |
#       listeners sem emissao — TUDO como PISTA, nao veredito (ver A8).
#
# ESCOPO (decisoes da FASE 6, baseadas em diagnostico+amostragem):
#  - GLOBAL EventBus = `eventBus.emit/on/once/subscribe` e `EventBus.emit/on`.
#  - `.dispatch(` EXCLUIDO (e Store/globalState dispatch, nao o EventBus).
#  - `bus.emit/on` = buses LOCAIS de componente -> seccao 7, FORA do matching.
#  - Identidade do evento p/ matching = o TOKEN textual do 1o argumento
#    (ex: UI_EVENTS.PANEL_OPEN). emit e on usam a MESMA constante -> casam por token.
#    (As strings reais vivem no events-catalog.bundle.js; o token e a identidade estavel.)
#  - Extracao por OCORRENCIA (grep -oE), nao por linha: captura MULTIPLAS chamadas
#    na mesma linha (arquivos prototype poem varias .emit/.on numa linha so).
#    LIMITE conhecido: chamada MULTILINHA (`emit(\n TOKEN,`) tem o arg na linha
#    seguinte e nao e tokenizada (contada como ocorrencia, mas sem token). Hoje: 3 emit + 1 listen.
#  - Analise so de .ts FONTE (exclui .js irmao, dist, node_modules).
#
# NOTA DE NAMESPACE (achado FASE 6, nao resolvido — registrado p/ nao virar misterio):
#   Ha DUAS convencoes de nome de evento: 'a:b:c' (dois-pontos) e 'a.b.c' (ponto).
#   core/runtime/events/catalog/system.events.ts MAPEIA entre elas
#   (ex: "auth:logout:success" -> "auth.logout.success"). Isso AMPLIFICA o A8: um
#   emit por string numa convencao nao casa um listener por constante na outra.
#
# >>> ARMADILHA A8 — matching textual NAO prova uso nem desuso. <<<
#   MEDIDO (amostragem n=8, JA com o tokenizer corrigido): 2 falso-positivo
#   confirmados + 2 incertos -> ~1/4 a 1/2 dos "sem consumidor"/"sem emissao"
#   sao ruido, por DOIS mecanismos inerentes:
#     (1) emit/listen por STRING literal  (ex: _emit('panel.open'))
#     (2) emit DINAMICO / sobre array     (ex: AuthAdapter itera ['auth:logout:success',...])
#   (um 3o mecanismo — tokenizer guloso perdendo 1a de 2 chamadas/linha — era BUG
#    e foi CORRIGIDO nesta versao; provado removendo LAYOUT_EVENTS.REQUEST dos falsos.)
#   => Seccoes 4 e 5 sao PISTAS COM RUIDO ALTO, nao lista de candidatos confiaveis.
#   Antes de tratar QUALQUER token como morto, confirme os 3 mecanismos por leitura:
#     constante com ALIAS diferente | STRING literal | emit DINAMICO/array.
#
# Uso:
#   bash /var/www/dshowdash/scripts/inventory-eventbus.sh           # tabela
#   bash /var/www/dshowdash/scripts/inventory-eventbus.sh --full    # + listas completas
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

PUBLIC="/var/www/dshowdash/public"
CATDIR="$PUBLIC/core/runtime/events/catalog"
FULL=0
[ "${1:-}" = "--full" ] && FULL=1

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

TS_LIST=$(mktemp)
EMIT_ARGS=$(mktemp); LISTEN_ARGS=$(mktemp)
EMIT_TOK=$(mktemp); LISTEN_TOK=$(mktemp)
EMIT_DYN=$(mktemp); LISTEN_DYN=$(mktemp)
trap 'rm -f "$TS_LIST" "$EMIT_ARGS" "$LISTEN_ARGS" "$EMIT_TOK" "$LISTEN_TOK" "$EMIT_DYN" "$LISTEN_DYN"' EXIT

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Inventario do EventBus (global)"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  READ-ONLY: nenhum arquivo sera modificado"
echo "═══════════════════════════════════════════════════════════════"

find "$PUBLIC" -type f -name '*.ts' ! -name '*.d.ts' ! -path '*/node_modules/*' ! -path '*/dist/*' > "$TS_LIST"
N_TS=$(wc -l < "$TS_LIST")

classify_token() {
  case "$1" in
    \'*|\"*)            echo "STRING" ;;
    [A-Z][A-Z0-9_]*.*)  echo "CONST"  ;;   # CATALOG_EVENTS.KEY
    *)                  echo "DYN"    ;;   # variavel/expr (event, eventName, getX(), ...)
  esac
}

# Extracao por OCORRENCIA: [^,)]* pega o 1o arg de CADA chamada (multiplas/linha).
# Inclui linhas vazias (chamada multilinha com arg na linha seguinte).
grep -Eoh '(eventBus|EventBus)\.emit\([^,)]*'                $(cat "$TS_LIST") 2>/dev/null \
  | sed -E 's/.*\.emit\([[:space:]]*//; s/[[:space:]]+$//' > "$EMIT_ARGS" || true
grep -Eoh '(eventBus|EventBus)\.(on|once|subscribe)\([^,)]*' $(cat "$TS_LIST") 2>/dev/null \
  | sed -E 's/.*\.(on|once|subscribe)\([[:space:]]*//; s/[[:space:]]+$//' > "$LISTEN_ARGS" || true

N_EMIT=$(wc -l < "$EMIT_ARGS")                       # ocorrencias totais
N_EMIT_ML=$(grep -c '^$' "$EMIT_ARGS" || true)       # multilinha (sem token)
N_LISTEN=$(wc -l < "$LISTEN_ARGS")
N_LISTEN_ML=$(grep -c '^$' "$LISTEN_ARGS" || true)

split_tokens() {
  local args="$1" tokout="$2" dynout="$3"; : > "$tokout"; : > "$dynout"
  while IFS= read -r arg; do
    [ -n "$arg" ] || continue
    if [ "$(classify_token "$arg")" = "DYN" ]; then
      printf '%s\n' "$arg" >> "$dynout"
    else
      local norm="$arg"
      case "$arg" in \'*|\"*) norm=$(printf '%s' "$arg" | sed -E "s/^['\"]//; s/['\"].*$//") ;; esac
      printf '%s\n' "$norm" >> "$tokout"
    fi
  done < "$args"
}
split_tokens "$EMIT_ARGS" "$EMIT_TOK" "$EMIT_DYN"
split_tokens "$LISTEN_ARGS" "$LISTEN_TOK" "$LISTEN_DYN"

N_EMIT_DYN=$(grep -c . "$EMIT_DYN" || true)
N_LISTEN_DYN=$(grep -c . "$LISTEN_DYN" || true)
sort -u "$EMIT_TOK" -o "$EMIT_TOK"; sort -u "$LISTEN_TOK" -o "$LISTEN_TOK"
N_EMIT_TOK=$(grep -c . "$EMIT_TOK" || true)
N_LISTEN_TOK=$(grep -c . "$LISTEN_TOK" || true)

NO_CONSUMER=$(comm -23 "$EMIT_TOK" "$LISTEN_TOK")
NO_EMITTER=$(comm -13 "$EMIT_TOK" "$LISTEN_TOK")
N_NO_CONSUMER=$(printf '%s\n' "$NO_CONSUMER" | grep -c . || true)
N_NO_EMITTER=$(printf '%s\n' "$NO_EMITTER" | grep -c . || true)

N_BUS_LOCAL=$(grep -El '[^A-Za-z]bus\.(emit|on|once)\(' $(cat "$TS_LIST") 2>/dev/null | wc -l)

# ═══════════════════ RELATORIO ═══════════════════
echo ""
echo -e "${CYAN}▸ 1. CATALOGOS DE EVENTOS${NC}"
N_CAT=$(find "$CATDIR" -maxdepth 1 -type f -name '*.events.ts' 2>/dev/null | wc -l)
echo "    catalogo: core/runtime/events/catalog/"
echo "    *.events.ts: $N_CAT  (+ _entry.ts)   — todos re-export de dist/events-catalog.bundle.js"
echo "    .ts fonte analisados (todo o public): $N_TS"

echo ""
echo -e "${CYAN}▸ 2. EMITS (global: eventBus./EventBus.emit) — ${N_EMIT} ocorrencias, ${N_EMIT_TOK} tokens unicos${NC}"
echo "    ($((N_EMIT-N_EMIT_ML)) com arg inline + ${N_EMIT_ML} multilinha nao-tokenizado;"
echo "     .dispatch( excluido = Store/state; bus.emit( = local, ver seccao 7)"
echo "    tokens emitidos (top 20 por frequencia):"
grep -v '^$' "$EMIT_ARGS" | sort | uniq -c | sort -rn | head -20 | sed 's/^/      /'

echo ""
echo -e "${CYAN}▸ 3. LISTENERS (global: eventBus.on/once/subscribe) — ${N_LISTEN} ocorrencias, ${N_LISTEN_TOK} tokens unicos${NC}"
echo "    ($((N_LISTEN-N_LISTEN_ML)) com arg inline + ${N_LISTEN_ML} multilinha nao-tokenizado)"
echo "    tokens escutados (top 20 por frequencia):"
grep -v '^$' "$LISTEN_ARGS" | sort | uniq -c | sort -rn | head -20 | sed 's/^/      /'

echo ""
echo -e "${YELLOW}${BOLD}▸ 4. EVENTOS SEM CONSUMIDOR — ${N_NO_CONSUMER} tokens (PISTA, RUIDO ALTO)${NC}"
echo -e "    ${YELLOW}emitido, nenhum listener com o MESMO token. ~1/4 a 1/2 sao falso-positivo (A8).${NC}"
if [ "$FULL" -eq 1 ]; then
  printf '%s\n' "$NO_CONSUMER" | grep . | sed 's/^/      /' || true
else
  printf '%s\n' "$NO_CONSUMER" | grep . | head -30 | sed 's/^/      /' || true
  [ "$N_NO_CONSUMER" -gt 30 ] && echo "      ... (+$((N_NO_CONSUMER-30)); use --full)"
fi

echo ""
echo -e "${YELLOW}${BOLD}▸ 5. LISTENERS SEM EMISSAO — ${N_NO_EMITTER} tokens (PISTA, RUIDO ALTO)${NC}"
echo -e "    ${YELLOW}escutado, nenhum emit com o MESMO token. Pode vir de emit DINAMICO${NC}"
echo -e "    ${YELLOW}(seccao 6), STRING literal, registry ou banco. ~1/4 a 1/2 falso-positivo (A8).${NC}"
if [ "$FULL" -eq 1 ]; then
  printf '%s\n' "$NO_EMITTER" | grep . | sed 's/^/      /' || true
else
  printf '%s\n' "$NO_EMITTER" | grep . | head -30 | sed 's/^/      /' || true
  [ "$N_NO_EMITTER" -gt 30 ] && echo "      ... (+$((N_NO_EMITTER-30)); use --full)"
fi

echo ""
echo -e "${RED}${BOLD}▸ 6. ZONA A8 — emissao/escuta DINAMICA (nome em variavel, OPACO ao grep)${NC}"
echo -e "    ${RED}emits dinamicos: ${N_EMIT_DYN}   listens dinamicos: ${N_LISTEN_DYN}${NC}"
echo "    variaveis usadas como nome de evento (top):"
cat "$EMIT_DYN" "$LISTEN_DYN" | sort | uniq -c | sort -rn | head -10 | sed 's/^/      /'
echo -e "    ${RED}>> CADA token aqui pode emitir/escutar QUALQUER evento em runtime.${NC}"

echo ""
echo -e "${CYAN}▸ 7. BUSES via 'bus.' (provavel LOCAL de componente) — ${N_BUS_LOCAL} arquivos${NC}"
echo "    Em geral bus interno proprio (footer/header/ticker/panel-16/panel-orchestrator)."
echo -e "    ${YELLOW}DUVIDA SINALIZADA: alguns 'bus' podem ser ALIAS do EventBus global${NC}"
echo -e "    ${YELLOW}(ex: const bus = getEventBus()). Se for, seus eventos faltam nas sec. 2-5.${NC}"
echo "    Arquivos (confirmar caso a caso):"
grep -El '[^A-Za-z]bus\.(emit|on|once)\(' $(cat "$TS_LIST") 2>/dev/null \
  | sed "s#$PUBLIC/##" | sort -u | head -20 | sed 's/^/      /' || true

# ═══════════════════ RESUMO ═══════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESUMO"
echo "═══════════════════════════════════════════════════════════════"
printf "  Catalogos (*.events.ts)............: %s\n" "$N_CAT"
printf "  Emits globais (ocorrencias)........: %s  (%s tokens unicos + %s dinamicos + %s multilinha)\n" "$N_EMIT" "$N_EMIT_TOK" "$N_EMIT_DYN" "$N_EMIT_ML"
printf "  Listeners globais (ocorrencias)....: %s  (%s tokens unicos + %s dinamicos + %s multilinha)\n" "$N_LISTEN" "$N_LISTEN_TOK" "$N_LISTEN_DYN" "$N_LISTEN_ML"
printf "  Eventos sem consumidor (PISTA).....: %s\n" "$N_NO_CONSUMER"
printf "  Listeners sem emissao (PISTA)......: %s\n" "$N_NO_EMITTER"
printf "  Arquivos com bus local.............: %s\n" "$N_BUS_LOCAL"
echo ""
echo -e "  ${RED}${BOLD}A8 (medido, n=8):${NC} ~1/4 a 1/2 das sec.4/5 sao falso-positivo por"
echo -e "  STRING literal + emit DINAMICO (tokenizer-bug ja corrigido). Sao PISTAS, nao \"mortos\"."
echo -e "  Confirme por leitura: constante-com-alias | string-literal | emit-dinamico/array."
echo -e "  Ver tambem nota de NAMESPACE (':' vs '.') no topo do script."
echo "═══════════════════════════════════════════════════════════════"
exit 0
