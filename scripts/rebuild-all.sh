#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# rebuild-all.sh — Recompila todos os targets do DShowDash
#   (42 Vite + 13 esbuild standalone + 85 panels + 26 MFEs
#    + ~3957 módulos individuais TS→JS via esbuild transpile)
# ═══════════════════════════════════════════════════════════════
# Uso:
#   ./scripts/rebuild-all.sh              # rebuild todos os 166 targets
#   ./scripts/rebuild-all.sh --stale      # rebuild apenas targets desatualizados
#   ./scripts/rebuild-all.sh --target X   # rebuild um target específico
#   ./scripts/rebuild-all.sh --dry-run    # mostra o que seria feito
#
# Requer: Node.js, npx, Vite e esbuild em public/react/node_modules
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

ROOT="/var/www/dshowdash"
PUBLIC="$ROOT/public"
VITE_BIN="$PUBLIC/react/node_modules/.bin/vite"
ESBUILD_BIN="$PUBLIC/react/node_modules/.bin/esbuild"
LOTE3BC_CONFIG="$PUBLIC/vite.lote3bc.config.js"
COMPONENTS_CONFIG="$PUBLIC/components/vite.components.config.js"
BOOTSTRAP_CONFIG="$PUBLIC/bootstrap-v2/vite.bundle.config.js"
META_DIR="$PUBLIC/.build-meta"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contadores
TOTAL=0
SUCCESS=0
FAILED=0
SKIPPED=0
FAILED_LIST=""

# ═══ Opções ═══
STALE_ONLY=false
DRY_RUN=false
SINGLE_TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stale)  STALE_ONLY=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --target) SINGLE_TARGET="$2"; shift 2 ;;
    -h|--help)
      echo "Uso: $0 [--stale] [--dry-run] [--target NAME]"
      echo ""
      echo "  --stale     Rebuild apenas bundles com .ts mais novos que o .js"
      echo "  --dry-run   Mostra o que seria feito, sem executar"
      echo "  --target X  Rebuild um target específico (ex: core-runtime, preloader)"
      exit 0
      ;;
    *) echo "Opção desconhecida: $1"; exit 1 ;;
  esac
done

# Verificações
if [ ! -x "$VITE_BIN" ]; then
  echo -e "${RED}ERRO: Vite não encontrado em $VITE_BIN${NC}"
  echo "Execute: cd $PUBLIC/react && npm install"
  exit 1
fi

if [ ! -x "$ESBUILD_BIN" ]; then
  echo -e "${RED}ERRO: esbuild não encontrado em $ESBUILD_BIN${NC}"
  echo "Execute: cd $PUBLIC/react && npm install"
  exit 1
fi

# ═══ Definição dos 42 Targets ═══

# Formato: "tipo:nome:bundle_path:source_dir"
# tipo: lote3bc | component | bootstrap

