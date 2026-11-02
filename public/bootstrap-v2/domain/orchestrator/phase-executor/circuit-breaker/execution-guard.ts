// Circuit Breaker Execution Guard
// @version 3.1.2-CONTRACTS
// @changelog v3.1.2-CONTRACTS: Dependency Contract formalizado
// @changelog v3.1.1 - Fixed degradation-notifier import path to absolute
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.2)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: DegradationNotifier from /bootstrap-v2/domain/degradation-notifier.js
// RECEIVES (via createExecutionGuard options):
//   options.breakerManager, helpers, metrics, notificationsEnabled
// PROVIDES: canExecute() — check circuit breaker before phase execution
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as DegradationNotifier from '/bootstrap-v2/domain/degradation-notifier.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.circuit-breaker.execution-guard';

interface ExecutionGuardOptions {
  breakerManager: Record<string, Function>;
  helpers: Record<string, Function>;
  metrics: Record<string, Function>;
  notificationsEnabled: boolean;
}

export function createExecutionGuard(options: ExecutionGuardOptions) {
  const breakerManager = options.breakerManager;
  const helpers = options.helpers;
  const metrics = options.metrics;
  const notificationsEnabled = options.notificationsEnabled;

  return {
    canExecute: function(phaseId: string, manifestConfig: Record<string, unknown> | null) {
      if (!breakerManager.isEnabled()) {
        return { canExecute: true };
      }
      
      if (manifestConfig && manifestConfig.circuitBreaker === false) {
        return { canExecute: true };
      }
      
      const breaker = breakerManager.getPhaseBreaker(phaseId);
      if (!breaker) {
        return { canExecute: true };
      }
      
      const canExecute = breaker.canExecute();
      
      if (!canExecute) {
        helpers.log('warn', 'Phase ' + phaseId + ' skipped - Circuit Breaker OPEN', {
          breakerState: breaker.getState(),
          stats: breaker.getStats()
        });
        
        metrics.incrementCircuitBreakerTrips();
        
        if (notificationsEnabled && DegradationNotifier) {
          DegradationNotifier.notifyCircuitBreakerOpen('phase:' + phaseId, breaker.getStats());
        }
      }
      
      return {
        canExecute: canExecute,
        breaker: breaker,
        state: breaker.getState()
      };
    }
  };
}

export default { createExecutionGuard };
