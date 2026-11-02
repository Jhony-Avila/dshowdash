// Phase 4 Auth Listener
// @version 4.2.1-CONTRACTS
// @description Gerenciamento de listeners de autenticação
// @changelog v4.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: AUTH_EVENTS from /core/runtime/events/index.js
// RECEIVES (via register):
//   ports.logger, ports.eventBusAdapter
//   onAuthSuccess — callback for auth events
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.phases.phase-4.auth-listener';

export function createAuthListener(options?: Record<string, unknown>) {
  if (options === undefined) options = {};

  var _registered = false;
  var _cleanups: Array<() => void> = [];
  var _phasePorts: Record<string, unknown> | null = null;

  return {
    // v4.2.0: Register listeners for both LOGIN_SUCCESS and READY
    register: function(ports: Record<string, unknown>, onAuthSuccess: ((phasePorts: Record<string, unknown> | null, data: Record<string, unknown>) => void) | null) {
      if (_registered) return;

      var logger = ports.logger as Record<string, Function> | null;
      var eventBusAdapter = ports.eventBusAdapter as Record<string, Function> | null;
      _phasePorts = ports;
      
      if (!eventBusAdapter || !eventBusAdapter.on) {
        if (logger) logger.warn('[P14] eventBusAdapter.on not available');
        return;
      }
      
      var authHandler = function(data: Record<string, unknown>) {
        if (logger) logger.info('[P14] Auth event received', { data: data });
        if (onAuthSuccess) {
          onAuthSuccess(_phasePorts, data);
        }
      };
      
      // Listen to LOGIN_SUCCESS
      var cleanup1 = eventBusAdapter.on(AUTH_EVENTS.LOGIN_SUCCESS, authHandler);
      if (typeof cleanup1 === 'function') {
        _cleanups.push(cleanup1);
      } else {
        _cleanups.push(function() {
          if (eventBusAdapter!.off) eventBusAdapter!.off(AUTH_EVENTS.LOGIN_SUCCESS, authHandler);
        });
      }
      
      // v4.2.0: Also listen to AUTH_EVENTS.READY as fallback
      if (AUTH_EVENTS.READY) {
        var cleanup2 = eventBusAdapter.on(AUTH_EVENTS.READY, function(data: Record<string, unknown>) {
          if (data && data.authenticated) {
            if (logger) logger.info('[P14] AUTH_EVENTS.READY with authenticated=true');
            authHandler(data);
          }
        });
        if (typeof cleanup2 === 'function') {
          _cleanups.push(cleanup2);
        }
      }
      
      _registered = true;
      if (logger) logger.info('[P14] Auth listeners registered', {
        events: [AUTH_EVENTS.LOGIN_SUCCESS, AUTH_EVENTS.READY || 'N/A'],
        hasCleanup: _cleanups.length > 0
      });
    },

    isRegistered: function() {
      return _registered;
    },

    getCleanups: function() {
      return _cleanups.slice();
    },

    getPhasePorts: function() {
      return _phasePorts;
    },

    cleanup: function() {
      _cleanups.forEach(function(fn) {
        try { fn(); } catch (e) { /* ignore */ }
      });
      _cleanups = [];
    },

    reset: function() {
      this.cleanup();
      _registered = false;
      _phasePorts = null;
    }
  };
}

export default { createAuthListener };
