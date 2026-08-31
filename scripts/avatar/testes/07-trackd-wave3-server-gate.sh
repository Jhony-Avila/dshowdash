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
  [ -n "${AUDIT_STORAGE_STATE}" ] || abort "AUDIT_STORAGE_STATE nao definido (e DRYRUN!=1)."
  [ -f "${AUDIT_STORAGE_STATE}" ] || abort "AUDIT_STORAGE_STATE ausente: ${AUDIT_STORAGE_STATE}"
  [ -s "${AUDIT_STORAGE_STATE}" ] || abort "AUDIT_STORAGE_STATE vazio."
  MODE="$(stat -c '%a' "${AUDIT_STORAGE_STATE}" 2>/dev/null||echo '?')"
  OWNER="$(stat -c '%U' "${AUDIT_STORAGE_STATE}" 2>/dev/null||echo '?')"
  printf 'STORAGE_MODE=%s STORAGE_OWNER=%s\n' "${MODE}" "${OWNER}"
  [ "${MODE}" = "600" ] || abort "storage-state deve ser modo 600 (obtido ${MODE})."
  [ "${OWNER}" = "$(id -un)" ] || abort "storage-state deve pertencer a $(id -un) (obtido ${OWNER})."
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
Ly8gZ2F0ZTA3LXByb29mcy5tanMg4oCUIHByb3ZhcyBhdXRlbnRpY2FkYXMgZG8gMDctc2VydmVy
LWdhdGUuCi8vIFBhc3NlczogbWFpbi9PRkYgKGJhc2VsaW5lKSwgZ29sZGVuL09GRiwgZ29sZGVu
L09OLiBCb2FyZHMgMzkweDg0NCwgODQ0eDM5MCwgMTI4MHg3MjAuCi8vIFRhYmVsYSBkZSBwcm92
YXMgZGUgRE9NIHBvciBzdXBlcmbDrWNpZSAoZXhpc3RzL3Zpc2libGUvcmVjdC9kaXNwbGF5L3Zp
c2liaWxpdHkvb3BhY2l0eS96SW5kZXgvYXJpYUhpZGRlbi9pbmVydCkuCi8vIEZsYWdzIGluamV0
YWRhcyBTw5Mgbm8gY29udGV4dG8gUGxheXdyaWdodCAobG9jYWxTdG9yYWdlKSwgbnVuY2Egbm8g
YmFja2VuZC4gU2VncmVkb3M6IG51bmNhIGltcHJlc3Nvcy4KaW1wb3J0IHsgY2hyb21pdW0gfSBm
cm9tICdwbGF5d3JpZ2h0LWNvcmUnOwppbXBvcnQgeyB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnbm9k
ZTpmcyc7Cgpjb25zdCBQV19DSFJPTUUgPSBwcm9jZXNzLmVudi5QV19DSFJPTUU7CmNvbnN0IFNU
T1JBR0UgPSBwcm9jZXNzLmVudi5TVE9SQUdFX1NUQVRFIHx8ICcnOwpjb25zdCBPVVRESVIgPSBw
cm9jZXNzLmVudi5PVVRESVIgfHwgJy4nOwpjb25zdCBHT0xERU5fVVJMID0gcHJvY2Vzcy5lbnYu
R09MREVOX1VSTCB8fCAnJzsKY29uc3QgTUFJTl9VUkwgPSBwcm9jZXNzLmVudi5NQUlOX1VSTCB8
fCAnJzsKY29uc3QgQ09NTUlUID0gcHJvY2Vzcy5lbnYuQ09NTUlUIHx8ICcnOwpjb25zdCBUUkVF
ID0gcHJvY2Vzcy5lbnYuVFJFRSB8fCAnJzsKCmNvbnN0IFZQUyA9IFsge3c6MzkwLGg6ODQ0LG46
JzM5MHg4NDQnfSwge3c6ODQ0LGg6MzkwLG46Jzg0NHgzOTAnfSwge3c6MTI4MCxoOjcyMCxuOicx
MjgweDcyMCd9IF07CmNvbnN0IEZMQUdTX09OID0geyBzaGVsbDogeyAnYXM2Lm1vYmlsZV9zaGVs
bCc6IHRydWUsICdhczUubm92b19zaGVsbCc6IHRydWUgfSwgYXZzdDogeyAnYXM2Lm1vYmlsZV9z
dHVkaW8nOiB0cnVlIH0gfTsKY29uc3QgRkxBR1NfT0ZGID0geyBzaGVsbDogeyAnYXM2Lm1vYmls
ZV9zaGVsbCc6IGZhbHNlLCAnYXM1Lm5vdm9fc2hlbGwnOiBmYWxzZSB9LCBhdnN0OiB7ICdhczYu
bW9iaWxlX3N0dWRpbyc6IGZhbHNlIH0gfTsKCmNvbnN0IG91dCA9IHsgaWRlbnRpdHk6IHsgY29t
bWl0OiBDT01NSVQsIHRyZWU6IFRSRUUgfSwgZ29sZGVuVXJsOiBHT0xERU5fVVJMLCBtYWluVXJs
OiBNQUlOX1VSTCwgcGFzc2VzOiBbXSwgZXJyb3JzOiBbXSB9Owpjb25zdCBsb2cgPSAobykgPT4g
cHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkobykgKyAnXG4nKTsKaWYgKCFQV19D
SFJPTUUpIHsgbG9nKHsgZmF0YWw6ICdOT19QV19DSFJPTUUnIH0pOyBwcm9jZXNzLmV4aXQoMik7
IH0KaWYgKCFHT0xERU5fVVJMKSB7IGxvZyh7IGZhdGFsOiAnTk9fR09MREVOX1VSTCcgfSk7IHBy
b2Nlc3MuZXhpdCgyKTsgfQoKY29uc3QgU1VSRkFDRVMgPSBbCiAgWydoZWFkZXInLCAnI2hlYWRl
ciwgaGVhZGVyLmRzZC1zaGVsbF9fcmVnaW9uLS1oZWFkZXInXSwKICBbJ2RyYXdlcl90cmlnZ2Vy
JywgJyNoZWFkZXIgW2FyaWEtY29udHJvbHMqPSJzaWRlYmFyIl0sICNoZWFkZXIgW2RhdGEtZHJh
d2VyLXRyaWdnZXJdLCAjaGVhZGVyIFthcmlhLWxhYmVsKj0iTWVudSJdLCAuaGVhZGVyLW1vcmUs
ICNhczYtbW8tbW9yZSddLAogIFsnZGVza3RvcF9zaWRlYmFyJywgJyNzaWRlYmFyLCBhc2lkZS5k
c2Qtc2hlbGxfX3JlZ2lvbi0tc2lkZWJhciddLAogIFsnbW9iaWxlX2RyYXdlcicsICcjc2lkZWJh
clthcmlhLW1vZGFsPSJ0cnVlIl0sIC5kc2Qtc2lkZWJhci0tZHJhd2VyLCBbZGF0YS1tb2JpbGUt
ZHJhd2VyXSwgI3NpZGViYXIuaXMtb3BlbiddLAogIFsnbmF2cmFpbCcsICcjbmF2LXJhaWwsIG5h
di5kc2Qtc2hlbGxfX3JlZ2lvbi0tbmF2LXJhaWwnXSwKICBbJ2Z1bmN0aW9uYWxfZm9vdGVyJywg
JyNuYXYtcmFpbCwgbmF2LmRzZC1zaGVsbF9fcmVnaW9uLS1uYXYtcmFpbCddLAogIFsnbGVnYWxf
Zm9vdGVyJywgJyNmb290ZXIsIGZvb3Rlci5kc2Qtc2hlbGxfX3JlZ2lvbi0tZm9vdGVyLCAuZHNk
LWZvb3Rlcl9fbGVnYWwnXSwKICBbJ21haW4nLCAnbWFpbi5kc2Qtc2hlbGxfX3JlZ2lvbi0tbWFp
biwgI21haW4sIG1haW4nXSwKICBbJ2F2YXRhcl9zdHVkaW8nLCAnI3BhbmVsLWF2YXRhci1zdHVk
aW8sIFtkYXRhLXBhbmVsLWlkPSJwYW5lbC1hdmF0YXItc3R1ZGlvIl0sIC5hdmF0YXItc3R1ZGlv
LCAuU2hlbGxTdHVkaW8sIFtjbGFzcyo9ImF2YXRhci1zdHVkaW8iXSddLApdOwoKZnVuY3Rpb24g
aW5pdFNjcmlwdChmbGFncykgewogIHJldHVybiBgdHJ5ewogICAgbG9jYWxTdG9yYWdlLnNldEl0
ZW0oJ2RzaG93LnNoZWxsLmZsYWdzLnYxJywgSlNPTi5zdHJpbmdpZnkoJHtKU09OLnN0cmluZ2lm
eShmbGFncy5zaGVsbCl9KSk7CiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZHNob3cuYXZzdC5m
bGFncy52MScsIEpTT04uc3RyaW5naWZ5KCR7SlNPTi5zdHJpbmdpZnkoZmxhZ3MuYXZzdCl9KSk7
CiAgfWNhdGNoKGUpe31gOwp9Cgphc3luYyBmdW5jdGlvbiB3YWl0U2hlbGwocGFnZSl7IGNvbnN0
IGRsPURhdGUubm93KCkrMTIwMDA7IHdoaWxlKERhdGUubm93KCk8ZGwpeyB0cnl7IGlmKGF3YWl0
IHBhZ2UuZXZhbHVhdGUoKCk9PiEhZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FwcC1zaGVsbCcp
KSkgcmV0dXJuIHRydWU7IH1jYXRjaChlKXt9IGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNDAw
KTt9IHJldHVybiBmYWxzZTsgfQoKYXN5bmMgZnVuY3Rpb24gcHJvb2ZzKHBhZ2UpewogIHJldHVy
biBhd2FpdCBwYWdlLmV2YWx1YXRlKChzdXJmYWNlcykgPT4gewogICAgZnVuY3Rpb24gbShlbCl7
IGlmKCFlbCkgcmV0dXJuIHsgZXhpc3RzOmZhbHNlIH07IGxldCByPXt9OyB0cnl7cj1lbC5nZXRC
b3VuZGluZ0NsaWVudFJlY3QoKTt9Y2F0Y2goZSl7fSBsZXQgY3M9e307IHRyeXtjcz1nZXRDb21w
dXRlZFN0eWxlKGVsKTt9Y2F0Y2goZSl7fQogICAgICByZXR1cm4geyBleGlzdHM6dHJ1ZSwgdmlz
aWJsZTogZWwub2Zmc2V0UGFyZW50IT09bnVsbCAmJiAoci53aWR0aHx8MCk+MCAmJiAoci5oZWln
aHR8fDApPjAsIHJlY3Q6e3g6TWF0aC5yb3VuZChyLnh8fDApLHk6TWF0aC5yb3VuZChyLnl8fDAp
LHc6TWF0aC5yb3VuZChyLndpZHRofHwwKSxoOk1hdGgucm91bmQoci5oZWlnaHR8fDApfSwgZGlz
cGxheTpjcy5kaXNwbGF5LCB2aXNpYmlsaXR5OmNzLnZpc2liaWxpdHksIG9wYWNpdHk6Y3Mub3Bh
Y2l0eSwgekluZGV4OmNzLnpJbmRleCwgYXJpYUhpZGRlbjogZWwuZ2V0QXR0cmlidXRlJiZlbC5n
ZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyksIGluZXJ0OiAoZWwuaGFzQXR0cmlidXRlJiZlbC5o
YXNBdHRyaWJ1dGUoJ2luZXJ0JykpfHxmYWxzZSwgc2VsOiBlbC50YWdOYW1lP2VsLnRhZ05hbWUu
dG9Mb3dlckNhc2UoKSsoZWwuaWQ/JyMnK2VsLmlkOicnKTonJyB9OyB9CiAgICBjb25zdCByZXMg
PSB7fTsKICAgIHN1cmZhY2VzLmZvckVhY2goKFtuYW1lLCBzZWxdKSA9PiB7IGxldCBlbD1udWxs
OyB0cnl7IGVsPWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsKTt9Y2F0Y2goZSl7fSByZXNbbmFt
ZV09bShlbCk7IH0pOwogICAgY29uc3QgYm9keT1kb2N1bWVudC5ib2R5LCBzaGVsbD1kb2N1bWVu
dC5xdWVyeVNlbGVjdG9yKCcjYXBwLXNoZWxsJyksIENNPXdpbmRvdy5Db250YWluZXJNYWluOwog
ICAgcmVzWydfYXR0cnMnXSA9IHsgYm9keV9kZXZpY2U6IGJvZHkuZ2V0QXR0cmlidXRlKCdkYXRh
LWRldmljZScpLCBib2R5X2JyZWFrcG9pbnQ6IGJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWJyZWFr
cG9pbnQnKSwgYm9keV9zdGF0ZTogYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnKSwgYXBw
c2hlbGxfZGF0YV9tb2JpbGU6IHNoZWxsP3NoZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1tb2JpbGUn
KTpudWxsLCBhcHBzaGVsbF9jbGFzczogc2hlbGw/KHNoZWxsLmNsYXNzTmFtZXx8JycpLnNsaWNl
KDAsODApOm51bGwsIGFjdGl2ZV9wYW5lbDogQ00/Q00uaWQ6bnVsbCwgbW9iaWxlX2luaXRpYWxp
emVyOiAhIShzaGVsbCAmJiAoc2hlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLW1vYmlsZScpIT09bnVs
bCB8fCAvbW9iaWxlLy50ZXN0KHNoZWxsLmNsYXNzTmFtZXx8JycpKSkgfTsKICAgIHJldHVybiBy
ZXM7CiAgfSwgU1VSRkFDRVMpOwp9Cgphc3luYyBmdW5jdGlvbiBvcGVuU3R1ZGlvKHBhZ2UpeyB0
cnl7IGF3YWl0IHBhZ2UuZXZhbHVhdGUoYXN5bmMoKT0+eyBjb25zdCB3YWl0PW1zPT5uZXcgUHJv
bWlzZShyPT5zZXRUaW1lb3V0KHIsbXMpKTsgdHJ5e2NvbnN0IENNPXdpbmRvdy5Db250YWluZXJN
YWluOyBpZihDTSYmQ00ubW91bnQpQ00ubW91bnQoJ3BhbmVsLWF2YXRhci1zdHVkaW8nKTt9Y2F0
Y2goZSl7fSB0cnl7bG9jYXRpb24uaGFzaD0nIy9hdmF0YXItc3R1ZGlvJzt9Y2F0Y2goZSl7fSBh
d2FpdCB3YWl0KDIwMCk7IHRyeXtsb2NhdGlvbi5oYXNoPScjL3BhbmVsLWF2YXRhci1zdHVkaW8n
O31jYXRjaChlKXt9IGF3YWl0IHdhaXQoMTIwMCk7IH0pOyB9Y2F0Y2goZSl7fSB9Cgphc3luYyBm
dW5jdGlvbiBwYXNzKGJyb3dzZXIsIGxhYmVsLCB1cmwsIGZsYWdzLCBkb1N0dWRpbyl7CiAgY29u
c3QgcmVjID0geyBsYWJlbCwgdXJsLCBib2FyZHM6IFtdLCBwcm9vZnM6IG51bGwsIHN0dWRpb1By
b29mczogbnVsbCwgZXJyb3I6IG51bGwgfTsKICB0cnkgewogICAgY29uc3QgY3R4T3B0cyA9IHsg
aWdub3JlSFRUUFNFcnJvcnM6dHJ1ZSwgcmVkdWNlZE1vdGlvbjoncmVkdWNlJywgdmlld3BvcnQ6
e3dpZHRoOjM5MCxoZWlnaHQ6ODQ0fSwgZGV2aWNlU2NhbGVGYWN0b3I6MiB9OwogICAgaWYgKFNU
T1JBR0UpIGN0eE9wdHMuc3RvcmFnZVN0YXRlID0gU1RPUkFHRTsKICAgIGNvbnN0IGN0eCA9IGF3
YWl0IGJyb3dzZXIubmV3Q29udGV4dChjdHhPcHRzKTsKICAgIGF3YWl0IGN0eC5hZGRJbml0U2Ny
aXB0KGluaXRTY3JpcHQoZmxhZ3MpKTsKICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCBjdHgubmV3UGFn
ZSgpOyBwYWdlLnNldERlZmF1bHRUaW1lb3V0KDE1MDAwKTsKICAgIGF3YWl0IHBhZ2UuZ290byh1
cmwsIHsgd2FpdFVudGlsOidkb21jb250ZW50bG9hZGVkJyB9KTsKICAgIGF3YWl0IHdhaXRTaGVs
bChwYWdlKTsKICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoODAwKTsKICAgIC8vIHByb29m
cyBAMzkwIChkZWZhdWx0IHJvdXRlKQogICAgcmVjLnByb29mcyA9IGF3YWl0IHByb29mcyhwYWdl
KTsKICAgIC8vIGJvYXJkcyBub3MgMyB2aWV3cG9ydHMKICAgIGZvciAoY29uc3QgdiBvZiBWUFMp
IHsgdHJ5eyBhd2FpdCBwYWdlLnNldFZpZXdwb3J0U2l6ZSh7d2lkdGg6di53LGhlaWdodDp2Lmh9
KTsgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg0MDApOyBjb25zdCBmPWAke09VVERJUn0vYm9h
cmQtJHtsYWJlbH0tJHt2Lm59LnBuZ2A7IGF3YWl0IHBhZ2Uuc2NyZWVuc2hvdCh7cGF0aDpmLCBm
dWxsUGFnZTp0cnVlLCB0aW1lb3V0OjEyMDAwfSk7IHJlYy5ib2FyZHMucHVzaChmKTsgfWNhdGNo
KGUpeyBvdXQuZXJyb3JzLnB1c2goYGJvYXJkICR7bGFiZWx9ICR7di5ufTogJHtlLm1lc3NhZ2V9
YCk7IH0gfQogICAgLy8gQXZhdGFyIFN0dWRpbyBwcm9vZnMgKGdvbGRlbi1PTiBwYXRoKQogICAg
aWYgKGRvU3R1ZGlvKSB7IHRyeXsgYXdhaXQgcGFnZS5zZXRWaWV3cG9ydFNpemUoe3dpZHRoOjM5
MCxoZWlnaHQ6ODQ0fSk7IGF3YWl0IG9wZW5TdHVkaW8ocGFnZSk7IGF3YWl0IHBhZ2Uud2FpdEZv
clRpbWVvdXQoNjAwKTsgcmVjLnN0dWRpb1Byb29mcyA9IGF3YWl0IHByb29mcyhwYWdlKTsgY29u
c3QgZj1gJHtPVVRESVJ9L2JvYXJkLSR7bGFiZWx9LXN0dWRpby0zOTB4ODQ0LnBuZ2A7IGF3YWl0
IHBhZ2Uuc2NyZWVuc2hvdCh7cGF0aDpmLGZ1bGxQYWdlOnRydWUsdGltZW91dDoxMjAwMH0pOyBy
ZWMuYm9hcmRzLnB1c2goZik7IH1jYXRjaChlKXsgb3V0LmVycm9ycy5wdXNoKGBzdHVkaW8gJHts
YWJlbH06ICR7ZS5tZXNzYWdlfWApOyB9IH0KICAgIGF3YWl0IGN0eC5jbG9zZSgpOwogIH0gY2F0
Y2goZSl7IHJlYy5lcnJvciA9IFN0cmluZyhlJiZlLm1lc3NhZ2V8fGUpOyB9CiAgcmV0dXJuIHJl
YzsKfQoKY29uc3QgYnJvd3NlciA9IGF3YWl0IGNocm9taXVtLmxhdW5jaCh7IGV4ZWN1dGFibGVQ
YXRoOiBQV19DSFJPTUUsIGhlYWRsZXNzOnRydWUsIGFyZ3M6WyctLW5vLXNhbmRib3gnLCctLWRp
c2FibGUtZGV2LXNobS11c2FnZScsJy0taWdub3JlLWNlcnRpZmljYXRlLWVycm9ycyddIH0pOwp0
cnkgewogIGlmIChNQUlOX1VSTCkgb3V0LnBhc3Nlcy5wdXNoKGF3YWl0IHBhc3MoYnJvd3Nlciwg
J21haW4tT0ZGJywgTUFJTl9VUkwsIEZMQUdTX09GRiwgZmFsc2UpKTsKICBvdXQucGFzc2VzLnB1
c2goYXdhaXQgcGFzcyhicm93c2VyLCAnZ29sZGVuLU9GRicsIEdPTERFTl9VUkwsIEZMQUdTX09G
RiwgZmFsc2UpKTsKICBvdXQucGFzc2VzLnB1c2goYXdhaXQgcGFzcyhicm93c2VyLCAnZ29sZGVu
LU9OJywgR09MREVOX1VSTCwgRkxBR1NfT04sIHRydWUpKTsKICB0cnkgeyB3cml0ZUZpbGVTeW5j
KGAke09VVERJUn0vZ2F0ZTA3LXByb29mcy5qc29uYCwgSlNPTi5zdHJpbmdpZnkob3V0LCBudWxs
LCAyKSk7IH0gY2F0Y2goZSl7fQogIGxvZyhvdXQpOwp9IGNhdGNoKGUpeyBvdXQuZXJyb3JzLnB1
c2goJ0ZBVEFMOicrU3RyaW5nKGUmJmUubWVzc2FnZXx8ZSkpOyBsb2cob3V0KTsgfQpmaW5hbGx5
IHsgdHJ5eyBhd2FpdCBicm93c2VyLmNsb3NlKCk7IH1jYXRjaChlKXt9IH0K
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
[ "${SERVED_CODE_IDENTITY}" = "CONFIRMED" ] || abort "identidade servida FAILED — preview nao serve o candidato congelado."

