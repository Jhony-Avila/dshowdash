import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.6.0-P17WI";
const MODULE_ID = "header-core-logger";
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
let _debug = false;
const _debugEnabled = () => _debug || _getPort("config")?.app?.debug || false;
const _metrics = { logCount: 0, errorCount: 0, warnCount: 0, mountCount: 0, lastLogAt: null };
const _integrationsStatus = { globalStateConnected: false, eventBusConnected: false, telemetryConnected: false, appShellConnected: false };
function log(level, ...args) {
  _metrics.logCount++;
  _metrics.lastLogAt = Date.now();
  if (level === "error") _metrics.errorCount++;
  if (level === "warn") _metrics.warnCount++;
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
  if (_debugEnabled()) {
    logger.debug?.(prefix, ...args);
  }
}
function isDebug() {
  return _debugEnabled();
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function setDebugMode(enabled) {
  _debug = !!enabled;
}
function updateIntegrationsStatus() {
  _integrationsStatus.globalStateConnected = !!_getPort("globalState");
  _integrationsStatus.eventBusConnected = !!_getPort("eventBus");
  _integrationsStatus.telemetryConnected = !!_getPort("telemetryCore");
  _integrationsStatus.appShellConnected = !!_getPort("appShell");
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics.logCount = 0;
  _metrics.errorCount = 0;
  _metrics.warnCount = 0;
  _metrics.mountCount = 0;
  _metrics.lastLogAt = null;
}
function resetIntegrations() {
  _integrationsStatus.globalStateConnected = false;
  _integrationsStatus.eventBusConnected = false;
  _integrationsStatus.telemetryConnected = false;
  _integrationsStatus.appShellConnected = false;
}
function getIntegrationsStatus() {
  updateIntegrationsStatus();
  return { ..._integrationsStatus };
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { loggerAvailable: !!logger, noExcessiveErrors: _metrics.errorCount < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  updateIntegrationsStatus();
  return { version: VERSION, moduleId: MODULE_ID, debug: _debugEnabled(), portsInitialized: Ports.isInitialized(), metrics: getMetrics(), integrations: { ..._integrationsStatus }, healthCheck: healthCheck() };
}
var logger_default = { log, isDebug, setDebug, setDebugMode, updateIntegrationsStatus, getMetrics, resetMetrics, resetIntegrations, getIntegrationsStatus, healthCheck, info, VERSION, MODULE_ID, _metrics, _integrationsStatus };
export {
  MODULE_ID,
  VERSION,
  _integrationsStatus,
  _metrics,
  logger_default as default,
  getIntegrationsStatus,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isDebug,
  log,
  resetIntegrations,
  resetMetrics,
  setDebug,
  setDebugMode,
  updateIntegrationsStatus
};
