
// Module Events - Granular Event Emitter
// @version 2.4.0-EVENTS-CONTRACT
// @description Sprint 7B #9 - Eventos granulares com métricas agregadas
// @changelog v2.4.0-EVENTS-CONTRACT - Integração com events-contract.js para validação de emissão
// @changelog v2.3.0-EVENTS-FORMALIZED - String solta eliminada: MODULE_EVENTS_NAMESPACE constante formal
// @changelog v2.2.0-HEALTH-CONTRACT - Health contract integration
// @changelog v2.1.0-DOMAIN-PURE - Eliminado window.EventBus direto → EventBus via init()/setEventBus()
// @changelog v2.0.0-METRICS: Métricas agregadas, timing percentiles, batch events
// @changelog v1.0.0-OBSERVABILITY: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from ../contracts/health-contract.ts
//   EVENT_ROLE, validateEventEmission, createEventPayload from ../contracts/events-contract.js
//
// OPTIONAL (via init(options) or setEventBus()):
//   EventBus — Used in emit() to broadcast events to global bus
//              Tolerant when absent: internal listeners and metrics still work
//
// EMITS (via EventBus when available):
//   MODULE_EVENTS_NAMESPACE + MODULE_EVENT_TYPES.*
//   Examples:
//     'bootstrap:module:start'
//     'bootstrap:module:complete'
//     'bootstrap:module:error'
//     'bootstrap:phase:modules:start'
//     'bootstrap:phase:modules:complete'
//
//   NOTE: These are OBSERVABILITY events, not BOOT_EVENTS.
//   They track module execution telemetry, not boot lifecycle.
//   Consumers should use MODULE_EVENT_TYPES constants for subscription.
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { EVENT_ROLE, validateEventEmission, createEventPayload } from '../contracts/events-contract.js';

var MODULE_ID = 'module-events';
var VERSION = '2.4.0-EVENTS-CONTRACT';

// v2.3.0: Namespace constante formal (elimina string solta)
var MODULE_EVENTS_NAMESPACE = 'bootstrap:';

// Types
interface EventBusLike {
  emit: (event: string, data: Record<string, unknown>) => void;
}

interface ModuleEvent {
  id: string;
  type: string;
  phaseId: string | null;
  moduleId: string | null;
  moduleName: string | null;
  progress: number | null;
  duration: number | null;
  success: boolean | null;
  error: string | null;
  metadata: Record<string, unknown>;
  timestamp: number;
  role: string;
}

interface EmitData {
  phaseId?: string;
  moduleId?: string;
  moduleName?: string;
  progress?: number;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface PhaseModuleResult {
  success: boolean;
  duration?: number;
}

interface ModuleEventsInitOptions {
  eventBus?: EventBusLike;
}

interface PhaseMetrics {
  started: number;
  completed: number;
  failed: number;
  skipped: number;
  retries: number;
  timings: number[];
}

interface ModuleMetrics {
  executions: number;
  successes: number;
  failures: number;
  retries: number;
  timings: number[];
}

// Injected dependencies
var _eventBus: EventBusLike | null = null;

// Event types
var MODULE_EVENT_TYPES = {
  MODULE_START: 'module:start',
  MODULE_PROGRESS: 'module:progress',
  MODULE_COMPLETE: 'module:complete',
  MODULE_ERROR: 'module:error',
  MODULE_SKIP: 'module:skip',
  MODULE_RETRY: 'module:retry',
  // Sprint 7B: Batch events
  PHASE_MODULES_START: 'phase:modules:start',
  PHASE_MODULES_COMPLETE: 'phase:modules:complete'
};

// Event history
var _eventHistory: ModuleEvent[] = [];
var _maxHistory = 200;
var _listeners: Record<string, Array<(event: ModuleEvent) => void>> = {};

// Sprint 7B: Aggregated metrics
var _metrics = {
  totalModulesStarted: 0,
  totalModulesCompleted: 0,
  totalModulesFailed: 0,
  totalModulesSkipped: 0,
  totalRetries: 0,
  timings: [] as number[],
  byPhase: {} as Record<string, PhaseMetrics>,
  byModule: {} as Record<string, ModuleMetrics>
};

// v2.4.0: Event emission validation tracking
var _validationWarnings: Array<{ eventName: string; errors: string[]; timestamp: number }> = [];

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION (v2.1.0: dependency injection)
// ═══════════════════════════════════════════════════════════════

function init(options: ModuleEventsInitOptions) {
  if (options === undefined) options = {};
  _eventBus = options.eventBus || null;
  return { initialized: true, hasEventBus: !!_eventBus };
}

function setEventBus(eventBus: EventBusLike | null) {
  _eventBus = eventBus || null;
}

// ═══════════════════════════════════════════════════════════════
// TIMING STATISTICS
// ═══════════════════════════════════════════════════════════════

// Sprint 7B: Timing statistics
function calculatePercentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  var sorted = arr.slice().sort(function(a, b) { return a - b; });
  var idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function getTimingStats() {
  var timings = _metrics.timings;
  if (timings.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 };
  }

