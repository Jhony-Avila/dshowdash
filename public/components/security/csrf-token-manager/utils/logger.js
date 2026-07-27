import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.3.0-P17WI";
const MODULE_ID = "security.csrf-token-manager.utils.logger";
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
let _config = { debug: false, namespace: "CSRF" };
let _initialized = false;
function _debug() {
  if (_config.debug) return true;
  const cfg = _getPort("config");
  if (cfg && cfg.app && cfg.app.debug) return true;
  return false;
}
function _logGlobal(level, prefix, message, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn !== "function") return;
  if (data !== void 0 && data !== null) fn(prefix, message, data);
  else fn(prefix, message);
}
function initLogger(config = {}) {
  const securityConfig = config.security || {};
  _config = { debug: config.debug !== void 0 ? config.debug : securityConfig.csrfDebug !== void 0 ? securityConfig.csrfDebug : false, namespace: config.namespace || "CSRF" };
  _initialized = true;
}
function log() {
  if (_debug()) {
    const args = Array.prototype.slice.call(arguments);
    const prefix = `[${_config.namespace}]`;
    _logGlobal("info", prefix, args.join(" "));
  }
}
function logInfo(context, message, data) {
  if (_debug()) {
    const prefix = `[${_config.namespace}:${context}]`;
    _logGlobal("info", prefix, message, data);
  }
}
function warn() {
  const args = Array.prototype.slice.call(arguments);
  const prefix = `[${_config.namespace}]`;
  _logGlobal("warn", prefix, args.join(" "));
}
function logWarn(context, message, data) {
  const prefix = `[${_config.namespace}:${context}]`;
  _logGlobal("warn", prefix, message, data);
}
function error() {
  const args = Array.prototype.slice.call(arguments);
  const prefix = `[${_config.namespace}]`;
  _logGlobal("error", prefix, args.join(" "));
}
function logError(context, message, err) {
  const prefix = `[${_config.namespace}:${context}]`;
  _logGlobal("error", prefix, message, err);
}
function debug() {
  if (_debug()) {
    const args = Array.prototype.slice.call(arguments);
    const prefix = `[${_config.namespace}]`;
    _logGlobal("debug", prefix, args.join(" "));
  }
}
function healthCheck() {
  const checks = { available: true, initialized: _initialized, loggerReady: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, debugEnabled: _debug(), version: VERSION, moduleId: MODULE_ID, loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, debugEnabled: _debug(), namespace: _config.namespace, loggerReady: !!_getPort("logger"), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var logger_default = { initLogger, log, logInfo, warn, logWarn, error, logError, debug, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  debug,
  logger_default as default,
  error,
  getPorts,
  healthCheck,
  info,
  initLogger,
  injectPorts,
  log,
  logError,
  logInfo,
  logWarn,
  warn
};
