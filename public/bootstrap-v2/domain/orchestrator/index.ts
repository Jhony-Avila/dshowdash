// Orchestrator Module - Barrel Export
// DEPENDENCY CONTRACT (2.3.0-DOMAIN-PURE) — BARREL FILE
// @version 2.3.0-DOMAIN-PURE
// @changelog v2.3.0-DOMAIN-PURE - Removido auth-detector.js (código morto, zero consumidores)
// @changelog v2.2.0-MODULAR - Versão modular inicial
'use strict';

export { MODULE_ID, VERSION, ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS } from './constants.js';
export { createEventEmitter } from './event-emitter.js';
export { calculateBackoffDelay, createRetryExecutor } from './retry-executor.js';
export { createDegradationHandler } from './degradation-handler.js';
export { createPhaseExecutor } from './phase-executor.js';
