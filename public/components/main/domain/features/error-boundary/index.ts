

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   init(), destroy(), cleanup(),
//   captureError(), captureFeatureError(), onError(),
//   getErrorHistory(), getErrorCountBySource(),
//   getErrorRate(), clearHistory(),
//   getMetrics(), info(), healthCheck(),
//   ERROR_LEVELS constants,
//   injectPorts(), getPorts()
//
// RECEIVES (via init — implicit):
//   eventBus — for INIT_ERROR/NAVIGATION_ERROR hooks
//
// BROWSER APIs (legítimo — global error capture):
//   window.addEventListener(error) — global error handler
//   window.addEventListener(unhandledrejection) — promise
// ═══════════════════════════════════════════════════════════════
// MainFeature: Error Boundary
// @version 1.0.0-ENTERPRISE
// @description Captura centralizada de erros em features e componentes
// @category observability
// @priority CRITICAL (0)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MODULE_ID = 'main.feature.error-boundary';
export const VERSION = '1.0.0-ENTERPRISE';

const ERROR_LEVELS = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
});

const MAX_ERROR_HISTORY = 100;
const ERROR_RATE_WINDOW_MS = 60000;

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _enabled = false;
let _cleanups: Array<() => void> = [];
let _errorHistory: Array<Record<string, unknown>> = [];
let _errorCountBySource = new Map();
let _errorHandlers: Array<((...args: unknown[]) => void)> = [];

let _metrics = {
  inits: 0,
  errorsCaptured: 0,
  errorsReported: 0,
  errorsByLevel: { info: 0, warning: 0, error: 0, critical: 0 },
  errorsBySource: {},
  lastError: null as string | null,
  lastErrorTime: null as string | null
};

// ═══════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════

function _createErrorEntry(error: Error, source: string, level: string, context = {}) {
  return {
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    level: level || ERROR_LEVELS.ERROR,
    source: source || 'unknown',
    message: error?.message || String(error),
    stack: error?.stack || null,
    context,
    reported: false
  };
}

function _addToHistory(entry: Record<string, unknown>) {
  _errorHistory.unshift(entry);
  if (_errorHistory.length > MAX_ERROR_HISTORY) {
    _errorHistory.pop();
  }
}

function _updateMetrics(entry: Record<string, unknown>) {
  _metrics.errorsCaptured++;
  (_metrics.errorsByLevel as Record<string, number>)[entry.level as string] = ((_metrics.errorsByLevel as Record<string, number>)[entry.level as string] || 0) + 1;
  (_metrics.errorsBySource as Record<string, number>)[entry.source as string] = ((_metrics.errorsBySource as Record<string, number>)[entry.source as string] || 0) + 1;
  _metrics.lastError = entry.message as string;
  _metrics.lastErrorTime = entry.timestamp as string;
  
  const count = _errorCountBySource.get(entry.source) || 0;
  _errorCountBySource.set(entry.source, count + 1);
}

function _notifyHandlers(entry: Record<string, unknown>) {
  for (const handler of _errorHandlers) {
    try {
      handler(entry);
    } catch (e) {
      console.debug('%c[ERROR]%c [ErrorBoundary] Handler error:', 'color:#ef4444;font-weight:bold', 'color:inherit', (e as Error).message || e);
    }
  }
}

function _reportToTelemetry(entry: Record<string, unknown>) {
  const telemetry = _getPort('telemetry') as Record<string, (...args: unknown[]) => unknown> | null;
  if (telemetry?.trackError) {
    telemetry.trackError('error-boundary:captured', {
      errorId: entry.id,
      level: entry.level,
      source: entry.source,
      message: entry.message
    });
    entry.reported = true;
    _metrics.errorsReported++;
  }
}

function _emitEvent(entry: Record<string, unknown>) {
  const eb = _getPort('eventBus') as Record<string, (...args: unknown[]) => unknown> | null;
  if (eb?.emit) {
    eb.emit('error-boundary:error', { source: MODULE_ID, error: entry });
  }
}

function _handleGlobalError(event: ErrorEvent) {
  captureError(
    event.error || event.message,
    'window.onerror',
    ERROR_LEVELS.ERROR,
    { filename: event.filename, lineno: event.lineno, colno: event.colno }
  );
}

