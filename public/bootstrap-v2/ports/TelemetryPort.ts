// Telemetry Port
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: TELEMETRY_CONTRACT, TELEMETRY_EVENTS,
//   createNullTelemetry(), validateTelemetry()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'telemetry-port';
const VERSION = '1.1.1-CONTRACTS';

const TELEMETRY_CONTRACT = {
  track: 'function',
  error: 'function',
  info: 'function',
  warn: 'function',
  startTimer: 'function',
  endTimer: 'function',
  getMetrics: 'function'
};

const TELEMETRY_EVENTS = {
  BOOT_START: 'boot:start',
  BOOT_COMPLETE: 'boot:complete',
  BOOT_ERROR: 'boot:error',
  PHASE_START: 'boot:phase:start',
  PHASE_COMPLETE: 'boot:phase:complete',
  PHASE_ERROR: 'boot:phase:error',
  MODULE_LOAD: 'boot:module:load',
  MODULE_INIT: 'boot:module:init',
  MODULE_READY: 'boot:module:ready',
  MODULE_ERROR: 'boot:module:error'
};

function createNullTelemetry() {
  return {
    track: function() {},
    error: function() {},
    info: function() {},
    warn: function() {},
    startTimer: function() {},
    endTimer: function() { return 0; },
    getMetrics: function() { return {}; }
  };
}

function validateTelemetry(telemetry: unknown) {
  if (!telemetry) return { valid: false, errors: ['Telemetry is null'] };
  const errors: string[] = [];
  const telObj = telemetry as Record<string, unknown>;
  if (typeof telObj.track !== 'function') {
    errors.push('Missing track function');
  }
  return { valid: errors.length === 0, errors: errors };
}

export { TELEMETRY_CONTRACT, TELEMETRY_EVENTS, createNullTelemetry, validateTelemetry, MODULE_ID, VERSION };
export default { TELEMETRY_CONTRACT: TELEMETRY_CONTRACT, TELEMETRY_EVENTS: TELEMETRY_EVENTS, createNullTelemetry: createNullTelemetry, validateTelemetry: validateTelemetry };
