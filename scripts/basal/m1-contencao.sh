#!/usr/bin/env bash
# ============================================================================
# Elevação Basal — M1: Contenção P0 (Onda 2) — ver docs/ELEVACAO-BASAL/20-plano-m1-contencao.md
# Fase A: pré-checks read-only → evidencias/m1-prechecks-<data>.md (sem segredos)
# Fase B: SÓ se A1 e A2 verdes: bloqueia .ts/.tsx no vhost + desativa vhost :8080,
#         com backup timestampado, nginx -t, reload e smoke com rollback automático.
# Uso: bash scripts/basal/m1-contencao.sh          (Fase A + B se liberada)
#      SOMENTE_PRECHECKS=1 bash scripts/basal/m1-contencao.sh   (só Fase A)
# ============================================================================
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$REPO" || exit 1
DATA="$(date +%Y-%m-%d)"; TS="$(date +%Y%m%d-%H%M%S)"
OUT="docs/ELEVACAO-BASAL/evidencias/m1-prechecks-$DATA.md"
VHOST="/etc/nginx/sites-available/dshowdash.com.br"
VHOST_EN="/etc/nginx/sites-enabled/dshowdash.com.br"
ORFAO_EN="/etc/nginx/sites-enabled/dshowdash-v3"
SNIP="/etc/nginx/snippets/basal-m1-deny-fontes.conf"
BKP="/backup/elevacao-basal/$TS"
mkdir -p docs/ELEVACAO-BASAL/evidencias

say(){ printf '%s\n' "$*" >> "$OUT"; }
: > "$OUT"
say "# M1 — Pré-checks de contenção — $(date '+%Y-%m-%d %H:%M %Z')"

