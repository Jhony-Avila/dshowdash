// Phase 4 Ports Manager
// @version 4.3.0-DOMAIN-PURE
// @changelog v4.3.0-DOMAIN-PURE - init() usa windowAdapter.get() em vez de window.* direto; mantém inject() e fallback
// @changelog v4.2.0-MODULAR - Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.3.0)
// ═══════════════════════════════════════════════════════════════
// PATTERN: init() auto-resolve via windowAdapter → window fallback
//          inject() permite injeção explícita de ports
// NOTE: init() roda após phase-2/3, todos globais já registrados
// BROWSER APIs (legítimo):
//   window[name]            — exposeGlobal() para registrar APIs públicas
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.phases.phase-4.ports-manager';

// v4.3.0: helper para resolver ports via windowAdapter ou window fallback
function _resolveGlobal(name: string) {
  // Tentar windowAdapter primeiro (se Core.windowAdapter existir)
  if (typeof window !== 'undefined') {
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var resolved = window.Core.windowAdapter.get(name);
      if (resolved) return resolved;
    }
    // Fallback: window direto (phase-4 roda depois de tudo estar registrado)
    return (window as unknown as Record<string, unknown>)[name] || null;
  }
  return null;
}

export function createPortsManager() {
  var _ports: Record<string, unknown> = {
    sessionManager: null,
    appContext: null,
    eventBus: null,
    routerGlobal: null,
    globalState: null,
    telemetryCore: null,
    sidebarRegistry: null,
    _initialized: false
  };

  return {
    init: function() {
      if (_ports._initialized) return;
      // v4.3.0: resolve via windowAdapter → window fallback
      _ports.sessionManager = _resolveGlobal('SessionManager');
      _ports.appContext = _resolveGlobal('AppContext');
      _ports.eventBus = _resolveGlobal('EventBus');
      _ports.routerGlobal = _resolveGlobal('RouterGlobal');
      _ports.globalState = _resolveGlobal('GlobalState') || _resolveGlobal('GlobalStateManager');
      _ports.telemetryCore = _resolveGlobal('TelemetryCore');
      _ports.sidebarRegistry = _resolveGlobal('SidebarRegistry');
      _ports._initialized = true;
    },

    get: function(name: string) {
      if (!_ports._initialized) this.init();
      return _ports[name] || null;
    },

    inject: function(ports: Record<string, unknown>) {
      if (ports) {
        for (var k in ports) {
          if (k !== '_initialized' && ports.hasOwnProperty(k)) {
            _ports[k] = ports[k];
          }
        }
      }
      _ports._initialized = true;
    },

    getAll: function() {
      return Object.assign({}, _ports);
    },

    isInitialized: function() {
      return _ports._initialized;
    },

    reset: function() {
      _ports._initialized = false;
    },

    exposeGlobal: function(name: string, instance: unknown) {
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>)[name] = instance;
      }
    }
  };
}

export default { createPortsManager };
