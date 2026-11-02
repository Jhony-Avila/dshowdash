// Context Constants
// @version 1.1.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: MODULE_ID, VERSION, CONTEXT_STATES, PROGRESS_EVENTS
// BROWSER-APIS: None
'use strict';

export const MODULE_ID = 'boot-context';
export const VERSION = '1.1.0-MODULAR';

// Estados possíveis do contexto
export const CONTEXT_STATES = {
  PENDING: 'pending',
  INITIALIZING: 'initializing',
  READY: 'ready',
  DEGRADED: 'degraded',
  FAILED: 'failed'
};

// Eventos de progresso
export const PROGRESS_EVENTS = {
  START: 'boot:progress:start',
  PHASE_START: 'boot:progress:phase:start',
  PHASE_COMPLETE: 'boot:progress:phase:complete',
  COMPLETE: 'boot:progress:complete'
};

export default {
  MODULE_ID,
  VERSION,
  CONTEXT_STATES,
  PROGRESS_EVENTS
};
