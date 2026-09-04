#!/usr/bin/env bash
# preview-auth-candidato.sh — PREVIEW AUTENTICADA do candidato (Opcao B, panel-level).
# Serve o candidato c6318cca em localhost (identidade provada) + /api real via proxy autenticado.
# Classificacao do resultado: AUTHENTICATED_PANEL_PREVIEW (NAO prova o shell global).
set -uo pipefail

EXPECTED_SHA="c6318ccab12dd0d6f3425c5ab50c07879e2bdc72"
EXPECTED_TREE="c2116dc0a5ff09f3d9a9c09e4b492822b81c6ade"

usage() {
  cat <<'H'
preview-auth-candidato.sh — preview autenticada panel-level do candidato c6318cca.

OBRIGATORIO (env):
  STORAGE_STATE   storageState.json de sessao autenticada por VOCE (perm 600; nunca vai ao git/pacote/log)

OPCIONAL (env):
  API_BASE        backend canonico (default: https://dshowdash.com.br)
  AUDIT_CONFIG    config zero-edit (default: <repo>/tools/authenticated-preview/audit.config.panel.json)
  PORT            porta local (default 8955)

Passos: verifica identidade c6318cca/c2116dc0 -> build -> harness SEM mocks (/api real via proxy)
        -> auditoria-auth.mjs (5 viewports, scope=panel) -> pacote SEM storage-state -> limpeza.
Resultado sempre classificado AUTHENTICATED_PANEL_PREVIEW; o shell global exige Opcao A (staging).

Exemplo:
  STORAGE_STATE=/root/state.json API_BASE=https://dshowdash.com.br bash preview-auth-candidato.sh
H
}
case "${1:-}" in -h|--help) usage; exit 0;; esac

STORAGE_STATE="${STORAGE_STATE:-}"; API_BASE="${API_BASE:-https://dshowdash.com.br}"; PORT="${PORT:-8955}"
if [ -z "$STORAGE_STATE" ] || [ ! -f "$STORAGE_STATE" ]; then
  echo "ERRO: defina STORAGE_STATE=<storageState.json de sessao autenticada>"; echo "(rode --help para o fluxo de captura)"; exit 2
fi
PERM="$(stat -c '%a' "$STORAGE_STATE" 2>/dev/null || stat -f '%Lp' "$STORAGE_STATE" 2>/dev/null)"
if [ "$PERM" != "600" ] && [ "$PERM" != "400" ]; then echo "ERRO: STORAGE_STATE com permissao insegura ($PERM); rode: chmod 600 $STORAGE_STATE"; exit 5; fi

REPO=""; for d in /var/www/dshowdash "$HOME"/dshow* /root/dshow*; do [ -d "$d/.git" ] && { REPO="$d"; break; }; done
[ -n "$REPO" ] || { echo "ERRO: repo nao encontrado"; exit 1; }
AUDIT_CONFIG="${AUDIT_CONFIG:-$REPO/tools/authenticated-preview/audit.config.panel.json}"
[ -f "$AUDIT_CONFIG" ] || { echo "ERRO: AUDIT_CONFIG nao encontrado: $AUDIT_CONFIG (versione a infra primeiro)"; exit 3; }

WT="$HOME/vc-avatar/wt"; PANEL="$WT/public/components/panels/panel-avatar-studio"
CHROME="$(find "$HOME/.cache/ms-playwright" -type f -name chrome 2>/dev/null | grep -E 'chrome-linux(64)?/chrome$' | head -1)"
[ -x "$CHROME" ] || { echo "ERRO: chromium nao encontrado em ~/.cache/ms-playwright"; exit 3; }

echo ""; echo "== 1) IDENTIDADE DO CANDIDATO =="
TMPWT=""
cd "$WT" 2>/dev/null && HEAD_SHA="$(git rev-parse HEAD 2>/dev/null)" || HEAD_SHA=""
if [ "$HEAD_SHA" != "$EXPECTED_SHA" ]; then
  echo "worktree principal nao esta no candidato; criando worktree temporario em $EXPECTED_SHA"
  git -C "$REPO" fetch --quiet origin ux/avatar-studio-visual-composer 2>/dev/null || true
  WT="/root/vc-auth-wt"; TMPWT="$WT"; git -C "$REPO" worktree remove --force "$WT" 2>/dev/null || true; rm -rf "$WT"
  git -C "$REPO" worktree add -f --detach "$WT" "$EXPECTED_SHA" >/tmp/authwt.log 2>&1 || { echo "ERRO worktree"; tail /tmp/authwt.log; exit 1; }
  PANEL="$WT/public/components/panels/panel-avatar-studio"
fi
HEAD_SHA="$(git -C "$WT" rev-parse HEAD)"; HEAD_TREE="$(git -C "$WT" rev-parse HEAD^{tree})"
echo "WT_HEAD=$HEAD_SHA  WT_TREE=$HEAD_TREE"
[ "$HEAD_SHA" = "$EXPECTED_SHA" ] && [ "$HEAD_TREE" = "$EXPECTED_TREE" ] || { echo "ERRO: identidade nao confere"; exit 3; }
echo "IDENTIDADE_CANDIDATO=OK ($EXPECTED_SHA / $EXPECTED_TREE)"
[ -e "$WT/public/react/node_modules/.bin/vite" ] || { [ -e "$REPO/public/react" ] && ln -s "$REPO/public/react" "$WT/public/react" 2>/dev/null || true; }
VITE="$WT/public/react/node_modules/.bin/vite"; [ -x "$VITE" ] || VITE="$REPO/public/react/node_modules/.bin/vite"

