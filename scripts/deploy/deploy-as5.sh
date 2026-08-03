#!/usr/bin/env bash
# =====================================================================
# scripts/deploy/deploy-as5.sh — DEPLOY CONSOLIDADO AS5 (padrão Enterprise)
# @version 1.0.0  @created 2026-08-02
#
# PRINCÍPIOS (decisões do Jhony, 2026-08-02):
#   • idempotente: rodar 2× produz o mesmo estado final;
#   • && estrito via `set -e` + validação após CADA etapa;
#   • backup automático ANTES de qualquer alteração (→ /backup);
#   • nada de migração automática de banco (runbook separado, com root);
#   • tudo novo fica atrás de feature flag (as5.* — OFF por padrão);
#   • logs completos em /backup/deploy-logs/;
#   • falha em qualquer etapa = aborta com resumo do ponto exato.
#
# USO (no servidor, na pasta do projeto):
#   bash scripts/deploy/deploy-as5.sh
# =====================================================================
set -euo pipefail

# Overrides por env = testabilidade (ensaio local) + reuso em outros hosts.
# Em produção NADA precisa ser passado: os padrões são os do servidor.
RAIZ="${DEPLOY_RAIZ:-/var/www/dshowdash}"
BACKUP="${DEPLOY_BACKUP:-/backup}"
CARIMBO="$(date +%Y%m%d-%H%M%S)"
LOG_DIR="${BACKUP}/deploy-logs"
LOG="${LOG_DIR}/deploy-as5-${CARIMBO}.log"
BRANCH_ESPERADA="${DEPLOY_BRANCH:-feat/pipedrive-modulo-completo}"

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG}") 2>&1

etapa() { echo ""; echo "━━━━ [$(date +%H:%M:%S)] $1 ━━━━"; }
falha() { echo ""; echo "❌ FALHA na etapa: $1"; echo "Log completo: ${LOG}"; exit 1; }

# ── 0. PRÉ-VOO ────────────────────────────────────────────────────────
etapa "0/9 Pré-voo (ambiente, permissões, espaço)"
cd "${RAIZ}" || falha "diretório ${RAIZ} inexistente"
command -v git >/dev/null || falha "git ausente"
command -v node >/dev/null || falha "node ausente"
command -v npm >/dev/null || falha "npm ausente"
command -v php >/dev/null || falha "php ausente"
[ -w "${BACKUP}" ] || falha "sem permissão de escrita em ${BACKUP}"
LIVRE_MB=$(df -Pm "${RAIZ}" | awk 'NR==2{print $4}')
[ "${LIVRE_MB}" -gt 1024 ] || falha "menos de 1GB livre (${LIVRE_MB}MB)"
BRANCH_ATUAL=$(git --no-pager rev-parse --abbrev-ref HEAD)
[ "${BRANCH_ATUAL}" = "${BRANCH_ESPERADA}" ] || falha "branch atual é ${BRANCH_ATUAL}, esperada ${BRANCH_ESPERADA}"
SUJO=$(git status --porcelain | head -5)
[ -z "${SUJO}" ] || falha "working tree com mudanças locais (commite ou mova p/ ${BACKUP}):
${SUJO}"
echo "✓ ambiente ok · branch ${BRANCH_ATUAL} · ${LIVRE_MB}MB livres"

# ── 1. BACKUP COMPLETO (antes de QUALQUER alteração) ──────────────────
etapa "1/9 Backup (código + banco) → ${BACKUP}"
COMMIT_ANTES=$(git --no-pager rev-parse --short HEAD)
echo "${COMMIT_ANTES}" > "${BACKUP}/pre-as5-${CARIMBO}.commit"
tar -czf "${BACKUP}/pre-as5-${CARIMBO}-dist.tar.gz" \
  --ignore-failed-read \
  public/components/panels/panel-avatar-studio/dist \
  public/components/panels/panel-dashboard/dist \
  public/components/footer/dist \
  public/index.html api/avatar 2>/dev/null || falha "tar do backup de código"
