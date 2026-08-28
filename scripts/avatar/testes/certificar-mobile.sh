#!/usr/bin/env bash
# certificar-mobile.sh — TRACK C: rodada única e reproduzível de certificação.
# Valida SHAs, cria ambiente isolado (temporários), reusa PW_CHROME existente,
# build + harness + HTTP, roda SOMENTE os testes definidos, gera logs + boards,
# calcula hashes, encerra processos, limpa e imprime resumo.
#
# NÃO faz merge, deploy, rollout, reset, push nem --gravar. Read-only no git.
set -uo pipefail

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"
CERT="${CERT_DIR:-/tmp/trackc-cert-run}"
BASE_ESPERADA="${BASE_ESPERADA:-e456549f}"   # tree do candidato 31caaf8e
PORTA="${PORTA:-8901}"
rm -rf "$CERT"; mkdir -p "$CERT"/{logs,boards,hashes}

echo ">> [1/8] SHAs e ancestralidade"
git --no-pager rev-parse --short HEAD
TREE="$(git rev-parse HEAD^{tree})"
echo "   HEAD tree: $TREE"
git merge-base --is-ancestor ba4bf4d3 HEAD && echo "   ba4bf4d3 ancestral: SIM" || { echo "   ERRO: ba4bf4d3 nao e ancestral"; exit 3; }
echo "   flag default:"; grep -n "'as6.mobile_studio': false" public/components/panels/panel-avatar-studio/src/nucleo/flags.ts >/dev/null && echo "   as6.mobile_studio = OFF (ok)" || { echo "   ERRO: flag nao esta OFF"; exit 3; }

echo ">> [2/8] PW_CHROME"
export PW_CHROME="${PW_CHROME:-$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1)}"
[ -x "$PW_CHROME" ] && echo "   $PW_CHROME" || { echo "   ERRO: Chromium nao encontrado"; exit 3; }

echo ">> [3/8] build (dentro do panel) + harness (da raiz)"
( cd public/components/panels/panel-avatar-studio && npx vite build ) >"$CERT/logs/build.log" 2>&1 && echo "   build OK" || { echo "   ERRO build"; tail -20 "$CERT/logs/build.log"; exit 4; }
node scripts/avatar/gerar-harness.mjs avatar >"$CERT/logs/harness.log" 2>&1 && echo "   harness OK" || { echo "   ERRO harness"; exit 4; }

echo ">> [4/8] HTTP :$PORTA"
( cd public && python3 -m http.server "$PORTA" ) >"$CERT/logs/http.log" 2>&1 &
SRV=$!
sleep 2
curl -sf "http://127.0.0.1:$PORTA/avst-harness.html" >/dev/null && echo "   harness servido" || { echo "   ERRO HTTP"; kill $SRV 2>/dev/null; exit 4; }

MOBILE="mobile-shell-layout mobile-touch-navigation mobile-category-flow mobile-asset-selection mobile-color-controls mobile-tools-overlays mobile-save-flow mobile-legacy-compat mobile-keyboard-viewport mobile-safe-area mobile-orientation-change mobile-landscape mobile-small-screen-320 mobile-tablet-layout mobile-accessibility-smoke mobile-performance-smoke mobile-viewport-matrix desktop-responsive-regression"
V43="v43-single2d-parity v43-single2d-flow v43-legacy-compat v43-category-focus"

echo ">> [5/8] testes definidos (sem suite completa)"
PASS=0; FAIL=0; REDS=""
for t in $MOBILE $V43; do
  if node scripts/avatar/testes/$t.mjs >"$CERT/logs/$t.log" 2>&1; then PASS=$((PASS+1)); echo "   OK  $t"; else FAIL=$((FAIL+1)); REDS="$REDS $t"; echo "   RED $t"; fi
done

echo ">> [6/8] boards"
if [ "${SKIP_BOARDS:-0}" = "1" ]; then
  echo "   (SKIP_BOARDS=1 — pulando geração de boards nesta execução)"
else
  OUTPKG="$CERT/boards" node scripts/avatar/testes/gerar-boards-mobile-cert.mjs >"$CERT/logs/boards.log" 2>&1 && echo "   $(ls "$CERT/boards" | wc -l) boards" || echo "   AVISO: boards falharam (ver log)"
fi

echo ">> [7/8] hashes + encerra processos + limpa temporarios de sessao"
for f in flags.ts workspace/mobileStudio.ts shell/ShellStudio.tsx styles/mobile.css app/App.tsx; do
  p="public/components/panels/panel-avatar-studio/src/$f"; [ -f "$p" ] && sha256sum "$p"
done > "$CERT/hashes/trackc-src.txt"
echo "   hashes em $CERT/hashes/trackc-src.txt"
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
pkill -f "http.server $PORTA" 2>/dev/null || true

echo ">> [8/8] side effects (git deve continuar limpo e sem push)"
DIRTY="$(git status --porcelain | wc -l | tr -d ' ')"
echo "   working tree entries alteradas: $DIRTY (esperado 0 se nada novo foi gerado no tree versionado)"
echo "   main remoto: $(git ls-remote origin refs/heads/main 2>/dev/null | cut -c1-8 || echo '(sem rede)')"

echo ""
echo "==================== RESUMO ===================="
echo "HEAD tree            : $TREE"
echo "MOBILE+CERT verdes   : $PASS de $((18+4)) (inclui 4 regressoes V4.3)"
echo "VERMELHOS            :${REDS:- nenhum}"
echo "boards               : $(ls "$CERT/boards" 2>/dev/null | wc -l)"
echo "logs                 : $CERT/logs"
echo "MERGE/DEPLOY/ROLLOUT/PUSH/RESET/--gravar : NAO (este script nao executa nenhum)"
echo "================================================"
[ $FAIL -eq 0 ] && { echo "CERT: VERDE"; exit 0; } || { echo "CERT: $FAIL VERMELHO(S)"; exit 1; }
