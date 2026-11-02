// Kernel Health Check
// @version 1.2.3-CONTRACTS
// @changelog v1.2.3-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.2 - Changed to absolute path for circuit-breaker import
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.3)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   MODULE_ID, VERSION from ../constants-local.js
//   KERNEL_MODES from ../../constants.js
//   CircuitBreakerModule from /bootstrap-v2/domain/circuit-breaker.js
// RECEIVES (via createHealthChecker context):
//   context.getMode, isInitialized, healthManager,
//   context.capabilityManager, getSyncEnabled,
//   context.getCircuitBreakerEnabled, cleanups
// PROVIDES: healthCheck()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID, VERSION } from '../constants-local.js';
import { KERNEL_MODES } from '../../constants.js';
import * as CircuitBreakerModule from '/bootstrap-v2/domain/circuit-breaker.js';

interface HealthCheckerContext {
  getMode: () => string;
  isInitialized: () => boolean;
  healthManager: { getHealthScore: () => number };
  capabilityManager: { getEnabled: () => string[] };
  getSyncEnabled: () => boolean;
  getCircuitBreakerEnabled: () => boolean;
  cleanups: Array<() => void>;
}

export function createHealthChecker(context: HealthCheckerContext) {
  const getMode = context.getMode;
  const isInitialized = context.isInitialized;
  const healthManager = context.healthManager;
  const capabilityManager = context.capabilityManager;
  const getSyncEnabled = context.getSyncEnabled;
  const getCircuitBreakerEnabled = context.getCircuitBreakerEnabled;
  const cleanups = context.cleanups;

  return {
    healthCheck: function() {
      const mode = getMode();
      let status = 'HEALTHY';

      if (!isInitialized()) status = 'INITIALIZING';
      else if (mode === KERNEL_MODES.FAILED) status = 'FAILED';
      else if (mode === KERNEL_MODES.DEGRADED) status = 'DEGRADED';

      const cbHealth = CircuitBreakerModule ? CircuitBreakerModule.healthCheck() : null;
      if (cbHealth && cbHealth.status === 'CRITICAL') {
        status = 'CRITICAL';
      } else if (cbHealth && cbHealth.status === 'DEGRADED' && status === 'HEALTHY') {
        status = 'DEGRADED';
      }

      return {
        status: status,
        moduleId: MODULE_ID,
        version: VERSION,
        modular: true,
        mode: mode,
        initialized: isInitialized(),
        healthScore: healthManager.getHealthScore(),
        enabledCapabilities: capabilityManager.getEnabled().length,
        syncEnabled: getSyncEnabled(),
        circuitBreakerEnabled: getCircuitBreakerEnabled(),
        circuitBreakerHealth: cbHealth,
        cleanupCount: cleanups.length,
        timestamp: Date.now()
      };
    }
  };
}

export default { createHealthChecker };
