// Circuit Breaker Manager
// @version 3.1.2-CONTRACTS
// @changelog v3.1.2-CONTRACTS: Dependency Contract formalizado
// @changelog v3.1.1 - Fixed circuit-breaker import path to absolute
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.2)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: CircuitBreakerRegistry from /bootstrap-v2/domain/circuit-breaker.js
// RECEIVES (via createBreakerManager config):
//   config.enabled, config.breakerConfig
// PROVIDES: isEnabled(), getPhaseBreaker(), getStatus()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as CircuitBreakerRegistry from '/bootstrap-v2/domain/circuit-breaker.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.circuit-breaker.breaker-manager';

interface BreakerManagerConfig {
  enabled?: boolean;
  breakerConfig: Record<string, unknown>;
}

export function createBreakerManager(config: BreakerManagerConfig) {
  const enabled = config.enabled !== false;
  const breakerConfig = config.breakerConfig;

  return {
    isEnabled: function() {
      return enabled;
    },

    getPhaseBreaker: function(phaseId: string) {
      if (!enabled || !CircuitBreakerRegistry) {
        return null;
      }
      return CircuitBreakerRegistry.getBreaker('phase:' + phaseId, breakerConfig);
    },

    getAllPhaseBreakers: function() {
      if (!enabled || !CircuitBreakerRegistry) {
        return {};
      }
      
      const allBreakers = CircuitBreakerRegistry.getAllBreakers();
      const phaseBreakers: Record<string, unknown> = {};

      for (const key in allBreakers) {
        if (key.indexOf('phase:') === 0) {
          phaseBreakers[key] = (allBreakers as Record<string, unknown>)[key];
        }
      }
      
      return phaseBreakers;
    },

    getStatus: function() {
      if (!enabled || !CircuitBreakerRegistry) {
        return { enabled: false };
      }
      
      return {
        enabled: true,
        breakers: this.getAllPhaseBreakers(),
        openCount: CircuitBreakerRegistry.getOpenCount(),
        health: CircuitBreakerRegistry.healthCheck()
      };
    }
  };
}

export default { createBreakerManager };
