// Kernel Initialize
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_EVENTS from ../../constants.js
// RECEIVES (via createInitializer context):
//   context.log, emit, setDependencies, setInitTimestamp,
//   context.setInitialized, isInitialized,
//   context.setupStateMachineSync, setupCircuitBreakerIntegration
// PROVIDES: initialize()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_EVENTS } from '../../constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.lifecycle.initialize';

interface InitializerContext {
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
  emit: (event: string, data: Record<string, unknown>) => void;
  setDependencies: (deps: Record<string, unknown>) => void;
  setInitTimestamp: (t: number) => void;
  setInitialized: (v: boolean) => void;
  isInitialized: () => boolean;
  setupStateMachineSync: () => { enabled: boolean };
  setupCircuitBreakerIntegration: () => { enabled: boolean };
  getSyncEnabled: () => boolean;
  getCircuitBreakerEnabled: () => boolean;
}

export function createInitializer(context: InitializerContext) {
  var log = context.log;
  var emit = context.emit;
  var setDependencies = context.setDependencies;
  var setInitTimestamp = context.setInitTimestamp;
  var setInitialized = context.setInitialized;
  var isInitialized = context.isInitialized;
  var setupStateMachineSync = context.setupStateMachineSync;
  var setupCircuitBreakerIntegration = context.setupCircuitBreakerIntegration;
  var getSyncEnabled = context.getSyncEnabled;
  var getCircuitBreakerEnabled = context.getCircuitBreakerEnabled;

  return {
    initialize: function(dependencies: Record<string, unknown>) {
      if (dependencies === undefined) dependencies = {};

      if (isInitialized()) {
        log('warn', 'Kernel already initialized');
        return { success: false, reason: 'ALREADY_INITIALIZED' };
      }

      setDependencies(dependencies);
      var timestamp = Date.now();
      setInitTimestamp(timestamp);
      setInitialized(true);

      // Setup integrations
      var smResult = setupStateMachineSync();
      var cbResult = setupCircuitBreakerIntegration();

      log('info', 'Kernel initialized', {
        hasBootContext: !!dependencies.bootContext,
        hasHealthAggregator: !!dependencies.healthAggregator,
        hasOrchestrator: !!dependencies.orchestrator,
        hasStateMachine: !!dependencies.stateMachine,
        hasEventBus: !!dependencies.eventBus,
        syncEnabled: smResult.enabled,
        circuitBreakerEnabled: cbResult.enabled
      });

      emit(KERNEL_EVENTS.INITIALIZED, {
        timestamp: timestamp,
        circuitBreakerEnabled: cbResult.enabled
      });

      return {
        success: true,
        timestamp: timestamp,
        syncEnabled: smResult.enabled,
        circuitBreakerEnabled: cbResult.enabled
      };
    }
  };
}

export default { createInitializer };
