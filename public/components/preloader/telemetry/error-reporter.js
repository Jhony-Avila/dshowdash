import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.4.0-P17WI";
const MODULE_ID = "boot-error-reporter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, warn(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, error(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const _config = { enabled: true, endpoint: null, apiKey: null, batchSize: 10, flushInterval: 3e4, maxRetries: 3, retryDelay: 5e3, includeUserAgent: true, includeScreenInfo: true, includePerformance: true, customHeaders: {}, beforeSend: null, onError: null, onSuccess: null };
const MAX_QUEUE_SIZE = 100;
const _errorQueue = [];
const _sentErrors = /* @__PURE__ */ new Set();
let _flushTimer = null;
const _metrics = { totalErrors: 0, sentErrors: 0, failedSends: 0, duplicatesSkipped: 0, lastSentAt: null };
function configure(options) {
  Object.assign(_config, options || {});
  if (_config.enabled && _config.flushInterval > 0) _startAutoFlush();
  log.info("Error reporter configured", { endpoint: _config.endpoint, enabled: _config.enabled });
}
function getConfig() {
  return Object.assign({}, _config, { apiKey: _config.apiKey ? "***" : null });
}
function report(error, context = {}) {
  if (!_config.enabled) return null;
  const errorReport = _createErrorReport(error, context);
  const fingerprint = _getFingerprint(errorReport);
  if (_sentErrors.has(fingerprint)) {
    _metrics.duplicatesSkipped++;
    log.debug("Duplicate error skipped", { fingerprint });
    return null;
  }
  errorReport.fingerprint = fingerprint;
  if (_errorQueue.length >= MAX_QUEUE_SIZE) {
    _errorQueue.shift();
    log.warn("Error queue overflow, oldest entry discarded", { queueSize: MAX_QUEUE_SIZE });
  }
  _errorQueue.push(errorReport);
  _metrics.totalErrors++;
  log.info("Error queued for reporting", { type: errorReport.type, message: errorReport.message ? errorReport.message.substring(0, 100) : "", queueSize: _errorQueue.length });
  if (context.critical || _errorQueue.length >= _config.batchSize) flush();
  return errorReport;
}
function reportBootError(bootData, error) {
  return report(error, { type: "boot-error", bootId: bootData.bootId, phase: bootData.phase, progress: bootData.progress, duration: bootData.duration, trace: bootData.trace, critical: true });
}
function reportDegradedBoot(bootData, reason) {
  return report(new Error(`Degraded boot: ${reason}`), { type: "boot-degraded", bootId: bootData.bootId, phase: bootData.phase, progress: bootData.progress, duration: bootData.duration, reason });
}
function reportTimeout(bootData, phase, timeoutMs) {
  return report(new Error(`Timeout in phase: ${phase}`), { type: "boot-timeout", bootId: bootData.bootId, phase, timeoutMs, progress: bootData.progress });
}
function _createErrorReport(error, context) {
  let url = null;
  if (typeof location !== "undefined") url = location.href;
  return { id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, timestamp: (/* @__PURE__ */ new Date()).toISOString(), type: context.type || "error", message: error ? error.message : String(error), name: error ? error.name : "Error", stack: error ? error.stack : null, bootId: context.bootId || null, phase: context.phase || null, progress: context.progress || null, duration: context.duration || null, environment: { url, userAgent: _config.includeUserAgent && typeof navigator !== "undefined" ? navigator.userAgent : null, language: typeof navigator !== "undefined" ? navigator.language : null, online: typeof navigator !== "undefined" ? navigator.onLine : null, screen: _config.includeScreenInfo && typeof screen !== "undefined" ? { width: screen.width, height: screen.height, colorDepth: screen.colorDepth } : null }, performance: _config.includePerformance ? _getPerformanceData() : null, metadata: context.metadata || {}, trace: context.trace || [] };
}
function _getPerformanceData() {
  if (typeof performance === "undefined") return null;
  const timing = performance.timing || {};
  return { domReady: timing.domContentLoadedEventEnd - timing.navigationStart, loadComplete: timing.loadEventEnd - timing.navigationStart, memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null };
}
function _getFingerprint(report2) {
  const parts = [report2.name, report2.message ? report2.message.substring(0, 100) : "", report2.phase, report2.stack ? report2.stack.split("\n")[1] : ""].filter(Boolean);
  return _hashString(parts.join("|"));
}
function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
function flush() {
  if (_errorQueue.length === 0) return Promise.resolve({ sent: 0 });
  if (!_config.endpoint) {
    log.warn("No endpoint configured, errors not sent");
    return Promise.resolve({ sent: 0, error: "No endpoint" });
  }
  const batch = _errorQueue.splice(0, _config.batchSize);
  return _sendBatch(batch).then((response) => {
    batch.forEach((err) => {
      _sentErrors.add(err.fingerprint);
    });
    _metrics.sentErrors += batch.length;
    _metrics.lastSentAt = Date.now();
    if (_config.onSuccess) _config.onSuccess(batch, response);
    log.info("Errors sent successfully", { count: batch.length });
    return { sent: batch.length, response };
  }).catch((error) => {
    _metrics.failedSends++;
    const spaceLeft = MAX_QUEUE_SIZE - _errorQueue.length;
    if (spaceLeft > 0) _errorQueue.unshift(...batch.slice(0, spaceLeft));
    if (_config.onError) _config.onError(error, batch);
    log.error("Failed to send errors", { error: error.message });
    return { sent: 0, error: error.message };
  });
}
function _sendBatch(batch, retryCount = 0) {
  const headers = Object.assign({ "Content-Type": "application/json" }, _config.customHeaders);
  if (_config.apiKey) headers["Authorization"] = `Bearer ${_config.apiKey}`;
  const _ctrl = new AbortController();
  const _tout = setTimeout(() => _ctrl.abort(), 15e3);
  return fetch(_config.endpoint, { method: "POST", headers, body: JSON.stringify({ version: VERSION, sentAt: (/* @__PURE__ */ new Date()).toISOString(), errors: batch }), signal: _ctrl.signal }).then((response) => {
    clearTimeout(_tout);
    if (!response.ok) {
      if (retryCount < _config.maxRetries) {
        return new Promise((resolve) => {
          setTimeout(resolve, _config.retryDelay);
        }).then(() => _sendBatch(batch, retryCount + 1));
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json().catch(() => ({
      ok: true
    }));
  });
}
function _startAutoFlush() {
  _stopAutoFlush();
  _flushTimer = setInterval(() => {
    if (_errorQueue.length > 0) flush();
  }, _config.flushInterval);
}
function _stopAutoFlush() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}
function getQueueSize() {
  return _errorQueue.length;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function clearQueue() {
  const count = _errorQueue.length;
  _errorQueue.length = 0;
  return count;
}
function clearSentHistory() {
  _sentErrors.clear();
}
function disable() {
  _config.enabled = false;
  _stopAutoFlush();
}
function enable() {
  _config.enabled = true;
  if (_config.flushInterval > 0) _startAutoFlush();
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _config.enabled, endpoint: _config.endpoint ? "***configured***" : null, queueSize: _errorQueue.length, metrics: getMetrics() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: _config.enabled ? "HEALTHY" : "DISABLED", moduleId: MODULE_ID, version: VERSION, checks: { enabled: _config.enabled, hasEndpoint: !!_config.endpoint, queueNotOverflowing: _errorQueue.length < 100, hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized }, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, features: ["error-batching", "deduplication", "auto-flush", "retries", "hooks", "performance-data"], status: getStatus() };
}
var error_reporter_default = { VERSION, MODULE_ID, configure, getConfig, report, reportBootError, reportDegradedBoot, reportTimeout, flush, getQueueSize, getMetrics, clearQueue, clearSentHistory, disable, enable, getStatus, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  clearQueue,
  clearSentHistory,
  configure,
  error_reporter_default as default,
  disable,
  enable,
  flush,
  getConfig,
  getMetrics,
  getPorts,
  getQueueSize,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  report,
  reportBootError,
  reportDegradedBoot,
  reportTimeout
};
