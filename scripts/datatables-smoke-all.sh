#!/bin/bash
# scripts/datatables-smoke-all.sh — RUNNER DE REGRESSAO oficial do DataTables.
# @version 1.0.0  @created 2026-07-20
#
# Roda:
#   (1) suite PHP deterministica (cripto, classificador, alertas, contratos)
#   (2) smoke HTTP no ORIGIN (bypassa Cloudflare) — todas as rotas devem exigir sessao
#   (3) sintaxe dos arquivos do modulo (php -l + node --check)
#   (4) contrato do cron nos 4 modos
#   (5) smoke de UI no navegador (opcional; PULA se nao houver browser/sessao)
#       DT_UI_THEME=light|dark|both para escolher o tema (default: dark)
#
# Exit 0 = tudo PASS.  Uso: bash scripts/datatables-smoke-all.sh
set -uo pipefail
ROOT=/var/www/dshowdash
FAIL=0

echo "═══════════════════════════════════════════════════════"
echo "  DATATABLES SMOKE ALL — regressao completa"
echo "═══════════════════════════════════════════════════════"

# ── (1) Suite deterministica ────────────────────────────────────
php "$ROOT/scripts/datatables-smoke-all.php" || FAIL=1

# ── (2) Smoke HTTP no origin ────────────────────────────────────
# --resolve aponta direto ao 127.0.0.1: sessao forjada cai pela borda CF.
echo
echo "── Smoke HTTP (origin, bypassa Cloudflare) ─────────────────"
ROTAS="health dashboard lookups infrastructure applications servers dependencies databases tables fields/sensitive quality alerts sources connections maintenance admin"
for r in $ROTAS; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --resolve dshowdash.com.br:443:127.0.0.1 \
    "https://dshowdash.com.br/api/datatables/$r" -k 2>/dev/null)
  # 401 e o esperado SEM sessao: prova que o gate esta ativo e a rota existe.
  if [ "$CODE" = "401" ]; then
    printf "  [PASS] /%-18s exige sessao (401)\n" "$r"
  else
    printf "  [FAIL] /%-18s devolveu %s (esperado 401)\n" "$r" "$CODE"
    FAIL=1
  fi
done

# Rota inexistente tambem deve dar 401 (auth antes do roteamento):
# 404 aqui vazaria quais rotas existem para quem nao esta autenticado.
CODE=$(curl -s -o /dev/null -w "%{http_code}" --resolve dshowdash.com.br:443:127.0.0.1 \
  "https://dshowdash.com.br/api/datatables/rota-que-nao-existe" -k 2>/dev/null)
if [ "$CODE" = "401" ]; then
  echo "  [PASS] rota inexistente nao vaza (401, nao 404)"
else
  echo "  [FAIL] rota inexistente devolveu $CODE (esperado 401)"; FAIL=1
fi

# Assets do painel precisam estar servindo.
# (panel.css saiu na Fase 4 — era do legado vanilla, removido.)
for a in index.js; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --resolve dshowdash.com.br:443:127.0.0.1 \
    "https://dshowdash.com.br/components/panels/panel-datatables/$a" -k 2>/dev/null)
  if [ "$CODE" = "200" ]; then
    printf "  [PASS] painel %-10s servido (200)\n" "$a"
  else
    printf "  [FAIL] painel %-10s devolveu %s\n" "$a" "$CODE"; FAIL=1
  fi
done

# ── (3) Sintaxe ─────────────────────────────────────────────────
echo
echo "── Sintaxe ─────────────────────────────────────────────────"
SYNTAX_ERR=0
while IFS= read -r f; do
  if ! php -l "$f" >/dev/null 2>&1; then
    echo "  [FAIL] php -l $f"; SYNTAX_ERR=1
  fi
