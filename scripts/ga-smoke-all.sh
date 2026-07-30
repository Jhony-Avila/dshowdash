#!/usr/bin/env bash
# ga-smoke-all.sh — verificação completa do módulo Google Analytics (Fase 1, mock).
# @created 2026-07-30
#
# Molde: scripts/gcal-smoke-all.sh.
#
# Roda tudo que precisa estar verde para o módulo ser considerado íntegro:
#   1. php -l em todo o backend
#   2. tsc --noEmit no painel
#   3. node --check no adaptador
#   4. as 16 rotas respondendo com envelope ok
#   5. gate de autenticação (rota sem sessão TEM de dar 401)
#   6. COERÊNCIA dos números entre telas, em 4 cenários  <- o que pega mock mentiroso
#   7. prova de UI em dark + light (Playwright)
#   8. correspondência entre `GRUPOS.disponivel` e o mapa de telas
#
# Uso:  bash scripts/ga-smoke-all.sh [--rapido]
#       --rapido pula a prova de Playwright (item 7)
set -uo pipefail

RAIZ=/var/www/dshowdash
SCRATCH="${TMPDIR:-/tmp}/ga-smoke-$$"
mkdir -p "$SCRATCH"
trap 'rm -rf "$SCRATCH"' EXIT

RAPIDO=false
[ "${1:-}" = "--rapido" ] && RAPIDO=true

VERDE='\033[0;32m'; VERMELHO='\033[0;31m'; AMARELO='\033[1;33m'; CIANO='\033[0;36m'; FIM='\033[0m'
OK=0; ERRO=0
passou() { OK=$((OK+1)); printf "  ${VERDE}OK${FIM}    %s\n" "$1"; }
falhou() { ERRO=$((ERRO+1)); printf "  ${VERMELHO}FALHA${FIM} %s %s\n" "$1" "${2:-}"; }
titulo() { printf "\n${CIANO}═══ %s ═══${FIM}\n" "$1"; }

cd "$RAIZ" || exit 2

# ── 1. sintaxe PHP ───────────────────────────────────────────────────────
titulo "1/8 · sintaxe PHP do backend"
n=0
while IFS= read -r f; do
  n=$((n+1))
  if ! out=$(php -l "$f" 2>&1); then falhou "php -l $f" "$out"; fi
done < <(find api/google-analytics -name '*.php')
[ "$ERRO" -eq 0 ] && passou "$n arquivos PHP sem erro de sintaxe"

# ── 2. typecheck do painel ───────────────────────────────────────────────
titulo "2/8 · tsc --noEmit"
if out=$(npx tsc --noEmit -p public/components/panels/panel-google-analytics/tsconfig.json 2>&1); then
  passou "typecheck limpo"
else
  falhou "typecheck" "$(echo "$out" | head -5)"
fi

# ── 3. adaptador ─────────────────────────────────────────────────────────
titulo "3/8 · node --check no adaptador"
if node --check public/components/panels/panel-google-analytics/index.js 2>/dev/null; then
  passou "index.js válido"
else
  falhou "index.js" "sintaxe inválida"
fi

# ── sessão para os testes HTTP ───────────────────────────────────────────
J="$SCRATCH/cookies.txt"
USR=$(grep '^SCREENSHOT_SERVICE_USER=' .env | cut -d= -f2-)
PWD_=$(grep '^SCREENSHOT_SERVICE_PASS=' .env | cut -d= -f2-)
CURL=(curl -s -k --resolve dshowdash.com.br:443:127.0.0.1)
"${CURL[@]}" -c "$J" -X POST https://dshowdash.com.br/api/auth/login.php \
  -H 'Content-Type: application/json' \
  -d "{\"login\":\"$USR\",\"password\":\"$PWD_\"}" -o /dev/null

B=https://dshowdash.com.br/api/google-analytics

# ── 4. rotas ─────────────────────────────────────────────────────────────
titulo "4/8 · as 16 rotas"
ROTAS=(status header/summary overview realtime acquisition acquisition/flow pages events
       conversions funnel ecommerce users quality alerts properties quotas)
for r in "${ROTAS[@]}"; do
  corpo=$("${CURL[@]}" -b "$J" "$B/$r")
  if echo "$corpo" | grep -q '"ok":true'; then passou "GET /$r"; else falhou "GET /$r" "$(echo "$corpo" | head -c 120)"; fi
done
# 404 em rota inexistente
cod=$("${CURL[@]}" -b "$J" -o /dev/null -w '%{http_code}' "$B/naoexiste")
[ "$cod" = "404" ] && passou "rota inexistente devolve 404" || falhou "rota inexistente" "HTTP $cod"

# ── 5. gate de autenticação ──────────────────────────────────────────────
titulo "5/8 · gate de autenticação (sem cookie)"
for r in overview realtime properties; do
  cod=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$B/$r")
  # ⚠️ Sem sessão TEM de barrar. Se aparecer 200 aqui, o módulo está aberto ao mundo.
  if [ "$cod" = "401" ] || [ "$cod" = "403" ]; then passou "/$r barra anônimo (HTTP $cod)"
  else falhou "/$r NÃO barra anônimo" "HTTP $cod"; fi
done

# ── 6. coerência entre telas ─────────────────────────────────────────────
titulo "6/8 · coerência dos números (4 cenários)"
python3 - "$J" <<'PY'
import json, subprocess, sys
J = sys.argv[1]
B = "https://dshowdash.com.br/api/google-analytics"
def get(rota):
    out = subprocess.run(["curl","-s","-k","--resolve","dshowdash.com.br:443:127.0.0.1","-b",J,f"{B}/{rota}"],
                         capture_output=True, text=True).stdout
    return json.loads(out)["data"]
