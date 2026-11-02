// Pre-Boot Contract - Interface formal do Stage -1
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description Define o contrato do pré-boot (Stage -1)
// @changelog v1.0.0-ENTERPRISE: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: PRE_BOOT_STATES, PRE_BOOT_EVENTS, PRE_BOOT_RESULT_CONTRACT,
//   validatePreBootResult(), createPreBootResult(), info()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'pre-boot-contract';
var VERSION = '1.0.1-CONTRACTS';

// Estados do Pre-Boot
var PRE_BOOT_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  LOADING_BRIDGE: 'loading-bridge',
  LOADING_METRICS: 'loading-metrics',
  LOADING_PERMISSIONS: 'loading-permissions',
  READY: 'ready',
  FAILED: 'failed'
};

// Eventos do Pre-Boot
var PRE_BOOT_EVENTS = {
  START: 'pre-boot:start',
  BRIDGE_READY: 'pre-boot:bridge:ready',
  METRICS_READY: 'pre-boot:metrics:ready',
  PERMISSIONS_READY: 'pre-boot:permissions:ready',
  COMPLETE: 'pre-boot:complete',
  ERROR: 'pre-boot:error'
};

// Contrato do resultado do Pre-Boot
var PRE_BOOT_RESULT_CONTRACT = {
  success: 'boolean',
  state: 'string',
  modules: {
    bridge: { loaded: 'boolean', error: 'string|null' },
    metrics: { loaded: 'boolean', error: 'string|null' },
    permissions: { loaded: 'boolean', mode: 'string', error: 'string|null' }
  },
  timing: {
    startTime: 'number',
    endTime: 'number',
    totalTime: 'number',
    moduleTimings: 'object'
  },
  errors: 'array'
};

// Validar resultado do pre-boot
function validatePreBootResult(result: Record<string, unknown>) {
  var errors = [];
  
  if (typeof result.success !== 'boolean') {
    errors.push('Missing or invalid success field');
  }
  
  if (!result.state || typeof result.state !== 'string') {
    errors.push('Missing or invalid state field');
  }
  
  if (!result.modules || typeof result.modules !== 'object') {
    errors.push('Missing or invalid modules field');
  }
  
  if (!result.timing || typeof result.timing !== 'object') {
    errors.push('Missing or invalid timing field');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Criar resultado padrão
function createPreBootResult() {
  return {
    success: false,
    state: PRE_BOOT_STATES.IDLE,
    modules: {
      bridge: { loaded: false, error: null as null | string, time: 0 },
      metrics: { loaded: false, error: null as null | string, time: 0 },
      permissions: { loaded: false, mode: 'unknown', error: null as null | string, time: 0 }
    },
    timing: {
      startTime: null as null | number,
      endTime: null as null | number,
      totalTime: 0,
      moduleTimings: {}
    },
    errors: [] as unknown[],
    version: VERSION
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(PRE_BOOT_STATES),
    events: Object.keys(PRE_BOOT_EVENTS)
  };
}

export {
  PRE_BOOT_STATES,
  PRE_BOOT_EVENTS,
  PRE_BOOT_RESULT_CONTRACT,
  validatePreBootResult,
  createPreBootResult,
  info,
  MODULE_ID,
  VERSION
};

export default {
  PRE_BOOT_STATES: PRE_BOOT_STATES,
  PRE_BOOT_EVENTS: PRE_BOOT_EVENTS,
  PRE_BOOT_RESULT_CONTRACT: PRE_BOOT_RESULT_CONTRACT,
  validatePreBootResult: validatePreBootResult,
  createPreBootResult: createPreBootResult,
  info: info,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