DB_NOME=$(php -r '$e=parse_ini_file("config/.env"); echo $e["DB_NAME"] ?? $e["DB_DATABASE"] ?? "";' 2>/dev/null || true)
DB_USER=$(php -r '$e=parse_ini_file("config/.env"); echo $e["DB_USER"] ?? $e["DB_USERNAME"] ?? "";' 2>/dev/null || true)
DB_PASS=$(php -r '$e=parse_ini_file("config/.env"); echo $e["DB_PASS"] ?? $e["DB_PASSWORD"] ?? "";' 2>/dev/null || true)
if [ -n "${DB_NOME}" ] && [ -n "${DB_USER}" ]; then
  MYSQL_PWD="${DB_PASS}" mysqldump -u "${DB_USER}" --single-transaction --routines \
    "${DB_NOME}" 2>/dev/null | gzip > "${BACKUP}/db-pre-as5-${CARIMBO}.sql.gz" \
    || falha "mysqldump (backup do banco)"
  DUMP_KB=$(du -k "${BACKUP}/db-pre-as5-${CARIMBO}.sql.gz" | cut -f1)
  [ "${DUMP_KB}" -gt 1 ] || falha "dump do banco suspeito (${DUMP_KB}KB)"
  echo "✓ banco: db-pre-as5-${CARIMBO}.sql.gz (${DUMP_KB}KB)"
else
  echo "⚠ credenciais do banco não lidas do config/.env — backup de banco PULADO (código segue)"
fi
echo "✓ código: pre-as5-${CARIMBO}-dist.tar.gz (rollback: git reset --hard ${COMMIT_ANTES} + tar -xzf)"

# ── 2. ATUALIZAÇÃO DO CÓDIGO ──────────────────────────────────────────
etapa "2/9 Merge da main (fast-forward do trabalho AS5)"
git fetch origin || falha "git fetch"
git --no-pager log --oneline HEAD..origin/main | head -30 || true
git merge origin/main --no-edit || falha "merge de origin/main (resolva e re-rode — o script é idempotente)"
COMMIT_DEPOIS=$(git --no-pager rev-parse --short HEAD)
echo "✓ ${COMMIT_ANTES} → ${COMMIT_DEPOIS}"

# ── 3. VARREDURA (regra da casa: nada se apaga, tudo vai p/ /backup) ──
etapa "3/9 Varredura de artefatos soltos → ${BACKUP}"
# NUNCA mover arquivo referenciado pelo index.html (lição do deploy de
# 2026-08-03: a varredura cega moveu bundles do shell → tela branca)
MOVIDOS=0
while IFS= read -r f; do
  NOME=$(basename "$f")
  if grep -q "${NOME}" public/index.html; then
    echo "• preservado (referenciado no index.html): ${NOME}"
  else
    mkdir -p "${BACKUP}/varredura-${CARIMBO}"
    mv "$f" "${BACKUP}/varredura-${CARIMBO}/"
    echo "• movido p/ backup: ${NOME}"
    MOVIDOS=$((MOVIDOS+1))
  fi
done < <(find public -maxdepth 1 -name "*.js" -type f | head -20)
echo "✓ varredura: ${MOVIDOS} movido(s)"

# ── 4. VALIDAÇÃO PHP (antes de servir qualquer coisa nova) ────────────
etapa "4/9 php -l em todas as APIs do avatar"
ERROS_PHP=0
while IFS= read -r f; do
  php -l "$f" >/dev/null 2>&1 || { echo "✗ ${f}"; ERROS_PHP=$((ERROS_PHP+1)); }
done < <(find api/avatar -name "*.php" -type f)
[ "${ERROS_PHP}" -eq 0 ] || falha "${ERROS_PHP} arquivo(s) PHP com erro de sintaxe"
echo "✓ $(find api/avatar -name '*.php' | wc -l) arquivos PHP ok"

# ── 5. BUILDS (avatar + dashboard + footer) ───────────────────────────
etapa "5/9 Builds de produção"
for PAINEL in public/components/panels/panel-avatar-studio public/components/panels/panel-dashboard; do
  echo "— build: ${PAINEL}"
  ( cd "${RAIZ}/${PAINEL}" \
    && if [ package-lock.json -nt node_modules/.package-lock.json ] 2>/dev/null; then npm install --no-audit --no-fund; fi \
    && npx vite build ) || falha "build de ${PAINEL}"
