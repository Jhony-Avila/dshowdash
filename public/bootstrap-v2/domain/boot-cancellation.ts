
// Boot Cancellation - API for cancelling boot in progress
// @version 1.1.0-DOMAIN-PURE
// @description #17 - Permite cancelamento do boot em andamento com cleanup
// @changelog v1.1.0-DOMAIN-PURE - Eliminado window.EventBus direto → EventBus via init() + BOOT_EVENTS.CANCELLED. window.__BOOTSTRAP_V2_STATE__ → getter injetável
// @changelog v1.0.0-PERFORMANCE - Implementação inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// OPTIONAL (via init(options)):
//   options.eventBus       — EventBus instance for emitting BOOT_EVENTS.CANCELLED
//                            Tolerant when absent: cancellation works, just skips emit
//   options.getBootState   — Function returning { state: 'running'|'starting'|... }
//                            Replaces window.__BOOTSTRAP_V2_STATE__ access
//                            Tolerant when absent: canCancel() returns false
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'boot-cancellation';
var VERSION = '1.2.0-HEALTH-CONTRACT';

// Types
interface EventBusLike {
  emit: (event: string, data: Record<string, unknown>) => void;
}

interface BootStateLike {
  state: string;
}

interface CancellationEvent {
  cancelled: boolean;
  reason: string | null;
  phase: string | null;
  timestamp: number | null;
}

interface CancellationHistoryEntry {
  timestamp: number | null;
  reason: string | null;
  phase: string | null;
}

interface CancelOptions {
  eventBus?: EventBusLike;
  getBootState?: () => BootStateLike;
}

interface CancelRequestOptions {
  currentPhase?: string;
}

// Injected dependencies
var _eventBus: EventBusLike | null = null;
var _getBootState: (() => BootStateLike) | null = null;

// Cancellation state
var _state: {
  cancelled: boolean;
  cancelledAt: number | null;
  reason: string | null;
  phase: string | null;
  abortController: AbortController | null;
} = {
  cancelled: false,
  cancelledAt: null,
  reason: null,
  phase: null,
  abortController: null
};

// Listeners for cancellation
var _listeners: Array<(event: CancellationEvent) => void> = [];

// Cancellation history
var _history: CancellationHistoryEntry[] = [];
var _maxHistory = 20;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION (v1.1.0: dependency injection)
// ═══════════════════════════════════════════════════════════════

function init(options: CancelOptions) {
  if (options === undefined) options = {};
  _eventBus = options.eventBus || null;
  _getBootState = options.getBootState || null;
  return { initialized: true, hasEventBus: !!_eventBus, hasBootStateGetter: !!_getBootState };
}

function setEventBus(eventBus: EventBusLike | null) {
  _eventBus = eventBus || null;
}

// ═══════════════════════════════════════════════════════════════
// ABORT CONTROLLER
// ═══════════════════════════════════════════════════════════════

// Create abort controller if available
function createAbortController() {
  if (typeof AbortController !== 'undefined') {
    _state.abortController = new AbortController();
    return _state.abortController;
  }
  return null;
}

