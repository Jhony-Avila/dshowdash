#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# map-dependencies.sh — Mapa de dependencias entre subsistemas (FASE 7)
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: apenas analisa, NUNCA modifica arquivos.
#
# Produz DOIS mapas, deliberadamente separados:
#   (1) MATRIZ DE IMPORT ESTATICO .ts->.ts  — acoplamento FORTE/direto (SOLIDO)
#   (2) OVERLAY EVENTBUS (emit->listen)      — acoplamento FRACO/indireto (FUZZY, A8)
#
# ─ FRONTEIRAS (aprovadas FASE 7, decisoes A/B/C/D) — subsistema -> path(s):
#   1 BST Bootstrap       bootstrap-v2/
#   2 CRT Core Runtime    core/runtime/ (EXCETO events/) + core/kernel/
#   3 EVB EventBus        core/js/event-bus/ + core/runtime/events/
#   4 RTR Router          app/router/ (entrypoint) + components/router/ (impl)   [uniao, A]
#   5 PLD Panel Loader    components/main/adapters/panel-loader/ + components/main/ports/PanelPort
#   6 WSE Workspace Eng.  components/main/ui/container-main/                       [SO isto, D]
#   7 API APIs            assets/js/core/api-client/                              [SO cliente HTTP, C]
#   8 AUT Auth            core/auth/
#   9 MFE Platform        platform/                                              [MFE nunca plugado]
#  10 MNH main-host/glue  components/main/ restante (core/domain/kernel/api)     [bucket separado, D]
#
# ─ HONESTIDADE — a matriz de import e PISO, NAO verdade completa. NAO mede:
#   * import() DINAMICO (esconde uso; ex: wire-content import('../theme-manager-v2.js'))
#   * EVENTBUS (medido a parte no overlay, e mesmo assim FUZZY por identidade de token)
#   * DI / ports (resolvido em runtime) ; banco
#   * endpoints PHP /api/ e os 54 api.ts de painel (fora da matriz .ts->.ts; decisao C)
#   * imports RELATIVOS (./ ../) tratados como internos (98% dos imports sao absolutos)
#   * core/kernel: 0 importadores estaticos mas ENTRA no boot via bundle
#     (ausencia de import != ausencia de uso — armadilha recorrente desta jornada)
#
# ─ CLASSIFICACAO (cortes ARBITRARIOS — convencao, NAO lei):
#   0 = independente | 1-5 = fraco | 6-20 = medio | 21+ = forte
#
# Uso: bash /var/www/dshowdash/scripts/map-dependencies.sh
# ═══════════════════════════════════════════════════════════════

set -uo pipefail
PUBLIC="/var/www/dshowdash/public"

TS_LIST=$(mktemp); AWKLIB=$(mktemp)
EDGES=$(mktemp); EMIT_BT=$(mktemp); LISTEN_BT=$(mktemp); EV_EDGES=$(mktemp)
trap 'rm -f "$TS_LIST" "$AWKLIB" "$EDGES" "$EMIT_BT" "$LISTEN_BT" "$EV_EDGES"' EXIT

find "$PUBLIC" -type f -name '*.ts' ! -name '*.d.ts' ! -path '*/node_modules/*' ! -path '*/dist/*' > "$TS_LIST"
N_TS=$(wc -l < "$TS_LIST")

