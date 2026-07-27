import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.3.0-P2-ENTERPRISE";
const MODULE_ID = "footer-logger";
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
let _metrics = { logs: 0, errors: 0, warns: 0 };
function log(level, moduleId, ...args) {
  _metrics.logs++;
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${moduleId}]`;
  if (level === "error") {
    _metrics.errors++;
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    _metrics.warns++;
    logger.warn?.(prefix, ...args);
    return;
  }
  if (_debug) logger.debug?.(prefix, ...args);
}
function setDebug(enabled) {
  _debug = Boolean(enabled);
}
function isDebugEnabled() {
  return _debug;
}
function createLogger(moduleId) {
  return { debug: (...args) => log("debug", moduleId, ...args), info: (...args) => log("info", moduleId, ...args), warn: (...args) => log("warn", moduleId, ...args), error: (...args) => log("error", moduleId, ...args) };
}
function getMetrics() {
  return { ..._metrics, debugEnabled: _debug };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort("logger");
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort("logger");
  const loggerAvailable = !!logger;
  return { status: loggerAvailable ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerAvailable, portsInitialized: portsSnapshot._initialized }, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized };
}
var logger_default = { log, setDebug, isDebugEnabled, createLogger, getMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createLogger,
  logger_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isDebugEnabled,
  log,
  setDebug
};
