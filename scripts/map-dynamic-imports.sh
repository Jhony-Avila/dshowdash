#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# map-dynamic-imports.sh — Mapa classificado dos import() dinamicos (DShowDash)
# ═══════════════════════════════════════════════════════════════
# READ-ONLY: apenas analisa, NUNCA modifica arquivos.
#
# Transforma a ressalva da FASE 7 ("507 import() dinamicos nao-resolvidos")
# numa CLASSIFICACAO honesta — porque import dinamico e, por definicao, o que
# a analise estatica nao resolve 100%. O resultado e a % de cada classe:
#   LITERAL   import('fixo.js')      — resolvivel: alvo + bucket origem->destino
#   CONCAT    import('a'+x)          — string + expressao (parcial)
#   TEMPLATE  import(`${v}/x.js`)    — crase (parcial; padrao enumeravel)
#   OPAQUE    import(varPath)        — path so existe em runtime (irresolvivel estatico)
#
# DESCARTES VISIVEIS (NAO sao import() ES; contados a parte, nunca somados ao acoplamento):
#   methoddef  metodo nomeado `import(...) {`   (ex: snapshot import(jsonStr: string))
#   call       chamada `.import(...)`           (ex: registry.import(data, options))
#   comment    `import()` citado em comentario/JSDoc
#   boundary   precedido por identificador      (ex: reimport())
#
# DEFINICAO ANCORA (identica a map-dependencies.sh L91 — p/ os numeros baterem):
#   import( seguido de ASPA  ==  os "507" da FASE 7  ==  LITERAL+CONCAT aqui.
#   >> Crase e variavel NAO entram nos 507. O "desconhecido" real da FASE 7 eram
#      esses ~25 (TEMPLATE+OPAQUE), nao os 507 literais (que sao os MAIS resolviveis).
#
# RESSALVA DE REGUA (importante): bucket() abaixo e COPIA VERBATIM de
#   map-dependencies.sh. POReM aqui o path RELATIVO e RESOLVIDO (.. colapsado)
#   antes de bucketizar; a matriz estatica da FASE 7 tratava relativo como interno.
#   => As duas matrizes NAO sao comparaveis aresta-a-aresta (regua diferente, nao drift).
#
# "Resolvido" = o ARGUMENTO do import; NAO prova que o codigo EXECUTA esse import
#   (pode ser caminho morto). E censo de codigo-fonte, nao de runtime.
#
# Uso:
#   bash map-dynamic-imports.sh             # relatorio (real)
#   bash map-dynamic-imports.sh --selftest  # prova a logica em casos fabricados (exit!=0 se falhar)
# ═══════════════════════════════════════════════════════════════
set -uo pipefail
PUBLIC="/var/www/dshowdash/public"
MODE="${1:-real}"

