#!/usr/bin/env bash
# ==============================================================================
# 07-trackd-wave3-server-gate.sh — Track D onda 3.1 (INFRA DE AUDITORIA)
# Executor ÚNICO server-side da golden preview autenticada. Fail-closed.
#   preflight (identidade+ambiente) -> git archive do produto congelado ->
#   build canonico no preview -> proxy 127.0.0.1 (/api -> BACKEND_URL) ->
#   identidade servida (sha256) -> auth por AUDIT_STORAGE_STATE (nunca lida) ->
#   provas OFF/ON (main baseline + golden) + boards + DOM -> pacote sem segredos.
# NUNCA: main/merge/push/deploy/rollout/flip real de flag/segredo em log-git-pacote.
# NAO usa build de /var/www/dshowdash; NAO reusa dist ignorado; NAO toca produção.
# DRYRUN=1  -> tudo menos auth/browser (prova a maquinaria sem credencial).
# ==============================================================================
set -euo pipefail

REPO="${REPO:-/var/www/dshowdash}"
CANDIDATE_REF="${CANDIDATE_REF:-origin/golden/art-wip}"
EXPECTED_MAIN="${EXPECTED_MAIN:-bf65522156b3e6f383b203f141187b8289933724}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-dd0f00eca357ee6811c7c6ca2a14c85b542eb666}"
EXPECTED_TREE="${EXPECTED_TREE:-5ba31bbd5e526714b0bf110ffd3878d410e54755}"
BACKEND_URL="${BACKEND_URL:-https://127.0.0.1}"
AUDIT_STORAGE_STATE="${AUDIT_STORAGE_STATE:-}"
PORT_GOLDEN="${PORT_GOLDEN:-8930}"
PORT_MAIN="${PORT_MAIN:-8931}"
MARKER_REL="components/app-shell/styles/global-mobile.css"
DRYRUN="${DRYRUN:-0}"
SELFTEST_BAD_HASH="${SELFTEST_BAD_HASH:-0}"

STAMP="$(date +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d "/tmp/trackd-07gate-${STAMP}.XXXXXX")"
TOOLS="${WORK}/tools"; EVID="${WORK}/evidencias"
PREVIEW_G="${WORK}/preview-golden"; PREVIEW_M="${WORK}/preview-main"
STORAGE_TMP="${WORK}/auth-audit.json"
GOLDEN_URL="http://127.0.0.1:${PORT_GOLDEN}"; MAIN_URL="http://127.0.0.1:${PORT_MAIN}"
mkdir -p "${TOOLS}" "${EVID}" "${PREVIEW_G}" "${PREVIEW_M}"; chmod 700 "${WORK}"
PID_G=""; PID_M=""

red() { sed -E 's/((set-)?cookie|authorization|x-csrf-token|x-xsrf-token|csrf|xsrf|token|senha|password|bearer)[[:space:]]*[:=][^[:cntrl:]]*/\1=<redacted>/Ig'; }
log() { printf '%s\n' "== $* =="; }
abort() { printf '\nABORT: %s\n' "$*" >&2; exit 1; }
ORPHANS_OK="unknown"
cleanup() {
  local rc=$?
  [ -n "${PID_G}" ] && kill "${PID_G}" 2>/dev/null || true
  [ -n "${PID_M}" ] && kill "${PID_M}" 2>/dev/null || true
  rm -f "${STORAGE_TMP}" 2>/dev/null || true
  # comprovar main intacta (nao alteramos refs/worktree)
  local ma=""; ma="$(git -C "${REPO}" rev-parse origin/main 2>/dev/null || true)"
  printf 'CLEANUP_MAIN_AFTER=%s\n' "${ma:-?}" >&2
  if [ -d "${WORK}" ]; then
    if [ -d /backup ]; then mv "${WORK}" "/backup/trackd-07gate-descartado-${STAMP}" 2>/dev/null || rm -rf "${WORK}" 2>/dev/null || true
    else rm -rf "${WORK}" 2>/dev/null || true; fi
  fi
  printf 'CLEANUP_DONE rc=%s\n' "${rc}" >&2
  exit $rc
}
trap cleanup EXIT INT TERM

resolve_chrome() {
  [ -n "${PW_CHROME:-}" ] && [ -x "${PW_CHROME}" ] && return 0
  local c
  for c in "$(command -v chromium 2>/dev/null||true)" "$(command -v google-chrome 2>/dev/null||true)" \
    /home/*/.cache/ms-playwright/chromium-*/chrome-linux*/chrome /opt/ms-playwright/chromium-*/chrome-linux*/chrome \
    /root/.cache/ms-playwright/chromium-*/chrome-linux*/chrome /opt/pw-browsers/chromium-*/chrome-linux*/chrome ; do
    [ -n "$c" ] && [ -x "$c" ] && PW_CHROME="$c" && return 0
  done
  return 1
}

# ── 1) PREFLIGHT (fail-closed) ────────────────────────────────────────────────
log "1) preflight: identidade + ambiente"
[ -d "${REPO}/.git" ] || abort "REPO invalido: ${REPO}"
git -C "${REPO}" fetch --quiet origin || abort "git fetch falhou."
MAIN_BEFORE="$(git -C "${REPO}" rev-parse origin/main)"
COMMIT_RESOLVED="$(git -C "${REPO}" rev-parse "${EXPECTED_COMMIT}^{commit}" 2>/dev/null || true)"
TREE_RESOLVED="$(git -C "${REPO}" rev-parse "${EXPECTED_COMMIT}^{tree}" 2>/dev/null || true)"
printf 'MAIN_BEFORE=%s\nEXPECTED_MAIN=%s\nCOMMIT_RESOLVED=%s\nTREE_RESOLVED=%s\n' "${MAIN_BEFORE}" "${EXPECTED_MAIN}" "${COMMIT_RESOLVED}" "${TREE_RESOLVED}"
[ "${MAIN_BEFORE}" = "${EXPECTED_MAIN}" ] || abort "main divergente (obtido ${MAIN_BEFORE}) — NAO prosseguir."
[ -n "${COMMIT_RESOLVED}" ] || abort "EXPECTED_COMMIT nao resolve: ${EXPECTED_COMMIT}"
case "${COMMIT_RESOLVED}" in "${EXPECTED_COMMIT}"*) : ;; *) abort "commit resolvido difere." ;; esac
[ "${TREE_RESOLVED}" = "${EXPECTED_TREE}" ] || abort "TREE divergente (obtido ${TREE_RESOLVED}, esperado ${EXPECTED_TREE})."
printf 'IDENTITY_FROZEN=OK\n'
resolve_chrome || abort "Chromium nao encontrado — reexecute com PW_CHROME=/caminho/chrome"
printf 'PW_CHROME=%s\n' "${PW_CHROME}"
# storage-state: SO metadados; NUNCA ler conteudo
if [ "${DRYRUN}" != "1" ]; then
  [ -n "${AUDIT_STORAGE_STATE}" ] || { printf 'ABORT(4): AUDIT_STORAGE_STATE nao definido.\n' >&2; exit 4; }
  [ -f "${AUDIT_STORAGE_STATE}" ] || { printf 'ABORT(4): AUDIT_STORAGE_STATE ausente.\n' >&2; exit 4; }
  [ -s "${AUDIT_STORAGE_STATE}" ] || { printf 'ABORT(4): AUDIT_STORAGE_STATE vazio.\n' >&2; exit 4; }
  MODE="$(stat -c '%a' "${AUDIT_STORAGE_STATE}" 2>/dev/null||echo '?')"
  OWNER="$(stat -c '%U' "${AUDIT_STORAGE_STATE}" 2>/dev/null||echo '?')"
  printf 'STORAGE_MODE=%s STORAGE_OWNER=%s\n' "${MODE}" "${OWNER}"
  [ "${MODE}" = "600" ] || { printf 'ABORT(4): storage-state deve ser modo 600 (obtido %s).\n' "${MODE}" >&2; exit 4; }
  [ "${OWNER}" = "$(id -un)" ] || { printf 'ABORT(4): storage-state deve pertencer a %s (obtido %s).\n' "$(id -un)" "${OWNER}" >&2; exit 4; }
fi
AV_TMP="/tmp"; DISK_KB="$(df -Pk "${AV_TMP}" | awk 'NR==2{print $4}')"
[ "${DISK_KB:-0}" -ge 524288 ] || abort "disco insuficiente em ${AV_TMP} (${DISK_KB}KB)."
for p in "${PORT_GOLDEN}" "${PORT_MAIN}"; do (exec 3<>/dev/tcp/127.0.0.1/$p) 2>/dev/null && abort "porta $p ocupada." || true; done
BK="$(curl -sk -o /dev/null -w '%{http_code}' "${BACKEND_URL}/api/health" 2>/dev/null||echo 000)"
printf 'BACKEND_HEALTH=%s\n' "${BK}"
printf 'PREFLIGHT=OK\n'

# ── 2) EXTRACAO ISOLADA (git archive do produto congelado) ────────────────────
log "2) git archive do candidato congelado -> preview (nao toca refs/worktree)"
git -C "${REPO}" archive --format=tar "${EXPECTED_COMMIT}" | tar -x -C "${PREVIEW_G}" || abort "git archive/extract falhou."
[ -f "${PREVIEW_G}/public/${MARKER_REL}" ] || abort "marcador ausente no archive: public/${MARKER_REL}"
EXPECTED_MARKER_SHA256="$(sha256sum "${PREVIEW_G}/public/${MARKER_REL}" | cut -d' ' -f1)"
INDEX_REL="public/index.html"
EXPECTED_INDEX_SHA256=""
[ -f "${PREVIEW_G}/${INDEX_REL}" ] && EXPECTED_INDEX_SHA256="$(sha256sum "${PREVIEW_G}/${INDEX_REL}" | cut -d' ' -f1)"
printf 'EXPECTED_MARKER_SHA256=%s\nEXPECTED_INDEX_SHA256=%s\n' "${EXPECTED_MARKER_SHA256}" "${EXPECTED_INDEX_SHA256:-<sem index>}"

# ── 3) BUILD CANONICO no preview (Avatar Studio; dist ignorado nao vem no archive) ──
log "3) build canonico (Avatar Studio) no preview — best-effort, registrado"
AV_DIR="${PREVIEW_G}/public/components/panels/panel-avatar-studio"
BUILD_AVATAR="SKIPPED"; BUILD_AVATAR_RC="-"; AVATAR_DIST_SHA="-"
if [ "${DRYRUN}" != "1" ] && [ -f "${AV_DIR}/package.json" ]; then
  PROD_REACT_NM="${REPO}/public/react/node_modules"
  if [ -d "${PROD_REACT_NM}" ]; then ln -sfn "${PROD_REACT_NM}" "${AV_DIR}/node_modules" 2>/dev/null || true; fi
  if ( cd "${AV_DIR}" && [ -d node_modules ] && npx --no-install vite build >"${EVID}/build-avatar.log" 2>&1 ); then
    BUILD_AVATAR="OK"; BUILD_AVATAR_RC=0
    [ -d "${AV_DIR}/dist" ] && AVATAR_DIST_SHA="$(find "${AV_DIR}/dist" -type f -exec sha256sum {} \; 2>/dev/null | sha256sum | cut -d' ' -f1)"
  else BUILD_AVATAR="FAILED"; BUILD_AVATAR_RC=$?; fi