done
if [ -f public/components/footer/package.json ]; then
  echo "— build: footer (destrava a fase 2 do rodapé §35)"
  ( cd "${RAIZ}/public/components/footer" \
    && if [ package-lock.json -nt node_modules/.package-lock.json ] 2>/dev/null; then npm install --no-audit --no-fund; fi \
    && npm run build 2>/dev/null || npx vite build ) || echo "⚠ build do footer falhou — bundle atual preservado (fase 1 CSS segue ativa)"
fi

# ── 6. VALIDAÇÃO DE BUNDLES ──────────────────────────────────────────
etapa "6/9 Integridade dos bundles"
for PAINEL in panel-avatar-studio panel-dashboard; do
  MAN="public/components/panels/${PAINEL}/dist/.vite/manifest.json"
  [ -s "${MAN}" ] || MAN="public/components/panels/${PAINEL}/dist/manifest.json"
  [ -s "${MAN}" ] || falha "manifest ausente em ${PAINEL}"
  ENTRADA=$(php -r '$m=json_decode(file_get_contents($argv[1]),true); foreach($m as $r){ if(!empty($r["isEntry"])){ echo $r["file"]; exit; } }' "${MAN}")
  [ -n "${ENTRADA}" ] || falha "entry não encontrada no manifest de ${PAINEL}"
  [ -s "public/components/panels/${PAINEL}/dist/${ENTRADA}" ] || falha "bundle ${ENTRADA} vazio/ausente (${PAINEL})"
  echo "✓ ${PAINEL}: ${ENTRADA} ($(du -k "public/components/panels/${PAINEL}/dist/${ENTRADA}" | cut -f1)KB)"
done

# ── 7. VALIDAÇÃO DE BANCO (diagnóstico — NUNCA aplica nada) ───────────
etapa "7/9 Diagnóstico do banco (runner --checar; migração é runbook à parte)"
php scripts/avatar/aplicar-migracoes.php --checar || echo "⚠ diagnóstico apontou pendências — ver RUNBOOK-BANCO.md (passo root)"

# ── 8. VALIDAÇÃO DE ASSETS + IA ──────────────────────────────────────
etapa "8/9 Assets e diagnóstico da IA (sem segredos)"
N_ASSETS=$(find public/assets/avatars -type f 2>/dev/null | wc -l)
echo "assets de avatar no disco: ${N_ASSETS}"
[ "${N_ASSETS}" -ge 1 ] || echo "⚠ pasta de assets vazia — conferir mounts"
php -r 'require "api/avatar/ia/FabricaIA.php"; $d = FabricaIA::diagnostico(); echo "IA: provedor={$d["provedor"]} disponivel=" . ($d["disponivel"] ? "SIM" : "nao") . " motivo=" . ($d["motivo_indisponivel"] ?? "-") . PHP_EOL;'

# ── 9. PERMISSÕES + RESUMO ────────────────────────────────────────────
etapa "9/9 Permissões e resumo"
DONO=$(stat -c '%U:%G' public/index.html)
chown -R "${DONO}" public/components/panels/panel-avatar-studio/dist \
  public/components/panels/panel-dashboard/dist 2>/dev/null || echo "⚠ chown pulado (rode com sudo se os arquivos ficarem com dono errado — dono esperado: ${DONO})"
echo ""
echo "══════════════════════════════════════════════════"
echo "  DEPLOY_AS5_OK"
echo "  commit: ${COMMIT_ANTES} → ${COMMIT_DEPOIS}"
echo "  backup: ${BACKUP}/pre-as5-${CARIMBO}-dist.tar.gz"
echo "  log:    ${LOG}"
echo "  ROLLBACK: git reset --hard ${COMMIT_ANTES} && tar -xzf ${BACKUP}/pre-as5-${CARIMBO}-dist.tar.gz -C ${RAIZ}"
echo "  Flags as5.* seguem OFF — ligue no navegador p/ validar:"
echo "  localStorage.setItem('dshow.avst.flags.v1','{\"as5.novo_shell\":true}')"
echo "══════════════════════════════════════════════════"