AWKLIB=$(mktemp); trap 'rm -f "$AWKLIB"' EXIT
cat > "$AWKLIB" <<'AWK'
# ── bucket(): COPIA VERBATIM de map-dependencies.sh (ordem preservada) ──
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
# OUT (bucket vazio) detalhado: e dominio (paineis/cards/charts) ou outro?
function outdetail(p) {
  if (p ~ /\/components\/panels\//) return "DOM-PANEL"
  if (p ~ /\/components\/cards\//)  return "DOM-CARD"
  if (p ~ /\/components\/charts\//) return "DOM-CHART"
  return "OUT-OTHER"
}
function dirname(f,   i){ i=length(f); while(i>0 && substr(f,i,1)!="/") i--; return substr(f,1,i-1) }
# normaliza colapsando . e .. ; sempre devolve caminho absoluto
function normalize(p,   n,a,i,out,o,res){
  n=split(p,a,"/"); o=0
  for(i=1;i<=n;i++){
    if(a[i]=="."||a[i]=="") continue
    if(a[i]==".."){ if(o>0) o--; continue }
    o++; out[o]=a[i]
  }
  res=""; for(i=1;i<=o;i++) res=res "/" out[i]
  if(res=="") res="/"
  return res
}
# resolve o arg do import contra o arquivo importador. "" = bare/opaco/irresolvivel
function resolve(file, arg,   abs){
  gsub(/\$\{[^}]*\}/, "X", arg)            # templates: ${...} -> X
  gsub(/`/, "", arg)                       # crases
  if (arg ~ /^\//)                          abs = PUBLIC arg          # web-root absoluto
  else if (arg ~ /^\.\//||arg ~ /^\.\.\//)  abs = dirname(file) "/" arg  # relativo
  else                                      return ""                 # bare / variavel
  return normalize(abs)
}
function destlabel(res,   b){
  if (res=="") return "BARE"
  b=bucket(res); if(b!="") return b
  return outdetail(res)
}
# ── scanner: entrada "file:line:content" (grep -HnE "import\(") ──
{
  ci1=index($0,":"); if(ci1==0) next
  file=substr($0,1,ci1-1); rest=substr($0,ci1+1)
  ci2=index(rest,":"); if(ci2==0) next
  lno=substr(rest,1,ci2-1); content=substr(rest,ci2+1)

  start=1
  while(1){
    subs=substr(content,start); p=index(subs,"import(")
    if(p==0) break
    abspos=start+p-1
    prev=(abspos>1)?substr(content,abspos-1,1):""
    tail=substr(content,abspos+7); sub(/^[ \t]+/,"",tail)
    c=substr(tail,1,1)
    endp=index(tail,")"); seg=(endp>0)?substr(tail,1,endp-1):tail

    # classe (por prefixo do argumento)
    if(c=="'"||c=="\""){ q=c; r=substr(tail,2); qi=index(r,q); str=(qi>0)?substr(r,1,qi-1):r
        if(seg ~ /[+`]/ || seg ~ /\$\{/){cls="CONCAT"; targ=str} else {cls="LITERAL"; targ=str} }
    else if(c=="`"){ cls="TEMPLATE"; targ=seg }
    else { cls="OPAQUE"; targ=seg }

    # disposicao (descartes visiveis)
    disp="KEEP"
    trim=content; sub(/^[ \t]+/,"",trim); prebar=substr(content,1,abspos-1)
    if(trim ~ /^[*]/ || trim ~ /^\/\// || trim ~ /^\/\*/ || trim ~ /^@/) disp="DISC-comment"
    else if(prebar ~ /\/\//) disp="DISC-comment"
    else if(prev ~ /[A-Za-z0-9_$]/) disp="DISC-boundary"
    else if(prev==".") disp="DISC-call"
    else if(cls=="OPAQUE" && (content ~ /import\(.*\)[ \t]*\{[ \t]*$/ || targ ~ /[A-Za-z0-9_]: /)) disp="DISC-methoddef"

    if(disp=="KEEP"){
      res=resolve(file,targ); ob=bucket(file); if(ob=="") ob="OUT"; dl=destlabel(res)
      print "KEEP\t" cls "\t" ob "\t" dl "\t" file "\t" lno "\t" targ "\t" res
    } else {
      print disp "\t" cls "\t-\t-\t" file "\t" lno "\t" targ "\t-"
    }
    start=abspos+7
  }
}
AWK

scan(){ < "$1" tr '\n' '\0' | xargs -0 grep -HnE "import\(" 2>/dev/null | awk -v PUBLIC="$PUBLIC" -f "$AWKLIB" || true; }

# ════════════════════════ SELFTEST ════════════════════════
if [ "$MODE" = "--selftest" ]; then
  SB=$(mktemp -d); mkdir -p "$SB/public/components/main/ui/container-main/utils"
  F="$SB/public/components/main/ui/container-main/utils/x.ts"
  cat > "$F" <<'TS'
await import('../theme.js');
await import('../../../../panels/panel-01/api.js');
const m = await import(`./components/${name}/index.js`);
const c = await import('/components/cards/x/index.js');
const d = await import(modulePath as string);
const t = await import(flag ? './a.js' : './b.js');
function imp() { return registry.import(data, options); }
import(jsonStr: string, options = {}) {
// comentario: import('x.js')
const z = reimport('y.js');
TS
  echo "$F" > "$SB/list.txt"
  OUT=$(< "$SB/list.txt" tr '\n' '\0' | xargs -0 grep -HnE "import\(" 2>/dev/null | awk -v PUBLIC="$SB/public" -f "$AWKLIB")
  fail=0
  chk(){ if echo "$OUT" | grep -qF "$1"; then echo "  PASS  $2"; else echo "  FAIL  $2"; fail=1; fi; }
  echo "═══ SELFTEST map-dynamic-imports ═══"
  chk "KEEP	LITERAL	WSE	WSE"       "L1 literal interno WSE->WSE"
  chk "KEEP	LITERAL	WSE	DOM-PANEL" "L2 escape resolvido WSE->DOM-PANEL"
  chk "KEEP	TEMPLATE	WSE	WSE"     "L3 template interno"
  chk "KEEP	LITERAL	WSE	DOM-CARD"  "L4 root-absoluto WSE->DOM-CARD"
  chk "KEEP	OPAQUE	WSE	BARE"       "L5 opaco (variavel)"
  chk "KEEP	OPAQUE	WSE	BARE	$F	6	flag ? './a.js' : './b.js'" "L6 ternario real preservado"
  chk "DISC-call"                            "L7 .import() descartado"
  chk "DISC-methoddef"                       "L8 metodo nomeado import descartado"
  chk "DISC-comment"                         "L9 comentario descartado"
  chk "DISC-boundary"                        "L10 reimport() descartado"
  rm -rf "$SB"
  if [ "$fail" -eq 0 ]; then echo "  >> SELFTEST OK"; exit 0; else echo "  >> SELFTEST FALHOU"; exit 2; fi
fi

# ════════════════════════ REAL ════════════════════════
TS_LIST=$(mktemp); trap 'rm -f "$AWKLIB" "$TS_LIST"' EXIT
find "$PUBLIC" -type f -name '*.ts' ! -name '*.d.ts' ! -path '*/node_modules/*' ! -path '*/dist/*' > "$TS_LIST"
N_TS=$(wc -l < "$TS_LIST")
BASELINE_507=$(< "$TS_LIST" tr '\n' '\0' | xargs -0 grep -Eoh "import\([[:space:]]*['\"][^'\"]+['\"]" 2>/dev/null | wc -l)
ALL=$(mktemp); scan "$TS_LIST" > "$ALL"

echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Mapa classificado dos import() dinamicos"
echo "  $(date '+%Y-%m-%d %H:%M:%S')   READ-ONLY   .ts: $N_TS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "▸ ANCORA — reproducao dos 507 (grep identico a map-dependencies.sh L91)"
echo "    import( + ASPA = $BASELINE_507   [507 = LITERAL+CONCAT; crase/variavel ficam de fora]"
echo ""
echo "▸ CLASSIFICACAO (ocorrencias reais = KEEP) e DESCARTES (visiveis)"
awk -F'\t' '
  $1=="KEEP"{k[$2]++; kt++}
  $1!="KEEP"{d[$1]++; dt++}
  END{
    print "    KEEP (import() ES real):"
    split("LITERAL CONCAT TEMPLATE OPAQUE",O," ")
    for(i=1;i<=4;i++) printf "      %-9s %4d\n", O[i], k[O[i]]+0
    printf "      %-9s %4d\n","TOTAL", kt
    print "    DESCARTADOS (NAO import ES — nunca somados ao acoplamento):"
    for(x in d) printf "      %-14s %4d\n", x, d[x]
    printf "      %-14s %4d\n","TOTAL-DISC", dt
    printf "    BRUTO (KEEP+DISC): %d\n", kt+dt
  }' "$ALL"
echo ""
echo "▸ CONFERENCIA com os 507 e distribuicao % (sobre KEEP real)"
awk -F'\t' '$1=="KEEP"{c[$2]++; t++} END{
  printf "    LITERAL+CONCAT (= def 507) = %d   |  TEMPLATE+OPAQUE (nao-contados FASE 7) = %d\n", c["LITERAL"]+c["CONCAT"], c["TEMPLATE"]+c["OPAQUE"]
  split("LITERAL CONCAT TEMPLATE OPAQUE",O," ")
  for(i=1;i<=4;i++) printf "    %-9s %4d  %5.1f%%\n", O[i], c[O[i]]+0, (c[O[i]]+0)*100.0/t
}' "$ALL"
echo ""
echo "▸ RESOLUCAO (LITERAL+TEMPLATE) e MATRIZ origem(bucket)->destino(resolvido)"
echo "    [REGUA: destino = bucket do path RESOLVIDO/normalizado; FASE 7 nao resolvia relativo => nao comparar aresta-a-aresta]"
awk -F'\t' '$1=="KEEP"{ if($8!="") r++; else b++ } END{printf "    resolvidos: %d  |  opacos/BARE: %d\n",r,b}' "$ALL"
awk -F'\t' '$1=="KEEP" && $8!=""{m[$3" -> "$4]++} END{for(k in m) printf "%8d  %s\n",m[k],k}' "$ALL" | sort -rn | sed 's/^/    /'
echo ""
echo "▸ CRUZAMENTOS inter-subsistema (origem!=destino, ambos nos 10 buckets):"
awk -F'\t' '
  function isbkt(x){return (x=="BST"||x=="CRT"||x=="EVB"||x=="RTR"||x=="PLD"||x=="WSE"||x=="API"||x=="AUT"||x=="MFE"||x=="MNH")}
  $1=="KEEP" && $8!="" && $3!=$4 && isbkt($3) && isbkt($4){m[$3" -> "$4]++}
  END{ n=0; for(k in m){ printf "    %8d  %s\n",m[k],k; n++ } if(n==0) print "    (nenhum)"}' "$ALL" | sort -rn
echo ""
echo "▸ TESTE DE FRONTEIRA WSE — literais/templates do WSE que SAEM do WSE:"
awk -F'\t' '$1=="KEEP" && $3=="WSE" && $4!="WSE" && $8!=""{print "    "$4"  <- "$5":"$6}' "$ALL" | sed "s#$PUBLIC/##g" \
  | { grep . || echo "    (vazio = 0 escapes; todo literal/template WSE resolve dentro do container-main)"; }
echo ""
echo "▸ OPAQUE verdadeiros (KEEP, sem path estatico) — origem + variavel (investigacao manual):"
awk -F'\t' '$1=="KEEP" && $2=="OPAQUE"{printf "    %-5s %s:%s  var=[%s]\n",$3,$5,$6,$7}' "$ALL" | sed "s#$PUBLIC/##g"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Regenerar: bash $0   |   Auto-prova: bash $0 --selftest"
echo "═══════════════════════════════════════════════════════════════"
cp "$ALL" /tmp/map-dynamic-imports-last.tsv 2>/dev/null || true
rm -f "$ALL"
exit 0
