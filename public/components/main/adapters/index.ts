// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-adapters-index
// PURPOSE: Main Adapters Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AuthAdapter — exported value
//   DOMAdapter — exported value
//   EventBusAdapter — exported value
//   RouterAdapter — exported value
//   StateAdapter — exported value
//   TelemetryAdapter — exported value
//   UIAdapter — exported value
//   TimerAdapter — exported value
//   createTimerAdapter — exported value
//   getTimerAdapter — exported value
//   GlobalsAdapter — exported value
//   createGlobalsAdapter — exported value
//   getGlobalsAdapter — exported value
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

export { default as AuthAdapter } from './AuthAdapter.js';
export { default as DOMAdapter } from './DOMAdapter.js';
export { default as EventBusAdapter } from './EventBusAdapter.js';
export { default as RouterAdapter } from './RouterAdapter.js';
export { default as StateAdapter } from './StateAdapter.js';
export { default as TelemetryAdapter } from './TelemetryAdapter.js';
export { default as UIAdapter } from './UIAdapter.js';
export { default as TimerAdapter, createTimerAdapter, getTimerAdapter } from './TimerAdapter.js';
export { default as GlobalsAdapter, createGlobalsAdapter, getGlobalsAdapter } from './GlobalsAdapter.js';

export const VERSION = '2.0.0-P1-HEX';
export const MODULE_ID = 'main-adapters-index';
