#!/usr/bin/env bash
# =====================================================================
# publicar-sha.sh — CANDIDATO P1-04 (NÃO INSTALADO, NÃO EXECUTADO)
# Publica o Dash a partir de UM SHA do main, num diretório de release
# fora da pasta servida, com troca atômica por symlink.
#
# Uso:  publicar-sha.sh <sha40> [--dry-run | --aplicar]
#       padrão = --dry-run (só imprime o que faria)
#
# Pré-requisitos (ver README): P1-01 concluído (todo código no Git),
# corte inicial feito (migracao-inicial.sh), espelho bare em $REPO,
# pasta compartilhada em $SHARED, credencial do Cloudflare em $CF_ENV.
# Nunca apaga release: retenção é manual (listar-releases.sh).
# =====================================================================
set -euo pipefail

SHA="${1:-}"; MODO="${2:---dry-run}"
BASE="${PUB_BASE:-/srv/dshow-releases/dash}"
REPO="${BASE}/repo.git"                       # espelho bare (root 0700)
RELS="${BASE}/releases"
SHARED="${PUB_SHARED:-/srv/dshow-shared/dash}" # estado que sobrevive à troca
SERVIDO="${PUB_SERVIDO:-/var/www/dshowdash}"   # symlink -> release ativa
HIST="${BASE}/historico.log"
CF_ENV="${PUB_CF_ENV:-/etc/dshow-deploy/cloudflare.env}"  # 0600 root; chaves CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
# Build SEM privilégio (adendo 02/11, §4.3/§6/§7.1): usuário dedicado, sem grupo www-data, sem acesso
# a $SHARED (segredos/estado). Criação do usuário = decisão do Jhony (Portão 2). Ausente → aborta.
BUILD_USER="${PUB_BUILD_USER:-dshow-build}"
REPO_ESPERADO="Jhony-Avila/dshowdash"
BRANCH="main"
# caminhos da release que apontam para $SHARED (estado/segredo; nunca no Git)
# Etapa 6: lista ÚNICA do estado (a mesma do corte) — estado-compartilhado.sh ao lado ou instalado em /usr/local/lib/dshow/
for _e in "${DSHOW_ESTADO_LIB:-}" "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/estado-compartilhado.sh" /usr/local/lib/dshow/estado-compartilhado.sh; do
  [ -n "${_e}" ] && [ -f "${_e}" ] && { source "${_e}"; break; }
done
declare -p ESTADO >/dev/null 2>&1 || { echo "recusado: estado-compartilhado.sh não encontrado"; exit 2; }
COMPARTILHADOS=("${ESTADO[@]}")

DRY=1; [ "${MODO}" = "--aplicar" ] && DRY=0
[ "${MODO}" = "--dry-run" ] || [ "${MODO}" = "--aplicar" ] || { echo "modo inválido: ${MODO}"; exit 2; }
[[ "${SHA}" =~ ^[0-9a-f]{40}$ ]] || { echo "uso: $0 <sha40> [--dry-run|--aplicar]"; exit 2; }
[ "$(id -u)" -eq 0 ] || { echo "precisa de root"; exit 2; }

run() { if [ "${DRY}" -eq 1 ]; then printf '[dry-run] %s\n' "$*"; else "$@"; fi; }
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }
falha() { log "FALHA: $*"; exit 1; }

# ── 0. lock ÚNICO de publicação (root-only, em /run) ────────────────
umask 077
# LOCK ÚNICO DE PUBLICAÇÃO (P1-04a, Etapa 5): biblioteca ao lado (no repositório: ../lock-publicacao.sh; instalado:
# /usr/local/lib/dshow/lock-publicacao.sh). Sem ela, recusa (falha fechada).
for _l in "${DSHOW_PUB_LOCK_LIB:-}" "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lock-publicacao.sh" /usr/local/lib/dshow/lock-publicacao.sh; do
  [ -n "${_l}" ] && [ -f "${_l}" ] && { source "${_l}"; break; }
done
declare -F dshow_pub_lock >/dev/null || { echo "recusado: lock-publicacao.sh não encontrado"; exit 2; }
dshow_pub_lock publicar-sha