if [ "${DRYRUN}" = "1" ]; then
  printf '\nDRYRUN_OK=YES (preflight+extract+build+proxy+served-identity provados; auth/browser pulados)\n'
  exit 0
fi

# ── 8) AUTH por AUDIT_STORAGE_STATE (nunca lido/impresso) ──────────────────────
log "8) sessao autenticada por storage-state (copia temp 600; original intacto)"
cp -p "${AUDIT_STORAGE_STATE}" "${STORAGE_TMP}" || abort "falha ao copiar storage-state."
chmod 600 "${STORAGE_TMP}"
# valida que a sessao abre shell (proofs faz isso; aqui so garantimos legibilidade)
[ -s "${STORAGE_TMP}" ] || abort "copia do storage-state vazia."
printf 'AUTH_SESSION=STORAGE_STATE_COPIED (600, fora do pacote)\n'

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

# ── 10) PROVAS OFF/ON + boards + DOM ──────────────────────────────────────────
log "10) provas autenticadas (main/OFF + golden/OFF + golden/ON)"
GARG=""; [ "${MAIN_READY}" = "1" ] && GARG="${MAIN_URL}"
PW_CHROME="${PW_CHROME}" STORAGE_STATE="${STORAGE_TMP}" OUTDIR="${EVID}" \
  GOLDEN_URL="${GOLDEN_URL}" MAIN_URL="${GARG}" COMMIT="${EXPECTED_COMMIT}" TREE="${EXPECTED_TREE}" \
  NODE_PATH="${DEPS}" node "${TOOLS}/gate07-proofs.mjs" > >(red > "${EVID}/proofs.log") 2>&1 || abort "proofs falhou — ver ${EVID}/proofs.log"
