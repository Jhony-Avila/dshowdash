// Phase Port
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: PHASE_CONTRACT, PHASE_STATES,
//   validatePhase(), createPhase()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'phase-port';
const VERSION = '1.1.1-CONTRACTS';

const PHASE_CONTRACT = {
  id: 'string',
  name: 'string',
  order: 'number',
  modules: 'array',
  parallel: 'boolean',
  critical: 'boolean',
  recoverable: 'boolean',
  dependsOn: 'array',
  execute: 'function',
  recover: 'function'
};

const PHASE_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RECOVERED: 'recovered',
  SKIPPED: 'skipped'
};

function validatePhase(phase: Record<string, unknown>) {
  const errors = [];
  if (!phase.id || typeof phase.id !== 'string') errors.push('Missing or invalid id');
  if (!phase.name || typeof phase.name !== 'string') errors.push('Missing or invalid name');
  if (typeof phase.order !== 'number') errors.push('Missing or invalid order');
  if (typeof phase.execute !== 'function') errors.push('Missing execute function');
  return { valid: errors.length === 0, errors: errors };
}

function createPhase(config: Record<string, unknown>) {
  return {
    id: config.id,
    name: config.name,
    order: config.order,
    modules: config.modules || [],
    parallel: config.parallel || false,
    critical: config.critical !== false,
    recoverable: config.recoverable || false,
    dependsOn: config.dependsOn || [],
    execute: config.execute || function() { return Promise.resolve({ success: true }); },
    recover: config.recover || function() { return Promise.resolve(); }
  };
}

export { PHASE_CONTRACT, PHASE_STATES, validatePhase, createPhase, MODULE_ID, VERSION };
export default { PHASE_CONTRACT: PHASE_CONTRACT, PHASE_STATES: PHASE_STATES, validatePhase: validatePhase, createPhase: createPhase };
