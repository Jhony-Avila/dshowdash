// System Getters
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (receives dependencies via context parameter)
// PROVIDES: createSystemGetters(context)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters.system-getters';

export function createSystemGetters(context: { kernel: unknown; stateMachine: unknown; dependencyGraph: unknown; degradationNotifier: unknown }) {
  const kernel = context.kernel;
  const stateMachine = context.stateMachine;
  const dependencyGraph = context.dependencyGraph;
  const degradationNotifier = context.degradationNotifier;
  
  return {
    getKernel: function() {
      return kernel;
    },
    
    getStateMachine: function() {
      return stateMachine;
    },
    
    getDependencyGraph: function() {
      return dependencyGraph;
    },
    
    getDegradationNotifier: function() {
      return degradationNotifier;
    }
  };
}

export default { createSystemGetters };