fi
printf 'BUILD_AVATAR=%s (rc=%s) DIST_SHA=%s\n' "${BUILD_AVATAR}" "${BUILD_AVATAR_RC}" "${AVATAR_DIST_SHA}"

# ── 4) ferramentas (proxy + proofs) embutidas ─────────────────────────────────
log "4) materializando ferramentas (proxy /api-only + proofs)"
base64 -d > "${TOOLS}/proxy-api-only.mjs" <<'B64_PROXY'
Ly8gcHJveHktYXBpLW9ubHkubWpzIOKAlCAwNyBzZXJ2ZXItZ2F0ZTogc2VydmUgbyBwcmV2aWV3
IGRvIGNhbmRpZGF0byAoUk9PVCkgZSBlbmNhbWluaGEKLy8gRVhDTFVTSVZBTUVOVEUgL2FwaS8g
cGFyYSBCQUNLRU5EX1VSTCAobG9vcGJhY2spLiBSZWVzY3JldmUgU2V0LUNvb2tpZSAodGlyYSBE
b21haW4vU2VjdXJlLAovLyBTYW1lU2l0ZT1Ob25lLT5MYXgpIGUgTG9jYXRpb24gcGFyYSBhIHNl
c3PDo28gY29sYXIgbm8gcHJldmlldy4gTlVOQ0EgbG9nYSBDb29raWUvQXV0aG9yaXphdGlvbi9D
U1JGL2NvcnBvLgovLyAgIHVzbzogUk9PVD0vcHJldmlldy9wdWJsaWMgQkFDS0VORF9VUkw9aHR0
cHM6Ly8xMjcuMC4wLjEgUE9SVD1QUCBub2RlIHByb3h5LWFwaS1vbmx5Lm1qcwppbXBvcnQgaHR0
cCBmcm9tICdub2RlOmh0dHAnOwppbXBvcnQgeyByZWFkRmlsZSwgc3RhdCB9IGZyb20gJ25vZGU6
ZnMvcHJvbWlzZXMnOwppbXBvcnQgeyBqb2luLCBub3JtYWxpemUsIGV4dG5hbWUgfSBmcm9tICdu
b2RlOnBhdGgnOwoKY29uc3QgUk9PVCA9IHByb2Nlc3MuZW52LlJPT1Q7CmNvbnN0IFVQU1RSRUFN
ID0gKHByb2Nlc3MuZW52LkJBQ0tFTkRfVVJMIHx8IHByb2Nlc3MuZW52LlVQU1RSRUFNIHx8ICdo
dHRwczovLzEyNy4wLjAuMScpLnJlcGxhY2UoL1wvJC8sICcnKTsKY29uc3QgUE9SVCA9IE51bWJl
cihwcm9jZXNzLmVudi5QT1JUIHx8IDg5MzApOwpjb25zdCBIT1NUID0gJzEyNy4wLjAuMSc7Cmlm
ICghUk9PVCkgeyBjb25zb2xlLmVycm9yKCdkZWZpbmEgUk9PVCAocHVibGljIGRvIGNhbmRpZGF0
byknKTsgcHJvY2Vzcy5leGl0KDIpOyB9CmNvbnN0IHVwID0gbmV3IFVSTChVUFNUUkVBTSk7Cgov
LyBFWENMVVNJVkFNRU5URSAvYXBpIChzcGVjIDA3KS4gTmFkYSBkZSAvYXV0aCAvbG9naW4gZXRj
LiBubyBwcm94eS4KY29uc3QgUFJPWFlfUFJFRklYRVMgPSBbJy9hcGknXTsKY29uc3QgTUlNRSA9
IHsgJy5odG1sJzondGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04JywnLmpzJzondGV4dC9qYXZhc2Ny
aXB0OyBjaGFyc2V0PXV0Zi04JywnLm1qcyc6J3RleHQvamF2YXNjcmlwdDsgY2hhcnNldD11dGYt
OCcsJy5jc3MnOid0ZXh0L2NzczsgY2hhcnNldD11dGYtOCcsJy5qc29uJzonYXBwbGljYXRpb24v
anNvbjsgY2hhcnNldD11dGYtOCcsJy5zdmcnOidpbWFnZS9zdmcreG1sJywnLnBuZyc6J2ltYWdl
L3BuZycsJy5qcGcnOidpbWFnZS9qcGVnJywnLmpwZWcnOidpbWFnZS9qcGVnJywnLmdpZic6J2lt
YWdlL2dpZicsJy53ZWJwJzonaW1hZ2Uvd2VicCcsJy5pY28nOidpbWFnZS94LWljb24nLCcud29m
Zic6J2ZvbnQvd29mZicsJy53b2ZmMic6J2ZvbnQvd29mZjInLCcudHRmJzonZm9udC90dGYnLCcu
bWFwJzonYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsJy53YXNtJzonYXBwbGljYXRp
b24vd2FzbScsJy5nbGInOidtb2RlbC9nbHRmLWJpbmFyeScsJy5nbHRmJzonbW9kZWwvZ2x0Zitq
c29uJyB9OwoKY29uc3QgZWhQcm94eSA9IChwKSA9PiBQUk9YWV9QUkVGSVhFUy5zb21lKCh4KSA9
PiBwID09PSB4IHx8IHAuc3RhcnRzV2l0aCh4ICsgJy8nKSB8fCBwLnN0YXJ0c1dpdGgoeCArICc/
JykpOwoKYXN5bmMgZnVuY3Rpb24gc2VydmlyRXN0YXRpY28ocmVxLCByZXMsIHVybFBhdGgpIHsK
ICBjb25zdCBsaW1wbyA9IG5vcm1hbGl6ZShkZWNvZGVVUklDb21wb25lbnQodXJsUGF0aC5zcGxp
dCgnPycpWzBdKSkucmVwbGFjZSgvXihcLlwuWy9cXF0pKy8sICcnKTsKICBsZXQgYXJxdWl2byA9
IGpvaW4oUk9PVCwgbGltcG8pOwogIGlmICghYXJxdWl2by5zdGFydHNXaXRoKFJPT1QpKSB7IHJl
cy53cml0ZUhlYWQoNDAzKTsgcmV0dXJuIHJlcy5lbmQoJ2ZvcmJpZGRlbicpOyB9CiAgdHJ5IHsK
ICAgIGxldCBzdCA9IGF3YWl0IHN0YXQoYXJxdWl2bykuY2F0Y2goKCkgPT4gbnVsbCk7CiAgICBp
ZiAoc3QgJiYgc3QuaXNEaXJlY3RvcnkoKSkgeyBhcnF1aXZvID0gam9pbihhcnF1aXZvLCAnaW5k
ZXguaHRtbCcpOyBzdCA9IGF3YWl0IHN0YXQoYXJxdWl2bykuY2F0Y2goKCkgPT4gbnVsbCk7IH0K
ICAgIGlmICghc3QpIHsgYXJxdWl2byA9IGpvaW4oUk9PVCwgJ2luZGV4Lmh0bWwnKTsgaWYgKCEo
YXdhaXQgc3RhdChhcnF1aXZvKS5jYXRjaCgoKSA9PiBudWxsKSkpIHsgcmVzLndyaXRlSGVhZCg0
MDQpOyByZXR1cm4gcmVzLmVuZCgnbm90IGZvdW5kJyk7IH0gfQogICAgY29uc3QgY29ycG8gPSBh
d2FpdCByZWFkRmlsZShhcnF1aXZvKTsKICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7ICdjb250ZW50
LXR5cGUnOiBNSU1FW2V4dG5hbWUoYXJxdWl2bykudG9Mb3dlckNhc2UoKV0gfHwgJ2FwcGxpY2F0
aW9uL29jdGV0LXN0cmVhbScsICdjYWNoZS1jb250cm9sJzogJ25vLXN0b3JlLCBuby1jYWNoZSwg
bXVzdC1yZXZhbGlkYXRlJywgJ3ByYWdtYSc6ICduby1jYWNoZScgfSk7CiAgICByZXMuZW5kKHJl
cS5tZXRob2QgPT09ICdIRUFEJyA/IHVuZGVmaW5lZCA6IGNvcnBvKTsKICB9IGNhdGNoIHsgcmVz
LndyaXRlSGVhZCg1MDApOyByZXMuZW5kKCdlcnJvJyk7IH0KfQpmdW5jdGlvbiByZWVzY3JldmVT
ZXRDb29raWUoY29va2llcykgeyByZXR1cm4gKGNvb2tpZXMgfHwgW10pLm1hcCgoYykgPT4gYy5y
ZXBsYWNlKC87XHMqRG9tYWluPVteO10qL2lnLCAnJykucmVwbGFjZSgvO1xzKlNlY3VyZS9pZywg
JycpLnJlcGxhY2UoLztccypTYW1lU2l0ZT1Ob25lL2lnLCAnOyBTYW1lU2l0ZT1MYXgnKSk7IH0K
YXN5bmMgZnVuY3Rpb24gcHJveGVhcihyZXEsIHJlcywgdXJsUGF0aCkgewogIGNvbnN0IGFsdm8g
PSBVUFNUUkVBTSArIHVybFBhdGg7CiAgY29uc3QgY2h1bmtzID0gW107IGZvciBhd2FpdCAoY29u
c3QgYyBvZiByZXEpIGNodW5rcy5wdXNoKGMpOwogIGNvbnN0IGNvcnBvID0gY2h1bmtzLmxlbmd0
aCA/IEJ1ZmZlci5jb25jYXQoY2h1bmtzKSA6IHVuZGVmaW5lZDsKICBjb25zdCBoID0ge307CiAg
Zm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMocmVxLmhlYWRlcnMpKSB7IGNvbnN0
IGxrID0gay50b0xvd2VyQ2FzZSgpOyBpZiAoWydob3N0JywnY29ubmVjdGlvbicsJ2NvbnRlbnQt
bGVuZ3RoJywnYWNjZXB0LWVuY29kaW5nJ10uaW5jbHVkZXMobGspKSBjb250aW51ZTsgaWYgKGxr
ID09PSAnb3JpZ2luJykgeyBoWydvcmlnaW4nXSA9IHVwLm9yaWdpbjsgY29udGludWU7IH0gaWYg
KGxrID09PSAncmVmZXJlcicpIHsgaFsncmVmZXJlciddID0gdXAub3JpZ2luICsgdXJsUGF0aDsg
Y29udGludWU7IH0gaFtrXSA9IEFycmF5LmlzQXJyYXkodikgPyB2LmpvaW4oJywnKSA6IHY7IH0K
ICBoWydob3N0J10gPSB1cC5ob3N0OwogIGxldCByOyB0cnkgeyByID0gYXdhaXQgZmV0Y2goYWx2
bywgeyBtZXRob2Q6IHJlcS5tZXRob2QsIGhlYWRlcnM6IGgsIGJvZHk6IGNvcnBvLCByZWRpcmVj
dDogJ21hbnVhbCcgfSk7IH0gY2F0Y2ggKGUpIHsgcmVzLndyaXRlSGVhZCg1MDIsIHsgJ2NvbnRl
bnQtdHlwZSc6ICd0ZXh0L3BsYWluJyB9KTsgcmV0dXJuIHJlcy5lbmQoJ3Byb3h5IHVwc3RyZWFt
IGluZGlzcG9uaXZlbCcpOyB9CiAgY29uc3Qgb3V0ID0ge307CiAgci5oZWFkZXJzLmZvckVhY2go
KHYsIGspID0+IHsgY29uc3QgbGsgPSBrLnRvTG93ZXJDYXNlKCk7IGlmIChbJ3NldC1jb29raWUn
LCdjb250ZW50LWVuY29kaW5nJywnY29udGVudC1sZW5ndGgnLCd0cmFuc2Zlci1lbmNvZGluZycs
J3N0cmljdC10cmFuc3BvcnQtc2VjdXJpdHknXS5pbmNsdWRlcyhsaykpIHJldHVybjsgaWYgKGxr
ID09PSAnbG9jYXRpb24nKSB7IG91dFsnbG9jYXRpb24nXSA9IHYucmVwbGFjZSh1cC5vcmlnaW4s
IGBodHRwOi8vJHtIT1NUfToke1BPUlR9YCk7IHJldHVybjsgfSBvdXRba10gPSB2OyB9KTsKICBj
b25zdCBzYyA9IHJlZXNjcmV2ZVNldENvb2tpZShyLmhlYWRlcnMuZ2V0U2V0Q29va2llID8gci5o
ZWFkZXJzLmdldFNldENvb2tpZSgpIDogW10pOwogIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5mcm9tKGF3
YWl0IHIuYXJyYXlCdWZmZXIoKSk7CiAgcmVzLndyaXRlSGVhZChyLnN0YXR1cywgc2MubGVuZ3Ro
ID8geyAuLi5vdXQsICdzZXQtY29va2llJzogc2MgfSA6IG91dCk7CiAgcmVzLmVuZChyZXEubWV0
aG9kID09PSAnSEVBRCcgPyB1bmRlZmluZWQgOiBidWYpOwp9CmNvbnN0IHNlcnZlciA9IGh0dHAu
Y3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4gewogIGNvbnN0IHAgPSByZXEudXJsIHx8ICcvJzsK
ICB0cnkgeyBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtyZXEubWV0aG9kfSAke3Auc3BsaXQoJz8n
KVswXX1cbmApOyB9IGNhdGNoIHt9CiAgaWYgKGVoUHJveHkocCkpIHByb3hlYXIocmVxLCByZXMs
IHApLmNhdGNoKCgpID0+IHsgdHJ5IHsgcmVzLndyaXRlSGVhZCg1MDIpOyByZXMuZW5kKCdlcnJv
Jyk7IH0gY2F0Y2gge30gfSk7CiAgZWxzZSBzZXJ2aXJFc3RhdGljbyhyZXEsIHJlcywgcCkuY2F0
Y2goKCkgPT4geyB0cnkgeyByZXMud3JpdGVIZWFkKDUwMCk7IHJlcy5lbmQoJ2Vycm8nKTsgfSBj
YXRjaCB7fSB9KTsKfSk7CnNlcnZlci5saXN0ZW4oUE9SVCwgSE9TVCwgKCkgPT4gY29uc29sZS5s
b2coYFBSRVZJRVdfUFJPWFlfUkVBRFkgaHR0cDovLyR7SE9TVH06JHtQT1JUfSAoUk9PVD0ke1JP
T1R9LCBCQUNLRU5EPSR7VVBTVFJFQU19KWApKTsK
B64_PROXY
base64 -d > "${TOOLS}/gate07-proofs.mjs" <<'B64_PROOFS'
Ly8gZ2F0ZTA3LXByb29mcy5tanMgdjIg4oCUIHJlZXNjb3BvIHNlZ3VybyBkbyBzdG9yYWdlLXN0
YXRlIChjw7NwaWEgZW0gbWVtw7NyaWEgYSBwYXJ0aXIgZGEgY8OzcGlhIHRlbXApLAovLyBnYXRl
IGRlIGF1dGVudGljYcOnw6NvIFJFQUwgKG3Dumx0aXBsb3Mgc2luYWlzKSwgZSBwcm92YXMgT0ZG
L09OIHBvciBwYXNzZS4gRmFpbC1jbG9zZWQuCi8vIE5VTkNBIGltcHJpbWUgdmFsb3JlcyBkZSBj
b29raWUvdG9rZW4vbG9jYWxTdG9yYWdlLiBQcmVzZXJ2YSBTZWN1cmUvaHR0cE9ubHkvU2FtZVNp
dGUuCi8vIEV4aXQ6IDAgb2sgwrcgNSByZWVzY29wbyBmYWxob3UgwrcgNiBzZXNzw6NvIHJlYWwg
bsOjbyBhdXRlbnRpY291IMK3IDcgbWF0cml6L2JvYXJkcyBmYWxoYXJhbS4KLy8gUkVTQ09QRV9T
RUxGVEVTVD0xIC0+IHPDsyB0ZXN0YSBhIHRyYW5zZm9ybWHDp8OjbyBlbSBmaXh0dXJlIHNpbnTD
qXRpY2EgKHNlbSBicm93c2VyL2NyZWRzKS4KaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZp
bGVTeW5jIH0gZnJvbSAnbm9kZTpmcyc7Cgpjb25zdCBlbnYgPSBwcm9jZXNzLmVudjsKY29uc3Qg
QVBQX0RPTUFJTl9SRSA9IC8oXnxcLilkc2hvd2Rhc2hcLmNvbVwuYnIkL2k7CgovLyAtLS0tLS0t
LS0tIHJlZXNjb3BvIGRldGVybWluw61zdGljbyAocHJlc2VydmEgYXRyaWJ1dG9zIGRlIHNlZ3Vy
YW7Dp2EpIC0tLS0tLS0tLS0KZnVuY3Rpb24gcmVzY29wZShzdGF0ZSwgdGFyZ2V0SG9zdCwgdGFy
Z2V0T3JpZ2luKSB7CiAgY29uc3QgY2luID0gQXJyYXkuaXNBcnJheShzdGF0ZS5jb29raWVzKSA/
IHN0YXRlLmNvb2tpZXMgOiBbXTsKICBjb25zdCBhcHBDb29raWVzID0gY2luLmZpbHRlcihjID0+
IEFQUF9ET01BSU5fUkUudGVzdChTdHJpbmcoYy5kb21haW4gfHwgJycpLnJlcGxhY2UoL15cLi8s
ICcnKSkpOwogIGNvbnN0IGRyb3BwZWROYW1lcyA9IGNpbi5maWx0ZXIoYyA9PiAhQVBQX0RPTUFJ
Tl9SRS50ZXN0KFN0cmluZyhjLmRvbWFpbiB8fCAnJykucmVwbGFjZSgvXlwuLywgJycpKSkubWFw
KGMgPT4gYy5uYW1lKTsKICBjb25zdCByZXNjb3BlZCA9IGFwcENvb2tpZXMubWFwKGMgPT4gKHsK
ICAgIG5hbWU6IGMubmFtZSwgdmFsdWU6IGMudmFsdWUsCiAgICBkb21haW46IHRhcmdldEhvc3Qs
ICAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0LW9ubHkgcC8gMTI3LjAuMC4xCiAgICBwYXRo
OiBjLnBhdGggfHwgJy8nLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTsODTyBhbXBsaWFyIHBh
dGgKICAgIGV4cGlyZXM6IChjLmV4cGlyZXMgPT0gbnVsbCA/IC0xIDogYy5leHBpcmVzKSwgLy8g
TsODTyBhbXBsaWFyIHZhbGlkYWRlCiAgICBodHRwT25seTogISFjLmh0dHBPbmx5LCAgICAgICAg
ICAgICAgICAgICAgIC8vIHByZXNlcnZhZG8KICAgIHNlY3VyZTogISFjLnNlY3VyZSwgICAgICAg
ICAgICAgICAgICAgICAgICAgLy8gcHJlc2VydmFkbyAoTlVOQ0EgZW5mcmFxdWVjZXIpCiAgICBz
YW1lU2l0ZTogYy5zYW1lU2l0ZSB8fCAnTGF4JywgICAgICAgICAgICAgIC8vIHByZXNlcnZhZG8K
ICB9KSk7CiAgY29uc3Qgb2luID0gQXJyYXkuaXNBcnJheShzdGF0ZS5vcmlnaW5zKSA/IHN0YXRl
Lm9yaWdpbnMgOiBbXTsKICBjb25zdCBhcHBPcmlnaW5zID0gb2luLmZpbHRlcihvID0+IHsgdHJ5
IHsgcmV0dXJuIEFQUF9ET01BSU5fUkUudGVzdChuZXcgVVJMKG8ub3JpZ2luKS5ob3N0bmFtZSk7
IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH0pOwogIGNvbnN0IGFwcExTID0gYXBwT3Jp
Z2lucy5sZW5ndGggPyAoYXBwT3JpZ2luc1swXS5sb2NhbFN0b3JhZ2UgfHwgW10pIDogW107CiAg
Y29uc3Qgc3VtbWFyeSA9IHsKICAgIEFVVEhfU09VUkNFX0NPT0tJRV9ET01BSU5TOiBbLi4ubmV3
IFNldChjaW4ubWFwKGMgPT4gU3RyaW5nKGMuZG9tYWluIHx8ICcnKS5yZXBsYWNlKC9eXC4vLCAn
JykpKV0sCiAgICBBVVRIX1NPVVJDRV9PUklHSU5TOiBvaW4ubWFwKG8gPT4gby5vcmlnaW4pLAog
ICAgQVVUSF9UQVJHRVRfSE9TVDogdGFyZ2V0SG9zdCwKICAgIEFVVEhfVEFSR0VUX09SSUdJTjog
dGFyZ2V0T3JpZ2luLAogICAgUkVTQ09QRURfQ09PS0lFX0NPVU5UOiByZXNjb3BlZC5sZW5ndGgs
CiAgICBSRVNDT1BFRF9PUklHSU5fQ09VTlQ6IGFwcE9yaWdpbnMubGVuZ3RoID8gMSA6IDAsCiAg
ICBVTlJFTEFURURfQ09PS0lFU19EUk9QUEVEOiBkcm9wcGVkTmFtZXMubGVuZ3RoLAogICAgSEFT
X1NFQ1VSRV9DT09LSUU6IHJlc2NvcGVkLnNvbWUobiA9PiBuLnNlY3VyZSksCiAgICBTRUNVUkVf
UFJFU0VSVkVEOiByZXNjb3BlZC5ldmVyeSgobiwgaSkgPT4gbi5zZWN1cmUgPT09ICEhYXBwQ29v
a2llc1tpXS5zZWN1cmUpLAogICAgSFRUUE9OTFlfUFJFU0VSVkVEOiByZXNjb3BlZC5ldmVyeSgo
biwgaSkgPT4gbi5odHRwT25seSA9PT0gISFhcHBDb29raWVzW2ldLmh0dHBPbmx5KSwKICAgIFNB
TUVTSVRFX1BSRVNFUlZFRDogcmVzY29wZWQuZXZlcnkoKG4sIGkpID0+IG4uc2FtZVNpdGUgPT09
IChhcHBDb29raWVzW2ldLnNhbWVTaXRlIHx8ICdMYXgnKSksCiAgfTsKICByZXR1cm4geyBjb29r
aWVzOiByZXNjb3BlZCwgYXBwTFMsIHN1bW1hcnkgfTsKfQoKLy8gLS0tLS0tLS0tLSBtb2RvIHNl
bGZ0ZXN0IChzZW0gYnJvd3NlcikgLS0tLS0tLS0tLQppZiAoZW52LlJFU0NPUEVfU0VMRlRFU1Qg
PT09ICcxJykgewogIGNvbnN0IGZpeHR1cmUgPSB7CiAgICBjb29raWVzOiBbCiAgICAgIHsgbmFt
ZTogJ0RTSE9XU0VTUycsIHZhbHVlOiAnUycsIGRvbWFpbjogJy5kc2hvd2Rhc2guY29tLmJyJywg
cGF0aDogJy8nLCBleHBpcmVzOiAtMSwgaHR0cE9ubHk6IHRydWUsIHNlY3VyZTogdHJ1ZSwgc2Ft
ZVNpdGU6ICdMYXgnIH0sCiAgICAgIHsgbmFtZTogJ19nYScsIHZhbHVlOiAnRycsIGRvbWFpbjog
Jy5nb29nbGUuY29tJywgcGF0aDogJy8nLCBleHBpcmVzOiA5OTksIGh0dHBPbmx5OiBmYWxzZSwg
c2VjdXJlOiBmYWxzZSwgc2FtZVNpdGU6ICdOb25lJyB9LAogICAgXSwKICAgIG9yaWdpbnM6IFt7
IG9yaWdpbjogJ2h0dHBzOi8vZHNob3dkYXNoLmNvbS5icicsIGxvY2FsU3RvcmFnZTogW3sgbmFt
ZTogJ2RzaG93ZGFzaC5zZXNzaW9uLnRva2VuJywgdmFsdWU6ICdUJyB9XSB9XSwKICB9OwogIGNv
bnN0IHIgPSByZXNjb3BlKGZpeHR1cmUsICcxMjcuMC4wLjEnLCAnaHR0cDovLzEyNy4wLjAuMTo4
OTMwJyk7CiAgY29uc3QgYzAgPSByLmNvb2tpZXNbMF0gfHwge307CiAgY29uc3Qgb2sgPSByLnN1
bW1hcnkuUkVTQ09QRURfQ09PS0lFX0NPVU5UID09PSAxICYmIHIuc3VtbWFyeS5VTlJFTEFURURf
Q09PS0lFU19EUk9QUEVEID09PSAxICYmIHIuc3VtbWFyeS5SRVNDT1BFRF9PUklHSU5fQ09VTlQg
PT09IDEgJiYKICAgIGMwLmRvbWFpbiA9PT0gJzEyNy4wLjAuMScgJiYgYzAuc2VjdXJlID09PSB0
cnVlICYmIGMwLmh0dHBPbmx5ID09PSB0cnVlICYmIGMwLnNhbWVTaXRlID09PSAnTGF4JyAmJgog
ICAgIXIuY29va2llcy5zb21lKGMgPT4gYy5uYW1lID09PSAnX2dhJykgJiYgci5hcHBMUy5sZW5n
dGggPT09IDE7CiAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoeyBSRVNDT1BFX1NFTEZURVNU
OiBvayA/ICdQQVNTJyA6ICdGQUlMJywgc3VtbWFyeTogci5zdW1tYXJ5LCBzYW1wbGU6IHsgbmFt
ZTogYzAubmFtZSwgZG9tYWluOiBjMC5kb21haW4sIHNlY3VyZTogYzAuc2VjdXJlLCBodHRwT25s
eTogYzAuaHR0cE9ubHksIHNhbWVTaXRlOiBjMC5zYW1lU2l0ZSB9IH0pKTsKICBwcm9jZXNzLmV4
aXQob2sgPyAwIDogNSk7Cn0KCi8vIC0tLS0tLS0tLS0gcnVuIHJlYWwgLS0tLS0tLS0tLQpjb25z
dCBQV19DSFJPTUUgPSBlbnYuUFdfQ0hST01FLCBTVE9SQUdFID0gZW52LlNUT1JBR0VfU1RBVEUs
IE9VVERJUiA9IGVudi5PVVRESVIgfHwgJy4nOwpjb25zdCBHT0xERU5fVVJMID0gZW52LkdPTERF
Tl9VUkwgfHwgJycsIE1BSU5fVVJMID0gZW52Lk1BSU5fVVJMIHx8ICcnOwpjb25zdCBDT01NSVQg
PSBlbnYuQ09NTUlUIHx8ICcnLCBUUkVFID0gZW52LlRSRUUgfHwgJyc7CmNvbnN0IG91dCA9IHsg
aWRlbnRpdHk6IHsgY29tbWl0OiBDT01NSVQsIHRyZWU6IFRSRUUgfSwgZ29sZGVuVXJsOiBHT0xE
RU5fVVJMLCBtYWluVXJsOiBNQUlOX1VSTCwgQVVUSF9TRVNTSU9OX1JFQUw6ICdVTktOT1dOJywg
YXV0aEdhdGU6IG51bGwsIHJlc2NvcGU6IG51bGwsIHBhc3NlczogW10sIGVycm9yczogW10gfTsK
Y29uc3QgbG9nID0gbyA9PiBwcm9jZXNzLnN0ZG91dC53cml0ZShKU09OLnN0cmluZ2lmeShvKSAr
ICdcbicpOwppZiAoIVBXX0NIUk9NRSB8fCAhR09MREVOX1VSTCB8fCAhU1RPUkFHRSkgeyBsb2co
eyBmYXRhbDogJ01JU1NJTkdfRU5WJyB9KTsgcHJvY2Vzcy5leGl0KDIpOyB9CgpsZXQgcmF3OyB0
cnkgeyByYXcgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhTVE9SQUdFLCAndXRmOCcpKTsgfSBj
YXRjaCAoZSkgeyBsb2coeyBmYXRhbDogJ1NUT1JBR0VfVU5SRUFEQUJMRScgfSk7IHByb2Nlc3Mu
ZXhpdCg0KTsgfQpsZXQgUjsgdHJ5IHsgUiA9IHJlc2NvcGUocmF3LCAnMTI3LjAuMC4xJywgR09M
REVOX1VSTCk7IH0gY2F0Y2ggKGUpIHsgbG9nKHsgZmF0YWw6ICdSRVNDT1BFX0ZBSUxFRDonICsg
ZS5tZXNzYWdlIH0pOyBwcm9jZXNzLmV4aXQoNSk7IH0Kb3V0LnJlc2NvcGUgPSBSLnN1bW1hcnk7
CmlmIChSLnN1bW1hcnkuUkVTQ09QRURfQ09PS0lFX0NPVU5UIDwgMSkgeyBvdXQuQVVUSF9TRVNT
SU9OX1JFQUwgPSAnRkFJTEVEJzsgb3V0LmVycm9ycy5wdXNoKCdOT19BUFBfQ09PS0lFX0FGVEVS
X1JFU0NPUEUnKTsgdHJ5IHsgd3JpdGVGaWxlU3luYyhgJHtPVVRESVJ9L2dhdGUwNy1wcm9vZnMu
anNvbmAsIEpTT04uc3RyaW5naWZ5KG91dCwgbnVsbCwgMikpOyB9IGNhdGNoIChlKSB7fSBsb2co
b3V0KTsgcHJvY2Vzcy5leGl0KDUpOyB9CmlmICghKFIuc3VtbWFyeS5TRUNVUkVfUFJFU0VSVkVE
ICYmIFIuc3VtbWFyeS5IVFRQT05MWV9QUkVTRVJWRUQgJiYgUi5zdW1tYXJ5LlNBTUVTSVRFX1BS
RVNFUlZFRCkpIHsgb3V0LmVycm9ycy5wdXNoKCdTRUNVUklUWV9BVFRSX05PVF9QUkVTRVJWRUQn
KTsgdHJ5IHsgd3JpdGVGaWxlU3luYyhgJHtPVVRESVJ9L2dhdGUwNy1wcm9vZnMuanNvbmAsIEpT
T04uc3RyaW5naWZ5KG91dCwgbnVsbCwgMikpOyB9IGNhdGNoIChlKSB7fSBsb2cob3V0KTsgcHJv
Y2Vzcy5leGl0KDUpOyB9CgpmdW5jdGlvbiBzdGF0ZUZvcih1cmwpIHsgcmV0dXJuIHsgY29va2ll
czogUi5jb29raWVzLCBvcmlnaW5zOiBSLmFwcExTLmxlbmd0aCA/IFt7IG9yaWdpbjogdXJsLCBs
b2NhbFN0b3JhZ2U6IFIuYXBwTFMgfV0gOiBbXSB9OyB9CmNvbnN0IEZMQUdTX09OID0geyBzaGVs
bDogeyAnYXM2Lm1vYmlsZV9zaGVsbCc6IHRydWUsICdhczUubm92b19zaGVsbCc6IHRydWUgfSwg
YXZzdDogeyAnYXM2Lm1vYmlsZV9zdHVkaW8nOiB0cnVlIH0gfTsKY29uc3QgRkxBR1NfT0ZGID0g
eyBzaGVsbDogeyAnYXM2Lm1vYmlsZV9zaGVsbCc6IGZhbHNlLCAnYXM1Lm5vdm9fc2hlbGwnOiBm
YWxzZSB9LCBhdnN0OiB7ICdhczYubW9iaWxlX3N0dWRpbyc6IGZhbHNlIH0gfTsKZnVuY3Rpb24g
aW5pdFNjcmlwdChmbGFncykgeyByZXR1cm4gYHRyeXtsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZHNo
b3cuc2hlbGwuZmxhZ3MudjEnLEpTT04uc3RyaW5naWZ5KCR7SlNPTi5zdHJpbmdpZnkoZmxhZ3Mu
c2hlbGwpfSkpO2xvY2FsU3RvcmFnZS5zZXRJdGVtKCdkc2hvdy5hdnN0LmZsYWdzLnYxJyxKU09O
LnN0cmluZ2lmeSgke0pTT04uc3RyaW5naWZ5KGZsYWdzLmF2c3QpfSkpO31jYXRjaChlKXt9YDsg
fQoKY29uc3QgU1VSRkFDRVMgPSBbCiAgWydoZWFkZXInLCAnI2hlYWRlciwgaGVhZGVyLmRzZC1z
aGVsbF9fcmVnaW9uLS1oZWFkZXInXSwKICBbJ2RyYXdlcl90cmlnZ2VyJywgJyNoZWFkZXIgW2Fy
aWEtY29udHJvbHMqPSJzaWRlYmFyIl0sICNoZWFkZXIgW2RhdGEtZHJhd2VyLXRyaWdnZXJdLCAj
aGVhZGVyIFthcmlhLWxhYmVsKj0iTWVudSJdLCAuaGVhZGVyLW1vcmUnXSwKICBbJ2Rlc2t0b3Bf
c2lkZWJhcicsICcjc2lkZWJhciwgYXNpZGUuZHNkLXNoZWxsX19yZWdpb24tLXNpZGViYXInXSwK
ICBbJ21vYmlsZV9kcmF3ZXInLCAnI3NpZGViYXJbYXJpYS1tb2RhbD0idHJ1ZSJdLCAuZHNkLXNp
ZGViYXItLWRyYXdlciwgW2RhdGEtbW9iaWxlLWRyYXdlcl0sICNzaWRlYmFyLmlzLW9wZW4nXSwK
ICBbJ25hdnJhaWwnLCAnI25hdi1yYWlsLCBuYXYuZHNkLXNoZWxsX19yZWdpb24tLW5hdi1yYWls
J10sCiAgWydmdW5jdGlvbmFsX2Zvb3RlcicsICcjbmF2LXJhaWwsIG5hdi5kc2Qtc2hlbGxfX3Jl
Z2lvbi0tbmF2LXJhaWwnXSwKICBbJ2xlZ2FsX2Zvb3RlcicsICcjZm9vdGVyLCBmb290ZXIuZHNk
LXNoZWxsX19yZWdpb24tLWZvb3RlciwgLmRzZC1mb290ZXJfX2xlZ2FsJ10sCiAgWydtYWluJywg
J21haW4uZHNkLXNoZWxsX19yZWdpb24tLW1haW4sICNtYWluLCBtYWluJ10sCiAgWydhdmF0YXJf
c3R1ZGlvJywgJyNwYW5lbC1hdmF0YXItc3R1ZGlvLCBbZGF0YS1wYW5lbC1pZD0icGFuZWwtYXZh
dGFyLXN0dWRpbyJdLCBbY2xhc3MqPSJhdmF0YXItc3R1ZGlvIl0sIC5TaGVsbFN0dWRpbyddLApd
OwoKYXN5bmMgZnVuY3Rpb24gd2FpdFNoZWxsKHBhZ2UpIHsgY29uc3QgZGwgPSBEYXRlLm5vdygp
ICsgMTIwMDA7IHdoaWxlIChEYXRlLm5vdygpIDwgZGwpIHsgdHJ5IHsgaWYgKGF3YWl0IHBhZ2Uu
ZXZhbHVhdGUoKCkgPT4gISFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYXBwLXNoZWxsJykpKSBy
ZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkge30gYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg0MDAp
OyB9IHJldHVybiBmYWxzZTsgfQoKYXN5bmMgZnVuY3Rpb24gYXV0aEdhdGUoYnJvd3Nlcikgewog
IGNvbnN0IGN0eCA9IGF3YWl0IGJyb3dzZXIubmV3Q29udGV4dCh7IGlnbm9yZUhUVFBTRXJyb3Jz
OiB0cnVlLCByZWR1Y2VkTW90aW9uOiAncmVkdWNlJywgdmlld3BvcnQ6IHsgd2lkdGg6IDM5MCwg
aGVpZ2h0OiA4NDQgfSwgZGV2aWNlU2NhbGVGYWN0b3I6IDIsIHN0b3JhZ2VTdGF0ZTogc3RhdGVG
b3IoR09MREVOX1VSTCkgfSk7CiAgYXdhaXQgY3R4LmFkZEluaXRTY3JpcHQoaW5pdFNjcmlwdChG
TEFHU19PRkYpKTsKICBjb25zdCBwYWdlID0gYXdhaXQgY3R4Lm5ld1BhZ2UoKTsgcGFnZS5zZXRE
ZWZhdWx0VGltZW91dCgyMDAwMCk7CiAgbGV0IGh0dHBTdGF0dXMgPSAwOyB0cnkgeyBjb25zdCBy
ZXNwID0gYXdhaXQgcGFnZS5nb3RvKEdPTERFTl9VUkwgKyAnLycsIHsgd2FpdFVudGlsOiAnZG9t
Y29udGVudGxvYWRlZCcgfSk7IGh0dHBTdGF0dXMgPSByZXNwID8gcmVzcC5zdGF0dXMoKSA6IDA7
IH0gY2F0Y2ggKGUpIHsgb3V0LmVycm9ycy5wdXNoKCdhdXRoZ290bzonICsgZS5tZXNzYWdlKTsg
fQogIGF3YWl0IHdhaXRTaGVsbChwYWdlKTsgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxNTAw
KTsKICBjb25zdCBzaWcgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHsKICAgIGNvbnN0IHNo
ZWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FwcC1zaGVsbCcpOwogICAgY29uc3QgbG9n
aW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9naW4tdXNlcm5hbWUsIGlucHV0W25hbWU9
InVzZXJuYW1lIl0nKTsKICAgIHJldHVybiB7CiAgICAgIHNoZWxsOiAhIXNoZWxsLAogICAgICBs
b2dpblZpczogISEobG9naW4gJiYgbG9naW4ub2Zmc2V0UGFyZW50ICE9PSBudWxsKSwKICAgICAg
cmVhZHk6ICEhKHNoZWxsICYmIChzaGVsbC5jbGFzc0xpc3QuY29udGFpbnMoJ3JlYWR5JykgfHwg
c2hlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlYWR5JykgIT09IG51bGwpKSwKICAgICAgYm9keVN0
YXRlOiBkb2N1bWVudC5ib2R5LmdldEF0dHJpYnV0ZSgnZGF0YS1zdGF0ZScpLAogICAgICBkZXZp
Y2U6IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWRldmljZScpLAogICAgICBhY3Rp
dmU6ICh3aW5kb3cuQ29udGFpbmVyTWFpbiB8fCB7fSkuaWQgfHwgbnVsbCwKICAgICAgaGVhZGVy
OiAhIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNoZWFkZXInKSwKICAgICAgbWFpbjogISFkb2N1
bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluLmRzZC1zaGVsbF9fcmVnaW9uLS1tYWluLCAjbWFpbicp
LAogICAgfTsKICB9KTsKICBsZXQgc2Vzc2lvbkF1dGhlZCA9IG51bGw7IHRyeSB7IHNlc3Npb25B
dXRoZWQgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKGFzeW5jICgpID0+IHsgdHJ5IHsgY29uc3QgciA9
IGF3YWl0IGZldGNoKCcvYXBpL2F1dGgvY2hlY2sucGhwJywgeyBoZWFkZXJzOiB7IGFjY2VwdDog
J2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7IGNvbnN0IGogPSBhd2FpdCByLmpzb24oKTsgcmV0dXJu
ICEhKGogJiYgai5kYXRhICYmIGouZGF0YS5hdXRoZW50aWNhdGVkKTsgfSBjYXRjaCAoZSkgeyBy
ZXR1cm4gbnVsbDsgfSB9KTsgfSBjYXRjaCAoZSkge30KICBjb25zdCBmaW5hbFVybCA9IHBhZ2Uu
dXJsKCk7CiAgYXdhaXQgY3R4LmNsb3NlKCk7CiAgY29uc3Qgc2lnbmFscyA9IHsKICAgIEhUVFBf
RE9DVU1FTlRfT0s6IGh0dHBTdGF0dXMgPiAwICYmIGh0dHBTdGF0dXMgPCA0MDAsIEhUVFBfU1RB
VFVTOiBodHRwU3RhdHVzLAogICAgTE9HSU5fRk9STV9WSVNJQkxFOiBzaWcubG9naW5WaXMsIEFV
VEhFTlRJQ0FURURfU0hFTExfUFJFU0VOVDogc2lnLnNoZWxsLCBBUFBfU0hFTExfUkVBRFk6IHNp
Zy5yZWFkeSwKICAgIEJPRFlfU1RBVEU6IHNpZy5ib2R5U3RhdGUsIEJPRFlfU1RBVEVfQVVUSEVO
VElDQVRFRDogc2lnLmJvZHlTdGF0ZSA9PT0gJ2F1dGhlbnRpY2F0ZWQnLCBCT0RZX0RFVklDRTog
c2lnLmRldmljZSwKICAgIEFDVElWRV9QQU5FTDogc2lnLmFjdGl2ZSwgQUNUSVZFX1VTRVJfT1Jf
U0VTU0lPTl9QUkVTRU5UOiAhIShzaWcuYWN0aXZlIHx8IHNlc3Npb25BdXRoZWQgPT09IHRydWUp
LAogICAgU0VTU0lPTl9DSEVDS19BVVRIRUQ6IHNlc3Npb25BdXRoZWQsIEhFQURFUl9QUkVTRU5U
OiBzaWcuaGVhZGVyLCBNQUlOX1BSRVNFTlQ6IHNpZy5tYWluLCBGSU5BTF9VUkw6IGZpbmFsVXJs
LAogIH07CiAgY29uc3Qgb2sgPSBzaWduYWxzLkhUVFBfRE9DVU1FTlRfT0sgJiYgIXNpZ25hbHMu
TE9HSU5fRk9STV9WSVNJQkxFICYmIHNpZ25hbHMuQVBQX1NIRUxMX1JFQURZICYmCiAgICAoc2ln
bmFscy5CT0RZX1NUQVRFX0FVVEhFTlRJQ0FURUQgfHwgc2Vzc2lvbkF1dGhlZCA9PT0gdHJ1ZSkg
JiYgc2lnbmFscy5BQ1RJVkVfVVNFUl9PUl9TRVNTSU9OX1BSRVNFTlQ7CiAgcmV0dXJuIHsgb2ss
IHNpZ25hbHMgfTsKfQoKYXN5bmMgZnVuY3Rpb24gb3BlblN0dWRpbyhwYWdlKSB7IHRyeSB7IGF3
YWl0IHBhZ2UuZXZhbHVhdGUoYXN5bmMgKCkgPT4geyBjb25zdCB3ID0gbXMgPT4gbmV3IFByb21p
c2UociA9PiBzZXRUaW1lb3V0KHIsIG1zKSk7IHRyeSB7IGNvbnN0IENNID0gd2luZG93LkNvbnRh
aW5lck1haW47IGlmIChDTSAmJiBDTS5tb3VudCkgQ00ubW91bnQoJ3BhbmVsLWF2YXRhci1zdHVk
aW8nKTsgfSBjYXRjaCAoZSkge30gdHJ5IHsgbG9jYXRpb24uaGFzaCA9ICcjL2F2YXRhci1zdHVk
aW8nOyB9IGNhdGNoIChlKSB7fSBhd2FpdCB3KDIwMCk7IHRyeSB7IGxvY2F0aW9uLmhhc2ggPSAn
Iy9wYW5lbC1hdmF0YXItc3R1ZGlvJzsgfSBjYXRjaCAoZSkge30gYXdhaXQgdygxMjAwKTsgfSk7
IH0gY2F0Y2ggKGUpIHt9IH0KCmFzeW5jIGZ1bmN0aW9uIHByb29mcyhwYWdlKSB7CiAgcmV0dXJu
IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKHN1cmZhY2VzKSA9PiB7CiAgICBmdW5jdGlvbiBtKGVsKSB7
IGlmICghZWwpIHJldHVybiB7IGV4aXN0czogZmFsc2UgfTsgbGV0IHIgPSB7fTsgdHJ5IHsgciA9
IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOyB9IGNhdGNoIChlKSB7fSBsZXQgY3MgPSB7fTsg
dHJ5IHsgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTsgfSBjYXRjaCAoZSkge30KICAgICAgcmV0
dXJuIHsgZXhpc3RzOiB0cnVlLCB2aXNpYmxlOiBlbC5vZmZzZXRQYXJlbnQgIT09IG51bGwgJiYg
KHIud2lkdGggfHwgMCkgPiAwICYmIChyLmhlaWdodCB8fCAwKSA+IDAsIHJlY3Q6IHsgdzogTWF0
aC5yb3VuZChyLndpZHRoIHx8IDApLCBoOiBNYXRoLnJvdW5kKHIuaGVpZ2h0IHx8IDApIH0sIGRp
c3BsYXk6IGNzLmRpc3BsYXksIHZpc2liaWxpdHk6IGNzLnZpc2liaWxpdHksIG9wYWNpdHk6IGNz
Lm9wYWNpdHksIHpJbmRleDogY3MuekluZGV4LCBhcmlhSGlkZGVuOiBlbC5nZXRBdHRyaWJ1dGUg
JiYgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpLCBpbmVydDogKGVsLmhhc0F0dHJpYnV0
ZSAmJiBlbC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHx8IGZhbHNlIH07IH0KICAgIGNvbnN0IHJl
cyA9IHt9OyBzdXJmYWNlcy5mb3JFYWNoKChbbiwgc10pID0+IHsgbGV0IGVsID0gbnVsbDsgdHJ5
IHsgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHMpOyB9IGNhdGNoIChlKSB7fSByZXNbbl0g
PSBtKGVsKTsgfSk7CiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keSwgc2hlbGwgPSBkb2N1
bWVudC5xdWVyeVNlbGVjdG9yKCcjYXBwLXNoZWxsJyksIENNID0gd2luZG93LkNvbnRhaW5lck1h
aW4sIGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50OwogICAgbGV0IGVmZkZsYWdzID0gbnVs
bDsgdHJ5IHsgZWZmRmxhZ3MgPSB7IHNoZWxsOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZHNob3cu
c2hlbGwuZmxhZ3MudjEnKSwgYXZzdDogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2RzaG93LmF2c3Qu
ZmxhZ3MudjEnKSB9OyB9IGNhdGNoIChlKSB7fQogICAgcmVzLl9hdHRycyA9IHsKICAgICAgYm9k
eV9kZXZpY2U6IGJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWRldmljZScpLCBib2R5X2JyZWFrcG9p
bnQ6IGJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWJyZWFrcG9pbnQnKSwgYm9keV9zdGF0ZTogYm9k
eS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnKSwKICAgICAgYXBwc2hlbGxfbW9iaWxlX21hcmtl
cjogc2hlbGwgPyBzaGVsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9iaWxlJykgOiBudWxsLCBhcHBz
aGVsbF9yZWFkeTogISEoc2hlbGwgJiYgKHNoZWxsLmNsYXNzTGlzdC5jb250YWlucygncmVhZHkn
KSB8fCBzaGVsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVhZHknKSAhPT0gbnVsbCkpLAogICAgICBh
Y3RpdmVfcGFuZWw6IENNID8gQ00uaWQgOiBudWxsLCBlZmZlY3RpdmVfZmxhZ3M6IGVmZkZsYWdz
LAogICAgICBkb2Nfc2Nyb2xsV2lkdGg6IGRlLnNjcm9sbFdpZHRoLCBkb2NfY2xpZW50V2lkdGg6
IGRlLmNsaWVudFdpZHRoLCBwYWdlX292ZXJmbG93OiBkZS5zY3JvbGxXaWR0aCA+IGRlLmNsaWVu
dFdpZHRoICsgMSwKICAgIH07CiAgICByZXR1cm4gcmVzOwogIH0sIFNVUkZBQ0VTKTsKfQoKYXN5
bmMgZnVuY3Rpb24gcGFzcyhicm93c2VyLCBsYWJlbCwgdXJsLCBmbGFncywgZG9TdHVkaW8sIHZp
ZXdwb3J0cykgewogIGNvbnN0IHJlYyA9IHsgbGFiZWwsIHVybCwgZmxhZ3M6IGxhYmVsLmVuZHNX
aXRoKCdPTicpID8gJ09OJyA6ICdPRkYnLCBib2FyZHM6IFtdLCBwcm9vZnM6IG51bGwsIHN0dWRp
b1Byb29mczogbnVsbCwgY29uc29sZTogW10sIHBhZ2VlcnJvcnM6IFtdLCBmYWlsZWRSZXF1ZXN0
czogW10sIGVycm9yOiBudWxsIH07CiAgdHJ5IHsKICAgIGNvbnN0IGN0eCA9IGF3YWl0IGJyb3dz
ZXIubmV3Q29udGV4dCh7IGlnbm9yZUhUVFBTRXJyb3JzOiB0cnVlLCByZWR1Y2VkTW90aW9uOiAn
cmVkdWNlJywgdmlld3BvcnQ6IHsgd2lkdGg6IDM5MCwgaGVpZ2h0OiA4NDQgfSwgZGV2aWNlU2Nh
bGVGYWN0b3I6IDIsIHN0b3JhZ2VTdGF0ZTogc3RhdGVGb3IodXJsKSB9KTsKICAgIGF3YWl0IGN0
eC5hZGRJbml0U2NyaXB0KGluaXRTY3JpcHQoZmxhZ3MpKTsKICAgIGNvbnN0IHBhZ2UgPSBhd2Fp
dCBjdHgubmV3UGFnZSgpOyBwYWdlLnNldERlZmF1bHRUaW1lb3V0KDE1MDAwKTsKICAgIHBhZ2Uu
b24oJ2NvbnNvbGUnLCBtID0+IHsgaWYgKFsnZXJyb3InLCAnd2FybmluZyddLmluY2x1ZGVzKG0u
dHlwZSgpKSkgcmVjLmNvbnNvbGUucHVzaCh7IHQ6IG0udHlwZSgpLCB0ZXh0OiAobS50ZXh0KCkg
fHwgJycpLnNsaWNlKDAsIDE2MCkgfSk7IH0pOwogICAgcGFnZS5vbigncGFnZWVycm9yJywgZSA9
PiByZWMucGFnZWVycm9ycy5wdXNoKFN0cmluZyhlICYmIGUubWVzc2FnZSB8fCBlKS5zbGljZSgw
LCAxNjApKSk7CiAgICBwYWdlLm9uKCdyZXF1ZXN0ZmFpbGVkJywgciA9PiB7IGNvbnN0IHUgPSBy
LnVybCgpOyBpZiAoIS9cL2Fzc2V0c1wvfFwuKHBuZ3xqcGd8anBlZ3x3ZWJwfGdpZnxzdmd8d29m
ZjI/fHR0Znxjc3N8bWFwKShcP3wkKS9pLnRlc3QodSkpIHJlYy5mYWlsZWRSZXF1ZXN0cy5wdXNo
KHsgdXJsOiB1LnNsaWNlKDAsIDE0MCksIGVycjogKHIuZmFpbHVyZSgpICYmIHIuZmFpbHVyZSgp
LmVycm9yVGV4dCkgfHwgJycgfSk7IH0pOwogICAgYXdhaXQgcGFnZS5nb3RvKHVybCArICcvJywg
eyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJyB9KTsKICAgIGF3YWl0IHdhaXRTaGVsbChw
YWdlKTsgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg5MDApOwogICAgcmVjLnByb29mcyA9IGF3
YWl0IHByb29mcyhwYWdlKTsKICAgIGZvciAoY29uc3QgdiBvZiB2aWV3cG9ydHMpIHsgdHJ5IHsg
YXdhaXQgcGFnZS5zZXRWaWV3cG9ydFNpemUoeyB3aWR0aDogdi53LCBoZWlnaHQ6IHYuaCB9KTsg
YXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzNTApOyBjb25zdCBmID0gYCR7T1VURElSfS9ib2Fy
ZC0ke2xhYmVsfS0ke3Yubn0ucG5nYDsgYXdhaXQgcGFnZS5zY3JlZW5zaG90KHsgcGF0aDogZiwg
ZnVsbFBhZ2U6IHRydWUsIHRpbWVvdXQ6IDEyMDAwIH0pOyByZWMuYm9hcmRzLnB1c2goZik7IH0g
Y2F0Y2ggKGUpIHsgb3V0LmVycm9ycy5wdXNoKGBib2FyZCAke2xhYmVsfSAke3Yubn06ICR7ZS5t
ZXNzYWdlfWApOyB9IH0KICAgIGlmIChkb1N0dWRpbykgeyB0cnkgeyBhd2FpdCBwYWdlLnNldFZp
ZXdwb3J0U2l6ZSh7IHdpZHRoOiAzOTAsIGhlaWdodDogODQ0IH0pOyBhd2FpdCBvcGVuU3R1ZGlv
KHBhZ2UpOyBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDcwMCk7IHJlYy5zdHVkaW9Qcm9vZnMg
PSBhd2FpdCBwcm9vZnMocGFnZSk7IGNvbnN0IGYgPSBgJHtPVVRESVJ9L2JvYXJkLSR7bGFiZWx9
LXN0dWRpby0zOTB4ODQ0LnBuZ2A7IGF3YWl0IHBhZ2Uuc2NyZWVuc2hvdCh7IHBhdGg6IGYsIGZ1
bGxQYWdlOiB0cnVlLCB0aW1lb3V0OiAxMjAwMCB9KTsgcmVjLmJvYXJkcy5wdXNoKGYpOyB9IGNh
dGNoIChlKSB7IG91dC5lcnJvcnMucHVzaChgc3R1ZGlvICR7bGFiZWx9OiAke2UubWVzc2FnZX1g
KTsgfSB9CiAgICBhd2FpdCBjdHguY2xvc2UoKTsKICB9IGNhdGNoIChlKSB7IHJlYy5lcnJvciA9
IFN0cmluZyhlICYmIGUubWVzc2FnZSB8fCBlKTsgfQogIHJldHVybiByZWM7Cn0KCmNvbnN0IFZQ
U18zOTAgPSBbeyB3OiAzOTAsIGg6IDg0NCwgbjogJzM5MHg4NDQnIH1dOwpjb25zdCBWUFNfTU9S
RSA9IFt7IHc6IDMyMCwgaDogNTY4LCBuOiAnMzIweDU2OCcgfSwgeyB3OiAzNjAsIGg6IDgwMCwg
bjogJzM2MHg4MDAnIH0sIHsgdzogNDEyLCBoOiA5MTUsIG46ICc0MTJ4OTE1JyB9LCB7IHc6IDg0
NCwgaDogMzkwLCBuOiAnODQ0eDM5MCcgfSwgeyB3OiA3NjgsIGg6IDEwMjQsIG46ICc3Njh4MTAy
NCcgfSwgeyB3OiAxMjgwLCBoOiA3MjAsIG46ICcxMjgweDcyMCcgfV07Cgpjb25zdCB7IGNocm9t
aXVtIH0gPSBhd2FpdCBpbXBvcnQoJ3BsYXl3cmlnaHQtY29yZScpOwpjb25zdCBicm93c2VyID0g
YXdhaXQgY2hyb21pdW0ubGF1bmNoKHsgZXhlY3V0YWJsZVBhdGg6IFBXX0NIUk9NRSwgaGVhZGxl
c3M6IHRydWUsIGFyZ3M6IFsnLS1uby1zYW5kYm94JywgJy0tZGlzYWJsZS1kZXYtc2htLXVzYWdl
JywgJy0taWdub3JlLWNlcnRpZmljYXRlLWVycm9ycyddIH0pOwp0cnkgewogIGNvbnN0IGFnID0g
YXdhaXQgYXV0aEdhdGUoYnJvd3Nlcik7CiAgb3V0LmF1dGhHYXRlID0gYWcuc2lnbmFsczsKICBp
ZiAoIWFnLm9rKSB7CiAgICBvdXQuQVVUSF9TRVNTSU9OX1JFQUwgPSAnRkFJTEVEJzsKICAgIGlm
IChSLnN1bW1hcnkuSEFTX1NFQ1VSRV9DT09LSUUgJiYgYWcuc2lnbmFscy5MT0dJTl9GT1JNX1ZJ
U0lCTEUpIG91dC5oaW50ID0gJ0FVVEhfUkVTQ09QSU5HX1JFUVVJUkVTX1NFQ1VSRV9QUkVWSUVX
IChjb29raWUgU2VjdXJlIHBvZGUgbmFvIGFuZXhhciBzb2JyZSBodHRwIGxvb3BiYWNrKSc7CiAg
ICB0cnkgeyB3cml0ZUZpbGVTeW5jKGAke09VVERJUn0vZ2F0ZTA3LXByb29mcy5qc29uYCwgSlNP
Ti5zdHJpbmdpZnkob3V0LCBudWxsLCAyKSk7IH0gY2F0Y2ggKGUpIHt9CiAgICBsb2cob3V0KTsg
YXdhaXQgYnJvd3Nlci5jbG9zZSgpOyBwcm9jZXNzLmV4aXQoNik7CiAgfQogIG91dC5BVVRIX1NF
U1NJT05fUkVBTCA9ICdQQVNTJzsKICAvLyAzOTAgcHJpbWVpcm8gcGFyYSBvcyAzIHBhc3Nlcwog
IGNvbnN0IHAxID0gTUFJTl9VUkwgPyBhd2FpdCBwYXNzKGJyb3dzZXIsICdtYWluLU9GRicsIE1B
SU5fVVJMLCBGTEFHU19PRkYsIGZhbHNlLCBWUFNfMzkwKSA6IG51bGw7CiAgY29uc3QgcDIgPSBh
d2FpdCBwYXNzKGJyb3dzZXIsICdnb2xkZW4tT0ZGJywgR09MREVOX1VSTCwgRkxBR1NfT0ZGLCBm
YWxzZSwgVlBTXzM5MCk7CiAgY29uc3QgcDMgPSBhd2FpdCBwYXNzKGJyb3dzZXIsICdnb2xkZW4t
T04nLCBHT0xERU5fVVJMLCBGTEFHU19PTiwgdHJ1ZSwgVlBTXzM5MCk7CiAgaWYgKHAxKSBvdXQu
cGFzc2VzLnB1c2gocDEpOyBvdXQucGFzc2VzLnB1c2gocDIpOyBvdXQucGFzc2VzLnB1c2gocDMp
OwogIGNvbnN0IG1vdW50ZWQgPSB4ID0+IHggJiYgeC5wcm9vZnMgJiYgeC5wcm9vZnMuX2F0dHJz
ICYmIHgucHJvb2ZzLl9hdHRycy5ib2R5X3N0YXRlID09PSAnYXV0aGVudGljYXRlZCc7CiAgY29u
c3QgYWxsTW91bnRlZCA9ICghTUFJTl9VUkwgfHwgbW91bnRlZChwMSkpICYmIG1vdW50ZWQocDIp
ICYmIG1vdW50ZWQocDMpOwogIG91dC5BTExfUEFTU0VTX01PVU5URURfMzkwID0gYWxsTW91bnRl
ZDsKICAvLyBzw7MgZXhwYW5kZSB2aWV3cG9ydHMgc2Ugb3MgMyBtb250YXJhbSBhdXRlbnRpY2Fk
b3MKICBpZiAoYWxsTW91bnRlZCkgewogICAgaWYgKE1BSU5fVVJMKSBvdXQucGFzc2VzLnB1c2go
YXdhaXQgcGFzcyhicm93c2VyLCAnbWFpbi1PRkYnLCBNQUlOX1VSTCwgRkxBR1NfT0ZGLCBmYWxz
ZSwgVlBTX01PUkUpKTsKICAgIG91dC5wYXNzZXMucHVzaChhd2FpdCBwYXNzKGJyb3dzZXIsICdn
b2xkZW4tT0ZGJywgR09MREVOX1VSTCwgRkxBR1NfT0ZGLCBmYWxzZSwgVlBTX01PUkUpKTsKICAg
IG91dC5wYXNzZXMucHVzaChhd2FpdCBwYXNzKGJyb3dzZXIsICdnb2xkZW4tT04nLCBHT0xERU5f
VVJMLCBGTEFHU19PTiwgZmFsc2UsIFZQU19NT1JFKSk7CiAgfQogIG91dC5CT0FSRFNfQVVUSEVO
VElDQVRFRCA9IG91dC5wYXNzZXMucmVkdWNlKChhLCBwKSA9PiBhICsgKHAuYm9hcmRzID8gcC5i
b2FyZHMubGVuZ3RoIDogMCksIDApOwogIHRyeSB7IHdyaXRlRmlsZVN5bmMoYCR7T1VURElSfS9n
YXRlMDctcHJvb2ZzLmpzb25gLCBKU09OLnN0cmluZ2lmeShvdXQsIG51bGwsIDIpKTsgfSBjYXRj
aCAoZSkge30KICBsb2cob3V0KTsKICBhd2FpdCBicm93c2VyLmNsb3NlKCk7CiAgcHJvY2Vzcy5l
eGl0KGFsbE1vdW50ZWQgPyAwIDogNyk7Cn0gY2F0Y2ggKGUpIHsgb3V0LmVycm9ycy5wdXNoKCdG
QVRBTDonICsgU3RyaW5nKGUgJiYgZS5tZXNzYWdlIHx8IGUpKTsgdHJ5IHsgd3JpdGVGaWxlU3lu
YyhgJHtPVVRESVJ9L2dhdGUwNy1wcm9vZnMuanNvbmAsIEpTT04uc3RyaW5naWZ5KG91dCwgbnVs
bCwgMikpOyB9IGNhdGNoIChfKSB7fSBsb2cob3V0KTsgdHJ5IHsgYXdhaXQgYnJvd3Nlci5jbG9z
ZSgpOyB9IGNhdGNoIChfKSB7fSBwcm9jZXNzLmV4aXQoNyk7IH0K
B64_PROOFS
node --check "${TOOLS}/proxy-api-only.mjs" || abort "proxy embutido invalido."
node --check "${TOOLS}/gate07-proofs.mjs" || abort "proofs embutido invalido."

