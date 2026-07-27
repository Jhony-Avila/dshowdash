// toolbar-wiring/state.js
// @version 1.1.0-PAB-ES6
// @description Estado global compartilhado do wiring (resultado, timestamp, refs)
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: nenhum
// PROVIDES: VERSION, MODULE_ID, state
// CONSUMERS: index.js, diagnostics.js
'use strict';

export const VERSION = '6.3.0-MODULAR';
export const MODULE_ID = 'toolbar-wiring';

/** Estado persistente do wiring — compartilhado entre módulos */
export const state = {
  lastWiringResult: null as Record<string, unknown> | null,
  lastWiringTimestamp: 0,
  rewireListenerActive: false,
  toolbarRef: null as Record<string, unknown> | null
};
