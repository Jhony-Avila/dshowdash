
// Application Kernel - Runtime Authority
// @version 2.0.0-STEP8
// @description Facade unificada do Kernel - fonte única de verdade do sistema
// @changelog v2.0.0-STEP8 - Etapa 8 Fase 2: Propaga windowAdapter para instance-manager (expose Kernel)
// @changelog v1.6.0-DOMAIN-PURE - window.RuntimeContext fallback → _resolveGlobal() via windowAdapter → window
// @changelog v1.5.0-P5 - Eliminar _runtimeContext redundante, delegar singleton ao runtime-context.js
// @changelog v1.4.0-P0 - Fix: RuntimeContext agora é exposto em window.RuntimeContext automaticamente
// @changelog v1.3.0-P0 - Adicionado RuntimeContext para Feature Kernels consumirem
// @changelog v1.2.0-MODULAR - Refatorado para arquitetura modular
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via getInstance options):
//   options.bootContext      — Boot context state
//   options.healthAggregator — Health aggregator instance
//   options.orchestrator     — Orchestrator reference
//   options.stateMachine     — State machine for sync
//   options.eventBus         — EventBus for kernel events
//   options.logger           — Logger instance
//   options.windowAdapter    — WindowAdapter for expose (v2.0.0-STEP8)
//
// IMPORTS:
//   KERNEL_MODES, KERNEL_EVENTS, CAPABILITIES, etc from ./constants.js
//   createCapabilityManager from ./capability-manager.js
//   Module composites from ./module/index.js
//   createRuntimeContext, getInstance, resetInstance from ./runtime-context.js
//
// RESOLVES RuntimeContext via:
//   1. getRuntimeContextInstance() — singleton managed by runtime-context.js
//   2. _resolveGlobal('RuntimeContext') — windowAdapter → window fallback
//
// CREATES: ApplicationKernel API object
// DELEGATES TO instance-manager.js:
//   window.Kernel, window.ApplicationKernel, windowAdapter.expose('Kernel')
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  KERNEL_MODES, KERNEL_EVENTS, CAPABILITIES, MODE_TRANSITIONS, BOOT_STATES,
  STATE_TO_MODE, mapStateToMode, isValidTransition, getDefaultCapabilities, getAllCapabilities, getAllModes
} from './constants.js';

import { createCapabilityManager } from './capability-manager.js';

import {
  MODULE_ID, VERSION,
  createLogger, createEmitter, createModeHistoryManager,
  setupCircuitBreakerIntegration, createCircuitBreakerHandlers, createCircuitBreakerAPI,
  setupStateMachineSync, createStateMachineSyncHandlers, createStateMachineSyncAPI,
  createModeManager, createModeQueries,
  createHealthManager, createStateSnapshotManager, createSubscriptionManager,
  createInitializer, createResetter,
  createInfoReporter, createHealthChecker,
  getInstance as getInstanceFromManager, resetInstance as resetInstanceFromManager
} from './module/index.js';

import {
  createRuntimeContext,
  getInstance as getRuntimeContextInstance,
  resetInstance as resetRuntimeContextInstance
} from './runtime-context.js';

// v1.6.0: Resolver globals via windowAdapter → window fallback
function _resolveGlobal(name: string) {
  if (typeof window === 'undefined') return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get(name);
    if (resolved) return resolved;
  }
  return (window as unknown as Record<string, unknown>)[name] || null;
}

interface KernelOptions {
  bootContext?: Record<string, unknown> | null;
  healthAggregator?: Record<string, unknown> | null;
  orchestrator?: Record<string, unknown> | null;
  stateMachine?: Record<string, unknown> | null;
  eventBus?: { emit?: (event: string, data: Record<string, unknown>) => void } | null;
  logger?: Record<string, Function> | null;
  windowAdapter?: Record<string, Function> | null;
}

