#!/usr/bin/env bash
# =====================================================================
# scripts/deploy/build-lote-main.sh — BUILD DO LOTE `main` (decisão #89) com as
# proteções do deploy-as5: backup do bundle vivo ANTES, build via a config
# versionada (public/components/vite.components.config.js, COMPONENT=main —
# inlina router/registry e router/state por keepInternal), gates (rc, tamanho
# mínimo e máximo versionado em pesos-esperados.json, node --check, sanidade do
# registro de rotas inlinado) e AUTO-RESTAURAÇÃO do bundle anterior se qualquer
# gate falhar (o deploy aborta, produção fica como estava). Idempotente.
# Chamado pelo deploy-as5.sh (etapa 5b); pode rodar sozinho ou em ensaio:
#   DEPLOY_RAIZ=/root/x/wt DEPLOY_BACKUP=/backup/ensaio bash scripts/deploy/build-lote-main.sh
# Por que existe: o bundle main servido estava congelado desde 2026-07-30 (não
# entrava no deploy); mudanças de FONTE no registro de rotas (aliases, rotas
# canônicas, retargets) não chegavam ao runtime. Rollback: bundle anterior em
# ${BACKUP}/main-bundle-<carimbo>.js (cp de volta) ou o tar do deploy-as5.
# =====================================================================
set -euo pipefail
RAIZ="${DEPLOY_RAIZ:-/var/www/dshowdash}"
BACKUP="${DEPLOY_BACKUP:-/backup}"
CARIMBO="${CARIMBO:-$(date +%Y%m%d-%H%M%S)}"
VITE="${RAIZ}/public/react/node_modules/.bin/vite"
CFG="${RAIZ}/public/components/vite.components.config.js"
DIST="${RAIZ}/public/components/main/dist"
BUNDLE="${DIST}/main.bundle.js"
PESOS="${RAIZ}/scripts/deploy/pesos-esperados.json"
MIN_KB=500

falha() { echo "❌ lote main: $1"; exit 1; }
[ -x "${VITE}" ] || falha "vite ausente em ${VITE} (toolchain de public/react)"
[ -s "${CFG}" ] || falha "config ausente: ${CFG}"
mkdir -p "${BACKUP}" "${DIST}"

# 1) backup fiel do bundle vivo (se houver)
ANTES_KB=0; ANTES_SHA="(sem bundle anterior)"; BKP=""
if [ -s "${BUNDLE}" ]; then
  BKP="${BACKUP}/main-bundle-${CARIMBO}.js"
  cp -p "${BUNDLE}" "${BKP}"
  ANTES_KB=$(( $(stat -c %s "${BUNDLE}") / 1024 )); ANTES_SHA=$(sha256sum "${BUNDLE}" | cut -c1-16)
  echo "• backup do bundle vivo: ${BKP} (${ANTES_KB}KB sha ${ANTES_SHA})"
fi
restaurar() { if [ -n "${BKP}" ] && [ -s "${BKP}" ]; then cp -p "${BKP}" "${BUNDLE}"; echo "↩ bundle anterior restaurado de ${BKP}"; fi; }

# 2) build (ROOT = public/ desta raiz; em produção é o padrão da config)
echo "— build: lote main (COMPONENT=main, ROOT=${RAIZ}/public)"
if ! ( cd "${RAIZ}/public/components" && VITE_COMPONENTS_ROOT="${RAIZ}/public" COMPONENT=main "${VITE}" build --config "${CFG}" --logLevel warn ); then
  restaurar; falha "vite build retornou erro"
fi

# 3) gates
[ -s "${BUNDLE}" ] || { restaurar; falha "main.bundle.js ausente/vazio após o build"; }
KB=$(( $(stat -c %s "${BUNDLE}") / 1024 ))
MAX_KB=$(php -r '$j=json_decode(file_get_contents($argv[1]),true); echo (int)($j["components-main"]["main.bundle"] ?? 0);' "${PESOS}" 2>/dev/null || echo 0)
[ "${MAX_KB}" -gt 0 ] || { restaurar; falha "pesos-esperados.json sem components-main.main.bundle"; }
[ "${KB}" -ge "${MIN_KB}" ] || { restaurar; falha "bundle suspeito: ${KB}KB < mínimo ${MIN_KB}KB"; }
[ "${KB}" -le "${MAX_KB}" ] || { restaurar; falha "gate de peso: main.bundle.js com ${KB}KB (máx ${MAX_KB}KB) — se intencional, atualize pesos-esperados.json no commit da feature"; }
node --check "${BUNDLE}" || { restaurar; falha "main.bundle.js não passa em node --check"; }
for S in '"/panel-dashboard"' '"/preferencias"' 'keepInternal-check:/components/router/registry' ; do
  case "${S}" in keepInternal-check:*) continue;; esac
  grep -q -- "${S}" "${BUNDLE}" || { restaurar; falha "sanidade: registro de rotas não inlinado (${S} ausente)"; }
done
DEPOIS_SHA=$(sha256sum "${BUNDLE}" | cut -c1-16)
echo "✓ lote main: ${KB}KB (min ${MIN_KB} · máx ${MAX_KB}) · sha ${DEPOIS_SHA} · anterior ${ANTES_KB}KB ${ANTES_SHA}"
[ -n "${BKP}" ] && echo "  ROLLBACK do lote main: cp -p ${BKP} ${BUNDLE}"
exit 0