TARGETS=(
  # ═══ Lote 3B+C (21 targets) ═══
  "lote3bc:core-runtime:core/runtime/dist/runtime.bundle.js:core/runtime"
  "lote3bc:core-kernel:core/kernel/dist/kernel.bundle.js:core/kernel"
  "lote3bc:event-bus:core/js/event-bus/dist/event-bus.bundle.js:core/js/event-bus"
  "lote3bc:asset-loader:core/js/asset-loader/dist/asset-loader.bundle.js:core/js/asset-loader"
  "lote3bc:core-auth:core/auth/dist/auth.bundle.js:core/auth"
  "lote3bc:logger-global:assets/js/core/logger-global/dist/logger-global.bundle.js:assets/js/core/logger-global"
  "lote3bc:telemetry-core:assets/js/core/telemetry-core/dist/telemetry-core.bundle.js:assets/js/core/telemetry-core"
  "lote3bc:config-loader:assets/js/core/config-loader/dist/config-loader.bundle.js:assets/js/core/config-loader"
  "lote3bc:environment-manager:assets/js/core/environment-manager/dist/environment-manager.bundle.js:assets/js/core/environment-manager"
  "lote3bc:global-state:modules/global-state/dist/global-state.bundle.js:modules/global-state"
  "lote3bc:kernel-ui:core/kernel/ui/dist/kernel-ui.bundle.js:core/kernel/ui"
  "lote3bc:enterprise-loader:core/js/enterprise-loader/dist/enterprise-loader.bundle.js:core/js/enterprise-loader"
  "lote3bc:api-client:assets/js/core/api-client/dist/api-client.bundle.js:assets/js/core/api-client"
  "lote3bc:theme-manager:assets/js/core/theme-manager/dist/theme-manager.bundle.js:assets/js/core/theme-manager"
  "lote3bc:theme-tokens-loader:assets/js/core/theme-tokens-loader/dist/theme-tokens-loader.bundle.js:assets/js/core/theme-tokens-loader"
  "lote3bc:header-components:components/header/components/dist/header-components.bundle.js:components/header/components"
  "lote3bc:app-router:app/router/dist/app-router.bundle.js:app/router"
  "lote3bc:ui-orchestrator:core/ui-orchestrator/dist/ui-orchestrator.bundle.js:core/ui-orchestrator"
  "lote3bc:platform-runtime:platform/runtime/dist/platform-runtime.bundle.js:platform/runtime"
  "lote3bc:platform-shell:platform/shell/dist/platform-shell.bundle.js:platform/shell"
  "lote3bc:events-catalog:core/runtime/events/catalog/dist/events-catalog.bundle.js:core/runtime/events/catalog"

  # ═══ Bootstrap (1 target) ═══
  "bootstrap:bootstrap:bootstrap-v2/dist/bootstrap.bundle.js:bootstrap-v2"

  # ═══ Componentes (20 targets) ═══
  "component:preloader:components/preloader/dist/preloader.bundle.js:components/preloader"
  "component:session-manager:components/session-manager/dist/session-manager.bundle.js:components/session-manager"
  "component:error-boundary:components/error-boundary/dist/error-boundary.bundle.js:components/error-boundary"
  "component:context-provider:components/context-provider/dist/context-provider.bundle.js:components/context-provider"
  "component:security:components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js:components/security"
  "component:toast:components/toast/service/dist/toast-service.bundle.js:components/toast"
  # NOTA: _shared-integration e _shared-ui-feedback compartilham o mesmo dist/.
  # _shared-integration usa emptyOutDir:true, então precisa salvar ui-feedback.bundle.js antes.
  # _shared-ui-feedback tem entry proxy (re-export do bundle) — não pode ser rebuild isoladamente.
  # Por isso, _shared-ui-feedback é marcado como "skip" no build (preservado do build anterior).
  "component:_shared-integration:components/_shared/permissions/dist/integration.bundle.js:components/_shared/permissions"
  "component:_shared-ui-feedback:components/_shared/permissions/dist/ui-feedback.bundle.js:components/_shared/permissions"
  "component:feature-flags:components/feature-flags/dist/feature-flags.bundle.js:components/feature-flags"
  "component:login-modal:components/login-modal/dist/login-modal.bundle.js:components/login-modal"
  "component:app-shell:components/app-shell/dist/app-shell.bundle.js:components/app-shell"
  "component:header:components/header/dist/header.bundle.js:components/header"
  "component:layout-manager:components/layout-manager/dist/layout-manager.bundle.js:components/layout-manager"
  "component:sidebar:components/sidebar/dist/sidebar.bundle.js:components/sidebar"
  "component:nav-rail:components/nav-rail/dist/nav-rail.bundle.js:components/nav-rail"
  "component:footer:components/footer/dist/footer.bundle.js:components/footer"
  "component:main:components/main/dist/main.bundle.js:components/main"
  "component:overlay-layer:components/overlay-layer/dist/overlay-layer.bundle.js:components/overlay-layer"
  "component:panel-home:components/panel-home/dist/panel-home.bundle.js:components/panel-home"
  "component:ticker:components/ticker/dist/ticker.bundle.js:components/ticker"
)

# ═══ Standalone esbuild targets (13 targets) ═══
# Módulos com import estático nos bundles de boot — compilados diretamente com esbuild
# Formato: "nome:source_ts:output_js"
ESBUILD_TARGETS=(
  # Componentes (9)
  "accessibility-manager:components/accessibility-manager/index.ts:components/accessibility-manager/index.js"
  "analytics-manager:components/analytics-manager/index.ts:components/analytics-manager/index.js"
  "cache-manager:components/cache-manager/index.ts:components/cache-manager/index.js"
  "modal-manager-global:components/modal-manager-global/index.ts:components/modal-manager-global/index.js"
  "network-monitor:components/network-monitor/index.ts:components/network-monitor/index.js"
  "notification-manager:components/notification-manager/index.ts:components/notification-manager/index.js"
  "performance-monitor:components/performance-monitor/index.ts:components/performance-monitor/index.js"
  "permissions-guard:components/permissions-guard/index.ts:components/permissions-guard/index.js"
  "sw-controller:components/sw-controller/index.ts:components/sw-controller/index.js"
  # Core / Assets (4)
  "theme-manager-entry:assets/js/core/theme-manager/index.ts:assets/js/core/theme-manager/index.js"
  "theme-tokens-loader-entry:assets/js/core/theme-tokens-loader/index.ts:assets/js/core/theme-tokens-loader/index.js"
  "serializer-worker:assets/js/core/logger-global/workers/serializer.worker.ts:assets/js/core/logger-global/workers/serializer.worker.js"
  "runtime-events:core/runtime/events/index.ts:core/runtime/events/index.js"
)