# ── 1. o SHA existe e é do main remoto ───────────────────────────────
log "1/8 conferindo ${SHA} contra ${REPO_ESPERADO}@${BRANCH}"
run git -C "${REPO}" fetch --prune origin "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"
if [ "${DRY}" -eq 0 ]; then
  git -C "${REPO}" cat-file -e "${SHA}^{commit}" || falha "SHA inexistente no espelho"
  git -C "${REPO}" merge-base --is-ancestor "${SHA}" "origin/${BRANCH}" || falha "SHA não pertence a ${BRANCH}"
fi

CARIMBO="$(date +%Y%m%d-%H%M%S)"
REL="${RELS}/${SHA:0:12}-${CARIMBO}"
TMP="${RELS}/.montando-${SHA:0:12}-${CARIMBO}"

# ── 2. materializa a árvore FORA da pasta servida ────────────────────
log "2/8 materializando em ${TMP}"
run mkdir -p "${TMP}"
if [ "${DRY}" -eq 0 ]; then
  # Etapa 3 (ensaio): com umask 077 a release saía 600/700 e o servidor web não lia nada → extrair com 022
  git -C "${REPO}" archive --format=tar "${SHA}" | (umask 022; tar --no-same-owner --no-same-permissions -x -C "${TMP}")
  printf '%s\n' "${SHA}" > "${TMP}/RELEASE_SHA"
else
  echo "[dry-run] git -C ${REPO} archive ${SHA} | tar -x -C ${TMP}"
fi

# ── 3. build FORA da pasta servida, como $BUILD_USER, ANTES de ligar segredos/estado ──
log "3/8 build em ${TMP} como ${BUILD_USER} (sem .env/config/storage na montagem)"
[ "${DRY}" -eq 0 ] && { id "${BUILD_USER}" >/dev/null 2>&1 || falha "usuário de build ${BUILD_USER} inexistente (Portão 2)"; }
[ "${DRY}" -eq 0 ] && { id -nG "${BUILD_USER}" | tr ' ' '\n' | grep -qx www-data && falha "${BUILD_USER} não pode estar no grupo www-data"; }
run chown -h "${BUILD_USER}:${BUILD_USER}" "${TMP}"
run find "${TMP}" -xdev -exec chown -h "${BUILD_USER}:${BUILD_USER}" {} +   # só a montagem recém-extraída (mapa = git archive do SHA)
B() { run runuser -u "${BUILD_USER}" -- env -i HOME="/home/${BUILD_USER}" PATH=/usr/local/bin:/usr/bin:/bin "$@"; }
for PAINEL in public/components/panels/panel-avatar-studio public/components/panels/panel-dashboard public/components/footer; do
  [ "${DRY}" -eq 0 ] && [ ! -f "${TMP}/${PAINEL}/package.json" ] && continue
  B bash -c "cd '${TMP}/${PAINEL}' && npm ci --no-audit --no-fund && npx vite build"
done
BBAK="${RELS}/.build-bak-${SHA:0:12}-${CARIMBO}"; run mkdir -m 0700 "${BBAK}"; run chown "${BUILD_USER}:${BUILD_USER}" "${BBAK}"
B env DEPLOY_RAIZ="${TMP}" DEPLOY_BACKUP="${BBAK}" CARIMBO="${CARIMBO}" bash "${TMP}/scripts/deploy/build-lote-main.sh"
B node "${TMP}/scripts/deploy/smoke-dist.mjs"
# devolve a montagem ao root (somente leitura para o runtime) antes de ligar estado e publicar
run find "${TMP}" -xdev -exec chown -h root:root {} +
# preserva chunks com hash da release anterior (clientes com a página antiga aberta), sem sobrescrever
ANT="$(readlink -f "${SERVIDO}" 2>/dev/null || true)"
if [ -n "${ANT}" ] && [ -d "${ANT}" ]; then
  while IFS= read -r -d '' d; do rel="${d#${ANT}/}"; run mkdir -p "${TMP}/${rel}"; run cp -an "${d}/." "${TMP}/${rel}/"; done \
    < <(find "${ANT}/public" -xdev -type d -path '*/dist/assets' -print0 2>/dev/null)
fi

# ── 4. liga o estado compartilhado (depois do build) ───────────────────────────────────
log "4/8 symlinks para ${SHARED}"
for p in "${COMPARTILHADOS[@]}"; do
  [ "${DRY}" -eq 0 ] && [ ! -e "${SHARED}/${p}" ] && falha "compartilhado ausente: ${SHARED}/${p}"
  [ "${DRY}" -eq 0 ] && [ -e "${TMP}/${p}" ] && ! [ -L "${TMP}/${p}" ] && falha "${p} veio no Git (deveria estar ignorado)"
  run mkdir -p "$(dirname "${TMP}/${p}")"
  run ln -sfn "${SHARED}/${p}" "${TMP}/${p}"
