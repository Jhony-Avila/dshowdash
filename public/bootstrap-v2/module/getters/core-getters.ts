// Core Getters
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (receives dependencies via context parameter)
// PROVIDES: createCoreGetters(context)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters.core-getters';

export function createCoreGetters(context: { stateMachine: { getState: () => string; isReady: () => boolean }; bootExecutor: { getResult: () => unknown } }) {
  const stateMachine = context.stateMachine;
  const bootExecutor = context.bootExecutor;
  
  return {
    getState: function() {
      return stateMachine.getState();
    },
    
    isReady: function() {
      return stateMachine.isReady();
    },
    
    getResult: function() {
      return bootExecutor.getResult();
    }
  };
}

export default { createCoreGetters };