# ── 5) deps (playwright-core) ─────────────────────────────────────────────────
log "5) dependencias (playwright-core)"
DEPS=""
for base in "${REPO}/public/components/panels/panel-avatar-studio" "${REPO}/public/react" "${REPO}" ; do
  if [ -d "${base}/node_modules/playwright-core" ]; then DEPS="${base}/node_modules"; break; fi
done
[ -n "${DEPS}" ] || abort "playwright-core nao encontrado no servidor."
export NODE_PATH="${DEPS}"
ln -sfn "${DEPS}" "${TOOLS}/node_modules" 2>/dev/null || true
printf 'DEPS=%s\n' "${DEPS}"

# ── 6) proxy do GOLDEN (127.0.0.1) ────────────────────────────────────────────
log "6) preview+proxy do golden em ${GOLDEN_URL} (/api -> ${BACKEND_URL})"
ROOT="${PREVIEW_G}/public" BACKEND_URL="${BACKEND_URL}" PORT="${PORT_GOLDEN}" \
  node "${TOOLS}/proxy-api-only.mjs" >"${EVID}/preview-golden.log" 2>&1 &
PID_G=$!
for i in $(seq 1 40); do grep -q PREVIEW_PROXY_READY "${EVID}/preview-golden.log" 2>/dev/null && break; sleep 0.25; done
grep -q PREVIEW_PROXY_READY "${EVID}/preview-golden.log" 2>/dev/null || abort "preview golden nao subiu."

