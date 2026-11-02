// Boot Metrics Summary
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#26 - Resumo consolidado de métricas do boot
// @changelog v1.0.0-QUICKWINS: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: startBoot(), endBoot(), recordPhase(), recordModule(),
//   recordError(), recordWarning(), recordDegradation(),
//   updateMemoryPeak(), getSummary(), reset(), info()
// BROWSER APIs:
//   (window.performance as any).memory — LEGÍTIMO: heap size metrics (Chrome only)
// WINDOW ACCESS: (window.performance as any).memory (memory metrics)
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'boot-metrics-summary';
var VERSION = '1.0.1-CONTRACTS';

// Types
interface MemoryEntry {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  timestamp: number;
}

interface PhaseMetricEntry {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  status: string;
  modulesLoaded: number;
  modulesFailed: number;
  critical: boolean;
}

interface ModuleMetricEntry {
  id: string;
  phaseId: string;
  loadTime: number;
  initTime: number;
  totalTime: number;
  status: string;
  critical: boolean;
  timeout: number | null;
}

interface ErrorEntry {
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
}

interface WarningEntry {
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
}

interface DegradationEntry {
  moduleId: string;
  reason: string;
  timestamp: number;
}

interface PhaseData {
  startTime?: number;
  endTime?: number | null;
  duration?: number;
  status?: string;
  modulesLoaded?: number;
  modulesFailed?: number;
  critical?: boolean;
}

interface ModuleData {
  phaseId?: string;
  loadTime?: number;
  initTime?: number;
  totalTime?: number;
  status?: string;
  critical?: boolean;
  timeout?: number | null;
}

var _metrics: {
  bootStartTime: number | null;
  bootEndTime: number | null;
  totalBootTime: number;
  phases: Record<string, PhaseMetricEntry>;
  modules: Record<string, ModuleMetricEntry>;
  memory: {
    start: MemoryEntry | null;
    end: MemoryEntry | null;
    peak: MemoryEntry | null;
  };
  errors: ErrorEntry[];
  warnings: WarningEntry[];
  degradations: DegradationEntry[];
} = {
  bootStartTime: null,
  bootEndTime: null,
  totalBootTime: 0,
  phases: {},
  modules: {},
  memory: {
    start: null,
    end: null,
    peak: null
  },
  errors: [],
  warnings: [],
  degradations: []
};

function startBoot() {
  _metrics.bootStartTime = Date.now();
  _metrics.phases = {};
  _metrics.modules = {};
  _metrics.errors = [];
  _metrics.warnings = [];
  _metrics.degradations = [];
  
  if (typeof window !== 'undefined' && window.performance && (window.performance as any).memory) {
    _metrics.memory.start = {
      usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
      timestamp: Date.now()
    };
  }
  
  return { started: true, timestamp: _metrics.bootStartTime };
}

function endBoot(success: boolean) {
  _metrics.bootEndTime = Date.now();
  // @ts-expect-error strict migration — TS18047
  _metrics.totalBootTime = _metrics.bootEndTime - _metrics.bootStartTime;
  
  if (typeof window !== 'undefined' && window.performance && (window.performance as any).memory) {
    _metrics.memory.end = {
      usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
      timestamp: Date.now()
    };
  }
  
  return {
    success: success,
    totalTime: _metrics.totalBootTime,
    timestamp: _metrics.bootEndTime
  };
}

function recordPhase(phaseId: string, data: PhaseData) {
  _metrics.phases[phaseId] = {
    id: phaseId,
    startTime: data.startTime || Date.now(),
    endTime: data.endTime || null,
    duration: data.duration || 0,
    status: data.status || 'unknown',
    modulesLoaded: data.modulesLoaded || 0,
    modulesFailed: data.modulesFailed || 0,
    critical: data.critical || false
  };
  
  return _metrics.phases[phaseId];
}

function recordModule(moduleId: string, data: ModuleData) {
  _metrics.modules[moduleId] = {
    id: moduleId,
    phaseId: data.phaseId || 'unknown',
    loadTime: data.loadTime || 0,
    initTime: data.initTime || 0,
    totalTime: data.totalTime || 0,
    status: data.status || 'unknown',
    critical: data.critical || false,
    timeout: data.timeout || null
  };
  
  return _metrics.modules[moduleId];
}

