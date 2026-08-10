#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — M1b: sondagem precisa de imports .ts em runtime + contenção do .patch
# Contexto: o pré-check A1 da Onda 2 pegou referências a .ts em vite.*.config.js
# (build) e no koala/index.html DEV. Este script separa build de runtime e só
# bloqueia .ts/.tsx se NENHUM artefato SERVIDO importar fonte .ts em runtime.
# O .patch (resíduo, §3.7) é contido já — deny + quarentena para /backup.
# Uso: bash scripts/basal/m1b-contencao.sh            (sondagem + contenções seguras)
#      SOMENTE_PRECHECKS=1 bash scripts/basal/m1b-contencao.sh   (só sondagem)
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$REPO" || exit 1
DATA="$(date +%Y-%m-%d)"; TS="$(date +%Y%m%d-%H%M%S)"
OUT="docs/ELEVACAO-BASAL/evidencias/m1b-sondagem-$DATA.md"
VHOST="/etc/nginx/sites-available/dshowdash.com.br"
SNIP_PATCH="/etc/nginx/snippets/basal-m1-deny-patch.conf"
SNIP_TS="/etc/nginx/snippets/basal-m1-deny-fontes.conf"
BKP="/backup/elevacao-basal/$TS"
mkdir -p docs/ELEVACAO-BASAL/evidencias
say(){ printf '%s\n' "$*" >> "$OUT"; }
: > "$OUT"
say "# M1b — Sondagem de imports .ts em runtime + contenção .patch — $(date '+%Y-%m-%d %H:%M %Z')"

