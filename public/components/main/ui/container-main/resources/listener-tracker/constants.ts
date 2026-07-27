// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:listener-tracker
// PURPOSE: Listener Tracker Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LISTENER_TYPES — exported value
//   DEFAULT_LIMITS — exported value
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
export const MODULE_ID = 'container-main:listener-tracker';

// Tipos de listener
export const LISTENER_TYPES = Object.freeze({
  DOM: 'dom',
  EVENTBUS: 'eventbus',
  WINDOW: 'window',
  DOCUMENT: 'document',
  CUSTOM: 'custom',
  OBSERVER: 'observer',
  TIMER: 'timer',
  INTERVAL: 'interval',
  RAF: 'raf'
});

// Limites padrão por painel
export const DEFAULT_LIMITS = Object.freeze({
  maxListenersPerPanel: 50,
  maxTimersPerPanel: 10,
  maxIntervalsPerPanel: 5,
  maxObserversPerPanel: 10,
  warnThreshold: 0.8
});

export default {
  VERSION, MODULE_ID,
  LISTENER_TYPES, DEFAULT_LIMITS
};
