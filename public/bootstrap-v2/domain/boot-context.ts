
// Boot Context - Single Source of Truth for Boot State
// @version 1.2.0-HEALTH-CONTRACT
// @description Objeto formal que representa o estado final do bootstrap
// @changelog v1.2.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-MODULAR - Refatorado para arquitetura modular
// @changelog v1.1.0-QUICKWINS - QW#24 Registro de Warnings, QW#09 Evento de Progresso
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   MODULE_ID, VERSION, CONTEXT_STATES, PROGRESS_EVENTS,
//   createStateStore, createProgressTracker, createHealthCalculator,
//   createPhaseManager, createFeatureChecker, createSnapshotBuilder
//   from ./context/index.js
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//
// RECEIVES (via createBootContext options):
//   options — Currently unused, reserved for future config
//
// PROVIDES:
//   createBootContext() — Factory for boot context
//   getInstance()      — Singleton accessor
//   resetInstance()    — Singleton reset
//
// WINDOW ACCESS: None (fully injection-driven)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  MODULE_ID,
  VERSION as CONTEXT_VERSION,
  CONTEXT_STATES,
  PROGRESS_EVENTS,
  createStateStore,
  createProgressTracker,
  createHealthCalculator,
  createPhaseManager,
  createFeatureChecker,
  createSnapshotBuilder
} from './context/index.js';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

const VERSION = '1.2.0-HEALTH-CONTRACT';

export { CONTEXT_STATES, PROGRESS_EVENTS, MODULE_ID };
export { VERSION };

// Types
interface BootContextOptions {
  [key: string]: unknown;
}

interface BootContextEvent {
  event: string;
  data: unknown;
  timestamp: number;
}

interface WarningInput {
  phase?: string | null;
  type?: string;
  message?: string;
  data?: unknown;
}

