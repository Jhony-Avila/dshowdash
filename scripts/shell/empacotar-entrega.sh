#!/usr/bin/env bash
# scripts/shell/empacotar-entrega.sh — PACOTE DE ENTREGA do lote shell layout v2 (decisão #88).
# Uso: BASE_REF=<sha-base> bash scripts/shell/empacotar-entrega.sh <dir-das-auditorias> <dir-saida>
#   <dir-das-auditorias> = pasta com lv2on/ lv2on-light/ lv2on-rotas/ lv2off/ lv2prod-off/ r2both/ + GATES-LV2.txt,
#                          canary.txt, deploy.txt, tsc.txt, build.txt, handoff.txt
#   <dir-saida>          = ex.: /backup/entrega-shell-layout-v2-<ts>
# Gera evidencias/, screenshots/ (obrigatorias + matriz), commits.txt, candidato.patch, arvore.txt e SHA256SUMS
# ESTRITO (`<hash>  <path>`, sem cabeçalho), verificado com `sha256sum -c` antes de terminar.
set -euo pipefail
AUD="${1:?dir das auditorias}"; OUT="${2:?dir de saida}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$OUT/evidencias" "$OUT/screenshots/obrigatorias" "$OUT/screenshots/matriz"
cd "$RAIZ"
BASE_REF="${BASE_REF:-d7bfa379}"
{ echo "# base=${BASE_REF} head=$(git rev-parse HEAD) branch=$(git branch --show-current)"; git log --format='%H %ci %s' "${BASE_REF}..HEAD"; } > "$OUT/commits.txt"
git diff "${BASE_REF}...HEAD" > "$OUT/candidato.patch"
git ls-tree -r --name-only HEAD -- public/components/app-shell/layout-v2 public/components/header/mobile-v2 scripts/shell scripts/header public/index.html \
  public/components/panels/panel-avatar-studio/src/nucleo/flags.ts public/components/panels/panel-dashboard/src/styles/tokens.css docs/AVATAR-STUDIO-5/24-SHELL-LAYOUT-V2.md > "$OUT/arvore.txt"
for d in "$AUD"/*/; do n="$(basename "$d")"; [ -f "$d/lv2.json" ] && cp "$d/lv2.json" "$OUT/evidencias/audit-$n.json"; [ -f "$d/r2.json" ] && cp "$d/r2.json" "$OUT/evidencias/audit-$n.json"; [ -f "$d/GATES-R2.txt" ] && cp "$d/GATES-R2.txt" "$OUT/evidencias/GATES-R2-$n.txt"; done
for f in GATES-LV2.txt canary.txt deploy.txt tsc.txt build.txt handoff.txt lv2on.log lv2on-light.log lv2on-rotas.log lv2off.log lv2prod-off.log r2both.log; do [ -f "$AUD/$f" ] && cp "$AUD/$f" "$OUT/evidencias/$f"; done
cp_if() { [ -f "$1" ] && cp "$1" "$OUT/screenshots/obrigatorias/$2" || echo "  (ausente: $1)"; }
cp_if "$AUD/lv2on/1440x900-dash-dark-on.png"                    "01-desktop-sidebar-expandida-escuro.png"
cp_if "$AUD/lv2on/1440x900-dash-dark-on-sidebar-toggled.png"    "02-desktop-sidebar-recolhida-escuro.png"
cp_if "$AUD/lv2on-light/1440x900-dash-light-on.png"             "03-desktop-sidebar-expandida-claro.png"
cp_if "$AUD/lv2on-light/1440x900-dash-light-on-sidebar-toggled.png" "04-desktop-sidebar-recolhida-claro.png"
cp_if "$AUD/lv2on/390x844-dash-dark-on-gaveta.png"              "05-mobile-gaveta-aberta-escuro.png"
cp_if "$AUD/lv2on/390x844-dash-dark-on-gaveta-fechada.png"      "06-mobile-gaveta-fechada-escuro.png"
cp_if "$AUD/lv2on-light/390x844-dash-light-on-gaveta.png"       "07-mobile-gaveta-aberta-claro.png"
cp_if "$AUD/lv2on-light/390x844-dash-light-on-gaveta-fechada.png" "08-mobile-gaveta-fechada-claro.png"
cp_if "$AUD/lv2on/1440x900-dash-dark-on-fim.png"                "09-footer-pagina-longa-desktop-escuro.png"
cp_if "$AUD/lv2on-light/1440x900-dash-light-on-fim.png"         "10-footer-pagina-longa-desktop-claro.png"
cp_if "$AUD/lv2on/390x844-dash-dark-on-fim.png"                 "11-footer-pagina-longa-mobile-escuro.png"
cp_if "$AUD/lv2on-light/390x844-dash-light-on-fim.png"          "12-footer-pagina-longa-mobile-claro.png"
cp_if "$AUD/lv2on/768x1024-dash-dark-on.png"                    "13-tablet-sidebar-recolhida.png"
cp_if "$AUD/lv2on/768x1024-dash-dark-on-sidebar-toggled.png"    "14-tablet-sidebar-expandida.png"
cp_if "$AUD/lv2on/1024x768-dash-dark-on.png"                    "15-tablet-paisagem.png"
cp_if "$AUD/lv2on/360x780-dash-dark-on-gaveta.png"              "16-mobile-360-gaveta.png"
cp_if "$AUD/lv2on-rotas/390x844-avatar-dark-on.png"             "17-avatar-studio-mobile.png"
cp_if "$AUD/lv2on-rotas/1440x900-avatar-dark-on.png"            "18-avatar-studio-desktop.png"
cp_if "$AUD/lv2on/curta-1440.png"                               "19-footer-pagina-curta-desktop.png"
cp_if "$AUD/lv2on/curta-390.png"                                "20-footer-pagina-curta-mobile.png"
for d in lv2on lv2on-light lv2on-rotas lv2off lv2prod-off r2both; do [ -d "$AUD/$d" ] && mkdir -p "$OUT/screenshots/matriz/$d" && cp "$AUD/$d"/*.png "$OUT/screenshots/matriz/$d/" 2>/dev/null || true; done
cd "$OUT"
find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
sha256sum -c --quiet SHA256SUMS && echo "SHA256SUMS_OK $(wc -l < SHA256SUMS) arquivos em $OUT"
