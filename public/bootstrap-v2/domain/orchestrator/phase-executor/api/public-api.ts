// Public API
// @version 3.1.1-CONTRACTS
// @changelog v3.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: VERSION from ../constants.js
// RECEIVES (via createPublicAPI options):
//   options.moduleId, phaseResults, phaseMetrics,
//   options.breakerManager, circuitBreakerEnabled, notificationsEnabled
// PROVIDES: getPhaseResult(), getMetrics(), info(), reset()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from '../constants.js';

export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.api.public-api';

interface PublicAPIOptions {
  moduleId: string;
  phaseResults: Record<string, unknown>;
  phaseMetrics: Record<string, Function>;
  breakerManager: Record<string, Function>;
  circuitBreakerEnabled: boolean;
  notificationsEnabled: boolean;
}

export function createPublicAPI(options: PublicAPIOptions) {
  var moduleId = options.moduleId;
  var phaseResults = options.phaseResults;
  var phaseMetrics = options.phaseMetrics;
  var breakerManager = options.breakerManager;
  var circuitBreakerEnabled = options.circuitBreakerEnabled;
  var notificationsEnabled = options.notificationsEnabled;

  return {
    getPhaseCircuitBreaker: function(phaseId: string) {
      return breakerManager.getPhaseBreaker(phaseId);
    },

    getCircuitBreakerStatus: function() {
      return breakerManager.getStatus();
    },

    getMemoryMetrics: function() {
      return phaseMetrics.getMemoryMetrics();
    },

    getPhaseResult: function(phaseId: string) {
      return phaseResults[phaseId];
    },

    getPhaseResults: function() {
      return Object.assign({}, phaseResults);
    },

    getMetrics: function() {
      return phaseMetrics.getMetrics();
    },

    reset: function() {
      for (var key in phaseResults) {
        delete phaseResults[key];
      }
      phaseMetrics.reset();
    },

    info: function() {
      return {
        moduleId: moduleId,
        version: VERSION,
        modular: true,
        circuitBreakerEnabled: circuitBreakerEnabled,
        notificationsEnabled: notificationsEnabled,
        metrics: phaseMetrics.getMetrics(),
        circuitBreaker: breakerManager.getStatus(),
        improvements: ['#3-CircuitBreakerIntegration', '#6-MemoryMetrics', '#25-DegradationNotifier', 'MODULAR-ARCHITECTURE']
      };
    }
  };
}

export default { createPublicAPI };
