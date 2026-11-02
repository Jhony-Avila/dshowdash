// Bootstrap Port
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-ENTERPRISE: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: BOOTSTRAP_CONTRACT, MODULE_STATES,
//   validateBootstrapModule(), createBootstrapModule()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'bootstrap-port';
const VERSION = '1.1.1-CONTRACTS';

const BOOTSTRAP_CONTRACT = {
  id: 'string',
  name: 'string',
  load: 'function',
  init: 'function',
  destroy: 'function',
  healthCheck: 'function',
  info: 'function',
  version: 'string',
  critical: 'boolean',
  optional: 'boolean',
  timeout: 'number',
  dependsOn: 'array'
};

const MODULE_STATES = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  DESTROYED: 'destroyed'
};

function validateBootstrapModule(module: Record<string, unknown>) {
  const errors = [];
  if (!module.id || typeof module.id !== 'string') errors.push('Missing or invalid id');
  if (!module.name || typeof module.name !== 'string') errors.push('Missing or invalid name');
  const hasLoad = typeof module.load === 'function';
  const hasInit = typeof module.init === 'function';
  if (!hasLoad && !hasInit) errors.push('Module must have load() or init() function');
  return { valid: errors.length === 0, errors: errors };
}

function createBootstrapModule(config: Record<string, unknown>) {
  const id = config.id;
  const name = config.name;
  const version = config.version || '1.0.0';
  return {
    id: id,
    name: name,
    version: version,
    critical: config.critical || false,
    optional: config.optional || false,
    timeout: config.timeout || 10000,
    dependsOn: config.dependsOn || [],
    load: config.load || function() { return Promise.resolve(null); },
    init: config.init || function() { return Promise.resolve(null); },
    destroy: config.destroy || function() { return Promise.resolve(); },
    healthCheck: config.healthCheck || function() { return { status: 'unknown' }; },
    info: config.info || function() { return { id: id, name: name, version: version }; }
  };
}

export { BOOTSTRAP_CONTRACT, MODULE_STATES, validateBootstrapModule, createBootstrapModule, MODULE_ID, VERSION };
export default { BOOTSTRAP_CONTRACT: BOOTSTRAP_CONTRACT, MODULE_STATES: MODULE_STATES, validateBootstrapModule: validateBootstrapModule, createBootstrapModule: createBootstrapModule };
