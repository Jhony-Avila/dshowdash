#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — Coletor de evidências do servidor (Onda 1)
# READ-ONLY sobre o sistema: só escreve o relatório em docs/ELEVACAO-BASAL/evidencias/.
# NUNCA imprime segredos: não lê .env, não imprime strings de conexão, tokens,
# cookies, certificados nem dados pessoais. Nginx: apenas listen/server_name/
# root/location/alias. Falhas individuais não abortam a coleta.
# Uso (na raiz do repo no servidor):  bash scripts/basal/coletar-evidencias-servidor.sh
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO" || exit 1
DATA="$(date +%Y-%m-%d)"
OUT_DIR="docs/ELEVACAO-BASAL/evidencias"
OUT="$OUT_DIR/baseline-servidor-$DATA.md"
mkdir -p "$OUT_DIR"

say()  { printf '%s\n' "$*" >> "$OUT"; }
sec()  { say ""; say "## $*"; say ""; }
run()  { # run "titulo" comando...  → bloco de código com a saída (ou AVISO)
  local t="$1"; shift
  say ""; say "### $t"; say ""; say '```text'
  { "$@" 2>&1 || echo "[AVISO] comando falhou: $*"; } >> "$OUT"
  say '```'
}

: > "$OUT"
say "# Baseline do servidor — coletado em $(date '+%Y-%m-%d %H:%M %Z')"
say ""
say "> Gerado por scripts/basal/coletar-evidencias-servidor.sh (read-only, sem segredos)."

sec "1. Estado do Git no servidor"
run "Commit / branch" git log -1 --format='%H %d %ci'
run "Status do worktree (alterações manuais não reconciliadas)" git status --porcelain=v1
run "Stashes" git stash list

sec "2. Dependências do public/index.html (tracked × ignored + sha256)"
say '```text'
grep -oE '(src|href)="[^"]+\.(js|css)([?#][^"]*)?"' public/index.html \
  | sed -E 's/^(src|href)="//; s/"$//; s/[?#].*$//' | sort -u | while read -r dep; do
    f="public${dep}"
    if [ -f "$f" ]; then
      if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then st="TRACKED"; else st="IGNORED"; fi
      h="$(sha256sum "$f" | cut -c1-16)"
      printf '%-8s %s  sha256:%s\n' "$st" "$dep" "$h"
    else
      printf '%-8s %s\n' "AUSENTE" "$dep"
    fi
  done >> "$OUT" 2>&1
say '```'

sec "3. Diretórios dist e frescor (fonte mais nova que o artefato?)"
say '```text'
find public app api -type d -name dist -not -path '*/node_modules/*' 2>/dev/null | sort | while read -r d; do
  pai="$(dirname "$d")"
  nd="$(find "$d" -type f -printf '%T@\n' 2>/dev/null | sort -rn | head -1)"
  nf="$(find "$pai" -maxdepth 2 -type f -not -path "$d/*" -not -path '*/node_modules/*' \
        \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.css' \) -printf '%T@\n' 2>/dev/null | sort -rn | head -1)"
  n="$(find "$d" -type f 2>/dev/null | wc -l)"
  if [ -n "$nd" ] && [ -n "$nf" ] && [ "${nf%.*}" -gt "${nd%.*}" ] 2>/dev/null; then fresco="DEFASADO"; else fresco="ok?"; fi
  printf '%-9s %4d arquivos  %s\n' "$fresco" "$n" "$d"
done >> "$OUT" 2>&1
say '```'
say ""
say "Total de dists: \`$(find public app api -type d -name dist -not -path '*/node_modules/*' 2>/dev/null | wc -l)\`"

sec "4. Físico × rastreado por árvore crítica"
say '```text'
for t in api public/app public/bootstrap-v2 public/core public/platform public/modules public/react; do
  fis="$(find "$t" -type f -not -path '*/node_modules/*' 2>/dev/null | wc -l)"
  tra="$(git ls-files "$t" 2>/dev/null | wc -l)"
  printf '%-24s fisicos:%6d  rastreados:%6d\n' "$t" "$fis" "$tra"
done >> "$OUT"
say '```'

sec "5. Tipo real de public/api"
run "ls -la public/api" ls -la public/api
run "readlink -f" readlink -f public/api

sec "6. Nginx (apenas listen/server_name/root/location/alias — sem segredos)"
for c in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -e "$c" ] || continue
  run "config: $c" grep -nE '^\s*(listen|server_name|root|location|alias)' "$c"
done
run "nginx -t" sudo -n nginx -t 2>&1 || nginx -t

sec "7. Portas em escuta e serviços"
run "ss -tlnp (portas)" sh -c "ss -tlnp | awk '{print \$1, \$4, \$7}'"
run "servicos ativos (nginx/php/mysql/redis/python/cloudflared)" sh -c "systemctl list-units --type=service --state=running --no-pager --no-legend | grep -Ei 'nginx|php|mysql|maria|redis|python|cloudflared|decision' || true"

sec "8. Exposição HTTP de fontes internas (status code apenas)"
say '```text'
BASE="${BASE_URL:-https://dshowdash.com.br}"
{ git ls-files 'public/*.ts' 'public/**/*.ts' | head -4
  git ls-files 'public/**/*.tsx' | head -2
  find public -maxdepth 3 -name '*.patch' -type f 2>/dev/null | head -3
  echo "public/koala/src/api/client.ts"
} | sort -u | while read -r f; do
  [ -n "$f" ] || continue
  url="${f#public}"
  code="$(curl -m 8 -s -o /dev/null -w '%{http_code}' "$BASE$url" 2>/dev/null || echo ERR)"
  printf 'HTTP %-4s %s\n' "$code" "$url"
done >> "$OUT"
say '```'
say ""
say "(200 em .ts/.tsx/.patch = exposição confirmada — risco BASAL-004)"

sec "9. Testes existentes fora do Avatar Studio"
run "arquivos de teste (excluindo avatar)" sh -c "find . -type f \( -name '*test*' -o -name '*spec*' -o -name '*smoke*' \) -not -path './.git/*' -not -path '*/node_modules/*' -not -path '*avatar*' -not -path './backup/*' | head -40"

sec "10. /backup (governança de remoções)"
run "primeiros níveis" sh -c "ls -la /backup 2>/dev/null | head -25"

sec "11. Toolchain do servidor"
run "versões" sh -c "node -v; npm -v; php -v | head -1; nginx -v 2>&1; mysql --version 2>/dev/null | head -1"

say ""
say "---"
say "Coleta concluída. Revisar manualmente antes de commitar: confirmar que nenhum dado sensível foi capturado."
echo "OK: relatório em $OUT"
