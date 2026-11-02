// Phase 4 Auth Detector
// @version 5.1.0-DOMAIN-PURE
// @changelog v5.1.0-DOMAIN-PURE - RuntimeContext via options.runtimeContext + _resolveRuntimeContext() (elimina window.RuntimeContext direto)
// @changelog v5.0.0-P1 - Delegação para RuntimeContext (fonte única de verdade)
// @changelog v4.2.0-MODULAR - Detecção de autenticação com múltiplas estratégias
// @description Detecção de autenticação delegando para RuntimeContext
// @rule Auth é decidido pelo RuntimeContext, não por este módulo
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.1.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES via options:
//   options.portsManager    — PortsManager instance (for legacy fallback)
//   options.runtimeContext  — RuntimeContext instance (injeção preferida)
// RESOLVES RuntimeContext via chain:
//   1. options.runtimeContext         — injeção direta
//   2. kernel/index.getRuntimeContext — se disponível
//   3. window.RuntimeContext          — último fallback
// BROWSER APIs (legítimo):
//   document.body.dataset   — DOM auth state detection
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.phases.phase-4.auth-detector';

export function createAuthDetector(options: Record<string, unknown>) {
  if (options === undefined) options = {};
  var portsManager = options.portsManager as { get: (name: string) => Record<string, unknown> | null } | undefined;
  var _runtimeContext: Record<string, unknown> | null = (options.runtimeContext as Record<string, unknown>) || null;

  // v5.1.0: resolver RuntimeContext via cadeia AAA
  function _resolveRuntimeContext() {
    if (_runtimeContext) return _runtimeContext;
    // Tentar via windowAdapter
    if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var resolved = window.Core.windowAdapter.get('RuntimeContext');
      if (resolved) {
        _runtimeContext = resolved;
        return _runtimeContext;
      }
    }
    // Último fallback: window.RuntimeContext
    if (typeof window !== 'undefined' && window.RuntimeContext) {
      _runtimeContext = window.RuntimeContext;
    }
    return _runtimeContext;
  }

  return {
    checkAuthentication: function() {
      // P1: PRIORIDADE 1 - RuntimeContext (fonte única de verdade)
      var rc = _resolveRuntimeContext() as Record<string, Function> | null;
      if (rc && rc.isAuthenticated) {
        try {
          return rc.isAuthenticated();
        } catch (e) {
          // Fallback se RuntimeContext falhar
        }
      }
      
      // P1: FALLBACK - Apenas se RuntimeContext não disponível
      return this._legacyCheckAuthentication();
    },

    _legacyCheckAuthentication: function() {
      var doc = (typeof document !== 'undefined') ? document : null;
      
      var authState = doc && doc.body && doc.body.dataset ? doc.body.dataset.state : null;
      if (authState === 'authenticated') {
        return true;
      }
      
      var appContext = (portsManager ? portsManager.get('appContext') : null) as Record<string, Record<string, Function>> | null;
      if (appContext && appContext.auth && typeof appContext.auth.isAuthenticated === 'function') {
        try {
          if (appContext.auth.isAuthenticated()) return true;
        } catch (e) { }
      }

      var sessionManager = (portsManager ? portsManager.get('sessionManager') : null) as Record<string, Function> | null;
      if (sessionManager && typeof sessionManager.isAuthenticated === 'function') {
        try {
          if (sessionManager.isAuthenticated()) return true;
        } catch (e) { }
      }

      var authReady = doc && doc.body && doc.body.dataset ? doc.body.dataset.authReady : null;
      if (authReady === 'true' && authState !== 'unauthenticated' && authState !== 'error') {
        if (sessionManager && typeof sessionManager.isAuthenticated === 'function') {
          try {
            if (sessionManager.isAuthenticated()) return true;
          } catch (e) { }
        }
      }
      
      return false;
    },

    getDataState: function() {
      var doc = (typeof document !== 'undefined') ? document : null;
      return doc && doc.body && doc.body.dataset ? doc.body.dataset.state : null;
    },

    getAuthReady: function() {
      var doc = (typeof document !== 'undefined') ? document : null;
      return doc && doc.body && doc.body.dataset ? doc.body.dataset.authReady : null;
    },

    getAuthSource: function() {
      var rc = _resolveRuntimeContext();
      if (rc) {
        return 'RuntimeContext';
      }
      return 'legacy';
    },

    info: function() {
      var rc = _resolveRuntimeContext();
      return {
        moduleId: 'phase-4-auth-detector',
        version: '5.1.0-DOMAIN-PURE',
        source: this.getAuthSource(),
        runtimeContextAvailable: !!rc,
        isAuthenticated: this.checkAuthentication(),
        dataState: this.getDataState(),
        authReady: this.getAuthReady()
      };
    }
  };
}

export default { createAuthDetector: createAuthDetector };