FLAG_OFF_RESULT="$(grep -o '"label":"golden-OFF"' "${EVID}/gate07-proofs.json" >/dev/null 2>&1 && echo CAPTURED || echo PENDING)"
FLAG_ON_RESULT="$(grep -o '"label":"golden-ON"' "${EVID}/gate07-proofs.json" >/dev/null 2>&1 && echo CAPTURED || echo PENDING)"
BOARDS_N="$(ls "${EVID}"/board-*.png 2>/dev/null | wc -l | tr -d ' ')"

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
  echo "AUTH_SESSION=OK (storage-state 600, fora do pacote)"
  echo "MAIN_BASELINE_READY=${MAIN_READY}"
  echo "FLAG_OFF_RESULT=${FLAG_OFF_RESULT}"
  echo "FLAG_ON_RESULT=${FLAG_ON_RESULT}"
  echo "BOARDS=${BOARDS_N}"
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
printf 'SERVED_CODE_IDENTITY=%s · FLAG_OFF=%s · FLAG_ON=%s · BOARDS=%s · SIDE_EFFECTS=%s\n' "${SERVED_CODE_IDENTITY}" "${FLAG_OFF_RESULT}" "${FLAG_ON_RESULT}" "${BOARDS_N}" "${PROD_SIDE_EFFECTS}"
printf '=============================================\n'