  var sum = timings.reduce(function(a, b) { return a + b; }, 0);

  return {
    count: timings.length,
    min: Math.min.apply(null, timings),
    max: Math.max.apply(null, timings),
    avg: Math.round(sum / timings.length),
    p50: calculatePercentile(timings, 50),
    p90: calculatePercentile(timings, 90),
    p99: calculatePercentile(timings, 99)
  };
}

// ═══════════════════════════════════════════════════════════════
// EVENT EMISSION
// ═══════════════════════════════════════════════════════════════

// Emit event
function emit(eventType: string, data: EmitData) {
  var fullEventName = MODULE_EVENTS_NAMESPACE + eventType;

  // v2.4.0: Validate event emission using events-contract
  var validation = validateEventEmission(fullEventName, EVENT_ROLE.OBSERVABILITY, {
    triggersFlowChange: false,
    triggersUIChange: false
  });

  if (!validation.valid) {
    // Log validation errors but don't block emission (graceful degradation)
    _validationWarnings.push({
      eventName: fullEventName,
      errors: validation.errors,
      timestamp: Date.now()
    });
  }

  // v2.4.0: Create payload using events-contract factory
  var event = {
    id: 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
    type: eventType,
    phaseId: data.phaseId || null,
    moduleId: data.moduleId || null,
    moduleName: data.moduleName || null,
    progress: data.progress || null,
    duration: data.duration || null,
    success: data.success !== undefined ? data.success : null,
    error: data.error || null,
    metadata: data.metadata || {},
    timestamp: Date.now(),
    // v2.4.0: Add role from contract
    role: EVENT_ROLE.OBSERVABILITY
  };

  // Update metrics
  _updateMetrics(event);

  // Record in history
  _eventHistory.unshift(event);
  while (_eventHistory.length > _maxHistory) {
    _eventHistory.pop();
  }

  // Notify listeners
  var handlers = _listeners[eventType] || [];
  handlers.forEach(function(handler) {
    try { handler(event); } catch (e) {}
  });

  // Notify wildcard listeners
  var wildcardHandlers = _listeners['*'] || [];
  wildcardHandlers.forEach(function(handler) {
    try { handler(event); } catch (e) {}
  });

  // v2.3.0: emit via injected EventBus using formal namespace constant
  if (_eventBus && _eventBus.emit) {
    try {
      _eventBus.emit(fullEventName, event);
    } catch (e) {}
  }

  return event;
}

// ═══════════════════════════════════════════════════════════════
// METRICS
// ═══════════════════════════════════════════════════════════════

