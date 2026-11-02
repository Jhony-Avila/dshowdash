// Circuit Breaker - Barrel Export
// DEPENDENCY CONTRACT (1.2.0-MODULAR) — BARREL FILE
// @version 1.2.0-MODULAR
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.circuit-breaker';

export { setupCircuitBreakerIntegration } from './setup.js';
export { createCircuitBreakerHandlers } from './handlers.js';
export { createCircuitBreakerAPI } from './api.js';
