// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.permission-audit-client
// PURPOSE: Permission audit client with buffer/batch flush and guard hooking
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes audit client
// @contract DESTROY - destroy() destroys audit client
// @contract RESET - reset() resets audit client
// @contract LIST - list(options) lists audit entries
// @contract GET_STATS - getStats(days) gets audit statistics
// @contract GET_USER_HISTORY - getUserHistory(userId, limit) gets user audit history
// @contract LOG - log(permissionKey, action, options) logs audit entry
// @contract BUFFER - buffer(permissionKey, action, options) buffers audit entry
// @contract FLUSH - flush() flushes buffered entries
// @contract HOOK_GUARD - hookPermissionsGuard() hooks to PermissionsGuard
// @contract UNHOOK_GUARD - unhookPermissionsGuard() unhooks from PermissionsGuard
// @contract ON - on(event, callback) subscribes to events
// @contract OFF - off(event, callback) unsubscribes from events
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: VERSION, MODULE_ID, CONFIG, ACTIONS, createMetrics, logger from ./config.js
// IMPORTS: buffer functions from ./buffer.js
// IMPORTS: api functions from ./api.js
// IMPORTS: hooks functions from ./hooks.js
// PROVIDES: PermissionAuditClient, init, destroy, reset, list, getStats, getUserHistory,
//           log, buffer, flush, on, off, logAllowed, logDenied, logElevated, logRevoked,
//           hookPermissionsGuard, unhookPermissionsGuard, healthCheck, info, getMetrics,
//           injectPorts, getPorts, VERSION, MODULE_ID, PERMISSION_AUDIT_EVENTS, ACTIONS
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.0-ENTERPRISE-STRICT-MODE: Strict mode integration
// @changelog v2.4.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { VERSION as CONFIG_VERSION, MODULE_ID, CONFIG, ACTIONS, createMetrics, logger } from './config.js';
import * as buffer from './buffer.js';
import * as api from './api.js';
import * as hooks from './hooks.js';

export const VERSION = '2.5.0-P2-ENTERPRISE';

const PERMISSION_AUDIT_EVENTS = {
  READY: 'permission-audit:ready',
  ERROR: 'permission-audit:error',
  BATCH_SENT: 'permission-audit:batch-sent',
  BATCH_FAILED: 'permission-audit:batch-failed'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): ReturnType<typeof Ports.get> => Ports.get(name);

export const injectPorts = (p: Parameters<typeof Ports.inject>[0]): ReturnType<typeof Ports.inject> => Ports.inject(p);
export const getPorts = (): ReturnType<typeof Ports.snapshot> => Ports.snapshot();

const _isDebugEnabled = () => {
  const cfg = _getPort('config');
  return cfg?.app?.debug;
};

let _isInitialized = false;
let _metrics: ReturnType<typeof createMetrics> = createMetrics();
const _listeners = new Map();

const emit = (event: string, data?: Record<string, unknown>): void => {
  if (_listeners.has(event)) {
    for (const fn of _listeners.get(event)) {
      try { fn(data); } catch (e) { logger.error('Listener error:', e); }
    }
  }
  const eb = _getPort('eventBus');
  if (eb?.emit) {
    const eventKey = (PERMISSION_AUDIT_EVENTS as Record<string, string>)[event.toUpperCase().replace(/-/g, '_')] || `permission-audit:${event}`;
    eb.emit(eventKey, data);
  }
};

const on = (event: string, callback: (data?: Record<string, unknown>) => void): (() => void) => {
  if (!_listeners.has(event)) _listeners.set(event, new Set());
  _listeners.get(event).add(callback);
  return () => { _listeners.get(event).delete(callback); };
};

const off = (event: string, callback?: (data?: Record<string, unknown>) => void): void => {
  if (_listeners.has(event)) {
    if (callback) _listeners.get(event).delete(callback);
    else _listeners.delete(event);
  }
};

const trackTelemetry = (action: string, data: Record<string, unknown> = {}): void => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort('telemetry');
  tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
};

const bufferEntry = (permissionKey: string, action: string, options: { resourceType?: string; resourceId?: string } & Record<string, unknown> = {}) => {
  buffer.addToBuffer({
    permission_key: permissionKey,
    action,
    resource_type: options.resourceType || null,
    resource_id: options.resourceId || null,
    context: options.context || null,
    timestamp: Date.now()
  // @ts-expect-error strict migration — TS2345
  }, _metrics, flush);
};

const flush = () => {
  if (buffer.getBufferSize() === 0) return Promise.resolve();
  const batch = buffer.extractBatch();
  // @ts-expect-error strict migration — TS2345
  return api.sendBatch(batch, _metrics, trackTelemetry, emit).catch((error: Error) => {
    buffer.restoreBatch(batch);
    throw error;
  });
};

