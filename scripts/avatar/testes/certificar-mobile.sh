#!/usr/bin/env bash
# certificar-mobile.sh — TRACK C: rodada única e reproduzível de certificação,
# resistente aos limites reais do ambiente.
#
# Robustez: porta dinâmica verificada · trap de encerramento (browser/http) ·
# testes sequenciais com timeout explícito por teste · limpeza de chromium entre
# grupos · checagem de memória por etapa · logs por etapa · classificação de
# falha (PRODUTO/TESTE/INFRA) · resumo mesmo em falha · retomada segura (limpa
# estado antes de começar). NÃO faz merge/deploy/rollout/reset/push/--gravar.
set -uo pipefail

REPO="$(git rev-parse --show-toplevel)"; cd "$REPO"
CERT="${CERT_DIR:-/tmp/trackc-cert-run}"
TEST_TIMEOUT="${TEST_TIMEOUT:-120}"
rm -rf "$CERT"; mkdir -p "$CERT"/{logs,boards,hashes}
SRV=""; FAILED_STAGES=0; declare -a REDS=()

log(){ echo ">> $*"; }
mem(){ free -m 2>/dev/null | awk '/Mem:/{printf "mem: %sMB usados / %sMB total",$3,$2}' || echo "mem: (indisponível)"; }
limpar(){ [ -n "$SRV" ] && kill "$SRV" 2>/dev/null; pkill -f "http.server ${PORTA:-}" 2>/dev/null; pkill -f "chrome-linux/chrome" 2>/dev/null; wait 2>/dev/null; }
trap 'limpar' EXIT INT TERM

# porta livre dinâmica
achar_porta(){ for p in 8901 8911 8921 8931 8941; do if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "$p"; return; fi; done; echo 8951; }
PORTA="$(achar_porta)"

log "[1/9] preflight — SHAs, ancestralidade, flag ($(mem))"
HEAD_SHA="$(git rev-parse --short HEAD)"; TREE="$(git rev-parse HEAD^{tree})"
echo "   HEAD=$HEAD_SHA tree=$TREE"
git merge-base --is-ancestor ba4bf4d3 HEAD && echo "   ba4bf4d3 ancestral: SIM" || { echo "   INFRA-FAIL: ba4bf4d3 nao ancestral"; FAILED_STAGES=$((FAILED_STAGES+1)); }
grep -q "'as6.mobile_studio': false" public/components/panels/panel-avatar-studio/src/nucleo/flags.ts && echo "   flag OFF: ok" || { echo "   PRODUTO-FAIL: flag nao OFF"; FAILED_STAGES=$((FAILED_STAGES+1)); }

log "[2/9] PW_CHROME"
export PW_CHROME="${PW_CHROME:-$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1)}"
[ -x "$PW_CHROME" ] && echo "   $PW_CHROME" || { echo "   INFRA-FAIL: Chromium ausente"; FAILED_STAGES=$((FAILED_STAGES+1)); }

log "[3/9] build ($(mem))"
if ( cd public/components/panels/panel-avatar-studio && npx vite build ) >"$CERT/logs/build.log" 2>&1; then echo "   build OK"; else echo "   INFRA-FAIL build"; FAILED_STAGES=$((FAILED_STAGES+1)); fi

log "[4/9] harness"
if node scripts/avatar/gerar-harness.mjs avatar >"$CERT/logs/harness.log" 2>&1; then echo "   harness OK"; else echo "   INFRA-FAIL harness"; FAILED_STAGES=$((FAILED_STAGES+1)); fi

log "[5/9] HTTP :$PORTA"
( cd public && python3 -m http.server "$PORTA" ) >"$CERT/logs/http.log" 2>&1 &
SRV=$!; sleep 2
if curl -sf "http://127.0.0.1:$PORTA/avst-harness.html" >/dev/null; then echo "   servido"; else echo "   INFRA-FAIL http"; FAILED_STAGES=$((FAILED_STAGES+1)); fi
export BASE_URL="http://127.0.0.1:$PORTA"