falhas = 0
def checa(rot, a, b, tol=0.5):
    global falhas
    d = abs(a-b)/max(abs(a),1)*100
    if d <= tol: print(f"  \033[0;32mOK\033[0m    {rot}")
    else:
        falhas += 1
        print(f"  \033[0;31mFALHA\033[0m {rot}  {a:,.0f} vs {b:,.0f} (delta {d:.2f}%)")
for cen in ["saudavel","pico","queda_conversao","mobile_ruim"]:
    ov = get(f"overview?periodo=28d&cenario={cen}")
    aq = get(f"acquisition?periodo=28d&cenario={cen}")
    k = {x["chave"]: x["valor"] for x in ov["kpis"]}
    checa(f"[{cen}] sessões: visão geral == soma por canal", k["sessoes"], sum(c["sessoes"] for c in aq["por_canal"]))
    checa(f"[{cen}] conversões: visão geral == soma por canal", k["conversoes"], sum(c["conversoes"] for c in aq["por_canal"]))
    checa(f"[{cen}] por_canal == soma das campanhas", sum(c["sessoes"] for c in aq["por_canal"]), sum(c["sessoes"] for c in aq["campanhas"]))
    ev = get(f"events?periodo=28d&cenario={cen}"); cv = get(f"conversions?periodo=28d&cenario={cen}")
    gl_ev = [e for e in ev["eventos"] if e["evento"]=="generate_lead"][0]["contagem"]
    gl_cv = [e for e in cv["importantes"] if e["evento"]=="generate_lead"][0]["contagem"]
    checa(f"[{cen}] generate_lead: /events == /conversions", gl_ev, gl_cv, 0.01)
sys.exit(1 if falhas else 0)
PY
[ $? -eq 0 ] && passou "todos os cenários coerentes" || falhou "coerência" "ver acima"

# ── 7. estabilidade (mesma seed = mesma resposta) ────────────────────────
titulo "7/8 · estabilidade da semente"
a=$("${CURL[@]}" -b "$J" "$B/overview?periodo=28d" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["kpis"][0]["valor"])')
b=$("${CURL[@]}" -b "$J" "$B/overview?periodo=28d" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["kpis"][0]["valor"])')
[ "$a" = "$b" ] && passou "duas chamadas devolvem o mesmo ($a)" || falhou "instável" "$a != $b"

# ── 8. telas declaradas × implementadas ──────────────────────────────────
titulo "8/8 · GRUPOS.disponivel × mapa de telas"
python3 - <<'PY'
import re, sys
base='/var/www/dshowdash/public/components/panels/panel-google-analytics/src/'
tipos=open(base+'shell/types.ts').read()
idx=open(base+'screens/index.ts').read()
# ⚠️ Casa a FORMA COMPLETA da tela — `{ id, titulo, icone, disponivel }` na ordem. Tentativas
# anteriores com `[^}]*` e `[^}]*?icone:` deram FALSO POSITIVO acusando 'visao',
# 'comportamento', 'inteligencia' e 'admin' (que são IDs de GRUPO): entre o id do grupo e o
# `icone` da primeira tela dele não existe `}` nenhum para a regex parar.
disp=set(re.findall(
    r"\{\s*id:\s*'([a-z-]+)',\s*titulo:\s*'[^']*',\s*icone:\s*'[^']*',\s*disponivel:\s*true",
    tipos))
# chaves do mapa
mapa=set(re.findall(r"^\s*'?([a-z-]+)'?:\s*[A-Z]", idx, re.M))
falta=disp-mapa
sobra=mapa-disp
if falta: print(f"  \033[0;31mFALHA\033[0m telas disponiveis SEM componente: {sorted(falta)}"); sys.exit(1)
if sobra: print(f"  \033[1;33mAVISO\033[0m componentes sem tela declarada: {sorted(sobra)}")
print(f"  \033[0;32mOK\033[0m    {len(disp)} telas declaradas disponíveis, todas com componente")
PY
[ $? -eq 0 ] && passou "catálogo e mapa em sincronia" || falhou "catálogo/mapa" "divergem"

# ── prova de UI ──────────────────────────────────────────────────────────
if ! $RAPIDO; then
  titulo "UI · Playwright (dark + light)"
  if PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright timeout 550 \
     node tools/screenshot/valida-google-analytics-fase1.mjs > "$SCRATCH/ui.log" 2>&1; then
    passou "$(grep -oE 'PASSOU — [0-9]+ checagens' "$SCRATCH/ui.log" | head -1)"
  else
    falhou "prova de UI" "$(grep -E 'FALHA' "$SCRATCH/ui.log" | head -4)"
  fi
else
  printf "  ${AMARELO}PULADO${FIM} prova de UI (--rapido)\n"
fi

# ── resumo ───────────────────────────────────────────────────────────────
printf "\n${CIANO}═══════════════════════════════════════════${FIM}\n"
if [ "$ERRO" -eq 0 ]; then
  printf "  ${VERDE}TUDO VERDE${FIM} — %d checagens\n" "$OK"
else
  printf "  ${VERMELHO}%d FALHA(S)${FIM} em %d checagens\n" "$ERRO" "$((OK+ERRO))"
fi
printf "${CIANO}═══════════════════════════════════════════${FIM}\n"
exit $([ "$ERRO" -eq 0 ] && echo 0 || echo 1)