# ═══ Panels esbuild targets (85 targets) ═══
# Painéis lazy-loaded compilados diretamente com esbuild --format=esm
# Formato: "nome:source_ts:output_js"
PANEL_TARGETS=(
  # Registry + _shared (2)
  "panels-registry:components/panels/index.ts:components/panels/index.js"
  "panels-shared:components/panels/_shared/index.ts:components/panels/_shared/index.js"
  # Painéis numerados (19)
  "panel-01:components/panels/panel-01/index.ts:components/panels/panel-01/index.js"
  "panel-02:components/panels/panel-02/index.ts:components/panels/panel-02/index.js"
  "panel-03:components/panels/panel-03/index.ts:components/panels/panel-03/index.js"
  "panel-04:components/panels/panel-04/index.ts:components/panels/panel-04/index.js"
  "panel-05:components/panels/panel-05/index.ts:components/panels/panel-05/index.js"
  "panel-06:components/panels/panel-06/index.ts:components/panels/panel-06/index.js"
  "panel-07:components/panels/panel-07/index.ts:components/panels/panel-07/index.js"
  "panel-08:components/panels/panel-08/index.ts:components/panels/panel-08/index.js"
  "panel-09:components/panels/panel-09/index.ts:components/panels/panel-09/index.js"
  "panel-10:components/panels/panel-10/index.ts:components/panels/panel-10/index.js"
  "panel-11:components/panels/panel-11/index.ts:components/panels/panel-11/index.js"
  "panel-12:components/panels/panel-12/index.ts:components/panels/panel-12/index.js"
  "panel-13:components/panels/panel-13/index.ts:components/panels/panel-13/index.js"
  "panel-14:components/panels/panel-14/index.ts:components/panels/panel-14/index.js"
  "panel-15:components/panels/panel-15/index.ts:components/panels/panel-15/index.js"
  "panel-16:components/panels/panel-16/index.ts:components/panels/panel-16/index.js"
  "panel-17:components/panels/panel-17/index.ts:components/panels/panel-17/index.js"
  "panel-18:components/panels/panel-18/index.ts:components/panels/panel-18/index.js"
  "panel-19:components/panels/panel-19/index.ts:components/panels/panel-19/index.js"
  # Painéis nomeados — admin/management (11)
  "panel-account-security:components/panels/panel-account-security/index.ts:components/panels/panel-account-security/index.js"
  "panel-criacao-botoes:components/panels/panel-criacao-botoes/index.ts:components/panels/panel-criacao-botoes/index.js"
  "panel-feature-flags-admin:components/panels/panel-feature-flags-admin/index.ts:components/panels/panel-feature-flags-admin/index.js"
  "panel-header-admin:components/panels/panel-header-admin/index.ts:components/panels/panel-header-admin/index.js"
  "panel-nav-admin:components/panels/panel-nav-admin/index.ts:components/panels/panel-nav-admin/index.js"
  "panel-navrail-admin:components/panels/panel-navrail-admin/index.ts:components/panels/panel-navrail-admin/index.js"
  "panel-orchestrator:components/panels/panel-orchestrator/index.ts:components/panels/panel-orchestrator/index.js"
  "panel-orchestrator-manager:components/panels/panel-orchestrator-manager/index.ts:components/panels/panel-orchestrator-manager/index.js"
  "panel-permissions-admin:components/panels/panel-permissions-admin/index.ts:components/panels/panel-permissions-admin/index.js"
  "panel-session-admin:components/panels/panel-session-admin/index.ts:components/panels/panel-session-admin/index.js"
  "panel-user-management:components/panels/panel-user-management/index.ts:components/panels/panel-user-management/index.js"
  # Painéis nomeados — dashboards/analytics (7)
  "panel-analytics:components/panels/panel-analytics/index.ts:components/panels/panel-analytics/index.js"
  "panel-audit-trail:components/panels/panel-audit-trail/index.ts:components/panels/panel-audit-trail/index.js"
  "panel-charts:components/panels/panel-charts/index.ts:components/panels/panel-charts/index.js"
  "panel-dashboard:components/panels/panel-dashboard/index.ts:components/panels/panel-dashboard/index.js"
  "panel-health-dashboard:components/panels/panel-health-dashboard/index.ts:components/panels/panel-health-dashboard/index.js"
  "panel-observability:components/panels/panel-observability/index.ts:components/panels/panel-observability/index.js"
  "panel-uarps-monitor:components/panels/panel-uarps-monitor/index.ts:components/panels/panel-uarps-monitor/index.js"
  # Painéis nomeados — funcionalidades (9)
  "panel-cards:components/panels/panel-cards/index.ts:components/panels/panel-cards/index.js"
  "panel-code:components/panels/panel-code/index.ts:components/panels/panel-code/index.js"
  "panel-datahub:components/panels/panel-datahub/index.ts:components/panels/panel-datahub/index.js"
  "panel-enterprise:components/panels/panel-enterprise/index.ts:components/panels/panel-enterprise/index.js"
  "panel-files:components/panels/panel-files/index.ts:components/panels/panel-files/index.js"
  "panel-gestao-paineis:components/panels/panel-gestao-paineis/index.ts:components/panels/panel-gestao-paineis/index.js"
  "panel-location:components/panels/panel-location/index.ts:components/panels/panel-location/index.js"
  "panel-lotties-management:components/panels/panel-lotties-management/index.ts:components/panels/panel-lotties-management/index.js"
  "panel-stub-dev:components/panels/panel-stub-dev/index.ts:components/panels/panel-stub-dev/index.js"
  "panel-status:components/panels/panel-status/index.ts:components/panels/panel-status/index.js"
  # Painéis nomeados — footer (17)
  "panel-footer-activity:components/panels/panel-footer-activity/index.ts:components/panels/panel-footer-activity/index.js"
  "panel-footer-api:components/panels/panel-footer-api/index.ts:components/panels/panel-footer-api/index.js"
  "panel-footer-cpu:components/panels/panel-footer-cpu/index.ts:components/panels/panel-footer-cpu/index.js"
  "panel-footer-database:components/panels/panel-footer-database/index.ts:components/panels/panel-footer-database/index.js"
  "panel-footer-disk:components/panels/panel-footer-disk/index.ts:components/panels/panel-footer-disk/index.js"
  "panel-footer-docs:components/panels/panel-footer-docs/index.ts:components/panels/panel-footer-docs/index.js"
  "panel-footer-file:components/panels/panel-footer-file/index.ts:components/panels/panel-footer-file/index.js"
  "panel-footer-financial:components/panels/panel-footer-financial/index.ts:components/panels/panel-footer-financial/index.js"
  "panel-footer-globe:components/panels/panel-footer-globe/index.ts:components/panels/panel-footer-globe/index.js"
  "panel-footer-memory:components/panels/panel-footer-memory/index.ts:components/panels/panel-footer-memory/index.js"
  "panel-footer-registry:components/panels/panel-footer-registry/index.ts:components/panels/panel-footer-registry/index.js"
  "panel-footer-server:components/panels/panel-footer-server/index.ts:components/panels/panel-footer-server/index.js"
  "panel-footer-settings:components/panels/panel-footer-settings/index.ts:components/panels/panel-footer-settings/index.js"
  "panel-footer-shield:components/panels/panel-footer-shield/index.ts:components/panels/panel-footer-shield/index.js"
  "panel-footer-status:components/panels/panel-footer-status/index.ts:components/panels/panel-footer-status/index.js"
  "panel-footer-support:components/panels/panel-footer-support/index.ts:components/panels/panel-footer-support/index.js"
  "panel-footer-wifi:components/panels/panel-footer-wifi/index.ts:components/panels/panel-footer-wifi/index.js"
  # Painéis nomeados — integrations (10)
  "panel-integration-adwords:components/panels/panel-integration-adwords/index.ts:components/panels/panel-integration-adwords/index.js"
  "panel-integration-alfinete:components/panels/panel-integration-alfinete/index.ts:components/panels/panel-integration-alfinete/index.js"
  "panel-integration-asaas:components/panels/panel-integration-asaas/index.ts:components/panels/panel-integration-asaas/index.js"
  "panel-integration-bling:components/panels/panel-integration-bling/index.ts:components/panels/panel-integration-bling/index.js"
  "panel-integration-calendar:components/panels/panel-integration-calendar/index.ts:components/panels/panel-integration-calendar/index.js"
  "panel-integration-chatgpt:components/panels/panel-integration-chatgpt/index.ts:components/panels/panel-integration-chatgpt/index.js"
  "panel-integration-google-drive:components/panels/panel-integration-google-drive/index.ts:components/panels/panel-integration-google-drive/index.js"
  "panel-integration-loja-integrada:components/panels/panel-integration-loja-integrada/index.ts:components/panels/panel-integration-loja-integrada/index.js"
  "panel-integration-mercado-livre:components/panels/panel-integration-mercado-livre/index.ts:components/panels/panel-integration-mercado-livre/index.js"
  "panel-integration-pipedrive:components/panels/panel-integration-pipedrive/index.ts:components/panels/panel-integration-pipedrive/index.js"
  # Painéis nomeados — status (7)
  "panel-status-currency-btc:components/panels/panel-status-currency-btc/index.ts:components/panels/panel-status-currency-btc/index.js"
  "panel-status-currency-usd-brl:components/panels/panel-status-currency-usd-brl/index.ts:components/panels/panel-status-currency-usd-brl/index.js"
  "panel-status-currency-usd-cny:components/panels/panel-status-currency-usd-cny/index.ts:components/panels/panel-status-currency-usd-cny/index.js"
  "panel-status-email-integration:components/panels/panel-status-email-integration/index.ts:components/panels/panel-status-email-integration/index.js"
  "panel-status-instagram-messenger:components/panels/panel-status-instagram-messenger/index.ts:components/panels/panel-status-instagram-messenger/index.js"
  "panel-status-weather-sp:components/panels/panel-status-weather-sp/index.ts:components/panels/panel-status-weather-sp/index.js"
  "panel-status-wechat-integration:components/panels/panel-status-wechat-integration/index.ts:components/panels/panel-status-wechat-integration/index.js"
  "panel-status-whatsapp-integration:components/panels/panel-status-whatsapp-integration/index.ts:components/panels/panel-status-whatsapp-integration/index.js"
  # Painéis nomeados — user (4)
  "panel-user-notifications:components/panels/panel-user-notifications/index.ts:components/panels/panel-user-notifications/index.js"
  "panel-user-preferences:components/panels/panel-user-preferences/index.ts:components/panels/panel-user-preferences/index.js"
  "panel-user-profile:components/panels/panel-user-profile/index.ts:components/panels/panel-user-profile/index.js"
  "panel-user-sessions:components/panels/panel-user-sessions/index.ts:components/panels/panel-user-sessions/index.js"
)

