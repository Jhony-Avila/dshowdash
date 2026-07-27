
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.audit-trail
// PURPOSE: Main audit trail client for enterprise audit logging
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes audit trail client
// @contract DESTROY - destroy() destroys client and cleans up
// @contract RESET - reset() resets client and clears data
// @contract CONFIGURE - configure(options) updates configuration
// @contract LOG - log(actionKey, options) logs audit entry
// @contract LOG_LOGIN - logLogin(userId, meta) logs login event
// @contract LOG_LOGOUT - logLogout(userId, meta) logs logout event
// @contract LOG_PERMISSION_CHANGE - logPermissionChange(userId, old, new) logs permission change
// @contract LOG_FEATURE_FLAG_CHANGE - logFeatureFlagChange(key, old, new) logs flag change
// @contract LOG_PANEL_ACTION - logPanelAction(panelId, action, meta) logs panel action
// @contract LOG_JOB_ACTION - logJobAction(jobId, action, meta) logs job action
// @contract LOG_EXPORT - logExport(rt, ri, fmt, meta) logs export action
// @contract LOG_CREATE - logCreate(rt, ri, nv, meta) logs create action
// @contract LOG_UPDATE - logUpdate(rt, ri, ov, nv, meta) logs update action
// @contract LOG_DELETE - logDelete(rt, ri, ov, meta) logs delete action
// @contract FLUSH - flush() flushes buffer to server
// @contract GET_HISTORY - getHistory(opts) retrieves audit history
// @contract ON - on(event, callback) registers event listener
// @contract OFF - off(event, callback) removes event listener
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: ACTION_TYPES, RESOURCE_TYPES, createDefaultConfig, createMetrics, logger
//          from ./config.js
// IMPORTS: addToBuffer, extractBatch, getBufferSize, restoreBatch,
//          startFlushTimer, stopFlushTimer, flushBeforeUnload,
//          isFlushTimerActive, clearBuffer from ./buffer.js
// IMPORTS: createLogEntry, logLogin, logLogout, logPermissionChange,
//          logFeatureFlagChange, logPanelAction, logJobAction,
//          logExport, logCreate, logUpdate, logDelete from ./loggers.js
// IMPORTS: sendBatch, getHistory, createAbortController, abortAll,
//          getAbortController from ./api.js
// PROVIDES: AuditTrailClient, AUDIT_TRAIL_EVENTS, ACTION_TYPES, RESOURCE_TYPES,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v2.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.7.0: Strict mode integration
// @changelog v2.6.0-ENTERPRISE: ES6 modernization
// @changelog P18EC: Events Contracts Migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ACTION_TYPES, RESOURCE_TYPES, createDefaultConfig, createMetrics, logger, AuditConfig, AuditMetrics } from './config.js';
import * as buffer from './buffer.js';
import * as loggers from './loggers.js';
import * as api from './api.js';

export const VERSION = '2.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.audit-trail';

const hasWindow = typeof window !== 'undefined';

