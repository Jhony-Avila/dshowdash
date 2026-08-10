#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — M1d: fecha os itens P0/P1 seguros com ORÁCULO POR CONTENT-TYPE.
# Motivo (EB-013): este vhost faz SPA fallback (try_files → index.html), então
# status 200 não distingue "arquivo servido" de "shell do SPA". Verificamos o
# content-type: shell = text/html; arquivo cru = outro tipo.
# Ações: (1) desativa vhost órfão :8080  (2) deny .patch permanente (defesa;
# o arquivo já foi quarentenado na Onda 3). NÃO toca .ts (EB-010).
# Smoke na ORIGEM (bypass Cloudflare) + purge CF. Rollback automático.
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$REPO" || exit 1
TS="$(date +%Y%m%d-%H%M%S)"; DATA="$(date +%Y-%m-%d)"
OUT="docs/ELEVACAO-BASAL/evidencias/m1d-contencao-$DATA.md"
VHOST="/etc/nginx/sites-available/dshowdash.com.br"
ORFAO_EN="/etc/nginx/sites-enabled/dshowdash-v3"
SNIP_PATCH="/etc/nginx/snippets/basal-m1-deny-patch.conf"
BKP="/backup/elevacao-basal/$TS"
mkdir -p docs/ELEVACAO-BASAL/evidencias "$BKP"
say(){ printf '%s\n' "$*" >> "$OUT"; }
: > "$OUT"; say "# M1d — Contenção (oráculo por content-type) — $(date '+%Y-%m-%d %H:%M %Z')"

# origem, retorna "code|content_type"
hc(){ curl -m 10 -s -o /dev/null -w '%{http_code}|%{content_type}' \
      --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br$1" 2>/dev/null || echo "000|err"; }
p8080(){ curl -m 5 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ 2>/dev/null || echo 000; }

say ""; say "## Antes (origem)"; say '```text'
say "home=$(hc /)  bundle=$(hc /components/app-shell/dist/app-shell.bundle.js)"
say "health=$(hc /api/health)  patch=$(hc /components/footer/components/registry/index.js.patch)  8080=$(p8080)"
say '```'

cp -a "$VHOST" "$BKP/dshowdash.com.br.vhost.bak"
[ -e "$ORFAO_EN" ] && cp -a "$(readlink -f "$ORFAO_EN")" "$BKP/dshowdash-v3.vhost.bak" || true

# (1) desativa vhost órfão :8080
[ -e "$ORFAO_EN" ] && mv "$ORFAO_EN" "$BKP/dshowdash-v3.sites-enabled.link" || true
# (2) deny .patch permanente
if [ ! -f "$SNIP_PATCH" ]; then
  printf '%s\n' '# Elevacao Basal M1: .patch nunca e servido (residuo §3.7). Rollback: remover include.' \
    'location ~* \.patch$ { deny all; return 404; }' > "$SNIP_PATCH"
fi
grep -q 'basal-m1-deny-patch' "$VHOST" || \
  sed -i "0,/root  \/var\/www\/dshowdash\/public;/s//root  \/var\/www\/dshowdash\/public;\n    include snippets\/basal-m1-deny-patch.conf;/" "$VHOST"

rollback(){ echo '!! ROLLBACK'; cp -a "$BKP/dshowdash.com.br.vhost.bak" "$VHOST";
  [ -e "$BKP/dshowdash-v3.sites-enabled.link" ] && mv "$BKP/dshowdash-v3.sites-enabled.link" "$ORFAO_EN" || true
  nginx -t && systemctl reload nginx; say ""; say "> Revertido por regressão real."; }

nginx -t || { rollback; exit 3; }
systemctl reload nginx || { rollback; exit 3; }

# purge Cloudflare (segredo nunca impresso)
say ""; say "## Cloudflare purge"; say '```text'
if [ -f /root/.cloudflare.env ]; then
  ( set +x; . /root/.cloudflare.env
    if [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
      curl -m 15 -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' | grep -oE '"success":(true|false)' || echo '(sem resposta parseável)'
    else echo '(vars ausentes)'; fi ) >> "$OUT" 2>&1
else echo '(/root/.cloudflare.env ausente — purge manual)' >> "$OUT"; fi
say '```'

# smoke depois
H=$(hc /); B=$(hc /components/app-shell/dist/app-shell.bundle.js); HE=$(hc /api/health)
PA=$(hc /components/footer/components/registry/index.js.patch); P8=$(p8080)
say ""; say "## Depois (origem)"; say '```text'
say "home=$H  bundle=$B  health=$HE  patch=$PA  8080=$P8"
say '```'
echo "home=$H bundle=$B health=$HE patch=$PA 8080=$P8"

hcode(){ echo "${1%%|*}"; }; hct(){ echo "${1#*|}"; }
ok=1
[ "$(hcode "$H")" = 200 ] && echo "$(hct "$H")" | grep -qi 'text/html' || ok=0     # home = shell
[ "$(hcode "$B")" = 200 ] && echo "$(hct "$B")" | grep -qiE 'javascript|ecmascript' || ok=0  # bundle real
[ "$(hcode "$HE")" = 200 ] || ok=0
# .patch contido = shell (text/html) OU 403/404 — NUNCA servindo bytes do patch
{ echo "$(hct "$PA")" | grep -qi 'text/html' || [ "$(hcode "$PA")" = 404 ] || [ "$(hcode "$PA")" = 403 ]; } || ok=0
# 8080 não pode responder 200
[ "$P8" = 200 ] && ok=0

if [ "$ok" = 1 ]; then
  say ""; say "> **M1d aplicado.** vhost :8080 desativado, .patch contido. Backup: \`$BKP\`."
  echo "== M1d OK. Backup em $BKP =="
else
  rollback; exit 4
fi