function _handleUnhandledRejection(event: PromiseRejectionEvent) {
  captureError(
    event.reason,
    'unhandledrejection',
    ERROR_LEVELS.ERROR,
    { type: 'promise' }
  );
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options = {}) {
  if (_enabled) {
    return { ok: true, alreadyInitialized: true };
  }
  
  try {
    _initPorts();
    _metrics.inits++;
    
    if (typeof window !== 'undefined') {
      window.addEventListener('error', _handleGlobalError);
      window.addEventListener('unhandledrejection', _handleUnhandledRejection);
      
      _cleanups.push(() => {
        window.removeEventListener('error', _handleGlobalError);
        window.removeEventListener('unhandledrejection', _handleUnhandledRejection);
      });
    }
    
    const eb = _getPort('eventBus') as Record<string, (...args: unknown[]) => unknown> | null;
    if (eb?.on) {
      const mainErrorHandler = (data: Record<string, unknown>) => {
        captureError(data.error as Error || data.message as string, 'main.error', ERROR_LEVELS.ERROR, data);
      };
      
      if (MAIN_EVENTS?.INIT_ERROR) {
        eb.on(MAIN_EVENTS.INIT_ERROR, mainErrorHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.INIT_ERROR, mainErrorHandler));
      }
      
      if (MAIN_EVENTS?.NAVIGATION_ERROR) {
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, mainErrorHandler);
        _cleanups.push(() => eb.off?.(MAIN_EVENTS.NAVIGATION_ERROR, mainErrorHandler));
      }
    }
    
    _enabled = true;
    return { ok: true, version: VERSION };
    
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function destroy() {
  for (const fn of _cleanups) {
    try { fn(); } catch (e) { }
  }
  _cleanups = [];
  _errorHandlers = [];
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function captureError(error: Error, source: string, level: string, context: Record<string, unknown>) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  
  const entry = _createErrorEntry(error, source || 'manual', level || ERROR_LEVELS.ERROR, context || {});
  
  _addToHistory(entry);
  _updateMetrics(entry);
  _notifyHandlers(entry);
  _reportToTelemetry(entry);
  _emitEvent(entry);
  
  return { ok: true, errorId: entry.id };
}

export function captureFeatureError(featureId: string, error: Error, context: Record<string, unknown>) {
  return captureError(error, `feature:${featureId}`, ERROR_LEVELS.ERROR, context);
}

export function onError(handler: (...args: unknown[]) => void) {
  if (typeof handler !== 'function') return () => {};
  _errorHandlers.push(handler);
  return () => {
    const idx = _errorHandlers.indexOf(handler);
    if (idx > -1) _errorHandlers.splice(idx, 1);
  };
}

export function getErrorHistory(options: Record<string, unknown>) {
  let errors = _errorHistory.slice();
  if (options?.level) errors = errors.filter(e => e.level === options.level);
  if (options?.source) errors = errors.filter(e => e.source === options.source);
  if (options?.limit) errors = errors.slice(0, options.limit as number);
  return errors;
}

export function getErrorCountBySource() {
  return Object.fromEntries(_errorCountBySource);
}

export function getErrorRate() {
  const now = Date.now();
  const recentErrors = _errorHistory.filter(e => (now - (e.timestamp as number)) < ERROR_RATE_WINDOW_MS);
  return { errorsPerMinute: recentErrors.length, windowMs: ERROR_RATE_WINDOW_MS };
}

export function clearHistory() {
  _errorHistory = [];
  _errorCountBySource.clear();
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, { historySize: _errorHistory.length, errorRate: getErrorRate() });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, errorLevels: ERROR_LEVELS, metrics: getMetrics() };
}

export function healthCheck() {
  const errorRate = getErrorRate();
  const highErrorRate = errorRate.errorsPerMinute > 10;
  
  const checks = { enabled: _enabled, hasEventBus: !!_getPort('eventBus'), lowErrorRate: !highErrorRate };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  else if (highErrorRate) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    errorRate,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  ERROR_LEVELS,
  init,
  destroy,
  cleanup,
  captureError,
  captureFeatureError,
  onError,
  getErrorHistory,
  getErrorCountBySource,
  getErrorRate,
  clearHistory,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