export const AUDIT_TRAIL_EVENTS = Object.freeze({
  READY: 'audit-trail:ready',
  ERROR: 'audit-trail:error',
  BATCH_SENT: 'audit-trail:batch-sent',
  BATCH_FAILED: 'audit-trail:batch-failed'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): Record<string, unknown> | null => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = (): Record<string, unknown> => Ports.snapshot();

const _isDebugEnabled = (): boolean => !!(_getPort('config') as Record<string, Record<string, unknown>> | null)?.app?.debug;

let _config: AuditConfig = createDefaultConfig();
let _metrics: AuditMetrics = createMetrics();
let _isInitialized = false;
const _listeners = new Map<string, Set<(data: Record<string, unknown>) => void>>();

const emit = (event: string, data: Record<string, unknown>): void => {
  if (_listeners.has(event)) {
    for (const fn of _listeners.get(event)!) {
      try {
        fn(data);
      } catch (e) {
        logger.error('Listener error:', e);
      }
    }
  }

  const eb = _getPort('eventBus') as { emit?: (key: string, data: Record<string, unknown>) => void } | null;
  if (eb?.emit) {
    const upperKey = event.toUpperCase().replace(/-/g, '_') as keyof typeof AUDIT_TRAIL_EVENTS;
    const eventKey = AUDIT_TRAIL_EVENTS[upperKey] || `audit-trail:${event}`;
    eb.emit(eventKey, data);
  }
};

const on = (event: string, callback: (data: Record<string, unknown>) => void): (() => boolean) => {
  if (!_listeners.has(event)) {
    _listeners.set(event, new Set());
  }
  _listeners.get(event)!.add(callback);
  return () => _listeners.get(event)!.delete(callback);
};

const off = (event: string, callback?: (data: Record<string, unknown>) => void): void => {
  if (_listeners.has(event)) {
    if (callback) {
      _listeners.get(event)!.delete(callback);
    } else {
      _listeners.delete(event);
    }
  }
};

const trackTelemetry = (action: string, data: Record<string, unknown> = {}): void => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort('telemetry') as { track?: (key: string, data: Record<string, unknown>) => void } | null;
  tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
};

const log = (actionKey: string, options: Record<string, unknown> = {}): boolean => {
  if (!_config.enabled) return false;

  const entry = loggers.createLogEntry(actionKey, options);
  buffer.addToBuffer(entry, _config, flush);
  _metrics.logged++;
  _metrics.lastActivity = Date.now();
  logger.info(`Audit logged: ${actionKey}`, entry);
  return true;
};

const flush = (): Promise<{ success: boolean; sent?: number }> => {
  if (buffer.getBufferSize() === 0) {
    return Promise.resolve({ success: true, sent: 0 });
  }

  const batch = buffer.extractBatch();
  return api.sendBatch(batch, _config, _metrics as unknown as Record<string, number>, trackTelemetry, emit)
    .then((result) => {
      if (!result.success) {
        buffer.restoreBatch(batch);
      }
      return result;
    });
};

const configure = (options: Partial<AuditConfig> = {}): void => {
  _config = { ..._config, ...options };
  logger.info('Config updated:', _config);
};

const init = (options: Partial<AuditConfig> = {}): { success: boolean; version: string } => {
  if (_isInitialized) {
    return { success: true, version: VERSION };
  }

  _initPorts();
  configure(options);
  api.createAbortController();

  if (_config.enabled && hasWindow) {
    buffer.startFlushTimer(_config, flush);
    window.addEventListener('beforeunload', buffer.flushBeforeUnload);
    _isInitialized = true;
    trackTelemetry('ready', { version: VERSION });
    emit('ready', { initialized: true });
    logger.info(`${VERSION} initialized`);
  }

  return { success: true, version: VERSION };
};

const destroy = (): void => {
  buffer.stopFlushTimer();
  buffer.flushBeforeUnload();
  api.abortAll();
  _listeners.clear();
  buffer.clearBuffer();
  _isInitialized = false;
  logger.info('Destroyed');
};

const reset = (): void => {
  destroy();
  _metrics = createMetrics();
  logger.info('Reset complete');
};

const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const abortController = api.getAbortController();

  const checks = {
    initialized: _isInitialized,
    enabled: _config.enabled,
    flushTimerActive: buffer.isFlushTimerActive(),
    bufferHealthy: buffer.getBufferSize() < _config.batchSize * 5,
    abortControllerActive: !!abortController && !abortController.signal.aborted,
    lowErrorRate: _metrics.errors < (_metrics.flushCount || 0) * 0.1 || (_metrics.flushCount || 0) === 0,
    portsInitialized: portsSnapshot._initialized
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  let status = 'UNHEALTHY';
  if (passed === total) status = 'HEALTHY';
  else if (passed >= total * 0.5) status = 'DEGRADED';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    portsInitialized: portsSnapshot._initialized,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};

