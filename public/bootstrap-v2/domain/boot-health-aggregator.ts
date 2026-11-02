
// Boot Health Aggregator - Unified Health Status
// @version 1.3.0-HEALTH-CONTRACT
// @description Agregador de saúde do bootstrap baseado no Manifest e Context
// @changelog v1.3.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.2.0-DOMAIN-PURE - Eliminado window.EventBus direto → EventBus injetado via construtor + constante BOOT_EVENTS.HEALTH_PERIODIC
// @changelog v1.1.0-QUICKWINS - QW#15 Health Check Periódico, QW#20 Métricas de Memória
// @changelog v1.0.0 - Initial health aggregator (P1 Bootstrap Platform)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0)
// ═══════════════════════════════════════════════════════════════
// REQUIRED:
//   bootContext  — via createHealthAggregator(bootContext, options)
//                  Provides getSnapshot() for phase/metrics data
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//
// OPTIONAL (via options.eventBus):
//   EventBus     — injected at construction or via setEventBus()
//                  Used ONLY in startPeriodicCheck() to emit BOOT_EVENTS.HEALTH_PERIODIC
//                  Tolerant when absent: periodic check works, just skips emit
//
// BROWSER APIs (native, guarded):
//   window.performance.memory — Chrome-only heap metrics
//                                Guarded with typeof window !== 'undefined'
//                                Returns null when unavailable
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_HEALTH, BOOT_MANIFEST, getPhaseById, getCriticalPhases, getTotalHealthWeight } from '../boot-manifest/index.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'boot-health-aggregator';
var VERSION = '1.3.0-HEALTH-CONTRACT';

var HEALTH_THRESHOLDS = {
  HEALTHY: 90,
  DEGRADED: 60,
  UNHEALTHY: 30
};

var PERIODIC_CONFIG = {
  enabled: false,
  interval: 30000,
  maxChecks: 100
};

// Types
interface BootSnapshot {
  phases?: Record<string, { success?: boolean; degraded?: boolean; recovered?: boolean; suppressed?: boolean; error?: string }>;
  metrics?: { totalTime?: number; recoveries?: number; failures?: number };
  degradationCount?: number;
  [key: string]: unknown;
}

