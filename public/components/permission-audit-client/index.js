import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { MODULE_ID, CONFIG, ACTIONS, createMetrics, logger } from "./config.js";
import * as buffer from "./buffer.js";
import * as api from "./api.js";
import * as hooks from "./hooks.js";
const VERSION = "2.5.0-P2-ENTERPRISE";
const PERMISSION_AUDIT_EVENTS = {
  READY: "permission-audit:ready",
  ERROR: "permission-audit:error",
  BATCH_SENT: "permission-audit:batch-sent",
  BATCH_FAILED: "permission-audit:batch-failed"
};
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isDebugEnabled = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug;
};
let _isInitialized = false;
let _metrics = createMetrics();
const _listeners = /* @__PURE__ */ new Map();
const emit = (event, data) => {
  if (_listeners.has(event)) {
    for (const fn of _listeners.get(event)) {
      try {
        fn(data);
      } catch (e) {
        logger.error("Listener error:", e);
      }
    }
  }
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    const eventKey = PERMISSION_AUDIT_EVENTS[event.toUpperCase().replace(/-/g, "_")] || `permission-audit:${event}`;
    eb.emit(eventKey, data);
  }
};
const on = (event, callback) => {
  if (!_listeners.has(event)) _listeners.set(event, /* @__PURE__ */ new Set());
  _listeners.get(event).add(callback);
  return () => {
    _listeners.get(event).delete(callback);
  };
};
const off = (event, callback) => {
  if (_listeners.has(event)) {
    if (callback) _listeners.get(event).delete(callback);
    else _listeners.delete(event);
  }
};
const trackTelemetry = (action, data = {}) => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort("telemetry");
  tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
};
const bufferEntry = (permissionKey, action, options = {}) => {
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
  return api.sendBatch(batch, _metrics, trackTelemetry, emit).catch((error) => {
    buffer.restoreBatch(batch);
    throw error;
  });
};
const init = (options = {}) => {
  if (_isInitialized) return true;
  api.createAbortController();
  buffer.startFlushTimer(flush);
  if (options.hookPermissionsGuard !== false) {
    setTimeout(() => {
      hooks.hookPermissionsGuard(bufferEntry);
    }, 1e3);
  }
  window.addEventListener("beforeunload", buffer.flushBeforeUnload);
  _isInitialized = true;
  trackTelemetry("ready", { initialized: true });
  emit("ready", { initialized: true });
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
  logger.info("Destroyed");
};
const reset = () => {
  destroy();
  _metrics = createMetrics();
  logger.info("Reset complete");
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
  for (const key of Object.keys(checks)) {
    total++;
    if (checks[key]) passed++;
  }
  const status = passed === total ? "HEALTHY" : passed >= total * 0.5 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const getStatus = () => ({
  name: MODULE_ID,
  version: VERSION,
  initialized: _isInitialized,
  bufferSize: buffer.getBufferSize(),
  flushTimerActive: buffer.isFlushTimerActive(),
  permissionsGuardHooked: hooks.isHooked(),
  metrics: { ..._metrics },
  healthCheck: healthCheck()
});
const info = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  initialized: _isInitialized,
  portsInitialized: Ports.isInitialized(),
  bufferSize: buffer.getBufferSize(),
  permissionsGuardHooked: hooks.isHooked(),
  config: { batchSize: CONFIG.batchSize, flushInterval: CONFIG.flushInterval },
  metrics: { ..._metrics }
});
const getMetrics = () => ({ ..._metrics });
const PermissionAuditClient = {
  init,
  destroy,
  reset,
  // @ts-expect-error strict migration — TS2345
  list: (opts = {}) => api.list(opts, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  getStats: (days = 30) => api.getStats(days, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  getUserHistory: (userId = null, limit = 50) => api.getUserHistory(userId, limit, _metrics, trackTelemetry, emit),
  // @ts-expect-error strict migration — TS2345
  log: (pk, act, opts = {}) => api.log(pk, act, opts, _metrics, trackTelemetry, emit),
  buffer: bufferEntry,
  flush,
  on,
  off,
  logAllowed: (pk, opts = {}) => {
    bufferEntry(pk, "allowed", opts);
  },
  logDenied: (pk, opts = {}) => {
    bufferEntry(pk, "denied", opts);
  },
  logElevated: (pk, opts = {}) => {
    bufferEntry(pk, "elevated", opts);
  },
  logRevoked: (pk, opts = {}) => {
    bufferEntry(pk, "revoked", opts);
  },
  hookPermissionsGuard: () => {
    hooks.hookPermissionsGuard(bufferEntry);
  },
  unhookPermissionsGuard: hooks.unhookPermissionsGuard,
  startFlushTimer: () => {
    buffer.startFlushTimer(flush);
  },
  stopFlushTimer: buffer.stopFlushTimer,
  getBufferSize: buffer.getBufferSize,
  isInitialized: () => _isInitialized,
  isHooked: hooks.isHooked,
  healthCheck,
  getStatus,
  info,
  getMetrics,
  getVersion: () => VERSION,
  injectPorts,
  getPorts,
  ACTIONS,
  VERSION,
  MODULE_ID,
  PERMISSION_AUDIT_EVENTS
};
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.permissionAuditClient = PermissionAuditClient;
  if (!isStrict()) {
    window.PermissionAuditClient = PermissionAuditClient;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.PermissionAuditClient" });
  }
}
var permission_audit_client_default = PermissionAuditClient;
export {
  ACTIONS,
  MODULE_ID,
  PERMISSION_AUDIT_EVENTS,
  PermissionAuditClient,
  VERSION,
  permission_audit_client_default as default,
  getPorts,
  injectPorts
};