const init = (options: { hookPermissionsGuard?: boolean } & Record<string, unknown> = {}) => {
  if (_isInitialized) return true;
  api.createAbortController();
  buffer.startFlushTimer(flush);
  if (options.hookPermissionsGuard !== false) {
    setTimeout(() => { hooks.hookPermissionsGuard(bufferEntry); }, 1000);
  }
  window.addEventListener('beforeunload', buffer.flushBeforeUnload);
  _isInitialized = true;
  trackTelemetry('ready', { initialized: true });
  emit('ready', { initialized: true });
  logger.info(`${VERSION} initialized`);
  return true;
};

const destroy = () => {
  buffer.stopFlushTimer();
  hooks.unhookPermissionsGuard();
  buffer.flushBeforeUnload();
  api.abortAll();
  _listeners.clear();
  buffer.clearBuffer();
  _isInitialized = false;
  logger.info('Destroyed');
};

const reset = () => {
  destroy();
  _metrics = createMetrics();
  logger.info('Reset complete');
};

const healthCheck = () => {
  const checks = {
    initialized: _isInitialized,
    flushTimerActive: buffer.isFlushTimerActive(),
    bufferHealthy: buffer.getBufferSize() < CONFIG.batchSize * 2,
    // @ts-expect-error strict migration — TS2531
    abortControllerActive: !!api.getAbortController() && !api.getAbortController().signal.aborted,
    permissionsGuardHooked: hooks.isHooked(),
    lowErrorRate: _metrics.errorCount < (_metrics.logCount + _metrics.flushCount) * 0.1 || _metrics.logCount === 0
  };
  let passed = 0;
  let total = 0;
  for (const key of Object.keys(checks) as Array<keyof typeof checks>) {
    total++;
    if (checks[key]) passed++;
  }
  const status = passed === total ? 'HEALTHY' : passed >= total * 0.5 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

const getStatus = () => ({
  name: MODULE_ID, version: VERSION, initialized: _isInitialized, bufferSize: buffer.getBufferSize(),
  flushTimerActive: buffer.isFlushTimerActive(), permissionsGuardHooked: hooks.isHooked(),
  metrics: { ..._metrics }, healthCheck: healthCheck()
});

const info = () => ({
  version: VERSION, moduleId: MODULE_ID, initialized: _isInitialized, portsInitialized: Ports.isInitialized(),
  bufferSize: buffer.getBufferSize(), permissionsGuardHooked: hooks.isHooked(),
  config: { batchSize: CONFIG.batchSize, flushInterval: CONFIG.flushInterval }, metrics: { ..._metrics }
});

const getMetrics = () => ({ ..._metrics });

const PermissionAuditClient = {
  init, destroy, reset,
  // @ts-expect-error strict migration — TS2345
  list: (opts: Record<string, string> = {}) => api.list(opts, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  getStats: (days = 30) => api.getStats(days, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  getUserHistory: (userId: string | null = null, limit = 50) => api.getUserHistory(userId, limit, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  log: (pk: string, act: string, opts: Record<string, unknown> = {}) => api.log(pk, act, opts, _metrics, trackTelemetry, emit),
  buffer: bufferEntry, flush, on, off,
  logAllowed: (pk: string, opts: Record<string, unknown> = {}) => { bufferEntry(pk, 'allowed', opts); },
  logDenied: (pk: string, opts: Record<string, unknown> = {}) => { bufferEntry(pk, 'denied', opts); },
  logElevated: (pk: string, opts: Record<string, unknown> = {}) => { bufferEntry(pk, 'elevated', opts); },
  logRevoked: (pk: string, opts: Record<string, unknown> = {}) => { bufferEntry(pk, 'revoked', opts); },
  hookPermissionsGuard: () => { hooks.hookPermissionsGuard(bufferEntry); },
  unhookPermissionsGuard: hooks.unhookPermissionsGuard,
  startFlushTimer: () => { buffer.startFlushTimer(flush); },
  stopFlushTimer: buffer.stopFlushTimer,
  getBufferSize: buffer.getBufferSize,
  isInitialized: () => _isInitialized,
  isHooked: hooks.isHooked,
  healthCheck, getStatus, info, getMetrics, getVersion: () => VERSION,
  injectPorts, getPorts, ACTIONS, VERSION, MODULE_ID, PERMISSION_AUDIT_EVENTS
};

if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.permissionAuditClient = PermissionAuditClient;

  // Global só exposto fora do strict mode
  if (!isStrict()) {
    (window as any).PermissionAuditClient = PermissionAuditClient;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.PermissionAuditClient' });
  }
}

export default PermissionAuditClient;
export { PermissionAuditClient, PERMISSION_AUDIT_EVENTS, ACTIONS, MODULE_ID };