# ── P1: imports .ts/.tsx em ARTEFATOS SERVIDOS (exclui *.config.* e /src/ dev) ──
say ""; say "## P1 — Imports de .ts/.tsx em artefatos servidos (runtime real)"; say '```text'
# procura specifiers ESM (import ... 'x.ts' | from 'x.tsx' | import('x.ts')) e src/href
P1="$(grep -rInE "(import[^;]*['\"][^'\"]+\.tsx?['\"]|from\s+['\"][^'\"]+\.tsx?['\"]|import\(\s*['\"][^'\"]+\.tsx?['\"]|(src|href)=['\"][^'\"]+\.tsx?['\"])" \
  public/ --include='*.js' --include='*.mjs' --include='*.html' 2>/dev/null \
  | grep -vE '\.config\.(js|mjs|ts)|vite\.[^/]*\.js|/src/|node_modules|sourceMappingURL' || true)"
if [ -n "$P1" ]; then printf '%s\n' "$P1" | head -60 >> "$OUT"; else echo "(nenhum import de .ts/.tsx em artefato servido de runtime)" >> "$OUT"; fi
say '```'
P1_OK=$([ -z "$P1" ] && echo sim || echo NAO)
say ""; say "**P1 (bloqueio .ts liberado): $P1_OK**"

# ── P2: bundles servidos das permissions realmente importam os .ts do keepExternal? ──
say ""; say "## P2 — Bundles de permissions importam ui-feedback.ts / migration-bridge.ts?"; say '```text'
for b in public/components/_shared/permissions/dist/*.bundle.js; do
  [ -f "$b" ] || continue
  h="$(grep -oE "[^'\"]+\.(ts|tsx)" "$b" 2>/dev/null | grep -vE '\.map$' | sort -u | head)"
  if [ -n "$h" ]; then echo "IMPORTA .ts → $b"; printf '   %s\n' $h; else echo "ok (sem .ts): $b"; fi
done >> "$OUT" 2>&1
say '```'

# ── P3: koala serve dist (sem .tsx)? ──
say ""; say "## P3 — /koala/ serve dist compilado (sem .tsx)?"; say '```text'
if [ -f public/koala/dist/index.html ]; then
  echo "koala/dist/index.html existe. Scripts carregados:"
  grep -oE '<script[^>]*src="[^"]*"' public/koala/dist/index.html | head
  grep -qE '\.tsx?"' public/koala/dist/index.html && echo "ATENCAO: dist carrega .ts/.tsx" || echo "OK: dist não carrega .ts/.tsx (o /src/main.tsx é só DEV)"
else
  echo "koala/dist/index.html AUSENTE — confirmar manualmente o alias /koala/ do Nginx"
fi
say '```'

# ── P4: o .patch é resíduo (sem consumidor)? ──
say ""; say "## P4 — .patch exposto"; say '```text'
PATCHES="$(find public -type f -name '*.patch' 2>/dev/null)"
printf '%s\n' "$PATCHES" >> "$OUT"
for p in $PATCHES; do
  base="${p%.patch}"; ref="/${base#public/}"
  echo "consumidores HTTP de $ref (grep em artefatos servidos):"
  grep -rIn "$(basename "$p")" public --include='*.js' --include='*.html' 2>/dev/null | grep -v "$p" | head -3 || echo "   (nenhum)"
done >> "$OUT" 2>&1
say '```'

echo "Sondagem concluída → $OUT (P1=$P1_OK)"
[ "${SOMENTE_PRECHECKS:-0}" = "1" ] && exit 0

# ── Contenção B0: .patch (sempre segura — resíduo sem consumidor de runtime) ──
echo "== Contenção .patch (deny + quarentena) =="
mkdir -p "$BKP"
cp -a "$VHOST" "$BKP/dshowdash.com.br.vhost.bak"
if [ ! -f "$SNIP_PATCH" ]; then
  printf '%s\n' \
    '# Elevacao Basal M1b: .patch nunca e servido (residuo, briefing §3.7).' \
    'location ~* \.patch$ { deny all; return 404; }' > "$SNIP_PATCH"
fi
grep -q 'basal-m1-deny-patch' "$VHOST" || \
  sed -i "0,/root  \/var\/www\/dshowdash\/public;/s//root  \/var\/www\/dshowdash\/public;\n    include snippets\/basal-m1-deny-patch.conf;/" "$VHOST"
# quarentena física do arquivo (nunca delete — regra /backup)
for p in $(find public -type f -name '*.patch' 2>/dev/null); do
  d="$BKP/quarentena/$(dirname "${p#public/}")"; mkdir -p "$d"; mv "$p" "$d/"; echo "quarentenado: $p → $d/"
done

# ── Contenção B1: .ts/.tsx — só se P1 verde ──
if [ "$P1_OK" = "sim" ]; then
  echo "== P1 verde: aplicando deny .ts/.tsx =="
  if [ ! -f "$SNIP_TS" ]; then
    printf '%s\n' '# Elevacao Basal M1: fontes .ts/.tsx nunca sao servidas.' \
      'location ~* \.(ts|tsx)$ { deny all; return 404; }' > "$SNIP_TS"
  fi
  grep -q 'basal-m1-deny-fontes' "$VHOST" || \
    sed -i "0,/root  \/var\/www\/dshowdash\/public;/s//root  \/var\/www\/dshowdash\/public;\n    include snippets\/basal-m1-deny-fontes.conf;/" "$VHOST"
else
  echo "== P1 REPROVADO: bloqueio .ts/.tsx NAO aplicado (há import de fonte em runtime — ver $OUT) =="
  say ""; say "> Bloqueio .ts/.tsx adiado: rebuild dos bundles afetados é pré-requisito (estrangulamento §11)."
fi

rollback(){ echo '!! ROLLBACK Nginx'; cp -a "$BKP/dshowdash.com.br.vhost.bak" "$VHOST"; nginx -t && systemctl reload nginx; say ""; say "> Contenção revertida por falha de validação/smoke."; }
nginx -t || { rollback; exit 3; }
systemctl reload nginx || { rollback; exit 3; }

# ── Smoke ──
B="https://dshowdash.com.br"; code(){ curl -m 10 -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo ERR; }
S_HOME=$(code "$B/"); S_BUNDLE=$(code "$B/components/app-shell/dist/app-shell.bundle.js"); S_HEALTH=$(code "$B/api/health")
S_PATCH=$(code "$B/components/footer/components/registry/index.js.patch")
S_TS=$(code "$B/koala/src/api/client.ts")
say ""; say "## Smoke pós-contenção"; say '```text'
say "home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH patch=$S_PATCH ts=$S_TS  (P1=$P1_OK)"
say '```'
echo "smoke: home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH patch=$S_PATCH ts=$S_TS"

OKBASE=$([ "$S_HOME" = 200 ] && [ "$S_BUNDLE" = 200 ] && [ "$S_HEALTH" = 200 ] && [ "$S_PATCH" = 404 ] && echo 1 || echo 0)
OKTS=1; [ "$P1_OK" = "sim" ] && { [ "$S_TS" = 404 ] || OKTS=0; }
if [ "$OKBASE" = 1 ] && [ "$OKTS" = 1 ]; then
  say ""; say "> **Contenção aplicada.** Backup/quarentena: \`$BKP\`."
  echo "== M1b aplicado. Backup em $BKP =="
else
  rollback; exit 4
fi