done
# symlinks hoje absolutos dentro da árvore viram relativos (public/api, telemetry)
run ln -sfn "../api" "${TMP}/public/api"

# ── 5. validações antes de servir ────────────────────────────────────
log "5/8 php -l e gate de peso"
if [ "${DRY}" -eq 0 ]; then
  ERR=0
  while IFS= read -r -d '' f; do php -l "$f" >/dev/null 2>&1 || { echo "✗ $f"; ERR=$((ERR+1)); }; done \
    < <(find "${TMP}/api" -name '*.php' -type f -print0)
  [ "${ERR}" -eq 0 ] || falha "${ERR} arquivo(s) PHP com erro"
fi
run mv -T "${TMP}" "${REL}"

# ── 6. troca atômica ─────────────────────────────────────────────────
ANTES="$( [ -L "${SERVIDO}" ] && readlink -f "${SERVIDO}" || echo - )"
log "6/8 troca: ${ANTES} -> ${REL}"
run ln -sfn "${REL}" "${SERVIDO}.novo"
run mv -T "${SERVIDO}.novo" "${SERVIDO}"
# opcache/realpath_cache: o vhost passa \$realpath_root, mas há ~50 require
# com caminho absoluto pelo symlink; reload gracioso zera os dois caches.
run systemctl reload php8.3-fpm
run nginx -s reload   # zera open_file_cache (30 s) dos estáticos

# ── 7. smoke na ORIGEM (sem passar pelo Cloudflare) ──────────────────
log "7/8 smoke na origem"
smoke() {
  local u c
  for u in / /api/health /api/news/get_ticker_data.php; do
    c=$(curl -sS -o /dev/null -m 20 -w '%{http_code}' --resolve dshowdash.com.br:443:127.0.0.1 "https://dshowdash.com.br${u}" || echo 000)
    [ "$c" = 200 ] || { echo "smoke ${u} = ${c}"; return 1; }
  done
}
if [ "${DRY}" -eq 0 ]; then
  if ! smoke; then
    log "smoke falhou — rollback para ${ANTES}"
    ln -sfn "${ANTES}" "${SERVIDO}.novo" && mv -T "${SERVIDO}.novo" "${SERVIDO}"
    systemctl reload php8.3-fpm; nginx -s reload
    printf '%s\tFALHOU-SMOKE\t%s\t%s\n' "$(date '+%F %T')" "${SHA}" "${REL}" >> "${HIST}"
    falha "smoke na origem"
  fi
else
  echo "[dry-run] curl --resolve dshowdash.com.br:443:127.0.0.1 / /api/health /api/news/get_ticker_data.php (200 em todos; senão rollback)"
fi

# ── 8. purge do Cloudflare (só entradas sem hash) ────────────────────
log "8/8 purge Cloudflare"
# adendo 02/11 (§6): purge automático só depois de revisão explícita do runbook → desligado por padrão
if [ "${PUB_PURGE:-0}" != 1 ]; then
  log "purge NÃO executado (PUB_PURGE=0): seguir o runbook de purge vigente"
elif [ "${DRY}" -eq 0 ]; then
  [ -r "${CF_ENV}" ] || falha "sem ${CF_ENV} (publicado SEM purge — rodar purge manual)"
  # shellcheck disable=SC1090
  set +x; . "${CF_ENV}"
  curl -sS -m 30 -o /dev/null -w '%{http_code}\n' -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H 'Content-Type: application/json' \
    --data '{"files":["https://dshowdash.com.br/","https://dshowdash.com.br/index.html","https://dshowdash.com.br/sw.js","https://dshowdash.com.br/manifest.webmanifest","https://www.dshowdash.com.br/"]}'
  unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ZONE_ID
else
  echo "[dry-run] POST purge_cache {files:[/, /index.html, /sw.js, /manifest.webmanifest]} (token lido de ${CF_ENV}, nunca impresso)"
fi

run bash -c "printf '%s\tOK\t%s\t%s\t%s\n' '$(date '+%F %T')' '${SHA}' '${REL}' '${ANTES}' >> '${HIST}'"
log "PUBLICAR_SHA_OK ${SHA} -> ${REL} (anterior ${ANTES}; rollback: rollback.sh)"
