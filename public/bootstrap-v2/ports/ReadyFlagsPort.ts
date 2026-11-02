// ReadyFlags Port
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#11 - Port formal para ReadyFlagsAdapter
// @changelog v1.0.0-QUICKWINS: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: READY_FLAGS_CONTRACT, createNullReadyFlags(),
//   validateReadyFlags()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'ready-flags-port';
const VERSION = '1.0.1-CONTRACTS';

const READY_FLAGS_CONTRACT = {
  setFlag: 'function',
  getFlag: 'function',
  clearFlag: 'function',
  getAllFlags: 'function',
  waitFor: 'function'
};

function createNullReadyFlags() {
  const flags: Record<string, unknown> = {};
  return {
    setFlag: function(name: string, value: unknown) { flags[name] = value; },
    getFlag: function(name: string) { return flags[name]; },
    clearFlag: function(name: string) { delete flags[name]; },
    getAllFlags: function() { return Object.assign({}, flags); },
    waitFor: function() { return Promise.resolve(true); }
  };
}

function validateReadyFlags(readyFlags: unknown) {
  if (!readyFlags) return { valid: false, errors: ['ReadyFlags is null'] };
  const errors: string[] = [];
  const rfObj = readyFlags as Record<string, unknown>;
  const methods = ['setFlag', 'getFlag', 'clearFlag', 'getAllFlags'];
  for (let i = 0; i < methods.length; i++) {
    if (typeof rfObj[methods[i]] !== 'function') {
      errors.push('Missing ' + methods[i] + ' function');
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

export { READY_FLAGS_CONTRACT, createNullReadyFlags, validateReadyFlags, MODULE_ID, VERSION };
export default { READY_FLAGS_CONTRACT: READY_FLAGS_CONTRACT, createNullReadyFlags: createNullReadyFlags, validateReadyFlags: validateReadyFlags };
