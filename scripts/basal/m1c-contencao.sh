#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — M1c: contenção LIMPA dos itens P0/P1 seguros, verificada na ORIGEM.
# Fecha o que NÃO depende do build canônico:
#   1) regra Nginx permanente deny .patch (arquivo já quarentenado na Onda 3)
#   2) desativa o vhost órfão :8080 (A2 comprovou 0 consumidores)
# NÃO toca em .ts/.tsx (EB-010: runtime importa .ts; adiado p/ M5/M6).
# Smoke testa a ORIGEM (bypass Cloudflare) e purga o CF ao final (EB-011).
# Uso: bash scripts/basal/m1c-contencao.sh
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$REPO" || exit 1
TS="$(date +%Y%m%d-%H%M%S)"; DATA="$(date +%Y-%m-%d)"
OUT="docs/ELEVACAO-BASAL/evidencias/m1c-contencao-$DATA.md"
VHOST="/etc/nginx/sites-available/dshowdash.com.br"
ORFAO_EN="/etc/nginx/sites-enabled/dshowdash-v3"
SNIP_PATCH="/etc/nginx/snippets/basal-m1-deny-patch.conf"
BKP="/backup/elevacao-basal/$TS"
mkdir -p docs/ELEVACAO-BASAL/evidencias "$BKP"
say(){ printf '%s\n' "$*" >> "$OUT"; }
: > "$OUT"; say "# M1c — Contenção limpa (origem-verificada) — $(date '+%Y-%m-%d %H:%M %Z')"

# smoke na ORIGEM (não passa pelo Cloudflare): --resolve mantém SNI/cert corretos
oc(){ curl -m 10 -s -o /dev/null -w '%{http_code}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br$1" 2>/dev/null || echo ERR; }

echo "== Backup do vhost em $BKP =="
cp -a "$VHOST" "$BKP/dshowdash.com.br.vhost.bak"
[ -e "$ORFAO_EN" ] && cp -a "$(readlink -f "$ORFAO_EN")" "$BKP/dshowdash-v3.vhost.bak" || true

# baseline na origem ANTES
say ""; say "## Origem — antes"; say '```text'
say "patch=$(oc /components/footer/components/registry/index.js.patch) 8080=$(curl -m5 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ 2>/dev/null || echo REFUSED) home=$(oc /) health=$(oc /api/health)"
say '```'

# ── 1) deny .patch (permanente) ──
if [ ! -f "$SNIP_PATCH" ]; then
  printf '%s\n' '# Elevacao Basal M1: .patch nunca e servido (residuo §3.7). Rollback: remover include.' \
    'location ~* \.patch$ { deny all; return 404; }' > "$SNIP_PATCH"
fi
grep -q 'basal-m1-deny-patch' "$VHOST" || \
  sed -i "0,/root  \/var\/www\/dshowdash\/public;/s//root  \/var\/www\/dshowdash\/public;\n    include snippets\/basal-m1-deny-patch.conf;/" "$VHOST"

# ── 2) desativa vhost órfão :8080 ──
[ -e "$ORFAO_EN" ] && mv "$ORFAO_EN" "$BKP/dshowdash-v3.sites-enabled.link" || true

rollback(){ echo '!! ROLLBACK'; cp -a "$BKP/dshowdash.com.br.vhost.bak" "$VHOST";
  [ -e "$BKP/dshowdash-v3.sites-enabled.link" ] && mv "$BKP/dshowdash-v3.sites-enabled.link" "$ORFAO_EN" || true
  nginx -t && systemctl reload nginx; say ""; say "> Revertido por falha de validação/smoke."; }

nginx -t || { rollback; exit 3; }
systemctl reload nginx || { rollback; exit 3; }

# ── purge Cloudflare (segredo nunca impresso) ──
say ""; say "## Cloudflare purge"; say '```text'
if [ -f /root/.cloudflare.env ]; then
  ( set +x; . /root/.cloudflare.env
    if [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
      curl -m 15 -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' | grep -oE '"success":(true|false)' || echo '(sem resposta parseável)'
    else echo '(vars CLOUDFLARE_ZONE_ID/API_TOKEN ausentes no env)'; fi
  ) >> "$OUT" 2>&1
else echo '(/root/.cloudflare.env ausente — purge manual necessário)' >> "$OUT"; fi
say '```'

# ── smoke na ORIGEM depois ──
S_HOME=$(oc /); S_BUNDLE=$(oc /components/app-shell/dist/app-shell.bundle.js); S_HEALTH=$(oc /api/health)
S_PATCH=$(oc /components/footer/components/registry/index.js.patch)
S_8080=$(curl -m5 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ 2>/dev/null || echo REFUSED)
say ""; say "## Origem — depois"; say '```text'
say "home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH patch=$S_PATCH 8080=$S_8080"
say '```'
echo "smoke(origem): home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH patch=$S_PATCH 8080=$S_8080"

if [ "$S_HOME" = 200 ] && [ "$S_BUNDLE" = 200 ] && [ "$S_HEALTH" = 200 ] && [ "$S_PATCH" = 404 ] && [ "$S_8080" != 200 ]; then
  say ""; say "> **M1c aplicado.** Backup: \`$BKP\`. Rollback: restaurar vhost + recriar symlink + reload."
  echo "== M1c OK. Backup em $BKP =="
else
  rollback; exit 4
fi