# ── A1: consumidores de .ts/.tsx no runtime ─────────────────────────────────
say ""; say "## A1 — Referências de carga a .ts/.tsx em JS/HTML servidos"; say '```text'
A1_HITS="$(grep -rInE '["'\''](/[A-Za-z0-9_./-]+\.tsx?)["'\'']' public/ \
  --include='*.js' --include='*.mjs' --include='*.html' 2>/dev/null \
  | grep -vE 'sourceMappingURL|node_modules|/dist/[^:]*\.map|\.md:' \
  | grep -vE '^\s*//|^\S+:\s*//' || true)"
if [ -n "$A1_HITS" ]; then printf '%s\n' "$A1_HITS" | head -60 >> "$OUT"; else echo "(nenhuma referência de carga encontrada)" >> "$OUT"; fi
say '```'
A1_OK=$([ -z "$A1_HITS" ] && echo sim || echo NAO)
say ""; say "**A1 liberado: $A1_OK**"

# ── A2: consumidores do vhost :8080 ─────────────────────────────────────────
say ""; say "## A2 — Consumidores da porta 8080"; say '```text'
A2_HITS="$( { grep -rInE '(:|=)\s*8080' /etc/cloudflared/ /root/.cloudflared/ 2>/dev/null | grep -vE 'secret|token' ; \
  crontab -l 2>/dev/null | grep -n '8080'; \
  grep -rIn '8080' /etc/systemd/system/*.service 2>/dev/null; } || true)"
if [ -n "$A2_HITS" ]; then printf '%s\n' "$A2_HITS" | head -20 >> "$OUT"; else echo "(nenhum consumidor de :8080 encontrado)" >> "$OUT"; fi
say '```'
A2_OK=$([ -z "$A2_HITS" ] && echo sim || echo NAO)
say ""; say "**A2 liberado: $A2_OK**"

# ── A3: controle de acesso do /phpmyadmin/ ──────────────────────────────────
say ""; say "## A3 — Controles de acesso nas locations do phpMyAdmin"; say '```text'
awk '/location .*phpmyadmin/,/^\s*}\s*$/' "$VHOST" 2>/dev/null \
  | grep -nE 'location|allow|deny|auth_basic|include|satisfy|return' >> "$OUT" || echo "(vhost não legível)" >> "$OUT"
say '```'

# ── A4: firewall × 3306 ─────────────────────────────────────────────────────
say ""; say "## A4 — Firewall (regras relevantes a 3306/8080/22)"; say '```text'
{ ufw status verbose 2>/dev/null | grep -viE 'logging' || iptables -S 2>/dev/null | grep -E '3306|8080|INPUT -P' || echo "(sem ufw/iptables legível)"; } >> "$OUT"
say '```'

# ── A5: processos das portas desconhecidas ──────────────────────────────────
say ""; say "## A5 — Processos em 20241/37865"; say '```text'
ss -tlnp 2>/dev/null | grep -E ':(20241|37865)\s' >> "$OUT" || echo "(portas não encontradas agora)" >> "$OUT"
say '```'

# ── A6: busca completa por .patch em public/ ────────────────────────────────
say ""; say "## A6 — Arquivos .patch sob public/ (busca completa)"; say '```text'
find public -type f -name '*.patch' 2>/dev/null >> "$OUT" || true
[ -z "$(find public -type f -name '*.patch' 2>/dev/null)" ] && echo "(nenhum .patch encontrado)" >> "$OUT"
say '```'

echo "Fase A concluída → $OUT (A1=$A1_OK A2=$A2_OK)"
[ "${SOMENTE_PRECHECKS:-0}" = "1" ] && exit 0

# ── Fase B ──────────────────────────────────────────────────────────────────
if [ "$A1_OK" != "sim" ] || [ "$A2_OK" != "sim" ]; then
  echo "FASE B NÃO EXECUTADA: pré-check reprovado (A1=$A1_OK A2=$A2_OK). Revisar $OUT."
  say ""; say "> Fase B NÃO executada (pré-check reprovado)."
  exit 2
fi

echo "== Fase B: aplicando contenções (backup em $BKP) =="
mkdir -p "$BKP"
cp -a "$VHOST" "$BKP/dshowdash.com.br.vhost.bak"
[ -e "$ORFAO_EN" ] && cp -a "$(readlink -f "$ORFAO_EN")" "$BKP/dshowdash-v3.vhost.bak" || true

# B1: snippet deny .ts/.tsx + include no vhost (idempotente)
if [ ! -f "$SNIP" ]; then
  printf '%s\n' \
    '# Elevacao Basal M1 (docs/ELEVACAO-BASAL/20): fontes nunca sao servidas.' \
    '# Rollback: remover a linha include no vhost + reload.' \
    'location ~* \.(ts|tsx)$ { deny all; return 404; }' > "$SNIP"
fi
if ! grep -q 'basal-m1-deny-fontes' "$VHOST"; then
  # insere o include logo após o root do server 443
  sed -i "0,/root  \/var\/www\/dshowdash\/public;/s//root  \/var\/www\/dshowdash\/public;\n    include snippets\/basal-m1-deny-fontes.conf;/" "$VHOST"
fi

# B2: desativa vhost órfão (symlink → /backup; sites-available intacto)
if [ -L "$ORFAO_EN" ] || [ -e "$ORFAO_EN" ]; then mv "$ORFAO_EN" "$BKP/dshowdash-v3.sites-enabled.link"; fi

rollback(){
  echo '!! ROLLBACK: restaurando Nginx anterior'
  cp -a "$BKP/dshowdash.com.br.vhost.bak" "$VHOST"
  [ -e "$BKP/dshowdash-v3.sites-enabled.link" ] && mv "$BKP/dshowdash-v3.sites-enabled.link" "$ORFAO_EN" || true
  nginx -t && systemctl reload nginx
  say ""; say "> Fase B aplicada e REVERTIDA por falha de validação/smoke."
}

nginx -t || { rollback; exit 3; }
systemctl reload nginx || { rollback; exit 3; }

# B3: smoke
B="https://dshowdash.com.br"
code(){ curl -m 10 -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo ERR; }
S_HOME=$(code "$B/"); S_BUNDLE=$(code "$B/components/app-shell/dist/app-shell.bundle.js")
S_HEALTH=$(code "$B/api/health"); S_TS1=$(code "$B/koala/src/api/client.ts"); S_TS2=$(code "$B/components/_shared/icons.ts")
S_8080=$(curl -m 5 -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080/" 2>/dev/null || echo REFUSED)
say ""; say "## Fase B — smoke pós-contenção"; say '```text'
say "home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH ts1=$S_TS1 ts2=$S_TS2 porta8080=$S_8080"
say '```'
echo "smoke: home=$S_HOME bundle=$S_BUNDLE health=$S_HEALTH ts=$S_TS1/$S_TS2 8080=$S_8080"

if [ "$S_HOME" = 200 ] && [ "$S_BUNDLE" = 200 ] && [ "$S_HEALTH" = 200 ] && [ "$S_TS1" = 404 ] && [ "$S_TS2" = 404 ]; then
  say ""; say "> **Fase B APLICADA com sucesso.** Backup: \`$BKP\`. Rollback: doc 20."
  echo "== M1 aplicado. Backup em $BKP =="
else
  rollback; exit 4
fi
