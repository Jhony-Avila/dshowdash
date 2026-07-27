import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.3.0-P17WI";
const MODULE_ID = "header/state/validators";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
const _metrics = { validationCount: 0, errorCount: 0, lastValidationAt: null };
function validateConnectivity(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Connectivity data deve ser um objeto");
  }
  return { online: typeof data.online === "boolean" ? data.online : true, rttMs: typeof data.rttMs === "number" && data.rttMs >= 0 ? data.rttMs : null, lastCheckAt: typeof data.lastCheckAt === "number" ? data.lastCheckAt : Date.now(), timeoutCount: typeof data.timeoutCount === "number" && data.timeoutCount >= 0 ? data.timeoutCount : 0 };
}
function validateAlerts(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Alerts data deve ser um objeto");
  }
  return { critical: typeof data.critical === "number" && data.critical >= 0 ? data.critical : 0, warning: typeof data.warning === "number" && data.warning >= 0 ? data.warning : 0, lastCheckAt: typeof data.lastCheckAt === "number" ? data.lastCheckAt : Date.now() };
}
function validateSync(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Sync data deve ser um objeto");
  }
  const validStatuses = ["idle", "syncing", "success", "error"];
  const status = validStatuses.includes(data.status) ? data.status : "idle";
  return { busy: typeof data.busy === "boolean" ? data.busy : false, status, lastSyncAt: typeof data.lastSyncAt === "number" ? data.lastSyncAt : null, failCount: typeof data.failCount === "number" && data.failCount >= 0 ? data.failCount : 0 };
}
function validateHealth(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Health data deve ser um objeto");
  }
  const validStatuses = ["healthy", "degraded", "critical", "unknown"];
  const status = validStatuses.includes(data.status) ? data.status : "unknown";
  return { status, checks: typeof data.checks === "object" && data.checks !== null ? data.checks : {}, responseTimeMs: typeof data.responseTimeMs === "number" && data.responseTimeMs >= 0 ? data.responseTimeMs : null, degradedReason: typeof data.degradedReason === "string" ? data.degradedReason : null, lastCheckAt: typeof data.lastCheckAt === "number" ? data.lastCheckAt : Date.now() };
}
function validateErrors(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Errors data deve ser um objeto");
  }
  return { count: typeof data.count === "number" && data.count >= 0 ? data.count : 0, lastError: typeof data.lastError === "string" ? data.lastError : null, lastErrorAt: typeof data.lastErrorAt === "number" ? data.lastErrorAt : null };
}
function validateEnvironment(env) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  const validEnvs = ["SANDBOX", "DEV", "TEST", "STAGE", "PROD", "UNKNOWN"];
  if (typeof env !== "string" || !validEnvs.includes(env)) {
    _metrics.errorCount++;
    throw new TypeError(`Environment deve ser: ${validEnvs.join(", ")}`);
  }
  return env;
}
function validateScrolled(scrolled) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (typeof scrolled !== "boolean") {
    _metrics.errorCount++;
    throw new TypeError("Scrolled deve ser boolean");
  }
  return scrolled;
}
function validateNetworkQuality(data) {
  _metrics.validationCount++;
  _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== "object") {
    _metrics.errorCount++;
    throw new TypeError("Network quality data deve ser um objeto");
  }
  const validStatuses = ["online", "degraded", "offline"];
  const status = validStatuses.includes(data.status) ? data.status : "unknown";
  return { rtt: typeof data.rtt === "number" && data.rtt >= 0 ? data.rtt : null, effectiveType: typeof data.effectiveType === "string" ? data.effectiveType : null, downlink: typeof data.downlink === "number" && data.downlink >= 0 ? data.downlink : null, status };
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics.validationCount = 0;
  _metrics.errorCount = 0;
  _metrics.lastValidationAt = null;
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { loggerAvailable: !!logger, noExcessiveErrors: _metrics.errorCount < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var validators_default = { validateConnectivity, validateAlerts, validateSync, validateHealth, validateErrors, validateEnvironment, validateScrolled, validateNetworkQuality, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  validateAlerts,
  validateConnectivity,
  validateEnvironment,
  validateErrors,
  validateHealth,
  validateNetworkQuality,
  validateScrolled,
  validateSync
};