# ═══ Platform MFE esbuild targets (26 targets) ═══
# Micro-frontends de plataforma compilados diretamente com esbuild --format=esm
# Formato: "nome:source_ts:output_js"
MFE_TARGETS=(
  # Domain MFEs (12)
  "automacoes-mfe:platform/domains/automacoes-mfe/entry.ts:platform/domains/automacoes-mfe/entry.js"
  "clientes-mfe:platform/domains/clientes-mfe/entry.ts:platform/domains/clientes-mfe/entry.js"
  "comercial-mfe:platform/domains/comercial-mfe/entry.ts:platform/domains/comercial-mfe/entry.js"
  "compras-mfe:platform/domains/compras-mfe/entry.ts:platform/domains/compras-mfe/entry.js"
  "dashboard-mfe:platform/domains/dashboard-mfe/entry.ts:platform/domains/dashboard-mfe/entry.js"
  "financeiro-mfe:platform/domains/financeiro-mfe/entry.ts:platform/domains/financeiro-mfe/entry.js"
  "integracoes-mfe:platform/domains/integracoes-mfe/entry.ts:platform/domains/integracoes-mfe/entry.js"
  "juridico-mfe:platform/domains/juridico-mfe/entry.ts:platform/domains/juridico-mfe/entry.js"
  "marketing-mfe:platform/domains/marketing-mfe/entry.ts:platform/domains/marketing-mfe/entry.js"
  "operacional-mfe:platform/domains/operacional-mfe/entry.ts:platform/domains/operacional-mfe/entry.js"
  "produtos-mfe:platform/domains/produtos-mfe/entry.ts:platform/domains/produtos-mfe/entry.js"
  "rh-mfe:platform/domains/rh-mfe/entry.ts:platform/domains/rh-mfe/entry.js"
  # Page MFEs (5)
  "forbidden-mfe:platform/pages/forbidden-mfe/entry.ts:platform/pages/forbidden-mfe/entry.js"
  "login-mfe:platform/pages/login-mfe/entry.ts:platform/pages/login-mfe/entry.js"
  "logout-mfe:platform/pages/logout-mfe/entry.ts:platform/pages/logout-mfe/entry.js"
  "maintenance-mfe:platform/pages/maintenance-mfe/entry.ts:platform/pages/maintenance-mfe/entry.js"
  "notfound-mfe:platform/pages/notfound-mfe/entry.ts:platform/pages/notfound-mfe/entry.js"
  # Panel MFEs (9)
  "platform-panel-01:platform/panels/panel-01/entry.ts:platform/panels/panel-01/entry.js"
  "platform-panel-03:platform/panels/panel-03/entry.ts:platform/panels/panel-03/entry.js"
  "platform-panel-04:platform/panels/panel-04/entry.ts:platform/panels/panel-04/entry.js"
  "platform-panel-05:platform/panels/panel-05/entry.ts:platform/panels/panel-05/entry.js"
  "platform-panel-06:platform/panels/panel-06/entry.ts:platform/panels/panel-06/entry.js"
  "platform-panel-07:platform/panels/panel-07/entry.ts:platform/panels/panel-07/entry.js"
  "platform-panel-08:platform/panels/panel-08/entry.ts:platform/panels/panel-08/entry.js"
  "platform-panel-10:platform/panels/panel-10/entry.ts:platform/panels/panel-10/entry.js"
  "platform-panel-12:platform/panels/panel-12/entry.ts:platform/panels/panel-12/entry.js"
)

