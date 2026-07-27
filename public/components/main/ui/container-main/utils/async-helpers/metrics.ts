// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:metrics
// PURPOSE: Async Helpers - Métricas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateDurationMetrics() — exported function
//   incrementTotal() — exported function
//   incrementCompleted() — exported function
//   incrementTimedOut() — exported function
//   incrementAborted() — exported function
//   incrementRetried() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:metrics';

// Estado das métricas
let _metrics = {
  totalOperations: 0,
  completedOperations: 0,
  timedOutOperations: 0,
  abortedOperations: 0,
  retriedOperations: 0,
  avgDuration: 0,
  durations: [] as unknown[]
};

// Atualiza métricas de duração
export function updateDurationMetrics(duration: number) {
  _metrics.durations.push(duration);
  if (_metrics.durations.length > 100) _metrics.durations.shift();
  // @ts-expect-error TS migration - TS2349, TS7006
  _metrics.avgDuration = (_metrics.durations.reduce as unknown as number)((a, b) => a + b, 0) / _metrics.durations.length;
}

// Incrementa contadores
export function incrementTotal() { _metrics.totalOperations++; }
export function incrementCompleted() { _metrics.completedOperations++; }
export function incrementTimedOut() { _metrics.timedOutOperations++; }
export function incrementAborted() { _metrics.abortedOperations++; }
export function incrementRetried() { _metrics.retriedOperations++; }

// Obtém métricas
export function getMetrics(activeControllers = 0) {
  return {
    ..._metrics,
    activeControllers,
    successRate: _metrics.totalOperations > 0 
      ? `${(_metrics.completedOperations / _metrics.totalOperations * 100).toFixed(2)}%`
      : '0%'
  };
}

// Reseta métricas
export function resetMetrics() {
  _metrics = {
    totalOperations: 0,
    completedOperations: 0,
    timedOutOperations: 0,
    abortedOperations: 0,
    retriedOperations: 0,
    avgDuration: 0,
    durations: []
  };
}

// Health check
export function healthCheck(activeControllers = 0) {
  const timeoutRate = _metrics.totalOperations > 0
    ? _metrics.timedOutOperations / _metrics.totalOperations
    : 0;
  
  let status = 'HEALTHY';
  if (timeoutRate > 0.3) status = 'DEGRADED';
  if (timeoutRate > 0.5) status = 'UNHEALTHY';

  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    activeControllers,
    metrics: getMetrics(activeControllers),
    timeoutRate: `${(timeoutRate * 100).toFixed(2)}%`
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['getMetrics', 'resetMetrics', 'healthCheck']
  };
}

export default {
  VERSION, MODULE_ID,
  updateDurationMetrics,
  incrementTotal, incrementCompleted, incrementTimedOut, incrementAborted, incrementRetried,
  getMetrics, resetMetrics, healthCheck, info
};
