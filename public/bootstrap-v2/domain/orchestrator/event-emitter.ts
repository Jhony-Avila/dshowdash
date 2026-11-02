// Event Emitter - Sistema de eventos do orquestrador
// @version 2.2.1-CONTRACTS
// @changelog v2.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory options):
//   options.logger — optional logger instance
//   options.moduleId — module identifier (default: 'event-emitter')
// PROVIDES: createEventEmitter() factory returning:
//   emit(), on(), off(), clear(), listenerCount()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.event-emitter';

type EventHandler = (data: Record<string, unknown>) => void;

interface EventEmitterOptions {
  logger?: Record<string, Function> | null;
  moduleId?: string;
}

export function createEventEmitter(options: EventEmitterOptions) {
  if (options === undefined) options = {};
  const logger = options.logger;
  const moduleId = options.moduleId || 'event-emitter';

  let listeners: Record<string, EventHandler[]> = {};

  function log(level: string, message: string, data: Record<string, unknown>) {
    if (logger && logger[level]) {
      logger[level](message, Object.assign({}, data, { module: moduleId }));
    }
  }

  return {
    emit: function(event: string, data?: Record<string, unknown>) {
      if (data === undefined) data = {};
      const handlers = listeners[event] || [];
      for (let i = 0; i < handlers.length; i++) {
        try {
          handlers[i](data);
        } catch (e: any) {
          log('error', 'Event handler error', { event: event, error: e.message });
        }
      }
    },

    on: function(event: string, handler: EventHandler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
      const self = this;
      return function() {
        self.off(event, handler);
      };
    },

    off: function(event: string, handler: EventHandler) {
      const handlers = listeners[event] || [];
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    },

    clear: function() {
      listeners = {};
    },

    listenerCount: function(event: string) {
      return (listeners[event] || []).length;
    }
  };
}

export default { createEventEmitter };