# ═══ Funções ═══

build_esbuild_target() {
  local name="$1" source="$2" output="$3"

  TOTAL=$((TOTAL + 1))

  if [ -n "$SINGLE_TARGET" ] && [ "$name" != "$SINGLE_TARGET" ]; then
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  if [ ! -f "$PUBLIC/$source" ]; then
    echo -e "  ${RED}❌ $name${NC} — source not found: $source"
    FAILED=$((FAILED + 1))
    FAILED_LIST="$FAILED_LIST $name"
    return 0
  fi

  if $STALE_ONLY && [ -f "$PUBLIC/$output" ] && [ "$PUBLIC/$output" -nt "$PUBLIC/$source" ]; then
    echo -e "  ${GREEN}⏭  $name${NC} — up-to-date"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  if $DRY_RUN; then
    echo -e "  ${CYAN}🔨 $name${NC} — would transpile (esbuild)"
    return 0
  fi

  echo -ne "  ${YELLOW}⏳ $name${NC} ..."

  local log_file
  log_file=$(mktemp /tmp/esbuild-XXXXXX.log)

  local exit_code=0
  "$ESBUILD_BIN" "$PUBLIC/$source" --outfile="$PUBLIC/$output" --format=esm --target=es2022 --metafile="$META_DIR/$name.meta.json" > "$log_file" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ] && [ -f "$PUBLIC/$output" ]; then
    local size
    size=$(wc -c < "$PUBLIC/$output")
    echo -e "\r  ${GREEN}✅ $name${NC} — $(numfmt --to=iec-i $size B 2>/dev/null || echo "${size}B")"
    SUCCESS=$((SUCCESS + 1))
    rm -f "$log_file"
  else
    echo -e "\r  ${RED}❌ $name${NC} — FALHOU (log: $log_file)"
    FAILED=$((FAILED + 1))
    FAILED_LIST="$FAILED_LIST $name"
  fi
}

