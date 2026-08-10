#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — M1e: fecha phpMyAdmin ao público (reversível) + recon UFW/MySQL.
# SEGURANÇA: NÃO altera firewall nem bind do MySQL (tripwire "nunca autônomo:
# infra/credenciais"). Só o Nginx do phpMyAdmin (reversível) + coleta read-only.
# Detecta o IP da sessão SSH atual como base do allowlist.
# Uso: bash scripts/basal/m1e-phpmyadmin-recon.sh
#      ALLOW_IP=1.2.3.4 bash ...   (força um IP específico no allowlist)
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$REPO" || exit 1
TS="$(date +%Y%m%d-%H%M%S)"; DATA="$(date +%Y-%m-%d)"
OUT="docs/ELEVACAO-BASAL/evidencias/m1e-phpmyadmin-recon-$DATA.md"
VHOST="/etc/nginx/sites-available/dshowdash.com.br"
BKP="/backup/elevacao-basal/$TS"
mkdir -p docs/ELEVACAO-BASAL/evidencias "$BKP"
say(){ printf '%s\n' "$*" >> "$OUT"; }
: > "$OUT"; say "# M1e — phpMyAdmin allowlist + recon UFW/MySQL — $(date '+%Y-%m-%d %H:%M %Z')"

# IP da sessão SSH atual (base do allowlist)
SSHIP="${ALLOW_IP:-}"
[ -z "$SSHIP" ] && SSHIP="$(printf '%s' "${SSH_CONNECTION:-}" | awk '{print $1}')"
[ -z "$SSHIP" ] && SSHIP="$(printf '%s' "${SSH_CLIENT:-}" | awk '{print $1}')"
say ""; say "## IP de origem detectado (allowlist)"; say '```text'
say "SSH origin = ${SSHIP:-<não detectado>}"; say '```'

# ── RECON read-only ──
say ""; say "## UFW status"; say '```text'
{ ufw status verbose 2>/dev/null || echo "(ufw inativo/sem permissão — rode: sudo ufw status verbose)"; } >> "$OUT"
say '```'
say ""; say "## 3306 — bind e alcance"; say '```text'
ss -tlnp 2>/dev/null | grep ':3306' >> "$OUT" || echo "(3306 não visível)" >> "$OUT"
say '```'
say ""; say "## Hosts remotos provisionados no MySQL (só a coluna host — sem segredos)"; say '```text'
# usa socket auth do root do SO se disponível; nunca imprime senha
{ mysql -N -e "SELECT DISTINCT host FROM mysql.user ORDER BY host;" 2>/dev/null \
  || echo "(sem acesso por socket — rode manualmente: mysql -e \"SELECT DISTINCT host FROM mysql.user;\")"; } >> "$OUT"
say '```'
say ""; say "## Comandos GUARDADOS p/ allowlist do 3306 (NÃO aplicados — confirmação do Jhony)"; say '```bash'
say "# Fecham o 3306 ao público SEM mexer no SSH nem no default policy do ufw:"
say "sudo ufw allow from ${SSHIP:-SEU_IP} to any port 3306 proto tcp   # libera seu IP"
say "sudo ufw deny 3306/tcp                                            # nega o resto (regra específica acima tem prioridade)"
say "# repita o 'allow from' para cada IP/consumidor externo legítimo antes do deny."
say '```'

# ── phpMyAdmin: allowlist reversível ──
if [ -z "$SSHIP" ]; then
  echo "SEM IP detectado — phpMyAdmin NÃO alterado. Rode com ALLOW_IP=seu.ip ..."
  say ""; say "> phpMyAdmin não alterado (IP de origem não detectado)."
  exit 2
fi
cp -a "$VHOST" "$BKP/dshowdash.com.br.vhost.bak"
if ! grep -q 'basal-m1-pma-allow' "$VHOST"; then
  # insere allow/deny logo após a abertura do bloco 'location ^~ /phpmyadmin/ {'
  sed -i "s@\(location \^~ /phpmyadmin/ {\)@\1\n        # basal-m1-pma-allow (Elevacao Basal): fecha ao publico, mantem seu IP + localhost\n        allow 127.0.0.1;\n        allow ${SSHIP};\n        deny all;@" "$VHOST"
fi

rollback(){ echo '!! ROLLBACK'; cp -a "$BKP/dshowdash.com.br.vhost.bak" "$VHOST"; nginx -t && systemctl reload nginx; say ""; say "> Revertido."; }
nginx -t || { rollback; exit 3; }
systemctl reload nginx || { rollback; exit 3; }

# purge CF
if [ -f /root/.cloudflare.env ]; then ( set +x; . /root/.cloudflare.env
  [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && \
  curl -m15 -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
   -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H 'Content-Type: application/json' \
   --data '{"purge_everything":true}' >/dev/null 2>&1 || true ); fi

# smoke (content-type): app segue viva; pma NÃO deve responder do IP do servidor (deny all p/ localhost? não: localhost permitido)
hc(){ curl -m10 -s -o /dev/null -w '%{http_code}|%{content_type}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br$1" 2>/dev/null || echo "000|err"; }
H=$(hc /); HE=$(hc /api/health)
say ""; say "## Smoke pós-allowlist (origem)"; say '```text'
say "home=$H health=$HE  (pma: allow 127.0.0.1 + ${SSHIP}, deny all)"; say '```'
echo "home=$H health=$HE"
if [ "${H%%|*}" = 200 ] && echo "${H#*|}" | grep -qi 'text/html' && [ "${HE%%|*}" = 200 ]; then
  say ""; say "> **M1e aplicado.** phpMyAdmin restrito a 127.0.0.1 + ${SSHIP}. Backup: \`$BKP\`."
  echo "== M1e OK. phpMyAdmin restrito. Backup em $BKP =="
else
  rollback; exit 4
fi