// Sprint 7B: Update aggregated metrics
function _updateMetrics(event: ModuleEvent) {
  var phaseId = event.phaseId;
  var moduleId = event.moduleId;

  // Initialize phase metrics
  if (phaseId && !_metrics.byPhase[phaseId]) {
    _metrics.byPhase[phaseId] = {
      started: 0, completed: 0, failed: 0, skipped: 0, retries: 0, timings: []
    };
  }

  // Initialize module metrics
  if (moduleId && !_metrics.byModule[moduleId]) {
    _metrics.byModule[moduleId] = {
      executions: 0, successes: 0, failures: 0, retries: 0, timings: []
    };
  }

  switch (event.type) {
    case MODULE_EVENT_TYPES.MODULE_START:
      _metrics.totalModulesStarted++;
      if (phaseId) _metrics.byPhase[phaseId].started++;
      if (moduleId) _metrics.byModule[moduleId].executions++;
      break;

    case MODULE_EVENT_TYPES.MODULE_COMPLETE:
      _metrics.totalModulesCompleted++;
      if (phaseId) _metrics.byPhase[phaseId].completed++;
      if (event.success && moduleId) _metrics.byModule[moduleId].successes++;
      if (!event.success && moduleId) _metrics.byModule[moduleId].failures++;

      // Record timing
      if (event.duration !== null) {
        _metrics.timings.push(event.duration);
        if (phaseId) _metrics.byPhase[phaseId].timings.push(event.duration);
        if (moduleId) _metrics.byModule[moduleId].timings.push(event.duration);

        // Limit timing arrays
        if (_metrics.timings.length > 500) _metrics.timings = _metrics.timings.slice(-500);
      }
      break;

    case MODULE_EVENT_TYPES.MODULE_ERROR:
      _metrics.totalModulesFailed++;
      if (phaseId) _metrics.byPhase[phaseId].failed++;
      if (moduleId) _metrics.byModule[moduleId].failures++;
      break;

    case MODULE_EVENT_TYPES.MODULE_SKIP:
      _metrics.totalModulesSkipped++;
      if (phaseId) _metrics.byPhase[phaseId].skipped++;
      break;

    case MODULE_EVENT_TYPES.MODULE_RETRY:
      _metrics.totalRetries++;
      if (phaseId) _metrics.byPhase[phaseId].retries++;
      if (moduleId) _metrics.byModule[moduleId].retries++;
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════

// Subscribe to events
function on(eventType: string, handler: (event: ModuleEvent) => void) {
  if (!_listeners[eventType]) {
    _listeners[eventType] = [];
  }
  _listeners[eventType].push(handler);

  // Return unsubscribe function
  return function() {
    var idx = _listeners[eventType].indexOf(handler);
    if (idx !== -1) {
      _listeners[eventType].splice(idx, 1);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE EMITTERS
// ═══════════════════════════════════════════════════════════════

function emitModuleStart(phaseId: string, moduleId: string, moduleName: string, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_START, {
    phaseId: phaseId,
    moduleId: moduleId,
    moduleName: moduleName,
    metadata: metadata
  });
}

function emitModuleProgress(phaseId: string, moduleId: string, progress: number, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_PROGRESS, {
    phaseId: phaseId,
    moduleId: moduleId,
    progress: progress,
    metadata: metadata
  });
}

function emitModuleComplete(phaseId: string, moduleId: string, duration: number, success: boolean, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_COMPLETE, {
    phaseId: phaseId,
    moduleId: moduleId,
    duration: duration,
    success: success,
    metadata: metadata
  });
}

function emitModuleError(phaseId: string, moduleId: string, error: string, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_ERROR, {
    phaseId: phaseId,
    moduleId: moduleId,
    error: error,
    success: false,
    metadata: metadata
  });
}

function emitModuleSkip(phaseId: string, moduleId: string, reason: string, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_SKIP, {
    phaseId: phaseId,
    moduleId: moduleId,
    metadata: Object.assign({ reason: reason }, metadata || {})
  });
}

function emitModuleRetry(phaseId: string, moduleId: string, attempt: number, maxAttempts: number, metadata: Record<string, unknown>) {
  return emit(MODULE_EVENT_TYPES.MODULE_RETRY, {
    phaseId: phaseId,
    moduleId: moduleId,
    metadata: Object.assign({ attempt: attempt, maxAttempts: maxAttempts }, metadata || {})
  });
}

