// Orchestrator Constants
// @version 2.4.1-CONTRACTS
// @changelog v2.4.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.4.0-ROLLBACK: Sprint 6 #8 - Adicionado eventos de rollback
// @changelog v2.3.0-ENTERPRISE: #3 Adicionado PHASE_SKIPPED para Circuit Breaker
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: MODULE_ID, VERSION, ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'boot-orchestrator';
export const VERSION = '2.4.1-CONTRACTS';

export const ORCHESTRATOR_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  RUNNING: 'running',
  PHASE_EXECUTING: 'phase-executing',
  PHASE_COMPLETE: 'phase-complete',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RECOVERING: 'recovering',
  ROLLING_BACK: 'rolling-back'
};

export const ORCHESTRATOR_EVENTS = {
  INIT: 'orchestrator:init',
  PHASE_START: 'orchestrator:phase:start',
  PHASE_COMPLETE: 'orchestrator:phase:complete',
  PHASE_ERROR: 'orchestrator:phase:error',
  PHASE_SKIPPED: 'orchestrator:phase:skipped',
  COMPLETE: 'orchestrator:complete',
  ERROR: 'orchestrator:error',
  RECOVERY: 'orchestrator:recovery',
  CONTEXT_READY: 'orchestrator:context:ready',
  HEALTH_UPDATE: 'orchestrator:health:update',
  MANIFEST_INVALID: 'orchestrator:manifest:invalid',
  PHASE_ROLLBACK_START: 'orchestrator:phase:rollback:start',
  PHASE_ROLLBACK_COMPLETE: 'orchestrator:phase:rollback:complete',
  PHASE_ROLLBACK_ERROR: 'orchestrator:phase:rollback:error'
};

export default {
  MODULE_ID,
  VERSION,
  ORCHESTRATOR_STATES,
  ORCHESTRATOR_EVENTS
};
