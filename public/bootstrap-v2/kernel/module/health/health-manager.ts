// Health Manager
// @version 1.2.3-CONTRACTS
// @changelog v1.2.3-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.2 - Changed to absolute path for circuit-breaker import
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.3)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: CircuitBreakerModule from /bootstrap-v2/domain/circuit-breaker.js
// RECEIVES (via createHealthManager context):
//   context.getHealthAggregator, context.getBootContext
// PROVIDES: getHealth(), isHealthy(), checkIfDegraded()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as CircuitBreakerModule from '/bootstrap-v2/domain/circuit-breaker.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.health.health-manager';

interface HealthAggregator {
  calculate?: () => Record<string, unknown>;
  getStatus?: () => string;
  getScore?: () => number;
  [key: string]: unknown;
}

interface BootContext {
  getSnapshot?: () => Record<string, unknown>;
  [key: string]: unknown;
}

interface HealthManagerContext {
  getHealthAggregator: () => HealthAggregator | null;
  getBootContext: () => BootContext | null;
}

export function createHealthManager(context: HealthManagerContext) {
  const getHealthAggregator = context.getHealthAggregator;
  const getBootContext = context.getBootContext;

  return {
    getHealth: function() {
      const healthAgg = getHealthAggregator();
      if (healthAgg && healthAgg.calculate) {
        return healthAgg.calculate();
      }
      return null;
    },

    getHealthStatus: function() {
      const healthAgg = getHealthAggregator();
      if (healthAgg && healthAgg.getStatus) {
        return healthAgg.getStatus();
      }
      return 'UNKNOWN';
    },

    getHealthScore: function() {
      const healthAgg = getHealthAggregator();
      if (healthAgg && healthAgg.getScore) {
        return healthAgg.getScore();
      }
      return 0;
    },

    isHealthy: function() {
      if (CircuitBreakerModule && CircuitBreakerModule.getOpenCount && CircuitBreakerModule.getOpenCount() > 0) {
        return false;
      }
      return this.getHealthStatus() === 'HEALTHY';
    },

    checkIfDegraded: function() {
      if (CircuitBreakerModule && CircuitBreakerModule.getOpenCount && CircuitBreakerModule.getOpenCount() > 0) {
        return true;
      }

      const bootContext = getBootContext();
      if (bootContext && bootContext.getSnapshot) {
        const snapshot = bootContext.getSnapshot();
        if (snapshot && (snapshot.degradationCount as number) > 0) {
          return true;
        }
      }

      const healthAgg = getHealthAggregator();
      if (healthAgg && healthAgg.getStatus) {
        const status = healthAgg.getStatus();
        if (status === 'DEGRADED') {
          return true;
        }
      }

      return false;
    }
  };
}

export default { createHealthManager };