function recordError(error: { message?: string }, context: Record<string, unknown>) {
  _metrics.errors.push({
    message: error.message || String(error),
    context: context || {},
    timestamp: Date.now()
  });
}

function recordWarning(message: string, context: Record<string, unknown>) {
  _metrics.warnings.push({
    message: message,
    context: context || {},
    timestamp: Date.now()
  });
}

function recordDegradation(moduleId: string, reason: string) {
  _metrics.degradations.push({
    moduleId: moduleId,
    reason: reason,
    timestamp: Date.now()
  });
}

function updateMemoryPeak() {
  if (typeof window !== 'undefined' && window.performance && (window.performance as any).memory) {
    var current = (window.performance as any).memory.usedJSHeapSize;
    if (!_metrics.memory.peak || current > _metrics.memory.peak.usedJSHeapSize) {
      _metrics.memory.peak = {
        usedJSHeapSize: current,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        timestamp: Date.now()
      };
    }
  }
}

function getSummary() {
  var phaseCount = Object.keys(_metrics.phases).length;
  var moduleCount = Object.keys(_metrics.modules).length;
  
  var successfulModules = 0;
  var failedModules = 0;
  for (var id in _metrics.modules) {
    if (_metrics.modules.hasOwnProperty(id)) {
      if (_metrics.modules[id].status === 'ready' || _metrics.modules[id].status === 'success') {
        successfulModules++;
      } else if (_metrics.modules[id].status === 'error' || _metrics.modules[id].status === 'failed') {
        failedModules++;
      }
    }
  }
  
  var avgModuleTime = 0;
  var totalModuleTime = 0;
  for (var mid in _metrics.modules) {
    if (_metrics.modules.hasOwnProperty(mid)) {
      totalModuleTime += _metrics.modules[mid].totalTime || 0;
    }
  }
  if (moduleCount > 0) avgModuleTime = Math.round(totalModuleTime / moduleCount);
  
  var memoryDelta = 0;
  if (_metrics.memory.start && _metrics.memory.end) {
    memoryDelta = _metrics.memory.end.usedJSHeapSize - _metrics.memory.start.usedJSHeapSize;
  }
  
  return {
    // Timing
    totalBootTime: _metrics.totalBootTime,
    bootStartTime: _metrics.bootStartTime,
    bootEndTime: _metrics.bootEndTime,
    
    // Phases
    phaseCount: phaseCount,
    phases: _metrics.phases,
    
    // Modules
    moduleCount: moduleCount,
    successfulModules: successfulModules,
    failedModules: failedModules,
    avgModuleTime: avgModuleTime,
    
    // Memory
    memory: {
      start: _metrics.memory.start ? _metrics.memory.start.usedJSHeapSize : null,
      end: _metrics.memory.end ? _metrics.memory.end.usedJSHeapSize : null,
      peak: _metrics.memory.peak ? _metrics.memory.peak.usedJSHeapSize : null,
      delta: memoryDelta
    },
    
    // Issues
    errorCount: _metrics.errors.length,
    warningCount: _metrics.warnings.length,
    degradationCount: _metrics.degradations.length,
    errors: _metrics.errors,
    warnings: _metrics.warnings,
    degradations: _metrics.degradations,
    
    // Meta
    timestamp: Date.now()
  };
}

function reset() {
  _metrics = {
    bootStartTime: null,
    bootEndTime: null,
    totalBootTime: 0,
    phases: {},
    modules: {},
    memory: { start: null, end: null, peak: null },
    errors: [],
    warnings: [],
    degradations: []
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasMetrics: _metrics.bootStartTime !== null,
    summary: getSummary()
  };
}

export {
  startBoot,
  endBoot,
  recordPhase,
  recordModule,
  recordError,
  recordWarning,
  recordDegradation,
  updateMemoryPeak,
  getSummary,
  reset,
  info,
  MODULE_ID,
  VERSION
};

export default {
  startBoot: startBoot,
  endBoot: endBoot,
  recordPhase: recordPhase,
  recordModule: recordModule,
  recordError: recordError,
  recordWarning: recordWarning,
  recordDegradation: recordDegradation,
  updateMemoryPeak: updateMemoryPeak,
  getSummary: getSummary,
  reset: reset,
  info: info
};
