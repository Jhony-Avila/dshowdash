// Phase Executor Constants
// @version 3.1.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: MODULE_ID, VERSION, DEFAULT_CIRCUIT_BREAKER_CONFIG
// BROWSER-APIS: None
'use strict';

export const MODULE_ID = 'phase-executor';
export const VERSION = '3.1.0-MODULAR';

export const DEFAULT_CIRCUIT_BREAKER_CONFIG = Object.freeze({
  failureThreshold: 2,
  successThreshold: 1,
  timeout: 60000
});

export default { MODULE_ID, VERSION, DEFAULT_CIRCUIT_BREAKER_CONFIG };
