// EventBus Adapter
// @version 2.2.0-GLOBALS-CONTRACT
// @changelog v2.2.0-GLOBALS-CONTRACT: Integração com globals-contract.js para validação de acesso a window.*
// @changelog v2.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.1.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   isGlobalAllowed, registerGlobalUsage from ../contracts/globals-contract.js
//
// RECEIVES (via factory options):
//   options.namespace — event namespace (default: 'bootstrap-v2')
//   options.validateGlobals — enable globals contract validation (default: true)
//
// PROVIDES: createEventBusAdapter() factory returning:
//   emit(), emitNamespaced(), on(), off(), once(), hasEventBus(), info()
//
// BROWSER APIs:
//   window.EventBus — LEGÍTIMO: global EventBus integration (validated by globals-contract)
//
// WINDOW ACCESS: window.EventBus (global event system, validated)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isGlobalAllowed, registerGlobalUsage, getGlobalPolicy } from '../contracts/globals-contract.js';

const MODULE_ID = 'eventbus-adapter';
const VERSION = '2.2.0-GLOBALS-CONTRACT';

type EventHandler = (data: unknown) => void;

interface EventBusAdapterOptions {
  namespace?: string;
  validateGlobals?: boolean;
}

interface EventBusLike {
  emit?: (event: string, data: unknown) => void;
  on?: (event: string, handler: EventHandler) => (() => void) | void;
  off?: (event: string, handler: EventHandler) => void;
  once?: (event: string, handler: EventHandler) => (() => void) | void;
}

function createEventBusAdapter(options?: EventBusAdapterOptions) {
  if (options === undefined) options = {};
  const namespace = options.namespace || 'bootstrap-v2';
  const validateGlobals = options.validateGlobals !== false;
  const localListeners: Record<string, EventHandler[]> = {};

  // v2.2.0: Track global access statistics
  let _globalAccessCount = 0;
  let _globalAccessValidated = false;

  function getEventBus(): EventBusLike | null {
    if (typeof window !== 'undefined' && window.EventBus) {
      // v2.2.0: Validate and register global access using globals-contract
      if (validateGlobals) {
        if (!_globalAccessValidated) {
          // Validate once that EventBus is an allowed global
          const allowed = isGlobalAllowed('EventBus');
          if (!allowed) {
            console.warn('[EventBusAdapter] window.EventBus access not allowed by globals-contract');
          }
          _globalAccessValidated = true;
        }
        // Register each usage for auditing
        registerGlobalUsage('EventBus', 'read', MODULE_ID);
        _globalAccessCount++;
      }
      return window.EventBus as EventBusLike;
    }
    return null;
  }

  function formatEventWithNamespace(event: string): string {
    if (event.indexOf(namespace) === 0) return event;
    return namespace + ':' + event;
  }

  return {
    emit: function(event: string, data: unknown) {
      if (data === undefined) data = {};
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(event, data);
        return;
      }
      const handlers = localListeners[event] || [];
      for (let i = 0; i < handlers.length; i++) {
        try { handlers[i](data); } catch (e) {}
      }
    },

    emitNamespaced: function(event: string, data: unknown) {
      if (data === undefined) data = {};
      const namespacedEvent = formatEventWithNamespace(event);
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(namespacedEvent, data);
      }
    },

    on: function(event: string, handler: EventHandler) {
      const self = this;
      const eventBus = getEventBus();
      if (eventBus && eventBus.on) {
        return eventBus.on(event, handler);
      }
      if (!localListeners[event]) localListeners[event] = [];
      localListeners[event].push(handler);
      return function() { self.off(event, handler); };
    },

    off: function(event: string, handler: EventHandler) {
      const eventBus = getEventBus();
      if (eventBus && eventBus.off) {
        eventBus.off(event, handler);
        return;
      }
      const handlers = localListeners[event] || [];
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    },

    once: function(event: string, handler: EventHandler) {
      const self = this;
      const eventBus = getEventBus();
      if (eventBus && eventBus.once) {
        return eventBus.once(event, handler);
      }
      const wrappedHandler: EventHandler = function(data: unknown) {
        self.off(event, wrappedHandler);
        handler(data);
      };
      return self.on(event, wrappedHandler);
    },

    hasEventBus: function() {
      return !!getEventBus();
    },

    // v2.2.0: Get global access statistics
    getGlobalAccessStats: function() {
      return {
        accessCount: _globalAccessCount,
        validated: _globalAccessValidated,
        globalPolicy: getGlobalPolicy('EventBus')
      };
    },

    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        hasGlobalEventBus: !!getEventBus(),
        localListenerCount: Object.keys(localListeners).length,
        namespace: namespace,
        validateGlobals: validateGlobals,
        globalAccessCount: _globalAccessCount,
        usesGlobalsContract: true
      };
    }
  };
}

export { createEventBusAdapter, MODULE_ID, VERSION };
export default createEventBusAdapter;
