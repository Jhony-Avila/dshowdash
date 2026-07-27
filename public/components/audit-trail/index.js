import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { ACTION_TYPES, RESOURCE_TYPES, createDefaultConfig, createMetrics, logger } from "./config.js";
import * as buffer from "./buffer.js";
import * as loggers from "./loggers.js";
import * as api from "./api.js";
const VERSION = "2.8.0-P2-ENTERPRISE";
const MODULE_ID = "components.audit-trail";
const hasWindow = typeof window !== "undefined";
const AUDIT_TRAIL_EVENTS = Object.freeze({
  READY: "audit-trail:ready",
  ERROR: "audit-trail:error",
  BATCH_SENT: "audit-trail:batch-sent",
  BATCH_FAILED: "audit-trail:batch-failed"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isDebugEnabled = () => !!_getPort("config")?.app?.debug;
let _config = createDefaultConfig();
let _metrics = createMetrics();
let _isInitialized = false;
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
    const upperKey = event.toUpperCase().replace(/-/g, "_");
    const eventKey = AUDIT_TRAIL_EVENTS[upperKey] || `audit-trail:${event}`;
    eb.emit(eventKey, data);
  }
};
const on = (event, callback) => {
  if (!_listeners.has(event)) {
    _listeners.set(event, /* @__PURE__ */ new Set());
  }
  _listeners.get(event).add(callback);
  return () => _listeners.get(event).delete(callback);
};
const off = (event, callback) => {
  if (_listeners.has(event)) {
    if (callback) {
      _listeners.get(event).delete(callback);
    } else {
      _listeners.delete(event);
    }
  }
};
const trackTelemetry = (action, data = {}) => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort("telemetry");
  tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
};
const log = (actionKey, options = {}) => {
  if (!_config.enabled) return false;
  const entry = loggers.createLogEntry(actionKey, options);
  buffer.addToBuffer(entry, _config, flush);
  _metrics.logged++;
  _metrics.lastActivity = Date.now();
  logger.info(`Audit logged: ${actionKey}`, entry);
  return true;
};
const flush = () => {
  if (buffer.getBufferSize() === 0) {
    return Promise.resolve({ success: true, sent: 0 });
  }
  const batch = buffer.extractBatch();
  return api.sendBatch(batch, _config, _metrics, trackTelemetry, emit).then((result) => {
    if (!result.success) {
      buffer.restoreBatch(batch);
    }
    return result;
  });
};
const configure = (options = {}) => {
  _config = { ..._config, ...options };
  logger.info("Config updated:", _config);
};
const init = (options = {}) => {
  if (_isInitialized) {
    return { success: true, version: VERSION };
  }
  _initPorts();
  configure(options);
  api.createAbortController();
  if (_config.enabled && hasWindow) {
    buffer.startFlushTimer(_config, flush);
    window.addEventListener("beforeunload", buffer.flushBeforeUnload);
    _isInitialized = true;
    trackTelemetry("ready", { version: VERSION });
    emit("ready", { initialized: true });
    logger.info(`${VERSION} initialized`);
  }
  return { success: true, version: VERSION };
};
const destroy = () => {
  buffer.stopFlushTimer();
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
  let status = "UNHEALTHY";
  if (passed === total) status = "HEALTHY";
  else if (passed >= total * 0.5) status = "DEGRADED";
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
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
const AuditTrailClient = {
  init,
  destroy,
  reset,
  configure,
  log,
  logLogin: (userId, meta) => log("auth.login", loggers.logLogin(userId, meta)),
  logLogout: (userId, meta) => log("auth.logout", loggers.logLogout(userId, meta)),
  logPermissionChange: (userId, old, nu) => log("permission.change", loggers.logPermissionChange(userId, old, nu)),
  logFeatureFlagChange: (key, old, nu) => log("feature_flag.change", loggers.logFeatureFlagChange(key, old, nu)),
  logPanelAction: (panelId, action, meta) => log(`panel.${action}`, loggers.logPanelAction(panelId, action, meta)),
  logJobAction: (jobId, action, meta) => log(`job.${action}`, loggers.logJobAction(jobId, action, meta)),
  logExport: (rt, ri, fmt, meta) => log(`${rt}.export`, loggers.logExport(rt, ri, fmt, meta)),
  logCreate: (rt, ri, nv, meta) => log(`${rt}.create`, loggers.logCreate(rt, ri, nv, meta)),
  logUpdate: (rt, ri, ov, nv, meta) => log(`${rt}.update`, loggers.logUpdate(rt, ri, ov, nv, meta)),
  logDelete: (rt, ri, ov, meta) => log(`${rt}.delete`, loggers.logDelete(rt, ri, ov, meta)),
  flush,
  getHistory: (opts) => api.getHistory(opts, _config, trackTelemetry, emit),
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
    window.AuditTrailClient = AuditTrailClient;
  } else {
    recordViolation("MODULE_STRICT_BLOCK", { module: MODULE_ID });
  }
  window.__dev = window.__dev || {};
  window.__dev.auditTrailClient = {
    getVersion: () => VERSION,
    info: () => AuditTrailClient.info(),
    healthCheck: () => AuditTrailClient.healthCheck(),
    getStatus: () => AuditTrailClient.getStatus(),
    getMetrics: () => AuditTrailClient.getMetrics()
  };
}
var audit_trail_default = AuditTrailClient;
export {
  ACTION_TYPES,
  AUDIT_TRAIL_EVENTS,
  AuditTrailClient,
  MODULE_ID,
  RESOURCE_TYPES,
  VERSION,
  audit_trail_default as default,
  getPorts,
  injectPorts
};