function createApplicationKernel(options: KernelOptions) {
  if (options === undefined) options = {};

  // State
  var _bootContext = options.bootContext || null;
  var _healthAggregator = options.healthAggregator || null;
  var _orchestrator = options.orchestrator || null;
  var _stateMachine = options.stateMachine || null;
  var _eventBus = options.eventBus || null;
  var _logger = options.logger || null;
  var _mode = KERNEL_MODES.INITIALIZING;
  var _initialized = false;
  var _initTimestamp: number | null = null;
  var _lastModeChange: number | null = null;
  var _syncEnabled = false;
  var _lastSyncedState: string | null = null;
  var _circuitBreakerEnabled = false;
  var _listeners: Array<(payload: { event: string; data: Record<string, unknown> }) => void> = [];
  var _cleanups: Array<() => void> = [];

  // Create utilities
  var log = createLogger(_logger);
  var modeHistoryManager = createModeHistoryManager(50);
  var capabilityManager = createCapabilityManager({ initialMode: _mode, eventBus: _eventBus, logger: _logger });

  // Refs for modules
  var getModeRef = function() { return _mode; };
  var setModeRef = function(m: string) { _mode = m; };
  var setLastModeChange = function(t: number) { _lastModeChange = t; };

  // Create emitter
  var emit = createEmitter({ eventBus: _eventBus, listeners: _listeners, getMode: getModeRef, log: log });

  // Create health manager
  var healthManager = createHealthManager({
    getHealthAggregator: function() { return _healthAggregator; },
    getBootContext: function() { return _bootContext; }
  });

  // Create mode manager
  var modeManager = createModeManager({
    log: log, emit: emit, modeHistoryManager: modeHistoryManager, capabilityManager: capabilityManager,
    getModeRef: getModeRef, setModeRef: setModeRef, setLastModeChange: setLastModeChange
  });

  // Create circuit breaker handlers
  var cbHandlers = createCircuitBreakerHandlers({
    log: log, emit: emit, getMode: getModeRef,
    setModeInternal: modeManager.setModeInternal,
    checkIfDegraded: healthManager.checkIfDegraded,
    degradationThreshold: 1
  });

  // Create circuit breaker API
  var cbAPI = createCircuitBreakerAPI({ isEnabled: function() { return _circuitBreakerEnabled; } });

  // Create state machine sync handlers
  var smHandlers = createStateMachineSyncHandlers({
    getMode: getModeRef, setModeInternal: modeManager.setModeInternal,
    checkIfDegraded: healthManager.checkIfDegraded, emit: emit,
    setLastSyncedState: function(s: string) { _lastSyncedState = s; }
  });

  // Create state machine sync API
  var smAPI = createStateMachineSyncAPI({
    stateMachine: _stateMachine, getMode: getModeRef, setMode: modeManager.setMode,
    checkIfDegraded: healthManager.checkIfDegraded
  });

  // Setup functions
  function _setupStateMachineSync() {
    if (!_stateMachine) return { enabled: false };
    var result = setupStateMachineSync({
      stateMachine: _stateMachine, log: log, cleanups: _cleanups,
      onTransition: smHandlers.handleTransition,
      // @ts-expect-error strict migration — TS2322
      setLastSyncedState: function(s: string) { _lastSyncedState = s; }
    });
    _syncEnabled = result.enabled;
    return result;
  }

  function _setupCircuitBreakerIntegration() {
    var result = setupCircuitBreakerIntegration({
      log: log, cleanups: _cleanups, onEvent: cbHandlers.handleEvent
    });
    _circuitBreakerEnabled = result.enabled;
    return result;
  }

  // Create state snapshot manager
  var stateSnapshotManager = createStateSnapshotManager({
    getBootContext: function() { return _bootContext; }, getMode: getModeRef,
    isInitialized: function() { return _initialized; },
    getInitTimestamp: function() { return _initTimestamp; },
    getLastModeChange: function() { return _lastModeChange; },
    capabilityManager: capabilityManager, healthManager: healthManager,
    getSyncEnabled: function() { return _syncEnabled; },
    getLastSyncedState: function() { return _lastSyncedState; },
    getCircuitBreakerEnabled: function() { return _circuitBreakerEnabled; },
    getCircuitBreakerStatus: cbAPI.getStatus
  });

  // Create subscription manager
  var subscriptionManager = createSubscriptionManager({ listeners: _listeners, cleanups: _cleanups });

  // Create mode queries
  var modeQueries = createModeQueries({ getMode: getModeRef, isInitialized: function() { return _initialized; } });

  // Create initializer
  var initializer = createInitializer({
    log: log, emit: emit,
    setDependencies: function(deps: Record<string, unknown>) {
      _bootContext = (deps.bootContext as typeof _bootContext) || _bootContext;
      _healthAggregator = (deps.healthAggregator as typeof _healthAggregator) || _healthAggregator;
      _orchestrator = (deps.orchestrator as typeof _orchestrator) || _orchestrator;
      _stateMachine = (deps.stateMachine as typeof _stateMachine) || _stateMachine;
      _eventBus = (deps.eventBus as typeof _eventBus) || _eventBus;
      _logger = (deps.logger as typeof _logger) || _logger;
    },
    setInitTimestamp: function(t: number) { _initTimestamp = t; },
    setInitialized: function(v: boolean) { _initialized = v; },
    isInitialized: function() { return _initialized; },
    setupStateMachineSync: _setupStateMachineSync,
    setupCircuitBreakerIntegration: _setupCircuitBreakerIntegration,
    getSyncEnabled: function() { return _syncEnabled; },
    getCircuitBreakerEnabled: function() { return _circuitBreakerEnabled; }
  });

  // Create resetter
  var resetter = createResetter({
    log: log, cleanups: _cleanups, listeners: _listeners,
    capabilityManager: capabilityManager, modeHistoryManager: modeHistoryManager,
    resetState: function(state: Record<string, unknown>) {
      _mode = state.mode as string; _initialized = state.initialized as boolean; _initTimestamp = state.initTimestamp as number | null;
      _lastModeChange = state.lastModeChange as number | null; _syncEnabled = state.syncEnabled as boolean;
      _lastSyncedState = state.lastSyncedState as string | null; _circuitBreakerEnabled = state.circuitBreakerEnabled as boolean;
      _bootContext = state.bootContext as typeof _bootContext; _healthAggregator = state.healthAggregator as typeof _healthAggregator;
      _orchestrator = state.orchestrator as typeof _orchestrator; _stateMachine = state.stateMachine as typeof _stateMachine;
    }
  });

  // Create diagnostics
  var diagnosticsContext = {
    getMode: getModeRef, isInitialized: function() { return _initialized; },
    getInitTimestamp: function() { return _initTimestamp; }, getLastModeChange: function() { return _lastModeChange; },
    modeHistoryManager: modeHistoryManager, listeners: _listeners, cleanups: _cleanups,
    getSyncEnabled: function() { return _syncEnabled; }, getLastSyncedState: function() { return _lastSyncedState; },
    getCircuitBreakerEnabled: function() { return _circuitBreakerEnabled; }, getCircuitBreakerStatus: cbAPI.getStatus,
    capabilityManager: capabilityManager, healthManager: healthManager,
    getBootContext: function() { return _bootContext; }, getHealthAggregator: function() { return _healthAggregator; },
    getOrchestrator: function() { return _orchestrator; }, getStateMachine: function() { return _stateMachine; },
    getEventBus: function() { return _eventBus; }
  };

  var infoReporter = createInfoReporter(diagnosticsContext);
  var healthChecker = createHealthChecker(diagnosticsContext);

  // Build kernelAPI
  var kernelAPI = {
    initialize: initializer.initialize,
    reset: resetter.reset,
    getMode: modeManager.getMode,
    setMode: modeManager.setMode,
    getModeHistory: function() { return modeHistoryManager.getHistory(); },
    syncWithStateMachine: smAPI.sync,
    getCircuitBreakerStatus: cbAPI.getStatus,
    getCircuitBreaker: cbAPI.getBreaker,
    getOpenCircuitBreakers: cbAPI.getOpenBreakers,
    getState: stateSnapshotManager.getState,
    getSnapshot: stateSnapshotManager.getSnapshot,
    getHealth: healthManager.getHealth,
    getHealthStatus: healthManager.getHealthStatus,
    getHealthScore: healthManager.getHealthScore,
    isHealthy: healthManager.isHealthy,
    isCapabilityEnabled: function(c: string) { return capabilityManager.isEnabled(c); },
    enableCapability: function(c: string, r: string) { return capabilityManager.enable(c, r); },
    disableCapability: function(c: string, r: string) { return capabilityManager.disable(c, r); },
    getCapabilities: function() { return capabilityManager.getAll(); },
    getEnabledCapabilities: function() { return capabilityManager.getEnabled(); },
    canNavigate: function() { return capabilityManager.canNavigate(); },
    canAuthenticate: function() { return capabilityManager.canAuthenticate(); },
    canShowUI: function() { return capabilityManager.canShowUI(); },
    canShowShell: function() { return capabilityManager.canShowShell(); },
    canShowMainContent: function() { return capabilityManager.canShowMainContent(); },
    isReady: modeQueries.isReady,
    isDegraded: modeQueries.isDegraded,
    isNormal: modeQueries.isNormal,
    isFailed: modeQueries.isFailed,
    isInRecovery: modeQueries.isInRecovery,
    isInMaintenance: modeQueries.isInMaintenance,
    subscribe: subscriptionManager.subscribe,
    on: subscriptionManager.on,
    getBootContext: function() { return _bootContext; },
    getHealthAggregator: function() { return _healthAggregator; },
    getOrchestrator: function() { return _orchestrator; },
    getStateMachine: function() { return _stateMachine; },
    info: infoReporter.info,
    healthCheck: healthChecker.healthCheck,
    MODES: KERNEL_MODES,
    EVENTS: KERNEL_EVENTS,
    CAPABILITIES: CAPABILITIES,
    BOOT_STATES: BOOT_STATES,
    VERSION: VERSION,
    MODULE_ID: MODULE_ID
  };

  // P0→P5: getRuntimeContext delega inteiramente ao singleton do runtime-context.js
  (kernelAPI as any).getRuntimeContext = function() {
    // @ts-expect-error strict migration — TS2345
    return getRuntimeContextInstance(kernelAPI);
  };

  return kernelAPI;
}