interface BootContextLike {
  getSnapshot: () => BootSnapshot;
  start: () => void;
  complete: (success: boolean) => void;
  reset: () => void;
  info: () => Record<string, unknown>;
  setPhaseResult: (phaseId: string, result: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface EventBusLike {
  emit: (event: string, data: Record<string, unknown>) => void;
}

interface HealthAggregatorOptions {
  eventBus?: EventBusLike;
}

interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface PhaseMemoryEntry {
  start: MemorySnapshot | null;
  end: MemorySnapshot | null;
  delta: number;
}

interface HealthCalculation {
  status: string;
  score: number;
  scoreDisplay: string;
  phases: Record<string, PhaseHealthEntry>;
  critical: { total: number; passed: number; failed: number };
  nonCritical: { total: number; passed: number; failed: number; skipped: number };
  issues: Array<{ phase?: string; type: string; message: string; error?: string }>;
  issueCount: number;
  warnings: Array<{ phase?: string; type: string; message: string }>;
  warningCount: number;
  totalTime: number;
  recoveries: number;
  failures: number;
  degradations: number;
  memory: { baseline: MemorySnapshot | null; peak: MemorySnapshot | null; current: MemorySnapshot | null; phases: Record<string, PhaseMemoryEntry>; totalDelta: number } | null;
  calculatedAt: number;
  version: string;
}

interface PhaseHealthEntry {
  id: string;
  name: string;
  critical: boolean;
  weight: number;
  status: string;
  score: number;
  issues: string[];
  memory: PhaseMemoryEntry | null;
}

interface PeriodicCheckEntry {
  checkNumber: number;
  status: string;
  score: number;
  timestamp: number;
}

interface PeriodicOptions {
  interval?: number;
  maxChecks?: number;
  onCheck?: ((entry: PeriodicCheckEntry, result: HealthCalculation) => void) | null;
}

function createHealthAggregator(bootContext: BootContextLike | null, options: HealthAggregatorOptions) {
  if (options === undefined) options = {};

  var _context: BootContextLike | null = bootContext;
  var _eventBus: EventBusLike | null = options.eventBus || null;
  var _lastCalculation: HealthCalculation | null = null;
  var _listeners: Array<(result: HealthCalculation) => void> = [];

  var _periodicState: {
    running: boolean;
    intervalId: ReturnType<typeof setInterval> | null;
    checkCount: number;
    history: PeriodicCheckEntry[];
  } = {
    running: false,
    intervalId: null,
    checkCount: 0,
    history: []
  };

  var _memoryMetrics: {
    phases: Record<string, PhaseMemoryEntry>;
    baseline: MemorySnapshot | null;
    peak: MemorySnapshot | null;
    current: MemorySnapshot | null;
  } = {
    phases: {},
    baseline: null,
    peak: null,
    current: null
  };

  // ═══════════════════════════════════════════════════════════════
  // MEMORY METRICS (Browser API — guarded)
  // ═══════════════════════════════════════════════════════════════

  function _captureMemory() {
    if (typeof window !== 'undefined' && window.performance && (window.performance as any).memory) {
      return {
        usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }

  function captureMemoryBaseline() {
    _memoryMetrics.baseline = _captureMemory();
    return _memoryMetrics.baseline;
  }

  function capturePhaseMemory(phaseId: string, stage: string) {
    var mem = _captureMemory();
    if (!mem) return null;

    if (!_memoryMetrics.phases[phaseId]) {
      _memoryMetrics.phases[phaseId] = { start: null, end: null, delta: 0 };
    }

    if (stage === 'start') {
      _memoryMetrics.phases[phaseId].start = mem;
    } else if (stage === 'end') {
      _memoryMetrics.phases[phaseId].end = mem;
      if (_memoryMetrics.phases[phaseId].start) {
        _memoryMetrics.phases[phaseId].delta = mem.usedJSHeapSize - _memoryMetrics.phases[phaseId].start.usedJSHeapSize;
      }
    }

    if (!_memoryMetrics.peak || mem.usedJSHeapSize > _memoryMetrics.peak.usedJSHeapSize) {
      _memoryMetrics.peak = mem;
    }

    _memoryMetrics.current = mem;
    return mem;
  }

  function getMemoryMetrics() {
    return {
      baseline: _memoryMetrics.baseline,
      peak: _memoryMetrics.peak,
      current: _captureMemory(),
      phases: Object.assign({}, _memoryMetrics.phases),
      totalDelta: _memoryMetrics.baseline && _memoryMetrics.current
        ? _memoryMetrics.current.usedJSHeapSize - _memoryMetrics.baseline.usedJSHeapSize
        : 0
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH CALCULATION
  // ═══════════════════════════════════════════════════════════════

  function calculate() {
    var snapshot = _context ? _context.getSnapshot() : null;
    if (!snapshot) {
      return _createEmptyResult();
    }

    var phases = snapshot.phases || {};
    var totalWeight = getTotalHealthWeight();
    var achievedWeight = 0;
    var phaseHealths: Record<string, PhaseHealthEntry> = {};
    var criticalStatus = { total: 0, passed: 0, failed: 0 };
    var nonCriticalStatus = { total: 0, passed: 0, failed: 0, skipped: 0 };
    var issues: Array<{ phase?: string; type: string; message: string; error?: string }> = [];
    var warnings: Array<{ phase?: string; type: string; message: string }> = [];

    for (var i = 0; i < BOOT_MANIFEST.phases.length; i++) {
      var phaseConfig = BOOT_MANIFEST.phases[i];
      var phaseId = phaseConfig.id;
      var phaseResult = phases[phaseId];
      var weight = phaseConfig.healthWeight || 0;

      var phaseHealth = {
        id: phaseId,
        name: phaseConfig.name,
        critical: phaseConfig.critical,
        weight: weight,
        status: 'pending',
        score: 0,
        issues: [] as string[],
        memory: _memoryMetrics.phases[phaseId] || null
      };

      if (phaseResult) {
        if (phaseResult.success && !phaseResult.degraded) {
          phaseHealth.status = 'healthy';
          phaseHealth.score = weight;
          achievedWeight += weight;
        } else if (phaseResult.recovered || phaseResult.degraded) {
          phaseHealth.status = 'degraded';
          phaseHealth.score = weight * 0.5;
          achievedWeight += weight * 0.5;
          warnings.push({
            phase: phaseId,
            type: 'degraded',
            message: phaseConfig.name + ' is running in degraded mode'
          });
        } else if (phaseResult.suppressed) {
          phaseHealth.status = 'suppressed';
          phaseHealth.score = weight * 0.7;
          achievedWeight += weight * 0.7;
        } else {
          phaseHealth.status = 'failed';
          phaseHealth.score = 0;
          if (phaseConfig.critical) {
            issues.push({
              phase: phaseId,
              type: 'critical_failure',
              message: 'Critical phase ' + phaseConfig.name + ' failed',
              error: phaseResult.error
            });
          } else {
            warnings.push({
              phase: phaseId,
              type: 'failure',
              message: phaseConfig.name + ' failed but is non-critical'
            });
          }
        }

        if (phaseConfig.critical) {
          criticalStatus.total++;
          if (phaseResult.success || phaseResult.recovered) {
            criticalStatus.passed++;
          } else {
            criticalStatus.failed++;
          }
        } else {
          nonCriticalStatus.total++;
          if (phaseResult.success || phaseResult.recovered) {
            nonCriticalStatus.passed++;
          } else {
            nonCriticalStatus.failed++;
          }
        }
      } else {
        phaseHealth.status = 'pending';
        if (phaseConfig.critical) {
          criticalStatus.total++;
        } else {
          nonCriticalStatus.total++;
          nonCriticalStatus.skipped++;
        }
      }

      phaseHealths[phaseId] = phaseHealth;
    }

    var overallScore = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

    var overallStatus: string = BOOT_HEALTH.HEALTHY;
    if (criticalStatus.failed > 0) {
      overallStatus = BOOT_HEALTH.FAILED;
    } else if (overallScore < HEALTH_THRESHOLDS.UNHEALTHY) {
      overallStatus = BOOT_HEALTH.UNHEALTHY;
    } else if (overallScore < HEALTH_THRESHOLDS.DEGRADED) {
      overallStatus = BOOT_HEALTH.DEGRADED;
    } else if (overallScore < HEALTH_THRESHOLDS.HEALTHY) {
      overallStatus = BOOT_HEALTH.DEGRADED;
    }

    // @ts-expect-error strict migration — TS18048
    if (snapshot.degradationCount > 0 && overallStatus === BOOT_HEALTH.HEALTHY) {
      overallStatus = BOOT_HEALTH.DEGRADED;
    }

    var result = {
      status: overallStatus,
      score: overallScore,
      scoreDisplay: overallScore + '/100',
      phases: phaseHealths,
      critical: criticalStatus,
      nonCritical: nonCriticalStatus,
      issues: issues,
      issueCount: issues.length,
      warnings: warnings,
      warningCount: warnings.length,
      totalTime: snapshot.metrics ? snapshot.metrics.totalTime : 0,
      recoveries: snapshot.metrics ? snapshot.metrics.recoveries : 0,
      failures: snapshot.metrics ? snapshot.metrics.failures : 0,
      degradations: snapshot.degradationCount || 0,
      memory: getMemoryMetrics(),
      calculatedAt: Date.now(),
      version: VERSION
    };

    // @ts-expect-error strict migration — TS2322
    _lastCalculation = result;
    // @ts-expect-error strict migration — TS2345
    _notifyListeners(result);

    return result;
  }

  function _createEmptyResult() {
    return {
      status: BOOT_HEALTH.UNHEALTHY,
      score: 0,
      scoreDisplay: '0/100',
      phases: {},
      critical: { total: 0, passed: 0, failed: 0 },
      nonCritical: { total: 0, passed: 0, failed: 0, skipped: 0 },
      issues: [{ type: 'no_context', message: 'Boot context not available' }],
      issueCount: 1,
      warnings: [] as Array<{ phase?: string; type: string; message: string }>,
      warningCount: 0,
      totalTime: 0,
      recoveries: 0,
      failures: 0,
      degradations: 0,
      memory: null as ReturnType<typeof getMemoryMetrics> | null,
      calculatedAt: Date.now(),
      version: VERSION
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PERIODIC CHECK (v1.2.0: uses injected _eventBus instead of window.EventBus)
  // ═══════════════════════════════════════════════════════════════

  function startPeriodicCheck(periodicOptions: PeriodicOptions) {
    if (periodicOptions === undefined) periodicOptions = {};
    var interval = periodicOptions.interval || PERIODIC_CONFIG.interval;
    var maxChecks = periodicOptions.maxChecks || PERIODIC_CONFIG.maxChecks;
    var onCheck = periodicOptions.onCheck || null;

    if (_periodicState.running) {
      return { success: false, reason: 'already-running' };
    }

    _periodicState.running = true;
    _periodicState.checkCount = 0;
    _periodicState.history = [];

    _periodicState.intervalId = setInterval(function() {
      if (_periodicState.checkCount >= maxChecks) {
        stopPeriodicCheck();
        return;
      }

      var result = calculate();
      _periodicState.checkCount++;

      var entry = {
        checkNumber: _periodicState.checkCount,
        status: result.status,
        score: result.score,
        timestamp: Date.now()
      };

      _periodicState.history.push(entry);

      if (_periodicState.history.length > 20) {
        _periodicState.history.shift();
      }

      if (onCheck && typeof onCheck === 'function') {
        // @ts-expect-error strict migration — TS2345
        try { onCheck(entry, result); } catch (e) { }
      }

      // v1.2.0: emit via injected EventBus (tolerant when absent)
      if (_eventBus && _eventBus.emit) {
        try {
          _eventBus.emit(BOOT_EVENTS.HEALTH_PERIODIC, entry);
        } catch (e) { }
      }
    }, interval);

    return { success: true, interval: interval, maxChecks: maxChecks };
  }

  function stopPeriodicCheck() {
    if (_periodicState.intervalId) {
      clearInterval(_periodicState.intervalId);
      _periodicState.intervalId = null;
    }
    _periodicState.running = false;
    return { stopped: true, totalChecks: _periodicState.checkCount };
  }

  function getPeriodicHistory() {
    return {
      running: _periodicState.running,
      checkCount: _periodicState.checkCount,
      history: _periodicState.history.slice()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS ACCESSORS
  // ═══════════════════════════════════════════════════════════════

  function getLastCalculation() { return _lastCalculation; }
  function getStatus() { var calc = _lastCalculation || calculate(); return calc.status; }
  function getScore() { var calc = _lastCalculation || calculate(); return calc.score; }
  function isHealthy() { return getStatus() === BOOT_HEALTH.HEALTHY; }
  function isDegraded() { return getStatus() === BOOT_HEALTH.DEGRADED; }
  function isUnhealthy() { var status = getStatus(); return status === BOOT_HEALTH.UNHEALTHY || status === BOOT_HEALTH.FAILED; }

  // ═══════════════════════════════════════════════════════════════
  // LISTENERS
  // ═══════════════════════════════════════════════════════════════

  function _notifyListeners(result: HealthCalculation) {
    for (var i = 0; i < _listeners.length; i++) {
      try { _listeners[i](result); } catch (e) { }
    }
  }

  function subscribe(callback: (result: HealthCalculation) => void) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
      return function unsubscribe() {
        var idx = _listeners.indexOf(callback);
        if (idx !== -1) _listeners.splice(idx, 1);
      };
    }
    return function() { };
  }

  // ═══════════════════════════════════════════════════════════════
  // SETTERS
  // ═══════════════════════════════════════════════════════════════

  function setContext(context: BootContextLike) {
    _context = context;
    _lastCalculation = null;
  }

  function setEventBus(eventBus: EventBusLike | null) {
    _eventBus = eventBus || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // INFO / HEALTH / RESET
  // ═══════════════════════════════════════════════════════════════

  function info() {
    var calc = _lastCalculation || calculate();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      status: calc.status,
      score: calc.score,
      issueCount: calc.issueCount,
      warningCount: calc.warningCount,
      hasContext: !!_context,
      hasEventBus: !!_eventBus,
      listeners: _listeners.length,
      periodicCheck: {
        running: _periodicState.running,
        checkCount: _periodicState.checkCount
      },
      memory: getMemoryMetrics(),
      quickWinsApplied: ['QW15-PeriodicCheck', 'QW20-MemoryMetrics']
    };
  }

  function healthCheck() {
    var calc = _lastCalculation || calculate();

    var status: string = HEALTH_STATUS.HEALTHY;
    if (!_context) {
      status = HEALTH_STATUS.DEGRADED;
    }

    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        hasContext: !!_context,
        hasEventBus: !!_eventBus,
        periodicRunning: _periodicState.running
      },
      details: {
        bootStatus: calc.status,
        bootScore: calc.score,
        periodicRunning: _periodicState.running,
        hasEventBus: !!_eventBus
      }
    });
  }

  function reset() {
    stopPeriodicCheck();
    _lastCalculation = null;
    _periodicState = { running: false, intervalId: null, checkCount: 0, history: [] };
    _memoryMetrics = { phases: {}, baseline: null, peak: null, current: null };
  }

  return {
    calculate: calculate,
    getLastCalculation: getLastCalculation,
    getStatus: getStatus,
    getScore: getScore,
    isHealthy: isHealthy,
    isDegraded: isDegraded,
    isUnhealthy: isUnhealthy,
    subscribe: subscribe,
    setContext: setContext,
    setEventBus: setEventBus,
    info: info,
    healthCheck: healthCheck,
    reset: reset,
    startPeriodicCheck: startPeriodicCheck,
    stopPeriodicCheck: stopPeriodicCheck,
    getPeriodicHistory: getPeriodicHistory,
    captureMemoryBaseline: captureMemoryBaseline,
    capturePhaseMemory: capturePhaseMemory,
    getMemoryMetrics: getMemoryMetrics,
    THRESHOLDS: HEALTH_THRESHOLDS
  };
}

var _instance: ReturnType<typeof createHealthAggregator> | null = null;

function getInstance(bootContext: BootContextLike | null, options?: HealthAggregatorOptions) {
  if (!_instance) {
    // @ts-expect-error strict migration — TS2345
    _instance = createHealthAggregator(bootContext, options);
  } else {
    if (bootContext) {
      _instance.setContext(bootContext);
    }
    if (options && options.eventBus) {
      _instance.setEventBus(options.eventBus);
    }
  }
  return _instance;
}

function resetInstance() {
  if (_instance) { _instance.reset(); }
  _instance = null;
}

export {
  createHealthAggregator,
  getInstance,
  resetInstance,
  HEALTH_THRESHOLDS,
  MODULE_ID,
  VERSION
};

export default {
  createHealthAggregator: createHealthAggregator,
  getInstance: getInstance,
  resetInstance: resetInstance,
  HEALTH_THRESHOLDS: HEALTH_THRESHOLDS,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