is_stale() {
  local bundle="$PUBLIC/$1"
  local src_dir="$PUBLIC/$2"
  if [ ! -f "$bundle" ]; then
    return 0  # missing = needs rebuild
  fi
  local newer
  newer=$(find "$src_dir" -name '*.ts' -newer "$bundle" 2>/dev/null | head -1)
  [ -n "$newer" ]
}

build_target() {
  local type="$1" name="$2" bundle="$3" src_dir="$4"

  TOTAL=$((TOTAL + 1))

  # Filtro por target único
  if [ -n "$SINGLE_TARGET" ] && [ "$name" != "$SINGLE_TARGET" ]; then
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  # Filtro por staleness
  if $STALE_ONLY && ! is_stale "$bundle" "$src_dir"; then
    echo -e "  ${GREEN}⏭  $name${NC} — up-to-date"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  if $DRY_RUN; then
    echo -e "  ${CYAN}🔨 $name${NC} — would rebuild ($type)"
    return 0
  fi

  # _shared-ui-feedback tem entry proxy — skip (preservar bundle existente)
  if [ "$name" = "_shared-ui-feedback" ]; then
    if [ -f "$PUBLIC/$bundle" ]; then
      echo -e "  ${GREEN}⏭  $name${NC} — proxy entry, bundle preservado"
      SKIPPED=$((SKIPPED + 1))
    else
      echo -e "  ${RED}❌ $name${NC} — proxy entry, bundle AUSENTE (requer rebuild manual)"
      FAILED=$((FAILED + 1))
      FAILED_LIST="$FAILED_LIST $name"
    fi
    return 0
  fi

  echo -ne "  ${YELLOW}⏳ $name${NC} ..."

  # _shared-integration apaga o dist/ compartilhado — salvar ui-feedback.bundle.js
  local _saved_ui_feedback=""
  if [ "$name" = "_shared-integration" ]; then
    local _uf_bundle="$PUBLIC/components/_shared/permissions/dist/ui-feedback.bundle.js"
    if [ -f "$_uf_bundle" ]; then
      _saved_ui_feedback=$(mktemp /tmp/ui-feedback-save-XXXXXX.js)
      cp "$_uf_bundle" "$_saved_ui_feedback"
    fi
  fi

  local log_file
  log_file=$(mktemp /tmp/vite-build-XXXXXX.log)

  local exit_code=0
  case "$type" in
    lote3bc)
      TARGET="$name" "$VITE_BIN" build --config "$LOTE3BC_CONFIG" > "$log_file" 2>&1 || exit_code=$?
      ;;
    component)
      COMPONENT="$name" "$VITE_BIN" build --config "$COMPONENTS_CONFIG" > "$log_file" 2>&1 || exit_code=$?
      ;;
    bootstrap)
      "$VITE_BIN" build --config "$BOOTSTRAP_CONFIG" > "$log_file" 2>&1 || exit_code=$?
      ;;
  esac

  # Restaurar ui-feedback.bundle.js se foi salvo antes do build de _shared-integration
  if [ -n "$_saved_ui_feedback" ] && [ -f "$_saved_ui_feedback" ]; then
    cp "$_saved_ui_feedback" "$PUBLIC/components/_shared/permissions/dist/ui-feedback.bundle.js"
    rm -f "$_saved_ui_feedback"
  fi

  if [ $exit_code -eq 0 ] && [ -f "$PUBLIC/$bundle" ]; then
    local size
    size=$(wc -c < "$PUBLIC/$bundle")
    echo -e "\r  ${GREEN}✅ $name${NC} — $(numfmt --to=iec-i $size B 2>/dev/null || echo "${size}B")"
    SUCCESS=$((SUCCESS + 1))
    rm -f "$log_file"
  else
    echo -e "\r  ${RED}❌ $name${NC} — FALHOU (log: $log_file)"
    FAILED=$((FAILED + 1))
    FAILED_LIST="$FAILED_LIST $name"
  fi
}