function getInstance(options: KernelOptions) {
  // v2.0.0-STEP8: Propagar windowAdapter para instance-manager via options
  var kernel = getInstanceFromManager(
    createApplicationKernel as unknown as Parameters<typeof getInstanceFromManager>[0],
    options as unknown as Parameters<typeof getInstanceFromManager>[1]
  );

  // P5: Auto-initialize RuntimeContext via singleton do runtime-context.js
  if (kernel) {
    getRuntimeContextInstance(kernel);
  }

  return kernel;
}

function resetInstance() {
  resetInstanceFromManager();
  resetRuntimeContextInstance();
}

// v1.6.0: Acesso ao singleton do RuntimeContext via resolver AAA
function getRuntimeContext() {
  return getRuntimeContextInstance() || _resolveGlobal('RuntimeContext');
}

export {
  createApplicationKernel, getInstance, resetInstance,
  KERNEL_MODES, KERNEL_EVENTS, CAPABILITIES, BOOT_STATES, STATE_TO_MODE, mapStateToMode, MODULE_ID, VERSION,
  createRuntimeContext, getRuntimeContext
};

export default {
  createApplicationKernel: createApplicationKernel, getInstance: getInstance, resetInstance: resetInstance,
  KERNEL_MODES: KERNEL_MODES, KERNEL_EVENTS: KERNEL_EVENTS, CAPABILITIES: CAPABILITIES,
  BOOT_STATES: BOOT_STATES, STATE_TO_MODE: STATE_TO_MODE, mapStateToMode: mapStateToMode,
  MODULE_ID: MODULE_ID, VERSION: VERSION,
  createRuntimeContext: createRuntimeContext, getRuntimeContext: getRuntimeContext
};
