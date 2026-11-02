// Phase 4 Bootstrap Boot
// @version 4.3.1-CONTRACTS
// @changelog v4.3.1-CONTRACTS: Dependency Contract formalizado
// @changelog v4.3.0 - Added _setBootstrap for syncing with existing bootstrap
// @description Boot do container-main Bootstrap platform (56+ managers)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.3.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: BOOT_CONFIG from ./constants.js
// RECEIVES (via createBootstrapBoot options):
//   options.portsManager — Ports manager for DI
// WINDOW ACCESS:
//   windowAdapter.expose('CMBootstrap') — legítimo (API pública)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_CONFIG } from './constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.phases.phase-4.bootstrap-boot';

export function createBootstrapBoot(options: { portsManager?: Record<string, Function> | null }) {
  if (options === undefined) options = {};
  var portsManager = options.portsManager;

  var _bootstrap: Record<string, unknown> | null = null;

  return {
    getBootstrap: function() {
      return _bootstrap;
    },

    // v4.3.0: Permite sincronizar com bootstrap existente (feito por Main.init)
    _setBootstrap: function(bootstrap: Record<string, unknown> | null) {
      _bootstrap = bootstrap;
    },

    boot: function(bootFn: ((container: Record<string, unknown> | null, config: Record<string, unknown>) => Promise<Record<string, unknown> | null>) | null, getBootstrapFn: (() => Record<string, unknown> | null) | null, ContainerMainAPI: Record<string, unknown> | null, container: Record<string, unknown> | null, logger: Record<string, Function> | null, windowAdapter: { expose?: (name: string, value: unknown) => void } | null) {
      var self = this;
      var startTime = performance.now();
      
      // v4.3.0: Se já existe bootstrap, não faz boot novamente
      if (_bootstrap) {
        if (logger) logger.info('[P14] Bootstrap already exists - skipping boot');
        return Promise.resolve(_bootstrap);
      }
      
      if (!bootFn) {
        if (logger) logger.info('[P14] container-main boot() not available - skipping Bootstrap initialization');
        return Promise.resolve(null);
      }
      
      if (logger) logger.info('[P14] Booting container-main Bootstrap platform...');
      
      return Promise.resolve().then(function() {
        return bootFn(container, BOOT_CONFIG);
      }).then(function(bootstrap) {
        var bootTime = Math.round(performance.now() - startTime);
        
        if (!bootstrap) {
          if (logger) logger.warn('[P14] container-main boot() returned null');
          return null;
        }
        
        _bootstrap = bootstrap;
        
        // Expose Bootstrap globally
        if (portsManager && portsManager.exposeGlobal) {
          portsManager.exposeGlobal('CMBootstrap', bootstrap);
        }
        if (windowAdapter && windowAdapter.expose) {
          windowAdapter.expose('CMBootstrap', bootstrap);
        }
        
        // Expose ContainerMain API if available
        if (ContainerMainAPI && portsManager && portsManager.exposeGlobal) {
          portsManager.exposeGlobal('ContainerMainPlatform', ContainerMainAPI);
        }
        
        var bsTyped = bootstrap as Record<string, Function>;
        var info = bsTyped.info ? bsTyped.info() : {};
        var state = bsTyped.getState ? bsTyped.getState() : 'unknown';
        
        if (logger) logger.info('[P14] container-main Bootstrap initialized', {
          bootTime: bootTime,
          state: state,
          version: info.version || 'unknown',
          managersActive: info.managersActive || 0
        });
        
        // Track telemetry
        var telemetryCore = portsManager ? portsManager.get('telemetryCore') : null;
        if (telemetryCore && telemetryCore.track) {
          telemetryCore.track('container-main:bootstrapped', {
            bootTime: bootTime,
            state: state,
            managersActive: info.managersActive || 0
          });
        }
        
        return bootstrap;
      }).catch(function(error): null {
        if (logger) logger.warn('[P14] container-main Bootstrap failed (non-critical)', { error: error.message });
        return null;
      });
    },

    reset: function() {
      _bootstrap = null;
    }
  };
}

export default { createBootstrapBoot };