# ═══ Execução ═══

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DShowDash — Rebuild All Bundles"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
if $STALE_ONLY; then echo "  Modo: --stale (apenas desatualizados)"; fi
if $DRY_RUN; then echo "  Modo: --dry-run (simulação)"; fi
if [ -n "$SINGLE_TARGET" ]; then echo "  Target: $SINGLE_TARGET"; fi
echo "═══════════════════════════════════════════════════════════════"
echo ""

mkdir -p "$META_DIR"

# Ordem de build: esbuild standalone primeiro, depois Vite (core → bootstrap → componentes)
echo -e "${CYAN}▸ Fase 0: Standalone esbuild — imports estáticos de boot (13 targets)${NC}"
for entry in "${ESBUILD_TARGETS[@]}"; do
  IFS=':' read -r name source output <<< "$entry"
  build_esbuild_target "$name" "$source" "$output"
done

echo ""
echo -e "${CYAN}▸ Fase 1: Core bundles (lote3bc — 21 targets)${NC}"
for entry in "${TARGETS[@]}"; do
  IFS=':' read -r type name bundle src_dir <<< "$entry"
  if [ "$type" = "lote3bc" ]; then
    build_target "$type" "$name" "$bundle" "$src_dir"
  fi
done

echo ""
echo -e "${CYAN}▸ Fase 2: Bootstrap (1 target)${NC}"
for entry in "${TARGETS[@]}"; do
  IFS=':' read -r type name bundle src_dir <<< "$entry"
  if [ "$type" = "bootstrap" ]; then
    build_target "$type" "$name" "$bundle" "$src_dir"
  fi
