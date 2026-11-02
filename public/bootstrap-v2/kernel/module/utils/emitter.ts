// Kernel Event Emitter
// @version 1.2.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (receives dependencies via context parameter)
// PROVIDES: createEmitter(context)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.utils.emitter';

interface EmitterContext {
  eventBus: { emit?: (event: string, payload: Record<string, unknown>) => void } | null;
  listeners: Array<(payload: { event: string; data: Record<string, unknown> }) => void>;
  getMode: () => string;
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
}

export function createEmitter(context: EmitterContext) {
  const eventBus = context.eventBus;
  const listeners = context.listeners;
  const getMode = context.getMode;
  const log = context.log;

  return function emit(event: string, data: Record<string, unknown>) {
    const payload = Object.assign({ timestamp: Date.now(), mode: getMode() }, data);

    if (eventBus && eventBus.emit) {
      try {
        eventBus.emit(event, payload);
      } catch (e: any) {
        log('warn', 'EventBus emit failed', { event: event, error: e.message });
      }
    }

    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i]({ event: event, data: payload });
      } catch (e: any) {}
    }
  };
}

export default { createEmitter };