// Sprint 7B: Batch events for phase
function emitPhaseModulesStart(phaseId: string, moduleCount: number, moduleIds: string[]) {
  return emit(MODULE_EVENT_TYPES.PHASE_MODULES_START, {
    phaseId: phaseId,
    metadata: { moduleCount: moduleCount, moduleIds: moduleIds }
  });
}

function emitPhaseModulesComplete(phaseId: string, results: PhaseModuleResult[]) {
  var succeeded = results.filter(function(r) { return r.success; }).length;
  var failed = results.filter(function(r) { return !r.success; }).length;
  var totalTime = results.reduce(function(sum, r) { return sum + (r.duration || 0); }, 0);

  return emit(MODULE_EVENT_TYPES.PHASE_MODULES_COMPLETE, {
    phaseId: phaseId,
    success: failed === 0,
    duration: totalTime,
    metadata: {
      moduleCount: results.length,
      succeeded: succeeded,
      failed: failed,
      results: results
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// QUERY METHODS
// ═══════════════════════════════════════════════════════════════

function getEventHistory() {
  return _eventHistory.slice();
}

function getEventsByPhase(phaseId: string) {
  return _eventHistory.filter(function(e) { return e.phaseId === phaseId; });
}

function getEventsByModule(moduleId: string) {
  return _eventHistory.filter(function(e) { return e.moduleId === moduleId; });
}

function getEventsByType(eventType: string) {
  return _eventHistory.filter(function(e) { return e.type === eventType; });
}

function getModuleTimeline(phaseId: string) {
  var phaseEvents = getEventsByPhase(phaseId);
  var modules: Record<string, { events: ModuleEvent[]; startTime: number | null; endTime: number | null; duration: number | null; success: boolean | null }> = {};

  phaseEvents.forEach(function(e: ModuleEvent) {
    if (!e.moduleId) return;
    if (!modules[e.moduleId]) {
      modules[e.moduleId] = { events: [], startTime: null, endTime: null, duration: null, success: null };
    }
    modules[e.moduleId].events.push(e);

    if (e.type === MODULE_EVENT_TYPES.MODULE_START) {
      modules[e.moduleId].startTime = e.timestamp;
    }
    if (e.type === MODULE_EVENT_TYPES.MODULE_COMPLETE) {
      modules[e.moduleId].endTime = e.timestamp;
      modules[e.moduleId].duration = e.duration;
      modules[e.moduleId].success = e.success;
    }
  });

  return modules;
}

// Sprint 7B: Get aggregated metrics
function getMetrics() {
  return {
    totals: {
      started: _metrics.totalModulesStarted,
      completed: _metrics.totalModulesCompleted,
      failed: _metrics.totalModulesFailed,
      skipped: _metrics.totalModulesSkipped,
      retries: _metrics.totalRetries
    },
    timing: getTimingStats(),
    byPhase: Object.keys(_metrics.byPhase).map(function(phaseId) {
      var pm = _metrics.byPhase[phaseId];
      return {
        phaseId: phaseId,
        started: pm.started,
        completed: pm.completed,
        failed: pm.failed,
        skipped: pm.skipped,
        avgTime: pm.timings.length > 0 ? Math.round(pm.timings.reduce(function(a,b){return a+b;},0) / pm.timings.length) : 0
      };
    }),
    timestamp: Date.now()
  };
}

// Sprint 7B: Get module performance report
function getModulePerformance(moduleId: string) {
  var mm = _metrics.byModule[moduleId];
  if (!mm) return null;

  return {
    moduleId: moduleId,
    executions: mm.executions,
    successes: mm.successes,
    failures: mm.failures,
    successRate: mm.executions > 0 ? Math.round((mm.successes / mm.executions) * 100) : 0,
    retries: mm.retries,
    timing: mm.timings.length > 0 ? {
      min: Math.min.apply(null, mm.timings),
      max: Math.max.apply(null, mm.timings),
      avg: Math.round(mm.timings.reduce(function(a,b){return a+b;},0) / mm.timings.length),
      count: mm.timings.length
    } : null
  };
}

// Sprint 7B: Get all module performance
function getAllModulePerformance() {
  return Object.keys(_metrics.byModule).map(function(moduleId) {
    return getModulePerformance(moduleId);
  }).filter(Boolean);
}

function clearHistory() {
  _eventHistory = [];
  return true;
}

// Sprint 7B: Reset metrics
function resetMetrics() {
  _metrics = {
    totalModulesStarted: 0,
    totalModulesCompleted: 0,
    totalModulesFailed: 0,
    totalModulesSkipped: 0,
    totalRetries: 0,
    timings: [],
    byPhase: {},
    byModule: {}
  };
  _validationWarnings = [];
}

// v2.4.0: Get validation warnings
function getValidationWarnings() {
  return _validationWarnings.slice();
}

// ═══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ═══════════════════════════════════════════════════════════════

function info() {
  var metrics = getMetrics();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    eventTypes: Object.keys(MODULE_EVENT_TYPES),
    eventNamespace: MODULE_EVENTS_NAMESPACE,
    historySize: _eventHistory.length,
    listenerCount: Object.keys(_listeners).reduce(function(sum, key) {
      return sum + _listeners[key].length;
    }, 0),
    hasEventBus: !!_eventBus,
    metrics: {
      totalStarted: metrics.totals.started,
      totalCompleted: metrics.totals.completed,
      avgTiming: metrics.timing.avg
    },
    validationWarnings: _validationWarnings.length,
    usesEventsContract: true,
    improvements: ['#9-GranularModuleEvents', 'AggregatedMetrics', 'TimingPercentiles', 'EventsFormalized', 'EventsContract']
  };
}

function healthCheck() {
  var metrics = getMetrics();
  var status: string = HEALTH_STATUS.HEALTHY;

  if (metrics.totals.failed > metrics.totals.completed * 0.1) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      historySize: _eventHistory.length,
      maxHistory: _maxHistory,
      hasEventBus: !!_eventBus,
      eventNamespace: MODULE_EVENTS_NAMESPACE,
      failureRate: metrics.totals.completed > 0
        ? Math.round((metrics.totals.failed / metrics.totals.completed) * 100)
        : 0,
      validationWarnings: _validationWarnings.length,
      usesEventsContract: true
    }
  });
}

