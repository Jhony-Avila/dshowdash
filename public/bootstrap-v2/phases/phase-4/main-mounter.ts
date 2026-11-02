// Phase 4 Main Mounter
// @version 4.2.1-CONTRACTS
// @description Montagem do Main Enterprise v2
// @changelog v4.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   SHELL_EVENTS from /core/runtime/events/index.js
//   VERSION from ./constants.js
// RECEIVES (via createMainMounter options):
//   options.portsManager — Ports manager for DI
// DYNAMIC IMPORTS: /components/main/index.js
// WINDOW ACCESS: windowAdapter.expose('Main') — legítimo (API pública)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SHELL_EVENTS } from '/core/runtime/events/catalog/shell.events.js';
import { VERSION } from './constants.js';

export const MODULE_ID = 'bootstrap-v2.phases.phase-4.main-mounter';

export function createMainMounter(options: { portsManager?: Record<string, Function> | null }) {
  if (options === undefined) options = {};
  var portsManager = options.portsManager;

  var _mounted = false;

  return {
    isMounted: function() {
      return _mounted;
    },

    mount: function(ports: Record<string, unknown>, results: { initialized: string[]; failed: Array<{ id: string; error: string }> }) {
      var self = this;

      if (_mounted) {
        var logger = ports.logger as Record<string, Function> | null;
        if (logger) logger.info('[P14] Main already mounted - skipping mountMain');
        return Promise.resolve(null);
      }

      var logger = ports.logger as Record<string, Function> | null;
      var eventBusAdapter = ports.eventBusAdapter as Record<string, Function> | null;
      var readyFlagsAdapter = ports.readyFlagsAdapter as Record<string, Function> | null;
      var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
      
      return import('/components/main/index.js').then(function(MainModule) {
        var MainAPI = (MainModule && (typeof MainModule.init === 'function' || typeof MainModule.createMain === 'function'))
          ? MainModule
          : (MainModule && MainModule.default && (typeof MainModule.default.init === 'function' || typeof MainModule.default.createMain === 'function'))
            ? MainModule.default
            : null;
        
        if (!MainAPI) {
          if (logger) logger.error('[P14] Main module missing init/createMain', {
            keys: Object.keys(MainModule || {}),
            defaultKeys: Object.keys((MainModule && MainModule.default) || {})
          });
          throw new Error('Main module does not export init or createMain');
        }
        
        if (logger) logger.info('[P14] MainAPI normalized', {
          hasInit: typeof MainAPI.init === 'function',
          hasCreateMain: typeof MainAPI.createMain === 'function'
        });
        
        var doc = (typeof document !== 'undefined') ? document : null;
        var externalDeps = {
          // @ts-expect-error strict migration — TS18049
          eventBus: portsManager.get('eventBus'),
          // @ts-expect-error strict migration — TS18049
          router: portsManager.get('routerGlobal'),
          // @ts-expect-error strict migration — TS18049
          globalState: portsManager.get('globalState'),
          // @ts-expect-error strict migration — TS18049
          telemetryCore: portsManager.get('telemetryCore'),
          document: doc,
          defaultPanel: 'panel-01'
        };
        
        if (logger) logger.info('[P14] External deps prepared via ports', {
          hasEventBus: !!externalDeps.eventBus,
          hasRouter: !!externalDeps.router,
          hasDocument: !!externalDeps.document
        });
        
        var initFn = MainAPI.init || MainAPI.createMain;
        
        return Promise.resolve(initFn(externalDeps)).then(function(main) {
          if (logger) logger.info('[P14] Main instance created', { hasEngine: !!main, type: typeof main });
          
          // @ts-expect-error strict migration — TS2339
          if (main && typeof main.mount === 'function') {
            // @ts-expect-error strict migration — TS2339
            return Promise.resolve(main.mount()).then(function() {
              if (logger) logger.info('[P14] Main mount() called successfully');
              return main;
            }).catch(function(e) {
              if (logger) logger.warn('[P14] Main mount() failed', { error: e.message });
              return main;
            });
          }
          return main;
        }).then(function(main) {
          var exposedAPI = Object.assign({}, MainAPI, {
            getInstance: function() { return main; },
            VERSION: MainAPI!.VERSION || MainModule.VERSION || VERSION
          });
          
          // @ts-expect-error strict migration — TS18049
          portsManager.exposeGlobal('Main', exposedAPI);
          // @ts-expect-error strict migration — TS18049
          portsManager.exposeGlobal('MainModule', MainModule);
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('Main', exposedAPI);
          
          if (logger) logger.info('[P14] Main exposed to window');
          if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('main', true);
          
          results.initialized.push('main');
          _mounted = true;
          
          if (eventBusAdapter && eventBusAdapter.emit) {
            eventBusAdapter.emit(SHELL_EVENTS.MAIN_READY, { version: VERSION });
          }
          
          if (logger) logger.info('[P14] Main Enterprise v2 mounted successfully', { version: VERSION });
          
          return main;
        });
      }).catch(function(error) {
        results.failed.push({ id: 'main', error: error.message });
        if (logger) logger.error('[P14] Main Enterprise v2 mount failed', {
          error: error.message,
          stack: error.stack ? error.stack.substring(0, 500) : ''
        });
        throw error;
      });
    },

    reset: function() {
      _mounted = false;
    }
  };
}

export default { createMainMounter };