# ── awk lib: bucket() + parser (quotes via octal \047 p/ evitar conflito de shell) ──
cat > "$AWKLIB" <<'AWK'
function bucket(p) {
  if (p ~ /\/core\/runtime\/events\//)                    return "EVB"
  if (p ~ /\/core\/js\/event-bus\//)                      return "EVB"
  if (p ~ /\/bootstrap-v2\//)                             return "BST"
  if (p ~ /\/core\/runtime\//)                            return "CRT"
  if (p ~ /\/core\/kernel\//)                             return "CRT"
  if (p ~ /\/app\/router\//)                              return "RTR"
  if (p ~ /\/components\/router\//)                       return "RTR"
  if (p ~ /\/components\/main\/adapters\/panel-loader\//) return "PLD"
  if (p ~ /\/components\/main\/ports\/PanelPort/)         return "PLD"
  if (p ~ /\/components\/main\/ui\/container-main\//)      return "WSE"
  if (p ~ /\/assets\/js\/core\/api-client\//)             return "API"
  if (p ~ /\/core\/auth\//)                               return "AUT"
  if (p ~ /\/platform\//)                                 return "MFE"
  if (p ~ /\/components\/main\//)                          return "MNH"
  return ""
}
{
  ci = index($0, ":"); if (ci==0) next
  file = substr($0, 1, ci-1); m = substr($0, ci+1)
  if (mode == "import") {
    if (!match(m, /[\047"]/)) next
    rest = substr(m, RSTART+1)
    if (match(rest, /[\047"]/)) arg = substr(rest, 1, RSTART-1); else arg = rest
    sb = bucket(file); tb = bucket(arg)
    if (sb!="" && tb!="" && sb!=tb) print sb" "tb
  } else {
    pi = index(m, "("); if (pi==0) next
    tok = substr(m, pi+1); gsub(/^[ \t]+/,"",tok); gsub(/[ \t]+$/,"",tok)
    if (tok=="") next
    if (tok !~ /^[A-Z\047"]/) next      # so CONST/STRING; ignora token dinamico (minuscula)
    b = bucket(file); if (b=="") b="OUT"
    print tok" "b
  }
}
AWK

# ════════════ (1) MATRIZ DE IMPORT ESTATICO ════════════
grep -EHo "from[[:space:]]*['\"][^'\"]+['\"]|import[[:space:]]+['\"][^'\"]+['\"]" $(cat "$TS_LIST") 2>/dev/null \
  | awk -v mode=import -f "$AWKLIB" | sort | uniq -c | sort -rn > "$EDGES" || true
N_EDGES=$(grep -c . "$EDGES" || true)
N_DYN=$(grep -Eoh "import\([[:space:]]*['\"][^'\"]+['\"]" $(cat "$TS_LIST") 2>/dev/null | wc -l)

# ════════════ (2) OVERLAY EVENTBUS (fuzzy) ════════════
grep -EHo "(eventBus|EventBus)\.emit\([^,)]*"                $(cat "$TS_LIST") 2>/dev/null \
  | awk -v mode=event -f "$AWKLIB" | sort -u > "$EMIT_BT" || true
grep -EHo "(eventBus|EventBus)\.(on|once|subscribe)\([^,)]*" $(cat "$TS_LIST") 2>/dev/null \
  | awk -v mode=event -f "$AWKLIB" | sort -u > "$LISTEN_BT" || true
# join por token (campo 1): emit_bucket x listen_bucket
join -1 1 -2 1 <(sort "$EMIT_BT") <(sort "$LISTEN_BT") 2>/dev/null \
  | awk '{ if ($2!=$3) print $2" -> "$3 }' | sort | uniq -c | sort -rn > "$EV_EDGES" || true

# ════════════ RENDER ════════════
ORDER="BST CRT EVB RTR PLD WSE API AUT MFE MNH"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Mapa de Dependencias entre Subsistemas (FASE 7)"
echo "  $(date '+%Y-%m-%d %H:%M:%S')   READ-ONLY"
echo "═══════════════════════════════════════════════════════════════"
echo "  .ts fonte analisados: $N_TS"
echo "  Codigos: BST=Bootstrap CRT=CoreRuntime EVB=EventBus RTR=Router"
echo "           PLD=PanelLoader WSE=WorkspaceEngine API=APIs(cliente HTTP)"
echo "           AUT=Auth MFE=Platform/MFE  MNH=main-host/glue(nao e 1 dos 9)"

echo ""
echo "▸ (1) MATRIZ DE IMPORT ESTATICO  (linha IMPORTA coluna; acoplamento FORTE)"
echo "      arestas inter-subsistema: $N_EDGES  |  cortes: 0 indep / 1-5 fraco / 6-20 medio / 21+ forte (ARBITRARIO)"
echo ""
awk -v order="$ORDER" '
  { m[$2" "$3]=$1 }   # $1=count $2=src $3=tgt
  END{
    n=split(order,O," ")
    printf "        "; for(j=1;j<=n;j++) printf "%5s", O[j]; printf "   = IMPORTA->\n"
    for(i=1;i<=n;i++){
      printf "  %-5s ", O[i]
      for(j=1;j<=n;j++){
        if(i==j){ printf "    ." ; continue }
        v=m[O[i]" "O[j]]+0; printf "%5d", v
      }
      printf "\n"
    }
  }' "$EDGES"

echo ""
echo "▸ Grau por subsistema (out=importa / in=e importado):"
awk -v order="$ORDER" '
  { out[$2]+=$1; inn[$3]+=$1 }
  END{ n=split(order,O," ");
    for(i=1;i<=n;i++) printf "    %-5s  out=%-4d in=%-4d\n", O[i], out[O[i]]+0, inn[O[i]]+0 }
' "$EDGES"

echo ""
echo "▸ (2) OVERLAY EVENTBUS  (emit -> listen; acoplamento FRACO; FUZZY/A8)"
echo "      >> identidade por TOKEN de constante (string das FASE 6 vive no bundle);"
echo "      >> ignora emit/listen DINAMICO (nome em variavel); OUT = fora dos 10 buckets."
echo "      pares (top 25):"
head -25 "$EV_EDGES" | sed 's/^/      /'
[ "$(grep -c . "$EV_EDGES")" -gt 25 ] && echo "      ... (+$(( $(grep -c . "$EV_EDGES") - 25 )) pares)"
echo ""
echo "      atividade de evento por bucket (tokens CONST distintos; conta mesmo sem par):"
echo "        bucket  emit  listen"
for b in $ORDER OUT; do
  e=$(awk -v b="$b" '$2==b' "$EMIT_BT" | wc -l)
  l=$(awk -v b="$b" '$2==b' "$LISTEN_BT" | wc -l)
  printf "        %-6s  %4d  %4d\n" "$b" "$e" "$l"
done
echo "      >> ESPARSIDADE dos pares e ESPERADA: maior parte do trafego e OUT<->OUT"
echo "      >> (paineis/shell, descartado aqui) ou token DINAMICO (filtrado). Os 9 subsistemas"
echo "      >> centrais conversam pouco por evento-CONST entre si — o import ja cobre o forte."

echo ""
echo "▸ PISO (o que a matriz de import NAO captura):"
echo "    import() dinamico (literal): $N_DYN ocorrencias — escondem dependencia (A8)"
echo "    + DI/ports, EventBus (ver overlay), banco, PHP /api/, 54 api.ts de painel (decisao C)"
echo "═══════════════════════════════════════════════════════════════"

cp "$EDGES" /tmp/fase7-edges.tsv 2>/dev/null || true
cp "$EV_EDGES" /tmp/fase7-ev-edges.txt 2>/dev/null || true
exit 0
