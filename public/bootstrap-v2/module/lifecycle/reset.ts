// Reset Manager
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   resetSingletonState from ../singleton/index.js
//   resetBootLoopStatus from ../boot-loop/index.js
//   stopPeriodicHealthCheck from ../periodic-health/index.js
// RECEIVES (via createResetManager context):
//   context.orchestrator, stateMachine, kernel, globalTimeout,
//   context.degradationNotifier, loggerAdapter, bootExecutor,
//   context.cleanups, listeners, dependencyGraphRef,
//   context.periodicHealthStartedRef
// PROVIDES: reset(), resetBootLoopTracker()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { resetSingletonState } from '../singleton/index.js';
import { resetBootLoopStatus } from '../boot-loop/index.js';
import { stopPeriodicHealthCheck } from '../periodic-health/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.lifecycle.reset';

interface ResetContext {
  orchestrator: Record<string, Function>;
  stateMachine: { reset: () => void } | null;
  kernel: { reset: () => void } | null;
  globalTimeout: { clear: (reason: string) => void } | null;
  degradationNotifier: { reset?: () => void } | null;
  loggerAdapter: { info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void };
  bootExecutor: { setResult: (r: null) => void };
  cleanups: Array<(() => void) | unknown>;
  listeners: unknown[];
  dependencyGraphRef: { value: unknown };
  periodicHealthStartedRef: { value: boolean };
}

export function createResetManager(context: ResetContext) {
  const orchestrator = context.orchestrator;
  const stateMachine = context.stateMachine;
  const kernel = context.kernel;
  const globalTimeout = context.globalTimeout;
  const degradationNotifier = context.degradationNotifier;
  const loggerAdapter = context.loggerAdapter;
  const bootExecutor = context.bootExecutor;
  const cleanups = context.cleanups;
  const listeners = context.listeners;
  const dependencyGraphRef = context.dependencyGraphRef;
  const periodicHealthStartedRef = context.periodicHealthStartedRef;
  
  function reset() {
    // Clear global timeout
    if (globalTimeout) {
      globalTimeout.clear('reset');
    }
    
    // Stop periodic health check
    const healthAgg = orchestrator.getHealthAggregator();
    stopPeriodicHealthCheck(healthAgg);
    periodicHealthStartedRef.value = false;
    
    // Reset degradation notifier
    if (degradationNotifier && degradationNotifier.reset) {
      degradationNotifier.reset();
    }
    
    // Execute cleanups
    for (let i = 0; i < cleanups.length; i++) {
      try {
        const cleanup = cleanups[i];
        if (typeof cleanup === 'function') {
          cleanup();
        }
      } catch (e) {
        loggerAdapter.warn('Cleanup failed', { index: i, error: (e as Error).message });
      }
    }
    cleanups.length = 0;
    listeners.length = 0;
    
    // Reset boot result
    bootExecutor.setResult(null);
    
    // Reset orchestrator
    orchestrator.reset();
    
    // Reset state machine
    if (stateMachine) {
      stateMachine.reset();
    }
    
    // Clear dependency graph ref
    dependencyGraphRef.value = null;
    
    // Reset kernel
    if (kernel) {
      kernel.reset();
    }
    
    // Reset singleton state
    resetSingletonState();
    
    loggerAdapter.info('Bootstrap reset (Modular Architecture)');
  }
  
  function resetBootLoopTracker() {
    resetBootLoopStatus();
    loggerAdapter.info('Boot loop tracker reset');
  }
  
  return {
    reset: reset,
    resetBootLoopTracker: resetBootLoopTracker
  };
}

export default { createResetManager };
