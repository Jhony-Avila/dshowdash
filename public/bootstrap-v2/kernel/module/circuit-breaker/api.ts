// Circuit Breaker Public API
// @version 1.2.3-CONTRACTS
// @changelog v1.2.3-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.2 - Changed to absolute path for circuit-breaker import
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.3)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: CircuitBreakerModule from /bootstrap-v2/domain/circuit-breaker.js
// RECEIVES (via createCircuitBreakerAPI context):
//   context.isEnabled
// PROVIDES: getStatus(), getBreaker(), getOpenBreakers(), getOpenCount()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as CircuitBreakerModule from '/bootstrap-v2/domain/circuit-breaker.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.circuit-breaker.api';

interface CircuitBreakerAPIContext {
  isEnabled: () => boolean;
}

export function createCircuitBreakerAPI(context: CircuitBreakerAPIContext) {
  const isEnabled = context.isEnabled;

  return {
    getStatus: function() {
      if (!CircuitBreakerModule) {
        return { enabled: false };
      }
      return {
        enabled: isEnabled(),
        health: CircuitBreakerModule.healthCheck(),
        info: CircuitBreakerModule.info()
      };
    },

    getBreaker: function(moduleId: string, config: Record<string, unknown>) {
      if (!CircuitBreakerModule) return null;
      return CircuitBreakerModule.getBreaker(moduleId, config);
    },

    getOpenBreakers: function() {
      if (!CircuitBreakerModule) return [];
      return CircuitBreakerModule.getOpenBreakers();
    },

    getOpenCount: function() {
      if (!CircuitBreakerModule) return 0;
      return CircuitBreakerModule.getOpenCount();
    }
  };
}

export default { createCircuitBreakerAPI };