echo ""; echo "== 2) BUILD + harness SEM mocks (usa /api real via proxy) =="
( cd "$PANEL" && "$VITE" build ) >/tmp/auth-build.log 2>&1 || { echo "ERRO build"; tail -30 /tmp/auth-build.log; exit 4; }
( cd "$WT" && node scripts/avatar/gerar-harness.mjs avatar ) >/tmp/auth-harness.log 2>&1 || { echo "ERRO harness"; exit 4; }
python3 - "$WT/public/avst-harness.html" "$WT/public/avst-vc-auth.html" "$EXPECTED_SHA" "$EXPECTED_TREE" <<'PY'
import sys, re
har, out, sha, tree = sys.argv[1:5]
s = open(har, encoding='utf-8').read()
s = re.sub(r"<script>\s*\n?\s*const RESPOSTAS[\s\S]*?</script>", "", s, count=1)
inj = ('<link rel="icon" href="data:,">\n<meta http-equiv="Cache-Control" content="no-store">\n'
       "<script>window.__servedSha='%s';window.__servedTree='%s';try{localStorage.setItem('dshow.avst.flags.v1',JSON.stringify({'as5.novo_shell':true,'as6.visual_composer':true}));}catch(e){}</script>\n" % (sha, tree))
s = s.replace('<head>', '<head>\n' + inj, 1)
open(out, 'w', encoding='utf-8').write(s)
print('avst-vc-auth.html gerado (sem mocks; servedSha=%s)' % sha)
PY

echo ""; echo "== 3) PROXY autenticado /api -> $API_BASE =="
fuser -k "$PORT"/tcp 2>/dev/null || true; sleep 1
PUBLIC_DIR="$WT/public" PORT="$PORT" API_BASE="$API_BASE" STORAGE_STATE="$STORAGE_STATE" setsid nohup node "$HOME/proxy-auth.mjs" >/tmp/auth-proxy.log 2>&1 & echo $! >/tmp/auth-proxy.pid
sleep 1.5; head -3 /tmp/auth-proxy.log
curl -s -o /dev/null -w "harness_http=%{http_code}\n" "http://127.0.0.1:$PORT/avst-vc-auth.html" || true

echo ""; echo "== 4) AUDITORIA autenticada (zero-edit, scope=panel) =="
OUTA="$HOME/auth-out"; rm -rf "$OUTA"; mkdir -p "$OUTA"
set +e
AUDIT_CONFIG="$AUDIT_CONFIG" BASE_URL="http://127.0.0.1:$PORT" BASE_ROUTE="/avst-vc-auth.html" \
  STORAGE_STATE="$STORAGE_STATE" CHROME_PATH="$CHROME" OUT="$OUTA" \
  node "$HOME/auditoria-auth.mjs" 2>&1 | tee /tmp/auth-run.log
AST=${PIPESTATUS[0]}
set -e
kill "$(cat /tmp/auth-proxy.pid 2>/dev/null)" 2>/dev/null || true

echo ""; echo "== 5) PACOTE (SEM storage-state) =="
cp /tmp/auth-run.log "$OUTA/AUTH_RUN_LOG.txt" 2>/dev/null || true
cp /tmp/auth-build.log "$OUTA/AUTH_BUILD_LOG.txt" 2>/dev/null || true
{ echo "candidate_sha=$EXPECTED_SHA"; echo "candidate_tree=$EXPECTED_TREE"; echo "api_base=$API_BASE"; echo "scope=panel"; echo "classificacao=AUTHENTICATED_PANEL_PREVIEW"; echo "resultado=$([ $AST -eq 0 ] && echo PASS || echo FAIL)"; } > "$OUTA/AUTH_MANIFESTO.txt"
find "$OUTA" -iname '*storage*state*' -delete 2>/dev/null || true
PKG="$HOME/auth-candidato-$(date +%Y%m%d-%H%M%S).tar.gz"; tar -czf "$PKG" -C "$OUTA" .
tar -tzf "$PKG" | grep -qiE 'storage.?state|cookie|token' && { echo "ERRO: possivel segredo no pacote"; rm -f "$PKG"; exit 6; }
echo "AUTH_PKG=$PKG (scp para voce)"

echo ""; echo "== 6) LIMPEZA =="
[ -n "$TMPWT" ] && { git -C "$REPO" worktree remove --force "$TMPWT" 2>/dev/null || true; echo "worktree temporario removido"; }
echo ""; echo "RESULTADO_AUTENTICADO=$([ $AST -eq 0 ] && echo PASS || echo FAIL)  classificacao=AUTHENTICATED_PANEL_PREVIEW"
echo "NOTA: panel-level (identidade do candidato + backend/sessao reais). O SHELL GLOBAL real exige Opcao A (staging do candidato) — mesma auditoria-auth.mjs, AUDIT_CONFIG com scope=full, contra a URL do staging."