done

echo ""
echo -e "${CYAN}▸ Fase 3: Componentes (20 targets)${NC}"
for entry in "${TARGETS[@]}"; do
  IFS=':' read -r type name bundle src_dir <<< "$entry"
  if [ "$type" = "component" ]; then
    build_target "$type" "$name" "$bundle" "$src_dir"
  fi
done

echo ""
echo -e "${CYAN}▸ Fase 4: Painéis lazy-loaded — esbuild (85 targets)${NC}"
for entry in "${PANEL_TARGETS[@]}"; do
  IFS=':' read -r name source output <<< "$entry"
  build_esbuild_target "$name" "$source" "$output"
done

echo ""
echo -e "${CYAN}▸ Fase 5: Platform MFEs — esbuild (26 targets)${NC}"
for entry in "${MFE_TARGETS[@]}"; do
  IFS=':' read -r name source output <<< "$entry"
  build_esbuild_target "$name" "$source" "$output"
done

echo ""
echo -e "${CYAN}▸ Fase 6: Módulos individuais TS→JS — esbuild transpile${NC}"
# Transpila todos os .ts em public/ que não possuem .js correspondente
# Exclui: node_modules, dist, *.d.ts, *.test.ts
TRANSPILE_COUNT=0
TRANSPILE_OK=0
TRANSPILE_FAIL=0
while IFS= read -r -d '' tsfile; do
  jsfile="${tsfile%.ts}.js"
  if [ ! -f "$jsfile" ] || { $STALE_ONLY && [ "$tsfile" -nt "$jsfile" ]; } || ! $STALE_ONLY; then
    if [ ! -f "$jsfile" ] || ! $STALE_ONLY; then
      [ -f "$jsfile" ] && $STALE_ONLY && [ "$jsfile" -nt "$tsfile" ] && continue
    fi
    TRANSPILE_COUNT=$((TRANSPILE_COUNT + 1))
    TOTAL=$((TOTAL + 1))
    if $DRY_RUN; then
      continue
    fi
    if "$ESBUILD_BIN" "$tsfile" --outfile="$jsfile" --format=esm --target=es2022 --log-level=error 2>/dev/null; then
      chmod 644 "$jsfile"
      TRANSPILE_OK=$((TRANSPILE_OK + 1))
      SUCCESS=$((SUCCESS + 1))
    else
      TRANSPILE_FAIL=$((TRANSPILE_FAIL + 1))
      FAILED=$((FAILED + 1))
      FAILED_LIST="$FAILED_LIST transpile:$(basename "$tsfile")"
    fi
    if [ $((TRANSPILE_COUNT % 100)) -eq 0 ]; then
      echo -e "  ${YELLOW}⏳ Transpiled $TRANSPILE_COUNT modules...${NC}"
    fi
  fi
done < <(find "$PUBLIC" -name '*.ts' -not -name '*.d.ts' -not -name '*.test.ts' -not -path '*/node_modules/*' -not -path '*/dist/*' -print0)
echo -e "  ${GREEN}✅ Transpile: $TRANSPILE_OK ok${NC}, ${RED}$TRANSPILE_FAIL fail${NC} (de $TRANSPILE_COUNT módulos)"

# ═══ Resumo ═══
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESUMO"
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Total:    $TOTAL targets"
echo -e "  ${GREEN}Sucesso:  $SUCCESS${NC}"
echo -e "  ${YELLOW}Skipped:  $SKIPPED${NC}"
echo -e "  ${RED}Falhas:   $FAILED${NC}"
if [ -n "$FAILED_LIST" ]; then
  echo -e "  ${RED}Targets com falha:$FAILED_LIST${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"

# Exit code
if [ $FAILED -gt 0 ]; then
  exit 1
fi
exit 0