// Factory para criar o contexto de boot
function createBootContext(options?: BootContextOptions) {
  if (options === undefined) options = {};

  let _listeners: Array<(event: BootContextEvent) => void> = [];

  // Notificar listeners
  function notifyListeners(event: string, data: unknown) {
    for (let i = 0; i < _listeners.length; i++) {
      try {
        _listeners[i]({ event: event, data: data, timestamp: Date.now() });
      } catch (e) {}
    }
  }

  // Criar componentes modulares
  const stateStore = createStateStore();

  const progressTracker = createProgressTracker({
    stateStore: stateStore,
    notifyListeners: notifyListeners
  });

  const healthCalculator = createHealthCalculator({
    stateStore: stateStore
  });

  const phaseManager = createPhaseManager({
    stateStore: stateStore,
    healthCalculator: healthCalculator,
    progressTracker: progressTracker,
    notifyListeners: notifyListeners
  });

  const featureChecker = createFeatureChecker({
    stateStore: stateStore
  });

  const snapshotBuilder = createSnapshotBuilder({
    stateStore: stateStore
  });

  // === LIFECYCLE ===

  function start() {
    stateStore.setStatus(CONTEXT_STATES.INITIALIZING);
    stateStore.startMetrics();
    progressTracker.start();
    notifyListeners('start', { state: stateStore.getStatus(), timestamp: Date.now() });
  }

  function complete(success: boolean) {
    stateStore.endMetrics();
    const degradations = stateStore.getDegradations();
    const metrics = stateStore.getMetrics();

    if (success && degradations.length === 0) {
      stateStore.setStatus(CONTEXT_STATES.READY);
    } else if (success && degradations.length > 0) {
      stateStore.setStatus(CONTEXT_STATES.DEGRADED);
    } else {
      stateStore.setStatus(CONTEXT_STATES.FAILED);
    }

    progressTracker.onComplete(success, stateStore.getStatus(), metrics.totalTime);
    healthCalculator.recalculate();
    notifyListeners('complete', snapshotBuilder.build());
  }

  function reset() {
    stateStore.reset();
    _listeners = [];
  }

  // === SETTERS ===

  function setAuth(authState: Record<string, unknown>) {
    stateStore.setAuth(authState);
    notifyListeners('auth', stateStore.getAuth());
  }

  function setPermissions(permState: Record<string, unknown>) {
    stateStore.setPermissions(permState);
    notifyListeners('permissions', stateStore.getPermissions());
  }

  function setNavigation(navState: Record<string, unknown>) {
    stateStore.setNavigation(navState);
    notifyListeners('navigation', stateStore.getNavigation());
  }

  function setUI(uiState: Record<string, unknown>) {
    stateStore.setUI(uiState);
    notifyListeners('ui', stateStore.getUI());
  }

  function addWarning(warning: WarningInput) {
    stateStore.addWarning({
      phase: warning.phase || null,
      type: warning.type || 'general',
      message: warning.message || 'Unknown warning',
      data: warning.data || null,
      timestamp: Date.now()
    });
    notifyListeners('warning', stateStore.getWarnings()[stateStore.getWarnings().length - 1]);
  }

  // === GETTERS ===

  function isReady() {
    const status = stateStore.getStatus();
    return status === CONTEXT_STATES.READY || status === CONTEXT_STATES.DEGRADED;
  }

  function isDegraded() {
    const status = stateStore.getStatus();
    return status === CONTEXT_STATES.DEGRADED || stateStore.getDegradations().length > 0;
  }

  function isFailed() {
    return stateStore.getStatus() === CONTEXT_STATES.FAILED;
  }

  // === SUBSCRIPTIONS ===

  function subscribe(callback: (event: BootContextEvent) => void) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
      return function unsubscribe() {
        const idx = _listeners.indexOf(callback);
        if (idx !== -1) _listeners.splice(idx, 1);
      };
    }
    return function() {};
  }

  // === META ===

  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      state: stateStore.getStatus(),
      health: stateStore.getHealth(),
      healthScore: stateStore.getHealthScore(),
      phasesCompleted: phaseManager.getPhasesCount(),
      degradations: stateStore.getDegradations().length,
      errors: stateStore.getErrors().length,
      warnings: stateStore.getWarnings().length,
      listeners: _listeners.length,
      progress: stateStore.getProgress(),
      quickWinsApplied: ['QW09-Progress', 'QW24-Warnings'],
      modular: true
    };
  }

  function healthCheck() {
    const ctxStatus = stateStore.getStatus();

    let status: string = HEALTH_STATUS.HEALTHY;
    if (ctxStatus === CONTEXT_STATES.FAILED) {
      status = HEALTH_STATUS.UNHEALTHY;
    } else if (ctxStatus === CONTEXT_STATES.DEGRADED) {
      status = HEALTH_STATUS.DEGRADED;
    } else if (ctxStatus !== CONTEXT_STATES.READY) {
      status = HEALTH_STATUS.DEGRADED;
    }

    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        contextReady: ctxStatus === CONTEXT_STATES.READY || ctxStatus === CONTEXT_STATES.DEGRADED,
        noErrors: stateStore.getErrors().length === 0,
        noWarnings: stateStore.getWarnings().length === 0
      },
      details: {
        bootHealth: stateStore.getHealth(),
        bootHealthScore: stateStore.getHealthScore(),
        warningCount: stateStore.getWarnings().length,
        modular: true
      }
    });
  }

  return {
    // Lifecycle
    start: start,
    complete: complete,
    reset: reset,

    // Setters
    setPhaseResult: phaseManager.setResult,
    setAuth: setAuth,
    setPermissions: setPermissions,
    setNavigation: setNavigation,
    setUI: setUI,
    addWarning: addWarning,

    // Getters
    getSnapshot: snapshotBuilder.build,
    getProgress: progressTracker.getProgress,
    getWarnings: function() { return stateStore.getWarnings().slice(); },
    isReady: isReady,
    isDegraded: isDegraded,
    isFailed: isFailed,
    isFeatureDisabled: featureChecker.isDisabled,
    isFeatureAllowed: featureChecker.isAllowed,

    // Subscriptions
    subscribe: subscribe,

    // Meta
    info: info,
    healthCheck: healthCheck,

    // Constants
    STATES: CONTEXT_STATES,
    PROGRESS_EVENTS: PROGRESS_EVENTS
  };
}

// Singleton instance
let _instance: ReturnType<typeof createBootContext> | null = null;

function getInstance() {
  if (!_instance) {
    _instance = createBootContext();
  }
  return _instance;
}

function resetInstance() {
  if (_instance) {
    _instance.reset();
  }
  _instance = null;
}

export {
  createBootContext,
  getInstance,
  resetInstance
};

export default {
  createBootContext: createBootContext,
  getInstance: getInstance,
  resetInstance: resetInstance,
  CONTEXT_STATES: CONTEXT_STATES,
  PROGRESS_EVENTS: PROGRESS_EVENTS,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
