// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-global:navigation-controller
// PURPOSE: Router Global - Navigation Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ./ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   metrics — exported value
//   createNavigationAbortController() — exported function
//   isNavigationAborted() — exported function
//   clearAbortController() — exported function
//   hasAbortController() — exported function
//   abortNavigation() — exported function
//   updateAvgNavigationTime() — exported function
//   createRoutePayload() — exported function
//   resetMetrics() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { log } from './ports.js';

export const VERSION = '1.1.0-P17';
export const MODULE_ID = 'router-global:navigation-controller';

let _currentAbortController: AbortController | null = null;

export const metrics = {
  navigationsTotal: 0,
  navigationsSucceeded: 0,
  navigationsFailed: 0,
  navigationsAborted: 0,
  navigationsBlocked: 0,
  guardBlocks: 0,
  circuitBreakerTrips: 0,
  loopsDetected: 0,
  retriesAttempted: 0,
  retriesSucceeded: 0,
  retriesFailed: 0,
  avgNavigationTime: 0,
  totalNavigationTime: 0,
  lastNavigationTime: null as number | null,
  lastNavigationDuration: null as number | null,
  lastError: null as string | null,
  errorCount: 0
};

export function createNavigationAbortController() {
  if (_currentAbortController) { _currentAbortController.abort(); metrics.navigationsAborted++; }
  _currentAbortController = new AbortController();
  return _currentAbortController;
}

export function isNavigationAborted() {
  return _currentAbortController && _currentAbortController.signal && _currentAbortController.signal.aborted ? true : false;
}

export function clearAbortController() { _currentAbortController = null; }

export function hasAbortController() { return !!_currentAbortController; }

export function abortNavigation() {
  if (_currentAbortController) {
    _currentAbortController.abort();
    metrics.navigationsAborted++;
    log('info', 'Navigation aborted by user');
    return true;
  }
  return false;
}

export function updateAvgNavigationTime(duration: number): void {
  metrics.totalNavigationTime += duration;
  metrics.avgNavigationTime = Math.round(metrics.totalNavigationTime / metrics.navigationsSucceeded);
}

export function createRoutePayload(path: string, options: Record<string, unknown>, route: Record<string, unknown> | null) {
  if (!options) options = {};
  const routeObj = route || { path, timestamp: Date.now() };
  return { route: routeObj, path: routeObj.path || path, options, timestamp: Date.now() };
}

export function resetMetrics(): void {
  const keys = Object.keys(metrics) as Array<keyof typeof metrics>;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    (metrics as unknown as Record<string, number | null>)[k] = typeof metrics[k] === 'number' ? 0 : null;
  }
  log('info', 'Metrics reset');
}

export function getMetrics() { return Object.assign({}, metrics); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasAbortController: hasAbortController(), metrics: getMetrics() }; }

export function healthCheck() {
  const failRate = metrics.navigationsTotal > 0 ? metrics.navigationsFailed / metrics.navigationsTotal : 0;
  const status = failRate < 0.2 ? 'HEALTHY' : failRate < 0.5 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasAbortController: hasAbortController(), lowFailRate: failRate < 0.2, noCircuitTrips: metrics.circuitBreakerTrips === 0 }, metrics: getMetrics() };
}

export default { createNavigationAbortController, isNavigationAborted, clearAbortController, abortNavigation, updateAvgNavigationTime, createRoutePayload, resetMetrics, getMetrics, info, healthCheck, metrics, VERSION, MODULE_ID };