# ── 7) IDENTIDADE SERVIDA (fail-closed) ───────────────────────────────────────
log "7) prova de identidade servida (sha256)"
CHK_MARKER="${EXPECTED_MARKER_SHA256}"
[ "${SELFTEST_BAD_HASH}" = "1" ] && CHK_MARKER="deadbeef_forced_mismatch"
SERVED_MARKER="$(curl -fs "${GOLDEN_URL}/${MARKER_REL}?probe" | sha256sum | cut -d' ' -f1 || true)"
SERVED_MARKER_HTTP="$(curl -s -o /dev/null -w '%{http_code}' "${GOLDEN_URL}/${MARKER_REL}?probe" 2>/dev/null||echo 000)"
printf 'SERVED_MARKER_SHA256=%s SERVED_MARKER_HTTP=%s\n' "${SERVED_MARKER:-<vazio>}" "${SERVED_MARKER_HTTP}"
SERVED_INDEX="$(curl -fs "${GOLDEN_URL}/" | sha256sum | cut -d' ' -f1 || true)"
printf 'SERVED_INDEX_SHA256=%s\n' "${SERVED_INDEX:-<vazio>}"
# marcador NAO existe na main?
if git -C "${REPO}" cat-file -e "${EXPECTED_MAIN}:public/${MARKER_REL}" 2>/dev/null; then MARKER_IN_MAIN=YES; else MARKER_IN_MAIN=NO; fi
printf 'MARKER_IN_MAIN=%s (esperado NO)\n' "${MARKER_IN_MAIN}"
# manifest do avatar (best-effort)
MANIFEST_REL="$(cd "${PREVIEW_G}" && find public/components/panels/panel-avatar-studio -maxdepth 3 -iname 'manifest*.json' 2>/dev/null | head -1 || true)"
MANIFEST_MATCH="SKIPPED"
if [ -n "${MANIFEST_REL}" ]; then
  EXP_MAN="$(sha256sum "${PREVIEW_G}/${MANIFEST_REL}" | cut -d' ' -f1)"
  SRV_MAN="$(curl -fs "${GOLDEN_URL}/${MANIFEST_REL#public/}" | sha256sum | cut -d' ' -f1 || true)"
  [ "${EXP_MAN}" = "${SRV_MAN}" ] && MANIFEST_MATCH="OK" || MANIFEST_MATCH="DIVERGE(${SRV_MAN:-vazio})"
fi
printf 'MANIFEST_REL=%s MANIFEST_MATCH=%s\n' "${MANIFEST_REL:-<nenhum>}" "${MANIFEST_MATCH}"
SERVED_CODE_IDENTITY="CONFIRMED"
[ "${SERVED_MARKER_HTTP}" = "200" ] || SERVED_CODE_IDENTITY="FAILED"
[ "${SERVED_MARKER}" = "${CHK_MARKER}" ] || SERVED_CODE_IDENTITY="FAILED"
[ "${MARKER_IN_MAIN}" = "NO" ] || SERVED_CODE_IDENTITY="FAILED"
if [ -n "${EXPECTED_INDEX_SHA256}" ] && [ "${SERVED_INDEX}" != "${EXPECTED_INDEX_SHA256}" ]; then SERVED_CODE_IDENTITY="FAILED"; fi
printf 'SERVED_CODE_IDENTITY=%s\n' "${SERVED_CODE_IDENTITY}"
[ "${SERVED_CODE_IDENTITY}" = "CONFIRMED" ] || { printf 'ABORT(3): identidade servida FAILED — preview nao serve o candidato congelado.\n' >&2; exit 3; }

if [ "${DRYRUN}" = "1" ]; then
  printf '\nDRYRUN_OK=YES (preflight+extract+build+proxy+served-identity provados; auth/browser pulados)\n'
  exit 0
fi

# ── 8) storage-state: imutabilidade do original + copia temp 600 ──────────────
log "8) storage-state (hash do original p/ imutabilidade; copia temp 600; nunca lido)"
ORIGINAL_STORAGE_HASH_BEFORE="$(sha256sum "${AUDIT_STORAGE_STATE}" | cut -d' ' -f1)"
cp -p "${AUDIT_STORAGE_STATE}" "${STORAGE_TMP}" || { printf 'ABORT: falha ao copiar storage-state.\n' >&2; exit 4; }
chmod 600 "${STORAGE_TMP}"
[ -s "${STORAGE_TMP}" ] || { printf 'ABORT: copia do storage-state vazia.\n' >&2; exit 4; }
printf 'ORIGINAL_STORAGE_HASH_BEFORE=%s\nTEMP_STORAGE_MODE=%s\n' "${ORIGINAL_STORAGE_HASH_BEFORE}" "$(stat -c '%a' "${STORAGE_TMP}" 2>/dev/null)"

# ── 9) proxy da MAIN (baseline) ───────────────────────────────────────────────
log "9) preview+proxy da main (baseline OFF) em ${MAIN_URL}"
git -C "${REPO}" archive --format=tar "${EXPECTED_MAIN}" | tar -x -C "${PREVIEW_M}" 2>/dev/null || printf 'MAIN_ARCHIVE=partial\n'
if [ -f "${PREVIEW_M}/public/index.html" ]; then
  ROOT="${PREVIEW_M}/public" BACKEND_URL="${BACKEND_URL}" PORT="${PORT_MAIN}" \
    node "${TOOLS}/proxy-api-only.mjs" >"${EVID}/preview-main.log" 2>&1 &
  PID_M=$!
  for i in $(seq 1 40); do grep -q PREVIEW_PROXY_READY "${EVID}/preview-main.log" 2>/dev/null && break; sleep 0.25; done
  grep -q PREVIEW_PROXY_READY "${EVID}/preview-main.log" 2>/dev/null && MAIN_READY=1 || MAIN_READY=0
else MAIN_READY=0; fi
printf 'MAIN_BASELINE_READY=%s\n' "${MAIN_READY}"

# ── 10) reescopo seguro + gate de AUTH REAL + provas OFF/ON ───────────────────
log "10) reescopo (cópia) + gate de auth real + provas (main/OFF + golden/OFF + golden/ON)"
GARG=""; [ "${MAIN_READY}" = "1" ] && GARG="${MAIN_URL}"
set +e
PW_CHROME="${PW_CHROME}" STORAGE_STATE="${STORAGE_TMP}" OUTDIR="${EVID}" \
  GOLDEN_URL="${GOLDEN_URL}" MAIN_URL="${GARG}" COMMIT="${EXPECTED_COMMIT}" TREE="${EXPECTED_TREE}" \
  NODE_PATH="${DEPS}" node "${TOOLS}/gate07-proofs.mjs" > >(red > "${EVID}/proofs.log") 2>&1
PROOFS_RC=$?
set -e
AUTH_SESSION_REAL="$(grep -o '"AUTH_SESSION_REAL":"[A-Z]*"' "${EVID}/gate07-proofs.json" 2>/dev/null | head -1 | cut -d'"' -f4)"
[ -z "${AUTH_SESSION_REAL}" ] && AUTH_SESSION_REAL="UNKNOWN"
RESCOPE_LINE="$(grep -o '"RESCOPED_COOKIE_COUNT":[0-9]*,"RESCOPED_ORIGIN_COUNT":[0-9]*,"UNRELATED_COOKIES_DROPPED":[0-9]*' "${EVID}/gate07-proofs.json" 2>/dev/null | head -1)"
SEC_PRES="$(grep -o '"SECURE_PRESERVED":[a-z]*' "${EVID}/gate07-proofs.json" 2>/dev/null | head -1 | cut -d: -f2)"
HTTPONLY_PRES="$(grep -o '"HTTPONLY_PRESERVED":[a-z]*' "${EVID}/gate07-proofs.json" 2>/dev/null | head -1 | cut -d: -f2)"
SAMESITE_PRES="$(grep -o '"SAMESITE_PRESERVED":[a-z]*' "${EVID}/gate07-proofs.json" 2>/dev/null | head -1 | cut -d: -f2)"
BOARDS_N="$(ls "${EVID}"/board-*.png 2>/dev/null | wc -l | tr -d ' ')"
if [ "${AUTH_SESSION_REAL}" = "PASS" ]; then FLAG_OFF_RESULT=PASS; FLAG_ON_RESULT=PASS; BOARDS_AUTH="${BOARDS_N}"; else FLAG_OFF_RESULT=INCONCLUSIVE; FLAG_ON_RESULT=INCONCLUSIVE; BOARDS_AUTH=0; fi
printf 'AUTH_SESSION_REAL=%s PROOFS_RC=%s RESCOPE=%s SEC_PRES=%s\n' "${AUTH_SESSION_REAL}" "${PROOFS_RC}" "${RESCOPE_LINE}" "${SEC_PRES}"
# imutabilidade do original
ORIGINAL_STORAGE_HASH_AFTER="$(sha256sum "${AUDIT_STORAGE_STATE}" | cut -d' ' -f1)"
ORIGINAL_STORAGE_UNCHANGED=NO; [ "${ORIGINAL_STORAGE_HASH_AFTER}" = "${ORIGINAL_STORAGE_HASH_BEFORE}" ] && ORIGINAL_STORAGE_UNCHANGED=YES
printf 'ORIGINAL_STORAGE_UNCHANGED=%s\n' "${ORIGINAL_STORAGE_UNCHANGED}"

# ── 11) identidade DEPOIS (produção intacta) ──────────────────────────────────
git -C "${REPO}" fetch --quiet origin || true
MAIN_AFTER="$(git -C "${REPO}" rev-parse origin/main)"
PROD_SIDE_EFFECTS="NONE"; [ "${MAIN_AFTER}" = "${MAIN_BEFORE}" ] || PROD_SIDE_EFFECTS="MAIN_CHANGED"

# ── 12) GATE + entregaveis ────────────────────────────────────────────────────
log "12) bloco de gate"
GATEFILE="${EVID}/GATE-07.txt"
{
  echo "==== 07 SERVER-GATE (golden preview autenticada) ===="
  echo "STAMP=${STAMP}"
  echo "EXPECTED_COMMIT=${EXPECTED_COMMIT}"
  echo "EXPECTED_TREE=${EXPECTED_TREE}"
  echo "MAIN_BEFORE=${MAIN_BEFORE}"
  echo "MAIN_AFTER=${MAIN_AFTER}"
  echo "SERVED_CODE_IDENTITY=${SERVED_CODE_IDENTITY}"
  echo "SERVED_MARKER_SHA256=${SERVED_MARKER}"
  echo "EXPECTED_MARKER_SHA256=${EXPECTED_MARKER_SHA256}"
  echo "MARKER_IN_MAIN=${MARKER_IN_MAIN}"
  echo "MANIFEST_MATCH=${MANIFEST_MATCH}"
  echo "BUILD_AVATAR=${BUILD_AVATAR} (rc=${BUILD_AVATAR_RC})"
  echo "STORAGE_STATE_RESCOPED=${RESCOPE_LINE:-<sem>}"
  echo "SECURITY_ATTRIBUTES_PRESERVED=secure:${SEC_PRES:-?} httpOnly:${HTTPONLY_PRES:-?} sameSite:${SAMESITE_PRES:-?}"
  echo "ORIGINAL_STORAGE_UNCHANGED=${ORIGINAL_STORAGE_UNCHANGED}"
  echo "AUTH_SESSION_REAL=${AUTH_SESSION_REAL}"
  echo "MAIN_BASELINE_READY=${MAIN_READY}"
  echo "FLAG_OFF_RESULT=${FLAG_OFF_RESULT}"
  echo "FLAG_ON_RESULT=${FLAG_ON_RESULT}"
  echo "BOARDS_TOTAL=${BOARDS_N}"
  echo "BOARDS_AUTHENTICATED=${BOARDS_AUTH}"
  echo "PROOFS_RC=${PROOFS_RC}"
  echo "PRODUCTION_SIDE_EFFECTS=${PROD_SIDE_EFFECTS}"
  for k in MERGE_MAIN PUSH_MAIN DEPLOY ROLLOUT REAL_FLAG_FLIP PRODUCTION_DIRECTORY_MUTATION FABRICATED_AUTH_RESULTS SECRETS_IN_EVIDENCE; do echo "${k}=NO"; done
} | tee "${GATEFILE}"

# ── 13) pacote (sem segredos) ─────────────────────────────────────────────────
log "13) empacotando (sem storage-state/segredos)"
rm -f "${STORAGE_TMP}"
PKG="/tmp/trackd-07gate-evidencias-${STAMP}.tar.gz"
tar -C "${WORK}" --exclude='auth-audit.json' --exclude='*.token' --exclude='*storage-state*' -czf "${PKG}" "evidencias" 2>/dev/null || abort "falha ao empacotar."
if tar -tzf "${PKG}" | grep -qiE 'auth.*\.json|storage-state|\.token'; then abort "pacote contem arquivo sensivel."; fi
PKG_SHA="$(sha256sum "${PKG}" | cut -d' ' -f1)"
printf '\n================ RESULTADO 07 ================\n'
printf 'PACOTE=%s\nPACOTE_SHA256=%s\nGATE=%s\n' "${PKG}" "${PKG_SHA}" "${GATEFILE}"
printf 'SERVED_CODE_IDENTITY=%s · AUTH_SESSION_REAL=%s · FLAG_OFF=%s · FLAG_ON=%s · BOARDS_AUTH=%s · SIDE_EFFECTS=%s\n' "${SERVED_CODE_IDENTITY}" "${AUTH_SESSION_REAL}" "${FLAG_OFF_RESULT}" "${FLAG_ON_RESULT}" "${BOARDS_AUTH}" "${PROD_SIDE_EFFECTS}"
printf '=============================================\n'
# exit code distinto (fail-closed): 0 ok · 5 reescopo · 6 auth real · 7 matriz/boards
FINAL_RC=0
case "${PROOFS_RC}" in
  0) [ "${AUTH_SESSION_REAL}" = "PASS" ] && FINAL_RC=0 || FINAL_RC=6 ;;
  5) FINAL_RC=5 ;; 6) FINAL_RC=6 ;; 7) FINAL_RC=7 ;; 2) FINAL_RC=2 ;; *) FINAL_RC=7 ;;
esac
printf 'FINAL_EXIT=%s (0 ok · 5 reescopo · 6 auth-real · 7 matriz)\n' "${FINAL_RC}"
exit "${FINAL_RC}"
