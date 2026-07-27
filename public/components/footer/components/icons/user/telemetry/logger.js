import { createTelemetryPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "footer-icon-user-logger";
const VERSION = "1.5.0-ENTERPRISE";
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
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
const _metrics = { info: 0, warn: 0, error: 0, debug: 0 };
function _log(level, args) {
  _metrics[level]++;
  const logger = _getPort("logger");
  if (logger && typeof logger[level] === "function") {
    logger[level](args.join(" "), { component: MODULE_ID });
  }
}
const Logger = { info(...args) {
  _log("info", Array.prototype.slice.call(args));
}, warn(...args) {
  _log("warn", Array.prototype.slice.call(args));
}, error(...args) {
  _log("error", Array.prototype.slice.call(args));
}, debug(...args) {
  _log("debug", Array.prototype.slice.call(args));
} };
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const loggerAvailable = !!_getPort("logger");
  return { status: loggerAvailable ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerAvailable, portsInitialized: ps._initialized }, metrics: getMetrics() };
}
var logger_default = { info: Logger.info, warn: Logger.warn, error: Logger.error, debug: Logger.debug, getMetrics, info2: info, healthCheck, MODULE_ID, VERSION };
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
