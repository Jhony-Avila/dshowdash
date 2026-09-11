#!/usr/bin/env bash
# scripts/header/empacotar-entrega.sh — monta o PACOTE DE ENTREGA do lote header mobile v2.
# Uso: bash scripts/header/empacotar-entrega.sh <dir-das-auditorias> <dir-saida>
#   <dir-das-auditorias> = pasta com before-prod/ off/ on/ on-*/ + GATES.txt/METRICAS.txt (gates-mobile-header.mjs)
#   <dir-saida>          = ex.: /backup/entrega-mobile-header-v2-<ts>  (nada é apagado; tudo com timestamp)
# Gera: evidencias/ (JSONs + gates + métricas), screenshots/ (as 12 obrigatórias + matriz), commits.txt,
#       candidato.patch, arvore.txt e SHA256SUMS ESTRITAMENTE válido (`<hash>  <path>`, sem cabeçalho) —
#       verificado com `sha256sum -c` antes de terminar (lição do lote anterior).
set -euo pipefail
AUD="${1:?dir das auditorias}"; OUT="${2:?dir de saida}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$OUT/evidencias" "$OUT/screenshots/obrigatorias" "$OUT/screenshots/matriz"
cd "$RAIZ"
# base do lote = commit de produção de onde a branch partiu (e825364b); depois do push p/ main
# `origin/main..HEAD` ficaria vazio — por isso a base é explícita (BASE_REF sobrescreve)
BASE_REF="${BASE_REF:-e825364b}"
{ echo "# base=${BASE_REF} head=$(git rev-parse HEAD) branch=$(git branch --show-current)"; git log --format='%H %ci %s' "${BASE_REF}..HEAD"; } > "$OUT/commits.txt"
git diff "${BASE_REF}...HEAD" > "$OUT/candidato.patch"
git ls-tree -r --name-only HEAD -- public/components/header/mobile-v2 scripts/header public/index.html \
  public/components/panels/panel-avatar-studio/src/nucleo/flags.ts public/components/panels/panel-avatar-studio/src/vc \
  public/components/panels/panel-avatar-studio/src/styles/visual-composer.css docs/AVATAR-STUDIO-5/23-MOBILE-HEADER-V2.md > "$OUT/arvore.txt"
for d in "$AUD"/*/; do n="$(basename "$d")"; [ -f "$d/audit.json" ] && cp "$d/audit.json" "$OUT/evidencias/audit-$n.json"; done
for f in GATES.txt METRICAS.txt consolidado.json vc-before.summary.txt vc-after.summary.txt vc-before-full.json vc-after.json; do [ -f "$AUD/$f" ] && cp "$AUD/$f" "$OUT/evidencias/$f"; done
# REGRESSION_GATE do Avatar Studio (vc-mobile-audit): screenshots antes/depois
for d in vc-before-full vc-after; do [ -d "$AUD/$d" ] && mkdir -p "$OUT/screenshots/avatar-studio/$d" && cp "$AUD/$d"/*.png "$OUT/screenshots/avatar-studio/$d/" 2>/dev/null || true; done
# as 12 screenshots obrigatórias (§7 do briefing)
cp_if() { [ -f "$1" ] && cp "$1" "$OUT/screenshots/obrigatorias/$2" || echo "  (ausente: $1)"; }
cp_if "$AUD/on/375x812-dash-dark.png"                 "01-dashboard-mobile-antes-de-abrir-painel.png"
cp_if "$AUD/on-long/375x812-dash-dark-long.png"        "02-header-nome-longo.png"
cp_if "$AUD/on-badge3/375x812-dash-dark-badge3.png"    "03-header-com-badges.png"
cp_if "$AUD/on/375x812-dash-dark-menu.png"             "04-menu-de-perfil-aberto.png"
cp_if "$AUD/on/375x812-dash-dark-notif.png"            "05-notificacoes-abertas.png"
cp_if "$AUD/on/390x844-dash-dark.png"                  "06-ticker-ativo.png"
cp_if "$AUD/on-ticker-off/390x844-dash-dark-tickeroff.png" "07-ticker-oculto.png"
cp_if "$AUD/on/375x812-avatar-dark.png"                "08-avatar-studio-aberto.png"
cp_if "$AUD/on/375x812-avatar-dark-scrolled.png"       "09-scroll-no-avatar-studio.png"
cp_if "$AUD/on/844x390-avatar-dark.png"                "10-landscape.png"
cp_if "$AUD/on-safe/375x812-dash-dark-safe47.png"      "11-safe-area-superior-simulada.png"
cp_if "$AUD/on/1440x900-dash-dark.png"                 "12-desktop-paridade.png"
cp_if "$AUD/on/375x812-dash-dark-mais.png"             "13-menu-mais-aberto.png"
cp_if "$AUD/before-prod/375x812-dash-dark.png"         "00-ANTES-producao-375-dashboard.png"
cp_if "$AUD/before-prod/375x812-avatar-dark.png"       "00-ANTES-producao-375-avatar-studio.png"
for d in on on-light before-prod off; do [ -d "$AUD/$d" ] && mkdir -p "$OUT/screenshots/matriz/$d" && cp "$AUD/$d"/*.png "$OUT/screenshots/matriz/$d/" 2>/dev/null || true; done
cd "$OUT"
find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
sha256sum -c --quiet SHA256SUMS && echo "SHA256SUMS_OK $(wc -l < SHA256SUMS) arquivos em $OUT"
