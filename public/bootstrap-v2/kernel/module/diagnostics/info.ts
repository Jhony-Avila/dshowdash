// Kernel Info
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: MODULE_ID, VERSION from ../constants-local.js
// RECEIVES (via createInfoReporter context):
//   context.getMode, isInitialized, modeHistoryManager,
//   context.capabilityManager, healthManager, listeners, cleanups,
//   context.getSyncEnabled, getCircuitBreakerEnabled/Status,
//   context.getBootContext, getHealthAggregator, getOrchestrator,
//   context.getStateMachine, getEventBus
// PROVIDES: info()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID, VERSION } from '../constants-local.js';

interface InfoReporterContext {
  getMode: () => string;
  isInitialized: () => boolean;
  getInitTimestamp: () => number | null;
  getLastModeChange: () => number | null;
  modeHistoryManager: { getLength: () => number };
  listeners: unknown[];
  cleanups: unknown[];
  getSyncEnabled: () => boolean;
  getLastSyncedState: () => string | null;
  getCircuitBreakerEnabled: () => boolean;
  getCircuitBreakerStatus: () => Record<string, unknown>;
  capabilityManager: { info: () => Record<string, unknown> };
  healthManager: Record<string, unknown>;
  getBootContext: () => Record<string, unknown> | null;
  getHealthAggregator: () => Record<string, unknown> | null;
  getOrchestrator: () => unknown;
  getStateMachine: () => unknown;
  getEventBus: () => unknown;
}

export function createInfoReporter(context: InfoReporterContext) {
  const getMode = context.getMode;
  const isInitialized = context.isInitialized;
  const getInitTimestamp = context.getInitTimestamp;
  const getLastModeChange = context.getLastModeChange;
  const modeHistoryManager = context.modeHistoryManager;
  const listeners = context.listeners;
  const cleanups = context.cleanups;
  const getSyncEnabled = context.getSyncEnabled;
  const getLastSyncedState = context.getLastSyncedState;
  const getCircuitBreakerEnabled = context.getCircuitBreakerEnabled;
  const getCircuitBreakerStatus = context.getCircuitBreakerStatus;
  const capabilityManager = context.capabilityManager;
  const healthManager = context.healthManager;
  const getBootContext = context.getBootContext;
  const getHealthAggregator = context.getHealthAggregator;
  const getOrchestrator = context.getOrchestrator;
  const getStateMachine = context.getStateMachine;
  const getEventBus = context.getEventBus;

  return {
    info: function() {
      const healthAgg = getHealthAggregator();
      const bootContext = getBootContext();
      const cbStatus = getCircuitBreakerStatus();

      return {
        moduleId: MODULE_ID,
        version: VERSION,
        modular: true,
        mode: getMode(),
        initialized: isInitialized(),
        initTimestamp: getInitTimestamp(),
        lastModeChange: getLastModeChange(),
        modeHistoryLength: modeHistoryManager.getLength(),
        listeners: listeners.length,
        cleanups: cleanups.length,
        syncEnabled: getSyncEnabled(),
        lastSyncedState: getLastSyncedState(),
        circuitBreakerEnabled: getCircuitBreakerEnabled(),
        circuitBreakerOpenCount: cbStatus.enabled && cbStatus.health ? (cbStatus.health as Record<string, number>).open : 0,
        hasBootContext: !!bootContext,
        hasHealthAggregator: !!healthAgg,
        hasOrchestrator: !!getOrchestrator(),
        hasStateMachine: !!getStateMachine(),
        hasEventBus: !!getEventBus(),
        capabilities: capabilityManager.info(),
        health: healthAgg && typeof healthAgg.info === 'function' ? healthAgg.info() : null,
        context: bootContext && typeof bootContext.info === 'function' ? bootContext.info() : null,
        circuitBreaker: cbStatus,
        improvements: ['#3-CircuitBreakerIntegration', '#10-StateMachineSync', '#26-CleanupListeners', 'MODULAR-ARCHITECTURE']
      };
    }
  };
}

export default { createInfoReporter };