const getStatus = () => ({
  name: MODULE_ID,
  version: VERSION,
  initialized: _isInitialized,
  enabled: _config.enabled,
  bufferSize: buffer.getBufferSize(),
  flushTimerActive: buffer.isFlushTimerActive(),
  metrics: getMetrics(),
  healthCheck: healthCheck()
});

const getMetrics = () => ({
  bufferSize: buffer.getBufferSize(),
  ..._metrics
});

const info = () => {
  const portsSnapshot = Ports.snapshot();

  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _isInitialized,
    portsInitialized: portsSnapshot._initialized,
    config: { ..._config },
    metrics: getMetrics(),
    flushTimerActive: buffer.isFlushTimerActive(),
    timestamp: new Date().toISOString()
  };
};

const AuditTrailClient = {
  init,
  destroy,
  reset,
  configure,
  log,
  logLogin: (userId: string, meta: Record<string, unknown>) => log('auth.login', loggers.logLogin(userId, meta)),
  logLogout: (userId: string, meta: Record<string, unknown>) => log('auth.logout', loggers.logLogout(userId, meta)),
  logPermissionChange: (userId: string, old: unknown, nu: unknown) => log('permission.change', loggers.logPermissionChange(userId, old, nu)),
  logFeatureFlagChange: (key: string, old: unknown, nu: unknown) => log('feature_flag.change', loggers.logFeatureFlagChange(key, old, nu)),
  logPanelAction: (panelId: string, action: string, meta: Record<string, unknown>) => log(`panel.${action}`, loggers.logPanelAction(panelId, action, meta)),
  logJobAction: (jobId: string, action: string, meta: Record<string, unknown>) => log(`job.${action}`, loggers.logJobAction(jobId, action, meta)),
  logExport: (rt: string, ri: string, fmt: string, meta: Record<string, unknown>) => log(`${rt}.export`, loggers.logExport(rt, ri, fmt, meta)),
  logCreate: (rt: string, ri: string, nv: unknown, meta: Record<string, unknown>) => log(`${rt}.create`, loggers.logCreate(rt, ri, nv, meta)),
  logUpdate: (rt: string, ri: string, ov: unknown, nv: unknown, meta: Record<string, unknown>) => log(`${rt}.update`, loggers.logUpdate(rt, ri, ov, nv, meta)),
  logDelete: (rt: string, ri: string, ov: unknown, meta: Record<string, unknown>) => log(`${rt}.delete`, loggers.logDelete(rt, ri, ov, meta)),
  flush,
  getHistory: (opts: { limit?: string; offset?: string; action?: string; resource_type?: string; from?: string; to?: string }) => api.getHistory(opts, _config, trackTelemetry, emit),
  on,
  off,
  startFlushTimer: () => buffer.startFlushTimer(_config, flush),
  stopFlushTimer: buffer.stopFlushTimer,
  healthCheck,
  getStatus,
  getMetrics,
  getVersion: () => VERSION,
  info,
  isInitialized: () => _isInitialized,
  injectPorts,
  getPorts,
  ACTION_TYPES,
  RESOURCE_TYPES,
  AUDIT_TRAIL_EVENTS,
  VERSION,
  MODULE_ID
};

if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    (window as any).AuditTrailClient = AuditTrailClient;
  } else {
    recordViolation('MODULE_STRICT_BLOCK', { module: MODULE_ID });
  }
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.auditTrailClient = {
    getVersion: () => VERSION,
    info: () => AuditTrailClient.info(),
    healthCheck: () => AuditTrailClient.healthCheck(),
    getStatus: () => AuditTrailClient.getStatus(),
    getMetrics: () => AuditTrailClient.getMetrics()
  };
}

export default AuditTrailClient;
export { AuditTrailClient, ACTION_TYPES, RESOURCE_TYPES };