// Get abort signal for fetch operations
function getAbortSignal() {
  if (_state.abortController) {
    return _state.abortController.signal;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// CANCELLATION API
// ═══════════════════════════════════════════════════════════════

// Check if cancellation was requested
function isCancelled() {
  return _state.cancelled === true;
}

// Check if cancellation is possible (boot in progress)
// v1.1.0: uses injected getter instead of window.__BOOTSTRAP_V2_STATE__
function canCancel() {
  var bootState = null;

  if (_getBootState && typeof _getBootState === 'function') {
    try {
      bootState = _getBootState();
    } catch (e) {
      return false;
    }
  }

  if (!bootState) return false;

  return bootState.state === 'running' || bootState.state === 'starting';
}

// Request cancellation
function cancel(reason: string, options?: CancelRequestOptions) {
  if (options === undefined) options = {};

  if (!canCancel()) {
    var currentBootState = null;
    if (_getBootState && typeof _getBootState === 'function') {
      try { currentBootState = _getBootState(); } catch (e) {}
    }
    return {
      success: false,
      error: 'Cannot cancel: boot is not in progress',
      state: currentBootState ? currentBootState.state : 'unknown'
    };
  }

  if (_state.cancelled) {
    return {
      success: false,
      error: 'Cancellation already requested',
      cancelledAt: _state.cancelledAt
    };
  }

  _state.cancelled = true;
  _state.cancelledAt = Date.now();
  _state.reason = reason || 'User requested cancellation';
  _state.phase = options.currentPhase || null;

  // Abort any pending fetch operations
  if (_state.abortController) {
    try {
      _state.abortController.abort();
    } catch (e) {}
  }

  // Record in history
  _history.unshift({
    timestamp: _state.cancelledAt,
    reason: _state.reason,
    phase: _state.phase
  });
  while (_history.length > _maxHistory) {
    _history.pop();
  }

  // Notify listeners
  var event = {
    cancelled: true,
    reason: _state.reason,
    phase: _state.phase,
    timestamp: _state.cancelledAt
  };

  _listeners.forEach(function(handler) {
    try { handler(event); } catch (e) {}
  });

  // v1.1.0: emit via injected EventBus (tolerant when absent)
  if (_eventBus && _eventBus.emit) {
    try {
      _eventBus.emit(BOOT_EVENTS.CANCELLED, event);
    } catch (e) {}
  }

  return {
    success: true,
    cancelledAt: _state.cancelledAt,
    reason: _state.reason
  };
}

// Subscribe to cancellation events
function onCancel(handler: (event: CancellationEvent) => void) {
  _listeners.push(handler);

  return function() {
    var idx = _listeners.indexOf(handler);
    if (idx !== -1) {
      _listeners.splice(idx, 1);
    }
  };
}

// Check cancellation at phase boundaries
function checkCancellation(phaseId: string) {
  if (_state.cancelled) {
    return {
      cancelled: true,
      reason: _state.reason,
      shouldAbort: true
    };
  }

  return {
    cancelled: false,
    shouldAbort: false
  };
}

// Create a cancellable promise wrapper
function makeCancellable<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>(function(resolve, reject) {
    var completed = false;
    var timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Check if already cancelled
    if (_state.cancelled) {
      reject(new Error('Boot was cancelled: ' + _state.reason));
      return;
    }

    // Setup cancellation listener
    var unsubscribe = onCancel(function(event: CancellationEvent) {
      if (!completed) {
        completed = true;
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error('Boot was cancelled: ' + event.reason));
      }
    });

    // Setup timeout if specified
    if (timeoutMs) {
      timeoutId = setTimeout(function() {
        if (!completed) {
          completed = true;
          unsubscribe();
          reject(new Error('Operation timed out after ' + timeoutMs + 'ms'));
        }
      }, timeoutMs);
    }

    // Execute promise
    promise.then(function(result: T) {
      if (!completed) {
        completed = true;
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribe();
        resolve(result);
      }
    }).catch(function(error: Error) {
      if (!completed) {
        completed = true;
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribe();
        reject(error);
      }
    });
  });
}

// Reset cancellation state (for new boot)
function reset() {
  _state = {
    cancelled: false,
    cancelledAt: null,
    reason: null,
    phase: null,
    abortController: null
  };
  _listeners = [];

  // Create new abort controller
  createAbortController();
}

// ═══════════════════════════════════════════════════════════════
// INFO / HEALTH / STATE
// ═══════════════════════════════════════════════════════════════

// Get cancellation state
function getState() {
  return {
    cancelled: _state.cancelled,
    cancelledAt: _state.cancelledAt,
    reason: _state.reason,
    phase: _state.phase,
    canCancel: canCancel()
  };
}

// Get cancellation history
function getHistory() {
  return _history.slice();
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: getState(),
    historyCount: _history.length,
    listenerCount: _listeners.length,
    hasAbortController: !!_state.abortController,
    hasEventBus: !!_eventBus,
    hasBootStateGetter: !!_getBootState,
    improvements: ['#17-BootCancellation']
  };
}

function healthCheck() {
  return createHealthResult({
    status: _state.cancelled ? HEALTH_STATUS.FAILED : HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      cancelled: _state.cancelled,
      canCancel: canCancel(),
      hasEventBus: !!_eventBus
    }
  });
}

// Initialize abort controller
createAbortController();

export {
  init,
  setEventBus,
  isCancelled,
  canCancel,
  cancel,
  onCancel,
  checkCancellation,
  makeCancellable,
  getAbortSignal,
  reset,
  getState,
  getHistory,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  init: init,
  setEventBus: setEventBus,
  isCancelled: isCancelled,
  canCancel: canCancel,
  cancel: cancel,
  onCancel: onCancel,
  checkCancellation: checkCancellation,
  makeCancellable: makeCancellable,
  getAbortSignal: getAbortSignal,
  reset: reset,
  getState: getState,
  getHistory: getHistory,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
