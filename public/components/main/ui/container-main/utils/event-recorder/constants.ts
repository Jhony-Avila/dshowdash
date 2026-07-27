// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:event-recorder
// PURPOSE: Event Recorder Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RECORDER_STATES — exported value
//   EVENT_TYPES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:event-recorder';

// Estados do recorder
export const RECORDER_STATES = Object.freeze({
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  REPLAYING: 'replaying'
});

// Tipos de evento
export const EVENT_TYPES = Object.freeze({
  EVENTBUS: 'eventbus',
  DOM: 'dom',
  NETWORK: 'network',
  STATE: 'state',
  USER: 'user',
  CUSTOM: 'custom'
});

export default {
  VERSION, MODULE_ID,
  RECORDER_STATES, EVENT_TYPES
};