// v2.3.0: Export namespace constant for external consumers
export {
  MODULE_EVENT_TYPES,
  MODULE_EVENTS_NAMESPACE,
  init,
  setEventBus,
  emit,
  on,
  emitModuleStart,
  emitModuleProgress,
  emitModuleComplete,
  emitModuleError,
  emitModuleSkip,
  emitModuleRetry,
  emitPhaseModulesStart,
  emitPhaseModulesComplete,
  getEventHistory,
  getEventsByPhase,
  getEventsByModule,
  getEventsByType,
  getModuleTimeline,
  getMetrics,
  getModulePerformance,
  getAllModulePerformance,
  getTimingStats,
  getValidationWarnings,
  clearHistory,
  resetMetrics,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  MODULE_EVENT_TYPES: MODULE_EVENT_TYPES,
  MODULE_EVENTS_NAMESPACE: MODULE_EVENTS_NAMESPACE,
  init: init,
  setEventBus: setEventBus,
  emit: emit,
  on: on,
  emitModuleStart: emitModuleStart,
  emitModuleProgress: emitModuleProgress,
  emitModuleComplete: emitModuleComplete,
  emitModuleError: emitModuleError,
  emitModuleSkip: emitModuleSkip,
  emitModuleRetry: emitModuleRetry,
  emitPhaseModulesStart: emitPhaseModulesStart,
  emitPhaseModulesComplete: emitPhaseModulesComplete,
  getEventHistory: getEventHistory,
  getEventsByPhase: getEventsByPhase,
  getEventsByModule: getEventsByModule,
  getEventsByType: getEventsByType,
  getModuleTimeline: getModuleTimeline,
  getMetrics: getMetrics,
  getModulePerformance: getModulePerformance,
  getAllModulePerformance: getAllModulePerformance,
  getTimingStats: getTimingStats,
  getValidationWarnings: getValidationWarnings,
  clearHistory: clearHistory,
  resetMetrics: resetMetrics,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