MOBILE="mobile-shell-layout mobile-touch-navigation mobile-category-flow mobile-asset-selection mobile-color-controls mobile-tools-overlays mobile-save-flow mobile-legacy-compat mobile-keyboard-viewport mobile-safe-area mobile-orientation-change mobile-landscape mobile-small-screen-320 mobile-tablet-layout mobile-accessibility-smoke mobile-performance-smoke mobile-viewport-matrix mobile-touch-inventory mobile-contrast-audit mobile-color-flow desktop-responsive-regression"
V43="v43-single2d-parity v43-single2d-flow v43-legacy-compat v43-category-focus"

log "[6/9] testes definidos — sequenciais, timeout ${TEST_TIMEOUT}s, sem suite completa"
PASS=0
for t in $MOBILE $V43; do
  timeout "$TEST_TIMEOUT" node scripts/avatar/testes/$t.mjs >"$CERT/logs/$t.log" 2>&1
  rc=$?
  if [ $rc -eq 0 ]; then PASS=$((PASS+1)); echo "   OK   $t"
  elif [ $rc -eq 124 ]; then echo "   INFRA-FAIL(timeout) $t"; REDS+=("$t:timeout"); FAILED_STAGES=$((FAILED_STAGES+1))
  else echo "   TEST/PRODUTO-FAIL $t (rc=$rc)"; REDS+=("$t:rc$rc"); FAILED_STAGES=$((FAILED_STAGES+1)); fi
  pkill -f "chrome-linux/chrome" 2>/dev/null   # reaproveita recursos: reap de qualquer straggler
done
echo "   verdes: $PASS de 25 · $(mem)"

log "[7/9] boards (navegador único reutilizado)"
if OUTPKG="$CERT/boards" BASE_URL="http://127.0.0.1:$PORTA" timeout 200 node scripts/avatar/testes/gerar-boards-mobile-cert.mjs >"$CERT/logs/boards.log" 2>&1; then echo "   $(ls "$CERT/boards" | wc -l) boards"; else echo "   INFRA-FAIL boards"; FAILED_STAGES=$((FAILED_STAGES+1)); fi

log "[8/9] hashes + encerra processos ($(mem))"
for f in flags.ts workspace/mobileStudio.ts shell/ShellStudio.tsx styles/mobile.css app/App.tsx; do
  p="public/components/panels/panel-avatar-studio/src/$f"; [ -f "$p" ] && sha256sum "$p"; done > "$CERT/hashes/trackc-src.txt"
echo "   $CERT/hashes/trackc-src.txt"
limpar; sleep 2
# conta só processos VIVOS (exclui zumbis 'Z' — defunct já sem pai, reapados pelo init)
ORF_CHROME=$(ps -eo stat,args 2>/dev/null | grep "chrome-linux/chrome" | grep -v grep | grep -vc '^Z'); ORF_CHROME=${ORF_CHROME:-0}
ORF_HTTP=$(ps -eo stat,args 2>/dev/null | grep "http.server $PORTA" | grep -v grep | grep -vc '^Z'); ORF_HTTP=${ORF_HTTP:-0}
ORPHANS=$(( ORF_CHROME + ORF_HTTP ))

log "[9/9] side effects"
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')

echo ""
echo "==================== RESUMO ===================="
echo "HEAD tree            : $TREE"
echo "TESTES verdes        : $PASS de 25"
echo "FAILED_STAGES        : $FAILED_STAGES"
[ ${#REDS[@]} -gt 0 ] && echo "VERMELHOS            : ${REDS[*]}" || echo "VERMELHOS            : nenhum"
echo "boards               : $(ls "$CERT/boards" 2>/dev/null | wc -l)"
echo "ORPHAN_PROCESSES     : $ORPHANS (chrome=$ORF_CHROME http=$ORF_HTTP)"
echo "git dirty (porcelain): $DIRTY"
echo "MERGE/DEPLOY/ROLLOUT/PUSH/RESET/--gravar : NAO"
echo "================================================"
if [ "$FAILED_STAGES" -eq 0 ] && [ "$ORPHANS" -eq 0 ]; then echo "CERTIFICATION_SCRIPT_EXIT=0"; exit 0; else echo "CERTIFICATION_SCRIPT_EXIT=1 (FAILED_STAGES=$FAILED_STAGES ORPHANS=$ORPHANS)"; exit 1; fi
