// Bootstrap Direct Imports — Lote 5 Frente B + D (Corrigido Lote 11)
// Replaces re-export index.js paths with direct bundle paths in the bootstrap bundle.
// Each replacement eliminates 1 HTTP request (the re-export middleman).
var fs = require('fs');

var file = process.argv[2];
if (!file) { console.error('Usage: node bootstrap-direct-imports.js <bootstrap-bundle>'); process.exit(1); }

var code = fs.readFileSync(file, 'utf8');
var original = code;
var count = 0;

// Frente B — Dynamic imports: index.js re-exports → direct bundle paths
var dynamicReplacements = [
  ['"/components/preloader/index.js"', '"/components/preloader/dist/preloader.bundle.js"'],
  ['"/components/error-boundary/index.js"', '"/components/error-boundary/dist/error-boundary.bundle.js"'],
  ['"/components/context-provider/index.js"', '"/components/context-provider/dist/context-provider.bundle.js"'],
  ['"/components/feature-flags/index.js"', '"/components/feature-flags/dist/feature-flags.bundle.js"'],
  ['"/components/login-modal/index.js"', '"/components/login-modal/dist/login-modal.bundle.js"'],
  ['"/components/layout-manager/index.js"', '"/components/layout-manager/dist/layout-manager.bundle.js"'],
  ['"/components/app-shell/index.js"', '"/components/app-shell/dist/app-shell.bundle.js"'],
  ['"/components/header/index.js"', '"/components/header/dist/header.bundle.js"'],
  ['"/components/toast/service/index.js"', '"/components/toast/service/dist/toast-service.bundle.js"'],
  ['"/components/security/csrf-token-manager/index.js"', '"/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js"'],
  ['"/core/js/event-bus/index.js"', '"/core/js/event-bus/dist/event-bus.bundle.js"'],
  ['"/core/js/asset-loader/index.js"', '"/core/js/asset-loader/dist/asset-loader.bundle.js"'],
  ['"/modules/global-state/index.js"', '"/modules/global-state/dist/global-state.bundle.js"'],
  ['"/assets/js/core/logger-global/index.js"', '"/assets/js/core/logger-global/dist/logger-global.bundle.js"'],
  ['"/assets/js/core/config-loader/index.js"', '"/assets/js/core/config-loader/dist/config-loader.bundle.js"'],
  ['"/assets/js/core/environment-manager/index.js"', '"/assets/js/core/environment-manager/dist/environment-manager.bundle.js"'],
  ['"/assets/js/core/telemetry-core/index.js"', '"/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js"'],
  // Static import
  ['"/components/session-manager/index.js"', '"/components/session-manager/dist/session-manager.bundle.js"'],
  // Lote 6 — Sidebar
  ['"/components/sidebar/index.js"', '"/components/sidebar/dist/sidebar.bundle.js"'],
  // Lote 7 — Nav-Rail
  ['"/components/nav-rail/index.js"', '"/components/nav-rail/dist/nav-rail.bundle.js"'],
  // Lote 7 — Footer
  ['"/components/footer/index.js"', '"/components/footer/dist/footer.bundle.js"'],
  // Lote 8 — Router
  ['"/app/router/index.js"', '"/app/router/dist/app-router.bundle.js"'],
  // Lote 9 — Main (apenas index.js e container-main/index.js — NÃO redirecionar sub-módulos)
  ['"/components/main/index.js"', '"/components/main/dist/main.bundle.js"'],
  ['"/components/main/ui/container-main/index.js"', '"/components/main/dist/main.bundle.js"'],
  // NOTA: features-toolbar, features-integration e toolbar-wiring NÃO são redirecionados
  // para main.bundle.js porque são módulos independentes com exports próprios.
  // O bootstrap os importa via dynamic import esperando seus exports específicos.
  // Lote 9 — Overlay Layer
  ['"/components/overlay-layer/index.js"', '"/components/overlay-layer/dist/overlay-layer.bundle.js"'],
  // Lote 9 — UI Orchestrator
  ['"/core/ui-orchestrator/index.js"', '"/core/ui-orchestrator/dist/ui-orchestrator.bundle.js"'],
  // Lote 9 — Platform Runtime
  ['"/platform/runtime/index.js"', '"/platform/runtime/dist/platform-runtime.bundle.js"'],
  // Lote 9 — Platform Shell
  ['"/platform/shell/index.js"', '"/platform/shell/dist/platform-shell.bundle.js"']
];

function applyReplacements(list, label) {
  for (var i = 0; i < list.length; i++) {
    var from = list[i][0];
    var to = list[i][1];
    if (code.indexOf(from) !== -1) {
      code = code.split(from).join(to);
      count++;
      console.log('  ' + label + ': ' + from + ' → ' + to);
    }
  }
}

applyReplacements(dynamicReplacements, 'Direct');

if (code !== original) {
  fs.writeFileSync(file, code, 'utf8');
  console.log('APPLIED: ' + count + ' replacements to ' + file);
} else {
  console.log('NO CHANGES: ' + file);
}