done < <(find "$ROOT/api/datatables" -name '*.php' 2>/dev/null)
php -l "$ROOT/scripts/datatables-monitor.php" >/dev/null 2>&1 || { echo "  [FAIL] datatables-monitor.php"; SYNTAX_ERR=1; }
[ $SYNTAX_ERR -eq 0 ] && echo "  [PASS] todos os .php do modulo compilam" || FAIL=1

if command -v node >/dev/null 2>&1; then
  if node --check "$ROOT/public/components/panels/panel-datatables/index.js" >/dev/null 2>&1; then
    echo "  [PASS] painel index.js compila (node --check)"
  else
    echo "  [FAIL] painel index.js NAO compila"; FAIL=1
  fi
fi

# ── (4) Contrato do cron ────────────────────────────────────────
echo
echo "── Cron: os 4 modos respondem ──────────────────────────────"
# quality/inventory ficam mais pesados conforme cresce o catalogo (bancos remotos monitorados);
# quality e limitado por orcamento de tempo POR CONEXAO (§25), entao damos folga proporcional.
for m in check inventory quality maintain; do
  case "$m" in quality) TMO=360 ;; inventory) TMO=240 ;; *) TMO=120 ;; esac
  OUT=$(timeout "$TMO" php "$ROOT/scripts/datatables-monitor.php" --mode="$m" 2>&1)
  RC=$?
  if [ $RC -eq 0 ] && echo "$OUT" | grep -q "modo=$m concluido"; then
    printf "  [PASS] --mode=%-10s concluiu\n" "$m"
  else
    printf "  [FAIL] --mode=%-10s rc=%s\n" "$m" "$RC"
    echo "$OUT" | tail -3 | sed 's/^/         /'
    FAIL=1
  fi
done

# Modo desconhecido precisa sair 2 (nao 0 silencioso).
timeout 30 php "$ROOT/scripts/datatables-monitor.php" --mode=inexistente >/dev/null 2>&1
[ $? -eq 2 ] && echo "  [PASS] modo desconhecido sai com codigo 2" \
             || { echo "  [FAIL] modo desconhecido nao saiu 2"; FAIL=1; }

# ── (5) Smoke de UI (opcional) ──────────────────────────────────
# Exige Playwright + sessao. Ausente => PULADO, nunca falha o runner:
# um ambiente sem browser nao pode reprovar um deploy de backend.
# Dois defeitos reais deste modulo passaram por TODAS as suites de backend e
# so apareceram na tela — por isso este estagio existe.
echo
echo "── UI: painel no navegador ─────────────────────────────────"
UI="$ROOT/tools/screenshot/datatables-ui-smoke.mjs"
if [ ! -f "$UI" ]; then
  echo "  [SKIP] script de smoke de UI ausente"
elif ! command -v node >/dev/null 2>&1; then
  echo "  [SKIP] node indisponivel"
else
  UI_OUT=$(cd "$ROOT/tools/screenshot" && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
           timeout 300 node datatables-ui-smoke.mjs --theme="${DT_UI_THEME:-dark}" 2>/dev/null)
  UI_RC=$?
  UI_RESUMO=$(echo "$UI_OUT" | grep -E '^SMOKE-UI:' | tail -1)
  case $UI_RC in
    0) echo "  [PASS] ${UI_RESUMO:-UI OK}" ;;
    2) echo "  [SKIP] ${UI_RESUMO:-sem browser ou sessao}" ;;
    *) echo "  [FAIL] ${UI_RESUMO:-smoke de UI falhou}"
       echo "$UI_OUT" | grep -E '^\s+\[FAIL\]|^Falharam:' | head -8 | sed 's/^/       /'
       FAIL=1 ;;
  esac
fi

# ── Resumo ──────────────────────────────────────────────────────
echo
echo "═══════════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo "  RESULTADO GERAL: PASS"
else
  echo "  RESULTADO GERAL: FAIL — ver linhas [FAIL] acima"
fi
echo "═══════════════════════════════════════════════════════"
exit $FAIL
