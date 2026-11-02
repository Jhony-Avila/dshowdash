#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# detect-cachebust-drift.sh — TRAVA de propagação de cache (DShowDash)
# ═══════════════════════════════════════════════════════════════
# PORQUÊ ESTE DETECTOR EXISTE
#   Bug recorrente (3 ciclos no item ativo da sidebar; ver também
#   incidentes theme-toggle, footer nav-fx, cotação render.js):
#   corrigia-se um asset CSS/JS pinado por "?v=TOKEN", mas o TOKEN
#   NÃO era bumpado. Como o Service Worker serve cache-first e o CF
#   pina max-age sob a MESMA URL, o fix NUNCA chegava ao cliente e o
#   sintoma "persistia" — levando a re-editar código que já estava são.
#
# O QUE ELE PROVA (READ-ONLY — não altera nada)
#   Para cada asset registrado abaixo:
#     (A) CONSISTÊNCIA: o "?v=" é IDÊNTICO em TODOS os arquivos que o
#         referenciam (um bump parcial deixa uma rota servindo velho).
#     (B) FRESCOR: o conteúdo atual do asset bate com o hash gravado no
#         manifesto para o TOKEN atual. Se o conteúdo mudou mas o TOKEN
#         não → DRIFT (o bug). Assim que você bumpa de verdade, rode
#         `--update` para regravar o manifesto (baseline aceito).
#
# EXIT CODES (compatível com run_strict do check-all.sh)
#   0 = OK (consistente e sem drift)
#   1 = ACHADO (tokens divergentes OU bundle mudou sem bump)  ← regressão
#   2 = ERRO (asset/arquivo ausente, manifesto ilegível, etc.)
#
# USO
#   bash scripts/detect-cachebust-drift.sh            # checa (default)
#   bash scripts/detect-cachebust-drift.sh --update   # regrava manifesto
#                                                      # (após um bump legítimo)
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="/var/www/dshowdash"
PUBLIC="$ROOT/public"
MANIFEST="$ROOT/scripts/.cachebust-manifest.txt"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

# ─ REGISTRO DE ASSETS PINADOS ───────────────────────────────────
# Formato: "CHAVE|CAMINHO_DO_ASSET|TRECHO_DE_URL_PARA_CASAR_REFS"
# TRECHO_DE_URL: últimas 2+ partes do path, o bastante p/ desambiguar
# entre assets de mesmo basename. O grep procura "<trecho>?v=".
ASSETS=(
  "sidebar-bundle|$PUBLIC/components/sidebar/styles/sidebar.bundle.css|styles/sidebar.bundle.css"
)

# Onde procurar referências (código servível), excluindo ruído.
ref_grep() {
  local needle="$1"
  grep -rn --include='*.html' --include='*.js' --include='*.ts' \
    -F "$needle" "$PUBLIC" 2>/dev/null \
    | grep -viE '/node_modules/|react|\.map:|/backup/'
}

MODE="${1:-check}"
RC=0
UPDATE_LINES=""

echo -e "${CYAN}═══ TRAVA cache-bust (drift de ?v=) ═══${NC}"

for entry in "${ASSETS[@]}"; do
  IFS='|' read -r key asset urlmatch <<< "$entry"

  if [ ! -f "$asset" ]; then
    echo -e "${RED}  ERRO${NC} [$key] asset não encontrado: $asset"
    RC=2; continue
  fi

  # (A) coletar tokens de TODAS as referências
  mapfile -t reflines < <(ref_grep "${urlmatch}?v=")
  if [ "${#reflines[@]}" -eq 0 ]; then
    echo -e "${RED}  ERRO${NC} [$key] nenhuma referência '?v=' encontrada para $urlmatch"
    RC=2; continue
  fi

  # extrair o valor do token de cada linha
  tokens=()
  for ln in "${reflines[@]}"; do
    tok=$(printf '%s\n' "$ln" | grep -oE "${urlmatch}\?v=[A-Za-z0-9._-]+" | head -1 | sed -E 's/.*\?v=//')
    tokens+=("$tok")
  done
  uniq_tokens=$(printf '%s\n' "${tokens[@]}" | sort -u)
  ntok=$(printf '%s\n' "$uniq_tokens" | grep -c .)

  if [ "$ntok" -ne 1 ]; then
    echo -e "${RED}  ACHADO${NC} [$key] tokens DIVERGENTES entre arquivos (bump parcial):"
    for ln in "${reflines[@]}"; do echo "      $ln"; done
    [ "$RC" -lt 1 ] && RC=1
    continue
  fi
  token="$uniq_tokens"

  # (B) hash do conteúdo atual vs manifesto
  cur_hash=$(sha256sum "$asset" | awk '{print $1}')
  UPDATE_LINES="${UPDATE_LINES}${key}\t${token}\t${cur_hash}\n"

  if [ "$MODE" = "--update" ] || [ "$MODE" = "update" ]; then
    echo -e "  ${CYAN}update${NC} [$key] token=$token hash=${cur_hash:0:12}… (${#reflines[@]} refs)"
    continue
  fi

  # modo check: comparar com manifesto
  if [ ! -f "$MANIFEST" ]; then
    echo -e "${YELLOW}  ACHADO${NC} [$key] manifesto ausente — rode: bash scripts/detect-cachebust-drift.sh --update"
    [ "$RC" -lt 1 ] && RC=1
    continue
  fi
  man_line=$(grep -P "^${key}\t" "$MANIFEST" 2>/dev/null | head -1)
  if [ -z "$man_line" ]; then
    echo -e "${YELLOW}  ACHADO${NC} [$key] sem entrada no manifesto — rode --update"
    [ "$RC" -lt 1 ] && RC=1
    continue
  fi
  man_token=$(printf '%s' "$man_line" | cut -f2)
  man_hash=$(printf '%s' "$man_line" | cut -f3)

  if [ "$cur_hash" = "$man_hash" ] && [ "$token" = "$man_token" ]; then
    echo -e "${GREEN}  OK${NC}   [$key] token=$token consistente em ${#reflines[@]} refs; conteúdo casa o manifesto"
  elif [ "$cur_hash" != "$man_hash" ] && [ "$token" = "$man_token" ]; then
    echo -e "${RED}  ACHADO${NC} [$key] DRIFT: o bundle MUDOU de conteúdo mas o ?v=$token NÃO foi bumpado."
    echo -e "         → clientes com cache velho não recebem o fix. Bumpe o token em TODAS as refs"
    echo -e "           + o VERSION/CACHE_NAME do sw.js, depois rode --update."
    [ "$RC" -lt 1 ] && RC=1
  else
    # token mudou (bump feito) mas manifesto desatualizado → lembrar de --update
    echo -e "${YELLOW}  ACHADO${NC} [$key] token=$token ≠ manifesto($man_token). Se o bump foi legítimo, rode --update."
    [ "$RC" -lt 1 ] && RC=1
  fi
done

# gravar manifesto no modo update
if [ "$MODE" = "--update" ] || [ "$MODE" = "update" ]; then
  printf "# cache-bust manifest — chave<TAB>token<TAB>sha256 do asset\n" > "$MANIFEST"
  printf "%b" "$UPDATE_LINES" >> "$MANIFEST"
  echo -e "${GREEN}  manifesto regravado:${NC} $MANIFEST"
  RC=0
fi

echo -e "${CYAN}═══ fim (rc=$RC: 0=OK 1=achado 2=erro) ═══${NC}"
exit "$RC"
